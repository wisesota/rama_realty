"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, Mic, Sparkles } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

export function ArchivantaCtaBanner() {
  return (
    <section id="cta-banner" aria-labelledby="cta-banner-title" className="w-full bg-[var(--rama-ink-dark)] py-24 md:py-32 border-t border-white/10">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        <BlurFade delay={0.15} inView>
          <div className="relative overflow-hidden border border-white/15 p-8 md:p-16 lg:p-20 bg-[var(--rama-ink-dark)]">
            <Image
              src="/images/dubai-golden-hour-cta.jpg"
              alt="Dubai luxury penthouse panoramic terrace at golden hour"
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover opacity-30 mix-blend-luminosity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--rama-ink-dark)] via-[var(--rama-ink-dark)]/80 to-[var(--rama-ink-dark)]" />

            <div className="relative z-10 max-w-3xl flex flex-col gap-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/20 text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[var(--rama-ivory)] w-fit">
                <Sparkles className="w-3 h-3 text-[var(--rama-ivory)]" />
                <span>Next-Generation Property Discovery</span>
              </div>

              <h2 id="cta-banner-title" className="font-sans text-4xl md:text-6xl text-white font-bold tracking-tighter leading-[0.95]">
                READY TO SHAPE YOUR<br />
                <span className="font-heading italic text-4xl md:text-6xl text-white/80 font-normal tracking-wide">dubai lifestyle brief?</span>
              </h2>

              <p className="font-sans text-white/60 text-sm md:text-base leading-relaxed max-w-2xl">
                Speak directly with Rama AI or describe your preferences to instantly generate a custom Decision Room with verified masterplans and financial roadmaps.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <a
                  href="#top"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[var(--rama-ivory)] text-[var(--rama-ink-dark)] text-xs font-sans font-bold uppercase tracking-[0.15em] hover:bg-white transition-colors"
                >
                  <Mic className="w-4 h-4 text-[var(--rama-ink-dark)]" />
                  <span>Start Voice Discovery</span>
                </a>
                <a
                  href="#guided-search"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent border border-white/30 text-white text-xs font-sans font-bold uppercase tracking-[0.15em] hover:bg-white/10 transition-colors"
                >
                  <span>Type Property Brief</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
