import { describe, expect, it } from "vitest";
import { operationalEventProperties } from "@/lib/operational-telemetry";

describe("operational telemetry envelopes", () => {
  it("buckets recorded-voice latency without buyer content or identifiers", () => {
    const unsafe = {
      event: "voice.recorded_turn",
      outcome: "ok",
      durationMs: 1_720,
      transcript: "private buyer request",
      token: "private token",
    } as const;

    const properties = operationalEventProperties(unsafe);
    expect(properties).toEqual({
      schema_version: "1",
      outcome: "ok",
      duration_bucket: "1500_3000ms",
      $process_person_profile: false,
    });
    expect(JSON.stringify(properties)).not.toContain("private");
  });

  it("records only bounded discovery dimensions", () => {
    expect(operationalEventProperties({
      event: "discovery.query",
      source: "voice",
      outcome: "ready",
      durationMs: 420,
      resultCount: 3,
    })).toEqual({
      schema_version: "1",
      source: "voice",
      outcome: "ready",
      duration_bucket: "under_500ms",
      result_count_bucket: "2_5",
      $process_person_profile: false,
    });
  });
});
