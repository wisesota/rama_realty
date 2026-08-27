import { Check, Minus } from "lucide-react";
import type { CSSProperties } from "react";

export type ComparisonPlaneColumn = { title: string; values: ReadonlyArray<{ label: string; value: string; confirmed?: boolean }> };

export function ComparisonPlane({ columns }: { columns: readonly ComparisonPlaneColumn[] }) {
  return (
    <div className="comparison-plane" style={{ "--comparison-columns": columns.length } as CSSProperties}>
      {columns.map((column) => (
        <section key={column.title}>
          <h3>{column.title}</h3>
          <dl>{column.values.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.confirmed ? <Check aria-hidden="true" /> : <Minus aria-hidden="true" />}{item.value}</dd></div>)}</dl>
        </section>
      ))}
    </div>
  );
}
