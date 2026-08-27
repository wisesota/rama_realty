import { describe, expect, it } from "vitest";
import { assessReleaseReadiness } from "../scripts/release-readiness-lib.mjs";

const localEvidence = {
  lint: "passed",
  typecheck: "passed",
  unitAndContractTests: "passed",
  productionBuild: "passed",
  renderedBrowserQa: "passed",
  dataRightsMigration: "passed",
  environmentContract: "passed",
};
const releaseCommit = "a".repeat(40);
const evaluationTime = new Date("2026-08-22T16:00:00Z");

function artifact(name: string) {
  return {
    uri: `https://evidence.rama.example/${name}`,
    sha256: "b".repeat(64),
    owner: `${name}-owner`,
    verifiedAt: "2026-08-22T15:50:00Z",
  };
}

function releaseEvidence(status = "verified") {
  return {
    schemaVersion: 1,
    generatedAt: "2026-08-22T15:40:00Z",
    commit: releaseCommit,
    releaseDecision: "approved",
    states: {
      local: { status, evidence: localEvidence },
      preview: { status },
      staging: { status },
      production: { status: "approved" },
    },
    externalGates: {
      licensedSupplyAgreement: "verified",
      advisorOperatingModel: "verified",
      customerPilot: "verified",
      privacyAndRetentionApproval: "verified",
    },
  };
}

const activationRecord = {
  schemaVersion: 1,
  status: "approved",
  targetEnvironment: "production",
  targetCommit: releaseCommit,
  createdAt: "2026-08-22T15:45:00Z",
  approvals: ["cto", "security", "privacy", "legal", "product"].map((role) => ({
    role,
    status: "approved",
    owner: `${role}-owner`,
    approvedAt: "2026-08-22T15:40:00Z",
  })),
  rollout: {
    cohortPercent: 5,
    flags: {
      RAMA_PUBLIC_EXPERIENCE_ENABLED: true,
      RAMA_LANDING_COMPOSITION_ENABLED: true,
      RAMA_CINEMATIC_HERO_ENABLED: true,
      RAMA_BRIEF_CONFIRMATION_ENABLED: true,
      RAMA_LOCALE_ROUTES_ENABLED: true,
      RAMA_EVIDENCE_V2_WRITER_ENABLED: true,
      RAMA_EVIDENCE_V2_RENDERER_ENABLED: true,
      GEMINI_LIVE_ENABLED: true,
      LICENSED_SUPPLY_PUBLICATION_ENABLED: true,
    },
    providerIds: ["licensed-partner-a"],
  },
  operations: {
    rollbackOwner: "release-operator",
    onCallOwner: "primary-on-call",
    incidentOwner: "incident-commander",
    ...Object.fromEntries([
    "backupRestoreEvidence",
    "penetrationTestEvidence",
    "privacyCanaryEvidence",
    "hostedRlsEvidence",
    "credentialRotationEvidence",
    ].map((field) => [field, artifact(field)])),
  },
};

const assetRights = {
  schemaVersion: 1,
  productionConclusion: "approved",
  assets: [
    { path: "public/images/rama-hero-editorial-daylight.png", legalReview: "approved", productionEligibility: "approved", documentaryProof: artifact("hero-rights") },
    { path: "public/lottie/ai.json", legalReview: "approved", productionEligibility: "approved", documentaryProof: artifact("lottie-rights") },
    {
      path: "public/lottie/rama-criterion-weave.json",
      kind: "original_geometric_lottie_signal",
      legalReview: "not_required_original_geometric_asset",
      productionEligibility: "eligible",
      ownershipBasis: "repository_authored_geometric_vector_animation_2026-08-23",
      documentaryProof: "Source-authored Rama Criterion Weave JSON in this repository",
      sha256: "9aaaffd99ea54bd7ba87df68e50d6f7492c1883328fdfb941943ce95ef808912",
      bytes: 5401,
    },
  ],
};
const publicAssets = assetRights.assets.map((asset) => asset.path);

const runtimeEnvironment = {
  RAMA_PUBLIC_EXPERIENCE_ENABLED: "true",
  RAMA_LANDING_COMPOSITION_ENABLED: "true",
  RAMA_CINEMATIC_HERO_ENABLED: "true",
  RAMA_BRIEF_CONFIRMATION_ENABLED: "true",
  RAMA_LOCALE_ROUTES_ENABLED: "true",
  RAMA_EVIDENCE_V2_WRITER_ENABLED: "true",
  RAMA_EVIDENCE_V2_RENDERER_ENABLED: "true",
  GEMINI_LIVE_ENABLED: "true",
  LICENSED_SUPPLY_PUBLICATION_ENABLED: "true",
  LICENSED_SUPPLY_PROVIDER_IDS: "licensed-partner-a",
  RAMA_DECISION_OS_ROLLOUT_PERCENT: "5",
  RAMA_DEMO_MODE: "false",
  NEXT_PUBLIC_SITE_URL: "https://rama.example",
  RAMA_RELEASE_COMMIT: releaseCommit,
};

describe("release readiness", () => {
  it("accepts the current blocked evidence as an honest machine-readable contract", () => {
    const blocked = releaseEvidence("partially_verified");
    blocked.releaseDecision = "blocked";
    blocked.states.preview.status = "not_verified";
    blocked.states.staging.status = "not_verified";
    blocked.states.production.status = "not_authorized";
    blocked.externalGates.licensedSupplyAgreement = "not_verified";
    expect(assessReleaseReadiness({ releaseEvidence: blocked }).ok).toBe(true);
  });

  it("does not let a required external gate disappear from the release contract", () => {
    const incomplete = releaseEvidence();
    delete (incomplete.externalGates as Partial<typeof incomplete.externalGates>).customerPilot;
    expect(assessReleaseReadiness({ releaseEvidence: incomplete }).blockers)
      .toContain("external_gate_missing:customerPilot");
  });

  it("requires every approval, operational artifact, environment check, and bounded cohort for production", () => {
    expect(assessReleaseReadiness({
      releaseEvidence: releaseEvidence(),
      activationRecord,
      assetRights,
      publicAssets,
      environmentResult: { ok: true },
      runtimeEnvironment,
      now: evaluationTime,
      requireProduction: true,
    })).toEqual(expect.objectContaining({ ok: true, blockers: [] }));
  });

  it("fails closed for the draft activation record and open release evidence", () => {
    const result = assessReleaseReadiness({
      releaseEvidence: { ...releaseEvidence(), releaseDecision: "blocked" },
      activationRecord: { ...activationRecord, status: "draft", targetCommit: null },
      assetRights: null,
      publicAssets: [],
      environmentResult: { ok: false },
      runtimeEnvironment: {},
      now: evaluationTime,
      requireProduction: true,
    });
    expect(result.ok).toBe(false);
    expect(result.blockers).toEqual(expect.arrayContaining([
      "release_decision_not_approved",
      "environment_contract_failed",
      "activation_record_not_approved",
      "activation_commit_invalid",
    ]));
  });

  it("rejects an original-asset rights exception without strict source proof", () => {
    const malformedRights = {
      ...assetRights,
      assets: assetRights.assets.map((asset) => asset.path.endsWith("rama-criterion-weave.json")
        ? { ...asset, documentaryProof: "" }
        : asset),
    };
    expect(assessReleaseReadiness({
      releaseEvidence: releaseEvidence(),
      activationRecord,
      assetRights: malformedRights,
      publicAssets,
      environmentResult: { ok: true },
      runtimeEnvironment,
      now: evaluationTime,
      requireProduction: true,
    }).blockers).toContain("asset_rights_incomplete");
  });

  it("does not allow another asset to inherit the Criterion Weave exception", () => {
    const substitutedRights = {
      ...assetRights,
      assets: assetRights.assets.map((asset) => asset.path.endsWith("rama-criterion-weave.json")
        ? { ...asset, path: "public/images/unreviewed-source.webp" }
        : asset),
    };
    expect(assessReleaseReadiness({
      releaseEvidence: releaseEvidence(),
      activationRecord,
      assetRights: substitutedRights,
      publicAssets: substitutedRights.assets.map((asset) => asset.path),
      environmentResult: { ok: true },
      runtimeEnvironment,
      now: evaluationTime,
      requireProduction: true,
    }).blockers).toContain("asset_rights_incomplete");
  });

  it("requires production runtime flags, cohort, provider IDs, and demo mode to match the approval", () => {
    const result = assessReleaseReadiness({
      releaseEvidence: releaseEvidence(),
      activationRecord,
      assetRights,
      publicAssets,
      environmentResult: { ok: true },
      runtimeEnvironment: {
        ...runtimeEnvironment,
        RAMA_DEMO_MODE: "true",
        RAMA_DECISION_OS_ROLLOUT_PERCENT: "25",
        LICENSED_SUPPLY_PROVIDER_IDS: "different-provider",
      },
      now: evaluationTime,
      requireProduction: true,
    });
    expect(result.blockers).toEqual(expect.arrayContaining([
      "runtime_demo_mode_not_disabled",
      "runtime_rollout_cohort_mismatch",
      "runtime_licensed_provider_mismatch",
    ]));
  });

  it("binds fresh evidence, asset rights, and runtime configuration to the approved commit", () => {
    const result = assessReleaseReadiness({
      releaseEvidence: { ...releaseEvidence(), generatedAt: "2000-01-01T00:00:00Z", commit: "c".repeat(40) },
      activationRecord,
      assetRights: { ...assetRights, productionConclusion: "documentary_evidence_open" },
      publicAssets: [...publicAssets, "public/images/unregistered.jpg"],
      environmentResult: { ok: true },
      runtimeEnvironment: { ...runtimeEnvironment, RAMA_RELEASE_COMMIT: "d".repeat(40) },
      now: evaluationTime,
      requireProduction: true,
    });
    expect(result.blockers).toEqual(expect.arrayContaining([
      "release_evidence_stale",
      "release_evidence_commit_mismatch",
      "runtime_commit_mismatch",
      "asset_rights_not_approved",
      "public_asset_unregistered",
    ]));
  });

  it("rejects stale or future-dated operational attestations", () => {
    const result = assessReleaseReadiness({
      releaseEvidence: releaseEvidence(),
      activationRecord: {
        ...activationRecord,
        operations: {
          ...activationRecord.operations,
          hostedRlsEvidence: { ...artifact("hosted-rls"), verifiedAt: "2000-01-01T00:00:00Z" },
          credentialRotationEvidence: { ...artifact("rotation"), verifiedAt: "2030-01-01T00:00:00Z" },
        },
      },
      assetRights,
      publicAssets,
      environmentResult: { ok: true },
      runtimeEnvironment,
      now: evaluationTime,
      requireProduction: true,
    });
    expect(result.blockers).toEqual(expect.arrayContaining([
      "operation_evidence_missing:hostedRlsEvidence",
      "operation_evidence_missing:credentialRotationEvidence",
    ]));
  });
});
