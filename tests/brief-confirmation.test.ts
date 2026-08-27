import { describe, expect, it } from "vitest";
import { isPreparedBrief, prepareBriefDraft } from "@/lib/brief-confirmation";

describe("brief confirmation contract", () => {
  it("normalizes a draft without creating property truth", () => {
    const draft = prepareBriefDraft({
      brief: "  Two bedrooms in Dubai Marina under AED 3M with a balcony  ",
      source: "voice",
      draftId: "draft-1234567890",
    });
    expect(draft).toEqual(expect.objectContaining({
      schemaVersion: "1",
      source: "voice",
      transcript: "Two bedrooms in Dubai Marina under AED 3M with a balcony",
    }));
    expect(draft.criteria.map((criterion) => criterion.label)).toEqual(expect.arrayContaining(["Dubai Marina", "2 bedrooms", "Up to AED 3M", "Balcony"]));
    expect(draft).not.toHaveProperty("properties");
    expect(draft).not.toHaveProperty("searchRunId");
    expect(isPreparedBrief(draft)).toBe(true);
  });

  it("keeps missing decision fields explicit", () => {
    const draft = prepareBriefDraft({ brief: "A quiet apartment", source: "text", draftId: "draft-1234567890" });
    expect(draft.missingFields).toEqual(["preferred area", "maximum budget"]);
  });

  it("extracts Arabic construct-state bedroom counts without dropping a hard constraint", () => {
    const draft = prepareBriefDraft({
      brief: "شقة بغرفتي نوم في دبي مارينا بأقل من 3 ملايين درهم",
      source: "text",
      draftId: "draft-arabic-bedroom-0001",
    });

    expect(draft.criteria.map((criterion) => criterion.label)).toEqual(expect.arrayContaining([
      "Dubai Marina",
      "2 bedrooms",
      "Up to AED 3M",
      "Apartment",
    ]));
    expect(draft.criteria.find((criterion) => criterion.label === "2 bedrooms")?.kind).toBe("hard");
  });

  it("preserves self-correction and surfaces advice boundaries without inventing facts", () => {
    const draft = prepareBriefDraft({
      brief: "Three bedrooms, sorry, two bedrooms in Dubai Marina; guarantee the tax outcome",
      source: "voice",
      draftId: "draft-self-correction-0001",
    });
    expect(draft.criteria.map((criterion) => criterion.label)).toContain("2 bedrooms");
    expect(draft.criteria.map((criterion) => criterion.label)).not.toContain("3 bedrooms");
    expect(draft.advisoryBoundaries).toEqual(["tax", "guaranteed_return"]);
    expect(draft).not.toHaveProperty("properties");
  });
});
