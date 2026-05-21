"use client";

import { useState, useRef, useEffect } from "react";
import { useVaultStore } from "@/lib/store";
import { signOutVault } from "@/lib/auth";
import { AuthModal } from "./AuthModal";
import { CreditSheet } from "./CreditSheet";

export function UserBadge() {
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = useVaultStore((s) => s.user);
  const setUser = useVaultStore((s) => s.setUser);
  const freeRemaining = useVaultStore((s) => s.freeRemaining);
  const paidCredits = useVaultStore((s) => s.paidCredits);
  const totalRemaining = useVaultStore((s) => s.totalRemaining);

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const free = freeRemaining();
  const total = totalRemaining();

  return (
    <>
      <div className="fixed top-5 right-5 z-50" ref={menuRef}>
        {/* Avatar button */}
        <button
          onClick={() => (user ? setOpen(!open) : setShowAuth(true))}
          className="w-9 h-9 rounded-full overflow-hidden border border-white/20 hover:border-white/40 transition-colors flex items-center justify-center bg-white/5"
        >
          {user?.photoURL ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.photoURL}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4.418 3.582-7 8-7s8 2.582 8 7" />
            </svg>
          )}
        </button>

        {/* Dropdown menu */}
        {open && user && (
          <div className="absolute top-12 right-0 w-56 bg-[#111] border border-white/10 rounded-xl p-4 space-y-4 shadow-2xl">
            {/* User info */}
            <div className="space-y-1">
              <p className="text-[12px] text-white/80 font-light truncate">
                {user.displayName || user.email}
              </p>
              <p className="text-[10px] text-white/30 font-light truncate">
                {user.email}
              </p>
            </div>

            <div className="h-[1px] bg-white/10" />

            {/* Credits */}
            <div className="space-y-2">
              <p className="text-[10px] tracking-[3px] text-white/40 font-light">
                CREDITS
              </p>
              <div className="flex justify-between text-[11px] font-light">
                <span className="text-white/40">Free</span>
                <span style={{ color: free > 0 ? "var(--vault-cyan)" : "rgba(255,255,255,0.2)" }}>
                  {free}
                </span>
              </div>
              <div className="flex justify-between text-[11px] font-light">
                <span className="text-white/40">Paid</span>
                <span style={{ color: paidCredits > 0 ? "var(--vault-cyan)" : "rgba(255,255,255,0.2)" }}>
                  {paidCredits}
                </span>
              </div>
              <div className="h-[1px] bg-white/5" />
              <div className="flex justify-between text-[11px] font-light">
                <span className="text-white/50">Total</span>
                <span className="text-white/70">{total}</span>
              </div>
            </div>

            {/* Buy credits */}
            <button
              onClick={() => {
                setOpen(false);
                setShowCredits(true);
              }}
              className="w-full py-2.5 text-[10px] tracking-[3px] font-light border border-[var(--vault-cyan)]/20 hover:border-[var(--vault-cyan)]/50 text-[var(--vault-cyan)] rounded-lg transition-colors"
            >
              + BUY CREDITS
            </button>

            <div className="h-[1px] bg-white/10" />

            {/* Sign out */}
            <button
              onClick={async () => {
                await signOutVault();
                setUser(null);
                setOpen(false);
              }}
              className="w-full text-left text-[10px] tracking-[2px] text-white/30 hover:text-white/50 transition-colors font-light"
            >
              SIGN OUT
            </button>
          </div>
        )}
      </div>

      <AuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
      />

      <CreditSheet
        open={showCredits}
        onClose={() => setShowCredits(false)}
      />
    </>
  );
}
