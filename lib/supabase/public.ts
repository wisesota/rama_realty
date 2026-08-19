import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getPublicSupabaseEnvironment } from "@/lib/supabase/env";

let publicCatalogClient: ReturnType<typeof createSupabaseClient<Database>> | undefined;

/**
 * A cookieless, anonymous client for buyer-facing reads. Public catalog behavior
 * must not change when the request also carries a staff Supabase session.
 */
export function createPublicCatalogClient() {
  if (publicCatalogClient) return publicCatalogClient;
  const { url, publishableKey } = getPublicSupabaseEnvironment();
  publicCatalogClient = createSupabaseClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  return publicCatalogClient;
}
