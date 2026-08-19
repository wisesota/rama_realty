import posthog from 'posthog-js'

const isClient = typeof window !== 'undefined'

export function trackVoiceSearchInitiated(options: { source: 'landing' | 'dashboard' | 'nav' }) {
  if (isClient) posthog.capture('Voice Search Initiated', options)
}

export function trackPropertyShortlisted(options: { propertyId: string; listId?: string }) {
  if (isClient) posthog.capture('Property Shortlisted', options)
}

export function trackSearchBriefCreated(options: { length: number; termsCount: number }) {
  if (isClient) posthog.capture('Search Brief Created', options)
}

export function trackAgentToolUsed(options: { toolName: string; durationMs: number; ok: boolean }) {
  if (isClient) posthog.capture('Agent Tool Used', options)
}
