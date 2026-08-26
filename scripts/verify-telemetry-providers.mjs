import { pathToFileURL } from "node:url";
import { loadLocalEnvironment } from "./env-contract.mjs";

const requestTimeoutMs = 8_000;

function configured(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export async function verifyPostHogCredentials(env = process.env, request = fetch) {
  const apiKey = env.POSTHOG_PERSONAL_API_KEY?.trim();
  const projectId = env.POSTHOG_PROJECT_ID?.trim();
  const host = env.POSTHOG_HOST?.trim() || "https://eu.posthog.com";

  if (!configured(apiKey) && !configured(projectId)) {
    return { provider: "posthog", status: "not_configured", ok: true };
  }
  if (!configured(apiKey) || !configured(projectId)) {
    return { provider: "posthog", status: "incomplete_configuration", ok: false };
  }

  try {
    const endpoint = `${new URL(host).origin}/api/projects/${encodeURIComponent(projectId)}/query/`;
    const response = await request(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { kind: "HogQLQuery", query: "SELECT 1" } }),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    return {
      provider: "posthog",
      status: response.ok ? "authenticated_query_accepted" : "authentication_rejected",
      ok: response.ok,
      httpStatus: response.status,
    };
  } catch {
    return { provider: "posthog", status: "unreachable", ok: false };
  }
}

export async function verifySentryCredentials(env = process.env, request = fetch) {
  const authToken = env.SENTRY_AUTH_TOKEN?.trim();
  const dsn = env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  const organization = env.SENTRY_ORG?.trim() || "rama-d2";
  const project = env.SENTRY_PROJECT?.trim() || "javascript-nextjs";

  if (!configured(authToken) && !configured(dsn)) {
    return { provider: "sentry", status: "not_configured", ok: true };
  }
  if (!configured(authToken) || !configured(dsn)) {
    return { provider: "sentry", status: "incomplete_configuration", ok: false };
  }

  let dsnProjectId;
  try {
    const parsedDsn = new URL(dsn);
    if (parsedDsn.protocol !== "https:") {
      return { provider: "sentry", status: "invalid_dsn", ok: false };
    }
    dsnProjectId = parsedDsn.pathname.split("/").filter(Boolean).at(-1);
    if (!dsnProjectId) return { provider: "sentry", status: "invalid_dsn", ok: false };
  } catch {
    return { provider: "sentry", status: "invalid_dsn", ok: false };
  }

  try {
    const endpoint = `https://sentry.io/api/0/projects/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/`;
    const response = await request(endpoint, {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
    if (!response.ok) {
      return {
        provider: "sentry",
        status: "authentication_rejected",
        ok: false,
        httpStatus: response.status,
      };
    }
    const payload = await response.json();
    const projectMatchesDsn = String(payload?.id ?? "") === dsnProjectId;
    return {
      provider: "sentry",
      status: projectMatchesDsn ? "authenticated_project_matched" : "dsn_project_mismatch",
      ok: projectMatchesDsn,
      httpStatus: response.status,
    };
  } catch {
    return { provider: "sentry", status: "unreachable", ok: false };
  }
}

export async function verifyTelemetryProviders(env = process.env, request = fetch) {
  const providers = await Promise.all([
    verifyPostHogCredentials(env, request),
    verifySentryCredentials(env, request),
  ]);
  return { ok: providers.every((provider) => provider.ok), providers };
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === invokedPath) {
  loadLocalEnvironment();
  const result = await verifyTelemetryProviders();
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
