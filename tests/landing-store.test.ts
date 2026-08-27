import { afterEach, describe, expect, it, vi } from "vitest";
import { createLandingStore } from "@/stores/landing-store";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("landing shortlist state", () => {
  it("starts with an empty buyer-owned brief in both public locales", () => {
    const english = createLandingStore("en").getState();
    const arabic = createLandingStore("ar").getState();

    expect(english.brief).toBe("");
    expect(arabic.brief).toBe("");
    expect(english.criteria).toEqual([]);
    expect(arabic.criteria).toEqual([]);
    expect(english.agentBlocks).toEqual([]);
    expect(arabic.agentBlocks).toEqual([]);
  });

  it("exposes client brief validation as an error state", () => {
    const store = createLandingStore("en");
    store.getState().reportBriefError("Add more detail.");

    expect(store.getState()).toMatchObject({
      searchPhase: "error",
      searchError: "Add more detail.",
      searchStatus: "Add more detail.",
    });
  });

  it("keeps discovery failures and recovery guidance in Arabic on the Arabic route", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: "Property discovery is temporarily unavailable.",
      code: "DiscoveryUnavailable",
    }), { status: 503, headers: { "Content-Type": "application/json" } })));
    const store = createLandingStore("ar");

    const prepared = await store.getState().prepareBrief("شقة في دبي مارينا", "text");

    expect(prepared).toBe(false);
    expect(store.getState().searchError).toBe("تعذر إعداد الموجز. حاول مرة أخرى.");
    expect(store.getState().searchStatus).not.toMatch(/[A-Za-z]/);
  });

  it("restores the last optimistic favorite change when synchronization fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const store = createLandingStore();
    store.getState().setAccountPhase("authenticated");

    store.getState().toggleFavorite("property-1");
    await vi.waitFor(() => expect(store.getState().favoriteIds).not.toContain("property-1"));

    expect(store.getState().accountStatus).toContain("restored");
  });

  it("does not let an older failed request undo a newer favorite choice", async () => {
    let rejectFirst: ((reason?: unknown) => void) | undefined;
    const first = new Promise<Response>((_, reject) => { rejectFirst = reject; });
    const fetchMock = vi.fn()
      .mockReturnValueOnce(first)
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    const store = createLandingStore();
    store.getState().setAccountPhase("authenticated");

    store.getState().toggleFavorite("property-1");
    store.getState().toggleFavorite("property-1");
    rejectFirst?.(new Error("late failure"));

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await Promise.resolve();
    expect(store.getState().favoriteIds).not.toContain("property-1");
  });

  it("debounces brief recalculation for 350ms and sends only the latest edit", async () => {
    vi.useFakeTimers();
    const response = (transcript: string) => new Response(JSON.stringify({
      schemaVersion: "1",
      draftId: "draft-1",
      source: "text",
      transcript,
      criteria: [{ key: "dubai", label: "Dubai", value: "Dubai", kind: "hard" }],
      missingFields: ["maximum budget"],
      contradictions: [],
    }), { status: 200, headers: { "Content-Type": "application/json" } });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response("Home in Dubai"))
      .mockResolvedValueOnce(response("Quiet home in Dubai"));
    vi.stubGlobal("fetch", fetchMock);
    const store = createLandingStore("en");
    await store.getState().prepareBrief("Home in Dubai", "text", "draft-1");

    const firstEdit = store.getState().updatePreparedBrief("Bright home in Dubai");
    const latestEdit = store.getState().updatePreparedBrief("Quiet home in Dubai");
    await vi.advanceTimersByTimeAsync(349);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.getState().briefRecalculating).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    await Promise.all([firstEdit, latestEdit]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({ brief: "Quiet home in Dubai" });
    expect(store.getState().preparedBrief?.transcript).toBe("Quiet home in Dubai");
    expect(store.getState().briefRecalculating).toBe(false);
  });
});
