#!/usr/bin/env npx tsx
/**
 * Upload collection: apply film effects (grain, flare, desaturation) → upload to R2 → register in Firestore.
 *
 * Usage: npx tsx scripts/upload-collection.ts <folder> <collectionId> <city>
 * Example: npx tsx scripts/upload-collection.ts ~/Downloads/kichijoji 31-05-2026_kichijoji_daily "KICHIJOJI — DAILY"
 *
 * Film effects applied:
 * - Grain: M size, opacity 0.85
 * - Desaturation: 0.85
 * - Flare: random direction & intensity (30% none, 30% low, 20% mid, 20% high)
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createCanvas, loadImage } from "canvas";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";

// ── Config ──
const R2_ACCOUNT_ID = "943e82912c875415f721d0ddbbcdb06d";
const R2_ACCESS_KEY = "e44b3af8d0feff663aa7bacefcf8fc3c";
const R2_SECRET_KEY = "f903db3d5d730506d43fc3eaa37d8956d24e063f9808c6428322de3083d508d8";
const R2_BUCKET = "vual-media";
const R2_PUBLIC_URL = "https://pub-63bccf8e4ef949bb8384ab641631a180.r2.dev";

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const VIDEO_EXTS = [".mp4", ".mov"];

// ── S3 client for R2 ──
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
});

// ── Firebase Client SDK ──
const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

// ── Aspect ratio detection ──
type Aspect = "3:4" | "4:3" | "9:16" | "16:9" | "1:1";

function getImageDimensions(filePath: string): { width: number; height: number } {
  const out = execSync(`mdls -name kMDItemPixelWidth -name kMDItemPixelHeight "${filePath}"`).toString();
  const w = parseInt(out.match(/kMDItemPixelWidth\s*=\s*(\d+)/)?.[1] || "0");
  const h = parseInt(out.match(/kMDItemPixelHeight\s*=\s*(\d+)/)?.[1] || "0");
  return { width: w, height: h };
}

function detectAspect(w: number, h: number): Aspect {
  const ratio = w / h;
  const aspects: { ar: Aspect; ratio: number }[] = [
    { ar: "9:16", ratio: 9 / 16 },
    { ar: "3:4", ratio: 3 / 4 },
    { ar: "1:1", ratio: 1 },
    { ar: "4:3", ratio: 4 / 3 },
    { ar: "16:9", ratio: 16 / 9 },
  ];
  let closest = aspects[0];
  let minDiff = Infinity;
  for (const a of aspects) {
    const diff = Math.abs(ratio - a.ratio);
    if (diff < minDiff) { minDiff = diff; closest = a; }
  }
  return closest.ar;
}

// ── Film Effects (server-side with node-canvas) ──

function pickFlareIntensity(): number {
  const r = Math.random();
  if (r < 0.3) return 0;
  if (r < 0.6) return 1;
  if (r < 0.8) return 2;
  return 3;
}

function applyFilmEffects(ctx: any, w: number, h: number) {
  // 1. Flare / Light leak
  const flareLevel = pickFlareIntensity();
  if (flareLevel > 0) {
    const multiplier = [0, 0.5, 1.0, 1.4][flareLevel];
    const side = Math.floor(Math.random() * 4);
    const hue = 20 + Math.random() * 30;
    const baseAlpha = Math.min((0.15 + Math.random() * 0.2) * multiplier, 0.8);
    const midAlpha = Math.min((0.05 + Math.random() * 0.1) * multiplier, 0.4);
    const leakW = w * (0.05 + Math.random() * 0.15) * multiplier;
    const leakH = h * (0.3 + Math.random() * 0.5) * multiplier;

    let gx: number, gy: number;
    if (side === 0) { gx = Math.random() * w * 0.6; gy = 0; }
    else if (side === 1) { gx = w; gy = Math.random() * h * 0.4; }
    else if (side === 2) { gx = Math.random() * w * 0.4; gy = h; }
    else { gx = 0; gy = Math.random() * h * 0.4; }

    const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(leakW, leakH));
    gradient.addColorStop(0, `hsla(${hue}, 80%, 50%, ${baseAlpha})`);
    gradient.addColorStop(0.5, `hsla(${hue}, 90%, 60%, ${midAlpha})`);
    gradient.addColorStop(1, `hsla(${hue}, 70%, 40%, 0)`);

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "source-over";
  }

  // 2. Desaturation 0.85
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    const sat = 0.92;
    data[i] = Math.round(gray + (r - gray) * sat);
    data[i + 1] = Math.round(gray + (g - gray) * sat);
    data[i + 2] = Math.round(gray + (b - gray) * sat);
  }
  ctx.putImageData(imageData, 0, 0);

  // 3. Grain — M size, opacity 0.85
  const grainData = ctx.getImageData(0, 0, w, h);
  const gd = grainData.data;
  const grainStrength = 25; // moderate grain strength
  for (let i = 0; i < gd.length; i += 4) {
    const noise = (Math.random() - 0.5) * grainStrength * 0.7;
    gd[i] = Math.max(0, Math.min(255, gd[i] + noise));
    gd[i + 1] = Math.max(0, Math.min(255, gd[i + 1] + noise));
    gd[i + 2] = Math.max(0, Math.min(255, gd[i + 2] + noise));
  }
  ctx.putImageData(grainData, 0, 0);
}

async function processImage(filePath: string): Promise<Buffer> {
  const img = await loadImage(filePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  applyFilmEffects(ctx, img.width, img.height);

  return canvas.toBuffer("image/jpeg", { quality: 0.92 });
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2);

  // Parse --tier flag
  const tierIdx = args.indexOf("--tier");
  let tier: "high" | "daily" | undefined;
  if (tierIdx !== -1 && args[tierIdx + 1]) {
    const val = args[tierIdx + 1];
    if (val === "high" || val === "daily") tier = val;
    args.splice(tierIdx, 2);
  }

  if (args.length < 3) {
    console.log("Usage: npx tsx scripts/upload-collection.ts <folder> <collectionId> <city> [--tier high|daily]");
    console.log('Example: npx tsx scripts/upload-collection.ts ~/Downloads/cos_enoshima 02-06-2026_enoshima "ENOSHIMA" --tier daily');
    console.log("\nTip: If collectionId ends with _daily or _high, tier is auto-detected.");
    process.exit(1);
  }

  const [folder, collectionId, city] = args;

  // Auto-detect tier from collectionId suffix if not explicitly set
  if (!tier) {
    if (collectionId.endsWith("_daily")) tier = "daily";
    else if (collectionId.endsWith("_high")) tier = "high";
  }

  console.log(`\n📂 Scanning: ${folder}`);
  console.log(`📦 Collection: ${collectionId}`);
  console.log(`🏙  City: ${city}`);
  console.log(`🏷  Tier: ${tier || "(none — set later in admin)"}\n`);

  const files = fs.readdirSync(folder).sort();
  const media: { file: string; type: "image" | "video"; aspect: Aspect; isHero?: boolean }[] = [];
  let lookNum = 1;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const fullPath = path.join(folder, file);
    if (!fs.statSync(fullPath).isFile()) continue;

    const isImage = IMAGE_EXTS.includes(ext);
    const isVideo = VIDEO_EXTS.includes(ext);
    if (!isImage && !isVideo) continue;

    const { width, height } = getImageDimensions(fullPath);
    if (width === 0 || height === 0) { console.warn(`  ⚠ Skip: ${file}`); continue; }
    const aspect = detectAspect(width, height);

    const r2Key = isImage
      ? `vault/collections/${collectionId}/look${lookNum}.jpg`
      : `vault/collections/${collectionId}/catwalk.mp4`;
    const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;

    if (isImage) {
      console.log(`  🎞  Processing: ${file} (${width}×${height} → ${aspect})`);
      const processed = await processImage(fullPath);

      console.log(`  ☁️  Uploading: ${r2Key} (${(processed.length / 1024 / 1024).toFixed(1)}MB)`);
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: processed,
        ContentType: "image/jpeg",
      }));

      media.push({
        file: r2Url,
        type: "image",
        aspect,
        ...(lookNum === 1 ? { isHero: true } : {}),
      });
      lookNum++;
    } else {
      console.log(`  📹 Uploading video: ${file} (${aspect})`);
      const videoData = fs.readFileSync(fullPath);
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: videoData,
        ContentType: "video/mp4",
      }));

      media.push({ file: r2Url, type: "video", aspect });
    }
  }

  console.log(`\n📊 Summary: ${media.filter(m => m.type === "image").length} images, ${media.filter(m => m.type === "video").length} videos`);

  // Register in Firestore
  console.log(`\n🔥 Registering in Firestore: vault_collections/${collectionId}`);
  await setDoc(doc(db, "vault_collections", collectionId), {
    city,
    published: false,
    publishAt: null,
    createdAt: Timestamp.now(),
    media,
    ...(tier ? { tier } : {}),
  });

  console.log(`\n✅ Done! Collection "${collectionId}" uploaded and registered (DRAFT).`);
  console.log(`   → Publish via admin: /admin?key=vual-vault-2026`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
