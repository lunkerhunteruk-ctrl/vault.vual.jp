"use client";

import { useEffect, useRef } from "react";
import { ShuffleText } from "./ShuffleText";
import { ThemeToggle } from "./ThemeToggle";

interface HeroSectionProps {
  firstThemeId?: string;
}

export function HeroSection({ firstThemeId }: HeroSectionProps) {
  const scrolledRef = useRef(false);

  useEffect(() => {
    const onScroll = () => { scrolledRef.current = true; };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Auto-scroll after animation completes (~3.5s)
    const t = setTimeout(() => {
      if (!scrolledRef.current && firstThemeId) {
        document.getElementById(firstThemeId)?.scrollIntoView({ behavior: "smooth" });
      }
    }, 4000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, [firstThemeId]);

  return (
    <section className="h-screen flex flex-col items-center justify-center relative">
      <div className="text-center w-full px-6">
        <p className="text-[11px] tracking-[8px] font-light mb-8" style={{ color: "var(--vault-text-dim)" }}>
          VAULT
        </p>

        <ShuffleText
          lines={["OWN NOTHING.", "INJECT YOUR DNA."]}
          startDelay={500}
          shuffleDuration={500}
          stagger={35}
          glowColor="var(--vault-cyan)"
          fontSize="clamp(16px, 4vw, 32px)"
          letterSpacing="clamp(5px, 1.5vw, 14px)"
        />

        <div className="mx-auto mt-8 w-[1px] h-8" style={{ background: "var(--vault-border)" }} />
        <p className="mt-4 text-[9px] tracking-[5px] font-light" style={{ color: "var(--vault-text-dim)" }}>
          by VUAL
        </p>
        <div className="mt-6">
          <ThemeToggle />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <div className="w-[1px] h-8 animate-pulse" style={{ background: "var(--vault-border)" }} />
      </div>
    </section>
  );
}
