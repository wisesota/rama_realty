import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  profileDisplayName,
  safeExternalAvatarUrl,
  type SupportedLocale,
  type SupportedTimezone,
} from "@/lib/dashboard/profile";

export const staffRoles = [
  "owner",
  "admin",
  "inventory_manager",
  "editor",
  "agent",
  "analyst",
  "viewer",
] as const;

export type StaffRole = (typeof staffRoles)[number];

export type StaffContext = {
  userId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: StaffRole;
  fullName: string;
  avatarUrl: string | null;
  avatarPath: string | null;
  timezone: SupportedTimezone;
  locale: SupportedLocale;
};

export const getVerifiedUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  return {
    supabase,
    userId: error || typeof userId !== "string" || !userId ? null : userId,
    email: typeof data?.claims?.email === "string" ? data.claims.email : null,
  };
});

export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  const { supabase, userId, email } = await getVerifiedUser();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("organization_memberships")
    .select("organization_id, role, status, organizations!inner(id, name, slug)")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) throw new Error("The staff workspace membership could not be loaded.");
  if (!data) return null;
  const organization = Array.isArray(data.organizations)
    ? data.organizations[0]
    : data.organizations;
  if (!organization || !staffRoles.includes(data.role as StaffRole)) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, avatar_path, timezone, locale")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw new Error("The staff profile could not be loaded.");

  let avatarUrl = safeExternalAvatarUrl(profile?.avatar_url ?? null);
  if (profile?.avatar_path?.startsWith(`${userId}/`)) {
    const { data: signedAvatar } = await supabase.storage
      .from("staff-avatars")
      .createSignedUrl(profile.avatar_path, 15 * 60);
    avatarUrl = signedAvatar?.signedUrl ?? avatarUrl;
  }

  return {
    userId,
    organizationId: data.organization_id,
    organizationName: organization.name,
    organizationSlug: organization.slug,
    role: data.role as StaffRole,
    fullName: profileDisplayName(profile?.full_name ?? null, email),
    avatarUrl,
    avatarPath: profile?.avatar_path ?? null,
    timezone: (profile?.timezone ?? "Asia/Dubai") as SupportedTimezone,
    locale: (profile?.locale ?? "en") as SupportedLocale,
  };
});

export async function requireVerifiedUser() {
  const user = await getVerifiedUser();
  if (!user.userId) redirect("/auth/sign-in?next=/dashboard");
  return { ...user, userId: user.userId };
}

export async function requireStaffContext(allowedRoles?: readonly StaffRole[]) {
  const user = await requireVerifiedUser();
  const staff = await getStaffContext();
  if (!staff) redirect("/dashboard/onboarding");
  if (allowedRoles && !allowedRoles.includes(staff.role)) {
    redirect("/dashboard?notice=insufficient-role");
  }
  return { ...user, staff };
}
