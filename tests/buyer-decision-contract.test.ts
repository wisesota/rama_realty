import { describe, expect, it } from "vitest";
import { isBuyerDecisionEnvelope, type BuyerDecisionEnvelopeV1, type BuyerDecisionEnvelopeV2 } from "@/lib/agent/buyer-contracts";

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

  it("accepts illustrative inventory only when it is not owned by a brokerage organization", () => {
    const illustrative = structuredClone(envelope);
    illustrative.entities.properties["home-1"].organizationId = null;
    illustrative.entities.properties["home-1"].provenance.kind = "illustrative";
    illustrative.sourceSummary = { publishedCount: 0, illustrativeCount: 1, staleCount: 0, label: "1 representative residence" };
    expect(isBuyerDecisionEnvelope(illustrative)).toBe(true);
  });

  it("rejects published inventory without an organization owner", () => {
    const malformed = structuredClone(envelope);
    malformed.entities.properties["home-1"].organizationId = null;
    expect(isBuyerDecisionEnvelope(malformed)).toBe(false);
  });

  it("rejects illustrative inventory assigned to a brokerage organization", () => {
    const malformed = structuredClone(envelope);
    malformed.entities.properties["home-1"].provenance.kind = "illustrative";
    malformed.sourceSummary = { publishedCount: 0, illustrativeCount: 1, staleCount: 0, label: "1 representative residence" };
    expect(isBuyerDecisionEnvelope(malformed)).toBe(false);
  });

  it("rejects source-summary counts that drift from the rendered properties", () => {
    const malformed = structuredClone(envelope);
    malformed.sourceSummary.publishedCount = 0;
    malformed.sourceSummary.illustrativeCount = 1;
    expect(isBuyerDecisionEnvelope(malformed)).toBe(false);
  });

  it("reads a v2 envelope with explicit evidence and an immutable Decision Ledger", () => {
    const v2: BuyerDecisionEnvelopeV2 = {
      ...structuredClone(envelope),
      schemaVersion: "2",
      evidence: {
        assertions: [{
          id: "home-1:price:abc123",
          propertyId: "home-1",
          field: "price",
          label: "Price",
          value: 2_800_000,
          state: "disputed",
          sourceName: "CRM",
          observedAt: "2026-08-18T12:00:00.000Z",
          asSeenValue: 2_700_000,
          currentValue: 2_800_000,
          contentHash: "a".repeat(64),
          explanation: "The governed price changed after the snapshot.",
        }],
      },
      decisionLedger: {
        version: "1",
        events: [{
          id: "event-1",
          type: "candidate_seen",
          occurredAt: "2026-08-18T12:00:00.000Z",
          summary: "The candidate entered the shortlist.",
          assertionIds: ["home-1:price:abc123"],
        }],
      },
    };
    expect(isBuyerDecisionEnvelope(v2)).toBe(true);
    const malformed = structuredClone(v2) as BuyerDecisionEnvelopeV2;
    malformed.evidence.assertions[0].state = "guaranteed" as never;
    expect(isBuyerDecisionEnvelope(malformed)).toBe(false);
  });
});
