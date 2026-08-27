import { describe, expect, it } from "vitest";
import {
  agentToolNames,
  geminiLiveTools,
  isAgentBlock,
  isAgentToolName,
  isAgentToolResponse,
  parseAgentToolArguments,
  propertySearchBlocks,
} from "@/lib/agent/contracts";
import { sampleProperties } from "@/lib/sample-properties";

describe("agent tool boundary", () => {
  it("keeps the Gemini Live manifest aligned with the server allowlist", () => {
    const manifestNames = geminiLiveTools.flatMap((tool) =>
      tool.functionDeclarations?.map((declaration) => declaration.name) ?? []
    );

    expect(manifestNames).toEqual([...agentToolNames]);
  });

  it("allows only the bounded real-estate tools", () => {
    expect(isAgentToolName("prepare_brief")).toBe(true);
    expect(isAgentToolName("run_sql")).toBe(false);
    expect(isAgentToolName("fetch_url")).toBe(false);
  });

  it("validates each tool family and rejects extra arguments", () => {
    expect(parseAgentToolArguments("prepare_brief", { brief: "Two bedrooms in Dubai Marina" }).ok).toBe(true);
    expect(parseAgentToolArguments("compare_properties", { propertyIds: ["home-1", "home-2"] }).ok).toBe(true);
    expect(parseAgentToolArguments("calculate_purchase_scenario", { propertyId: "home-1", downPaymentPercent: 25, annualInterestPercent: 5, termYears: 25 }).ok).toBe(true);
    expect(parseAgentToolArguments("calculate_purchase_scenario", { propertyId: "home-1", downPaymentPercent: 25, annualInterestPercent: null, termYears: null }).ok).toBe(true);
    expect(parseAgentToolArguments("get_property_details", { propertyId: "home-1", organizationId: "victim" }).ok).toBe(false);
    expect(parseAgentToolArguments("calculate_purchase_scenario", { propertyId: "home-1", downPaymentPercent: 0 }).ok).toBe(false);
  });

  it("builds a typed property grid without copying arbitrary records", () => {
    const blocks = propertySearchBlocks({
      properties: sampleProperties.slice(0, 2),
      summary: "Two results",
    });
    expect(blocks).toEqual([{
      type: "property_grid",
      title: "Residences shaped by this brief",
      summary: "Two results",
      propertyIds: sampleProperties.slice(0, 2).map((property) => property.id),
    }]);
    expect(blocks.every(isAgentBlock)).toBe(true);
  });

  it("uses an honest no-results block when hard constraints return nothing", () => {
    const [block] = propertySearchBlocks({ properties: [], summary: "No exact match" });
    expect(block.type).toBe("no_results");
    expect(isAgentBlock(block)).toBe(true);
  });

  it("rejects malformed tool responses before they reach Zustand", () => {
    expect(isAgentToolResponse({
      ok: true,
      tool: "prepare_brief",
      correlationId: "test-correlation",
      summary: "Draft ready",
      blocks: [],
      preparedBrief: {
        schemaVersion: "1",
        draftId: "draft-1234567890",
        source: "voice",
        transcript: "Two bedrooms in Dubai Marina",
        criteria: [{ key: "dubai_marina", label: "Dubai Marina", value: "Dubai Marina", kind: "hard" }],
        missingFields: ["maximum budget"],
      },
    })).toBe(true);
    expect(isAgentToolResponse({ ok: true, tool: "drop_table", blocks: [] })).toBe(false);
  });

  it("rejects malformed nested blocks before the renderer dereferences them", () => {
    expect(isAgentBlock({
      type: "property_detail",
      property: {},
      sourceLabel: "Untrusted",
      availability: "available",
    })).toBe(false);
    expect(isAgentBlock({
      type: "payment_plan",
      propertyId: "property-1",
      title: "Broken",
      currency: "AED",
      propertyPrice: 1_000_000,
      installments: [{ label: "Deposit", percentage: "20", amount: 200_000 }],
      disclaimer: "Illustrative",
    })).toBe(false);
  });
});
