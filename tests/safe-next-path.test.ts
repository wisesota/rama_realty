import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/auth/safe-next-path";

describe("safeInternalPath", () => {
  it("preserves internal paths with queries and fragments", () => {
    expect(safeInternalPath("/dashboard/inventory?view=draft#top")).toBe("/dashboard/inventory?view=draft#top");
  });

  it("rejects protocol-relative, backslash, encoded-backslash, and absolute redirects", () => {
    expect(safeInternalPath("//evil.example")).toBe("/dashboard");
    expect(safeInternalPath("/\\evil.example")).toBe("/dashboard");
    expect(safeInternalPath("/%5cevil.example")).toBe("/dashboard");
    expect(safeInternalPath("https://evil.example")).toBe("/dashboard");
  });
});
