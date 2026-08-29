import { describe, expect, it } from "vitest";
import { operationalEventProperties } from "@/lib/operational-telemetry";
import { parseOperationalVoicePayload } from "@/lib/voice/operational-voice-contract";

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

  it("emits only bounded live-stage dimensions and deployment context", () => {
    process.env.RAMA_RELEASE_COMMIT = "a".repeat(40);
    const properties = operationalEventProperties({
      event: "voice.live_stage",
      attemptId: "123e4567-e89b-42d3-a456-426614174000",
      stage: "first_audio",
      outcome: "success",
      durationMs: 1_720,
      mode: "live",
      locale: "en",
      browserClass: "chromium",
      networkClass: "4g",
      reconnectCount: 0,
    });
    expect(properties).toEqual(expect.objectContaining({
      schema_version: "2",
      stage: "first_audio",
      duration_bucket: "1500_3000ms",
      release_commit: "a".repeat(40),
      $process_person_profile: false,
    }));
    expect(JSON.stringify(properties)).not.toContain("transcript");
  });

  it("rejects extra buyer-content fields and out-of-bounds timing", () => {
    const valid = {
      attemptId: "123e4567-e89b-42d3-a456-426614174000",
      stage: "socket",
      outcome: "success",
      durationMs: 900,
      mode: "live",
      locale: "en",
      browserClass: "chromium",
      networkClass: "4g",
      reconnectCount: 0,
    } as const;
    expect(parseOperationalVoicePayload(valid)).toEqual(valid);
    expect(parseOperationalVoicePayload({ ...valid, transcript: "private" })).toBeNull();
    expect(parseOperationalVoicePayload({ ...valid, durationMs: 200_000 })).toBeNull();
  });
});
