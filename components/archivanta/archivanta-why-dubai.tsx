"use client";

import React from "react";
import { 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  Plane, 
  Sparkles, 
  Building2 
} from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

const advantages = [
  {
    icon: TrendingUp,
    title: "8%–10% Rental Yields",
    tagline: "Global Outperformance",
    description:
      "Dubai delivers consistently higher net yields than London, New York, or Singapore, backed by high tenant demand.",
  },
  {
    icon: ShieldCheck,
    title: "0% Income & Capital Tax",
    tagline: "Fiscal Clarity",
    description:
      "Zero tax on property income, capital appreciation, and inheritance under UAE federal tax laws.",
  },
  {
    icon: Award,
    title: "10-Year UAE Golden Visa",
    tagline: "Residency Path",
    description:
      "Property acquisitions above AED 2M qualify primary buyers and families for long-term renewable residency.",
  },
  {
    icon: Plane,
    title: "Global Aviation Gateway",
    tagline: "2/3 of World within 8 hrs",
    description:
      "DXB connects over 250 global destinations, cementing Dubai as the world's most accessible wealth hub.",
  },
  {
    icon: Sparkles,
    title: "World's Safest Metropolis",
    tagline: "Ranked #1 Safety Index",
    description:
      "Consistently ranked among the safest cities globally for families, capital preservation, and personal liberty.",
  },
  {
    icon: Building2,
    title: "Regulated Escrow Law",
    tagline: "DLD & RERA Security",
    description:
      "Dubai Land Department enforces 100% developer milestone escrows, ensuring bulletproof buyer protection.",
  },
];

export function ArchivantaWhyDubai() {
  return (
    <section id="why-dubai" aria-labelledby="why-dubai-title" className="w-full bg-[var(--rama-ink-dark)] py-24 md:py-32 border-t border-white/10">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[var(--rama-ivory)]/50" aria-hidden="true" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ivory)]/70 font-bold">The Dubai Advantage</p>
            </div>
            <h2 id="why-dubai-title" className="font-sans text-4xl md:text-6xl lg:text-7xl text-white font-bold tracking-tighter leading-[0.9]">
              WHY CAPITAL<br />
              <span className="font-heading italic text-4xl md:text-5xl lg:text-6xl text-white/80 font-normal tracking-wide">gravitates to dubai</span>
            </h2>
          </div>
          <p className="text-white/60 text-sm md:text-base max-w-md font-sans leading-relaxed">
            Macroeconomic stability, world-first tax advantages, and sovereign-backed infrastructure create an unprecedented property climate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advantages.map((item, idx) => {
            const Icon = item.icon;
            return (
              <BlurFade key={idx} delay={0.08 * idx} inView>
                <div className="group relative flex flex-col h-full bg-transparent border border-white/10 p-8 hover:border-white/30 transition-all duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 flex items-center justify-center border border-white/15 bg-white/5">
                      <Icon className="w-5 h-5 text-[var(--rama-ivory)]" />
                    </div>
                    <span className="font-sans text-[9px] uppercase tracking-[0.2em] font-bold text-[var(--rama-ivory)]/70 border border-white/20 px-3 py-1.5 backdrop-blur-md">
                      {item.tagline}
                    </span>
                  </div>
                  <div className="space-y-3 mt-auto">
                    <h3 className="font-heading italic text-2xl text-white">
                      {item.title}
                    </h3>
                    <p className="font-sans text-xs text-white/50 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
