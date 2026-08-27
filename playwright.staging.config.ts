import { defineConfig, devices } from "@playwright/test";

const stagingUrl = process.env.RAMA_STAGING_URL;
if (!stagingUrl) {
  throw new Error("RAMA_STAGING_URL is required for the live staging E2E suite.");
}

const target = new URL(stagingUrl);
if (target.protocol !== "https:" || target.hostname === "localhost" || target.hostname === "127.0.0.1") {
  throw new Error("RAMA_STAGING_URL must be a deployed HTTPS staging origin.");
}

export default defineConfig({
  testDir: "./tests/e2e-staging",
  fullyParallel: false,
  timeout: 60_000,
  forbidOnly: true,
  retries: 1,
  workers: 1,
  reporter: [["line"], ["html", { open: "never", outputFolder: "playwright-report-staging" }]],
  use: {
    baseURL: target.origin,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    permissions: [],
  },
  projects: [
    {
      name: "staging-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } },
    },
  ],
});
