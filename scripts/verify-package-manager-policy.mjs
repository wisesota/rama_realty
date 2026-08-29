import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const forbiddenLockfiles = ["package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "bun.lock", "bun.lockb"];
const executableRoots = ["package.json", "scripts", ".github/workflows"];
const forbiddenCommand = /(^|[\s"'])(?:npx|npm(?=\s)|yarn(?=\s|$)|bun(?:x|(?=\s)))/m;

function filesUnder(path) {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory() ? filesUnder(child) : [child];
  });
}

const blockers = forbiddenLockfiles.filter((file) => existsSync(join(root, file))).map((file) => `forbidden_lockfile:${file}`);
for (const surface of executableRoots.flatMap((path) => filesUnder(join(root, path)))) {
  if (!/\.(?:json|mjs|js|cjs|ya?ml)$/.test(surface)) continue;
  if (forbiddenCommand.test(readFileSync(surface, "utf8"))) blockers.push(`forbidden_command:${relative(root, surface).replaceAll("\\", "/")}`);
}

const result = { ok: blockers.length === 0, packageManager: "pnpm", blockers };
console.log(JSON.stringify(result));
if (!result.ok) process.exitCode = 1;
