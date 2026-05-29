"use client";

import { useRef, useEffect, useCallback } from "react";

interface CircuitPulseProps {
  triggerAt: number; // ms — when to fire the pulse
  className?: string;
}

// A subtle circuit-like network that pulses outward from center
export function CircuitPulse({ triggerAt, className = "" }: CircuitPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const triggered = useRef(false);

  // Generate deterministic circuit paths from center
  const generatePaths = useCallback((w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const paths: { points: { x: number; y: number }[]; delay: number }[] = [];

    const rng = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 49297;
      return x - Math.floor(x);
    };

    // Create branching paths from center — evenly distributed in all directions
    const numPaths = 16;
    for (let i = 0; i < numPaths; i++) {
      // Fixed even spacing with tiny jitter to avoid perfect symmetry
      const angle = (i / numPaths) * Math.PI * 2 + (rng(i * 7) - 0.5) * 0.15;
      const segments: { x: number; y: number }[] = [{ x: cx, y: cy }];
      let x = cx;
      let y = cy;
      const segCount = 3 + Math.floor(rng(i * 13) * 4);

      for (let s = 0; s < segCount; s++) {
        // Longer segments for top/bottom (vertical) to fill the screen height
        const isVertical = Math.abs(Math.sin(angle)) > 0.5;
        const baseLen = isVertical ? 60 : 40;
        const len = baseLen + rng(i * 100 + s * 17) * 80;
        // Circuit paths: prefer horizontal/vertical with occasional diagonal
        const snapAngle = rng(i * 50 + s * 31) < 0.3
          ? angle + (rng(i * 70 + s) - 0.5) * 0.6
          : Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

        x += Math.cos(snapAngle) * len;
        y += Math.sin(snapAngle) * len;
        segments.push({ x, y });

        // Branch
        if (rng(i * 200 + s * 41) < 0.35 && s < segCount - 1) {
          const branchAngle = snapAngle + (rng(i * 300 + s) > 0.5 ? Math.PI / 2 : -Math.PI / 2);
          const bLen = 20 + rng(i * 400 + s) * 50;
          paths.push({
            points: [
              { x, y },
              { x: x + Math.cos(branchAngle) * bLen, y: y + Math.sin(branchAngle) * bLen },
            ],
            delay: (s + 1) * 0.15 + 0.1,
          });
        }
      }

      paths.push({ points: segments, delay: i * 0.06 });
    }

    return paths;
  }, []);

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

    let startTime: number | null = null;
    let raf: number;

    const timeout = setTimeout(() => {
      triggered.current = true;
      startTime = performance.now();

      const animate = () => {
        if (!startTime) return;
        const elapsed = (performance.now() - startTime) / 1000; // seconds

        ctx.clearRect(0, 0, w, h);

        // Get theme
        const isLight = document.documentElement.getAttribute("data-theme") === "light";
        const baseColor = isLight ? [0, 0, 0] : [0, 212, 255];

        for (const path of paths) {
          const t = elapsed - path.delay;
          if (t < 0) continue;

          const progress = Math.min(t / 1.2, 1); // 1.2s to draw each path
          const fadeOut = elapsed > 2.5 ? Math.max(0, 1 - (elapsed - 2.5) / 2) : 1;

          if (fadeOut <= 0) continue;

          const totalLen = pathLength(path.points);
          const drawLen = totalLen * easeOutCubic(progress);

          // Draw the path up to drawLen
          ctx.beginPath();
          let accLen = 0;
          ctx.moveTo(path.points[0].x, path.points[0].y);

          for (let i = 1; i < path.points.length; i++) {
            const dx = path.points[i].x - path.points[i - 1].x;
            const dy = path.points[i].y - path.points[i - 1].y;
            const segLen = Math.sqrt(dx * dx + dy * dy);

            if (accLen + segLen <= drawLen) {
              ctx.lineTo(path.points[i].x, path.points[i].y);
              accLen += segLen;
            } else {
              const remaining = drawLen - accLen;
              const ratio = remaining / segLen;
              ctx.lineTo(
                path.points[i - 1].x + dx * ratio,
                path.points[i - 1].y + dy * ratio
              );
              break;
            }
          }

          const alpha = 0.08 * fadeOut;
          ctx.strokeStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Glow at the tip
          if (progress < 1 && fadeOut > 0) {
            const tipPos = getPointAtLength(path.points, drawLen);
            const glowAlpha = 0.25 * fadeOut * (1 - progress);
            const gradient = ctx.createRadialGradient(tipPos.x, tipPos.y, 0, tipPos.x, tipPos.y, 15);
            gradient.addColorStop(0, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${glowAlpha})`);
            gradient.addColorStop(1, `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(tipPos.x, tipPos.y, 15, 0, Math.PI * 2);
            ctx.fill();
          }

          // Nodes at junctions
          if (progress > 0.3) {
            for (let i = 1; i < path.points.length - 1; i++) {
              const nodeLen = pathLengthTo(path.points, i);
              if (nodeLen <= drawLen) {
                const nodeAlpha = 0.12 * fadeOut;
                ctx.fillStyle = `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${nodeAlpha})`;
                ctx.beginPath();
                ctx.arc(path.points[i].x, path.points[i].y, 1.5, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        if (elapsed < 5) {
          raf = requestAnimationFrame(animate);
        }
      };

      raf = requestAnimationFrame(animate);
    }, triggerAt);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [triggerAt, generatePaths]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function pathLength(points: { x: number; y: number }[]) {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

function pathLengthTo(points: { x: number; y: number }[], idx: number) {
  let len = 0;
  for (let i = 1; i <= idx; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

function getPointAtLength(points: { x: number; y: number }[], targetLen: number) {
  let accLen = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (accLen + segLen >= targetLen) {
      const ratio = (targetLen - accLen) / segLen;
      return {
        x: points[i - 1].x + dx * ratio,
        y: points[i - 1].y + dy * ratio,
      };
    }
    accLen += segLen;
  }
  return points[points.length - 1];
}
