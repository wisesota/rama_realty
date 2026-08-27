import type { LandingCopy } from "@/lib/i18n";

export type LandingRuntimeCopy = Omit<LandingCopy, "architecture"> & {
  architecture: Pick<LandingCopy["architecture"], "hero" | "voice">;
};

export type DiscoveryComposerRequest = {
  id: number;
  mode: "voice" | "text";
  brief?: string;
};
