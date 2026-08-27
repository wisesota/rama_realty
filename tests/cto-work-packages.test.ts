import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type WorkPackage = {
  id: string;
  priority: string;
  accountableOwner: string;
  authorities: string[];
  prerequisites: string[];
  dependencies: string[];
  scope: string[];
  implementationScope: {
    files: string[];
    routes: string[];
    tables: string[];
    rpcs: string[];
    schemasOrInterfaces: string[];
  };
  automatedEvidence: string[];
  manualEvidence: string[];
  featureFlag: string;
  cohortRule: string;
  rollback: string;
  killSwitch: string;
  completionArtifact: string;
  gateStatus: string;
  remaining: string[];
};

const record = JSON.parse(readFileSync("docs/cto-work-packages.json", "utf8")) as {
  schemaVersion: number;
  plan: string;
  packages: WorkPackage[];
};

describe("CTO work-package contract", () => {
  it("covers every approved phase exactly once in dependency order", () => {
    expect(record.schemaVersion).toBe(1);
    expect(record.plan).toBe("JUMPING_THE_CURVE_CTO_PLAN");
    expect(record.packages.map((workPackage) => workPackage.id)).toEqual([
      "P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8",
    ]);
    const known = new Set<string>();
    for (const workPackage of record.packages) {
      expect(workPackage.dependencies.every((dependency) => known.has(dependency))).toBe(true);
      known.add(workPackage.id);
    }
  });

  it("makes authority, evidence, rollout, rollback, and completion artifacts explicit", () => {
    for (const workPackage of record.packages) {
      expect(workPackage.priority).toMatch(/^P[0-2]$/);
      expect(workPackage.accountableOwner.length).toBeGreaterThan(2);
      expect(workPackage.authorities.length).toBeGreaterThan(0);
      expect(workPackage.scope.length).toBeGreaterThan(0);
      expect(workPackage.implementationScope.files.length).toBeGreaterThan(0);
      expect(workPackage.implementationScope.schemasOrInterfaces.length).toBeGreaterThan(0);
      for (const file of workPackage.implementationScope.files) expect(existsSync(file), file).toBe(true);
      for (const route of workPackage.implementationScope.routes) {
        if (route.startsWith("app/")) expect(existsSync(route), route).toBe(true);
        else expect(route, route).toMatch(/^\//);
      }
      expect(workPackage.automatedEvidence.length).toBeGreaterThan(0);
      expect(workPackage.manualEvidence.length).toBeGreaterThan(0);
      expect(workPackage.featureFlag.length).toBeGreaterThan(4);
      expect(workPackage.cohortRule.length).toBeGreaterThan(8);
      expect(workPackage.rollback.length).toBeGreaterThan(8);
      expect(workPackage.killSwitch.length).toBeGreaterThan(8);
      expect(workPackage.completionArtifact.length).toBeGreaterThan(8);
      expect(existsSync(workPackage.completionArtifact), workPackage.completionArtifact).toBe(true);
      expect(workPackage.gateStatus).toMatch(/complete|open|blocked/);
    }
  });

  it("does not hide open real-world evidence behind repository completion", () => {
    expect(record.packages.every((workPackage) => workPackage.remaining.length > 0)).toBe(true);
    expect(record.packages.find((workPackage) => workPackage.id === "P6")?.gateStatus).toBe("blocked_external");
  });

  it("resolves every automated evidence item to a checked-in test or pnpm command", () => {
    for (const workPackage of record.packages) {
      for (const evidence of workPackage.automatedEvidence) {
        if (evidence.startsWith("tests/")) expect(existsSync(evidence), evidence).toBe(true);
        else expect(evidence, evidence).toMatch(/^pnpm /);
      }
    }
  });
});
