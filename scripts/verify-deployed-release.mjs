const commitPattern = /^[a-f0-9]{40}$/;
const expectedCommit = process.env.RAMA_RELEASE_COMMIT?.trim() ?? "";
const stagingUrl = process.env.RAMA_STAGING_URL?.trim() ?? "";

if (!commitPattern.test(expectedCommit)) throw new Error("RAMA_RELEASE_COMMIT must be an exact 40-character lowercase commit SHA.");

let endpoint;
try {
  const origin = new URL(stagingUrl);
  if (origin.protocol !== "https:" && origin.origin !== "http://localhost:3000") throw new Error("invalid protocol");
  endpoint = new URL("/api/health/release", origin).toString();
} catch {
  throw new Error("RAMA_STAGING_URL must be an HTTPS origin (localhost is allowed for local verification).");
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8_000);
try {
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: controller.signal,
  });
  const payload = await response.json();
  const ok = response.ok && payload?.status === "ok" && payload?.releaseCommit === expectedCommit;
  console.log(JSON.stringify({
    ok,
    endpoint,
    expectedCommit,
    deployedCommit: payload?.releaseCommit ?? null,
    status: response.status,
  }));
  if (!ok) process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
