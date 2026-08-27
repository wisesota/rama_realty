import { Check, CircleHelp, LockKeyhole, Shield } from "lucide-react";

export type BoundaryLedgerItem = {
  title: string;
  body: string;
  state: "source" | "consent" | "privacy" | "unknown";
};

const icons = {
  source: Check,
  consent: Shield,
  privacy: LockKeyhole,
  unknown: CircleHelp,
};

export function BoundaryLedger({ items }: { items: readonly BoundaryLedgerItem[] }) {
  return (
    <dl className="boundary-ledger">
      {items.map((item) => {
        const Icon = icons[item.state];
        return (
          <div key={item.title} data-state={item.state}>
            <dt><Icon aria-hidden="true" />{item.title}</dt>
            <dd>{item.body}</dd>
          </div>
        );
      })}
    </dl>
  );
}
