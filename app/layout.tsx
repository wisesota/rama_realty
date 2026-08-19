import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Source_Serif_4 } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { PostHogProvider } from "./providers";
import { CookieConsentBanner } from "@/components/rama/cookie-consent-banner";
import { PostHogPageView } from "@/components/rama/posthog-pageview";
import { TelemetryIdentity } from "@/components/rama/telemetry-identity";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rama Realty — Voice-led Dubai property discovery",
  description:
    "Describe the life you want in Dubai and turn it into a transparent, editable property brief with Rama Realty.",
  applicationName: "Rama Realty",
  openGraph: {
    title: "Rama Realty",
    description: "Describe the life. We’ll shape the Dubai search.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbfbf8",
  colorScheme: "light",
};

export default function RootLayout({
  children,
  decisionRoom,
}: Readonly<{
  children: React.ReactNode;
  decisionRoom?: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${instrumentSans.variable} ${sourceSerif.variable}`}>
        <PostHogProvider>
          {children}
          {decisionRoom}
          <Suspense fallback={null}>
            <PostHogPageView />
            <TelemetryIdentity />
          </Suspense>
          <CookieConsentBanner />
        </PostHogProvider>
      </body>
    </html>
  );
}
