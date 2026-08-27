import { redirect } from "next/navigation";
import { DecisionArchitectureLanding } from "@/components/decision-architecture-landing";
import { landingCopy } from "@/lib/i18n";
import { landingCompositionEnabled, localeRoutesEnabled } from "@/lib/rollout-server";

export default async function Home() {
  if (localeRoutesEnabled()) redirect("/en");
  const compositionEnabled = landingCompositionEnabled();
  if (!compositionEnabled) {
    const [{ LandingPage }, { LandingStoreProvider }] = await Promise.all([
      import("@/components/landing-page"),
      import("@/components/providers/landing-store-provider"),
    ]);
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
    <>
      <DecisionArchitectureLanding locale="en" copy={landingCopy.en} />
      {LandingMotion ? <LandingMotion /> : null}
    </>
  );
}
