"use client";

import { type ComponentType, useEffect, useState } from "react";

type LottieRenderer = ComponentType<{
  src: string;
  loop: boolean;
  autoplay: boolean;
  className: string;
  "aria-hidden": "true";
}>;

interface LottieVisualizerProps {
  src: string;
  active?: boolean;
  loop?: boolean;
  className?: string;
}

export function LottieVisualizer({
  src,
  active = true,
  loop = false,
  className = "w-full h-full",
}: LottieVisualizerProps) {
  const [reducedMotion, setReducedMotion] = useState(true);
  const [Renderer, setRenderer] = useState<LottieRenderer | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!active || reducedMotion || Renderer) return;
    let disposed = false;
    const load = () => {
      void import("lottie-react").then((module) => {
        if (!disposed) setRenderer(() => module.Lottie as LottieRenderer);
      });
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      const idle = idleWindow.requestIdleCallback(load, { timeout: 2_000 });
      return () => {
        disposed = true;
        idleWindow.cancelIdleCallback?.(idle);
      };
    }
    const timer = globalThis.setTimeout(load, 1_200);
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
    };
  }, [Renderer, active, reducedMotion]);

  return (
    <div className={`relative flex items-center justify-center pointer-events-none ${className}`}>
      {Renderer ? (
        <Renderer
          src={src}
          loop={loop && !reducedMotion}
          autoplay={active && !reducedMotion}
          className="w-full h-full object-contain"
          aria-hidden="true"
        />
      ) : (
        <svg viewBox="0 0 240 160" className="w-full h-full" aria-hidden="true">
          <g fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.82">
            <path d="M44 80c18-28 43-42 76-42s58 14 76 42c-18 28-43 42-76 42S62 108 44 80Z" />
            <path d="M67 80c14-18 31-27 53-27s39 9 53 27c-14 18-31 27-53 27S81 98 67 80Z" />
            <path d="M92 80c8-9 17-14 28-14s20 5 28 14c-8 9-17 14-28 14S100 89 92 80Z" />
          </g>
        </svg>
      )}
    </div>
  );
}
