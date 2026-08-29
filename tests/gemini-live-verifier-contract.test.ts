import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertCompleteLiveTurn,
  isCompleteLiveTokenPayload,
} from "../scripts/gemini-live-verification-contract.mjs";

describe("Gemini Live release verifier", () => {
  const source = readFileSync("scripts/verify-gemini-live.mjs", "utf8");

  it("uses the two-run default when --runs is absent", () => {
    expect(source).toContain('readArgument("--runs") || process.env.RAMA_VERIFY_RUNS || "2"');
    expect(source).not.toContain('process.argv[process.argv.indexOf("--runs") + 1]');
  });

  it("writes presence assertions rather than transcript content to evidence", () => {
    expect(source).toContain("inputTranscriptPresent: Boolean(inputTranscript.trim())");
    expect(source).toContain("outputTranscriptPresent: Boolean(outputTranscript.trim())");
    expect(source).not.toContain("inputTranscript: inputTranscript.trim()");
    expect(source).not.toContain("outputTranscript: outputTranscript.trim()");
  });

  it("requires the complete browser token contract", () => {
    expect(isCompleteLiveTokenPayload({
      token: "token",
      model: "model",
      expiresAt: "2026-08-30T00:00:00Z",
      sessionResumptionEnabled: false,
    })).toBe(true);
    expect(isCompleteLiveTokenPayload({ token: "token", model: "model" })).toBe(false);
  });

  it("rejects a truncated turn that never reports generation completion", () => {
    expect(() => assertCompleteLiveTurn({
      audioChunks: 1,
      inputTranscript: "buyer request",
      outputTranscript: "advisor response",
      toolCalls: 1,
      toolResponses: 1,
      generationComplete: false,
      turnComplete: true,
      stages: {},
    }, 0)).toThrow("completed without the full contract");
  });

  it("rejects a generation that never reports turn completion", () => {
    expect(() => assertCompleteLiveTurn({
      audioChunks: 1,
      inputTranscript: "buyer request",
      outputTranscript: "advisor response",
      toolCalls: 1,
      toolResponses: 1,
      generationComplete: true,
      turnComplete: false,
      stages: {},
    }, 0)).toThrow("completed without the full contract");
  });
});
