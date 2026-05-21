"use client";

import { useState, useEffect } from "react";

const ADMIN_KEY = "vault-admin-2026";

interface InjectionData {
  remaining: number;
  initial: number;
}

export default function AdminPage() {
  const [counts, setCounts] = useState<Record<string, InjectionData>>({});
  const [loading, setLoading] = useState(true);

  const fetchCounts = async () => {
    const res = await fetch(`/api/admin/injections?key=${ADMIN_KEY}`);
    const data = await res.json();
    setCounts(data.counts || {});
    setLoading(false);
  };

  useEffect(() => { fetchCounts(); }, []);

  const updateCount = async (lookId: string, remaining: number) => {
    await fetch(`/api/admin/injections?key=${ADMIN_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lookId, remaining }),
    });
    fetchCounts();
  };

  const decrement = async (lookId: string, amount: number) => {
    await fetch(`/api/admin/injections?key=${ADMIN_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lookId, action: "decrement", amount }),
    });
    fetchCounts();
  };

  const reset = async (lookId: string) => {
    await fetch(`/api/admin/injections?key=${ADMIN_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lookId, action: "reset" }),
    });
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

            <div className="flex items-center gap-3">
              <button
                onClick={() => decrement(lookId, 1)}
                className="w-8 h-8 border border-white/20 rounded text-white/40 hover:border-white/40 hover:text-white/70 text-[14px]"
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
                className="w-8 h-8 border border-white/20 rounded text-white/40 hover:border-white/40 hover:text-white/70 text-[14px]"
              >
                +
              </button>

              <button
                onClick={() => reset(lookId)}
                className="ml-2 px-3 py-1 text-[9px] tracking-[2px] border border-white/10 rounded text-white/25 hover:border-white/30 hover:text-white/50"
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
