"use client";

import { useState, useEffect } from "react";
import { HeroSection } from "@/components/HeroSection";

export default function VaultHome() {
  const [Content, setContent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Lazy load Firebase-dependent content AFTER first paint
    import("@/components/VaultContent").then((m) => {
      setContent(() => m.VaultContent);
    });
  }, []);

  return (
    <main className="relative">
      <HeroSection />
      {Content && <Content />}
    </main>
  );
}
