import { notFound } from "next/navigation";
import { BuyerDecisionRoom } from "@/components/buyer-decision-room";
import { isPublicLocale } from "@/lib/i18n";
import { requireDecisionEnvelope } from "../../../discover/helper";

export const dynamic = "force-dynamic";

export default async function LocalizedDecisionRoomPage({
  params,
}: {
  params: Promise<{ locale: string; searchRunId: string }>;
}) {
  const { locale, searchRunId } = await params;
  if (!isPublicLocale(locale)) notFound();
  const envelope = await requireDecisionEnvelope(searchRunId);
  return <BuyerDecisionRoom envelope={envelope} locale={locale} />;
}
