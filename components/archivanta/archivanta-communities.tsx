"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

interface CommunityItem {
  id: string;
  name: string;
  category: string;
  residenceCount: string;
  avgYield: string;
  image: string;
}

const communities: CommunityItem[] = [
  {
    id: "palm-jumeirah",
    name: "Palm Jumeirah",
    category: "Beachfront & Private Fronds",
    residenceCount: "140+ Curated Units",
    avgYield: "7.2% Net Yield",
    image: "/images/palm-jumeirah-villa.jpg",
  },
  {
    id: "downtown-dubai",
    name: "Downtown Dubai",
    category: "Burj Khalifa & Opera District",
    residenceCount: "210+ Curated Units",
    avgYield: "8.1% Net Yield",
    image: "/images/downtown-dubai-burj.jpg",
  },
  {
    id: "dubai-marina",
    name: "Dubai Marina & JBR",
    category: "Yacht Harbour & Promenade",
    residenceCount: "185+ Curated Units",
    avgYield: "8.6% Net Yield",
    image: "/images/dubai-marina-skyline.jpg",
  },
  {
    id: "dubai-hills",
    name: "Dubai Hills Estate",
    category: "Championship Golf & Mansions",
    residenceCount: "120+ Curated Units",
    avgYield: "7.8% Net Yield",
    image: "/images/dubai-hills-estate.jpg",
  },
  {
    id: "creek-harbour",
    name: "Dubai Creek Harbour",
    category: "Waterfront Boulevard Living",
    residenceCount: "95+ Curated Units",
    avgYield: "8.4% Net Yield",
    image: "/images/dubai-creek-harbour.jpg",
  },
  {
    id: "the-oasis",
    name: "The Oasis by Emaar",
    category: "Lagoon Resorts & Sanctuaries",
    residenceCount: "60+ Curated Units",
    avgYield: "7.5% Net Yield",
    image: "/images/emaar-lavita.jpg",
  },
];

export function ArchivantaCommunities() {
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
      const scrollAmount = direction === "left" ? -340 : 340;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  };

  return (
    <section id="communities" aria-labelledby="communities-title" className="w-full bg-[var(--rama-ink-dark)] py-24 md:py-32 border-t border-white/10">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        {/* Header with Navigation Arrows */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[var(--rama-ivory)]/50" aria-hidden="true" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ivory)]/70 font-bold">Neighborhood Topography</p>
            </div>
            <h2 id="communities-title" className="font-sans text-4xl md:text-6xl lg:text-7xl text-white font-bold tracking-tighter leading-[0.9]">
              POPULAR DUBAI<br />
              <span className="font-heading italic text-4xl md:text-5xl lg:text-6xl text-white/80 font-normal tracking-wide">enclaves</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Previous community"
              className="w-14 h-14 border border-white/20 bg-transparent hover:bg-white/5 hover:border-white/40 disabled:opacity-20 disabled:hover:bg-transparent text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Next community"
              className="w-14 h-14 border border-white/20 bg-transparent hover:bg-white/5 hover:border-white/40 disabled:opacity-20 disabled:hover:bg-transparent text-white flex items-center justify-center transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Track */}
        <BlurFade delay={0.1} inView>
          <div ref={trackRef} className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {communities.map((comm) => (
              <a
                key={comm.id}
                href="#guided-search"
                className="group relative flex-shrink-0 w-[300px] md:w-[380px] snap-start bg-transparent border border-white/10 p-3 hover:border-white/30 transition-all duration-300 block"
              >
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-[var(--rama-ink-dark)]">
                  <Image
                    src={comm.image}
                    alt={comm.name}
                    fill
                    sizes="(max-width: 768px) 300px, 380px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
                  
                  {/* Top Label */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--rama-ivory)]" />
                    <span className="font-sans text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--rama-ivory)]">
                      {comm.avgYield}
                    </span>
                  </div>

                  {/* Content overlay */}
                  <div className="absolute bottom-5 left-5 right-5 z-10 flex flex-col gap-3">
                    <span className="font-sans text-[9px] uppercase tracking-widest text-[var(--rama-ivory)]/80 border border-white/20 w-fit px-2.5 py-1.5 backdrop-blur-md">
                      {comm.category}
                    </span>
                    <h3 className="font-heading italic text-3xl md:text-4xl text-white leading-none group-hover:text-[var(--rama-ivory)] transition-colors">
                      {comm.name}
                    </h3>
                    <p className="font-sans text-[10px] uppercase tracking-widest text-white/50">
                      {comm.residenceCount}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
