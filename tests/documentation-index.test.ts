import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(path);
    return entry.isFile() && entry.name.endsWith(".md") ? [path] : [];
  });
}

describe("documentation index", () => {
  it("links every repository-owned document and skill entrypoint", () => {
    const indexPath = resolve("docs/DOCUMENTATION_INDEX.md");
    const index = readFileSync(indexPath, "utf8");
    const linked = new Set(
      [...index.matchAll(/\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/g)]
        .map((match) => match[1])
        .filter((target) => !/^(?:https?:|mailto:)/.test(target))
        .map((target) => resolve("docs", target)),
    );
    const expected = [
      "AGENTS.md",
      "CLAUDE.md",
      "PRODUCT.md",
      "README.md",
      ...markdownFiles("docs"),
      ...markdownFiles("design-system"),
      ...markdownFiles(".agents/skills").filter((path) => path.endsWith("SKILL.md")),
    ].map((path) => resolve(path)).filter((path) => path !== indexPath);

    for (const path of expected) expect(linked.has(path), path).toBe(true);
  });
});
