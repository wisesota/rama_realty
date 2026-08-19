import { afterEach, describe, expect, it, vi } from "vitest";
import { createLandingStore } from "@/stores/landing-store";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("landing shortlist state", () => {
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
});
