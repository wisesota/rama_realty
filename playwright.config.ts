import { defineConfig, devices } from "@playwright/test";

const e2ePort = process.env.RAMA_E2E_PORT ?? "3100";
const e2eOrigin = `http://localhost:${e2ePort}`;
const storybookPort = process.env.RAMA_STORYBOOK_PORT ?? "6006";
const storybookOrigin = process.env.STORYBOOK_URL ?? `http://localhost:${storybookPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  timeout: 120_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  use: {
    baseURL: e2eOrigin,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    permissions: ["microphone"],
    launchOptions: {
      args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
    },
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } } },
  ],
  webServer: [
    {
      command: "pnpm demo",
      url: `${e2eOrigin}/en`,
      env: { RAMA_DEMO_PORT: e2ePort, RAMA_DEMO_CLEAN_BUILD: "true" },
      reuseExistingServer: false,
      timeout: 300_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: `pnpm storybook -- --ci --no-open -p ${storybookPort}`,
      url: `${storybookOrigin}/index.json`,
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
