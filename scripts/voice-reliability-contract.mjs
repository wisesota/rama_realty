const commitPattern = /^[a-f0-9]{40}$/;
const forbiddenField = /(?:rawAudio|audioData|transcript|brief|prompt|modelOutput|email|phone|contact|authorization|apiKey|token|buyerId|sessionId|searchRunId|propertyId|budget|location|address)/i;
const timingFields = ["tokenMs", "socketMs", "firstServerEventMs", "firstAudioMs", "totalTurnMs"];

function forbiddenPaths(value, path = "root") {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap((item, index) => forbiddenPaths(item, `${path}[${index}]`));
  return Object.entries(value).flatMap(([key, child]) => [
    ...(forbiddenField.test(key) && !timingFields.includes(key) ? [`${path}.${key}`] : []),
    ...forbiddenPaths(child, `${path}.${key}`),
  ]);
}

function percentile(values, percentileValue) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(percentileValue * sorted.length) - 1)];
}

function roundedRate(numerator, denominator) {
  return denominator === 0 ? null : Number((numerator / denominator).toFixed(6));
}

function profileMatches(run, profile) {
  return Object.entries(profile).every(([field, value]) => run?.[field] === value);
}

export function assessVoiceReliabilityEvidence(evidence, policy, now = new Date()) {
  const blockers = [];
  if (policy?.schemaVersion !== 1) blockers.push("policy_invalid");
  if (evidence?.schemaVersion !== 1) blockers.push("schema_invalid");
  if (!commitPattern.test(evidence?.releaseCommit ?? "")) blockers.push("release_commit_invalid");
  if (evidence?.evidenceAuthority !== "ci-and-device-lab") blockers.push("authority_invalid");

  const generatedAt = Date.parse(evidence?.generatedAt ?? "");
  const currentTime = now instanceof Date ? now.getTime() : Date.now();
  if (Number.isNaN(generatedAt)) {
    blockers.push("generated_at_invalid");
  } else if (generatedAt > currentTime + 5 * 60_000 || currentTime - generatedAt > policy.evidenceMaximumAgeHours * 60 * 60_000) {
    blockers.push("evidence_stale");
  }

  const runs = Array.isArray(evidence?.runs) ? evidence.runs : [];
  if (runs.length < policy.minimumRuns) blockers.push("insufficient_runs");
  const liveRuns = runs.filter((run) => run?.kind === "live-provider");
  const faultRuns = runs.filter((run) => run?.kind === "fault-injection");
  const successfulLiveRuns = liveRuns.filter((run) => run?.outcome === "success");
  if (liveRuns.length < policy.minimumLiveProviderRuns) blockers.push("insufficient_live_provider_runs");

  for (const profile of policy.requiredLiveProfiles) {
    const count = liveRuns.filter((run) => profileMatches(run, profile)).length;
    if (count < policy.minimumRunsPerLiveProfile) {
      blockers.push(`profile_coverage_missing:${profile.browser}:${profile.device}:${profile.network}:${profile.locale}`);
    }
  }
  for (const outcome of policy.requiredFailureOutcomes) {
    if (!faultRuns.some((run) => run?.outcome === outcome)) blockers.push(`failure_mode_missing:${outcome}`);
  }

  const allowedKinds = new Set(["live-provider", "fault-injection"]);
  if (runs.some((run) => typeof run?.id !== "string" || !run.id.trim() || !allowedKinds.has(run.kind) || run.environment !== "staging")) blockers.push("run_shape_invalid");
  const runIds = runs.map((run) => run?.id);
  if (new Set(runIds).size !== runIds.length) blockers.push("duplicate_run_ids");
  if (successfulLiveRuns.some((run) => timingFields.some((field) => !Number.isFinite(run?.stages?.[field]) || run.stages[field] < 0 || run.stages[field] > policy.hardMaximumStageMs))) {
    blockers.push("success_timing_invalid");
  }

  const successRate = roundedRate(successfulLiveRuns.length, liveRuns.length);
  const errorRate = successRate === null ? null : Number((1 - successRate).toFixed(6));
  const unexpectedFallbacks = liveRuns.filter((run) => run?.outcome === "recorded-fallback").length;
  const unexpectedFallbackRate = roundedRate(unexpectedFallbacks, liveRuns.length);
  const stages = Object.fromEntries(timingFields.map((field) => {
    const values = successfulLiveRuns.map((run) => run.stages?.[field]).filter(Number.isFinite);
    return [field, {
      p50: percentile(values, 0.5),
      p75: percentile(values, 0.75),
      p95: percentile(values, 0.95),
      p99: percentile(values, 0.99),
    }];
  }));

  if (successRate !== null && successRate < policy.targets.liveProviderSuccessRateMin) blockers.push("target_failed:live_provider_success_rate");
  if (unexpectedFallbackRate !== null && unexpectedFallbackRate > policy.targets.unexpectedFallbackRateMax) blockers.push("target_failed:unexpected_fallback_rate");
  for (const [metric, maximum] of Object.entries(policy.targets.stageP95MaximumMs)) {
    if (stages[metric]?.p95 === null || stages[metric]?.p95 > maximum) blockers.push(`target_failed:p95:${metric}`);
  }
  for (const [metric, maximum] of Object.entries(policy.targets.stageP99MaximumMs)) {
    if (stages[metric]?.p99 === null || stages[metric]?.p99 > maximum) blockers.push(`target_failed:p99:${metric}`);
  }

  const privacyFindings = forbiddenPaths(evidence);
  if (privacyFindings.length) blockers.push("forbidden_fields_present");

  return {
    ok: blockers.length === 0,
    blockers: [...new Set(blockers)],
    privacyFindings,
    summary: {
      totalRuns: runs.length,
      liveProviderRuns: liveRuns.length,
      faultInjectionRuns: faultRuns.length,
      successfulLiveProviderRuns: successfulLiveRuns.length,
      liveProviderSuccessRate: successRate,
      liveProviderErrorRate: errorRate,
      unexpectedFallbackRate,
      stages,
      percentileMethod: "nearest-rank",
    },
  };
}
