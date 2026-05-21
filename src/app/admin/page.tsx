"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface InjectionData {
  remaining: number;
  initial: number;
}

export default function AdminPage() {
  const [counts, setCounts] = useState<Record<string, InjectionData>>({});
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    if (!db) return;
    const snapshot = await getDocs(collection(db, "injection_counts"));
    const data: Record<string, InjectionData> = {};
    snapshot.forEach((d) => {
      const val = d.data();
      data[d.id] = { remaining: val.remaining ?? 0, initial: val.initial ?? 0 };
    });
    setCounts(data);
    setLoading(false);
  };

  useEffect(() => { fetchCounts(); }, []);

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

  const reset = async (lookId: string) => {
    if (!db) return;
    const ref = doc(db, "injection_counts", lookId);
    const snap = await getDoc(ref);
    const initial = snap.exists() ? snap.data()?.initial || 5 : 5;
    await setDoc(ref, { remaining: initial, initial }, { merge: true });
    fetchCounts();
  };

  if (loading) return <div className="p-8 text-white/40">Loading...</div>;

  const sorted = Object.entries(counts).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <h1 className="text-[14px] tracking-[6px] text-white/40 font-light mb-8">
        VAULT ADMIN — INJECTION COUNTS
      </h1>

      <div className="space-y-2 max-w-2xl">
        {sorted.map(([lookId, data]) => (
          <div
            key={lookId}
            className="flex items-center justify-between p-4 border border-white/10 rounded-lg"
          >
            <div>
              <p className="text-[12px] tracking-[1px] text-white/60 font-light">
                {lookId}
              </p>
              <p className="text-[10px] text-white/25 font-light">
                initial: {data.initial}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Initial control */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] tracking-[1px] text-white/25 mr-1">INIT</span>
                <button
                  onClick={() => updateInitial(lookId, Math.max(1, data.initial - 1))}
                  className="w-6 h-6 border border-white/10 rounded text-white/25 hover:border-white/30 hover:text-white/50 text-[11px] cursor-pointer"
                >
                  −
                </button>
                <span className="text-[14px] font-light tabular-nums w-6 text-center text-white/40">
                  {data.initial}
                </span>
                <button
                  onClick={() => updateInitial(lookId, data.initial + 1)}
                  className="w-6 h-6 border border-white/10 rounded text-white/25 hover:border-white/30 hover:text-white/50 text-[11px] cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="w-[1px] h-6 bg-white/10" />

              {/* Remaining control */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateCount(lookId, Math.max(0, data.remaining - 1))}
                  className="w-8 h-8 border border-white/20 rounded text-white/40 hover:border-white/40 hover:text-white/70 text-[14px] cursor-pointer"
                >
                  −
                </button>

                <span
                  className="text-[24px] font-light tabular-nums w-10 text-center"
                  style={{
                    color: data.remaining > 0 ? "var(--vault-cyan)" : "#ef4444",
                  }}
                >
                  {data.remaining}
                </span>

                <button
                  onClick={() => updateCount(lookId, data.remaining + 1)}
                  className="w-8 h-8 border border-white/20 rounded text-white/40 hover:border-white/40 hover:text-white/70 text-[14px] cursor-pointer"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => reset(lookId)}
                className="ml-1 px-3 py-1 text-[9px] tracking-[2px] border border-white/10 rounded text-white/25 hover:border-white/30 hover:text-white/50 cursor-pointer"
              >
                RESET
              </button>
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="text-white/20 text-[12px]">
          No injection counts yet. Generate some images first.
        </p>
      )}
    </div>
  );
}
