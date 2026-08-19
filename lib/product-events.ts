export type ProductEvent =
  | {
      event: "room.search_outcome";
      searchRunId: string;
      outcome: "needs_clarification" | "ready" | "partial" | "empty";
      criterionCategories: CriterionCategory[];
      criterionCount: number;
      resultCount: number;
      timestamp: string;
    }
  | {
      event: "landing.brief_submit";
      searchRunId: string;
      source: "text" | "voice";
      timestamp: string;
    }
  | {
      event: "room.property_expand";
      searchRunId: string;
      propertyId: string;
      sourceVersion: string;
      fromView: "lead" | "shortlist";
      timestamp: string;
    }
  | {
      event: "room.tool_request";
      searchRunId: string;
      propertyId: string;
      sourceVersion: string;
      tool: string;
      timestamp: string;
    }
  | {
      event: "room.handoff_submit";
      searchRunId: string;
      propertyId: string;
      sourceVersion: string;
      timestamp: string;
    };

export type CriterionCategory =
  | "location"
  | "bedrooms"
  | "budget"
  | "property_type"
  | "lifestyle"
  | "flexible";

const allowedCriterionCategories: CriterionCategory[] = [
  "location", "bedrooms", "budget", "property_type", "lifestyle", "flexible",
];

export function criterionCategoriesFromKeys(keys: string[]): CriterionCategory[] {
  const categories = keys.flatMap((key): CriterionCategory[] => {
    if (key === "location") return ["location"];
    if (key === "bedrooms") return ["bedrooms"];
    if (key === "budget") return ["budget"];
    if (key === "property-type") return ["property_type"];
    if (key === "flexible") return ["flexible"];
    if (key.startsWith("lifestyle-")) return ["lifestyle"];
    return [];
  });
  return [...new Set(categories)];
}

/**
 * Temporary, consent-safe funnel instrumentation.
 *
 * Events are intentionally limited to development console output until an
 * approved analytics consent contract and adapter exist. Never add raw briefs,
 * transcripts, contact details, or other buyer-provided text to this payload.
 */
export function emitProductEvent(event: ProductEvent) {
  if (process.env.NODE_ENV !== "development") return;

  if (event.event === "landing.brief_submit") {
    console.info("[rama.product-event]", {
      event: event.event,
      searchRunId: event.searchRunId,
      source: event.source,
      timestamp: event.timestamp,
    });
    return;
  }

  if (event.event === "room.property_expand") {
    console.info("[rama.product-event]", {
      event: event.event,
      searchRunId: event.searchRunId,
      propertyId: event.propertyId,
      sourceVersion: event.sourceVersion,
      fromView: event.fromView,
      timestamp: event.timestamp,
    });
    return;
  }

  if (event.event === "room.search_outcome") {
    console.info("[rama.product-event]", {
      event: event.event,
      searchRunId: event.searchRunId,
      outcome: event.outcome,
      criterionCategories: [...new Set(event.criterionCategories.filter((category) => allowedCriterionCategories.includes(category)))],
      criterionCount: event.criterionCount,
      resultCount: event.resultCount,
      timestamp: event.timestamp,
    });
    return;
  }

  if (event.event === "room.tool_request") {
    console.info("[rama.product-event]", {
      event: event.event,
      searchRunId: event.searchRunId,
      propertyId: event.propertyId,
      sourceVersion: event.sourceVersion,
      tool: event.tool,
      timestamp: event.timestamp,
    });
    return;
  }

  console.info("[rama.product-event]", {
    event: event.event,
    searchRunId: event.searchRunId,
    propertyId: event.propertyId,
    sourceVersion: event.sourceVersion,
    timestamp: event.timestamp,
  });
}
