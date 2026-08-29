"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Database,
  LockKeyhole,
  MessageCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useLandingStore } from "@/components/providers/landing-store-provider";
import { Button } from "@/components/ui/button";
import { SectionShell } from "@/components/rama/section-shell";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VoiceConversation } from "@/components/voice-conversation";
import { VoiceSignal } from "@/components/voice-signal";
import { BriefConfirmation } from "@/components/brief-confirmation";
import { DecisionAperture } from "@/components/rama/decision-aperture";
import type { GeminiLiveSignalState } from "@/components/rama/gemini-live-signal";
import { VoiceAction } from "@/components/rama/voice-action";
import { VoiceDiscoveryDialog } from "@/components/rama/voice-discovery-dialog";
import { elapsedBucket, emitProductEvent } from "@/lib/product-events";
import { emitOperationalVoiceStage } from "@/lib/voice/operational-voice-telemetry";
import type {
  GeminiVoiceStageMetric,
  GeminiLiveVoiceSession,
  GeminiVoiceStatus,
} from "@/lib/voice/gemini-live-session";
import type {
  GeminiRecordedVoiceError,
  GeminiRecordedVoiceResponse,
} from "@/lib/voice/gemini-live-contracts";
import type { RecordedVoiceSession } from "@/lib/voice/recorded-voice-session";
import type { BrowserSpeechSession } from "@/lib/voice/browser-speech-session";
import {
  microphonePermissionIsDenied,
  requestMicrophoneStream,
  stopMediaStream,
  type MicrophoneStageMetric,
} from "@/lib/voice/media-lifecycle";
import { localizedPath, type PublicLocale } from "@/lib/i18n";
import type { LandingRuntimeCopy } from "@/lib/discovery-composer-contract";

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

export function LandingPage({
  locale,
  copy,
  mode = "legacy",
}: {
  locale: PublicLocale;
  copy: LandingRuntimeCopy;
  mode?: "legacy" | "composer";
}) {
  const brief = useLandingStore((state) => state.brief);
  const searchPhase = useLandingStore((state) => state.searchPhase);
  const searchStatus = useLandingStore((state) => state.searchStatus);
  const searchError = useLandingStore((state) => state.searchError);
  const voiceState = useLandingStore((state) => state.voiceState);
  const voiceMode = useLandingStore((state) => state.voiceMode);
  const voiceName = useLandingStore((state) => state.voiceName);
  const setBrief = useLandingStore((state) => state.setBrief);
  const setVoiceState = useLandingStore((state) => state.setVoiceState);
  const setSearchStatus = useLandingStore((state) => state.setSearchStatus);
  const reportBriefError = useLandingStore((state) => state.reportBriefError);
  const setAgentBlocks = useLandingStore((state) => state.setAgentBlocks);
  const preparedBrief = useLandingStore((state) => state.preparedBrief);
  const briefRecalculating = useLandingStore((state) => state.briefRecalculating);
  const prepareBrief = useLandingStore((state) => state.prepareBrief);
  const updatePreparedBrief = useLandingStore((state) => state.updatePreparedBrief);
  const cancelPreparedBrief = useLandingStore((state) => state.cancelPreparedBrief);
  const confirmPreparedBrief = useLandingStore((state) => state.confirmPreparedBrief);
  const router = useRouter();
  const voiceCopy = copy.architecture.voice;
  const [discoveryDialogOpen, setDiscoveryDialogOpen] = useState(false);
  const [discoveryInputMode, setDiscoveryInputMode] = useState<"voice" | "text">("voice");

  const mediaStream = useRef<MediaStream | null>(null);
  const voiceSession = useRef<GeminiLiveVoiceSession | null>(null);
  const recordedSession = useRef<RecordedVoiceSession | null>(null);
  const browserSpeechSession = useRef<BrowserSpeechSession | null>(null);
  const recordedTurnAbort = useRef<AbortController | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceAttempt = useRef(0);
  const voiceAttemptId = useRef("");
  const voiceAttemptAbort = useRef<AbortController | null>(null);
  const voiceTranscript = useRef("");
  const agentTranscript = useRef("");
  const propertyBriefInput = useRef<HTMLInputElement | null>(null);
  const propertyBriefTextarea = useRef<HTMLTextAreaElement | null>(null);
  const voiceSignalRef = useRef<HTMLButtonElement | null>(null);
  const voiceStartedAt = useRef<number | null>(null);
  const lastVoicePhase = useRef<string>("");

  useEffect(() => {
    if (mode !== "composer") return;

    const openFromEvent = (event: Event) => {
      const requestedMode = event instanceof CustomEvent && event.detail?.mode === "text" ? "text" : "voice";
      if (event instanceof CustomEvent && typeof event.detail?.brief === "string") {
        setBrief(event.detail.brief);
      }
      setDiscoveryInputMode(requestedMode);
      setDiscoveryDialogOpen(true);
    };
    const openFromHash = () => {
      if (window.location.hash !== "#guided-search") return;
      setDiscoveryInputMode("text");
      setDiscoveryDialogOpen(true);
    };
    const openFromQuery = () => {
      const requestedMode = new URLSearchParams(window.location.search).get("briefMode");
      if (requestedMode !== "voice" && requestedMode !== "text") return;
      setDiscoveryInputMode(requestedMode);
      setDiscoveryDialogOpen(true);
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.hash}`);
    };

    window.addEventListener("rama:open-discovery", openFromEvent);
    window.addEventListener("hashchange", openFromHash);
    openFromQuery();
    openFromHash();
    return () => {
      window.removeEventListener("rama:open-discovery", openFromEvent);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [mode, setBrief]);

  useEffect(() => {
    if (lastVoicePhase.current === voiceState.phase) return;
    lastVoicePhase.current = voiceState.phase;
    if (voiceState.phase === "requesting" || (voiceState.phase !== "idle" && voiceStartedAt.current === null)) voiceStartedAt.current = performance.now();
    const startedAt = voiceStartedAt.current ?? performance.now();
    emitProductEvent({
      event: "voice.lifecycle",
      state: voiceState.phase,
      mode: "mode" in voiceState && voiceState.mode ? voiceState.mode : voiceMode === "recorded" ? "recorded" : "live",
      locale,
      elapsed: elapsedBucket(performance.now() - startedAt),
      timestamp: new Date().toISOString(),
    });
    if (["complete", "error", "idle"].includes(voiceState.phase)) voiceStartedAt.current = null;
  }, [locale, voiceMode, voiceState]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (speechTimer.current) clearTimeout(speechTimer.current);
      stopMediaStream(mediaStream.current);
      const session = voiceSession.current;
      const recorder = recordedSession.current;
      const browserSpeech = browserSpeechSession.current;
      recordedTurnAbort.current?.abort();
      voiceAttemptAbort.current?.abort();
      voiceAttemptAbort.current = null;
      recordedTurnAbort.current = null;
      voiceSession.current = null;
      recordedSession.current = null;
      browserSpeechSession.current = null;
      void session?.dispose();
      void recorder?.dispose();
      browserSpeech?.dispose();
    };
  }, []);

  async function confirmAndOpenDecisionRoom() {
    if (voiceState.phase !== "idle") resetVoiceExperience();
    const source = preparedBrief?.source ?? "text";
    const searchRunId = await confirmPreparedBrief();
    if (!searchRunId) return;
    emitProductEvent({ event: "landing.brief_submit", searchRunId, source, timestamp: new Date().toISOString() });
    sessionStorage.setItem("rama:decision-room-return-focus", source);
    setDiscoveryDialogOpen(false);
    document.querySelector<HTMLDialogElement>(".voice-discovery-dialog[open]")?.close();
    router.push(localizedPath(locale, `/discover/${searchRunId}`));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (brief.trim().length < 3) {
      reportBriefError(copy.shortBriefError);
      requestAnimationFrame(() => (propertyBriefTextarea.current ?? propertyBriefInput.current)?.focus());
      return;
    }
    void prepareBrief(brief, "text");
  }

  function resetVoiceExperience(message?: string) {
    voiceAttempt.current += 1;
    voiceAttemptAbort.current?.abort();
    voiceAttemptAbort.current = null;
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

  function emitVoiceStage(metric: MicrophoneStageMetric | GeminiVoiceStageMetric) {
    emitProductEvent({
      event: "voice.stage",
      stage: metric.stage,
      outcome: metric.outcome,
      mode: metric.stage === "permission" || metric.stage === "microphone" ? "unknown" : "live",
      locale,
      elapsed: elapsedBucket(metric.durationMs),
      timestamp: new Date().toISOString(),
    });
    emitOperationalVoiceStage({
      attemptId: voiceAttemptId.current,
      stage: metric.stage,
      outcome: metric.outcome,
      mode: metric.stage === "permission" || metric.stage === "microphone" ? "unknown" : "live",
      locale,
      durationMs: metric.durationMs,
      reconnectCount: "reconnectCount" in metric ? metric.reconnectCount ?? 0 : 0,
    });
  }

  function emitVoiceFallback(outcome: "success" | "error") {
    emitOperationalVoiceStage({
      attemptId: voiceAttemptId.current,
      stage: "fallback",
      outcome,
      mode: "recorded",
      locale,
      durationMs: Math.max(0, performance.now() - (voiceStartedAt.current ?? performance.now())),
      reconnectCount: 0,
    });
  }

  function applyVoiceStatus(status: GeminiVoiceStatus) {
    if (status === "connecting") {
      setVoiceState({
        phase: "connecting",
        announcement: voiceCopy.announcements.connecting,
      });
    } else if (status === "listening") {
      setVoiceState({
        phase: "listening",
        announcement: voiceCopy.announcements.listening,
        transcript: voiceTranscript.current,
        mode: "live",
      });
    } else if (status === "thinking") {
      setVoiceState({
        phase: "thinking",
        announcement: voiceCopy.announcements.thinking,
        transcript: voiceTranscript.current,
      });
    } else {
      setVoiceState({
        phase: "speaking",
        announcement: voiceCopy.announcements.speaking,
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
      announcement: voiceCopy.announcements.complete,
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
      announcement: voiceCopy.announcements.recordingComplete,
      transcript: "",
    });

    let browserTranscript = "";
    try {
      const results = await Promise.allSettled([
        recorder.stop(),
        browserSpeech?.stop() ?? Promise.resolve(""),
      ]);
      stopMediaStream(mediaStream.current);
      mediaStream.current = null;
      if (results[0].status === "rejected") throw results[0].reason;
      const result = results[0].value;
      const browserResult = results[1].status === "fulfilled" ? results[1].value : "";
      browserTranscript = browserResult.trim().slice(0, 500);
      if (attempt !== voiceAttempt.current) return;
      if ((!result.hasSpeech || result.durationMs < 300) && browserTranscript.length < 3) {
        setVoiceState({
          phase: "error",
          code: "unavailable",
          announcement: voiceCopy.announcements.noSpeech,
        });
        setSearchStatus(voiceCopy.statuses.noSpeech);
        return;
      }

      const formData = new FormData();
      formData.append("audio", result.audio, "rama-voice-turn.wav");
      const controller = new AbortController();
      recordedTurnAbort.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 35_000);
      let response: Response;
      let payload: unknown;
      try {
        response = await fetch("/api/voice/turn", {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
          signal: controller.signal,
          cache: "no-store",
        });
        payload = await response.json();
      } finally {
        clearTimeout(timeoutId);
        if (recordedTurnAbort.current === controller) recordedTurnAbort.current = null;
      }

      if (!response.ok) {
        const message = (payload as Partial<GeminiRecordedVoiceError>).error;
        throw new Error(message || voiceCopy.errors.couldNotUnderstand);
      }
      if (!isRecordedVoiceResponse(payload)) {
        throw new Error(voiceCopy.errors.invalidResponse);
      }
      if (attempt !== voiceAttempt.current) return;

      voiceTranscript.current = payload.transcript;
      agentTranscript.current = payload.agentResponse;
      setBrief(payload.transcript);
      setVoiceState({
        phase: "speaking",
        announcement: voiceCopy.announcements.understood,
        transcript: payload.transcript,
        agentTranscript: payload.agentResponse,
      });
      const prepared = await prepareBrief(payload.transcript, "voice");
      if (attempt !== voiceAttempt.current) return;
      if (!prepared) {
        setVoiceState({
          phase: "error",
          code: "unavailable",
          announcement: voiceCopy.announcements.prepareFailed,
        });
        return;
      }
      speakRecordedResponse(
        attempt,
        payload.transcript,
        payload.agentResponse,
        payload.locale,
      );
    } catch (error) {
      if (attempt !== voiceAttempt.current) return;
      if (browserTranscript.length >= 3) {
        const agentResponse = voiceCopy.responses.browserFallback;
        voiceTranscript.current = browserTranscript;
        agentTranscript.current = agentResponse;
        setBrief(browserTranscript);
        setVoiceState({
          phase: "speaking",
          announcement: voiceCopy.announcements.browserFallbackUsed,
          transcript: browserTranscript,
          agentTranscript: agentResponse,
        });
        setSearchStatus(voiceCopy.statuses.browserFallbackUsed);
        const prepared = await prepareBrief(browserTranscript, "voice");
        if (attempt !== voiceAttempt.current) return;
        if (!prepared) {
          setVoiceState({
            phase: "error",
            code: "unavailable",
            announcement: voiceCopy.announcements.prepareFailed,
          });
          return;
        }
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
          ? voiceCopy.errors.timeout
          : voiceCopy.errors.couldNotUnderstand;
      setVoiceState({
        phase: "error",
        code: "unavailable",
        announcement: `${message} ${voiceCopy.announcements.unavailableWithText}`,
      });
      setSearchStatus(`${message} ${voiceCopy.statuses.sessionEnded}`);
    }
  }

  async function endVoiceInput() {
    if (recordedSession.current) {
      await finishRecordedVoice(voiceAttempt.current);
      return;
    }
    if (["requesting", "connecting", "thinking"].includes(voiceState.phase)) {
      resetVoiceExperience(voiceCopy.statuses.sessionEnded);
      return;
    }
    if (voiceSession.current) {
      await voiceSession.current.endInput();
      stopMediaStream(mediaStream.current);
      mediaStream.current = null;
      return;
    }
    if (voiceState.phase === "speaking") {
      resetVoiceExperience(voiceCopy.statuses.responseStopped);
    }
  }

  async function handleVoiceAgent(forceStart = false) {
    const activePhases = ["requesting", "connecting", "listening", "thinking", "speaking"];
    if (!forceStart && activePhases.includes(voiceState.phase)) {
      if (voiceState.phase === "listening") {
        await endVoiceInput();
      } else {
        resetVoiceExperience(voiceCopy.statuses.sessionEnded);
      }
      return;
    }

    const attempt = ++voiceAttempt.current;
    voiceAttemptId.current = crypto.randomUUID();
    voiceAttemptAbort.current?.abort();
    const attemptController = new AbortController();
    voiceAttemptAbort.current = attemptController;

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof AudioContext === "undefined" ||
      typeof AudioWorkletNode === "undefined"
    ) {
      setVoiceState({
        phase: "error",
        code: "unsupported",
        announcement: voiceCopy.announcements.unsupported,
      });
      return;
    }

    setVoiceState({
      phase: "requesting",
      announcement: voiceCopy.announcements.requestingPermission,
    });

    let permissionDeniedBeforePrompt = false;
    try {
      permissionDeniedBeforePrompt = await microphonePermissionIsDenied({
        signal: attemptController.signal,
        onMetric: emitVoiceStage,
      });
    } catch {
      // Closing the dialog or starting a newer attempt intentionally aborts
      // permission preflight. It is not a buyer-facing failure.
      if (attemptController.signal.aborted || attempt !== voiceAttempt.current) return;
      setVoiceState({
        phase: "error",
        code: "connection-failed",
        announcement: voiceCopy.announcements.connectionFailed,
      });
      return;
    }
    if (attempt !== voiceAttempt.current) return;
    if (permissionDeniedBeforePrompt) {
      setVoiceState({
        phase: "error",
        code: "permission-denied",
        announcement: voiceCopy.announcements.permissionBlocked,
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

      const stream = await requestMicrophoneStream({
        signal: attemptController.signal,
        onMetric: emitVoiceStage,
        constraints: {
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
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
              announcement: voiceCopy.announcements.browserCapture,
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
          announcement: voiceCopy.announcements.recordedListening,
          transcript: "",
          mode: "recorded",
        });
        setSearchStatus(voiceCopy.statuses.recordedActive);
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
            announcement: voiceCopy.announcements.transcribing,
            transcript,
            mode: "live",
          });
        },
        onAgentTranscript: (transcript) => {
          if (attempt !== voiceAttempt.current) return;
          agentTranscript.current = transcript;
          setVoiceState({
            phase: "speaking",
            announcement: voiceCopy.announcements.speaking,
            transcript: voiceTranscript.current,
            agentTranscript: transcript,
          });
        },
        onFinalTranscript: (transcript) => {
          if (attempt !== voiceAttempt.current) return;
          voiceTranscript.current = transcript;
          setVoiceState({
            phase: "thinking",
            announcement: voiceCopy.announcements.fetching,
            transcript,
          });
          setSearchStatus(voiceCopy.statuses.matching);
        },
        onToolResult: (result) => {
          if (attempt !== voiceAttempt.current) return;
          setAgentBlocks(result.blocks);
          setSearchStatus(result.summary);
          if (result.preparedBrief) {
            const draft = result.preparedBrief;
            setBrief(draft.transcript);
            void prepareBrief(draft.transcript, "voice", draft.draftId).then((prepared) => {
              if (attempt !== voiceAttempt.current) return;
              if (!prepared) {
                setVoiceState({
                  phase: "error",
                  code: "unavailable",
                  announcement: voiceCopy.announcements.prepareFailed,
                });
                return;
              }
              resetVoiceExperience();
            });
          }
        },
        onError: () => {
          if (attempt !== voiceAttempt.current) return;
          voiceSession.current = null;
          if (recordedSession.current && mediaStream.current?.active) {
            emitVoiceFallback("success");
            setVoiceState({
              phase: "listening",
              announcement: voiceCopy.announcements.liveUnavailableRecorded,
              transcript: "",
              mode: "recorded",
            });
            setSearchStatus(voiceCopy.statuses.recordedActive);
            return;
          }

          const fallbackStream = mediaStream.current;
          if (fallbackStream?.active) {
            const fallbackRecorder = new Recorder({
              onLimit: () => void finishRecordedVoice(attempt),
            });
            recordedSession.current = fallbackRecorder;
            void fallbackRecorder.start(fallbackStream).then(() => {
              if (attempt !== voiceAttempt.current || recordedSession.current !== fallbackRecorder) {
                void fallbackRecorder.dispose();
                return;
              }
              emitVoiceFallback("success");
              if (BrowserSpeech.isSupported()) {
                const browserSpeech = new BrowserSpeech({
                  onTranscript: (transcript) => {
                    if (attempt !== voiceAttempt.current || recordedSession.current !== fallbackRecorder) return;
                    voiceTranscript.current = transcript;
                    setVoiceState({
                      phase: "listening",
                      announcement: voiceCopy.announcements.browserCapture,
                      transcript,
                      mode: "recorded",
                    });
                  },
                });
                if (browserSpeech.start()) browserSpeechSession.current = browserSpeech;
              }
              setVoiceState({
                phase: "listening",
                announcement: voiceCopy.announcements.liveUnavailableRecorded,
                transcript: "",
                mode: "recorded",
              });
              setSearchStatus(voiceCopy.statuses.recordedActive);
            }).catch(() => {
              if (attempt !== voiceAttempt.current) return;
              if (recordedSession.current === fallbackRecorder) recordedSession.current = null;
              emitVoiceFallback("error");
              stopMediaStream(mediaStream.current);
              mediaStream.current = null;
              setVoiceState({
                phase: "error",
                code: "connection-failed",
                announcement: voiceCopy.announcements.connectionFailed,
              });
              setSearchStatus(voiceCopy.statuses.sessionEnded);
            });
            return;
          }

          stopMediaStream(mediaStream.current);
          emitVoiceFallback("error");
          mediaStream.current = null;
          setVoiceState({
            phase: "error",
            code: "connection-failed",
            announcement: voiceCopy.announcements.connectionFailed,
          });
          setSearchStatus(voiceCopy.statuses.sessionEnded);
        },
        onComplete: () => {
          if (attempt !== voiceAttempt.current) return;
          stopMediaStream(mediaStream.current);
          mediaStream.current = null;
          setVoiceState({
            phase: "complete",
            announcement: voiceCopy.announcements.liveComplete,
            transcript: voiceTranscript.current,
            agentTranscript: agentTranscript.current || undefined,
          });
        },
        onMetric: emitVoiceStage,
      });
      voiceSession.current = session;

      try {
        await session.start(stream, voiceName);
        if (attempt !== voiceAttempt.current) {
          await session.dispose();
          return;
        }
        const standbyRecorder = recordedSession.current;
        const standbyBrowserSpeech = browserSpeechSession.current;
        recordedSession.current = null;
        browserSpeechSession.current = null;
        await standbyRecorder?.dispose();
        standbyBrowserSpeech?.dispose();
        setSearchStatus(voiceCopy.statuses.liveActive);
      } catch {
        voiceSession.current = null;
        await session.dispose();
        if (recordedSession.current && mediaStream.current?.active) {
          emitVoiceFallback("success");
          setVoiceState({
            phase: "listening",
            announcement: voiceCopy.announcements.secureRecordedListening,
            transcript: "",
            mode: "recorded",
          });
          setSearchStatus(voiceCopy.statuses.recordedActive);
          return;
        }
        throw new Error(voiceCopy.errors.startFailed);
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
          ? voiceCopy.announcements.permissionNotGranted
          : voiceCopy.announcements.connectionFailed,
      });
    }
  }

  const briefIsInvalid = searchPhase === "error" && brief.trim().length < 3;
  const hasSearchError = searchPhase === "error" && Boolean(searchError);

  if (mode === "composer") {
    const voiceIsActive = ["requesting", "connecting", "listening", "thinking", "speaking"].includes(voiceState.phase);
    const signalState: GeminiLiveSignalState = preparedBrief
      ? "complete"
      : voiceState.phase === "error"
        ? "error"
        : voiceState.phase === "requesting" || voiceState.phase === "connecting"
          ? "requesting"
          : voiceState.phase === "listening"
            ? "listening"
            : voiceState.phase === "thinking" || voiceState.phase === "speaking"
              ? "processing"
              : voiceState.phase === "complete"
                ? "complete"
                : "resting";
    const dialogStatus = preparedBrief
      ? (briefRecalculating ? (locale === "ar" ? "جارٍ إعادة حساب المعايير…" : "Recalculating criteria…") : searchStatus)
      : voiceState.phase === "idle"
        ? (discoveryInputMode === "voice" ? copy.architecture.hero.dialogVoiceIntro : copy.architecture.hero.dialogTextIntro)
        : searchStatus;

    function preserveVoiceDraft() {
      const transcript = voiceTranscript.current.trim();
      if (!preparedBrief && transcript.length >= 3) setBrief(transcript);
    }

    function closeDiscoveryDialog() {
      preserveVoiceDraft();
      if (voiceState.phase !== "idle") resetVoiceExperience(voiceCopy.statuses.sessionEnded);
      setDiscoveryDialogOpen(false);
    }

    function openVoiceDiscovery() {
      setDiscoveryInputMode("voice");
      setDiscoveryDialogOpen(true);
      if (!preparedBrief) void handleVoiceAgent();
    }

    function switchToText() {
      preserveVoiceDraft();
      if (voiceState.phase !== "idle") resetVoiceExperience(voiceCopy.statuses.sessionEnded);
      setDiscoveryInputMode("text");
      requestAnimationFrame(() => propertyBriefTextarea.current?.focus({ preventScroll: true }));
    }

    function switchToVoice() {
      setDiscoveryInputMode("voice");
      void handleVoiceAgent();
    }

    return (
      <div id="guided-search" className="quiet-voice-launcher">
        <div className="quiet-voice-launcher__signal" aria-hidden="true">
          <DecisionAperture state="resting" />
        </div>
        <form className="quiet-voice-launcher__actions" action={localizedPath(locale)} method="get" onSubmit={(event) => event.preventDefault()}>
          <Button data-discovery-trigger="voice" name="briefMode" value="voice" type="submit" size="lg" onClick={(event) => event.preventDefault()} onPress={openVoiceDiscovery}>
            {copy.architecture.hero.primaryAction}
          </Button>
          <Button data-discovery-trigger="text" name="briefMode" value="text" type="submit" variant="ghost" onClick={(event) => event.preventDefault()} onPress={() => {
            setDiscoveryInputMode("text");
            setDiscoveryDialogOpen(true);
          }}>
            {copy.architecture.hero.secondaryAction}
          </Button>
        </form>

        <VoiceDiscoveryDialog
          open={discoveryDialogOpen}
          title={copy.architecture.hero.dialogTitle}
          description={copy.architecture.hero.dialogDescription}
          closeLabel={copy.architecture.hero.dialogClose}
          status={dialogStatus}
          announceStatus={preparedBrief !== null || discoveryInputMode === "text" || voiceState.phase === "idle"}
          signalState={signalState}
          signalSrc="/lottie/ai.json"
          initialFocusRef={discoveryInputMode === "text" && !preparedBrief ? propertyBriefTextarea : undefined}
          onRequestClose={closeDiscoveryDialog}
          footer={preparedBrief ? (
            <p className="voice-discovery-dialog__boundary"><LockKeyhole aria-hidden="true" />{copy.architecture.hero.dialogBoundary}</p>
          ) : (
            <>
              <div className="voice-discovery-dialog__actions">
                {discoveryInputMode === "voice" ? (
                  voiceIsActive ? (
                    <Button type="button" variant="ghost" onPress={switchToText}>{copy.architecture.hero.dialogTextAlternative}</Button>
                  ) : (
                    <>
                      <VoiceAction
                        state={voiceState}
                        label={copy.architecture.hero.voiceIdle}
                        activeLabel={copy.architecture.hero.voiceActive}
                        onPress={() => void handleVoiceAgent()}
                      />
                      <Button type="button" variant="ghost" onPress={switchToText}>{copy.architecture.hero.dialogTextAlternative}</Button>
                    </>
                  )
                ) : (
                  <>
                    <Button type="submit" form="guided-search-form" isDisabled={searchPhase === "loading" || briefRecalculating}>
                      {searchPhase === "loading" ? copy.opening : copy.architecture.hero.textAction}
                      <ArrowRight className="logical-forward-icon" aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="ghost" onPress={switchToVoice}>{copy.architecture.hero.dialogVoiceAlternative}</Button>
                  </>
                )}
              </div>
              <p id="property-brief-guidance" className="voice-discovery-dialog__boundary"><LockKeyhole aria-hidden="true" />{copy.architecture.hero.dialogBoundary}</p>
            </>
          )}
        >
          {preparedBrief ? (
            <>
              <BriefConfirmation
                draft={preparedBrief}
                busy={searchPhase === "loading"}
                recalculating={briefRecalculating}
                locale={locale}
                onChange={(value) => void updatePreparedBrief(value)}
                onConfirm={() => void confirmAndOpenDecisionRoom()}
                onCancel={() => {
                  if (voiceState.phase !== "idle") resetVoiceExperience();
                  cancelPreparedBrief();
                  setDiscoveryInputMode("text");
                }}
                onRetry={preparedBrief.source === "voice" ? () => {
                  resetVoiceExperience();
                  cancelPreparedBrief();
                  setDiscoveryInputMode("voice");
                  void handleVoiceAgent(true);
                } : undefined}
              />
              {hasSearchError ? <p id="property-brief-error" className="voice-discovery-dialog__error" role="alert">{searchError}</p> : null}
            </>
          ) : discoveryInputMode === "voice" ? (
            voiceState.phase === "idle" ? (
              <div className="voice-discovery-dialog__idle">
                <p>{copy.architecture.hero.dialogVoiceIntro}</p>
              </div>
            ) : (
              <VoiceConversation
                state={voiceState}
                copy={voiceCopy.panel}
                variant="dialog"
                announceStatus={!hasSearchError}
                onStop={() => void endVoiceInput()}
                onClose={closeDiscoveryDialog}
              />
            )
          ) : (
            <form
              id="guided-search-form"
              className="voice-discovery-dialog__form"
              aria-busy={searchPhase === "loading" || briefRecalculating}
              onSubmit={handleSubmit}
            >
              <label htmlFor="property-brief">{copy.architecture.hero.composerLabel}</label>
              <textarea
                ref={propertyBriefTextarea}
                id="property-brief"
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                placeholder={copy.placeholder}
                maxLength={500}
                rows={4}
                aria-invalid={briefIsInvalid}
                aria-describedby={briefIsInvalid ? "property-brief-guidance property-brief-error" : "property-brief-guidance"}
              />
              <p className="voice-discovery-dialog__count">{brief.length} / 500 {copy.architecture.hero.characterCount}</p>
              {hasSearchError ? <p id="property-brief-error" className="voice-discovery-dialog__error" role="alert">{searchError}</p> : null}
            </form>
          )}
          {discoveryInputMode === "voice" && !preparedBrief && voiceState.phase === "idle" && hasSearchError ? (
            <p id="property-brief-error" className="voice-discovery-dialog__error" role="alert">{searchError}</p>
          ) : null}
        </VoiceDiscoveryDialog>
      </div>
    );
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        {copy.skip}
      </a>
      <SiteHeader locale={locale} copy={copy.header} />

      <main id="main-content">
        <section id="top" className="relative w-full min-h-[100svh] bg-[var(--rama-ink-dark)] overflow-hidden flex flex-col justify-between" aria-labelledby="hero-title">
          {/* Architectural Villa Daylight Backdrop */}
          <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
            <Image
              src="/images/rama-hero-editorial-daylight.png"
              alt={copy.heroAlt}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="hero-veil--vellaro" aria-hidden="true" />
          </div>

          {/* Main Nordic Voice-First Atelier */}
          <div className="relative z-10 w-full max-w-4xl mx-auto px-6 lg:px-12 pt-24 md:pt-28 pb-8 flex flex-col justify-between flex-grow items-center text-center">
            {/* Clean Nordic Editorial Title Lockup */}
            <div className="flex flex-col items-center gap-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-[0.2em] text-[var(--rama-ivory)]/90">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse motion-reduce:animate-none" />
                <span>{copy.badge}</span>
              </div>
              <h1 id="hero-title" className="font-heading font-semibold text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] text-white tracking-[-0.025em] leading-tight whitespace-normal lg:whitespace-nowrap">
                {copy.title}
              </h1>
              <p className="font-heading italic text-sm sm:text-base md:text-lg text-white/90 tracking-wide font-normal max-w-lg">
                {copy.subtitle}
              </p>
            </div>

            {/* AI Voice Agent Hero Interaction Centerpiece */}
            <div className="w-full max-w-xl my-auto py-4">
              <form
                id="guided-search"
                className="w-full relative flex flex-col items-center gap-4"
                aria-busy={searchPhase === "loading"}
                onSubmit={handleSubmit}
              >
                {/* Central Voice Hub Orb */}
                <div className="flex flex-col items-center gap-2" data-primary-interaction="voice">
                  <p className="text-xs font-sans font-bold uppercase tracking-[0.18em] text-white/90">{copy.voiceLead}</p>
                  <VoiceSignal ref={voiceSignalRef} state={voiceState} locale={locale} onPress={() => void handleVoiceAgent()} />
                </div>

                {/* Compact Unified Search Bar - Solid Nordic Ink */}
                <label className="self-start text-xs font-sans font-semibold uppercase tracking-[0.14em] text-white/80" htmlFor="property-brief">
                  {copy.inputLabel}
                </label>
                <div className="landing-search-control w-full min-w-0 bg-[#0c1216]/85 border border-white/25 p-1.5 rounded-[8px] flex items-center gap-2 transition-[border-color,box-shadow] focus-within:border-white/60 focus-within:ring-1 focus-within:ring-white/25">
                  <div className="pl-3.5 pr-1 hidden sm:flex items-center text-white/60">
                    <Search className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    ref={propertyBriefInput}
                    id="property-brief"
                    className="min-w-0 w-full bg-transparent border-none outline-none text-white placeholder:text-white/60 px-2 sm:px-1.5 py-1.5 text-base font-sans"
                    value={brief}
                    onChange={(event) => setBrief(event.target.value)}
                    placeholder={copy.placeholder}
                    maxLength={500}
                    aria-invalid={briefIsInvalid}
                    aria-describedby={
                      briefIsInvalid
                        ? "property-brief-guidance property-brief-error"
                        : "property-brief-guidance"
                    }
                  />
                  <Button
                    className="inline-flex items-center justify-center min-h-[44px] bg-transparent text-white border border-white/35 hover:bg-white/10 px-2 py-1.5 font-sans font-bold tracking-[0.12em] text-xs uppercase transition-colors rounded-[6px] cursor-pointer shrink-0"
                    type="submit"
                    isDisabled={searchPhase === "loading"}
                    aria-label={
                      searchPhase === "loading" ? copy.openingLabel : copy.shapeLabel
                    }
                  >
                    <span>{searchPhase === "loading" ? copy.opening : copy.search}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" aria-hidden="true" />
                  </Button>
                </div>

                {hasSearchError ? (
                  <p id="property-brief-error" className="!bg-red-950/80 !text-red-200 border border-red-500/30 p-2 text-xs rounded-sm" role="alert">
                    {searchError}
                  </p>
                ) : null}

                <div className="flex items-center justify-center gap-2 text-xs text-white/70 tracking-wide">
                  <LockKeyhole className="w-3 h-3 flex-shrink-0 text-white/40" aria-hidden="true" />
                  <span id="property-brief-guidance">
                    {copy.boundary}
                  </span>
                </div>

                <VoiceConversation
                  state={voiceState}
                  copy={voiceCopy.panel}
                  onStop={() => void endVoiceInput()}
                  onClose={() => resetVoiceExperience()}
                  returnFocus={() => requestAnimationFrame(() => voiceSignalRef.current?.focus())}
                />

                {preparedBrief ? (
                  <BriefConfirmation
                    draft={preparedBrief}
                    busy={searchPhase === "loading"}
                    recalculating={briefRecalculating}
                    locale={locale}
                    onChange={(value) => void updatePreparedBrief(value)}
                    onConfirm={() => void confirmAndOpenDecisionRoom()}
                    onCancel={cancelPreparedBrief}
                    onRetry={preparedBrief.source === "voice" ? () => { cancelPreparedBrief(); void handleVoiceAgent(); } : undefined}
                  />
                ) : null}
              </form>
            </div>

            {/* Bottom product boundary */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs tracking-[0.12em] uppercase text-white/70 font-sans">
              <span>{copy.support}</span>
              <span>{copy.supply}</span>
            </div>
          </div>
        </section>

        <section id="trust" className="landing-trust" aria-labelledby="trust-title">
          <SectionShell className="landing-trust__inner">
            <div className="landing-trust__heading">
              <p className="eyebrow">{copy.trustEyebrow}</p>
              <h2 id="trust-title">{copy.trustTitle}</h2>
            </div>
            <div className="landing-trust__statements">
              <article>
                <Database aria-hidden="true" />
                <p>{copy.trust[0]}</p>
              </article>
              <article>
                <ShieldCheck aria-hidden="true" />
                <p>{copy.trust[1]}</p>
              </article>
              <article>
                <MessageCircle aria-hidden="true" />
                <p>{copy.trust[2]}</p>
              </article>
            </div>
            <p className="landing-trust__status" aria-live="polite">
              {searchStatus}
            </p>
          </SectionShell>
        </section>
      </main>

      <SiteFooter copy={copy.footer} />
    </>
  );
}
