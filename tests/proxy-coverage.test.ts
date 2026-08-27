import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "@/proxy";

afterEach(() => vi.unstubAllEnvs());

describe("root proxy coverage", () => {
  it.each(["/", "/en", "/ar", "/dashboard", "/auth/sign-in", "/api/account-state"])(
    "covers locale and authenticated route %s",
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(true);
    },
  );

  it.each(["/_next/static/chunk.js", "/_next/image", "/images/rama-hero-editorial-daylight.png"])(
    "does not spend an auth refresh on static asset %s",
    (url) => {
      expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(false);
    },
  );

  it("rolls locale-prefixed public routes back to the compatible legacy route", async () => {
    vi.stubEnv("RAMA_LOCALE_ROUTES_ENABLED", "false");
    const home = await proxy(new NextRequest("http://localhost/en"));
    const room = await proxy(new NextRequest("http://localhost/ar/discover/run-1"));
    expect(home.headers.get("location")).toBe("http://localhost/");
    expect(room.headers.get("location")).toBe("http://localhost/discover/run-1");
  });

  it("keeps locale routes canonical while their rollout flag is enabled", async () => {
    vi.stubEnv("RAMA_LOCALE_ROUTES_ENABLED", "true");
    const response = await proxy(new NextRequest("http://localhost/discover/run-1", {
      headers: { "accept-language": "ar" },
    }));
    expect(response.headers.get("location")).toBe("http://localhost/ar/discover/run-1");
  });

  it("fails the landing composition closed with a non-cacheable operational response", async () => {
    vi.stubEnv("RAMA_LOCALE_ROUTES_ENABLED", "true");
    vi.stubEnv("RAMA_LANDING_COMPOSITION_ENABLED", "false");
    const response = await proxy(new NextRequest("http://localhost/ar"));
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("retry-after")).toBe("60");
    expect(await response.text()).toBe("تجربة راما غير متاحة مؤقتاً.");
  });

  it("localizes the legacy-root operational response from the trusted locale preference", async () => {
    vi.stubEnv("RAMA_LOCALE_ROUTES_ENABLED", "true");
    vi.stubEnv("RAMA_LANDING_COMPOSITION_ENABLED", "false");
    const response = await proxy(new NextRequest("http://localhost/", {
      headers: { "accept-language": "ar-AE,ar;q=0.9,en;q=0.8" },
    }));
    expect(response.status).toBe(503);
    expect(await response.text()).toBe("تجربة راما غير متاحة مؤقتاً.");
  });
});
