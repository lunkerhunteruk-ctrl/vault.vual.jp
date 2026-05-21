import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VaultUser } from './auth';

const GUEST_FREE = 1;
const MEMBER_FREE = 5;

interface VaultStore {
  // Auth
  user: VaultUser | null;
  setUser: (user: VaultUser | null) => void;

  // Generation tracking
  freeUsed: number;        // free generations used
  paidCredits: number;     // purchased credits remaining
  incrementGeneration: () => void;
  addPaidCredits: (amount: number) => void;

  // Derived
  canGenerate: () => boolean;
  freeRemaining: () => number;
  totalRemaining: () => number;
}

export const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),

      freeUsed: 0,
      paidCredits: 0,

      incrementGeneration: () => {
        const { user, freeUsed, paidCredits } = get();
        const freeMax = user ? MEMBER_FREE : GUEST_FREE;

        if (freeUsed < freeMax) {
          // Use free credit first
          set({ freeUsed: freeUsed + 1 });
        } else if (paidCredits > 0) {
          // Then paid credits
          set({ paidCredits: paidCredits - 1 });
        }
      },

      addPaidCredits: (amount) => set((s) => ({ paidCredits: s.paidCredits + amount })),

      canGenerate: () => {
        const { user, freeUsed, paidCredits } = get();
        const freeMax = user ? MEMBER_FREE : GUEST_FREE;
        return freeUsed < freeMax || paidCredits > 0;
      },

      freeRemaining: () => {
        const { user, freeUsed } = get();
        const freeMax = user ? MEMBER_FREE : GUEST_FREE;
        return Math.max(0, freeMax - freeUsed);
      },

      totalRemaining: () => {
        const { user, freeUsed, paidCredits } = get();
        const freeMax = user ? MEMBER_FREE : GUEST_FREE;
        return Math.max(0, freeMax - freeUsed) + paidCredits;
      },
    }),
    {
      name: 'vault-store',
      partialize: (state) => ({
        user: state.user,
        freeUsed: state.freeUsed,
        paidCredits: state.paidCredits,
      }),
    }
  )
);
