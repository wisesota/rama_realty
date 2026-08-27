import * as Sentry from "@sentry/nextjs";
import {
  scrubSentryBreadcrumb,
  scrubSentryEvent,
  sentryTraceSampleRate,
} from "@/lib/telemetry-privacy";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV !== "development",
  sendDefaultPii: false,
  tracesSampleRate: sentryTraceSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
  beforeSend: scrubSentryEvent,
  beforeSendTransaction: scrubSentryEvent,
  beforeBreadcrumb: scrubSentryBreadcrumb,
  maxBreadcrumbs: 25,
  normalizeDepth: 3,
  debug: false,
});
