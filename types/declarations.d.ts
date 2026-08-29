declare module '*/build-tokens.mjs' {
  export interface TokenSources {
    primitives: Record<string, unknown>;
    semantics: Record<string, unknown>;
    components: Record<string, unknown>;
  }

  export function loadTokenSources(customDir?: string): TokenSources;
  export function flattenTokens(obj: unknown, prefix?: string, lookup?: Record<string, unknown>): Record<string, unknown>;
  export function resolveValue(val: unknown, lookup: Record<string, unknown>, visited?: Set<string>): unknown;
  export function resolveTree(obj: unknown, lookup: Record<string, unknown>): unknown;
  export function compileTokens(sources: TokenSources): {
    primitives: Record<string, unknown>;
    semantics: Record<string, unknown>;
    components: Record<string, unknown>;
  };
  export function buildTokens(): {
    primitives: Record<string, unknown>;
    semantics: Record<string, unknown>;
    components: Record<string, unknown>;
  };
}

declare module '*/public-asset-inventory.mjs' {
  export function deployablePublicMedia(publicRoot?: string): Promise<string[]>;
}

declare module '*/voice-reliability-contract.mjs' {
  export function assessVoiceReliabilityEvidence(evidence: unknown, policy: Record<string, unknown>, now?: Date): {
    ok: boolean;
    blockers: string[];
    privacyFindings: string[];
    summary: {
      totalRuns: number;
      liveProviderRuns: number;
      faultInjectionRuns: number;
      successfulLiveProviderRuns: number;
      liveProviderSuccessRate: number | null;
      liveProviderErrorRate: number | null;
      unexpectedFallbackRate: number | null;
      stages: Record<string, { p50: number | null; p75: number | null; p95: number | null; p99: number | null }>;
      percentileMethod: string;
    };
  };
}

declare module '*/operational-voice-schema.mjs' {
  export const operationalVoiceStages: readonly string[];
  export const operationalVoicePayloadKeys: readonly string[];
}
