"use client";

import { useState, useEffect } from "react";
import { ImplantModal } from "@/components/ImplantModal";
import { sampleEntities } from "@/data/sample";
import { VaultMedia } from "@/data/types";
import { handleGoogleRedirectResult, fetchCreditsFromFirestore } from "@/lib/auth";
import { useVaultStore } from "@/lib/store";
import { getBrandByDomain } from "@/lib/brand";

const R2_BASE = "https://pub-63bccf8e4ef949bb8384ab641631a180.r2.dev/vault/collections";

export default function TryOnPage() {
  const [image, setImage] = useState<(VaultMedia & { locationId: string }) | null>(null);
  const [city, setCity] = useState("VAULT");
  const [brandName, setBrandName] = useState<string | undefined>();
  const setUser = useVaultStore((s) => s.setUser);
  const user = useVaultStore((s) => s.user);
  const syncCredits = useVaultStore((s) => s.syncFromFirestore);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const look = params.get("look");
    const cityParam = params.get("city");

    if (look) {
      // look format: "29-05-2026_shibuya_italian/look1" or full R2 URL
      const file = look.startsWith("http") ? look : `${R2_BASE}/${look}.jpg`;
      setImage({
        file,
        type: "image",
        aspect: "3:4",
        locationId: look,
      });
    }

    if (cityParam) setCity(cityParam);

    // Detect brand
    getBrandByDomain(window.location.hostname).then((b) => {
      if (b) {
        setBrandName(b.filmPrint || b.name);
        document.documentElement.style.setProperty("--vault-cyan", b.accentColor);
        document.documentElement.style.setProperty("--vault-cyan-dim", b.accentColor + "40");
      }
    });

    // Auth
    handleGoogleRedirectResult().then((u) => {
      if (u) setUser(u);
    });
  }, [setUser]);

  // Sync credits
  useEffect(() => {
    if (user?.id) {
      fetchCreditsFromFirestore(user.id).then((credits) => {
        if (credits) syncCredits(credits.paidCredits, credits.freeUsed, credits.freeResetDate, credits.points);
      });
    }
  }, [user?.id, syncCredits]);

  return (
    <div style={{ background: "var(--vault-bg)", minHeight: "100vh" }}>
      <ImplantModal
        image={image}
        entities={sampleEntities}
        themeCity={city}
        totalLooks={1}
        brandName={brandName}
        compact
        onClose={() => {
          // Go back or close window
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.close();
          }
        }}
      />

      {/* Fallback if no look param */}
      {!image && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--vault-text-dim)", fontSize: "12px", letterSpacing: "3px" }}>
          NO LOOK SPECIFIED
        </div>
      )}
    </div>
  );
}
