"use client";

import { useEffect } from "react";

export function LandingMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;
    const compactViewport = window.matchMedia("(max-width: 767px)").matches;
    const requestedAt = performance.now();

    let disposed = false;
    let cleanup: (() => void) | undefined;
    let compactMotionRequested = false;

    const registerMotion = () => void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([gsapModule, triggerModule]) => {
      if (disposed) return;
      const gsap = gsapModule.gsap;
      const ScrollTrigger = triggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const context = gsap.context(() => {
        if (!compactViewport && performance.now() - requestedAt < 400) {
          const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
          heroTimeline
            .fromTo(".cinematic-hero-media__image", { scale: 1.025 }, { scale: 1, duration: 1.2 })
            .fromTo(".public-site-header__inner", { y: -18, opacity: 0.82 }, { y: 0, opacity: 1, duration: 0.55 }, 0.08)
            .fromTo(".decision-hero__intro h1", { y: 16, opacity: 0.78 }, { y: 0, opacity: 1, duration: 0.62 }, 0.14)
            .fromTo(".decision-hero__intro > p:last-child", { y: 12, opacity: 0.82 }, { y: 0, opacity: 1, duration: 0.5 }, 0.2)
            .fromTo(".criterion-weave", { opacity: 0.78 }, { opacity: 1, duration: 0.45 }, 0.24)
            .fromTo(".quiet-voice-launcher__actions > *", { y: 10, opacity: 0.82 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.06 }, 0.28);
        }

        gsap.to(".cinematic-hero-media__image", {
          yPercent: 3,
          ease: "none",
          scrollTrigger: {
            trigger: "#top",
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        });

        gsap.utils.toArray<HTMLElement>(".decision-section").forEach((section) => {
          const targets = section.querySelectorAll<HTMLElement>(
            ".decision-section__heading > *, .architecture-media, .architecture-proof, .example-briefs > *, .capability-specimen > *, .boundary-ledger > *, .briefing-grid > *, .faq-list",
          );
          if (!targets.length) return;
          gsap.fromTo(targets, { y: 16, opacity: 0.88 }, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.06,
            ease: "power2.out",
            scrollTrigger: { trigger: section, start: "top 82%", once: true },
          });
        });
      }, document.documentElement);

      const animateHeroHandoff = (event: Event) => {
        const open = event instanceof CustomEvent && event.detail?.open === true;
        const signal = document.querySelector<HTMLElement>(".quiet-voice-launcher__signal .decision-aperture");
        if (!signal) return;

        if (open) {
          gsap.to(signal, { opacity: 0.7, scale: 0.96, duration: 0.22, ease: "power2.out" });
          return;
        }

        gsap.fromTo(signal, { opacity: 0.64, scale: 0.92 }, {
          opacity: 1,
          scale: 1,
          duration: 0.55,
          ease: "power3.out",
          clearProps: "opacity,scale",
        });
      };
      window.addEventListener("rama:discovery-dialog-state", animateHeroHandoff);

      cleanup = () => {
        window.removeEventListener("rama:discovery-dialog-state", animateHeroHandoff);
        context.revert();
      };
    });

    const registerCompactMotion = () => {
      if (compactMotionRequested) return;
      compactMotionRequested = true;
      registerMotion();
    };

    if (compactViewport) {
      // On small screens the static composition is the stable first paint.
      // Load scroll choreography only after the buyer expresses scroll intent.
      window.addEventListener("scroll", registerCompactMotion, { once: true, passive: true });
    } else {
      registerMotion();
    }

    return () => {
      disposed = true;
      window.removeEventListener("scroll", registerCompactMotion);
      cleanup?.();
    };
  }, []);

  return null;
}
