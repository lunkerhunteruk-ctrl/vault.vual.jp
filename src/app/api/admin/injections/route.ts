import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const ADMIN_KEY = process.env.VAULT_ADMIN_KEY || 'vault-admin-2026';

function getDb() {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1).replace(/\\n/g, '\n');
      }
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    } else {
      initializeApp({ projectId });
    }
  }
  return getFirestore();
}

// GET: List all injection counts
// POST: Update a specific look's remaining count
// ?key=admin-key
// POST body: { lookId: "20-05-2026_look1", remaining: 3 }
// or { lookId: "20-05-2026_look1", action: "reset" }  — reset to initial
// or { lookId: "20-05-2026_look1", action: "decrement", amount: 1 }

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const snapshot = await db.collection('injection_counts').get();
  const data: Record<string, any> = {};
  snapshot.forEach((doc) => {
    data[doc.id] = doc.data();
  });

  return NextResponse.json({ counts: data });
}

export async function POST(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { lookId, remaining, action, amount } = body;

  if (!lookId) {
    return NextResponse.json({ error: 'lookId required' }, { status: 400 });
  }

  const db = getDb();
  const ref = db.collection('injection_counts').doc(lookId);

  if (action === 'reset') {
    const doc = await ref.get();
    const initial = doc.exists ? doc.data()?.initial || 5 : 5;
    await ref.set({ remaining: initial, initial, createdAt: new Date() }, { merge: true });
    return NextResponse.json({ success: true, lookId, remaining: initial });
  }

  if (action === 'decrement') {
    const doc = await ref.get();
    const current = doc.exists ? doc.data()?.remaining ?? 0 : 0;
    const newVal = Math.max(0, current - (amount || 1));
    await ref.update({ remaining: newVal });
    return NextResponse.json({ success: true, lookId, remaining: newVal });
  }

  if (typeof remaining === 'number') {
    await ref.set({ remaining }, { merge: true });
    return NextResponse.json({ success: true, lookId, remaining });
  }

  return NextResponse.json({ error: 'Provide remaining, or action (reset/decrement)' }, { status: 400 });
}
