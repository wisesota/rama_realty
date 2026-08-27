"use client";

import React from "react";
import { Marquee } from "@/components/ui/marquee";

const developers = [
  { name: "EMAAR", tag: "Master Developer" },
  { name: "OMNIYAT", tag: "Ultra Luxury" },
  { name: "DAMAC", tag: "Luxury Branded" },
  { name: "SOBHA", tag: "Signature Quality" },
  { name: "MERAAS", tag: "Waterfront & Urban" },
  { name: "NAKHEEL", tag: "Island Pioneer" },
  { name: "ELLINGTON", tag: "Design-Led Boutique" },
  { name: "SELECT GROUP", tag: "Marina Specialist" },
  { name: "BINGHATTI", tag: "Hyper-Tower Partner" },
  { name: "BEYOND", tag: "Architectural Frontier" },
];

export function ArchivantaPartners() {
  return (
    <section id="partners" aria-labelledby="partners-title" className="w-full bg-[var(--rama-ink-dark)] py-24 md:py-32 border-t border-white/10 overflow-hidden">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[var(--rama-ivory)]/50" aria-hidden="true" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ivory)]/70 font-bold">Ecosystem Relationships</p>
            </div>
            <h2 id="partners-title" className="font-sans text-4xl md:text-5xl lg:text-6xl text-white font-bold tracking-tighter leading-[0.95]">
              DIRECT DEVELOPER<br />
              <span className="font-heading italic text-3xl md:text-4xl lg:text-5xl text-white/80 font-normal tracking-wide">tier allocations</span>
            </h2>
            <p className="text-white/60 text-sm md:text-base leading-relaxed font-sans mt-2">
              We maintain direct master-developer allocations across Dubai&apos;s most respected real estate institutions, ensuring early private-preview access before public off-plan launches.
            </p>
          </div>

          <div className="lg:col-span-7 relative flex h-80 w-full flex-row items-center justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
            <Marquee vertical className="[--duration:24s]">
              {developers.slice(0, 5).map((dev, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-6 bg-transparent border border-white/10 mb-4 h-28 w-56 hover:border-white/30 group transition-all duration-300 cursor-default"
                >
                  <span className="font-sans font-bold text-lg tracking-[0.2em] text-white group-hover:text-[var(--rama-ivory)] transition-colors">
                    {dev.name}
                  </span>
                  <span className="font-sans text-[9px] uppercase font-bold tracking-[0.2em] text-white/40 mt-1">
                    {dev.tag}
                  </span>
                </div>
              ))}
            </Marquee>

            <Marquee reverse vertical className="[--duration:24s]">
              {developers.slice(5).map((dev, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center p-6 bg-transparent border border-white/10 mb-4 h-28 w-56 hover:border-white/30 group transition-all duration-300 cursor-default"
                >
                  <span className="font-sans font-bold text-lg tracking-[0.2em] text-white group-hover:text-[var(--rama-ivory)] transition-colors">
                    {dev.name}
                  </span>
                  <span className="font-sans text-[9px] uppercase font-bold tracking-[0.2em] text-white/40 mt-1">
                    {dev.tag}
                  </span>
                </div>
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </section>
  );
}
