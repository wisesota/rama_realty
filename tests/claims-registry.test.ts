import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const registry = readFileSync("docs/CLAIMS_REGISTRY.md", "utf8");
const rows = registry.split(/\r?\n/)
  .filter((line) => /^\| `[^`]+` \|/.test(line))
  .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()));

describe("public claims registry", () => {
  it("gives every claim a unique ID, owner, source, observed date, expiry, and exact wording", () => {
    expect(rows.length).toBeGreaterThan(0);
    expect(new Set(rows.map(([id]) => id))).toHaveProperty("size", rows.length);
    for (const [id, state, owner, source, observed, expires, wording] of rows) {
      expect(id).toMatch(/^`[A-Z]+-\d{3}`$/);
      expect(state).toMatch(/^(approved|rejected)$/);
      expect(owner.length).toBeGreaterThan(2);
      expect(source.length).toBeGreaterThan(4);
      expect(observed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(expires).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Date.parse(expires)).toBeGreaterThan(Date.parse(observed));
      expect(wording.length).toBeGreaterThan(10);
    }
  });

  it("keeps unsupported brokerage, scale, supply, and return claims rejected", () => {
    for (const id of ["`LICENSE-001`", "`SCALE-001`", "`SUPPLY-001`", "`RETURN-001`"]) {
      expect(rows.find(([candidate]) => candidate === id)?.[1]).toBe("rejected");
    }
  });
});
