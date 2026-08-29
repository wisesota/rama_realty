import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieValue: "A".repeat(43),
  setCookie: vi.fn(),
  rpc: vi.fn(),
  fallbackUpdate: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => ({ value: mocks.cookieValue }),
    set: mocks.setCookie,
  })),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: mocks.rpc,
    from: () => ({
      update: () => ({ eq: () => ({ is: mocks.fallbackUpdate }) }),
    }),
  }),
}));

import { createBuyerSessionTokenRotation, hashBuyerSessionToken, rotateBuyerSessionToken } from "@/lib/buyer-session-server";

beforeEach(() => {
  vi.stubEnv("BUYER_SESSION_SECRET", "buyer-session-test-secret-that-is-at-least-32-characters");
  mocks.setCookie.mockReset();
  mocks.rpc.mockReset();
  mocks.fallbackUpdate.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("buyer-session token rotation", () => {
  it("refuses a missing signing secret in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BUYER_SESSION_SECRET", "");

    expect(() => hashBuyerSessionToken(mocks.cookieValue))
      .toThrow("BUYER_SESSION_SECRET must be configured");
  });

  it("refuses an undersized signing secret in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("BUYER_SESSION_SECRET", "too-short");

    expect(() => hashBuyerSessionToken(mocks.cookieValue))
      .toThrow("BUYER_SESSION_SECRET must be configured");
  });

  it("derives the same retry-safe handoff token from the same cookie and idempotency key", async () => {
    const first = await createBuyerSessionTokenRotation("handoff:idempotency-key");
    const retry = await createBuyerSessionTokenRotation("handoff:idempotency-key");
    expect(first.nextToken).toBe(retry.nextToken);
    expect(first.nextToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("sets the replacement cookie only after the atomic RPC succeeds", async () => {
    mocks.rpc.mockResolvedValue({ data: { preserved: true }, error: null });

    await rotateBuyerSessionToken({ mode: "bind", reason: "login", userId: "user-1" });

    expect(mocks.rpc).toHaveBeenCalledWith("rotate_buyer_session", expect.objectContaining({
      p_current_token_hash: hashBuyerSessionToken(mocks.cookieValue),
      p_mode: "bind",
      p_reason: "login",
      p_user_id: "user-1",
    }));
    expect(mocks.setCookie).toHaveBeenCalledOnce();
    expect(mocks.rpc.mock.invocationCallOrder[0]).toBeLessThan(mocks.setCookie.mock.invocationCallOrder[0]);
  });

  it("keeps the current browser cookie when the database rotation fails", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "42501" } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(rotateBuyerSessionToken({ mode: "bind", reason: "auth_callback", userId: "user-1" }))
      .rejects.toThrow("The buyer session could not be secured.");

    expect(mocks.setCookie).not.toHaveBeenCalled();
  });

  it("revokes the active hash directly when the rotation RPC is unavailable during sign-out", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
    mocks.fallbackUpdate.mockResolvedValue({ error: null });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await rotateBuyerSessionToken({ mode: "revoke", reason: "signout" });

    expect(mocks.fallbackUpdate).toHaveBeenCalledOnce();
    expect(mocks.setCookie).toHaveBeenCalledOnce();
  });
});
