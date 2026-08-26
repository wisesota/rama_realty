import type { Json } from "@/lib/supabase/database.types";
import { getOrCreateBuyerSessionTokenHash } from "@/lib/buyer-session-server";
import { isAgentToolName, parseAgentToolArguments, type AgentToolName, type AgentToolResponse } from "@/lib/agent/contracts";
import { runAgentTool } from "@/lib/agent/tools-server";
import { consumeApiRateLimit, RateLimitBackendUnavailableError } from "@/lib/rate-limit-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOrigin } from "@/lib/supabase/auth";
import { decisionOsEnabledForBuyer, publicExperienceEnabled } from "@/lib/rollout-server";

const maximumBodyBytes = 8_192;
const deadlineMs = 12_000;

function jsonError(error: string, status: number, tool: unknown = "prepare_brief") {
  const safeTool = isAgentToolName(tool) ? tool : "prepare_brief";
  return Response.json({ ok: false, tool: safeTool, correlationId: crypto.randomUUID(), summary: error, error, blocks: [] } satisfies AgentToolResponse, { status, headers: { "Cache-Control": "no-store" } });
}

function telemetryArguments(tool: AgentToolName, args: Record<string, unknown>): Json {
  if (tool === "prepare_brief") return { brief_length: typeof args.brief === "string" ? args.brief.length : 0, source: "voice" };
  if (tool === "compare_properties") return { property_ids: args.propertyIds as string[] };
  if (tool === "get_area_context") return { location: args.location as string };
  if (tool === "calculate_purchase_scenario") return {
    property_id: args.propertyId as string,
    assumption_fields: Object.keys(args).filter((key) => key !== "propertyId"),
  };
  if (tool === "prepare_advisor_handoff") return {
    property_id: typeof args.propertyId === "string" ? args.propertyId : null,
    reason_length: typeof args.reason === "string" ? args.reason.length : 0,
  };
  return { property_id: args.propertyId as string };
}

async function persistTelemetry(options: {
  buyerTokenHash: string;
  tool: AgentToolName;
  args: Record<string, unknown>;
  result: AgentToolResponse;
  durationMs: number;
}) {
  try {
    const admin = createAdminClient();
    const { data: buyer } = await admin.from("buyer_sessions").select("id").eq("token_hash", options.buyerTokenHash).maybeSingle();
    const sessionId = options.result.decisionEnvelope?.conversationId ?? null;
    await admin.from("tool_runs").insert({
      buyer_session_id: buyer?.id ?? null,
      session_id: sessionId,
      tool_name: options.tool,
      arguments: telemetryArguments(options.tool, options.args),
      result_summary: {
        ok: options.result.ok,
        block_types: options.result.blocks.map((block) => block.type),
        result_count: options.result.decisionEnvelope ? Object.keys(options.result.decisionEnvelope.entities.properties).length : undefined,
      },
      status: options.result.ok ? "succeeded" : "rejected",
      duration_ms: options.durationMs,
      correlation_id: options.result.correlationId,
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Agent tool telemetry failed:", error instanceof Error ? error.name : "UnknownError");
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Cross-origin agent-tool requests are not allowed.", 403);
  if (!publicExperienceEnabled()) return jsonError("The public discovery experience is temporarily unavailable.", 503);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumBodyBytes) return jsonError("The tool request is too large.", 413);
  try {
    const limit = await consumeApiRateLimit({ request, scope: "agent-tool", maximumRequests: 30, windowMs: 60_000 });
    if (!limit.allowed) return jsonError("Too many property requests. Try again in a minute.", 429);
  } catch (error) {
    if (error instanceof RateLimitBackendUnavailableError) return jsonError("Property tools are temporarily unavailable.", 503);
    throw error;
  }

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("The request body must be valid JSON.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return jsonError("A tool request is required.", 400);
  const { tool, args } = body as { tool?: unknown; args?: unknown };
  if (!isAgentToolName(tool)) return jsonError("That property tool is not allowed.", 400, tool);
  const parsed = parseAgentToolArguments(tool, args);
  if (!parsed.ok) return jsonError(parsed.error, 400, tool);

  const correlationId = crypto.randomUUID();
  const buyerTokenHash = await getOrCreateBuyerSessionTokenHash();
  if (!decisionOsEnabledForBuyer(buyerTokenHash)) {
    return jsonError("The Decision OS is temporarily unavailable for this rollout cohort.", 503, tool);
  }
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), deadlineMs);
  const startedAt = performance.now();
  try {
    const result = await runAgentTool(tool, parsed.args, {
      correlationId,
      buyerTokenHash,
      deadline: Date.now() + deadlineMs,
      signal: abort.signal,
    });
    await persistTelemetry({
      buyerTokenHash,
      tool,
      args: parsed.args,
      result,
      durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
    });
    return Response.json(result, { status: result.ok ? 200 : 422, headers: { "Cache-Control": "no-store" } });
  } finally {
    clearTimeout(timer);
  }
}
