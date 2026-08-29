import { createStore } from "zustand/vanilla";
import type { PropertySearchSource } from "@/lib/property-search";
import { type SampleProperty, sampleProperties } from "@/lib/sample-properties";
import {
  isBuyerDecisionEnvelope,
  type BuyerDecisionEnvelope,
  type BuyerPropertySummary,
} from "@/lib/agent/buyer-contracts";
import type { VoiceExperienceState } from "@/lib/voice/types";
import { isPreparedBrief, type PreparedBrief } from "@/lib/brief-confirmation";
import type { AgentBlock } from "@/lib/agent/contracts";
import {
  defaultGeminiVoiceName,
  type GeminiVoiceMode,
  type GeminiVoiceName,
} from "@/lib/voice/gemini-live-contracts";
import type { PublicLocale } from "@/lib/i18n";

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
  decisionEnvelope: BuyerDecisionEnvelope | null;
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
  preparedBrief: PreparedBrief | null;
  briefRecalculating: boolean;
};

export type LandingActions = {
  setBrief: (brief: string) => void;
  setVoiceState: (voiceState: VoiceExperienceState) => void;
  setVoiceMode: (voiceMode: GeminiVoiceMode) => void;
  setVoiceName: (voiceName: GeminiVoiceName) => void;
  setSearchStatus: (searchStatus: string) => void;
  reportBriefError: (message: string) => void;
  setAgentBlocks: (agentBlocks: AgentBlock[]) => void;
  setDecisionEnvelope: (envelope: BuyerDecisionEnvelope) => void;
  setAccountPhase: (accountPhase: AccountPhase) => void;
  setAccountStatus: (accountStatus: string) => void;
  hydrateAccount: () => Promise<void>;
  saveCurrentBrief: () => Promise<boolean>;
  prepareBrief: (brief: string, source: PropertySearchSource, draftId?: string) => Promise<boolean>;
  updatePreparedBrief: (brief: string) => Promise<void>;
  cancelPreparedBrief: () => void;
  confirmPreparedBrief: () => Promise<string | null>;
  toggleFavorite: (id: string) => void;
  selectProperty: (property: SampleProperty | null) => void;
};

export type LandingStore = LandingState & LandingActions;

function initialState(locale: PublicLocale): LandingState {
  const isArabic = locale === "ar";

  return {
  brief: "",
  criteria: [],
  properties: sampleProperties,
  searchPhase: "idle",
  searchStatus: isArabic
    ? "ابدأ بالصوت، أو اكتب موجزاً ثم راجعه قبل البحث."
    : "Start with voice, or type a brief and review it before searching.",
  searchError: null,
  resultSource: "Illustrative local records — no live listing feed",
  decisionEnvelope: null,
  agentBlocks: [],
  lastSearchSource: null,
  accountPhase: "checking",
  accountStatus: isArabic ? "جارٍ التحقق من إمكانية حفظ البحث…" : "Checking saved-search access…",
  savedBriefCount: 0,
  voiceState: { phase: "idle" },
  voiceMode: "live",
  voiceName: defaultGeminiVoiceName,
  favoriteIds: [],
  selectedProperty: null,
  preparedBrief: null,
  briefRecalculating: false,
  };
}

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

export function createLandingStore(locale: PublicLocale = "en") {
  let activeSearch = 0;
  let activePreparation = 0;
  let preparationController: AbortController | null = null;
  let preparationTimer: ReturnType<typeof setTimeout> | null = null;
  let queuedPreparationResolve: (() => void) | null = null;
  let confirmationPromise: Promise<string | null> | null = null;
  let confirmationController: AbortController | null = null;
  const favoriteMutations = new Map<string, number>();
  const searchCopy = locale === "ar" ? {
    governedReady: (count: number) => `${count} ${count === 1 ? "مسكن منضبط جاهز" : "مساكن منضبطة جاهزة"} في غرفة القرار.`,
    noExact: "لا يوجد مسكن مطابق تماماً للموجز الحالي.",
    review: "راجع الموجز المكتوب وأكّده. لم يتم حفظ أي شيء بعد.",
    prepareFailed: "تعذر إعداد الموجز. حاول مرة أخرى.",
    prepareTimedOut: "استغرق إعداد الموجز وقتاً طويلاً. حاول مرة أخرى.",
    cancelled: "أُلغيت مراجعة الموجز. لم يتم حفظ أي شيء.",
    opening: "جارٍ حفظ الموجز المؤكد وفتح غرفة القرار…",
    discoveryFailed: "البحث عن العقارات غير متاح مؤقتاً.",
    discoveryTimedOut: "استغرق فتح غرفة القرار وقتاً طويلاً. حاول مرة أخرى.",
    invalidResponse: "أعاد البحث عن العقارات استجابة غير صالحة.",
    retry: "يبقى موجزك المؤكد متاحاً لإعادة المحاولة.",
  } : {
    governedReady: (count: number) => `${count} governed ${count === 1 ? "residence" : "residences"} ready in your Decision Room.`,
    noExact: "No exact residence matched the current brief.",
    review: "Review and confirm the written brief. Nothing has been saved yet.",
    prepareFailed: "The brief could not be prepared.",
    prepareTimedOut: "Brief preparation took too long. Please try again.",
    cancelled: "Brief review cancelled. Nothing was saved.",
    opening: "Saving the confirmed brief and opening the Decision Room…",
    discoveryFailed: "Property search is unavailable.",
    discoveryTimedOut: "Opening the Decision Room took too long. Please try again.",
    invalidResponse: "Property search returned an invalid response.",
    retry: "Your confirmed draft remains available to retry.",
  };

  function responseError(payload: unknown, fallback: string) {
    if (locale === "ar") return fallback;
    return payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : fallback;
  }

  return createStore<LandingStore>()((set, get) => ({
    ...initialState(locale),
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
    reportBriefError: (message) => set({ searchPhase: "error", searchError: message, searchStatus: message }),
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
          ? searchCopy.governedReady(governedProperties.length)
          : searchCopy.noExact,
        searchError: null,
        resultSource: decisionEnvelope.sourceSummary.label,
        preparedBrief: null,
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
    prepareBrief: async (brief, source, draftId) => {
      const preparationId = ++activePreparation;
      preparationController?.abort();
      const controller = new AbortController();
      preparationController = controller;
      set({ briefRecalculating: true });

      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 30_000);

      try {
        const response = await fetch("/api/discovery/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief, source, draftId }),
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok || !isPreparedBrief(payload)) {
          throw new Error(responseError(payload, searchCopy.prepareFailed));
        }
        if (preparationId !== activePreparation) return false;
        set({ brief: payload.transcript, preparedBrief: payload, searchPhase: "idle", searchStatus: searchCopy.review, briefRecalculating: false });
        return true;
      } catch (error) {
        if (controller.signal.aborted && !timedOut && preparationId === activePreparation) return false;
        if (preparationId !== activePreparation) return false;
        const message = timedOut
          ? searchCopy.prepareTimedOut
          : (error instanceof Error ? error.message : searchCopy.prepareFailed);
        set({ searchPhase: "error", searchError: message, searchStatus: message, briefRecalculating: false });
        return false;
      } finally {
        clearTimeout(timeoutId);
        if (preparationController === controller) preparationController = null;
      }
    },
    updatePreparedBrief: (brief) => {
      const current = get().preparedBrief;
      if (!current) return Promise.resolve();
      if (preparationTimer) clearTimeout(preparationTimer);
      preparationTimer = null;
      queuedPreparationResolve?.();
      queuedPreparationResolve = null;
      preparationController?.abort();
      set({
        brief,
        preparedBrief: { ...current, transcript: brief },
        briefRecalculating: true,
        searchError: null,
      });
      return new Promise<void>((resolve) => {
        queuedPreparationResolve = resolve;
        preparationTimer = setTimeout(() => {
          preparationTimer = null;
          queuedPreparationResolve = null;
          void get().prepareBrief(brief, current.source, current.draftId).finally(resolve);
        }, 350);
      });
    },
    cancelPreparedBrief: () => {
      activePreparation += 1;
      activeSearch += 1;
      if (preparationTimer) clearTimeout(preparationTimer);
      preparationTimer = null;
      queuedPreparationResolve?.();
      queuedPreparationResolve = null;
      preparationController?.abort();
      preparationController = null;
      confirmationController?.abort();
      confirmationController = null;
      confirmationPromise = null;
      set({ preparedBrief: null, briefRecalculating: false, searchPhase: "idle", searchError: null, searchStatus: searchCopy.cancelled });
    },
    confirmPreparedBrief: async () => {
      if (confirmationPromise) return confirmationPromise;
      if (get().briefRecalculating) return null;
      const draft = get().preparedBrief;
      if (!draft) return null;
      confirmationPromise = (async () => {
        const searchId = ++activeSearch;
        const controller = new AbortController();
        confirmationController = controller;
        let timedOut = false;
        const timeoutId = setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, 30_000);
        set({ searchPhase: "loading", searchError: null, searchStatus: searchCopy.opening });
        try {
          const response = await fetch("/api/discovery/query", {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({ brief: draft.transcript, source: draft.source, idempotencyKey: draft.draftId, locale }),
            signal: controller.signal,
          });
          const payload: unknown = await response.json();
          if (!response.ok) {
            throw new Error(responseError(payload, searchCopy.discoveryFailed));
          }
          if (!isBuyerDecisionEnvelope(payload)) throw new Error(searchCopy.invalidResponse);
          if (searchId !== activeSearch || get().preparedBrief?.draftId !== draft.draftId) return null;
          get().setDecisionEnvelope(payload);
          set({ lastSearchSource: draft.source });
          return payload.searchRunId;
        } catch (error) {
          if (searchId !== activeSearch) return null;
          if (controller.signal.aborted && !timedOut) return null;
          const message = timedOut
            ? searchCopy.discoveryTimedOut
            : error instanceof Error ? error.message : searchCopy.discoveryFailed;
          set({ searchPhase: "error", searchError: message, searchStatus: `${message} ${searchCopy.retry}` });
          return null;
        } finally {
          clearTimeout(timeoutId);
          if (confirmationController === controller) confirmationController = null;
          confirmationPromise = null;
        }
      })();
      return confirmationPromise;
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
