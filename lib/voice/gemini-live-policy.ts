import "server-only";

export function geminiLiveSessionResumptionEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.GEMINI_LIVE_SESSION_RESUMPTION_ENABLED === "true";
}
