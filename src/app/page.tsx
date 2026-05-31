"use client";

import dynamic from "next/dynamic";
import { HeroSection } from "@/components/HeroSection";

// Firebase-dependent content loaded asynchronously — does not block initial render/scroll
const VaultContent = dynamic(
  () => import("@/components/VaultContent").then(m => ({ default: m.VaultContent })),
  { ssr: false }
);

export default function VaultHome() {
  return (
    <main className="relative">
      <HeroSection />
      <VaultContent />
    </main>
  );
}
