import { Building2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { InventoryCreateSheet } from "@/components/dashboard/inventory-create-sheet";
import { InventoryWorkspace, type InventoryRecord } from "@/components/dashboard/inventory-workspace";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireStaffContext } from "@/lib/dashboard/dal";

type InventoryPageProps = {
  searchParams: Promise<{ status?: string; health?: string; page?: string }>;
};

const publicationStates = new Set(["all", "draft", "in_review", "published", "archived"]);

export default async function InventoryPage({ searchParams }: InventoryPageProps) {
  const filters = await searchParams;
  const page = parseInt(filters.page || "1", 10) || 1;
  const size = 100;
  const { supabase, staff, email } = await requireStaffContext();
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, location, price_aed, beds, baths, area_sq_ft, publication_status, availability_status, source_name, source_updated_at, updated_at, image_url, image_alt, description, feature, version")
    .eq("organization_id", staff.organizationId)
    .order("updated_at", { ascending: false })
    .returns<InventoryRecord[]>()
    .range((page - 1) * size, page * size - 1);
  if (error) throw new Error("Inventory could not be loaded from the governed catalog.");

  const canCreate = ["owner", "admin", "inventory_manager"].includes(staff.role);
  const canPublish = ["owner", "admin", "editor"].includes(staff.role);
  const canAdvanceCatalog = canPublish || staff.role === "inventory_manager";

  return (
    <DashboardShell staff={staff} email={email} active="inventory">
      <PageHeader
        eyebrow="Catalog control"
        title="Inventory"
        description="Draft privately, verify source-backed facts, and publish only records Rama can explain to a buyer."
        marker={Building2}
        action={canCreate ? <InventoryCreateSheet /> : undefined}
      />
      <InventoryWorkspace
        records={properties ?? []}
        canPublish={canPublish}
        canAdvanceCatalog={canAdvanceCatalog}
        initialStatus={publicationStates.has(filters.status ?? "") ? filters.status! : "all"}
        initialHealth={filters.health === "attention" ? "attention" : "all"}
      />
    </DashboardShell>
  );
}
