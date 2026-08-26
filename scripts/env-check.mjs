import { inspectEnvironment, loadLocalEnvironment } from "./env-contract.mjs";

loadLocalEnvironment();
const result = inspectEnvironment();

console.log(JSON.stringify({
  ok: result.ok,
  variables: result.entries,
  invalidKeys: result.invalidKeys,
  publicExposureViolations: result.publicExposureViolations,
  sharedSecretPairs: result.sharedSecretPairs,
}, null, 2));

if (!result.ok) process.exitCode = 1;
