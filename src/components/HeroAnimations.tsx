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

    // Load Firebase content immediately (scroll blocking was due to missing spacer, not Firebase)
    import("./VaultContent").then((m) => {
      setContent(() => m.VaultContent);
    });
  }, []);

  return (
    <>
      {Toggle && (
        <div className="fixed top-[72px] right-[-6px] z-50 pointer-events-auto" style={{ transform: "rotate(90deg)" }}>
          <Toggle />
        </div>
      )}

      {Content && portalRoot && createPortal(<Content />, portalRoot)}
    </>
  );
}
