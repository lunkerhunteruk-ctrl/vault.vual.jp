#!/usr/bin/env npx tsx
/**
 * VAULT Batch Generation Pipeline — Gemini Batch API (半額)
 *
 * Two modes:
 *   submit — Reads xlsx, generates prompts, submits to Gemini Batch API, registers job in Firestore
 *   poll   — Checks pending batch jobs, downloads completed images, applies film, uploads to R2 pool
 *
 * Usage:
 *   npx tsx scripts/batch-generate.ts submit <xlsx> <materials-dir>
 *   npx tsx scripts/batch-generate.ts poll
 *   npx tsx scripts/batch-generate.ts poll --watch   (auto-poll every 2 minutes until all done)
 *
 * xlsx columns:
 *   collectionId | city | location | film | provocative | daily | oversizeTop | oversizeBottom | outer | tights | height | shotCount
 *
 * Materials dir structure:
 *   <materials-dir>/<collectionId>/garment.jpeg, model.jpeg, face.jpeg, shoes.jpeg(opt), bag.jpeg(opt)
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import * as XLSX from "xlsx";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createCanvas, loadImage } from "canvas";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where, Timestamp } from "firebase/firestore";

// ── Config ──
const R2_ACCOUNT_ID = "943e82912c875415f721d0ddbbcdb06d";
const R2_ACCESS_KEY = "e44b3af8d0feff663aa7bacefcf8fc3c";
const R2_SECRET_KEY = "f903db3d5d730506d43fc3eaa37d8956d24e063f9808c6428322de3083d508d8";
const R2_BUCKET = "vual-media";
const R2_PUBLIC_URL = "https://pub-63bccf8e4ef949bb8384ab641631a180.r2.dev";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) { console.error("❌ GEMINI_API_KEY not set in .env.local"); process.exit(1); }

const GEMINI_MODEL = "gemini-2.0-flash-preview-image-generation";
const GEMINI_BATCH_MODEL = "gemini-3.1-flash-image-preview";
const BATCH_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_BATCH_MODEL}:batchGenerateContent`;
const POLL_INTERVAL_MS = 120_000; // 2 minutes

// ── S3 client for R2 ──
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
});

// ── Firebase ──
const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATES (abbreviated for Gemini selection)
// ══════════════════════════════════════════════════════════════════════════════

const TEMPLATES: Record<string, { cat: string; desc: string; template: string }> = {
  SA1: { cat: 'Scene A', desc: 'Hero catwalk — corridor/archway', template: `COMPOSITION OVERRIDE: CATWALK SHOT — The model walks DIRECTLY TOWARD the camera through a corridor, archway, colonnade, or pathway. Center-framed, full body, confident stride.` },
  SB1: { cat: 'Scene B', desc: 'Walking LEFT, wide establishing, BRIGHT outdoor', template: `COMPOSITION OVERRIDE: The model walks toward the LEFT side of the frame. Wide shot establishing the full environment. LIGHTING: BRIGHT, sunlit scene.` },
  SB2: { cat: 'Scene B', desc: 'Static pose, leaning/resting, window light', template: `COMPOSITION OVERRIDE: The model is NOT walking — standing still with weight shifted, or leaning against a wall/column. LIGHTING: NEXT TO a window or doorway where BRIGHT natural light floods in.` },
  SB3: { cat: 'Scene B', desc: 'Walking RIGHT, medium shot, bright courtyard', template: `COMPOSITION OVERRIDE: The model walks toward the RIGHT side of the frame. Medium shot knee-up. LIGHTING: OPEN COURTYARD with bright overhead natural light.` },
  SB4: { cat: 'Scene B', desc: 'Looking back over shoulder, backlit', template: `COMPOSITION OVERRIDE: The model has walked past camera and LOOKS BACK over shoulder. Strong BACKLIGHT from behind.` },
  SB5: { cat: 'Scene B', desc: 'Low angle, power shot, sky above', template: `COMPOSITION OVERRIDE: LOW ANGLE shot — camera below eye level, looking upward. Full body with dramatic perspective.` },
  AA1: { cat: 'Artistic A', desc: 'Noctilux — golden hour backlight', template: `ARTISTIC DIRECTION: Shot on Leica Noctilux-M 50mm f/0.95 wide open. Strong BACKLIGHT — golden hour sun behind, luminous rim light.` },
  AA3: { cat: 'Artistic A', desc: 'Contax Planar — bright wide walking', template: `ARTISTIC DIRECTION: Shot on Contax Planar 45mm f/2. FULL BODY wide shot. Model walks TOWARD camera. BRIGHT natural light.` },
  AA4: { cat: 'Artistic A', desc: 'Fujifilm GF — dappled light', template: `ARTISTIC DIRECTION: Shot on Fujifilm GF 110mm f/2 (medium format). DAPPLED or FILTERED LIGHT through architectural elements.` },
  AB1: { cat: 'Artistic B', desc: 'Hasselblad — wet ground reflections', template: `ARTISTIC DIRECTION: Shot on Hasselblad XCD 80mm f/1.9 (medium format). Post-rain, wet reflective ground.` },
  AB3: { cat: 'Artistic B', desc: 'Mamiya 7 — bright wide, wind', template: `ARTISTIC DIRECTION: Shot on Mamiya 7 II with 80mm f/4. FULL BODY wide. Mid-stride, wind catches hair and fabric.` },
  DA1: { cat: 'Detail A', desc: 'Face — contemplative, Otus 85mm', template: `DETAIL SHOT — FACE: Tight close-up chest/shoulders up. Expression: confident, contemplative, looking away.` },
  DA2: { cat: 'Detail A', desc: 'Face — direct gaze', template: `DETAIL SHOT — FACE (DIRECT GAZE): Tight close-up. MUST look directly into camera. Quietly powerful.` },
  DA3: { cat: 'Detail A', desc: 'Face — profile, rim light', template: `DETAIL SHOT — FACE (PROFILE): True profile or strong 3/4 view. Strong rim light outlining profile.` },
  DB1: { cat: 'Detail B', desc: 'Upper body — Fujifilm GF', template: `DETAIL SHOT — UPPER BODY: Medium close-up waist up, showing garment details — texture, drape, buttons.` },
  DB3: { cat: 'Detail B', desc: 'Upper body — fabric texture', template: `DETAIL SHOT — UPPER BODY (FABRIC): Waist up, 3/4 angle. Raking sidelight sculpting folds and texture.` },
  DC1: { cat: 'Detail C', desc: 'Catwalk side full body', template: `DETAIL SHOT — CATWALK SIDE VIEW: Full body from SIDE. Model walks across frame.` },
  PA1: { cat: 'Provocative A', desc: 'Claim — foot on object', template: `PROVOCATIVE — TERRITORIAL CLAIM: Full body, low angle. One FOOT on prominent object/surface. Defiant, chin up.` },
  PA2: { cat: 'Provocative A', desc: 'Throne — sitting on forbidden surface', template: `PROVOCATIVE — THRONE: Model SITS on something not meant for sitting. Legs crossed, regal.` },
  PA5: { cat: 'Provocative A', desc: 'Crouch — low squat, looking up', template: `PROVOCATIVE — PREDATOR CROUCH: Deep squat, body close to ground. Camera above. She looks UP — defiant.` },
  PB5: { cat: 'Provocative B', desc: 'Sprawl — lying/reclining on surface', template: `PROVOCATIVE — SPRAWL: Full body. LIES or RECLINES on surface. Shot from above or ground level.` },
  PC3: { cat: 'Provocative C', desc: 'Confrontation gaze — direct stare', template: `PROVOCATIVE — CONFRONTATION: Upper body, STRAIGHT ON. Direct unblinking eye contact. Jaw set.` },
  PD4: { cat: 'Provocative D', desc: 'Street catwalk — walking through crowd', template: `PROVOCATIVE — STREET CATWALK: Walking TOWARD camera through BUSY PUBLIC SPACE with runway stride.` },
  PE4: { cat: 'Provocative E', desc: 'Rush hour still — model motionless', template: `PROVOCATIVE — RUSH HOUR STILL: Busy transit space. Everyone in MOTION. Model COMPLETELY STILL.` },
  PG1: { cat: 'Provocative G', desc: 'Wall stare — facing blank wall', template: `PROVOCATIVE — WALL STARE: Faces BLANK WALL. Behind her is the actual spectacle. Expression flat.` },
  PG2: { cat: 'Provocative G', desc: 'Floor sit — when seats available', template: `PROVOCATIVE — FLOOR SIT: Sits on FLOOR when chairs are visibly EMPTY nearby. Defiant from below.` },
  PG4: { cat: 'Provocative G', desc: 'Object embrace — hugging absurd object', template: `PROVOCATIVE — OBJECT EMBRACE: WRAPS BOTH ARMS around absurd object. Full committed hug.` },
};

// ══════════════════════════════════════════════════════════════════════════════
// FILM EFFECTS
// ══════════════════════════════════════════════════════════════════════════════

function pickFlareIntensity(): number {
  const r = Math.random();
  if (r < 0.4) return 1;
  if (r < 0.7) return 2;
  return 3;
}

function applyFilmEffects(ctx: any, w: number, h: number) {
  const flareLevel = pickFlareIntensity();
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

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = Math.round(gray + (r - gray) * 0.92);
    data[i + 1] = Math.round(gray + (g - gray) * 0.92);
    data[i + 2] = Math.round(gray + (b - gray) * 0.92);
  }
  ctx.putImageData(imageData, 0, 0);

  const grainData = ctx.getImageData(0, 0, w, h);
  const gd = grainData.data;
  for (let i = 0; i < gd.length; i += 4) {
    const noise = (Math.random() - 0.5) * 25 * 0.7;
    gd[i] = Math.max(0, Math.min(255, gd[i] + noise));
    gd[i + 1] = Math.max(0, Math.min(255, gd[i + 1] + noise));
    gd[i + 2] = Math.max(0, Math.min(255, gd[i + 2] + noise));
  }
  ctx.putImageData(grainData, 0, 0);
}

async function applyFilmToBuffer(imageBuffer: Buffer): Promise<Buffer> {
  const img = await loadImage(imageBuffer);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  applyFilmEffects(ctx, img.width, img.height);
  return canvas.toBuffer("image/jpeg", { quality: 0.92 });
}

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

async function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function callGeminiFlash(prompt: string, systemPrompt: string): Promise<any> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
      }),
    }
  );
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini Flash returned no response: ' + JSON.stringify(data).substring(0, 300));
  return JSON.parse(text);
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDING (same logic as before)
// ══════════════════════════════════════════════════════════════════════════════

interface CollectionRow {
  collectionId: string;
  city: string;
  location: string;
  film: string;
  provocative: boolean;
  daily: boolean;
  oversizeTop: boolean;
  oversizeBottom: boolean;
  outer: string;
  tights: string;
  height: number;
  shotCount: number;
}

function buildTemplateList(row: CollectionRow): string {
  return Object.entries(TEMPLATES)
    .filter(([id]) => {
      if (row.provocative) return id.startsWith('P') && !id.startsWith('PF');
      return !id.startsWith('P') && !id.startsWith('SV') && !id.startsWith('CN');
    })
    .map(([id, t]) => `- ${id} [${t.cat}]: ${t.desc}`)
    .join('\n');
}

function buildSystemPrompt(row: CollectionRow): string {
  const templateList = buildTemplateList(row);
  const shotCount = row.shotCount || 12;
  return `You are a fashion editorial director planning a ${shotCount}-shot series.

RULES:
- Select exactly ${shotCount} templates from the available list. Mix categories.
- Each customNote: 2-3 sentences describing the specific scene, pose variation, and lighting.
- EVERY shot MUST be in a DIFFERENT specific spot/scene within the given location. If the location is "東京駅", one shot might be on the platform, another at a ticket gate, another at a shop, another at a café, another walking through the concourse, etc. NEVER repeat the same spot.
- Do NOT mention garment details in customNote.

AVAILABLE TEMPLATES:
${templateList}

Respond in JSON only. Format:
[{ "id": "XX1", "customNote": "..." }, ...]`;
}

function buildImagePrompt(row: CollectionRow, shot: { id: string; customNote: string }): string {
  const tmpl = TEMPLATES[shot.id];
  if (!tmpl) return '';

  const filmPresets: Record<string, string> = {
    leicaPortra400: 'FILM LOOK — Leica M6, Summicron 35mm f/2, Kodak Portra 400. Visible grain, warm.',
    leicaPortra800: 'FILM LOOK — Leica M6, Summicron 35mm f/2, Portra 800. Warm highlights, cool blue-grey shadows.',
    contax: 'FILM LOOK — Contax T3, Portra 400. Fine grain, creamy, airy.',
    nikon: 'FILM LOOK — Nikon FM2, Tri-X 400 pushed to 1600. MONOCHROME BLACK AND WHITE. Heavy grain.',
    nikon800: 'FILM LOOK — Nikon FM2, Cinestill 800T pushed to 1600. Cool blue cast, halation on lights.',
    pentax: 'FILM LOOK — Pentax 67, 105mm f/2.4, Portra 400. MEDIUM FORMAT. Extraordinary tonal depth.',
    superia: 'FILM LOOK — Nikon FM2, Fujifilm Superia 800. Neutral, punchy, consumer grain.',
  };
  const filmText = filmPresets[row.film] || filmPresets['leicaPortra800'];
  const tightsColors: Record<string, string> = { black: 'opaque BLACK tights', violet: 'opaque VIOLET tights', 'peacock-green': 'opaque PEACOCK GREEN tights', magenta: 'opaque MAGENTA tights' };
  const tightsNote = row.tights && row.tights !== 'none' && tightsColors[row.tights] ? ` Wearing ${tightsColors[row.tights]}.` : '';
  const outerNote = row.outer === 'open' ? ' Jacket/coat OPEN.' : row.outer === 'closed' ? ' Jacket/coat CLOSED.' : '';
  const oversizeTop = row.oversizeTop ? '\nOVERSIZE TOP: Scale top UP 2-3 sizes — dropped shoulders, boxy.' : '';
  const oversizeBottom = row.oversizeBottom ? '\nOVERSIZE BOTTOM: Scale bottoms UP 2-3 sizes — wide, pooling.' : '';
  const dailyNote = row.daily ? 'EXPRESSION: COLD, EMOTIONLESS, UNTOUCHABLE.' : 'EXPRESSION: Emotionless, eternal beauty.';

  return `CRITICAL: Reproduce EXACT garments from reference images. Exact color, pattern, silhouette.
Generate image using the EXACT face/appearance from the provided face reference image.
CRITICAL SKIN TONE RULE: The model's skin color for the ENTIRE BODY (face, neck, arms, hands, legs, feet) MUST match the skin tone shown in the provided face reference image. Do NOT use the skin color of any model in the garment reference images. The garment reference images are ONLY for clothing — ignore the skin color of the model wearing them. This applies to ALL visible skin.
The model is ${row.height || 175}cm tall with a slim, high-fashion build. Generate the full body proportionally from this height — the face reference is the only model reference needed.
Wearing EXACTLY the garments from reference.${outerNote}${tightsNote}${oversizeTop}${oversizeBottom}

SCENE: ${row.location} — ${row.city}
${filmText}
${dailyNote}
Show full body including feet. NO text/watermarks on image.
SHOES: Wear EXACTLY shoes from reference. Never replace sneakers with heels.
GARMENT SHAPE: Do NOT modify silhouette.
OUTPUT: Generate a PORTRAIT image in 3:4 aspect ratio. The image MUST be taller than it is wide.

${tmpl.template}

SCENE NOTE: ${shot.customNote}`;
}

// Global face reference (Rin)
const FACE_IMAGE_PATH = "/Users/mari/Downloads/rin/jp-f-18-stand-031.png";

function loadFaceImage(): { data: string; mimeType: string } {
  if (!fs.existsSync(FACE_IMAGE_PATH)) throw new Error(`Face image not found: ${FACE_IMAGE_PATH}`);
  const data = fs.readFileSync(FACE_IMAGE_PATH).toString('base64');
  return { data, mimeType: 'image/png' };
}

/**
 * Load reference images for a specific look within a collection.
 * Structure: <materialsDir>/<collectionId>/look<N>/garment.jpeg, shoes.jpeg, etc.
 */
function loadLookImages(materialsDir: string, collectionId: string, lookNum: number): { data: string; mimeType: string }[] {
  const lookDir = path.join(materialsDir, collectionId, `look${lookNum}`);
  if (!fs.existsSync(lookDir)) return [];
  const images: { data: string; mimeType: string }[] = [];
  // Load all image files in look folder (any name — garment, ref, or BRAND_category_slug)
  const files = fs.readdirSync(lookDir)
    .filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f))
    .sort();
  for (const filename of files) {
    const filePath = path.join(lookDir, filename);
    const data = fs.readFileSync(filePath).toString('base64');
    const ext = path.extname(filename).toLowerCase();
    images.push({ data, mimeType: ext === '.png' ? 'image/png' : 'image/jpeg' });
  }
  return images;
}

/** Get available look count for a collection */
function getLookCount(materialsDir: string, collectionId: string): number {
  const collDir = path.join(materialsDir, collectionId);
  if (!fs.existsSync(collDir)) throw new Error(`Materials folder not found: ${collDir}`);
  let count = 0;
  for (let i = 1; i <= 6; i++) {
    if (fs.existsSync(path.join(collDir, `look${i}`))) count = i;
    else break;
  }
  if (count === 0) throw new Error(`No look folders found in: ${collDir} (expected look1/, look2/, ...)`);
  return count;
}

function parseXlsx(xlsxPath: string): CollectionRow[] {
  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet);
  return rows.map((row: any) => ({
    collectionId: String(row.collectionId || '').trim(),
    city: String(row.city || '').trim(),
    location: String(row.location || '').trim(),
    film: String(row.film || 'leicaPortra800').trim(),
    provocative: row.provocative === true || row.provocative === 1 || String(row.provocative).toUpperCase() === 'TRUE',
    daily: row.daily === true || row.daily === 1 || String(row.daily).toUpperCase() === 'TRUE',
    oversizeTop: row.oversizeTop === true || row.oversizeTop === 1 || String(row.oversizeTop).toUpperCase() === 'TRUE',
    oversizeBottom: row.oversizeBottom === true || row.oversizeBottom === 1 || String(row.oversizeBottom).toUpperCase() === 'TRUE',
    outer: String(row.outer || '').trim(),
    tights: String(row.tights || 'none').trim(),
    height: Number(row.height) || 175,
    shotCount: Number(row.shotCount) || 12,
  }));
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBMIT MODE
// ══════════════════════════════════════════════════════════════════════════════

async function submitBatch(xlsxPath: string, materialsDir: string) {
  console.log(`\n🚀 VAULT Batch Submit (Gemini Batch API — 半額)`);
  console.log(`   xlsx: ${xlsxPath}`);
  console.log(`   Materials: ${materialsDir}\n`);

  const collections = parseXlsx(xlsxPath);
  console.log(`📋 Found ${collections.length} collection(s)\n`);

  // Load global face image once
  const faceImage = loadFaceImage();
  console.log(`👤 Face image loaded: ${FACE_IMAGE_PATH}\n`);

  for (const row of collections) {
    console.log(`\n${'═'.repeat(60)}`);

    // Generate unique pool ID to avoid overwriting previous runs
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    const poolId = `${row.collectionId}_v${hhmm}`;
    console.log(`📦 ${poolId} — ${row.city}`);

    // 1. Get look count from folder structure
    const lookCount = getLookCount(materialsDir, row.collectionId);
    console.log(`   📂 ${lookCount} looks, ${row.shotCount || 12} total shots`);

    // 2. Call prompt generator API to get 12 fully-built prompts
    const totalShots = row.shotCount || 12;
    console.log(`   🧠 Calling prompt generator for ${totalShots} shots...`);

    // Map film names to prompt generator's filmMode values
    const filmModeMap: Record<string, string> = {
      leicaPortra400: 'leica',
      leicaPortra800: 'leicaPortra800',
      contax: 'contax',
      nikon: 'nikon',
      nikon800: 'nikon800',
      pentax: 'pentax',
      superia: 'superia',
    };

    // VUAL prompt generator — find the port by testing a POST
    const vualPort = await (async () => {
      for (const port of [3002, 3001, 3000]) {
        try {
          const r = await fetch(`http://localhost:${port}/api/studio-tools/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ story: 'test', shotCount: 1 }),
          });
          const text = await r.text();
          if (text.startsWith('{')) return port; // JSON response = correct API
        } catch {}
      }
      return 3002;
    })();
    console.log(`   🔌 Prompt generator on port ${vualPort}`);

    const promptGenRes = await fetch(`http://localhost:${vualPort}/api/studio-tools/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        story: `${row.location} — ${row.city}`,
        height: row.height || 175,
        tuck: '',
        outer: row.outer || '',
        shotCount: totalShots,
        hasBag: false,
        hasShoes: true,
        filmMode: filmModeMap[row.film] || 'leicaPortra800',
        provocative: row.provocative,
        sculptural: false,
        surveillance: false,
        cyberNeon: false,
        timeOfDay: ['golden', 'dusk', 'night', 'day'][Math.floor(Math.random() * 4)],
        tights: row.tights || 'none',
        dailyMode: row.daily,
        cinematicMix: false,
        threadsMode: false,
        oversizeTop: row.oversizeTop,
        oversizeBottom: row.oversizeBottom,
      }),
    });

    if (!promptGenRes.ok) {
      const errText = await promptGenRes.text();
      console.error(`   ❌ Prompt generator failed: ${errText.substring(0, 200)}`);
      continue;
    }

    const { shots } = await promptGenRes.json();
    if (!shots || shots.length === 0) {
      console.error(`   ❌ No shots returned from prompt generator`);
      continue;
    }
    console.log(`   ✅ Got ${shots.length} prompts from generator`);

    // 3. Assign shots to looks and build batch requests
    const batchRequests: any[] = [];
    const shotsPerLook = Math.ceil(shots.length / lookCount);

    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      const lookNum = Math.min(Math.floor(i / shotsPerLook) + 1, lookCount);
      const shotInLook = (i % shotsPerLook) + 1;

      const lookImages = loadLookImages(materialsDir, row.collectionId, lookNum);
      if (lookImages.length === 0) {
        console.log(`   ⚠️  Look ${lookNum}: no garment images, skipping shot ${i + 1}`);
        continue;
      }

      console.log(`   📸 Shot ${i + 1} → L${lookNum} [${shot.id}] ${shot.templateDesc || ''}`);

      const parts: any[] = [];
      parts.push({ inline_data: { mime_type: faceImage.mimeType, data: faceImage.data } });
      for (const img of lookImages) {
        parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
      }
      parts.push({ text: shot.prompt });

      batchRequests.push({
        request: {
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: '3:4', imageSize: '1K' },
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        },
        metadata: { key: `${poolId}__look${lookNum}_shot${shotInLook}` },
      });
    }

    console.log(`   📤 Submitting ${batchRequests.length} requests to Batch API...`);

    // 4. Submit to Gemini Batch API
    const batchRes = await fetch(`${BATCH_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batch: {
          display_name: `vault-${row.collectionId}`,
          input_config: { requests: { requests: batchRequests } },
        },
      }),
    });

    if (!batchRes.ok) {
      const errText = await batchRes.text();
      console.error(`   ❌ Batch API error: ${errText.substring(0, 200)}`);
      continue;
    }

    const batchData = await batchRes.json();
    const batchName = batchData.name;
    console.log(`   ✅ Job submitted: ${batchName}`);

    // 5. Register job in Firestore (vault_batch_jobs) — include shot prompts for recipe use
    const shotPrompts = shots.map((s: any, i: number) => ({
      shotIndex: i + 1,
      lookNum: Math.min(Math.floor(i / Math.ceil(shots.length / lookCount)) + 1, lookCount),
      templateId: s.id,
      templateDesc: s.templateDesc || '',
      customNote: s.customNote || '',
      prompt: s.prompt || '',
    }));

    await setDoc(doc(db, "vault_batch_jobs", poolId), {
      collectionId: poolId,
      city: row.city,
      location: row.location,
      film: row.film,
      provocative: row.provocative,
      daily: row.daily,
      batchName,
      status: "processing",
      shotCount: batchRequests.length,
      lookCount,
      materialsDir: path.join(materialsDir, row.collectionId),
      shotPrompts,
      submittedAt: Timestamp.now(),
    });

    console.log(`   🔥 Registered in vault_batch_jobs`);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ ALL SUBMITTED. Run 'poll' or 'poll --watch' to check results.`);
  console.log(`${'═'.repeat(60)}\n`);
}

// ══════════════════════════════════════════════════════════════════════════════
// RECIPE PROMPT BUILDER (for poll — same as create-recipes.ts)
// ══════════════════════════════════════════════════════════════════════════════

function buildRecipePrompt(opts: { location: string; film: string; height?: number; daily?: boolean; provocative?: boolean }): string {
  const filmPresets: Record<string, string> = {
    leicaPortra800: 'FILM LOOK — Leica M6, Summicron 35mm f/2, Portra 800. Warm highlights, cool blue-grey shadows.',
    leicaPortra400: 'FILM LOOK — Leica M6, Summicron 35mm f/2, Portra 400. Warm, organic, slight grain.',
    contax: 'FILM LOOK — Contax T3, Portra 400. Fine grain, creamy, airy.',
    nikon: 'FILM LOOK — Nikon FM2, Tri-X 400 pushed to 1600. MONOCHROME BLACK AND WHITE.',
    nikon800: 'FILM LOOK — Nikon FM2, Cinestill 800T pushed to 1600. Cool blue cast, halation.',
    pentax: 'FILM LOOK — Pentax 67, 105mm f/2.4, Portra 400. Medium format, extraordinary depth.',
    superia: 'FILM LOOK — Nikon FM2, Superia 800. Neutral, punchy, consumer grain.',
  };
  const filmText = filmPresets[opts.film] || filmPresets['leicaPortra800'];
  const expression = opts.daily !== false
    ? 'EXPRESSION: COLD, EMOTIONLESS, UNTOUCHABLE.'
    : 'EXPRESSION: Emotionless, eternal beauty.';
  return `CRITICAL INSTRUCTION - GARMENT FIDELITY IS THE TOP PRIORITY:
Reproduce EXACT garments from reference images. Exact color, pattern, silhouette.
Generate image using EXACT face from face reference.
CRITICAL SKIN TONE RULE: Skin color for ENTIRE BODY must match face reference. Do NOT use skin of garment reference models.
The model is ${opts.height || 175}cm tall, slim build.
Wearing EXACTLY the garments from reference.

SCENE: ${opts.location}
${filmText}
${expression}
Show full body including feet. NO text/watermarks.
SHOES: Wear EXACTLY shoes from reference.
GARMENT SHAPE: Do NOT modify silhouette.
OUTPUT: PORTRAIT 3:4 aspect ratio.`;
}

// ══════════════════════════════════════════════════════════════════════════════
// POLL MODE
// ══════════════════════════════════════════════════════════════════════════════

async function pollOnce(): Promise<number> {
  // Find all processing jobs
  const jobsSnapshot = await getDocs(
    query(collection(db, "vault_batch_jobs"), where("status", "==", "processing"))
  );

  if (jobsSnapshot.empty) {
    console.log("   No pending jobs.");
    return 0;
  }

  let pendingCount = 0;

  for (const jobDoc of jobsSnapshot.docs) {
    const job = jobDoc.data();
    const { collectionId, batchName, city, film } = job;
    console.log(`\n  📦 ${collectionId} — checking...`);

    // Check batch status
    const statusRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${batchName}?key=${GEMINI_API_KEY}`,
      { headers: { 'x-goog-api-key': GEMINI_API_KEY! } }
    );

    if (!statusRes.ok) {
      console.log(`     ⚠️  Status check failed (${statusRes.status})`);
      pendingCount++;
      continue;
    }

    const statusData = await statusRes.json();
    const state = statusData.metadata?.state || statusData.state || "UNKNOWN";

    const succeededStates = ['JOB_STATE_SUCCEEDED', 'BATCH_STATE_SUCCEEDED'];
    const failedStates = ['JOB_STATE_FAILED', 'JOB_STATE_CANCELLED', 'BATCH_STATE_FAILED', 'BATCH_STATE_CANCELLED'];

    if (failedStates.includes(state)) {
      console.log(`     ❌ FAILED: ${state}`);
      await updateDoc(doc(db, "vault_batch_jobs", collectionId), { status: "failed", completedAt: Timestamp.now() });
      continue;
    }

    if (!succeededStates.includes(state)) {
      const stats = statusData.metadata?.batchStats || statusData.batchStats || {};
      console.log(`     ⏳ ${state} — ${JSON.stringify(stats)}`);
      pendingCount++;
      continue;
    }

    // ── SUCCEEDED — process results ──
    console.log(`     ✅ COMPLETE! Processing images...`);

    const allResponses =
      statusData.metadata?.output?.inlinedResponses?.inlinedResponses ||
      statusData.response?.inlinedResponses ||
      [];

    const poolMedia: { file: string; type: string; aspect: string; shotIndex: number; lookNum: number }[] = [];
    let processedCount = 0;

    // Shot-specific prompts from job data (saved at submit time)
    const shotPrompts: Record<number, string> = {};
    if (job.shotPrompts) {
      for (const sp of job.shotPrompts) {
        if (sp.prompt && sp.lookNum) {
          // Use first shot's prompt for each look (as recipe)
          if (!shotPrompts[sp.lookNum]) {
            shotPrompts[sp.lookNum] = sp.prompt;
          }
        }
      }
    }
    // Fallback: generic prompt if no shot-specific prompts
    const fallbackPrompt = buildRecipePrompt({
      location: `${job.location} — ${city}`,
      film: film || 'leicaPortra800',
      height: 175,
      daily: job.daily !== false,
      provocative: job.provocative,
    });

    // Track which looks have had recipes uploaded
    const recipesUploaded = new Set<number>();

    for (const resp of allResponses) {
      const key = resp.metadata?.key || "";
      // Parse metadata key: "collectionId__look2_shot1"
      const lookMatch = key.match(/__look(\d+)_shot(\d+)$/);
      const lookNum = lookMatch ? Number(lookMatch[1]) : 0;
      const shotInLook = lookMatch ? Number(lookMatch[2]) : processedCount + 1;
      const shotIndex = processedCount + 1;

      try {
        const candidates = resp.response?.candidates || [];
        const parts = candidates[0]?.content?.parts || [];

        let imageBase64: string | null = null;
        for (const part of parts) {
          const imgData = part.inlineData || part.inline_data;
          if (imgData?.data) { imageBase64 = imgData.data; break; }
        }

        if (!imageBase64) {
          console.log(`       ⚠️  Look ${lookNum} shot ${shotInLook}: no image in response`);
          continue;
        }

        // Apply film effects
        const rawBuffer = Buffer.from(imageBase64, 'base64');
        const processed = await applyFilmToBuffer(rawBuffer);

        // Upload to R2 pool
        const r2Key = `vault/pools/${collectionId}/shot${shotIndex}.jpg`;
        await s3.send(new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: r2Key,
          Body: processed,
          ContentType: "image/jpeg",
        }));

        const r2Url = `${R2_PUBLIC_URL}/${r2Key}`;
        poolMedia.push({ file: r2Url, type: "image", aspect: "3:4", shotIndex, lookNum });
        processedCount++;
        console.log(`       🎞  Look ${lookNum} shot ${shotInLook} → R2 (${(processed.length / 1024).toFixed(0)}KB)`);

        // Upload recipe for this look (once per look)
        if (lookNum > 0 && !recipesUploaded.has(lookNum) && job.materialsDir) {
          const lookDir = path.join(job.materialsDir, `look${lookNum}`);
          if (fs.existsSync(lookDir)) {
            const recipeBase = `vault/pools/${collectionId}/look${lookNum}-recipe`;

            // Upload prompt.txt (shot-specific or fallback)
            const lookPrompt = shotPrompts[lookNum] || fallbackPrompt;
            await s3.send(new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: `${recipeBase}/prompt.txt`,
              Body: Buffer.from(lookPrompt, 'utf-8'),
              ContentType: "text/plain",
            }));

            // Upload all garment images from look folder
            const lookFiles = fs.readdirSync(lookDir).filter(f => /\.(jpe?g|png|webp|avif)$/i.test(f)).sort();
            for (let fi = 0; fi < lookFiles.length; fi++) {
              const filename = lookFiles[fi];
              const buffer = fs.readFileSync(path.join(lookDir, filename));
              const destName = fi === 0 ? 'garment.jpeg' : `ref${fi + 1}.jpeg`;
              await s3.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: `${recipeBase}/${destName}`,
                Body: buffer,
                ContentType: "image/jpeg",
              }));
            }

            recipesUploaded.add(lookNum);
            console.log(`       🧪 Recipe for look ${lookNum} → R2 (${lookFiles.length} refs)`);
          }
        }
      } catch (e: any) {
        console.log(`       ❌ Look ${lookNum} shot ${shotInLook} failed: ${e.message}`);
      }
    }

    // Register pool in Firestore with look mapping
    if (poolMedia.length > 0) {
      await setDoc(doc(db, "vault_pools", collectionId), {
        collectionId,
        city,
        location: job.location,
        film,
        provocative: job.provocative,
        status: "pool",
        shotCount: poolMedia.length,
        totalPlanned: job.shotCount,
        media: poolMedia.sort((a, b) => a.shotIndex - b.shotIndex),
        recipeLooks: Array.from(recipesUploaded).sort(),
        createdAt: Timestamp.now(),
      });
      console.log(`     🔥 Pool registered: ${poolMedia.length}/${job.shotCount} shots, ${recipesUploaded.size} recipes`);
    }

    // Mark job complete
    await updateDoc(doc(db, "vault_batch_jobs", collectionId), {
      status: "completed",
      completedAt: Timestamp.now(),
      resultCount: poolMedia.length,
    });

    // Auto-finalize: collection + reel + recipes
    if (poolMedia.length > 0) {
      console.log(`\n     🚀 Auto-finalizing...`);
      try {
        const { execSync } = await import("child_process");
        execSync(
          `npx tsx "${path.join(__dirname, 'finalize-pool.ts')}" "${collectionId}"`,
          { stdio: "inherit", cwd: path.join(__dirname, ".."), shell: "/bin/zsh" }
        );
      } catch (e: any) {
        console.log(`     ⚠️  Auto-finalize failed: ${e.message}. Run manually: npx tsx scripts/finalize-pool.ts ${collectionId}`);
      }
    }
  }

  return pendingCount;
}

async function pollMode(watch: boolean) {
  console.log(`\n🔍 VAULT Batch Poll${watch ? " (--watch mode, every 2min)" : ""}\n`);

  let pending = await pollOnce();

  if (!watch) {
    if (pending > 0) console.log(`\n   ${pending} job(s) still processing. Run again later or use --watch.`);
    return;
  }

  // Watch mode — keep polling until all done
  while (pending > 0) {
    console.log(`\n   ⏳ ${pending} job(s) still processing. Waiting ${POLL_INTERVAL_MS / 1000}s...`);
    await sleep(POLL_INTERVAL_MS);
    console.log(`\n🔍 Polling...`);
    pending = await pollOnce();
  }

  console.log(`\n✅ All jobs complete!\n`);
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "submit") {
    const xlsxPath = args[1];
    const materialsDir = args[2];
    if (!xlsxPath || !materialsDir) {
      console.log("Usage: npx tsx scripts/batch-generate.ts submit <xlsx> <materials-dir>");
      process.exit(1);
    }
    if (!fs.existsSync(xlsxPath)) { console.error(`❌ xlsx not found: ${xlsxPath}`); process.exit(1); }
    if (!fs.existsSync(materialsDir)) { console.error(`❌ Materials dir not found: ${materialsDir}`); process.exit(1); }
    await submitBatch(xlsxPath, materialsDir);
  } else if (command === "poll") {
    const watch = args.includes("--watch");
    await pollMode(watch);
  } else {
    console.log("VAULT Batch Generation Pipeline (Gemini Batch API — 半額)\n");
    console.log("Usage:");
    console.log("  npx tsx scripts/batch-generate.ts submit <xlsx> <materials-dir>");
    console.log("  npx tsx scripts/batch-generate.ts poll");
    console.log("  npx tsx scripts/batch-generate.ts poll --watch");
    console.log("\nSubmit: generates prompts + submits to Batch API (async, 半額)");
    console.log("Poll:   checks job status, downloads results → film effects → R2 → pool");
    console.log("Poll --watch: auto-repeats every 2min until all jobs complete");
  }
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
