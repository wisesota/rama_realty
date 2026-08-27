import type { BuyerCriterion } from "@/lib/agent/buyer-contracts";
import type { BriefContradiction, PreparedBrief } from "@/lib/brief-confirmation";
import { localizedCriterionLabel, localizedMissingField, type PublicLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type CriteriaSlipModel = {
  source: "example" | "buyer";
  required: BuyerCriterion[];
  preferred: BuyerCriterion[];
  unknowns: string[];
  contradictions: BriefContradiction[];
};

export function criteriaSlipFromPreparedBrief(draft: PreparedBrief): CriteriaSlipModel {
  return {
    source: "buyer",
    required: draft.criteria.filter((criterion) => criterion.kind === "hard"),
    preferred: draft.criteria.filter((criterion) => criterion.kind === "preference"),
    unknowns: draft.missingFields,
    contradictions: draft.contradictions ?? [],
  };
}

export function CriteriaSlip({
  model,
  locale,
  className,
}: {
  model: CriteriaSlipModel;
  locale: PublicLocale;
  className?: string;
}) {
  const isArabic = locale === "ar";
  const rows = [
    {
      key: "required",
      label: isArabic ? "مطلوب" : "Required",
      values: model.required.map((criterion) => localizedCriterionLabel(locale, criterion.label)),
    },
    {
      key: "preferred",
      label: isArabic ? "مفضّل" : "Preferred",
      values: model.preferred.map((criterion) => localizedCriterionLabel(locale, criterion.label)),
    },
    {
      key: "unknown",
      label: isArabic ? "غير محسوم" : "Unknown",
      values: model.unknowns.map((field) => localizedMissingField(locale, field)),
    },
  ];

  return (
    <section className={cn("criteria-slip", className)} data-source={model.source} aria-label={isArabic ? "ملخص معايير الموجز" : "Brief criteria summary"}>
      <header className="criteria-slip__header">
        <span>{model.source === "example" ? (isArabic ? "مثال / غير محفوظ" : "Example / not saved") : (isArabic ? "موجزك / مسودة" : "Your brief / draft")}</span>
        <span>{isArabic ? "قبل البحث" : "Before search"}</span>
      </header>
      <dl className="criteria-slip__rows">
        {rows.map((row) => (
          <div key={row.key} data-state={row.key}>
            <dt>{row.label}</dt>
            <dd>{row.values.length ? row.values.join(" · ") : (isArabic ? "لم يُحدد بعد" : "Not stated yet")}</dd>
          </div>
        ))}
      </dl>
      {model.contradictions.length ? (
        <div className="criteria-slip__contradiction" role="alert">
          <strong>{isArabic ? "يلزم التوضيح" : "Clarification required"}</strong>
          <span>{isArabic ? "يتضمن الموجز متطلبات متعارضة. عدّله قبل التأكيد." : "The brief contains incompatible requirements. Edit it before confirming."}</span>
        </div>
      ) : (
        <p className="criteria-slip__note">{isArabic ? "ستسأل راما قبل أن تفترض." : "Rama will ask before assuming."}</p>
      )}
    </section>
  );
}
