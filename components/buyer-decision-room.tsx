"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { decisionRoomCopy, localizedCriterionLabel, localizedPath, localizedRecordText, type DecisionRoomCopy, type PublicLocale } from "@/lib/i18n";
import { ArrowLeft, ArrowRight, Bath, BedDouble, Check, ChevronDown, LoaderCircle, MapPin, Ruler, ShieldCheck, X } from "lucide-react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AgentResponseBlocks } from "@/components/agent-response-blocks";
import { DecisionRoomVoiceComposer } from "@/components/decision-room-voice-composer";
import { SavedBriefControl } from "@/components/saved-brief-control";
import { Button } from "@/components/ui/button";
import { ConsentHandoff } from "@/components/rama/consent-handoff";
import { DecisionLedgerTimeline } from "@/components/rama/decision-ledger-timeline";
import { EvidenceState } from "@/components/rama/evidence-state";
import type { BuyerDecisionEnvelope, BuyerPropertySummary, DecisionLedgerEvent, EvidenceAssertion, EvidenceState as EvidenceStateValue } from "@/lib/agent/buyer-contracts";
import { isAgentToolResponse, type AgentBlock, type AgentToolName } from "@/lib/agent/contracts";
import { criterionCategoriesFromKeys, emitProductEvent } from "@/lib/product-events";

type ToolAction = "details" | "compare" | "payment" | "floor_plan" | "documents" | "scenario" | "development" | "area";

const toolActions: ToolAction[] = ["details", "payment", "floor_plan", "documents", "scenario", "development", "area"];

function formatAed(value: number, locale: PublicLocale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value);
}

function publicPropertyId(property: BuyerPropertySummary) {
  return property.slug ?? "unavailable";
}

function sourceVersion(property: BuyerPropertySummary) {
  return `v${property.provenance.version}`;
}

function evidenceStateLabel(state: EvidenceStateValue, copy: DecisionRoomCopy) {
  return copy.evidenceStates[state];
}

function PropertyFacts({ property, locale, copy }: { property: BuyerPropertySummary; locale: PublicLocale; copy: DecisionRoomCopy }) {
  return (
    <dl className="decision-room__facts" aria-label={`${property.name} ${copy.keyFacts}`}>
      <div><dt><BedDouble aria-hidden="true" /> {copy.bedrooms}</dt><dd>{property.beds}</dd></div>
      <div><dt><Bath aria-hidden="true" /> {copy.bathrooms}</dt><dd>{property.baths}</dd></div>
      <div><dt><Ruler aria-hidden="true" /> {copy.interior}</dt><dd><bdi>{property.area.value.toLocaleString(locale === "ar" ? "ar-AE" : "en-AE")} {copy.squareFeet}</bdi></dd></div>
    </dl>
  );
}

export function BuyerDecisionRoom({ envelope, modal = false, locale = "en" }: { envelope: BuyerDecisionEnvelope; modal?: boolean; locale?: PublicLocale }) {
  const copy = decisionRoomCopy[locale];
  const router = useRouter();
  const handoffKeysRef = useRef(new Map<string, string>());
  const dismissalKeysRef = useRef(new Map<string, string>());
  const returnFocusSourceRef = useRef<"voice" | "text">("text");
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
  const evidence = envelope.schemaVersion === "2" ? envelope.evidence.assertions : [];
  const initialLedger = envelope.schemaVersion === "2" ? envelope.decisionLedger.events : [];
  const [ledger, setLedger] = useState(initialLedger);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [ledgerStatus, setLedgerStatus] = useState("");
  const [prevSearchRunId, setPrevSearchRunId] = useState(envelope.searchRunId);

  if (envelope.searchRunId !== prevSearchRunId) {
    setPrevSearchRunId(envelope.searchRunId);
    setSelectedId(properties[0]?.id ?? "");
    setCompareIds(properties.slice(0, Math.min(2, properties.length)).map((property) => property.id));
    setDetailsExpanded(false);
    setBlocks([]);
    setToolStatus("");
    setLoadingTool(null);
    setHandoffOpen(false);
    setHandoffStatus("");
    setHandoffSubmitting(false);
    setLedger(envelope.schemaVersion === "2" ? envelope.decisionLedger.events : []);
    setDismissedIds([]);
    setLedgerStatus("");
  }
  useEffect(() => {
    if (!modal) return;
    const returnSource = sessionStorage.getItem("rama:decision-room-return-focus");
    sessionStorage.removeItem("rama:decision-room-return-focus");
    returnFocusSourceRef.current = returnSource === "voice" ? "voice" : "text";
  }, [modal]);

  function closeModal() {
    sessionStorage.setItem("rama:decision-room-restore-focus", returnFocusSourceRef.current);
    router.back();
  }

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
    focusDossierRef.current = true;
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
      if (!isAgentToolResponse(payload)) throw new Error(copy.invalidTool);
      if (toolRequestRef.current?.id !== requestId || selectedIdRef.current !== propertyId) return;
      setBlocks(payload.blocks);
      setToolStatus(locale === "ar" ? copy.toolReady : payload.summary);
    } catch (error) {
      if (controller.signal.aborted || toolRequestRef.current?.id !== requestId || selectedIdRef.current !== propertyId) return;
      setBlocks([]);
      setToolStatus(locale === "ar" ? copy.factUnavailable : error instanceof Error ? error.message : copy.factUnavailable);
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

  async function dismissCandidate(property: BuyerPropertySummary) {
    let idempotencyKey = dismissalKeysRef.current.get(property.id);
    if (!idempotencyKey) {
      idempotencyKey = crypto.randomUUID();
      dismissalKeysRef.current.set(property.id, idempotencyKey);
    }
    const wasCompared = compareIds.includes(property.id);
    setDismissedIds((current) => [...new Set([...current, property.id])]);
    setCompareIds((current) => current.filter((id) => id !== property.id));
    setLedgerStatus(copy.saving);
    try {
      const response = await fetch("/api/decision-ledger", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          searchRunId: envelope.searchRunId,
          eventType: "candidate_dismissed",
          propertyId: property.id,
          summary: copy.candidateDismissed(property.name),
          idempotencyKey,
        }),
      });
      const payload = await response.json() as { eventId?: string; error?: string };
      if (!response.ok || typeof payload.eventId !== "string") throw new Error(locale === "ar" ? copy.decisionSaveFailed : payload.error ?? copy.decisionSaveFailed);
      const occurredAt = new Date().toISOString();
      setLedger((current) => [...current, {
        id: payload.eventId as string,
        type: "candidate_dismissed",
        occurredAt,
        summary: copy.candidateDismissed(property.name),
        assertionIds: [],
      }]);
      setLedgerStatus(copy.saved);
      dismissalKeysRef.current.delete(property.id);
    } catch (error) {
      setDismissedIds((current) => current.filter((id) => id !== property.id));
      if (wasCompared) setCompareIds((current) => current.includes(property.id) ? current : [...current, property.id].slice(0, 3));
      setLedgerStatus(locale === "ar" ? copy.decisionSaveFailed : error instanceof Error ? error.message : copy.decisionSaveFailed);
    }
  }

  async function submitHandoff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || handoffSubmitting) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    if (!email && !phone) {
      setHandoffStatus(copy.contactRequired);
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
    setHandoffStatus(copy.sendingHandoff);
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ searchRunId: envelope.searchRunId, conversationId: envelope.conversationId, propertyId: selected.id, fullName: data.get("fullName"), email, phone, message: data.get("message"), consent: data.get("consent") === "on" }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as { error?: string };
      if (handoffRequestRef.current?.id !== requestId || selectedIdRef.current !== propertyId) return;
      setHandoffStatus(response.ok ? copy.handoffSent : locale === "ar" ? copy.handoffFailed : payload.error ?? copy.handoffFailed);
    } catch {
      if (controller.signal.aborted || handoffRequestRef.current?.id !== requestId || selectedIdRef.current !== propertyId) return;
      setHandoffStatus(copy.handoffUnknown);
    } finally {
      if (handoffRequestRef.current?.id === requestId) {
        handoffRequestRef.current = null;
        setHandoffSubmitting(false);
      }
    }
  }

  function evidenceLabel(assertion: EvidenceAssertion) {
    if (assertion.field === "price") return copy.price;
    if (assertion.field === "availability") return copy.availability;
    if (assertion.field === "bedrooms") return copy.bedrooms;
    if (assertion.field === "bathrooms") return copy.bathrooms;
    if (assertion.field === "area") return `${copy.interior} (${copy.squareFeet})`;
    return localizedCriterionLabel(locale, assertion.label);
  }

  function evidenceValue(assertion: EvidenceAssertion, value: string | number | null) {
    if (value === null) return copy.notSupplied;
    if (assertion.field === "price" && typeof value === "number") return formatAed(value, locale);
    if (typeof value === "number") return value.toLocaleString(locale === "ar" ? "ar-AE" : "en-AE");
    return localizedRecordText(locale, value);
  }

  function ledgerSummary(event: DecisionLedgerEvent) {
    if (locale === "en") return event.summary;
    if (event.type === "brief_confirmed") return copy.ledgerBrief(event.assertionIds.length);
    const property = properties.find((candidate) => event.assertionIds.some((id) => evidence.find((assertion) => assertion.id === id)?.propertyId === candidate.id))
      ?? properties.find((candidate) => event.summary.includes(candidate.name));
    if (event.type === "candidate_seen") return copy.ledgerSeen(property?.name ?? "العقار");
    if (event.type === "candidate_dismissed") return copy.candidateDismissed(property?.name ?? "العقار");
    if (event.type === "criterion_revised") return copy.ledgerRevised;
    return copy.ledgerQuestion;
  }

  const room = (
    <main className="decision-room">
      <header className="decision-room__header">
        <div className="decision-room__identity"><p>{copy.room}</p><span>{envelope.brief.criteria.map((criterion) => localizedCriterionLabel(locale, criterion.label)).join(" · ") || envelope.brief.normalized}</span></div>
        <div className="decision-room__header-actions">
          {modal ? <a href={localizedPath(locale, `/discover/${envelope.searchRunId}`)}>{copy.openFull}</a> : <Link href={localizedPath(locale)}><ArrowLeft aria-hidden="true" /> {copy.back}</Link>}
          {modal ? <Button variant="ghost" size="icon-sm" aria-label={copy.close} onPress={closeModal}><X aria-hidden="true" /></Button> : null}
        </div>
      </header>

      <div className="decision-room__body">
        <section className="decision-room__brief" aria-label={copy.currentBrief}>
          <div className="decision-room__criteria">
            {envelope.brief.criteria.map((criterion) => <p key={criterion.key}><span>{criterion.kind === "hard" ? copy.required : copy.preferred}</span>{localizedCriterionLabel(locale, criterion.label)}</p>)}
          </div>
          <p className="decision-room__source-summary"><ShieldCheck aria-hidden="true" />{copy.sourceSummary(envelope.sourceSummary.publishedCount, envelope.sourceSummary.illustrativeCount)}</p>
        </section>

        {restorationNotices.map((notice) => <div key={`${notice.title}:${notice.message}`} role="status" className="room-notice"><strong>{locale === "ar" ? copy.restorationTitle : notice.title}.</strong> {locale === "ar" ? copy.restorationBody : notice.message}</div>)}

        {!selected ? (
          <section className="decision-room__empty">
            <p className="eyebrow">{copy.briefPreserved}</p><h1>{copy.noExact}</h1>
            <p>{copy.noExactBody}</p>
            <Button onPress={() => modal ? router.back() : router.push(`${localizedPath(locale)}#guided-search`)}>{copy.refine}</Button>
          </section>
        ) : (
          <>
            <article className="decision-room__lead" aria-labelledby="lead-property-title">
              <div className="decision-room__lead-media">
                <Image src={selected.image.url} alt={localizedRecordText(locale, selected.image.alt)} fill loading="eager" fetchPriority="high" sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" />
                <div className="decision-room__lead-caption"><p>{copy.strongest}</p><h1 id="lead-property-title">{selected.name}</h1></div>
              </div>
              <div className="decision-room__lead-summary">
                <div className="decision-room__location-price"><p><MapPin aria-hidden="true" /> {localizedCriterionLabel(locale, selected.location)}</p><strong><bdi>{formatAed(selected.price.amount, locale)}</bdi></strong></div>
                <PropertyFacts property={selected} locale={locale} copy={copy} />
                <p className="decision-room__description">{localizedRecordText(locale, selected.description ?? selected.feature)}</p>
                <div className="decision-room__match"><Check aria-hidden="true" /><div><span>{copy.why}</span><p>{localizedRecordText(locale, selected.matchReason)}</p></div></div>
                <Button className="decision-room__learn-more" variant="outline" aria-expanded={detailsExpanded} aria-controls="property-dossier" onPress={() => detailsExpanded ? setDetailsExpanded(false) : expandProperty("lead")}>
                  {detailsExpanded ? copy.closeDossier : copy.learnMore}<ChevronDown aria-hidden="true" data-expanded={detailsExpanded} />
                </Button>
              </div>
            </article>

            {detailsExpanded ? (
              <section id="property-dossier" className="property-dossier" aria-labelledby="dossier-title">
                <div className="property-dossier__heading">
                  <p className="eyebrow">{copy.dossier}</p><h2 ref={dossierTitleRef} id="dossier-title" tabIndex={-1}>{copy.inspect}</h2>
                  <p>{copy.factsBoundary}</p>
                </div>
                <dl className="property-dossier__ledger">
                  <div><dt>{copy.source}</dt><dd>{localizedRecordText(locale, selected.provenance.sourceName)}</dd></div>
                  <div><dt>{copy.status}</dt><dd>{selected.provenance.kind === "illustrative" ? copy.illustrative : copy.published}</dd></div>
                  <div><dt>{copy.sourceVersion}</dt><dd>{sourceVersion(selected)}</dd></div>
                  <div><dt>{copy.observed}</dt><dd><bdi>{selected.provenance.observedAt ? new Date(selected.provenance.observedAt).toLocaleDateString(locale === "ar" ? "ar-AE" : "en-AE") : copy.notSupplied}</bdi></dd></div>
                  <div><dt>{copy.completion}</dt><dd>{localizedRecordText(locale, selected.completionStatus)}</dd></div>
                  <div><dt>{copy.availability}</dt><dd>{localizedRecordText(locale, selected.availabilityStatus)}</dd></div>
                </dl>
                {evidence.length ? (
                  <div className="property-evidence" aria-labelledby="property-evidence-title">
                    <div><p className="eyebrow">{copy.evidence}</p><h3 id="property-evidence-title">{copy.knows}</h3></div>
                    <ul>
                      {evidence.filter((assertion) => assertion.propertyId === selected.id).map((assertion) => (
                        <li key={assertion.id}>
                          <EvidenceState state={assertion.state} label={evidenceStateLabel(assertion.state, copy)} />
                          <strong>{evidenceLabel(assertion)}</strong>
                          <p><bdi>{evidenceValue(assertion, assertion.currentValue)}</bdi></p>
                          {assertion.asSeenValue !== assertion.currentValue ? <small>{copy.asFirstSeen}: <bdi>{evidenceValue(assertion, assertion.asSeenValue)}</bdi></small> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <ConsentHandoff
                  eligible={Boolean(selected.organizationId)}
                  title={selected.organizationId ? copy.advisorHandoff : copy.illustrative}
                  body={selected.organizationId ? copy.advisorTitle : copy.advisorUnavailable}
                />
                <div className="property-dossier__actions">
                  {toolActions.map((action) => <Button key={action} variant="outline" size="sm" isDisabled={loadingTool !== null} onPress={() => void runTool(action)}>{loadingTool === action ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}{copy.toolActions[action]}</Button>)}
                  {selected.organizationId ? <Button size="sm" onPress={() => setHandoffOpen((current) => !current)}>{copy.askAdvisor}</Button> : <Button variant="outline" size="sm" isDisabled>{copy.advisorUnavailable}</Button>}
                </div>
                {toolStatus ? <p role="status" className="property-dossier__status">{toolStatus}</p> : null}
                <AgentResponseBlocks blocks={blocks} locale={locale} />
                {handoffOpen && selected.organizationId ? (
                  <form className="advisor-handoff" onSubmit={submitHandoff}>
                    <div><p className="eyebrow">{copy.advisorHandoff}</p><h3>{copy.advisorTitle}</h3></div>
                    <div className="advisor-handoff__fields">
                      <label>{copy.fullName}<input required name="fullName" minLength={2} maxLength={120} /></label>
                      <label>{copy.emailOrPhone}<input name="email" type="email" maxLength={254} /></label>
                      <label>{copy.phoneOrEmail}<input name="phone" maxLength={40} /></label>
                      <label className="advisor-handoff__message">{copy.advisorQuestion}<textarea name="message" maxLength={1000} defaultValue={copy.advisorMessage(selected.name)} /></label>
                    </div>
                    <label className="advisor-handoff__consent"><input required name="consent" type="checkbox" />{copy.advisorConsent}</label>
                    <div className="advisor-handoff__submit"><Button type="submit" size="sm" isDisabled={handoffSubmitting}>{handoffSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}{copy.sendAdvisor} <ArrowRight aria-hidden="true" /></Button>{handoffStatus ? <p role="status">{handoffStatus}</p> : null}</div>
                  </form>
                ) : null}
              </section>
            ) : null}

            <section className="decision-room__shortlist" aria-labelledby="shortlist-title">
              <div className="decision-room__section-heading">
                <div><p className="eyebrow">{copy.secondary}</p><h2 id="shortlist-title">{copy.alternatives}</h2></div>
                {properties.length >= 2 ? <Button variant="outline" size="sm" isDisabled={compareIds.length < 2 || loadingTool !== null} onPress={() => void runTool("compare")}>{copy.compare} {compareIds.length}</Button> : null}
              </div>
              <ol className="decision-room__shortlist-list">
                {properties.filter((property) => !dismissedIds.includes(property.id)).map((property, index) => (
                  <li key={property.id} data-selected={property.id === selected.id}>
                    <button type="button" onClick={() => selectProperty(property)}><span aria-hidden="true" className="decision-room__shortlist-number">{String(index + 1).padStart(2, "0")}</span><span><strong>{property.name}</strong><small>{localizedCriterionLabel(locale, property.location)} · <bdi>{formatAed(property.price.amount, locale)}</bdi></small></span></button>
                    <Button variant="ghost" size="sm" onPress={() => expandProperty("shortlist", property)}>{copy.learnMore}</Button>
                    {property.id !== selected.id ? <Button variant="ghost" size="sm" onPress={() => void dismissCandidate(property)}>{copy.dismiss}</Button> : null}
                    <label><input aria-label={copy.compareProperty(property.name)} type="checkbox" disabled={loadingTool === "compare"} checked={compareIds.includes(property.id)} onChange={() => toggleCompare(property.id)} />{copy.compare}</label>
                  </li>
                ))}
              </ol>
              {ledgerStatus ? <p className="property-dossier__status" role="status">{ledgerStatus}</p> : null}
            </section>

            <SavedBriefControl envelope={envelope} locale={locale} />

            <DecisionRoomVoiceComposer
              key={selected.id}
              context={`You are continuing inside Decision Room ${envelope.searchRunId}. The selected property is ${selected.name}, property ID ${selected.id}, in ${selected.location}. The visible brief criteria are ${envelope.brief.criteria.map((criterion) => criterion.label).join(", ")}. Use governed tools for every property fact and keep responses concise.`}
              locale={locale}
              onToolResult={(result) => { setBlocks(result.blocks); setToolStatus(locale === "ar" ? copy.toolReady : result.summary); }}
            />
            {ledger.length ? (
              <section className="decision-ledger" aria-labelledby="decision-ledger-title">
                <div><p className="eyebrow">{copy.ledger}</p><h2 id="decision-ledger-title">{copy.ledgerTitle}</h2></div>
                <DecisionLedgerTimeline items={ledger.map((event) => ({
                  id: event.id,
                  label: ledgerSummary(event),
                  detail: event.type.replaceAll("_", " "),
                  time: new Date(event.occurredAt).toLocaleString(locale === "ar" ? "ar-AE" : "en-AE"),
                }))} />
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );

  if (!modal) return <div className="decision-room-page">{room}</div>;
  return (
    <ModalOverlay isOpen isDismissable onOpenChange={(open) => { if (!open) closeModal(); }} className="decision-room-overlay">
      <Modal className="decision-room-modal"><Dialog aria-label={copy.room} className="decision-room-dialog">{room}</Dialog></Modal>
    </ModalOverlay>
  );
}
