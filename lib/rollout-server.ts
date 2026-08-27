import "server-only";

import { createHmac } from "node:crypto";

function booleanFlag(key: string, defaultValue: boolean) {
  const value = process.env[key]?.trim();
  if (value === undefined || value === "") return defaultValue;
  return value === "true";
}

function rolloutPercent() {
  const value = Number(process.env.RAMA_DECISION_OS_ROLLOUT_PERCENT ?? "100");
  return Number.isInteger(value) && value >= 0 && value <= 100 ? value : 0;
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

export function decisionOsEnabledForBuyer(buyerTokenHash: string) {
  if (!publicExperienceEnabled()) return false;
  const percentage = rolloutPercent();
  if (percentage <= 0) return false;
  if (percentage >= 100) return true;
  const secret = process.env.BUYER_SESSION_SECRET;
  if (!secret || secret.length < 32 || !/^[a-f0-9]{64}$/i.test(buyerTokenHash)) return false;
  const digest = createHmac("sha256", secret)
    .update("rama-decision-os-rollout\0")
    .update(buyerTokenHash.toLowerCase())
    .digest();
  const bucket = digest.readUInt32BE(0) / 0x1_0000_0000;
  return bucket < percentage / 100;
}
