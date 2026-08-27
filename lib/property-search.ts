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

const locationAliases: Array<[string, string]> = [
  ["palm jumeirah", "Palm Jumeirah"], ["نخلة جميرا", "Palm Jumeirah"],
  ["downtown dubai", "Downtown Dubai"], ["وسط مدينة دبي", "Downtown Dubai"],
  ["dubai marina", "Dubai Marina"], ["دبي مارينا", "Dubai Marina"],
  ["jumeirah", "Jumeirah"], ["جميرا", "Jumeirah"],
];

function normalizeArabicDigits(value: string) {
  const digits: Record<string, string> = { "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4", "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9" };
  return value.replace(/[٠-٩]/g, (digit) => digits[digit]);
}

function extractBedroomCount(value: string) {
  const englishMatches = [...value.matchAll(/\b(one|two|three|four|five|\d+)\s*(?:-|\s)?bed(?:room)?s?\b/g)];
  const english = englishMatches.at(-1);
  const englishWords: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
  if (english) return englishWords[english[1]] ?? Number.parseInt(english[1], 10);
  const normalized = normalizeArabicDigits(value);
  const numericArabic = [...normalized.matchAll(/(\d+)\s*(?:غرف|غرفة)/g)].at(-1);
  if (numericArabic) return Number.parseInt(numericArabic[1], 10);
  if (/غرف(?:تين|تان|تي|تا)(?:\s+نوم)?/.test(value)) return 2;
  if (/ثلاث\s+غرف/.test(value)) return 3;
  if (/أربع\s+غرف/.test(value)) return 4;
  if (/خمس\s+غرف/.test(value)) return 5;
  if (/غرفة\s+واحدة/.test(value)) return 1;
  return undefined;
}

function extractBudget(value: string) {
  const normalized = normalizeArabicDigits(value);
  const match = normalized.match(/(?:under|below|max(?:imum)?(?:\s+of)?|أقل\s+من|بحد\s+أقصى)\s*(?:aed|dh|dhs|درهم)?\s*([\d,.]+)\s*(m|million|مليون|ملايين)?/);
  if (!match) return undefined;
  return { amount: parseAedAmount(match[1], match[2]), display: `Up to AED ${match[1].replace(/\.0$/, "")}${match[2] ? "M" : ""}` };
}

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
  const location = locationAliases.find(([alias]) => value.includes(alias))?.[1]
    ?? specificLocations.find((item) => value.includes(item.toLowerCase()));
  const bedrooms = extractBedroomCount(value);
  const budget = extractBudget(value);

  return {
    location,
    bedrooms: Number.isFinite(bedrooms) ? bedrooms : undefined,
    maximumPriceAed: budget?.amount,
  };
}

export function parsePropertyBrief(brief: string) {
  const value = brief.toLowerCase();
  const criteria: string[] = [];

  const location = locationAliases.find(([alias]) => value.includes(alias))?.[1]
    ?? (value.includes("dubai") || value.includes("دبي") ? "Dubai" : undefined);
  if (location) criteria.push(location);

  const bedrooms = extractBedroomCount(value);
  if (bedrooms !== undefined) criteria.push(`${bedrooms} ${bedrooms === 1 ? "bedroom" : "bedrooms"}`);

  const budget = extractBudget(value);
  if (budget) criteria.push(budget.display);

  const propertyTypes: Array<[string, string]> = [
    ["penthouse", "Penthouse"],
    ["villa", "Villa"],
    ["townhouse", "Townhouse"],
    ["apartment", "Apartment"],
    ["شقة", "Apartment"],
    ["فيلا", "Villa"],
    ["تاون هاوس", "Townhouse"],
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
    ["إطلالة بحرية", "Sea view"],
    ["شرفة", "Balcony"],
    ["هادئ", "Quieter setting"],
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
