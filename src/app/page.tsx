"use client";

import { useState, useEffect } from "react";
import { ThemeSection } from "@/components/ThemeSection";
import { ImplantModal } from "@/components/ImplantModal";
import { VaultMedia } from "@/data/types";
import { sampleThemes, sampleEntities } from "@/data/sample";
import { handleGoogleRedirectResult, fetchCreditsFromFirestore } from "@/lib/auth";
import { useVaultStore } from "@/lib/store";
import { UserBadge } from "@/components/UserBadge";
import { VideoModal } from "@/components/VideoModal";
import { HeroSection } from "@/components/HeroSection";

export default function VaultHome() {
  const [selectedImage, setSelectedImage] = useState<
    (VaultMedia & { locationId: string }) | null
  >(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const setUser = useVaultStore((s) => s.setUser);

  const addPaidCredits = useVaultStore((s) => s.addPaidCredits);
  const user = useVaultStore((s) => s.user);
  const syncCredits = useVaultStore((s) => s.syncFromFirestore);

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
      // Clean URL
      window.history.replaceState({}, "", "/");
    }
    if (params.get("credit_canceled") === "true") {
      window.history.replaceState({}, "", "/");
    }
  }, [addPaidCredits]);

  return (
    <main className="relative">
      <UserBadge />
      {/* Hero — animated tagline → auto-scroll */}
      <HeroSection firstThemeId={sampleThemes[0]?.id} />

      {/* Theme sections */}
      {sampleThemes.map((theme) => (
        <ThemeSection
          key={theme.id}
          theme={theme}
          onImageClick={setSelectedImage}
          onVideoClick={setVideoSrc}
        />
      ))}

      {/* Video player modal */}
      <VideoModal src={videoSrc} onClose={() => setVideoSrc(null)} />

      {/* IMPLANT modal */}
      <ImplantModal
        image={selectedImage}
        entities={sampleEntities}
        onClose={() => setSelectedImage(null)}
      />

      {/* Side navigation dots */}
      <nav className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
        {sampleThemes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => {
              document
                .getElementById(theme.id)
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="group flex items-center gap-3"
          >
            <span className="text-[9px] tracking-[2px] text-white/0 group-hover:text-white/40 transition-colors">
              {theme.city}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-white/60 transition-colors" />
          </button>
        ))}
      </nav>
    </main>
  );
}
