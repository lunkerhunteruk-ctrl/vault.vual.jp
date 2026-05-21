"use client";

import { useState, useEffect, useRef } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";

const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
};

interface ShuffleTextProps {
  lines: string[];
  startDelay?: number;      // ms before animation starts
  shuffleDuration?: number; // ms each char shuffles before resolving
  stagger?: number;         // ms between each char start
  glowColor?: string;
  fontSize?: string;
  letterSpacing?: string;
  className?: string;
}

export function ShuffleText({
  lines,
  startDelay = 0,
  shuffleDuration = 400,
  stagger = 40,
  glowColor = "#00d4ff",
  fontSize = "28px",
  letterSpacing = "10px",
  className = "",
}: ShuffleTextProps) {
  const [frame, setFrame] = useState(-1); // -1 = not started
  const startTime = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTime.current = performance.now();
      const tick = () => {
        const elapsed = performance.now() - startTime.current;
        setFrame(Math.floor(elapsed / 16.67)); // ~60fps frame count
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [startDelay]);

  // Calculate total chars to know when animation is done
  const totalChars = lines.join("").replace(/ /g, "").length;
  const totalDurationFrames = Math.ceil((totalChars * stagger + shuffleDuration) / 16.67);

  // Stop RAF when done
  useEffect(() => {
    if (frame > totalDurationFrames + 30) {
      cancelAnimationFrame(rafRef.current);
    }
  }, [frame, totalDurationFrames]);

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
            const charStartFrame = Math.floor((ci * stagger) / 16.67);
            const shuffleFrames = Math.floor(shuffleDuration / 16.67);
            const elapsed = frame - charStartFrame;

            if (frame < 0 || elapsed < 0) {
              return (
                <span key={charIdx} style={{ opacity: 0, display: "inline-block" }}>
                  {char}
                </span>
              );
            }

            const resolved = elapsed >= shuffleFrames;
            const displayChar = resolved
              ? char
              : CHARS[Math.floor(seededRandom(ci * 1000 + frame * 7) * CHARS.length)];

            const glowIntensity = resolved
              ? Math.max(0, 1 - (elapsed - shuffleFrames) / 8)
              : Math.min(1, elapsed / (shuffleFrames * 0.3));

            const opacity = Math.min(1, elapsed / 3);

            return (
              <span
                key={charIdx}
                style={{
                  display: "inline-block",
                  opacity,
                  color: resolved ? "#ffffff" : glowColor,
                  textShadow:
                    glowIntensity > 0.1
                      ? `0 0 ${glowIntensity * 12}px ${glowColor}, 0 0 ${glowIntensity * 25}px ${glowColor}40`
                      : "none",
                }}
              >
                {displayChar}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
