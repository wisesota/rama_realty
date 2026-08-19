import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedSupabase() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || typeof userId !== "string" || !userId) {
    return { supabase, userId: null };
  }

  return { supabase, userId };
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return process.env.NODE_ENV !== "production";

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
