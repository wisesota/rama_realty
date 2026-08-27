import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const notFound = readFileSync(new URL("../app/not-found.tsx", import.meta.url), "utf8");

describe("public not-found recovery", () => {
  it("offers localized search and home recovery without disclosing another buyer session", () => {
    expect(notFound).toContain("Start a new search");
    expect(notFound).toContain("ابدأ بحثاً جديداً");
    expect(notFound).toContain("owned by another browser session");
    expect(notFound).toContain("localizedPath(locale, \"/\")");
    expect(notFound).toContain("#guided-search");
    expect(notFound).toContain("!text-white");
  });
});
