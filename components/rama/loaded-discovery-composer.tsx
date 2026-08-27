"use client";

import { useEffect } from "react";
import { LandingPage } from "@/components/landing-page";
import { LandingStoreProvider } from "@/components/providers/landing-store-provider";
import type { DiscoveryComposerRequest, LandingRuntimeCopy } from "@/lib/discovery-composer-contract";
import type { PublicLocale } from "@/lib/i18n";

export function LoadedDiscoveryComposer({
  locale,
  copy,
  request,
}: {
  locale: PublicLocale;
  copy: LandingRuntimeCopy;
  request: DiscoveryComposerRequest;
}) {
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (request.brief) {
        window.dispatchEvent(new CustomEvent("rama:open-discovery", {
          detail: { mode: request.mode, brief: request.brief },
        }));
        return;
      }

      const trigger = document.querySelector<HTMLButtonElement>(
        `#guided-search [data-discovery-trigger='${request.mode}']`,
      );
      trigger?.focus({ preventScroll: true });
      trigger?.click();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [request]);

  return (
    <LandingStoreProvider locale={locale}>
      <LandingPage locale={locale} copy={copy} mode="composer" />
    </LandingStoreProvider>
  );
}
