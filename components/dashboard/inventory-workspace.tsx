"use client";

import { ArrowRight, CheckCircle2, Database, Filter, Search, ShieldCheck, TriangleAlert, X } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { PublicationControl } from "@/components/dashboard/publication-control";
import { SectionHeader } from "@/components/dashboard/page-header";

export type InventoryRecord = {
  id: string;
  name: string;
  location: string;
  price_aed: number;
  beds: number;
  baths: number;
  area_sq_ft: number;
  publication_status: string;
  availability_status: string;
  source_name: string | null;
  source_updated_at: string | null;
  updated_at: string;
  image_url: string;
  image_alt: string;
  description: string;
  feature: string;
  version: number;
};

function formatAed(value: number) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value);
}

function sourceState(record: InventoryRecord) {
  if (!record.source_name || !record.source_updated_at) return { label: "Source missing", tone: "error" };
  const age = Date.now() - new Date(record.source_updated_at).getTime();
  if (age > 30 * 24 * 60 * 60 * 1000) return { label: "Refresh required", tone: "warning" };
  return { label: "Source current", tone: "success" };
}

export function InventoryWorkspace({ records, canPublish, canAdvanceCatalog, initialStatus = "all", initialHealth = "all" }: { records: InventoryRecord[]; canPublish: boolean; canAdvanceCatalog: boolean; initialStatus?: string; initialHealth?: "all" | "attention" }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [health, setHealth] = useState(initialHealth);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => records.filter((record) => {
    const matchesQuery = `${record.name} ${record.location} ${record.source_name ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const source = sourceState(record);
    const matchesStatus = status === "all" || record.publication_status === status;
    const matchesHealth = health === "all" || source.tone !== "success";
    return matchesQuery && matchesStatus && matchesHealth;
  }), [health, records, query, status]);
  const selected = records.find((record) => record.id === selectedId) ?? null;

  return <section className="ops-data-surface" aria-labelledby="inventory-heading">
    <SectionHeader eyebrow="Workspace catalog" title="Governed residences" meta={`${records.length} controlled record${records.length === 1 ? "" : "s"}`} />
    <div className="ops-data-toolbar">
      <label className="ops-table-search"><Search aria-hidden="true" /><span className="sr-only">Search inventory</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search residence, community, or source" /></label>
      <label className="ops-filter-select"><Filter aria-hidden="true" /><span className="sr-only">Filter publication state</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All states</option><option value="draft">Draft</option><option value="in_review">In review</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
      <label className="ops-filter-select"><TriangleAlert aria-hidden="true" /><span className="sr-only">Filter source health</span><select value={health} onChange={(event) => setHealth(event.target.value as "all" | "attention")}><option value="all">All source health</option><option value="attention">Needs attention</option></select></label>
      <div className="ops-view-summary"><span>{filtered.length} shown</span><small>Sorted by latest change</small></div>
    </div>

    {records.length ? <>
      <div className="ops-table-wrap ops-desktop-table"><table><thead><tr><th>Residence</th><th>Commercials</th><th>Source health</th><th>AI readiness</th><th>Publication</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((record) => {
        const source = sourceState(record);
        return <tr key={record.id} data-selected={record.id === selectedId}>
          <td><button className="ops-record-link" type="button" onClick={() => setSelectedId(record.id)}><strong>{record.name}</strong><span>{record.location} · {record.beds} bed · {record.area_sq_ft.toLocaleString("en-AE")} sq ft</span></button></td>
          <td><strong>{formatAed(record.price_aed)}</strong><span>{record.availability_status}</span></td>
          <td><span className="ops-inline-status" data-tone={source.tone}>{source.tone === "success" ? <CheckCircle2 aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}{source.label}</span><small>{record.source_name || "No provider"}</small></td>
          <td><span className="ops-inline-status" data-tone={source.tone === "success" ? "success" : "warning"}><ShieldCheck aria-hidden="true" />{source.tone === "success" ? "Core facts ready" : "Blocked"}</span><small>Version {record.version}</small></td>
          <td><span className="ops-status" data-status={record.publication_status}>{record.publication_status.replace("_", " ")}</span></td>
          <td><button className="ops-row-action" type="button" onClick={() => setSelectedId(record.id)} aria-label={`Inspect ${record.name}`}><ArrowRight aria-hidden="true" /></button></td>
        </tr>;
      })}</tbody></table></div>
      <div className="ops-mobile-records">{filtered.map((record) => { const source = sourceState(record); return <button key={record.id} type="button" onClick={() => setSelectedId(record.id)}><span><strong>{record.name}</strong><small>{record.location} · {formatAed(record.price_aed)}</small></span><span className="ops-status" data-status={record.publication_status}>{record.publication_status.replace("_", " ")}</span><span><small>{source.label}</small><ArrowRight aria-hidden="true" /></span></button>; })}</div>
      {!filtered.length ? <div className="ops-filter-empty"><Search aria-hidden="true" /><strong>No records match this view.</strong><span>Clear the search or select another publication or source state.</span><button type="button" onClick={() => { setQuery(""); setStatus("all"); setHealth("all"); }}>Clear filters</button></div> : null}
    </> : <div className="ops-rich-empty"><div className="ops-empty-mark"><Database aria-hidden="true" /><span>01</span></div><div><p>First governed record</p><h3>Build the catalog Rama can explain.</h3><span>Add a source-backed residence, review its public facts, then publish it when every required field is current.</span></div><ol><li><span>1</span>Name the residence and community</li><li><span>2</span>Add facts, media, and provenance</li><li><span>3</span>Review exactly what buyers can see</li></ol></div>}

    {selected ? <><button className="ops-inspector-scrim" type="button" aria-label="Close property inspector" onClick={() => setSelectedId(null)} /><aside className="ops-inspector" aria-label={`${selected.name} inspector`}><header><div><p>Property inspector</p><h2>{selected.name}</h2><span>{selected.location}</span></div><button type="button" aria-label="Close property inspector" onClick={() => setSelectedId(null)}><X aria-hidden="true" /></button></header><div className="ops-inspector-media"><Image src={selected.image_url} alt={selected.image_alt} fill sizes="520px" className="object-cover" /></div><dl><div><dt>Price</dt><dd>{formatAed(selected.price_aed)}</dd></div><div><dt>Configuration</dt><dd>{selected.beds} bed · {selected.baths} bath</dd></div><div><dt>Area</dt><dd>{selected.area_sq_ft.toLocaleString("en-AE")} sq ft</dd></div><div><dt>Availability</dt><dd>{selected.availability_status}</dd></div></dl><section><p>Evidence-led feature</p><strong>{selected.feature}</strong><span>{selected.description}</span></section><section><p>Source and version</p><strong>{selected.source_name || "Source missing"}</strong><span>Version {selected.version} · Updated {new Intl.DateTimeFormat("en-AE", { dateStyle: "medium" }).format(new Date(selected.updated_at))}</span></section>{canAdvanceCatalog ? <div className="ops-inspector-action"><PublicationControl propertyId={selected.id} status={selected.publication_status} canPublish={canPublish} /></div> : <small className="ops-read-only">Your role has read-only access to this record.</small>}</aside></> : null}
  </section>;
}
