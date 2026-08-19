"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Building2, Command, LayoutDashboard, MessageSquareText, Search, Settings, ShieldCheck, Sparkles, TriangleAlert, X } from "lucide-react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { type FormEvent, useMemo, useState } from "react";
import {
  rankDashboardCommands,
  type DashboardCommand,
} from "@/lib/dashboard/commands";

type CommandWithIcon = DashboardCommand & { icon: typeof LayoutDashboard };

const commands: readonly CommandWithIcon[] = [
  { id: "brief", label: "Open the daily brief", detail: "Review action queues and catalog readiness", href: "/dashboard", icon: LayoutDashboard, terms: "overview daily brief readiness operations" },
  { id: "inventory", label: "Review governed inventory", detail: "Search, filter, and inspect catalog records", href: "/dashboard/inventory", icon: Building2, terms: "property properties inventory catalog residence residences listing listings" },
  { id: "refresh", label: "Find listings needing a refresh", detail: "Open inventory filtered to stale or missing sources", href: "/dashboard/inventory?health=attention", icon: TriangleAlert, terms: "source refresh stale missing health evidence expired listings records" },
  { id: "review", label: "Review publication queue", detail: "Open records waiting for editorial approval", href: "/dashboard/inventory?status=in_review", icon: ShieldCheck, terms: "publication publish review approval waiting records" },
  { id: "conversations", label: "Open buyer conversations", detail: "Continue consented advisor handoffs", href: "/dashboard/inquiries", icon: MessageSquareText, terms: "buyer inquiry inquiries conversation conversations follow up lead leads" },
  { id: "reply", label: "Find conversations needing a reply", detail: "Open new buyer handoffs awaiting an advisor", href: "/dashboard/inquiries?view=needs_reply", icon: MessageSquareText, terms: "buyer inquiry conversations reply new advisor follow up" },
  { id: "analytics", label: "Open analytics workspace", detail: "Inspect traffic, discovery patterns, and conversion telemetry", href: "/dashboard/analytics", icon: BarChart3, terms: "analytics traffic pageviews visitors metrics telemetry posthog conversion funnel" },
  { id: "settings", label: "Open workspace settings", detail: "Manage profile, security, and Rama governance", href: "/dashboard/settings", icon: Settings, terms: "settings profile avatar password security workspace rama ai" },
];

const suggestions = [
  { label: "Which listings need a source refresh?", href: "/dashboard/inventory?health=attention" },
  { label: "Show records waiting for publication review", href: "/dashboard/inventory?status=in_review" },
  { label: "Which buyer conversations need a reply?", href: "/dashboard/inquiries?view=needs_reply" },
  { label: "Inspect buyer discovery and traffic analytics", href: "/dashboard/analytics" },
] as const;

export function OpsCommandCenter({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [...commands];
    return rankDashboardCommands(commands, normalized) as CommandWithIcon[];
  }, [query]);

  function changeOpenState(open: boolean) {
    if (!open) setQuery("");
    onOpenChange(open);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (matches[0]) { changeOpenState(false); router.push(matches[0].href); }
  }

  return <ModalOverlay isOpen={isOpen} isDismissable onOpenChange={changeOpenState} className="ops-command-overlay">
    <Modal className="ops-command-modal">
      <Dialog aria-label="Ask Rama operations command" className="ops-command-dialog">
        <header><div><span><Sparkles aria-hidden="true" />Ask Rama</span><h2>Find the next operational move.</h2></div><button type="button" aria-label="Close command center" onClick={() => changeOpenState(false)}><X aria-hidden="true" /></button></header>
        <form onSubmit={submit} className="ops-command-search"><Search aria-hidden="true" /><label><span className="sr-only">Search the CRM</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory, conversations, or a task…" /></label><kbd><Command aria-hidden="true" />K</kbd></form>
        <div className="ops-command-body">
          <section aria-labelledby="command-results"><p id="command-results">Workspace</p><div className="ops-command-results">{matches.length ? matches.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => changeOpenState(false)}><Icon aria-hidden="true" /><span><strong>{item.label}</strong><small>{item.detail}</small></span><ArrowRight aria-hidden="true" /></Link>; }) : <div className="ops-command-empty"><strong>No workspace shortcut matches.</strong><span>Try “inventory,” “publication,” or “conversations.”</span></div>}</div></section>
          {!query ? <section aria-labelledby="rama-suggestions"><p id="rama-suggestions">Suggested operational questions</p><div className="ops-command-suggestions">{suggestions.map((suggestion) => <Link key={suggestion.href} href={suggestion.href} onClick={() => changeOpenState(false)}>{suggestion.label}<ArrowRight aria-hidden="true" /></Link>)}</div></section> : null}
        </div>
        <footer><span><ShieldCheck aria-hidden="true" />Role-aware workspace search</span><small>Operational AI answers will remain source-bound and require confirmation before any write.</small></footer>
      </Dialog>
    </Modal>
  </ModalOverlay>;
}
