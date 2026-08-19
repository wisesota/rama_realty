import { describe, expect, it } from "vitest";
import { isBuyerDecisionEnvelope, type BuyerDecisionEnvelopeV1 } from "@/lib/agent/buyer-contracts";

const envelope: BuyerDecisionEnvelopeV1 = {
  schemaVersion: "1",
  correlationId: "a5e97683-d4f3-40c5-b344-5be711526efd",
  searchRunId: "dcf17a70-cb96-446f-9888-7b29363985dd",
  conversationId: "bb2846d4-b865-42a6-ab76-8fd767c8451f",
  status: "ready",
  brief: { original: "Dubai Marina home", normalized: "Dubai Marina", criteria: [{ key: "location", label: "Dubai Marina", value: "Dubai Marina", kind: "hard" }] },
  entities: {
    properties: {
      "home-1": {
        id: "home-1", organizationId: "3f84d54a-26f8-45e1-b29c-938b48e6b143", developmentId: null, slug: "home-1", name: "Marina Residence", location: "Dubai Marina", description: "A governed residence.", propertyType: "apartment", completionStatus: "ready", availabilityStatus: "available",
        price: { amount: 2_800_000, currency: "AED" }, beds: 2, baths: 2, area: { value: 1_420, unit: "sq_ft" }, feature: "Balcony", matchReason: "Matches the location and budget.", image: { url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c", alt: "Contemporary residence" }, amenities: ["Balcony"], views: ["Marina"], furnishingStatus: null, tenure: "freehold", handoverAt: null, serviceChargeAed: null,
        provenance: { kind: "published", sourceName: "CRM", observedAt: "2026-08-18T12:00:00.000Z", publishedAt: "2026-08-18T12:00:00.000Z", version: 3 },
      },
    },
  },
  blocks: [{ type: "lead_property", propertyId: "home-1", reason: "Matches the location and budget." }],
  sourceSummary: { publishedCount: 1, illustrativeCount: 0, staleCount: 0, label: "1 governed residence" },
  suggestedActions: [{ id: "inspect", label: "Review the strongest match", propertyId: "home-1" }],
};

describe("buyer Decision Room envelope", () => {
  it("accepts numeric, unit-safe facts with per-property provenance", () => {
    expect(isBuyerDecisionEnvelope(envelope)).toBe(true);
  });

  it("rejects a presentation price string and missing provenance", () => {
    const malformed = structuredClone(envelope) as unknown as { entities: { properties: Record<string, Record<string, unknown>> } };
    malformed.entities.properties["home-1"].price = "AED 2.8M";
    delete malformed.entities.properties["home-1"].provenance;
    expect(isBuyerDecisionEnvelope(malformed)).toBe(false);
  });
});
