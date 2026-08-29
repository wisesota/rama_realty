const minimumSecretLength = 32;
const commitPattern = /^[a-f0-9]{40}$/;

export const environmentContract = [
  { key: "RATE_LIMIT_SECRET", exposure: "server", required: true, kind: "secret", minimumLength: minimumSecretLength },
  { key: "BUYER_SESSION_SECRET", exposure: "server", required: true, kind: "secret", minimumLength: minimumSecretLength },
  { key: "NEXT_PUBLIC_SUPABASE_URL", exposure: "public", required: true, kind: "url" },
  { key: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", exposure: "public", required: true, kind: "publishable" },
  { key: "NEXT_PUBLIC_SITE_URL", exposure: "public", required: true, kind: "url" },
  { key: "SUPABASE_SECRET_KEY", exposure: "server", required: true, kind: "secret" },
  { key: "RAMA_DEMO_MODE", exposure: "server", required: true, kind: "boolean" },
  { key: "RAMA_RELEASE_COMMIT", exposure: "server", required: false, kind: "commit-sha" },
  { key: "RAMA_PUBLIC_EXPERIENCE_ENABLED", exposure: "server", required: false, kind: "boolean" },
  { key: "RAMA_LANDING_COMPOSITION_ENABLED", exposure: "server", required: false, kind: "boolean" },
  { key: "RAMA_BRIEF_CONFIRMATION_ENABLED", exposure: "server", required: false, kind: "boolean" },
  { key: "RAMA_EVIDENCE_V2_WRITER_ENABLED", exposure: "server", required: false, kind: "boolean" },
  { key: "RAMA_EVIDENCE_V2_RENDERER_ENABLED", exposure: "server", required: false, kind: "boolean" },
  { key: "RAMA_LOCALE_ROUTES_ENABLED", exposure: "server", required: false, kind: "boolean" },
  { key: "RAMA_DECISION_OS_ROLLOUT_PERCENT", exposure: "server", required: false, kind: "percentage" },
  { key: "GEMINI_LIVE_ENABLED", exposure: "server", required: true, kind: "boolean" },
  { key: "GEMINI_LIVE_SESSION_RESUMPTION_ENABLED", exposure: "server", required: true, kind: "boolean" },
  { key: "GEMINI_LIVE_DAILY_SESSION_LIMIT", exposure: "server", required: true, kind: "positive-integer" },
  { key: "RAMA_OPERATIONAL_TELEMETRY_ENABLED", exposure: "server", required: true, kind: "boolean" },
  { key: "LICENSED_SUPPLY_PUBLICATION_ENABLED", exposure: "server", required: false, kind: "boolean" },
  { key: "LICENSED_SUPPLY_PROVIDER_IDS", exposure: "server", required: false, kind: "identifier-list" },
  { key: "GEMINI_API_KEY", exposure: "server", requiredWhen: (env) => env.GEMINI_LIVE_ENABLED !== "false", kind: "secret" },
  { key: "GEMINI_VOICE_MODEL", exposure: "server", required: false, kind: "recorded-model" },
  { key: "HOUSECANARY_API_KEY", exposure: "server", required: false, kind: "unapproved-connector" },
  { key: "HUBSPOT_ACCESS_TOKEN", exposure: "server", required: false, kind: "unapproved-connector" },
  { key: "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", exposure: "public", required: false, kind: "publishable" },
  { key: "NEXT_PUBLIC_POSTHOG_HOST", exposure: "public", required: false, kind: "url" },
  { key: "POSTHOG_PERSONAL_API_KEY", exposure: "server", required: false, kind: "secret" },
  { key: "POSTHOG_PROJECT_ID", exposure: "server", required: false, kind: "identifier" },
  { key: "POSTHOG_HOST", exposure: "server", required: false, kind: "url" },
  { key: "NEXT_PUBLIC_SENTRY_DSN", exposure: "public", required: false, kind: "url" },
  { key: "SENTRY_AUTH_TOKEN", exposure: "server", required: false, kind: "secret" },
  { key: "SENTRY_TRACES_SAMPLE_RATE", exposure: "server", required: false, kind: "sample-rate" },
  { key: "NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE", exposure: "public", required: false, kind: "sample-rate" },
  { key: "CHROMATIC_PROJECT_TOKEN", exposure: "server", required: false, kind: "secret" },
  { key: "RAMA_RLS_TEST_USER_A_EMAIL", exposure: "server", required: false, kind: "private-test-credential" },
  { key: "RAMA_RLS_TEST_USER_A_PASSWORD", exposure: "server", required: false, kind: "private-test-credential" },
  { key: "RAMA_RLS_TEST_USER_B_EMAIL", exposure: "server", required: false, kind: "private-test-credential" },
  { key: "RAMA_RLS_TEST_USER_B_PASSWORD", exposure: "server", required: false, kind: "private-test-credential" },
  { key: "RAMA_RLS_TEST_EPHEMERAL", exposure: "server", required: false, kind: "verification-switch" },
];

const forbiddenPublicName = /(?:ADMIN|API_KEY|AUTH_TOKEN|BUYER|CREDENTIAL|PERSONAL|PASSWORD|RATE_LIMIT|SECRET|SERVICE_ROLE)/i;

function isUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.origin === "http://localhost:3000";
  } catch {
    return false;
  }
}

function validateValue(entry, value) {
  if (!value) return "missing";
  if (entry.minimumLength && value.length < entry.minimumLength) return "too_short";
  if (entry.kind === "url" && !isUrl(value)) return "invalid_url";
  if (entry.kind === "boolean" && value !== "true" && value !== "false") return "invalid_boolean";
  if (entry.kind === "sample-rate") {
    const rate = Number(value);
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) return "invalid_sample_rate";
  }
  if (entry.kind === "percentage") {
    const percentage = Number(value);
    if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) return "invalid_percentage";
  }
  if (entry.kind === "positive-integer") {
    const amount = Number(value);
    if (!Number.isInteger(amount) || amount < 1 || amount > 10_000) return "invalid_positive_integer";
  }
  if (entry.kind === "identifier-list" && !value.split(",").every((item) => /^[a-z0-9][a-z0-9_-]{1,62}$/.test(item.trim()))) return "invalid_identifier_list";
  if (entry.kind === "commit-sha" && !commitPattern.test(value)) return "invalid_commit_sha";
  return "configured";
}

export function inspectEnvironment(env = process.env) {
  const entries = environmentContract.map((entry) => {
    const required = entry.required === true || entry.requiredWhen?.(env) === true;
    const status = validateValue(entry, env[entry.key]?.trim());
    return { key: entry.key, exposure: entry.exposure, kind: entry.kind, required, status };
  });

  const publicExposureViolations = Object.keys(env)
    .filter((key) => key.startsWith("NEXT_PUBLIC_") && forbiddenPublicName.test(key.slice("NEXT_PUBLIC_".length)))
    .sort();
  const invalid = entries.filter((entry) => entry.required
    ? entry.status !== "configured"
    : entry.status !== "configured" && entry.status !== "missing");
  const sharedSecrets = [
    ["RATE_LIMIT_SECRET", "GEMINI_API_KEY"],
    ["RATE_LIMIT_SECRET", "SUPABASE_SECRET_KEY"],
    ["BUYER_SESSION_SECRET", "SUPABASE_SECRET_KEY"],
    ["BUYER_SESSION_SECRET", "RATE_LIMIT_SECRET"],
    ["BUYER_SESSION_SECRET", "GEMINI_API_KEY"],
  ].filter(([left, right]) => env[left] && env[left] === env[right]);

  return {
    ok: invalid.length === 0 && publicExposureViolations.length === 0 && sharedSecrets.length === 0,
    entries,
    invalidKeys: invalid.map((entry) => entry.key),
    publicExposureViolations,
    sharedSecretPairs: sharedSecrets.map(([left, right]) => `${left}:${right}`),
  };
}

export function loadLocalEnvironment() {
  try {
    process.loadEnvFile(".env.local");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
