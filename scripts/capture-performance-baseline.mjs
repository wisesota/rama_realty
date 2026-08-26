import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import lighthouse from "lighthouse";
import puppeteer from "puppeteer";

const root = path.resolve(import.meta.dirname, "..");
const chromePath =
  process.env.CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = readArgument("--url") ?? "http://localhost:3100/en";
const runCount = Number.parseInt(readArgument("--runs") ?? "5", 10);
const outputPath = path.resolve(
  root,
  readArgument("--output") ?? "docs/performance-baseline.json",
);

if (!Number.isInteger(runCount) || runCount < 1 || runCount > 10) {
  throw new Error("--runs must be an integer from 1 to 10");
}
if (!fs.existsSync(chromePath)) {
  throw new Error(`Chrome was not found at ${chromePath}. Set CHROME_PATH explicitly.`);
}

const profiles = [
  {
    id: "desktop",
    label: "Desktop dense 4G",
    formFactor: "desktop",
    screenEmulation: {
      mobile: false,
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
      cpuSlowdownMultiplier: 1,
    },
  },
  {
    id: "mobile-fast3g",
    label: "Mobile Fast 3G",
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      disabled: false,
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      requestLatencyMs: 562.5,
      downloadThroughputKbps: 1474.56,
      uploadThroughputKbps: 675,
      cpuSlowdownMultiplier: 4,
    },
  },
];

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function metric(audits, id) {
  const value = audits[id]?.numericValue;
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function median(values) {
  const numbers = values.filter(Number.isFinite).toSorted((left, right) => left - right);
  if (numbers.length === 0) return null;
  const middle = Math.floor(numbers.length / 2);
  return numbers.length % 2 === 0
    ? Math.round(((numbers[middle - 1] + numbers[middle]) / 2) * 100) / 100
    : numbers[middle];
}

function resourceBytes(audits, resourceType) {
  const item = audits["resource-summary"]?.details?.items?.find(
    (candidate) => candidate.resourceType === resourceType,
  );
  return Number.isFinite(item?.transferSize) ? item.transferSize : 0;
}

function extractRun(lhr) {
  const { audits } = lhr;
  return {
    performanceScore: Math.round((lhr.categories.performance.score ?? 0) * 100),
    fcpMs: metric(audits, "first-contentful-paint"),
    lcpMs: metric(audits, "largest-contentful-paint"),
    cls: metric(audits, "cumulative-layout-shift"),
    inpMs: metric(audits, "interaction-to-next-paint"),
    tbtMs: metric(audits, "total-blocking-time"),
    ttfbMs: metric(audits, "server-response-time"),
    speedIndexMs: metric(audits, "speed-index"),
    transferBytes: metric(audits, "total-byte-weight"),
    javascriptBytes: resourceBytes(audits, "script"),
    cssBytes: resourceBytes(audits, "stylesheet"),
  };
}

function summarize(runs) {
  const keys = Object.keys(runs[0]);
  return Object.fromEntries(keys.map((key) => [key, median(runs.map((run) => run[key]))]));
}

async function assertReachable() {
  const response = await fetch(url, { redirect: "manual" });
  if (!response.ok && ![301, 302, 307, 308].includes(response.status)) {
    throw new Error(`Performance target returned HTTP ${response.status}: ${url}`);
  }
}

async function capture(profile, index) {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const debuggingPort = Number.parseInt(new URL(browser.wsEndpoint()).port, 10);
    const result = await lighthouse(url, {
      port: debuggingPort,
      output: "json",
      logLevel: "silent",
      onlyCategories: ["performance"],
      formFactor: profile.formFactor,
      screenEmulation: profile.screenEmulation,
      throttling: profile.throttling,
      throttlingMethod: "simulate",
      disableStorageReset: false,
    });
    if (!result?.lhr) throw new Error(`Lighthouse did not return a report for ${profile.id}`);
    const run = extractRun(result.lhr);
    process.stdout.write(
      `${profile.id} ${index + 1}/${runCount}: score ${run.performanceScore}, LCP ${run.lcpMs}ms, CLS ${run.cls}\n`,
    );
    return run;
  } finally {
    await browser.close();
  }
}

await assertReachable();
const results = {};
for (const profile of profiles) {
  const runs = [];
  for (let index = 0; index < runCount; index += 1) {
    runs.push(await capture(profile, index));
  }
  results[profile.id] = {
    label: profile.label,
    network: profile.throttling,
    viewport: profile.screenEmulation,
    runs,
    median: summarize(runs),
  };
}

const baseline = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  source: "local optimized Next.js production build",
  commit: "working-tree-uncommitted",
  url,
  chrome: path.basename(chromePath),
  lighthouseVersion: "13.4.1",
  coldRunsPerProfile: runCount,
  interactionNote:
    "Navigation Lighthouse does not create a representative user interaction, so INP remains null when the audit cannot observe one; E2E interaction coverage remains the release evidence for behavior.",
  thresholds: {
    lcpMs: 2500,
    cls: 0.1,
    inpMs: 200,
    maxRegressionPercent: 10,
  },
  profiles: results,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
console.log(`Performance baseline written to ${path.relative(root, outputPath)}`);
