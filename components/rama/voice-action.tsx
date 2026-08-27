"use client";

import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceExperienceState } from "@/lib/voice/types";
import { cn } from "@/lib/utils";

export function VoiceAction({
  state,
  label,
  activeLabel,
  onPress,
  className,
}: {
  state: VoiceExperienceState;
  label: string;
  activeLabel: string;
  onPress: () => void;
  className?: string;
}) {
  const active = ["requesting", "connecting", "listening", "thinking", "speaking"].includes(state.phase);
  const visibleLabel = active ? activeLabel : label;

  return (
    <Button
      className={cn("voice-action", className)}
      type="button"
      variant="outline"
      aria-pressed={active}
      aria-expanded={state.phase !== "idle"}
      aria-controls={state.phase !== "idle" ? "voice-conversation-panel" : undefined}
      onPress={onPress}
    >
      <span className="voice-action__icon" data-active={active} aria-hidden="true">
        {active ? <Square /> : <Mic />}
      </span>
      <span>{visibleLabel}</span>
      <span className="voice-action__bars" data-active={active} aria-hidden="true"><i /><i /><i /></span>
    </Button>
  );
}

