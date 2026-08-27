import { expect, test } from "@playwright/test";
import { getStoryUrl } from "./storybook";

async function openStory(page: import("@playwright/test").Page, story: "english" | "arabic") {
  await page.goto(getStoryUrl(`rama-savedbriefcontrol--${story}`));
  await page.locator("#storybook-root > *").first().waitFor({ state: "attached", timeout: 20_000 });
}

test("buyer selects saved runs and receives a governed cross-run comparison", async ({ page }) => {
  await openStory(page, "english");
  await expect(page.getByRole("heading", { name: "Carry your criteria across searches." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save current brief" })).toBeVisible();

  const runs = page.getByRole("checkbox", { name: /Select saved run/ });
  await expect(runs).toHaveCount(2);
  await expect(page.getByText("Last change").first()).toBeVisible();
  await expect(page.getByText("Not stored in this saved snapshot").first()).toBeVisible();
  await expect(page.getByText("Candidate records are rechecked when compared").first()).toBeVisible();
  await runs.nth(0).check();
  await runs.nth(1).check();
  const compare = page.getByRole("button", { name: "Compare selected runs" });
  await expect(compare).toBeEnabled();
  await compare.click();

  await expect(page.getByText("Three illustrative residences are compared across the same governed fields.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cross-run comparison" })).toBeVisible();

  await page.getByRole("button", { name: "Save current brief" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Sign out of saved decisions" })).toBeFocused();
});

test("saved decision history preserves Arabic parity without mobile overflow", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await openStory(page, "arabic");

  await expect(page.getByRole("heading", { name: "احتفظ بمعاييرك بين عمليات البحث." })).toBeVisible();
  await expect(page.getByRole("button", { name: "احفظ الموجز الحالي" })).toBeVisible();
  await expect(page.locator("[dir='rtl']")).toBeVisible();
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport);
});

test("authenticated erasure stays locked until the account-email step-up completes", async ({ page }) => {
  await openStory(page, "english");
  await page.getByText("Permanent deletion").click();

  const confirmation = page.getByLabel("Type DELETE MY RAMA DATA to confirm");
  await expect(confirmation).toBeDisabled();
  await page.getByRole("button", { name: "Email me a one-time deletion link" }).click();
  await expect(page.getByText(/Open the one-time link in this browser within ten minutes/)).toBeVisible();

  await page.goto(`${getStoryUrl("rama-savedbriefcontrol--english")}&deletion=verified`);
  await page.getByText("Permanent deletion").click();
  await expect(page.getByRole("button", { name: "Email verification complete" })).toBeDisabled();
  await expect(confirmation).toBeEnabled();
  await confirmation.fill("DELETE MY RAMA DATA");
  await page.getByRole("button", { name: "Permanently delete my Rama data" }).click();
  await expect(page.getByText("Deletion completed. This browser now has a new, empty anonymous session.")).toBeVisible();
});
