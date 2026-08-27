"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

export type ProcessRailStep = { title: string; body: string; output: string };

export function ProcessRail({ steps, previousLabel, nextLabel }: { steps: readonly ProcessRailStep[]; previousLabel: string; nextLabel: string }) {
  const rail = useRef<HTMLOListElement | null>(null);

  function move(direction: -1 | 1) {
    const track = rail.current;
    if (!track) return;
    const items = Array.from(track.querySelectorAll<HTMLElement>("[data-process-step]"));
    const trackRect = track.getBoundingClientRect();
    const isRtl = getComputedStyle(track).direction === "rtl";
    const inlineStart = isRtl ? trackRect.right : trackRect.left;
    const current = items.reduce((nearest, item, index) => {
      const rect = item.getBoundingClientRect();
      const itemStart = isRtl ? rect.right : rect.left;
      return Math.abs(itemStart - inlineStart) < nearest.distance
        ? { index, distance: Math.abs(itemStart - inlineStart) }
        : nearest;
    }, { index: 0, distance: Number.POSITIVE_INFINITY });
    const next = Math.min(items.length - 1, Math.max(0, current.index + direction));
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    items[next]?.scrollIntoView({ behavior, block: "nearest", inline: "start" });
  }

  return (
    <div className="process-rail">
      <div className="process-rail__controls">
        <Button variant="outline" size="icon" aria-label={previousLabel} onPress={() => move(-1)}><ArrowLeft aria-hidden="true" /></Button>
        <Button variant="outline" size="icon" aria-label={nextLabel} onPress={() => move(1)}><ArrowRight aria-hidden="true" /></Button>
      </div>
      <ol ref={rail} className="process-rail__track">
        {steps.map((step, index) => (
          <li key={step.title} data-process-step>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            <small>{step.output}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}
