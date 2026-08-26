export type SavedBriefHistoryItem = {
  id: string;
  brief: string;
  criteria: string[];
  source: "text" | "voice";
  resultIds: string[];
  createdAt: string;
};

export type SavedBriefHistoryResponse = {
  authenticated: boolean;
  briefs: SavedBriefHistoryItem[];
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function isSavedBriefHistoryResponse(value: unknown): value is SavedBriefHistoryResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const response = value as Partial<SavedBriefHistoryResponse>;
  return typeof response.authenticated === "boolean"
    && Array.isArray(response.briefs)
    && response.briefs.every((brief) => Boolean(brief)
      && typeof brief === "object"
      && typeof brief.id === "string"
      && typeof brief.brief === "string"
      && isStringArray(brief.criteria)
      && (brief.source === "text" || brief.source === "voice")
      && isStringArray(brief.resultIds)
      && typeof brief.createdAt === "string");
}

export function comparisonPropertyIds(
  briefs: SavedBriefHistoryItem[],
  selectedBriefIds: string[],
  maximumProperties = 3,
) {
  const selected = new Set(selectedBriefIds);
  const unique = new Set<string>();
  for (const brief of briefs) {
    if (!selected.has(brief.id)) continue;
    for (const propertyId of brief.resultIds) {
      unique.add(propertyId);
      if (unique.size >= maximumProperties) return [...unique];
    }
  }
  return [...unique];
}
