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
  workstreams: Object.fromEntries([
    "licensedProvider", "assetRights", "hostedOperations", "privacyAndAccessibility", "pilot", "activation",
  ].map((workstream) => [workstream, {
    status: "complete",
    owner: `${workstream}-owner`,
    updatedAt: "2026-08-22T15:40:00Z",
    evidenceUri: `https://evidence.rama.example/${workstream}`,
    evidenceSha256: "c".repeat(64),
  }])),
  approvals: ["cto", "security", "privacy", "legal", "product"].map((role) => ({
    role,
    status: "approved",
    owner: `${role}-owner`,
    approvedAt: "2026-08-22T15:40:00Z",
  })),
  rollout: {
    cohortPercent: 5,
    limits: { geminiLiveDailySessions: 500 },
    flags: {
      RAMA_PUBLIC_EXPERIENCE_ENABLED: true,
      RAMA_LANDING_COMPOSITION_ENABLED: true,
      RAMA_CINEMATIC_HERO_ENABLED: true,
      RAMA_BRIEF_CONFIRMATION_ENABLED: true,
      RAMA_LOCALE_ROUTES_ENABLED: true,
      RAMA_EVIDENCE_V2_WRITER_ENABLED: true,
      RAMA_EVIDENCE_V2_RENDERER_ENABLED: true,
      GEMINI_LIVE_ENABLED: true,
      GEMINI_LIVE_SESSION_RESUMPTION_ENABLED: true,
      RAMA_OPERATIONAL_TELEMETRY_ENABLED: true,
      LICENSED_SUPPLY_PUBLICATION_ENABLED: true,
    },
    providerIds: ["licensed-partner-a"],
  },
  operations: {
    rollbackOwner: "release-operator",
    onCallOwner: "primary-on-call",
    incidentOwner: "incident-commander",
    rollbackApprover: "rollback-approver",
    privacyOwner: "privacy-owner",
    accessibilityOwner: "accessibility-owner",
    providerOwner: "provider-owner",
    releaseScribe: "release-scribe",
    ...Object.fromEntries([
    "backupRestoreEvidence",
    "storageRestoreEvidence",
    "alertDrillEvidence",
    "penetrationTestEvidence",
    "privacyCanaryEvidence",
    "hostedRlsEvidence",
    "credentialRotationEvidence",
    "liveProviderEvidence",
    "buildAttestationEvidence",
    "voiceReliabilityEvidence",
    "providerQuotaEvidence",
    "assistiveTechnologyEvidence",
    "pilotEvidence",
    ].map((field) => [field, artifact(field)])),
  },
};

const assetRights = {
  schemaVersion: 1,
  productionConclusion: "approved",
  assets: [
    { path: "public/images/rama-hero-editorial-daylight.png", legalReview: "approved", productionEligibility: "approved", documentaryProof: artifact("hero-rights") },
    { path: "public/lottie/ai.json", legalReview: "approved", productionEligibility: "approved", documentaryProof: artifact("lottie-rights") },
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
  GEMINI_LIVE_SESSION_RESUMPTION_ENABLED: "true",
  GEMINI_LIVE_DAILY_SESSION_LIMIT: "500",
  RAMA_OPERATIONAL_TELEMETRY_ENABLED: "true",
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

  it("never accepts partially verified evidence for production", () => {
    const result = assessReleaseReadiness({
      releaseEvidence: releaseEvidence("partially_verified"),
      activationRecord,
      assetRights,
      publicAssets,
      environmentResult: { ok: true },
      runtimeEnvironment,
      now: evaluationTime,
      requireProduction: true,
    });
    expect(result.blockers).toContain("local_not_verified");
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

  it("rejects an asset without approved documentary proof", () => {
    const malformedRights = {
      ...assetRights,
      assets: assetRights.assets.map((asset) => asset.path.endsWith("ai.json")
        ? { ...asset, documentaryProof: "", legalReview: "not_required_original_geometric_asset" }
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

  it("requires every registered asset to pass the same documentary review", () => {
    const substitutedRights = { ...assetRights, assets: [...assetRights.assets, {
      path: "public/images/unreviewed-source.webp",
      legalReview: "not_required_original_geometric_asset",
      productionEligibility: "eligible",
      documentaryProof: "repository-authored",
    }] };
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

  it("allows privacy-approved session resumption to remain disabled", () => {
    const disabledActivation = {
      ...activationRecord,
      rollout: {
        ...activationRecord.rollout,
        flags: { ...activationRecord.rollout.flags, GEMINI_LIVE_SESSION_RESUMPTION_ENABLED: false },
      },
    };
    expect(assessReleaseReadiness({
      releaseEvidence: releaseEvidence(),
      activationRecord: disabledActivation,
      assetRights,
      publicAssets,
      environmentResult: { ok: true },
      runtimeEnvironment: { ...runtimeEnvironment, GEMINI_LIVE_SESSION_RESUMPTION_ENABLED: "false" },
      now: evaluationTime,
      requireProduction: true,
    }).blockers).toEqual([]);
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

  it("requires every named incident, rollback, privacy, accessibility, provider, and scribe role", () => {
    const result = assessReleaseReadiness({
      releaseEvidence: releaseEvidence(),
      activationRecord: {
        ...activationRecord,
        operations: { ...activationRecord.operations, rollbackApprover: null, releaseScribe: null },
      },
      assetRights,
      publicAssets,
      environmentResult: { ok: true },
      runtimeEnvironment,
      now: evaluationTime,
      requireProduction: true,
    });
    expect(result.blockers).toEqual(expect.arrayContaining([
      "operation_evidence_missing:rollbackApprover",
      "operation_evidence_missing:releaseScribe",
    ]));
  });
});
