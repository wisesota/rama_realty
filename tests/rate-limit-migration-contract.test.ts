import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { rateLimitScopes } from "@/lib/rate-limit";

describe("shared limiter migration contract", () => {
  const migration = readFileSync("supabase/migrations/20260828224500_rate_limit_scope_and_spend_budget.sql", "utf8");
  const validation = readFileSync("supabase/migrations/20260828224600_validate_rate_limit_scope.sql", "utf8");

  it("keeps every server scope in the database allowlist", () => {
    for (const scope of rateLimitScopes) expect(migration).toContain(`'${scope}'`);
  });

  it("supports the bounded daily window and service-role-only execution", () => {
    expect(migration).toContain("p_window_seconds > 86400");
    expect(migration).toContain("p_max_requests > 10000");
    expect(migration).toContain("revoke all on function public.consume_api_rate_limit");
    expect(migration).toContain("grant execute on function public.consume_api_rate_limit");
    expect(migration).toContain("to service_role");
  });

  it("adds the replacement allowlist without an inline table scan and validates it separately", () => {
    expect(migration).toContain(")) not valid;");
    expect(validation).toContain("validate constraint api_rate_limits_scope_check");
  });
});
