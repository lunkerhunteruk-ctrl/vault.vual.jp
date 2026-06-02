"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getBrandByDomain } from "@/lib/brand";

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

    // Load Firebase content immediately
    import("./VaultContent").then((m) => {
      setContent(() => m.VaultContent);
    });

    // Brand mode: override hero text
    getBrandByDomain(window.location.hostname).then((brand) => {
      if (!brand) return;

      // Override hero title
      const titleEl = document.getElementById("hero-title");
      if (titleEl) titleEl.textContent = brand.name;

      // Override hero lines
      const line1El = document.getElementById("hero-line1");
      const line2El = document.getElementById("hero-line2");
      if (line1El && brand.heroLine1) line1El.textContent = brand.heroLine1;
      if (line2El && brand.heroLine2) line2El.textContent = brand.heroLine2;

      // Override subtitle
      const subEl = document.getElementById("hero-subtitle");
      if (subEl) subEl.textContent = brand.heroSubtitle || `by ${brand.name}`;

      // Brand logo
      if (brand.logo) {
        const logoEl = document.getElementById("hero-logo");
        if (logoEl) {
          logoEl.innerHTML = `<img src="${brand.logo}" alt="${brand.name}" style="height: 24px; opacity: 0.6; object-fit: contain;" />`;
        }
      }
    });
  }, []);

  return (
    <>
      {Toggle && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <Toggle />
        </div>
      )}

      {Content && portalRoot && createPortal(<Content />, portalRoot)}
    </>
  );
}
