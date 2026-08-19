import type { BuyerPropertySummary } from "@/lib/agent/buyer-contracts";

export type CandidateSnapshot = {
  propertyId: string;
  propertyVersion: number;
  sourceObservedAt: string | null;
};

export function summarizeCatalogRestoration(
  candidates: CandidateSnapshot[],
  current: BuyerPropertySummary[],
) {
  const currentById = new Map(current.map((property) => [property.id, property]));
  let removedCount = 0;
  let changedCount = 0;

  for (const candidate of candidates) {
    const property = currentById.get(candidate.propertyId);
    if (!property) {
      removedCount += 1;
      continue;
    }
    if (
      property.provenance.version !== candidate.propertyVersion
      || property.provenance.observedAt !== candidate.sourceObservedAt
    ) {
      changedCount += 1;
    }
  }

  return { removedCount, changedCount };
}
