import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Source_Serif_4 } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { CookieConsentBanner } from "@/components/rama/cookie-consent-banner";
import { localeDirection } from "@/lib/i18n";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  // Keep the metric-compatible fallback when the editorial face misses the
  // constrained-network LCP window; a late hero repaint is worse than no swap.
  display: "optional",
});



const impeccableContract = `<!--
THESIS: Dubai residential architecture frames the choice while Rama makes the buyer's intent clear; refuse tourism footage and crowded listing forms.
OWN-WORLD: Transparent navigation, blue-hour residential cityscape, centered editorial promise, Source Serif 4, Instrument Sans, Noto Sans Arabic, Decision Aperture, warm interiors, Fjord and sand signals.
STORY: A buyer sees a credible Dubai home context, understands that voice or text becomes one inspectable brief, and opens one bounded conversation.
FIRST VIEWPORT: Full-viewport residential horizon; transparent navigation; centered promise, supporting sentence, resting Decision Aperture, equivalent voice/text actions, a next-section cue, and an illustrative non-inventory disclosure.
FORM: User-pinned Residential Horizon extension; seed key rama-residential-horizon-pinned-20260824.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
-->`;

export const metadata: Metadata = {
  title: "Rama — Voice-led Dubai property discovery",
  description:
    "Describe the life you want in Dubai and turn it into a transparent, editable property brief with Rama.",
  applicationName: "Rama",
  openGraph: {
    title: "Rama",
    description: "Describe the life. We’ll shape the Dubai search.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f3ed",
  colorScheme: "light",
};

export default function RootLayout({
  children,
  decisionRoom,
}: Readonly<{
  children: React.ReactNode;
  decisionRoom: React.ReactNode;
}>) {
  // Use a default locale for server rendering to enable SSG.
  // The blocking script below will synchronously update the HTML tag attributes on the client
  // based on the URL path before the first paint, avoiding FOUC for Arabic (RTL) users.
  const locale = "en";
  
  return (
    <html lang={locale} dir={localeDirection(locale)} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var path = window.location.pathname;
                  var locale = path.split('/')[1];
                  if (locale === 'ar') {
                    document.documentElement.lang = 'ar';
                    document.documentElement.dir = 'rtl';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${instrumentSans.variable} ${sourceSerif.variable}`}>
        <template
          data-impeccable-contract="rama-residential-horizon-pinned-20260824"
          dangerouslySetInnerHTML={{ __html: impeccableContract }}
        />
        {children}
        {decisionRoom}
        <Suspense fallback={null}>
          <CookieConsentBanner locale={locale} />
        </Suspense>
      </body>
    </html>
  );
}
