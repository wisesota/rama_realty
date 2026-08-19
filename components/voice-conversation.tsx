"use client";

import { Keyboard, Square, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { VoiceExperienceState } from "@/lib/voice/types";

type VoiceConversationProps = {
  state: VoiceExperienceState;
  onStop: () => void;
  onClose: () => void;
};

function getVoiceCopy(state: Exclude<VoiceExperienceState, { phase: "idle" }>) {
  switch (state.phase) {
    case "requesting":
      return {
        label: "Microphone permission",
        title: "Preparing the secure voice session",
        detail: "Your browser will ask before Rama can listen.",
      };
    case "connecting":
      return {
        label: "Connecting",
        title: "Opening a protected Gemini Live session",
        detail: "The server key stays private; this browser receives a short-lived session token.",
      };
    case "listening":
      return {
        label: state.mode === "recorded" ? "Recorded voice" : "Listening live",
        title: state.transcript || "Describe the Dubai home and lifestyle you want…",
        detail:
          state.mode === "recorded"
            ? "Speak naturally, then choose stop. Gemini processes this bounded audio turn securely."
            : "Speak naturally. Pause when finished, or choose stop to end microphone input.",
      };
    case "thinking":
      return {
        label: "Understanding",
        title: state.transcript || "Turning your conversation into a property brief…",
        detail: "Rama is extracting your criteria and preparing a concise response.",
      };
    case "speaking":
      return {
        label: "Rama is responding",
        title: state.agentTranscript || "Preparing the spoken response…",
        detail: state.transcript
          ? `Your brief: “${state.transcript}”`
          : "You can speak again to interrupt or refine the brief.",
      };
    case "complete":
      return {
        label: "Brief captured",
        title: state.transcript,
        detail: "The final transcript used the same fetched property-search path as typed input.",
      };
    case "error":
      return {
        label: "Text mode ready",
        title:
          state.code === "permission-denied"
            ? "Microphone access is blocked in this browser."
            : state.code === "connection-failed"
              ? "The live voice session could not stay connected."
              : "Voice mode is unavailable here.",
        detail: "Type the same request in the search field; every search feature remains available.",
      };
  }
}

export function VoiceConversation({
  state,
  onStop,
  onClose,
}: VoiceConversationProps) {
  const isOpen = state.phase !== "idle";
  const active = ["requesting", "connecting", "listening", "thinking", "speaking"].includes(
    state.phase,
  );
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const activeRef = useRef(active);
  const onCloseRef = useRef(onClose);
  const onStopRef = useRef(onStop);
  const titleId = useId();
  const detailId = useId();

  useEffect(() => {
    activeRef.current = active;
    onCloseRef.current = onClose;
    onStopRef.current = onStop;
  }, [active, onClose, onStop]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      const firstAction = panelRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      (firstAction ?? panelRef.current)?.focus();
    });

    const keepFocusInDialog = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (activeRef.current) onStopRef.current();
        else onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

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

    document.addEventListener("keydown", keepFocusInDialog);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keepFocusInDialog);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (state.phase === "idle") return null;

  const copy = getVoiceCopy(state);

  return (
    <div className="voice-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) { if (active) onStop(); else onClose(); } }}>
      <section
        ref={panelRef}
        id="voice-conversation-panel"
        className="voice-dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={detailId}
        tabIndex={-1}
      >
        <div className="voice-conversation__copy">
          <div className="voice-conversation__status">
            <span data-active={active} aria-hidden="true" />
            <p>{copy.label}</p>
          </div>
          <p id={titleId} className="voice-conversation__transcript">{copy.title}</p>
          <p id={detailId} className="voice-conversation__detail">{copy.detail}</p>
          <p className="sr-only" aria-live="polite">
            {state.announcement}
          </p>
        </div>

        <div className="voice-conversation__actions">
          {active ? (
            <Button className="voice-stop" type="button" variant="outline" onPress={onStop}>
              <Square aria-hidden="true" />
              Stop
            </Button>
          ) : (
            <Button
              className="voice-close"
              type="button"
              variant="ghost"
              aria-label="Close voice conversation"
              onPress={onClose}
            >
              <X aria-hidden="true" />
            </Button>
          )}
          <span className="voice-text-fallback">
            <Keyboard aria-hidden="true" /> Text always works
          </span>
        </div>
      </section>
    </div>
  );
}
