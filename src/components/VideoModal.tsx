"use client";

import { useRef, useEffect } from "react";

interface VideoModalProps {
  src: string | null;
  onClose: () => void;
}

export function VideoModal({ src, onClose }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (src && videoRef.current) {
      videoRef.current.play();
    }
  }, [src]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 w-9 h-9 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <video
        ref={videoRef}
        src={src}
        controls
        playsInline
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
