"use client";

import React, { useRef, useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

const reviews = [
  {
    id: 1,
    name: "Sir Alistair Vance [Illustrative Persona]",
    role: "Family Office Principal, London",
    location: "Acquired Palm Jumeirah Signature Villa",
    text: "The voice-led brief was refreshing. In two minutes, Rama synthesized our yield expectations and waterfront requirements without the aggressive broker calls typical of Dubai.",
    rating: 5,
  },
  {
    id: 2,
    name: "Dr. Marlene Schmidt [Illustrative Persona]",
    role: "Private Investor, Zurich",
    location: "Acquired Downtown Duplex & Hills Villa",
    text: "The Decision Room gave our family unprecedented transparency — payment milestones, net yield projections, and DLD escrow status in one place. An institutional benchmark.",
    rating: 5,
  },
  {
    id: 3,
    name: "Tariq Al-Mansoor [Illustrative Persona]",
    role: "Architectural Collector, Riyadh",
    location: "Acquired Orla Infinity Penthouse",
    text: "Rama understands architectural provenance. They don’t just sell square footage; they curate works of living art with timeless Nordic restraint.",
    rating: 5,
  },
  {
    id: 4,
    name: "Elena Rostova [Illustrative Persona]",
    role: "Technology Founder, Singapore",
    location: "Acquired Dubai Marina Sky Mansion",
    text: "Transitioning to Dubai was frictionless. From Golden Visa advisory to property handover, the Lagom philosophy made the entire journey tranquil and precise.",
    rating: 5,
  },
];

export function ArchivantaReviews() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (trackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    const track = trackRef.current;
    if (track) {
      track.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll, { passive: true });
    }
    return () => {
      if (track) track.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (trackRef.current) {
      const scrollAmount = direction === "left" ? -380 : 380;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  };

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="w-full bg-[var(--rama-ink-dark)] py-24 md:py-32 border-t border-white/10 overflow-hidden">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[var(--rama-ivory)]/50" aria-hidden="true" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ivory)]/70 font-bold">Client Provenance</p>
            </div>
            <h2 id="reviews-title" className="font-sans text-4xl md:text-6xl lg:text-7xl text-white font-bold tracking-tighter leading-[0.9]">
              VOICES OF<br />
              <span className="font-heading italic text-4xl md:text-5xl lg:text-6xl text-white/80 font-normal tracking-wide">discerning buyers</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous review"
              className="w-14 h-14 border border-white/20 bg-transparent hover:bg-white/5 hover:border-white/40 disabled:opacity-20 disabled:hover:bg-transparent text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Next review"
              className="w-14 h-14 border border-white/20 bg-transparent hover:bg-white/5 hover:border-white/40 disabled:opacity-20 disabled:hover:bg-transparent text-white flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Testimonial Track */}
        <BlurFade delay={0.15} inView>
          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          >
            {/* Stat Box */}
            <div className="flex-shrink-0 w-80 md:w-96 snap-start bg-transparent border border-white/10 p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--rama-ivory)]/70">Illustrative Prototype Metric</span>
                <div className="font-heading italic text-6xl text-white">98.4%</div>
                <p className="font-sans text-xs text-white/50 leading-relaxed">
                  [Illustrative] Of clients establish ongoing multi-property advisory relationships with Rama.
                </p>
              </div>
              <div className="pt-6 border-t border-white/10 mt-8">
                <span className="font-sans text-[10px] uppercase tracking-widest text-white/40">Prototype Demonstration • Not Real Data</span>
              </div>
            </div>

            {/* Testimonial Cards */}
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="flex-shrink-0 w-80 md:w-96 snap-start bg-transparent border border-white/10 p-8 flex flex-col justify-between hover:border-white/30 transition-all duration-300"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 text-[var(--rama-ivory)]">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <Quote className="w-5 h-5 text-white/20" />
                  </div>

                  <p className="font-heading italic text-lg text-white/90 leading-relaxed">
                    &ldquo;{rev.text}&rdquo;
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 mt-8">
                  <div className="font-sans font-bold text-white text-sm tracking-wide">{rev.name}</div>
                  <div className="font-sans text-xs text-white/50 mt-1">{rev.role}</div>
                  <div className="font-sans text-[10px] uppercase tracking-widest text-[var(--rama-ivory)]/70 mt-1">{rev.location}</div>
                </div>
              </div>
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
