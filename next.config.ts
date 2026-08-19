import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
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
};

export default withSentryConfig(nextConfig, {
  org: "rama-d2",
  project: "javascript-nextjs",
  silent: !process.env.CI,
});
