"use client";

import { Keyboard, LoaderCircle, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { AgentToolResponse } from "@/lib/agent/contracts";
import { defaultGeminiVoiceName } from "@/lib/voice/gemini-live-contracts";
import type {
  GeminiLiveVoiceSession,
  GeminiVoiceStatus,
} from "@/lib/voice/gemini-live-session";

type ComposerPhase = "idle" | "requesting" | GeminiVoiceStatus | "complete" | "error";

type DecisionRoomVoiceComposerProps = {
  context: string;
  onToolResult: (result: AgentToolResponse) => void;
};

const phaseCopy: Record<ComposerPhase, string> = {
  idle: "Ask about this room",
  requesting: "Waiting for microphone permission",
  connecting: "Connecting securely",
  listening: "Listening — ask about the selected residence",
  thinking: "Checking the governed property record",
  speaking: "Rama is responding",
  complete: "Voice follow-up complete",
  error: "Voice is unavailable; the written actions still work",
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function DecisionRoomVoiceComposer({
  context,
  onToolResult,
}: DecisionRoomVoiceComposerProps) {
  const [phase, setPhase] = useState<ComposerPhase>("idle");
  const [transcript, setTranscript] = useState("");
  const [agentTranscript, setAgentTranscript] = useState("");
  const [error, setError] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<GeminiLiveVoiceSession | null>(null);
  const onToolResultRef = useRef(onToolResult);
  const attemptRef = useRef(0);

  useEffect(() => {
    onToolResultRef.current = onToolResult;
  }, [onToolResult]);

  useEffect(() => {
    return () => {
      attemptRef.current += 1;
      const session = sessionRef.current;
      sessionRef.current = null;
      stopStream(streamRef.current);
      streamRef.current = null;
      void session?.dispose();
    };
  }, []);

  async function start() {
    const attempt = ++attemptRef.current;
    setPhase("requesting");
    setTranscript("");
    setAgentTranscript("");
    setError("");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not expose microphone access.");
      }

      const previousSession = sessionRef.current;
      sessionRef.current = null;
      await previousSession?.dispose();
      stopStream(streamRef.current);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      if (attempt !== attemptRef.current) {
        stopStream(stream);
        return;
      }
      streamRef.current = stream;

      const { GeminiLiveVoiceSession: LiveSession } = await import(
        "@/lib/voice/gemini-live-session"
      );
      const session = new LiveSession({
        onStatus: (status) => {
          if (attempt === attemptRef.current) setPhase(status);
        },
        onTranscript: (value) => {
          if (attempt === attemptRef.current) setTranscript(value);
        },
        onAgentTranscript: (value) => {
          if (attempt === attemptRef.current) setAgentTranscript(value);
        },
        onFinalTranscript: (value) => {
          if (attempt === attemptRef.current) setTranscript(value);
        },
        onToolResult: (result) => {
          if (attempt === attemptRef.current) onToolResultRef.current(result);
        },
        onError: (message) => {
          if (attempt !== attemptRef.current) return;
          stopStream(streamRef.current);
          streamRef.current = null;
          sessionRef.current = null;
          setError(message);
          setPhase("error");
        },
        onComplete: () => {
          if (attempt !== attemptRef.current) return;
          stopStream(streamRef.current);
          streamRef.current = null;
          sessionRef.current = null;
          setPhase("complete");
          void session.dispose();
        },
      });
      sessionRef.current = session;
      await session.start(stream, defaultGeminiVoiceName, context);
      if (attempt !== attemptRef.current) {
        await session.dispose();
      }
    } catch (caught) {
      if (attempt !== attemptRef.current) return;
      const session = sessionRef.current;
      sessionRef.current = null;
      stopStream(streamRef.current);
      streamRef.current = null;
      await session?.dispose();
      setError(caught instanceof Error ? caught.message : "Voice could not start.");
      setPhase("error");
    }
  }

  async function stop() {
    if (["requesting", "connecting", "thinking", "speaking"].includes(phase)) {
      attemptRef.current += 1;
      const session = sessionRef.current;
      sessionRef.current = null;
      stopStream(streamRef.current);
      streamRef.current = null;
      await session?.dispose();
      setPhase("idle");
      return;
    }
    setPhase("thinking");
    stopStream(streamRef.current);
    streamRef.current = null;
    await sessionRef.current?.endInput();
  }

  const active = ["requesting", "connecting", "listening", "thinking", "speaking"].includes(
    phase,
  );

  return (
    <section className="room-voice" aria-labelledby="room-voice-title">
      <div className="room-voice__copy">
        <p className="eyebrow">Inline voice follow-up</p>
        <h2 id="room-voice-title">Continue the conversation without leaving the room.</h2>
        <p className="room-voice__status" aria-live="polite">
          {phaseCopy[phase]}
        </p>
        {transcript ? <p className="room-voice__transcript">“{transcript}”</p> : null}
        {agentTranscript ? <p className="room-voice__answer">{agentTranscript}</p> : null}
        {error ? <p className="room-voice__error">{error}</p> : null}
      </div>
      <div className="room-voice__actions">
        {active ? (
          <Button type="button" variant="outline" onPress={() => void stop()}>
            {phase === "requesting" || phase === "connecting" ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <Square aria-hidden="true" />
            )}
            Stop
          </Button>
        ) : (
          <Button type="button" onPress={() => void start()}>
            <Mic aria-hidden="true" />
            {phase === "idle" ? "Ask Rama" : "Ask another question"}
          </Button>
        )}
        <span>
          <Keyboard aria-hidden="true" /> Written actions remain available
        </span>
      </div>
    </section>
  );
}
