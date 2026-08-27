"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PreparedBrief } from "@/lib/brief-confirmation";
import { rankClarificationQuestions } from "@/lib/decision-intelligence";
import {
  localizedAdvisoryBoundary,
  localizedClarification,
  localizedCriterionLabel,
  localizedMissingField,
  type PublicLocale,
} from "@/lib/i18n";

export function BriefConfirmation({
  draft,
  busy,
  recalculating = false,
  locale,
  onChange,
  onConfirm,
  onCancel,
  onRetry,
}: {
  draft: PreparedBrief;
  busy: boolean;
  recalculating?: boolean;
  locale: PublicLocale;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry?: () => void;
}) {
  const isArabic = locale === "ar";
  const clarifications = rankClarificationQuestions(draft).slice(0, 2);
  const hasContradiction = Boolean(draft.contradictions?.length);

  return (
    <section className="brief-confirmation" aria-labelledby="brief-confirmation-title" aria-busy={recalculating}>
      <div>
        <p className="eyebrow">{isArabic ? "راجع قبل البحث" : "Review before searching"}</p>
        <h2 id="brief-confirmation-title">{isArabic ? "هل هذا ما تقصده؟" : "Is this what you mean?"}</h2>
        <p>{isArabic ? "لن يُحفظ أي بحث حتى تؤكد هذه المتطلبات المكتوبة." : "No search run is saved until you confirm this written brief."}</p>
      </div>
      <label htmlFor="confirmed-brief">
        {isArabic ? "متطلباتك القابلة للتعديل" : "Your editable brief"}
        <textarea
          id="confirmed-brief"
          value={draft.transcript}
          maxLength={500}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      {recalculating ? <p className="brief-confirmation__recalculating" role="status" aria-live="polite">{isArabic ? "جارٍ إعادة حساب المعايير…" : "Recalculating criteria…"}</p> : null}
      <div className="brief-confirmation__criteria" aria-label={isArabic ? "المعايير المستنتجة" : "Inferred criteria"}>
        {draft.criteria.map((criterion) => (
          <span key={`${criterion.key}:${criterion.value}`}>
            <small>{criterion.kind === "hard" ? (isArabic ? "مطلوب" : "Required") : (isArabic ? "مفضّل" : "Preferred")}</small>
            {localizedCriterionLabel(locale, criterion.label)}
          </span>
        ))}
      </div>
      {draft.missingFields.length ? (
        <p className="brief-confirmation__unknowns">
          {isArabic
            ? `ما زال مفتوحًا: ${draft.missingFields.map((field) => localizedMissingField(locale, field)).join(" و")}. يمكنك التأكيد دون افتراضها.`
            : `Still open: ${draft.missingFields.join(" and ")}. You can confirm without inventing them.`}
        </p>
      ) : null}
      {clarifications.length ? (
        <div className="brief-confirmation__unknowns">
          <strong>{isArabic ? "أسئلة توضيحية مرتبة بالأثر" : "Highest-impact clarifications"}</strong>
          {clarifications.map((question) => (
            <p key={question.field}>{localizedClarification(locale, question.field, question.question[locale])}</p>
          ))}
        </div>
      ) : null}
      {draft.advisoryBoundaries?.length ? (
        <div className="brief-confirmation__unknowns" role="note">
          {draft.advisoryBoundaries.map((boundary) => <p key={boundary}>{localizedAdvisoryBoundary(locale, boundary)}</p>)}
        </div>
      ) : null}
      <div className="brief-confirmation__actions">
        <Button type="button" isDisabled={busy || recalculating || draft.transcript.trim().length < 3 || hasContradiction} onPress={onConfirm}>
          <Check aria-hidden="true" /> {busy ? (isArabic ? "جارٍ فتح غرفة القرار…" : "Opening Decision Room…") : (isArabic ? "أكّد وابحث" : "Confirm and search")}
        </Button>
        {onRetry ? <Button type="button" variant="outline" isDisabled={busy || recalculating} onPress={onRetry}><RotateCcw aria-hidden="true" /> {isArabic ? "أعد المحاولة صوتيًا" : "Retry voice"}</Button> : null}
        <Button type="button" variant="ghost" isDisabled={busy} onPress={onCancel}><X aria-hidden="true" /> {isArabic ? "إلغاء" : "Cancel"}</Button>
      </div>
    </section>
  );
}
