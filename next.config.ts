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
      config.watchOptions = config.watchOptions || {};
      const existingIgnored = config.watchOptions.ignored;
      const wellKnownRegex = /[\/\\]\.well-known[\/\\]/;

      config.watchOptions.ignored = existingIgnored
        ? Array.isArray(existingIgnored)
          ? [...existingIgnored, wellKnownRegex]
          : [existingIgnored, wellKnownRegex]
        : [wellKnownRegex];
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
