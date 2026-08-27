import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260822172000_provider_quarantine.sql", import.meta.url),
  "utf8",
);
const governedRevisionHotfix = readFileSync(
  new URL("../supabase/migrations/20260822223000_allow_governed_provider_revisions.sql", import.meta.url),
  "utf8",
);

describe("provider publication migration", () => {
  it("reuses the stable listing id across content-hash revisions", () => {
    expect(migration).toContain("prior.source_record_id = staged.source_record_id");
    expect(migration).toContain("coalesce(staged.published_property_id, property_id, gen_random_uuid()::text)");
  });

  it("updates normalized public facts when a validated revision is published", () => {
    expect(migration).toContain("slug = excluded.slug");
    expect(migration).toContain("image_url = excluded.image_url");
    expect(migration).toContain("version = public.properties.version + 1");
    expect(migration).toContain("where excluded.source_updated_at > public.properties.source_updated_at");
    expect(migration).toContain("property.source_updated_at >= staged.source_observed_at");
    expect(migration).toContain("'Out-of-order provider revision'");
  });

  it("uses the audited provider path without weakening ordinary publication edits", () => {
    const governedMigration = readFileSync(
      new URL("../supabase/migrations/20260818162000_governed_publication_audit.sql", import.meta.url),
      "utf8",
    );
    expect(migration).toContain("set_config('rama.provider_publication', 'on', true)");
    expect(governedMigration).toContain("current_setting('rama.provider_publication', true)");
    expect(governedRevisionHotfix).toContain("current_setting('rama.provider_publication', true)");
    expect(governedRevisionHotfix).toContain("Published property content must return to review before editing");
    expect(governedMigration).toContain("Published property content must return to review before editing");
  });

  it("caps publication by rights and freshness and withdraws properties when the source closes", () => {
    expect(migration).toContain("add column if not exists provider_source_id uuid references public.provider_sources(id)");
    expect(migration).toContain("least(source.rights_expires_at, staged.publication_ends_at, staged.source_observed_at + make_interval(hours => source.maximum_freshness_hours))");
    expect(migration).toContain("create trigger provider_sources_withdraw_properties");
    expect(migration).toContain("where property.provider_source_id = new.id");
  });

  it("enforces the TypeScript catalog's normalized provider contract in SQL", () => {
    expect(migration).toContain("char_length(btrim(staged.normalized_payload ->> 'description')) < 40");
    expect(migration).toContain("(staged.normalized_payload ->> 'completionStatus') not in ('off_plan','under_construction','ready')");
    expect(migration).toContain("(staged.normalized_payload ->> 'slug') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'");
    expect(migration).toContain("(staged.normalized_payload ->> 'beds') !~ '^(?:[0-9]|[1-2][0-9]|30)$'");
  });
});
