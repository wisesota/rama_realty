import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("native Supabase authentication boundary", () => {
  it("keeps staff access on email and password without a social-provider flow", () => {
    const action = read("app/auth/actions.ts");
    const form = read("components/auth/sign-in-form.tsx");

    expect(action).toContain("signInWithPassword");
    expect(action).not.toContain("signInWithOAuth");
    expect(form).toContain('type="email"');
    expect(form).toContain('type="password"');
    expect(form).not.toMatch(/google|oauth/i);
  });

  it("scopes native email-link callbacks and removes OAuth-specific rotation vocabulary", () => {
    const callback = read("app/auth/callback/route.ts");
    const savedBrief = read("components/saved-brief-control.tsx");
    const rotation = read("lib/buyer-session-server.ts");
    const migration = read("supabase/migrations/20260823095703_native_supabase_auth_only.sql");

    expect(savedBrief).toContain('callback.searchParams.set("purpose", "saved-brief")');
    expect(callback).toContain('purpose === "saved-brief" || purpose === "buyer-deletion"');
    expect(callback).toContain('reason: "auth_callback"');
    expect(rotation).not.toContain('"oauth"');
    expect(migration).toContain("where reason = 'oauth'");
    expect(migration).toContain("'auth_callback'");
  });
});
