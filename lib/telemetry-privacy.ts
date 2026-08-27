const redacted = "[redacted]";

const protectedKey = /(?:audio|authorization|brief|contact|cookie|credential|email|input|output|password|phone|prompt|recording|secret|session|token|transcript)/i;
const sensitiveText = /(?:[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{7,}\d|(?:bearer|token|secret|password)\s*[:=]\s*\S+)/i;
const identifierSegment = /^(?:[0-9a-f]{8}-[0-9a-f-]{27,}|[A-Za-z0-9_-]{24,})$/i;

type TelemetryEvent = Record<string, unknown>;

function sanitizeRouteLabel(value: unknown) {
  if (typeof value !== "string") return undefined;
  if (sensitiveText.test(value)) return redacted;

  return value
    .split("/")
    .map((segment) => (identifierSegment.test(segment) ? "[id]" : segment))
    .join("/")
    .slice(0, 240);
}

function sanitizeTags(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const tags = value as Record<string, unknown>;
  const allowed = ["environment", "release", "runtime", "region"];
  return Object.fromEntries(
    allowed.flatMap((key) => {
      const candidate = tags[key];
      return typeof candidate === "string" && !sensitiveText.test(candidate)
        ? [[key, candidate.slice(0, 120)]]
        : [];
    }),
  );
}

function sanitizeException(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const exception = value as { values?: Array<Record<string, unknown>> };
  if (!Array.isArray(exception.values)) return undefined;
  return {
    values: exception.values.map((item) => ({
      type: typeof item.type === "string" ? item.type.slice(0, 120) : "Error",
      value: redacted,
      stacktrace: item.stacktrace,
      mechanism: item.mechanism,
    })),
  };
}

/**
 * Strict telemetry boundary for buyer-facing surfaces.
 *
 * Error type, stack, release, environment, route shape, and trace timing remain
 * observable. Buyer content, contact data, headers, cookies, request bodies,
 * identifiers, arbitrary context, and exception messages do not leave the app.
 */
export function scrubSentryEvent<T extends object>(event: T): T {
  const value = event as TelemetryEvent;
  const request = value.request as Record<string, unknown> | undefined;
  const safeRequest = request && typeof request.method === "string"
    ? { method: request.method.slice(0, 16) }
    : undefined;

  return {
    ...value,
    message: value.message ? redacted : undefined,
    transaction: sanitizeRouteLabel(value.transaction),
    user: undefined,
    request: safeRequest,
    extra: undefined,
    contexts: undefined,
    tags: sanitizeTags(value.tags),
    breadcrumbs: undefined,
    spans: undefined,
    exception: sanitizeException(value.exception),
  } as T;
}

export function scrubSentryBreadcrumb<T extends object>(breadcrumb: T): T {
  const value = breadcrumb as TelemetryEvent;
  return {
    ...value,
    message: value.message ? redacted : undefined,
    data: undefined,
  } as T;
}

export function sentryTraceSampleRate(value: string | undefined, fallback = 0.05) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : fallback;
}

export function telemetryKeyIsProtected(key: string) {
  return protectedKey.test(key);
}
