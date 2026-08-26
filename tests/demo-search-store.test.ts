import { existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BuyerDecisionEnvelopeV1 } from "@/lib/agent/buyer-contracts";
import {
  deleteDemoSearchesForBuyer,
  listDemoSearchesForBuyer,
  loadDemoSearch,
  readDemoSearchByConfirmation,
  resetDemoSearchStoreForTests,
  saveDemoSearch,
} from "@/lib/demo-search-store";

const envelope: BuyerDecisionEnvelopeV1 = {
  schemaVersion: "1",
  correlationId: "7b0b5bb1-2f02-4388-b3d5-2d934f9f1fe4",
  searchRunId: "2c84ec06-06db-4ea7-a3b9-9c9a9a1ae8c9",
  conversationId: "0d7f79db-0033-4f58-9364-682359223f8a",
  status: "empty",
  brief: { original: "Dubai apartment", normalized: "Dubai", criteria: [], source: "text" },
  entities: { properties: {} },
  blocks: [{ type: "no_results", title: "No exact residence yet", suggestions: ["Add a budget"] }],
  sourceSummary: { publishedCount: 0, illustrativeCount: 0, staleCount: 0, label: "0 illustrative residences" },
  suggestedActions: [{ id: "refine", label: "Refine one criterion" }],
};

describe("ephemeral demo search store", () => {
  beforeEach(() => resetDemoSearchStoreForTests());
  afterEach(() => vi.unstubAllEnvs());

  it("restores a route only for the buyer that confirmed it", () => {
    saveDemoSearch({ buyerTokenHash: "buyer-a", idempotencyKey: "confirmation-key-0001", envelope, currentTime: 1_000 });
    expect(loadDemoSearch(envelope.searchRunId, "buyer-a", 2_000)).toEqual(envelope);
    expect(loadDemoSearch(envelope.searchRunId, "buyer-b", 2_000)).toBeNull();
  });

  it("reuses the same result for a repeated confirmation", () => {
    saveDemoSearch({ buyerTokenHash: "buyer-a", idempotencyKey: "confirmation-key-0001", envelope, currentTime: 1_000 });
    expect(readDemoSearchByConfirmation({
      buyerTokenHash: "buyer-a",
      idempotencyKey: "confirmation-key-0001",
      currentTime: 2_000,
    })).toEqual(envelope);
  });

  it("expires process-memory results after the bounded demo window", () => {
    saveDemoSearch({ buyerTokenHash: "buyer-a", idempotencyKey: "confirmation-key-0001", envelope, currentTime: 1_000 });
    expect(loadDemoSearch(envelope.searchRunId, "buyer-a", 31 * 60 * 1_000)).toBeNull();
  });

  it("lists and deletes only the current buyer's demo decision rooms", () => {
    const secondEnvelope = { ...structuredClone(envelope), searchRunId: "3c84ec06-06db-4ea7-a3b9-9c9a9a1ae8c9" };
    saveDemoSearch({ buyerTokenHash: "buyer-a", idempotencyKey: "confirmation-key-0001", envelope, currentTime: 1_000 });
    saveDemoSearch({ buyerTokenHash: "buyer-b", idempotencyKey: "confirmation-key-0002", envelope: secondEnvelope, currentTime: 2_000 });

    expect(listDemoSearchesForBuyer("buyer-a", 3_000)).toEqual([envelope]);
    expect(deleteDemoSearchesForBuyer("buyer-a", 3_000)).toBe(1);
    expect(listDemoSearchesForBuyer("buyer-a", 3_000)).toEqual([]);
    expect(listDemoSearchesForBuyer("buyer-b", 3_000)).toEqual([secondEnvelope]);
  });

  it("restores a file-backed record in a new module context without rewriting it", async () => {
    const storePath = join(tmpdir(), `rama-demo-search-store-${crypto.randomUUID()}.json`);
    vi.stubEnv("RAMA_DEMO_STORE_PATH", storePath);
    vi.resetModules();

    const writer = await import("@/lib/demo-search-store");
    writer.saveDemoSearch({
      buyerTokenHash: "buyer-a",
      idempotencyKey: "confirmation-key-0001",
      envelope,
      currentTime: 1_000,
    });
    expect(existsSync(storePath)).toBe(true);
    const writtenAt = statSync(storePath, { bigint: true }).mtimeNs;

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    vi.resetModules();
    const routeWorker = await import("@/lib/demo-search-store");
    expect(routeWorker.loadDemoSearch(envelope.searchRunId, "buyer-a", 2_000)).toEqual(envelope);
    expect(statSync(storePath, { bigint: true }).mtimeNs).toBe(writtenAt);

    routeWorker.resetDemoSearchStoreForTests();
  });
});
