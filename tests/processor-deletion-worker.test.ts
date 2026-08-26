import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import {
  processProcessorDeletionBatch,
  ProcessorDeletionRetryError,
} from "@/lib/processor-deletion-worker";

const claimed = {
  id: 11,
  request_id: "11111111-1111-4111-8111-111111111111",
  destination: "licensed-crm",
  resource_type: "inquiry",
  resource_reference: "22222222-2222-4222-8222-222222222222",
  processor_record_id: null,
  attempt_count: 1,
  lease_token: "33333333-3333-4333-8333-333333333333",
  lease_expires_at: "2026-08-22T15:30:00.000Z",
};

describe("processor deletion worker", () => {
  beforeEach(() => vi.clearAllMocks());

  it("claims leased work, calls only the matching adapter, and records terminal delivery", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "claim_processor_deletion_jobs") return { data: [claimed], error: null };
      if (name === "complete_processor_deletion_job") return { data: true, error: null };
      return { data: null, error: { code: "unexpected" } };
    });
    mocks.createAdminClient.mockReturnValue({ rpc });
    const deleteResource = vi.fn().mockResolvedValue({
      outcome: "delivered",
      processorRecordId: "crm-record-42",
    });

    await expect(processProcessorDeletionBatch({
      workerId: "privacy-worker-1",
      adapters: [{ destination: "licensed-crm", deleteResource }],
    })).resolves.toEqual({ claimed: 1, delivered: 1, notRequired: 0, failed: 0 });
    expect(deleteResource).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceReference: "22222222-2222-4222-8222-222222222222",
        destination: "licensed-crm",
        leaseToken: "33333333-3333-4333-8333-333333333333",
      }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(rpc).toHaveBeenCalledWith("complete_processor_deletion_job", {
      p_job_id: 11,
      p_worker_id: "privacy-worker-1",
      p_lease_token: "33333333-3333-4333-8333-333333333333",
      p_outcome: "delivered",
      p_processor_record_id: "crm-record-42",
    });
  });

  it("fails closed with a bounded retry when no approved destination adapter exists", async () => {
    const rpc = vi.fn(async (name: string, args: Record<string, unknown>) => {
      if (name === "claim_processor_deletion_jobs") return { data: [claimed], error: null };
      if (name === "fail_processor_deletion_job") {
        expect(args).toMatchObject({
          p_job_id: 11,
          p_lease_token: "33333333-3333-4333-8333-333333333333",
          p_error_code: "adapter_unavailable",
          p_retry_delay_seconds: 3_600,
        });
        return { data: true, error: null };
      }
      return { data: null, error: { code: "unexpected" } };
    });
    mocks.createAdminClient.mockReturnValue({ rpc });

    await expect(processProcessorDeletionBatch({
      workerId: "privacy-worker-1",
      adapters: [],
    })).resolves.toEqual({ claimed: 1, delivered: 0, notRequired: 0, failed: 1 });
  });

  it("stores only an allowlisted error code and bounded retry delay", () => {
    const retry = new ProcessorDeletionRetryError("provider timed out: buyer@example.com", 1);
    expect(retry.code).toBe("processor_error");
    expect(retry.retryDelaySeconds).toBe(60);
  });

  it("rejects malformed claim responses before an adapter sees them", async () => {
    mocks.createAdminClient.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({ data: [{ ...claimed, resource_reference: null }], error: null }),
    });
    const deleteResource = vi.fn();

    await expect(processProcessorDeletionBatch({
      workerId: "privacy-worker-1",
      adapters: [{ destination: "licensed-crm", deleteResource }],
    })).rejects.toThrow("could not be claimed safely");
    expect(deleteResource).not.toHaveBeenCalled();
  });

  it("rejects unbounded adapter output before it reaches a terminal RPC", async () => {
    const rpc = vi.fn(async (name: string) => {
      if (name === "claim_processor_deletion_jobs") return { data: [claimed], error: null };
      if (name === "fail_processor_deletion_job") return { data: true, error: null };
      return { data: null, error: { code: "unexpected" } };
    });
    mocks.createAdminClient.mockReturnValue({ rpc });

    await expect(processProcessorDeletionBatch({
      workerId: "privacy-worker-1",
      adapters: [{
        destination: "licensed-crm",
        deleteResource: vi.fn().mockResolvedValue({
          outcome: "delivered",
          processorRecordId: "x".repeat(257),
        }),
      }],
    })).resolves.toEqual({ claimed: 1, delivered: 0, notRequired: 0, failed: 1 });
    expect(rpc).not.toHaveBeenCalledWith("complete_processor_deletion_job", expect.anything());
  });
});
