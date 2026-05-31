"use client";

import { useState, useEffect } from "react";
import { ThemeSection } from "@/components/ThemeSection";
import { ImplantModal } from "@/components/ImplantModal";
import { VaultMedia } from "@/data/types";
import { sampleEntities } from "@/data/sample";
import { handleGoogleRedirectResult, fetchCreditsFromFirestore } from "@/lib/auth";
import { useVaultStore } from "@/lib/store";
import { UserBadge } from "@/components/UserBadge";
import { VideoModal } from "@/components/VideoModal";
import { HeroSection } from "@/components/HeroSection";
import { LatestStrip } from "@/components/LatestStrip";
import { getPublishedCollections, formatCollectionDate, VaultCollection } from "@/lib/collections";
import { LightboxModal } from "@/components/LightboxModal";

export default function VaultHome() {
  const [collections, setCollections] = useState<VaultCollection[]>([]);
  const [selectedImage, setSelectedImage] = useState<
    (VaultMedia & { locationId: string }) | null
  >(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedTotalLooks, setSelectedTotalLooks] = useState<number>(12);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [selectedHasRecipe, setSelectedHasRecipe] = useState(false);

  /* ── ALL HOOKS DISABLED FOR SCROLL TEST ── */
  const setUser = () => {};
  const addPaidCredits = () => {};
  const user = null as any;
  const syncCredits = () => {};
  const ready = false;

  /* ── ALL useEffects disabled ── */

  // Handle credit purchase success
  /*useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("credit_success") === "true") {
      const credits = parseInt(params.get("credits") || "0", 10);
      if (credits > 0) {
        addPaidCredits(credits);
      }
      window.history.replaceState({}, "", "/");
    }
    if (params.get("credit_canceled") === "true") {
      window.history.replaceState({}, "", "/");
    }
  }, [addPaidCredits]);*/

  // Convert VaultCollection to VaultTheme format for ThemeSection
  const themes = collections.map((col) => ({
    id: col.id,
    date: formatCollectionDate(col),
    city: col.city,
    hasRecipe: col.hasRecipe ?? false,
    locations: [{
      id: col.id,
      name: col.city,
      implantPrompt: "",
      film: "leicaPortra800",
      media: col.media.map((m) => ({ ...m, file: m.file })),
    }],
  }));

  return (
    <main className="relative">
      {/* <UserBadge /> */}
      <HeroSection firstThemeId={themes[0]?.id} />

      {/* All collections — Mondrian grid (deferred render) */}
      {ready && themes.map((theme, idx) => (
        <ThemeSection
          key={theme.id}
          theme={theme}
          isLatest={idx === 0}
          hasRecipe={theme.hasRecipe}
          onImageClick={(img) => {
            if (theme.hasRecipe) {
              setSelectedImage(img);
              setSelectedCity(theme.city);
              setSelectedHasRecipe(true);
              setSelectedTotalLooks(theme.locations.flatMap(l => l.media).filter(m => m.type === "image").length);
            } else {
              setLightboxSrc(img.file);
            }
          }}
          onVideoClick={setVideoSrc}
        />
      ))}

      <VideoModal src={videoSrc} onClose={() => setVideoSrc(null)} />

      <ImplantModal
        image={selectedImage}
        entities={sampleEntities}
        themeCity={selectedCity}
        totalLooks={selectedTotalLooks}
        onClose={() => { setSelectedImage(null); setSelectedHasRecipe(false); }}
      />

      <LightboxModal
        src={lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </main>
  );
}
