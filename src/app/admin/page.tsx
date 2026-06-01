"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, getDoc, setDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAllCollections, togglePublished, setPublishSchedule, VaultCollection } from "@/lib/collections";

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

  // Pool selection state — independent sets for collection and reel
  const [collectionShots, setCollectionShots] = useState<Set<string>>(new Set()); // "poolId:shotIndex"
  const [reelShots, setReelShots] = useState<Set<string>>(new Set());
  const [publishCity, setPublishCity] = useState("");
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [openColls, setOpenColls] = useState<Set<string>>(new Set());
  const [openInjGroups, setOpenInjGroups] = useState<Set<string>>(new Set());

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
    Promise.all([fetchCounts(), fetchUsers(), fetchCollections(), fetchPools()]).then(() => setLoading(false));
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

  return (
    <div className="vault-admin min-h-screen bg-[#0a0a0a] text-white p-8">
      <h1 className="text-[14px] tracking-[6px] text-white/40 font-light mb-8">
        VAULT ADMIN — INJECTION COUNTS
      </h1>

      <div className="space-y-2 max-w-2xl">
        {Object.entries(injGroups).map(([groupName, items]) => {
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
        {colls.map((col) => {
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
                  <p className="text-[10px] text-white/25 font-light mt-1">
                    {col.id}
                  </p>
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
                      await setPublishSchedule(col.id, null);
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
                  defaultValue={col.publishAt ? col.publishAt.toISOString().slice(0, 10) : col.createdAt.toISOString().slice(0, 10)}
                  onChange={async (e) => {
                    if (e.target.value) {
                      const d = new Date(e.target.value + "T12:00:00Z");
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
              </div>}
            </div>
          );
        })}
      </div>

      {/* Pool Selection */}
      <h2 className="text-[14px] tracking-[6px] text-white/40 font-light mt-12 mb-6">
        POOL — SELECT &amp; PUBLISH
      </h2>

      {pools.length === 0 ? (
        <p className="text-white/20 text-[12px] mb-8">No pools yet. Run batch-generate first.</p>
      ) : (
        <div className="max-w-4xl space-y-6 mb-12">
          {/* Selection counters */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
              <span className="text-[10px] text-white/50 font-light">
                COLLECTION: <span className={collectionShots.size > 0 ? "text-green-400" : ""}>{collectionShots.size}</span>/6
              </span>
              {collectionShots.size > 0 && (
                <button onClick={() => setCollectionShots(new Set())} className="text-[8px] text-white/25 hover:text-white/50 cursor-pointer">[clear]</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
              <span className="text-[10px] text-white/50 font-light">
                REEL: <span className={reelShots.size > 0 ? "text-cyan-400" : ""}>{reelShots.size}</span>/8-10
              </span>
              {reelShots.size > 0 && (
                <button onClick={() => setReelShots(new Set())} className="text-[8px] text-white/25 hover:text-white/50 cursor-pointer">[clear]</button>
              )}
            </div>
            <p className="text-[9px] text-white/20 font-light">Left-click = Collection (green) · Right-click = Reel (cyan) · Both OK on same image</p>
          </div>

          {/* Collection action bar */}
          {collectionShots.size > 0 && (
            <div className="flex items-center gap-3 p-3 border border-green-500/20 rounded-lg bg-green-500/5">
              <input
                type="text"
                placeholder="City name (e.g. KAGURAZAKA — DAILY)"
                value={publishCity}
                onChange={(e) => setPublishCity(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-[12px] text-white/70 font-light placeholder:text-white/20 outline-none focus:border-white/30"
              />
              <button
                onClick={async () => {
                  if (!db || !publishCity.trim()) return;
                  if (collectionShots.size !== 6) {
                    alert(`Select exactly 6 shots for collection. Currently: ${collectionShots.size}`);
                    return;
                  }

                  const media: { file: string; type: string; aspect: string; isHero?: boolean }[] = [];
                  const sortedShots = Array.from(collectionShots).sort();
                  sortedShots.forEach((key, idx) => {
                    const [poolId, shotIdx] = key.split(":");
                    const pool = pools.find(p => p.id === poolId);
                    const shot = pool?.media.find(m => m.shotIndex === Number(shotIdx));
                    if (shot) {
                      media.push({
                        file: shot.file,
                        type: "image",
                        aspect: "3:4",
                        ...(idx === 0 ? { isHero: true } : {}),
                      });
                    }
                  });

                  const now = new Date();
                  const dd = String(now.getDate()).padStart(2, "0");
                  const mm = String(now.getMonth() + 1).padStart(2, "0");
                  const yyyy = now.getFullYear();
                  const slug = publishCity.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");
                  const collId = `${dd}-${mm}-${yyyy}_${slug}`;

                  await setDoc(doc(db, "vault_collections", collId), {
                    city: publishCity.trim(),
                    published: false,
                    publishAt: null,
                    createdAt: Timestamp.now(),
                    media,
                  });

                  alert(`Collection created: ${collId} (${media.length} items, DRAFT)`);
                  setCollectionShots(new Set());
                  setPublishCity("");
                  fetchCollections();
                }}
                disabled={collectionShots.size !== 6 || !publishCity.trim()}
                className="px-4 py-1.5 text-[10px] tracking-[2px] border border-green-500/40 rounded text-green-400 hover:bg-green-500/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                CREATE COLLECTION
              </button>
            </div>
          )}

          {/* Reel action bar */}
          {reelShots.size > 0 && (
            <div className="p-3 border border-cyan-500/20 rounded-lg bg-cyan-500/5 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Title (e.g. Kagurazaka)"
                  value={publishCity}
                  onChange={(e) => setPublishCity(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-[12px] text-white/70 font-light placeholder:text-white/20 outline-none focus:border-white/30"
                />
                <button
                  onClick={() => {
                    const imageUrls = Array.from(reelShots).sort().map((key) => {
                      const [poolId, shotIdx] = key.split(":");
                      const pool = pools.find(p => p.id === poolId);
                      const shot = pool?.media.find(m => m.shotIndex === Number(shotIdx));
                      return shot?.file || "";
                    }).filter(Boolean);

                    const now = new Date();
                    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                    const day = now.getDate();
                    const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";

                    const config = {
                      images: imageUrls,
                      title: publishCity || "Untitled",
                      date: `${day}${suffix} ${months[now.getMonth()]}`,
                      bgmStartSec: 10,
                      collectionId: "",
                    };

                    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `reel-config-${publishCity.toLowerCase().replace(/\s+/g, "-") || "untitled"}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={reelShots.size < 6}
                  className="px-4 py-1.5 text-[10px] tracking-[2px] border border-cyan-500/40 rounded text-cyan-400 hover:bg-cyan-500/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  DOWNLOAD CONFIG
                </button>
              </div>
              <p className="text-[9px] text-white/25 font-light">
                Run: <code className="text-white/40">npx tsx scripts/render-reel.ts --input reel-config.json</code>
              </p>
            </div>
          )}

          {/* Pool grids */}
          {pools.map((pool) => (
            <div key={pool.id} className="border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[12px] text-white/60 font-light tracking-[1px]">
                    {pool.city} — {pool.location}
                  </p>
                  <p className="text-[9px] text-white/25 font-light">
                    {pool.id} · {pool.shotCount}/{pool.totalPlanned} shots · {pool.film}
                    {pool.provocative ? " · PROVOCATIVE" : ""}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (!db) return;
                    if (!confirm(`Delete pool "${pool.id}"?`)) return;
                    await deleteDoc(doc(db, "vault_pools", pool.id));
                    fetchPools();
                  }}
                  className="px-2 py-1 text-[9px] tracking-[1px] border border-red-900/30 rounded text-red-400/40 hover:text-red-400/70 cursor-pointer"
                >
                  DELETE
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {pool.media.map((shot) => {
                  const key = `${pool.id}:${shot.shotIndex}`;
                  const inCollection = collectionShots.has(key);
                  const inReel = reelShots.has(key);
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        // Left click → collection
                        const next = new Set(collectionShots);
                        if (inCollection) {
                          next.delete(key);
                        } else if (next.size < 6) {
                          next.add(key);
                        }
                        setCollectionShots(next);
                      }}
                      onContextMenu={(e) => {
                        // Right click → reel
                        e.preventDefault();
                        const next = new Set(reelShots);
                        if (inReel) {
                          next.delete(key);
                        } else if (next.size < 10) {
                          next.add(key);
                        }
                        setReelShots(next);
                      }}
                      className={`relative aspect-[3/4] rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                        inCollection && inReel
                          ? "border-yellow-400 ring-1 ring-yellow-400/30"
                          : inCollection
                          ? "border-green-500 ring-1 ring-green-500/30"
                          : inReel
                          ? "border-cyan-500 ring-1 ring-cyan-500/30"
                          : "border-transparent hover:border-white/20"
                      }`}
                    >
                      <img
                        src={shot.file}
                        alt={`Shot ${shot.shotIndex}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onMouseDown={(e) => {
                          const timer = setTimeout(() => { setPreviewImg(shot.file); }, 400);
                          const cancel = () => { clearTimeout(timer); window.removeEventListener('mouseup', cancel); };
                          window.addEventListener('mouseup', cancel);
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 flex justify-between">
                        <span className="text-[8px] text-white/50 font-light">#{shot.shotIndex}</span>
                        {shot.lookNum && <span className="text-[8px] text-yellow-400/70 font-light">L{shot.lookNum}</span>}
                      </div>
                      {/* Collection badge (top-right) */}
                      {inCollection && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-green-500 text-black">
                          {Array.from(collectionShots).sort().indexOf(key) + 1}
                        </div>
                      )}
                      {/* Reel badge (top-left) */}
                      {inReel && (
                        <div className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-cyan-500 text-black">
                          {Array.from(reelShots).sort().indexOf(key) + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

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

      {/* Image Preview Modal */}
      {previewImg && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center cursor-pointer"
          onClick={() => setPreviewImg(null)}
        >
          <img
            src={previewImg}
            alt="Preview"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
