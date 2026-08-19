"use server";

import { refresh, revalidatePath } from "next/cache";
import { requireStaffContext } from "@/lib/dashboard/dal";
import {
  supportedLocales,
  supportedTimezones,
} from "@/lib/dashboard/profile";
import {
  type ActionState,
  readText,
} from "@/lib/dashboard/validation";
import {
  avatarExtension,
  isAllowedAvatarType,
  maximumAvatarBytes,
} from "@/lib/dashboard/avatar";
import { resetBuyerSessionCookie, rotateBuyerSessionToken } from "@/lib/buyer-session-server";

function refreshDashboardProfile() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  refresh();
}

export async function updateProfileAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, userId } = await requireStaffContext();
  const fullName = readText(formData, "fullName", 120);
  const timezone = readText(formData, "timezone", 80);
  const locale = readText(formData, "locale", 10);

  const fieldErrors: Record<string, string> = {};
  if (fullName.length < 2) fieldErrors.fullName = "Enter your full name.";
  if (!(supportedTimezones as readonly string[]).includes(timezone)) {
    fieldErrors.timezone = "Choose a supported timezone.";
  }
  if (!(supportedLocales as readonly string[]).includes(locale)) {
    fieldErrors.locale = "Choose a supported language.";
  }
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Review the highlighted profile fields.", fieldErrors };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, timezone, locale })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return { status: "error", message: "Your profile could not be updated." };
  }

  refreshDashboardProfile();
  return { status: "success", message: "Profile preferences saved." };
}

export async function uploadAvatarAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, userId } = await requireStaffContext();
  const avatar = formData.get("avatar");
  if (!(avatar instanceof File) || avatar.size === 0) {
    return { status: "error", message: "Choose a JPG, PNG, or WebP image." };
  }

  if (!isAllowedAvatarType(avatar.type)) {
    return { status: "error", message: "Use a JPG, PNG, or WebP image." };
  }
  if (avatar.size > maximumAvatarBytes) {
    return { status: "error", message: "Avatar images must be 2 MB or smaller." };
  }

  const fileBytes = new Uint8Array(await avatar.arrayBuffer());
  const extension = avatarExtension(avatar.type, fileBytes);
  if (!extension) {
    return { status: "error", message: "The selected file does not contain a valid JPG, PNG, or WebP image." };
  }

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", userId)
    .maybeSingle();
  if (profileReadError || !profile) {
    return { status: "error", message: "Your staff profile could not be loaded. Refresh and sign in again." };
  }
  const nextPath = `${userId}/avatar-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("staff-avatars")
    .upload(nextPath, fileBytes, { cacheControl: "3600", contentType: avatar.type, upsert: false });

  if (uploadError) {
    console.error("Avatar upload failed:", uploadError.name, uploadError.statusCode);
    return { status: "error", message: "The image could not be uploaded. Refresh your session and try again." };
  }

  const { data: updatedProfile, error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_path: nextPath })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (profileError || !updatedProfile) {
    await supabase.storage.from("staff-avatars").remove([nextPath]);
    return { status: "error", message: "The image uploaded, but your profile could not be updated." };
  }

  if (profile?.avatar_path?.startsWith(`${userId}/`) && profile.avatar_path !== nextPath) {
    const { error: removeError } = await supabase.storage.from("staff-avatars").remove([profile.avatar_path]);
    if (removeError) console.error("Old avatar removal failed:", removeError);
  }

  refreshDashboardProfile();
  return { status: "success", message: "Profile photo updated." };
}

export async function removeAvatarAction(
  _previous: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  void _previous;
  void _formData;
  const { supabase, userId } = await requireStaffContext();
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", userId)
    .eq("avatar_path", (profile?.avatar_path ?? "") as string);
  if (error) return { status: "error", message: "The profile photo could not be removed." };

  if (profile?.avatar_path?.startsWith(`${userId}/`)) {
    const { error: removeError } = await supabase.storage.from("staff-avatars").remove([profile.avatar_path]);
    if (removeError) return { status: "error", message: "The profile photo could not be removed from storage." };
  }

  refreshDashboardProfile();
  return { status: "success", message: "Profile photo removed." };
}

export async function updatePasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { supabase, userId } = await requireStaffContext();
  const password = readText(formData, "password", 200);
  const confirmation = readText(formData, "confirmation", 200);
  const fieldErrors: Record<string, string> = {};
  if (password.length < 12) fieldErrors.password = "Use at least 12 characters.";
  if (confirmation !== password) fieldErrors.confirmation = "Passwords do not match.";
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Review the password requirements.", fieldErrors };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { status: "error", message: "Supabase could not update this password. Reauthenticate and try again." };
  }
  try {
    await rotateBuyerSessionToken({ mode: "bind", reason: "password_change", userId });
  } catch {
    await supabase.auth.signOut();
    await resetBuyerSessionCookie();
    return { status: "error", message: "Password updated, but the buyer session could not be secured. Sign in again." };
  }
  return { status: "success", message: "Password updated." };
}
