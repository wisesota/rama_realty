import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const rightsPath = resolve(root, "docs", "PUBLIC_ASSET_RIGHTS.json");
const rights = JSON.parse(readFileSync(rightsPath, "utf8"));

rights.archivedAssets = (Array.isArray(rights.archivedAssets) ? rights.archivedAssets : [])
  .flatMap((asset) => {
    if (typeof asset?.path !== "string" || !asset.path.startsWith("public/")) return [];
    const retiredPath = `assets/retired-public/${asset.path.slice("public/".length)}`;
    const absolute = resolve(root, retiredPath);
    if (!existsSync(absolute)) return [];
    const bytes = readFileSync(absolute);
    return [{
      ...asset,
      path: retiredPath,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      bytes: bytes.byteLength,
      retentionReason: `${asset.retentionReason.replace(/\s*not imported[^.]*\.?$/i, "")} Stored outside public and not deployed.`.trim(),
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
