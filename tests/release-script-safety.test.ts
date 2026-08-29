import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];

function temporaryWorkspace() {
  const directory = mkdtempSync(join(tmpdir(), "rama-release-script-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("release utility safety", () => {
  it("preserves already-normalized retired asset records across repeated runs", () => {
    const workspace = temporaryWorkspace();
    mkdirSync(join(workspace, "docs"), { recursive: true });
    mkdirSync(join(workspace, "assets", "retired-public", "images"), { recursive: true });
    writeFileSync(join(workspace, "assets", "retired-public", "images", "hero.jpg"), "asset");
    writeFileSync(join(workspace, "docs", "PUBLIC_ASSET_RIGHTS.json"), JSON.stringify({
      archivedAssets: [{ path: "public/images/hero.jpg", retentionReason: null }],
    }));
    const script = resolve("scripts/normalize-retired-asset-records.mjs");

    for (let run = 0; run < 2; run += 1) {
      const result = spawnSync(process.execPath, [script], { cwd: workspace, encoding: "utf8" });
      expect(result.status, result.stderr).toBe(0);
    }

    const rights = JSON.parse(readFileSync(join(workspace, "docs", "PUBLIC_ASSET_RIGHTS.json"), "utf8"));
    expect(rights.archivedAssets).toHaveLength(1);
    expect(rights.archivedAssets[0]).toMatchObject({
      path: "assets/retired-public/images/hero.jpg",
      retentionReason: "Retired public asset. Stored outside public and not deployed.",
    });
  });

  it("rejects npm subcommands beyond install and run", () => {
    const workspace = temporaryWorkspace();
    writeFileSync(join(workspace, "package.json"), JSON.stringify({
      scripts: { test: "echo ready && npm exec vitest" },
    }));
    const script = resolve("scripts/verify-package-manager-policy.mjs");

    const result = spawnSync(process.execPath, [script], { cwd: workspace, encoding: "utf8" });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("forbidden_command:package.json");
  });
});
