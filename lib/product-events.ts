export type ProductEvent =
  | {
      event: "voice.lifecycle";
      state: "requesting" | "connecting" | "listening" | "thinking" | "speaking" | "complete" | "error" | "idle";
      mode: "live" | "recorded" | "unknown";
      locale: "en" | "ar";
      elapsed: "lt_1s" | "1_3s" | "3_10s" | "10_30s" | "30_120s" | "gte_120s";
      timestamp: string;
    }
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
  if (event.event === "voice.lifecycle") {
    if (typeof window !== "undefined") {
      // Do not initialize analytics or emit an event before the buyer opts in.
      if (window.localStorage.getItem("rama_cookie_consent") !== "accepted") {
        if (process.env.NODE_ENV === "development") console.info("[rama.product-event]", event);
        return;
      }
      void import("posthog-js").then(({ default: posthog }) => {
        if (!posthog.__loaded || !posthog.has_opted_in_capturing()) return;
        posthog.capture("rama_voice_lifecycle", {
          state: event.state,
          mode: event.mode,
          locale: event.locale,
          elapsed: event.elapsed,
          $process_person_profile: false,
        });
      });
    }
    if (process.env.NODE_ENV === "development") console.info("[rama.product-event]", event);
    return;
  }
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

export function elapsedBucket(durationMs: number): Extract<ProductEvent, { event: "voice.lifecycle" }>["elapsed"] {
  if (durationMs < 1_000) return "lt_1s";
  if (durationMs < 3_000) return "1_3s";
  if (durationMs < 10_000) return "3_10s";
  if (durationMs < 30_000) return "10_30s";
  if (durationMs < 120_000) return "30_120s";
  return "gte_120s";
}
