import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { assessVoiceReliabilityEvidence } from "./voice-reliability-contract.mjs";

const inputIndex = process.argv.indexOf("--input");
const input = inputIndex === -1 ? undefined : process.argv[inputIndex + 1];
if (!input) throw new Error("--input is required.");
const outputIndex = process.argv.indexOf("--output");
const output = outputIndex === -1 ? undefined : process.argv[outputIndex + 1];
const evidence = JSON.parse(await readFile(resolve(input), "utf8"));
const policy = JSON.parse(await readFile(resolve("docs/voice-reliability-policy.json"), "utf8"));
const result = assessVoiceReliabilityEvidence(evidence, policy);
if (output) {
  const outputPath = resolve(output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({
    schemaVersion: 1,
    evidenceAuthority: evidence.evidenceAuthority,
    releaseCommit: evidence.releaseCommit,
    evidenceGeneratedAt: evidence.generatedAt,
    assessedAt: new Date().toISOString(),
    policyVersion: policy.policyVersion,
    result,
  }, null, 2)}\n`, { flag: "wx" });
}
console.log(JSON.stringify(result));
if (!result.ok) process.exitCode = 1;
