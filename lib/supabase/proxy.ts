import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { getPublicSupabaseEnvironment } from "@/lib/supabase/env";

export async function refreshSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getPublicSupabaseEnvironment();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getClaims validates the JWT; getSession must not be trusted at this boundary.
  await supabase.auth.getClaims();
  return response;
}
