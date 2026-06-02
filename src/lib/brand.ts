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

const VUAL_DOMAINS = ['vault.vual.jp', 'localhost'];

export async function getBrandByDomain(hostname: string): Promise<VaultBrand | null> {
  // Return cached result
  if (cachedBrand !== undefined) return cachedBrand;

  // VUAL's own domains — no brand
  if (VUAL_DOMAINS.some(d => hostname.includes(d))) {
    cachedBrand = null;
    return null;
  }

  if (!db) {
    cachedBrand = null;
    return null;
  }

  // Strip port for matching
  const cleanHost = hostname.split(':')[0];

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
