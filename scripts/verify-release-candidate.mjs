import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pnpmInvocation } from "./pnpm-runtime.mjs";

const commitPattern = /^[a-f0-9]{40}$/;
const expectedCommit = process.env.RAMA_RELEASE_COMMIT?.trim() ?? "";
const actualCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const status = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim();
const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
const lockfileSha256 = createHash("sha256").update(readFileSync(resolve("pnpm-lock.yaml"))).digest("hex");
const pnpmCommand = pnpmInvocation(["--version"]);
const pnpmVersion = execFileSync(pnpmCommand.command, pnpmCommand.args, { encoding: "utf8" }).trim();
const blockers = [];

if (!commitPattern.test(expectedCommit)) blockers.push("release_commit_missing_or_invalid");
if (expectedCommit && expectedCommit !== actualCommit) blockers.push("release_commit_does_not_match_head");
if (status) blockers.push("working_tree_not_clean");
if (process.versions.node !== packageJson.engines?.node) blockers.push("node_version_mismatch");
if (`pnpm@${pnpmVersion}` !== packageJson.packageManager) blockers.push("pnpm_version_mismatch");

const result = {
  ok: blockers.length === 0,
  expectedCommit: expectedCommit || null,
  actualCommit,
  cleanWorkingTree: status.length === 0,
  nodeVersion: process.versions.node,
  pnpmVersion,
  lockfileSha256,
  evidenceAuthority: process.env.CI === "true" ? "ci-candidate-check" : "local-diagnostic",
  blockers,
};

console.log(JSON.stringify(result));
if (!result.ok) process.exitCode = 1;
