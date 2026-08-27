"use client";

import React from "react";
import Link from "next/link";
import { LockKeyhole, ShieldCheck, ArrowUp } from "lucide-react";
import { GridPattern } from "@/components/ui/grid-pattern";
import { cn } from "@/lib/utils";

export function ArchivantaFooter() {
  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <footer className="w-full bg-[var(--rama-ink-dark)] font-sans relative overflow-hidden flex flex-col pt-24 pb-12 border-t border-white/10">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12 w-full relative z-10">
        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
          {/* Col 1: Brand & Identity */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="font-heading italic text-3xl text-white">Rama</span>
            </div>
            <p className="font-sans text-white/50 text-xs leading-relaxed max-w-sm">
              Voice-led Dubai property discovery and institutional-grade decision intelligence. Curating living architecture with timeless restraint.
            </p>
            <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-[var(--rama-ivory)]/70 pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--rama-ivory)] animate-pulse motion-reduce:animate-none" />
              <span>Gemini Live Voice Engine Active • Dubai Standard Time</span>
            </div>
          </div>

          {/* Col 2: Prime Enclaves */}
          <div className="flex flex-col gap-4">
            <h4 className="font-sans font-bold text-white text-[10px] uppercase tracking-[0.2em]">Enclaves</h4>
            <ul className="space-y-3 font-sans text-xs text-white/50">
              <li><a href="#communities" className="hover:text-white transition-colors">Palm Jumeirah</a></li>
              <li><a href="#communities" className="hover:text-white transition-colors">Downtown Dubai</a></li>
              <li><a href="#communities" className="hover:text-white transition-colors">Dubai Marina & JBR</a></li>
              <li><a href="#communities" className="hover:text-white transition-colors">Dubai Hills Estate</a></li>
              <li><a href="#communities" className="hover:text-white transition-colors">Dubai Creek Harbour</a></li>
            </ul>
          </div>

          {/* Col 3: Discovery & Advisory */}
          <div className="flex flex-col gap-4">
            <h4 className="font-sans font-bold text-white text-[10px] uppercase tracking-[0.2em]">Platform</h4>
            <ul className="space-y-3 font-sans text-xs text-white/50">
              <li><a href="#top" className="hover:text-white transition-colors">AI Voice Agent</a></li>
              <li><a href="#why-dubai" className="hover:text-white transition-colors">The Dubai Advantage</a></li>
              <li><a href="#projects" className="hover:text-white transition-colors">Curated Estates</a></li>
              <li><a href="#process" className="hover:text-white transition-colors">How We Work</a></li>
              <li><a href="#insights" className="hover:text-white transition-colors">Market Journal</a></li>
            </ul>
          </div>

          {/* Col 4: Legal & Auth */}
          <div className="flex flex-col gap-4">
            <h4 className="font-sans font-bold text-white text-[10px] uppercase tracking-[0.2em]">Governance</h4>
            <ul className="space-y-3 font-sans text-xs text-white/50">
              <li><Link href="/auth/sign-in" className="hover:text-white transition-colors">Staff Login</Link></li>
              <li><a href="#trust" className="hover:text-white transition-colors">DLD Escrow Policy</a></li>
              <li><a href="#trust" className="hover:text-white transition-colors">Data Privacy</a></li>
              <li><a href="#trust" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Regulatory Disclosure Banner */}
        <div className="p-5 border border-white/10 mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans text-xs text-white/50 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-[var(--rama-ivory)] shrink-0" />
            <span>
              <strong className="text-white">Regulatory Notice:</strong> Rama displays representative curated residences. Live licensed MLS/brokerage inventory connects after client authorization.
            </span>
          </div>
          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors shrink-0"
          >
            <span>Back to top</span>
            <div className="w-7 h-7 border border-white/20 flex items-center justify-center bg-white/5 hover:bg-white/20 transition-all">
              <ArrowUp className="w-3 h-3" />
            </div>
          </button>
        </div>

        {/* Copyright & Watermark */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-[10px] uppercase tracking-widest text-white/40">
          <p>© {new Date().getFullYear()} Rama FZ-LLC. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <LockKeyhole className="w-3 h-3" />
            <span>Encrypted Gemini Live Session • DLD RERA Compliant</span>
          </p>
        </div>
      </div>

      <GridPattern
        width={48}
        height={48}
        x={-1}
        y={-1}
        className={cn(
          "[mask-image:linear-gradient(to_bottom,white,transparent,transparent)]",
          "absolute inset-0 h-full w-full opacity-5 pointer-events-none"
        )}
      />
    </footer>
  );
}
