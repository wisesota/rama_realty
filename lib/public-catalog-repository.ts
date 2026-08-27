import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import type { BuyerCriterion, BuyerPropertySummary } from "@/lib/agent/buyer-contracts";
import { createPublicCatalogClient } from "@/lib/supabase/public";
import { extractHardConstraints, parsePropertyBrief } from "@/lib/property-search";
import { sampleProperties } from "@/lib/sample-properties";

type PublicPropertyRow = Database["public"]["Views"]["public_property_catalog"]["Row"];

export class CatalogUnavailableError extends Error {
  constructor(message = "The governed property catalog is temporarily unavailable.") {
    super(message);
    this.name = "CatalogUnavailableError";
  }
}

function required<T>(value: T | null, field: string): T {
  if (value === null || value === undefined) throw new CatalogUnavailableError(`Catalog row is missing ${field}.`);
  return value;
}

function normalizeTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !["the", "and", "with", "for", "under", "from", "dubai"].includes(token));
}

function mapProperty(row: PublicPropertyRow, reason?: string): BuyerPropertySummary {
  const status = required(row.status, "status");
  if (status !== "illustrative" && status !== "live") {
    throw new CatalogUnavailableError("Catalog row has an unsupported publication status.");
  }
  const isIllustrative = status === "illustrative";
  if ((isIllustrative && row.organization_id !== null) || (!isIllustrative && row.organization_id === null)) {
    throw new CatalogUnavailableError("Catalog row has inconsistent provenance ownership.");
  }
  return {
    id: required(row.id, "id"),
    organizationId: row.organization_id,
    developmentId: row.development_id,
    slug: row.slug,
    name: required(row.name, "name"),
    location: required(row.location, "location"),
    description: row.description,
    propertyType: required(row.property_type, "property type"),
    completionStatus: required(row.completion_status, "completion status"),
    availabilityStatus: required(row.availability_status, "availability status"),
    price: { amount: required(row.price_aed, "price"), currency: "AED" },
    beds: required(row.beds, "beds"),
    baths: required(row.baths, "baths"),
    area: { value: required(row.area_sq_ft, "area"), unit: "sq_ft" },
    feature: required(row.feature, "feature"),
    matchReason: reason ?? required(row.match_reason, "match reason"),
    image: { url: required(row.image_url, "image URL"), alt: required(row.image_alt, "image alt") },
    amenities: row.amenities ?? [],
    views: row.view_types ?? [],
    furnishingStatus: row.furnishing_status,
    tenure: row.tenure,
    handoverAt: row.handover_at,
    serviceChargeAed: row.service_charge_aed,
    provenance: {
      kind: isIllustrative ? "illustrative" : "published",
      sourceName: row.source_name ?? (isIllustrative ? "Rama demonstration catalog" : "Rama governed catalog"),
      observedAt: row.source_updated_at,
      publishedAt: row.published_at,
      version: required(row.version, "version"),
    },
  };
}

function criterionList(brief: string): BuyerCriterion[] {
  const hard = extractHardConstraints(brief);
  const labels = parsePropertyBrief(brief);
  return labels.map((label, index) => {
    const isLocation = Boolean(hard.location && label === hard.location);
    const isBedrooms = Boolean(hard.bedrooms !== undefined && label.startsWith(String(hard.bedrooms)));
    const isBudget = Boolean(hard.maximumPriceAed !== undefined && label.startsWith("Up to"));

    const hardCriterion = isLocation || isBedrooms || isBudget;
    const key = isLocation
      ? "location"
      : isBedrooms
        ? "bedrooms"
        : isBudget
          ? "budget"
          : ["Penthouse", "Villa", "Townhouse", "Apartment"].includes(label)
            ? "property-type"
            : label === "Flexible Dubai brief"
              ? "flexible"
              : `lifestyle-${index + 1}`;
    return { key, label, value: label, kind: hardCriterion ? "hard" : "preference" };
  });
}

function rankRow(row: PublicPropertyRow, brief: string) {
  const briefTokens = new Set(normalizeTokens(brief));
  const location = row.location ?? "";
  const searchable = [
    location,
    row.property_type ?? "",
    row.feature ?? "",
    row.match_reason ?? "",
    ...(row.amenities ?? []),
    ...(row.view_types ?? []),
  ];
  const matches = [...new Set(searchable.flatMap(normalizeTokens).filter((token) => briefTokens.has(token)))];
  const locationMatch = brief.toLowerCase().includes(location.toLowerCase());
  const score = Math.min(1, (locationMatch ? 0.42 : 0.08) + matches.length * 0.09);
  const reason = matches.length
    ? `Strong alignment on ${matches.slice(0, 3).join(", ")}.`
    : row.match_reason ?? "Matches the current hard constraints.";
  return { score, reason };
}

function demoRows(brief: string): Array<{ property: BuyerPropertySummary; score: number; reasons: string[] }> {
  if (process.env.RAMA_DEMO_MODE !== "true") return [];
  return sampleProperties.map((property, index) => ({
    property: {
      id: property.id,
      organizationId: null,
      developmentId: null,
      slug: property.id,
      name: property.name,
      location: property.location,
      description: property.feature,
      propertyType: "apartment",
      completionStatus: "ready",
      availabilityStatus: "illustrative",
      price: { amount: Number.parseInt(property.price.replace(/[^\d]/g, ""), 10), currency: "AED" },
      beds: property.beds,
      baths: property.baths,
      area: { value: Number.parseInt(property.area.replace(/[^\d]/g, ""), 10), unit: "sq_ft" },
      feature: property.feature,
      matchReason: property.match,
      image: { url: property.image, alt: property.imageAlt },
      amenities: [],
      views: [],
      furnishingStatus: null,
      tenure: null,
      handoverAt: null,
      serviceChargeAed: null,
      provenance: { kind: "illustrative", sourceName: "Local Rama demonstration catalog", observedAt: null, publishedAt: null, version: 1 },
    },
    score: Math.max(0.1, 0.75 - index * 0.08),
    reasons: [`Demonstration match for: ${brief.slice(0, 80)}`],
  }));
}

function demoProperties() {
  return demoRows("").map((candidate) => candidate.property);
}

export type PublicSearchResult = {
  criteria: BuyerCriterion[];
  candidates: Array<{ property: BuyerPropertySummary; score: number; reasons: string[] }>;
};

export class PublicCatalogRepository {
  private readonly client = createPublicCatalogClient();

  async search(brief: string): Promise<PublicSearchResult> {
    if (process.env.RAMA_DEMO_MODE === "true") {
      return { criteria: criterionList(brief), candidates: demoRows(brief) };
    }
    const hard = extractHardConstraints(brief);
    let query = this.client.from("public_property_catalog").select("*")
      .order("price_aed", { ascending: true })
      .order("id", { ascending: true });
    if (hard.bedrooms !== undefined) query = query.eq("beds", hard.bedrooms);
    if (hard.maximumPriceAed !== undefined) query = query.lte("price_aed", hard.maximumPriceAed);

    const { data, error } = await query.limit(500);
    if (error) throw new CatalogUnavailableError();
    const rows = data ?? [];
    if (!rows.length) return { criteria: criterionList(brief), candidates: demoRows(brief) };

    const mentionedLocations = rows
      .map((row) => row.location)
      .filter((location): location is string => typeof location === "string" && brief.toLowerCase().includes(location.toLowerCase()));
    const locationFiltered = mentionedLocations.length
      ? rows.filter((row) => row.location && mentionedLocations.includes(row.location))
      : rows;

    const candidates = locationFiltered
      .map((row) => {
        const ranking = rankRow(row, brief);
        return { property: mapProperty(row, ranking.reason), score: ranking.score, reasons: [ranking.reason] };
      })
      .sort((left, right) => right.score - left.score || left.property.price.amount - right.property.price.amount || left.property.id.localeCompare(right.property.id))
      .slice(0, 12);
    return { criteria: criterionList(brief), candidates };
  }

  async getProperty(propertyId: string) {
    if (process.env.RAMA_DEMO_MODE === "true") {
      return demoProperties().find((property) => property.id === propertyId) ?? null;
    }
    const { data, error } = await this.client.from("public_property_catalog").select("*").eq("id", propertyId).maybeSingle();
    if (error) throw new CatalogUnavailableError();
    return data ? mapProperty(data) : null;
  }

  async getProperties(propertyIds: string[]) {
    const uniqueIds = [...new Set(propertyIds)].slice(0, 3);
    if (!uniqueIds.length) return [];
    if (process.env.RAMA_DEMO_MODE === "true") {
      const byId = new Map(demoProperties().map((property) => [property.id, property]));
      return uniqueIds.map((id) => byId.get(id)).filter((property): property is BuyerPropertySummary => Boolean(property));
    }
    const { data, error } = await this.client.from("public_property_catalog").select("*").in("id", uniqueIds);
    if (error) throw new CatalogUnavailableError();
    const byId = new Map((data ?? []).map((row) => [row.id, mapProperty(row)]));
    return uniqueIds.map((id) => byId.get(id)).filter((property): property is BuyerPropertySummary => Boolean(property));
  }

  async getPaymentSchedule(propertyId: string) {
    if (!(await this.getProperty(propertyId))) return null;
    if (process.env.RAMA_DEMO_MODE === "true") return null;
    const { data: plan, error } = await this.client.from("payment_plans")
      .select("id,name,description,currency,total_percentage,source_name,source_updated_at,published_at,version")
      .eq("property_id", propertyId)
      .eq("publication_status", "published")
      .order("is_default", { ascending: false })
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new CatalogUnavailableError("Payment schedules are temporarily unavailable.");
    if (!plan) return null;
    const { data: installments, error: installmentError } = await this.client.from("payment_plan_installments")
      .select("sequence_no,label,percentage,due_offset_months,due_event")
      .eq("payment_plan_id", plan.id)
      .order("sequence_no", { ascending: true });
    if (installmentError) throw new CatalogUnavailableError("Payment schedules are temporarily unavailable.");
    return { ...plan, installments: installments ?? [] };
  }

  async getFloorPlans(propertyId: string) {
    if (!(await this.getProperty(propertyId))) return [];
    if (process.env.RAMA_DEMO_MODE === "true") return [];
    const { data, error } = await this.client.from("floor_plans")
      .select("id,name,image_url,image_alt,beds,baths,area_sq_ft,source_name,source_updated_at,published_at,version,is_default")
      .eq("property_id", propertyId)
      .eq("publication_status", "published")
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });
    if (error) throw new CatalogUnavailableError("Floor plans are temporarily unavailable.");
    return data ?? [];
  }

  async getDocuments(propertyId: string) {
    if (!(await this.getProperty(propertyId))) return [];
    if (process.env.RAMA_DEMO_MODE === "true") return [];
    const { data, error } = await this.client.from("property_documents")
      .select("id,document_type,title,file_url,mime_type,source_name,source_updated_at,published_at,version")
      .eq("property_id", propertyId)
      .eq("publication_status", "published")
      .order("document_type", { ascending: true });
    if (error) throw new CatalogUnavailableError("Property documents are temporarily unavailable.");
    return data ?? [];
  }

  async getDevelopment(propertyId: string) {
    const property = await this.getProperty(propertyId);
    if (!property?.developmentId) return null;
    const { data, error } = await this.client.from("developments")
      .select("id,name,slug,developer_name,community,emirate,description,completion_status,source_name,source_updated_at,published_at,version")
      .eq("id", property.developmentId)
      .eq("publication_status", "published")
      .maybeSingle();
    if (error) throw new CatalogUnavailableError("Development details are temporarily unavailable.");
    return data;
  }

  async getAreaContext(location: string) {
    if (process.env.RAMA_DEMO_MODE === "true") return null;
    const slug = location.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data, error } = await this.client.from("content_entries")
      .select("id,title,summary,body,source_name,source_updated_at,published_at,version")
      .eq("content_type", "area_guide")
      .eq("slug", slug)
      .eq("publication_status", "published")
      .maybeSingle();
    if (error) throw new CatalogUnavailableError("Area guidance is temporarily unavailable.");
    return data;
  }
}
