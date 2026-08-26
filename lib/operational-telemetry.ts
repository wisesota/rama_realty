import "server-only";

import { posthogServer } from "@/lib/telemetry-server";

type DurationBucket = "under_500ms" | "500_1500ms" | "1500_3000ms" | "over_3000ms";
type ResultCountBucket = "0" | "1" | "2_5" | "6_plus";

export type OperationalEvent =
  | {
      event: "voice.recorded_turn";
      outcome: "ok" | "timeout" | "provider_error" | "invalid_response";
      durationMs: number;
    }
  | {
      event: "discovery.query";
      source: "text" | "voice";
      outcome: "ready" | "empty";
      durationMs: number;
      resultCount: number;
    };

function durationBucket(durationMs: number): DurationBucket {
  if (durationMs < 500) return "under_500ms";
  if (durationMs < 1_500) return "500_1500ms";
  if (durationMs < 3_000) return "1500_3000ms";
  return "over_3000ms";
}

function countBucket(resultCount: number): ResultCountBucket {
  if (resultCount <= 0) return "0";
  if (resultCount === 1) return "1";
  if (resultCount <= 5) return "2_5";
  return "6_plus";
}

export function operationalEventProperties(event: OperationalEvent) {
  if (event.event === "voice.recorded_turn") {
    return {
      schema_version: "1",
      outcome: event.outcome,
      duration_bucket: durationBucket(event.durationMs),
      $process_person_profile: false,
    };
  }

  return {
    schema_version: "1",
    source: event.source,
    outcome: event.outcome,
    duration_bucket: durationBucket(event.durationMs),
    result_count_bucket: countBucket(event.resultCount),
    $process_person_profile: false,
  };
}

/**
 * Aggregate service-health telemetry only. No buyer/session/property identifier,
 * raw content, exact duration, contact field, prompt, transcript, or response is
 * accepted by the event type or emitted in the envelope.
 */
export function recordOperationalEvent(event: OperationalEvent) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;
  try {
    posthogServer.capture({
      distinctId: "rama-service",
      event: event.event,
      properties: operationalEventProperties(event),
    });
  } catch {
    // Observability must never block a buyer turn or discovery result.
  }
}
