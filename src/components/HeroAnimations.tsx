"use client";

import { useState, useEffect } from "react";

export function HeroAnimations() {
  const [Toggle, setToggle] = useState<React.ComponentType | null>(null);
  const [Content, setContent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Load toggle immediately (lightweight)
    import("./ThemeToggle").then((m) => {
      setToggle(() => m.ThemeToggle);
    });

    // Load Firebase content only after user scrolls OR after 3 seconds (whichever first)
    let loaded = false;
    const loadContent = () => {
      if (loaded) return;
      loaded = true;
      import("./VaultContent").then((m) => {
        setContent(() => m.VaultContent);
      });
      window.removeEventListener("scroll", onScroll);
    };

    const onScroll = () => loadContent();
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    const timer = setTimeout(loadContent, 3000);

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, []);

  return (
    <>
      {/* Toggle positioned inside hero */}
      {Toggle && (
        <div className="fixed top-0 left-0 w-full z-10 pointer-events-none" style={{ height: "100dvh" }}>
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto">
            <Toggle />
          </div>
        </div>
      )}

      {/* Firebase content — loaded on scroll or after 3s */}
      {Content && <Content />}
    </>
  );
}
