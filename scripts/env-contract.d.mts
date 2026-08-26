export type EnvironmentStatus = {
  key: string;
  exposure: "public" | "server";
  kind: string;
  required: boolean;
  status: string;
};

export const environmentContract: ReadonlyArray<Record<string, unknown>>;

export function inspectEnvironment(env?: Record<string, string | undefined>): {
  ok: boolean;
  entries: EnvironmentStatus[];
  invalidKeys: string[];
  publicExposureViolations: string[];
  sharedSecretPairs: string[];
};

export function loadLocalEnvironment(): void;
