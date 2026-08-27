import { withSentryConfig } from '@sentry/nextjs';
import { withWorkflow } from 'workflow/next';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.RAMA_DEMO_MODE === "true" ? ".next-demo" : ".next",
  experimental: {
    // Proxy buffers route-handler bodies before they reach request.formData().
    // Bound chunked voice uploads as well as requests with Content-Length.
    proxyClientMaxBodySize: "7mb",
    serverActions: {
      // The private staff-avatar bucket accepts files up to 2 MB. Leave room
      // for multipart overhead while Supabase remains the authoritative limit.
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Next.js sets watchOptions.ignored to a single RegExp that covers
      // .git, .next, and node_modules. Webpack 5 schema allows:
      //   RegExp | string | string[]
      // but NOT mixed arrays. When the existing value is a RegExp, we must
      // build a combined RegExp instead of creating [RegExp, string].
      const existing = config.watchOptions?.ignored;
      const wellKnownPattern = /[/\\]\.well-known[/\\]/;

      let merged: RegExp | string | string[];
      if (existing instanceof RegExp) {
        // Combine both RegExp patterns with alternation
        merged = new RegExp(`(?:${existing.source})|(?:${wellKnownPattern.source})`);
      } else if (typeof existing === "string") {
        merged = [existing, "**/.well-known/**"];
      } else if (Array.isArray(existing)) {
        merged = [...existing, "**/.well-known/**"];
      } else {
        merged = "**/.well-known/**";
      }

      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: merged,
      };
    }
    return config;
  },
};

export default withSentryConfig(withWorkflow(nextConfig), {
  org: "rama-d2",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  routeManifestInjection: false,
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
  },
  suppressOnRouterTransitionStartWarning: true,
});
