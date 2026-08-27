import { notFound } from "next/navigation";
import { DecisionArchitectureLanding } from "@/components/decision-architecture-landing";
import { isPublicLocale, landingCopy, publicLocales } from "@/lib/i18n";
import { landingCompositionEnabled } from "@/lib/rollout-server";

export function generateStaticParams() {
  return publicLocales.map((locale) => ({ locale }));
}

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPublicLocale(locale)) notFound();
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
  const LandingMotion = compositionEnabled
    ? (await import("@/components/rama/landing-motion")).LandingMotion
    : null;

  return (
    <>
      <DecisionArchitectureLanding locale={locale} copy={landingCopy[locale]} />
      {LandingMotion ? <LandingMotion /> : null}
    </>
  );
}
