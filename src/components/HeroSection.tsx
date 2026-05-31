"use client";

import { useState } from "react";
import { ShuffleText } from "./ShuffleText";
import { ThemeToggle } from "./ThemeToggle";
import { CircuitPulse } from "./CircuitPulse";

interface HeroSectionProps {
  firstThemeId?: string;
}

export function HeroSection({ firstThemeId }: HeroSectionProps) {
  const [textDone, setTextDone] = useState(false);

  // Particles start running at the same time as the typewriter
  const pulseDelay = 500;

  return (
    <section className="flex flex-col items-center justify-center relative" style={{ height: "90vh" }}>
      {/* Circuit pulse background — disabled for performance test */}
      {/* <CircuitPulse triggerAt={pulseDelay} /> */}

      <div className="text-center w-full px-6 relative z-10">
        <p>VAULT TEST - NO COMPONENTS</p>
      </div>
    </section>
  );
}
