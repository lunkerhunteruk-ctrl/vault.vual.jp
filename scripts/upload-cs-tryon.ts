#!/usr/bin/env npx tsx
/**
 * Upload the commons & sense / RIN try-on grid assets to R2 — NO film effects,
 * NO Firestore registration. Just raw files in the structure the daily/vault
 * implant API expects, so the StudioLP Mondrian grid try-on works.
 *
 * Source layout (per look folder under ~/Downloads/site):
 *   Model_*.jpeg     → AR grid image  (lookN.jpg)
 *   modal.jpeg       → modal preview  (modalN.jpg)  [3x4 folders have none → reuse AR]
 *   temp*.JPG/.jpeg  → garment refs   (lookN-recipe/garment.jpeg, ref2.jpeg, …)
 *   *.rtf            → recipe prompt  (lookN-recipe/recipe.json {prompt})
 *   jp-f-18*.jpg     → model face     (IGNORED — user uploads / picks a model)
 *
 * Grid display order (matches TALENT_CELLS in StudioLP.tsx):
 *   look1=16x9, look2=9x16, look3=4x3, look4=1x1, look5=3x4, look6=3x4-v2
 *
 * Usage: npx tsx scripts/upload-cs-tryon.ts <siteFolder> <collectionId>
 * Example: npx tsx scripts/upload-cs-tryon.ts ~/Downloads/site 05-06-2026_cs-rin
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// ── R2 config (same bucket the implant API reads from) ──
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

// Folder → look number, in grid display order.
const LOOK_ORDER = ["16x9", "9x16", "4x3", "1x1", "3x4", "3x4-v2"];

function rtfToText(rtfPath: string): string {
  // textutil reliably converts RTF → plain text on macOS
  return execSync(`textutil -convert txt -stdout "${rtfPath}"`).toString().trim();
}

function listFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f !== ".DS_Store" && fs.statSync(path.join(dir, f)).isFile());
}

async function put(key: string, body: Buffer, contentType: string) {
  console.log(`  ☁️  ${key} (${(body.length / 1024).toFixed(0)}KB)`);
  await s3.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, Body: body, ContentType: contentType }));
}

async function main() {
  const [siteFolder, collectionId] = process.argv.slice(2);
  if (!siteFolder || !collectionId) {
    console.log("Usage: npx tsx scripts/upload-cs-tryon.ts <siteFolder> <collectionId>");
    console.log("Example: npx tsx scripts/upload-cs-tryon.ts ~/Downloads/site 05-06-2026_cs-rin");
    process.exit(1);
  }
  const root = siteFolder.replace(/^~/, process.env.HOME || "");

  const manifest: {
    look: number;
    folder: string;
    arUrl: string;
    modalUrl: string;
    lookFile: string; // what the implant API receives as `lookFile`
  }[] = [];

  for (let i = 0; i < LOOK_ORDER.length; i++) {
    const folder = LOOK_ORDER[i];
    const lookNum = i + 1;
    const dir = path.join(root, folder);
    if (!fs.existsSync(dir)) { console.warn(`⚠ missing folder: ${folder}`); continue; }

    console.log(`\n### look${lookNum} ← ${folder}`);
    const files = listFiles(dir);

    // Classify
    const arFile = files.find((f) => f.startsWith("Model_"));
    const modalFile = files.find((f) => f === "modal.jpeg");
    const rtfFile = files.find((f) => f.toLowerCase().endsWith(".rtf"));
    const garments = files
      .filter((f) => f !== arFile && f !== modalFile && f !== rtfFile && !f.startsWith("jp-f-18"))
      .filter((f) => /\.(jpe?g|png)$/i.test(f));

    if (!arFile) { console.warn(`  ⚠ no AR (Model_*) image — skip`); continue; }
    if (!rtfFile) { console.warn(`  ⚠ no .rtf recipe — skip`); continue; }

    // 1. AR grid image → lookN.jpg
    const arKey = `vault/collections/${collectionId}/look${lookNum}.jpg`;
    await put(arKey, fs.readFileSync(path.join(dir, arFile)), "image/jpeg");

    // 2. Modal preview → modalN.jpg (reuse AR if no modal.jpeg)
    const modalKey = `vault/collections/${collectionId}/modal${lookNum}.jpg`;
    const modalSrc = modalFile ? path.join(dir, modalFile) : path.join(dir, arFile);
    await put(modalKey, fs.readFileSync(modalSrc), "image/jpeg");
    if (!modalFile) console.log(`     (no modal.jpeg → reused AR image)`);

    // 3. Recipe prompt → lookN-recipe/recipe.json
    const recipeBase = `vault/collections/${collectionId}/look${lookNum}-recipe`;
    const promptText = rtfToText(path.join(dir, rtfFile));
    await put(`${recipeBase}/recipe.json`, Buffer.from(JSON.stringify({ prompt: promptText }), "utf-8"), "application/json");

    // 4. Garments → garment.jpeg, ref2.jpeg, ref3.jpeg …
    const refNames = ["garment.jpeg", "ref2.jpeg", "ref3.jpeg", "ref4.jpeg", "ref5.jpeg", "ref6.jpeg"];
    garments.forEach((g, gi) => {
      if (gi >= refNames.length) { console.warn(`  ⚠ extra garment ignored: ${g}`); return; }
    });
    for (let gi = 0; gi < Math.min(garments.length, refNames.length); gi++) {
      await put(`${recipeBase}/${refNames[gi]}`, fs.readFileSync(path.join(dir, garments[gi])), "image/jpeg");
    }
    console.log(`     garments: ${garments.length}`);

    manifest.push({
      look: lookNum,
      folder,
      arUrl: `${R2_PUBLIC_URL}/${arKey}`,
      modalUrl: `${R2_PUBLIC_URL}/${modalKey}`,
      lookFile: `${R2_PUBLIC_URL}/${arKey}`,
    });
  }

  console.log(`\n\n✅ Uploaded ${manifest.length} looks to vault/collections/${collectionId}\n`);
  console.log("=== Grid data for StudioLP.tsx (TALENT.images) ===");
  console.log(JSON.stringify(manifest.map((m) => ({ src: m.arUrl, modal: m.modalUrl, lookFile: m.lookFile })), null, 2));
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
