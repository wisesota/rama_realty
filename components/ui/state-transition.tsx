"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StateTransitionProps = {
  state: string;
  children: ReactNode;
  className?: string;
};

const transition = {
  duration: 0.15,
  ease: [0.16, 1, 0.3, 1] as const,
};

export function StateTransition({ state, children, className }: StateTransitionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.div
        key={state}
        className={cn(className)}
        initial={{ opacity: 0.86, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -2 }}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
