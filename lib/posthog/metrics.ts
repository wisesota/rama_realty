/**
 * Pure calculation helpers for PostHog discovery metrics and funnel conversion rates.
 */

export function calculateVoiceEngagementRate(voiceSearches: number, totalPageviews: number): string {
  if (!totalPageviews || totalPageviews <= 0) return "0.0";
  return ((voiceSearches / totalPageviews) * 100).toFixed(1);
}

export function calculateShortlistRate(shortlists: number, totalPageviews: number): string {
  if (!totalPageviews || totalPageviews <= 0) return "0.0";
  return ((shortlists / totalPageviews) * 100).toFixed(1);
}

export function calculateInquiryConversionRate(inquiriesCount: number, uniqueVisitors: number): string {
  if (!uniqueVisitors || uniqueVisitors <= 0) return "0.0";
  return ((inquiriesCount / uniqueVisitors) * 100).toFixed(1);
}
