const packageManager = process.env.npm_config_user_agent ?? "";

if (!packageManager.startsWith("pnpm/")) {
  console.error("Rama Realty uses pnpm only. Run `pnpm install` instead.");
  process.exit(1);
}
