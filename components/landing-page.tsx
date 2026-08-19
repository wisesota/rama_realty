"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  Check,
  Database,
  Eye,
  Heart,
  LockKeyhole,
  MessageCircle,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useRef } from "react";
import { useLandingStore } from "@/components/providers/landing-store-provider";
import { Button, LinkButton } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MediaFrame } from "@/components/rama/media-frame";
import { SectionHeading } from "@/components/rama/section-heading";
import { SectionShell } from "@/components/rama/section-shell";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SavedBriefControl } from "@/components/saved-brief-control";
import { AgentResponseBlocks } from "@/components/agent-response-blocks";
import { VoiceConversation } from "@/components/voice-conversation";
import { VoiceSignal } from "@/components/voice-signal";
import { sampleProperties, type SampleProperty } from "@/lib/sample-properties";
import type {
  GeminiLiveVoiceSession,
  GeminiVoiceStatus,
} from "@/lib/voice/gemini-live-session";
import type {
  GeminiRecordedVoiceError,
  GeminiRecordedVoiceResponse,
} from "@/lib/voice/gemini-live-contracts";
import type { RecordedVoiceSession } from "@/lib/voice/recorded-voice-session";
import type { BrowserSpeechSession } from "@/lib/voice/browser-speech-session";

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function microphonePermissionIsDenied() {
  try {
    if (!navigator.permissions?.query) return false;
    const permission = await navigator.permissions.query({
      name: "microphone" as PermissionName,
    });
    return permission.state === "denied";
  } catch {
    return false;
  }
}

function isRecordedVoiceResponse(value: unknown): value is GeminiRecordedVoiceResponse {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<GeminiRecordedVoiceResponse>;
  return (
    typeof result.transcript === "string" &&
    typeof result.agentResponse === "string" &&
    typeof result.locale === "string" &&
    result.mode === "recorded"
  );
}

type PropertyCardProps = {
  index: number;
  property: SampleProperty;
  favorite: boolean;
  onFavorite: (id: string) => void;
  onSelect: (property: SampleProperty, trigger: HTMLElement) => void;
};

const discoverySteps = [
  {
    number: "01",
    title: "Speak naturally",
    copy: "Describe a school run, waterfront walk, morning light, or a real budget in your own words.",
  },
  {
    number: "02",
    title: "Inspect the brief",
    copy: "Rama turns the conversation into criteria you can review, remove, and reprioritize.",
  },
  {
    number: "03",
    title: "Compare with context",
    copy: "Every illustrative home retains the visible reason it appeared in the shortlist.",
  },
] as const;

const decisionPath = [
  ["01", "Describe", "Start with the life, routine, and constraints that matter."],
  ["02", "Structure", "Review the criteria Rama understood before any comparison."],
  ["03", "Compare", "See illustrative candidates with their match reasons attached."],
  ["04", "Refine", "Change one priority without rebuilding the entire search."],
] as const;

const frequentlyAsked = [
  {
    question: "Are these live Dubai listings?",
    answer:
      "No. The current residences and prices are explicitly illustrative samples used to demonstrate the decision flow. A licensed inventory connector is not yet active.",
  },
  {
    question: "Does text search work without the microphone?",
    answer:
      "Yes. Text is a complete path through the same brief extraction and property-search experience. Voice is an optional, user-initiated layer.",
  },
  {
    question: "What happens after I speak?",
    answer:
      "Rama turns the transcript into an editable brief, runs the same property search used by typed input, and explains why each sample candidate appeared.",
  },
  {
    question: "Can I save a property brief?",
    answer:
      "Yes. The saved-brief control uses a secure email sign-in flow. Saved application data is designed to remain owner-scoped in Supabase.",
  },
] as const;

function PropertyCard({
  index,
  property,
  favorite,
  onFavorite,
  onSelect,
}: PropertyCardProps) {
  return (
    <article className="property-card">
      <div className="property-image corner-frame">
        <Image
          src={property.image}
          alt={property.imageAlt}
          fill
          loading={index === 0 ? "eager" : "lazy"}
          sizes="(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 390px"
        />
        <div className="property-image-overlay">
          <span className="sample-label">Sample search result</span>
          <span className="property-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <Button
            className="favorite-button"
            variant="ghost"
            size="icon"
            aria-label={`${favorite ? "Remove" : "Add"} ${property.name} ${
              favorite ? "from" : "to"
            } favorites`}
            aria-pressed={favorite}
            onPress={() => onFavorite(property.id)}
          >
            <Heart aria-hidden="true" fill={favorite ? "currentColor" : "none"} />
          </Button>
        </div>
      </div>

      <div className="property-content">
        <div className="property-heading">
          <h3>{property.name}</h3>
          <p className="property-location">{property.location}</p>
        </div>

        <div className="property-details">
          <div className="property-facts" aria-label={`${property.name} key facts`}>
            <span aria-label={`${property.beds} bedrooms`}>
              <BedDouble aria-hidden="true" /> {property.beds}
            </span>
            <span aria-label={`${property.baths} bathrooms`}>
              <Bath aria-hidden="true" /> {property.baths}
            </span>
            <span aria-label={`${property.area} total area`}>
              <Ruler aria-hidden="true" /> {property.area}
            </span>
          </div>
          <strong>{property.price}</strong>
        </div>

        <p className="property-feature">{property.feature}</p>
        
        <div className="match-reason">
          <Check aria-hidden="true" />
          <span>{property.match}</span>
        </div>

        <Button
          className="property-action"
          variant="ghost"
          onPress={(event) => onSelect(property, event.target as HTMLElement)}
        >
          Review sample context
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
}

export function LandingPage() {
  const brief = useLandingStore((state) => state.brief);
  const criteria = useLandingStore((state) => state.criteria);
  const properties = useLandingStore((state) => state.properties);
  const searchPhase = useLandingStore((state) => state.searchPhase);
  const searchStatus = useLandingStore((state) => state.searchStatus);
  const searchError = useLandingStore((state) => state.searchError);
  const resultSource = useLandingStore((state) => state.resultSource);
  const agentBlocks = useLandingStore((state) => state.agentBlocks);
  const voiceState = useLandingStore((state) => state.voiceState);
  const voiceMode = useLandingStore((state) => state.voiceMode);
  const voiceName = useLandingStore((state) => state.voiceName);
  const favoriteIds = useLandingStore((state) => state.favoriteIds);
  const selectedProperty = useLandingStore((state) => state.selectedProperty);
  const setBrief = useLandingStore((state) => state.setBrief);
  const setVoiceState = useLandingStore((state) => state.setVoiceState);
  const setSearchStatus = useLandingStore((state) => state.setSearchStatus);
  const setAgentBlocks = useLandingStore((state) => state.setAgentBlocks);
  const setDecisionEnvelope = useLandingStore((state) => state.setDecisionEnvelope);
  const searchProperties = useLandingStore((state) => state.searchProperties);
  const toggleFavorite = useLandingStore((state) => state.toggleFavorite);
  const selectProperty = useLandingStore((state) => state.selectProperty);
  const hydrateAccount = useLandingStore((state) => state.hydrateAccount);
  const router = useRouter();

  const mediaStream = useRef<MediaStream | null>(null);
  const voiceSession = useRef<GeminiLiveVoiceSession | null>(null);
  const recordedSession = useRef<RecordedVoiceSession | null>(null);
  const browserSpeechSession = useRef<BrowserSpeechSession | null>(null);
  const recordedTurnAbort = useRef<AbortController | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceAttempt = useRef(0);
  const voiceTranscript = useRef("");
  const agentTranscript = useRef("");
  const propertyTrigger = useRef<HTMLElement | null>(null);
  const propertyBriefInput = useRef<HTMLInputElement | null>(null);
  const propertyModal = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void hydrateAccount();
  }, [hydrateAccount]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (speechTimer.current) clearTimeout(speechTimer.current);
      stopMediaStream(mediaStream.current);
      const session = voiceSession.current;
      const recorder = recordedSession.current;
      const browserSpeech = browserSpeechSession.current;
      recordedTurnAbort.current?.abort();
      recordedTurnAbort.current = null;
      voiceSession.current = null;
      recordedSession.current = null;
      browserSpeechSession.current = null;
      void session?.dispose();
      void recorder?.dispose();
      browserSpeech?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!selectedProperty) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const keepFocusInModal = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        selectProperty(null);
        requestAnimationFrame(() => propertyTrigger.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = propertyModal.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", keepFocusInModal);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keepFocusInModal);
    };
  }, [selectProperty, selectedProperty]);

  async function openDecisionRoom(searchBrief: string, source: "text" | "voice") {
    const searchRunId = await searchProperties(searchBrief, source);
    if (searchRunId) router.push(`/discover/${searchRunId}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (brief.trim().length < 3) {
      requestAnimationFrame(() => propertyBriefInput.current?.focus());
      return;
    }
    void openDecisionRoom(brief, "text");
  }

  function resetVoiceExperience(message?: string) {
    voiceAttempt.current += 1;
    const session = voiceSession.current;
    const recorder = recordedSession.current;
    const browserSpeech = browserSpeechSession.current;
    voiceSession.current = null;
    recordedSession.current = null;
    browserSpeechSession.current = null;
    void session?.dispose();
    void recorder?.dispose();
    browserSpeech?.dispose();
    recordedTurnAbort.current?.abort();
    recordedTurnAbort.current = null;
    window.speechSynthesis?.cancel();
    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = null;
    stopMediaStream(mediaStream.current);
    mediaStream.current = null;
    voiceTranscript.current = "";
    agentTranscript.current = "";
    setVoiceState({ phase: "idle" });
    if (message) setSearchStatus(message);
  }

  function applyVoiceStatus(status: GeminiVoiceStatus) {
    if (status === "connecting") {
      setVoiceState({
        phase: "connecting",
        announcement: "Connecting to the secure Gemini Live voice session.",
      });
    } else if (status === "listening") {
      setVoiceState({
        phase: "listening",
        announcement: "Rama is listening for your Dubai property brief.",
        transcript: voiceTranscript.current,
        mode: "live",
      });
    } else if (status === "thinking") {
      setVoiceState({
        phase: "thinking",
        announcement: "Rama is understanding the property brief.",
        transcript: voiceTranscript.current,
      });
    } else {
      setVoiceState({
        phase: "speaking",
        announcement: "Rama is responding to the property brief.",
        transcript: voiceTranscript.current,
        agentTranscript: agentTranscript.current,
      });
    }
  }

  function completeRecordedVoice(
    attempt: number,
    transcript: string,
    agentResponse: string,
  ) {
    if (attempt !== voiceAttempt.current) return;
    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = null;
    setVoiceState({
      phase: "complete",
      announcement: "The voice brief is complete and the property results were updated.",
      transcript,
      agentTranscript: agentResponse,
    });
  }

  function speakRecordedResponse(
    attempt: number,
    transcript: string,
    agentResponse: string,
    locale: string,
  ) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      completeRecordedVoice(attempt, transcript, agentResponse);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(agentResponse);
    utterance.lang = locale;
    utterance.rate = 0.96;
    utterance.pitch = 0.96;
    const finish = () => completeRecordedVoice(attempt, transcript, agentResponse);
    utterance.onend = finish;
    utterance.onerror = finish;
    speechTimer.current = setTimeout(finish, 20_000);
    window.speechSynthesis.speak(utterance);
  }

  async function finishRecordedVoice(attempt: number) {
    const recorder = recordedSession.current;
    if (!recorder) return;
    const browserSpeech = browserSpeechSession.current;
    recordedSession.current = null;
    browserSpeechSession.current = null;
    setVoiceState({
      phase: "thinking",
      announcement: "The recording is complete. Gemini is understanding the property brief.",
      transcript: "",
    });

    let browserTranscript = "";
    try {
      const results = await Promise.allSettled([
        recorder.stop(),
        browserSpeech?.stop() ?? Promise.resolve(""),
      ]);
      if (results[0].status === "rejected") throw results[0].reason;
      const result = results[0].value;
      const browserResult = results[1].status === "fulfilled" ? results[1].value : "";
      browserTranscript = browserResult.trim().slice(0, 500);
      stopMediaStream(mediaStream.current);
      mediaStream.current = null;
      if (attempt !== voiceAttempt.current) return;
      if ((!result.hasSpeech || result.durationMs < 300) && browserTranscript.length < 3) {
        setVoiceState({
          phase: "error",
          code: "unavailable",
          announcement: "No clear speech was detected. Try again or use the text search.",
        });
        setSearchStatus("No clear speech was detected. Your typed brief remains available.");
        return;
      }

      const formData = new FormData();
      formData.append("audio", result.audio, "rama-voice-turn.wav");
      const controller = new AbortController();
      recordedTurnAbort.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 35_000);
      let response: Response;
      try {
        response = await fetch("/api/voice/turn", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
          signal: controller.signal,
          cache: "no-store",
        });
      } finally {
        clearTimeout(timeoutId);
        if (recordedTurnAbort.current === controller) recordedTurnAbort.current = null;
      }

      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = (payload as Partial<GeminiRecordedVoiceError>).error;
        throw new Error(message || "Gemini could not understand this voice turn.");
      }
      if (!isRecordedVoiceResponse(payload)) {
        throw new Error("Gemini returned an invalid voice response.");
      }
      if (attempt !== voiceAttempt.current) return;

      voiceTranscript.current = payload.transcript;
      agentTranscript.current = payload.agentResponse;
      setVoiceState({
        phase: "speaking",
        announcement: "Rama understood the voice brief and is responding.",
        transcript: payload.transcript,
        agentTranscript: payload.agentResponse,
      });
      void openDecisionRoom(payload.transcript, "voice");
      speakRecordedResponse(
        attempt,
        payload.transcript,
        payload.agentResponse,
        payload.locale,
      );
    } catch (error) {
      if (attempt !== voiceAttempt.current) return;
      if (browserTranscript.length >= 3) {
        const agentResponse =
          "Your request was transcribed in the browser. I’ve updated the illustrative results for you to review.";
        voiceTranscript.current = browserTranscript;
        agentTranscript.current = agentResponse;
        setVoiceState({
          phase: "speaking",
          announcement:
            "Gemini is unavailable. Browser transcription updated the property results instead.",
          transcript: browserTranscript,
          agentTranscript: agentResponse,
        });
        setSearchStatus(
          "Gemini is unavailable, so browser transcription was used for this voice search.",
        );
        void openDecisionRoom(browserTranscript, "voice");
        speakRecordedResponse(
          attempt,
          browserTranscript,
          agentResponse,
          navigator.language || "en-US",
        );
        return;
      }

      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "Gemini voice understanding timed out. Please try a shorter request."
          : error instanceof Error
            ? error.message
            : "Gemini could not understand this voice turn.";
      setVoiceState({
        phase: "error",
        code: "unavailable",
        announcement: `${message} Text search remains available.`,
      });
      setSearchStatus(`${message} Your typed brief and existing results remain available.`);
    }
  }

  async function endVoiceInput() {
    if (recordedSession.current) {
      await finishRecordedVoice(voiceAttempt.current);
      return;
    }
    if (voiceSession.current) {
      await voiceSession.current.endInput();
      stopMediaStream(mediaStream.current);
      mediaStream.current = null;
      return;
    }
    if (voiceState.phase === "speaking") {
      resetVoiceExperience("Voice response stopped. Your property results remain available.");
    }
  }

  async function handleVoiceAgent() {
    const activePhases = ["requesting", "connecting", "listening", "thinking", "speaking"];
    if (activePhases.includes(voiceState.phase)) {
      if (voiceState.phase === "listening") {
        await endVoiceInput();
      } else {
        resetVoiceExperience("Voice session ended. Your typed brief remains available.");
      }
      return;
    }

    const attempt = ++voiceAttempt.current;

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof AudioContext === "undefined" ||
      typeof AudioWorkletNode === "undefined"
    ) {
      setVoiceState({
        phase: "error",
        code: "unsupported",
        announcement: "Voice is not supported here. Text search remains available.",
      });
      return;
    }

    setVoiceState({
      phase: "requesting",
      announcement: "Checking microphone permission for the Gemini voice session.",
    });

    if (await microphonePermissionIsDenied()) {
      if (attempt !== voiceAttempt.current) return;
      setVoiceState({
        phase: "error",
        code: "permission-denied",
        announcement: "Microphone access is blocked. Text search remains available.",
      });
      return;
    }

    try {
      await voiceSession.current?.dispose();
      await recordedSession.current?.dispose();
      browserSpeechSession.current?.dispose();
      voiceSession.current = null;
      recordedSession.current = null;
      browserSpeechSession.current = null;
      voiceTranscript.current = "";
      agentTranscript.current = "";

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (attempt !== voiceAttempt.current) {
        stopMediaStream(stream);
        return;
      }
      mediaStream.current = stream;

      const [
        { GeminiLiveVoiceSession: GeminiSession },
        { RecordedVoiceSession: Recorder },
        { BrowserSpeechSession: BrowserSpeech },
      ] =
        await Promise.all([
          import("@/lib/voice/gemini-live-session"),
          import("@/lib/voice/recorded-voice-session"),
          import("@/lib/voice/browser-speech-session"),
        ]);
      if (attempt !== voiceAttempt.current) {
        stopMediaStream(stream);
        mediaStream.current = null;
        return;
      }

      const recorder = new Recorder({
        onLimit: () => void finishRecordedVoice(attempt),
      });
      recordedSession.current = recorder;
      await recorder.start(stream);

      if (BrowserSpeech.isSupported()) {
        const browserSpeech = new BrowserSpeech({
          onTranscript: (transcript) => {
            if (attempt !== voiceAttempt.current || !recordedSession.current) return;
            voiceTranscript.current = transcript;
            setVoiceState({
              phase: "listening",
              announcement: "Browser transcription is capturing the property brief as a fallback.",
              transcript,
              mode: "recorded",
            });
          },
        });
        if (browserSpeech.start()) browserSpeechSession.current = browserSpeech;
      }

      if (voiceMode === "recorded") {
        setVoiceState({
          phase: "listening",
          announcement: "Gemini voice-turn mode is recording your property brief.",
          transcript: "",
          mode: "recorded",
        });
        setSearchStatus("Gemini voice-turn mode is active. Speak, then choose stop.");
        return;
      }

      const session = new GeminiSession({
        onStatus: (status) => {
          if (attempt === voiceAttempt.current) applyVoiceStatus(status);
        },
        onTranscript: (transcript) => {
          if (attempt !== voiceAttempt.current) return;
          voiceTranscript.current = transcript;
          setVoiceState({
            phase: "listening",
            announcement: "Rama is transcribing the property brief.",
            transcript,
            mode: "live",
          });
        },
        onAgentTranscript: (transcript) => {
          if (attempt !== voiceAttempt.current) return;
          agentTranscript.current = transcript;
          setVoiceState({
            phase: "speaking",
            announcement: "Rama is responding to the property brief.",
            transcript: voiceTranscript.current,
            agentTranscript: transcript,
          });
        },
        onFinalTranscript: (transcript) => {
          if (attempt !== voiceAttempt.current) return;
          voiceTranscript.current = transcript;
          setVoiceState({
            phase: "thinking",
            announcement: "The voice brief is complete. Fetching matching property content.",
            transcript,
          });
          setSearchStatus("Rama is matching this brief against the governed catalog.");
        },
        onToolResult: (result) => {
          if (attempt !== voiceAttempt.current) return;
          setAgentBlocks(result.blocks);
          setSearchStatus(result.summary);
          if (result.decisionEnvelope) {
            setDecisionEnvelope(result.decisionEnvelope);
            router.push(`/discover/${result.decisionEnvelope.searchRunId}`);
          }
        },
        onError: (message) => {
          if (attempt !== voiceAttempt.current) return;
          voiceSession.current = null;
          if (recordedSession.current && mediaStream.current?.active) {
            setVoiceState({
              phase: "listening",
              announcement: "Gemini Live is unavailable. Secure recorded voice mode is listening.",
              transcript: "",
              mode: "recorded",
            });
            setSearchStatus("Recorded Gemini voice mode is active. Speak, then choose stop.");
            return;
          }

          stopMediaStream(mediaStream.current);
          mediaStream.current = null;
          setVoiceState({
            phase: "error",
            code: "connection-failed",
            announcement: `${message} Text search remains available.`,
          });
          setSearchStatus(`${message} Your typed brief and existing results remain available.`);
        },
        onComplete: () => {
          if (attempt !== voiceAttempt.current) return;
          stopMediaStream(mediaStream.current);
          mediaStream.current = null;
          setVoiceState({
            phase: "complete",
            announcement: "The Gemini Live voice session is complete.",
            transcript: voiceTranscript.current,
            agentTranscript: agentTranscript.current || undefined,
          });
        },
      });
      voiceSession.current = session;

      try {
        await session.start(stream, voiceName);
        const standbyRecorder = recordedSession.current;
        const standbyBrowserSpeech = browserSpeechSession.current;
        recordedSession.current = null;
        browserSpeechSession.current = null;
        await standbyRecorder?.dispose();
        standbyBrowserSpeech?.dispose();
        setSearchStatus("Gemini Live voice mode is active. Speak naturally, then choose stop.");
      } catch {
        voiceSession.current = null;
        await session.dispose();
        if (recordedSession.current && mediaStream.current?.active) {
          setVoiceState({
            phase: "listening",
            announcement: "Secure recorded voice mode is listening for your property brief.",
            transcript: "",
            mode: "recorded",
          });
          setSearchStatus("Recorded Gemini voice mode is active. Speak, then choose stop.");
          return;
        }
        throw new Error("Gemini voice could not start.");
      }
    } catch (error) {
      const session = voiceSession.current;
      const recorder = recordedSession.current;
      const browserSpeech = browserSpeechSession.current;
      voiceSession.current = null;
      recordedSession.current = null;
      browserSpeechSession.current = null;
      void session?.dispose();
      void recorder?.dispose();
      browserSpeech?.dispose();
      stopMediaStream(mediaStream.current);
      mediaStream.current = null;
      if (attempt !== voiceAttempt.current) return;
      const permissionDenied = error instanceof DOMException && error.name === "NotAllowedError";
      setVoiceState({
        phase: "error",
        code: permissionDenied ? "permission-denied" : "connection-failed",
        announcement: permissionDenied
          ? "Microphone access was not granted. Text search remains available."
          : `${error instanceof Error ? error.message : "Gemini voice could not start."} Text search remains available.`,
      });
    }
  }

  function openProperty(property: SampleProperty, trigger: HTMLElement) {
    propertyTrigger.current = trigger;
    selectProperty(property);
  }

  function closeProperty() {
    selectProperty(null);
    requestAnimationFrame(() => propertyTrigger.current?.focus());
  }

  const briefIsInvalid = searchPhase === "error" && brief.trim().length < 3;
  const editorialProperties = properties.length > 0 ? properties : sampleProperties;
  const featuredProperty = editorialProperties[0];

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader />

      <main id="main-content">
        <section id="top" className="hero-stage" aria-labelledby="hero-title">
          <SectionShell className="hero-stage__inner">
            <MediaFrame className="hero-media">
              <Image
                src="/images/rama-hero-editorial-daylight.png"
                alt="Contemporary Dubai residence in a desert-edge landscape with the skyline beyond"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1280px"
              />
              <div className="hero-media__veil" aria-hidden="true" />
              <p className="hero-wordmark" aria-hidden="true">RAMA REALTY</p>

              <div className="hero-copy hero-reveal">
                <VoiceSignal state={voiceState} onPress={() => void handleVoiceAgent()} />
                <p className="eyebrow eyebrow--hero">Voice-led Dubai property discovery</p>
                <h1 id="hero-title">Describe the life. We’ll shape the search.</h1>
                <p className="hero-subtitle">Speak naturally or type a brief. Rama keeps every criterion visible.</p>

                <form
                  id="guided-search"
                  className="hero-search"
                  aria-busy={searchPhase === "loading"}
                  onSubmit={handleSubmit}
                >
                  <label className="sr-only" htmlFor="property-brief">
                    Describe the Dubai property and lifestyle you want
                  </label>
                  <div className="hero-search__control">
                    <Search aria-hidden="true" />
                    <input
                      ref={propertyBriefInput}
                      id="property-brief"
                      value={brief}
                      onChange={(event) => setBrief(event.target.value)}
                      placeholder="A two-bedroom apartment in Dubai Marina near the waterfront"
                      maxLength={500}
                      aria-invalid={briefIsInvalid}
                      aria-describedby={
                        briefIsInvalid
                          ? "property-brief-guidance property-brief-error"
                          : "property-brief-guidance"
                      }
                    />
                    <Button
                      className="search-submit"
                      type="submit"
                      isDisabled={searchPhase === "loading"}
                      aria-label={searchPhase === "loading" ? "Searching properties" : "Search properties"}
                    >
                      <span>{searchPhase === "loading" ? "Searching" : "Search"}</span>
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>



                  {briefIsInvalid ? (
                    <p id="property-brief-error" className="hero-search__error" role="alert">{searchError}</p>
                  ) : null}

                  <div className="hero-search__meta">
                    <span id="property-brief-guidance">
                      <LockKeyhole aria-hidden="true" /> Text always works · illustrative inventory
                    </span>
                  </div>
                </form>
              </div>

              <div className="hero-caption" aria-hidden="true">
                <span>Dubai, UAE</span>
                <span>Conversation to shortlist</span>
              </div>
            </MediaFrame>
            
            <div className="hero-stage__footer">
              <div className="hero-thumbnails" aria-hidden="true">
                {sampleProperties.slice(0, 3).map((property, i) => (
                  <MediaFrame key={property.id} className={`hero-thumb hero-thumb--${i}`}>
                    <Image src={property.image} alt="" fill sizes="260px" />
                  </MediaFrame>
                ))}
              </div>
              <div className="hero-intro">
                <p>Start with how you want to live. Rama keeps the brief, the trade-offs, and every sample match visible.</p>
              </div>
            </div>
          </SectionShell>
        </section>

        <section id="current-brief" className="brief-summary" aria-label="Current sample property brief">
          <SectionShell className="brief-summary__inner">
            <div className="brief-summary__status">
              <span>Current brief</span>
              <p className="search-status" aria-live="polite">{searchStatus}</p>
            </div>
            <div className="criteria-list" aria-label="Extracted sample criteria">
              {criteria.map((criterion) => <span key={criterion}>{criterion}</span>)}
            </div>
            <SavedBriefControl />
          </SectionShell>
        </section>

        <section className="agent-canvas" aria-label="Live Rama response">
          <SectionShell>
            <AgentResponseBlocks blocks={agentBlocks} />
          </SectionShell>
        </section>

        <section className="context-section section-block" aria-labelledby="context-title">
          <SectionShell className="context-section__inner">
            <div className="context-content">
              <SectionHeading
                id="context-title"
                eyebrow="A better starting point"
                title="The useful part of a filter—without the form."
                description="The conversation becomes a calm, reviewable decision brief before Rama shows any illustrative property."
              />
              <div className="discovery-steps">
                {discoverySteps.map((step) => (
                  <article key={step.number} className="discovery-step">
                    <span>{step.number}</span>
                    <h3>{step.title}</h3>
                    <p>{step.copy}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="context-media-collage" aria-hidden="true">
              {sampleProperties.slice(0, 3).map((prop, i) => (
                <MediaFrame key={prop.id} className={`collage-item collage-item--${i}`}>
                  <Image src={prop.image} alt="" fill sizes="(max-width: 768px) 50vw, 30vw" />
                </MediaFrame>
              ))}
            </div>
          </SectionShell>
        </section>

        <section
          id="residences"
          className="residences section-block"
          aria-labelledby="residences-title"
          aria-busy={searchPhase === "loading"}
        >
          <SectionShell>
            <div className="section-intro">
              <SectionHeading
                id="residences-title"
                eyebrow="Illustrative Dubai shortlist"
                title="Residences with their reasons attached."
                description={
                  properties.length === 0
                    ? "No illustrative sample satisfies every hard constraint in this brief. Adjust one criterion to widen the sample set."
                    : "Each sample demonstrates the intended decision flow; no live listing feed is connected."
                }
              />
              <div className="results-meta">
                <span>{String(properties.length).padStart(2, "0")} sample homes</span>
                <span>Sorted by brief match</span>
              </div>
            </div>

            {properties.length > 0 ? (
              <div className="property-grid">
                {properties.map((property, index) => (
                  <PropertyCard
                    key={property.id}
                    index={index}
                    property={property}
                    favorite={favoriteIds.includes(property.id)}
                    onFavorite={toggleFavorite}
                    onSelect={openProperty}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-results" role="status">
                <p>No illustrative residence meets every hard constraint.</p>
                <span>Rama kept the criteria intact. Change one constraint above to run a broader sample search.</span>
              </div>
            )}
          </SectionShell>
        </section>

        <section id="services" className="services-section section-block" aria-labelledby="services-title">
          <SectionShell>
            <SectionHeading
              id="services-title"
              eyebrow="Buyer concierge"
              title="One conversation. Four visible decisions."
              description="Rama keeps the judgment work of property discovery understandable—without pretending this prototype is a live brokerage feed."
              align="center"
            />
            <div className="services-layout">
              <MediaFrame className="services-media">
                <Image src={featuredProperty.image} alt={featuredProperty.imageAlt} fill sizes="(max-width: 860px) 100vw, 42vw" />
                <div className="services-media__caption">
                  <span>Illustrative residence</span>
                  <strong>{featuredProperty.location}</strong>
                </div>
              </MediaFrame>
              <div className="service-list">
                <article><MessageCircle aria-hidden="true" /><div><h3>Conversational discovery</h3><p>Describe lifestyle, location, routine, and trade-offs naturally.</p></div></article>
                <article><SlidersHorizontal aria-hidden="true" /><div><h3>Editable criteria</h3><p>Inspect the structured brief and refine one priority at a time.</p></div></article>
                <article><Building2 aria-hidden="true" /><div><h3>Explainable shortlist</h3><p>See why each illustrative property appeared for this brief.</p></div></article>
                <article><Eye aria-hidden="true" /><div><h3>Visible source boundaries</h3><p>Sample status and future connector seams remain explicit.</p></div></article>
              </div>
            </div>
          </SectionShell>
        </section>

        <section className="signature-section section-block" aria-labelledby="signature-title">
          <SectionShell>
            <SectionHeading
              id="signature-title"
              eyebrow="Featured context"
              title="A shortlist should feel like a dossier, not a feed."
              description="The strongest candidate can hold imagery, decision context, and a clear path back to the original brief in one composed view."
            />
            <div className="signature-media-layout">
              <MediaFrame className="signature-media-main" tone="muted">
                <Image src={featuredProperty.image} alt={featuredProperty.imageAlt} fill sizes="(max-width: 768px) 100vw, 1280px" />
              </MediaFrame>
              <MediaFrame className="signature-media-polaroid">
                <Image src={sampleProperties[1].image} alt="" fill sizes="400px" />
              </MediaFrame>
              <div className="signature-dossier">
                <p className="eyebrow">Lead illustrative match</p>
                <h3>{featuredProperty.name}</h3>
                <span>{featuredProperty.location} · {featuredProperty.price}</span>
                <p>{featuredProperty.match}</p>
                <Button variant="outline" onPress={(event) => openProperty(featuredProperty, event.target as HTMLElement)}>
                  Review context <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          </SectionShell>
        </section>

        <section className="path-section section-block" aria-labelledby="path-title">
          <SectionShell>
            <SectionHeading
              id="path-title"
              eyebrow="How Rama works"
              title="A pathway from conversation to context."
              align="center"
            />
            <ol className="services-card-grid">
              {decisionPath.map(([number, title, copy]) => (
                <li key={number} className="service-card">
                  <div className="service-card__header">
                    <span>{number}</span>
                  </div>
                  <div className="service-card__content">
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="property-mosaic" aria-label="Illustrative Dubai residence imagery">
              {sampleProperties.map((property, index) => (
                <MediaFrame key={property.id} className={`property-mosaic__item property-mosaic__item--${index + 1}`}>
                  <Image src={property.image} alt={property.imageAlt} fill sizes="(max-width: 720px) 100vw, 33vw" />
                </MediaFrame>
              ))}
            </div>
          </SectionShell>
        </section>

        <section id="methodology" className="methodology section-block" aria-labelledby="methodology-title">
          <SectionShell className="methodology-grid">
            <div className="methodology-copy">
              <p className="eyebrow">Evidence, not mystery</p>
              <h2 id="methodology-title">Every result keeps its reason.</h2>
              <p>Rama holds the buyer’s words, the structured brief, and the sample match logic in one visible chain. Nothing here claims live inventory or hidden certainty.</p>
              <div className="methodology-note"><ShieldCheck aria-hidden="true" /><span>Local illustrative data only. Licensed supply remains a future connector.</span></div>
            </div>
            <ol className="evidence-ledger">
              <li><span>01 · What you said</span><p>“{brief}”</p></li>
              <li><span>02 · What Rama understood</span><p>{criteria.join(" · ")}</p></li>
              <li><span>03 · Why these appeared</span><p>{properties[0]?.match ?? "No illustrative property candidates matched the current brief."}</p></li>
              <li><span>Source status</span><p>{resultSource}. No valuation or market-data feed is connected.</p></li>
            </ol>
            <div className="trust-markers" aria-label="Prototype trust boundaries">
              <div><Database aria-hidden="true" /><span>Source</span><strong>{resultSource}</strong></div>
              <div><ShieldCheck aria-hidden="true" /><span>Credentials</span><strong>Server held</strong></div>
              <div><Eye aria-hidden="true" /><span>Match logic</span><strong>Visible</strong></div>
            </div>
          </SectionShell>
        </section>

        <section className="faq-section section-block" aria-labelledby="faq-title">
          <SectionShell className="faq-layout">
            <SectionHeading
              id="faq-title"
              eyebrow="Before you begin"
              title="Frequently asked questions"
              description="Clear boundaries make a better product experience—and a better starting conversation."
            />
            <Accordion className="faq-accordion">
              {frequentlyAsked.map((item) => (
                <AccordionItem key={item.question} id={item.question}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent><p>{item.answer}</p></AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </SectionShell>
        </section>

        <section className="closing-cta section-block" aria-labelledby="closing-title">
          <SectionShell className="closing-cta__inner">
            <div className="closing-content">
              <h2 id="closing-title">Ready to start your next discovery?</h2>
              <LinkButton className="rama-button rama-button--primary" href="#guided-search">
                Shape your brief <ArrowRight aria-hidden="true" />
              </LinkButton>
            </div>
            <div className="closing-cta__media" aria-hidden="true">
              <MediaFrame>
                <Image src={sampleProperties[0].image} alt="" fill sizes="400px" />
              </MediaFrame>
            </div>
            <div className="closing-wordmark" aria-hidden="true">RAMA REALTY</div>
          </SectionShell>
        </section>
      </main>

      <SiteFooter />

      <VoiceConversation
        state={voiceState}
        onStop={() => void endVoiceInput()}
        onClose={() => resetVoiceExperience()}
      />

      {selectedProperty ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeProperty(); }}>
          <div
            ref={propertyModal}
            className="property-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="property-modal-title"
            aria-describedby="property-modal-description"
          >
            <Button className="modal-close" variant="outline" size="icon" aria-label="Close sample property details" autoFocus onPress={closeProperty}>
              <X aria-hidden="true" />
            </Button>
            <div className="modal-image">
              <Image src={selectedProperty.image} alt={selectedProperty.imageAlt} fill sizes="(max-width: 760px) 100vw, 52vw" />
            </div>
            <div className="modal-content">
              <p className="eyebrow">Sample search result</p>
              <h2 id="property-modal-title">{selectedProperty.name}</h2>
              <div className="modal-price-row"><span>{selectedProperty.location}</span><strong>{selectedProperty.price}</strong></div>
              <p id="property-modal-description">This sample detail demonstrates how a candidate keeps its match reason and search context. No live property record is attached.</p>
              <div className="match-reason match-reason--modal"><Check aria-hidden="true" /><span>{selectedProperty.match}</span></div>
              <Button className="rama-button rama-button--primary" onPress={closeProperty}>Return to sample results</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
