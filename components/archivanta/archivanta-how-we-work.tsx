"use client";

import React from "react";
import Image from "next/image";
import { Mic, Sliders, ShieldCheck, KeyRound } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

const steps = [
  {
    id: 1,
    icon: Mic,
    title: "Voice-Led Discovery",
    tagline: "Speak or Type",
    description:
      "Express your ideal Dubai lifestyle naturally. Our conversational AI agent synthesizes your budget, family needs, and yield expectations.",
  },
  {
    id: 2,
    icon: Sliders,
    title: "Architectural Curation",
    tagline: "Vetted Catalog",
    description:
      "We match your criteria against governed masterplans from Emaar, Omniyat, and Sobha, screening for provenance and rental liquidity.",
  },
  {
    id: 3,
    icon: ShieldCheck,
    title: "The Decision Room",
    tagline: "Transparent Data",
    description:
      "Enter a dedicated digital dossier with transparent pricing, DLD construction milestones, payment roadmaps, and tax comparisons.",
  },
  {
    id: 4,
    icon: KeyRound,
    title: "Protected Acquisition",
    tagline: "Escrow & Golden Visa",
    description:
      "Direct developer allocation with zero broker markups, 100% statutory escrow compliance, and seamless Golden Visa processing.",
  },
];

export function ArchivantaHowWeWork() {
  return (
    <section id="process" aria-labelledby="process-title" className="w-full bg-[var(--rama-ivory)] py-24 md:py-32 border-t border-[var(--rama-ink-dark)]/10">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[var(--rama-ink-dark)]/30" aria-hidden="true" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ink-dark)]/70 font-bold">Advisory Method</p>
            </div>
            <h2 id="process-title" className="font-sans text-4xl md:text-6xl lg:text-7xl text-[var(--rama-ink-dark)] font-bold tracking-tighter leading-[0.9]">
              HOW RAMA<br />
              <span className="font-heading italic text-4xl md:text-5xl lg:text-6xl text-[var(--rama-ink-dark)]/80 font-normal tracking-wide">works</span>
            </h2>
          </div>
          <p className="text-[var(--rama-ink-dark)]/60 text-sm md:text-base max-w-md font-sans leading-relaxed">
            A refined, four-step advisory model turning unstructured aspirations into institutional-grade clarity.
          </p>
        </div>

        {/* 4 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <BlurFade key={step.id} delay={0.08 * idx} inView>
                <div className="bg-transparent border border-[var(--rama-ink-dark)]/15 p-8 flex flex-col justify-between h-full hover:border-[var(--rama-ink-dark)]/40 transition-all duration-300">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] border border-[var(--rama-ink-dark)]/20 px-2.5 py-1">
                        Step 0{step.id}
                      </span>
                      <div className="w-10 h-10 border border-[var(--rama-ink-dark)]/20 flex items-center justify-center text-[var(--rama-ink-dark)]">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="font-sans text-[9px] text-[var(--rama-ink-dark)]/60 font-bold uppercase tracking-[0.2em]">
                        {step.tagline}
                      </div>
                      <h3 className="font-heading italic text-2xl text-[var(--rama-ink-dark)] mt-1">
                        {step.title}
                      </h3>
                    </div>
                    <p className="font-sans text-xs text-[var(--rama-ink-dark)]/70 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </BlurFade>
            );
          })}
        </div>

        {/* Process Photography Strip */}
        <BlurFade delay={0.2} inView>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative h-64 overflow-hidden bg-[var(--rama-ink-dark)] border border-[var(--rama-ink-dark)]/10 group">
              <Image
                src="/images/process-discovery.jpg"
                alt="Architectural discovery and lifestyle blueprints"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                <span className="font-sans text-white text-[10px] font-bold uppercase tracking-[0.2em]">01. Blueprint Synthesis</span>
              </div>
            </div>

            <div className="relative h-64 overflow-hidden bg-[var(--rama-ink-dark)] border border-[var(--rama-ink-dark)]/10 group">
              <Image
                src="/images/process-curation.jpg"
                alt="Property portfolio curation and verification"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                <span className="font-sans text-white text-[10px] font-bold uppercase tracking-[0.2em]">02. Masterplan Vetting</span>
              </div>
            </div>

            <div className="relative h-64 overflow-hidden bg-[var(--rama-ink-dark)] border border-[var(--rama-ink-dark)]/10 group">
              <Image
                src="/images/process-transition.jpg"
                alt="Handover and key transition"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
                <span className="font-sans text-white text-[10px] font-bold uppercase tracking-[0.2em]">03. Key Handover & Deed</span>
              </div>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
