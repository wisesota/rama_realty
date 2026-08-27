const requiredApprovalRoles = ["cto", "security", "privacy", "legal", "product"];
const requiredExternalGates = [
  "licensedSupplyAgreement",
  "advisorOperatingModel",
  "customerPilot",
  "privacyAndRetentionApproval",
];
const requiredLocalEvidence = [
  "lint",
  "typecheck",
  "unitAndContractTests",
  "productionBuild",
  "renderedBrowserQa",
  "dataRightsMigration",
  "environmentContract",
];
const requiredRuntimeFlags = [
  "RAMA_PUBLIC_EXPERIENCE_ENABLED",
  "RAMA_LANDING_COMPOSITION_ENABLED",
  "RAMA_CINEMATIC_HERO_ENABLED",
  "RAMA_BRIEF_CONFIRMATION_ENABLED",
  "RAMA_LOCALE_ROUTES_ENABLED",
  "RAMA_EVIDENCE_V2_WRITER_ENABLED",
  "RAMA_EVIDENCE_V2_RENDERER_ENABLED",
  "GEMINI_LIVE_ENABLED",
];
const providerIdPattern = /^[a-z0-9][a-z0-9_-]{1,62}$/;
const commitPattern = /^[a-f0-9]{40}$/;
const evidenceMaximumAgeMs = 24 * 60 * 60 * 1_000;
const sourceAuthoredCriterionWeave = {
  path: "public/lottie/rama-criterion-weave.json",
  kind: "original_geometric_lottie_signal",
  ownershipBasis: "repository_authored_geometric_vector_animation_2026-08-23",
  documentaryProof: "Source-authored Rama Criterion Weave JSON in this repository",
  sha256: "9aaaffd99ea54bd7ba87df68e50d6f7492c1883328fdfb941943ce95ef808912",
  bytes: 5401,
};

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isEvidenceArtifact(value, currentTime, maximumAgeMs) {
  if (!isRecord(value) || !isNonEmptyString(value.uri) || !/^https:\/\//.test(value.uri)) return false;
  const verifiedAt = Date.parse(value.verifiedAt);
  return typeof value.sha256 === "string"
    && /^[a-f0-9]{64}$/.test(value.sha256)
    && isNonEmptyString(value.owner)
    && !Number.isNaN(verifiedAt)
    && verifiedAt <= currentTime + 5 * 60 * 1_000
    && currentTime - verifiedAt <= maximumAgeMs;
}

function contractBlockers(releaseEvidence) {
  const blockers = [];
  if (!isRecord(releaseEvidence) || releaseEvidence.schemaVersion !== 1) {
    return ["release_evidence_schema_invalid"];
  }
  if (!isNonEmptyString(releaseEvidence.generatedAt) || Number.isNaN(Date.parse(releaseEvidence.generatedAt))) blockers.push("release_evidence_timestamp_invalid");
  if (!isRecord(releaseEvidence.states)) blockers.push("environment_states_missing");
  for (const environment of ["local", "preview", "staging", "production"]) {
    if (!isRecord(releaseEvidence.states?.[environment]) || !isNonEmptyString(releaseEvidence.states[environment].status)) blockers.push(`${environment}_state_missing`);
  }
  for (const key of requiredLocalEvidence) {
    if (!isNonEmptyString(releaseEvidence.states?.local?.evidence?.[key])) blockers.push(`local_evidence_missing:${key}`);
  }
  if (!isRecord(releaseEvidence.externalGates)) blockers.push("external_gates_missing");
  for (const gate of requiredExternalGates) {
    if (!isNonEmptyString(releaseEvidence.externalGates?.[gate])) blockers.push(`external_gate_missing:${gate}`);
  }
  if (releaseEvidence.releaseDecision === "approved" && releaseEvidence.states?.production?.status !== "approved") blockers.push("approved_decision_without_production_state");
  return blockers;
}

function productionBlockers(releaseEvidence, activationRecord, assetRights, publicAssets, environmentResult, runtimeEnvironment, now) {
  const blockers = [];
  if (releaseEvidence.releaseDecision !== "approved") blockers.push("release_decision_not_approved");
  for (const environment of ["local", "preview", "staging"]) {
    if (releaseEvidence.states?.[environment]?.status !== "verified") blockers.push(`${environment}_not_verified`);
  }
  if (releaseEvidence.states?.production?.status !== "approved") blockers.push("production_not_approved");
  for (const [gate, status] of Object.entries(releaseEvidence.externalGates ?? {})) {
    if (status !== "verified") blockers.push(`external_gate_open:${gate}`);
  }
  if (!environmentResult?.ok) blockers.push("environment_contract_failed");

  const generatedAt = Date.parse(releaseEvidence.generatedAt);
  const currentTime = now instanceof Date ? now.getTime() : Date.now();
  if (Number.isNaN(generatedAt) || generatedAt > currentTime + 5 * 60 * 1_000 || currentTime - generatedAt > evidenceMaximumAgeMs) blockers.push("release_evidence_stale");

  if (!isRecord(activationRecord) || activationRecord.schemaVersion !== 1) return [...blockers, "activation_record_schema_invalid"];
  if (activationRecord.status !== "approved") blockers.push("activation_record_not_approved");
  if (activationRecord.targetEnvironment !== "production") blockers.push("activation_target_invalid");
  if (typeof activationRecord.targetCommit !== "string" || !commitPattern.test(activationRecord.targetCommit)) blockers.push("activation_commit_invalid");
  if (releaseEvidence.commit !== activationRecord.targetCommit) blockers.push("release_evidence_commit_mismatch");
  if (runtimeEnvironment?.RAMA_RELEASE_COMMIT !== activationRecord.targetCommit) blockers.push("runtime_commit_mismatch");
  if (Number.isNaN(Date.parse(activationRecord.createdAt))) blockers.push("activation_created_at_invalid");

  const approvals = new Map((Array.isArray(activationRecord.approvals) ? activationRecord.approvals : []).map((approval) => [approval?.role, approval]));
  for (const role of requiredApprovalRoles) {
    const approval = approvals.get(role);
    if (!isRecord(approval) || approval.status !== "approved" || !isNonEmptyString(approval.owner) || Number.isNaN(Date.parse(approval.approvedAt))) blockers.push(`approval_missing:${role}`);
  }

  const cohort = activationRecord.rollout?.cohortPercent;
  if (!Number.isInteger(cohort) || cohort < 1 || cohort > 100) blockers.push("rollout_cohort_invalid");
  for (const flag of requiredRuntimeFlags) {
    if (activationRecord.rollout?.flags?.[flag] !== true) blockers.push(`activation_flag_disabled:${flag}`);
    if (runtimeEnvironment?.[flag] !== "true") blockers.push(`runtime_flag_not_enabled:${flag}`);
  }
  if (activationRecord.rollout?.flags?.LICENSED_SUPPLY_PUBLICATION_ENABLED !== true) blockers.push("licensed_supply_not_enabled");
  if (runtimeEnvironment?.LICENSED_SUPPLY_PUBLICATION_ENABLED !== "true") blockers.push("runtime_licensed_supply_not_enabled");
  if (runtimeEnvironment?.RAMA_DEMO_MODE !== "false") blockers.push("runtime_demo_mode_not_disabled");
  if (runtimeEnvironment?.RAMA_DECISION_OS_ROLLOUT_PERCENT !== String(cohort)) blockers.push("runtime_rollout_cohort_mismatch");
  try {
    const siteUrl = new URL(runtimeEnvironment?.NEXT_PUBLIC_SITE_URL ?? "");
    if (siteUrl.protocol !== "https:" || siteUrl.hostname === "localhost") blockers.push("production_site_url_invalid");
  } catch {
    blockers.push("production_site_url_invalid");
  }

  const providerIds = activationRecord.rollout?.providerIds;
  if (!Array.isArray(providerIds) || providerIds.length === 0) {
    blockers.push("licensed_provider_missing");
  } else if (!providerIds.every((providerId) => typeof providerId === "string" && providerIdPattern.test(providerId)) || new Set(providerIds).size !== providerIds.length) {
    blockers.push("licensed_provider_invalid");
  }
  const runtimeProviderIds = (runtimeEnvironment?.LICENSED_SUPPLY_PROVIDER_IDS ?? "")
    .split(",")
    .map((providerId) => providerId.trim())
    .filter(Boolean);
  if (!Array.isArray(providerIds) || runtimeProviderIds.length !== providerIds.length || runtimeProviderIds.some((providerId) => !providerIds.includes(providerId))) {
    blockers.push("runtime_licensed_provider_mismatch");
  }

  for (const field of [
    "rollbackOwner",
    "onCallOwner",
    "incidentOwner",
  ]) {
    if (!isNonEmptyString(activationRecord.operations?.[field])) blockers.push(`operation_evidence_missing:${field}`);
  }
  for (const [field, maximumAgeDays] of Object.entries({
    backupRestoreEvidence: 90,
    penetrationTestEvidence: 90,
    privacyCanaryEvidence: 7,
    hostedRlsEvidence: 1,
    credentialRotationEvidence: 1,
  })) {
    if (!isEvidenceArtifact(activationRecord.operations?.[field], currentTime, maximumAgeDays * 24 * 60 * 60 * 1_000)) blockers.push(`operation_evidence_missing:${field}`);
  }

  if (!isRecord(assetRights) || assetRights.schemaVersion !== 1 || assetRights.productionConclusion !== "approved") {
    blockers.push("asset_rights_not_approved");
  } else if (!Array.isArray(assetRights.assets) || assetRights.assets.length === 0 || assetRights.assets.some((asset) => {
    if (!isRecord(asset)) return true;
    const approvedByReview = asset.legalReview === "approved"
      && asset.productionEligibility === "approved"
      && isEvidenceArtifact(asset.documentaryProof, currentTime, 365 * 24 * 60 * 60 * 1_000);
    const sourceAuthoredOriginal = asset.path === sourceAuthoredCriterionWeave.path
      && asset.kind === sourceAuthoredCriterionWeave.kind
      && asset.legalReview === "not_required_original_geometric_asset"
      && asset.productionEligibility === "eligible"
      && asset.ownershipBasis === sourceAuthoredCriterionWeave.ownershipBasis
      && asset.documentaryProof === sourceAuthoredCriterionWeave.documentaryProof
      && asset.sha256 === sourceAuthoredCriterionWeave.sha256
      && asset.bytes === sourceAuthoredCriterionWeave.bytes;
    return !approvedByReview && !sourceAuthoredOriginal;
  })) {
    blockers.push("asset_rights_incomplete");
  }
  if (!Array.isArray(publicAssets)) {
    blockers.push("public_asset_inventory_missing");
  } else {
    const registeredAssets = new Set(Array.isArray(assetRights?.assets) ? assetRights.assets.map((asset) => asset?.path).filter(isNonEmptyString) : []);
    if (publicAssets.some((path) => !registeredAssets.has(path))) blockers.push("public_asset_unregistered");
  }
  return blockers;
}

export function assessReleaseReadiness({ releaseEvidence, activationRecord, assetRights, publicAssets, environmentResult, runtimeEnvironment, now, requireProduction = false }) {
  const blockers = contractBlockers(releaseEvidence);
  if (requireProduction && blockers.length === 0) blockers.push(...productionBlockers(releaseEvidence, activationRecord, assetRights, publicAssets, environmentResult, runtimeEnvironment, now));
  return {
    ok: blockers.length === 0,
    mode: requireProduction ? "production" : "contract",
    decision: releaseEvidence?.releaseDecision ?? "unknown",
    blockers,
  };
}
