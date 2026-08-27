import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const outputDirectory = join(process.cwd(), ".impeccable", "screenshots");
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function capture({ locale, viewport, name, target }) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => localStorage.setItem("rama_cookie_consent", "declined"));
  const page = await context.newPage();
  await page.goto(`http://localhost:3000/${locale}`, { waitUntil: "networkidle", timeout: 90_000 });
  if (target) {
    await page.locator(target).scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector(".public-site-header")?.getAttribute("data-scrolled") === "true");
    await page.waitForTimeout(250);
  } else {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(120);
  }
  await page.screenshot({ path: join(outputDirectory, name), fullPage: false });
  await context.close();
}

try {
  await capture({ locale: "en", viewport: { width: 1440, height: 900 }, name: "decision-architecture-1440-final.png" });
  await capture({ locale: "en", viewport: { width: 1440, height: 900 }, name: "decision-architecture-specimen-final.png", target: "#specimen" });
  await capture({ locale: "ar", viewport: { width: 390, height: 844 }, name: "decision-architecture-ar-390-final.png" });
  await capture({ locale: "ar", viewport: { width: 390, height: 844 }, name: "decision-architecture-ar-specimen-390-final.png", target: "#specimen" });
} finally {
  await browser.close();
}

console.log(`Captured Rama design evidence in ${outputDirectory}`);
