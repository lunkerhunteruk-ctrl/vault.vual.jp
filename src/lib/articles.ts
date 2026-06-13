import { collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ── Block types ──────────────────────────────────────────

export type BlockType = "fullBleed" | "textImage" | "gallery" | "quote" | "textOnly" | "video";

interface BaseBlock {
  id: string; // unique within article
}

export interface FullBleedBlock extends BaseBlock {
  type: "fullBleed";
  image: string;
  heading?: string;
  sub?: string;
}

export interface TextImageBlock extends BaseBlock {
  type: "textImage";
  body: string;
  image: string;
  side: "left" | "right";
}

export interface GalleryBlock extends BaseBlock {
  type: "gallery";
  images: string[];
  caption?: string;
}

export interface QuoteBlock extends BaseBlock {
  type: "quote";
  text: string;
  attribution?: string;
}

export interface TextOnlyBlock extends BaseBlock {
  type: "textOnly";
  body: string;
}

export interface VideoBlock extends BaseBlock {
  type: "video";
  src: string; // Cloudflare Stream ID or direct video URL (R2 etc.)
  caption?: string;
}

export type ArticleBlock = FullBleedBlock | TextImageBlock | GalleryBlock | QuoteBlock | TextOnlyBlock | VideoBlock;

// ── Article ──────────────────────────────────────────────

export type ArticleCategory = "Fashion" | "Art" | "Lifestyle" | "Culture" | "Interview";

export interface VaultArticle {
  id: string;
  title: string;
  coverImage: string;
  category: ArticleCategory;
  published: boolean;
  publishAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tier?: "high" | "daily";
  blocks: ArticleBlock[];
}

// ── Firestore CRUD ───────────────────────────────────────

const COLLECTION = 'vault_articles';

export async function getAllArticles(): Promise<VaultArticle[]> {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, COLLECTION));
  const results: VaultArticle[] = [];

  snapshot.forEach((d) => {
    const data = d.data();
    results.push({
      id: d.id,
      title: data.title || '',
      coverImage: data.coverImage || '',
      category: data.category || 'Fashion',
      published: data.published ?? false,
      publishAt: data.publishAt?.toDate?.() || null,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
      tier: data.tier || undefined,
      blocks: data.blocks || [],
    });
  });

  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return results;
}

export async function getPublishedArticles(tier?: "high" | "daily"): Promise<VaultArticle[]> {
  const all = await getAllArticles();
  const now = new Date();
  return all.filter((a) => {
    if (!a.published) return false;
    if (a.publishAt && a.publishAt > now) return false;
    if (tier && a.tier !== tier) return false;
    return true;
  });
}

export async function getArticleById(id: string): Promise<VaultArticle | null> {
  if (!db) return null;
  const d = await getDoc(doc(db, COLLECTION, id));
  if (!d.exists()) return null;
  const data = d.data();
  return {
    id: d.id,
    title: data.title || '',
    coverImage: data.coverImage || '',
    category: data.category || 'Fashion',
    published: data.published ?? false,
    publishAt: data.publishAt?.toDate?.() || null,
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
    tier: data.tier || undefined,
    blocks: data.blocks || [],
  };
}

export async function createArticle(article: Omit<VaultArticle, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const id = `article_${Date.now()}`;
  await setDoc(doc(db, COLLECTION, id), {
    ...article,
    blocks: article.blocks || [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return id;
}

export async function updateArticle(id: string, updates: Partial<VaultArticle>): Promise<void> {
  if (!db) return;
  const { id: _id, createdAt: _ca, ...rest } = updates as any;
  await updateDoc(doc(db, COLLECTION, id), {
    ...rest,
    updatedAt: Timestamp.now(),
  });
}

export async function toggleArticlePublished(id: string, published: boolean): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, COLLECTION, id), { published, updatedAt: Timestamp.now() });
}

export async function deleteArticle(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTION, id));
}
