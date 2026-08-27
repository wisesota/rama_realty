import "server-only";

import { providerPublicationIsEnabled } from "@/lib/integrations/provider-ingestion";
import { createAdminClient } from "@/lib/supabase/admin";

export class ProviderPublicationDisabledError extends Error {
  constructor() {
    super("Provider publication is disabled.");
    this.name = "ProviderPublicationDisabledError";
  }
}

export class ProviderPublicationFailedError extends Error {
  constructor() {
    super("The validated provider record could not be published.");
    this.name = "ProviderPublicationFailedError";
  }
}

export async function publishValidatedProviderRecord(input: { providerId: string; stagingId: string }) {
  if (!providerPublicationIsEnabled(input.providerId)) throw new ProviderPublicationDisabledError();
  if (!/^[a-f0-9-]{36}$/i.test(input.stagingId)) throw new ProviderPublicationFailedError();

  const { data, error } = await createAdminClient().rpc("publish_validated_provider_record", {
    p_staging_id: input.stagingId,
  });
  if (error || typeof data !== "string" || !data) throw new ProviderPublicationFailedError();
  return data;
}
