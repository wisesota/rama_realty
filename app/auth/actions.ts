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
