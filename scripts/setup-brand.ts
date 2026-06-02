#!/usr/bin/env npx tsx
/**
 * Setup a brand in Firestore vault_brands collection.
 *
 * Usage: npx tsx scripts/setup-brand.ts
 */
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const db = getFirestore(app);

async function main() {
  // Balenciaga test brand
  await setDoc(doc(db, "vault_brands", "balenciaga"), {
    domain: "balenciaga.vault.vual.jp",
    name: "BALENCIAGA",
    accentColor: "#000000",
    heroLine1: "OWN NOTHING.",
    heroLine2: "BECOME EVERYTHING.",
    heroSubtitle: "by BALENCIAGA",
    filmPrint: "BALENCIAGA",
  });

  console.log("✓ Brand 'balenciaga' created in vault_brands");
  console.log("  domain: balenciaga.vault.vual.jp");
  console.log("  accent: #000000");
  console.log("");
  console.log("Next steps:");
  console.log("  1. Set brandId on collections: update vault_collections docs with brandId: 'balenciaga'");
  console.log("  2. Add domain to Vercel: balenciaga.vault.vual.jp");
  console.log("  3. Or test locally: add '127.0.0.1 balenciaga.vault.vual.jp' to /etc/hosts");

  process.exit(0);
}

main().catch(console.error);
