import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { criterionCategoriesFromKeys, elapsedBucket, emitProductEvent, type ProductEvent } from "@/lib/product-events";

const event: ProductEvent = {
  event: "room.property_expand",
  searchRunId: "opaque-search-run",
  propertyId: "public-property-slug",
  sourceVersion: "v3",
  fromView: "lead",
  timestamp: "2026-08-19T12:00:00.000Z",
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("privacy-safe product events", () => {
  it("uses coarse voice latency buckets", () => {
    expect(elapsedBucket(500)).toBe("lt_1s");
    expect(elapsedBucket(4_000)).toBe("3_10s");
    expect(elapsedBucket(120_000)).toBe("gte_120s");
  });

  it("does not download analytics before cookie consent", () => {
    const source = readFileSync("lib/product-events.ts", "utf8");

    expect(source.indexOf('localStorage.getItem("rama_cookie_consent")')).toBeLessThan(
      source.indexOf('import("posthog-js")'),
    );
  });
  it("logs the redacted event in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    emitProductEvent(event);

    expect(info).toHaveBeenCalledWith("[rama.product-event]", event);
  });

  it("drops undeclared buyer text before logging", () => {
    vi.stubEnv("NODE_ENV", "development");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const unsafeInput = { ...event, rawBrief: "private buyer text" } as ProductEvent;

    emitProductEvent(unsafeInput);

    expect(info).toHaveBeenCalledWith("[rama.product-event]", event);
  });

  it("is disabled outside development", () => {
    vi.stubEnv("NODE_ENV", "production");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    emitProductEvent(event);

    expect(info).not.toHaveBeenCalled();
  });

  it("derives only allowlisted semantic criterion categories", () => {
    expect(criterionCategoriesFromKeys([
      "location", "bedrooms", "budget", "property-type", "lifestyle-4", "lifestyle-5", "flexible", "private-text",
    ])).toEqual(["location", "bedrooms", "budget", "property_type", "lifestyle", "flexible"]);
  });

  it("logs a redacted search outcome without criterion labels or values", () => {
    vi.stubEnv("NODE_ENV", "development");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const outcome = {
      event: "room.search_outcome",
      searchRunId: "opaque-search-run",
      outcome: "empty",
      criterionCategories: ["location", "private buyer text"],
      criterionCount: 2,
      resultCount: 0,
      timestamp: "2026-08-19T12:00:00.000Z",
      rawBrief: "private buyer text",
    } as unknown as ProductEvent;

    emitProductEvent(outcome);

    expect(info).toHaveBeenCalledWith("[rama.product-event]", {
      event: "room.search_outcome",
      searchRunId: "opaque-search-run",
      outcome: "empty",
      criterionCategories: ["location"],
      criterionCount: 2,
      resultCount: 0,
      timestamp: "2026-08-19T12:00:00.000Z",
    });
  });
});
