import { doc, getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Convert file path to Firestore-safe doc ID
// e.g. "https://...r2.dev/vault/collections/20-05-2026/look1.jpg" → "20-05-2026_look1"
export function lookFileToId(file: string): string {
  const match = file.match(/(\d{2}-\d{2}-\d{4})\/look(\d+)\.jpg/);
  if (match) return `${match[1]}_look${match[2]}`;
  return file.replace(/[^a-zA-Z0-9]/g, '_');
}

// Seeded random for initial count (5-12), same logic as grid display
function seededInitialCount(lookId: string): number {
  let hash = 0;
  for (let i = 0; i < lookId.length; i++) {
    hash = ((hash << 5) - hash) + lookId.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.sin(hash * 9301 + 49297) * 49297;
  return 5 + Math.floor((seed - Math.floor(seed)) * 8);
}

// Get remaining injections for a look
export async function getRemainingInjections(lookId: string): Promise<number> {
  if (!db) return 0;
  const ref = doc(db, 'injection_counts', lookId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().remaining ?? 0;
  }
  // First time: initialize with seeded count
  const initial = seededInitialCount(lookId);
  await setDoc(ref, { remaining: initial, initial, createdAt: new Date() });
  return initial;
}

// Get remaining for multiple looks at once
export async function getBatchRemainingInjections(lookIds: string[]): Promise<Record<string, number>> {
  if (!db) return {};
  const results: Record<string, number> = {};
  await Promise.all(
    lookIds.map(async (id) => {
      results[id] = await getRemainingInjections(id);
    })
  );
  return results;
}

// Decrement injection count. Returns new remaining, or -1 if depleted.
export async function decrementInjection(lookId: string): Promise<number> {
  if (!db) return -1;
  const ref = doc(db, 'injection_counts', lookId);

  try {
    const newRemaining = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) {
        const initial = seededInitialCount(lookId);
        transaction.set(ref, { remaining: initial - 1, initial, createdAt: new Date() });
        return initial - 1;
      }
      const current = snap.data().remaining ?? 0;
      if (current <= 0) return -1;
      transaction.update(ref, { remaining: current - 1 });
      return current - 1;
    });
    return newRemaining;
  } catch (err) {
    console.error('Failed to decrement injection:', err);
    return -1;
  }
}
