/**
 * Film effects ported from vual-dump-generator.
 * Applied client-side to INJECT results with randomized probability.
 *
 * Leak (Outdoor): 40% none, 20% low, 20% mid, 20% high
 * Flare:          40% none, 20% low, 20% mid, 20% high
 */

function pickIntensity(): number {
  const r = Math.random();
  if (r < 0.4) return 0;       // none
  if (r < 0.6) return 1;       // low
  if (r < 0.8) return 2;       // mid
  return 3;                     // high
}

function addLightLeak(ctx: CanvasRenderingContext2D, w: number, h: number, multiplier: number) {
  const side = Math.floor(Math.random() * 4);
  const leakWidth = w * (0.05 + Math.random() * 0.15) * multiplier;
  const leakHeight = h * (0.3 + Math.random() * 0.5) * multiplier;

  const hue = 20 + Math.random() * 30;
  const baseAlpha = Math.min((0.15 + Math.random() * 0.2) * multiplier, 0.8);
  const midAlpha = Math.min((0.05 + Math.random() * 0.1) * multiplier, 0.4);

  let gx0: number, gy0: number;
  if (side === 0) { gx0 = Math.random() * w * 0.6; gy0 = 0; }
  else if (side === 1) { gx0 = w; gy0 = Math.random() * h * 0.4; }
  else if (side === 2) { gx0 = Math.random() * w * 0.4; gy0 = h; }
  else { gx0 = 0; gy0 = Math.random() * h * 0.4; }

  const gradient = ctx.createRadialGradient(gx0, gy0, 0, gx0, gy0, Math.max(leakWidth, leakHeight));
  gradient.addColorStop(0, `hsla(${hue}, 80%, 50%, ${baseAlpha})`);
  gradient.addColorStop(0.5, `hsla(${hue}, 90%, 60%, ${midAlpha})`);
  gradient.addColorStop(1, `hsla(${hue}, 70%, 40%, 0)`);

  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  // Sometimes add a second smaller leak on opposite side
  if (Math.random() > 0.5) {
    const s2 = (side + 2) % 4;
    const lw2 = w * (0.03 + Math.random() * 0.08);
    const lh2 = h * (0.15 + Math.random() * 0.3);
    const hue2 = 10 + Math.random() * 20;

    let cx: number, cy: number;
    if (s2 === 0) { cx = Math.random() * w; cy = 0; }
    else if (s2 === 1) { cx = w; cy = Math.random() * h; }
    else if (s2 === 2) { cx = Math.random() * w; cy = h; }
    else { cx = 0; cy = Math.random() * h; }

    const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(lw2, lh2));
    g2.addColorStop(0, `hsla(${hue2}, 90%, 55%, ${0.1 + Math.random() * 0.15})`);
    g2.addColorStop(1, `hsla(${hue2}, 80%, 40%, 0)`);

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// leakMode: 0=Outdoor, 1=Indoor, 2=Neon
function addEdgeBurn(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number, leakMode: number = 0) {
  const isRight = Math.random() > 0.5;
  const leakWidth = Math.floor(w * (0.05 + Math.random() * 0.15) * intensity);

  const tilt = (Math.random() - 0.5) * 0.52;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const edgeX = isRight ? w : 0;
  const nx = isRight ? -cosT : cosT;
  const ny = -sinT;

  // Vertical noise
  const noisePoints = Math.max(4, Math.floor(h / 60));
  const rawNoise: number[] = [];
  for (let i = 0; i < noisePoints; i++) rawNoise.push(Math.random());

  const yNoiseRaw = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    const t = (y / h) * (noisePoints - 1);
    const i0 = Math.floor(t);
    const i1 = Math.min(i0 + 1, noisePoints - 1);
    const mu = (1 - Math.cos((t - i0) * Math.PI)) / 2;
    yNoiseRaw[y] = rawNoise[i0] * (1 - mu) + rawNoise[i1] * mu;
  }

  const yNoise = new Float32Array(h);
  const smoothRadius = Math.floor(h * 0.05);
  for (let y = 0; y < h; y++) {
    let sum = 0, count = 0;
    for (let k = -smoothRadius; k <= smoothRadius; k++) {
      const yy = Math.min(h - 1, Math.max(0, y + k));
      sum += yNoiseRaw[yy];
      count++;
    }
    yNoise[y] = Math.min(1, (sum / count) + 0.3);
  }

  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const oc = off.getContext('2d')!;
  const imageData = oc.createImageData(w, h);
  const data = imageData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - edgeX;
      const dy = y - h / 2;
      const dist = dx * nx + dy * ny;

      if (dist >= leakWidth) continue;

      const ratio = dist <= 0 ? 1.0 : 1.0 - (dist / leakWidth);
      const inten = Math.pow(ratio, 3.0);

      const t = inten * yNoise[y];
      let r: number, g: number, b: number;
      if (leakMode === 0) {
        // Outdoor: white → yellow → orange
        r = Math.min(255, Math.floor(Math.min(t * 2.0, 1) * 255));
        g = Math.min(255, Math.floor(Math.max(t * 1.5 - 0.2, 0) * 160));
        b = Math.min(255, Math.floor(Math.max(t * 2.0 - 1.0, 0) * 200));
      } else if (leakMode === 1) {
        // Indoor: film chemical stain
        r = Math.floor((1 - t) * 120 * t * 1.2);
        g = Math.floor(t * 90 * t * 0.9);
        b = Math.floor((t * 140 + (1 - t) * 110) * t * 1.0);
      } else {
        // Neon: vivid cyan → magenta
        r = Math.floor((1 - t) * 180 * t * 2);
        g = Math.floor(t * 180 * t * 1.5);
        b = Math.floor((t * 230 + (1 - t) * 180) * t * 1.5);
      }

      const idx = (y * w + x) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  oc.putImageData(imageData, 0, 0);

  const blurRadius = Math.max(30, Math.floor(w * 0.04));
  ctx.save();
  ctx.filter = `blur(${blurRadius}px)`;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(off, 0, 0);
  ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
}

function addGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const strength = intensity * 255;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * strength;
    data[i] += noise;
    data[i + 1] += noise;
    data[i + 2] += noise;
  }

  ctx.putImageData(imageData, 0, 0);
}

function addFilmEdgePrint(ctx: CanvasRenderingContext2D, w: number, h: number, title: string, lot: string) {
  const fontSize = Math.max(12, Math.floor(h * 0.02));
  const margin = Math.floor(w * 0.02);

  ctx.save();

  // Position: right edge, rotated 90° (reading bottom to top)
  ctx.translate(w - margin, h - margin);
  ctx.rotate(-Math.PI / 2);

  // Film edge print style: orange, slightly transparent, soft
  ctx.font = `${fontSize}px 'Courier New', 'SF Mono', monospace`;
  ctx.textBaseline = 'top';

  // Slight blur for film print look
  ctx.filter = 'blur(0.5px)';

  // Main text
  const text = `${title}   ${lot}   PORTRA 800`;
  ctx.fillStyle = 'rgba(215, 140, 50, 0.55)';
  ctx.fillText(text, 0, 0);

  // Second pass slightly offset for glow/bleed effect
  ctx.fillStyle = 'rgba(215, 140, 50, 0.2)';
  ctx.fillText(text, 0.5, 0.5);

  ctx.restore();
}

/**
 * Apply random film effects to a base64 image.
 * Returns a new base64 data URL with effects applied.
 */
export function applyFilmEffects(
  dataUrl: string,
  meta?: { title?: string; lot?: string }
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const w = canvas.width;
      const h = canvas.height;

      // Flare (40% none, 20% low, 20% mid, 20% high)
      const flareLevel = pickIntensity();
      if (flareLevel > 0) {
        const multiplier = [0, 0.5, 1.0, 1.4][flareLevel];
        addLightLeak(ctx, w, h, multiplier);
      }

      // Leak — always fires. Weighted probability:
      // Outdoor Low 45%, Outdoor Mid 25%, Outdoor High 15%,
      // Indoor High 5%, Indoor Mid 5%, Neon High 5%
      const leakRoll = Math.random() * 100;
      let leakIntensity: number;
      let leakMode: number;
      if (leakRoll < 45) {        // 0-45: Outdoor Low
        leakIntensity = 0.6; leakMode = 0;
      } else if (leakRoll < 70) {  // 45-70: Outdoor Mid
        leakIntensity = 1.0; leakMode = 0;
      } else if (leakRoll < 85) {  // 70-85: Outdoor High
        leakIntensity = 1.6; leakMode = 0;
      } else if (leakRoll < 90) {  // 85-90: Indoor High
        leakIntensity = 1.6; leakMode = 1;
      } else if (leakRoll < 95) {  // 90-95: Indoor Mid
        leakIntensity = 1.0; leakMode = 1;
      } else {                     // 95-100: Neon High
        leakIntensity = 1.6; leakMode = 2;
      }
      addEdgeBurn(ctx, w, h, leakIntensity, leakMode);

      // Desaturation — always 0.75
      ctx.filter = 'saturate(0.75)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';

      // Grain — OFF (Gemini handles grain via pushed Portra 800 prompt)

      // Film edge print (title + lot number)
      if (meta?.title || meta?.lot) {
        addFilmEdgePrint(ctx, w, h, meta.title || '', meta.lot || '');
      }

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = dataUrl;
  });
}
