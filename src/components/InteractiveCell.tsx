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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Scroll fade-in
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
    return () => observer.disconnect();
  }, []);

  // Gyroscope (mobile) — subtle image shift
  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;

    const handler = (e: DeviceOrientationEvent) => {
      const x = Math.max(-1, Math.min(1, (e.gamma || 0) / 30));
      const y = Math.max(-1, Math.min(1, (e.beta || 0) / 30));
      setTilt({ x: x * 3, y: y * 3 });
    };

    window.addEventListener("deviceorientation", handler, { passive: true });
    return () => window.removeEventListener("deviceorientation", handler);
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
              transform: `translate(${tilt.x}px, ${tilt.y}px) scale(1.03)`,
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
