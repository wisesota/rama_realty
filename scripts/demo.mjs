import { spawn } from "node:child_process";
import { rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const pnpmEntrypoint = process.env.npm_execpath;
if (!pnpmEntrypoint) {
  console.error("Run this command through pnpm: pnpm demo");
  process.exit(1);
}

const demoPort = process.env.RAMA_DEMO_PORT?.trim() || process.env.PORT?.trim() || "3000";
const demoOrigin = `http://localhost:${demoPort}`;
const demoStorePath = join(tmpdir(), `rama-demo-searches-${process.pid}-${Date.now()}.json`);
const demoBuildPath = resolve(process.cwd(), ".next-demo");

if (process.env.RAMA_DEMO_CLEAN_BUILD === "true") {
  if (basename(demoBuildPath) !== ".next-demo") {
    throw new Error("Refusing to clear an unexpected demo build path.");
  }
  rmSync(demoBuildPath, { recursive: true, force: true });
}

const demoEnvironment = {
  ...process.env,
  RAMA_DEMO_MODE: "true",
  RAMA_DEMO_STORE_PATH: demoStorePath,
  GEMINI_LIVE_ENABLED: "false",
  GEMINI_API_KEY: "",
  RATE_LIMIT_SECRET: "rama-demo-rate-limit-secret-not-for-production-2026",
  BUYER_SESSION_SECRET: "rama-demo-buyer-session-secret-not-production-2026",
  NEXT_PUBLIC_SUPABASE_URL: "https://demo.invalid",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "demo-publishable-key",
  SUPABASE_SECRET_KEY: "demo-server-key-not-for-production",
  NEXT_PUBLIC_SITE_URL: demoOrigin,
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "",
  POSTHOG_PERSONAL_API_KEY: "",
  NEXT_PUBLIC_SENTRY_DSN: "",
  SENTRY_AUTH_TOKEN: "",
};

console.log(`Starting Rama in illustrative, offline-safe demo mode at ${demoOrigin}/en`);
console.log("Gemini Live, durable persistence, advisor handoff, telemetry, and licensed inventory are disabled.");
console.log("Confirmed demo searches use an isolated ephemeral store for 30 minutes and disappear on restart.");

// Next 16 Turbopack currently accumulates interception rewrites after HMR,
// corrupting modal routes such as /(.)discover/[searchRunId]. Webpack keeps
// the supported development route contract stable until the upstream fix lands.
const child = spawn(process.execPath, [pnpmEntrypoint, "exec", "next", "dev", "--webpack", "-p", demoPort], {
  env: demoEnvironment,
  stdio: "inherit",
});

function cleanDemoStore() {
  try {
    unlinkSync(demoStorePath);
  } catch {
    // The demo may exit before its first confirmed search creates the file.
  }
}

process.once("exit", cleanDemoStore);

child.on("exit", (code, signal) => {
  cleanDemoStore();
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
