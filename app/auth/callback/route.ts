import { NextResponse } from "next/server";
import {
  clearBuyerDeletionAuthorization,
  clearBuyerDeletionChallenge,
  getBuyerDeletionChallengeHash,
  issueBuyerDeletionAuthorization,
} from "@/lib/buyer-deletion-verification";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeInternalPath } from "@/lib/auth/safe-next-path";
import { resetBuyerSessionCookie, rotateBuyerSessionToken } from "@/lib/buyer-session-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"), "/#current-brief");
  const purpose = url.searchParams.get("purpose");

  if (code && (purpose === "saved-brief" || purpose === "buyer-deletion")) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      if (purpose === "buyer-deletion" && data.session) {
        const challengeHash = await getBuyerDeletionChallengeHash();
        const { data: claimsData } = await supabase.auth.getClaims(data.session.access_token);
        const sessionId = claimsData?.claims?.session_id;
        if (challengeHash && typeof sessionId === "string") {
          const authorizationHash = await issueBuyerDeletionAuthorization();
          const { data: completed, error: completionError } = await createAdminClient().rpc(
            "complete_buyer_deletion_challenge",
            {
              p_user_id: data.user.id,
              p_challenge_hash: challengeHash,
              p_session_id: sessionId,
              p_authorization_hash: authorizationHash,
            },
          );
          if (!completionError && completed === true) {
            await clearBuyerDeletionChallenge();
            try {
              await rotateBuyerSessionToken({ mode: "bind", reason: "auth_callback", userId: data.user.id });
              const verified = new URL(next, url.origin);
              verified.searchParams.set("deletion", "verified");
              return NextResponse.redirect(verified);
            } catch {
              await clearBuyerDeletionAuthorization();
            }
          } else {
            await clearBuyerDeletionAuthorization();
          }
        }

        await clearBuyerDeletionChallenge();
        await clearBuyerDeletionAuthorization();
        await supabase.auth.signOut();
        const failed = new URL(next, url.origin);
        failed.searchParams.set("deletion", "verification-error");
        return NextResponse.redirect(failed);
      }

      try {
        await rotateBuyerSessionToken({ mode: "bind", reason: "auth_callback", userId: data.user.id });
        return NextResponse.redirect(new URL(next, url.origin));
      } catch {
        await supabase.auth.signOut();
        await resetBuyerSessionCookie();
      }
    }
  }

  return NextResponse.redirect(new URL("/?auth=error#current-brief", url.origin));
}
