import "server-only";

import { PostHog } from "posthog-node";

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || '';
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

export const posthogServer = new PostHog(apiKey, {
  host,
  flushAt: 1,
  flushInterval: 0,
  // @posthog/ai otherwise records model input and output by default. Recorded
  // voice can contain buyer intent, so this is a hard server-side boundary.
  privacyMode: true,
});
