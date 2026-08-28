import "server-only";

import { createHmac } from "node:crypto";

// Re-export all edge-safe flags so existing server-side callers
// (Server Components, Route Handlers) keep working unchanged.
export {
  briefConfirmationEnabled,
  publicExperienceEnabled,
  landingCompositionEnabled,
  cinematicHeroEnabled,
  evidenceV2WriterEnabled,
  evidenceV2RendererEnabled,
  localeRoutesEnabled,
} from "./rollout-flags";

// ── Node-only helpers ──────────────────────────────────────────────

function rolloutPercent() {
  const value = Number(process.env.RAMA_DECISION_OS_ROLLOUT_PERCENT ?? "100");
  return Number.isInteger(value) && value >= 0 && value <= 100 ? value : 0;
}

// This import is intentionally kept here in rollout-server.ts because
// it is only required by `publicExperienceEnabled` path; however, the
// actual `publicExperienceEnabled` boolean check has been moved to the
// edge-safe module. Only `decisionOsEnabledForBuyer` truly needs crypto.
import { publicExperienceEnabled } from "./rollout-flags";

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
