"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Shield, Scale, Eye, Sparkles, Building2, Lock } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

const values = [
  {
    icon: Scale,
    title: "Nordic Restraint",
    description: "Filtering out market noise to deliver curated precision rather than thousands of unvetted listings.",
  },
  {
    icon: Shield,
    title: "100% Escrow Compliance",
    description: "Strict alignment with Dubai Land Department Law No. 8 to ensure every dirham of capital is bank-guaranteed.",
  },
  {
    icon: Eye,
    title: "Uncompromising Transparency",
    description: "Clear statutory disclosure: illustrative inventory boundaries, net yield projections, and zero hidden markups.",
  },
  {
    icon: Sparkles,
    title: "Architectural Provenance",
    description: "Prioritizing developments by world-renowned architects (Foster + Partners, Zaha Hadid, Kerzner) with enduring capital appreciation.",
  },
  {
    icon: Building2,
    title: "Direct Developer Tier",
    description: "Direct relationship allocations with Emaar, Omniyat, and Sobha ensuring zero third-party broker markups.",
  },
  {
    icon: Lock,
    title: "Discreet Governance",
    description: "Family office level confidentiality with ephemeral AI processing and zero cold-calling spam networks.",
  },
];

const stats = [
  { value: "150+", label: "Curated Estates", sub: "Pre-screened & vetted" },
  { value: "$5.2B+", label: "Portfolio Volume", sub: "Under advisory coverage" },
  { value: "100%", label: "Escrow Protected", sub: "DLD / RERA guaranteed" },
  { value: "0%", label: "Buyer Surcharge", sub: "Transparent advisory" },
];

export function ArchivantaAbout() {
  return (
    <section id="about" aria-labelledby="about-title" className="w-full bg-[var(--rama-ink-dark)] py-24 md:py-32 border-t border-white/10 overflow-hidden">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        {/* Main Philosophy Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-24">
          {/* Left Text / Mission */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            <BlurFade delay={0.1} inView>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-px bg-[var(--rama-ivory)]/50" aria-hidden="true" />
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ivory)]/70 font-bold">Institutional Curation</p>
                </div>
                <h2 id="about-title" className="font-sans text-4xl md:text-6xl lg:text-7xl text-white font-bold tracking-tighter leading-[0.9]">
                  CURATED LIVING<br />
                  <span className="font-heading italic text-4xl md:text-5xl lg:text-6xl text-white/80 font-normal tracking-wide">architecture</span>
                </h2>
              </div>
            </BlurFade>

            <BlurFade delay={0.2} inView>
              <p className="text-white/60 text-sm md:text-base font-sans leading-relaxed">
                We apply disciplined institutional precision to Dubai&apos;s dynamic real estate landscape. Rather than overwhelming you with endless unverified listings, Rama curates a vetted collection tailored directly to your lifestyle brief.
              </p>
            </BlurFade>

            <BlurFade delay={0.3} inView>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-white/80 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-[var(--rama-ivory)] shrink-0" />
                  <span>Voice-led discovery converts your spoken intent into an actionable brief</span>
                </div>
                <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-white/80 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-[var(--rama-ivory)] shrink-0" />
                  <span>Real-time DLD verified masterplans, rental yields, and payment roadmaps</span>
                </div>
                <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-white/80 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-[var(--rama-ivory)] shrink-0" />
                  <span>Transparent Decision Room with zero hidden broker markups</span>
                </div>
              </div>
            </BlurFade>

            <BlurFade delay={0.4} inView>
              <a
                href="#guided-search"
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--rama-ivory)] hover:opacity-70 transition-opacity border-b border-[var(--rama-ivory)] pb-1 pt-2 w-fit font-sans"
              >
                <span>Experience Guided Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </BlurFade>
          </div>

          {/* Right Image Collage */}
          <div className="lg:col-span-6 relative aspect-[4/3] md:aspect-[16/11]">
            <BlurFade delay={0.2} inView className="w-full h-full">
              <div className="relative w-full h-full">
                <div className="absolute top-0 right-0 w-[80%] h-[84%] overflow-hidden border border-white/15 bg-white/5">
                  <Image
                    src="/images/about-interior.jpg"
                    alt="Dubai luxury penthouse interior architectural detail"
                    fill
                    sizes="(max-width: 1024px) 70vw, 40vw"
                    className="object-cover"
                  />
                </div>
                <div className="absolute bottom-0 left-0 w-[55%] h-[60%] overflow-hidden border border-white/20 bg-[var(--rama-ink-dark)] shadow-2xl">
                  <Image
                    src="/images/about-exterior.jpg"
                    alt="Dubai architectural exterior craftsmanship"
                    fill
                    sizes="(max-width: 1024px) 50vw, 30vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </BlurFade>
          </div>
        </div>

        {/* 6 Core Institutional Values Grid */}
        <div className="mb-24">
          <div className="flex flex-col gap-4 mb-16">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[var(--rama-ivory)]/50" aria-hidden="true" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ivory)]/70 font-bold">Guiding Pillars</p>
            </div>
            <h3 className="font-sans text-3xl md:text-5xl text-white font-bold tracking-tighter leading-[0.95]">
              THE VALUES THAT SHAPE<br />
              <span className="font-heading italic text-3xl md:text-5xl text-white/80 font-normal tracking-wide">every acquisition</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((val, idx) => {
              const Icon = val.icon;
              return (
                <BlurFade key={idx} delay={0.06 * idx} inView>
                  <div className="p-8 bg-transparent border border-white/10 flex flex-col gap-4 hover:border-white/30 transition-all duration-300 h-full">
                    <div className="w-12 h-12 border border-white/15 bg-white/5 text-[var(--rama-ivory)] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-heading italic text-2xl text-white">
                      {val.title}
                    </h4>
                    <p className="text-xs font-sans text-white/50 leading-relaxed">
                      {val.description}
                    </p>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </div>

        {/* Stats Strip */}
        <BlurFade delay={0.25} inView>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-white/10">
            {stats.map((item, idx) => (
              <div key={idx} className="p-6 bg-transparent border border-white/10 space-y-1">
                <div className="font-heading italic text-4xl text-white">
                  {item.value}
                </div>
                <div className="font-sans text-xs font-bold uppercase tracking-widest text-white/80 pt-1">
                  {item.label}
                </div>
                <div className="font-sans text-[10px] uppercase tracking-wider text-white/40">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
