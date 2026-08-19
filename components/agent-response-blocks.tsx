"use client";

import Image from "next/image";
import { Building2, Calculator, Check, FileText, Handshake, Layers3, MapPinned, MessageCircleQuestion, ReceiptText } from "lucide-react";
import type { AgentBlock } from "@/lib/agent/contracts";

function formatAed(value: number) {
  return new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value);
}

export function AgentResponseBlocks({ blocks }: { blocks: AgentBlock[] }) {
  if (!blocks.length) return null;
  return (
    <div className="agent-blocks" aria-label="Rama response canvas">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "property_grid":
            return <article className="agent-block agent-block--summary" key={key}><Building2 aria-hidden="true" /><div><span>Governed catalog</span><h3>{block.title}</h3><p>{block.summary}</p><small>{block.propertyIds.length} visible {block.propertyIds.length === 1 ? "candidate" : "candidates"}</small></div></article>;
          case "property_detail":
            return <article className="agent-block agent-block--detail" key={key}><Image src={block.property.image} alt={block.property.imageAlt} width={320} height={220} /><div><span>{block.availability}</span><h3>{block.property.name}</h3><p>{block.property.location} · {block.property.area}</p><strong>{block.property.price}</strong><small>{block.sourceLabel}</small></div></article>;
          case "comparison":
            return <article className="agent-block agent-block--comparison" key={key}><Layers3 aria-hidden="true" /><div><span>Side-by-side evidence</span><h3>{block.title}</h3><div className="agent-compare-grid">{block.properties.map((property) => <section key={property.id}><strong>{property.name}</strong><p>{property.price}</p><small>{property.beds} bed · {property.area}</small></section>)}</div></div></article>;
          case "payment_schedule":
            return <article className="agent-block agent-block--payment" key={key}><ReceiptText aria-hidden="true" /><div><span>Published payment schedule</span><h3>{block.title}</h3><ol>{block.installments.map((installment) => <li key={`${installment.label}-${installment.percentage}`}><span>{installment.label} · {installment.percentage}%</span><strong>{installment.dueEvent ?? (installment.dueOffsetMonths === null ? "Timing not supplied" : `Month ${installment.dueOffsetMonths}`)}</strong></li>)}</ol><small>{block.sourceLabel}{block.observedAt ? ` · observed ${new Date(block.observedAt).toLocaleDateString("en-AE")}` : ""}</small></div></article>;
          case "purchase_scenario":
            return <article className="agent-block agent-block--payment" key={key}><Calculator aria-hidden="true" /><div><span>Buyer scenario · not an offer</span><h3>{block.title}</h3><p>Price basis: {formatAed(block.propertyPrice)}</p><ol><li><span>Down payment · {block.assumptions.downPaymentPercent}%</span><strong>{formatAed(block.outputs.downPaymentAmount)}</strong></li><li><span>Finance amount</span><strong>{formatAed(block.outputs.financeAmount)}</strong></li>{block.outputs.estimatedMonthlyPayment !== null ? <li><span>Estimated monthly payment</span><strong>{formatAed(block.outputs.estimatedMonthlyPayment)}</strong></li> : null}{block.outputs.grossYieldPercent !== null ? <li><span>Illustrative gross yield</span><strong>{block.outputs.grossYieldPercent.toFixed(2)}%</strong></li> : null}</ol><small>{block.disclaimer}</small></div></article>;
          case "floor_plan":
            return <article className="agent-block agent-block--detail" key={key}><Image src={block.imageUrl} alt={block.imageAlt} width={320} height={220} /><div><span>Published floor plan</span><h3>{block.title}</h3><p>{block.beds ?? "—"} bed · {block.baths ?? "—"} bath · {block.areaSqFt?.toLocaleString("en-AE") ?? "—"} sq ft</p>{block.sourceLabel ? <small>{block.sourceLabel}</small> : null}</div></article>;
          case "document_list":
            return <article className="agent-block" key={key}><FileText aria-hidden="true" /><div><span>Published documents</span><h3>{block.title}</h3><ul>{block.documents.map((document) => <li key={document.id}><a href={document.url} target="_blank" rel="noreferrer">{document.title}</a><small>{document.sourceLabel} · v{document.version}</small></li>)}</ul></div></article>;
          case "development_detail":
            return <article className="agent-block" key={key}><Building2 aria-hidden="true" /><div><span>Development facts</span><h3>{block.title}</h3><p>{block.description ?? "No published development narrative is available."}</p><small>{block.developerName ?? "Developer not supplied"} · {block.community} · {block.completionStatus} · {block.sourceLabel}</small></div></article>;
          case "area_context":
            return <article className="agent-block" key={key}><MapPinned aria-hidden="true" /><div><span>Published area guide</span><h3>{block.title}</h3><p>{block.summary ?? "No published area narrative is available."}</p><small>{block.sourceLabel}</small></div></article>;
          case "clarification":
            return <article className="agent-block" key={key}><MessageCircleQuestion aria-hidden="true" /><div><span>One clarification</span><h3>{block.question}</h3><p>Missing: {block.missingFields.join(", ")}</p></div></article>;
          case "no_results":
            return <article className="agent-block" key={key}><MessageCircleQuestion aria-hidden="true" /><div><span>Brief preserved</span><h3>{block.title}</h3><p>{block.explanation}</p><ul>{block.suggestions.map((suggestion) => <li key={suggestion}><Check aria-hidden="true" />{suggestion}</li>)}</ul></div></article>;
          case "human_handoff":
            return <article className="agent-block" key={key}><Handshake aria-hidden="true" /><div><span>Consent required</span><h3>{block.title}</h3><p>{block.reason}</p><small>No contact data is shared until the buyer confirms.</small></div></article>;
        }
      })}
    </div>
  );
}
