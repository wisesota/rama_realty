"use client";

import { cn } from "@/lib/utils";

export interface ProgressiveBlurProps {
  className?: string;
  height?: string;
  position?: "top" | "bottom";
  blurLevels?: number[];
}

/**
 * Low-blur adaptation of Magic UI's Progressive Blur.
 * Consumers should render it only when it communicates scrollable overflow.
 */
export function ProgressiveBlur({
  className,
  height = "2rem",
  position = "bottom",
  blurLevels = [0.5, 1, 1.5, 2.5],
}: ProgressiveBlurProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("progressive-blur", `progressive-blur--${position}`, className)}
      style={{ height }}
    >
      {blurLevels.map((blur, index) => {
        const start = (index / blurLevels.length) * 100;
        const end = ((index + 2) / blurLevels.length) * 100;
        const direction = position === "bottom" ? "to bottom" : "to top";
        const mask = `linear-gradient(${direction}, transparent ${start}%, black ${(start + end) / 2}%, transparent ${Math.min(end, 100)}%)`;
        return (
          <span
            key={blur}
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: mask,
              WebkitMaskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
}
