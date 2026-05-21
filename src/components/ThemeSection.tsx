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
    <section ref={ref} id={theme.id} className="min-h-screen">
      {/* Theme title */}
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <div
          className="text-center transition-all duration-1000"
          style={{
            opacity: hasBeenVisible ? 1 : 0,
            transform: hasBeenVisible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <p className="text-[13px] tracking-[6px] text-white/30 font-light mb-4">
            {theme.date}
          </p>
          <h2 className="text-[42px] tracking-[16px] font-light text-white/80">
            {theme.city}
          </h2>
          <div
            className="mx-auto mt-6 h-[1px] bg-white/10 transition-all duration-1000 delay-300"
            style={{ width: hasBeenVisible ? 120 : 0 }}
          />
        </div>
      </div>

      {/* Mondrian grid — only render when near viewport */}
      {hasBeenVisible && allMedia.length > 0 && (
        <div className="px-1">
          <MondrianGrid media={allMedia} onImageClick={onImageClick} onVideoClick={onVideoClick} />
        </div>
      )}
    </section>
  );
}
