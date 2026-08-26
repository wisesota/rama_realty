import {
  scrubSentryBreadcrumb,
  scrubSentryEvent,
} from "@/lib/telemetry-privacy";

type SentryClient = typeof import("@sentry/nextjs");
const queuedErrors: unknown[] = [];
let initialization: Promise<SentryClient> | null = null;

function rememberError(error: unknown) {
  if (queuedErrors.length === 10) queuedErrors.shift();
  queuedErrors.push(error);
}

function queueWindowError(event: ErrorEvent) {
  rememberError(event.error ?? new Error(event.message));
}

function queueUnhandledRejection(event: PromiseRejectionEvent) {
  rememberError(event.reason);
}

function initializeSentry() {
  if (initialization) return initialization;
  initialization = import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: process.env.NODE_ENV !== "development",
      sendDefaultPii: false,
      // Client monitoring is deliberately error-only. Server traces retain the
      // governed sample rate without delaying the public hero.
      tracesSampleRate: 0,
      beforeSend: scrubSentryEvent,
      beforeSendTransaction: scrubSentryEvent,
      beforeBreadcrumb: scrubSentryBreadcrumb,
      maxBreadcrumbs: 25,
      normalizeDepth: 3,
      debug: false,
    });

    for (const error of queuedErrors.splice(0)) Sentry.captureException(error);
    window.removeEventListener("error", queueWindowError);
    window.removeEventListener("unhandledrejection", queueUnhandledRejection);
    return Sentry;
  });
  return initialization;
}

if (process.env.NODE_ENV !== "development") {
  window.addEventListener("error", queueWindowError);
  window.addEventListener("unhandledrejection", queueUnhandledRejection);
  window.addEventListener(
    "load",
    () => window.setTimeout(() => void initializeSentry(), 3_000),
    { once: true },
  );
}
