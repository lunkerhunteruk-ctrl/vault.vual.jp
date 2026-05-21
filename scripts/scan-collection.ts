#!/usr/bin/env npx tsx
/**
 * Scan a collection folder and generate JSON data with auto-detected aspect ratios.
 *
 * Usage: npx tsx scripts/scan-collection.ts <folder> <themeId> <date> <city>
 * Example: npx tsx scripts/scan-collection.ts ~/Downloads/20-05-2026 2026-05-20-shibuya 5.20 SHIBUYA
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

type Aspect = "3:4" | "4:3" | "9:16" | "16:9" | "1:1";
type MediaType = "image" | "video";

interface MediaItem {
  file: string;
  type: MediaType;
  aspect: Aspect;
  width: number;
  height: number;
  isHero?: boolean;
}

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const VIDEO_EXTS = [".mp4", ".mov", ".webm"];

function getMediaDimensions(filePath: string): { width: number; height: number } {
  const out = execSync(
    `mdls -name kMDItemPixelWidth -name kMDItemPixelHeight "${filePath}"`
  ).toString();
  const w = parseInt(out.match(/kMDItemPixelWidth\s*=\s*(\d+)/)?.[1] || "0");
  const h = parseInt(out.match(/kMDItemPixelHeight\s*=\s*(\d+)/)?.[1] || "0");
  return { width: w, height: h };
}

function detectAspect(w: number, h: number): Aspect {
  const ratio = w / h;

  // Match to closest standard AR
  const aspects: { ar: Aspect; ratio: number }[] = [
    { ar: "9:16", ratio: 9 / 16 },     // 0.5625
    { ar: "3:4", ratio: 3 / 4 },       // 0.75
    { ar: "1:1", ratio: 1 },           // 1.0
    { ar: "4:3", ratio: 4 / 3 },       // 1.333
    { ar: "16:9", ratio: 16 / 9 },     // 1.778
  ];

  let closest = aspects[0];
  let minDiff = Infinity;
  for (const a of aspects) {
    const diff = Math.abs(ratio - a.ratio);
    if (diff < minDiff) {
      minDiff = diff;
      closest = a;
    }
  }
  return closest.ar;
}

function scanFolder(folderPath: string): MediaItem[] {
  const items: MediaItem[] = [];
  const files = fs.readdirSync(folderPath).sort();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const fullPath = path.join(folderPath, file);
    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) continue;

    let type: MediaType | null = null;
    if (IMAGE_EXTS.includes(ext)) type = "image";
    else if (VIDEO_EXTS.includes(ext)) type = "video";
    else continue;

    const { width, height } = getMediaDimensions(fullPath);
    if (width === 0 || height === 0) {
      console.warn(`  ⚠ Could not read dimensions: ${file}`);
      continue;
    }

    const aspect = detectAspect(width, height);
    console.log(`  ${file}: ${width}×${height} → ${aspect} (${type})`);

    items.push({ file, type, aspect, width, height });
  }

  // First image is hero
  const firstImage = items.find((i) => i.type === "image");
  if (firstImage) firstImage.isHero = true;

  return items;
}

// --- Main ---
const args = process.argv.slice(2);
if (args.length < 4) {
  console.log("Usage: npx tsx scripts/scan-collection.ts <folder> <themeId> <date> <city>");
  console.log("Example: npx tsx scripts/scan-collection.ts ~/Downloads/20-05-2026 2026-05-20-shibuya 5.20 SHIBUYA");
  process.exit(1);
}

const [folder, themeId, date, city] = args;
console.log(`\nScanning: ${folder}\n`);

const items = scanFolder(folder);

const videos = items.filter((i) => i.type === "video");
const images = items.filter((i) => i.type === "image");

console.log(`\n📊 Summary:`);
console.log(`  Videos: ${videos.length} (${videos.map((v) => v.aspect).join(", ")})`);
console.log(`  Images: ${images.length} (${images.map((i) => i.aspect).join(", ")})`);

// Determine layout preset
const hasVideo = videos.length > 0;
const imageCount = images.length;
const aspects = [...new Set(images.map((i) => i.aspect))];
console.log(`  Layout: ${hasVideo ? "video+" : ""}${imageCount}img, ARs: ${aspects.join(",")}`);

// Output theme JSON
const theme = {
  id: themeId,
  date,
  city,
  locations: [
    {
      id: "daily",
      name: "DAILY",
      implantPrompt: "",
      film: "leicaPortra800",
      media: items.map((item) => ({
        file: `${themeId.replace(/^(\d{4})-(\d{2})-(\d{2}).*/, "$3-$2-$1")}/${item.file}`,
        type: item.type,
        aspect: item.aspect,
        ...(item.isHero ? { isHero: true } : {}),
      })),
    },
  ],
};

console.log(`\n📄 Theme JSON:\n`);
console.log(JSON.stringify(theme, null, 2));
