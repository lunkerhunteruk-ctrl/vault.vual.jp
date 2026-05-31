"use client";

import { useState, useEffect } from "react";

export function HeroAnimations() {
  const [mounted, setMounted] = useState(false);
  const [Toggle, setToggle] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    setMounted(true);
    // Lazy load ThemeToggle to avoid pulling in localStorage sync on initial render
    import("./ThemeToggle").then((m) => {
      setToggle(() => m.ThemeToggle);
    });
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Toggle */}
      {Toggle && (
        <div className="absolute z-10" style={{ top: "calc(50% + 100px)" }}>
          <Toggle />
        </div>
      )}
    </>
  );
}
