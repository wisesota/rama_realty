import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  getBuyerDeletionChallengeHash: vi.fn(),
  issueBuyerDeletionAuthorization: vi.fn(),
  clearBuyerDeletionChallenge: vi.fn(),
  clearBuyerDeletionAuthorization: vi.fn(),
  rotateBuyerSessionToken: vi.fn(),
  resetBuyerSessionCookie: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/buyer-deletion-verification", () => ({
  getBuyerDeletionChallengeHash: mocks.getBuyerDeletionChallengeHash,
  issueBuyerDeletionAuthorization: mocks.issueBuyerDeletionAuthorization,
  clearBuyerDeletionChallenge: mocks.clearBuyerDeletionChallenge,
  clearBuyerDeletionAuthorization: mocks.clearBuyerDeletionAuthorization,
}));
vi.mock("@/lib/buyer-session-server", () => ({
  rotateBuyerSessionToken: mocks.rotateBuyerSessionToken,
  resetBuyerSessionCookie: mocks.resetBuyerSessionCookie,
}));

import { GET } from "@/app/auth/callback/route";

function callbackRequest() {
  return new Request(
    "https://rama.example/auth/callback?code=otp-code&purpose=buyer-deletion&next=%2Fen%2Fdiscover%2Frun-1%23saved-decisions",
  );
}

describe("buyer deletion verification callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBuyerDeletionChallengeHash.mockResolvedValue("c".repeat(64));
    mocks.issueBuyerDeletionAuthorization.mockResolvedValue("a".repeat(64));
    mocks.rotateBuyerSessionToken.mockResolvedValue(undefined);
  });

  it("binds a one-time authorization to the OTP-created user and auth session", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      data: {
        user: { id: "buyer-1" },
        session: { access_token: "access-token" },
      },
      error: null,
    });
    const getClaims = vi.fn().mockResolvedValue({
      data: { claims: { session_id: "11111111-1111-4111-8111-111111111111" } },
      error: null,
    });
    const signOut = vi.fn();
    mocks.createClient.mockResolvedValue({ auth: { exchangeCodeForSession, getClaims, signOut } });
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    mocks.createAdminClient.mockReturnValue({ rpc });

    const response = await GET(callbackRequest());
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://rama.example/en/discover/run-1?deletion=verified#saved-decisions",
    );
    expect(rpc).toHaveBeenCalledWith("complete_buyer_deletion_challenge", {
      p_user_id: "buyer-1",
      p_challenge_hash: "c".repeat(64),
      p_session_id: "11111111-1111-4111-8111-111111111111",
      p_authorization_hash: "a".repeat(64),
    });
    expect(mocks.rotateBuyerSessionToken).toHaveBeenCalledWith({
      mode: "bind",
      reason: "auth_callback",
      userId: "buyer-1",
    });
    expect(signOut).not.toHaveBeenCalled();
  });

  it("does not authorize deletion when the initiating-browser challenge is absent", async () => {
    mocks.getBuyerDeletionChallengeHash.mockResolvedValue(null);
    const signOut = vi.fn().mockResolvedValue({ error: null });
    mocks.createClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({
          data: { user: { id: "buyer-1" }, session: { access_token: "access-token" } },
          error: null,
        }),
        getClaims: vi.fn().mockResolvedValue({ data: { claims: {} }, error: null }),
        signOut,
      },
    });

    const response = await GET(callbackRequest());
    expect(response.headers.get("location")).toContain("deletion=verification-error");
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    expect(mocks.clearBuyerDeletionAuthorization).toHaveBeenCalled();
    expect(signOut).toHaveBeenCalled();
  });

  it("accepts only the native saved-brief email-link purpose", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({
      data: { user: { id: "buyer-1" }, session: { access_token: "access-token" } },
      error: null,
    });
    mocks.createClient.mockResolvedValue({
      auth: { exchangeCodeForSession, signOut: vi.fn() },
    });

    const response = await GET(new Request(
      "https://rama.example/auth/callback?code=otp-code&purpose=saved-brief&next=%2Fen%23saved-decisions",
    ));

    expect(response.headers.get("location")).toBe("https://rama.example/en#saved-decisions");
    expect(exchangeCodeForSession).toHaveBeenCalledWith("otp-code");
    expect(mocks.rotateBuyerSessionToken).toHaveBeenCalledWith({
      mode: "bind",
      reason: "auth_callback",
      userId: "buyer-1",
    });
  });

  it("rejects an unscoped or provider-style callback before exchanging a session", async () => {
    const response = await GET(new Request(
      "https://rama.example/auth/callback?code=provider-code&next=%2Fdashboard",
    ));

    expect(response.headers.get("location")).toBe("https://rama.example/?auth=error#current-brief");
    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.rotateBuyerSessionToken).not.toHaveBeenCalled();
  });
});
