import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("scripts/verify-supabase-identities.mjs", "utf8");

describe("hosted Supabase identity verifier", () => {
  it("uses two password-authenticated clients and proves both read and insert isolation", () => {
    expect(source.match(/signInWithPassword/g)).toHaveLength(1);
    expect(source).toContain("if (userAId === userBId)");
    expect(source).toContain("assertCrossOwnerDenied(userA, briefB");
    expect(source).toContain("assertCrossOwnerDenied(userB, briefA");
    expect(source).toContain("user_id: userBId");
    expect(source).toContain("createdIds.push(crossOwnerId)");
    expect(source).toContain("if (!crossInsert.error)");
  });

  it("uses the secret client only for bounded cleanup and never prints identity values", () => {
    expect(source).toContain("admin.from(\"search_briefs\").delete().in(\"id\", createdIds)");
    expect(source).toContain("admin.auth.admin.createUser");
    expect(source).toContain("admin.auth.admin.deleteUser(id)");
    expect(source).toContain('process.env.RAMA_RLS_TEST_EPHEMERAL === "true"');
    expect(source).not.toContain("console.log(process.env");
    expect(source).not.toContain("console.log(userAId");
    expect(source).not.toContain("console.log(userBId");
    expect(source).toContain("AbortSignal.timeout(15_000)");
  });
});
