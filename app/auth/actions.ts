"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/auth/safe-next-path";
import {
  type ActionState,
  readText,
} from "@/lib/dashboard/validation";

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
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { status: "error", message: "We could not verify those credentials." };
  }

  redirect(next);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
