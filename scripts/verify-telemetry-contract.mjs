import {
  operationalVoicePayloadKeys,
  operationalVoiceStages,
} from "../lib/voice/operational-voice-schema.mjs";

const forbiddenField = /(?:audio|transcript|brief|prompt|response|email|phone|contact|cookie|authorization|token|buyer|sessionId|searchRun|property|budget|location|address)/i;
const findings = operationalVoicePayloadKeys.filter((key) => forbiddenField.test(key));
const requiredStages = ["permission", "token", "socket", "first_server_event", "first_audio", "tool", "reconnect", "fallback"];
const missingStages = requiredStages.filter((stage) => !operationalVoiceStages.includes(stage));
const result = { ok: findings.length === 0 && missingStages.length === 0, findings, missingStages };

console.log(JSON.stringify(result));
if (!result.ok) process.exitCode = 1;
