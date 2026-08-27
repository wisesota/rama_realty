import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedSupabase: vi.fn(),
  isSameOrigin: vi.fn(() => true),
  getBuyerSessionTokenHash: vi.fn(),
  getOrCreateBuyerSessionTokenHash: vi.fn(),
  resetBuyerSessionCookie: vi.fn(),
  createAdminClient: vi.fn(),
  consumeApiRateLimit: vi.fn(),
  issueBuyerDeletionChallenge: vi.fn(),
  clearBuyerDeletionChallenge: vi.fn(),
  getBuyerDeletionAuthorizationHash: vi.fn(),
  clearBuyerDeletionAuthorization: vi.fn(),
  listDemoSearchesForBuyer: vi.fn(),
  deleteDemoSearchesForBuyer: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({
  getAuthenticatedSupabase: mocks.getAuthenticatedSupabase,
  isSameOrigin: mocks.isSameOrigin,
}));
vi.mock("@/lib/buyer-session-server", () => ({
  getBuyerSessionTokenHash: mocks.getBuyerSessionTokenHash,
  getOrCreateBuyerSessionTokenHash: mocks.getOrCreateBuyerSessionTokenHash,
  resetBuyerSessionCookie: mocks.resetBuyerSessionCookie,
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/rate-limit-server", () => ({
  consumeApiRateLimit: mocks.consumeApiRateLimit,
  RateLimitBackendUnavailableError: class RateLimitBackendUnavailableError extends Error {},
}));
vi.mock("@/lib/buyer-deletion-verification", () => ({
  issueBuyerDeletionChallenge: mocks.issueBuyerDeletionChallenge,
  clearBuyerDeletionChallenge: mocks.clearBuyerDeletionChallenge,
  getBuyerDeletionAuthorizationHash: mocks.getBuyerDeletionAuthorizationHash,
  clearBuyerDeletionAuthorization: mocks.clearBuyerDeletionAuthorization,
}));
vi.mock("@/lib/site-url", () => ({ getSiteUrl: () => "https://rama.example" }));
vi.mock("@/lib/demo-search-store", () => ({
  listDemoSearchesForBuyer: mocks.listDemoSearchesForBuyer,
  deleteDemoSearchesForBuyer: mocks.deleteDemoSearchesForBuyer,
}));

import { DELETE, GET, POST } from "@/app/api/buyer-data/route";

const deletionResult = {
  requestId: "request-1",
  applicationDataDeleted: true,
  authUserDeletionRequired: true,
  deleted: { savedBriefs: 1 },
  externalDeletionRequired: [],
  retainedExceptions: [{
    category: "privacy_request_audit",
    count: 1,
    reason: "Pseudonymized proof.",
    expiresAt: "2028-08-22T12:00:00.000Z",
  }],
};

function deletionRequest(confirmation = "DELETE MY RAMA DATA") {
  return new Request("https://rama.example/api/buyer-data", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Origin: "https://rama.example", Host: "rama.example" },
    body: JSON.stringify({ confirmation }),
  });
}

function verificationRequest() {
  return new Request("https://rama.example/api/buyer-data", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://rama.example", Host: "rama.example" },
    body: JSON.stringify({ returnPath: "/en/discover/run-1#saved-decisions" }),
  });
}

describe("buyer data route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isSameOrigin.mockReturnValue(true);
    mocks.resetBuyerSessionCookie.mockResolvedValue(undefined);
    mocks.consumeApiRateLimit.mockResolvedValue({ allowed: true });
    mocks.issueBuyerDeletionChallenge.mockResolvedValue("c".repeat(64));
    mocks.getBuyerDeletionAuthorizationHash.mockResolvedValue("d".repeat(64));
    mocks.listDemoSearchesForBuyer.mockReturnValue([]);
    mocks.deleteDemoSearchesForBuyer.mockReturnValue(0);
    vi.stubEnv("RAMA_DEMO_MODE", "false");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("sends a purpose-bound deletion link only to the current verified account email", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "2026-08-22T12:10:00.000Z", error: null });
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "buyer-1", email: "buyer@example.com" } },
      error: null,
    });
    const signInWithOtp = vi.fn().mockResolvedValue({ error: null });
    mocks.getAuthenticatedSupabase.mockResolvedValue({
      supabase: { auth: { getUser, signInWithOtp } },
      userId: "buyer-1",
    });
    mocks.createAdminClient.mockReturnValue({ rpc });

    const response = await POST(verificationRequest());
    expect(response.status).toBe(202);
    expect(rpc).toHaveBeenCalledWith("create_buyer_deletion_challenge", {
      p_user_id: "buyer-1",
      p_challenge_hash: "c".repeat(64),
    });
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "buyer@example.com",
      options: expect.objectContaining({
        shouldCreateUser: false,
        emailRedirectTo: expect.stringContaining("purpose=buyer-deletion"),
      }),
    });
  });

  it("exports only the verified authenticated owner's versioned record", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        exportVersion: "rama-buyer-export/1.0",
        generatedAt: "2026-08-22T12:00:00.000Z",
        ownerType: "authenticated",
        savedBriefs: [],
      },
      error: null,
    });
    mocks.getAuthenticatedSupabase.mockResolvedValue({ supabase: { rpc }, userId: "buyer-1" });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("export_authenticated_buyer_data", { p_user_id: "buyer-1" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-disposition")).toContain("rama-buyer-data-");
    await expect(response.json()).resolves.toMatchObject({ ownerType: "authenticated" });
  });

  it("returns an empty current-session export without creating an identity cookie", async () => {
    mocks.getAuthenticatedSupabase.mockResolvedValue({ supabase: {}, userId: null });
    mocks.getBuyerSessionTokenHash.mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(200);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({ ownerType: "anonymous", searchRuns: [] });
  });

  it("exports buyer-bound in-memory Decision Rooms in demo mode without hosted Supabase", async () => {
    vi.stubEnv("RAMA_DEMO_MODE", "true");
    mocks.getBuyerSessionTokenHash.mockResolvedValue("demo-buyer-hash");
    mocks.listDemoSearchesForBuyer.mockReturnValue([{
      schemaVersion: "1",
      searchRunId: "search-1",
      conversationId: "conversation-1",
      entities: { properties: {} },
    }]);

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ownerType: "anonymous",
      buyerSession: { mode: "ephemeral-demo" },
      searchRuns: [{ searchRunId: "search-1" }],
    });
    expect(mocks.listDemoSearchesForBuyer).toHaveBeenCalledWith("demo-buyer-hash");
    expect(mocks.getAuthenticatedSupabase).not.toHaveBeenCalled();
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("deletes only the current buyer's in-memory demo searches", async () => {
    vi.stubEnv("RAMA_DEMO_MODE", "true");
    mocks.getBuyerSessionTokenHash.mockResolvedValue("demo-buyer-hash");
    mocks.deleteDemoSearchesForBuyer.mockReturnValue(2);

    const response = await DELETE(deletionRequest());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      applicationDataDeleted: true,
      deleted: { searchRuns: 2 },
      externalDeletionRequired: [],
    });
    expect(mocks.deleteDemoSearchesForBuyer).toHaveBeenCalledWith("demo-buyer-hash");
    expect(mocks.resetBuyerSessionCookie).toHaveBeenCalledOnce();
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects cross-origin and mistyped deletion requests before touching storage", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    expect((await DELETE(deletionRequest())).status).toBe(403);
    mocks.isSameOrigin.mockReturnValue(true);
    expect((await DELETE(deletionRequest("DELETE"))).status).toBe(400);
    expect(mocks.getAuthenticatedSupabase).not.toHaveBeenCalled();
  });

  it("atomically erases authenticated app data, revokes sessions, then deletes the auth user", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: deletionResult, error: null });
    const signOut = vi.fn().mockResolvedValue({ error: null });
    const deleteUser = vi.fn().mockResolvedValue({ error: null });
    mocks.getAuthenticatedSupabase.mockResolvedValue({
      supabase: { rpc, auth: { signOut } },
      userId: "buyer-1",
    });
    mocks.createAdminClient.mockReturnValue({ auth: { admin: { deleteUser } } });

    const response = await DELETE(deletionRequest());
    expect(response.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("delete_authenticated_buyer_data", {
      p_user_id: "buyer-1",
      p_confirmation: "DELETE MY RAMA DATA",
      p_authorization_hash: "d".repeat(64),
    });
    expect(mocks.clearBuyerDeletionAuthorization).toHaveBeenCalledOnce();
    expect(mocks.resetBuyerSessionCookie).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(deleteUser).toHaveBeenCalledWith("buyer-1", false);
    await expect(response.json()).resolves.toMatchObject({ authUserDeleted: true, applicationDataDeleted: true });
  });

  it("refuses authenticated deletion without a consumed email step-up proof", async () => {
    mocks.getBuyerDeletionAuthorizationHash.mockResolvedValue(null);
    const rpc = vi.fn();
    mocks.getAuthenticatedSupabase.mockResolvedValue({ supabase: { rpc }, userId: "buyer-1" });

    const response = await DELETE(deletionRequest());
    expect(response.status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("routes anonymous deletion through the service-only token proof and reports processor follow-up", async () => {
    mocks.getAuthenticatedSupabase.mockResolvedValue({ supabase: {}, userId: null });
    mocks.getOrCreateBuyerSessionTokenHash.mockResolvedValue("a".repeat(64));
    const rpc = vi.fn().mockResolvedValue({
      data: { ...deletionResult, authUserDeletionRequired: false, externalDeletionRequired: ["licensed-crm"] },
      error: null,
    });
    mocks.createAdminClient.mockReturnValue({ rpc });

    const response = await DELETE(deletionRequest());
    expect(response.status).toBe(202);
    expect(rpc).toHaveBeenCalledWith("delete_anonymous_buyer_data", {
      p_token_hash: "a".repeat(64),
      p_confirmation: "DELETE MY RAMA DATA",
    });
    await expect(response.json()).resolves.toMatchObject({
      authUserDeleted: false,
      processorDeletionQueued: true,
      externalDeletionRequired: ["licensed-crm"],
    });
  });

  it("keeps staff-account deletion behind administrator review", async () => {
    mocks.getAuthenticatedSupabase.mockResolvedValue({
      supabase: { rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "55000" } }) },
      userId: "staff-1",
    });

    const response = await DELETE(deletionRequest());
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Staff accounts require an administrator-reviewed deletion workflow.",
    });
    expect(mocks.resetBuyerSessionCookie).not.toHaveBeenCalled();
  });
});
