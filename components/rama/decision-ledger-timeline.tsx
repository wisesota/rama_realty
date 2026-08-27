export type DecisionLedgerTimelineItem = { id: string; label: string; detail: string; time?: string };

export function DecisionLedgerTimeline({ items }: { items: readonly DecisionLedgerTimelineItem[] }) {
  return <ol className="decision-ledger-timeline">{items.map((item) => <li key={item.id}><span aria-hidden="true" /><div><strong>{item.label}</strong><p>{item.detail}</p>{item.time ? <time>{item.time}</time> : null}</div></li>)}</ol>;
}
