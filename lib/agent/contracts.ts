import type { Tool } from "@google/genai";
import { isBuyerDecisionEnvelope, type BuyerDecisionEnvelopeV1 } from "@/lib/agent/buyer-contracts";
import { isPreparedBrief, type PreparedBrief } from "@/lib/brief-confirmation";
import type { SampleProperty } from "@/lib/sample-properties";
import { isAllowedPropertyImageUrl } from "@/lib/property-image";
import geminiLiveToolManifest from "./gemini-live-tools.json";

export type PropertyGridBlock = { type: "property_grid"; title: string; summary: string; propertyIds: string[] };
export type PropertyDetailBlock = { type: "property_detail"; property: SampleProperty; sourceLabel: string; availability: "illustrative" | "available" };
export type ComparisonBlock = { type: "comparison"; title: string; properties: SampleProperty[] };
export type PaymentScheduleBlock = {
  type: "payment_schedule";
  propertyId: string;
  title: string;
  currency: string;
  installments: Array<{ label: string; percentage: number; dueEvent: string | null; dueOffsetMonths: number | null }>;
  sourceLabel: string;
  observedAt: string | null;
};
export type PurchaseScenarioBlock = {
  type: "purchase_scenario";
  propertyId: string;
  title: string;
  currency: "AED";
  propertyPrice: number;
  assumptions: { downPaymentPercent: number; annualInterestPercent: number | null; termYears: number | null; expectedAnnualRent: number | null; vacancyPercent: number | null };
  outputs: { downPaymentAmount: number; financeAmount: number; estimatedMonthlyPayment: number | null; grossYieldPercent: number | null };
  disclaimer: string;
};
export type FloorPlanBlock = { type: "floor_plan"; propertyId: string; title: string; imageUrl: string; imageAlt: string; beds: number | null; baths: number | null; areaSqFt: number | null; sourceLabel?: string };
export type DocumentListBlock = { type: "document_list"; propertyId: string; title: string; documents: Array<{ id: string; type: string; title: string; url: string; mimeType: string; sourceLabel: string; observedAt: string; version: number }> };
export type DevelopmentDetailBlock = { type: "development_detail"; propertyId: string; title: string; developerName: string | null; community: string; completionStatus: string; description: string | null; sourceLabel: string; observedAt: string | null };
export type AreaContextBlock = { type: "area_context"; location: string; title: string; summary: string | null; sourceLabel: string; observedAt: string | null };
export type ClarificationBlock = { type: "clarification"; question: string; missingFields: string[] };
export type NoResultsBlock = { type: "no_results"; title: string; explanation: string; suggestions: string[] };
export type HumanHandoffBlock = { type: "human_handoff"; title: string; reason: string; propertyId?: string; requiresConsent: true };

export type AgentBlock =
  | PropertyGridBlock
  | PropertyDetailBlock
  | ComparisonBlock
  | PaymentScheduleBlock
  | PurchaseScenarioBlock
  | FloorPlanBlock
  | DocumentListBlock
  | DevelopmentDetailBlock
  | AreaContextBlock
  | ClarificationBlock
  | NoResultsBlock
  | HumanHandoffBlock;

export const agentToolNames = [
  "prepare_brief",
  "get_property_details",
  "compare_properties",
  "get_payment_schedule",
  "calculate_purchase_scenario",
  "get_floor_plans",
  "get_property_documents",
  "get_development_details",
  "get_area_context",
  "prepare_advisor_handoff",
] as const;

export type AgentToolName = (typeof agentToolNames)[number];
export type AgentToolResponse = {
  ok: boolean;
  tool: AgentToolName;
  correlationId: string;
  summary: string;
  blocks: AgentBlock[];
  decisionEnvelope?: BuyerDecisionEnvelopeV1;
  preparedBrief?: PreparedBrief;
  error?: string;
};

export function isAgentToolName(value: unknown): value is AgentToolName {
  return typeof value === "string" && agentToolNames.includes(value as AgentToolName);
}

export function propertySearchBlocks(options: { properties: SampleProperty[]; summary: string }): AgentBlock[] {
  if (!options.properties.length) return [{ type: "no_results", title: "No exact residence yet", explanation: options.summary, suggestions: ["Increase the maximum budget", "Review a nearby community", "Relax one lifestyle preference"] }];
  return [{ type: "property_grid", title: "Residences shaped by this brief", summary: options.summary, propertyIds: options.properties.map((property) => property.id) }];
}

export const geminiLiveTools = geminiLiveToolManifest as Tool[];

function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function strings(value: unknown): value is string[] { return Array.isArray(value) && value.every((item) => typeof item === "string"); }
function finite(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function sample(value: unknown): value is SampleProperty {
  if (!record(value)) return false;
  return typeof value.id === "string" && typeof value.name === "string" && typeof value.location === "string" && typeof value.price === "string"
    && finite(value.beds) && finite(value.baths) && typeof value.area === "string" && typeof value.feature === "string" && typeof value.match === "string"
    && typeof value.image === "string" && isAllowedPropertyImageUrl(value.image) && typeof value.imageAlt === "string";
}

export function parseAgentToolArguments(tool: AgentToolName, value: unknown): { ok: true; args: Record<string, unknown> } | { ok: false; error: string } {
  if (!record(value)) return { ok: false, error: "Tool arguments must be an object." };
  const keys = Object.keys(value);
  const only = (...allowed: string[]) => keys.every((key) => allowed.includes(key));
  const validId = (item: unknown) => typeof item === "string" && item.trim().length >= 2 && item.length <= 200;
  if (tool === "prepare_brief" && only("brief", "source") && typeof value.brief === "string" && value.brief.trim().length >= 3 && value.brief.length <= 500) return { ok: true, args: { brief: value.brief.trim(), source: "voice" } };
  if (["get_property_details", "get_payment_schedule", "get_floor_plans", "get_property_documents", "get_development_details"].includes(tool) && only("propertyId") && validId(value.propertyId)) return { ok: true, args: { propertyId: (value.propertyId as string).trim() } };
  if (tool === "compare_properties" && only("propertyIds") && Array.isArray(value.propertyIds) && value.propertyIds.length >= 2 && value.propertyIds.length <= 3 && value.propertyIds.every(validId)) return { ok: true, args: { propertyIds: value.propertyIds.map((id) => (id as string).trim()) } };
  if (tool === "get_area_context" && only("location") && typeof value.location === "string" && value.location.trim().length >= 2 && value.location.length <= 120) return { ok: true, args: { location: value.location.trim() } };
  if (tool === "prepare_advisor_handoff" && only("propertyId", "reason") && (value.propertyId === undefined || validId(value.propertyId)) && typeof value.reason === "string" && value.reason.trim().length >= 3 && value.reason.length <= 240) return { ok: true, args: { propertyId: typeof value.propertyId === "string" ? value.propertyId.trim() : undefined, reason: value.reason.trim() } };
  if (tool === "calculate_purchase_scenario" && only("propertyId", "downPaymentPercent", "annualInterestPercent", "termYears", "expectedAnnualRent", "vacancyPercent") && validId(value.propertyId) && finite(value.downPaymentPercent) && value.downPaymentPercent >= 5 && value.downPaymentPercent <= 100) {
    const numeric = ["annualInterestPercent", "termYears", "expectedAnnualRent", "vacancyPercent"] as const;
    if (numeric.some((key) => value[key] !== undefined && value[key] !== null && !finite(value[key]))) return { ok: false, error: "Purchase assumptions must be finite numbers." };
    return { ok: true, args: { ...value, propertyId: (value.propertyId as string).trim() } };
  }
  return { ok: false, error: `Invalid arguments for ${tool}.` };
}

export function isAgentBlock(value: unknown): value is AgentBlock {
  if (!record(value) || typeof value.type !== "string") return false;
  switch (value.type) {
    case "property_grid": return typeof value.title === "string" && typeof value.summary === "string" && strings(value.propertyIds);
    case "property_detail": return sample(value.property) && typeof value.sourceLabel === "string" && (value.availability === "illustrative" || value.availability === "available");
    case "comparison": return typeof value.title === "string" && Array.isArray(value.properties) && value.properties.length >= 2 && value.properties.length <= 3 && value.properties.every(sample);
    case "payment_schedule": return typeof value.propertyId === "string" && typeof value.title === "string" && typeof value.currency === "string" && Array.isArray(value.installments) && typeof value.sourceLabel === "string";
    case "purchase_scenario": return typeof value.propertyId === "string" && typeof value.title === "string" && value.currency === "AED" && finite(value.propertyPrice) && record(value.assumptions) && record(value.outputs) && typeof value.disclaimer === "string";
    case "floor_plan": return typeof value.propertyId === "string" && typeof value.title === "string" && typeof value.imageUrl === "string" && isAllowedPropertyImageUrl(value.imageUrl) && typeof value.imageAlt === "string";
    case "document_list": return typeof value.propertyId === "string" && typeof value.title === "string" && Array.isArray(value.documents);
    case "development_detail": return typeof value.propertyId === "string" && typeof value.title === "string" && typeof value.community === "string" && typeof value.completionStatus === "string" && typeof value.sourceLabel === "string";
    case "area_context": return typeof value.location === "string" && typeof value.title === "string" && typeof value.sourceLabel === "string";
    case "clarification": return typeof value.question === "string" && strings(value.missingFields);
    case "no_results": return typeof value.title === "string" && typeof value.explanation === "string" && strings(value.suggestions);
    case "human_handoff": return typeof value.title === "string" && typeof value.reason === "string" && value.requiresConsent === true;
    default: return false;
  }
}

export function isAgentToolResponse(value: unknown): value is AgentToolResponse {
  if (!record(value)) return false;
  return typeof value.ok === "boolean" && isAgentToolName(value.tool) && typeof value.correlationId === "string" && typeof value.summary === "string" && Array.isArray(value.blocks) && value.blocks.every(isAgentBlock)
    && (value.decisionEnvelope === undefined || isBuyerDecisionEnvelope(value.decisionEnvelope))
    && (value.preparedBrief === undefined || isPreparedBrief(value.preparedBrief));
}
