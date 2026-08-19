import { PostHog } from 'posthog-node';

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || '';
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

export const posthogServer = new PostHog(apiKey, {
  host,
  flushAt: 1,
  flushInterval: 0,
});
