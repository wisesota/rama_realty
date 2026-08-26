import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const challengeTtlSeconds = 60 * 10;
const authorizationTtlSeconds = 60 * 10;

function challengeCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Host-rama-buyer-deletion-challenge"
    : "rama-buyer-deletion-challenge";
}

function authorizationCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Host-rama-buyer-deletion-authorization"
    : "rama-buyer-deletion-authorization";
}

function newProof() {
  return randomBytes(32).toString("base64url");
}

function validProof(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}

export function hashBuyerDeletionProof(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function writeCookie(name: string, value: string, maxAge: number, sameSite: "lax" | "strict") {
  (await cookies()).set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite,
    path: "/",
    maxAge,
    priority: "high",
  });
}

async function clearCookie(name: string) {
  (await cookies()).set(name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
}

export async function issueBuyerDeletionChallenge() {
  const proof = newProof();
  await writeCookie(challengeCookieName(), proof, challengeTtlSeconds, "lax");
  return hashBuyerDeletionProof(proof);
}

export async function getBuyerDeletionChallengeHash() {
  const proof = (await cookies()).get(challengeCookieName())?.value;
  return validProof(proof) ? hashBuyerDeletionProof(proof) : null;
}

export async function clearBuyerDeletionChallenge() {
  await clearCookie(challengeCookieName());
}

export async function issueBuyerDeletionAuthorization() {
  const proof = newProof();
  await writeCookie(authorizationCookieName(), proof, authorizationTtlSeconds, "strict");
  return hashBuyerDeletionProof(proof);
}

export async function getBuyerDeletionAuthorizationHash() {
  const proof = (await cookies()).get(authorizationCookieName())?.value;
  return validProof(proof) ? hashBuyerDeletionProof(proof) : null;
}

export async function clearBuyerDeletionAuthorization() {
  await clearCookie(authorizationCookieName());
}
