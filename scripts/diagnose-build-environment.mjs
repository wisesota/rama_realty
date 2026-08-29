import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { lookup } from "node:dns/promises";
import { createRequire } from "node:module";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pnpmInvocation } from "./pnpm-runtime.mjs";

const root = process.cwd();
const expectedNode = "24.19.0";
const expectedPnpm = "11.20.0";
const expectedRegistry = "https://registry.npmjs.org/";
const requiredPackages = [
  "next",
  "lighthouse",
  "require-in-the-middle",
  "import-in-the-middle",
  "@opentelemetry/instrumentation",
];

function run(command, args) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function runPnpm(args) {
  const invocation = pnpmInvocation(args);
  return run(invocation.command, invocation.args);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function packageRoot(entryPath) {
  let current = dirname(entryPath);
  while (current !== dirname(current)) {
    const manifest = join(current, "package.json");
    if (existsSync(manifest)) return current;
    current = dirname(current);
  }
  return null;
}

function directoryHasPayload(path) {
  return Boolean(path) && statSync(path).isDirectory() && readdirSync(path).some((entry) => entry !== "node_modules");
}

function virtualStorePackageRoots(name) {
  const virtualStore = resolve(root, "node_modules", ".pnpm");
  if (!existsSync(virtualStore)) return [];
  const encodedName = name.replace("/", "+");
  return [
    resolve(virtualStore, "node_modules", ...name.split("/")),
    ...readdirSync(virtualStore)
    .filter((candidate) => candidate.startsWith(`${encodedName}@`))
    .map((entry) => resolve(virtualStore, entry, "node_modules", ...name.split("/"))),
  ];
}

const blockers = [];
const warnings = [];
const packageJsonPath = resolve(root, "package.json");
const lockfilePath = resolve(root, "pnpm-lock.yaml");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const lockfile = readFileSync(lockfilePath, "utf8");
const lockfileHash = sha256(lockfilePath);
const lockfileVersion = lockfile.match(/^lockfileVersion:\s*['\"]?([^'\"\r\n]+)['\"]?/m)?.[1] ?? null;

let pnpmVersion = null;
let registry = null;
try {
  pnpmVersion = runPnpm(["--version"]);
  registry = runPnpm(["config", "get", "registry"]);
} catch {
  blockers.push("pnpm_unavailable");
}

if (process.versions.node !== expectedNode) blockers.push("node_version_mismatch");
if (pnpmVersion !== expectedPnpm) blockers.push("pnpm_version_mismatch");
if (packageJson.packageManager !== `pnpm@${expectedPnpm}`) blockers.push("package_manager_pin_mismatch");
if (packageJson.engines?.node !== expectedNode) blockers.push("node_engine_pin_mismatch");
if (readFileSync(resolve(root, ".node-version"), "utf8").trim() !== expectedNode) blockers.push("node_version_file_mismatch");
if (readFileSync(resolve(root, ".nvmrc"), "utf8").trim() !== expectedNode) blockers.push("nvmrc_mismatch");
if (registry !== expectedRegistry) blockers.push("registry_mismatch");
if (lockfileVersion !== "9.0") blockers.push("lockfile_version_invalid");
if (!/^importers:\s*$/m.test(lockfile) || !/^packages:\s*$/m.test(lockfile) || !/^snapshots:\s*$/m.test(lockfile)) blockers.push("lockfile_sections_missing");

const expectedLockfileHash = process.env.RAMA_LOCKFILE_SHA256?.trim().toLowerCase();
if (expectedLockfileHash && !/^[a-f0-9]{64}$/.test(expectedLockfileHash)) blockers.push("expected_lockfile_hash_invalid");
if (expectedLockfileHash && expectedLockfileHash !== lockfileHash) blockers.push("lockfile_hash_mismatch");

const require = createRequire(import.meta.url);
const dependencyChecks = requiredPackages.map((name) => {
  try {
    const entry = require.resolve(name, { paths: [root] });
    const packageDirectory = packageRoot(entry);
    const ok = directoryHasPayload(packageDirectory);
    if (!ok) blockers.push(`dependency_payload_invalid:${name}`);
    return { name, ok };
  } catch {
    const ok = virtualStorePackageRoots(name).some(directoryHasPayload);
    if (!ok) blockers.push(`dependency_payload_invalid:${name}`);
    return { name, ok };
  }
});

const proxyEnvironmentKeys = ["HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "http_proxy", "https_proxy", "no_proxy"]
  .filter((key) => Boolean(process.env[key]));
if (proxyEnvironmentKeys.length) warnings.push("proxy_environment_present");

let storeStatus = "not_requested";
if (process.argv.includes("--store-status")) {
  const storeArguments = process.env.RAMA_PNPM_STORE_DIR
    ? ["--store-dir", process.env.RAMA_PNPM_STORE_DIR, "store", "status"]
    : ["store", "status"];
  const invocation = pnpmInvocation(storeArguments);
  const status = spawnSync(invocation.command, invocation.args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  storeStatus = status.status === 0 ? "clean" : "modified";
  if (status.status !== 0) blockers.push("pnpm_store_modified");
}

let registryProbe = { status: "not_requested" };
if (process.argv.includes("--registry-probe") && registry === expectedRegistry) {
  const startedAt = performance.now();
  try {
    const addresses = await lookup(new URL(registry).hostname, { all: true });
    const response = await fetch(new URL("-/ping", registry), {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
      headers: { accept: "application/json" },
    });
    registryProbe = {
      status: response.ok ? "reachable" : "http_error",
      httpStatus: response.status,
      durationMs: Math.round(performance.now() - startedAt),
      resolvedAddressCount: addresses.length,
      addressFamilies: [...new Set(addresses.map((address) => address.family))],
    };
    if (!response.ok) blockers.push("registry_probe_failed");
  } catch (error) {
    registryProbe = {
      status: "unreachable",
      errorCode: typeof error?.cause?.code === "string" ? error.cause.code : error?.name ?? "unknown",
      durationMs: Math.round(performance.now() - startedAt),
    };
    blockers.push("registry_probe_failed");
  }
}

const result = {
  ok: blockers.length === 0,
  node: { actual: process.versions.node, expected: expectedNode },
  pnpm: { actual: pnpmVersion, expected: expectedPnpm },
  registry: { approved: registry === expectedRegistry },
  registryProbe,
  lockfile: { version: lockfileVersion, sha256: lockfileHash },
  dependencies: dependencyChecks,
  storeStatus,
  configuration: {
    projectNpmrcPresent: existsSync(resolve(root, ".npmrc")),
    proxyEnvironmentKeys,
  },
  warnings,
  blockers: [...new Set(blockers)],
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
