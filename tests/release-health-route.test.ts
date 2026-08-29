import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/release/route";

const originalCommit = process.env.RAMA_RELEASE_COMMIT;

afterEach(() => {
  if (originalCommit === undefined) delete process.env.RAMA_RELEASE_COMMIT;
  else process.env.RAMA_RELEASE_COMMIT = originalCommit;
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
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", releaseCommit: "a".repeat(40) });
  });
});
