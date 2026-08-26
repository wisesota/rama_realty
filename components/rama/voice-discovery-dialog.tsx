"use client";

import { X } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { GeminiLiveSignal, type GeminiLiveSignalState } from "@/components/rama/gemini-live-signal";
import { Button } from "@/components/ui/button";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

export function VoiceDiscoveryDialog({
  open,
  title,
  description,
  closeLabel,
  status,
  announceStatus = true,
  signalState,
  signalSrc,
  initialFocusRef,
  onRequestClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description: string;
  closeLabel: string;
  status: string;
  announceStatus?: boolean;
  signalState: GeminiLiveSignalState;
  signalSrc: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onRequestClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleElement = useRef<HTMLHeadingElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const body = useRef<HTMLDivElement | null>(null);
  const [bodyHasMore, setBodyHasMore] = useState(false);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;

    if (open && !node.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      node.showModal();
      document.documentElement.dataset.discoveryDialogOpen = "true";
      window.dispatchEvent(new CustomEvent("rama:discovery-dialog-state", { detail: { open: true } }));
      requestAnimationFrame(() => (initialFocusRef?.current ?? titleElement.current)?.focus({ preventScroll: true }));
      return;
    }

    if (!open && node.open) node.close();
  }, [initialFocusRef, open]);

  useEffect(() => () => {
    delete document.documentElement.dataset.discoveryDialogOpen;
    window.dispatchEvent(new CustomEvent("rama:discovery-dialog-state", { detail: { open: false } }));
  }, []);

  useEffect(() => {
    if (!open) return;
    const node = body.current;
    if (!node) return;
    const update = () => setBodyHasMore(node.scrollHeight - node.scrollTop - node.clientHeight > 4);
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(node);
    requestAnimationFrame(update);
    return () => resizeObserver.disconnect();
  }, [children, open]);

  function restoreFocus() {
    delete document.documentElement.dataset.discoveryDialogOpen;
    window.dispatchEvent(new CustomEvent("rama:discovery-dialog-state", { detail: { open: false } }));
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }

  return (
    <dialog
      ref={dialog}
      className="voice-discovery-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      onClose={restoreFocus}
    >
      <div className="voice-discovery-dialog__frame">
        <header className="voice-discovery-dialog__header">
          <div>
            <h2 ref={titleElement} id={titleId} tabIndex={-1}>{title}</h2>
            <p id={descriptionId}>{description}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={closeLabel} onPress={onRequestClose}>
            <X aria-hidden="true" />
          </Button>
        </header>

        <div className="voice-discovery-dialog__signal" aria-hidden="true">
          <div className="voice-discovery-dialog__live-signal">
            <GeminiLiveSignal src={signalSrc} state={open ? signalState : "resting"} />
          </div>
        </div>

        <p className="voice-discovery-dialog__status" aria-live={announceStatus ? "polite" : undefined}>{status}</p>
        <div className="voice-discovery-dialog__body-frame">
          <div
            ref={body}
            className="voice-discovery-dialog__body"
            onScroll={(event) => {
              const node = event.currentTarget;
              setBodyHasMore(node.scrollHeight - node.scrollTop - node.clientHeight > 4);
            }}
          >
            {children}
          </div>
          {bodyHasMore ? <ProgressiveBlur className="voice-discovery-dialog__overflow-cue" /> : null}
        </div>
        <footer className="voice-discovery-dialog__footer">{footer}</footer>
      </div>
    </dialog>
  );
}
