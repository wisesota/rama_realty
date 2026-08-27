export type ProviderVerification = {
  provider: "posthog" | "sentry";
  status: string;
  ok: boolean;
  httpStatus?: number;
};

export function verifyPostHogCredentials(
  env?: Record<string, string | undefined>,
  request?: typeof fetch,
): Promise<ProviderVerification>;

export function verifySentryCredentials(
  env?: Record<string, string | undefined>,
  request?: typeof fetch,
): Promise<ProviderVerification>;

export function verifyTelemetryProviders(
  env?: Record<string, string | undefined>,
  request?: typeof fetch,
): Promise<{ ok: boolean; providers: ProviderVerification[] }>;
