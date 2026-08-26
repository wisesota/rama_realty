"use client";

import { LottieLight, type LottieDirection, type LottieHandle } from "lottie-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef } from "react";

export type GeminiLiveSignalState =
  | "resting"
  | "requesting"
  | "listening"
  | "processing"
  | "complete"
  | "error";

const signalBehavior = {
  resting: { direction: "forward", frame: 0, loop: false, speed: 0.45 },
  requesting: { direction: "forward", frame: 18, loop: true, speed: 0.72 },
  listening: { direction: "forward", frame: 42, loop: true, speed: 1 },
  processing: { direction: "forward", frame: 78, loop: true, speed: 1.3 },
  complete: { direction: "forward", frame: 116, loop: false, speed: 0.65 },
  error: { direction: "reverse", frame: 18, loop: false, speed: 0.55 },
} as const satisfies Record<GeminiLiveSignalState, {
  direction: LottieDirection;
  frame: number;
  loop: boolean;
  speed: number;
}>;

function SignalMark({ state }: { state: GeminiLiveSignalState }) {
  if (state === "complete" || state === "error") {
    return (
      <svg viewBox="0 0 24 24" role="presentation">
        <motion.path
          d={state === "complete" ? "M6.5 12.5l3.4 3.4 7.6-8" : "M8 8l8 8m0-8-8 8"}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </svg>
    );
  }

  if (state === "listening") {
    return (
      <span className="gemini-live-signal__levels" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    );
  }

  if (state === "requesting") {
    return (
      <span className="gemini-live-signal__request" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    );
  }

  return <span className="gemini-live-signal__criterion" aria-hidden="true" />;
}

export function GeminiLiveSignal({
  src,
  state = "resting",
}: {
  src: string;
  state?: GeminiLiveSignalState;
}) {
  const lottie = useRef<LottieHandle>(null);
  const reducedMotion = useReducedMotion();
  const behavior = signalBehavior[state];
  const active = state === "requesting" || state === "listening" || state === "processing";

  const applyPlaybackState = useCallback(() => {
    const player = lottie.current;
    if (!player) return;

    player.setLoop(reducedMotion ? false : behavior.loop);
    player.setDirection(behavior.direction);
    player.setSpeed(behavior.speed);
    player.pause();
    player.seek(behavior.frame);
    if (!reducedMotion) player.play();
  }, [behavior, reducedMotion]);

  useEffect(() => applyPlaybackState(), [applyPlaybackState]);

  return (
    <motion.div
      className="gemini-live-signal"
      data-state={state}
      initial={false}
      animate={reducedMotion ? undefined : state === "error" ? { x: [0, -2, 2, -1, 0] } : { x: 0 }}
      transition={{ duration: state === "error" ? 0.28 : 0.18, ease: "easeOut" }}
      aria-hidden="true"
    >
      <motion.span
        className="gemini-live-signal__rail gemini-live-signal__rail--horizontal"
        initial={false}
        animate={reducedMotion || !active
          ? { opacity: 0.34, scaleX: state === "complete" ? 1 : 0.64 }
          : { opacity: [0.3, 0.72, 0.3], scaleX: [0.58, 1, 0.58] }}
        transition={active ? { duration: 1.7, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY } : { duration: 0.25 }}
      />
      <motion.span
        className="gemini-live-signal__rail gemini-live-signal__rail--vertical"
        initial={false}
        animate={reducedMotion || !active
          ? { opacity: 0.26, scaleY: state === "complete" ? 1 : 0.64 }
          : { opacity: [0.24, 0.62, 0.24], scaleY: [0.52, 1, 0.52] }}
        transition={active ? { duration: 1.7, delay: 0.2, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY } : { duration: 0.25 }}
      />

      <motion.div
        className="gemini-live-signal__lottie"
        initial={false}
        animate={reducedMotion
          ? { opacity: 0.86, scale: 1 }
          : { opacity: state === "error" ? 0.56 : 0.94, scale: active ? 1 : 0.97 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <LottieLight
          src={src}
          lottieRef={lottie}
          autoplay={false}
          subscriptions={{ ready: applyPlaybackState }}
          className="gemini-live-signal__animation"
          aria-hidden="true"
        />
      </motion.div>

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={state}
          className="gemini-live-signal__mark"
          data-state={state}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.78 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.86 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <SignalMark state={state} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
