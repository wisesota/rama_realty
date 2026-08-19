import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getPublicSupabaseEnvironment } from "@/lib/supabase/env";

let adminClient: ReturnType<typeof createSupabaseClient<Database>> | undefined;

export function createAdminClient() {
  if (adminClient) return adminClient;

  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not configured.");
  }

  const { url } = getPublicSupabaseEnvironment();
  adminClient = createSupabaseClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
