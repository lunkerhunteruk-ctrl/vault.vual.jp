import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();

export interface VaultUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|Android/i.test(navigator.userAgent);
}

async function upsertUser(firebaseUser: import('firebase/auth').User): Promise<VaultUser> {
  const userRef = doc(db, 'vault_users', firebaseUser.uid);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    const data = userDoc.data();
    return {
      id: firebaseUser.uid,
      email: data.email || firebaseUser.email || '',
      displayName: data.displayName || firebaseUser.displayName || '',
      photoURL: data.photoURL || firebaseUser.photoURL || undefined,
      createdAt: data.createdAt?.toDate?.() || new Date(),
    };
  }

  const newUser: Omit<VaultUser, 'id'> = {
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || undefined,
    createdAt: new Date(),
  };

  await setDoc(userRef, { ...newUser, authMethod: 'google' });
  return { id: firebaseUser.uid, ...newUser };
}

export async function signInWithGoogle(): Promise<VaultUser | null> {
  if (!auth) return null;

  if (isMobile()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }

  const credential = await signInWithPopup(auth, googleProvider);
  return upsertUser(credential.user);
}

export async function handleGoogleRedirectResult(): Promise<VaultUser | null> {
  if (!auth) return null;
  const result = await getRedirectResult(auth);
  if (!result) return null;
  return upsertUser(result.user);
}

export async function signOutVault(): Promise<void> {
  if (!auth) return;
  await auth.signOut();
}
