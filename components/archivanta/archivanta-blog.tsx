"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, Clock, BookOpen } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

interface Article {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  readTime: string;
  image: string;
}

const articles: Article[] = [
  {
    id: "golden-visa-2026",
    category: "Residency & Law",
    title: "The UAE Golden Visa 2026 Blueprint: Real Estate Criteria & Tax Exemptions",
    excerpt:
      "A comprehensive advisory brief on qualifying your family and assets for 10-year residency via freehold property ownership.",
    author: "Rama Intelligence Desk",
    readTime: "6 min read",
    image: "/images/downtown-dubai-burj.jpg",
  },
  {
    id: "offplan-vs-ready",
    category: "Capital Allocation",
    title: "Off-Plan Escrow vs. Ready Prime: Navigating Yields in Dubai’s Super-Prime Cycle",
    excerpt:
      "Analyzing 2024–2026 DLD transaction data to uncover where net rental yield outpaces capital growth across major masterplans.",
    author: "Advisory Research",
    readTime: "8 min read",
    image: "/images/dubai-marina-skyline.jpg",
  },
  {
    id: "branded-residences-surge",
    category: "Architectural Focus",
    title: "The Branded Residence Premium: Why Foster + Partners & Dorchester Lead the Market",
    excerpt:
      "Why global collectors pay a 30–45% premium for hospitality-serviced private estates on Palm Jumeirah and the Dubai Canal.",
    author: "Curatorial Team",
    readTime: "5 min read",
    image: "/images/palm-jumeirah-villa.jpg",
  },
];

export function ArchivantaBlog() {
  return (
    <section id="insights" aria-labelledby="insights-title" className="w-full bg-[var(--rama-ink-dark)] py-24 md:py-32 border-t border-white/10">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[var(--rama-ivory)]/50" aria-hidden="true" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ivory)]/70 font-bold">Market Intelligence & Editorial</p>
            </div>
            <h2 id="insights-title" className="font-sans text-4xl md:text-6xl lg:text-7xl text-white font-bold tracking-tighter leading-[0.9]">
              DUBAI REAL ESTATE<br />
              <span className="font-heading italic text-4xl md:text-5xl lg:text-6xl text-white/80 font-normal tracking-wide">journal</span>
            </h2>
          </div>

          <a
            href="#guided-search"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--rama-ivory)] hover:opacity-70 transition-opacity border-b border-[var(--rama-ivory)] pb-1 w-fit font-sans"
          >
            <span>Read All Research</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 3-Column Blog Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art, idx) => (
            <BlurFade key={art.id} delay={0.1 * idx} inView>
              <a href="#guided-search" className="block h-full group focus:outline-none">
                <article className="border border-white/10 flex flex-col h-full bg-transparent hover:border-white/30 transition-all duration-300">
                  <div className="relative aspect-[16/10] overflow-hidden bg-[var(--rama-ink-dark)]">
                    <Image
                      src={art.image}
                      alt={art.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 z-10 text-[9px] font-sans uppercase font-bold tracking-[0.2em] bg-black/60 backdrop-blur-md border border-white/20 text-white px-3 py-1.5">
                      {art.category}
                    </div>
                  </div>

                  <div className="p-8 flex flex-col flex-grow">
                    <div className="flex items-center gap-3 text-[10px] font-sans uppercase tracking-widest text-white/40 mb-4">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-[var(--rama-ivory)]/70" />
                        {art.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {art.readTime}
                      </span>
                    </div>

                    <h3 className="font-heading italic text-2xl text-white group-hover:text-[var(--rama-ivory)] transition-colors leading-tight mb-3">
                      {art.title}
                    </h3>

                    <p className="font-sans text-xs text-white/50 leading-relaxed line-clamp-3 mb-6">
                      {art.excerpt}
                    </p>

                    <div className="pt-6 border-t border-white/10 mt-auto">
                      <div className="inline-flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[var(--rama-ivory)]">
                        <span>Read Full Brief</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </article>
              </a>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
