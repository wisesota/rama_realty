"use client";

import type { ComponentType, FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LottieVisualizer } from "@/components/lottie-visualizer";
import type { DiscoveryComposerRequest, LandingRuntimeCopy } from "@/lib/discovery-composer-contract";
import { localizedPath, type PublicLocale } from "@/lib/i18n";

type LoadedComposer = ComponentType<{
  locale: PublicLocale;
  copy: LandingRuntimeCopy;
  request: DiscoveryComposerRequest;
}>;

export function DiscoveryComposerIsland({
  locale,
  copy,
  signalSrc,
}: {
  locale: PublicLocale;
  copy: LandingRuntimeCopy;
  signalSrc: string;
}) {
  const [Composer, setComposer] = useState<LoadedComposer | null>(null);
  const [request, setRequest] = useState<DiscoveryComposerRequest | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const requestId = useRef(0);
  const composerLoaded = useRef(false);

  const openComposer = useCallback(async (mode: "voice" | "text", brief?: string) => {
    const nextRequest = { id: ++requestId.current, mode, brief } satisfies DiscoveryComposerRequest;
    setRequest(nextRequest);
    setLoadFailed(false);

    if (composerLoaded.current) return;

    try {
      const loadedComposer = await import("@/components/rama/loaded-discovery-composer");
      composerLoaded.current = true;
      setComposer(() => loadedComposer.LoadedDiscoveryComposer);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    const openFromEvent = (event: Event) => {
      if (composerLoaded.current) return;
      const detail = event instanceof CustomEvent ? event.detail : undefined;
      const mode = detail?.mode === "text" ? "text" : "voice";
      const brief = typeof detail?.brief === "string" ? detail.brief : undefined;
      void openComposer(mode, brief);
    };
    const openFromHash = () => {
      if (window.location.hash === "#guided-search") void openComposer("text");
    };

    window.addEventListener("rama:open-discovery", openFromEvent);
    window.addEventListener("hashchange", openFromHash);

    const mode = new URLSearchParams(window.location.search).get("briefMode");
    if (mode === "voice" || mode === "text") {
      void openComposer(mode);
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.hash}`);
    } else {
      openFromHash();
    }

    return () => {
      window.removeEventListener("rama:open-discovery", openFromEvent);
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [openComposer]);

  useEffect(() => {
    let frame = 0;
    let settledFrame = 0;
    const restoreDecisionRoomFocus = () => {
      const returnSource = sessionStorage.getItem("rama:decision-room-restore-focus");
      if (returnSource !== "voice" && returnSource !== "text") return;
      sessionStorage.removeItem("rama:decision-room-restore-focus");
      frame = window.requestAnimationFrame(() => {
        settledFrame = window.requestAnimationFrame(() => {
          document
            .querySelector<HTMLButtonElement>(`#guided-search [data-discovery-trigger='${returnSource}']`)
            ?.focus({ preventScroll: true });
        });
      });
    };

    restoreDecisionRoomFocus();
    window.addEventListener("popstate", restoreDecisionRoomFocus);
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(settledFrame);
      window.removeEventListener("popstate", restoreDecisionRoomFocus);
    };
  }, []);

  if (Composer && request) return <Composer locale={locale} copy={copy} request={request} />;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const mode = submitter instanceof HTMLButtonElement && submitter.value === "text" ? "text" : "voice";
    void openComposer(mode);
  }

  return (
    <div id="guided-search" className="quiet-voice-launcher" aria-busy={request !== null && !loadFailed}>
      <div className="quiet-voice-launcher__signal" aria-hidden="true">
        <LottieVisualizer src={signalSrc} className="criterion-weave" />
      </div>
      <form className="quiet-voice-launcher__actions" action={localizedPath(locale)} method="get" onSubmit={submit}>
        <button data-discovery-trigger="voice" name="briefMode" value="voice" type="submit">
          {request?.mode === "voice" && !loadFailed ? copy.opening : copy.architecture.hero.primaryAction}
        </button>
        <button data-discovery-trigger="text" name="briefMode" value="text" type="submit">
          {request?.mode === "text" && !loadFailed ? copy.opening : copy.architecture.hero.secondaryAction}
        </button>
      </form>
      {loadFailed ? (
        <p className="quiet-voice-launcher__error" role="alert">
          {locale === "ar" ? "تعذّر فتح الموجز. حاول مرة أخرى." : "The brief could not open. Please try again."}
        </p>
      ) : null}
    </div>
  );
}
