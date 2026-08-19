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
