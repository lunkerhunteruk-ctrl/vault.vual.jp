"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { VaultMedia } from "@/data/types";
import { t } from "@/lib/i18n";

interface LatestStripProps {
  media: (VaultMedia & { locationId: string })[];
  date: string;
  city: string;
  onImageClick: (media: VaultMedia & { locationId: string }) => void;
  onVideoClick: (src: string) => void;
}

const SPEED = 0.4; // px per frame
const IMAGE_HEIGHT_VW = 45; // vh for each image
const GAP = 2; // px, matching vault grid gap

export function LatestStrip({ media, date, city, onImageClick, onVideoClick }: LatestStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const [tappedIdx, setTappedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Only show images (filter out videos for the strip)
  const images = media.filter((m) => m.type === "image");
  // Duplicate for seamless loop
  const loopImages = [...images, ...images, ...images];

  // Fade in on scroll
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "100px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Animation loop
  const animate = useCallback(() => {
    if (!pausedRef.current && trackRef.current) {
      offsetRef.current -= SPEED;

      // Calculate single set width to know when to reset
      const track = trackRef.current;
      const singleSetWidth = track.scrollWidth / 3;
      if (Math.abs(offsetRef.current) >= singleSetWidth) {
        offsetRef.current += singleSetWidth;
      }

      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // Pause on hover (PC)
  const handleMouseEnter = (idx: number) => {
    pausedRef.current = true;
    setHoveredIdx(idx % images.length);
  };

  const handleMouseLeave = () => {
    pausedRef.current = false;
    setHoveredIdx(null);
  };

  // Mobile: tap to pause, second tap to open
  const handleTap = (idx: number, item: VaultMedia & { locationId: string }) => {
    const realIdx = idx % images.length;
    if (tappedIdx === realIdx) {
      // Second tap → open
      if (item.type === "video") {
        onVideoClick(item.file);
      } else {
        onImageClick(item);
      }
      setTappedIdx(null);
      pausedRef.current = false;
    } else {
      // First tap → pause
      setTappedIdx(realIdx);
      pausedRef.current = true;
    }
  };

  // PC click (not on mobile)
  const handleClick = (item: VaultMedia & { locationId: string }) => {
    if (item.type === "video") {
      onVideoClick(item.file);
    } else {
      onImageClick(item);
    }
  };

  // Clear tap state on outside tap
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setTappedIdx(null);
        pausedRef.current = false;
      }
    };
    window.addEventListener("touchstart", handler, { passive: true });
    return () => window.removeEventListener("touchstart", handler);
  }, []);

  if (images.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 1s ease-out, transform 1s ease-out",
      }}
    >
      {/* Title */}
      <div className="flex flex-col items-center justify-center mb-8 mt-4">
        <p className="text-[11px] tracking-[5px] font-light mb-3" style={{ color: "var(--vault-cyan)" }}>
          LATEST
        </p>
        <p className="text-[13px] tracking-[6px] font-light mb-4" style={{ color: "var(--vault-text-dim)" }}>
          {date}
        </p>
        <h2 className="text-[32px] tracking-[14px] font-light" style={{ color: "var(--vault-text)" }}>
          {city}
        </h2>
        <div
          className="mx-auto mt-6 h-[1px]"
          style={{ background: "var(--vault-border)", width: 120 }}
        />
      </div>

      {/* Tape */}
      <div className="relative" style={{ height: `${IMAGE_HEIGHT_VW}vh` }}>
        {/* Fade edges */}
        <div
          className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
          style={{
            width: "60px",
            background: `linear-gradient(to right, var(--vault-bg), transparent)`,
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
          style={{
            width: "60px",
            background: `linear-gradient(to left, var(--vault-bg), transparent)`,
          }}
        />

        {/* Track */}
        <div
          ref={trackRef}
          className="flex h-full will-change-transform"
          style={{ gap: `${GAP}px` }}
        >
          {loopImages.map((item, idx) => {
            const realIdx = idx % images.length;
            const isHovered = hoveredIdx === realIdx;
            const isTapped = tappedIdx === realIdx;
            const isActive = isHovered || isTapped;

            // Aspect ratio width calc
            const aspectW = item.aspect === "3:4" ? 3 / 4
              : item.aspect === "9:16" ? 9 / 16
              : item.aspect === "4:3" ? 4 / 3
              : item.aspect === "16:9" ? 16 / 9
              : 1;

            return (
              <div
                key={`${item.file}-${idx}`}
                className="relative flex-shrink-0 overflow-hidden cursor-pointer"
                style={{
                  height: "100%",
                  aspectRatio: `${aspectW}`,
                  transform: isActive ? "scale(1.04)" : "scale(1)",
                  zIndex: isActive ? 5 : 1,
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={() => handleMouseEnter(idx)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(item)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleTap(idx, item);
                }}
              >
                <Image
                  src={item.file}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 60vw, 30vw"
                  loading="eager"
                />
                {/* Hover/tap glow border + TRY ON label */}
                <div
                  className="absolute inset-0 transition-all duration-300 pointer-events-none flex items-end justify-center"
                  style={{
                    boxShadow: isActive ? `inset 0 0 0 1.5px var(--vault-cyan)` : "none",
                  }}
                >
                  <span
                    className="mb-3 text-[9px] tracking-[4px] font-light transition-all duration-300"
                    style={{
                      color: "var(--vault-cyan)",
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateY(0)" : "translateY(4px)",
                    }}
                  >
                    {t("grid.tryOn")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
