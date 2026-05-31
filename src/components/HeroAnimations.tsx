"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export function HeroAnimations() {
  const [Toggle, setToggle] = useState<React.ComponentType | null>(null);
  const [Content, setContent] = useState<React.ComponentType | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Load toggle immediately
    import("./ThemeToggle").then((m) => {
      setToggle(() => m.ThemeToggle);
    });

    // Find portal root
    setPortalRoot(document.getElementById("vault-content-root"));

    // Load Firebase content on scroll or after 2s
    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      // Dynamic string concatenation prevents Webpack/Turbopack from
      // statically analyzing and prefetching this chunk
      const mod = ["./Vault", "Content"].join("");
      (Function("p", "return import(p)")(mod) as Promise<any>).then((m: any) => {
        setContent(() => m.VaultContent);
      });
    };

    window.addEventListener("scroll", load, { passive: true, once: true });
    const t = setTimeout(load, 2000);
    return () => {
      window.removeEventListener("scroll", load);
      clearTimeout(t);
    };
  }, []);

  return (
    <>
      {Toggle && (
        <div className="fixed top-0 left-0 w-full z-10 pointer-events-none" style={{ height: "100dvh" }}>
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-auto">
            <Toggle />
          </div>
        </div>
      )}

      {Content && portalRoot && createPortal(<Content />, portalRoot)}
    </>
  );
}
