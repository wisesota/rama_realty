import { ApiError, ThinkingLevel } from "@google/genai";
import { GoogleGenAI } from "@posthog/ai/gemini";
import { posthogServer } from "@/lib/telemetry-server";
import {
  defaultGeminiVoiceModel,
  type GeminiRecordedVoiceError,
  type GeminiRecordedVoiceResponse,
} from "@/lib/voice/gemini-live-contracts";
import {
  consumeApiRateLimit,
  RateLimitBackendUnavailableError,
} from "@/lib/rate-limit-server";
import { isSameOrigin } from "@/lib/supabase/auth";

const maximumAudioBytes = 6 * 1024 * 1024;
const requestWindowMs = 60_000;
const maximumRequestsPerWindow = 6;

const recordedVoiceInstruction = `
You are Rama, a concise Dubai property-discovery voice concierge.
Transcribe the buyer's spoken request faithfully, removing only filler words and false starts.
Preserve every location, budget, bedroom count, property type, amenity, commute, and lifestyle constraint.
Do not invent details and do not request or repeat sensitive personal or financial information.
If no intelligible property request is present, return an empty transcript.
Reply in the buyer's language in no more than 35 words.
Never imply that illustrative results are live inventory, verified availability, a valuation, or real-estate advice.
`;

function jsonError(error: string, status: number) {
  return Response.json({ error } satisfies GeminiRecordedVoiceError, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isVoiceResult(value: unknown): value is Omit<GeminiRecordedVoiceResponse, "mode"> {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<GeminiRecordedVoiceResponse>;
  return (
    typeof result.transcript === "string" &&
    typeof result.agentResponse === "string" &&
    typeof result.locale === "string"
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Cross-origin voice requests are not allowed.", 403);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return jsonError("Gemini voice understanding is not configured.", 503);

  try {
    const rateLimit = await consumeApiRateLimit({
      request,
      scope: "gemini-voice-turn",
      maximumRequests: maximumRequestsPerWindow,
      windowMs: requestWindowMs,
    });
    if (!rateLimit.allowed) {
      return jsonError("Too many voice turns. Try again in a minute.", 429);
    }
  } catch (error) {
    if (error instanceof RateLimitBackendUnavailableError) {
      return jsonError("Voice understanding is temporarily unavailable.", 503);
    }
    throw error;
  }
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return jsonError("The voice turn must include an audio recording.", 415);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("The voice recording could not be read.", 400);
  }

  const audio = formData.get("audio");
  if (!(audio instanceof File)) return jsonError("A WAV voice recording is required.", 400);
  if (audio.type !== "audio/wav" && audio.type !== "audio/x-wav") {
    return jsonError("The voice recording must use WAV audio.", 415);
  }
  if (audio.size < 45) return jsonError("The voice recording is empty.", 400);
  if (audio.size > maximumAudioBytes) {
    return jsonError("Keep each voice turn under 45 seconds.", 413);
  }

  const timeout = new AbortController();
  const timeoutId = setTimeout(() => timeout.abort(), 30_000);

  try {
    const client = new GoogleGenAI({ apiKey, posthog: posthogServer });
    const audioData = Buffer.from(await audio.arrayBuffer()).toString("base64");
    const response = await client.models.generateContent({
      model: process.env.GEMINI_VOICE_MODEL || defaultGeminiVoiceModel,
      contents: [
        {
          text: "Transcribe this voice turn into a concise Dubai property brief and respond as Rama.",
        },
        { inlineData: { mimeType: "audio/wav", data: audioData } },
      ],
      config: {
        abortSignal: timeout.signal,
        systemInstruction: recordedVoiceInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        maxOutputTokens: 300,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          additionalProperties: false,
          properties: {
            transcript: {
              type: "string",
              description: "A concise, faithful property brief from the spoken request.",
            },
            agentResponse: {
              type: "string",
              description: "Rama's same-language response in no more than 35 words.",
            },
            locale: {
              type: "string",
              description: "A BCP 47 language tag such as en-US or ar-AE.",
            },
          },
          required: ["transcript", "agentResponse", "locale"],
          propertyOrdering: ["transcript", "agentResponse", "locale"],
        },
      },
    });

    const parsed: unknown = JSON.parse(response.text || "null");
    if (!isVoiceResult(parsed)) return jsonError("Gemini returned an invalid voice response.", 502);

    const transcript = parsed.transcript.replace(/\s+/g, " ").trim().slice(0, 500);
    const agentResponse = parsed.agentResponse.replace(/\s+/g, " ").trim().slice(0, 360);
    const locale = parsed.locale.trim().slice(0, 35) || "en-US";
    if (!transcript) return jsonError("No clear property request was detected. Please try again.", 422);
    if (!agentResponse) return jsonError("Gemini did not return a voice response.", 502);

    return Response.json(
      { transcript, agentResponse, locale, mode: "recorded" } satisfies GeminiRecordedVoiceResponse,
      { headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } },
    );
  } catch (error) {
    console.error(
      "Gemini recorded voice turn failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    if (timeout.signal.aborted) {
      return jsonError("Gemini voice understanding timed out. Please try a shorter request.", 504);
    }
    if (error instanceof ApiError && error.status === 403) {
      return jsonError(
        "Gemini access is unavailable for this project. Browser transcription will be used when supported.",
        503,
      );
    }
    return jsonError("Gemini could not understand this voice turn.", 502);
  } finally {
    clearTimeout(timeoutId);
  }
}
