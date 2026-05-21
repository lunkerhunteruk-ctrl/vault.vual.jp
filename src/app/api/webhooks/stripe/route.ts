import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// We need admin SDK for server-side Firestore writes
// For now, use REST API approach with Firebase Admin
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminDb() {
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

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, credits } = session.metadata || {};

    if (userId && credits) {
      try {
        const db = getAdminDb();
        const userRef = db.collection('vault_users').doc(userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          await userRef.update({
            paidCredits: (userDoc.data()?.paidCredits || 0) + parseInt(credits, 10),
            updatedAt: new Date(),
          });
        } else {
          await userRef.set({
            paidCredits: parseInt(credits, 10),
            updatedAt: new Date(),
          });
        }

        console.log(`[Webhook] Granted ${credits} credits to user ${userId}`);
      } catch (err) {
        console.error('[Webhook] Failed to grant credits:', err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
