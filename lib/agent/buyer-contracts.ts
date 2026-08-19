export type BuyerCriterion = {
  key: string;
  label: string;
  value: string;
  kind: "hard" | "preference";
};

export type PropertyProvenance = {
  kind: "published" | "illustrative";
  sourceName: string;
  observedAt: string | null;
  publishedAt: string | null;
  version: number;
};

export type BuyerPropertySummary = {
  id: string;
  organizationId: string | null;
  developmentId: string | null;
  slug: string | null;
  name: string;
  location: string;
  description: string | null;
  propertyType: string;
  completionStatus: string;
  availabilityStatus: string;
  price: { amount: number; currency: "AED" };
  beds: number;
  baths: number;
  area: { value: number; unit: "sq_ft" };
  feature: string;
  matchReason: string;
  image: { url: string; alt: string };
  amenities: string[];
  views: string[];
  furnishingStatus: string | null;
  tenure: string | null;
  handoverAt: string | null;
  serviceChargeAed: number | null;
  provenance: PropertyProvenance;
};

export type BuyerDecisionBlock =
  | { type: "brief_summary"; text: string; criteria: BuyerCriterion[] }
  | { type: "lead_property"; propertyId: string; reason: string }
  | { type: "shortlist_index"; propertyIds: string[] }
  | { type: "clarification"; question: string; missingFields: string[] }
  | { type: "no_results"; title: string; suggestions: string[] }
  | { type: "recoverable_error"; title: string; message: string; retryable: boolean };

export type BuyerDecisionEnvelopeV1 = {
  schemaVersion: "1";
  correlationId: string;
  searchRunId: string;
  conversationId: string;
  status: "needs_clarification" | "ready" | "partial" | "empty";
  brief: {
    original: string;
    normalized: string;
    criteria: BuyerCriterion[];
  };
  entities: {
    properties: Record<string, BuyerPropertySummary>;
  };
  blocks: BuyerDecisionBlock[];
  sourceSummary: {
    publishedCount: number;
    illustrativeCount: number;
    staleCount: number;
    label: string;
  };
  suggestedActions: Array<{
    id: "inspect" | "compare" | "payment" | "floor_plan" | "documents" | "scenario" | "handoff" | "refine";
    label: string;
    propertyId?: string;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isBuyerPropertySummary(value: unknown): value is BuyerPropertySummary {
  if (!isRecord(value) || !isRecord(value.price) || !isRecord(value.area) || !isRecord(value.image) || !isRecord(value.provenance)) return false;
  return typeof value.id === "string"
    && (value.organizationId === null || typeof value.organizationId === "string")
    && (value.developmentId === null || typeof value.developmentId === "string")
    && (value.slug === null || typeof value.slug === "string")
    && typeof value.name === "string"
    && typeof value.location === "string"
    && (value.description === null || typeof value.description === "string")
    && typeof value.propertyType === "string"
    && typeof value.completionStatus === "string"
    && typeof value.availabilityStatus === "string"
    && typeof value.price.amount === "number" && Number.isFinite(value.price.amount)
    && value.price.currency === "AED"
    && typeof value.beds === "number"
    && typeof value.baths === "number"
    && typeof value.area.value === "number" && value.area.unit === "sq_ft"
    && typeof value.feature === "string"
    && typeof value.matchReason === "string"
    && typeof value.image.url === "string" && typeof value.image.alt === "string"
    && isStringArray(value.amenities)
    && isStringArray(value.views)
    && (value.furnishingStatus === null || typeof value.furnishingStatus === "string")
    && (value.tenure === null || typeof value.tenure === "string")
    && (value.handoverAt === null || typeof value.handoverAt === "string")
    && (value.serviceChargeAed === null || typeof value.serviceChargeAed === "number")
    && (value.provenance.kind === "published" || value.provenance.kind === "illustrative")
    && typeof value.provenance.sourceName === "string"
    && (value.provenance.observedAt === null || typeof value.provenance.observedAt === "string")
    && (value.provenance.publishedAt === null || typeof value.provenance.publishedAt === "string")
    && typeof value.provenance.version === "number";
}

export function isBuyerDecisionEnvelope(value: unknown): value is BuyerDecisionEnvelopeV1 {
  if (!isRecord(value) || value.schemaVersion !== "1" || !isRecord(value.brief) || !isRecord(value.entities) || !isRecord(value.sourceSummary)) return false;
  if (typeof value.correlationId !== "string" || typeof value.searchRunId !== "string" || typeof value.conversationId !== "string") return false;
  if (!(["needs_clarification", "ready", "partial", "empty"] as unknown[]).includes(value.status)) return false;
  if (typeof value.brief.original !== "string" || typeof value.brief.normalized !== "string" || !Array.isArray(value.brief.criteria)) return false;
  if (!value.brief.criteria.every((criterion) => isRecord(criterion)
    && typeof criterion.key === "string"
    && typeof criterion.label === "string"
    && typeof criterion.value === "string"
    && (criterion.kind === "hard" || criterion.kind === "preference"))) return false;
  const properties = value.entities.properties;
  if (!isRecord(properties) || !Object.entries(properties).every(([id, property]) => isBuyerPropertySummary(property) && property.id === id)) return false;
  if (!Array.isArray(value.blocks) || !value.blocks.every((block) => {
    if (!isRecord(block) || typeof block.type !== "string") return false;
    if (block.type === "brief_summary") return typeof block.text === "string" && Array.isArray(block.criteria);
    if (block.type === "lead_property") return typeof block.propertyId === "string" && typeof block.reason === "string";
    if (block.type === "shortlist_index") return isStringArray(block.propertyIds);
    if (block.type === "clarification") return typeof block.question === "string" && isStringArray(block.missingFields);
    if (block.type === "no_results") return typeof block.title === "string" && isStringArray(block.suggestions);
    if (block.type === "recoverable_error") return typeof block.title === "string" && typeof block.message === "string" && typeof block.retryable === "boolean";
    return false;
  })) return false;
  const actions = ["inspect", "compare", "payment", "floor_plan", "documents", "scenario", "handoff", "refine"];
  if (!Array.isArray(value.suggestedActions) || !value.suggestedActions.every((action) => isRecord(action)
    && typeof action.id === "string" && actions.includes(action.id)
    && typeof action.label === "string"
    && (action.propertyId === undefined || typeof action.propertyId === "string"))) return false;
  return [value.sourceSummary.publishedCount, value.sourceSummary.illustrativeCount, value.sourceSummary.staleCount]
    .every((count) => typeof count === "number" && Number.isFinite(count) && count >= 0)
    && typeof value.sourceSummary.label === "string";
}
