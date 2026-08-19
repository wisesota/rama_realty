import "server-only";

export type AnalyticsSummary = {
  overview: {
    totalPageviews: number;
    uniqueVisitors: number;
    deadClicks: number;
    totalEvents: number;
    webVitalsEvents: number;
    averageDailyViews: number;
  };
  dailyTrends: Array<{
    date: string;
    pageviews: number;
    visitors: number;
  }>;
  topPages: Array<{
    path: string;
    url: string;
    views: number;
    visitors: number;
    percentage: number;
  }>;
  funnel: {
    pageviews: number;
    voiceSearches: number;
    shortlists: number;
    searchBriefs: number;
    agentToolRuns: number;
  };
  clientBreakdown: {
    browsers: Array<{ name: string; count: number; percentage: number }>;
    operatingSystems: Array<{ name: string; count: number; percentage: number }>;
  };
  webVitals: {
    inpAvgMs: number | null;
    lcpAvgMs: number | null;
    clsAvg: number | null;
    fcpAvgMs: number | null;
    sampleCount: number;
  };
  liveEvents: Array<{
    id: string;
    timestamp: string;
    event: string;
    distinctId: string;
    url: string | null;
    browser: string | null;
    os: string | null;
  }>;
  periodDays: number;
  lastUpdated: string;
  isConfigured: boolean;
};

type HogQLResponse = {
  results?: Array<Array<unknown>>;
  error?: string | null;
};

async function executeHogQL(sql: string): Promise<HogQLResponse> {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
  const host = process.env.POSTHOG_HOST?.trim() || "https://eu.posthog.com";

  if (!apiKey || !projectId) {
    return { results: [], error: "PostHog server credentials not configured" };
  }

  try {
    const endpoint = `${host.replace(/\/$/, "")}/api/projects/${projectId}/query/`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: sql,
        },
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`PostHog query failed [${response.status}]:`, errText);
      return { results: [], error: `PostHog API returned status ${response.status}` };
    }

    const data = (await response.json()) as HogQLResponse;
    return data;
  } catch (error) {
    console.error("PostHog execution error:", error);
    return { results: [], error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function fetchPostHogAnalytics(periodDays: number = 30): Promise<AnalyticsSummary> {
  const safePeriod = Math.max(1, Math.min(periodDays, 90));
  const isConfigured = Boolean(
    process.env.POSTHOG_PERSONAL_API_KEY?.trim() && process.env.POSTHOG_PROJECT_ID?.trim()
  );

  if (!isConfigured) {
    return getFallbackAnalytics(safePeriod);
  }

  try {
    const [
      overviewRes,
      dailyTrendsRes,
      topPagesRes,
      funnelRes,
      browsersRes,
      osRes,
      webVitalsRes,
      liveRes,
    ] = await Promise.all([
      // 1. Overall counts
      executeHogQL(`
        SELECT 
          event, 
          count() as total_events, 
          count(distinct distinct_id) as unique_users 
        FROM events 
        WHERE timestamp > now() - interval ${safePeriod} day 
        GROUP BY event
      `),
      // 2. Daily trends
      executeHogQL(`
        SELECT 
          toStartOfDay(timestamp) as day, 
          count() as pageviews, 
          count(distinct distinct_id) as visitors 
        FROM events 
        WHERE event = '$pageview' AND timestamp > now() - interval ${safePeriod} day 
        GROUP BY day 
        ORDER BY day ASC
      `),
      // 3. Top pages
      executeHogQL(`
        SELECT 
          properties.$pathname as path,
          any(properties.$current_url) as sample_url,
          count() as views, 
          count(distinct distinct_id) as unique_visitors 
        FROM events 
        WHERE event = '$pageview' AND timestamp > now() - interval ${safePeriod} day 
        GROUP BY path 
        ORDER BY views DESC 
        LIMIT 10
      `),
      // 4. Custom discovery funnel
      executeHogQL(`
        SELECT 
          event, 
          count() as total, 
          count(distinct distinct_id) as users 
        FROM events 
        WHERE event IN ('$pageview', 'Voice Search Initiated', 'Property Shortlisted', 'Search Brief Created', 'Agent Tool Used')
          AND timestamp > now() - interval ${safePeriod} day 
        GROUP BY event
      `),
      // 5. Browser breakdown
      executeHogQL(`
        SELECT 
          properties.$browser as browser, 
          count() as count 
        FROM events 
        WHERE event = '$pageview' AND timestamp > now() - interval ${safePeriod} day AND isNotNull(properties.$browser)
        GROUP BY browser 
        ORDER BY count DESC 
        LIMIT 6
      `),
      // 6. OS breakdown
      executeHogQL(`
        SELECT 
          properties.$os as os, 
          count() as count 
        FROM events 
        WHERE event = '$pageview' AND timestamp > now() - interval ${safePeriod} day AND isNotNull(properties.$os)
        GROUP BY os 
        ORDER BY count DESC 
        LIMIT 6
      `),
      // 7. Web Vitals
      executeHogQL(`
        SELECT 
          avg(toFloat(properties.$web_vitals_INP_value)) as avg_inp,
          avg(toFloat(properties.$web_vitals_LCP_value)) as avg_lcp,
          avg(toFloat(properties.$web_vitals_CLS_value)) as avg_cls,
          avg(toFloat(properties.$web_vitals_FCP_value)) as avg_fcp,
          count() as samples
        FROM events 
        WHERE event = '$web_vitals' AND timestamp > now() - interval ${safePeriod} day
      `),
      // 8. Live activity stream
      executeHogQL(`
        SELECT 
          uuid,
          timestamp, 
          event, 
          distinct_id, 
          properties.$current_url as url,
          properties.$browser as browser,
          properties.$os as os
        FROM events 
        ORDER BY timestamp DESC 
        LIMIT 15
      `),
    ]);

    // Parse overview
    let totalPageviews = 0;
    let totalEvents = 0;
    let deadClicks = 0;
    let webVitalsEvents = 0;

    for (const row of overviewRes.results || []) {
      const eventName = String(row[0]);
      const count = Number(row[1]) || 0;
      totalEvents += count;
      if (eventName === "$pageview") totalPageviews = count;
      if (eventName === "$dead_click") deadClicks = count;
      if (eventName === "$web_vitals") webVitalsEvents = count;
    }

    // Parse daily trends
    const dailyTrends: AnalyticsSummary["dailyTrends"] = (dailyTrendsRes.results || []).map(
      (row) => ({
        date: String(row[0] || "").split("T")[0],
        pageviews: Number(row[1]) || 0,
        visitors: Number(row[2]) || 0,
      })
    );

    // Calculate unique visitors across daily trends or fallback
    const uniqueVisitors = Math.max(
      dailyTrends.reduce((max, d) => Math.max(max, d.visitors), 0),
      totalPageviews > 0 ? 1 : 0
    );

    // Parse top pages
    const topPages: AnalyticsSummary["topPages"] = (topPagesRes.results || []).map((row) => {
      const path = String(row[0] || "/");
      const sampleUrl = String(row[1] || path);
      const views = Number(row[2]) || 0;
      const visitors = Number(row[3]) || 0;
      const percentage = totalPageviews > 0 ? Math.round((views / totalPageviews) * 100) : 0;

      return {
        url: sampleUrl,
        path: path || "/",
        views,
        visitors,
        percentage,
      };
    });

    // Parse funnel
    const funnelMap: Record<string, number> = {};
    for (const row of funnelRes.results || []) {
      funnelMap[String(row[0])] = Number(row[1]) || 0;
    }

    const funnel = {
      pageviews: funnelMap["$pageview"] || totalPageviews,
      voiceSearches: funnelMap["Voice Search Initiated"] || 0,
      shortlists: funnelMap["Property Shortlisted"] || 0,
      searchBriefs: funnelMap["Search Brief Created"] || 0,
      agentToolRuns: funnelMap["Agent Tool Used"] || 0,
    };

    // Parse browsers
    const totalBrowserCount = (browsersRes.results || []).reduce(
      (acc, row) => acc + (Number(row[1]) || 0),
      0
    );
    const browsers = (browsersRes.results || []).map((row) => {
      const name = String(row[0] || "Unknown");
      const count = Number(row[1]) || 0;
      return {
        name,
        count,
        percentage: totalBrowserCount > 0 ? Math.round((count / totalBrowserCount) * 100) : 0,
      };
    });

    // Parse operating systems
    const totalOsCount = (osRes.results || []).reduce(
      (acc, row) => acc + (Number(row[1]) || 0),
      0
    );
    const operatingSystems = (osRes.results || []).map((row) => {
      const name = String(row[0] || "Unknown");
      const count = Number(row[1]) || 0;
      return {
        name,
        count,
        percentage: totalOsCount > 0 ? Math.round((count / totalOsCount) * 100) : 0,
      };
    });

    // Parse Web Vitals
    const vitalsRow = webVitalsRes.results?.[0];
    const webVitals: AnalyticsSummary["webVitals"] = {
      inpAvgMs: vitalsRow?.[0] != null ? Math.round(Number(vitalsRow[0])) : null,
      lcpAvgMs: vitalsRow?.[1] != null ? Math.round(Number(vitalsRow[1])) : null,
      clsAvg: vitalsRow?.[2] != null ? Number(Number(vitalsRow[2]).toFixed(3)) : null,
      fcpAvgMs: vitalsRow?.[3] != null ? Math.round(Number(vitalsRow[3])) : null,
      sampleCount: Number(vitalsRow?.[4]) || webVitalsEvents,
    };

    // Parse live events
    const liveEvents: AnalyticsSummary["liveEvents"] = (liveRes.results || []).map((row) => ({
      id: String(row[0] || Math.random().toString(36).substring(2)),
      timestamp: String(row[1] || new Date().toISOString()),
      event: String(row[2] || "event"),
      distinctId: String(row[3] || "anonymous"),
      url: row[4] ? String(row[4]) : null,
      browser: row[5] ? String(row[5]) : null,
      os: row[6] ? String(row[6]) : null,
    }));

    return {
      overview: {
        totalPageviews,
        uniqueVisitors,
        deadClicks,
        totalEvents,
        webVitalsEvents,
        averageDailyViews:
          dailyTrends.length > 0 ? Math.round(totalPageviews / dailyTrends.length) : totalPageviews,
      },
      dailyTrends,
      topPages,
      funnel,
      clientBreakdown: {
        browsers,
        operatingSystems,
      },
      webVitals,
      liveEvents,
      periodDays: safePeriod,
      lastUpdated: new Date().toISOString(),
      isConfigured: true,
    };
  } catch (err) {
    console.error("Failed to parse PostHog response:", err);
    return getFallbackAnalytics(safePeriod);
  }
}

function getFallbackAnalytics(periodDays: number): AnalyticsSummary {
  return {
    overview: {
      totalPageviews: 0,
      uniqueVisitors: 0,
      deadClicks: 0,
      totalEvents: 0,
      webVitalsEvents: 0,
      averageDailyViews: 0,
    },
    dailyTrends: [],
    topPages: [],
    funnel: {
      pageviews: 0,
      voiceSearches: 0,
      shortlists: 0,
      searchBriefs: 0,
      agentToolRuns: 0,
    },
    clientBreakdown: {
      browsers: [],
      operatingSystems: [],
    },
    webVitals: {
      inpAvgMs: null,
      lcpAvgMs: null,
      clsAvg: null,
      fcpAvgMs: null,
      sampleCount: 0,
    },
    liveEvents: [],
    periodDays,
    lastUpdated: new Date().toISOString(),
    isConfigured: false,
  };
}
