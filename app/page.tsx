import { redirect } from "next/navigation";
import { DecisionArchitectureLanding } from "@/components/decision-architecture-landing";
import { landingCopy } from "@/lib/i18n";
import { landingCompositionEnabled, localeRoutesEnabled } from "@/lib/rollout-server";
import { LandingStoreProvider } from "@/components/providers/landing-store-provider";

export default async function Home() {
  if (localeRoutesEnabled()) redirect("/en");
  const compositionEnabled = landingCompositionEnabled();
  if (!compositionEnabled) {
    const { LandingPage } = await import("@/components/landing-page");
    return (
      <LandingStoreProvider locale="en">
        <LandingPage locale="en" copy={landingCopy.en} />
      </LandingStoreProvider>
    );
  }
  const LandingMotion = compositionEnabled
    ? (await import("@/components/rama/landing-motion")).LandingMotion
    : null;
  return (
    <LandingStoreProvider locale="en">
      <DecisionArchitectureLanding locale="en" copy={landingCopy.en} />
      {LandingMotion ? <LandingMotion /> : null}
    </LandingStoreProvider>
  );
}
