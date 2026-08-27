import "server-only";

import { createHash, randomUUID } from "node:crypto";

import type { Json } from "@/lib/supabase/database.types";
import type {
  BuyerCriterion,
  BuyerDecisionEnvelopeV1,
  BuyerDecisionEnvelopeV2,
  BuyerDecisionEnvelope,
  DecisionLedgerEvent,
  EvidenceAssertion,
  BuyerPropertySummary,
} from "@/lib/agent/buyer-contracts";
import { PublicCatalogRepository } from "@/lib/public-catalog-repository";
import { summarizeCatalogRestoration } from "@/lib/catalog-restoration";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordOperationalEvent } from "@/lib/operational-telemetry";
import { evidenceV2RendererEnabled, evidenceV2WriterEnabled } from "@/lib/rollout-server";
import { loadDemoSearch, readDemoSearchByConfirmation, saveDemoSearch } from "@/lib/demo-search-store";

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
  propertyIds: string[];
  reused: boolean;
};

function isPersistResult(value: unknown): value is PersistResult {
  return Boolean(value)
    && typeof value === "object"
    && typeof (value as PersistResult).conversationId === "string"
    && typeof (value as PersistResult).searchRunId === "string"
    && typeof (value as PersistResult).resultCount === "number"
    && Array.isArray((value as PersistResult).propertyIds)
    && (value as PersistResult).propertyIds.every((propertyId) => typeof propertyId === "string")
    && typeof (value as PersistResult).reused === "boolean";
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

function snapshotRecord(value: Json | undefined) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, Json | undefined> : null;
}

function contentHash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function propertyEvidence(searchRunId: string, property: BuyerPropertySummary, snapshotValue?: Json): EvidenceAssertion[] {
  const snapshot = snapshotRecord(snapshotValue);
  const fields = [
    ["price", "Price", property.price.amount, snapshot?.priceAed, "priceAed"],
    ["availability", "Availability", property.availabilityStatus, snapshot?.availability, "availability"],
    ["bedrooms", "Bedrooms", property.beds, snapshot?.beds, "beds"],
    ["bathrooms", "Bathrooms", property.baths, snapshot?.baths, "baths"],
    ["area", "Interior area (sq ft)", property.area.value, snapshot?.areaSqFt, "areaSqFt"],
  ] as const;
  const hash = contentHash(snapshot ?? {
    priceAed: property.price.amount,
    availability: property.availabilityStatus,
    beds: property.beds,
    baths: property.baths,
    areaSqFt: property.area.value,
    sourceName: property.provenance.sourceName,
    sourceObservedAt: property.provenance.observedAt,
    version: property.provenance.version,
  });
  return fields.map(([field, label, current, firstSeen, persistedField]) => {
    const asSeen = snapshot ? (typeof firstSeen === "string" || typeof firstSeen === "number" ? firstSeen : null) : current;
    const state = asSeen === null ? "unknown" as const : asSeen === current ? "source_confirmed" as const : "disputed" as const;
    return {
      id: `${searchRunId}:${property.id}:${persistedField}`,
      propertyId: property.id,
      field,
      label,
      value: current,
      state,
      sourceName: property.provenance.sourceName,
      observedAt: property.provenance.observedAt,
      asSeenValue: asSeen,
      currentValue: current,
      contentHash: hash,
      explanation: state === "disputed"
        ? "The current governed source differs from the immutable value first shown."
        : state === "unknown"
          ? "This value was not captured in the earlier snapshot."
          : "The current governed value matches the immutable value first shown.",
    };
  });
}

export function buildBuyerDecisionEnvelope(options: {
  correlationId: string;
  searchRunId: string;
  conversationId: string;
  brief: string;
  source: "text" | "voice";
  criteria: BuyerCriterion[];
  properties: BuyerPropertySummary[];
  snapshots?: Map<string, Json>;
  occurredAt?: string;
  ledgerEvents?: DecisionLedgerEvent[];
  renderEvidenceV2?: boolean;
}): BuyerDecisionEnvelope {
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
  const occurredAt = options.occurredAt ?? new Date().toISOString();
  const propertyAssertions = properties.flatMap((property) => propertyEvidence(options.searchRunId, property, options.snapshots?.get(property.id)));
  const criterionAssertions: EvidenceAssertion[] = options.criteria.map((criterion) => ({
    id: `brief:${criterion.key}:${contentHash(criterion.value).slice(0, 12)}`,
    propertyId: null,
    field: criterion.key,
    label: criterion.label,
    value: criterion.value,
    state: "buyer_confirmed",
    sourceName: "Buyer-confirmed brief",
    observedAt: occurredAt,
    asSeenValue: criterion.value,
    currentValue: criterion.value,
    contentHash: contentHash(criterion.value),
    explanation: "The buyer confirmed this criterion before Rama created the search run.",
  }));
  const assertions = [...criterionAssertions, ...propertyAssertions];
  const defaultEvents: DecisionLedgerEvent[] = [
    {
      id: `${options.searchRunId}:brief-confirmed`,
      type: "brief_confirmed" as const,
      occurredAt,
      summary: `Brief confirmed with ${options.criteria.length} visible criteria.`,
      assertionIds: criterionAssertions.map((assertion) => assertion.id),
    },
    ...properties.map((property) => ({
      id: `${options.searchRunId}:candidate-seen:${property.id}`,
      type: "candidate_seen" as const,
      occurredAt,
      summary: `${property.name} entered the shortlist with an immutable as-seen evidence snapshot.`,
      assertionIds: propertyAssertions.filter((assertion) => assertion.propertyId === property.id).map((assertion) => assertion.id),
    })),
  ];
  const events = options.ledgerEvents?.map((event) => event.type === "brief_confirmed" && event.assertionIds.length === 0
    ? { ...event, assertionIds: criterionAssertions.map((assertion) => assertion.id) }
    : event) ?? defaultEvents;
  const base: BuyerDecisionEnvelopeV1 = {
    schemaVersion: "1",
    correlationId: options.correlationId,
    searchRunId: options.searchRunId,
    conversationId: options.conversationId,
    status: properties.length ? "ready" : "empty",
    brief: { original: options.brief, normalized, criteria: options.criteria, source: options.source },
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
  if (options.renderEvidenceV2 === false) return base;
  return {
    ...base,
    schemaVersion: "2",
    evidence: { assertions },
    decisionLedger: { version: "1", events },
  } satisfies BuyerDecisionEnvelopeV2;
}

export async function discoverProperties(options: {
  brief: string;
  source: "text" | "voice";
  idempotencyKey: string;
  context: RequestContext;
}) {
  const startedAt = Date.now();
  ensureActive(options.context);
  if (process.env.RAMA_DEMO_MODE === "true") {
    const existing = readDemoSearchByConfirmation({
      buyerTokenHash: options.context.buyerTokenHash,
      idempotencyKey: options.idempotencyKey,
    });
    if (existing) return existing;
    const repository = new PublicCatalogRepository();
    const result = await repository.search(options.brief);
    ensureActive(options.context);
    const writeEvidenceV2 = evidenceV2WriterEnabled();
    const envelope = buildBuyerDecisionEnvelope({
      correlationId: options.context.correlationId,
      searchRunId: randomUUID(),
      conversationId: randomUUID(),
      brief: options.brief,
      source: options.source,
      criteria: result.criteria,
      properties: result.candidates.map((candidate) => candidate.property),
      renderEvidenceV2: evidenceV2RendererEnabled() && writeEvidenceV2,
    });
    const stored = saveDemoSearch({
      buyerTokenHash: options.context.buyerTokenHash,
      idempotencyKey: options.idempotencyKey,
      envelope,
    });
    recordOperationalEvent({
      event: "discovery.query",
      source: options.source,
      outcome: stored.entities.properties && Object.keys(stored.entities.properties).length ? "ready" : "empty",
      durationMs: Date.now() - startedAt,
      resultCount: Object.keys(stored.entities.properties).length,
    });
    return stored;
  }
  const repository = new PublicCatalogRepository();
  const result = await repository.search(options.brief);
  ensureActive(options.context);

  const admin = createAdminClient();
  const writeEvidenceV2 = evidenceV2WriterEnabled();
  const renderEvidenceV2 = evidenceV2RendererEnabled();
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
    p_write_evidence_v2: writeEvidenceV2,
    p_model: options.source === "voice" ? "gemini-3.1-flash-live-preview" : "deterministic-text",
    p_ttl_seconds: 60 * 60 * 24 * 30,
    p_idempotency_key: options.idempotencyKey,
  });
  if (error || !isPersistResult(data)) {
    console.error("Buyer search persistence failed:", error
      ? { code: error.code, message: error.message }
      : { code: "InvalidPersistenceResponse" });
    throw new PersistenceUnavailableError();
  }
  if (data.reused) {
    const restored = await loadBuyerDecisionEnvelope(data.searchRunId, options.context.buyerTokenHash);
    if (!restored) throw new PersistenceUnavailableError();
    return restored;
  }
  const persistedIds = new Set(data.propertyIds);
  const properties = result.candidates
    .filter((candidate) => persistedIds.has(candidate.property.id))
    .map((candidate) => candidate.property);
  const envelope = buildBuyerDecisionEnvelope({
    correlationId: options.context.correlationId,
    searchRunId: data.searchRunId,
    conversationId: data.conversationId,
    brief: options.brief,
    source: options.source,
    criteria: result.criteria,
    properties,
    renderEvidenceV2: renderEvidenceV2 && writeEvidenceV2,
  });
  recordOperationalEvent({
    event: "discovery.query",
    source: options.source,
    outcome: properties.length ? "ready" : "empty",
    durationMs: Date.now() - startedAt,
    resultCount: properties.length,
  });
  return envelope;
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
  if (process.env.RAMA_DEMO_MODE === "true") return loadDemoSearch(searchRunId, buyerTokenHash);
  const admin = createAdminClient();
  const { data: buyer } = await admin.from("buyer_sessions")
    .select("id")
    .eq("token_hash", buyerTokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!buyer) return null;
  const { data: run } = await admin.from("search_runs")
    .select("id,raw_brief,normalized_criteria,correlation_id,conversation_id,created_at,source")
    .eq("id", searchRunId)
    .eq("buyer_session_id", buyer.id)
    .maybeSingle();
  if (!run?.conversation_id) return null;
  const renderEvidenceV2 = evidenceV2RendererEnabled();
  const [candidateResult, ledgerResult] = await Promise.all([
    admin.from("search_candidates")
      .select("property_id,rank,reasons,property_version,source_observed_at,fact_snapshot")
      .eq("search_run_id", run.id)
      .order("rank", { ascending: true }),
    renderEvidenceV2
      ? admin.rpc("read_buyer_ledger_events", {
        p_token_hash: buyerTokenHash,
        p_search_run_id: searchRunId,
      })
      : Promise.resolve({ data: [], error: null }),
  ]);
  const { data: candidates, error } = candidateResult;
  const { data: durableLedger, error: ledgerError } = ledgerResult;
  if (error) throw new PersistenceUnavailableError();
  if (ledgerError) throw new PersistenceUnavailableError();
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
  const snapshots = new Map((candidates ?? []).map((candidate) => [candidate.property_id, candidate.fact_snapshot]));
  const ledgerEvents: DecisionLedgerEvent[] = (durableLedger ?? []).flatMap((event) => {
    if (!["brief_confirmed", "candidate_seen", "criterion_revised", "candidate_dismissed", "open_question"].includes(event.event_type)) return [];
    const payload = snapshotRecord(event.payload);
    const assertionIds = Array.isArray(payload?.assertionKeys)
      ? payload.assertionKeys.filter((item): item is string => typeof item === "string")
      : [];
    return [{
      id: event.id,
      type: event.event_type as DecisionLedgerEvent["type"],
      occurredAt: event.occurred_at,
      summary: event.summary,
      assertionIds,
    }];
  });
  const envelope = buildBuyerDecisionEnvelope({
    correlationId: run.correlation_id,
    searchRunId: run.id,
    conversationId: run.conversation_id,
    brief: run.raw_brief,
    source: run.source === "voice" ? "voice" : "text",
    criteria: parseCriteria(run.normalized_criteria),
    properties,
    snapshots,
    occurredAt: run.created_at,
    ledgerEvents: ledgerEvents.length ? ledgerEvents : undefined,
    renderEvidenceV2: renderEvidenceV2 && ledgerEvents.length > 0,
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
