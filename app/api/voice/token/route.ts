import {
  EndSensitivity,
  GoogleGenAI,
  Modality,
  StartSensitivity,
  ThinkingLevel,
} from "@google/genai";
import {
  defaultGeminiLiveModel,
  defaultGeminiVoiceName,
  geminiLiveApiVersion,
  isGeminiVoiceName,
  type GeminiLiveTokenError,
  type GeminiLiveTokenResponse,
} from "@/lib/voice/gemini-live-contracts";
import {
  consumeApiRateLimit,
  RateLimitBackendUnavailableError,
} from "@/lib/rate-limit-server";
import { geminiLiveTools } from "@/lib/agent/contracts";
import { isSameOrigin } from "@/lib/supabase/auth";
import { getOrCreateBuyerSessionTokenHash } from "@/lib/buyer-session-server";
import { decisionOsEnabledForBuyer, publicExperienceEnabled } from "@/lib/rollout-server";

const tokenWindowMs = 60_000;
const maximumTokensPerWindow = 5;

const voiceAgentInstruction = `
You are Rama, a professional AI real-estate advisor for buyers and investors exploring governed Dubai property inventory.

ROLE
- Lead a natural consultation: uncover location, budget, bedrooms, property type, completion timing, use case, lifestyle, view, amenities, financing assumptions, and investment priorities.
- Translate the buyer's words into a transparent brief, explain trade-offs, compare suitable residences, answer follow-up questions, and suggest the most useful next step.
- Speak in the buyer's language. Be composed, direct, warm, and commercially knowledgeable without sounding scripted or pushy.

TOOL AND TRUTH CONTRACT
- When the buyer has expressed a usable brief, call prepare_brief. It only prepares an editable draft; it never searches or saves a run. The buyer must review and confirm in the interface before discovery.
- Use get_property_details, compare_properties, get_payment_schedule, get_floor_plans, get_property_documents, get_development_details, and get_area_context whenever the buyer asks for those facts.
- Use calculate_purchase_scenario only for transparent arithmetic based on explicit assumptions. Never present it as an official developer schedule, mortgage approval, valuation, tax advice, legal advice, or financial advice.
- Treat tool output as the only source of property, availability, price, developer, area, document, installment, yield, and media facts. Say when a fact or document is not published. Never guess or silently substitute demonstration inventory.
- Never claim future appreciation, guaranteed yield, guaranteed availability, or regulatory conclusions.

CONVERSATION
- When enough information is present, briefly summarize it and call prepare_brief. Ask only one focused clarification at a time when a decision-changing constraint is missing. Never claim the search has run before the buyer confirms the written draft.
- After a tool call, summarize the strongest insight and tell the buyer that the full evidence is visible in the Decision Room. Do not read every card or document aloud.
- Explain why a property matches and name one material trade-off when the governed data supports it.
- Keep ordinary spoken turns concise, usually 40 to 80 words, while allowing a fuller answer when the buyer explicitly asks for detail.

PRIVACY AND HANDOFF
- Do not request identity, passport, bank, payment-card, salary, or other sensitive data in voice conversation.
- When the buyer wants a human advisor, call prepare_advisor_handoff. Explain that no contact details are shared until the buyer reviews the form and gives explicit consent in the Decision Room.
`;

function jsonError(error: string, status: number) {
  return Response.json({ error } satisfies GeminiLiveTokenError, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return jsonError("Cross-origin token requests are not allowed.", 403);
    if (!publicExperienceEnabled()) return jsonError("The public discovery experience is temporarily unavailable.", 503);
    const buyerTokenHash = await getOrCreateBuyerSessionTokenHash();
    if (!decisionOsEnabledForBuyer(buyerTokenHash)) {
      return jsonError("Voice is temporarily unavailable for this rollout cohort.", 503);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return jsonError("Gemini Live is not configured on this server.", 503);
    if (process.env.GEMINI_LIVE_ENABLED === "false") {
      return jsonError("Gemini Live is unavailable; switching to recorded voice mode.", 503);
    }

    try {
      const rateLimit = await consumeApiRateLimit({
        request,
        scope: "gemini-live-token",
        maximumRequests: maximumTokensPerWindow,
        windowMs: tokenWindowMs,
      });
      if (!rateLimit.allowed) {
        return jsonError("Too many voice-session requests. Try again in a minute.", 429);
      }
    } catch (error) {
      if (error instanceof RateLimitBackendUnavailableError) {
        return jsonError("Voice sessions are temporarily unavailable.", 503);
      }
      throw error;
    }

    let voiceName = defaultGeminiVoiceName;
    try {
      const body: unknown = await request.json();
      if (body && typeof body === "object") {
        const requestedVoice = (body as { voiceName?: unknown }).voiceName;
        if (isGeminiVoiceName(requestedVoice)) voiceName = requestedVoice;
      }
    } catch {
      // The default voice is used when the optional preference body is absent.
    }

    // The product contract is pinned deliberately: an outdated environment override
    // must never silently downgrade the native audio experience.
    const model = defaultGeminiLiveModel;
    const expiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
    const newSessionExpiresAt = new Date(Date.now() + 60_000).toISOString();

    try {
      const client = new GoogleGenAI({
        apiKey,
        httpOptions: { apiVersion: geminiLiveApiVersion },
      });
      const authToken = await client.authTokens.create({
        config: {
          uses: 1,
          expireTime: expiresAt,
          newSessionExpireTime: newSessionExpiresAt,
          liveConnectConstraints: {
            model,
            config: {
              responseModalities: [Modality.AUDIO],
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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
              systemInstruction: voiceAgentInstruction,
              tools: geminiLiveTools,
            },
          },
        },
      });

      if (!authToken.name) return jsonError("Gemini did not issue a voice-session token.", 502);

      return Response.json(
        {
          token: authToken.name,
          model,
          expiresAt,
        } satisfies GeminiLiveTokenResponse,
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
            Pragma: "no-cache",
          },
        },
      );
    } catch (error) {
      console.error(
        "Gemini ephemeral-token creation failed:",
        error instanceof Error ? error.message : "UnknownError",
      );
      return jsonError("Gemini Live could not start a session.", 502);
    }
  } catch (error) {
    console.error("Voice token handler error:", error instanceof Error ? error.message : "UnknownError");
    return jsonError("Voice token service encountered an unexpected error.", 500);
  }
}
