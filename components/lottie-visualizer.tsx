"use client";

import { Lottie } from "lottie-react";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div className={`relative flex items-center justify-center pointer-events-none ${className}`}>
      <Lottie
        src={src}
        loop={loop && !reducedMotion}
        autoplay={active && !reducedMotion}
        className="w-full h-full object-contain"
        aria-hidden="true"
      />
    </div>
  );
}
