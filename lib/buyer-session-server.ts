import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const productionCookieName = "__Host-rama-buyer";
const developmentCookieName = "rama-buyer";
export const buyerSessionTtlSeconds = 60 * 60 * 24 * 30;

function cookieName() {
  return process.env.NODE_ENV === "production" ? productionCookieName : developmentCookieName;
}

function secret() {
  const value = process.env.BUYER_SESSION_SECRET || process.env.SUPABASE_SECRET_KEY;
  if (!value || value.length < 32) throw new Error("BUYER_SESSION_SECRET must be at least 32 characters.");
  return value;
}

export function hashBuyerSessionToken(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

function validToken(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}

export async function getBuyerSessionTokenHash() {
  const value = (await cookies()).get(cookieName())?.value;
  return validToken(value) ? hashBuyerSessionToken(value) : null;
}

export async function getOrCreateBuyerSessionTokenHash() {
  const store = await cookies();
  const existing = store.get(cookieName())?.value;
  if (validToken(existing)) return hashBuyerSessionToken(existing);

  const token = randomBytes(32).toString("base64url");
  store.set(cookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: buyerSessionTtlSeconds,
    priority: "high",
  });
  return hashBuyerSessionToken(token);
}
