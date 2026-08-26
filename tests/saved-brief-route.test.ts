import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ getAuthenticatedSupabase: vi.fn() }));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthenticatedSupabase: auth.getAuthenticatedSupabase,
  isSameOrigin: vi.fn(() => true),
}));

import { GET } from "@/app/api/search-briefs/route";

describe("saved brief history route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns no history when verified claims do not identify a buyer", async () => {
    auth.getAuthenticatedSupabase.mockResolvedValue({ supabase: {}, userId: null });
    const response = await GET();

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    await expect(response.json()).resolves.toEqual({ authenticated: false, briefs: [] });
  });

  it("filters by the verified owner and returns only allowlisted fields", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockResolvedValue({
      data: [{
        id: "brief-1",
        brief: "Two bedrooms in Dubai Marina",
        criteria: ["Dubai Marina", "2 bedrooms"],
        source: "voice",
        result_ids: ["home-1", "home-2"],
        created_at: "2026-08-22T10:00:00.000Z",
      }],
      error: null,
    });
    auth.getAuthenticatedSupabase.mockResolvedValue({
      supabase: { from: vi.fn(() => query) },
      userId: "buyer-1",
    });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(query.select).toHaveBeenCalledWith("id,brief,criteria,source,result_ids,created_at");
    expect(query.eq).toHaveBeenCalledWith("user_id", "buyer-1");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(query.limit).toHaveBeenCalledWith(12);
    await expect(response.json()).resolves.toEqual({
      authenticated: true,
      briefs: [{
        id: "brief-1",
        brief: "Two bedrooms in Dubai Marina",
        criteria: ["Dubai Marina", "2 bedrooms"],
        source: "voice",
        resultIds: ["home-1", "home-2"],
        createdAt: "2026-08-22T10:00:00.000Z",
      }],
    });
  });

  it("fails closed when owner history cannot be read", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockResolvedValue({ data: null, error: { code: "PGRST000" } });
    auth.getAuthenticatedSupabase.mockResolvedValue({
      supabase: { from: vi.fn(() => query) },
      userId: "buyer-1",
    });

    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
