"use client";

import { Keyboard, Square, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { StateTransition } from "@/components/ui/state-transition";
import type { VoiceExperienceState } from "@/lib/voice/types";
import type { LandingCopy } from "@/lib/i18n";

type VoicePanelCopy = LandingCopy["architecture"]["voice"]["panel"];

type VoiceConversationProps = {
  state: VoiceExperienceState;
  onStop: () => void;
  onClose: () => void;
  returnFocus?: () => void;
  copy: VoicePanelCopy;
  variant?: "inline" | "dialog";
  announceStatus?: boolean;
};

function getVoiceCopy(state: Exclude<VoiceExperienceState, { phase: "idle" }>, copy: VoicePanelCopy) {
  switch (state.phase) {
    case "requesting":
      return {
        label: copy.requestingLabel,
        title: copy.requestingTitle,
        detail: copy.requestingDetail,
      };
    case "connecting":
      return {
        label: copy.connectingLabel,
        title: copy.connectingTitle,
        detail: copy.connectingDetail,
      };
    case "listening":
      return {
        label: state.mode === "recorded" ? copy.listeningRecordedLabel : copy.listeningLiveLabel,
        title: state.transcript || copy.listeningPlaceholder,
        detail:
          state.mode === "recorded"
            ? copy.listeningRecordedDetail
            : copy.listeningLiveDetail,
      };
    case "thinking":
      return {
        label: copy.thinkingLabel,
        title: state.transcript || copy.thinkingPlaceholder,
        detail: copy.thinkingDetail,
      };
    case "speaking":
      return {
        label: copy.speakingLabel,
        title: state.agentTranscript || copy.speakingPlaceholder,
        detail: state.transcript
          ? `${copy.speakingBriefPrefix}: ${state.transcript}`
          : copy.speakingDetail,
      };
    case "complete":
      return {
        label: copy.completeLabel,
        title: state.transcript,
        detail: copy.completeDetail,
      };
    case "error":
      return {
        label: copy.errorLabel,
        title:
          state.code === "permission-denied"
            ? copy.permissionErrorTitle
            : state.code === "connection-failed"
              ? copy.connectionErrorTitle
              : copy.unavailableErrorTitle,
        detail: copy.errorDetail,
      };
  }
}

export function VoiceConversation({
  state,
  onStop,
  onClose,
  returnFocus,
  copy,
  variant = "inline",
  announceStatus = true,
}: VoiceConversationProps) {
  const isOpen = state.phase !== "idle";
  const active = ["requesting", "connecting", "listening", "thinking", "speaking"].includes(
    state.phase,
  );
  const activeRef = useRef(active);
  const onCloseRef = useRef(onClose);
  const onStopRef = useRef(onStop);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const detailId = useId();

  useEffect(() => {
    activeRef.current = active;
    onCloseRef.current = onClose;
    onStopRef.current = onStop;
  }, [active, onClose, onStop]);

  useEffect(() => {
    if (!isOpen || variant === "dialog") return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (activeRef.current) onStopRef.current();
        else {
          returnFocus?.();
          onCloseRef.current();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, variant, returnFocus]);

  useEffect(() => {
    if (variant === "dialog") return;
    if (isOpen) {
      if (!openerRef.current) openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    } else {
      if (openerRef.current) {
        const node = openerRef.current;
        requestAnimationFrame(() => node.focus({ preventScroll: true }));
        openerRef.current = null;
      }
    }
  }, [isOpen, variant]);

  if (state.phase === "idle") return null;

  const panelCopy = getVoiceCopy(state, copy);

  return (
    <section
      id="voice-conversation-panel"
      className="voice-dialog-panel"
      role={variant === "inline" ? "region" : undefined}
      aria-labelledby={titleId}
      aria-describedby={detailId}
      data-variant={variant}
    >
      <StateTransition state={state.phase} className="voice-conversation__copy">
        <div className="voice-conversation__status">
          <span data-active={active} aria-hidden="true" />
          <p>{panelCopy.label}</p>
        </div>
        <p id={titleId} className="voice-conversation__transcript">{panelCopy.title}</p>
        <p id={detailId} className="voice-conversation__detail">{panelCopy.detail}</p>
      </StateTransition>

      <p className="sr-only" aria-live={announceStatus ? "polite" : undefined}>
        {state.announcement}
      </p>

      <div className="voice-conversation__actions">
        {active ? (
          <Button className="voice-stop" type="button" variant="outline" onPress={onStop}>
            <Square aria-hidden="true" />
            {copy.stop}
          </Button>
        ) : variant === "inline" ? (
          <Button
            className="voice-close"
            type="button"
            variant="ghost"
            aria-label={copy.close}
            onPress={() => {
              returnFocus?.();
              onClose();
            }}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
        <span className="voice-text-fallback">
          <Keyboard aria-hidden="true" /> {copy.textFallback}
        </span>
      </div>
    </section>
  );
}
