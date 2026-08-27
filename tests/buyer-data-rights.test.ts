import { describe, expect, it } from "vitest";
import {
  buyerDataDeletionConfirmation,
  isBuyerDataDeletionResult,
  isBuyerDataExport,
} from "@/lib/buyer-data-rights";

describe("buyer data-rights contracts", () => {
  it("keeps the destructive confirmation phrase stable", () => {
    expect(buyerDataDeletionConfirmation).toBe("DELETE MY RAMA DATA");
  });

  it("accepts only versioned owner-scoped exports", () => {
    expect(isBuyerDataExport({
      exportVersion: "rama-buyer-export/1.0",
      generatedAt: "2026-08-22T12:00:00.000Z",
      ownerType: "authenticated",
      savedBriefs: [],
    })).toBe(true);
    expect(isBuyerDataExport({
      exportVersion: "rama-buyer-export/1.0",
      generatedAt: "2026-08-22T12:00:00.000Z",
      ownerType: "organization",
    })).toBe(false);
  });

  it("rejects malformed deletion counts and exception records", () => {
    const valid = {
      requestId: "request-1",
      applicationDataDeleted: true,
      authUserDeletionRequired: true,
      deleted: { savedBriefs: 2 },
      externalDeletionRequired: ["licensed-crm"],
      retainedExceptions: [{
        category: "privacy_request_audit",
        count: 1,
        reason: "Pseudonymized request evidence.",
        expiresAt: "2028-08-22T12:00:00.000Z",
      }],
    };
    expect(isBuyerDataDeletionResult(valid)).toBe(true);
    expect(isBuyerDataDeletionResult({ ...valid, deleted: { savedBriefs: -1 } })).toBe(false);
    expect(isBuyerDataDeletionResult({ ...valid, retainedExceptions: [{ category: "audit" }] })).toBe(false);
  });
});
