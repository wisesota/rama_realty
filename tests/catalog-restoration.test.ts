import { describe, expect, it } from "vitest";
import type { BuyerPropertySummary } from "@/lib/agent/buyer-contracts";
import { summarizeCatalogRestoration } from "@/lib/catalog-restoration";

function property(id: string, version: number, observedAt: string | null): BuyerPropertySummary {
  return {
    id,
    organizationId: "3f84d54a-26f8-45e1-b29c-938b48e6b143",
    developmentId: null,
    slug: id,
    name: "Residence",
    location: "Dubai Marina",
    description: null,
    propertyType: "apartment",
    completionStatus: "ready",
    availabilityStatus: "available",
    price: { amount: 2_800_000, currency: "AED" },
    beds: 2,
    baths: 2,
    area: { value: 1_200, unit: "sq_ft" },
    feature: "Balcony",
    matchReason: "Matches the brief.",
    image: { url: "https://example.com/home.jpg", alt: "Residence" },
    amenities: [],
    views: [],
    furnishingStatus: null,
    tenure: null,
    handoverAt: null,
    serviceChargeAed: null,
    provenance: { kind: "published", sourceName: "CRM", observedAt, publishedAt: observedAt, version },
  };
}

describe("catalog restoration", () => {
  it("distinguishes withdrawn matches from refreshed facts", () => {
    const candidates = [
      { propertyId: "same", propertyVersion: 1, sourceObservedAt: "2026-08-18T10:00:00.000Z" },
      { propertyId: "changed", propertyVersion: 1, sourceObservedAt: "2026-08-18T10:00:00.000Z" },
      { propertyId: "removed", propertyVersion: 1, sourceObservedAt: null },
    ];
    const current = [
      property("same", 1, "2026-08-18T10:00:00.000Z"),
      property("changed", 2, "2026-08-18T12:00:00.000Z"),
    ];

    expect(summarizeCatalogRestoration(candidates, current)).toEqual({
      removedCount: 1,
      changedCount: 1,
    });
  });
});
