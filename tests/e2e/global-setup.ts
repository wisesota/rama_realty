import type { FullConfig } from "@playwright/test";

async function warmRoute(origin: string, path: string, body?: unknown, method = "POST") {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${origin}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Origin: origin,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(60_000),
      });
      if (response.status < 500 || path === "/api/voice/token") return;
      if (attempt === 3) throw new Error(`E2E route warmup failed for ${path} with ${response.status}.`);
    } catch (error) {
      if (attempt === 3) throw new Error(`E2E route warmup failed for ${path}: ${String(error)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

export default async function globalSetup(config: FullConfig) {
  const origin = String(config.projects[0]?.use.baseURL ?? "http://localhost:3100");
  await warmRoute(origin, "/api/discovery/prepare", {
    brief: "Two-bedroom apartment in Dubai Marina under AED 3M",
    source: "text",
    draftId: "e2e-compiler-warmup",
  });
  await warmRoute(origin, "/api/voice/token", {});
  await warmRoute(
    origin,
    "/en/discover/00000000-0000-4000-8000-000000000000",
    undefined,
    "GET",
  );
}
