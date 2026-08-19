import { BuyerDecisionRoom } from "@/components/buyer-decision-room";
import { requireDecisionEnvelope } from "../helper";

export const dynamic = "force-dynamic";

export default async function DecisionRoomPage({ params }: { params: Promise<{ searchRunId: string }> }) {
  const { searchRunId } = await params;
  const envelope = await requireDecisionEnvelope(searchRunId);
  return <BuyerDecisionRoom envelope={envelope} />;
}
