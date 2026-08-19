import { MessageSquareText } from "lucide-react";
import { ConversationsWorkspace, type InquiryRecord } from "@/components/dashboard/conversations-workspace";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireStaffContext } from "@/lib/dashboard/dal";

type InquiriesPageProps = {
  searchParams: Promise<{ view?: string; page?: string }>;
};

export default async function InquiriesPage({ searchParams }: InquiriesPageProps) {
  const filters = await searchParams;
  const page = parseInt(filters.page || "1", 10) || 1;
  const size = 100;
  const { supabase, staff, email } = await requireStaffContext();
  const { data: inquiries, error } = await supabase
    .from("inquiries")
    .select("id, full_name, email, phone, message, status, consent_at, consent_purpose, property_id, search_run_id, created_at, properties(name, location, price_aed)")
    .eq("organization_id", staff.organizationId)
    .order("created_at", { ascending: false })
    .range((page - 1) * size, page * size - 1);
  if (error) throw new Error("Buyer conversations could not be loaded.");

  const records: InquiryRecord[] = (inquiries ?? []).map((inquiry) => {
    const property = Array.isArray(inquiry.properties) ? inquiry.properties[0] : inquiry.properties;
    return {
      id: inquiry.id,
      full_name: inquiry.full_name,
      email: inquiry.email,
      phone: inquiry.phone,
      message: inquiry.message,
      status: inquiry.status,
      consent_at: inquiry.consent_at,
      consent_purpose: inquiry.consent_purpose,
      property_id: inquiry.property_id,
      search_run_id: inquiry.search_run_id,
      created_at: inquiry.created_at,
      property: property ? { name: property.name, location: property.location, price_aed: property.price_aed } : null,
    };
  });

  return (
    <DashboardShell staff={staff} email={email} active="inquiries">
      <PageHeader
        eyebrow="Buyer handoffs"
        title="Conversations"
        description="Inspect the buyer’s request, selected residence, contact permission, and advisor status without losing context."
        marker={MessageSquareText}
      />
      <ConversationsWorkspace
        inquiries={records}
        canManage={["owner", "admin", "agent"].includes(staff.role)}
        initialView={filters.view === "needs_reply" ? "needs_reply" : "all"}
      />
    </DashboardShell>
  );
}
