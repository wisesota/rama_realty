import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }));

import {
  ProviderPublicationDisabledError,
  ProviderPublicationFailedError,
  publishValidatedProviderRecord,
} from "@/lib/integrations/provider-publication-server";

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.rpc.mockReset();
});

describe("provider publication server boundary", () => {
  it("never calls the publication RPC while the global or provider gate is closed", async () => {
    vi.stubEnv("LICENSED_SUPPLY_PUBLICATION_ENABLED", "false");
    vi.stubEnv("LICENSED_SUPPLY_PROVIDER_IDS", "licensed-partner-a");
    await expect(publishValidatedProviderRecord({ providerId: "licensed-partner-a", stagingId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }))
      .rejects.toBeInstanceOf(ProviderPublicationDisabledError);

    vi.stubEnv("LICENSED_SUPPLY_PUBLICATION_ENABLED", "true");
    vi.stubEnv("LICENSED_SUPPLY_PROVIDER_IDS", "different-partner");
    await expect(publishValidatedProviderRecord({ providerId: "licensed-partner-a", stagingId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }))
      .rejects.toBeInstanceOf(ProviderPublicationDisabledError);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("publishes only through the bounded RPC and rejects null stale-revision results", async () => {
    vi.stubEnv("LICENSED_SUPPLY_PUBLICATION_ENABLED", "true");
    vi.stubEnv("LICENSED_SUPPLY_PROVIDER_IDS", "licensed-partner-a");
    mocks.rpc.mockResolvedValueOnce({ data: "property-1", error: null });
    await expect(publishValidatedProviderRecord({ providerId: "licensed-partner-a", stagingId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }))
      .resolves.toBe("property-1");
    expect(mocks.rpc).toHaveBeenCalledWith("publish_validated_provider_record", {
      p_staging_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });

    mocks.rpc.mockResolvedValueOnce({ data: null, error: null });
    await expect(publishValidatedProviderRecord({ providerId: "licensed-partner-a", stagingId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }))
      .rejects.toBeInstanceOf(ProviderPublicationFailedError);
  });
});
