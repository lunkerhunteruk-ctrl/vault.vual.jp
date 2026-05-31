import { collection, getDocs, getDoc, doc, setDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { lookFileToId, getRemainingInjections } from '@/lib/injection-count';

export interface VaultCollection {
  id: string;
  city: string;           // e.g. "TSUKIJI — KAITENSUSHI"
  published: boolean;
  publishAt: Date | null;  // BST scheduled publish time
  createdAt: Date;
  hasRecipe?: boolean;     // true = INJECT enabled, false/undefined = gallery only
  media: {
    file: string;          // R2 URL
    previewFile?: string;  // optional video preview for grid
    type: "image" | "video";
    aspect: "3:4" | "4:3" | "9:16" | "16:9" | "1:1";
    isHero?: boolean;
  }[];
}

// Fetch all published collections (publishAt <= now)
export async function getPublishedCollections(): Promise<VaultCollection[]> {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'vault_collections'));
  const now = new Date();
  const results: VaultCollection[] = [];

  snapshot.forEach((d) => {
    const data = d.data();
    const publishAt = data.publishAt?.toDate?.() || null;
    const published = data.published ?? false;

    // Show if published=true AND (no schedule OR schedule has passed)
    if (published && (!publishAt || publishAt <= now)) {
      results.push({
        id: d.id,
        city: data.city || '',
        published,
        publishAt,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        hasRecipe: data.hasRecipe ?? false,
        media: data.media || [],
      });
    }
  });

  // Sort by publishAt descending (newest first)
  results.sort((a, b) => {
    const aTime = a.publishAt?.getTime() || a.createdAt.getTime();
    const bTime = b.publishAt?.getTime() || b.createdAt.getTime();
    return bTime - aTime;
  });

  return results;
}

// Fetch ALL collections (for admin)
export async function getAllCollections(): Promise<VaultCollection[]> {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'vault_collections'));
  const results: VaultCollection[] = [];

  snapshot.forEach((d) => {
    const data = d.data();
    results.push({
      id: d.id,
      city: data.city || '',
      published: data.published ?? false,
      publishAt: data.publishAt?.toDate?.() || null,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      hasRecipe: data.hasRecipe ?? false,
      media: data.media || [],
    });
  });

  results.sort((a, b) => {
    const aTime = a.publishAt?.getTime() || a.createdAt.getTime();
    const bTime = b.publishAt?.getTime() || b.createdAt.getTime();
    return bTime - aTime;
  });

  return results;
}

// Create or update a collection
export async function saveCollection(col: VaultCollection): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'vault_collections', col.id);
  await setDoc(ref, {
    city: col.city,
    published: col.published,
    publishAt: col.publishAt ? Timestamp.fromDate(col.publishAt) : null,
    createdAt: col.createdAt ? Timestamp.fromDate(col.createdAt) : Timestamp.now(),
    media: col.media,
  });
}

// Toggle published state — when turning ON without a schedule, set publishAt to now
// Also auto-generates injection counts for all media in the collection
export async function togglePublished(id: string, published: boolean): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'vault_collections', id);
  if (published) {
    const snap = await getDoc(ref);
    const data = snap.data();
    // If no publishAt set, stamp it with current time
    if (!data?.publishAt) {
      await updateDoc(ref, { published, publishAt: Timestamp.fromDate(new Date()) });
    } else {
      await updateDoc(ref, { published });
    }
    // Auto-generate injection counts for all media
    const media = data?.media || [];
    await Promise.all(
      media
        .filter((m: any) => m.type === 'image')
        .map((m: any) => {
          const lookId = lookFileToId(m.file);
          return getRemainingInjections(lookId); // creates if not exists
        })
    );
    return;
  }
  await updateDoc(ref, { published });
}

// Update schedule
export async function setPublishSchedule(id: string, publishAt: Date | null): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'vault_collections', id), {
    publishAt: publishAt ? Timestamp.fromDate(publishAt) : null,
  });
}

// Format publishAt date for display: "5.27"
export function formatCollectionDate(col: VaultCollection): string {
  const d = col.publishAt || col.createdAt;
  return `${d.getMonth() + 1}.${d.getDate()}`;
}
