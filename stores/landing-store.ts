import { createStore } from "zustand/vanilla";
import {
  initialBrief,
  initialCriteria,
  type PropertySearchSource,
} from "@/lib/property-search";
import { type SampleProperty, sampleProperties } from "@/lib/sample-properties";
import {
  isBuyerDecisionEnvelope,
  type BuyerDecisionEnvelopeV1,
  type BuyerPropertySummary,
} from "@/lib/agent/buyer-contracts";
import type { VoiceExperienceState } from "@/lib/voice/types";
import {
  propertySearchBlocks,
  type AgentBlock,
} from "@/lib/agent/contracts";
import {
  defaultGeminiVoiceName,
  type GeminiVoiceMode,
  type GeminiVoiceName,
} from "@/lib/voice/gemini-live-contracts";

export type SearchPhase = "idle" | "loading" | "success" | "error";
export type AccountPhase = "checking" | "guest" | "authenticated" | "link-sent" | "error";

export type LandingState = {
  brief: string;
  criteria: string[];
  properties: SampleProperty[];
  searchPhase: SearchPhase;
  searchStatus: string;
  searchError: string | null;
  resultSource: string;
  decisionEnvelope: BuyerDecisionEnvelopeV1 | null;
  agentBlocks: AgentBlock[];
  lastSearchSource: PropertySearchSource | null;
  accountPhase: AccountPhase;
  accountStatus: string;
  savedBriefCount: number;
  voiceState: VoiceExperienceState;
  voiceMode: GeminiVoiceMode;
  voiceName: GeminiVoiceName;
  favoriteIds: string[];
  selectedProperty: SampleProperty | null;
};

export type LandingActions = {
  setBrief: (brief: string) => void;
  setVoiceState: (voiceState: VoiceExperienceState) => void;
  setVoiceMode: (voiceMode: GeminiVoiceMode) => void;
  setVoiceName: (voiceName: GeminiVoiceName) => void;
  setSearchStatus: (searchStatus: string) => void;
  setAgentBlocks: (agentBlocks: AgentBlock[]) => void;
  setDecisionEnvelope: (envelope: BuyerDecisionEnvelopeV1) => void;
  setAccountPhase: (accountPhase: AccountPhase) => void;
  setAccountStatus: (accountStatus: string) => void;
  hydrateAccount: () => Promise<void>;
  saveCurrentBrief: () => Promise<boolean>;
  searchProperties: (brief: string, source: PropertySearchSource) => Promise<string | null>;
  toggleFavorite: (id: string) => void;
  selectProperty: (property: SampleProperty | null) => void;
};

export type LandingStore = LandingState & LandingActions;

const initialState: LandingState = {
  brief: initialBrief,
  criteria: initialCriteria,
  properties: sampleProperties,
  searchPhase: "idle",
  searchStatus: "Five sample criteria are ready to review.",
  searchError: null,
  resultSource: "Illustrative local records — no live listing feed",
  decisionEnvelope: null,
  agentBlocks: propertySearchBlocks({
    properties: sampleProperties,
    summary: "Three sample residences are ready for transparent review.",
  }),
  lastSearchSource: null,
  accountPhase: "checking",
  accountStatus: "Checking saved-search access…",
  savedBriefCount: 0,
  voiceState: { phase: "idle" },
  voiceMode: "live",
  voiceName: defaultGeminiVoiceName,
  favoriteIds: [],
  selectedProperty: null,
};

function formatAed(value: number) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value).replace(/\s+/g, " ");
}

function toSampleProperty(property: BuyerPropertySummary): SampleProperty {
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

export function createLandingStore() {
  let activeSearch = 0;
  const favoriteMutations = new Map<string, number>();

  return createStore<LandingStore>()((set, get) => ({
    ...initialState,
    setBrief: (brief) =>
      set((state) => ({
        brief,
        searchError: null,
        searchPhase: state.searchPhase === "error" ? "idle" : state.searchPhase,
      })),
    setVoiceState: (voiceState) => set({ voiceState }),
    setVoiceMode: (voiceMode) => set({ voiceMode }),
    setVoiceName: (voiceName) => set({ voiceName }),
    setSearchStatus: (searchStatus) => set({ searchStatus }),
    setAgentBlocks: (agentBlocks) => set({ agentBlocks }),
    setDecisionEnvelope: (decisionEnvelope) => {
      const governedProperties = Object.values(decisionEnvelope.entities.properties).map(toSampleProperty);
      set({
        decisionEnvelope,
        brief: decisionEnvelope.brief.original,
        criteria: decisionEnvelope.brief.criteria.map((criterion) => criterion.label),
        properties: governedProperties,
        searchPhase: "success",
        searchStatus: governedProperties.length
          ? `${governedProperties.length} governed ${governedProperties.length === 1 ? "residence" : "residences"} ready in your Decision Room.`
          : "No exact residence matched the current brief.",
        searchError: null,
        resultSource: decisionEnvelope.sourceSummary.label,
      });
    },
    setAccountPhase: (accountPhase) => set({ accountPhase }),
    setAccountStatus: (accountStatus) => set({ accountStatus }),
    hydrateAccount: async () => {
      set({ accountPhase: "checking", accountStatus: "Checking saved-search access…" });
      try {
        const response = await fetch("/api/account-state", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const payload: unknown = await response.json();
        if (!response.ok || !payload || typeof payload !== "object") {
          throw new Error("Saved searches are not ready in this environment.");
        }

        const account = payload as {
          authenticated?: unknown;
          savedBriefCount?: unknown;
          favoriteIds?: unknown;
        };
        if (account.authenticated === false) {
          set({
            accountPhase: "guest",
            accountStatus: "Sign in by email to save briefs and shortlist homes.",
            savedBriefCount: 0,
          });
          return;
        }
        if (
          account.authenticated !== true ||
          typeof account.savedBriefCount !== "number" ||
          !Array.isArray(account.favoriteIds) ||
          !account.favoriteIds.every((item) => typeof item === "string")
        ) {
          throw new Error("Saved-search state was invalid.");
        }

        set({
          accountPhase: "authenticated",
          accountStatus: `${account.savedBriefCount} saved ${account.savedBriefCount === 1 ? "brief" : "briefs"}.`,
          savedBriefCount: account.savedBriefCount,
          favoriteIds: account.favoriteIds,
        });
      } catch (error) {
        set({
          accountPhase: "error",
          accountStatus:
            error instanceof Error ? error.message : "Saved searches are unavailable.",
        });
      }
    },
    saveCurrentBrief: async () => {
      const state = get();
      if (state.accountPhase !== "authenticated") return false;

      set({ accountStatus: "Saving this brief…" });
      try {
        const response = await fetch("/api/search-briefs", {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            brief: state.brief,
            criteria: state.criteria,
            source: state.lastSearchSource ?? "text",
            resultIds: state.properties.map((property) => property.id),
          }),
        });
        if (!response.ok) throw new Error("This brief could not be saved.");

        const savedBriefCount = state.savedBriefCount + 1;
        set({
          savedBriefCount,
          accountStatus: `${savedBriefCount} saved ${savedBriefCount === 1 ? "brief" : "briefs"}.`,
        });
        return true;
      } catch (error) {
        set({
          accountStatus: error instanceof Error ? error.message : "This brief could not be saved.",
        });
        return false;
      }
    },
    searchProperties: async (brief, source) => {
      const trimmedBrief = brief.trim();
      if (trimmedBrief.length < 3) {
        set({
          searchPhase: "error",
          searchError: "Describe the Dubai home or lifestyle you want.",
          searchStatus: "Describe a Dubai home or lifestyle to shape the search.",
        });
        return null;
      }

      const searchId = ++activeSearch;
      set({
        brief: trimmedBrief,
        searchPhase: "loading",
        searchError: null,
        searchStatus:
          source === "voice"
            ? "Voice brief captured. Fetching matching property content…"
            : "Fetching matching property content…",
      });

      try {
        const response = await fetch("/api/discovery/query", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ brief: trimmedBrief, source }),
        });
        const payload: unknown = await response.json();

        if (!response.ok) {
          const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string" ? payload.error : null;
          throw new Error(message || "Property search is unavailable.");
        }

        if (!isBuyerDecisionEnvelope(payload)) {
          throw new Error("Property search returned an invalid response.");
        }

        if (searchId !== activeSearch) return null;

        const governedProperties = Object.values(payload.entities.properties).map(toSampleProperty);
        set({
          decisionEnvelope: payload,
          brief: payload.brief.original,
          criteria: payload.brief.criteria.map((criterion) => criterion.label),
          properties: governedProperties,
          searchPhase: "success",
          searchStatus: governedProperties.length
            ? `${governedProperties.length} governed ${governedProperties.length === 1 ? "residence" : "residences"} ready in your Decision Room.`
            : "No exact residence matched the current brief.",
          searchError: null,
          resultSource: payload.sourceSummary.label,
          agentBlocks: propertySearchBlocks({ properties: governedProperties, summary: payload.sourceSummary.label }),
          lastSearchSource: source,
        });
        return payload.searchRunId;
      } catch (error) {
        if (searchId !== activeSearch) return null;

        const message = error instanceof Error ? error.message : "Property search is unavailable.";
        set({
          searchPhase: "error",
          searchError: message,
          searchStatus: `${message} Your previous results remain in place.`,
        });
        return null;
      }
    },
    toggleFavorite: (id) => {
      const state = get();
      const removing = state.favoriteIds.includes(id);
      const mutation = (favoriteMutations.get(id) ?? 0) + 1;
      favoriteMutations.set(id, mutation);
      set({
        favoriteIds: removing
          ? state.favoriteIds.filter((favoriteId) => favoriteId !== id)
          : [...state.favoriteIds, id],
      });

      if (state.accountPhase !== "authenticated") return;
      void (async () => {
        try {
          const response = await fetch("/api/shortlist", {
            method: removing ? "DELETE" : "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId: id }),
          });
          if (!response.ok) throw new Error("Shortlist synchronization failed.");
        } catch {
          if (favoriteMutations.get(id) !== mutation) return;
          set((current) => ({
            favoriteIds: removing
              ? current.favoriteIds.includes(id)
                ? current.favoriteIds
                : [...current.favoriteIds, id]
              : current.favoriteIds.filter((favoriteId) => favoriteId !== id),
            accountStatus: "The shortlist could not be synchronized. Your last change was restored.",
          }));
        }
      })();
    },
    selectProperty: (selectedProperty) => set({ selectedProperty }),
  }));
}

export type LandingStoreApi = ReturnType<typeof createLandingStore>;
