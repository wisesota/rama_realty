import {
  Bot,
  Building2,
  Cable,
  ExternalLink,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileSettingsForm } from "@/components/dashboard/profile-settings-form";
import { requireStaffContext } from "@/lib/dashboard/dal";

const settingsNavigation = [
  { href: "#profile", label: "Profile", icon: UserRound },
  { href: "#workspace", label: "Workspace", icon: Building2 },
  { href: "#rama", label: "Rama AI", icon: Bot },
  { href: "#security", label: "Security", icon: ShieldCheck },
] as const;

export default async function SettingsPage() {
  const { staff, email } = await requireStaffContext();
  const canManageWorkspace = ["owner", "admin"].includes(staff.role);

  return (
    <DashboardShell staff={staff} email={email} active="settings">
      <PageHeader
        eyebrow="Workspace control"
        title="Settings"
        description="Manage your identity, understand workspace authority, and see which buyer-facing controls are governed by Rama."
        marker={Settings2}
      />

      <div className="ops-settings-workspace">
        <aside className="ops-settings-nav" aria-label="Settings sections">
          <p>Settings</p>
          <nav>
            {settingsNavigation.map((item) => {
              const Icon = item.icon;
              return <a key={item.href} href={item.href}><Icon aria-hidden="true" />{item.label}</a>;
            })}
          </nav>
          <a className="ops-settings-public" href="/" target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden="true" />Open buyer experience<span>New tab</span>
          </a>
        </aside>

        <div className="ops-settings-content">
          <ProfileSettingsForm staff={staff} email={email}>

          <section id="workspace" className="ops-settings-section" aria-labelledby="workspace-heading">
            <header><span>02</span><div><p>Workspace</p><h2 id="workspace-heading">Organization and access</h2></div></header>
            <div className="ops-settings-ledger">
              <div><Building2 aria-hidden="true" /><span><small>Organization</small><strong>{staff.organizationName}</strong><em>{staff.organizationSlug}</em></span></div>
              <div><UsersRound aria-hidden="true" /><span><small>Your authority</small><strong>{staff.role.replaceAll("_", " ")}</strong><em>{canManageWorkspace ? "Workspace administration enabled" : "Personal settings only"}</em></span></div>
              <div><ShieldCheck aria-hidden="true" /><span><small>Access model</small><strong>Membership governed</strong><em>Role changes require an authorized administrator.</em></span></div>
            </div>
            <p className="ops-settings-note">Organization editing and staff invitations stay intentionally locked until the audited invitation workflow is connected. This prevents a settings screen from becoming a role-escalation path.</p>
          </section>

          <section id="rama" className="ops-settings-section" aria-labelledby="rama-heading">
            <header><span>03</span><div><p>Buyer-facing AI</p><h2 id="rama-heading">Rama agent governance</h2></div></header>
            <div className="ops-settings-ledger ops-settings-ledger--rama">
              <div><Bot aria-hidden="true" /><span><small>Agent identity</small><strong>Rama · Dubai property advisor</strong><em>Voice and text use the same source-bound discovery contract.</em></span></div>
              <div><Cable aria-hidden="true" /><span><small>Catalog boundary</small><strong>Published inventory only</strong><em>Draft records remain unavailable to the public agent.</em></span></div>
              <div><ShieldCheck aria-hidden="true" /><span><small>Configuration authority</small><strong>{canManageWorkspace ? "Owner and admin" : "View only"}</strong><em>Future prompt and handoff changes will be versioned and audited.</em></span></div>
            </div>
            <p className="ops-settings-note">AI instructions, model credentials, and data-source secrets are not editable in browser controls. This page exposes the operating contract without leaking privileged configuration.</p>
          </section>
          </ProfileSettingsForm>
        </div>
      </div>
    </DashboardShell>
  );
}
