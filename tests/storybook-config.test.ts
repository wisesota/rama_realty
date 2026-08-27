import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Storybook dependency pre-optimization", () => {
  it("pre-optimizes Motion before voice-conversation stories load", () => {
    const config = readFileSync(".storybook/main.ts", "utf8");

    expect(config).toContain("config.optimizeDeps.include");
    expect(config).toContain("'motion/react'");
    expect(config).toContain("'next/dist/shared/lib/app-router-context.shared-runtime'");
  });
});
