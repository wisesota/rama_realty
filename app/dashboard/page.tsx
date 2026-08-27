import Link from "next/link";
import { ArrowRight, Bot, Building2, CheckCircle2, Clock3, MessageSquareText, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageHeader, SectionHeader } from "@/components/dashboard/page-header";
import { requireStaffContext } from "@/lib/dashboard/dal";
import { isOlderThanDays } from "@/lib/time";

export default async function DashboardPage() {
  const { supabase, staff, email } = await requireStaffContext();
  const [propertyResult, inquiryResult, openInquiryCountResult, recentAudit, recentTools] = await Promise.all([
    supabase.from("properties").select("id, publication_status, source_updated_at").eq("organization_id", staff.organizationId),
    supabase.from("inquiries").select("id, full_name, status, created_at, property_id, properties(name)").eq("organization_id", staff.organizationId).order("created_at", { ascending: false }).limit(5),
    supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("organization_id", staff.organizationId).in("status", ["new", "qualified", "contacted"]),
    supabase.from("audit_events").select("id, action, entity_type, entity_id, created_at").eq("organization_id", staff.organizationId).order("created_at", { ascending: false }).limit(5),
    supabase.from("tool_runs").select("id, tool_name, status, duration_ms, created_at, correlation_id").eq("organization_id", staff.organizationId).order("created_at", { ascending: false }).limit(5),
  ]);
  if (propertyResult.error || inquiryResult.error || recentAudit.error || recentTools.error) {
    throw new Error("The operations brief could not be loaded from the governed workspace.");
  }

  const properties = propertyResult.data ?? [];
  const inquiries = inquiryResult.data ?? [];
  const published = properties.filter((property) => property.publication_status === "published").length;
  const inReview = properties.filter((property) => property.publication_status === "in_review").length;
  const stale = properties.filter((property) => !property.source_updated_at || isOlderThanDays(property.source_updated_at, 30)).length;
  const openInquiries = openInquiryCountResult.count ?? 0;
  const readiness = properties.length ? Math.round((published / properties.length) * 100) : 0;

  return <DashboardShell staff={staff} email={email} active="overview">
    <PageHeader eyebrow="Daily brief" title="The work that needs attention." description="One view of catalog readiness, buyer handoffs, and the governed answers Rama has produced." marker={Sparkles} />

    <section className="ops-action-queue" aria-label="Action queue">
      <Link href="/dashboard/inventory?health=attention" className="focus-visible:ring-2 focus-visible:ring-[#356d8d] focus:outline-none transition-colors duration-200 motion-reduce:transition-none"><span className="ops-action-icon" data-tone="sand"><RefreshCw aria-hidden="true" /></span><span><small>Source health</small><strong>{stale} record{stale === 1 ? "" : "s"} need refresh</strong><em>{stale ? "Update evidence before publication expires." : "No source freshness blockers detected."}</em></span><ArrowRight aria-hidden="true" /></Link>
      <Link href="/dashboard/inventory?status=in_review" className="focus-visible:ring-2 focus-visible:ring-[#356d8d] focus:outline-none transition-colors duration-200 motion-reduce:transition-none"><span className="ops-action-icon" data-tone="blue"><Building2 aria-hidden="true" /></span><span><small>Publication review</small><strong>{inReview} record{inReview === 1 ? "" : "s"} waiting</strong><em>{inReview ? "Preview exactly what Rama can disclose." : "Nothing is waiting for an editor."}</em></span><ArrowRight aria-hidden="true" /></Link>
      <Link href="/dashboard/inquiries" className="focus-visible:ring-2 focus-visible:ring-[#356d8d] focus:outline-none transition-colors duration-200 motion-reduce:transition-none"><span className="ops-action-icon" data-tone="green"><MessageSquareText aria-hidden="true" /></span><span><small>Buyer follow-up</small><strong>{openInquiries} conversation{openInquiries === 1 ? "" : "s"} open</strong><em>{openInquiries ? "Continue with the complete buyer context." : "No advisor follow-ups are outstanding."}</em></span><ArrowRight aria-hidden="true" /></Link>
    </section>

    <section className="ops-readiness" aria-labelledby="readiness-title"><div><p>Catalog readiness</p><h2 id="readiness-title">{published} of {properties.length} residences available to Rama</h2><span>{properties.length ? `${inReview} in review · ${stale} source blocker${stale === 1 ? "" : "s"}` : "Add the first governed residence to begin serving live inventory."}</span></div><div className="ops-readiness-score"><strong>{readiness}%</strong><span>buyer-visible</span></div><div className="ops-readiness-track" aria-hidden="true"><span style={{ width: `${readiness}%` }} /></div><Link href="/dashboard/inventory" className="focus-visible:ring-2 focus-visible:ring-[#356d8d] focus:outline-none transition-colors duration-200 motion-reduce:transition-none">Open inventory <ArrowRight aria-hidden="true" /></Link></section>

    <div className="ops-brief-grid">
      <section className="ops-ledger-panel"><SectionHeader eyebrow="Buyer conversations" title="Advisor queue" meta={`${openInquiries} requiring follow-up`} action={<Link href="/dashboard/inquiries" className="focus-visible:ring-2 focus-visible:ring-[#356d8d] focus:outline-none transition-colors duration-200 motion-reduce:transition-none">View all <ArrowRight aria-hidden="true" /></Link>} />{inquiries.length ? <div className="ops-brief-list">{inquiries.map((inquiry) => { const property = Array.isArray(inquiry.properties) ? inquiry.properties[0] : inquiry.properties; return <Link key={inquiry.id} href="/dashboard/inquiries" className="focus-visible:ring-2 focus-visible:ring-[#356d8d] focus:outline-none transition-colors duration-200 motion-reduce:transition-none"><span className="ops-avatar" aria-hidden="true">{inquiry.full_name.slice(0,1).toUpperCase()}</span><span><strong>{inquiry.full_name}</strong><small>{property?.name ?? "Property context unavailable"}</small></span><span><i className="ops-status" data-status={inquiry.status}>{inquiry.status.replace("_", " ")}</i><small>{new Intl.DateTimeFormat("en-AE", { dateStyle: "medium" }).format(new Date(inquiry.created_at))}</small></span></Link>; })}</div> : <div className="ops-panel-empty"><MessageSquareText aria-hidden="true" /><strong>No advisor handoffs yet.</strong><span>Consented buyer conversations will arrive with their property and search context attached.</span><Link href="/" target="_blank" rel="noopener noreferrer" className="focus-visible:ring-2 focus-visible:ring-[#356d8d] focus:outline-none transition-colors duration-200 motion-reduce:transition-none">Test the buyer experience <ArrowRight aria-hidden="true" /><span className="sr-only"> in a new tab</span></Link></div>}</section>

      <section className="ops-ledger-panel"><SectionHeader eyebrow="AI activity ledger" title="What Rama has answered" meta="Source-bound tool activity" />{recentTools.data?.length ? <div className="ops-ai-ledger">{recentTools.data.map((run) => <div key={run.id}><span className="ops-action-icon" data-tone={run.status === "succeeded" ? "green" : "sand"}>{run.status === "succeeded" ? <CheckCircle2 aria-hidden="true" /> : <Bot aria-hidden="true" />}</span><span><strong>{run.tool_name.replaceAll("_", " ")}</strong><small>{run.status} · {run.duration_ms ? `${run.duration_ms} ms` : "duration pending"}</small></span><time>{new Intl.DateTimeFormat("en-AE", { timeStyle: "short" }).format(new Date(run.created_at))}</time></div>)}</div> : <div className="ops-panel-empty"><Bot aria-hidden="true" /><strong>No organization tool activity yet.</strong><span>When Rama answers from your published catalog, tool, outcome, and timing will appear here.</span><button type="button" disabled><ShieldCheck aria-hidden="true" />Governed logging active</button></div>}</section>
    </div>

    <section className="ops-audit-strip"><SectionHeader eyebrow="Governance" title="Recent controlled changes" meta="Actor and record history" />{recentAudit.data?.length ? <div className="ops-audit-list">{recentAudit.data.map((event) => <div key={event.id}><span><Clock3 aria-hidden="true" />{event.action.replaceAll(".", " / ")}</span><strong>{event.entity_type}</strong><small>{event.entity_id.slice(0, 12)}</small><time>{new Intl.DateTimeFormat("en-AE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.created_at))}</time></div>)}</div> : <div className="ops-inline-empty"><ShieldCheck aria-hidden="true" /><span><strong>No recent controlled changes.</strong><small>Publication and inquiry actions will be recorded here.</small></span></div>}</section>
  </DashboardShell>;
}
