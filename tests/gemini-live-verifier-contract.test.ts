import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
});
