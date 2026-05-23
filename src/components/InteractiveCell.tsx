"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { VaultMedia } from "@/data/types";
import { HlsVideo } from "./HlsVideo";

interface InteractiveCellProps {
  item: VaultMedia & { locationId: string };
  isVideo: boolean;
  style: React.CSSProperties;
  onImageClick: () => void;
  onVideoClick: () => void;
}

export function InteractiveCell({ item, isVideo, style, onImageClick, onVideoClick }: InteractiveCellProps) {
  const cellRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Scroll fade-in + parallax
  useEffect(() => {
    const el = cellRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "50px 0px" }
    );
    observer.observe(el);

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      // How far through the viewport: 0 = bottom edge, 1 = top edge
      const progress = (viewH - rect.top) / (viewH + rect.height);
      // Map to -8px to +8px parallax
      const offset = (progress - 0.5) * 16;
      setParallaxY(offset);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Mouse move (PC) — subtle image shift
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 6;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 6;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div ref={cellRef} style={style}>
      <div
        className="relative overflow-hidden cursor-pointer group h-full"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(30px)",
          transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
        }}
        onClick={() => isVideo ? onVideoClick() : onImageClick()}
        onMouseMove={!isVideo ? handleMouseMove : undefined}
        onMouseLeave={!isVideo ? handleMouseLeave : undefined}
      >
        {isVideo ? (
          <HlsVideo
            src={item.file}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-[-8px] transition-transform duration-200 ease-out"
            style={{
              transform: `translate(${tilt.x}px, ${tilt.y + parallaxY}px) scale(1.03)`,
            }}
          >
            <Image
              src={item.file}
              alt=""
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
          </div>
        )}
        {!isVideo && (
          <div className="absolute inset-0 transition-all duration-300 group-hover:[box-shadow:inset_0_0_0_1.5px_rgba(0,212,255,0.5)]" />
        )}
      </div>
    </div>
  );
}
