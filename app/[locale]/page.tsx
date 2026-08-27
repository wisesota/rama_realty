import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { DecisionArchitectureLanding } from "@/components/decision-architecture-landing";
import { isPublicLocale, landingCopy } from "@/lib/i18n";
import { landingCompositionEnabled } from "@/lib/rollout-server";

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();
  const userAgent = (await headers()).get("user-agent") ?? "";
  const motionEnabled = !/(?:Android|iPhone|iPad|iPod|Mobile)/i.test(userAgent);
  const compositionEnabled = landingCompositionEnabled();
  if (!compositionEnabled) {
    const [{ LandingPage }, { LandingStoreProvider }] = await Promise.all([
      import("@/components/landing-page"),
      import("@/components/providers/landing-store-provider"),
    ]);
    return (
      <LandingStoreProvider locale={locale}>
        <LandingPage locale={locale} copy={landingCopy[locale]} />
      </LandingStoreProvider>
    );
  }
  const LandingMotion = motionEnabled && compositionEnabled
    ? (await import("@/components/rama/landing-motion")).LandingMotion
    : null;

  return (
    <>
      <DecisionArchitectureLanding locale={locale} copy={landingCopy[locale]} />
      {LandingMotion ? <LandingMotion /> : null}
    </>
  );
}
