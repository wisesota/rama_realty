"use client";

import Image from "next/image";
import { Building2, Calculator, Check, FileText, Handshake, Layers3, MapPinned, MessageCircleQuestion, ReceiptText } from "lucide-react";
import type { AgentBlock } from "@/lib/agent/contracts";
import { localizedClarification, localizedCriterionLabel, localizedMissingField, localizedRecordText, type PublicLocale } from "@/lib/i18n";

function formatAed(value: number, locale: PublicLocale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-AE" : "en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(value);
}

const responseCopy = {
  en: { canvas: "Rama response canvas", catalog: "Governed catalog", visible: "visible", candidate: "candidate", candidates: "candidates", comparison: "Side-by-side evidence", bed: "bed", payment: "Published payment schedule", timing: "Timing not supplied", month: "Month", observed: "observed", scenario: "Buyer scenario · not an offer", scenarioTitle: "Buyer scenario", price: "Price basis", down: "Down payment", finance: "Finance amount", monthly: "Estimated monthly payment", yield: "Illustrative gross yield", scenarioDisclaimer: "Illustrative calculation from buyer-selected assumptions. It is not an offer, valuation, approval, or professional advice.", floorPlan: "Published floor plan", bath: "bath", squareFeet: "sq ft", documents: "Published documents", development: "Development facts", noDevelopment: "No published development narrative is available.", noDeveloper: "Developer not supplied", area: "Published area guide", noArea: "No published area narrative is available.", clarification: "One clarification", missing: "Missing", preserved: "Brief preserved", noResults: "No exact residence yet", noResultsBody: "No governed residence currently matches every required criterion.", consent: "Consent required", consentBody: "No contact data is shared until the buyer confirms." },
  ar: { canvas: "لوحة استجابة راما", catalog: "الكتالوج المنضبط", visible: "ظاهر", candidate: "مرشح", candidates: "مرشحين", comparison: "أدلة جنباً إلى جنب", bed: "غرفة نوم", payment: "جدول دفعات منشور", timing: "موعد غير متاح", month: "الشهر", observed: "رُصد في", scenario: "سيناريو المشتري · ليس عرضاً", scenarioTitle: "سيناريو المشتري", price: "أساس السعر", down: "الدفعة الأولى", finance: "مبلغ التمويل", monthly: "الدفعة الشهرية التقديرية", yield: "العائد الإجمالي التوضيحي", scenarioDisclaimer: "حساب توضيحي من افتراضات اختارها المشتري. ليس عرضاً أو تقييماً أو موافقة أو نصيحة مهنية.", floorPlan: "مخطط منشور", bath: "حمّام", squareFeet: "قدم مربع", documents: "مستندات منشورة", development: "حقائق المشروع", noDevelopment: "لا يتوفر وصف منشور للمشروع.", noDeveloper: "المطوّر غير متاح", area: "دليل منطقة منشور", noArea: "لا يتوفر وصف منشور للمنطقة.", clarification: "استيضاح واحد", missing: "ناقص", preserved: "تم حفظ الموجز", noResults: "لا يوجد مسكن مطابق تماماً بعد", noResultsBody: "لا يوجد مسكن منضبط يطابق حالياً كل معيار مطلوب.", consent: "الموافقة مطلوبة", consentBody: "لا تتم مشاركة بيانات الاتصال حتى يؤكد المشتري موافقته." },
} as const;

export function AgentResponseBlocks({ blocks, locale = "en" }: { blocks: AgentBlock[]; locale?: PublicLocale }) {
  if (!blocks.length) return null;
  const copy = responseCopy[locale];
  const numberLocale = locale === "ar" ? "ar-AE" : "en-AE";
  return (
    <div className="agent-blocks" aria-label={copy.canvas}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "property_grid":
            return <article className="agent-block agent-block--summary" key={key}><Building2 aria-hidden="true" /><div><span>{copy.catalog}</span><h3>{locale === "ar" ? copy.catalog : block.title}</h3><p>{locale === "ar" ? `${block.propertyIds.length.toLocaleString(numberLocale)} ${copy.candidates}` : block.summary}</p><small>{block.propertyIds.length.toLocaleString(numberLocale)} {copy.visible} {block.propertyIds.length === 1 ? copy.candidate : copy.candidates}</small></div></article>;
          case "property_detail":
            return <article className="agent-block agent-block--detail" key={key}><Image src={block.property.image} alt={localizedRecordText(locale, block.property.imageAlt)} width={320} height={220} /><div><span>{localizedRecordText(locale, block.availability)}</span><h3>{block.property.name}</h3><p>{localizedCriterionLabel(locale, block.property.location)} · {block.property.area}</p><strong><bdi>{block.property.price}</bdi></strong><small>{localizedRecordText(locale, block.sourceLabel)}</small></div></article>;
          case "comparison":
            return <article className="agent-block agent-block--comparison" key={key}><Layers3 aria-hidden="true" /><div><span>{copy.comparison}</span><h3>{locale === "ar" ? copy.comparison : block.title}</h3><div className="agent-compare-grid">{block.properties.map((property) => <section key={property.id}><strong>{property.name}</strong><p><bdi>{property.price}</bdi></p><small>{property.beds.toLocaleString(numberLocale)} {copy.bed} · {property.area}</small></section>)}</div></div></article>;
          case "payment_schedule":
            return <article className="agent-block agent-block--payment" key={key}><ReceiptText aria-hidden="true" /><div><span>{copy.payment}</span><h3>{block.title}</h3><ol>{block.installments.map((installment) => <li key={`${installment.label}-${installment.percentage}`}><span>{installment.label} · {installment.percentage.toLocaleString(numberLocale)}%</span><strong>{installment.dueEvent ?? (installment.dueOffsetMonths === null ? copy.timing : `${copy.month} ${installment.dueOffsetMonths.toLocaleString(numberLocale)}`)}</strong></li>)}</ol><small>{localizedRecordText(locale, block.sourceLabel)}{block.observedAt ? ` · ${copy.observed} ${new Date(block.observedAt).toLocaleDateString(numberLocale)}` : ""}</small></div></article>;
          case "purchase_scenario":
            return <article className="agent-block agent-block--payment" key={key}><Calculator aria-hidden="true" /><div><span>{copy.scenario}</span><h3>{locale === "ar" ? copy.scenarioTitle : block.title}</h3><p>{copy.price}: <bdi>{formatAed(block.propertyPrice, locale)}</bdi></p><ol><li><span>{copy.down} · {block.assumptions.downPaymentPercent.toLocaleString(numberLocale)}%</span><strong><bdi>{formatAed(block.outputs.downPaymentAmount, locale)}</bdi></strong></li><li><span>{copy.finance}</span><strong><bdi>{formatAed(block.outputs.financeAmount, locale)}</bdi></strong></li>{block.outputs.estimatedMonthlyPayment !== null ? <li><span>{copy.monthly}</span><strong><bdi>{formatAed(block.outputs.estimatedMonthlyPayment, locale)}</bdi></strong></li> : null}{block.outputs.grossYieldPercent !== null ? <li><span>{copy.yield}</span><strong>{block.outputs.grossYieldPercent.toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</strong></li> : null}</ol><small>{locale === "ar" ? copy.scenarioDisclaimer : block.disclaimer}</small></div></article>;
          case "floor_plan":
            return <article className="agent-block agent-block--detail" key={key}><Image src={block.imageUrl} alt={block.imageAlt} width={320} height={220} /><div><span>{copy.floorPlan}</span><h3>{block.title}</h3><p>{block.beds?.toLocaleString(numberLocale) ?? "—"} {copy.bed} · {block.baths?.toLocaleString(numberLocale) ?? "—"} {copy.bath} · {block.areaSqFt?.toLocaleString(numberLocale) ?? "—"} {copy.squareFeet}</p>{block.sourceLabel ? <small>{localizedRecordText(locale, block.sourceLabel)}</small> : null}</div></article>;
          case "document_list":
            return <article className="agent-block" key={key}><FileText aria-hidden="true" /><div><span>{copy.documents}</span><h3>{locale === "ar" ? copy.documents : block.title}</h3><ul>{block.documents.map((document) => <li key={document.id}><a href={document.url} target="_blank" rel="noreferrer">{document.title}</a><small>{localizedRecordText(locale, document.sourceLabel)} · v{document.version.toLocaleString(numberLocale)}</small></li>)}</ul></div></article>;
          case "development_detail":
            return <article className="agent-block" key={key}><Building2 aria-hidden="true" /><div><span>{copy.development}</span><h3>{block.title}</h3><p>{block.description ?? copy.noDevelopment}</p><small>{block.developerName ?? copy.noDeveloper} · {localizedCriterionLabel(locale, block.community)} · {localizedRecordText(locale, block.completionStatus)} · {localizedRecordText(locale, block.sourceLabel)}</small></div></article>;
          case "area_context":
            return <article className="agent-block" key={key}><MapPinned aria-hidden="true" /><div><span>{copy.area}</span><h3>{block.title}</h3><p>{block.summary ?? copy.noArea}</p><small>{localizedRecordText(locale, block.sourceLabel)}</small></div></article>;
          case "clarification":
            return <article className="agent-block" key={key}><MessageCircleQuestion aria-hidden="true" /><div><span>{copy.clarification}</span><h3>{localizedClarification(locale, block.missingFields[0] ?? "", block.question)}</h3><p>{copy.missing}: {block.missingFields.map((field) => localizedMissingField(locale, field)).join("، ")}</p></div></article>;
          case "no_results":
            return <article className="agent-block" key={key}><MessageCircleQuestion aria-hidden="true" /><div><span>{copy.preserved}</span><h3>{locale === "ar" ? copy.noResults : block.title}</h3><p>{locale === "ar" ? copy.noResultsBody : block.explanation}</p><ul>{block.suggestions.map((suggestion) => <li key={suggestion}><Check aria-hidden="true" />{localizedCriterionLabel(locale, suggestion)}</li>)}</ul></div></article>;
          case "human_handoff":
            return <article className="agent-block" key={key}><Handshake aria-hidden="true" /><div><span>{copy.consent}</span><h3>{locale === "ar" ? copy.consent : block.title}</h3><p>{block.reason}</p><small>{copy.consentBody}</small></div></article>;
        }
      })}
    </div>
  );
}
