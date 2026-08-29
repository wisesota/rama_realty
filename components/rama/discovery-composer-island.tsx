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
  const composerModule = useRef<Promise<typeof import("@/components/rama/loaded-discovery-composer")> | null>(null);

  const loadComposerModule = useCallback(() => {
    if (!composerModule.current) {
      const pendingModule = import("@/components/rama/loaded-discovery-composer");
      composerModule.current = pendingModule;
      void pendingModule.catch(() => {
        if (composerModule.current === pendingModule) composerModule.current = null;
      });
    }
    return composerModule.current;
  }, []);

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const preload = () => void loadComposerModule();
    if (idleWindow.requestIdleCallback) {
      const idle = idleWindow.requestIdleCallback(preload, { timeout: 3_000 });
      return () => idleWindow.cancelIdleCallback?.(idle);
    }
    const timer = setTimeout(preload, 1_500);
    return () => clearTimeout(timer);
  }, [loadComposerModule]);

  const openComposer = useCallback(async (mode: "voice" | "text", brief?: string) => {
    const nextRequest = { id: ++requestId.current, mode, brief } satisfies DiscoveryComposerRequest;
    setRequest(nextRequest);
    setLoadFailed(false);

    if (composerLoaded.current) return;

    try {
      const loadedComposer = await loadComposerModule();
      composerLoaded.current = true;
      setComposer(() => loadedComposer.LoadedDiscoveryComposer);
    } catch {
      setLoadFailed(true);
    }
  }, [loadComposerModule]);

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
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const restoreDecisionRoomFocus = () => {
      const returnSource = sessionStorage.getItem("rama:decision-room-restore-focus");
      if (returnSource !== "voice" && returnSource !== "text") return;
      const deadline = performance.now() + 10_000;
      if (retryTimer) clearTimeout(retryTimer);

      const focusAfterRouteSettles = () => {
        const target = document.querySelector<HTMLButtonElement>(
          `#guided-search [data-discovery-trigger='${returnSource}']`,
        );
        const decisionRoomStillMounted = document.querySelector(".decision-room-overlay") !== null;
        const landingRouteIsCurrent = window.location.pathname === localizedPath(locale);

        if (target && landingRouteIsCurrent && !decisionRoomStillMounted) {
          target.focus({ preventScroll: true });
          if (document.activeElement === target) {
            sessionStorage.removeItem("rama:decision-room-restore-focus");
            return;
          }
        }

        if (performance.now() < deadline) {
          retryTimer = setTimeout(focusAfterRouteSettles, 50);
        }
      };

      retryTimer = setTimeout(focusAfterRouteSettles, 0);
    };

    restoreDecisionRoomFocus();
    window.addEventListener("popstate", restoreDecisionRoomFocus);
    window.addEventListener("rama:restore-decision-focus", restoreDecisionRoomFocus);
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("popstate", restoreDecisionRoomFocus);
      window.removeEventListener("rama:restore-decision-focus", restoreDecisionRoomFocus);
    };
  }, [locale]);

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
        <button
          data-discovery-trigger="voice"
          name="briefMode"
          value="voice"
          type="submit"
          onFocus={loadComposerModule}
          onPointerEnter={loadComposerModule}
        >
          {request?.mode === "voice" && !loadFailed ? copy.opening : copy.architecture.hero.primaryAction}
        </button>
        <button
          data-discovery-trigger="text"
          name="briefMode"
          value="text"
          type="submit"
          onFocus={loadComposerModule}
          onPointerEnter={loadComposerModule}
        >
          {request?.mode === "text" && !loadFailed ? copy.opening : copy.architecture.hero.secondaryAction}
        </button>
      </form>
      {request && !loadFailed ? <p className="sr-only" role="status">{copy.opening}</p> : null}
      {loadFailed ? (
        <p className="quiet-voice-launcher__error" role="alert">
          {locale === "ar" ? "تعذّر فتح الموجز. حاول مرة أخرى." : "The brief could not open. Please try again."}
        </p>
      ) : null}
    </div>
  );
}
