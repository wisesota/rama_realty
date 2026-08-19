import { describe, expect, it } from "vitest";
import {
  parsePropertyBrief,
  searchIllustrativeProperties,
} from "@/lib/property-search";

describe("property brief extraction", () => {
  it("preserves the main Dubai criteria and singular bedroom grammar", () => {
    expect(
      parsePropertyBrief(
        "A one-bedroom apartment in Downtown Dubai under AED 2M with natural light",
      ),
    ).toEqual([
      "Downtown Dubai",
      "1 bedroom",
      "Up to AED 2M",
      "Apartment",
      "Natural light",
    ]);
  });

  it("keeps the visible criteria set bounded", () => {
    const criteria = parsePropertyBrief(
      "A two-bedroom apartment in Dubai Marina under AED 3M with a sea view, waterfront, balcony, terrace, pool, home office, natural light, metro access, and a quiet walkable setting",
    );

    expect(criteria).toHaveLength(6);
    expect(criteria).toEqual([
      "Dubai Marina",
      "2 bedrooms",
      "Up to AED 3M",
      "Apartment",
      "Sea view",
      "Waterfront",
    ]);
  });
});

describe("illustrative property ranking", () => {
  it("ranks the matching location first and preserves disclosure", () => {
    const result = searchIllustrativeProperties({
      brief: "A two-bedroom apartment in Downtown Dubai with natural light and a home office",
      source: "text",
    });

    expect(result.properties[0]?.id).toBe("boulevard-garden-apartment");
    expect(result.source).toEqual({
      kind: "illustrative-local",
      label: "Illustrative local records — no live listing feed",
    });
    expect(result.summary).toContain("1 illustrative residence meets");
  });

  it("enforces location, bedroom, and maximum-price constraints before ranking", () => {
    const result = searchIllustrativeProperties({
      brief: "A two-bedroom apartment in Dubai Marina under AED 3M with a balcony",
      source: "text",
    });

    expect(result.properties.map((property) => property.id)).toEqual([
      "marina-promenade-residence",
    ]);
    expect(result.summary).toContain("1 illustrative residence");
  });

  it("returns an honest empty result when no illustrative record meets hard constraints", () => {
    const result = searchIllustrativeProperties({
      brief: "A one-bedroom apartment in Downtown Dubai under AED 2.5M with natural light",
      source: "voice",
    });

    expect(result.properties).toEqual([]);
    expect(result.summary).toContain("No illustrative residences meet every hard");
  });
});
