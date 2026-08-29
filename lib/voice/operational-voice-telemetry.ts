"use client";

import type { OperationalVoicePayload } from "@/lib/voice/operational-voice-contract";

function browserClass(): OperationalVoicePayload["browserClass"] {
  const agent = navigator.userAgent;
  if (/Firefox\//.test(agent)) return "firefox";
  if (/Safari\//.test(agent) && !/(Chrome|Chromium|Edg)\//.test(agent)) return "safari";
  if (/(Chrome|Chromium|Edg)\//.test(agent)) return "chromium";
  return "other";
}

function networkClass(): OperationalVoicePayload["networkClass"] {
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  const effectiveType = connection?.effectiveType;
  return effectiveType === "slow-2g" || effectiveType === "2g" || effectiveType === "3g" || effectiveType === "4g"
    ? effectiveType
    : "unknown";
}

export function emitOperationalVoiceStage(
  payload: Omit<OperationalVoicePayload, "browserClass" | "networkClass">,
) {
  const body: OperationalVoicePayload = { ...payload, browserClass: browserClass(), networkClass: networkClass() };
  void fetch("/api/telemetry/voice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
    credentials: "same-origin",
  }).catch(() => undefined);
}
