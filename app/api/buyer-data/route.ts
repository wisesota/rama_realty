import {
  buyerDataDeletionConfirmation,
  isBuyerDataDeletionResult,
  isBuyerDataExport,
  type BuyerDataExport,
} from "@/lib/buyer-data-rights";
import {
  clearBuyerDeletionAuthorization,
  clearBuyerDeletionChallenge,
  getBuyerDeletionAuthorizationHash,
  issueBuyerDeletionChallenge,
} from "@/lib/buyer-deletion-verification";
import {
  getBuyerSessionTokenHash,
  getOrCreateBuyerSessionTokenHash,
  resetBuyerSessionCookie,
} from "@/lib/buyer-session-server";
import { consumeApiRateLimit, RateLimitBackendUnavailableError } from "@/lib/rate-limit-server";
import { safeInternalPath } from "@/lib/auth/safe-next-path";
import { getSiteUrl } from "@/lib/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedSupabase, isSameOrigin } from "@/lib/supabase/auth";
import { deleteDemoSearchesForBuyer, listDemoSearchesForBuyer } from "@/lib/demo-search-store";

const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

function exportResponse(data: BuyerDataExport) {
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`${JSON.stringify(data, null, 2)}\n`, {
    headers: {
      ...privateHeaders,
      "Content-Disposition": `attachment; filename="rama-buyer-data-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function emptyAnonymousExport(): BuyerDataExport {
  return {
    exportVersion: "rama-buyer-export/1.0",
    generatedAt: new Date().toISOString(),
    ownerType: "anonymous",
    buyerSession: null,
    searchRuns: [],
    searchCandidates: [],
    decisionLedger: [],
    evidenceProvenance: [],
    sessionShortlist: [],
    conversations: [],
    conversationMessages: [],
    toolRuns: [],
    inquiries: [],
    consentEvidence: [],
  };
}

function demoAnonymousExport(tokenHash: string | null): BuyerDataExport {
  const decisionRooms = tokenHash ? listDemoSearchesForBuyer(tokenHash) : [];
  return {
    ...emptyAnonymousExport(),
    buyerSession: tokenHash ? { mode: "ephemeral-demo" } : null,
    searchRuns: decisionRooms,
    searchCandidates: decisionRooms.flatMap((room) => Object.values(room.entities.properties).map((property) => ({ searchRunId: room.searchRunId, property }))),
    decisionLedger: decisionRooms.flatMap((room) => room.schemaVersion === "2" ? room.decisionLedger.events.map((event) => ({ searchRunId: room.searchRunId, ...event })) : []),
    evidenceProvenance: decisionRooms.flatMap((room) => room.schemaVersion === "2" ? room.evidence.assertions.map((assertion) => ({ searchRunId: room.searchRunId, ...assertion })) : []),
    conversations: decisionRooms.map((room) => ({ id: room.conversationId, searchRunId: room.searchRunId })),
  };
}

export async function GET() {
  try {
    if (process.env.RAMA_DEMO_MODE === "true") {
      return exportResponse(demoAnonymousExport(await getBuyerSessionTokenHash()));
    }
    const { supabase, userId } = await getAuthenticatedSupabase();
    if (userId) {
      const { data, error } = await supabase.rpc("export_authenticated_buyer_data", {
        p_user_id: userId,
      });
      if (error || !isBuyerDataExport(data)) {
        return Response.json(
          { error: "Your buyer-data export is temporarily unavailable." },
          { status: 503, headers: privateHeaders },
        );
      }
      return exportResponse(data);
    }

    const tokenHash = await getBuyerSessionTokenHash();
    if (!tokenHash) return exportResponse(emptyAnonymousExport());
    const { data, error } = await createAdminClient().rpc("export_anonymous_buyer_data", {
      p_token_hash: tokenHash,
    });
    if (error || !isBuyerDataExport(data)) {
      return Response.json(
        { error: "This browser-session export is temporarily unavailable." },
        { status: 503, headers: privateHeaders },
      );
    }
    return exportResponse(data);
  } catch {
    return Response.json(
      { error: "Buyer-data export is not configured in this environment." },
      { status: 503, headers: privateHeaders },
    );
  }
}

type DeletionRequest = { confirmation?: unknown };

type DeletionVerificationRequest = { returnPath?: unknown };

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json(
      { error: "Cross-origin verification requests are not allowed." },
      { status: 403, headers: privateHeaders },
    );
  }

  try {
    const rateLimit = await consumeApiRateLimit({
      request,
      scope: "buyer-deletion-verification",
      maximumRequests: 3,
      windowMs: 60 * 60 * 1_000,
    });
    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Too many verification emails were requested. Try again after the rate-limit window." },
        { status: 429, headers: { ...privateHeaders, "Retry-After": "3600" } },
      );
    }

    const { supabase, userId } = await getAuthenticatedSupabase();
    if (!userId) {
      return Response.json(
        { error: "Sign in before requesting account-deletion verification." },
        { status: 401, headers: privateHeaders },
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const email = userData.user?.id === userId ? userData.user.email : null;
    if (userError || !email) {
      return Response.json(
        { error: "Rama could not verify the email attached to this account." },
        { status: 401, headers: privateHeaders },
      );
    }

    let body: DeletionVerificationRequest = {};
    try {
      body = (await request.json()) as DeletionVerificationRequest;
    } catch {
      // The default safe return path is sufficient when no JSON body is sent.
    }
    const returnPath = safeInternalPath(
      typeof body.returnPath === "string" ? body.returnPath : null,
      "/#saved-decisions",
    );
    const challengeHash = await issueBuyerDeletionChallenge();
    const { error: challengeError } = await createAdminClient().rpc("create_buyer_deletion_challenge", {
      p_user_id: userId,
      p_challenge_hash: challengeHash,
    });
    if (challengeError) {
      await clearBuyerDeletionChallenge();
      return Response.json(
        { error: "Deletion verification is temporarily unavailable." },
        { status: 503, headers: privateHeaders },
      );
    }

    const callback = new URL("/auth/callback", getSiteUrl());
    callback.searchParams.set("purpose", "buyer-deletion");
    callback.searchParams.set("next", returnPath);
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: callback.toString(),
      },
    });
    if (emailError) {
      await clearBuyerDeletionChallenge();
      return Response.json(
        { error: "Rama could not send the deletion verification email." },
        { status: 503, headers: privateHeaders },
      );
    }

    return Response.json(
      { verificationSent: true },
      { status: 202, headers: privateHeaders },
    );
  } catch (error) {
    const message = error instanceof RateLimitBackendUnavailableError
      ? "Deletion verification is unavailable until the shared rate limiter is configured."
      : "Deletion verification is not configured in this environment.";
    return Response.json({ error: message }, { status: 503, headers: privateHeaders });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json(
      { error: "Cross-origin deletion requests are not allowed." },
      { status: 403, headers: privateHeaders },
    );
  }

  let body: DeletionRequest;
  try {
    body = (await request.json()) as DeletionRequest;
  } catch {
    return Response.json(
      { error: "The deletion request must be valid JSON." },
      { status: 400, headers: privateHeaders },
    );
  }
  if (body.confirmation !== buyerDataDeletionConfirmation) {
    return Response.json(
      { error: `Type ${buyerDataDeletionConfirmation} exactly to continue.` },
      { status: 400, headers: privateHeaders },
    );
  }

  try {
    if (process.env.RAMA_DEMO_MODE === "true") {
      const tokenHash = await getBuyerSessionTokenHash();
      const deletedSearchRuns = tokenHash ? deleteDemoSearchesForBuyer(tokenHash) : 0;
      await resetBuyerSessionCookie();
      return Response.json({
        requestId: crypto.randomUUID(),
        applicationDataDeleted: true,
        authUserDeletionRequired: false,
        authUserDeleted: false,
        processorDeletionQueued: false,
        deleted: { searchRuns: deletedSearchRuns },
        externalDeletionRequired: [],
        retainedExceptions: [],
      }, { headers: privateHeaders });
    }
    const { supabase, userId } = await getAuthenticatedSupabase();
    if (userId) {
      const authorizationHash = await getBuyerDeletionAuthorizationHash();
      if (!authorizationHash) {
        return Response.json(
          { error: "Verify this deletion from the email attached to your account, then retry within ten minutes." },
          { status: 401, headers: privateHeaders },
        );
      }
      const { data, error } = await supabase.rpc("delete_authenticated_buyer_data", {
        p_user_id: userId,
        p_confirmation: buyerDataDeletionConfirmation,
        p_authorization_hash: authorizationHash,
      });
      if (error) {
        const status = error.code === "55000" ? 409 : error.code === "42501" ? 401 : 503;
        const message = error.code === "55000"
          ? "Staff accounts require an administrator-reviewed deletion workflow."
          : error.code === "42501"
            ? "Verify this deletion from the email attached to your account, then retry within ten minutes."
            : "Your buyer data could not be deleted atomically.";
        return Response.json({ error: message }, { status, headers: privateHeaders });
      }
      if (!isBuyerDataDeletionResult(data)) {
        return Response.json(
          { error: "The deletion result could not be verified." },
          { status: 503, headers: privateHeaders },
        );
      }
      await clearBuyerDeletionAuthorization();

      await resetBuyerSessionCookie();
      const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
      if (signOutError) {
        return Response.json(
          {
            error: "Your application data was deleted, but Rama could not revoke every login session. Contact privacy support with the request ID.",
            requestId: data.requestId,
            applicationDataDeleted: true,
          },
          { status: 503, headers: privateHeaders },
        );
      }

      const { error: authDeletionError } = await createAdminClient().auth.admin.deleteUser(userId, false);
      if (authDeletionError) {
        return Response.json(
          {
            error: "Your application data and login sessions were deleted, but the account record needs administrator follow-up.",
            requestId: data.requestId,
            applicationDataDeleted: true,
          },
          { status: 503, headers: privateHeaders },
        );
      }

      return Response.json(
        {
          ...data,
          authUserDeleted: true,
          processorDeletionQueued: data.externalDeletionRequired.length > 0,
        },
        {
          status: data.externalDeletionRequired.length > 0 ? 202 : 200,
          headers: privateHeaders,
        },
      );
    }

    const tokenHash = await getOrCreateBuyerSessionTokenHash();
    const { data, error } = await createAdminClient().rpc("delete_anonymous_buyer_data", {
      p_token_hash: tokenHash,
      p_confirmation: buyerDataDeletionConfirmation,
    });
    if (error || !isBuyerDataDeletionResult(data)) {
      return Response.json(
        { error: "This browser session could not be deleted atomically." },
        { status: 503, headers: privateHeaders },
      );
    }
    await resetBuyerSessionCookie();
    return Response.json(
      {
        ...data,
        authUserDeleted: false,
        processorDeletionQueued: data.externalDeletionRequired.length > 0,
      },
      {
        status: data.externalDeletionRequired.length > 0 ? 202 : 200,
        headers: privateHeaders,
      },
    );
  } catch {
    return Response.json(
      { error: "Buyer-data deletion is not configured in this environment." },
      { status: 503, headers: privateHeaders },
    );
  }
}
