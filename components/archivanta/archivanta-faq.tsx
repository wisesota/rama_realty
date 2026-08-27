"use client";

import React, { useState } from "react";
import { ChevronDown, ShieldCheck, Sparkles } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

interface FaqItem {
  id: string;
  question: string;
  category: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    id: "golden-visa",
    category: "Residency & Law",
    question: "How does the UAE 10-Year Golden Visa property route work?",
    answer:
      "Under current UAE federal decrees, purchasing real estate with an aggregate value of AED 2,000,000 (approx. $545,000 USD) or more qualifies the investor and their immediate family (spouse and dependents of any age) for a 10-year renewable Golden Visa. This applies to both ready and approved off-plan properties through DLD-registered developers.",
  },
  {
    id: "escrow-protection",
    category: "Buyer Security",
    question: "How does the Dubai Land Department (DLD) escrow law protect buyers?",
    answer:
      "Law No. 8 of 2007 mandates that 100% of off-plan buyer funds must be deposited directly into a project-specific Escrow Account managed by an approved UAE bank. Developers cannot access these funds arbitrarily; capital is disbursed only upon verified on-site engineering milestones audited by RERA inspectors.",
  },
  {
    id: "freehold-ownership",
    category: "Foreign Ownership",
    question: "Can foreign nationals own 100% freehold property in Dubai?",
    answer:
      "Yes. In designated Freehold Zones (including Palm Jumeirah, Downtown Dubai, Dubai Marina, Dubai Hills Estate, Dubai Creek Harbour, and DIFC), foreign nationals of any nationality receive absolute, perpetual title deeds issued directly by the Dubai Land Department with zero local sponsorship required.",
  },
  {
    id: "rental-yields",
    category: "Yield & Taxation",
    question: "What are realistic net rental yields in Dubai compared to London or NYC?",
    answer:
      "Prime Dubai residential properties generate average net rental yields between 7.0% and 9.2% annually, significantly outpacing London (2.8%–4.1%) and New York (3.2%–4.5%). When paired with 0% personal income tax and 0% capital gains tax, net returns remain unparalleled on a global risk-adjusted basis.",
  },
  {
    id: "voice-agent-privacy",
    category: "Rama Platform",
    question: "How does Rama's Voice AI Agent protect my privacy?",
    answer:
      "Rama operates with strict cryptographic boundaries. Your spoken or typed lifestyle briefs are processed ephemerally using server-side Gemini tokens. We never share your data with aggressive cold-calling broker networks. An advisor introduction occurs solely when you explicitly request a Decision Room handoff.",
  },
  {
    id: "mortgage-financing",
    category: "Financing",
    question: "Can international non-residents obtain mortgage financing in Dubai?",
    answer:
      "Yes. Major UAE partner banks (Emirates NBD, FAB, ADCB) offer non-resident mortgages for ready properties, typically financing up to 50%–60% of property valuation with repayment terms up to 25 years. Off-plan properties frequently offer direct 0% interest developer payment plans spanning 3 to 7 years.",
  },
];

export function ArchivantaFaq() {
  const [openId, setOpenId] = useState<string | null>("golden-visa");

  const toggle = (id: string) => {
    setOpenId((curr) => (curr === id ? null : id));
  };

  return (
    <section id="faq" aria-labelledby="faq-title" className="w-full bg-[var(--rama-ivory)] py-24 md:py-32 border-t border-[var(--rama-ink-dark)]/10">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Heading & Trust summary */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28">
            <BlurFade delay={0.1} inView>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-px bg-[var(--rama-ink-dark)]/30" aria-hidden="true" />
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ink-dark)]/70 font-bold">Institutional Clarity</p>
                </div>
                <h2 id="faq-title" className="font-sans text-4xl md:text-6xl lg:text-7xl text-[var(--rama-ink-dark)] font-bold tracking-tighter leading-[0.9]">
                  FREQUENTLY<br />
                  <span className="font-heading italic text-4xl md:text-5xl lg:text-6xl text-[var(--rama-ink-dark)]/80 font-normal tracking-wide">asked questions</span>
                </h2>
              </div>
            </BlurFade>

            <BlurFade delay={0.2} inView>
              <p className="font-sans text-sm md:text-base text-[var(--rama-ink-dark)]/70 leading-relaxed">
                Everything you need to know about UAE property laws, DLD escrow safeguards, Golden Visa pathways, and Rama&apos;s AI-assisted discovery model.
              </p>
            </BlurFade>

            <BlurFade delay={0.3} inView>
              <div className="p-8 bg-transparent border border-[var(--rama-ink-dark)]/15 space-y-4">
                <div className="flex items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--rama-ink-dark)]">
                  <ShieldCheck className="w-4 h-4 text-[var(--rama-ink-dark)]/60" />
                  <span>Have a specific legal inquiry?</span>
                </div>
                <p className="font-sans text-xs text-[var(--rama-ink-dark)]/70 leading-relaxed">
                  Our private client curatorial desk provides verified regulatory dossiers for family offices and cross-border investors.
                </p>
                <a
                  href="#guided-search"
                  className="inline-flex items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--rama-ink-dark)] hover:opacity-70 transition-opacity pt-2 border-b border-[var(--rama-ink-dark)] pb-0.5 w-fit"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask Rama AI in your brief</span>
                </a>
              </div>
            </BlurFade>
          </div>

          {/* Right Column: Accordion List */}
          <div className="lg:col-span-7 space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openId === faq.id;
              return (
                <BlurFade key={faq.id} delay={0.07 * idx} inView>
                  <div className="border border-[var(--rama-ink-dark)]/15 bg-transparent overflow-hidden transition-all duration-300">
                    <button
                      onClick={() => toggle(faq.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${faq.id}`}
                      className="w-full p-6 md:p-8 text-left flex items-center justify-between gap-6 cursor-pointer focus:outline-none"
                    >
                      <div className="space-y-2">
                        <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--rama-ink-dark)]/50">
                          {faq.category}
                        </span>
                        <h3 className="font-heading italic text-xl md:text-2xl text-[var(--rama-ink-dark)]">
                          {faq.question}
                        </h3>
                      </div>
                      <div
                        className={`w-10 h-10 border border-[var(--rama-ink-dark)]/20 flex items-center justify-center text-[var(--rama-ink-dark)] shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180 bg-[var(--rama-ink-dark)] text-[var(--rama-ivory)]" : ""
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </button>

                    {isOpen && (
                      <div id={`faq-answer-${faq.id}`} className="px-6 md:px-8 pb-8 pt-2 font-sans text-xs md:text-sm text-[var(--rama-ink-dark)]/70 leading-relaxed border-t border-[var(--rama-ink-dark)]/10 animate-in fade-in duration-300">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
