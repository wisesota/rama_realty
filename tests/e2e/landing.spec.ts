import { expect, test, type Page } from "@playwright/test";
import { getStoryUrl } from "./storybook";
async function openTextComposer(page: Page, label = "Type instead") {
  await page.getByRole("button", { name: label, exact: true }).first().click();
  const brief = page.locator("#property-brief");
  await expect(brief).toBeFocused();
  return brief;
}

test("hero actions remain enabled and open the shared composer", async ({ page }) => {
  await page.goto("/en");
  const voice = page.getByRole("button", { name: "Talk to Rama" });
  const text = page.getByRole("button", { name: "Type instead" }).first();

  await expect(voice).toBeEnabled();
  await expect(text).toBeEnabled();
  await text.click();
  await expect(page.getByRole("dialog", { name: "Shape your Dubai brief." })).toBeVisible();
});

test("long-page navigation reports the current section in English and Arabic", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en");

  const primaryNavigation = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(primaryNavigation.locator('[aria-current="location"]')).toHaveCount(0);

  await primaryNavigation.getByRole("link", { name: "Specimen" }).click();
  await expect(primaryNavigation.getByRole("link", { name: "Specimen" }))
    .toHaveAttribute("aria-current", "location");

  await expect.poll(async () => {
    await page.locator("#method").evaluate((section) => {
      document.documentElement.style.scrollBehavior = "auto";
      section.scrollIntoView({ block: "start", behavior: "auto" });
    });
    return primaryNavigation.getByRole("link", { name: "Decision method" }).getAttribute("aria-current");
  }).toBe("location");

  await page.goto("/ar#boundaries");
  const arabicNavigation = page.getByRole("navigation", { name: "التنقل الرئيسي" });
  await expect(arabicNavigation.getByRole("link", { name: "الحدود" }))
    .toHaveAttribute("aria-current", "location");
});

test("an early hero intent is retained before the application hydrates", async ({ page }) => {
  await page.route("**/_next/static/chunks/**", (route) => route.abort());
  await page.goto("/en", { waitUntil: "domcontentloaded" });

  const text = page.getByRole("button", { name: "Type instead" }).first();
  await expect(text).toBeEnabled();
  await text.click();
  await expect(page).toHaveURL(/\/en\?briefMode=text$/);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("rama_cookie_consent", "declined"));
});

test("administrator authentication exposes only native Supabase email and password", async ({ page }) => {
  await page.goto("/auth/sign-in");

  await expect(page.getByRole("heading", { name: "Sign in to the CRM" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter CRM" })).toBeVisible();
  await expect(page.getByRole("button", { name: /google|oauth/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /google|oauth/i })).toHaveCount(0);
});

test("locale navigation updates the document contract", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

  await page.getByRole("link", { name: "View Rama in Arabic" }).click();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const brief = await openTextComposer(page, "اكتب بدلاً من ذلك");
  await expect(brief).toHaveValue("");
  await expect(brief).toHaveAttribute("placeholder", /دبي مارينا/);
  await expect(page.getByRole("button", { name: "استخدم الصوت بدلاً من ذلك" })).toBeVisible();
});

test("first visit is buyer-owned and short briefs expose an accessible recovery", async ({ page }) => {
  await page.goto("/en");
  const brief = await openTextComposer(page);
  await expect(brief).toHaveValue("");
  await expect(brief).toHaveAttribute("placeholder", /2-bed in Dubai Marina/);

  await brief.fill("a");
  await page.getByRole("button", { name: "Review my brief" }).click();
  await expect(brief).toBeFocused();
  await expect(brief).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#property-brief-error")).toHaveText("Add at least three characters so Rama can shape your brief.");
});

test("the long-form method stays truthful and reuses the original composer", async ({ page }) => {
  await page.goto("/en");
  for (const id of ["architecture", "examples", "capabilities", "specimen", "method", "boundaries", "briefings", "faq"]) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }

  await page.getByRole("button", { name: /Use this example: Waterfront routine/ }).click();
  const brief = page.locator("#property-brief");
  await expect(brief).toHaveValue(/Two bedrooms in Dubai Marina/);
  await expect(brief).toBeFocused();

  await page.getByRole("button", { name: "Close brief conversation" }).click();
  await page.getByRole("button", { name: "Begin my brief" }).click();
  await expect(page.getByRole("dialog", { name: "Shape your Dubai brief." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Speak my brief" })).toBeVisible();
  await expect(page.locator("#guided-search")).toHaveCount(1);
});

test("editorial media stays illustrative, localized, responsive, and below the hero", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/en");

  const desktopFigures = page.locator(".editorial-media");
  await expect(desktopFigures).toHaveCount(8);
  await expect(page.locator(".decision-hero .editorial-media")).toHaveCount(0);
  const desktopSlots = await page.evaluate(() => ({
    primary: document.querySelector<HTMLElement>(".architecture-media__primary")?.getBoundingClientRect().width ?? 0,
    secondary: document.querySelector<HTMLElement>(".architecture-media__secondary")?.getBoundingClientRect().width ?? 0,
    sizes: [...document.querySelectorAll<HTMLImageElement>(".editorial-media img")].map((image) => image.sizes),
    alts: [...document.querySelectorAll<HTMLImageElement>(".editorial-media img")].map((image) => image.alt),
  }));
  expect(desktopSlots.primary).toBeLessThanOrEqual(715);
  expect(desktopSlots.secondary).toBeLessThanOrEqual(515);
  expect(desktopSlots.primary).toBeGreaterThan(desktopSlots.secondary);
  expect(desktopSlots.sizes).toEqual(expect.arrayContaining([
    expect.stringContaining("715px"),
    expect.stringContaining("515px"),
  ]));
  expect(desktopSlots.alts.every((alt) => alt.length > 20)).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");

  const figures = page.locator(".editorial-media");
  await expect(figures).toHaveCount(8);

  for (let index = 0; index < 8; index += 1) {
    const figure = figures.nth(index);
    await figure.scrollIntoViewIfNeeded();
    await expect(figure.locator("img")).toHaveAttribute("alt", /\S/);
    await expect(figure.locator("figcaption")).toContainText("Illustrative architectural context");
    await expect
      .poll(() => figure.locator("img").evaluate((image) => (image as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }

  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    labels: [...document.querySelectorAll<HTMLElement>(".editorial-media figcaption span")].map(
      (label) => Number.parseFloat(getComputedStyle(label).fontSize),
    ),
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.labels.every((size) => size >= 12)).toBe(true);

  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator(".editorial-media")).toHaveCount(8);
  await expect(page.locator(".editorial-media figcaption").first()).toContainText("سياق معماري توضيحي");
  const arabicAlternatives = await page.locator(".editorial-media img").evaluateAll((images) =>
    images.map((image) => (image as HTMLImageElement).alt),
  );
  expect(arabicAlternatives).toHaveLength(8);
  expect(arabicAlternatives.every((alt) => /[\u0600-\u06FF]/.test(alt))).toBe(true);
});

test("mobile navigation contains one buyer path and no staff entry", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const mobileNavigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(mobileNavigation.getByRole("link", { name: "Decision method" })).toHaveCount(1);
  await expect(mobileNavigation.getByRole("link", { name: "Specimen" })).toHaveCount(1);
  await expect(mobileNavigation.getByRole("link", { name: "Boundaries" })).toHaveCount(1);
  await expect(mobileNavigation.getByRole("link", { name: "Begin a brief" })).toHaveCount(0);
  await expect(mobileNavigation.getByRole("link", { name: "Staff login" })).toHaveCount(0);
});

test("Arabic navigation exposes localized accessible names", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar");
  await expect(page.getByRole("link", { name: "صفحة راما الرئيسية" })).toBeVisible();
  await page.getByRole("button", { name: "افتح قائمة التنقل" }).click();
  await expect(page.getByRole("navigation", { name: "التنقل عبر الهاتف" })).toBeVisible();
});

test("typed discovery stops at editable confirmation and cancel writes nothing", async ({ page }) => {
  await page.goto("/en");
  const brief = await openTextComposer(page);
  await brief.fill("Two-bedroom apartment in Dubai Marina under AED 3M with a balcony");
  await page.getByRole("button", { name: "Review my brief" }).click();

  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("heading", { name: "Is this what you mean?" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("Your editable brief")).toHaveValue(/balcony/);
  await expect(page.getByRole("button", { name: /Confirm and search/ })).toBeVisible();
  await page.getByRole("button", { name: /Cancel/ }).click();
  await expect(page.getByRole("heading", { name: "Is this what you mean?" })).toHaveCount(0);
  await expect(page).toHaveURL(/\/en$/);
});

test("credential-free demo confirms into one restorable illustrative Decision Room", async ({ page }) => {
  await page.goto("/en");
  const brief = await openTextComposer(page);
  await brief.fill(
    "Two-bedroom apartment in Dubai Marina under AED 3M with a balcony",
  );
  await page.getByRole("button", { name: "Review my brief" }).click();
  await page.getByRole("button", { name: "Confirm and search" }).click();

  await expect(page).toHaveURL(/\/en\/discover\/[0-9a-f-]{36}$/, { timeout: 90_000 });
  await expect(page.getByRole("dialog", { name: "Rama Buyer Decision Room" })).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText(/illustrative residences/)).toBeVisible();
  await page.getByRole("button", { name: "Learn more" }).first().click();
  await expect(page.getByRole("heading", { name: "Inspect the evidence, then choose the next question." })).toBeFocused();
  await expect(page.getByRole("button", { name: "Advisor handoff unavailable for this illustrative record" })).toBeDisabled();
  const decisionRoomUrl = page.url();

  await page.getByRole("button", { name: "Close Decision Room" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.getByRole("button", { name: "Type instead" })).toBeFocused();

  await page.goto(decisionRoomUrl);
  await expect(page).toHaveURL(decisionRoomUrl);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Rama Buyer Decision Room" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/en$/);
  await page.goForward();
  await expect(page).toHaveURL(decisionRoomUrl);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a missing demo search run fails closed with localized recovery", async ({ page }) => {
  const response = await page.goto("/en/discover/00000000-0000-4000-8000-000000000000");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "This property decision room cannot be restored." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a new search" })).toHaveAttribute("href", "/en#guided-search");
  await expect(page.getByRole("link", { name: "Return to Rama" }).last()).toHaveAttribute("href", "/en");
});

test("trusted keyboard traversal reaches the skip link and primary voice action", async ({ page }) => {
  await page.goto("/en");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  let reachedVoiceAction = false;
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press("Tab");
    reachedVoiceAction = await page.getByRole("button", { name: "Talk to Rama" }).evaluate(
      (element) => element === document.activeElement,
    );
    if (reachedVoiceAction) break;
  }
  expect(reachedVoiceAction).toBe(true);
});

test("320px composition keeps the quiet hero usable without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/en");

  await expect(page.getByRole("link", { name: "Rama home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Begin a brief", exact: true })).toBeHidden();
  const metrics = await page.evaluate(() => {
    const voice = document.querySelector<HTMLElement>("[data-discovery-trigger='voice']");
    return {
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      voiceWidth: voice?.getBoundingClientRect().width ?? 0,
    };
  });
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.voiceWidth).toBeGreaterThanOrEqual(160);
  await expect(page.getByRole("heading", { name: "Say what matters." })).toBeVisible();
  await expect(page.locator(".quiet-voice-launcher__signal .criterion-weave svg")).toBeVisible();
});

test("Arabic confirmation surface preserves content parity", async ({ page }) => {
  await page.goto("/ar");
  const brief = await openTextComposer(page, "اكتب بدلاً من ذلك");
  await brief.fill("شقة بغرفتي نوم في دبي مارينا بأقل من 3 ملايين درهم مع شرفة");
  await page.getByRole("button", { name: "راجع موجزي" }).click();
  await expect(page.getByRole("heading", { name: "هل هذا ما تقصده؟" })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".brief-confirmation__criteria span", { hasText: "دبي مارينا" })).toBeVisible();
  await expect(page.locator(".brief-confirmation__criteria span", { hasText: "2 غرف نوم" })).toBeVisible();
  await expect(page.getByRole("button", { name: /أكّد وابحث/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /إلغاء/ })).toBeVisible();
  await expect(page.locator(".voice-discovery-dialog__status")).toContainText("راجع الموجز المكتوب وأكّده");
});

test("Arabic Decision Room localizes Rama-owned decision content", async ({ page }) => {
  await page.goto("/ar");
  const brief = await openTextComposer(page, "اكتب بدلاً من ذلك");
  await brief.fill("شقة بغرفتي نوم في دبي مارينا بأقل من 3 ملايين درهم مع شرفة");
  await page.getByRole("button", { name: "راجع موجزي" }).click();
  await page.getByRole("button", { name: /أكّد وابحث/ }).click();

  await expect(page.getByRole("dialog", { name: "غرفة قرار المشتري من راما" })).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText("أقوى تطابق حالي")).toBeVisible();
  await expect(page.getByText("لماذا اختارته راما")).toBeVisible();
  await expect(page.getByText(/المساكن التوضيحية/).first()).toBeVisible();
  await expect(page.getByText("توافق قوي مع الواجهة المائية وسهولة المشي وموجز غرفتي النوم.")).toBeVisible();
  await expect(page.getByText("Decision Ledger")).toHaveCount(0);
  await expect(page.getByText("Strong alignment with the waterfront, walkability, and two-bedroom brief.")).toHaveCount(0);
});

test("buyer-data export exposes progress, download, and completion", async ({ page }) => {
  await page.route("**/api/buyer-data", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Content-Disposition": 'attachment; filename="rama-buyer-data-test.json"' },
      body: JSON.stringify({ exportVersion: "rama-buyer-export/1.0", ownerType: "anonymous" }),
    });
  });
  await page.goto("/en");
  const brief = await openTextComposer(page);
  await brief.fill("Two-bedroom apartment in Dubai Marina under AED 3M");
  await page.getByRole("button", { name: "Review my brief" }).click();
  await page.getByRole("button", { name: "Confirm and search" }).click();
  await expect(page.getByRole("dialog", { name: "Rama Buyer Decision Room" })).toBeVisible({ timeout: 90_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my data" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("rama-buyer-data-test.json");
  await expect(page.getByText("Your data export download has started.")).toBeVisible();
});

test("a persistence failure is announced beside the brief and remains retryable", async ({ page }) => {
  await page.route("**/api/discovery/query", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "The result could not be saved for restoration.", code: "PersistenceUnavailable" }),
    });
  });
  await page.goto("/en");
  const brief = await openTextComposer(page);
  await brief.fill(
    "Two-bedroom apartment in Dubai Marina under AED 3M",
  );
  await page.getByRole("button", { name: "Review my brief" }).click();
  await page.getByRole("button", { name: "Confirm and search" }).click();

  const alert = page.locator("#property-brief-error");
  await expect(alert).toContainText("could not be saved");
  await expect(page.getByRole("heading", { name: "Is this what you mean?" })).toBeVisible({ timeout: 30_000 });
  const alertBox = await alert.boundingBox();
  const inputBox = await page.locator("#confirmed-brief").boundingBox();
  expect(alertBox && inputBox && alertBox.y - (inputBox.y + inputBox.height)).toBeLessThan(220);
});

test("quiet status and footer text meet AA contrast on their surfaces", async ({ page }) => {
  await page.goto("/en");
  await openTextComposer(page);
  const ratios = await page.evaluate(() => {
    const luminance = (color: string) => {
      const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
      const [red = 0, green = 0, blue = 0] = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };
    const contrast = (foreground: string, background: string) => {
      const first = luminance(foreground);
      const second = luminance(background);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    };
    const backgroundFor = (element: HTMLElement) => {
      let current: HTMLElement | null = element;
      while (current) {
        const background = getComputedStyle(current).backgroundColor;
        if (background !== "rgba(0, 0, 0, 0)") return background;
        current = current.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    return [".voice-discovery-dialog__status", ".decision-footer__legal"].map((selector) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return 0;
      const style = getComputedStyle(element);
      return contrast(style.color, backgroundFor(element));
    });
  });
  expect(ratios[0]).toBeGreaterThanOrEqual(4.5);
  expect(ratios[1]).toBeGreaterThanOrEqual(4.5);
});

test("contradictory briefs require clarification before search", async ({ page }) => {
  await page.goto("/en");
  const brief = await openTextComposer(page);
  await brief.fill("It must be both an apartment and a villa in Dubai under AED 5M");
  await page.getByRole("button", { name: "Review my brief" }).click();
  await expect(page.getByText("Highest-impact clarifications")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Should Rama consider an apartment or a villa for this decision?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm and search" })).toBeDisabled();
});

test("390px Arabic remains RTL and free of horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    voiceWidth: document.querySelector("[data-discovery-trigger='voice']")?.getBoundingClientRect().width ?? 0,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport);
  expect(metrics.voiceWidth).toBeGreaterThanOrEqual(160);
  await expect(page.locator(".quiet-voice-launcher__signal .criterion-weave svg")).toBeVisible();
});

test("Arabic decision-method controls advance by logical inline order", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/ar");
  const track = page.locator(".process-rail__track");
  await track.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "خطوة القرار التالية" }).click();
  await page.waitForTimeout(500);
  const alignment = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>(".process-rail__track");
    const second = rail?.querySelectorAll<HTMLElement>("[data-process-step]")[1];
    if (!rail || !second) return Number.POSITIVE_INFINITY;
    return Math.abs(rail.getBoundingClientRect().right - second.getBoundingClientRect().right);
  });
  expect(alignment).toBeLessThan(8);
});

test("desktop specimen exposes all stages as one semantic ordered list", async ({ page }) => {
  await page.goto("/en");
  const specimen = page.getByRole("list", { name: "Watch a decision become inspectable." });
  await expect(specimen).toHaveCount(1);
  await expect(specimen.getByRole("listitem")).toHaveCount(5);
});

test("landing remains usable across the required intermediate and wide breakpoints", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/en");
  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 720 : 900 });
    const metrics = await page.evaluate(() => {
      const voice = document.querySelector<HTMLElement>("[data-discovery-trigger='voice']");
      return {
        viewport: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        voiceHeight: voice?.getBoundingClientRect().height ?? 0,
      };
    });
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport);
    expect(metrics.voiceHeight).toBeGreaterThanOrEqual(44);
  }
});

test("1280 by 720 keeps the quiet voice promise and both entry paths above the fold", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/en");
  const invitation = [
    page.getByRole("link", { name: "Rama home" }),
    page.getByRole("heading", { name: "Say what matters." }),
    page.getByText("Rama turns your voice into a clear Dubai home brief."),
    page.getByRole("button", { name: "Talk to Rama" }),
    page.getByRole("button", { name: "Type instead" }),
    page.locator(".quiet-voice-launcher__signal .criterion-weave svg"),
  ];
  for (const locator of invitation) {
    await expect(locator).toBeVisible();
    const box = await locator.boundingBox();
    expect(box && box.y + box.height).toBeLessThanOrEqual(720);
  }
});

test("microphone denial remains explicit and leaves text available", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query: async () => ({ state: "denied" }) },
    });
  });
  await page.goto("/en");
  await page.getByRole("button", { name: "Talk to Rama" }).click();
  await expect(page.getByText("Microphone access is blocked in this browser.")).toBeVisible();
  await expect(page.getByText("Microphone access is blocked. Text input remains available.")).toBeAttached();
  await page.getByRole("dialog", { name: "Shape your Dubai brief." }).getByRole("button", { name: "Type instead" }).click();
  await expect(page.getByRole("textbox", { name: /Describe the decision you are making/ })).toBeEnabled();
});

test("disabled Live token falls back to recorded voice while text remains available", async ({ page }) => {
  await page.route("**/api/voice/token", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ error: "Gemini Live is disabled in demo mode." }),
  }));
  await page.goto("/en");
  await page.getByRole("button", { name: "Talk to Rama" }).click();
  await expect(page.getByText("Recorded Gemini voice mode is active. Speak, then choose stop.")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".voice-discovery-dialog [aria-live='polite']")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Type instead" }).last()).toBeVisible();
});

test("Arabic voice denial localizes visible recovery and its live announcement", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query: async () => ({ state: "denied" }) },
    });
  });
  await page.goto("/ar");
  await page.getByRole("button", { name: "تحدّث إلى راما" }).click();
  await expect(page.getByText("وصول الميكروفون محظور في هذا المتصفح.")).toBeVisible();
  await expect(page.locator(".voice-dialog-panel .sr-only")).toHaveText("وصول الميكروفون محظور. يبقى الإدخال المكتوب متاحاً.");
});

test("Arabic recorded fallback localizes status and its accessibility announcement", async ({ page }) => {
  await page.goto("/ar");
  await page.getByRole("button", { name: "تحدّث إلى راما" }).click();
  await expect(page.locator(".voice-discovery-dialog__status")).toHaveText("وضع Gemini الصوتي المسجل نشط. تحدث ثم اختر الإيقاف.", { timeout: 30_000 });
  await expect(page.locator(".voice-dialog-panel .sr-only")).toHaveText("يستمع وضع الصوت المسجل الآمن إلى موجزك العقاري.");
});

test("Arabic voice completion localizes visible state and its live announcement", async ({ page }) => {
  await page.goto(getStoryUrl("rama-voice-conversation--arabic-complete"));
  await expect(page.getByText("تم التقاط الموجز")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("شقة بغرفتي نوم في دبي مارينا")).toBeVisible();
  await expect(page.locator(".voice-dialog-panel .sr-only")).toHaveText("اكتمل الموجز الصوتي وتم تحديث معايير القرار.");
});

test("reduced motion keeps voice calm and exposes the complete static specimen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en");
  await expect(page.locator(".quiet-voice-launcher__signal .criterion-weave svg")).toBeVisible();
  await page.getByRole("button", { name: "Type instead", exact: true }).click();
  const liveSignal = page.locator(".gemini-live-signal[data-state='resting']");
  await expect(liveSignal).toBeVisible();
  const firstFrame = await liveSignal.locator("svg").innerHTML();
  await page.waitForTimeout(200);
  expect(await liveSignal.locator("svg").innerHTML()).toBe(firstFrame);
  await page.keyboard.press("Escape");
  await expect(page.locator(".quiet-voice-launcher__signal .decision-aperture[data-state='resting']")).toBeVisible();
  await expect(page.locator(".quiet-voice-launcher__signal .criterion-weave")).toHaveCount(0);
  await expect(page.locator(".decision-specimen__steps li")).toHaveCount(5);
  await expect(page.locator(".decision-specimen__steps")).toBeVisible();
});

test("long briefs scroll inside a fixed conversation frame", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  const brief = await openTextComposer(page);
  const dialog = page.getByRole("dialog", { name: "Shape your Dubai brief." });
  const before = await dialog.boundingBox();

  await brief.fill("Two-bedroom home near the waterfront with a balcony and space to work. ".repeat(8).slice(0, 500));
  const after = await dialog.boundingBox();
  const textMetrics = await brief.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs((after?.height ?? 0) - (before?.height ?? 0))).toBeLessThanOrEqual(1);
  expect(textMetrics.scrollHeight).toBeGreaterThan(textMetrics.clientHeight);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("the discovery dialog closes with Escape and restores focus to its launcher", async ({ page }) => {
  await page.goto("/en");
  const launcher = page.getByRole("button", { name: "Type instead" });
  await launcher.click();
  await expect(page.getByRole("dialog", { name: "Shape your Dubai brief." })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Shape your Dubai brief." })).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test("closing during permission preflight prevents a late microphone prompt", async ({ page }) => {
  await page.addInitScript(() => {
    type VoiceLifecycleWindow = Window & {
      resolveRamaPermission?: () => void;
      ramaMicrophoneCalls?: number;
    };
    const testWindow = window as VoiceLifecycleWindow;
    let resolvePermission!: (value: { state: PermissionState }) => void;
    const permission = new Promise<{ state: PermissionState }>((resolve) => {
      resolvePermission = resolve;
    });
    Object.defineProperty(navigator, "permissions", {
      configurable: true,
      value: { query: () => permission },
    });
    testWindow.ramaMicrophoneCalls = 0;
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: true,
      value: async () => {
        testWindow.ramaMicrophoneCalls = (testWindow.ramaMicrophoneCalls ?? 0) + 1;
        throw new DOMException("No device", "NotFoundError");
      },
    });
    testWindow.resolveRamaPermission = () => resolvePermission({ state: "prompt" });
  });

  await page.goto("/en");
  const launcher = page.getByRole("button", { name: "Talk to Rama" });
  await launcher.click();
  await expect(page.getByRole("dialog", { name: "Shape your Dubai brief." })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Shape your Dubai brief." })).toHaveCount(0);
  await page.evaluate(() => (window as Window & { resolveRamaPermission?: () => void }).resolveRamaPermission?.());
  await expect.poll(() => page.evaluate(() => (window as Window & { ramaMicrophoneCalls?: number }).ramaMicrophoneCalls ?? 0)).toBe(0);
  await expect(launcher).toBeFocused();
});

test("a retained prepared brief cannot hide a newly started microphone session", async ({ page }) => {
  let voiceTokenRequests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/voice/token")) voiceTokenRequests += 1;
  });
  await page.goto("/en");
  const brief = await openTextComposer(page);
  await brief.fill("Two-bedroom home in Dubai Marina under AED 3M");
  await page.getByRole("button", { name: "Review my brief" }).click();
  await expect(page.getByRole("heading", { name: "Is this what you mean?" })).toBeVisible({ timeout: 30_000 });
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Talk to Rama" }).click();

  await expect(page.getByRole("heading", { name: "Is this what you mean?" })).toBeVisible();
  await expect.poll(() => voiceTokenRequests).toBe(0);
  await expect(page.getByRole("button", { name: "Confirm and search" })).toBeVisible();
});
