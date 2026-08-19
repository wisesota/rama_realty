import {
  EndSensitivity,
  GoogleGenAI,
  Modality,
  StartSensitivity,
  ThinkingLevel,
} from "@google/genai";
import { existsSync, readFileSync } from "node:fs";

const baseUrl = process.env.RAMA_VERIFY_BASE_URL || "http://localhost:3000";
const origin = new URL(baseUrl).origin;
const apiVersion = "v1alpha";

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (!existsSync(".env.local")) return "";
  const match = readFileSync(".env.local", "utf8").match(/^GEMINI_API_KEY=(.*)$/m);
  return match?.[1]?.trim().replace(/^['\"]|['\"]$/g, "") ?? "";
}

const apiKey = getApiKey();
if (!apiKey) throw new Error("GEMINI_API_KEY is required for speech-to-speech verification.");

const synthesisClient = new GoogleGenAI({ apiKey });
const synthesisResponse = await synthesisClient.models.generateContent({
  model: "gemini-3.1-flash-tts-preview",
  contents: [
    {
      text: "Say clearly: I need a two-bedroom apartment in Dubai Marina under three million dirhams.",
    },
  ],
  config: {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
    },
  },
});
const synthesizedPart = synthesisResponse.candidates?.[0]?.content?.parts?.find(
  (part) => part.inlineData?.data,
)?.inlineData;
if (!synthesizedPart?.data) {
  throw new Error("Gemini 3.1 Flash TTS did not produce the speech verification fixture.");
}
const synthesizedPcm = Buffer.from(synthesizedPart.data, "base64");

const tokenResponse = await fetch(`${baseUrl}/api/voice/token`, {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    Origin: origin,
    "User-Agent": "Rama Gemini Live verification",
  },
  body: JSON.stringify({ voiceName: "Kore" }),
});

const payload = await tokenResponse.json();
if (!tokenResponse.ok || typeof payload.token !== "string" || typeof payload.model !== "string") {
  throw new Error(
    typeof payload.error === "string"
      ? payload.error
      : `Voice token verification failed with HTTP ${tokenResponse.status}.`,
  );
}

const client = new GoogleGenAI({
  apiKey: payload.token,
  httpOptions: { apiVersion },
});
let audioChunks = 0;
let inputTranscript = "";
let outputTranscript = "";
let turnComplete = false;
let toolCalls = 0;
let toolResponses = 0;
let finish;
const completedTurn = new Promise((resolve, reject) => {
  const timeout = setTimeout(
    () => reject(new Error("Gemini Live did not complete a speech-to-speech tool turn within 60 seconds.")),
    60_000,
  );
  finish = (error) => {
    clearTimeout(timeout);
    if (error) reject(error);
    else resolve();
  };
});

let session;

async function answerToolCalls(functionCalls) {
  for (const call of functionCalls) {
    toolCalls += 1;
    const response = await fetch(`${baseUrl}/api/agent/tools`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Origin: origin,
      },
      body: JSON.stringify({ tool: call.name, args: call.args ?? {} }),
    });
    const result = await response.json();
    if (!response.ok || result?.ok !== true) {
      throw new Error(result?.error || `Agent tool ${call.name || "unknown"} failed with HTTP ${response.status}.`);
    }
    session.sendToolResponse({
      functionResponses: {
        id: call.id,
        name: call.name,
        response: { output: result },
      },
    });
    toolResponses += 1;
  }
}

session = await client.live.connect({
  model: payload.model,
  config: {
    responseModalities: [Modality.AUDIO],
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
    },
    thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
    realtimeInputConfig: {
      automaticActivityDetection: {
        startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
        endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
        prefixPaddingMs: 120,
        silenceDurationMs: 700,
      },
    },
    sessionResumption: {},
    contextWindowCompression: {
      triggerTokens: "25000",
      slidingWindow: { targetTokens: "8000" },
    },
  },
  callbacks: {
    onmessage(message) {
      if (message.toolCall?.functionCalls?.length) {
        void answerToolCalls(message.toolCall.functionCalls).catch((error) => finish(error));
      }
      const content = message.serverContent;
      if (content?.inputTranscription?.text) {
        inputTranscript += content.inputTranscription.text;
      }
      if (content?.outputTranscription?.text) {
        outputTranscript += content.outputTranscription.text;
      }
      for (const part of content?.modelTurn?.parts ?? []) {
        if (part.inlineData?.data) audioChunks += 1;
      }
      if (content?.turnComplete) {
        turnComplete = true;
        finish();
      }
    },
    onerror(event) {
      finish(new Error(event.message || "Gemini Live SDK reported a connection error."));
    },
    onclose(event) {
      if (!turnComplete) {
        finish(
          new Error(
            event.reason
              ? `Gemini Live closed (${event.code}): ${event.reason}`
              : `Gemini Live closed before completing the turn (${event.code}).`,
          ),
        );
      }
    },
  },
});

const pcmChunkBytes = 4_800;
for (let offset = 0; offset < synthesizedPcm.length; offset += pcmChunkBytes) {
  session.sendRealtimeInput({
    audio: {
      data: synthesizedPcm.subarray(offset, offset + pcmChunkBytes).toString("base64"),
      mimeType: "audio/pcm;rate=24000",
    },
  });
  await new Promise((resolve) => setTimeout(resolve, 70));
}
session.sendRealtimeInput({ audioStreamEnd: true });
await completedTurn;
session.close();

if (
  audioChunks === 0
  || !inputTranscript.trim()
  || !outputTranscript.trim()
  || toolCalls === 0
  || toolResponses !== toolCalls
) {
  throw new Error(
    "Gemini Live completed without the full transcript, governed tool, and native-audio contract.",
  );
}

console.log(
  JSON.stringify({
    ok: true,
    model: payload.model,
    apiVersion,
    ephemeralTokenIssued: true,
    synthesizedInputBytes: synthesizedPcm.length,
    inputTranscript: inputTranscript.trim(),
    nativeAudioChunks: audioChunks,
    outputTranscript: outputTranscript.trim(),
    toolCalls,
    toolResponses,
    liveTurnComplete: turnComplete,
  }),
);
