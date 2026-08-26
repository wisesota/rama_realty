export const providerPublicationStates = ["quarantined", "validated", "rejected", "published"] as const;

export type ProviderRecordInput = {
  providerId: string;
  sourceRecordId: string;
  sourceName: string;
  organizationId: string;
  observedAt: string;
  publicationEndsAt: string;
  attribution: string;
  mediaRightsConfirmed: boolean;
  permitNumber: string | null;
  property: {
    name: string;
    slug: string;
    location: string;
    description: string;
    propertyType: "apartment" | "villa" | "townhouse" | "penthouse";
    completionStatus: "ready" | "off_plan" | "under_construction";
    priceAed: number;
    beds: number;
    baths: number;
    areaSqFt: number;
    imageUrl: string;
    imageAlt: string;
  };
};

export type ProviderValidationPolicy = {
  providerId: string;
  sourceName: string;
  organizationId: string;
  maximumFreshnessHours: number;
  allowedLocations: string[];
  publicationRightsApproved: boolean;
  mediaRightsRequired: boolean;
};

export type ProviderValidationResult =
  | { ok: true; normalized: ProviderRecordInput; freshnessHours: number }
  | { ok: false; errors: string[] };

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateProviderRecord(
  input: ProviderRecordInput,
  policy: ProviderValidationPolicy,
  now = new Date(),
): ProviderValidationResult {
  const errors: string[] = [];
  const observedAt = new Date(input.observedAt);
  const publicationEndsAt = new Date(input.publicationEndsAt);
  const freshnessHours = (now.getTime() - observedAt.getTime()) / 3_600_000;

  if (!policy.publicationRightsApproved) errors.push("Publication rights are not approved.");
  if (input.providerId !== policy.providerId || input.sourceName !== policy.sourceName || input.organizationId !== policy.organizationId) errors.push("Provider ownership does not match the approved source.");
  if (!Number.isFinite(observedAt.getTime()) || freshnessHours < 0 || freshnessHours > policy.maximumFreshnessHours) errors.push("The provider record is outside its freshness window.");
  if (!Number.isFinite(publicationEndsAt.getTime()) || publicationEndsAt <= now) errors.push("The publication-rights window has expired.");
  if (policy.mediaRightsRequired && !input.mediaRightsConfirmed) errors.push("Media publication rights are not confirmed.");
  if (!input.attribution.trim()) errors.push("Provider attribution is required.");
  if (!policy.allowedLocations.some((location) => location.toLowerCase() === input.property.location.toLowerCase())) errors.push("The record is outside the approved geography.");
  if (!Number.isSafeInteger(input.property.priceAed) || input.property.priceAed <= 0) errors.push("A positive whole-number AED price is required.");
  if (![input.property.beds, input.property.baths].every((value) => Number.isInteger(value) && value >= 0 && value <= 30)
    || !Number.isSafeInteger(input.property.areaSqFt) || input.property.areaSqFt <= 0) errors.push("Bedrooms and bathrooms must be whole numbers from 0 to 30, and area must be a positive whole number.");
  if (!validHttpUrl(input.property.imageUrl) || !input.property.imageAlt.trim()) errors.push("A rights-cleared HTTPS image and alt text are required.");
  if (!input.sourceRecordId.trim() || !input.property.name.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.property.slug.trim().toLowerCase())) errors.push("Stable provider and property identifiers are required.");
  if (input.property.description.trim().length < 40) errors.push("A factual property description of at least 40 characters is required.");

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    freshnessHours,
    normalized: {
      ...input,
      sourceRecordId: input.sourceRecordId.trim(),
      attribution: input.attribution.trim(),
      property: {
        ...input.property,
        name: input.property.name.trim(),
        slug: input.property.slug.trim().toLowerCase(),
        location: input.property.location.trim(),
        description: input.property.description.trim(),
        imageAlt: input.property.imageAlt.trim(),
      },
    },
  };
}

export function providerPublicationIsEnabled(providerId: string) {
  if (process.env.LICENSED_SUPPLY_PUBLICATION_ENABLED !== "true") return false;
  if (!/^[a-z0-9][a-z0-9_-]{1,62}$/.test(providerId)) return false;
  const enabledProviders = new Set(
    (process.env.LICENSED_SUPPLY_PROVIDER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
  return enabledProviders.has(providerId);
}
