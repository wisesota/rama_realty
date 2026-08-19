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
import { type FormEvent, useEffect, useRef } from "react";
import { useLandingStore } from "@/components/providers/landing-store-provider";
import { Button } from "@/components/ui/button";
import { MediaFrame } from "@/components/rama/media-frame";
import { SectionShell } from "@/components/rama/section-shell";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VoiceConversation } from "@/components/voice-conversation";
import { VoiceSignal } from "@/components/voice-signal";
import { emitProductEvent } from "@/lib/product-events";
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

export function LandingPage() {
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
  const setAgentBlocks = useLandingStore((state) => state.setAgentBlocks);
  const setDecisionEnvelope = useLandingStore((state) => state.setDecisionEnvelope);
  const searchProperties = useLandingStore((state) => state.searchProperties);
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
  const propertyBriefInput = useRef<HTMLInputElement | null>(null);

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

  async function openDecisionRoom(searchBrief: string, source: "text" | "voice") {
    const searchRunId = await searchProperties(searchBrief, source);
    if (searchRunId) {
      emitProductEvent({
        event: "landing.brief_submit",
        searchRunId,
        source,
        timestamp: new Date().toISOString(),
      });
      sessionStorage.setItem("rama:decision-room-return-focus", source);
      router.push(`/discover/${searchRunId}`);
    }
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
            emitProductEvent({
              event: "landing.brief_submit",
              searchRunId: result.decisionEnvelope.searchRunId,
              source: "voice",
              timestamp: new Date().toISOString(),
            });
            sessionStorage.setItem("rama:decision-room-return-focus", "voice");
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

  const briefIsInvalid = searchPhase === "error" && brief.trim().length < 3;

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
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
              <p className="hero-wordmark" aria-hidden="true">
                RAMA REALTY
              </p>

              <div className="hero-copy hero-reveal">
                <VoiceSignal state={voiceState} onPress={() => void handleVoiceAgent()} />
                <p className="eyebrow eyebrow--hero">Voice-led Dubai property discovery</p>
                <h1 id="hero-title">Describe the life. We’ll shape the search.</h1>
                <p className="hero-subtitle">
                  Speak naturally or type a brief. Rama keeps every criterion visible.
                </p>

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
                      aria-label={
                        searchPhase === "loading" ? "Opening your Decision Room" : "Shape my brief"
                      }
                    >
                      <span>{searchPhase === "loading" ? "Opening room" : "Shape my brief"}</span>
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </div>

                  {briefIsInvalid ? (
                    <p id="property-brief-error" className="hero-search__error" role="alert">
                      {searchError}
                    </p>
                  ) : null}

                  <div className="hero-search__meta">
                    <span id="property-brief-guidance">
                      <LockKeyhole aria-hidden="true" />
                      Rama currently shows representative residences. Live inventory connects after brokerage authorization.
                    </span>
                  </div>

                  <VoiceConversation
                    state={voiceState}
                    onStop={() => void endVoiceInput()}
                    onClose={() => resetVoiceExperience()}
                  />
                </form>
              </div>

              <div className="hero-caption" aria-hidden="true">
                <span>Dubai, UAE</span>
                <span>Brief to Decision Room</span>
              </div>
            </MediaFrame>
          </SectionShell>
        </section>

        <section id="trust" className="landing-trust" aria-labelledby="trust-title">
          <SectionShell className="landing-trust__inner">
            <div className="landing-trust__heading">
              <p className="eyebrow">A governed path to a decision</p>
              <h2 id="trust-title">The landing page is the invitation. Your room holds the work.</h2>
            </div>
            <div className="landing-trust__statements">
              <article>
                <Database aria-hidden="true" />
                <p>Rama renders governed property data and keeps the source boundary visible.</p>
              </article>
              <article>
                <ShieldCheck aria-hidden="true" />
                <p>Every residence is explicitly illustrative until licensed inventory is connected.</p>
              </article>
              <article>
                <MessageCircle aria-hidden="true" />
                <p>An advisor handoff begins only when you choose it and submit your details.</p>
              </article>
            </div>
            <p className="landing-trust__status" aria-live="polite">
              {searchStatus}
            </p>
          </SectionShell>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
