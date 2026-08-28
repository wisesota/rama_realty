export const defaultGeminiLiveModel = "gemini-3.1-flash-live-preview";
export const geminiLiveApiVersion = "v1alpha";
export const defaultGeminiVoiceName = "Kore";

export const geminiVoiceOptions = [
  { value: "Kore", label: "Kore · composed" },
  { value: "Aoede", label: "Aoede · warm" },
  { value: "Charon", label: "Charon · informative" },
] as const;

export type GeminiVoiceName = (typeof geminiVoiceOptions)[number]["value"];
export type GeminiVoiceMode = "live" | "recorded";

export function isGeminiVoiceName(value: unknown): value is GeminiVoiceName {
  return geminiVoiceOptions.some((option) => option.value === value);
}

export type GeminiLiveTokenResponse = {
  token: string;
  model: string;
  expiresAt: string;
};

export type GeminiLiveTokenError = {
  error: string;
};

export const defaultGeminiVoiceModel = "gemini-3.7-flash";

export type GeminiRecordedVoiceResponse = {
  transcript: string;
  agentResponse: string;
  locale: string;
  mode: "recorded";
};

export type GeminiRecordedVoiceError = {
  error: string;
};
