import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/release/route";

const originalCommit = process.env.RAMA_RELEASE_COMMIT;
const originalVercelCommit = process.env.VERCEL_GIT_COMMIT_SHA;

afterEach(() => {
  if (originalCommit === undefined) delete process.env.RAMA_RELEASE_COMMIT;
  else process.env.RAMA_RELEASE_COMMIT = originalCommit;
  if (originalVercelCommit === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA;
  else process.env.VERCEL_GIT_COMMIT_SHA = originalVercelCommit;
});

describe("release health endpoint", () => {
  it("fails closed when the deployed commit is not configured", async () => {
    delete process.env.RAMA_RELEASE_COMMIT;
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unconfigured" });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("attests an exact deployed commit without exposing other environment data", async () => {
    process.env.RAMA_RELEASE_COMMIT = "a".repeat(40);
    process.env.VERCEL_GIT_COMMIT_SHA = "a".repeat(40);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", releaseCommit: "a".repeat(40) });
  });

  it("fails closed when the deployer claim does not match Vercel's commit", async () => {
    process.env.RAMA_RELEASE_COMMIT = "a".repeat(40);
    process.env.VERCEL_GIT_COMMIT_SHA = "b".repeat(40);
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "mismatch" });
  });

  it("fails closed when Vercel does not expose a commit SHA", async () => {
    process.env.RAMA_RELEASE_COMMIT = "a".repeat(40);
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unconfigured" });
  });
});
