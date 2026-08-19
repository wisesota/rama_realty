import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import type {
  BuyerCriterion,
  BuyerDecisionEnvelopeV1,
  BuyerPropertySummary,
} from "@/lib/agent/buyer-contracts";
import { PublicCatalogRepository } from "@/lib/public-catalog-repository";
import { summarizeCatalogRestoration } from "@/lib/catalog-restoration";
import { createAdminClient } from "@/lib/supabase/admin";

export type RequestContext = {
  correlationId: string;
  buyerTokenHash: string;
  deadline: number;
  signal?: AbortSignal;
};

export class PersistenceUnavailableError extends Error {
  constructor() {
    super("The result could not be saved for restoration.");
    this.name = "PersistenceUnavailableError";
  }
}

function ensureActive(context: RequestContext) {
  if (context.signal?.aborted || Date.now() >= context.deadline) {
    throw new DOMException("Discovery deadline exceeded", "AbortError");
  }
}

type PersistResult = {
  buyerSessionId: string;
  conversationId: string;
  searchRunId: string;
  resultCount: number;
};

function isPersistResult(value: unknown): value is PersistResult {
  return Boolean(value)
    && typeof value === "object"
    && typeof (value as PersistResult).conversationId === "string"
    && typeof (value as PersistResult).searchRunId === "string"
    && typeof (value as PersistResult).resultCount === "number";
}

function sourceSummary(properties: BuyerPropertySummary[]) {
  const publishedCount = properties.filter((property) => property.provenance.kind === "published").length;
  const illustrativeCount = properties.length - publishedCount;
  const label = publishedCount && illustrativeCount
    ? `${publishedCount} published · ${illustrativeCount} illustrative`
    : publishedCount
      ? `${publishedCount} governed ${publishedCount === 1 ? "residence" : "residences"}`
      : `${illustrativeCount} illustrative ${illustrativeCount === 1 ? "residence" : "residences"}`;
  return { publishedCount, illustrativeCount, staleCount: 0, label };
}

function makeEnvelope(options: {
  correlationId: string;
  searchRunId: string;
  conversationId: string;
  brief: string;
  criteria: BuyerCriterion[];
  properties: BuyerPropertySummary[];
}): BuyerDecisionEnvelopeV1 {
  const { properties } = options;
  const normalized = options.criteria.map((criterion) => criterion.value).join(" · ") || options.brief;
  const entities = Object.fromEntries(properties.map((property) => [property.id, property]));
  const lead = properties[0];
  const blocks: BuyerDecisionEnvelopeV1["blocks"] = [
    { type: "brief_summary", text: `You want ${normalized}.`, criteria: options.criteria },
    ...(lead ? [{ type: "lead_property" as const, propertyId: lead.id, reason: lead.matchReason }] : []),
    ...(properties.length ? [{ type: "shortlist_index" as const, propertyIds: properties.map((property) => property.id) }] : []),
    ...(!properties.length ? [{ type: "no_results" as const, title: "No exact residence yet", suggestions: ["Increase the maximum budget", "Review a nearby community", "Relax one lifestyle preference"] }] : []),
  ];
  return {
    schemaVersion: "1",
    correlationId: options.correlationId,
    searchRunId: options.searchRunId,
    conversationId: options.conversationId,
    status: properties.length ? "ready" : "empty",
    brief: { original: options.brief, normalized, criteria: options.criteria },
    entities: { properties: entities },
    blocks,
    sourceSummary: sourceSummary(properties),
    suggestedActions: lead
      ? [
          { id: "inspect", label: "Review the strongest match", propertyId: lead.id },
          ...(properties.length > 1 ? [{ id: "compare" as const, label: "Compare residences" }] : []),
          { id: "payment", label: "View payment schedule", propertyId: lead.id },
          { id: "floor_plan", label: "Open floor plans", propertyId: lead.id },
          { id: "documents", label: "Review documents", propertyId: lead.id },
          { id: "scenario", label: "Test a purchase scenario", propertyId: lead.id },
          ...(lead.organizationId ? [{ id: "handoff" as const, label: "Ask a Rama advisor", propertyId: lead.id }] : []),
        ]
      : [{ id: "refine", label: "Refine one criterion" }],
  };
}

export async function discoverProperties(options: {
  brief: string;
  source: "text" | "voice";
  context: RequestContext;
}) {
  ensureActive(options.context);
  const repository = new PublicCatalogRepository();
  const result = await repository.search(options.brief);
  ensureActive(options.context);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("persist_buyer_search", {
    p_token_hash: options.context.buyerTokenHash,
    p_source: options.source,
    p_raw_brief: options.brief,
    p_normalized_criteria: result.criteria as unknown as Json,
    p_candidates: result.candidates.map((candidate) => ({
      propertyId: candidate.property.id,
      score: candidate.score,
      reasons: candidate.reasons,
    })) as unknown as Json,
    p_correlation_id: options.context.correlationId,
    p_model: options.source === "voice" ? "gemini-3.1-flash-live-preview" : "deterministic-text",
    p_ttl_seconds: 60 * 60 * 24 * 30,
  });
  if (error || !isPersistResult(data)) throw new PersistenceUnavailableError();
  const persistedIds = result.candidates.slice(0, data.resultCount).map((candidate) => candidate.property.id);
  const properties = result.candidates
    .filter((candidate) => persistedIds.includes(candidate.property.id))
    .map((candidate) => candidate.property);
  return makeEnvelope({
    correlationId: options.context.correlationId,
    searchRunId: data.searchRunId,
    conversationId: data.conversationId,
    brief: options.brief,
    criteria: result.criteria,
    properties,
  });
}

function parseCriteria(value: Json): BuyerCriterion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const candidate = item as Record<string, Json | undefined>;
    if (typeof candidate.key !== "string" || typeof candidate.label !== "string" || typeof candidate.value !== "string") return [];
    if (candidate.kind !== "hard" && candidate.kind !== "preference") return [];
    return [{ key: candidate.key, label: candidate.label, value: candidate.value, kind: candidate.kind }];
  });
}

export async function loadBuyerDecisionEnvelope(searchRunId: string, buyerTokenHash: string) {
  const admin = createAdminClient();
  const { data: buyer } = await admin.from("buyer_sessions")
    .select("id")
    .eq("token_hash", buyerTokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!buyer) return null;
  const { data: run } = await admin.from("search_runs")
    .select("id,raw_brief,normalized_criteria,correlation_id,conversation_id")
    .eq("id", searchRunId)
    .eq("buyer_session_id", buyer.id)
    .maybeSingle();
  if (!run?.conversation_id) return null;
  const { data: candidates, error } = await admin.from("search_candidates")
    .select("property_id,rank,reasons,property_version,source_observed_at,fact_snapshot")
    .eq("search_run_id", run.id)
    .order("rank", { ascending: true });
  if (error) throw new PersistenceUnavailableError();
  const repository = new PublicCatalogRepository();
  const current = await repository.getProperties((candidates ?? []).map((candidate) => candidate.property_id));
  const restoration = summarizeCatalogRestoration(
    (candidates ?? []).map((candidate) => ({
      propertyId: candidate.property_id,
      propertyVersion: candidate.property_version ?? 0,
      sourceObservedAt: candidate.source_observed_at,
    })),
    current,
  );
  const currentById = new Map(current.map((property) => [property.id, property]));
  const properties = (candidates ?? []).flatMap((candidate) => {
    const property = currentById.get(candidate.property_id);
    if (!property) return [];
    return [{ ...property, matchReason: candidate.reasons[0] ?? property.matchReason }];
  });
  const envelope = makeEnvelope({
    correlationId: run.correlation_id,
    searchRunId: run.id,
    conversationId: run.conversation_id,
    brief: run.raw_brief,
    criteria: parseCriteria(run.normalized_criteria),
    properties,
  });
  if (restoration.removedCount > 0) {
    envelope.status = properties.length ? "partial" : "empty";
    envelope.blocks.push({ type: "recoverable_error", title: "Catalog changed", message: "One or more earlier matches are no longer publicly available.", retryable: false });
  }
  if (restoration.changedCount > 0) {
    envelope.blocks.push({ type: "recoverable_error", title: "Facts refreshed", message: "Rama refreshed one or more property facts since this shortlist was created. Current governed facts are shown.", retryable: false });
  }
  return envelope;
}
