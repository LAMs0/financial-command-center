"use client";

import { useEffect } from "react";

/**
 * Mounts the micro-interactions from the original Stitch HTML:
 * - Mouse-parallax on the hero radial gradient
 * - Scroll-reveal (fade + slide-up) on section children
 */
export function LandingEffects() {
  useEffect(() => {
    // Mouse parallax for the CTA radial glow
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      const glow = document.querySelector<HTMLElement>("[data-cta-glow]");
      if (glow) {
        glow.style.transform = `translate(${(x - 0.5) * 20}px, ${(y - 0.5) * 20}px)`;
      }
    };
    document.addEventListener("mousemove", handleMouseMove);

    // Scroll reveal
    const observerOptions: IntersectionObserverInit = { threshold: 0.1 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-10");
        }
      });
    }, observerOptions);

    document.querySelectorAll<HTMLElement>("section > div").forEach((el) => {
      el.classList.add("transition-all", "duration-1000", "opacity-0", "translate-y-10");
      observer.observe(el);
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      observer.disconnect();
    };
  }, []);

  return null;
}
