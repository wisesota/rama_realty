import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("staging verification workflow", () => {
  const workflow = readFileSync(".github/workflows/staging-verification.yml", "utf8");

  it("is manual, environment-bound, and read-only", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toMatch(/environment:\s*(staging|\n\s+name:\s+staging)/);
    expect(workflow).toMatch(/permissions:\s+contents: read/);
    expect(workflow).toContain("persist-credentials: false");
  });

  it("uses staging secrets and the deployed HTTPS matrix", () => {
    expect(workflow).toContain("secrets.STAGING_SUPABASE_SECRET_KEY");
    expect(workflow).toContain("secrets.STAGING_RATE_LIMIT_SECRET");
    expect(workflow).toContain("secrets.STAGING_BUYER_SESSION_SECRET");
    expect(workflow).toContain("secrets.STAGING_GEMINI_API_KEY");
    expect(workflow).not.toContain("secrets.GEMINI_API_KEY");
    expect(workflow).toContain("pnpm verify:supabase-identities");
    expect(workflow).toContain("pnpm e2e:staging");
    expect(workflow).not.toMatch(/(^|\s)npm\s/m);
    expect(workflow).not.toMatch(/(^|\s)npx\s/m);
  });

  it("validates a protected release SHA before checking out code with staging access", () => {
    expect(workflow).toContain("validate-release:");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain('repos/$GITHUB_REPOSITORY/tags?per_page=100');
    expect(workflow).toContain("compare/$RAMA_RELEASE_COMMIT...main");
    expect(workflow).toMatch(/deployed-matrix:\s*\n\s+needs: validate-release/);
    expect(workflow).toMatch(/live-provider:\s*\n\s+needs: \[validate-release, deployed-matrix\]/);
    expect(workflow).toContain("ref: ${{ needs.validate-release.outputs.release_commit }}");
  });

  it("does not expose staging secrets through job-scoped environment variables", () => {
    expect(workflow).not.toMatch(/^\s{6}[A-Z_]+:\s*\$\{\{\s*secrets\./m);
  });
});
