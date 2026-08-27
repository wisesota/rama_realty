import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const temp = mkdtempSync(join(tmpdir(), "rama-registry-"));
const shadcnCli = join(root, "node_modules", "shadcn", "dist", "index.js");

function normalizedJson(path) {
  const content = readFileSync(path, "utf8");
  return JSON.stringify(JSON.parse(content.replace(/\\r\\n/g, "\\n")));
}

try {
  const result = spawnSync(process.execPath, [shadcnCli, "build", "registry.json", "-o", temp], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || "Registry generation failed.\n");
    process.exit(result.status ?? 1);
  }

  const generated = readdirSync(temp).filter((name) => name.endsWith(".json"));
  const mismatches = generated.filter((name) => {
    try {
      return normalizedJson(join(temp, name)) !== normalizedJson(join(root, "public", "r", name));
    } catch {
      return true;
    }
  });

  if (mismatches.length) {
    process.stderr.write(`Generated registry artifacts are stale: ${mismatches.map((path) => basename(path)).join(", ")}\nRun pnpm registry:build and commit public/r.\n`);
    process.exit(1);
  }
  process.stdout.write(`Registry parity verified for ${generated.length} artifacts.\n`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
