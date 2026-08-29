import { existsSync } from "node:fs";
import { join } from "node:path";

export function pnpmInvocation(args) {
  if (process.platform !== "win32") return { command: "pnpm", args };
  const candidates = [
    process.env.PNPM_HOME ? join(process.env.PNPM_HOME, "pnpm.ps1") : null,
    process.env.APPDATA ? join(process.env.APPDATA, "npm", "pnpm.ps1") : null,
  ].filter(Boolean);
  const script = candidates.find((candidate) => existsSync(candidate));
  if (!script) throw new Error("The pinned pnpm PowerShell launcher is unavailable.");
  return {
    command: "powershell.exe",
    args: ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script, ...args],
  };
}
