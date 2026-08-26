"use client";

import { Menu, X } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { localizedPath, type LandingCopy, type PublicLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const DECISION_SECTION_IDS = ["specimen", "method", "boundaries"] as const;

function decisionHrefFromHash(hash: string) {
  return DECISION_SECTION_IDS.some((id) => hash === `#${id}`) ? hash : null;
}

export function SiteHeader({
  locale,
  copy,
  variant = "overlay",
}: {
  locale: PublicLocale;
  copy: LandingCopy["header"];
  variant?: "overlay" | "solid" | "cinematic";
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement | null>(null);
  const pendingHref = useRef<string | null>(null);
  const usesDecisionNavigation = variant === "solid" || variant === "cinematic";
  const navigation = usesDecisionNavigation ? [
    { href: "#method", label: copy.method },
    { href: "#specimen", label: copy.specimen },
    { href: "#boundaries", label: copy.boundaries },
  ] : [
    { href: "#guided-search", label: copy.shape },
    { href: "#trust", label: copy.method },
  ];
  const alternativeLocale = locale === "en" ? "ar" : "en";

  function openDiscovery(event: MouseEvent<HTMLAnchorElement>) {
    if (!usesDecisionNavigation) return;
    event.preventDefault();
    window.dispatchEvent(new CustomEvent("rama:open-discovery", { detail: { mode: "voice" } }));
  }

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      requestAnimationFrame(() => menuButton.current?.focus());
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  useEffect(() => {
    if (variant !== "cinematic") return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 32));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
    };
  }, [variant]);

  useEffect(() => {
    if (!usesDecisionNavigation) return;

    const targets = DECISION_SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter((target): target is HTMLElement => target !== null);
    if (targets.length === 0) return;

    const visibleTargets = new Set<HTMLElement>();
    const firstTarget = targets[0];
    let pendingReleaseTimer = 0;
    const updateFromViewport = () => {
      if (pendingHref.current) {
        setActiveHref(pendingHref.current);
        return;
      }
      if (window.scrollY < firstTarget.offsetTop - window.innerHeight * 0.18) {
        setActiveHref(null);
        return;
      }
      if (visibleTargets.size === 0) return;

      const targetLine = window.innerHeight * 0.18;
      const orderedTargets = targets
        .filter((target) => visibleTargets.has(target))
        .sort((left, right) => {
          const distance = Math.abs(left.getBoundingClientRect().top - targetLine)
            - Math.abs(right.getBoundingClientRect().top - targetLine);
          return distance === 0 ? targets.indexOf(left) - targets.indexOf(right) : distance;
        });
      setActiveHref(`#${orderedTargets[0].id}`);
    };

    const initialHref = decisionHrefFromHash(window.location.hash);
    pendingHref.current = initialHref;
    const initialFrame = requestAnimationFrame(() => setActiveHref(initialHref));
    const releasePendingHref = () => {
      window.clearTimeout(pendingReleaseTimer);
      pendingReleaseTimer = window.setTimeout(() => {
        pendingHref.current = null;
        updateFromViewport();
      }, 1_600);
    };
    if (initialHref) releasePendingHref();

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          visibleTargets.add(target);
        }
        else visibleTargets.delete(target);
      }
      updateFromViewport();
    }, {
      rootMargin: "-18% 0px -70% 0px",
      threshold: 0,
    });

    for (const target of targets) observer.observe(target);
    const syncHash = () => {
      const href = decisionHrefFromHash(window.location.hash);
      pendingHref.current = href;
      setActiveHref(href);
      if (href) releasePendingHref();
    };
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("scroll", updateFromViewport, { passive: true });

    return () => {
      cancelAnimationFrame(initialFrame);
      window.clearTimeout(pendingReleaseTimer);
      observer.disconnect();
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("scroll", updateFromViewport);
    };
  }, [usesDecisionNavigation]);

  return (
    <header
      className={cn(
        "public-site-header top-0 left-0 w-full z-50 px-4 md:px-8 xl:px-10",
        variant === "solid" ? "sticky" : variant === "cinematic" ? "fixed py-5" : "absolute py-6",
      )}
      data-variant={variant}
      data-scrolled={scrolled ? "true" : "false"}
    >
      <div className="public-site-header__inner max-w-[var(--content-max)] mx-auto flex items-center justify-between">
        <a className="public-site-header__brand font-heading italic text-3xl md:text-4xl tracking-wide" href="#top" aria-label={copy.homeLabel} onClick={() => {
          pendingHref.current = null;
          setActiveHref(null);
        }}>
          Rama
        </a>

        <nav className="public-site-header__nav hidden lg:flex items-center gap-8 text-xs tracking-[0.12em] font-medium uppercase" aria-label={copy.primaryNavigationLabel}>
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="hover:text-white transition-colors"
              aria-current={activeHref === item.href ? "location" : undefined}
              onClick={() => {
                if (usesDecisionNavigation) {
                  if (window.location.hash !== item.href) pendingHref.current = item.href;
                  setActiveHref(item.href);
                }
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
           <a href="#guided-search" onClick={openDiscovery} className="public-site-header__cta hidden md:inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 font-sans font-bold tracking-[0.15em] text-xs uppercase transition-colors rounded-[6px]">
            {copy.begin}
          </a>

          <a
            href={localizedPath(alternativeLocale)}
            hrefLang={alternativeLocale}
             className="public-site-header__language hidden sm:inline-flex min-h-[44px] items-center text-xs font-semibold tracking-[0.08em]"
            aria-label={copy.languageLabel}
          >
            {copy.language}
          </a>

          <Button
            ref={menuButton}
            className="public-site-header__menu lg:hidden min-h-[44px] min-w-[44px]"
            variant="ghost"
            size="icon"
            aria-label={menuOpen ? copy.close : copy.open}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onPress={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-navigation"
          className="public-site-header__mobile lg:hidden absolute top-full left-0 w-full px-6 py-8 flex flex-col gap-6"
          aria-label={copy.mobileNavigationLabel}
        >
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-white/80 hover:text-white uppercase tracking-widest text-sm font-medium"
              aria-current={activeHref === item.href ? "location" : undefined}
              onClick={() => {
                if (usesDecisionNavigation) {
                  if (window.location.hash !== item.href) pendingHref.current = item.href;
                  setActiveHref(item.href);
                }
                setMenuOpen(false);
              }}
            >
              {item.label}
            </a>
          ))}
          <a href={localizedPath(alternativeLocale)} hrefLang={alternativeLocale} className="text-white/80 hover:text-white uppercase tracking-widest text-sm font-medium" onClick={() => setMenuOpen(false)}>
            {copy.language}
          </a>
        </nav>
      ) : null}
    </header>
  );
}
