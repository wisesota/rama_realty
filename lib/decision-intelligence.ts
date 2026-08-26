import type { PreparedBrief } from "@/lib/brief-confirmation";

export type ClarificationQuestion = {
  field: string;
  question: { en: string; ar: string };
  informationGain: number;
  reason: string;
};

const questions: Record<string, Omit<ClarificationQuestion, "field">> = {
  "resolve property type": {
    question: { en: "Should Rama consider an apartment or a villa for this decision?", ar: "هل تريد أن تنظر راما في شقة أم فيلا لهذا القرار؟" },
    informationGain: 1.2,
    reason: "Conflicting property types make every candidate comparison ambiguous.",
  },
  "resolve delivery state": {
    question: { en: "Should Rama prioritize a ready home or an off-plan purchase?", ar: "هل تريد أن تعطي راما الأولوية لمنزل جاهز أم لشراء على المخطط؟" },
    informationGain: 1.1,
    reason: "Ready and off-plan paths carry different delivery evidence and risk questions.",
  },
  "maximum budget": {
    question: { en: "What is the highest purchase price you want Rama to consider?", ar: "ما أعلى سعر شراء تريد أن تأخذه راما في الاعتبار؟" },
    informationGain: 1,
    reason: "Budget removes ineligible supply and changes financing scenarios.",
  },
  "preferred area": {
    question: { en: "Which Dubai area should Rama prioritize, or should the area remain flexible?", ar: "أي منطقة في دبي تريد أن تعطيها راما الأولوية، أم تفضّل إبقاء المنطقة مرنة؟" },
    informationGain: 0.9,
    reason: "Location changes availability, lifestyle trade-offs, and price context.",
  },
};

export function rankClarificationQuestions(draft: PreparedBrief): ClarificationQuestion[] {
  const contradictionFields = (draft.contradictions ?? []).map((contradiction) => contradiction.code === "property_type_conflict"
    ? "resolve property type"
    : "resolve delivery state");
  return [...contradictionFields, ...draft.missingFields]
    .flatMap((field) => questions[field] ? [{ field, ...questions[field] }] : [])
    .sort((left, right) => right.informationGain - left.informationGain || left.field.localeCompare(right.field));
}
