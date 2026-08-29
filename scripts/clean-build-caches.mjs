import { rmSync } from "node:fs";
import { resolve, sep } from "node:path";

const root = resolve(process.cwd());
const generatedTargets = [".next", ".next-demo", "tsconfig.tsbuildinfo"];

for (const relativeTarget of generatedTargets) {
  const target = resolve(root, relativeTarget);
  if (!target.startsWith(`${root}${sep}`)) throw new Error(`Refusing to clean outside the repository: ${target}`);
  rmSync(target, { recursive: true, force: true });
}

console.log(JSON.stringify({ ok: true, removed: generatedTargets }));
