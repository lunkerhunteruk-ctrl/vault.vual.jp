"use client";

import { useEffect, useRef, useState } from "react";
import { VaultTheme, VaultMedia } from "@/data/types";
import { MondrianGrid } from "./MondrianGrid";

interface ThemeSectionProps {
  theme: VaultTheme;
  onImageClick: (media: VaultMedia & { locationId: string }) => void;
  onVideoClick: (src: string) => void;
}

export function ThemeSection({ theme, onImageClick, onVideoClick }: ThemeSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHasBeenVisible(true);
      },
      { threshold: 0.1, rootMargin: "400px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Flatten all media from all locations with locationId attached
  const allMedia = theme.locations.flatMap((loc) =>
    loc.media.map((m) => ({ ...m, locationId: loc.id }))
  );

  return (
    <section ref={ref} id={theme.id} style={{ minHeight: "100dvh" }}>
      {/* Theme title */}
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <div
          className="text-center transition-all duration-1000"
          style={{
            opacity: hasBeenVisible ? 1 : 0,
            transform: hasBeenVisible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <p className="text-[13px] tracking-[6px] font-light mb-4" style={{ color: "var(--vault-text-dim)" }}>
            {theme.date}
          </p>
          <h2 className="font-light px-4 text-center" style={{ color: "var(--vault-text)", fontSize: "clamp(20px, 6vw, 42px)", letterSpacing: "clamp(6px, 2vw, 16px)" }}>
            {theme.city}
          </h2>
          <div
            className="mx-auto mt-6 h-[1px] transition-all duration-1000 delay-300"
            style={{ background: "var(--vault-border)", width: hasBeenVisible ? 120 : 0 }}
          />
        </div>
      </div>

      {/* Mondrian grid — only render when near viewport */}
      {hasBeenVisible && allMedia.length > 0 && (
        <div className="px-1">
          <MondrianGrid media={allMedia} collectionId={theme.id} onImageClick={onImageClick} onVideoClick={onVideoClick} />
        </div>
      )}
    </section>
  );
}
