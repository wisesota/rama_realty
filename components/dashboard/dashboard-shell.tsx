"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Command,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import type { StaffContext } from "@/lib/dashboard/dal";
import { OpsCommandCenter } from "@/components/dashboard/ops-command-center";
import { ProfileMenu } from "@/components/dashboard/profile-menu";

type DashboardShellProps = {
  staff: StaffContext;
  email: string | null;
  active: "overview" | "inventory" | "inquiries" | "settings";
  children: React.ReactNode;
};

const navigation = [
  { key: "overview", label: "Daily brief", href: "/dashboard", icon: LayoutDashboard },
  { key: "inventory", label: "Inventory", href: "/dashboard/inventory", icon: Building2 },
  { key: "inquiries", label: "Conversations", href: "/dashboard/inquiries", icon: MessageSquareText },
] as const;

const settingsNavigation = { key: "settings", label: "Settings", href: "/dashboard/settings", icon: Settings } as const;
const allNavigation = [...navigation, settingsNavigation];

export function DashboardShell({ staff, email, active, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => mobileCloseButtonRef.current?.focus());
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  function closeMobileNavigation() {
    setMobileOpen(false);
    window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus());
  }

  return (
    <div className="ops-shell">
      <a className="ops-skip-link" href="#operations-main">Skip to workspace</a>

      <aside className="ops-sidebar" aria-label="Rama operations navigation">
        <Link className="ops-sidebar-brand" href="/" target="_blank" rel="noopener noreferrer" aria-label="Open Rama Realty public site in a new tab"><Logo /></Link>
        <div className="ops-sidebar-context"><span>Operations ledger</span><strong>{staff.organizationName}</strong></div>
        <nav className="ops-sidebar-nav" aria-label="Operations">
          {navigation.map((item) => {
            const Icon = item.icon;
            const selected = active === item.key;
            return <Link key={item.key} aria-current={selected ? "page" : undefined} href={item.href}><Icon aria-hidden="true" /><span>{item.label}</span></Link>;
          })}
        </nav>
        <div className="ops-sidebar-foot">
          <nav className="ops-sidebar-utility" aria-label="Workspace settings">
            <Link aria-current={active === settingsNavigation.key ? "page" : undefined} href={settingsNavigation.href}><Settings aria-hidden="true" /><span>Settings</span></Link>
          </nav>
          <div className="ops-policy-note"><ShieldCheck aria-hidden="true" /><span><strong>Governed workspace</strong><small>Source and role controls active</small></span></div>
          <Link className="ops-public-link" href="/" target="_blank" rel="noopener noreferrer">Buyer experience <span>New tab</span><ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </aside>

      {mobileOpen ? <button className="ops-mobile-scrim" type="button" aria-label="Dismiss navigation" onClick={closeMobileNavigation} /> : null}
      <aside id="operations-mobile-navigation" className="ops-mobile-drawer" data-open={mobileOpen} aria-hidden={!mobileOpen} inert={!mobileOpen}>
        <div className="ops-mobile-drawer-head"><Logo /><button ref={mobileCloseButtonRef} type="button" aria-label="Close navigation" onClick={closeMobileNavigation}><X aria-hidden="true" /></button></div>
        <nav aria-label="Mobile operations">
          {navigation.map((item) => { const Icon = item.icon; return <Link key={item.key} aria-current={active === item.key ? "page" : undefined} href={item.href} onClick={() => setMobileOpen(false)}><Icon aria-hidden="true" />{item.label}</Link>; })}
          <Link aria-current={active === "settings" ? "page" : undefined} href="/dashboard/settings" onClick={() => setMobileOpen(false)}><Settings aria-hidden="true" />Settings</Link>
          <Link href="/" target="_blank" rel="noopener noreferrer" onClick={() => setMobileOpen(false)}><ArrowUpRight aria-hidden="true" />Buyer experience <small>New tab</small></Link>
        </nav>
      </aside>

      <div className="ops-workspace">
        <header className="ops-command-bar">
          <button ref={mobileMenuButtonRef} className="ops-menu-trigger" type="button" aria-label="Open navigation" aria-controls="operations-mobile-navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" /></button>
          <div className="ops-breadcrumb"><span>Rama Realty</span><strong>{allNavigation.find((item) => item.key === active)?.label}</strong></div>
          <button className="ops-command-trigger" type="button" onClick={() => setCommandOpen(true)}><Search aria-hidden="true" /><span>Ask Rama or search the workspace</span><kbd><Command aria-hidden="true" />K</kbd></button>
          <ProfileMenu staff={staff} email={email} />
        </header>

        <main id="operations-main" className="ops-main">{children}</main>
      </div>

      <nav className="ops-bottom-nav" aria-label="Mobile operations">
        {navigation.map((item) => { const Icon = item.icon; return <Link key={item.key} aria-current={active === item.key ? "page" : undefined} href={item.href}><Icon aria-hidden="true" /><span>{item.label === "Daily brief" ? "Brief" : item.label}</span></Link>; })}
        <button type="button" onClick={() => setCommandOpen(true)}><Search aria-hidden="true" /><span>Ask Rama</span></button>
      </nav>

      <OpsCommandCenter isOpen={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
