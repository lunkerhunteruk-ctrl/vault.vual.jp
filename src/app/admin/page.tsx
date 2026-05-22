"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("key") === ADMIN_KEY) {
      setAuthorized(true);
    }
  }, []);

  const fetchCounts = async () => {
    if (!db) return;
    const snapshot = await getDocs(collection(db, "injection_counts"));
    const data: Record<string, InjectionData> = {};
    snapshot.forEach((d) => {
      const val = d.data();
      data[d.id] = { remaining: val.remaining ?? 0, initial: val.initial ?? 0 };
    });
    setCounts(data);
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

  useEffect(() => {
    Promise.all([fetchCounts(), fetchUsers()]).then(() => setLoading(false));
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
                  onClick={() => updateInitial(lookId, Math.max(0, data.initial - 1))}
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
    </div>
  );
}
