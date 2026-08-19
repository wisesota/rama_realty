"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getPublicSupabaseEnvironment } from "@/lib/supabase/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (browserClient) return browserClient;
  const { url, publishableKey } = getPublicSupabaseEnvironment();
  browserClient = createBrowserClient<Database>(url, publishableKey);
  return browserClient;
}
