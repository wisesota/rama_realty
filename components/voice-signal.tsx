"use client";

import { Mic } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { VoiceExperienceState } from "@/lib/voice/types";

const LottiePlayer = dynamic(
  () => import("lottie-react"),
  { ssr: false },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) as any;

type VoiceSignalProps = {
  state: VoiceExperienceState;
  onPress: () => void;
};

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);

    updatePreference();
    media.addEventListener("change", updatePreference);
    return () => media.removeEventListener("change", updatePreference);
  }, []);

  return reducedMotion;
}

function VoiceSignalFallback() {
  return (
    <span className="voice-signal__fallback" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function signalCopy(state: VoiceExperienceState) {
  switch (state.phase) {
    case "requesting":
      return "Allow microphone access";
    case "connecting":
      return "Connecting securely";
    case "listening":
      return "Listening — tap to finish";
    case "thinking":
      return "Understanding your brief";
    case "speaking":
      return "Rama is responding";
    case "complete":
      return "Brief ready — speak again";
    case "error":
      return "Voice unavailable — try again";
    default:
      return "Tap to speak with Rama";
  }
}

function visibleSignalCopy(state: VoiceExperienceState) {
  return state.phase === "idle" ? "Speak, and Rama listens." : signalCopy(state);
}

export function VoiceSignal({ state, onPress }: VoiceSignalProps) {
  const reducedMotion = useReducedMotion();
  const active = ["requesting", "connecting", "listening", "thinking", "speaking"].includes(
    state.phase,
  );

  const [animationData, setAnimationData] = useState<unknown>(null);
  useEffect(() => {
    if (active && !animationData) {
      fetch("/lottie/ai.json")
        .then((res) => res.json())
        .then((data) => setAnimationData(data))
        .catch(() => {});
    }
  }, [active, animationData]);

  const accessibleLabel = signalCopy(state);
  const visibleLabel = visibleSignalCopy(state);

  return (
    <div className="voice-signal-wrap" data-active={active} data-phase={state.phase}>
      <Button
        className="voice-signal"
        type="button"
        variant="ghost"
        aria-label={accessibleLabel}
        aria-expanded={state.phase !== "idle"}
        aria-controls={state.phase !== "idle" ? "voice-conversation-panel" : undefined}
        onPress={onPress}
      >
        <VoiceSignalFallback />
        {!reducedMotion && active && animationData ? (
          <LottiePlayer
            key={state.phase}
            animationData={animationData}
            autoplay={active}
            loop={false}
            initialSegment={[0, 150]}
            className="voice-signal__lottie"
            aria-hidden="true"
          />
        ) : null}
        <span className="voice-signal__affordance" aria-hidden="true">
          <Mic />
        </span>
      </Button>
      <p className="voice-signal__label" aria-live="polite">
        <span data-active={active} aria-hidden="true" />
        {visibleLabel}
      </p>
      <span className="voice-signal__axis" aria-hidden="true" />
    </div>
  );
}
