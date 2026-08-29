import {
  EndSensitivity,
  GoogleGenAI,
  Modality,
  StartSensitivity,
  ThinkingLevel,
} from "@google/genai";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  assertCompleteLiveTurn,
  isCompleteLiveTokenPayload,
} from "./gemini-live-verification-contract.mjs";

const geminiLiveTools = JSON.parse(
  readFileSync(new URL("../lib/agent/gemini-live-tools.json", import.meta.url), "utf8"),
);

const baseUrl = process.env.RAMA_VERIFY_BASE_URL || "http://localhost:3000";
const origin = new URL(baseUrl).origin;
const apiVersion = "v1alpha";

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (!existsSync(".env.local")) return "";
  const match = readFileSync(".env.local", "utf8").match(/^GEMINI_API_KEY=(.*)$/m);
  return match?.[1]?.trim().replace(/^['\"]|['\"]$/g, "") ?? "";
}

const apiKey = getApiKey();
if (!apiKey) throw new Error("GEMINI_API_KEY is required for speech-to-speech verification.");

const synthesisClient = new GoogleGenAI({ apiKey, httpOptions: { timeout: 20_000 } });
const synthesisResponse = await synthesisClient.models.generateContent({
  model: "gemini-3.1-flash-tts-preview",
  contents: [
    {
      text: "Say clearly: Please call the prepare brief tool now for this exact request. I need a two-bedroom apartment in Dubai Marina under three million dirhams. Do not only summarize it.",
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

const requestedRuns = Number.parseInt(
  readArgument("--runs") || process.env.RAMA_VERIFY_RUNS || "2",
  10,
);
if (!Number.isInteger(requestedRuns) || requestedRuns < 1 || requestedRuns > 5) {
  throw new Error("--runs must be an integer from 1 to 5.");
}

async function fetchJsonWithDeadline(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const payload = await response.json();
    return { response, payload, durationMs: Math.round(performance.now() - startedAt) };
  } finally {
    clearTimeout(timeout);
  }
}

async function verifyTurn(runIndex) {
  const startedAt = performance.now();
  const stages = {};
  const mark = (name) => {
    stages[name] ??= Math.round(performance.now() - startedAt);
  };
  const tokenResult = await fetchJsonWithDeadline(`${baseUrl}/api/voice/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Origin: origin,
      "User-Agent": "Rama Gemini Live verification",
    },
    body: JSON.stringify({ voiceName: "Kore" }),
  }, 15_000);
  const payload = tokenResult.payload;
  stages.tokenComplete = Math.round(performance.now() - startedAt);
  stages.tokenDurationMs = tokenResult.durationMs;
  if (!tokenResult.response.ok || !isCompleteLiveTokenPayload(payload)) {
    throw new Error(
      typeof payload.error === "string"
        ? payload.error
        : `Voice token verification failed with HTTP ${tokenResult.response.status}.`,
    );
  }

  const client = new GoogleGenAI({ apiKey: payload.token, httpOptions: { apiVersion } });
  let audioChunks = 0;
  let inputTranscript = "";
  let outputTranscript = "";
  let turnComplete = false;
  let generationComplete = false;
  let toolCalls = 0;
  let toolResponses = 0;
  let finish;
  let session;
  const completedTurn = new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Gemini Live did not complete a speech-to-speech tool turn within 45 seconds.")),
      45_000,
    );
    finish = (error) => {
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve();
    };
  });
  completedTurn.catch(() => undefined);

  async function answerToolCalls(functionCalls) {
    mark("firstToolCall");
    for (const call of functionCalls) {
      toolCalls += 1;
      const result = await fetchJsonWithDeadline(`${baseUrl}/api/agent/tools`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json", Origin: origin },
        body: JSON.stringify({ tool: call.name, args: call.args ?? {} }),
      }, 15_000);
      if (!result.response.ok || result.payload?.ok !== true) {
        throw new Error(result.payload?.error || `Agent tool ${call.name || "unknown"} failed with HTTP ${result.response.status}.`);
      }
      session.sendToolResponse({
        functionResponses: { id: call.id, name: call.name, response: { output: result.payload } },
      });
      toolResponses += 1;
      mark("firstToolResponse");
    }
  }

  const connecting = client.live.connect({
    model: payload.model,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
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
      ...(payload.sessionResumptionEnabled ? { sessionResumption: {} } : {}),
      contextWindowCompression: { triggerTokens: "25000", slidingWindow: { targetTokens: "8000" } },
      tools: geminiLiveTools,
    },
    callbacks: {
      onmessage(message) {
        mark("firstServerEvent");
        if (message.toolCall?.functionCalls?.length) {
          void answerToolCalls(message.toolCall.functionCalls).catch((error) => finish(error));
        }
        const content = message.serverContent;
        if (content?.inputTranscription?.text) inputTranscript += content.inputTranscription.text;
        if (content?.outputTranscription?.text) outputTranscript += content.outputTranscription.text;
        for (const part of content?.modelTurn?.parts ?? []) {
          if (part.inlineData?.data) {
            audioChunks += 1;
            mark("firstAudio");
          }
        }
        if (content?.generationComplete) {
          generationComplete = true;
          mark("generationComplete");
        }
        if (content?.turnComplete) {
          turnComplete = true;
          mark("turnComplete");
          finish();
        }
      },
      onerror(event) {
        finish(new Error(event.message || "Gemini Live SDK reported a connection error."));
      },
      onclose(event) {
        if (!turnComplete) {
          finish(new Error(
            event.reason
              || `Gemini Live closed before completing the turn (${event.code}): ${JSON.stringify({
                audioChunks,
                inputTranscript: Boolean(inputTranscript.trim()),
                outputTranscript: Boolean(outputTranscript.trim()),
                toolCalls,
                toolResponses,
                generationComplete,
                stages,
              })}`,
          ));
        }
      },
    },
  });
  let connectTimeout;
  let connectionTimedOut = false;
  try {
    session = await Promise.race([
      connecting,
      new Promise((_, reject) => {
        connectTimeout = setTimeout(
          () => {
            connectionTimedOut = true;
            reject(new Error("Gemini Live connection exceeded 15 seconds."));
          },
          15_000,
        );
      }),
    ]);
  } catch (error) {
    if (connectionTimedOut) {
      void connecting.then((lateSession) => lateSession.close()).catch(() => undefined);
    }
    throw error;
  } finally {
    if (connectTimeout) clearTimeout(connectTimeout);
  }
  mark("socketConnected");

  try {
    const pcmChunkBytes = 2_400;
    for (let offset = 0; offset < synthesizedPcm.length; offset += pcmChunkBytes) {
      session.sendRealtimeInput({
        audio: {
          data: synthesizedPcm.subarray(offset, offset + pcmChunkBytes).toString("base64"),
          mimeType: "audio/pcm;rate=24000",
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 40));
    }
    session.sendRealtimeInput({ audioStreamEnd: true });
    mark("audioStreamEnded");
    await completedTurn;
  } finally {
    session.close();
  }

  assertCompleteLiveTurn({
    audioChunks,
    inputTranscript,
    outputTranscript,
    toolCalls,
    toolResponses,
    generationComplete,
    turnComplete,
    stages,
  }, runIndex);

  return {
    run: runIndex + 1,
    profile: runIndex === 0 ? "cold_candidate" : "warm_repeat",
    model: payload.model,
    inputTranscriptPresent: Boolean(inputTranscript.trim()),
    outputTranscriptPresent: Boolean(outputTranscript.trim()),
    nativeAudioChunks: audioChunks,
    toolCalls,
    toolResponses,
    generationComplete,
    liveTurnComplete: turnComplete,
    totalDurationMs: Math.round(performance.now() - startedAt),
    stages,
  };
}

const runs = [];
for (let index = 0; index < requestedRuns; index += 1) runs.push(await verifyTurn(index));
const evidence = {
  schemaVersion: 1,
  ok: true,
  generatedAt: new Date().toISOString(),
  releaseCommit: process.env.RAMA_RELEASE_COMMIT?.trim() || null,
  evidenceAuthority: process.env.CI === "true" && /^[a-f0-9]{40}$/.test(process.env.RAMA_RELEASE_COMMIT ?? "")
    ? "ci"
    : "local-diagnostic",
  apiVersion,
  ephemeralTokenIssued: true,
  synthesizedInputBytes: synthesizedPcm.length,
  requiredRuns: requestedRuns,
  runs,
};

const outputArgument = readArgument("--output");
if (process.argv.includes("--output")) {
  if (!outputArgument) throw new Error("--output requires a file path.");
  const outputPath = resolve(outputArgument);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(evidence));
