"use client";

import { useState, useEffect } from "react";

export function LazyLoader() {
  const [Content, setContent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      import("./VaultContent").then((m) => {
        setContent(() => m.VaultContent);
      });
    };

    // Load on scroll or after 2s
    window.addEventListener("scroll", load, { passive: true, once: true });
    const t = setTimeout(load, 2000);
    return () => {
      window.removeEventListener("scroll", load);
      clearTimeout(t);
    };
  }, []);

  if (!Content) return null;
  return <Content />;
}
