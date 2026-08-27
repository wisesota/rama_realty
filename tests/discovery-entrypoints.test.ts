import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BuyerDecisionEnvelopeV1 } from "@/lib/agent/buyer-contracts";

const mocks = vi.hoisted(() => {
  class CatalogUnavailableError extends Error {}
  class PersistenceUnavailableError extends Error {}
  class RateLimitBackendUnavailableError extends Error {}
  return {
    discoverProperties: vi.fn(),
    getOrCreateBuyerSessionTokenHash: vi.fn(),
    consumeApiRateLimit: vi.fn(),
    CatalogUnavailableError,
    PersistenceUnavailableError,
    RateLimitBackendUnavailableError,
    insertTelemetry: vi.fn(),
  };
});

vi.mock("@/lib/discovery-service", () => ({
  discoverProperties: mocks.discoverProperties,
  PersistenceUnavailableError: mocks.PersistenceUnavailableError,
}));
vi.mock("@/lib/buyer-session-server", () => ({
  getOrCreateBuyerSessionTokenHash: mocks.getOrCreateBuyerSessionTokenHash,
}));
vi.mock("@/lib/rate-limit-server", () => ({
  consumeApiRateLimit: mocks.consumeApiRateLimit,
  RateLimitBackendUnavailableError: mocks.RateLimitBackendUnavailableError,
}));
vi.mock("@/lib/supabase/auth", () => ({ isSameOrigin: () => true }));
vi.mock("@/lib/public-catalog-repository", () => ({
  CatalogUnavailableError: mocks.CatalogUnavailableError,
  PublicCatalogRepository: class {},
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => table === "buyer_sessions"
      ? { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "buyer-session" } }) }) }) }
      : { insert: mocks.insertTelemetry },
  }),
}));

import { POST as postDiscovery } from "@/app/api/discovery/query/route";
import { POST as postPrepare } from "@/app/api/discovery/prepare/route";
import { POST as postAgentTool } from "@/app/api/agent/tools/route";

const envelope: BuyerDecisionEnvelopeV1 = {
  schemaVersion: "1",
  correlationId: "2fd57857-9798-421e-bbb9-f509211d2c47",
  searchRunId: "acba4daf-cff3-4e41-85bb-f70ce759e7dd",
  conversationId: "f73f70dc-f8bb-4300-bfc7-e72503e2bb6b",
  status: "empty",
  brief: {
    original: "Dubai Marina home",
    normalized: "Dubai Marina home",
    criteria: [{ key: "location", label: "Dubai Marina", value: "Dubai Marina", kind: "hard" }],
  },
  entities: { properties: {} },
  blocks: [{ type: "no_results", title: "No exact residence yet", suggestions: ["Refine one preference"] }],
  sourceSummary: { publishedCount: 0, illustrativeCount: 0, staleCount: 0, label: "No governed matches" },
  suggestedActions: [{ id: "refine", label: "Refine the brief" }],
};

beforeEach(() => {
  mocks.discoverProperties.mockReset();
  mocks.getOrCreateBuyerSessionTokenHash.mockReset().mockResolvedValue("a".repeat(64));
  mocks.consumeApiRateLimit.mockReset().mockResolvedValue({ allowed: true });
  mocks.insertTelemetry.mockReset().mockResolvedValue({ error: null });
});

afterEach(() => vi.unstubAllEnvs());

describe("confirmed property-discovery entrypoint", () => {
  it("keeps text and voice preparation routes in full normalized-draft parity", async () => {
    const brief = "شقة من غرفتين في دبي مارينا بأقل من 3 ملايين درهم مع شرفة";
    const text = await postPrepare(new Request("http://localhost/api/discovery/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief, source: "text", draftId: "draft-route-parity-0001" }),
    }));
    const voice = await postAgentTool(new Request("http://localhost/api/agent/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "prepare_brief", args: { brief } }),
    }));

    const textDraft = await text.json() as Record<string, unknown>;
    const voiceDraft = (await voice.json() as { preparedBrief: Record<string, unknown> }).preparedBrief;
    const normalized = (draft: Record<string, unknown>) => {
      const normalizedDraft = { ...draft };
      delete normalizedDraft.draftId;
      delete normalizedDraft.source;
      return normalizedDraft;
    };
    expect(text.status).toBe(200);
    expect(voice.status).toBe(200);
    expect(normalized(voiceDraft)).toEqual(normalized(textDraft));
  });

  it("persists only the confirmed route while Live prepares a side-effect-free draft", async () => {
    mocks.discoverProperties.mockResolvedValue(envelope);

    const direct = await postDiscovery(new Request("http://localhost/api/discovery/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: " Dubai Marina home ", source: "text", idempotencyKey: "draft-1234567890-confirm" }),
    }));
    const voice = await postAgentTool(new Request("http://localhost/api/agent/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "prepare_brief", args: { brief: "Dubai Marina home" } }),
    }));

    expect(await direct.json()).toEqual(envelope);
    expect((await voice.json()).preparedBrief).toEqual(expect.objectContaining({ transcript: "Dubai Marina home", source: "voice" }));
    expect(mocks.discoverProperties).toHaveBeenCalledTimes(1);
    expect(mocks.discoverProperties).toHaveBeenCalledWith(expect.objectContaining({ brief: "Dubai Marina home", source: "text", idempotencyKey: "draft-1234567890-confirm" }));
  });

  it("preserves intentional transport-specific failure semantics", async () => {
    mocks.discoverProperties.mockRejectedValueOnce(new mocks.CatalogUnavailableError("Governed catalog unavailable."));
    const direct = await postDiscovery(new Request("http://localhost/api/discovery/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: "Dubai Marina home", source: "text", idempotencyKey: "draft-1234567890-confirm" }),
    }));

    expect(direct.status).toBe(503);
    expect(await direct.json()).toEqual({ error: "Governed catalog unavailable.", code: "CatalogUnavailable" });
    expect(mocks.discoverProperties).toHaveBeenCalledTimes(1);
  });

  it("fails every public discovery transport closed behind the global kill switch", async () => {
    vi.stubEnv("RAMA_PUBLIC_EXPERIENCE_ENABLED", "false");
    const direct = await postDiscovery(new Request("http://localhost/api/discovery/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: "Dubai Marina home", source: "text", idempotencyKey: "draft-1234567890-confirm" }),
    }));
    const voice = await postAgentTool(new Request("http://localhost/api/agent/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "prepare_brief", args: { brief: "Dubai Marina home" } }),
    }));

    expect(direct.status).toBe(503);
    expect(voice.status).toBe(503);
    expect(mocks.discoverProperties).not.toHaveBeenCalled();
  });

  it("does not let a direct query bypass the confirmation kill switch", async () => {
    vi.stubEnv("RAMA_BRIEF_CONFIRMATION_ENABLED", "false");
    const direct = await postDiscovery(new Request("http://localhost/api/discovery/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: "Dubai Marina home", source: "text", idempotencyKey: "draft-1234567890-confirm" }),
    }));

    expect(direct.status).toBe(503);
    expect(await direct.json()).toMatchObject({ code: "BriefConfirmationDisabled" });
    expect(mocks.discoverProperties).not.toHaveBeenCalled();
  });

  it("keeps query and agent tools inside the same stable rollout cohort", async () => {
    vi.stubEnv("RAMA_DECISION_OS_ROLLOUT_PERCENT", "0");
    const direct = await postDiscovery(new Request("http://localhost/api/discovery/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: "Dubai Marina home", source: "text", idempotencyKey: "draft-1234567890-confirm" }),
    }));
    const voice = await postAgentTool(new Request("http://localhost/api/agent/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "prepare_brief", args: { brief: "Dubai Marina home" } }),
    }));

    expect(direct.status).toBe(503);
    expect(voice.status).toBe(503);
    expect(mocks.discoverProperties).not.toHaveBeenCalled();
  });
});
