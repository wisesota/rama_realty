import { describe, expect, it } from "vitest";
import { inspectEnvironment } from "../scripts/env-contract.mjs";

const validEnvironment = {
  RATE_LIMIT_SECRET: "rate-limit-secret-that-is-long-and-independent",
  BUYER_SESSION_SECRET: "buyer-session-secret-that-is-long-and-independent",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  NEXT_PUBLIC_SITE_URL: "https://rama.example",
  SUPABASE_SECRET_KEY: "sb_secret_test_value",
  RAMA_DEMO_MODE: "false",
  GEMINI_LIVE_ENABLED: "false",
};

describe("environment contract", () => {
  it("accepts an independently keyed, server-safe production shape", () => {
    expect(inspectEnvironment(validEnvironment).ok).toBe(true);
  });

  it("fails closed when the rate-limit secret is absent or reused", () => {
    expect(inspectEnvironment({ ...validEnvironment, RATE_LIMIT_SECRET: "" }).invalidKeys)
      .toContain("RATE_LIMIT_SECRET");
    expect(inspectEnvironment({
      ...validEnvironment,
      RATE_LIMIT_SECRET: validEnvironment.SUPABASE_SECRET_KEY,
    }).sharedSecretPairs).toContain("RATE_LIMIT_SECRET:SUPABASE_SECRET_KEY");
    expect(inspectEnvironment({
      ...validEnvironment,
      GEMINI_API_KEY: validEnvironment.BUYER_SESSION_SECRET,
    }).sharedSecretPairs).toContain("BUYER_SESSION_SECRET:GEMINI_API_KEY");
  });

  it("flags secret-shaped browser variables without printing values", () => {
    const result = inspectEnvironment({ ...validEnvironment, NEXT_PUBLIC_ADMIN_SECRET: "do-not-print" });
    expect(result.publicExposureViolations).toEqual(["NEXT_PUBLIC_ADMIN_SECRET"]);
    expect(JSON.stringify(result)).not.toContain("do-not-print");
  });

  it("requires Gemini only while voice is enabled", () => {
    expect(inspectEnvironment({ ...validEnvironment, GEMINI_LIVE_ENABLED: "true" }).invalidKeys)
      .toContain("GEMINI_API_KEY");
  });

  it("validates optional rollout percentages without making them required", () => {
    expect(inspectEnvironment({ ...validEnvironment, RAMA_DECISION_OS_ROLLOUT_PERCENT: "25" }).ok).toBe(true);
    const invalid = inspectEnvironment({ ...validEnvironment, RAMA_DECISION_OS_ROLLOUT_PERCENT: "101" });
    expect(invalid.ok).toBe(false);
    expect(invalid.entries).toContainEqual(expect.objectContaining({
      key: "RAMA_DECISION_OS_ROLLOUT_PERCENT",
      required: false,
      status: "invalid_percentage",
    }));
  });

  it("rejects malformed optional kill switches without requiring them", () => {
    expect(inspectEnvironment(validEnvironment).ok).toBe(true);
    const invalid = inspectEnvironment({
      ...validEnvironment,
      LICENSED_SUPPLY_PUBLICATION_ENABLED: "enabled",
    });
    expect(invalid.invalidKeys).toContain("LICENSED_SUPPLY_PUBLICATION_ENABLED");
    expect(inspectEnvironment({
      ...validEnvironment,
      LICENSED_SUPPLY_PROVIDER_IDS: "valid-provider,INVALID PROVIDER",
    }).invalidKeys).toContain("LICENSED_SUPPLY_PROVIDER_IDS");
  });
});
