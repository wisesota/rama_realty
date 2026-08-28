/**
 * Edge-safe feature flags.
 *
 * proxy.ts runs in the Edge Runtime where `node:crypto` and the
 * `server-only` guard are unavailable. This module exposes the tiny
 * boolean-flag helpers that the proxy needs without pulling in
 * Node-only dependencies.
 *
 * Server Components and Route Handlers should continue to import from
 * `@/lib/rollout-server` which re-exports everything here *plus* the
 * functions that genuinely require Node (e.g. decisionOsEnabledForBuyer).
 */

function booleanFlag(key: string, defaultValue: boolean) {
  const value = process.env[key]?.trim();
  if (value === undefined || value === "") return defaultValue;
  return value === "true";
}

export function briefConfirmationEnabled() {
  return booleanFlag("RAMA_BRIEF_CONFIRMATION_ENABLED", true);
}

export function publicExperienceEnabled() {
  return booleanFlag("RAMA_PUBLIC_EXPERIENCE_ENABLED", true);
}

export function landingCompositionEnabled() {
  return booleanFlag("RAMA_LANDING_COMPOSITION_ENABLED", true);
}

export function cinematicHeroEnabled() {
  return booleanFlag("RAMA_CINEMATIC_HERO_ENABLED", true);
}

export function evidenceV2WriterEnabled() {
  return booleanFlag("RAMA_EVIDENCE_V2_WRITER_ENABLED", true);
}

export function evidenceV2RendererEnabled() {
  return booleanFlag("RAMA_EVIDENCE_V2_RENDERER_ENABLED", true);
}

export function localeRoutesEnabled() {
  return booleanFlag("RAMA_LOCALE_ROUTES_ENABLED", true);
}
