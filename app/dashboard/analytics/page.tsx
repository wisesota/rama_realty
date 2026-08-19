import { BarChart3 } from "lucide-react";
import { AnalyticsWorkspace } from "@/components/dashboard/analytics-workspace";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireStaffContext } from "@/lib/dashboard/dal";
import { fetchPostHogAnalytics } from "@/lib/posthog/analytics";

type AnalyticsPageProps = {
  searchParams: Promise<{ period?: string }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { period: periodParam } = await searchParams;
  const parsedPeriod = parseInt(periodParam || "30", 10);
  const period = [7, 14, 30, 90].includes(parsedPeriod) ? parsedPeriod : 30;

  const { supabase, staff, email } = await requireStaffContext();

  const [analyticsData, inquiryCountResult, propertyCountResult] = await Promise.all([
    fetchPostHogAnalytics(period),
    supabase
      .from("inquiries")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", staff.organizationId),
    supabase
      .from("properties")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", staff.organizationId),
  ]);

  const inquiriesCount = inquiryCountResult.count ?? 0;
  const catalogCount = propertyCountResult.count ?? 0;

  return (
    <DashboardShell staff={staff} email={email} active="analytics">
      <PageHeader
        eyebrow="Audience & Discovery"
        title="Buyer & Platform Analytics"
        description="Live audience engagement, search brief volume, and conversion signals connected to PostHog HogQL."
        marker={BarChart3}
      />
      <AnalyticsWorkspace
        data={analyticsData}
        inquiriesCount={inquiriesCount}
        catalogCount={catalogCount}
      />
    </DashboardShell>
  );
}
