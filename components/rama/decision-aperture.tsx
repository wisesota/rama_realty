"use client";

import { motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

export type DecisionApertureState =
  | "resting"
  | "requesting"
  | "listening"
  | "processing"
  | "complete"
  | "error";

function subscribeToClientReady(onStoreChange: () => void) {
  const frame = window.requestAnimationFrame(onStoreChange);
  return () => window.cancelAnimationFrame(frame);
}
const readClientReady = () => true;
const readServerReady = () => false;

export function DecisionAperture({ state = "resting" }: { state?: DecisionApertureState }) {
  const reducedMotion = useReducedMotion();
  const mounted = useSyncExternalStore(subscribeToClientReady, readClientReady, readServerReady);
  const animate = mounted && !reducedMotion;
  const listening = state === "listening";
  const processing = state === "processing" || state === "requesting";

  return (
    <div className="decision-aperture" data-state={state} aria-hidden="true">
      <svg viewBox="0 0 120 120" role="presentation">
        <rect className="decision-aperture__frame" x="18" y="18" width="84" height="84" rx="8" />
        <path className="decision-aperture__rail" d="M36 42h48M36 60h48M36 78h48" />
        <motion.path
          className="decision-aperture__aperture"
          d="M36 60h48"
          initial={false}
          animate={animate && listening ? { pathLength: [0.25, 1, 0.45], opacity: [0.55, 1, 0.7] } : { pathLength: 1, opacity: 1 }}
          transition={listening ? { duration: 1.6, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY } : { duration: 0.2 }}
        />
        {[42, 60, 78].map((y, index) => (
          <motion.circle
            key={y}
            className="decision-aperture__criterion"
            cx={state === "complete" ? 84 : state === "error" ? 42 : 60}
            cy={y}
            r="3.5"
            initial={false}
            animate={animate && processing ? { cx: [42, 78, 60], opacity: [0.48, 1, 0.72] } : undefined}
            transition={processing ? { duration: 1.8, delay: index * 0.12, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY } : { duration: 0.2 }}
          />
        ))}
        <motion.path
          className="decision-aperture__confirmation"
          d="M50 61l7 7 15-18"
          pathLength="1"
          initial={false}
          animate={{ pathLength: state === "complete" ? 1 : 0, opacity: state === "complete" ? 1 : 0 }}
          transition={{ duration: animate ? 0.35 : 0 }}
        />
        <motion.path
          className="decision-aperture__error"
          d="M54 54l12 12m0-12L54 66"
          initial={false}
          animate={{ opacity: state === "error" ? 1 : 0 }}
          transition={{ duration: animate ? 0.15 : 0 }}
        />
      </svg>
    </div>
  );
}
