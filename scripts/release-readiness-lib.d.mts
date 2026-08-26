export type ReleaseReadinessInput = {
  releaseEvidence: unknown;
  activationRecord?: unknown;
  assetRights?: unknown;
  publicAssets?: string[] | null;
  environmentResult?: { ok?: boolean } | null;
  runtimeEnvironment?: Record<string, string | undefined>;
  now?: Date;
  requireProduction?: boolean;
};

export type ReleaseReadinessResult = {
  ok: boolean;
  mode: "contract" | "production";
  decision: string;
  blockers: string[];
};

export function assessReleaseReadiness(input: ReleaseReadinessInput): ReleaseReadinessResult;
