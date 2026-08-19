import { createHmac } from "node:crypto";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Deployed verification can provide environment variables directly.
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.RATE_LIMIT_SECRET || process.env.GEMINI_API_KEY;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !publishableKey || !secret) {
  throw new Error(
    "Supabase URL, publishable key, and a server-only rate-limit secret are required.",
  );
}

const headers = {
  apikey: publishableKey,
  Authorization: `Bearer ${publishableKey}`,
  "Content-Type": "application/json",
};

async function request(path, init = {}) {
  return fetch(`${url}${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });
}

async function main() {
  const catalog = await request(
    "/rest/v1/public_property_catalog?select=id,status,publication_status,organization_id&limit=20",
  );
  if (!catalog.ok) {
    const payload = await catalog.json().catch(() => ({}));
    if (catalog.status === 401 || catalog.status === 403) {
      throw new Error("Supabase authorization failed: verify your publishable key.");
    }
    throw new Error(
      `Supabase public catalog verification failed with ${catalog.status} ${payload.code || "unknown"}.`,
    );
  }

  const catalogRows = await catalog.json();
  if (!Array.isArray(catalogRows) || catalogRows.length === 0) {
    throw new Error("Supabase public catalog verification returned no governed records.");
  }
  const invalidCatalogRow = catalogRows.find((row) => {
    const illustrative = row.status === "illustrative" && row.organization_id === null;
    const published = row.status === "live" && row.publication_status === "published" && typeof row.organization_id === "string";
    return !illustrative && !published;
  });
  if (invalidCatalogRow) {
    throw new Error("The public catalog exposed a record outside the publication contract.");
  }

  const serviceOnlyTables = ["search_briefs", "buyer_sessions", "tool_runs", "inquiries"];
  for (const table of serviceOnlyTables) {
    const response = await request(`/rest/v1/${table}?select=id&limit=1`);
    const rows = response.ok ? await response.json() : [];
    if (!Array.isArray(rows) || rows.length > 0) {
      throw new Error(`Anonymous access unexpectedly returned protected ${table} records.`);
    }
  }

  let sharedRateLimitAtomicWrite = "not-run: SUPABASE_SECRET_KEY is not configured";
  if (supabaseSecretKey) {
    const bucketKey = createHmac("sha256", secret)
      .update(`hosted-verification:${Date.now()}`)
      .digest("hex");
    const limiter = await request("/rest/v1/rpc/consume_api_rate_limit", {
      method: "POST",
      headers: {
        apikey: supabaseSecretKey,
        Authorization: `Bearer ${supabaseSecretKey}`,
      },
      body: JSON.stringify({
        p_scope: "gemini-live-token",
        p_bucket_key: bucketKey,
        p_window_seconds: 60,
        p_max_requests: 1,
      }),
    });
    if (!limiter.ok) {
      const payload = await limiter.json().catch(() => ({}));
      throw new Error(
        `Shared rate-limit RPC verification failed with ${limiter.status} ${payload.code || "unknown"}.`,
      );
    }

    const limiterRows = await limiter.json();
    if (!Array.isArray(limiterRows) || limiterRows[0]?.allowed !== true) {
      throw new Error("Shared rate-limit RPC returned an invalid first-use result.");
    }
    sharedRateLimitAtomicWrite = true;
  }

  console.log(
    JSON.stringify({
      ok: true,
      governedCatalogReadable: true,
      publicCatalogPredicateVerified: true,
      anonymousOperationalReadsDenied: serviceOnlyTables,
      sharedRateLimitAtomicWrite,
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Supabase verification failed.");
  process.exitCode = 1;
});
