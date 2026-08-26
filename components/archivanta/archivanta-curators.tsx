"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, Award, Building, Mail } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

interface Curator {
  id: string;
  name: string;
  role: string;
  specialty: string;
  experience: string;
  image: string;
}

const curators: Curator[] = [
  {
    id: "elena-vance",
    name: "Elena Vance",
    role: "Head of Architectural Provenance",
    specialty: "Palm Jumeirah & Waterfront Estates",
    experience: "14+ Years Dubai Market",
    image: "/images/process-curation.jpg",
  },
  {
    id: "marcus-sterling",
    name: "Marcus Sterling",
    role: "Senior Family Office Counsel",
    specialty: "Cross-Border Wealth & Tax Structuring",
    experience: "Former Goldman Sachs Wealth",
    image: "/images/process-discovery.jpg",
  },
  {
    id: "tariq-alhashimi",
    name: "Dr. Tariq Al-Hashimi",
    role: "Director of Regulatory Affairs",
    specialty: "DLD Escrow & UAE Golden Visa Law",
    experience: "Ex-RERA Advisory Panel",
    image: "/images/process-transition.jpg",
  },
  {
    id: "sophia-lindqvist",
    name: "Sophia Lindqvist",
    role: "Nordic Design & Off-Plan Lead",
    specialty: "Sustainable Architecture & Masterplans",
    experience: "Stockholm • Dubai Architecture",
    image: "/images/about-interior.jpg",
  },
];

export function ArchivantaCurators() {
  return (
    <section id="curators" aria-labelledby="curators-title" className="w-full bg-[var(--rama-ivory)] py-24 md:py-32 border-t border-[var(--rama-ink-dark)]/10">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[var(--rama-ink-dark)]/30" aria-hidden="true" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ink-dark)]/70 font-bold">Private Client Advisory</p>
            </div>
            <h2 id="curators-title" className="font-sans text-4xl md:text-6xl lg:text-7xl text-[var(--rama-ink-dark)] font-bold tracking-tighter leading-[0.9]">
              OUR CURATORS<br />
              <span className="font-heading italic text-4xl md:text-5xl lg:text-6xl text-[var(--rama-ink-dark)]/80 font-normal tracking-wide">& counsel</span>
            </h2>
          </div>

          <a
            href="#guided-search"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--rama-ink-dark)] hover:opacity-70 transition-opacity border-b border-[var(--rama-ink-dark)] pb-1 w-fit font-sans"
          >
            <span>Connect with a Curator</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 4-Column Curators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {curators.map((curator, idx) => (
            <BlurFade key={curator.id} delay={0.08 * idx} inView>
              <div className="group border border-[var(--rama-ink-dark)]/15 overflow-hidden flex flex-col h-full bg-transparent hover:border-[var(--rama-ink-dark)]/40 transition-all duration-300">
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-[var(--rama-ink-dark)]">
                  <Image
                    src={curator.image}
                    alt={curator.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover grayscale contrast-125 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <a
                      href="#guided-search"
                      className="w-full py-3 bg-[var(--rama-ivory)] text-[var(--rama-ink-dark)] text-[10px] uppercase font-bold tracking-[0.2em] text-center flex items-center justify-center gap-2 hover:bg-white transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Request Brief</span>
                    </a>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow justify-between gap-4">
                  <div>
                    <h3 className="font-heading italic text-2xl text-[var(--rama-ink-dark)]">
                      {curator.name}
                    </h3>
                    <p className="font-sans text-[9px] uppercase tracking-[0.2em] font-bold text-[var(--rama-ink-dark)]/60 mt-1">
                      {curator.role}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-[var(--rama-ink-dark)]/10 font-sans text-xs text-[var(--rama-ink-dark)]/70">
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-[var(--rama-ink-dark)]/40 shrink-0" />
                      <span className="truncate">{curator.specialty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-[var(--rama-ink-dark)]/40 shrink-0" />
                      <span>{curator.experience}</span>
                    </div>
                  </div>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
