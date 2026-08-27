import type { EvidenceState as EvidenceStateValue } from "@/lib/agent/buyer-contracts";
import { cn } from "@/lib/utils";

const defaultLabels: Record<EvidenceStateValue, string> = {
  source_confirmed: "Source confirmed",
  buyer_confirmed: "Buyer confirmed",
  inferred: "Rama inference",
  stale: "Stale",
  disputed: "Changed",
  unknown: "Unknown",
};

export function EvidenceState({
  state,
  label,
  detail,
  className,
}: {
  state: EvidenceStateValue;
  label?: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div className={cn("evidence-state", className)} data-state={state}>
      <span className="evidence-state__mark" aria-hidden="true" />
      <span>
        <strong>{label ?? defaultLabels[state]}</strong>
        {detail ? <small>{detail}</small> : null}
      </span>
    </div>
  );
}

