import "server-only";

import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { BuyerDecisionEnvelope } from "@/lib/agent/buyer-contracts";

type DemoSearchRecord = {
  buyerTokenHash: string;
  idempotencyKey: string;
  envelope: BuyerDecisionEnvelope;
  createdAt: number;
  expiresAt: number;
};

type DemoSearchState = {
  bySearchRun: Map<string, DemoSearchRecord>;
  byConfirmation: Map<string, string>;
};

const demoSearchTtlMs = 30 * 60 * 1_000;
const maximumDemoSearches = 100;
const globalDemoState = globalThis as typeof globalThis & { __ramaDemoSearchState?: DemoSearchState };
const demoStorePath = process.env.RAMA_DEMO_STORE_PATH?.trim();

function emptyState(): DemoSearchState {
  return { bySearchRun: new Map(), byConfirmation: new Map() };
}

function readFileState(): DemoSearchState {
  if (!demoStorePath) return emptyState();
  try {
    const parsed = JSON.parse(readFileSync(demoStorePath, "utf8")) as { records?: DemoSearchRecord[] };
    const records = Array.isArray(parsed.records) ? parsed.records : [];
    return {
      bySearchRun: new Map(records.map((record) => [record.envelope.searchRunId, record])),
      byConfirmation: new Map(records.map((record) => [confirmationKey(record.buyerTokenHash, record.idempotencyKey), record.envelope.searchRunId])),
    };
  } catch {
    return emptyState();
  }
}

function persist(current: DemoSearchState) {
  if (!demoStorePath) return;
  const temporaryPath = `${demoStorePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, JSON.stringify({ records: [...current.bySearchRun.values()] }), "utf8");
    renameSync(temporaryPath, demoStorePath);
  } catch (error) {
    try {
      unlinkSync(temporaryPath);
    } catch {
      // The atomic rename may already have consumed the temporary file.
    }
    throw error;
  }
}

function state() {
  if (demoStorePath) return readFileState();
  globalDemoState.__ramaDemoSearchState ??= emptyState();
  return globalDemoState.__ramaDemoSearchState;
}

function confirmationKey(buyerTokenHash: string, idempotencyKey: string) {
  return `${buyerTokenHash}:${idempotencyKey}`;
}

function prune(currentTime: number) {
  const current = state();
  let changed = false;
  for (const [searchRunId, record] of current.bySearchRun) {
    if (record.expiresAt > currentTime) continue;
    current.bySearchRun.delete(searchRunId);
    current.byConfirmation.delete(confirmationKey(record.buyerTokenHash, record.idempotencyKey));
    changed = true;
  }
  while (current.bySearchRun.size >= maximumDemoSearches) {
    const oldest = [...current.bySearchRun.entries()].sort((left, right) => left[1].createdAt - right[1].createdAt)[0];
    if (!oldest) break;
    current.bySearchRun.delete(oldest[0]);
    current.byConfirmation.delete(confirmationKey(oldest[1].buyerTokenHash, oldest[1].idempotencyKey));
    changed = true;
  }
  if (changed) persist(current);
  return current;
}

export function readDemoSearchByConfirmation(options: {
  buyerTokenHash: string;
  idempotencyKey: string;
  currentTime?: number;
}) {
  const currentTime = options.currentTime ?? Date.now();
  const current = prune(currentTime);
  const searchRunId = current.byConfirmation.get(confirmationKey(options.buyerTokenHash, options.idempotencyKey));
  if (!searchRunId) return null;
  return loadDemoSearch(searchRunId, options.buyerTokenHash, currentTime);
}

export function saveDemoSearch(options: {
  buyerTokenHash: string;
  idempotencyKey: string;
  envelope: BuyerDecisionEnvelope;
  currentTime?: number;
}) {
  const currentTime = options.currentTime ?? Date.now();
  const current = prune(currentTime);
  const record: DemoSearchRecord = {
    buyerTokenHash: options.buyerTokenHash,
    idempotencyKey: options.idempotencyKey,
    envelope: structuredClone(options.envelope),
    createdAt: currentTime,
    expiresAt: currentTime + demoSearchTtlMs,
  };
  current.bySearchRun.set(options.envelope.searchRunId, record);
  current.byConfirmation.set(
    confirmationKey(options.buyerTokenHash, options.idempotencyKey),
    options.envelope.searchRunId,
  );
  persist(current);
  return structuredClone(record.envelope);
}

export function loadDemoSearch(searchRunId: string, buyerTokenHash: string, currentTime = Date.now()) {
  const record = prune(currentTime).bySearchRun.get(searchRunId);
  if (!record || record.buyerTokenHash !== buyerTokenHash) return null;
  return structuredClone(record.envelope);
}

export function listDemoSearchesForBuyer(buyerTokenHash: string, currentTime = Date.now()) {
  return [...prune(currentTime).bySearchRun.values()]
    .filter((record) => record.buyerTokenHash === buyerTokenHash)
    .sort((left, right) => left.createdAt - right.createdAt)
    .map((record) => structuredClone(record.envelope));
}

export function deleteDemoSearchesForBuyer(buyerTokenHash: string, currentTime = Date.now()) {
  const current = prune(currentTime);
  let deleted = 0;
  for (const [searchRunId, record] of current.bySearchRun) {
    if (record.buyerTokenHash !== buyerTokenHash) continue;
    current.bySearchRun.delete(searchRunId);
    current.byConfirmation.delete(confirmationKey(record.buyerTokenHash, record.idempotencyKey));
    deleted += 1;
  }
  persist(current);
  return deleted;
}

export function resetDemoSearchStoreForTests() {
  globalDemoState.__ramaDemoSearchState = undefined;
  if (demoStorePath) {
    try {
      unlinkSync(demoStorePath);
    } catch {
      // The isolated demo store may not have been created yet.
    }
  }
}
