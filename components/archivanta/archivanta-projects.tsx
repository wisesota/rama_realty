"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, Bed, Maximize2, MapPin } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

interface CuratedProperty {
  id: string;
  title: string;
  location: string;
  priceAed: string;
  priceUsd: string;
  beds: string;
  sqft: string;
  status: string;
  image: string;
  href: string;
}

const properties: CuratedProperty[] = [
  {
    id: "lavita-oasis",
    title: "Lavita at The Oasis",
    location: "The Oasis by Emaar",
    priceAed: "AED 18,500,000",
    priceUsd: "$5,035,000 USD",
    beds: "5 Bedrooms",
    sqft: "7,850 Sq.Ft",
    status: "New Launch",
    image: "/images/emaar-lavita.jpg",
    href: "#guided-search",
  },
  {
    id: "palm-villa-residence",
    title: "The Palm Horizon Villa",
    location: "Palm Jumeirah, Frond N",
    priceAed: "AED 45,000,000",
    priceUsd: "$12,250,000 USD",
    beds: "6 Bedrooms",
    sqft: "11,200 Sq.Ft",
    status: "Private Collection",
    image: "/images/palm-jumeirah-villa.jpg",
    href: "#guided-search",
  },
  {
    id: "marina-sky-mansion",
    title: "Marina Waterfront Sky Suite",
    location: "Dubai Marina",
    priceAed: "AED 12,200,000",
    priceUsd: "$3,320,000 USD",
    beds: "3 Bedrooms",
    sqft: "3,450 Sq.Ft",
    status: "Ready Q1 2027",
    image: "/images/dubai-marina-skyline.jpg",
    href: "#guided-search",
  },
  {
    id: "downtown-opera-haven",
    title: "The Opera Grand Penthouse",
    location: "Downtown Dubai",
    priceAed: "AED 28,000,000",
    priceUsd: "$7,620,000 USD",
    beds: "4 Bedrooms",
    sqft: "5,800 Sq.Ft",
    status: "High Demand",
    image: "/images/downtown-dubai-burj.jpg",
    href: "#guided-search",
  },
  {
    id: "dubai-hills-fairway",
    title: "Fairway Estate Villa",
    location: "Dubai Hills Estate",
    priceAed: "AED 34,500,000",
    priceUsd: "$9,390,000 USD",
    beds: "6 Bedrooms",
    sqft: "9,600 Sq.Ft",
    status: "Golf Frontage",
    image: "/images/dubai-hills-estate.jpg",
    href: "#guided-search",
  },
  {
    id: "creek-harbour-panorama",
    title: "Creek Horizon Waterfront",
    location: "Dubai Creek Harbour",
    priceAed: "AED 8,900,000",
    priceUsd: "$2,420,000 USD",
    beds: "3 Bedrooms",
    sqft: "2,650 Sq.Ft",
    status: "Off-Plan",
    image: "/images/dubai-creek-harbour.jpg",
    href: "#guided-search",
  },
];

export function ArchivantaProjects() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="w-full bg-[var(--rama-ivory)] py-24 md:py-32">
      <div className="max-w-[var(--content-max)] mx-auto px-6 lg:px-12">
        {/* Header matching Vellaro structure */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-[var(--rama-ink-dark)]/30" aria-hidden="true" />
              <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ink-dark)]/70 font-bold">Curated Dubai Catalog</p>
            </div>
            <h2 id="projects-title" className="font-sans text-4xl md:text-6xl lg:text-7xl text-[var(--rama-ink-dark)] font-bold tracking-tighter leading-[0.9]">
              NEW CURATED<br />
              <span className="font-heading italic text-4xl md:text-5xl lg:text-6xl text-[var(--rama-ink-dark)]/80 font-normal tracking-wide">listings</span>
            </h2>
          </div>
          <a
            href="#guided-search"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--rama-ink-dark)] hover:opacity-70 transition-opacity border-b border-[var(--rama-ink-dark)] pb-1 w-fit"
          >
            <span>Explore All Properties</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 3-Column Property Grid matching Vellaro template */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16">
          {properties.map((prop, idx) => (
            <BlurFade key={prop.id} delay={0.08 * idx} inView>
              <a href={prop.href} className="group flex flex-col h-full">
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-[var(--rama-ink-dark)] mb-6">
                  <Image
                    src={prop.image}
                    alt={prop.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--rama-ivory)] shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
                    <span className="font-sans text-[10px] uppercase font-bold tracking-[0.2em] text-[var(--rama-ivory)] drop-shadow-md">
                      {prop.status}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="flex flex-col flex-grow">
                  <h3 className="font-heading italic text-2xl md:text-3xl text-[var(--rama-ink-dark)] leading-tight mb-2">
                    {prop.title}
                  </h3>
                  <p className="flex items-center gap-1.5 text-[var(--rama-ink-dark)]/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{prop.location}</span>
                  </p>

                  <div className="mt-auto border-t border-[var(--rama-ink-dark)]/10 pt-5">
                    <div className="flex items-baseline justify-between mb-4">
                      <span className="font-sans text-xl font-bold text-[var(--rama-ink-dark)] tracking-tight">{prop.priceAed}</span>
                      <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-[var(--rama-ink-dark)]/50 font-bold">{prop.priceUsd}</span>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--rama-ink-dark)]/70">
                        <Bed className="w-4 h-4 opacity-40" />
                        {prop.beds}
                      </span>
                      <span className="flex items-center gap-2 font-sans text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--rama-ink-dark)]/70">
                        <Maximize2 className="w-4 h-4 opacity-40" />
                        {prop.sqft}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
