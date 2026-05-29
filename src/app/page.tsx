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
import { ThemeToggle } from "@/components/ThemeToggle";
import { getPublishedCollections, formatCollectionDate, VaultCollection } from "@/lib/collections";

export default function VaultHome() {
  const [collections, setCollections] = useState<VaultCollection[]>([]);
  const [selectedImage, setSelectedImage] = useState<
    (VaultMedia & { locationId: string }) | null
  >(null);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedTotalLooks, setSelectedTotalLooks] = useState<number>(12);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
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

  // Sync credits from Firestore on page load (when already logged in)
  useEffect(() => {
    if (user?.id) {
      fetchCreditsFromFirestore(user.id).then((credits) => {
        if (credits) syncCredits(credits.paidCredits, credits.freeUsed);
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

  // Convert VaultCollection to VaultTheme format for ThemeSection
  const themes = collections.map((col) => ({
    id: col.id,
    date: formatCollectionDate(col),
    city: col.city,
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
      <UserBadge />
      <HeroSection firstThemeId={themes[0]?.id} />

      {/* Theme toggle */}
      <div className="flex justify-center py-6">
        <ThemeToggle />
      </div>

      {/* Theme sections from Firestore */}
      {themes.map((theme) => (
        <ThemeSection
          key={theme.id}
          theme={theme}
          onImageClick={(img) => {
            setSelectedImage(img);
            setSelectedCity(theme.city);
            setSelectedTotalLooks(theme.locations.flatMap(l => l.media).filter(m => m.type === "image").length);
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
        onClose={() => setSelectedImage(null)}
      />
    </main>
  );
}
