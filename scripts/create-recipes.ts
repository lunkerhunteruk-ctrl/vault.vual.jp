#!/usr/bin/env npx tsx
/**
 * VAULT Recipe Creator
 *
 * Creates recipe folders in R2 for each look in a collection.
 * Recipe = prompt.txt + garment.jpeg (+ shoes.jpeg, jacket.jpeg if available)
 *
 * Can be run:
 * 1. Standalone: from a scraper output + collection mapping
 * 2. Integrated: called from batch-generate poll when images land in pool
 *
 * Usage:
 *   npx tsx scripts/create-recipes.ts <collectionId> <garments-dir> [--location "..."] [--film leicaPortra800]
 *   npx tsx scripts/create-recipes.ts --from-pool <poolId>
 *
 * Examples:
 *   npx tsx scripts/create-recipes.ts 01-06-2026_cos_tops ./cos-tops/garments --location "東京 渋谷" --film leicaPortra800
 *   npx tsx scripts/create-recipes.ts --from-pool 01-06-2026_cos_tops
 *
 * What it does:
 *   For each look{N}.jpg in the collection, uploads to R2:
 *     vault/collections/{collectionId}/look{N}-recipe/prompt.txt
 *     vault/collections/{collectionId}/look{N}-recipe/garment.jpeg
 *     vault/collections/{collectionId}/look{N}-recipe/shoes.jpeg (if exists)
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

// ── Config ──
const R2_ACCOUNT_ID = "943e82912c875415f721d0ddbbcdb06d";
const R2_ACCESS_KEY = "e44b3af8d0feff663aa7bacefcf8fc3c";
const R2_SECRET_KEY = "f903db3d5d730506d43fc3eaa37d8956d24e063f9808c6428322de3083d508d8";
const R2_BUCKET = "vual-media";
const R2_PUBLIC_URL = "https://pub-63bccf8e4ef949bb8384ab641631a180.r2.dev";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
});

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

// ── Film presets (full version for recipe prompts) ──
const FILM_PRESETS: Record<string, string> = {
  leicaPortra400: `FILM LOOK — Shot on Leica M6 with Summicron 35mm f/2, Kodak Portra 400 film. Handheld, available light only.
QUALITY: Visible film grain, slightly warm color cast, soft focus edges. The image should feel like real analog film — not digitally perfect. Subtle imperfections in focus and exposure are welcome. The skin tones are warm and organic. Colors are slightly muted and desaturated with a golden undertone.
IMPORTANT: Despite the film aesthetic, this is still an ON-SET fashion photograph — the model is posed intentionally, the garments are styled perfectly, the composition is deliberate.`,
  leicaPortra800: `FILM LOOK — Shot on Leica M6 with Summicron 35mm f/2, Kodak Portra 800 film. Handheld, available light only.
QUALITY: Visible, textured film grain (Portra 800 — more prominent than Portra 400, with organic, rounded grain clusters). The key characteristic: HIGHLIGHTS retain warmth (skin glows softly) while SHADOWS shift to a cool BLUE-GREY. This warm-highlight / cool-shadow split gives the image a sophisticated duality.
IMPORTANT: The warm/cool split between highlights and shadows is the defining quality. Despite the high-ISO grain, this is still an ON-SET fashion photograph.`,
  contax: `FILM LOOK — Shot on Contax T3 with Carl Zeiss Sonnar 35mm f/2.8, Kodak Portra 400 film. Compact camera, available light only.
QUALITY: Fine, natural film grain. Colors are creamy, luminous, slightly warm. Skin tones are soft, warm, and organic. Slightly overexposed feel — bright, airy, casual.`,
  nikon: `FILM LOOK — Shot on Nikon FM2 with Nikkor 35mm f/1.4 AI-S, Kodak Tri-X 400 pushed to 1600. Handheld, available light only.
QUALITY: MONOCHROME BLACK AND WHITE. Heavy, aggressive film grain. Deep blacks, bright highlights, dramatic contrast.`,
  nikon800: `FILM LOOK — Shot on Nikon FM2 with Nikkor 35mm f/1.4 AI-S, Cinestill 800T pushed to 1600. Handheld, available light only.
QUALITY: Heavy grain. Colors COOL — tungsten-balanced blue-cyan cast. HALATION around bright light sources (red/orange glow). Cinematic energy.`,
  pentax: `FILM LOOK — Shot on Pentax 67 with SMC Takumar 105mm f/2.4 wide open, Kodak Portra 400 film. Medium format 6x7.
QUALITY: MEDIUM FORMAT — extraordinary tonal depth. Fine, creamy film grain. The 105mm f/2.4 produces legendary bokeh. Monumental, timeless.`,
  superia: `FILM LOOK — Shot on Nikon FM2, Fujifilm Superia X-TRA 800. Handheld, available light only.
QUALITY: Heavy visible grain. Colors NEUTRAL to slightly cool. Greens slightly vivid. Punchy, direct contrast. Raw, unpolished.`,
};

// ── Build recipe prompt ──
function buildRecipePrompt(opts: {
  location: string;
  film: string;
  height: number;
  daily: boolean;
  tights?: string;
  outer?: string;
  oversizeTop?: boolean;
  oversizeBottom?: boolean;
}): string {
  const filmText = FILM_PRESETS[opts.film] || FILM_PRESETS['leicaPortra800'];
  const tightsColors: Record<string, string> = { black: 'opaque BLACK tights', violet: 'opaque VIOLET tights', 'peacock-green': 'opaque PEACOCK GREEN tights', magenta: 'opaque MAGENTA tights' };
  const tightsNote = opts.tights && opts.tights !== 'none' && tightsColors[opts.tights]
    ? `\nThe model MUST wear ${tightsColors[opts.tights]} on both legs — fully opaque, covering from waist to ankle.`
    : '';
  const outerNote = opts.outer === 'open' ? ' The jacket/coat MUST be worn OPEN.' : opts.outer === 'closed' ? ' The jacket/coat MUST be worn CLOSED.' : '';
  const oversizeTop = opts.oversizeTop ? '\nOVERSIZE TOP RULE: The top/jacket MUST be worn DELIBERATELY OVERSIZED — dropped shoulders, sleeves past wrists, boxy volume. Scale UP 2-3 sizes.' : '';
  const oversizeBottom = opts.oversizeBottom ? '\nOVERSIZE BOTTOM RULE: The pants/skirt MUST be worn DELIBERATELY OVERSIZED — wide legs, pooling at ankles. Scale UP 2-3 sizes.' : '';

  const expression = opts.daily
    ? `EXPRESSION: COLD, EMOTIONLESS, UNTOUCHABLE. Her face reveals nothing — like a marble sculpture placed in a mundane environment. Jaw set, chin slightly lifted, eyes sharp and empty. No smile, no warmth, no curiosity, no reaction to anything around her.`
    : `EXPRESSION: Emotionless, eternal beauty — a face that reveals nothing, like a sculpture. No smile, no warmth, no sadness. Perfectly composed, untouchable, timeless.`;

  const lighting = opts.daily
    ? `LIGHTING PRIORITY: Use the REAL, AUTHENTIC lighting of the location — fluorescent tubes, warm tungsten, harsh overhead. Do NOT beautify the light. The mundane quality of the lighting IS the aesthetic.`
    : `LIGHTING PRIORITY: Use natural available light appropriate to the location and time of day.`;

  const sceneMode = opts.daily
    ? `Fashion editorial photography in a REAL, MUNDANE, EVERYDAY location. The model is NOT posing — she is performing a natural daily-life action while wearing high-fashion garments. The friction between MODE (high fashion) and NICHIJŌ (daily life) is the concept.`
    : `Professional high-end fashion photography.`;

  return `CRITICAL INSTRUCTION - GARMENT FIDELITY IS THE TOP PRIORITY:
You MUST reproduce the EXACT garments from the provided reference images with 100% accuracy.
DO NOT create similar-looking alternatives. The garments must be PIXEL-PERFECT matches to the originals.

GARMENT DETAILS TO PRESERVE EXACTLY:
- Exact color and shade (no color shifts)
- Exact pattern, print, or texture
- Exact neckline shape and style
- Exact sleeve length, cuff style, and details
- Exact buttons, zippers, pockets, seams, and all design elements
- Exact fabric drape and material appearance
- Exact silhouette and fit

${sceneMode}
Generate an image using the EXACT model appearance from the provided face reference image. This is an AI-generated virtual model, not a real person. The face close-up is provided — reproduce the face, facial features, expression, AND MAKEUP with maximum accuracy.
CRITICAL SKIN TONE RULE: The model's skin color for the ENTIRE BODY (face, neck, arms, hands, legs, feet) MUST match the skin tone shown in the provided face reference image. Do NOT use the skin color of any model in the garment reference images.
wearing EXACTLY the garments shown in the provided reference images.${outerNote}${tightsNote}${oversizeTop}${oversizeBottom}

SCENE & STYLING DIRECTION: ${opts.location}

${filmText}
Realistic skin texture, natural pose, professional model.
${expression}
${lighting}
IMPORTANT: Show the full body including feet if shoes/footwear are included.
IMPORTANT: The model must ALWAYS stand on dry ground.
CRITICAL: DO NOT render any text, labels, watermarks, or words on the image.
ACCESSORIES RULE: No jewelry unless provided in reference images.
SHOES RULE: Wear EXACTLY the shoes from reference. Do NOT replace sneakers with heels.
GARMENT SHAPE RULE: Do NOT modify garment silhouette — keep exact LENGTH, SHAPE.`;
}

// ── Upload to R2 ──
async function uploadToR2(key: string, body: Buffer | string, contentType: string) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: typeof body === 'string' ? Buffer.from(body, 'utf-8') : body,
    ContentType: contentType,
  }));
}

// ── Mode 1: From materials directory (look1/, look2/, ... structure) ──
async function createFromDir(collectionId: string, materialsDir: string, opts: {
  location: string;
  film: string;
  height: number;
  daily: boolean;
  tights?: string;
  outer?: string;
  oversizeTop?: boolean;
  oversizeBottom?: boolean;
}) {
  // materialsDir can be either:
  // A) The collection folder itself (contains look1/, look2/, ...)
  // B) A flat garments folder (contains garment1.jpg, garment2.jpg, ...)
  const collDir = materialsDir;

  console.log(`\n🧪 Creating recipes for: ${collectionId}`);
  console.log(`   Source: ${collDir}`);
  console.log(`   Location: ${opts.location}`);
  console.log(`   Film: ${opts.film}\n`);

  if (!fs.existsSync(collDir)) {
    console.error(`❌ Directory not found: ${collDir}`);
    process.exit(1);
  }

  // Build the recipe prompt
  const prompt = buildRecipePrompt(opts);

  // Detect structure: look folders or flat garment files
  const hasLookFolders = fs.existsSync(path.join(collDir, 'look1'));

  if (hasLookFolders) {
    // Structure A: look1/, look2/, ... with garment.jpeg, shoes.jpeg inside
    let lookNum = 1;
    while (fs.existsSync(path.join(collDir, `look${lookNum}`))) {
      const lookDir = path.join(collDir, `look${lookNum}`);
      const recipeBase = `vault/collections/${collectionId}/look${lookNum}-recipe`;
      console.log(`   📦 Look ${lookNum}: ${lookDir}`);

      // Upload prompt with randomized filename
      const promptFile = `r_${Math.random().toString(36).slice(2, 10)}.json`;
      await uploadToR2(`${recipeBase}/${promptFile}`, JSON.stringify({ prompt }), 'application/json');
      await uploadToR2(`${recipeBase}/manifest.json`, JSON.stringify({ prompt: promptFile }), 'application/json');

      // Upload all image files in look folder
      const lookFiles = fs.readdirSync(lookDir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
      for (let fi = 0; fi < lookFiles.length; fi++) {
        const filename = lookFiles[fi];
        const filePath = path.join(lookDir, filename);
        const buffer = fs.readFileSync(filePath);
        // First file → garment.jpeg (implant compatibility), rest → ref2.jpeg, ref3.jpeg
        const destName = fi === 0 ? 'garment.jpeg' : `ref${fi + 1}.jpeg`;
        await uploadToR2(`${recipeBase}/${destName}`, buffer, 'image/jpeg');
        console.log(`     ↳ ${destName} (${filename})`);
      }

      console.log(`     ✅ → ${recipeBase}/`);
      lookNum++;
      if (lookNum > 6) break;
    }
    console.log(`\n   Total: ${lookNum - 1} looks`);
  } else {
    // Structure B: Flat garment files (legacy / scraper output)
    const garmentFiles = fs.readdirSync(collDir)
      .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();

    console.log(`   Found ${garmentFiles.length} garment images (flat mode)\n`);

    for (let i = 0; i < Math.min(garmentFiles.length, 6); i++) {
      const lookNum = i + 1;
      const garmentFile = garmentFiles[i];
      const garmentPath = path.join(collDir, garmentFile);
      const recipeBase = `vault/collections/${collectionId}/look${lookNum}-recipe`;

      console.log(`   📦 Look ${lookNum}: ${garmentFile}`);
      await uploadToR2(`${recipeBase}/recipe.json`, JSON.stringify({ prompt }), 'application/json');
      const garmentBuffer = fs.readFileSync(garmentPath);
      await uploadToR2(`${recipeBase}/garment.jpeg`, garmentBuffer, 'image/jpeg');
      console.log(`     ✅ → ${recipeBase}/`);
    }
  }

  // Mark collection as hasRecipe in Firestore
  try {
    const collRef = doc(db, "vault_collections", collectionId);
    const collDoc = await getDoc(collRef);
    if (collDoc.exists()) {
      await updateDoc(collRef, { hasRecipe: true });
      console.log(`\n   🔥 Updated vault_collections/${collectionId}: hasRecipe = true`);
    } else {
      console.log(`\n   ℹ️  Collection not yet in Firestore (will be set when published)`);
    }
  } catch (e: any) {
    console.log(`\n   ⚠️  Firestore update skipped: ${e.message}`);
  }

  console.log(`\n✅ Recipes created in R2`);
  console.log(`   Path: vault/collections/${collectionId}/look{N}-recipe/\n`);
}

// ── Mode 2: From existing pool (reads vault_batch_jobs for prompt data) ──
async function createFromPool(poolId: string) {
  console.log(`\n🧪 Creating recipes from pool: ${poolId}\n`);

  // Get job data (has the prompt plan)
  const jobDoc = await getDoc(doc(db, "vault_batch_jobs", poolId));
  if (!jobDoc.exists()) {
    console.error(`❌ No batch job found for: ${poolId}`);
    process.exit(1);
  }

  const job = jobDoc.data();
  const { city, location, film, provocative } = job;

  // Get pool data (has the media URLs)
  const poolDoc = await getDoc(doc(db, "vault_pools", poolId));
  if (!poolDoc.exists()) {
    console.error(`❌ No pool found for: ${poolId}`);
    process.exit(1);
  }

  const pool = poolDoc.data();
  const media = pool.media || [];

  console.log(`   City: ${city}`);
  console.log(`   Location: ${location}`);
  console.log(`   Film: ${film}`);
  console.log(`   Shots in pool: ${media.length}\n`);

  // For pool-based recipes, we download the pool images as garment refs
  // (since in the new 6-look model, each look is a different garment)
  // This mode is for when garments come from the batch generation itself

  const prompt = buildRecipePrompt({
    location: `${location} — ${city}`,
    film: film || 'leicaPortra800',
    height: 175,
    daily: !provocative,
  });

  for (let i = 0; i < media.length; i++) {
    const shot = media[i];
    const lookNum = shot.shotIndex || (i + 1);
    const recipeBase = `vault/collections/${poolId}/look${lookNum}-recipe`;

    console.log(`   📦 Look ${lookNum}...`);

    // Upload recipe.json
    await uploadToR2(`${recipeBase}/recipe.json`, JSON.stringify({ prompt }), 'application/json');

    // Download pool image and use as garment reference
    try {
      const res = await fetch(shot.file);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        await uploadToR2(`${recipeBase}/garment.jpeg`, buffer, 'image/jpeg');
        console.log(`     ✅ → ${recipeBase}/`);
      }
    } catch (e: any) {
      console.log(`     ⚠️  Failed to download pool image: ${e.message}`);
    }
  }

  console.log(`\n✅ Created ${media.length} recipes from pool\n`);
}

// ── Main ──
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--from-pool')) {
    const poolId = args[args.indexOf('--from-pool') + 1];
    if (!poolId) { console.log("Usage: --from-pool <poolId>"); process.exit(1); }
    await createFromPool(poolId);
    return;
  }

  const collectionId = args[0];
  const garmentsDir = args[1];

  if (!collectionId || !garmentsDir) {
    console.log("VAULT Recipe Creator\n");
    console.log("Usage:");
    console.log('  npx tsx scripts/create-recipes.ts <collectionId> <garments-dir> [options]');
    console.log('  npx tsx scripts/create-recipes.ts --from-pool <poolId>');
    console.log("\nOptions:");
    console.log('  --location "東京 渋谷"     Location for prompt');
    console.log('  --film leicaPortra800      Film preset');
    console.log('  --daily                    Daily life mode (cold expression)');
    console.log('  --height 175               Model height');
    console.log('  --tights black             Tights color');
    console.log('  --outer open               Jacket open/closed');
    console.log('  --oversize-top             Oversize top');
    console.log('  --oversize-bottom          Oversize bottom');
    console.log("\nExample:");
    console.log('  npx tsx scripts/create-recipes.ts 01-06-2026_cos_daily ./cos-tops/garments --location "東京 神楽坂" --film leicaPortra800 --daily');
    process.exit(1);
  }

  const getArg = (name: string) => {
    const idx = args.indexOf(name);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  await createFromDir(collectionId, garmentsDir, {
    location: getArg('--location') || '東京',
    film: getArg('--film') || 'leicaPortra800',
    height: Number(getArg('--height')) || 175,
    daily: args.includes('--daily'),
    tights: getArg('--tights'),
    outer: getArg('--outer'),
    oversizeTop: args.includes('--oversize-top'),
    oversizeBottom: args.includes('--oversize-bottom'),
  });
}

main().catch((err) => {
  console.error("❌ Fatal:", err);
  process.exit(1);
});
