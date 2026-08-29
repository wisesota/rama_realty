export type LiveVerificationResult = {
  audioChunks: number;
  inputTranscript: string;
  outputTranscript: string;
  toolCalls: number;
  toolResponses: number;
  generationComplete: boolean;
  turnComplete: boolean;
  stages: Record<string, number>;
};

export function isCompleteLiveTokenPayload(payload: unknown): payload is {
  token: string;
  model: string;
  expiresAt: string;
  sessionResumptionEnabled: boolean;
};

export function assertCompleteLiveTurn(result: LiveVerificationResult, runIndex: number): void;
