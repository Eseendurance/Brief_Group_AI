import { auth } from './firebase';

// Attaches the current user's Firebase ID token as a Bearer token so
// server-side API routes can verify who's calling — the real auth check
// happens in lib/firebaseAdmin.js -> verifyRequestUser().
export async function authedFetch(url, options = {}) {
  const user = auth.currentUser;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
