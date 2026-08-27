import net from "node:net";
import { inspectEnvironment, loadLocalEnvironment } from "./env-contract.mjs";

const requiredNode = [22, 0, 0];

function versionAtLeast(actual, minimum) {
  const parts = actual.split(".").map(Number);
  for (let index = 0; index < minimum.length; index += 1) {
    if ((parts[index] ?? 0) > minimum[index]) return true;
    if ((parts[index] ?? 0) < minimum[index]) return false;
  }
  return true;
}

function portAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function reachable(label, url) {
  if (!url) return { label, status: "not_configured" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);
  try {
    const response = await fetch(new URL("/", url), { method: "HEAD", signal: controller.signal });
    return { label, status: response.status < 500 ? "reachable" : "server_error" };
  } catch {
    return { label, status: "unreachable" };
  } finally {
    clearTimeout(timeout);
  }
}

loadLocalEnvironment();
const environment = inspectEnvironment();
const runtime = process.versions.node;
const packageManager = process.env.npm_config_user_agent?.startsWith("pnpm/")
  || process.env.npm_execpath?.toLowerCase().includes("pnpm");
const providers = await Promise.all([
  reachable("supabase", process.env.NEXT_PUBLIC_SUPABASE_URL),
  reachable("posthog", process.env.NEXT_PUBLIC_POSTHOG_HOST || process.env.POSTHOG_HOST),
]);
const checks = {
  node: versionAtLeast(runtime, requiredNode),
  packageManager: Boolean(packageManager),
  environment: environment.ok,
  port3000: await portAvailable(3000),
  providers: providers.every((provider) => provider.status === "reachable" || provider.status === "not_configured"),
};

console.log(JSON.stringify({
  ok: Object.values(checks).every(Boolean),
  checks,
  runtime: { node: runtime, required: ">=22.0.0", packageManager: "pnpm" },
  environment: {
    invalidKeys: environment.invalidKeys,
    publicExposureViolations: environment.publicExposureViolations,
    sharedSecretPairs: environment.sharedSecretPairs,
  },
  providers,
}, null, 2));

if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
