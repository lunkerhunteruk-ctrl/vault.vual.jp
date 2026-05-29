"use client";

import { useState, useEffect, useRef } from "react";

interface ShuffleTextProps {
  lines: string[];
  startDelay?: number;
  shuffleDuration?: number;  // kept for API compat — now controls strike timing
  stagger?: number;          // ms between each char
  glowColor?: string;
  fontSize?: string;
  letterSpacing?: string;
  className?: string;
  onComplete?: () => void;
}

export function ShuffleText({
  lines,
  startDelay = 0,
  stagger = 40,
  fontSize = "28px",
  letterSpacing = "10px",
  className = "",
  onComplete,
}: ShuffleTextProps) {
  const [frame, setFrame] = useState(-1);
  const startTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const completedRef = useRef(false);

  const totalChars = lines.join("").replace(/ /g, "").length;
  const totalDurationMs = totalChars * stagger + 600; // extra for ink settle
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Only run once — never restart
    if (completedRef.current) return;

    const timeout = setTimeout(() => {
      startTimeRef.current = performance.now();
      const tick = () => {
        const elapsed = performance.now() - startTimeRef.current;
        setFrame(Math.floor(elapsed));
        if (elapsed < totalDurationMs + 1000) {
          rafRef.current = requestAnimationFrame(tick);
        } else if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let globalCharIndex = 0;

  return (
    <div
      className={className}
      style={{
        fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
        fontSize,
        fontWeight: 300,
        letterSpacing,
        lineHeight: 1.8,
        textAlign: "center",
        whiteSpace: "pre",
      }}
    >
      {lines.map((line, lineIdx) => (
        <div key={lineIdx}>
          {line.split("").map((char, charIdx) => {
            if (char === " ") {
              globalCharIndex++;
              return <span key={charIdx}>&nbsp;</span>;
            }

            const ci = globalCharIndex++;
            const charTime = ci * stagger; // ms when this char strikes
            const elapsed = frame - charTime;

            // Not yet typed
            if (frame < 0 || elapsed < 0) {
              return (
                <span key={charIdx} style={{ opacity: 0, display: "inline-block" }}>
                  {char}
                </span>
              );
            }

            // Strike phase (0-80ms): char slams in with slight scale
            const strikeProgress = Math.min(elapsed / 80, 1);
            const strikeEase = 1 - Math.pow(1 - strikeProgress, 3);

            // Ink bleed phase (80-400ms): subtle spread
            const inkProgress = elapsed > 80 ? Math.min((elapsed - 80) / 320, 1) : 0;
            const inkEase = 1 - Math.pow(1 - inkProgress, 2);

            // Scale: starts at 1.15, settles to 1.0
            const scale = strikeProgress < 1
              ? 1 + 0.15 * (1 - strikeEase)
              : 1;

            // Opacity: quick fade in
            const opacity = Math.min(strikeEase * 1.2, 1);

            // Ink bleed — subtle text-shadow that spreads and fades
            const inkSpread = inkEase * 2;
            const inkAlpha = Math.max(0, 0.3 * (1 - inkEase));
            const inkShadow = inkAlpha > 0.01
              ? `0 0 ${inkSpread}px rgba(var(--vault-ink-rgb, 0,0,0), ${inkAlpha})`
              : "none";

            // Impact flash — brief bright moment on strike
            const flashAlpha = elapsed < 60 ? Math.max(0, 0.4 * (1 - elapsed / 60)) : 0;
            const flashShadow = flashAlpha > 0.01
              ? `0 0 8px rgba(var(--vault-ink-rgb, 0,0,0), ${flashAlpha})`
              : "";

            const textShadow = [inkShadow, flashShadow].filter(s => s && s !== "none").join(", ") || "none";

            return (
              <span
                key={charIdx}
                style={{
                  display: "inline-block",
                  opacity,
                  color: "var(--vault-text)",
                  transform: `scale(${scale})`,
                  textShadow,
                  transition: "none",
                }}
              >
                {char}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
