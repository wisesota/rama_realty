import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..");
const url = readArgument("--url") ?? "http://localhost:3100/en";
const runCount = Number.parseInt(readArgument("--runs") ?? "20", 10);
const outputPath = path.resolve(root, readArgument("--output") ?? "docs/performance-web-vitals.json");

if (!Number.isInteger(runCount) || runCount < 5 || runCount > 30) {
  throw new Error("--runs must be an integer from 5 to 30.");
}

const profiles = [
  {
    id: "desktop",
    viewport: { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
    latencyMs: 40,
    downloadKbps: 10_240,
    uploadKbps: 10_240,
    cpuSlowdownMultiplier: 1,
  },
  {
    id: "mobile-fast3g",
    viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
    latencyMs: 150,
    downloadKbps: 1_638.4,
    uploadKbps: 750,
    cpuSlowdownMultiplier: 4,
  },
];

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function median(values) {
  const ordered = values.filter(Number.isFinite).toSorted((left, right) => left - right);
  return ordered[Math.floor(ordered.length / 2)] ?? null;
}

function percentile(values, percentage) {
  const ordered = values.filter(Number.isFinite).toSorted((left, right) => left - right);
  if (!ordered.length) return null;
  return ordered[Math.ceil((percentage / 100) * ordered.length) - 1];
}

function summary(runs, selector) {
  const values = runs.map(selector);
  return { median: median(values), p75: percentile(values, 75), p95: percentile(values, 95) };
}

async function capture(profile) {
  const browser = await chromium.launch({
    headless: true,
  });
  try {
    const context = await browser.newContext({
      viewport: { width: profile.viewport.width, height: profile.viewport.height },
      deviceScaleFactor: profile.viewport.deviceScaleFactor,
      isMobile: profile.viewport.isMobile,
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: profile.latencyMs,
      downloadThroughput: profile.downloadKbps * 1024 / 8,
      uploadThroughput: profile.uploadKbps * 1024 / 8,
    });
    await client.send("Emulation.setCPUThrottlingRate", { rate: profile.cpuSlowdownMultiplier });
    await page.addInitScript(() => {
      const vitals = { lcpMs: 0, lcpElement: "", cls: 0 };
      Object.defineProperty(window, "__ramaVitals", { value: vitals, configurable: true });
      new PerformanceObserver((list) => {
        const entry = list.getEntries().at(-1);
        if (!entry) return;
        vitals.lcpMs = entry.startTime;
        const element = "element" in entry ? entry.element : null;
        if (element instanceof HTMLElement) {
          vitals.lcpElement = `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.className ? `.${String(element.className).trim().replace(/\s+/g, ".")}` : ""}`.slice(0, 240);
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!("hadRecentInput" in entry) || !entry.hadRecentInput) vitals.cls += "value" in entry ? entry.value : 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(2_500);
    return await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const resources = performance.getEntriesByType("resource");
      const byType = (type) => resources
        .filter((entry) => entry.initiatorType === type)
        .reduce((total, entry) => total + (entry.transferSize || 0), 0);
      const stylesheetBytes = resources
        .filter((entry) => /\.css(?:\?|$)/.test(entry.name))
        .reduce((total, entry) => total + (entry.transferSize || 0), 0);
      const vitals = window.__ramaVitals;
      return {
        fcpMs: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
        lcpMs: vitals?.lcpMs ?? null,
        lcpElement: vitals?.lcpElement ?? "",
        cls: vitals?.cls ?? null,
        domContentLoadedMs: navigation?.domContentLoadedEventEnd ?? null,
        loadMs: navigation?.loadEventEnd ?? null,
        transferBytes: resources.reduce((total, entry) => total + (entry.transferSize || 0), 0),
        javascriptBytes: byType("script"),
        cssBytes: stylesheetBytes,
      };
    });
  } finally {
    await browser.close();
  }
}

const results = {};
for (const profile of profiles) {
  const runs = [];
  for (let index = 0; index < runCount; index += 1) {
    const run = await capture(profile);
    runs.push(run);
    console.log(`${profile.id} ${index + 1}/${runCount}: LCP ${Math.round(run.lcpMs)}ms (${run.lcpElement}), CLS ${run.cls}`);
  }
  results[profile.id] = {
    network: profile,
    runs,
    median: {
      fcpMs: median(runs.map((run) => run.fcpMs)),
      lcpMs: median(runs.map((run) => run.lcpMs)),
      cls: median(runs.map((run) => run.cls)),
      domContentLoadedMs: median(runs.map((run) => run.domContentLoadedMs)),
      loadMs: median(runs.map((run) => run.loadMs)),
      transferBytes: median(runs.map((run) => run.transferBytes)),
      javascriptBytes: median(runs.map((run) => run.javascriptBytes)),
      cssBytes: median(runs.map((run) => run.cssBytes)),
    },
    distribution: {
      lcpMs: summary(runs, (run) => run.lcpMs),
      cls: summary(runs, (run) => run.cls),
      loadMs: summary(runs, (run) => run.loadMs),
      transferBytes: summary(runs, (run) => run.transferBytes),
    },
    coldCandidate: runs[0],
    warmRepeats: runs.slice(1),
  };
}

const report = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  source: "Chrome DevTools Protocol with applied network and CPU throttling",
  url,
  thresholds: { lcpMs: 2_500, cls: 0.1 },
  profiles: results,
};
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`Web-vitals report written to ${path.relative(root, outputPath)}`);
