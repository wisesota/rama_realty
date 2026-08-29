export function isCompleteLiveTokenPayload(payload) {
  return Boolean(
    payload
    && typeof payload === "object"
    && typeof payload.token === "string"
    && typeof payload.model === "string"
    && typeof payload.expiresAt === "string"
    && typeof payload.sessionResumptionEnabled === "boolean"
  );
}

export function assertCompleteLiveTurn(result, runIndex) {
  if (
    result.generationComplete
    && result.turnComplete
    && result.audioChunks > 0
    && result.inputTranscript.trim()
    && result.outputTranscript.trim()
    && result.toolCalls > 0
    && result.toolResponses === result.toolCalls
  ) return;

  throw new Error(`Gemini Live run ${runIndex + 1} completed without the full contract: ${JSON.stringify({
    inputTranscript: Boolean(result.inputTranscript.trim()),
    outputTranscript: Boolean(result.outputTranscript.trim()),
    nativeAudioChunks: result.audioChunks,
    toolCalls: result.toolCalls,
    toolResponses: result.toolResponses,
    generationComplete: result.generationComplete,
    liveTurnComplete: result.turnComplete,
    stages: result.stages,
  })}`);
}
