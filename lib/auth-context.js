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
import { auth, isFirebaseConfigured } from './firebase';

const AuthContext = createContext(null);
let sessionRequest = null;
let sessionRequestUid = null;
let sessionRequestHasProfile = false;
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

function establishServerSession(user, profile) {
  const hasProfile = Boolean(profile && Object.values(profile).some((value) => typeof value === 'string' && value.trim()));
  if (sessionRequest && sessionRequestUid === user.uid) {
    if (!hasProfile || sessionRequestHasProfile) return sessionRequest;
    return sessionRequest.catch(() => {}).then(() => establishServerSession(user, profile));
  }

  const request = (async () => {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: await user.getIdToken(),
        ...(profile ? { profile } : {}),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'Secure sign-in could not be completed.');
      error.code = data.code || 'auth/session-unavailable';
      error.status = response.status;
      throw error;
    }
  })();
  sessionRequestUid = user.uid;
  sessionRequestHasProfile = hasProfile;
  const trackedRequest = request.finally(() => {
    if (sessionRequest === trackedRequest) {
      sessionRequest = null;
      sessionRequestUid = null;
      sessionRequestHasProfile = false;
    }
  });
  sessionRequest = trackedRequest;
  return trackedRequest;
}

async function establishRequiredServerSession(user, profile) {
  try {
    await establishServerSession(user, profile);
  } catch (error) {
    try {
      await signOut(auth);
      const response = await fetch('/api/auth/session', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) {
        console.error('[AUTH_SESSION_CLEANUP_ERROR]', 'The incomplete server session could not be cleared.');
      }
    } catch (cleanupError) {
      console.error('[AUTH_SESSION_CLEANUP_ERROR]', cleanupError?.stack || cleanupError);
    }
    throw error;
  }
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
    await establishRequiredServerSession(cred.user, { name: normalizedName, company, workRole });
    return cred.user;
  }

  async function logIn(email, password) {
    await ensureSessionPersistence();
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    await establishRequiredServerSession(cred.user);
    return cred.user;
  }

  async function logInWithGoogle(profile = {}) {
    await ensureSessionPersistence();
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await establishRequiredServerSession(cred.user, profile);
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
