import { afterEach, describe, expect, it, vi } from "vitest";
import { providerPublicationIsEnabled, validateProviderRecord, type ProviderRecordInput } from "@/lib/integrations/provider-ingestion";

const input: ProviderRecordInput = {
  providerId: "licensed-partner-a",
  sourceRecordId: "partner-home-1",
  sourceName: "Licensed Partner A",
  organizationId: "partner-org",
  observedAt: "2026-08-22T10:00:00.000Z",
  publicationEndsAt: "2026-09-22T10:00:00.000Z",
  attribution: "Licensed Partner A",
  mediaRightsConfirmed: true,
  permitNumber: null,
  property: {
    name: "Marina Residence",
    slug: "marina-residence",
    location: "Dubai Marina",
    description: "A rights-cleared factual description supplied by the licensed provider.",
    propertyType: "apartment",
    completionStatus: "ready",
    priceAed: 3_000_000,
    beds: 2,
    baths: 2,
    areaSqFt: 1_300,
    imageUrl: "https://partner.example/residence.jpg",
    imageAlt: "Marina Residence living room",
  },
};

const policy = {
  providerId: "licensed-partner-a",
  sourceName: "Licensed Partner A",
  organizationId: "partner-org",
  maximumFreshnessHours: 24,
  allowedLocations: ["Dubai Marina"],
  publicationRightsApproved: true,
  mediaRightsRequired: true,
};

afterEach(() => vi.unstubAllEnvs());

describe("provider quarantine validation", () => {
  it("accepts a current, rights-cleared record inside the bounded lane", () => {
    const result = validateProviderRecord(input, policy, new Date("2026-08-22T12:00:00.000Z"));
    expect(result.ok).toBe(true);
  });

  it("fails closed for stale, unlicensed, or media-uncleared supply", () => {
    const result = validateProviderRecord(
      { ...input, observedAt: "2026-08-20T10:00:00.000Z", mediaRightsConfirmed: false },
      { ...policy, publicationRightsApproved: false },
      new Date("2026-08-22T12:00:00.000Z"),
    );
    expect(result).toEqual(expect.objectContaining({ ok: false }));
    if (!result.ok) expect(result.errors).toEqual(expect.arrayContaining([
      "Publication rights are not approved.",
      "The provider record is outside its freshness window.",
      "Media publication rights are not confirmed.",
    ]));
  });

  it("requires both the global publication gate and the exact provider kill switch", () => {
    vi.stubEnv("LICENSED_SUPPLY_PUBLICATION_ENABLED", "true");
    vi.stubEnv("LICENSED_SUPPLY_PROVIDER_IDS", "licensed-partner-a,licensed-partner-b");
    expect(providerPublicationIsEnabled("licensed-partner-a")).toBe(true);
    expect(providerPublicationIsEnabled("unknown-partner")).toBe(false);

    vi.stubEnv("LICENSED_SUPPLY_PUBLICATION_ENABLED", "false");
    expect(providerPublicationIsEnabled("licensed-partner-a")).toBe(false);
  });
});
