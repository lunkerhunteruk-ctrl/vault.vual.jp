"use client";

import { useState, useEffect, useMemo } from "react";
import { ThemeSection } from "@/components/ThemeSection";
import { ArticleBody } from "@/components/ArticleBody";
import { ImplantModal } from "@/components/ImplantModal";
import { VaultMedia } from "@/data/types";
import { sampleEntities } from "@/data/sample";
import { handleGoogleRedirectResult, fetchCreditsFromFirestore } from "@/lib/auth";
import { useVaultStore } from "@/lib/store";
import { UserBadge } from "@/components/UserBadge";
import { VideoModal } from "@/components/VideoModal";
import { getPublishedCollections, formatCollectionDate, VaultCollection } from "@/lib/collections";
import { getPublishedArticles, VaultArticle, ArticleCategory } from "@/lib/articles";
import { LightboxModal } from "@/components/LightboxModal";
import { getBrandByDomain, VaultBrand } from "@/lib/brand";

// "Experience" = the try-on Mondrian collections; the rest are editorial article categories.
type FilterCat = "All" | "Experience" | ArticleCategory;
const ARTICLE_CATS: ArticleCategory[] = ["Fashion", "Art", "Lifestyle", "Culture", "Interview"];

// Unified feed item: a try-on collection (Mondrian grid) or an editorial article,
// both keyed by their release datetime so the newest sits on top.
type FeedItem =
  | { kind: "collection"; date: number; col: VaultCollection }
  | { kind: "article"; date: number; art: VaultArticle };

const releaseTime = (d: { publishAt: Date | null; createdAt: Date }) =>
  (d.publishAt ?? d.createdAt).getTime();

export function VaultContent() {
  const [collections, setCollections] = useState<VaultCollection[]>([]);
  const [articles, setArticles] = useState<VaultArticle[]>([]);
  const [activeCat, setActiveCat] = useState<FilterCat>("All");
  const [brand, setBrand] = useState<VaultBrand | null>(null);
  const [isBrandMode, setIsBrandMode] = useState(false);
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

  // Detect brand from domain, then fetch content
  useEffect(() => {
    getBrandByDomain(window.location.hostname).then((b) => {
      setBrand(b);
      if (b) {
        // Brand mode: collections by brandId only, no articles, no tier filter
        setIsBrandMode(true);
        getPublishedCollections(undefined, b.id).then(setCollections);
        document.documentElement.style.setProperty('--vault-cyan', b.accentColor);
        document.documentElement.style.setProperty('--vault-cyan-dim', b.accentColor + '40');
        document.title = `${b.name} — Try On`;
      } else {
        // VUAL mode: high tier — both try-on collections and editorial articles
        setIsBrandMode(false);
        getPublishedCollections("high").then(setCollections);
        getPublishedArticles("high").then(setArticles);
      }
    });
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
      if (credits > 0) addPaidCredits(credits);
      window.history.replaceState({}, "", "/");
    }
    if (params.get("credit_canceled") === "true") {
      window.history.replaceState({}, "", "/");
    }
  }, [addPaidCredits]);

  // Merge collections + articles into one feed, newest first.
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [
      ...collections.map((col): FeedItem => ({ kind: "collection", date: releaseTime(col), col })),
      ...articles.map((art): FeedItem => ({ kind: "article", date: releaseTime(art), art })),
    ];
    items.sort((a, b) => b.date - a.date);
    // "All" = mixed feed; "Experience" = try-on collections only; else = that article category.
    if (activeCat === "All") return items;
    if (activeCat === "Experience") return items.filter((it) => it.kind === "collection");
    return items.filter((it) => it.kind === "article" && it.art.category === activeCat);
  }, [collections, articles, activeCat]);

  // Only surface tabs that actually have content right now.
  const availableCats = useMemo<FilterCat[]>(() => {
    const cats: FilterCat[] = ["All"];
    if (collections.length > 0) cats.push("Experience");
    const present = new Set(articles.map((a) => a.category));
    ARTICLE_CATS.forEach((c) => { if (present.has(c)) cats.push(c); });
    return cats;
  }, [collections, articles]);

  const colToTheme = (col: VaultCollection) => ({
    id: col.id,
    date: formatCollectionDate(col),
    city: col.city,
    subtitle: col.subtitle || '',
    hasRecipe: col.hasRecipe ?? false,
    locations: [{
      id: col.id,
      name: col.city,
      implantPrompt: "",
      film: "leicaPortra800",
      media: col.media.map((m) => ({ ...m, file: m.file })),
    }],
  });

  return (
    <>
      <UserBadge />

      {/* Category filter — VUAL mode only. Plain text on the page, no bar. */}
      {!isBrandMode && availableCats.length > 1 && (
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 px-4 pt-6 pb-12">
          {availableCats.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className="text-[10px] tracking-[3px] font-light cursor-pointer pb-1 transition-opacity hover:opacity-70"
              style={{
                color: activeCat === cat ? "var(--vault-text, #111)" : "var(--vault-text-dim, rgba(0,0,0,0.35))",
                borderBottom: activeCat === cat ? "1px solid var(--vault-text, #111)" : "1px solid transparent",
              }}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Unified feed: try-on Mondrian grids + editorial articles, newest first */}
      {feed.map((item, idx) =>
        item.kind === "collection" ? (
          <ThemeSection
            key={`col-${item.col.id}`}
            theme={colToTheme(item.col)}
            isLatest={idx === 0}
            hasRecipe={item.col.hasRecipe ?? false}
            onImageClick={(img) => {
              if (item.col.hasRecipe) {
                setSelectedImage(img);
                setSelectedCity(item.col.city);
                setSelectedHasRecipe(true);
                setSelectedTotalLooks(item.col.media.filter((m) => m.type === "image").length);
              } else {
                setLightboxSrc(img.file);
              }
            }}
            onVideoClick={setVideoSrc}
          />
        ) : (
          <div key={`art-${item.art.id}`} style={{ borderTop: "0.5px solid var(--vault-border, rgba(0,0,0,0.08))" }}>
            <ArticleBody article={item.art} />
          </div>
        )
      )}

      <VideoModal src={videoSrc} onClose={() => setVideoSrc(null)} />

      <ImplantModal
        image={selectedImage}
        entities={sampleEntities}
        themeCity={selectedCity}
        totalLooks={selectedTotalLooks}
        brandName={brand?.filmPrint || brand?.name}
        onClose={() => { setSelectedImage(null); setSelectedHasRecipe(false); }}
      />

      <LightboxModal src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
    </>
  );
}
