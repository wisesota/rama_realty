import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const productionCookieName = "__Host-rama-buyer";
const developmentCookieName = "rama-buyer";
export const buyerSessionTtlSeconds = 60 * 60 * 2;

function cookieName() {
  return process.env.NODE_ENV === "production" ? productionCookieName : developmentCookieName;
}

function secret() {
  const value = process.env.BUYER_SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BUYER_SESSION_SECRET must be configured with at least 32 characters in production.");
  }
  return "rama-buyer-session-default-secret-salt-32chars";
}

export function hashBuyerSessionToken(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

function validToken(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}

function newToken() {
  return randomBytes(32).toString("base64url");
}

async function writeTokenCookie(token: string) {
  (await cookies()).set(cookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: buyerSessionTtlSeconds,
    priority: "high",
  });
}

export async function getBuyerSessionTokenHash() {
  const value = (await cookies()).get(cookieName())?.value;
  return validToken(value) ? hashBuyerSessionToken(value) : null;
}

export async function getOrCreateBuyerSessionTokenHash() {
  const store = await cookies();
  const existing = store.get(cookieName())?.value;
  if (validToken(existing)) return hashBuyerSessionToken(existing);

  const token = newToken();
  await writeTokenCookie(token);
  return hashBuyerSessionToken(token);
}

export type BuyerSessionRotationReason =
  | "login"
  | "auth_callback"
  | "handoff"
  | "password_change"
  | "signout";

export type BuyerSessionTokenRotation = {
  currentTokenHash: string;
  nextTokenHash: string;
  nextToken: string;
};

export async function createBuyerSessionTokenRotation(rotationKey?: string): Promise<BuyerSessionTokenRotation> {
  const existing = (await cookies()).get(cookieName())?.value;
  const currentToken = validToken(existing) ? existing : newToken();
  const nextToken = rotationKey
    ? createHmac("sha256", secret())
        .update("rama-buyer-session-rotation\0")
        .update(rotationKey)
        .update("\0")
        .update(currentToken)
        .digest("base64url")
    : newToken();
  return {
    currentTokenHash: hashBuyerSessionToken(currentToken),
    nextTokenHash: hashBuyerSessionToken(nextToken),
    nextToken,
  };
}

export async function commitBuyerSessionToken(nextToken: string) {
  if (!validToken(nextToken)) throw new Error("Invalid buyer session token.");
  await writeTokenCookie(nextToken);
}

export async function resetBuyerSessionCookie() {
  await writeTokenCookie(newToken());
}

export async function rotateBuyerSessionToken({
  mode,
  reason,
  userId = null,
}: {
  mode: "rotate" | "bind" | "revoke";
  reason: BuyerSessionRotationReason;
  userId?: string | null;
}) {
  const rotation = await createBuyerSessionTokenRotation();
  const admin = createAdminClient();
  const { error } = await admin.rpc("rotate_buyer_session", {
    p_current_token_hash: rotation.currentTokenHash,
    p_next_token_hash: rotation.nextTokenHash,
    p_user_id: userId,
    p_mode: mode,
    p_ttl_seconds: buyerSessionTtlSeconds,
    p_reason: reason,
  });
  if (error) {
    console.error("Buyer session rotation failed:", error.code);
    if (mode === "revoke") {
      const { error: fallbackError } = await admin
        .from("buyer_sessions")
        .update({ revoked_at: new Date().toISOString(), last_seen_at: new Date().toISOString() })
        .eq("token_hash", rotation.currentTokenHash)
        .is("revoked_at", null);
      if (!fallbackError) {
        await commitBuyerSessionToken(rotation.nextToken);
        return;
      }
      console.error("Buyer session fallback revocation failed:", fallbackError.code);
    }
    throw new Error("The buyer session could not be secured.");
  }
  await commitBuyerSessionToken(rotation.nextToken);
}
