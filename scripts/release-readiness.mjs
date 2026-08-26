import { readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { inspectEnvironment, loadLocalEnvironment } from "./env-contract.mjs";
import { assessReleaseReadiness } from "./release-readiness-lib.mjs";

function argumentValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(resolve(process.cwd(), path), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function deployablePublicMedia(root = resolve(process.cwd(), "public")) {
  const results = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.(?:avif|gif|jpe?g|json|png|riv|svg|webp)$/i.test(entry.name)
        && /^(?:images|lottie|rive)(?:[\\/]|$)/.test(relative(root, path))) {
        results.push(`public/${relative(root, path).split(sep).join("/")}`);
      }
    }
  }
  await walk(root);
  return results.sort();
}

const requireProduction = process.argv.includes("--require-production");
const evidencePath = argumentValue("--evidence", "docs/release-evidence.json");
const activationPath = argumentValue("--activation", "docs/production-activation.json");
const assetRightsPath = argumentValue("--asset-rights", "docs/PUBLIC_ASSET_RIGHTS.json");
const releaseEvidence = await readJson(evidencePath);
const activationRecord = requireProduction ? await readJson(activationPath) : null;
const assetRights = requireProduction ? await readJson(assetRightsPath) : null;
const publicAssets = requireProduction ? await deployablePublicMedia() : null;

let environmentResult = null;
if (requireProduction) {
  loadLocalEnvironment();
  environmentResult = inspectEnvironment(process.env);
}

const result = assessReleaseReadiness({
  releaseEvidence,
  activationRecord,
  assetRights,
  publicAssets,
  environmentResult,
  runtimeEnvironment: requireProduction ? process.env : undefined,
  requireProduction,
});
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
