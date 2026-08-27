"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

interface FeaturedListing {
  id: string;
  tag: string;
  name: string;
  tagline: string;
  description: string;
  priceAed: string;
  priceUsd: string;
  specs: { beds: string; baths: string; area: string };
  features: string[];
  image: string;
  isReversed?: boolean;
}

const featuredListings: FeaturedListing[] = [
  {
    id: "orla-infinity",
    tag: "Dorchester Collection",
    name: "Orla Infinity by Omniyat",
    tagline: "Palm Jumeirah's Ultimate Waterfront Sanctuary",
    description:
      "A masterpiece of fluid architecture designed by Foster + Partners. Each residence offers unobstructed 270° views across the Arabian Gulf, private infinity plunge pools, and bespoke 5-star service by the Dorchester Collection.",
    priceAed: "AED 38,000,000",
    priceUsd: "$10,340,000 USD",
    specs: { beds: "4 Bedrooms", baths: "5 Bathrooms", area: "6,900 Sq.Ft" },
    features: [
      "Private elevator lobby & dual-height ceilings",
      "Direct beach access with private yacht mooring",
      "Managed by Dorchester Collection hospitality",
    ],
    image: "/images/palm-jumeirah-villa.jpg",
    isReversed: false,
  },
  {
    id: "opera-grand-duplex",
    tag: "Downtown Landmark",
    name: "The Opera District Sky Villa",
    tagline: "Unrivaled Views of Burj Khalifa & Dubai Fountains",
    description:
      "Elevated 50 stories above Downtown Dubai, this bespoke duplex sky mansion bridges timeless Nordic restraint with dramatic skyline grandeur. Floor-to-ceiling acoustic glass walls reveal panoramic views of the Burj Khalifa.",
    priceAed: "AED 26,500,000",
    priceUsd: "$7,215,000 USD",
    specs: { beds: "4 Bedrooms", baths: "5 Bathrooms", area: "5,400 Sq.Ft" },
    features: [
      "Panoramic Burj Khalifa & Dubai Fountain views",
      "Travertine stone interiors & bespoke Italian joinery",
      "Dedicated concierge, valet & private wine cellar",
    ],
    image: "/images/downtown-dubai-burj.jpg",
    isReversed: true,
  },
];

export function ArchivantaFeaturedCollection() {
  return (
    <section id="featured" aria-labelledby="featured-title" className="w-full bg-[var(--rama-ivory)] py-24 md:py-32 border-t border-[var(--rama-ink-dark)]/10">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[var(--rama-ink-dark)]/30" aria-hidden="true" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ink-dark)]/70 font-bold">Exclusive Assignments</p>
            </div>
            <h2 id="featured-title" className="font-sans text-4xl md:text-6xl lg:text-7xl text-[var(--rama-ink-dark)] font-bold tracking-tighter leading-[0.9]">
              FEATURED<br />
              <span className="font-heading italic text-4xl md:text-5xl lg:text-6xl text-[var(--rama-ink-dark)]/80 font-normal tracking-wide">residences</span>
            </h2>
          </div>
          <p className="text-[var(--rama-ink-dark)]/60 text-sm md:text-base max-w-md font-sans leading-relaxed">
            Hand-picked architectural statements across Dubai&apos;s most coveted enclaves.
            <span className="block mt-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--rama-ink-dark)]/40">Illustrative Inventory Example</span>
          </p>
        </div>

        <div className="space-y-24">
          {featuredListings.map((item, idx) => (
            <BlurFade key={item.id} delay={0.15 * idx} inView>
              <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${item.isReversed ? "lg:[&>*:first-child]:order-2" : ""}`}>
                {/* Media Container */}
                <div className="lg:col-span-7 relative aspect-[16/10] overflow-hidden bg-[var(--rama-ink-dark)] group">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/20 text-white text-[9px] font-sans font-bold uppercase tracking-[0.2em]">
                    <Sparkles className="w-3 h-3 text-[var(--rama-ivory)]" />
                    <span>{item.tag}</span>
                  </div>
                </div>

                {/* Content Container */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div>
                    <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ink-dark)]/60 font-bold">
                      {item.tagline}
                    </span>
                    <h3 className="font-heading italic text-3xl md:text-4xl text-[var(--rama-ink-dark)] mt-2 leading-tight">
                      {item.name}
                    </h3>
                  </div>

                  <p className="font-sans text-sm text-[var(--rama-ink-dark)]/70 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Feature Bullets */}
                  <ul className="space-y-3 pt-2">
                    {item.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-3 font-sans text-xs uppercase tracking-wider text-[var(--rama-ink-dark)]/80">
                        <CheckCircle2 className="w-4 h-4 text-[var(--rama-ink-dark)]/40 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Price & Action */}
                  <div className="pt-6 border-t border-[var(--rama-ink-dark)]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                    <div>
                      <div className="font-sans font-bold text-2xl text-[var(--rama-ink-dark)] tracking-tight">
                        {item.priceAed}
                      </div>
                      <div className="font-sans text-[10px] uppercase tracking-widest text-[var(--rama-ink-dark)]/50 mt-0.5">{item.priceUsd} • Illustrative Data</div>
                    </div>
                    <a
                      href="#guided-search"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-[var(--rama-ink-dark)] text-[var(--rama-ivory)] text-[10px] uppercase tracking-[0.2em] font-sans font-bold hover:bg-black transition-colors"
                    >
                      <span>Explore in Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
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
