'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { trialEndDateFromNow } from './subscription';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState(null);
  // Only stay "loading" if Firebase is actually configured and we're waiting
  // on onAuthStateChanged; otherwise there's nothing to wait for.
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return; // loading is already false, nothing to subscribe to
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, [configured]);

  async function signUp(name, email, password, company) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      company: company || '',
      role: 'pilot-partner',
      plan: 'trial',
      trialEndsAt: trialEndDateFromNow().toISOString(),
      createdAt: serverTimestamp(),
    });
    return cred.user;
  }

  async function logIn(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function logInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const userRef = doc(db, 'users', cred.user.uid);
    const existing = await getDoc(userRef);

    if (!existing.exists()) {
      // First time this Google account has signed in — start their trial.
      await setDoc(userRef, {
        name: cred.user.displayName || '',
        email: cred.user.email || '',
        role: 'pilot-partner',
        plan: 'trial',
        trialEndsAt: trialEndDateFromNow().toISOString(),
        createdAt: serverTimestamp(),
      });
    }
    // Returning users: don't touch plan/trialEndsAt, just let them in.
    return cred.user;
  }

  async function logOut() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, configured, signUp, logIn, logInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
