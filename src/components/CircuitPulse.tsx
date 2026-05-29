"use client";

import { useRef, useEffect, useCallback } from "react";

interface CircuitPulseProps {
  triggerAt: number;
  className?: string;
}

// Subtle organic lines that draw outward from center — inspired by lufis brush strokes
// but minimal: thin, transparent, delicate
export function CircuitPulse({ triggerAt, className = "" }: CircuitPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rng = useCallback((seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 49297;
    return x - Math.floor(x);
  }, []);

  // Generate smooth wave paths from center outward
  const generatePaths = useCallback((w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const paths: { x: number; y: number }[][] = [];

    const numPaths = 5;
    for (let i = 0; i < numPaths; i++) {
      const angle = (i / numPaths) * Math.PI * 2 + (rng(i * 7) - 0.5) * 0.5;
      const points: { x: number; y: number }[] = [];

      // Path length — long enough to reach edges
      const maxDist = Math.max(w, h) * 0.55;
      const steps = 80;

      let heading = angle;

      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const dist = t * maxDist;

        // Gentle organic drift — sine waves layered at different frequencies
        const drift1 = Math.sin(t * Math.PI * 2.5 + rng(i * 100) * 6) * 30;
        const drift2 = Math.sin(t * Math.PI * 4.2 + rng(i * 200) * 6) * 12;
        const drift3 = Math.sin(t * Math.PI * 7.1 + rng(i * 300) * 6) * 5;
        const totalDrift = drift1 + drift2 + drift3;

        // Perpendicular to heading for drift
        const px = -Math.sin(heading);
        const py = Math.cos(heading);

        points.push({
          x: cx + Math.cos(heading) * dist + px * totalDrift,
          y: cy + Math.sin(heading) * dist + py * totalDrift,
        });
      }

      paths.push(points);
    }

    return paths;
  }, [rng]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const paths = generatePaths(w, h);

    // Each path has its own draw timing
    const pathTimings = paths.map((_, i) => ({
      delay: i * 0.3 + rng(i * 50) * 0.2, // staggered start
      drawDuration: 2.5 + rng(i * 60) * 1.5, // 2.5-4s to draw
      fadeStart: 4.0, // start fading at 4s
      fadeDuration: 2.0, // 2s to fully fade
    }));

    let startTime: number | null = null;
    let raf: number;

    const timeout = setTimeout(() => {
      startTime = performance.now();

      const animate = () => {
        if (!startTime) return;
        const elapsed = (performance.now() - startTime) / 1000;

        ctx.clearRect(0, 0, w, h);

        const isLight = document.documentElement.getAttribute("data-theme") === "light";
        const color = isLight ? "0, 0, 0" : "200, 200, 200";

        let anyActive = false;

        paths.forEach((points, i) => {
          const timing = pathTimings[i];
          const t = elapsed - timing.delay;
          if (t < 0) { anyActive = true; return; }

          const drawProgress = Math.min(t / timing.drawDuration, 1);
          const fadeOut = elapsed > timing.fadeStart
            ? Math.max(0, 1 - (elapsed - timing.fadeStart) / timing.fadeDuration)
            : 1;

          if (fadeOut <= 0) return;
          anyActive = true;

          const pointsToDraw = Math.floor(drawProgress * points.length);
          if (pointsToDraw < 2) return;

          // Draw the line
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let p = 1; p < pointsToDraw; p++) {
            ctx.lineTo(points[p].x, points[p].y);
          }

          const baseAlpha = 0.04 * fadeOut; // very subtle
          ctx.strokeStyle = `rgba(${color}, ${baseAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();

          // Soft glow at the drawing tip
          if (drawProgress < 1 && fadeOut > 0.5) {
            const tipIdx = Math.min(pointsToDraw - 1, points.length - 1);
            const tip = points[tipIdx];
            const glowAlpha = 0.08 * fadeOut * (1 - drawProgress * 0.5);
            const gradient = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 20);
            gradient.addColorStop(0, `rgba(${color}, ${glowAlpha})`);
            gradient.addColorStop(1, `rgba(${color}, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 20, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        if (anyActive) {
          raf = requestAnimationFrame(animate);
        }
      };

      raf = requestAnimationFrame(animate);
    }, triggerAt);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [triggerAt, generatePaths, rng]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}
