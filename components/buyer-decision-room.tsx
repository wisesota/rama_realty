"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bath, BedDouble, Heart, LoaderCircle, MapPin, Ruler, ShieldCheck, X } from "lucide-react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { type FormEvent, useMemo, useRef, useState, useEffect } from "react";
import type { BuyerDecisionEnvelopeV1, BuyerPropertySummary } from "@/lib/agent/buyer-contracts";
import { isAgentToolResponse, type AgentBlock, type AgentToolName } from "@/lib/agent/contracts";
import { AgentResponseBlocks } from "@/components/agent-response-blocks";
import { Button } from "@/components/ui/button";

function formatAed(value: number) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value);
}

function PropertyFacts({ property }: { property: BuyerPropertySummary }) {
  return <div className="grid grid-cols-3 border-y border-border py-4 text-sm"><span className="flex items-center gap-2"><BedDouble aria-hidden="true" className="size-4" />{property.beds} beds</span><span className="flex items-center gap-2"><Bath aria-hidden="true" className="size-4" />{property.baths} baths</span><span className="flex items-center gap-2"><Ruler aria-hidden="true" className="size-4" />{property.area.value.toLocaleString("en-AE")} sq ft</span></div>;
}

type ToolAction = "details" | "compare" | "payment" | "floor_plan" | "documents" | "scenario" | "development" | "area";

export function BuyerDecisionRoom({ envelope, modal = false }: { envelope: BuyerDecisionEnvelopeV1; modal?: boolean }) {
  const router = useRouter();
  const handoffKeysRef = useRef(new Map<string, string>());
  const properties = useMemo(() => Object.values(envelope.entities.properties), [envelope]);
  const [selectedId, setSelectedId] = useState(properties[0]?.id ?? "");
  const [compareIds, setCompareIds] = useState<string[]>(properties.slice(0, Math.min(2, properties.length)).map((item) => item.id));
  const [blocks, setBlocks] = useState<AgentBlock[]>([]);
  const [toolStatus, setToolStatus] = useState("");
  const [loadingTool, setLoadingTool] = useState<ToolAction | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState("");
  const [handoffSubmitting, setHandoffSubmitting] = useState(false);
  const selected = properties.find((property) => property.id === selectedId) ?? properties[0];
  const restorationNotices = envelope.blocks.filter((block) => block.type === "recoverable_error");

  useEffect(() => {
    setHandoffStatus("");
    setHandoffOpen(false);
  }, [selectedId]);

  async function runTool(action: ToolAction) {
    if (!selected) return;
    const request: Record<ToolAction, { tool: AgentToolName; args: Record<string, unknown> }> = {
      details: { tool: "get_property_details", args: { propertyId: selected.id } },
      compare: { tool: "compare_properties", args: { propertyIds: compareIds.length >= 2 ? compareIds : properties.slice(0, 2).map((property) => property.id) } },
      payment: { tool: "get_payment_schedule", args: { propertyId: selected.id } },
      floor_plan: { tool: "get_floor_plans", args: { propertyId: selected.id } },
      documents: { tool: "get_property_documents", args: { propertyId: selected.id } },
      scenario: { tool: "calculate_purchase_scenario", args: { propertyId: selected.id, downPaymentPercent: 25, annualInterestPercent: 5, termYears: 25 } },
      development: { tool: "get_development_details", args: { propertyId: selected.id } },
      area: { tool: "get_area_context", args: { location: selected.location } },
    };
    setLoadingTool(action);
    setToolStatus("");
    try {
      const response = await fetch("/api/agent/tools", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(request[action]) });
      const payload: unknown = await response.json();
      if (!isAgentToolResponse(payload)) throw new Error("Rama returned an invalid property response.");
      setBlocks(payload.blocks);
      setToolStatus(payload.summary);
    } catch (error) {
      setBlocks([]);
      setToolStatus(error instanceof Error ? error.message : "This property fact is temporarily unavailable.");
    } finally {
      setLoadingTool(null);
    }
  }

  function toggleCompare(propertyId: string) {
    setCompareIds((current) => current.includes(propertyId) ? current.filter((id) => id !== propertyId) : current.length < 3 ? [...current, propertyId] : current);
  }

  async function submitHandoff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || handoffSubmitting) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    if (!email && !phone) {
      setHandoffStatus("Add an email address or phone number so an advisor can respond.");
      return;
    }
    let idempotencyKey = handoffKeysRef.current.get(selected.id);
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID();
      handoffKeysRef.current.set(selected.id, idempotencyKey);
    }
    setHandoffSubmitting(true);
    setHandoffStatus("Sending your consented request…");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          searchRunId: envelope.searchRunId,
          conversationId: envelope.conversationId,
          propertyId: selected.id,
          fullName: data.get("fullName"),
          email,
          phone,
          message: data.get("message"),
          consent: data.get("consent") === "on",
        }),
      });
      const payload = await response.json() as { error?: string };
      setHandoffStatus(response.ok ? "Your request is in Rama’s advisor queue. We preserved the property and conversation context." : payload.error ?? "The advisor request could not be sent.");
    } catch {
      setHandoffStatus("We could not confirm the advisor request status. Your request may still be in progress.");
    } finally {
      setHandoffSubmitting(false);
    }
  }

  const room = <main className="mx-auto w-full max-w-[76rem] bg-background text-foreground">
    <header className="flex items-center justify-between border-b border-border px-4 py-3 md:px-8">
      <div className="min-w-0 flex-1"><p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Rama Buyer Decision Room</p><p className="mt-1 truncate text-sm text-muted-foreground">{envelope.brief.normalized}</p></div>
      <div className="flex shrink-0 items-center gap-2">{modal ? <Link className="hidden text-sm font-semibold underline-offset-4 hover:underline sm:block" href={`/discover/${envelope.searchRunId}`}>Open full page</Link> : <Link className="inline-flex items-center gap-2 text-sm font-semibold" href="/"><ArrowLeft aria-hidden="true" className="size-4" />Back to Rama</Link>}{modal ? <Button variant="ghost" size="icon-sm" aria-label="Close Decision Room" onPress={() => router.back()}><X aria-hidden="true" /></Button> : null}</div>
    </header>

    <section className="px-4 py-5 md:px-8 md:py-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full min-w-0 flex-wrap gap-2 md:w-auto md:flex-1">{envelope.brief.criteria.map((criterion) => <span key={criterion.key} className="border border-border bg-card px-3 py-1.5 text-xs"><strong className="mr-1">{criterion.kind === "hard" ? "Must" : "Prefer"}</strong>{criterion.label}</span>)}</div>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck aria-hidden="true" className="size-4 text-primary" />{envelope.sourceSummary.label}</span>
      </div>
      {restorationNotices.map((notice) => <div key={`${notice.title}:${notice.message}`} role="status" className="mb-4 border-l-2 border-primary bg-card px-4 py-3 text-sm"><strong>{notice.title}.</strong> <span className="text-muted-foreground">{notice.message}</span></div>)}

      {!selected ? <div className="border border-border bg-card p-8 md:p-12"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Brief preserved</p><h1 className="mt-3 font-heading text-4xl">No exact residence yet.</h1><p className="mt-4 max-w-xl text-muted-foreground">Rama found no currently eligible public listing for this brief. Return to the search and relax one preference; no demonstration inventory has been substituted.</p><Button className="mt-6" onPress={() => router.back()}>Refine the brief</Button></div> : <>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[16px] bg-muted"><Image src={selected.image.url} alt={selected.image.alt} fill loading="eager" fetchPriority="high" sizes="(max-width: 1024px) 100vw, 760px" className="object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-20 text-white md:p-7"><p className="text-xs font-semibold uppercase tracking-[0.18em]">Strongest current match</p><h1 className="mt-2 font-heading text-3xl md:text-5xl">{selected.name}</h1></div></div>
          <aside className="flex flex-col justify-between border border-border bg-card p-5 md:p-6"><div><div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin aria-hidden="true" className="size-4" />{selected.location}</p><p className="mt-2 font-heading text-3xl">{formatAed(selected.price.amount)}</p></div><Button variant="outline" size="icon-sm" aria-label="Save residence" isDisabled><Heart aria-hidden="true" /></Button></div><PropertyFacts property={selected} /><p className="mt-5 text-sm leading-6 text-muted-foreground">{selected.description ?? selected.feature}</p><div className="mt-5 border-l-2 border-primary pl-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Why Rama selected it</p><p className="mt-2 text-sm leading-6">{selected.matchReason}</p></div></div><div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground"><p className="font-semibold text-foreground">{selected.provenance.sourceName}</p><p className="mt-1">Version {selected.provenance.version}{selected.provenance.observedAt ? ` · observed ${new Date(selected.provenance.observedAt).toLocaleDateString("en-AE")}` : ""}</p></div></aside>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <section><div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Shortlist</p><h2 className="mt-1 font-heading text-2xl">Other governed matches</h2></div>{properties.length >= 2 ? <Button variant="outline" size="sm" isDisabled={compareIds.length < 2 || loadingTool !== null} onPress={() => void runTool("compare")}>Compare {compareIds.length}</Button> : null}</div><div className="space-y-2">{properties.map((property, index) => <div key={property.id} className={`grid grid-cols-[1fr_auto] items-center gap-2 border p-2 transition-colors ${property.id === selected.id ? "border-foreground bg-card" : "border-border bg-background hover:bg-muted"}`}><button type="button" onClick={() => setSelectedId(property.id)} className="grid min-w-0 grid-cols-[5rem_1fr] items-center gap-3 text-left"><span className="relative aspect-[4/3] overflow-hidden rounded-[8px]"><Image src={property.image.url} alt="" fill sizes="80px" className="object-cover" /></span><span className="min-w-0"><small className="block truncate text-muted-foreground">{String(index + 1).padStart(2, "0")} · {property.location}</small><strong className="mt-1 block font-heading text-lg leading-tight">{property.name}</strong><small className="text-muted-foreground">{formatAed(property.price.amount)}</small></span></button><input aria-label={`Compare ${property.name}`} type="checkbox" checked={compareIds.includes(property.id)} onChange={() => toggleCompare(property.id)} className="size-4 accent-foreground" /></div>)}</div></section>

          <section className="border border-border bg-card p-5 md:p-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ask for the next fact</p><h2 className="mt-1 font-heading text-2xl">Continue with Rama</h2><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{([ ["details", "Full details"], ["payment", "Payment schedule"], ["floor_plan", "Floor plans"], ["documents", "Documents"], ["scenario", "Buyer scenario"], ["development", "Development"], ["area", "Area context"] ] as Array<[ToolAction, string]>).map(([action, label]) => <Button key={action} variant="outline" size="sm" isDisabled={loadingTool !== null} onPress={() => void runTool(action)}>{loadingTool === action ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}{label}</Button>)}{selected.organizationId ? <Button size="sm" onPress={() => setHandoffOpen((current) => !current)}>Ask an advisor</Button> : <Button variant="outline" size="sm" isDisabled>Illustrative demo</Button>}</div>{toolStatus ? <p role="status" className="mt-4 text-sm text-muted-foreground">{toolStatus}</p> : null}<AgentResponseBlocks blocks={blocks} />
          {handoffOpen && selected.organizationId ? <form className="mt-5 grid gap-3 border-t border-border pt-5" onSubmit={submitHandoff}><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Advisor handoff</p><h3 className="mt-1 font-heading text-xl">Share only what Rama needs</h3></div><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-semibold">Full name<input required name="fullName" minLength={2} maxLength={120} className="h-10 border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring" /></label><label className="grid gap-1 text-xs font-semibold">Email (or use phone)<input name="email" type="email" maxLength={254} className="h-10 border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring" /></label><label className="grid gap-1 text-xs font-semibold sm:col-span-2">Phone (or use email)<input name="phone" maxLength={40} className="h-10 border border-input bg-background px-3 text-sm font-normal outline-none focus:border-ring" /></label><label className="grid gap-1 text-xs font-semibold sm:col-span-2">What should the advisor help with?<textarea name="message" maxLength={1000} defaultValue={`I would like to discuss ${selected.name}.`} className="min-h-20 border border-input bg-background p-3 text-sm font-normal outline-none focus:border-ring" /></label></div><label className="flex items-start gap-3 text-xs leading-5 text-muted-foreground"><input required name="consent" type="checkbox" className="mt-0.5 size-4 accent-foreground" />I consent to Rama sharing these contact details and this property context with an authorized advisor.</label><div className="flex items-center gap-3"><Button type="submit" size="sm" isDisabled={handoffSubmitting}>{handoffSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}Send advisor request <ArrowRight aria-hidden="true" /></Button>{handoffStatus ? <p role="status" className="text-xs text-muted-foreground">{handoffStatus}</p> : null}</div></form> : null}</section>
        </div>
      </>}
    </section>
  </main>;

  if (!modal) return <div className="min-h-dvh bg-muted p-0 md:p-8">{room}</div>;
  return <ModalOverlay isOpen isDismissable onOpenChange={(open) => { if (!open) router.back(); }} className="fixed inset-0 z-[100] grid place-items-center bg-foreground/60 p-2 backdrop-blur-[2px] md:p-4"><Modal className="max-h-[calc(100dvh-1rem)] w-full max-w-[80rem] overflow-x-hidden overflow-y-auto bg-background shadow-2xl outline-none md:max-h-[calc(100dvh-2rem)]"><Dialog aria-label="Rama Buyer Decision Room" className="outline-none">{room}</Dialog></Modal></ModalOverlay>;
}
