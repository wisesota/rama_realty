"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/auth/safe-next-path";
import {
  type ActionState,
  readText,
} from "@/lib/dashboard/validation";
import { resetBuyerSessionCookie, rotateBuyerSessionToken } from "@/lib/buyer-session-server";

export async function signInWithPasswordAction(
  _previous: ActionState,

  formData: FormData,
): Promise<ActionState> {
  const email = readText(formData, "email", 254).toLowerCase();
  const password = readText(formData, "password", 200);
  const next = safeInternalPath(readText(formData, "next", 200));

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }

  // Leaked-password protection
  try {
    const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    const prefix = hashHex.slice(0, 5);
    const suffix = hashHex.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const text = await res.text();
      if (text.includes(suffix + ":")) {
        return { status: "error", message: "This password has appeared in a public data breach. Please contact an administrator to reset it." };
      }
    }
  } catch {
    // Fail open if the API is unreachable
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { status: "error", message: "We could not verify those credentials." };
  }

  try {
    await rotateBuyerSessionToken({ mode: "bind", reason: "login", userId: data.user.id });
  } catch {
    await supabase.auth.signOut();
    await resetBuyerSessionCookie();
    return { status: "error", message: "Your account was verified, but the buyer session could not be secured. Please try again." };
  }

  redirect(next);
}

export async function signOutAction() {
  const supabase = await createClient();
  let buyerRevocationUnconfirmed = false;
  try {
    await rotateBuyerSessionToken({ mode: "revoke", reason: "signout" });
  } catch {
    buyerRevocationUnconfirmed = true;
    await resetBuyerSessionCookie();
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Sign-out could not be confirmed. Please try again.");
  redirect(buyerRevocationUnconfirmed
    ? "/auth/sign-in?notice=buyer-revocation-unconfirmed"
    : "/auth/sign-in");
}
