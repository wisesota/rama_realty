"use client";

import { Mic } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { VoiceExperienceState } from "@/lib/voice/types";
import type { PublicLocale } from "@/lib/i18n";

const LottieVisualizer = dynamic(
  () => import("@/components/lottie-visualizer").then((mod) => mod.LottieVisualizer),
  { ssr: false },
);

type VoiceSignalProps = {
  state: VoiceExperienceState;
  locale: PublicLocale;
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

function signalCopy(state: VoiceExperienceState, locale: PublicLocale) {
  if (locale === "ar") {
    switch (state.phase) {
      case "requesting": return "اسمح بالوصول إلى الميكروفون — اضغط للإيقاف";
      case "connecting": return "جارٍ الاتصال الآمن — اضغط للإيقاف";
      case "listening": return "أستمع إليك — اضغط للإنهاء";
      case "thinking": return "جارٍ فهم متطلباتك — اضغط للإيقاف";
      case "speaking": return "راما يجيبك — اضغط للإيقاف";
      case "complete": return "المتطلبات جاهزة — تحدّث مجددًا";
      case "error": return "الصوت غير متاح — حاول مجددًا";
      default: return "اضغط للتحدث مع راما";
    }
  }

  switch (state.phase) {
    case "requesting":
      return "Allow microphone access — tap to stop";
    case "connecting":
      return "Connecting securely — tap to stop";
    case "listening":
      return "Listening — tap to finish";
    case "thinking":
      return "Understanding your brief — tap to stop";
    case "speaking":
      return "Rama is responding — tap to stop";
    case "complete":
      return "Brief ready — speak again";
    case "error":
      return "Voice unavailable — try again";
    default:
      return "Tap to speak with Rama";
  }
}

function visibleSignalCopy(state: VoiceExperienceState, locale: PublicLocale) {
  return state.phase === "idle"
    ? locale === "ar" ? "تحدّث، وراما يستمع." : "Speak, and Rama listens."
    : signalCopy(state, locale);
}

export function VoiceSignal({ state, locale, onPress }: VoiceSignalProps) {
  const reducedMotion = useReducedMotion();
  const active = ["requesting", "connecting", "listening", "thinking", "speaking"].includes(
    state.phase,
  );

  const accessibleLabel = signalCopy(state, locale);
  const visibleLabel = visibleSignalCopy(state, locale);

  return (
    <div className="voice-signal-wrap" data-active={active} data-phase={state.phase}>
      <Button
        className="voice-signal"
        type="button"
        variant="ghost"
        aria-label={accessibleLabel}
        aria-pressed={active}
        aria-expanded={state.phase !== "idle"}
        aria-controls={state.phase !== "idle" ? "voice-conversation-panel" : undefined}
        onPress={onPress}
      >
        {active && !reducedMotion ? (
          <LottieVisualizer
            src="/lottie/ai.json"
            active={active}
            className="voice-signal__lottie"
          />
        ) : (
          <VoiceSignalFallback />
        )}
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
