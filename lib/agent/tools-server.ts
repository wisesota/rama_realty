import "server-only";

import type { BuyerPropertySummary } from "@/lib/agent/buyer-contracts";
import {
  type AgentBlock,
  type AgentToolName,
  type AgentToolResponse,
} from "@/lib/agent/contracts";
import { CatalogUnavailableError, PublicCatalogRepository } from "@/lib/public-catalog-repository";
import type { SampleProperty } from "@/lib/sample-properties";
import { prepareBriefDraft } from "@/lib/brief-confirmation";
import { briefConfirmationEnabled } from "@/lib/rollout-server";

export type AgentToolContext = {
  correlationId: string;
  buyerTokenHash: string;
  deadline: number;
  signal?: AbortSignal;
};

function formatAed(value: number) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value).replace(/\s+/g, " ");
}

function textArg(args: Record<string, unknown>, name: string) {
  return typeof args[name] === "string" ? (args[name] as string).trim() : "";
}

function toSample(property: BuyerPropertySummary): SampleProperty {
  return {
    id: property.id,
    name: property.name,
    location: property.location,
    price: formatAed(property.price.amount),
    beds: property.beds,
    baths: property.baths,
    area: `${property.area.value.toLocaleString("en-AE")} sq ft`,
    feature: property.feature,
    match: property.matchReason,
    image: property.image.url,
    imageAlt: property.image.alt,
  };
}

function errorResult(tool: AgentToolName, correlationId: string, error: string): AgentToolResponse {
  return { ok: false, tool, correlationId, summary: error, error, blocks: [] };
}

function noResult(tool: AgentToolName, correlationId: string, title: string, explanation: string): AgentToolResponse {
  return { ok: true, tool, correlationId, summary: explanation, blocks: [{ type: "no_results", title, explanation, suggestions: ["Ask about another visible property", "Request a Rama advisor after reviewing consent"] }] };
}

async function prepareBrief(args: Record<string, unknown>, context: AgentToolContext): Promise<AgentToolResponse> {
  if (!briefConfirmationEnabled()) {
    return errorResult("prepare_brief", context.correlationId, "Brief confirmation is temporarily unavailable.");
  }
  const brief = textArg(args, "brief");
  const preparedBrief = prepareBriefDraft({ brief, source: "voice" });
  const summary = "The written brief is ready for the buyer to review. No search has been saved.";
  return {
    ok: true,
    tool: "prepare_brief",
    correlationId: context.correlationId,
    summary,
    blocks: [],
    preparedBrief,
  };
}

async function propertyDetails(args: Record<string, unknown>, correlationId: string) {
  const property = await new PublicCatalogRepository().getProperty(textArg(args, "propertyId"));
  if (!property) return errorResult("get_property_details", correlationId, "That property is no longer visible in Rama's governed catalog.");
  const block: AgentBlock = {
    type: "property_detail",
    property: toSample(property),
    sourceLabel: `${property.provenance.sourceName}${property.provenance.observedAt ? ` · observed ${property.provenance.observedAt.slice(0, 10)}` : ""}`,
    availability: property.provenance.kind === "illustrative" ? "illustrative" : "available",
  };
  return { ok: true, tool: "get_property_details", correlationId, summary: `${property.name} is open in the decision room with governed facts and source context.`, blocks: [block] } satisfies AgentToolResponse;
}

async function compareProperties(args: Record<string, unknown>, correlationId: string) {
  const ids = [...new Set((args.propertyIds as string[]) ?? [])].slice(0, 3);
  const properties = await new PublicCatalogRepository().getProperties(ids);
  if (properties.length < 2) return errorResult("compare_properties", correlationId, "At least two selected properties must still be publicly eligible.");
  return {
    ok: true,
    tool: "compare_properties",
    correlationId,
    summary: `${properties.length} residences are compared across the same published price, size, completion, and source fields.`,
    blocks: [{ type: "comparison", title: "Evidence-led comparison", properties: properties.map(toSample) }],
  } satisfies AgentToolResponse;
}

async function paymentSchedule(args: Record<string, unknown>, correlationId: string) {
  const propertyId = textArg(args, "propertyId");
  const schedule = await new PublicCatalogRepository().getPaymentSchedule(propertyId);
  if (!schedule) return noResult("get_payment_schedule", correlationId, "Payment schedule not published", "Rama will not infer an official developer schedule that is absent from the CRM.");
  return {
    ok: true,
    tool: "get_payment_schedule",
    correlationId,
    summary: `${schedule.name} is the current published payment schedule.`,
    blocks: [{
      type: "payment_schedule",
      propertyId,
      title: schedule.name,
      currency: schedule.currency,
      installments: schedule.installments.map((item) => ({ label: item.label, percentage: Number(item.percentage), dueEvent: item.due_event, dueOffsetMonths: item.due_offset_months })),
      sourceLabel: schedule.source_name ?? "Rama governed catalog",
      observedAt: schedule.source_updated_at,
    }],
  } satisfies AgentToolResponse;
}

function optionalNumber(args: Record<string, unknown>, key: string) {
  return typeof args[key] === "number" && Number.isFinite(args[key]) ? args[key] as number : null;
}

async function purchaseScenario(args: Record<string, unknown>, correlationId: string) {
  const propertyId = textArg(args, "propertyId");
  const property = await new PublicCatalogRepository().getProperty(propertyId);
  if (!property) return errorResult("calculate_purchase_scenario", correlationId, "That property is no longer publicly eligible.");
  const downPaymentPercent = args.downPaymentPercent as number;
  const annualInterestPercent = optionalNumber(args, "annualInterestPercent");
  const termYears = optionalNumber(args, "termYears");
  const expectedAnnualRent = optionalNumber(args, "expectedAnnualRent");
  const vacancyPercent = optionalNumber(args, "vacancyPercent");
  const downPaymentAmount = Math.round(property.price.amount * downPaymentPercent / 100);
  const financeAmount = property.price.amount - downPaymentAmount;
  let estimatedMonthlyPayment: number | null = null;
  if (annualInterestPercent !== null && termYears !== null && termYears > 0) {
    const monthlyRate = annualInterestPercent / 100 / 12;
    const months = Math.round(termYears * 12);
    estimatedMonthlyPayment = monthlyRate === 0
      ? Math.round(financeAmount / months)
      : Math.round(financeAmount * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1));
  }
  const effectiveRent = expectedAnnualRent === null ? null : expectedAnnualRent * (1 - (vacancyPercent ?? 0) / 100);
  const grossYieldPercent = effectiveRent === null ? null : Math.round(effectiveRent / property.price.amount * 10_000) / 100;
  return {
    ok: true,
    tool: "calculate_purchase_scenario",
    correlationId,
    summary: `A transparent scenario is ready for ${property.name}; every variable remains editable and separate from published facts.`,
    blocks: [{
      type: "purchase_scenario",
      propertyId,
      title: `${property.name} · buyer scenario`,
      currency: "AED",
      propertyPrice: property.price.amount,
      assumptions: { downPaymentPercent, annualInterestPercent, termYears, expectedAnnualRent, vacancyPercent },
      outputs: { downPaymentAmount, financeAmount, estimatedMonthlyPayment, grossYieldPercent },
      disclaimer: "Illustrative calculation from buyer-selected assumptions. It is not a developer offer, valuation, mortgage approval, legal, tax, or financial advice.",
    }],
  } satisfies AgentToolResponse;
}

async function floorPlans(args: Record<string, unknown>, correlationId: string) {
  const propertyId = textArg(args, "propertyId");
  const plans = await new PublicCatalogRepository().getFloorPlans(propertyId);
  if (!plans.length) return noResult("get_floor_plans", correlationId, "Floor plan not published", "No governed floor-plan media is attached to this property.");
  return {
    ok: true,
    tool: "get_floor_plans",
    correlationId,
    summary: `${plans.length} published ${plans.length === 1 ? "floor plan is" : "floor plans are"} available.`,
    blocks: plans.map((plan) => ({ type: "floor_plan" as const, propertyId, title: plan.name, imageUrl: plan.image_url, imageAlt: plan.image_alt, beds: plan.beds, baths: plan.baths, areaSqFt: plan.area_sq_ft, sourceLabel: plan.source_name ?? "Rama governed catalog" })),
  } satisfies AgentToolResponse;
}

async function documents(args: Record<string, unknown>, correlationId: string) {
  const propertyId = textArg(args, "propertyId");
  const items = await new PublicCatalogRepository().getDocuments(propertyId);
  if (!items.length) return noResult("get_property_documents", correlationId, "Documents not published", "No governed property documents are attached to this residence.");
  return {
    ok: true,
    tool: "get_property_documents",
    correlationId,
    summary: `${items.length} governed ${items.length === 1 ? "document is" : "documents are"} available for review.`,
    blocks: [{ type: "document_list", propertyId, title: "Published property documents", documents: items.map((item) => ({ id: item.id, type: item.document_type, title: item.title, url: item.file_url, mimeType: item.mime_type, sourceLabel: item.source_name, observedAt: item.source_updated_at, version: item.version })) }],
  } satisfies AgentToolResponse;
}

async function development(args: Record<string, unknown>, correlationId: string) {
  const propertyId = textArg(args, "propertyId");
  const item = await new PublicCatalogRepository().getDevelopment(propertyId);
  if (!item) return noResult("get_development_details", correlationId, "Development details not published", "No governed development dossier is attached to this property.");
  return {
    ok: true,
    tool: "get_development_details",
    correlationId,
    summary: `${item.name} development facts are ready for review.`,
    blocks: [{ type: "development_detail", propertyId, title: item.name, developerName: item.developer_name, community: item.community, completionStatus: item.completion_status, description: item.description, sourceLabel: item.source_name ?? "Rama governed catalog", observedAt: item.source_updated_at }],
  } satisfies AgentToolResponse;
}

async function areaContext(args: Record<string, unknown>, correlationId: string) {
  const location = textArg(args, "location");
  const item = await new PublicCatalogRepository().getAreaContext(location);
  if (!item) return noResult("get_area_context", correlationId, "Area guide not published", `Rama has no governed area guide for ${location} yet.`);
  return {
    ok: true,
    tool: "get_area_context",
    correlationId,
    summary: `${item.title} is available from Rama's published editorial catalog.`,
    blocks: [{ type: "area_context", location, title: item.title, summary: item.summary, sourceLabel: item.source_name ?? "Rama governed area guide", observedAt: item.source_updated_at }],
  } satisfies AgentToolResponse;
}

function handoff(args: Record<string, unknown>, correlationId: string): AgentToolResponse {
  const propertyId = textArg(args, "propertyId") || undefined;
  const reason = textArg(args, "reason");
  return { ok: true, tool: "prepare_advisor_handoff", correlationId, summary: "The advisor request is ready for the buyer to review. No contact data has been shared.", blocks: [{ type: "human_handoff", title: "Review before sharing", reason, propertyId, requiresConsent: true }] };
}

export async function runAgentTool(tool: AgentToolName, args: Record<string, unknown>, context: AgentToolContext): Promise<AgentToolResponse> {
  try {
    switch (tool) {
      case "prepare_brief": return await prepareBrief(args, context);
      case "get_property_details": return await propertyDetails(args, context.correlationId);
      case "compare_properties": return await compareProperties(args, context.correlationId);
      case "get_payment_schedule": return await paymentSchedule(args, context.correlationId);
      case "calculate_purchase_scenario": return await purchaseScenario(args, context.correlationId);
      case "get_floor_plans": return await floorPlans(args, context.correlationId);
      case "get_property_documents": return await documents(args, context.correlationId);
      case "get_development_details": return await development(args, context.correlationId);
      case "get_area_context": return await areaContext(args, context.correlationId);
      case "prepare_advisor_handoff": return handoff(args, context.correlationId);
    }
  } catch (error) {
    if (error instanceof CatalogUnavailableError) return errorResult(tool, context.correlationId, error.message);
    console.error("Agent tool failed:", tool, error instanceof Error ? error.name : "UnknownError");
    return errorResult(tool, context.correlationId, "The governed property service is temporarily unavailable.");
  }
}
