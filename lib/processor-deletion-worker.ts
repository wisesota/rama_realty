import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type ProcessorDeletionJob = {
  id: number;
  requestId: string;
  destination: string;
  resourceType: "inquiry";
  resourceReference: string;
  processorRecordId: string | null;
  attemptCount: number;
  leaseToken: string;
  leaseExpiresAt: string;
};

export type ProcessorDeletionOutcome = {
  outcome: "delivered" | "not_required";
  processorRecordId?: string | null;
};

export type ProcessorDeletionAdapter = {
  destination: string;
  deleteResource: (
    job: ProcessorDeletionJob,
    context: { signal: AbortSignal },
  ) => Promise<ProcessorDeletionOutcome>;
};

export class ProcessorDeletionRetryError extends Error {
  readonly code: string;
  readonly retryDelaySeconds: number;

  constructor(code: string, retryDelaySeconds = 300) {
    super(code);
    this.name = "ProcessorDeletionRetryError";
    this.code = /^[a-z0-9_]{2,80}$/.test(code) ? code : "processor_error";
    this.retryDelaySeconds = Math.min(86_400, Math.max(60, retryDelaySeconds));
  }
}

function isClaimedJob(value: unknown): value is {
  id: number;
  request_id: string;
  destination: string;
  resource_type: string;
  resource_reference: string;
  processor_record_id: string | null;
  attempt_count: number;
  lease_token: string;
  lease_expires_at: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const job = value as Record<string, unknown>;
  return typeof job.id === "number"
    && typeof job.request_id === "string"
    && typeof job.destination === "string"
    && job.resource_type === "inquiry"
    && typeof job.resource_reference === "string"
    && (job.processor_record_id === null || typeof job.processor_record_id === "string")
    && typeof job.attempt_count === "number"
    && typeof job.lease_token === "string"
    && /^[a-f0-9-]{36}$/i.test(job.lease_token)
    && typeof job.lease_expires_at === "string";
}

function normalizeJob(job: Parameters<typeof isClaimedJob>[0] & Record<string, unknown>): ProcessorDeletionJob {
  return {
    id: job.id as number,
    requestId: job.request_id as string,
    destination: job.destination as string,
    resourceType: "inquiry",
    resourceReference: job.resource_reference as string,
    processorRecordId: job.processor_record_id as string | null,
    attemptCount: job.attempt_count as number,
    leaseToken: job.lease_token as string,
    leaseExpiresAt: job.lease_expires_at as string,
  };
}

function isProcessorOutcome(value: unknown): value is ProcessorDeletionOutcome {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const outcome = value as Record<string, unknown>;
  return (outcome.outcome === "delivered" || outcome.outcome === "not_required")
    && (outcome.processorRecordId === undefined
      || outcome.processorRecordId === null
      || (typeof outcome.processorRecordId === "string"
        && outcome.processorRecordId.trim().length >= 1
        && outcome.processorRecordId.trim().length <= 256));
}

export async function processProcessorDeletionBatch(options: {
  workerId: string;
  adapters: ProcessorDeletionAdapter[];
  limit?: number;
  leaseSeconds?: number;
  adapterTimeoutMs?: number;
}) {
  const workerId = options.workerId.trim();
  if (workerId.length < 2 || workerId.length > 160) throw new Error("A bounded processor worker ID is required.");
  const limit = options.limit ?? 20;
  const leaseSeconds = options.leaseSeconds ?? 300;
  const adapterTimeoutMs = options.adapterTimeoutMs ?? Math.min(30_000, leaseSeconds * 1_000 - 1_000);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new Error("Processor batch size must be between 1 and 20.");
  if (!Number.isInteger(leaseSeconds) || leaseSeconds < 60 || leaseSeconds > 3_600) throw new Error("Processor lease must be between 60 and 3600 seconds.");
  if (!Number.isInteger(adapterTimeoutMs) || adapterTimeoutMs < 1_000 || adapterTimeoutMs >= leaseSeconds * 1_000) {
    throw new Error("Processor adapter timeout must be shorter than its lease.");
  }
  const adapters = new Map(options.adapters.map((adapter) => [adapter.destination, adapter]));
  if (adapters.size !== options.adapters.length) throw new Error("Processor destinations must be unique.");
  if (options.adapters.some((adapter) => adapter.destination.trim() !== adapter.destination
    || adapter.destination.length < 2 || adapter.destination.length > 160)) {
    throw new Error("Processor destinations must use their exact bounded registry key.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_processor_deletion_jobs", {
    p_worker_id: workerId,
    p_limit: limit,
    p_lease_seconds: leaseSeconds,
  });
  if (error || !Array.isArray(data) || !data.every(isClaimedJob)) {
    throw new Error("Processor deletion jobs could not be claimed safely.");
  }

  const outcomes = await Promise.all(data.map(async (rawJob) => {
    const job = normalizeJob(rawJob);
    const adapter = adapters.get(job.destination);
    try {
      if (!adapter) throw new ProcessorDeletionRetryError("adapter_unavailable", 3_600);
      const controller = new AbortController();
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          adapter.deleteResource(job, { signal: controller.signal }),
          new Promise<never>((_, reject) => {
            timeout = setTimeout(() => {
              controller.abort();
              reject(new ProcessorDeletionRetryError("processor_timeout"));
            }, adapterTimeoutMs);
          }),
        ]);
        if (!isProcessorOutcome(result)) throw new ProcessorDeletionRetryError("invalid_processor_result");
        const { data: completed, error: completionError } = await admin.rpc("complete_processor_deletion_job", {
          p_job_id: job.id,
          p_worker_id: workerId,
          p_lease_token: job.leaseToken,
          p_outcome: result.outcome,
          p_processor_record_id: result.processorRecordId?.trim() ?? null,
        });
        if (completionError || completed !== true) throw new ProcessorDeletionRetryError("completion_write_failed");
        return result.outcome;
      } finally {
        if (timeout) clearTimeout(timeout);
      }
    } catch (error) {
      const retry = error instanceof ProcessorDeletionRetryError
        ? error
        : new ProcessorDeletionRetryError("processor_error");
      const { data: failed, error: failureError } = await admin.rpc("fail_processor_deletion_job", {
        p_job_id: job.id,
        p_worker_id: workerId,
        p_lease_token: job.leaseToken,
        p_error_code: retry.code,
        p_retry_delay_seconds: retry.retryDelaySeconds,
      });
      if (failureError || failed !== true) {
        throw new Error("Processor deletion failure state could not be persisted.");
      }
      return "failed" as const;
    }
  }));

  return outcomes.reduce((counts, outcome) => {
    if (outcome === "delivered") counts.delivered += 1;
    else if (outcome === "not_required") counts.notRequired += 1;
    else counts.failed += 1;
    return counts;
  }, { claimed: data.length, delivered: 0, notRequired: 0, failed: 0 });
}
