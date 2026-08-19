import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/auth/safe-next-path";
import { resetBuyerSessionCookie, rotateBuyerSessionToken } from "@/lib/buyer-session-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"), "/#current-brief");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      try {
        await rotateBuyerSessionToken({ mode: "bind", reason: "oauth", userId: data.user.id });
        return NextResponse.redirect(new URL(next, url.origin));
      } catch {
        await supabase.auth.signOut();
        await resetBuyerSessionCookie();
      }
    }
  }

  return NextResponse.redirect(new URL("/?auth=error#current-brief", url.origin));
}
