"use client";

import { useState, useEffect, useRef } from "react";
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAllCollections, togglePublished, setPublishSchedule, VaultCollection } from "@/lib/collections";
import { getAllArticles, createArticle, updateArticle, toggleArticlePublished, deleteArticle, VaultArticle, ArticleBlock, ArticleCategory, BlockType } from "@/lib/articles";
// ── R2 image upload helper ──
async function uploadImageToR2(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "x-admin-key": "vual-vault-2026" },
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  const { url } = await res.json();
  return url;
}

// ── Drop zone component ──
function ImageDropZone({
  currentUrl,
  onUploaded,
  label,
  className,
  previewHeight = "h-24",
}: {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
  previewHeight?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const url = await uploadImageToR2(files[0]);
      onUploaded(url);
    } catch (e) {
      alert("Upload failed: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`relative border border-dashed rounded transition-colors cursor-pointer ${
        dragging ? "border-white/50 bg-white/5" : "border-white/15 hover:border-white/30"
      } ${className || ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <div className="flex items-center justify-center py-6">
          <span className="text-[9px] tracking-[2px] text-white/40 animate-pulse">UPLOADING...</span>
        </div>
      ) : currentUrl ? (
        <div className="p-2">
          <img src={currentUrl} className={`${previewHeight} rounded object-cover w-full`} />
          <p className="text-[8px] text-white/20 mt-1 truncate">{currentUrl}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 gap-1">
          <span className="text-[16px] text-white/15">↑</span>
          <span className="text-[8px] tracking-[2px] text-white/25">{label || "DROP IMAGE OR CLICK"}</span>
        </div>
      )}
    </div>
  );
}

// ── Multi-image drop zone (for gallery blocks) ──
function GalleryDropZone({
  images,
  onUpdated,
}: {
  images: string[];
  onUpdated: (urls: string[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map((f) => uploadImageToR2(f))
      );
      onUpdated([...images, ...urls]);
    } catch (e) {
      alert("Upload failed: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((url, i) => (
            <div key={i} className="relative group">
              <img src={url} className="h-16 w-16 object-cover rounded" />
              <button
                onClick={() => onUpdated(images.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500/60 rounded-full text-[8px] text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
              >×</button>
            </div>
          ))}
        </div>
      )}
      <div
        className={`border border-dashed rounded transition-colors cursor-pointer ${
          dragging ? "border-white/50 bg-white/5" : "border-white/15 hover:border-white/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex items-center justify-center py-3 gap-2">
          {uploading ? (
            <span className="text-[9px] tracking-[2px] text-white/40 animate-pulse">UPLOADING...</span>
          ) : (
            <span className="text-[8px] tracking-[2px] text-white/25">+ DROP IMAGES OR CLICK</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface PoolData {
  id: string;
  collectionId: string;
  city: string;
  location: string;
  film: string;
  provocative: boolean;
  status: string;
  shotCount: number;
  totalPlanned: number;
  media: { file: string; type: string; aspect: string; shotIndex: number; lookNum?: number }[];
  createdAt: Date;
}

interface InjectionData {
  remaining: number;
  initial: number;
}

interface UserData {
  id: string;
  email: string;
  displayName: string;
  paidCredits: number;
  freeUsed: number;
}

const ADMIN_KEY = "vual-vault-2026";

export default function AdminPage() {
  const [counts, setCounts] = useState<Record<string, InjectionData>>({});
  const [users, setUsers] = useState<UserData[]>([]);
  const [colls, setColls] = useState<VaultCollection[]>([]);
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [publishCity, setPublishCity] = useState("");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [openColls, setOpenColls] = useState<Set<string>>(new Set());
  const [openInjGroups, setOpenInjGroups] = useState<Set<string>>(new Set());
  const [tierFilter, setTierFilter] = useState<"all" | "high" | "daily">("all");

  // Articles
  const [articles, setArticles] = useState<VaultArticle[]>([]);
  const [editingArticle, setEditingArticle] = useState<VaultArticle | null>(null);
  const [openArticles, setOpenArticles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("key") === ADMIN_KEY) {
      setAuthorized(true);
    }
  }, []);

  // Force dark mode on admin page
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute("data-theme");
    root.removeAttribute("data-theme");
    return () => {
      if (prev) root.setAttribute("data-theme", prev);
    };
  }, []);

  const fetchCounts = async () => {
    if (!db) return;
    const snapshot = await getDocs(collection(db, "injection_counts"));
    const data: Record<string, InjectionData> = {};
    snapshot.forEach((d) => {
      const val = d.data();
      if (val.hidden) return; // skip hidden
      data[d.id] = { remaining: val.remaining ?? 0, initial: val.initial ?? 0 };
    });
    setCounts(data);
  };

  const hideCount = async (lookId: string) => {
    if (!db) return;
    await updateDoc(doc(db, "injection_counts", lookId), { hidden: true });
    fetchCounts();
  };

  const fetchUsers = async () => {
    if (!db) return;
    const snapshot = await getDocs(collection(db, "vault_users"));
    const data: UserData[] = [];
    snapshot.forEach((d) => {
      const val = d.data();
      data.push({
        id: d.id,
        email: val.email || "",
        displayName: val.displayName || "",
        paidCredits: val.paidCredits ?? 0,
        freeUsed: val.freeUsed ?? 0,
      });
    });
    setUsers(data);
  };

  const fetchCollections = async () => {
    const data = await getAllCollections();
    setColls(data);
  };

  const fetchArticles = async () => {
    const data = await getAllArticles();
    setArticles(data);
  };

  const fetchPools = async () => {
    if (!db) return;
    const snapshot = await getDocs(collection(db, "vault_pools"));
    const data: PoolData[] = [];
    snapshot.forEach((d) => {
      const val = d.data();
      data.push({
        id: d.id,
        collectionId: val.collectionId || d.id,
        city: val.city || "",
        location: val.location || "",
        film: val.film || "",
        provocative: val.provocative ?? false,
        status: val.status || "pool",
        shotCount: val.shotCount || 0,
        totalPlanned: val.totalPlanned || 0,
        media: val.media || [],
        createdAt: val.createdAt?.toDate?.() || new Date(),
      });
    });
    data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setPools(data);
  };

  useEffect(() => {
    Promise.all([fetchCounts(), fetchUsers(), fetchCollections(), fetchPools(), fetchArticles()]).then(() => setLoading(false));
  }, []);

  const updateCount = async (lookId: string, remaining: number) => {
    if (!db) return;
    await updateDoc(doc(db, "injection_counts", lookId), { remaining });
    fetchCounts();
  };

  const updateInitial = async (lookId: string, initial: number) => {
    if (!db) return;
    await updateDoc(doc(db, "injection_counts", lookId), { initial });
    fetchCounts();
  };

  const updateUserCredits = async (userId: string, paidCredits: number) => {
    if (!db) return;
    await updateDoc(doc(db, "vault_users", userId), { paidCredits });
    fetchUsers();
  };

  const reset = async (lookId: string) => {
    if (!db) return;
    const initial = counts[lookId]?.initial ?? 0;
    await updateDoc(doc(db, "injection_counts", lookId), { remaining: initial });
    fetchCounts();
  };

  if (!authorized) return <div className="min-h-screen bg-[#0a0a0a]" />;
  if (loading) return <div className="p-8 text-white/40">Loading...</div>;

  const sorted = Object.entries(counts).sort(([a], [b]) => b.localeCompare(a));

  // Group injection counts by collection (extract prefix before _look)
  const injGroups: Record<string, [string, InjectionData][]> = {};
  for (const [lookId, data] of sorted) {
    const collMatch = lookId.match(/^(.+?)_look\d+/) || lookId.match(/^(.+?)_[^_]+$/);
    const groupName = collMatch ? collMatch[1] : lookId;
    if (!injGroups[groupName]) injGroups[groupName] = [];
    injGroups[groupName].push([lookId, data]);
  }

  // Build a map from injection group name to tier (by matching against colls)
  const groupTierMap: Record<string, string | undefined> = {};
  for (const groupName of Object.keys(injGroups)) {
    const matchedColl = colls.find((c) => c.id === groupName || c.id.startsWith(groupName) || groupName.startsWith(c.id));
    groupTierMap[groupName] = matchedColl?.tier;
  }

  const filteredInjGroups = Object.entries(injGroups).filter(([groupName]) => {
    if (tierFilter === "all") return true;
    return groupTierMap[groupName] === tierFilter;
  });

  return (
    <div className="vault-admin min-h-screen bg-[#0a0a0a] text-white p-8">
      <h1 className="text-[14px] tracking-[6px] text-white/40 font-light mb-4">
        VAULT ADMIN — INJECTION COUNTS
      </h1>

      {/* Tier filter tabs (shared with collections) */}
      <div className="flex gap-1 mb-6 max-w-2xl">
        {(["all", "high", "daily"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`px-4 py-1.5 text-[10px] tracking-[3px] font-light rounded cursor-pointer transition-colors ${
              tierFilter === t
                ? "bg-white/15 text-white/80"
                : "bg-white/5 text-white/30 hover:text-white/50"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-w-2xl">
        {filteredInjGroups.map(([groupName, items]) => {
          const isOpen = openInjGroups.has(groupName);
          const totalRemaining = items.reduce((sum, [, d]) => sum + d.remaining, 0);
          return (
            <div key={groupName} className="border border-white/10 rounded-lg">
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02]"
                onClick={() => {
                  const next = new Set(openInjGroups);
                  if (isOpen) next.delete(groupName); else next.add(groupName);
                  setOpenInjGroups(next);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/20">{isOpen ? "▼" : "▶"}</span>
                  <span className="text-[12px] text-white/60 font-light">{groupName}</span>
                  {groupTierMap[groupName] && (
                    <span className={`text-[7px] tracking-[1px] font-light px-1.5 py-0.5 rounded ${
                      groupTierMap[groupName] === "high" ? "bg-purple-500/15 text-purple-400/60" : "bg-cyan-500/15 text-cyan-400/60"
                    }`}>
                      {groupTierMap[groupName]!.toUpperCase()}
                    </span>
                  )}
                  <span className="text-[10px] text-white/25">{items.length} looks</span>
                </div>
                <span className="text-[14px] tabular-nums font-light" style={{ color: totalRemaining > 0 ? "var(--vault-cyan)" : "rgba(255,255,255,0.2)" }}>
                  {totalRemaining}
                </span>
              </div>

              {isOpen && (
                <div className="border-t border-white/5 space-y-1 p-2">
                  {items.map(([lookId, data]) => (
                    <div key={lookId} className="flex items-center justify-between px-2 py-2">
                      <p className="text-[11px] text-white/50 font-light truncate max-w-[200px]">
                        {lookId.replace(groupName + '_', '')}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-white/25 mr-1">INIT</span>
                          <button onClick={() => updateInitial(lookId, Math.max(0, data.initial - 1))} className="w-6 h-6 border border-white/10 rounded text-white/25 hover:text-white/50 text-[11px] cursor-pointer">−</button>
                          <span className="text-[13px] font-light tabular-nums w-5 text-center text-white/40">{data.initial}</span>
                          <button onClick={() => updateInitial(lookId, data.initial + 1)} className="w-6 h-6 border border-white/10 rounded text-white/25 hover:text-white/50 text-[11px] cursor-pointer">+</button>
                        </div>
                        <div className="w-[1px] h-5 bg-white/10" />
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateCount(lookId, Math.max(0, data.remaining - 1))} className="w-7 h-7 border border-white/20 rounded text-white/40 hover:text-white/70 text-[13px] cursor-pointer">−</button>
                          <span className="text-[20px] font-light tabular-nums w-8 text-center" style={{ color: data.remaining > 0 ? "var(--vault-cyan)" : "#ef4444" }}>{data.remaining}</span>
                          <button onClick={() => updateCount(lookId, data.remaining + 1)} className="w-7 h-7 border border-white/20 rounded text-white/40 hover:text-white/70 text-[13px] cursor-pointer">+</button>
                        </div>
                        <button onClick={() => reset(lookId)} className="px-2 py-1 text-[8px] tracking-[1px] border border-white/10 rounded text-white/25 hover:text-white/50 cursor-pointer">RESET</button>
                        <button onClick={() => { if (confirm(`Hide "${lookId}"?`)) hideCount(lookId); }} className="px-2 py-1 text-[8px] tracking-[1px] border border-red-900/30 rounded text-red-400/40 hover:text-red-400/70 cursor-pointer">HIDE</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <p className="text-white/20 text-[12px]">
          No injection counts yet. Generate some images first.
        </p>
      )}

      {/* Collections */}
      <h2 className="text-[14px] tracking-[6px] text-white/40 font-light mt-12 mb-6">
        COLLECTIONS
      </h2>

      <div className="space-y-2 max-w-2xl">
        {colls.filter((col) => {
          if (tierFilter === "all") return true;
          return (col as any).tier === tierFilter;
        }).map((col) => {
          const now = new Date();
          const isScheduled = col.publishAt && col.publishAt > now;
          const isLive = col.published && (!col.publishAt || col.publishAt <= now);
          const isOpen = openColls.has(col.id);

          return (
            <div key={col.id} className="border border-white/10 rounded-lg">
              {/* Header — always visible, click to toggle */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02]"
                onClick={() => {
                  const next = new Set(openColls);
                  if (isOpen) next.delete(col.id); else next.add(col.id);
                  setOpenColls(next);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/20">{isOpen ? "▼" : "▶"}</span>
                  <div>
                    <span className="text-[13px] text-white/70 font-light">{col.city}</span>
                    <span className="text-[10px] text-white/25 font-light ml-3">{col.media.length} items</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {(col as any).tier && (
                    <span className={`text-[8px] tracking-[2px] font-light px-2 py-0.5 rounded ${
                      (col as any).tier === "high" ? "bg-purple-500/15 text-purple-400/70" : "bg-cyan-500/15 text-cyan-400/70"
                    }`}>
                      {((col as any).tier as string).toUpperCase()}
                    </span>
                  )}
                  <span className={`text-[9px] tracking-[2px] font-light px-2 py-1 rounded ${
                    isLive ? "bg-green-500/20 text-green-400" :
                    isScheduled ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-white/5 text-white/25"
                  }`}>
                    {isLive ? "LIVE" : isScheduled ? "SCHEDULED" : "DRAFT"}
                  </span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await togglePublished(col.id, !col.published);
                      fetchCollections();
                    }}
                    className={`px-3 py-1 text-[10px] tracking-[2px] border rounded cursor-pointer transition-colors ${
                      col.published
                        ? "border-green-500/30 text-green-400 hover:border-green-500/60"
                        : "border-white/10 text-white/30 hover:border-white/30"
                    }`}
                  >
                    {col.published ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              {/* Body — collapsible */}
              {isOpen && <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <input
                    type="text"
                    defaultValue={col.city}
                    onBlur={async (e) => {
                      const newCity = e.target.value.trim();
                      if (newCity && newCity !== col.city) {
                        if (!db) return;
                        await updateDoc(doc(db, "vault_collections", col.id), { city: newCity });
                        fetchCollections();
                      }
                    }}
                    className="text-[13px] text-white/70 font-light bg-transparent border-b border-white/10 hover:border-white/30 focus:border-white/50 outline-none w-full"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle (e.g. COS x NEW BALANCE)"
                    defaultValue={(col as any).subtitle || ""}
                    onBlur={async (e) => {
                      if (!db) return;
                      await updateDoc(doc(db, "vault_collections", col.id), { subtitle: e.target.value.trim() });
                      fetchCollections();
                    }}
                    className="text-[11px] text-white/50 font-light bg-transparent border-b border-white/5 hover:border-white/20 focus:border-white/40 outline-none w-full mt-1 placeholder:text-white/15"
                  />
                  <p className="text-[10px] text-white/25 font-light mt-1">
                    {col.id}
                  </p>
                </div>
              </div>

              {/* Tier selector */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] tracking-[1px] text-white/25">TIER</span>
                <div className="flex gap-1">
                  {(["none", "high", "daily"] as const).map((t) => {
                    const currentTier = (col as any).tier || "none";
                    const isActive = currentTier === t;
                    return (
                      <button
                        key={t}
                        onClick={async () => {
                          if (!db) return;
                          const { deleteField } = await import("firebase/firestore");
                          if (t === "none") {
                            await updateDoc(doc(db, "vault_collections", col.id), { tier: deleteField() });
                          } else {
                            await updateDoc(doc(db, "vault_collections", col.id), { tier: t });
                          }
                          fetchCollections();
                        }}
                        className={`px-3 py-1 text-[9px] tracking-[2px] rounded cursor-pointer transition-colors ${
                          isActive
                            ? t === "high" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : t === "daily" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : "bg-white/10 text-white/50 border border-white/20"
                            : "border border-white/10 text-white/20 hover:text-white/40"
                        }`}
                      >
                        {t.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule (BST) */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] tracking-[1px] text-white/25">SCHEDULE (BST)</span>
                <input
                  type="datetime-local"
                  defaultValue={col.publishAt ? new Date(col.publishAt.getTime() + 3600000).toISOString().slice(0, 16) : ""}
                  onChange={async (e) => {
                    if (e.target.value) {
                      // Input is BST, convert to UTC (-1hr)
                      const bst = new Date(e.target.value);
                      const utc = new Date(bst.getTime() - 3600000);
                      await setPublishSchedule(col.id, utc);
                    } else {
                      // Clear schedule → set publishAt to now (not null, so date is preserved)
                      await setPublishSchedule(col.id, new Date());
                    }
                    fetchCollections();
                  }}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white/60 font-light"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              {/* Override publishAt date */}
              <div className="flex items-center gap-3">
                <span className="text-[9px] tracking-[1px] text-white/25">DATE OVERRIDE</span>
                <input
                  type="date"
                  key={`${col.id}-${col.publishAt?.getTime() || 0}`}
                  defaultValue={col.publishAt ? col.publishAt.toISOString().slice(0, 10) : col.createdAt.toISOString().slice(0, 10)}
                  onChange={async (e) => {
                    if (e.target.value) {
                      // Use T00:00:00Z so it's always in the past for display date purposes
                      const d = new Date(e.target.value + "T00:00:00Z");
                      await setPublishSchedule(col.id, d);
                      fetchCollections();
                    }
                  }}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-white/60 font-light"
                  style={{ colorScheme: "dark" }}
                />
                <span className="text-[9px] text-white/20 font-light">
                  displayed as: {col.publishAt ? `${col.publishAt.getMonth() + 1}.${col.publishAt.getDate()}` : `${col.createdAt.getMonth() + 1}.${col.createdAt.getDate()}`}
                </span>
              </div>

              {/* Subtitle */}

              {/* Media thumbnails with hide/show */}
              <div className="mt-3">
                <p className="text-[9px] tracking-[2px] text-white/25 mb-2">
                  MEDIA ({col.media.filter((m: any) => !m.hidden).length}/{col.media.length} visible)
                </p>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5">
                  {col.media.map((m: any, idx: number) => (
                    <div key={idx} className={`relative rounded overflow-hidden cursor-pointer ${m.hidden ? 'opacity-25' : ''}`} onClick={() => m.type === 'image' && setPreviewImg(m.file)}>
                      {m.type === 'video' ? (
                        <div className="aspect-[3/4] relative bg-white/5">
                          <video src={`${m.file}#t=2`} className="w-full h-full object-cover" muted preload="metadata" />
                          <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[7px] text-white/50">VIDEO</div>
                        </div>
                      ) : (
                        <div className="aspect-[3/4] relative">
                          <img src={m.file} className="w-full h-full object-cover" loading="lazy" />
                          {(() => {
                            const lookMatch = m.file.match(/look(\d+)/);
                            return lookMatch ? (
                              <div className="absolute top-1 left-1 px-1 py-0.5 bg-black/60 rounded text-[7px] text-yellow-400/70">L{lookMatch[1]}</div>
                            ) : null;
                          })()}
                          <a
                            href={`/api/download?url=${encodeURIComponent(m.file)}&name=${col.id}_look${m.file.match(/look(\d+)/)?.[1] || idx}.jpg`}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-1 right-1 w-5 h-5 rounded bg-black/60 flex items-center justify-center text-[10px] text-white/50 hover:text-white/90"
                            title="Download"
                          >↓</a>
                        </div>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!db) return;
                          const newMedia = [...col.media];
                          newMedia[idx] = { ...newMedia[idx], hidden: !m.hidden };
                          await updateDoc(doc(db, "vault_collections", col.id), { media: newMedia });
                          fetchCollections();
                        }}
                        className={`absolute bottom-0 left-0 right-0 py-0.5 text-[7px] tracking-[1px] text-center cursor-pointer ${
                          m.hidden
                            ? 'bg-green-500/30 text-green-400'
                            : 'bg-black/60 text-white/40 hover:text-red-400'
                        }`}
                      >
                        {m.hidden ? 'SHOW' : 'HIDE'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Render Reel button */}
                {(() => {
                  const visibleImages = col.media.filter((m: any) => !m.hidden && m.type === 'image');
                  if (visibleImages.length < 6) return null;
                  return (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          const images = visibleImages.map((m: any) => m.file);
                          const title = col.city.split(/[-—_]/)[0]?.trim() || col.city;
                          const sub = (col as any).subtitle || col.city.split(/[-—_]/).slice(1).join(' ').trim() || '';
                          const now = new Date();
                          const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                          const day = now.getDate();
                          const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";

                          const config = {
                            images,
                            title,
                            subtitle: sub,
                            date: `${day}${suffix} ${months[now.getMonth()]}`,
                            bgmStartSec: 10,
                            collectionId: col.id,
                          };

                          const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `reel-config-${col.id}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-1.5 text-[9px] tracking-[2px] border border-cyan-500/30 rounded text-cyan-400/70 hover:bg-cyan-500/10 cursor-pointer transition-colors"
                      >
                        DOWNLOAD REEL CONFIG ({visibleImages.length} imgs)
                      </button>
                      <p className="text-[8px] text-white/20 mt-1">
                        npx tsx scripts/render-reel.ts --input config.json
                      </p>
                    </div>
                  );
                })()}
              </div>
              </div>}
            </div>
          );
        })}
      </div>

      {/* Users */}
      <h2 className="text-[14px] tracking-[6px] text-white/40 font-light mt-12 mb-2">
        USERS — CREDITS
      </h2>
      <p className="text-[11px] tracking-[2px] text-white/20 font-light mb-6">
        TOTAL ACCOUNTS: <span style={{ color: "var(--vault-cyan)" }}>{users.length}</span>
      </p>

      <div className="space-y-2 max-w-2xl">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 border border-white/10 rounded-lg"
          >
            <div>
              <p className="text-[12px] tracking-[1px] text-white/60 font-light">
                {user.displayName || user.email}
              </p>
              <p className="text-[10px] text-white/25 font-light">
                {user.email} · free used: {user.freeUsed}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] tracking-[1px] text-white/25 mr-1">PAID</span>
              <button
                onClick={() => updateUserCredits(user.id, Math.max(0, user.paidCredits - 10))}
                className="w-7 h-7 border border-white/15 rounded text-white/30 hover:border-white/30 hover:text-white/60 text-[10px] cursor-pointer"
              >
                -10
              </button>
              <button
                onClick={() => updateUserCredits(user.id, Math.max(0, user.paidCredits - 1))}
                className="w-6 h-6 border border-white/15 rounded text-white/30 hover:border-white/30 hover:text-white/60 text-[11px] cursor-pointer"
              >
                −
              </button>

              <span
                className="text-[22px] font-light tabular-nums w-14 text-center"
                style={{ color: user.paidCredits > 0 ? "var(--vault-cyan)" : "rgba(255,255,255,0.2)" }}
              >
                {user.paidCredits}
              </span>

              <button
                onClick={() => updateUserCredits(user.id, user.paidCredits + 1)}
                className="w-6 h-6 border border-white/15 rounded text-white/30 hover:border-white/30 hover:text-white/60 text-[11px] cursor-pointer"
              >
                +
              </button>
              <button
                onClick={() => updateUserCredits(user.id, user.paidCredits + 10)}
                className="w-7 h-7 border border-white/15 rounded text-white/30 hover:border-white/30 hover:text-white/60 text-[10px] cursor-pointer"
              >
                +10
              </button>
              <button
                onClick={() => updateUserCredits(user.id, user.paidCredits + 100)}
                className="w-8 h-7 border border-white/15 rounded text-white/30 hover:border-white/30 hover:text-white/60 text-[10px] cursor-pointer"
              >
                +100
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Articles */}
      <h2 className="text-[14px] tracking-[6px] text-white/40 font-light mt-12 mb-4">
        ARTICLES
      </h2>

      <button
        onClick={async () => {
          const id = await createArticle({
            title: "Untitled",
            coverImage: "",
            category: "Fashion",
            published: false,
            publishAt: null,
            tier: "high",
            blocks: [],
          });
          fetchArticles();
          setOpenArticles(new Set([id]));
        }}
        className="px-4 py-2 text-[10px] tracking-[3px] border border-white/20 rounded text-white/50 hover:text-white/80 hover:border-white/40 cursor-pointer transition-colors mb-4"
      >
        + NEW ARTICLE
      </button>

      <div className="space-y-2 max-w-2xl">
        {articles.map((article) => {
          const isOpen = openArticles.has(article.id);
          const now = new Date();
          const isScheduled = article.publishAt && article.publishAt > now;
          const isLive = article.published && (!article.publishAt || article.publishAt <= now);

          return (
            <div key={article.id} className="border border-white/10 rounded-lg">
              {/* Header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/[0.02]"
                onClick={() => {
                  const next = new Set(openArticles);
                  if (isOpen) next.delete(article.id); else next.add(article.id);
                  setOpenArticles(next);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/20">{isOpen ? "▼" : "▶"}</span>
                  <span className="text-[13px] text-white/70 font-light">{article.title || "Untitled"}</span>
                  <span className="text-[8px] tracking-[1px] text-white/25 px-1.5 py-0.5 rounded bg-white/5">{article.category}</span>
                  <span className="text-[10px] text-white/25">{article.blocks.length} blocks</span>
                </div>
                <div className="flex items-center gap-3">
                  {article.tier && (
                    <span className={`text-[8px] tracking-[2px] font-light px-2 py-0.5 rounded ${
                      article.tier === "high" ? "bg-purple-500/15 text-purple-400/70" : "bg-cyan-500/15 text-cyan-400/70"
                    }`}>
                      {article.tier.toUpperCase()}
                    </span>
                  )}
                  <span className={`text-[9px] tracking-[2px] font-light px-2 py-1 rounded ${
                    isLive ? "bg-green-500/20 text-green-400" :
                    isScheduled ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-white/5 text-white/25"
                  }`}>
                    {isLive ? "LIVE" : isScheduled ? "SCHEDULED" : "DRAFT"}
                  </span>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await toggleArticlePublished(article.id, !article.published);
                      fetchArticles();
                    }}
                    className={`px-3 py-1 text-[10px] tracking-[2px] border rounded cursor-pointer transition-colors ${
                      article.published
                        ? "border-green-500/30 text-green-400 hover:border-green-500/60"
                        : "border-white/10 text-white/30 hover:border-white/30"
                    }`}
                  >
                    {article.published ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              {/* Body — collapsible editor */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                  {/* Title */}
                  <div>
                    <label className="text-[9px] tracking-[1px] text-white/25 block mb-1">TITLE</label>
                    <input
                      type="text"
                      defaultValue={article.title}
                      onBlur={async (e) => {
                        const v = e.target.value.trim();
                        if (v !== article.title) {
                          await updateArticle(article.id, { title: v });
                          fetchArticles();
                        }
                      }}
                      className="w-full text-[14px] text-white/80 font-light bg-transparent border-b border-white/10 hover:border-white/30 focus:border-white/50 outline-none py-1"
                    />
                  </div>

                  {/* Cover image removed — use a HERO (full-bleed) block at the top instead */}

                  {/* Category + Tier */}
                  <div className="flex gap-6">
                    <div>
                      <label className="text-[9px] tracking-[1px] text-white/25 block mb-1">CATEGORY</label>
                      <div className="flex gap-1">
                        {(["Fashion", "Art", "Lifestyle", "Culture", "Interview"] as ArticleCategory[]).map((cat) => (
                          <button
                            key={cat}
                            onClick={async () => {
                              await updateArticle(article.id, { category: cat });
                              fetchArticles();
                            }}
                            className={`px-2 py-1 text-[9px] tracking-[1px] rounded cursor-pointer transition-colors ${
                              article.category === cat
                                ? "bg-white/15 text-white/70 border border-white/20"
                                : "border border-white/10 text-white/25 hover:text-white/40"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] tracking-[1px] text-white/25 block mb-1">TIER</label>
                      <div className="flex gap-1">
                        {(["high", "daily"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={async () => {
                              await updateArticle(article.id, { tier: t });
                              fetchArticles();
                            }}
                            className={`px-3 py-1 text-[9px] tracking-[2px] rounded cursor-pointer transition-colors ${
                              article.tier === t
                                ? t === "high" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                                : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                : "border border-white/10 text-white/20 hover:text-white/40"
                            }`}
                          >
                            {t.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Blocks */}
                  <div>
                    <label className="text-[9px] tracking-[1px] text-white/25 block mb-2">BLOCKS</label>
                    <div className="space-y-2">
                      {article.blocks.map((block, idx) => (
                        <div key={block.id} className="border border-white/8 rounded p-3 relative group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[8px] tracking-[2px] text-white/30">{block.type.toUpperCase()}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {idx > 0 && (
                                <button
                                  onClick={async () => {
                                    const newBlocks = [...article.blocks];
                                    [newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]];
                                    await updateArticle(article.id, { blocks: newBlocks });
                                    fetchArticles();
                                  }}
                                  className="w-5 h-5 text-[9px] text-white/30 hover:text-white/60 cursor-pointer"
                                >↑</button>
                              )}
                              {idx < article.blocks.length - 1 && (
                                <button
                                  onClick={async () => {
                                    const newBlocks = [...article.blocks];
                                    [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
                                    await updateArticle(article.id, { blocks: newBlocks });
                                    fetchArticles();
                                  }}
                                  className="w-5 h-5 text-[9px] text-white/30 hover:text-white/60 cursor-pointer"
                                >↓</button>
                              )}
                              <button
                                onClick={async () => {
                                  if (!confirm("Delete this block?")) return;
                                  const newBlocks = article.blocks.filter((_, i) => i !== idx);
                                  await updateArticle(article.id, { blocks: newBlocks });
                                  fetchArticles();
                                }}
                                className="w-5 h-5 text-[9px] text-red-400/40 hover:text-red-400/80 cursor-pointer"
                              >×</button>
                            </div>
                          </div>

                          {/* Block editor by type */}
                          {block.type === "fullBleed" && (
                            <div className="space-y-2">
                              <ImageDropZone
                                currentUrl={(block as any).image}
                                label="DROP HERO IMAGE"
                                previewHeight="h-20"
                                onUploaded={async (url) => {
                                  const newBlocks = [...article.blocks];
                                  (newBlocks[idx] as any).image = url;
                                  await updateArticle(article.id, { blocks: newBlocks });
                                  fetchArticles();
                                }}
                              />
                              <input
                                type="text"
                                defaultValue={(block as any).heading}
                                placeholder="Heading (optional)"
                                onBlur={async (e) => {
                                  const newBlocks = [...article.blocks];
                                  (newBlocks[idx] as any).heading = e.target.value.trim();
                                  await updateArticle(article.id, { blocks: newBlocks });
                                  fetchArticles();
                                }}
                                className="w-full text-[10px] text-white/50 bg-transparent border-b border-white/8 focus:border-white/30 outline-none py-1 placeholder:text-white/15"
                              />
                            </div>
                          )}

                          {block.type === "textImage" && (
                            <div className="space-y-2">
                              <textarea
                                defaultValue={(block as any).body}
                                placeholder="Body text"
                                rows={3}
                                onBlur={async (e) => {
                                  const newBlocks = [...article.blocks];
                                  (newBlocks[idx] as any).body = e.target.value;
                                  await updateArticle(article.id, { blocks: newBlocks });
                                  fetchArticles();
                                }}
                                className="w-full text-[10px] text-white/50 bg-transparent border border-white/8 focus:border-white/30 outline-none p-2 rounded resize-y placeholder:text-white/15"
                              />
                              <ImageDropZone
                                currentUrl={(block as any).image}
                                label="DROP IMAGE"
                                previewHeight="h-16"
                                onUploaded={async (url) => {
                                  const newBlocks = [...article.blocks];
                                  (newBlocks[idx] as any).image = url;
                                  await updateArticle(article.id, { blocks: newBlocks });
                                  fetchArticles();
                                }}
                              />
                              <div className="flex gap-1">
                                {(["left", "right"] as const).map((s) => (
                                  <button
                                    key={s}
                                    onClick={async () => {
                                      const newBlocks = [...article.blocks];
                                      (newBlocks[idx] as any).side = s;
                                      await updateArticle(article.id, { blocks: newBlocks });
                                      fetchArticles();
                                    }}
                                    className={`px-2 py-0.5 text-[8px] tracking-[1px] rounded cursor-pointer ${
                                      (block as any).side === s ? "bg-white/15 text-white/60" : "text-white/20 hover:text-white/40"
                                    }`}
                                  >IMG {s.toUpperCase()}</button>
                                ))}
                              </div>
                            </div>
                          )}

                          {block.type === "gallery" && (
                            <GalleryDropZone
                              images={(block as any).images || []}
                              onUpdated={async (urls) => {
                                const newBlocks = [...article.blocks];
                                (newBlocks[idx] as any).images = urls;
                                await updateArticle(article.id, { blocks: newBlocks });
                                fetchArticles();
                              }}
                            />
                          )}

                          {block.type === "quote" && (
                            <div className="space-y-2">
                              <textarea
                                defaultValue={(block as any).text}
                                placeholder="Quote text"
                                rows={2}
                                onBlur={async (e) => {
                                  const newBlocks = [...article.blocks];
                                  (newBlocks[idx] as any).text = e.target.value;
                                  await updateArticle(article.id, { blocks: newBlocks });
                                  fetchArticles();
                                }}
                                className="w-full text-[10px] text-white/50 bg-transparent border border-white/8 focus:border-white/30 outline-none p-2 rounded resize-y placeholder:text-white/15 italic"
                              />
                              <input
                                type="text"
                                defaultValue={(block as any).attribution}
                                placeholder="Attribution (optional)"
                                onBlur={async (e) => {
                                  const newBlocks = [...article.blocks];
                                  (newBlocks[idx] as any).attribution = e.target.value.trim();
                                  await updateArticle(article.id, { blocks: newBlocks });
                                  fetchArticles();
                                }}
                                className="w-full text-[10px] text-white/50 bg-transparent border-b border-white/8 focus:border-white/30 outline-none py-1 placeholder:text-white/15"
                              />
                            </div>
                          )}

                          {block.type === "textOnly" && (
                            <textarea
                              defaultValue={(block as any).body}
                              placeholder="Body text"
                              rows={4}
                              onBlur={async (e) => {
                                const newBlocks = [...article.blocks];
                                (newBlocks[idx] as any).body = e.target.value;
                                await updateArticle(article.id, { blocks: newBlocks });
                                fetchArticles();
                              }}
                              className="w-full text-[10px] text-white/50 bg-transparent border border-white/8 focus:border-white/30 outline-none p-2 rounded resize-y placeholder:text-white/15"
                            />
                          )}

                          {block.type === "video" && (
                            <div className="space-y-2">
                              <input
                                type="text"
                                defaultValue={(block as any).src}
                                placeholder="Cloudflare Stream ID or video URL"
                                onBlur={async (e) => {
                                  const newBlocks = [...article.blocks];
                                  (newBlocks[idx] as any).src = e.target.value.trim();
                                  await updateArticle(article.id, { blocks: newBlocks });
                                  fetchArticles();
                                }}
                                className="w-full text-[10px] text-white/50 bg-transparent border-b border-white/8 focus:border-white/30 outline-none py-1 placeholder:text-white/15"
                              />
                              <input
                                type="text"
                                defaultValue={(block as any).caption}
                                placeholder="Caption (optional)"
                                onBlur={async (e) => {
                                  const newBlocks = [...article.blocks];
                                  (newBlocks[idx] as any).caption = e.target.value.trim();
                                  await updateArticle(article.id, { blocks: newBlocks });
                                  fetchArticles();
                                }}
                                className="w-full text-[10px] text-white/50 bg-transparent border-b border-white/8 focus:border-white/30 outline-none py-1 placeholder:text-white/15"
                              />
                              <p className="text-[8px] text-white/20">Stream ID (32文字の英数字) → iframe埋め込み / URL → videoタグ再生</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add block buttons */}
                    <div className="flex gap-1 mt-3">
                      {(["fullBleed", "textImage", "gallery", "quote", "textOnly", "video"] as BlockType[]).map((type) => (
                        <button
                          key={type}
                          onClick={async () => {
                            const blockId = `b_${Date.now()}`;
                            const newBlock: any = { id: blockId, type };
                            if (type === "fullBleed") { newBlock.image = ""; newBlock.heading = ""; }
                            if (type === "textImage") { newBlock.body = ""; newBlock.image = ""; newBlock.side = "right"; }
                            if (type === "gallery") { newBlock.images = []; }
                            if (type === "quote") { newBlock.text = ""; newBlock.attribution = ""; }
                            if (type === "textOnly") { newBlock.body = ""; }
                            if (type === "video") { newBlock.src = ""; newBlock.caption = ""; }
                            const newBlocks = [...article.blocks, newBlock];
                            await updateArticle(article.id, { blocks: newBlocks });
                            fetchArticles();
                          }}
                          className="px-2 py-1 text-[8px] tracking-[1px] border border-white/10 rounded text-white/25 hover:text-white/50 hover:border-white/25 cursor-pointer transition-colors"
                        >
                          + {type === "fullBleed" ? "HERO" : type === "textImage" ? "TEXT+IMG" : type === "textOnly" ? "TEXT" : type.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Delete article */}
                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${article.title}"?`)) return;
                        await deleteArticle(article.id);
                        fetchArticles();
                      }}
                      className="px-3 py-1 text-[9px] tracking-[1px] border border-red-900/30 rounded text-red-400/40 hover:text-red-400/70 cursor-pointer"
                    >
                      DELETE ARTICLE
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {articles.length === 0 && (
        <p className="text-white/20 text-[12px] mt-2">
          No articles yet. Create your first one above.
        </p>
      )}

      {/* Image Preview Modal */}
      {previewImg && (
        <div
          className="fixed inset-0 bg-black/80 z-[999] flex flex-col items-center justify-center gap-4 cursor-pointer"
          onClick={() => setPreviewImg(null)}
        >
          <img
            src={previewImg}
            alt="Preview"
            className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewImg(null)}
            className="px-6 py-2 rounded-full bg-white/15 text-white/70 hover:bg-white/25 text-[12px] tracking-[3px] cursor-pointer"
          >CLOSE</button>
        </div>
      )}
    </div>
  );
}
