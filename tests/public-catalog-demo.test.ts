import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@/lib/supabase/public", () => ({
  createPublicCatalogClient: () => ({ from: mocks.from }),
}));

import { CatalogUnavailableError, PublicCatalogRepository } from "@/lib/public-catalog-repository";

describe("public catalog demo boundary", () => {
  beforeEach(() => mocks.from.mockReset());
  afterEach(() => vi.unstubAllEnvs());

  it("uses only explicitly illustrative local rows when demo mode is enabled", async () => {
    vi.stubEnv("RAMA_DEMO_MODE", "true");
    const repository = new PublicCatalogRepository();
    const result = await repository.search("Two bedrooms in Dubai Marina under AED 3M");
    expect(result.candidates).toHaveLength(3);
    expect(result.candidates.every(({ property }) => property.organizationId === null && property.provenance.kind === "illustrative")).toBe(true);
    expect(await repository.getProperty(result.candidates[0].property.id)).toEqual(result.candidates[0].property);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("never substitutes demo rows for a production catalog failure", async () => {
    vi.stubEnv("RAMA_DEMO_MODE", "false");
    const query: Record<string, ReturnType<typeof vi.fn>> = {};
    query.order = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.lte = vi.fn(() => query);
    query.limit = vi.fn().mockResolvedValue({ data: null, error: { message: "offline" } });
    mocks.from.mockReturnValue({ select: vi.fn(() => query) });
    const repository = new PublicCatalogRepository();
    await expect(repository.search("Dubai home")).rejects.toBeInstanceOf(CatalogUnavailableError);
  });
});
