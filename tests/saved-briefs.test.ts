import { describe, expect, it } from "vitest";
import {
  comparisonPropertyIds,
  isSavedBriefHistoryResponse,
  type SavedBriefHistoryItem,
} from "@/lib/saved-briefs";

const history: SavedBriefHistoryItem[] = [
  {
    id: "run-a",
    brief: "Marina apartment",
    criteria: ["Dubai Marina", "2 bedrooms"],
    source: "text",
    resultIds: ["home-1", "home-2"],
    createdAt: "2026-08-22T10:00:00.000Z",
  },
  {
    id: "run-b",
    brief: "Quieter waterfront apartment",
    criteria: ["Waterfront", "Quiet"],
    source: "voice",
    resultIds: ["home-1", "home-3"],
    createdAt: "2026-08-22T11:00:00.000Z",
  },
  {
    id: "run-c",
    brief: "Downtown apartment",
    criteria: ["Downtown"],
    source: "text",
    resultIds: ["home-4"],
    createdAt: "2026-08-22T12:00:00.000Z",
  },
];

describe("saved brief history", () => {
  it("accepts the owner-safe response envelope", () => {
    expect(isSavedBriefHistoryResponse({ authenticated: true, briefs: history })).toBe(true);
    expect(isSavedBriefHistoryResponse({ authenticated: true, briefs: [{ ...history[0], source: "unknown" }] })).toBe(false);
    expect(isSavedBriefHistoryResponse({ authenticated: true, briefs: [{ ...history[0], resultIds: [1] }] })).toBe(false);
  });

  it("deduplicates properties across selected runs and caps the comparison", () => {
    expect(comparisonPropertyIds(history, ["run-a", "run-b"])).toEqual(["home-1", "home-2", "home-3"]);
    expect(comparisonPropertyIds(history, ["run-b", "run-c"], 2)).toEqual(["home-1", "home-3"]);
  });

  it("ignores runs the buyer did not select", () => {
    expect(comparisonPropertyIds(history, ["run-c"])).toEqual(["home-4"]);
    expect(comparisonPropertyIds(history, [])).toEqual([]);
  });
});
