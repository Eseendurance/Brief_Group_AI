'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  browserSessionPersistence,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  setPersistence,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { trialEndDateFromNow } from './subscription';

const AuthContext = createContext(null);
let sessionRequest = null;
let sessionRequestUid = null;
let persistenceRequest = null;

function ensureSessionPersistence() {
  if (!persistenceRequest) {
    persistenceRequest = setPersistence(auth, browserSessionPersistence).catch((error) => {
      persistenceRequest = null;
      throw error;
    });
  }
  return persistenceRequest;
}

async function establishServerSession(user) {
  if (sessionRequest && sessionRequestUid === user.uid) return sessionRequest;
  sessionRequestUid = user.uid;
  sessionRequest = (async () => {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: await user.getIdToken() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'Secure sign-in could not be completed.');
      error.code = data.code || 'auth/session-unavailable';
      throw error;
    }
  })();
  try {
    await sessionRequest;
  } finally {
    sessionRequest = null;
    sessionRequestUid = null;
  }
}

async function ensureUserProfile(user, profile = {}) {
  const userRef = doc(db, 'users', user.uid);
  const trialEndsAt = trialEndDateFromNow();

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    if (snapshot.exists()) return;

    transaction.set(userRef, {
      name: profile.name?.trim() || user.displayName || '',
      email: user.email || '',
      ...(profile.company?.trim() ? { company: profile.company.trim() } : {}),
      ...(profile.workRole ? { workRole: profile.workRole } : {}),
      role: 'pilot-partner',
      plan: 'trial',
      trialEndsAt,
      createdAt: serverTimestamp(),
    });
  });
}

export function AuthProvider({ children }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState(null);
  // Only wait for Firebase auth restoration when Firebase is configured.
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return; // loading is already false, nothing to subscribe to
    let initialAuthResolved = false;
    let active = true;
    let unsubscribe;
    ensureSessionPersistence()
      .then(() => {
        if (!active) return;
        unsubscribe = onIdTokenChanged(auth, async (u) => {
          setUser(u);
          if (!initialAuthResolved) setLoading(true);
          try {
            if (u) await establishServerSession(u);
          } catch (error) {
            console.error('[AUTH_SESSION_ERROR]', error);
          } finally {
            initialAuthResolved = true;
            setLoading(false);
          }
        });
      })
      .catch((error) => {
        console.error('[AUTH_PERSISTENCE_ERROR]', error);
        setLoading(false);
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [configured]);

  async function signUp(name, email, password, company, workRole) {
    await ensureSessionPersistence();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    await updateProfile(cred.user, { displayName: normalizedName });
    await ensureUserProfile(cred.user, { name: normalizedName, company, workRole });
    await establishServerSession(cred.user);
    return cred.user;
  }

  async function logIn(email, password) {
    await ensureSessionPersistence();
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    await ensureUserProfile(cred.user);
    await establishServerSession(cred.user);
    return cred.user;
  }

  async function logInWithGoogle(profile = {}) {
    await ensureSessionPersistence();
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await ensureUserProfile(cred.user, profile);
    await establishServerSession(cred.user);
    return cred.user;
  }

  async function logOut() {
    let sessionError = null;
    try {
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) sessionError = new Error('Your server session could not be cleared.');
    } catch (error) {
      sessionError = error;
    }
    await signOut(auth);
    if (sessionError) throw sessionError;
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
