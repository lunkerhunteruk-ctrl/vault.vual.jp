import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface VaultBrand {
  id: string;
  domain: string;
  name: string;
  logo?: string;
  accentColor: string;
  heroLine1?: string;
  heroLine2?: string;
  heroSubtitle?: string;
  filmPrint?: string;
}

let cachedBrand: VaultBrand | null | undefined = undefined; // undefined = not yet fetched

export async function getBrandByDomain(hostname: string): Promise<VaultBrand | null> {
  // Return cached result
  if (cachedBrand !== undefined) return cachedBrand;

  // Strip port
  const cleanHost = hostname.split(':')[0];

  // VUAL's own domains — no brand (exact match only)
  if (cleanHost === 'vault.vual.jp' || cleanHost === 'localhost') {
    cachedBrand = null;
    return null;
  }

  if (!db) {
    cachedBrand = null;
    return null;
  }

  const snapshot = await getDocs(collection(db, 'vault_brands'));
  for (const d of snapshot.docs) {
    const data = d.data();
    if (data.domain === cleanHost) {
      cachedBrand = {
        id: d.id,
        domain: data.domain,
        name: data.name || '',
        logo: data.logo || undefined,
        accentColor: data.accentColor || '#00d4ff',
        heroLine1: data.heroLine1 || undefined,
        heroLine2: data.heroLine2 || undefined,
        heroSubtitle: data.heroSubtitle || undefined,
        filmPrint: data.filmPrint || undefined,
      };
      return cachedBrand;
    }
  }

  cachedBrand = null;
  return null;
}

// Reset cache (for testing)
export function resetBrandCache() {
  cachedBrand = undefined;
}
