"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bath, BedDouble, Check, ChevronDown, LoaderCircle, MapPin, Ruler, ShieldCheck, X } from "lucide-react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AgentResponseBlocks } from "@/components/agent-response-blocks";
import { DecisionRoomVoiceComposer } from "@/components/decision-room-voice-composer";
import { Button } from "@/components/ui/button";
import type { BuyerDecisionEnvelopeV1, BuyerPropertySummary } from "@/lib/agent/buyer-contracts";
import { isAgentToolResponse, type AgentBlock, type AgentToolName } from "@/lib/agent/contracts";
import { criterionCategoriesFromKeys, emitProductEvent } from "@/lib/product-events";

type ToolAction = "details" | "compare" | "payment" | "floor_plan" | "documents" | "scenario" | "development" | "area";

const toolActions: Array<[ToolAction, string]> = [
  ["details", "Full details"], ["payment", "Payment schedule"],
  ["floor_plan", "Floor plans"], ["documents", "Documents"],
  ["scenario", "Buyer scenario"], ["development", "Development"],
  ["area", "Area context"],
];

function formatAed(value: number) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value);
}

function publicPropertyId(property: BuyerPropertySummary) {
  return property.slug ?? "unavailable";
}

function sourceVersion(property: BuyerPropertySummary) {
  return `v${property.provenance.version}`;
}

function PropertyFacts({ property }: { property: BuyerPropertySummary }) {
  return (
    <dl className="decision-room__facts" aria-label={`${property.name} key facts`}>
      <div><dt><BedDouble aria-hidden="true" /> Bedrooms</dt><dd>{property.beds}</dd></div>
      <div><dt><Bath aria-hidden="true" /> Bathrooms</dt><dd>{property.baths}</dd></div>
      <div><dt><Ruler aria-hidden="true" /> Interior</dt><dd>{property.area.value.toLocaleString("en-AE")} sq ft</dd></div>
    </dl>
  );
}

export function BuyerDecisionRoom({ envelope, modal = false }: { envelope: BuyerDecisionEnvelopeV1; modal?: boolean }) {
  const router = useRouter();
  const handoffKeysRef = useRef(new Map<string, string>());
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const dossierTitleRef = useRef<HTMLHeadingElement | null>(null);
  const focusDossierRef = useRef(false);
  const emittedOutcomeRef = useRef<string | null>(null);
  const toolRequestRef = useRef<{ id: string; propertyId: string; controller: AbortController } | null>(null);
  const handoffRequestRef = useRef<{ id: string; propertyId: string; controller: AbortController } | null>(null);
  const properties = useMemo(() => Object.values(envelope.entities.properties), [envelope]);
  const [selectedId, setSelectedId] = useState(properties[0]?.id ?? "");
  const [compareIds, setCompareIds] = useState<string[]>(properties.slice(0, Math.min(2, properties.length)).map((property) => property.id));
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [blocks, setBlocks] = useState<AgentBlock[]>([]);
  const [toolStatus, setToolStatus] = useState("");
  const [loadingTool, setLoadingTool] = useState<ToolAction | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState("");
  const [handoffSubmitting, setHandoffSubmitting] = useState(false);
  const selected = properties.find((property) => property.id === selectedId) ?? properties[0];
  const selectedIdRef = useRef(selected?.id ?? "");
  const restorationNotices = envelope.blocks.filter((block) => block.type === "recoverable_error");

  useEffect(() => {
    if (!modal) return;
    const returnSource = sessionStorage.getItem("rama:decision-room-return-focus");
    sessionStorage.removeItem("rama:decision-room-return-focus");
    returnFocusRef.current = document.querySelector<HTMLElement>(returnSource === "voice"
      ? ".voice-signal"
      : "#guided-search button[type='submit']");
    return () => {
      const returnTarget = returnFocusRef.current;
      window.requestAnimationFrame(() => returnTarget?.focus());
    };
  }, [modal]);

  useEffect(() => {
    selectedIdRef.current = selected?.id ?? "";
  }, [selected?.id]);

  useEffect(() => {
    if (emittedOutcomeRef.current === envelope.searchRunId) return;
    emittedOutcomeRef.current = envelope.searchRunId;
    emitProductEvent({
      event: "room.search_outcome",
      searchRunId: envelope.searchRunId,
      outcome: envelope.status,
      criterionCategories: criterionCategoriesFromKeys(envelope.brief.criteria.map((criterion) => criterion.key)),
      criterionCount: envelope.brief.criteria.length,
      resultCount: properties.length,
      timestamp: new Date().toISOString(),
    });
  }, [envelope, properties.length]);

  useEffect(() => () => {
    toolRequestRef.current?.controller.abort();
    handoffRequestRef.current?.controller.abort();
  }, []);

  useEffect(() => {
    if (!detailsExpanded || !focusDossierRef.current) return;
    focusDossierRef.current = false;
    const frame = window.requestAnimationFrame(() => {
      const heading = dossierTitleRef.current;
      if (!heading) return;
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [detailsExpanded, selectedId]);

  function selectProperty(property: BuyerPropertySummary) {
    toolRequestRef.current?.controller.abort();
    toolRequestRef.current = null;
    handoffRequestRef.current?.controller.abort();
    handoffRequestRef.current = null;
    selectedIdRef.current = property.id;
    setSelectedId(property.id);
    setDetailsExpanded(false);
    setBlocks([]);
    setToolStatus("");
    setLoadingTool(null);
    setHandoffOpen(false);
    setHandoffStatus("");
    setHandoffSubmitting(false);
  }

  function expandProperty(fromView: "lead" | "shortlist", property = selected) {
    if (!property) return;
    if (property.id !== selected?.id) selectProperty(property);
    focusDossierRef.current = fromView === "shortlist";
    setDetailsExpanded(true);
    emitProductEvent({ event: "room.property_expand", searchRunId: envelope.searchRunId, propertyId: publicPropertyId(property), sourceVersion: sourceVersion(property), fromView, timestamp: new Date().toISOString() });
  }

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
    const propertyId = selected.id;
    toolRequestRef.current?.controller.abort();
    const controller = new AbortController();
    const requestId = crypto.randomUUID();
    toolRequestRef.current = { id: requestId, propertyId, controller };
    emitProductEvent({ event: "room.tool_request", searchRunId: envelope.searchRunId, propertyId: publicPropertyId(selected), sourceVersion: sourceVersion(selected), tool: request[action].tool, timestamp: new Date().toISOString() });
    setLoadingTool(action);
    setToolStatus("");
    try {
      const response = await fetch("/api/agent/tools", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify(request[action]), signal: controller.signal });
      const payload: unknown = await response.json();
      if (!isAgentToolResponse(payload)) throw new Error("Rama returned an invalid property response.");
      if (toolRequestRef.current?.id !== requestId || selectedIdRef.current !== propertyId) return;
      setBlocks(payload.blocks);
      setToolStatus(payload.summary);
    } catch (error) {
      if (controller.signal.aborted || toolRequestRef.current?.id !== requestId || selectedIdRef.current !== propertyId) return;
      setBlocks([]);
      setToolStatus(error instanceof Error ? error.message : "This property fact is temporarily unavailable.");
    } finally {
      if (toolRequestRef.current?.id === requestId) {
        toolRequestRef.current = null;
        setLoadingTool(null);
      }
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
    emitProductEvent({ event: "room.handoff_submit", searchRunId: envelope.searchRunId, propertyId: publicPropertyId(selected), sourceVersion: sourceVersion(selected), timestamp: new Date().toISOString() });
    const propertyId = selected.id;
    const requestId = crypto.randomUUID();
    const controller = new AbortController();
    handoffRequestRef.current?.controller.abort();
    handoffRequestRef.current = { id: requestId, propertyId, controller };
    setHandoffSubmitting(true);
    setHandoffStatus("Sending your consented request…");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ searchRunId: envelope.searchRunId, conversationId: envelope.conversationId, propertyId: selected.id, fullName: data.get("fullName"), email, phone, message: data.get("message"), consent: data.get("consent") === "on" }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as { error?: string };
      if (handoffRequestRef.current?.id !== requestId || selectedIdRef.current !== propertyId) return;
      setHandoffStatus(response.ok ? "Your request is in Rama’s advisor queue. We preserved the property and conversation context." : payload.error ?? "The advisor request could not be sent.");
    } catch {
      if (controller.signal.aborted || handoffRequestRef.current?.id !== requestId || selectedIdRef.current !== propertyId) return;
      setHandoffStatus("We could not confirm the advisor request status. Your request may still be in progress.");
    } finally {
      if (handoffRequestRef.current?.id === requestId) {
        handoffRequestRef.current = null;
        setHandoffSubmitting(false);
      }
    }
  }

  const room = (
    <main className="decision-room">
      <header className="decision-room__header">
        <div className="decision-room__identity"><p>Rama Buyer Decision Room</p><span>{envelope.brief.normalized}</span></div>
        <div className="decision-room__header-actions">
          {modal ? <a href={`/discover/${envelope.searchRunId}`}>Open full page</a> : <Link href="/"><ArrowLeft aria-hidden="true" /> Back to Rama</Link>}
          {modal ? <Button variant="ghost" size="icon-sm" aria-label="Close Decision Room" onPress={() => router.back()}><X aria-hidden="true" /></Button> : null}
        </div>
      </header>

      <div className="decision-room__body">
        <section className="decision-room__brief" aria-label="Current property brief">
          <div className="decision-room__criteria">
            {envelope.brief.criteria.map((criterion) => <p key={criterion.key}><span>{criterion.kind === "hard" ? "Required" : "Preferred"}</span>{criterion.label}</p>)}
          </div>
          <p className="decision-room__source-summary"><ShieldCheck aria-hidden="true" />{envelope.sourceSummary.label}</p>
        </section>

        {restorationNotices.map((notice) => <div key={`${notice.title}:${notice.message}`} role="status" className="room-notice"><strong>{notice.title}.</strong> {notice.message}</div>)}

        {!selected ? (
          <section className="decision-room__empty">
            <p className="eyebrow">Brief preserved</p><h1>No exact residence yet.</h1>
            <p>Rama found no currently eligible public listing for this brief. Return to the search and relax one preference; no demonstration inventory has been substituted.</p>
            <Button onPress={() => modal ? router.back() : router.push("/#guided-search")}>Refine the brief</Button>
          </section>
        ) : (
          <>
            <article className="decision-room__lead" aria-labelledby="lead-property-title">
              <div className="decision-room__lead-media">
                <Image src={selected.image.url} alt={selected.image.alt} fill loading="eager" fetchPriority="high" sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" />
                <div className="decision-room__lead-caption"><p>Strongest current match</p><h1 id="lead-property-title">{selected.name}</h1></div>
              </div>
              <div className="decision-room__lead-summary">
                <div className="decision-room__location-price"><p><MapPin aria-hidden="true" /> {selected.location}</p><strong>{formatAed(selected.price.amount)}</strong></div>
                <PropertyFacts property={selected} />
                <p className="decision-room__description">{selected.description ?? selected.feature}</p>
                <div className="decision-room__match"><Check aria-hidden="true" /><div><span>Why Rama selected it</span><p>{selected.matchReason}</p></div></div>
                <Button className="decision-room__learn-more" variant="outline" aria-expanded={detailsExpanded} aria-controls="property-dossier" onPress={() => detailsExpanded ? setDetailsExpanded(false) : expandProperty("lead")}>
                  {detailsExpanded ? "Close dossier" : "Learn more"}<ChevronDown aria-hidden="true" data-expanded={detailsExpanded} />
                </Button>
              </div>
            </article>

            {detailsExpanded ? (
              <section id="property-dossier" className="property-dossier" aria-labelledby="dossier-title">
                <div className="property-dossier__heading">
                  <p className="eyebrow">Property dossier</p><h2 ref={dossierTitleRef} id="dossier-title" tabIndex={-1}>Inspect the evidence, then choose the next question.</h2>
                  <p>Facts below are fetched through Rama’s governed tool boundary. Missing records remain visibly unavailable rather than being inferred.</p>
                </div>
                <dl className="property-dossier__ledger">
                  <div><dt>Source</dt><dd>{selected.provenance.sourceName}</dd></div>
                  <div><dt>Status</dt><dd>{selected.provenance.kind === "illustrative" ? "Illustrative record" : "Published record"}</dd></div>
                  <div><dt>Source version</dt><dd>{sourceVersion(selected)}</dd></div>
                  <div><dt>Observed</dt><dd>{selected.provenance.observedAt ? new Date(selected.provenance.observedAt).toLocaleDateString("en-AE") : "Not supplied"}</dd></div>
                  <div><dt>Completion</dt><dd>{selected.completionStatus}</dd></div>
                  <div><dt>Availability</dt><dd>{selected.availabilityStatus}</dd></div>
                </dl>
                <div className="property-dossier__actions">
                  {toolActions.map(([action, label]) => <Button key={action} variant="outline" size="sm" isDisabled={loadingTool !== null} onPress={() => void runTool(action)}>{loadingTool === action ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}{label}</Button>)}
                  {selected.organizationId ? <Button size="sm" onPress={() => setHandoffOpen((current) => !current)}>Ask an advisor</Button> : <Button variant="outline" size="sm" isDisabled>Advisor handoff unavailable for this illustrative record</Button>}
                </div>
                {toolStatus ? <p role="status" className="property-dossier__status">{toolStatus}</p> : null}
                <AgentResponseBlocks blocks={blocks} />
                {handoffOpen && selected.organizationId ? (
                  <form className="advisor-handoff" onSubmit={submitHandoff}>
                    <div><p className="eyebrow">Advisor handoff</p><h3>Share only what Rama needs.</h3></div>
                    <div className="advisor-handoff__fields">
                      <label>Full name<input required name="fullName" minLength={2} maxLength={120} /></label>
                      <label>Email (or use phone)<input name="email" type="email" maxLength={254} /></label>
                      <label>Phone (or use email)<input name="phone" maxLength={40} /></label>
                      <label className="advisor-handoff__message">What should the advisor help with?<textarea name="message" maxLength={1000} defaultValue={`I would like to discuss ${selected.name}.`} /></label>
                    </div>
                    <label className="advisor-handoff__consent"><input required name="consent" type="checkbox" />I consent to Rama sharing these contact details and this property context with an authorized advisor.</label>
                    <div className="advisor-handoff__submit"><Button type="submit" size="sm" isDisabled={handoffSubmitting}>{handoffSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}Send advisor request <ArrowRight aria-hidden="true" /></Button>{handoffStatus ? <p role="status">{handoffStatus}</p> : null}</div>
                  </form>
                ) : null}
              </section>
            ) : null}

            <section className="decision-room__shortlist" aria-labelledby="shortlist-title">
              <div className="decision-room__section-heading">
                <div><p className="eyebrow">Secondary residences</p><h2 id="shortlist-title">Quieter alternatives, held against the same brief.</h2></div>
                {properties.length >= 2 ? <Button variant="outline" size="sm" isDisabled={compareIds.length < 2 || loadingTool !== null} onPress={() => void runTool("compare")}>Compare {compareIds.length}</Button> : null}
              </div>
              <ol className="decision-room__shortlist-list">
                {properties.map((property, index) => (
                  <li key={property.id} data-selected={property.id === selected.id}>
                    <button type="button" onClick={() => selectProperty(property)}><span aria-hidden="true" className="decision-room__shortlist-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{property.name}</strong><small>{property.location} · {formatAed(property.price.amount)}</small></span></button>
                    <Button variant="ghost" size="sm" onPress={() => expandProperty("shortlist", property)}>Learn more</Button>
                    <label><input aria-label={`Compare ${property.name}`} type="checkbox" disabled={loadingTool === "compare"} checked={compareIds.includes(property.id)} onChange={() => toggleCompare(property.id)} />Compare</label>
                  </li>
                ))}
              </ol>
            </section>

            <DecisionRoomVoiceComposer
              key={selected.id}
              context={`You are continuing inside Decision Room ${envelope.searchRunId}. The selected property is ${selected.name}, property ID ${selected.id}, in ${selected.location}. The visible brief criteria are ${envelope.brief.criteria.map((criterion) => criterion.label).join(", ")}. Use governed tools for every property fact and keep responses concise.`}
              onToolResult={(result) => { setBlocks(result.blocks); setToolStatus(result.summary); }}
            />
          </>
        )}
      </div>
    </main>
  );

  if (!modal) return <div className="decision-room-page">{room}</div>;
  return (
    <ModalOverlay isOpen isDismissable onOpenChange={(open) => { if (!open) router.back(); }} className="decision-room-overlay">
      <Modal className="decision-room-modal"><Dialog aria-label="Rama Buyer Decision Room" className="decision-room-dialog">{room}</Dialog></Modal>
    </ModalOverlay>
  );
}
