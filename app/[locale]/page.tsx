import { notFound } from "next/navigation";
import { DecisionArchitectureLanding } from "@/components/decision-architecture-landing";
import { isPublicLocale, landingCopy, publicLocales } from "@/lib/i18n";
import { landingCompositionEnabled } from "@/lib/rollout-server";
import { LandingStoreProvider } from "@/components/providers/landing-store-provider";

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
    const { LandingPage } = await import("@/components/landing-page");
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
    <LandingStoreProvider locale={locale}>
      <DecisionArchitectureLanding locale={locale} copy={landingCopy[locale]} />
      {LandingMotion ? <LandingMotion /> : null}
    </LandingStoreProvider>
  );
}
