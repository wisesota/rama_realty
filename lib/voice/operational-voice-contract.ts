import {
  operationalVoicePayloadKeys,
  operationalVoiceStages,
} from "@/lib/voice/operational-voice-schema.mjs";

export { operationalVoicePayloadKeys, operationalVoiceStages };
export type OperationalVoiceStage = "permission" | "microphone" | "token" | "socket" | "first_server_event" | "first_audio" | "tool" | "reconnect" | "fallback";
export type OperationalVoicePayload = {
  attemptId: string;
  stage: OperationalVoiceStage;
  outcome: "success" | "denied" | "timeout" | "error";
  durationMs: number;
  mode: "live" | "recorded" | "unknown";
  locale: "en" | "ar";
  browserClass: "chromium" | "firefox" | "safari" | "other";
  networkClass: "slow-2g" | "2g" | "3g" | "4g" | "unknown";
  reconnectCount: 0 | 1 | 2;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedKeys = new Set<string>(operationalVoicePayloadKeys);

export function parseOperationalVoicePayload(value: unknown): OperationalVoicePayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Record<string, unknown>;
  if (Object.keys(payload).some((key) => !allowedKeys.has(key))) return null;
  if (typeof payload.attemptId !== "string" || !uuidPattern.test(payload.attemptId)) return null;
  if (!operationalVoiceStages.includes(payload.stage as OperationalVoiceStage)) return null;
  if (!["success", "denied", "timeout", "error"].includes(String(payload.outcome))) return null;
  if (typeof payload.durationMs !== "number" || !Number.isFinite(payload.durationMs) || payload.durationMs < 0 || payload.durationMs > 120_000) return null;
  if (!["live", "recorded", "unknown"].includes(String(payload.mode))) return null;
  if (!["en", "ar"].includes(String(payload.locale))) return null;
  if (!["chromium", "firefox", "safari", "other"].includes(String(payload.browserClass))) return null;
  if (!["slow-2g", "2g", "3g", "4g", "unknown"].includes(String(payload.networkClass))) return null;
  if (![0, 1, 2].includes(payload.reconnectCount as number)) return null;
  return payload as OperationalVoicePayload;
}
