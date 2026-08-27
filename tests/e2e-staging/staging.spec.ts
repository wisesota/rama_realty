import { expect, test } from "@playwright/test";

test("staging serves the bilingual public decision surface", async ({ page }) => {
  const english = await page.goto("/en");
  expect(english?.ok()).toBe(true);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Describe the life you want in Dubai." })).toBeVisible();

  const arabic = await page.goto("/ar");
  expect(arabic?.ok()).toBe(true);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("staging administrator access is native Supabase email and password only", async ({ page }) => {
  const response = await page.goto("/auth/sign-in");
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter CRM" })).toBeVisible();
  await expect(page.getByRole("button", { name: /google|oauth/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /google|oauth/i })).toHaveCount(0);
});

test("staging rejects an unscoped provider-style callback", async ({ page }) => {
  await page.goto("/auth/callback?code=provider-code&next=%2Fdashboard");
  await expect(page).toHaveURL(/\?auth=error#current-brief$/);
});

test("staging remains usable at mobile RTL width without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ar");

  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport);
  await expect(page.locator(".voice-signal__fallback")).toBeVisible();
});

test("staging confirms a governed brief into a restorable Decision Room", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("textbox", { name: /Describe the Dubai property/ }).fill(
    "Two-bedroom apartment in Dubai Marina under AED 3M with a balcony",
  );
  await page.getByRole("button", { name: "Shape my brief" }).click();
  await expect(page.getByRole("heading", { name: "Is this what you mean?" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm and search" }).click();

  await expect(page).toHaveURL(/\/en\/discover\/[0-9a-f-]{36}$/, { timeout: 30_000 });
  await expect(page.getByText(/illustrative residences/)).toBeVisible();
  const decisionRoomUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(decisionRoomUrl);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
