import React from "react";
import { Search, ArrowRight } from "lucide-react";
import { LagomAccentButton } from "@/components/ui/lagom-accent-button";

export function ArchivantaHero() {
  return (
    <div className="min-h-screen bg-[#F1F1F2] flex flex-col font-body text-[#1E1E1E]">
      {/* Navbar: Flush, square-cornered, edge-to-edge */}
      <nav className="w-full h-20 bg-white flex items-center justify-between px-12 z-50 border-b border-gray-100">
        <div className="flex items-center gap-12">
          <a href="#" className="text-2xl font-display uppercase tracking-wider text-black">
            RAMA
          </a>
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#"
              className="text-[13px] font-medium uppercase tracking-widest text-[#535353] hover:text-[#0000EE] transition-colors"
            >
              Portfolios
            </a>
            <a
              href="#"
              className="text-[13px] font-medium uppercase tracking-widest text-[#535353] hover:text-[#0000EE] transition-colors"
            >
              Estates
            </a>
            <a
              href="#"
              className="text-[13px] font-medium uppercase tracking-widest text-[#535353] hover:text-[#0000EE] transition-colors"
            >
              Curation
            </a>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="#"
            className="text-[13px] font-medium uppercase tracking-widest text-[#535353] border-b border-transparent hover:border-[#0000EE] hover:text-[#0000EE] transition-all"
          >
            Inquire
          </a>
          <Search className="w-5 h-5 text-[#535353] cursor-pointer" />
        </div>
      </nav>

      {/* Hero Section: Full-bleed photography */}
      <main className="relative flex-1 flex flex-col overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/rama-hero-dubai-night.webp"
            alt="Luxury architectural interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Display Wordmark Overlay */}
        <div className="relative flex-1 flex flex-col justify-end p-12 lg:p-24">
          <div className="max-w-7xl w-full mx-auto">
            <h1
              className="font-display text-white uppercase pointer-events-none select-none drop-shadow-2xl"
              style={{
                fontSize: "clamp(6rem, 15vw, 18rem)",
                mixBlendMode: "screen",
                lineHeight: 0.85,
                letterSpacing: "-0.05em",
              }}
            >
              RAMA
            </h1>

            <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-12">
              <div className="max-w-xl space-y-4">
                <h2 className="font-heading text-3xl md:text-5xl text-white leading-tight italic">
                  Curating architecture as <br />
                  living art.
                </h2>
                <p className="text-white/90 text-lg max-w-sm">
                  An editorial approach to high-end real estate, blending Nordic
                  restraint with architectural significance.
                </p>
              </div>

              {/* Signature Accent Button */}
              <div className="flex justify-start md:justify-end">
                <LagomAccentButton>
                  Explore Estates
                  <ArrowRight className="w-5 h-5" />
                </LagomAccentButton>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Decorative Edge / Scroll Indicator */}
        <div className="absolute bottom-8 right-12 text-white/40 flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.4em] origin-right" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            Scroll
          </span>
          <div className="h-12 w-[1px] bg-white/40"></div>
        </div>
      </main>
    </div>
  );
}
