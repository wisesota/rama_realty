import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { deployablePublicMedia } from "./public-asset-inventory.mjs";

const rightsPath = resolve(process.cwd(), "docs", "PUBLIC_ASSET_RIGHTS.json");
const rights = JSON.parse(await readFile(rightsPath, "utf8"));
const inventory = await deployablePublicMedia();
const assets = Array.isArray(rights.assets) ? rights.assets : [];
const paths = assets.map((asset) => asset?.path).filter((path) => typeof path === "string");
const blockers = [];

if (rights.schemaVersion !== 1) blockers.push("asset_rights_schema_invalid");
if (new Set(paths).size !== paths.length) blockers.push("asset_rights_duplicate_path");

const registered = new Set(paths);
const deployed = new Set(inventory);
for (const path of inventory) {
  if (!registered.has(path)) blockers.push(`unregistered:${path}`);
}
for (const path of paths) {
  if (!deployed.has(path)) blockers.push(`registered_but_not_deployed:${path}`);
}

for (const asset of assets) {
  if (!asset?.path || !deployed.has(asset.path)) continue;
  const bytes = await readFile(resolve(process.cwd(), asset.path));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (asset.bytes !== bytes.byteLength) blockers.push(`byte_count_mismatch:${asset.path}`);
  if (asset.sha256 !== sha256) blockers.push(`sha256_mismatch:${asset.path}`);
}

const result = {
  ok: blockers.length === 0,
  deployed: inventory.length,
  registered: paths.length,
  blockers,
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
