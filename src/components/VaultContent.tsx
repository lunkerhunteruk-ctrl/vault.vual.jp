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
import { getPublishedCollections, formatCollectionDate, VaultCollection } from "@/lib/collections";
import { LightboxModal } from "@/components/LightboxModal";

export function VaultContent() {
  const [collections, setCollections] = useState<VaultCollection[]>([]);
  const [selectedImage, setSelectedImage] = useState<
    (VaultMedia & { locationId: string }) | null
  >(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedTotalLooks, setSelectedTotalLooks] = useState<number>(12);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [selectedHasRecipe, setSelectedHasRecipe] = useState(false);
  const setUser = useVaultStore((s) => s.setUser);
  const addPaidCredits = useVaultStore((s) => s.addPaidCredits);
  const user = useVaultStore((s) => s.user);
  const syncCredits = useVaultStore((s) => s.syncFromFirestore);

  // Fetch published collections from Firestore
  useEffect(() => {
    getPublishedCollections().then(setCollections);
  }, []);

  // Handle Google redirect result (mobile sign-in)
  useEffect(() => {
    handleGoogleRedirectResult().then((u) => {
      if (u) setUser(u);
    });
  }, [setUser]);

  // Sync credits from Firestore on page load
  useEffect(() => {
    if (user?.id) {
      fetchCreditsFromFirestore(user.id).then((credits) => {
        if (credits) syncCredits(credits.paidCredits, credits.freeUsed, credits.freeResetDate, credits.points);
      });
    }
  }, [user?.id, syncCredits]);

  // Handle credit purchase success
  useEffect(() => {
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
  }, [addPaidCredits]);

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
    <>
      <UserBadge />

      {/* All collections — Mondrian grid */}
      {themes.map((theme, idx) => (
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
    </>
  );
}
