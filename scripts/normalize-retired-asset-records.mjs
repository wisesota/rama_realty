import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const rightsPath = resolve(root, "docs", "PUBLIC_ASSET_RIGHTS.json");
const rights = JSON.parse(readFileSync(rightsPath, "utf8"));

rights.archivedAssets = (Array.isArray(rights.archivedAssets) ? rights.archivedAssets : [])
  .flatMap((asset) => {
    if (typeof asset?.path !== "string") return [];
    const retiredPath = asset.path.startsWith("public/")
      ? `assets/retired-public/${asset.path.slice("public/".length)}`
      : asset.path.startsWith("assets/retired-public/")
        ? asset.path
        : null;
    if (!retiredPath) return [];
    const absolute = resolve(root, retiredPath);
    if (!existsSync(absolute)) return [];
    const bytes = readFileSync(absolute);
    const existingReason = typeof asset.retentionReason === "string"
      ? asset.retentionReason
      : "Retired public asset.";
    return [{
      ...asset,
      path: retiredPath,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.byteLength,
      retentionReason: `${existingReason.replace(/\s*(?:not imported[^.]*|stored outside public and not deployed)\.?$/i, "")} Stored outside public and not deployed.`.trim(),
    }];
  });
rights.excludedExploration = [{
  paths: ["components/archivanta/**", "assets/retired-public/**"],
  reason: "Unselected design exploration and rollback sources are retained outside public and are not deployed.",
  productionEligibility: "excluded",
}];
rights.updatedAt = new Date().toISOString();

writeFileSync(rightsPath, `${JSON.stringify(rights, null, 2)}\n`);
console.log(`Normalized ${rights.archivedAssets.length} non-deployed archive records.`);
