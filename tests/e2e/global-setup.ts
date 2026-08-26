import type { FullConfig } from "@playwright/test";

async function warmRoute(origin: string, path: string, body?: unknown) {
  const response = await fetch(`${origin}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status >= 500 && path !== "/api/voice/token") {
    throw new Error(`E2E route warmup failed for ${path} with ${response.status}.`);
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
}
