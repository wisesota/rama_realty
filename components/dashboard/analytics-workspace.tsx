"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Compass,
  Cpu,
  ExternalLink,
  Eye,
  MessageSquareText,
  Mic,
  MousePointerClick,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AnalyticsSummary } from "@/lib/posthog/analytics";
import {
  calculateInquiryConversionRate,
  calculateShortlistRate,
  calculateVoiceEngagementRate,
} from "@/lib/posthog/metrics";

type AnalyticsWorkspaceProps = {
  data: AnalyticsSummary;
  inquiriesCount: number;
  catalogCount: number;
};

const DUBAI_TIME_ZONE = "Asia/Dubai";

function formatDubaiTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeStyle: "short",
      timeZone: DUBAI_TIME_ZONE,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function formatDubaiDateTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "short",
      timeStyle: "medium",
      timeZone: DUBAI_TIME_ZONE,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

function formatDubaiDate(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      month: "short",
      day: "numeric",
      timeZone: DUBAI_TIME_ZONE,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function AnalyticsWorkspace({ data, inquiriesCount, catalogCount }: AnalyticsWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"overview" | "funnel" | "pages" | "tech" | "live">("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const currentPeriod = data.periodDays;

  function setPeriod(days: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", days.toString());
    router.push(`/dashboard/analytics?${params.toString()}`);
  }

  function refresh() {
    setIsRefreshing(true);
    router.refresh();
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  }

  // Calculate funnel conversions via pure metric functions
  const totalViews = data.overview.totalPageviews;
  const voiceRate = calculateVoiceEngagementRate(data.funnel.voiceSearches, totalViews);
  const shortlistRate = calculateShortlistRate(data.funnel.shortlists, totalViews);
  const inquiryConversionRate = calculateInquiryConversionRate(inquiriesCount, data.overview.uniqueVisitors);

  const voiceBarPercent = totalViews > 0 ? Math.min(100, (data.funnel.voiceSearches / totalViews) * 100) : 0;
  const shortlistBarPercent = totalViews > 0 ? Math.min(100, (data.funnel.shortlists / totalViews) * 100) : 0;

  // Daily trends max for bar scaling
  const maxDailyViews = Math.max(...data.dailyTrends.map((d) => d.pageviews), 1);

  const posthogUrl = `${(data.projectUrl || "https://eu.posthog.com").replace(/\/$/, "")}/project/${
    data.projectId || "252521"
  }`;

  return (
    <div className="ops-analytics-workspace">
      {/* Top Controls Bar */}
      <header className="ops-analytics-toolbar">
        <div className="ops-analytics-tabs" role="tablist" aria-label="Analytics sections">
          <button
            type="button"
            role="tab"
            id="tab-overview"
            aria-controls="panel-overview"
            aria-selected={activeTab === "overview"}
            className="ops-analytics-tab-btn"
            data-active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 aria-hidden="true" />
            <span>Overview & Trends</span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-funnel"
            aria-controls="panel-funnel"
            aria-selected={activeTab === "funnel"}
            className="ops-analytics-tab-btn"
            data-active={activeTab === "funnel"}
            onClick={() => setActiveTab("funnel")}
          >
            <Compass aria-hidden="true" />
            <span>Discovery Funnel</span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-pages"
            aria-controls="panel-pages"
            aria-selected={activeTab === "pages"}
            className="ops-analytics-tab-btn"
            data-active={activeTab === "pages"}
            onClick={() => setActiveTab("pages")}
          >
            <Eye aria-hidden="true" />
            <span>Top Routes</span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-tech"
            aria-controls="panel-tech"
            aria-selected={activeTab === "tech"}
            className="ops-analytics-tab-btn"
            data-active={activeTab === "tech"}
            onClick={() => setActiveTab("tech")}
          >
            <Cpu aria-hidden="true" />
            <span>Clients & Vitals</span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-live"
            aria-controls="panel-live"
            aria-selected={activeTab === "live"}
            className="ops-analytics-tab-btn"
            data-active={activeTab === "live"}
            onClick={() => setActiveTab("live")}
          >
            <Activity aria-hidden="true" />
            <span>Live Stream</span>
          </button>
        </div>

        <div className="ops-analytics-actions">
          <div className="ops-period-picker" role="group" aria-label="Time window selection">
            <button
              type="button"
              className="ops-period-btn"
              data-active={currentPeriod === 7}
              onClick={() => setPeriod(7)}
            >
              7D
            </button>
            <button
              type="button"
              className="ops-period-btn"
              data-active={currentPeriod === 14}
              onClick={() => setPeriod(14)}
            >
              14D
            </button>
            <button
              type="button"
              className="ops-period-btn"
              data-active={currentPeriod === 30}
              onClick={() => setPeriod(30)}
            >
              30D
            </button>
            <button
              type="button"
              className="ops-period-btn"
              data-active={currentPeriod === 90}
              onClick={() => setPeriod(90)}
            >
              90D
            </button>
          </div>

          <button
            type="button"
            className="ops-refresh-btn"
            aria-label="Refresh telemetry data"
            onClick={refresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={isRefreshing ? "ops-spin" : ""} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* PostHog Connection Status Banner */}
      <aside className="ops-analytics-status-bar">
        <div className="ops-status-indicator">
          {data.hasErrors ? (
            <>
              <AlertTriangle className="ops-warn-icon" aria-hidden="true" />
              <strong>PostHog Telemetry Partially Degraded</strong>
              <small>Some HogQL subqueries encountered an error or timed out.</small>
            </>
          ) : data.isConfigured ? (
            <>
              <span className="ops-pulse-dot" />
              <strong>PostHog Telemetry Pipeline Active</strong>
              <small>HogQL Cluster · Project #{data.projectId || "252521"}</small>
            </>
          ) : (
            <>
              <AlertTriangle className="ops-warn-icon" aria-hidden="true" />
              <strong>PostHog Not Configured</strong>
              <small>Add POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID to .env.local</small>
            </>
          )}
        </div>
        <div className="ops-status-links">
          <time dateTime={data.lastUpdated}>Updated {formatDubaiTime(data.lastUpdated)} GST</time>
          {data.isConfigured && (
            <a
              href={posthogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ops-external-link"
            >
              <span>PostHog Project</span>
              <ExternalLink aria-hidden="true" />
            </a>
          )}
        </div>
      </aside>

      {/* Main KPI Cards Grid */}
      <section className="ops-analytics-kpi-grid" aria-label="Key performance indicators">
        <article className="ops-kpi-card">
          <header>
            <small>Audience Traffic</small>
            <span className="ops-kpi-icon" data-tone="blue">
              <Eye aria-hidden="true" />
            </span>
          </header>
          <div className="ops-kpi-value">{data.overview.totalPageviews.toLocaleString()}</div>
          <footer>
            <span>{data.overview.uniqueVisitors.toLocaleString()} unique visitors</span>
            <em>~{data.overview.averageDailyViews}/day</em>
          </footer>
        </article>

        <article className="ops-kpi-card">
          <header>
            <small>Voice & Discovery</small>
            <span className="ops-kpi-icon" data-tone="sand">
              <Mic aria-hidden="true" />
            </span>
          </header>
          <div className="ops-kpi-value">{data.funnel.voiceSearches.toLocaleString()}</div>
          <footer>
            <span>{data.funnel.searchBriefs} briefs created</span>
            <em>{voiceRate}% engagement</em>
          </footer>
        </article>

        <article className="ops-kpi-card">
          <header>
            <small>Advisor Conversions</small>
            <span className="ops-kpi-icon" data-tone="green">
              <MessageSquareText aria-hidden="true" />
            </span>
          </header>
          <div className="ops-kpi-value">{inquiriesCount}</div>
          <footer>
            <span>{inquiryConversionRate}% conversion rate</span>
            <Link href="/dashboard/inquiries">View queue →</Link>
          </footer>
        </article>

        <article className="ops-kpi-card">
          <header>
            <small>Interaction Quality</small>
            <span className="ops-kpi-icon" data-tone="neutral">
              <MousePointerClick aria-hidden="true" />
            </span>
          </header>
          <div className="ops-kpi-value">{data.overview.deadClicks}</div>
          <footer>
            <span>Dead clicks recorded</span>
            <em>{data.overview.deadClicks === 0 ? "Optimal UI" : "Friction alert"}</em>
          </footer>
        </article>
      </section>

      {/* Tab: Overview & Trends */}
      {activeTab === "overview" && (
        <div
          id="panel-overview"
          role="tabpanel"
          aria-labelledby="tab-overview"
          className="ops-analytics-section-stack"
        >
          {/* Daily Views Bar Chart */}
          <section className="ops-analytics-panel" aria-labelledby="traffic-trend-heading">
            <header className="ops-panel-header">
              <div>
                <h3 id="traffic-trend-heading">Daily Traffic & Visitor Trajectory</h3>
                <p>Pageviews and unique visitors over the selected {currentPeriod}-day window.</p>
              </div>
              <div className="ops-chart-legend">
                <span className="ops-legend-item">
                  <i className="ops-legend-dot ops-dot-views" /> Views
                </span>
                <span className="ops-legend-item">
                  <i className="ops-legend-dot ops-dot-visitors" /> Visitors
                </span>
              </div>
            </header>

            {data.dailyTrends.length > 0 ? (
              <div className="ops-trend-chart-wrapper">
                <div className="ops-trend-bars">
                  {data.dailyTrends.map((point) => {
                    const heightPercent = Math.max(8, Math.round((point.pageviews / maxDailyViews) * 100));
                    const formattedDate = formatDubaiDate(point.date);

                    return (
                      <div
                        key={point.date}
                        className="ops-trend-bar-col"
                        title={`${formattedDate}: ${point.pageviews} views (${point.visitors} visitors)`}
                      >
                        <div className="ops-trend-bar-track">
                          <div className="ops-trend-bar-fill" style={{ height: `${heightPercent}%` }}>
                            <span className="ops-bar-tooltip">
                              <strong>{point.pageviews} views</strong>
                              <small>{point.visitors} visitors</small>
                            </span>
                          </div>
                        </div>
                        <span className="ops-trend-bar-label">{formattedDate}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="ops-panel-empty">
                <BarChart3 aria-hidden="true" />
                <strong>No pageview telemetry in this date range.</strong>
                <span>Explore the residence catalog to record buyer discovery activity.</span>
              </div>
            )}
          </section>

          {/* Grid of Funnel + Top Pages previews */}
          <div className="ops-analytics-twin-grid">
            <section className="ops-analytics-panel">
              <header className="ops-panel-header">
                <div>
                  <h3>Discovery Funnel Summary</h3>
                  <p>How buyers move from browsing to advisor handoff.</p>
                </div>
                <button type="button" className="ops-panel-link" onClick={() => setActiveTab("funnel")}>
                  Full funnel →
                </button>
              </header>
              <div className="ops-funnel-compact">
                <div className="ops-funnel-step">
                  <div className="ops-funnel-step-head">
                    <span>1. Catalog Exploration ({catalogCount} residences)</span>
                    <strong>{data.overview.totalPageviews}</strong>
                  </div>
                  <div className="ops-funnel-bar">
                    <span style={{ width: "100%" }} />
                  </div>
                </div>

                <div className="ops-funnel-step">
                  <div className="ops-funnel-step-head">
                    <span>2. Voice Search Initiated</span>
                    <strong>{data.funnel.voiceSearches}</strong>
                  </div>
                  <div className="ops-funnel-bar">
                    <span style={{ width: `${voiceBarPercent}%` }} />
                  </div>
                </div>

                <div className="ops-funnel-step">
                  <div className="ops-funnel-step-head">
                    <span>3. Residence Shortlisted</span>
                    <strong>{data.funnel.shortlists}</strong>
                  </div>
                  <div className="ops-funnel-bar">
                    <span style={{ width: `${shortlistBarPercent}%` }} />
                  </div>
                </div>

                <div className="ops-funnel-step">
                  <div className="ops-funnel-step-head">
                    <span>4. Advisor Handoff Inquiries</span>
                    <strong>{inquiriesCount}</strong>
                  </div>
                  <div className="ops-funnel-bar ops-bar-success">
                    <span
                      style={{
                        width: `${Math.min(
                          100,
                          (inquiriesCount / Math.max(1, data.overview.uniqueVisitors)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="ops-analytics-panel">
              <header className="ops-panel-header">
                <div>
                  <h3>Top Visited Routes</h3>
                  <p>Most active residences and search endpoints.</p>
                </div>
                <button type="button" className="ops-panel-link" onClick={() => setActiveTab("pages")}>
                  All routes →
                </button>
              </header>

              {data.topPages.length > 0 ? (
                <div className="ops-top-routes-list">
                  {data.topPages.slice(0, 5).map((page, idx) => (
                    <div key={`preview-route-${page.path}-${idx}`} className="ops-route-row">
                      <div className="ops-route-info">
                        <code>{page.path || "/"}</code>
                        <small>{page.visitors} unique visitors</small>
                      </div>
                      <div className="ops-route-stats">
                        <strong>{page.views} views</strong>
                        <span className="ops-route-share">{page.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ops-panel-empty">
                  <Eye aria-hidden="true" />
                  <strong>No page visits recorded yet.</strong>
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Tab: Discovery Funnel */}
      {activeTab === "funnel" && (
        <section
          id="panel-funnel"
          role="tabpanel"
          aria-labelledby="tab-funnel"
          className="ops-analytics-panel"
        >
          <header className="ops-panel-header">
            <div>
              <h3 id="funnel-full-heading">Comprehensive Buyer Discovery & Conversion Funnel</h3>
              <p>Telemetry mapping the journey from anonymous visits to qualified advisor handoffs.</p>
            </div>
          </header>

          <div className="ops-funnel-cards-grid">
            <article className="ops-funnel-card">
              <header>
                <span className="ops-step-badge">Step 1</span>
                <h4>Discovery Visits</h4>
              </header>
              <div className="ops-funnel-num">{data.overview.totalPageviews}</div>
              <p>Total pageviews across the Rama web experience.</p>
              <div className="ops-funnel-meta">
                <span>{data.overview.uniqueVisitors} unique buyers</span>
                <em>Baseline 100%</em>
              </div>
            </article>

            <article className="ops-funnel-card">
              <header>
                <span className="ops-step-badge">Step 2</span>
                <h4>Voice Searches</h4>
              </header>
              <div className="ops-funnel-num">{data.funnel.voiceSearches}</div>
              <p>Natural speech discovery sessions initiated by buyers.</p>
              <div className="ops-funnel-meta">
                <span>{voiceRate}% engagement</span>
                <em>Live speech model</em>
              </div>
            </article>

            <article className="ops-funnel-card">
              <header>
                <span className="ops-step-badge">Step 3</span>
                <h4>Shortlisted Homes</h4>
              </header>
              <div className="ops-funnel-num">{data.funnel.shortlists}</div>
              <p>Residences saved to buyer decision boards.</p>
              <div className="ops-funnel-meta">
                <span>{shortlistRate}% shortlist rate</span>
                <em>Buyer intent</em>
              </div>
            </article>

            <article className="ops-funnel-card ops-card-highlight">
              <header>
                <span className="ops-step-badge">Step 4</span>
                <h4>Advisor Inquiries</h4>
              </header>
              <div className="ops-funnel-num">{inquiriesCount}</div>
              <p>Consented buyer requests in the CRM operations queue.</p>
              <div className="ops-funnel-meta">
                <span>{inquiryConversionRate}% buyer conversion</span>
                <Link href="/dashboard/inquiries">Open queue →</Link>
              </div>
            </article>
          </div>

          <div className="ops-funnel-details-banner">
            <Sparkles aria-hidden="true" />
            <div>
              <strong>Governed AI Search Telemetry</strong>
              <span>
                Rama tracks tool executions ({data.funnel.agentToolRuns} tool runs) and search briefs (
                {data.funnel.searchBriefs} briefs) with strict consent enforcement and privacy-first telemetry architecture.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Tab: Top Routes */}
      {activeTab === "pages" && (
        <section
          id="panel-pages"
          role="tabpanel"
          aria-labelledby="tab-pages"
          className="ops-analytics-panel"
        >
          <header className="ops-panel-header">
            <div>
              <h3 id="pages-table-heading">All Explored Routes & Path Breakdown</h3>
              <p>Detailed breakdown of URL traffic, visitor retention, and popularity.</p>
            </div>
          </header>

          {data.topPages.length > 0 ? (
            <div className="ops-table-container">
              <table className="ops-analytics-table">
                <thead>
                  <tr>
                    <th scope="col">Route Path</th>
                    <th scope="col">Pageviews</th>
                    <th scope="col">Unique Visitors</th>
                    <th scope="col">Share of Traffic</th>
                    <th scope="col">Full URL</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((page, i) => (
                    <tr key={`table-route-${page.path}-${i}`}>
                      <td>
                        <strong className="ops-route-path">{page.path || "/"}</strong>
                      </td>
                      <td>{page.views.toLocaleString()}</td>
                      <td>{page.visitors.toLocaleString()}</td>
                      <td>
                        <div className="ops-table-bar-cell">
                          <span>{page.percentage}%</span>
                          <div className="ops-table-bar-track">
                            <span style={{ width: `${page.percentage}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <small className="ops-truncate-url">{page.url || page.path}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ops-panel-empty">
              <Eye aria-hidden="true" />
              <strong>No route visits recorded.</strong>
            </div>
          )}
        </section>
      )}

      {/* Tab: Clients & Web Vitals */}
      {activeTab === "tech" && (
        <div
          id="panel-tech"
          role="tabpanel"
          aria-labelledby="tab-tech"
          className="ops-analytics-twin-grid"
        >
          {/* Web Vitals Panel */}
          <section className="ops-analytics-panel">
            <header className="ops-panel-header">
              <div>
                <h3>Core Web Vitals & Experience</h3>
                <p>Google UX performance signals captured via posthog-js.</p>
              </div>
            </header>

            <div className="ops-vitals-grid">
              <div className="ops-vital-box">
                <small>Largest Contentful Paint (LCP)</small>
                <strong>
                  {data.webVitals.lcpAvgMs != null ? `${(data.webVitals.lcpAvgMs / 1000).toFixed(2)}s` : "—"}
                </strong>
                <span
                  data-status={
                    data.webVitals.lcpAvgMs && data.webVitals.lcpAvgMs < 2500 ? "good" : "evaluating"
                  }
                >
                  {data.webVitals.lcpAvgMs && data.webVitals.lcpAvgMs < 2500 ? "Good (< 2.5s)" : "Standard"}
                </span>
              </div>

              <div className="ops-vital-box">
                <small>Interaction to Next Paint (INP)</small>
                <strong>{data.webVitals.inpAvgMs != null ? `${data.webVitals.inpAvgMs}ms` : "—"}</strong>
                <span
                  data-status={
                    data.webVitals.inpAvgMs && data.webVitals.inpAvgMs < 200 ? "good" : "evaluating"
                  }
                >
                  {data.webVitals.inpAvgMs && data.webVitals.inpAvgMs < 200 ? "Good (< 200ms)" : "Standard"}
                </span>
              </div>

              <div className="ops-vital-box">
                <small>Cumulative Layout Shift (CLS)</small>
                <strong>{data.webVitals.clsAvg != null ? data.webVitals.clsAvg : "0.00"}</strong>
                <span
                  data-status={
                    data.webVitals.clsAvg != null && data.webVitals.clsAvg < 0.1 ? "good" : "evaluating"
                  }
                >
                  {data.webVitals.clsAvg != null && data.webVitals.clsAvg < 0.1
                    ? "Good (< 0.1)"
                    : "Standard"}
                </span>
              </div>

              <div className="ops-vital-box">
                <small>First Contentful Paint (FCP)</small>
                <strong>
                  {data.webVitals.fcpAvgMs != null ? `${(data.webVitals.fcpAvgMs / 1000).toFixed(2)}s` : "—"}
                </strong>
                <span
                  data-status={
                    data.webVitals.fcpAvgMs && data.webVitals.fcpAvgMs < 1800 ? "good" : "evaluating"
                  }
                >
                  {data.webVitals.fcpAvgMs && data.webVitals.fcpAvgMs < 1800 ? "Good (< 1.8s)" : "Standard"}
                </span>
              </div>
            </div>

            <footer className="ops-panel-footnote">
              <Zap aria-hidden="true" />
              <span>Captured across {data.webVitals.sampleCount} live browser telemetry sessions.</span>
            </footer>
          </section>

          {/* Client Environments Panel */}
          <section className="ops-analytics-panel">
            <header className="ops-panel-header">
              <div>
                <h3>Client Environments</h3>
                <p>Browsers and operating systems used by visiting buyers.</p>
              </div>
            </header>

            <div className="ops-tech-breakdown-stack">
              <div>
                <h4>Browsers</h4>
                <div className="ops-env-bars">
                  {data.clientBreakdown.browsers.map((b, idx) => (
                    <div key={`browser-${b.name}-${idx}`} className="ops-env-row">
                      <span>{b.name}</span>
                      <div className="ops-env-track">
                        <span style={{ width: `${b.percentage}%` }} />
                      </div>
                      <strong>
                        {b.count} ({b.percentage}%)
                      </strong>
                    </div>
                  ))}
                  {data.clientBreakdown.browsers.length === 0 && (
                    <small>No browser telemetry logged yet.</small>
                  )}
                </div>
              </div>

              <div>
                <h4>Operating Systems</h4>
                <div className="ops-env-bars">
                  {data.clientBreakdown.operatingSystems.map((os, idx) => (
                    <div key={`os-${os.name}-${idx}`} className="ops-env-row">
                      <span>{os.name}</span>
                      <div className="ops-env-track">
                        <span style={{ width: `${os.percentage}%` }} />
                      </div>
                      <strong>
                        {os.count} ({os.percentage}%)
                      </strong>
                    </div>
                  ))}
                  {data.clientBreakdown.operatingSystems.length === 0 && (
                    <small>No OS telemetry logged yet.</small>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Tab: Live Stream */}
      {activeTab === "live" && (
        <section
          id="panel-live"
          role="tabpanel"
          aria-labelledby="tab-live"
          className="ops-analytics-panel"
        >
          <header className="ops-panel-header">
            <div>
              <h3 id="live-stream-heading">Real-Time Ingestion Stream</h3>
              <p>Most recent raw events delivered through the PostHog ingestion pipeline.</p>
            </div>
            <span className="ops-live-badge">
              <i className="ops-pulse-dot" /> Live Ingestion
            </span>
          </header>

          {data.liveEvents.length > 0 ? (
            <div className="ops-table-container">
              <table className="ops-analytics-table">
                <thead>
                  <tr>
                    <th scope="col">Timestamp (GST)</th>
                    <th scope="col">Event Type</th>
                    <th scope="col">URL / Context</th>
                    <th scope="col">Client</th>
                    <th scope="col">Anonymous Distinct ID</th>
                  </tr>
                </thead>
                <tbody>
                  {data.liveEvents.map((event, idx) => (
                    <tr key={`live-event-${event.id}-${idx}`}>
                      <td>
                        <time dateTime={event.timestamp}>{formatDubaiDateTime(event.timestamp)}</time>
                      </td>
                      <td>
                        <span className="ops-event-chip" data-event={event.event}>
                          {event.event}
                        </span>
                      </td>
                      <td>
                        <small className="ops-truncate-url">{event.url || "—"}</small>
                      </td>
                      <td>
                        <small>{event.browser ? `${event.browser} · ${event.os || ""}` : "Client"}</small>
                      </td>
                      <td>
                        <code>{event.distinctId.slice(0, 16)}…</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ops-panel-empty">
              <Activity aria-hidden="true" />
              <strong>No live events received yet.</strong>
              <span>Events will stream in as buyers interact with the platform.</span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
