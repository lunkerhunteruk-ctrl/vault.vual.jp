"use client";

import { useState, useEffect } from "react";

interface HeroSectionProps {
  firstThemeId?: string;
}

export function HeroSection({ firstThemeId }: HeroSectionProps) {
  const [phase, setPhase] = useState<"tagline" | "shuffle" | "cta" | "done">("tagline");

  useEffect(() => {
    let userScrolled = false;
    const onScroll = () => { userScrolled = true; };
    window.addEventListener("scroll", onScroll, { passive: true });

    const t1 = setTimeout(() => setPhase("shuffle"), 2000);
    const t2 = setTimeout(() => setPhase("cta"), 2600);
    const t3 = setTimeout(() => {
      setPhase("done");
      // Only auto-scroll if user hasn't scrolled manually
      if (!userScrolled && firstThemeId) {
        document.getElementById(firstThemeId)?.scrollIntoView({ behavior: "smooth" });
      }
    }, 4100);

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [firstThemeId]);

  const isTagline = phase === "tagline" || phase === "shuffle";
  const isShuffle = phase === "shuffle";
  const isCta = phase === "cta";

  return (
    <section className="h-screen flex flex-col items-center justify-center relative">
      <div className="text-center w-full px-6">
        <p className="text-[11px] tracking-[8px] text-white/15 font-light mb-8">
          VAULT
        </p>

        <div className="relative h-[80px] md:h-[100px] w-full flex items-center justify-center overflow-hidden">
          {/* OWN NOTHING. WEAR EVERYTHING. */}
          <h1
            className="text-[16px] sm:text-[22px] md:text-[32px] tracking-[5px] sm:tracking-[8px] md:tracking-[14px] font-light leading-relaxed absolute inset-x-0 transition-all duration-500"
            style={{
              opacity: isTagline && !isShuffle ? 0.8 : 0,
              transform: isShuffle ? "translateY(-30px)" : "translateY(0)",
              filter: isShuffle ? "blur(8px)" : "none",
            }}
          >
            OWN NOTHING.
            <br />
            WEAR EVERYTHING.
          </h1>

          {/* STEP INTO THE FRAME */}
          <p
            className="text-[14px] sm:text-[20px] md:text-[28px] tracking-[5px] sm:tracking-[8px] md:tracking-[14px] font-light text-white/60 absolute inset-x-0 transition-all duration-500"
            style={{
              opacity: isCta ? 1 : 0,
              transform: isCta ? "translateY(0)" : "translateY(30px)",
              filter: isCta ? "none" : "blur(8px)",
            }}
          >
            STEP INTO THE FRAME
          </p>
        </div>

        <div className="mx-auto mt-8 w-[1px] h-8 bg-white/10" />
        <p className="mt-4 text-[9px] tracking-[5px] text-white/15 font-light">
          by VUAL
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <div className="w-[1px] h-8 bg-white/10 animate-pulse" />
      </div>
    </section>
  );
}
