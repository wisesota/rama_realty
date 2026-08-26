"use client";

import { useEffect, useRef, useState } from "react";
import { EvidenceState } from "@/components/rama/evidence-state";

export type DecisionSpecimenStage = "brief" | "fit" | "evidence" | "open_question" | "ledger_change";

export type DecisionSpecimenItem = {
  stage: DecisionSpecimenStage;
  label: string;
  title: string;
  body: string;
  evidence?: "source_confirmed" | "buyer_confirmed" | "inferred" | "stale" | "disputed" | "unknown";
  evidenceLabel?: string;
};

export function DecisionSpecimen({ items, ariaLabel }: { items: readonly DecisionSpecimenItem[]; ariaLabel: string }) {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nodes = root.current?.querySelectorAll<HTMLElement>("[data-specimen-step]");
    if (!nodes?.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = Number((visible.target as HTMLElement).dataset.index ?? "0");
      setActive(index);
    }, { rootMargin: "-35% 0px -45%", threshold: [0.15, 0.5, 0.8] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={root} className="decision-specimen">
      <div className="decision-specimen__sticky" aria-hidden="true">
        <span>{items[active]?.label}</span>
        <h3>{items[active]?.title}</h3>
        <p>{items[active]?.body}</p>
        {items[active]?.evidence ? <EvidenceState state={items[active].evidence} label={items[active].evidenceLabel} /> : null}
        <ol aria-label="Decision specimen progress">
          {items.map((item, index) => <li key={item.stage} aria-current={index === active ? "step" : undefined}>{String(index + 1).padStart(2, "0")}</li>)}
        </ol>
      </div>
      <ol className="decision-specimen__steps" aria-label={ariaLabel}>
        {items.map((item, index) => (
          <li key={item.stage} data-specimen-step data-index={index}>
            <span>{String(index + 1).padStart(2, "0")} / {item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
            {item.evidence ? <EvidenceState state={item.evidence} label={item.evidenceLabel} /> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
