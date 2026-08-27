import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DecisionArchitectureLanding } from "@/components/decision-architecture-landing";
import { landingCopy } from "@/lib/i18n";
import { landingCompositionEnabled, localeRoutesEnabled } from "@/lib/rollout-server";

export default async function Home() {
  if (localeRoutesEnabled()) redirect("/en");
  const userAgent = (await headers()).get("user-agent") ?? "";
  const motionEnabled = !/(?:Android|iPhone|iPad|iPod|Mobile)/i.test(userAgent);
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
  const LandingMotion = motionEnabled && compositionEnabled
    ? (await import("@/components/rama/landing-motion")).LandingMotion
    : null;
  return (
    <>
      <DecisionArchitectureLanding locale="en" copy={landingCopy.en} />
      {LandingMotion ? <LandingMotion /> : null}
    </>
  );
}
