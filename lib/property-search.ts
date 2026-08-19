import { type SampleProperty, sampleProperties } from "@/lib/sample-properties";
import { propertySearchBlocks, type AgentBlock } from "@/lib/agent/contracts";

export const initialBrief = "2-bedroom apartment in Dubai Marina under AED 3M";

export const voiceSampleBrief =
  "A two-bedroom apartment in Dubai Marina under AED 3M with a balcony, sea views, and a short walk to the waterfront.";

export const initialCriteria = [
  "Dubai Marina",
  "Up to AED 3M",
  "2 bedrooms",
  "Apartment",
  "Sea view",
];

export type PropertySearchSource = "text" | "voice";

export type PropertySearchRequest = {
  brief: string;
  source: PropertySearchSource;
};

export type PropertySearchResponse = {
  correlationId: string;
  brief: string;
  criteria: string[];
  properties: SampleProperty[];
  summary: string;
  source: {
    kind: "illustrative-local" | "illustrative-supabase" | "published-supabase" | "mixed-supabase";
    label: string;
  };
  blocks: AgentBlock[];
};

export type PropertySearchError = {
  error: string;
};

export type PropertyHardConstraints = {
  location?: string;
  bedrooms?: number;
  maximumPriceAed?: number;
};

const specificLocations = [
  "Palm Jumeirah",
  "Downtown Dubai",
  "Dubai Marina",
  "Jumeirah",
];

function parseAedAmount(value: string, suffix?: string) {
  const amount = Number.parseFloat(value.replace(/,/g, ""));
  if (!Number.isFinite(amount)) return undefined;
  return amount * (suffix ? 1_000_000 : 1);
}

function propertyPriceAed(property: SampleProperty) {
  const amount = Number.parseInt(property.price.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(amount) ? amount : undefined;
}

export function extractHardConstraints(brief: string): PropertyHardConstraints {
  const value = brief.toLowerCase();
  const location = specificLocations.find((item) => value.includes(item.toLowerCase()));
  const bedroomMatch = value.match(/\b(one|two|three|four|five|\d+)\s*(?:-|\s)?bed(?:room)?s?\b/);
  const bedroomWords: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
  };
  const bedrooms = bedroomMatch
    ? bedroomWords[bedroomMatch[1]] ?? Number.parseInt(bedroomMatch[1], 10)
    : undefined;
  const budgetMatch = value.match(
    /(?:under|below|max(?:imum)?(?:\s+of)?)\s*(?:aed|dh|dhs)?\s*([\d,.]+)\s*(m|million)?/,
  );

  return {
    location,
    bedrooms: Number.isFinite(bedrooms) ? bedrooms : undefined,
    maximumPriceAed: budgetMatch
      ? parseAedAmount(budgetMatch[1], budgetMatch[2])
      : undefined,
  };
}

export function parsePropertyBrief(brief: string) {
  const value = brief.toLowerCase();
  const criteria: string[] = [];

  const locations = [
    "Palm Jumeirah",
    "Downtown Dubai",
    "Dubai Marina",
    "Jumeirah",
    "Dubai",
  ];
  const location = locations.find((item) => value.includes(item.toLowerCase()));
  if (location) criteria.push(location);

  const bedroomMatch = value.match(/\b(one|two|three|four|five|\d+)\s*(?:-|\s)?bed(?:room)?s?\b/);
  if (bedroomMatch) {
    const bedroomWords: Record<string, string> = {
      one: "1",
      two: "2",
      three: "3",
      four: "4",
      five: "5",
    };
    const bedrooms = bedroomWords[bedroomMatch[1]] ?? bedroomMatch[1];
    criteria.push(`${bedrooms} ${bedrooms === "1" ? "bedroom" : "bedrooms"}`);
  }

  const budgetMatch = value.match(
    /(?:under|below|max(?:imum)?(?:\s+of)?)\s*(?:aed|dh|dhs)?\s*([\d,.]+)\s*(m|million)?/,
  );
  if (budgetMatch) {
    const suffix = budgetMatch[2] ? "M" : "";
    criteria.push(`Up to AED ${budgetMatch[1].replace(/\.0$/, "")}${suffix}`);
  }

  const propertyTypes: Array<[string, string]> = [
    ["penthouse", "Penthouse"],
    ["villa", "Villa"],
    ["townhouse", "Townhouse"],
    ["apartment", "Apartment"],
  ];
  const propertyType = propertyTypes.find(([keyword]) => value.includes(keyword));
  if (propertyType) criteria.push(propertyType[1]);

  const amenities: Array<[string, string]> = [
    ["sea view", "Sea view"],
    ["water view", "Water view"],
    ["waterfront", "Waterfront"],
    ["balcony", "Balcony"],
    ["terrace", "Terrace"],
    ["pool", "Pool"],
    ["garden", "Garden"],
    ["home office", "Home office"],
    ["natural light", "Natural light"],
    ["metro", "Near the metro"],
    ["walk", "Walkable"],
    ["quiet", "Quieter setting"],
  ];

  for (const [keyword, label] of amenities) {
    if (value.includes(keyword) && !criteria.includes(label)) criteria.push(label);
  }

  return criteria.length > 0 ? criteria.slice(0, 6) : ["Flexible Dubai brief"];
}

function scoreProperty(property: SampleProperty, brief: string) {
  const value = brief.toLowerCase();
  let score = value.includes(property.location.toLowerCase()) ? 20 : 0;

  const keywordGroups: Record<string, string[]> = {
    "marina-promenade-residence": ["marina", "balcony", "sea", "waterfront", "walk"],
    "boulevard-garden-apartment": ["downtown", "central", "natural light", "study", "office"],
    "palm-courtyard-residence": ["palm", "quiet", "terrace", "outdoor", "water"],
  };

  for (const keyword of keywordGroups[property.id] ?? []) {
    if (value.includes(keyword)) score += 3;
  }

  return score;
}

function matchesHardConstraints(
  property: SampleProperty,
  constraints: PropertyHardConstraints,
) {
  if (
    constraints.location &&
    property.location.toLowerCase() !== constraints.location.toLowerCase()
  ) {
    return false;
  }
  if (constraints.bedrooms !== undefined && property.beds !== constraints.bedrooms) {
    return false;
  }
  if (constraints.maximumPriceAed !== undefined) {
    const price = propertyPriceAed(property);
    if (price === undefined || price > constraints.maximumPriceAed) return false;
  }
  return true;
}

export function searchIllustrativeProperties(
  request: PropertySearchRequest,
  options: {
    properties?: SampleProperty[];
    source?: PropertySearchResponse["source"];
  } = {},
): PropertySearchResponse {
  const brief = request.brief.trim();
  const criteria = parsePropertyBrief(brief);
  const hardConstraints = extractHardConstraints(brief);
  const properties = [...(options.properties ?? sampleProperties)]
    .filter((property) => matchesHardConstraints(property, hardConstraints))
    .sort((left, right) => scoreProperty(right, brief) - scoreProperty(left, brief))
    .slice(0, 12);

  const hardConstraintCount = Object.values(hardConstraints).filter(
    (value) => value !== undefined,
  ).length;
  const resultSummary =
    properties.length === 0 && hardConstraintCount > 0
      ? "No illustrative residences meet every hard location, bedroom, and budget constraint."
      : `${properties.length} illustrative ${properties.length === 1 ? "residence meets" : "residences meet"} the hard constraints and ${properties.length === 1 ? "is" : "are"} ranked by lifestyle alignment.`;

  return {
    correlationId: crypto.randomUUID(),
    brief,
    criteria,
    properties,
    summary: `${criteria.length} criteria extracted from the ${request.source} brief. ${resultSummary}`,
    source: options.source ?? {
      kind: "illustrative-local",
      label: "Illustrative local records — no live listing feed",
    },
    blocks: propertySearchBlocks({ properties, summary: resultSummary }),
  };
}
