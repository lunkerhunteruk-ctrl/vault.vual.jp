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
  const setUser = useVaultStore((s) => s.setUser);

  const addPaidCredits = useVaultStore((s) => s.addPaidCredits);
  const user = useVaultStore((s) => s.user);
  const syncCredits = useVaultStore((s) => s.syncFromFirestore);

  // Fetch published collections from Firestore — deferred to not block scroll
  useEffect(() => {
    const t = setTimeout(() => {
      getPublishedCollections().then(setCollections);
    }, 100);
    return () => clearTimeout(t);
  }, []);

  // Handle Google redirect result (mobile sign-in) — deferred
  useEffect(() => {
    const t = setTimeout(() => {
      handleGoogleRedirectResult().then((u) => {
        if (u) setUser(u);
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [setUser]);

  // Sync credits from Firestore on page load (when already logged in) — deferred
  useEffect(() => {
    if (user?.id) {
      const t = setTimeout(() => {
        fetchCreditsFromFirestore(user.id).then((credits) => {
          if (credits) syncCredits(credits.paidCredits, credits.freeUsed, credits.freeResetDate, credits.points);
        });
      }, 2500);
      return () => clearTimeout(t);
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
      {/* TEST: minimal content */}
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>VAULT TEST</p>
      </div>
      <div style={{ height: "200vh", background: "red", opacity: 0.1 }} />

    </main>
  );
}
