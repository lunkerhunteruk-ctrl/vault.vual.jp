import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VaultUser } from './auth';
import { syncCreditsToFirestore } from './auth';

const GUEST_FREE = 1;
const MEMBER_FREE = 5;

interface VaultStore {
  user: VaultUser | null;
  setUser: (user: VaultUser | null) => void;

  freeUsed: number;
  paidCredits: number;
  incrementGeneration: () => void;
  addPaidCredits: (amount: number) => void;

  canGenerate: () => boolean;
  freeRemaining: () => number;
  totalRemaining: () => number;
}

function syncToFirestore(state: { user: VaultUser | null; paidCredits: number; freeUsed: number }) {
  if (state.user) {
    syncCreditsToFirestore(state.user.id, state.paidCredits, state.freeUsed).catch(() => {});
  }
}

export const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => {
        if (user) {
          // Merge: take the higher freeUsed (local or Firestore) to prevent reset
          // Take the higher paidCredits from Firestore (server is source of truth for purchases)
          const localFreeUsed = get().freeUsed;
          const mergedFreeUsed = Math.max(localFreeUsed, user.freeUsed);
          const mergedPaidCredits = Math.max(get().paidCredits, user.paidCredits);
          set({ user, paidCredits: mergedPaidCredits, freeUsed: mergedFreeUsed });
          // Sync merged state back to Firestore
          syncToFirestore({ user, paidCredits: mergedPaidCredits, freeUsed: mergedFreeUsed });
        } else {
          set({ user: null });
        }
      },

      freeUsed: 0,
      paidCredits: 0,

      incrementGeneration: () => {
        const { user, freeUsed, paidCredits } = get();
        const freeMax = user ? MEMBER_FREE : GUEST_FREE;

        if (freeUsed < freeMax) {
          const newState = { freeUsed: freeUsed + 1 };
          set(newState);
          syncToFirestore({ user, paidCredits, freeUsed: newState.freeUsed });
        } else if (paidCredits > 0) {
          const newState = { paidCredits: paidCredits - 1 };
          set(newState);
          syncToFirestore({ user, paidCredits: newState.paidCredits, freeUsed });
        }
      },

      addPaidCredits: (amount) => {
        const { user, freeUsed, paidCredits } = get();
        const newPaid = paidCredits + amount;
        set({ paidCredits: newPaid });
        syncToFirestore({ user, paidCredits: newPaid, freeUsed });
      },

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
