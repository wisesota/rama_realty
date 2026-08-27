import type { BuyerCriterion } from "@/lib/agent/buyer-contracts";
import { parsePropertyBrief, type PropertySearchSource } from "@/lib/property-search";

export type PreparedBrief = {
  schemaVersion: "1";
  draftId: string;
  source: PropertySearchSource;
  transcript: string;
  criteria: BuyerCriterion[];
  missingFields: string[];
  advisoryBoundaries?: AdvisoryBoundary[];
  contradictions?: BriefContradiction[];
};

export const advisoryBoundaries = ["legal", "tax", "mortgage", "guaranteed_return", "live_availability"] as const;
export type AdvisoryBoundary = (typeof advisoryBoundaries)[number];

export type BriefContradiction = {
  code: "property_type_conflict" | "delivery_state_conflict";
  message: string;
};

const hardLabels = /^(Dubai|Palm|Jumeirah|Downtown|Up to AED|\d+ bedrooms?|Apartment|Villa|Townhouse|Penthouse)/i;

function criterionKey(label: string, index: number) {
  const normalized = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return normalized || `criterion_${index + 1}`;
}

function detectAdvisoryBoundaries(value: string): AdvisoryBoundary[] {
  const boundaries: Array<[AdvisoryBoundary, RegExp]> = [
    ["legal", /\b(?:legal|law|lawful)\b|قانون|قانوني/i],
    ["tax", /\b(?:tax|taxation)\b|ضريب|ضرائب/i],
    ["mortgage", /\b(?:mortgage|financing|loan)\b|رهن|تمويل|قرض/i],
    ["guaranteed_return", /\b(?:guarantee|guaranteed|appreciat(?:e|ion)|yield)\b|عائد مضمون|ضمان|اضمن/i],
    ["live_availability", /\b(?:available now|live availability|currently available)\b|متاح الآن|التوفر المباشر/i],
  ];
  return boundaries.flatMap(([boundary, pattern]) => pattern.test(value) ? [boundary] : []);
}

function detectContradictions(value: string): BriefContradiction[] {
  const normalized = value.toLowerCase();
  const contradictions: BriefContradiction[] = [];
  if (/\b(?:both|must be both)\b.*\bapartment\b.*\bvilla\b|\b(?:both|must be both)\b.*\bvilla\b.*\bapartment\b/.test(normalized)) {
    contradictions.push({ code: "property_type_conflict", message: "The brief requires incompatible property types and needs buyer clarification." });
  }
  if (/\b(?:both|must be both)\b.*\bready\b.*\boff[ -]?plan\b|\b(?:both|must be both)\b.*\boff[ -]?plan\b.*\bready\b/.test(normalized)) {
    contradictions.push({ code: "delivery_state_conflict", message: "The brief requires both ready and off-plan delivery states and needs buyer clarification." });
  }
  return contradictions;
}

export function prepareBriefDraft(options: {
  brief: string;
  source: PropertySearchSource;
  draftId?: string;
}): PreparedBrief {
  const transcript = options.brief.trim().replace(/\s+/g, " ").slice(0, 500);
  if (transcript.length < 3) throw new Error("Describe the Dubai home or lifestyle you want.");
  const labels = parsePropertyBrief(transcript);
  const criteria = labels.map((label, index) => ({
    key: criterionKey(label, index),
    label,
    value: label,
    kind: hardLabels.test(label) ? "hard" as const : "preference" as const,
  }));
  const hasLocation = criteria.some((criterion) => /dubai|palm|jumeirah|marina|downtown/i.test(criterion.value));
  const hasBudget = criteria.some((criterion) => /AED/i.test(criterion.value));
  return {
    schemaVersion: "1",
    draftId: options.draftId ?? crypto.randomUUID(),
    source: options.source,
    transcript,
    criteria,
    missingFields: [
      ...(!hasLocation ? ["preferred area"] : []),
      ...(!hasBudget ? ["maximum budget"] : []),
    ],
    advisoryBoundaries: detectAdvisoryBoundaries(transcript),
    contradictions: detectContradictions(transcript),
  };
}

export function isPreparedBrief(value: unknown): value is PreparedBrief {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const draft = value as Partial<PreparedBrief>;
  return draft.schemaVersion === "1"
    && typeof draft.draftId === "string"
    && (draft.source === "text" || draft.source === "voice")
    && typeof draft.transcript === "string"
    && Array.isArray(draft.criteria)
    && draft.criteria.every((criterion) => Boolean(criterion)
      && typeof criterion.key === "string"
      && typeof criterion.label === "string"
      && typeof criterion.value === "string"
      && (criterion.kind === "hard" || criterion.kind === "preference"))
    && Array.isArray(draft.missingFields)
    && draft.missingFields.every((field) => typeof field === "string")
    && (draft.advisoryBoundaries === undefined || (Array.isArray(draft.advisoryBoundaries)
      && draft.advisoryBoundaries.every((boundary) => advisoryBoundaries.includes(boundary))))
    && (draft.contradictions === undefined || (Array.isArray(draft.contradictions)
      && draft.contradictions.every((contradiction) => Boolean(contradiction)
        && typeof contradiction.code === "string"
        && typeof contradiction.message === "string")));
}
