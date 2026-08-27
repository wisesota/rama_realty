export const buyerDataDeletionConfirmation = "DELETE MY RAMA DATA" as const;

export type BuyerDataOwnerType = "authenticated" | "anonymous";

export type BuyerDataExport = {
  exportVersion: "rama-buyer-export/1.0";
  generatedAt: string;
  ownerType: BuyerDataOwnerType;
  [key: string]: unknown;
};

export type BuyerDataRetentionException = {
  category: string;
  count: number;
  reason: string;
  expiresAt: string;
};

export type BuyerDataDeletionResult = {
  requestId: string;
  applicationDataDeleted: true;
  authUserDeletionRequired: boolean;
  deleted: Record<string, number>;
  externalDeletionRequired: string[];
  retainedExceptions: BuyerDataRetentionException[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isBuyerDataExport(value: unknown): value is BuyerDataExport {
  if (!isRecord(value)) return false;
  return value.exportVersion === "rama-buyer-export/1.0"
    && typeof value.generatedAt === "string"
    && (value.ownerType === "authenticated" || value.ownerType === "anonymous");
}

export function isBuyerDataDeletionResult(value: unknown): value is BuyerDataDeletionResult {
  if (!isRecord(value)
    || typeof value.requestId !== "string"
    || value.applicationDataDeleted !== true
    || typeof value.authUserDeletionRequired !== "boolean"
    || !isRecord(value.deleted)
    || !Array.isArray(value.externalDeletionRequired)
    || !value.externalDeletionRequired.every((item) => typeof item === "string")
    || !Array.isArray(value.retainedExceptions)) return false;

  if (!Object.values(value.deleted).every((count) => typeof count === "number" && Number.isInteger(count) && count >= 0)) {
    return false;
  }

  return value.retainedExceptions.every((item) => isRecord(item)
    && typeof item.category === "string"
    && typeof item.count === "number"
    && Number.isInteger(item.count)
    && item.count >= 0
    && typeof item.reason === "string"
    && typeof item.expiresAt === "string");
}
