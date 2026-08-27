import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { prepareBriefDraft } from "@/lib/brief-confirmation";
import { rankClarificationQuestions } from "@/lib/decision-intelligence";
import { localizedClarification, localizedCriterionLabel, localizedMissingField } from "@/lib/i18n";

type Case = {
  id: string;
  locale: string;
  brief: string;
  expected?: string[];
  expectedMissing?: string[];
  expectedBoundaries?: string[];
  expectedContradictions?: string[];
  mustNotCreatePropertyTruth?: boolean;
};
const cases = JSON.parse(readFileSync(new URL("./fixtures/brief-evaluation-v1.json", import.meta.url), "utf8")) as Case[];

describe("versioned brief evaluation v1", () => {
  for (const item of cases) {
    it(item.id, () => {
      const draft = prepareBriefDraft({ brief: item.brief, source: "text", draftId: `evaluation-${item.id}-0001` });
      if (item.expected) expect(draft.criteria.map((criterion) => criterion.label)).toEqual(expect.arrayContaining(item.expected));
      if (item.expectedMissing) expect(draft.missingFields).toEqual(item.expectedMissing);
      if (item.expectedBoundaries) expect(draft.advisoryBoundaries).toEqual(item.expectedBoundaries);
      if (item.expectedContradictions) expect(draft.contradictions?.map((contradiction) => contradiction.code)).toEqual(item.expectedContradictions);
      if (item.mustNotCreatePropertyTruth) {
        expect(draft).not.toHaveProperty("properties");
        expect(draft).not.toHaveProperty("searchRunId");
      }
    });
  }

  it("ranks budget ahead of location by expected decision impact", () => {
    const draft = prepareBriefDraft({ brief: "A quiet apartment", source: "text", draftId: "evaluation-ranking-0001" });
    expect(rankClarificationQuestions(draft).map((question) => question.field)).toEqual(["maximum budget", "preferred area"]);
  });

  it("ranks an explicit contradiction ahead of otherwise missing fields", () => {
    const draft = prepareBriefDraft({ brief: "It must be both an apartment and a villa", source: "voice", draftId: "evaluation-conflict-0001" });
    expect(rankClarificationQuestions(draft).map((question) => question.field)).toEqual([
      "resolve property type",
      "maximum budget",
      "preferred area",
    ]);
  });

  it("scores deterministic extraction, escalation, contradiction, and localized presentation gates", () => {
    const evaluated = cases.map((item) => ({
      item,
      draft: prepareBriefDraft({ brief: item.brief, source: "text", draftId: `score-${item.id}-0001` }),
    }));
    const extraction = evaluated.filter(({ item }) => item.expected);
    const escalation = evaluated.filter(({ item }) => item.expectedBoundaries);
    const contradictions = evaluated.filter(({ item }) => item.expectedContradictions);
    const extractionCorrect = extraction.filter(({ item, draft }) => item.expected?.every((label) => draft.criteria.some((criterion) => criterion.label === label))).length;
    const escalationCorrect = escalation.filter(({ item, draft }) => JSON.stringify(draft.advisoryBoundaries) === JSON.stringify(item.expectedBoundaries)).length;
    const contradictionCorrect = contradictions.filter(({ item, draft }) => JSON.stringify(draft.contradictions?.map((entry) => entry.code)) === JSON.stringify(item.expectedContradictions)).length;
    const unsupportedTruth = evaluated.filter(({ item, draft }) => item.mustNotCreatePropertyTruth && ("properties" in draft || "searchRunId" in draft)).length;
    const arabicCases = cases.filter((item) => item.locale === "ar");
    const localizedLocaleQuality = arabicCases.length > 0
      && localizedCriterionLabel("ar", "Dubai Marina") === "دبي مارينا"
      && localizedMissingField("ar", "maximum budget") === "الميزانية القصوى"
      && localizedClarification("ar", "preferred area", "fallback").includes("دبي");

    expect({
      extractionCorrectness: extractionCorrect / extraction.length,
      escalationCorrectness: escalationCorrect / escalation.length,
      contradictionCorrectness: contradictionCorrect / contradictions.length,
      unsupportedPropertyTruthRate: unsupportedTruth / evaluated.length,
      localeCoverage: new Set(cases.map((item) => item.locale)).size,
      localizedLocaleQuality,
    }).toEqual({
      extractionCorrectness: 1,
      escalationCorrectness: 1,
      contradictionCorrectness: 1,
      unsupportedPropertyTruthRate: 0,
      localeCoverage: 2,
      localizedLocaleQuality: true,
    });
  });
});
