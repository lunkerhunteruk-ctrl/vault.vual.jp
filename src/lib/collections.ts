import { collection, getDocs, doc, setDoc, updateDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface VaultCollection {
  id: string;
  city: string;           // e.g. "TSUKIJI — KAITENSUSHI"
  published: boolean;
  publishAt: Date | null;  // BST scheduled publish time
  createdAt: Date;
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

// Toggle published state
export async function togglePublished(id: string, published: boolean): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'vault_collections', id), { published });
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
