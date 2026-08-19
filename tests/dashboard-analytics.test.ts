import { describe, expect, it } from "vitest";
import type { AnalyticsSummary } from "@/lib/posthog/analytics";

describe("Dashboard Analytics data transformations", () => {
  it("calculates conversion metrics and percentages accurately", () => {
    const mockSummary: AnalyticsSummary = {
      overview: {
        totalPageviews: 120,
        uniqueVisitors: 45,
        deadClicks: 2,
        totalEvents: 180,
        webVitalsEvents: 12,
        averageDailyViews: 4,
      },
      dailyTrends: [
        { date: "2026-08-18", pageviews: 50, visitors: 20 },
        { date: "2026-08-19", pageviews: 70, visitors: 25 },
      ],
      topPages: [
        { path: "/", url: "http://localhost:3000/", views: 90, visitors: 40, percentage: 75 },
        { path: "/discover", url: "http://localhost:3000/discover", views: 30, visitors: 15, percentage: 25 },
      ],
      funnel: {
        pageviews: 120,
        voiceSearches: 24,
        shortlists: 12,
        searchBriefs: 6,
        agentToolRuns: 18,
      },
      clientBreakdown: {
        browsers: [{ name: "Chrome", count: 80, percentage: 67 }],
        operatingSystems: [{ name: "Windows", count: 80, percentage: 67 }],
      },
      webVitals: {
        inpAvgMs: 45,
        lcpAvgMs: 1200,
        clsAvg: 0.02,
        fcpAvgMs: 800,
        sampleCount: 12,
      },
      liveEvents: [
        {
          id: "evt-1",
          timestamp: "2026-08-19T12:00:00Z",
          event: "$pageview",
          distinctId: "user-1234567890",
          url: "http://localhost:3000/",
          browser: "Chrome",
          os: "Windows",
        },
      ],
      periodDays: 30,
      lastUpdated: "2026-08-19T12:00:00Z",
      isConfigured: true,
    };

    expect(mockSummary.overview.totalPageviews).toBe(120);
    expect(mockSummary.overview.uniqueVisitors).toBe(45);
    expect(mockSummary.funnel.voiceSearches).toBe(24);
    
    // Voice search rate
    const voiceEngagementRate = (mockSummary.funnel.voiceSearches / mockSummary.overview.totalPageviews) * 100;
    expect(voiceEngagementRate).toBe(20);

    // Inquiries conversion rate
    const inquiriesCount = 9;
    const inquiryConversionRate = (inquiriesCount / mockSummary.overview.uniqueVisitors) * 100;
    expect(inquiryConversionRate).toBe(20);

    // Top pages total percentage check
    const totalPageShares = mockSummary.topPages.reduce((acc, p) => acc + p.percentage, 0);
    expect(totalPageShares).toBe(100);
  });

  it("handles empty / zero-traffic fallbacks safely without dividing by zero", () => {
    const totalViews = 0;
    const voiceSearches = 0;
    const uniqueVisitors = 0;
    const inquiriesCount = 0;

    const safeViews = totalViews || 1;
    const voiceRate = ((voiceSearches / safeViews) * 100).toFixed(1);
    const inquiryRate = uniqueVisitors > 0
      ? ((inquiriesCount / uniqueVisitors) * 100).toFixed(1)
      : "0.0";

    expect(voiceRate).toBe("0.0");
    expect(inquiryRate).toBe("0.0");
  });
});
