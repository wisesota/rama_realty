import { notFound } from "next/navigation";
import { getBuyerSessionTokenHash } from "@/lib/buyer-session-server";
import { loadBuyerDecisionEnvelope } from "@/lib/discovery-service";

export async function requireDecisionEnvelope(searchRunId: string) {
  const buyerTokenHash = await getBuyerSessionTokenHash();
  if (!buyerTokenHash) notFound();
  const envelope = await loadBuyerDecisionEnvelope(searchRunId, buyerTokenHash);
  if (!envelope) notFound();
  return envelope;
}
