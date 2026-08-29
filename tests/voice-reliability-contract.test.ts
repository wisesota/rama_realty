import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { assessVoiceReliabilityEvidence } from "../scripts/voice-reliability-contract.mjs";

const policy = JSON.parse(readFileSync("docs/voice-reliability-policy.json", "utf8"));
const evaluationTime = new Date("2026-08-28T22:30:00Z");

function validEvidence() {
  const failures = ["permission-denied", "token-timeout", "socket-timeout", "provider-close", "reconnect-exhausted", "recorded-fallback"];
  return {
    schemaVersion: 1,
    releaseCommit: "a".repeat(40),
    evidenceAuthority: "ci-and-device-lab",
    generatedAt: "2026-08-28T22:00:00Z",
    runs: [
      ...Array.from({ length: 70 }, (_, index) => {
        const profile = policy.requiredLiveProfiles[index % policy.requiredLiveProfiles.length];
        return {
          id: `live-${index + 1}`,
          kind: "live-provider",
          environment: "staging",
          ...profile,
          outcome: "success",
          stages: {
            tokenMs: 700 + index,
            socketMs: 900 + index,
            firstServerEventMs: 1_400 + index,
            firstAudioMs: 1_800 + index,
            totalTurnMs: 6_000 + index,
          },
        };
      }),
      ...Array.from({ length: 30 }, (_, index) => ({
        id: `fault-${index + 1}`,
        kind: "fault-injection",
        environment: "staging",
        browser: "chromium",
        device: "desktop",
        network: "wifi",
        locale: index % 2 === 0 ? "en" : "ar",
        outcome: failures[index % failures.length],
        stages: {},
      })),
    ],
  };
}

describe("voice reliability evidence contract", () => {
  it("accepts a privacy-safe 100-turn, cross-profile evidence set", () => {
    expect(assessVoiceReliabilityEvidence(validEvidence(), policy, evaluationTime)).toEqual(expect.objectContaining({
      ok: true,
      summary: expect.objectContaining({ totalRuns: 100, liveProviderRuns: 70, liveProviderSuccessRate: 1 }),
    }));
  });

  it("rejects small samples and any forbidden content field", () => {
    const evidence = validEvidence();
    evidence.runs = evidence.runs.slice(0, 20);
    (evidence.runs[0] as Record<string, unknown>).transcript = "private buyer content";
    const result = assessVoiceReliabilityEvidence(evidence, policy, evaluationTime);
    expect(result.blockers).toEqual(expect.arrayContaining(["insufficient_runs", "insufficient_live_provider_runs", "forbidden_fields_present"]));
    expect(result.privacyFindings.some((path: string) => path.includes("transcript"))).toBe(true);
  });

  it("rejects latency, success-rate, and freshness claims outside the approved policy", () => {
    const evidence = validEvidence();
    evidence.generatedAt = "2026-08-20T22:00:00Z";
    evidence.runs[0].outcome = "error";
    evidence.runs[1].outcome = "error";
    for (const run of evidence.runs.slice(2, 8)) (run.stages as Record<string, number>).firstAudioMs = 25_000;
    const result = assessVoiceReliabilityEvidence(evidence, policy, evaluationTime);
    expect(result.blockers).toEqual(expect.arrayContaining([
      "evidence_stale",
      "target_failed:live_provider_success_rate",
      "target_failed:p95:firstAudioMs",
    ]));
  });
});
