'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import GoogleIcon from '@/components/GoogleIcon';

export default function LoginPage() {
  const { logIn, logInWithGoogle, configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await logIn(email.trim().toLowerCase(), password);
      router.push('/dashboard');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    setError('');
    setNotice('');
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Enter your email address first, and we will send a reset link.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setNotice('If an account exists for this email, a password reset link has been sent.');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await logInWithGoogle();
      router.push('/dashboard');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base-900 flex items-center justify-center px-6 bg-grid-fade">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/logo.png" alt="Brief Group" width={40} height={40} className="h-10 w-10 object-contain" />
          <span className="font-display font-semibold text-lg">Brief Group</span>
        </Link>

        <div className="card p-8 shadow-card">
          <h1 className="font-display font-semibold text-2xl mb-1">Welcome back</h1>
          <p className="text-ink-300 text-sm mb-6">Sign in to pick up where your team left off.</p>

          {!configured && (
            <div className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-xs rounded-lg p-3 mb-5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>Firebase isn't configured yet. Add your Firebase keys to .env.local — see README.md.</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-xs rounded-lg p-3 mb-5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {notice && <p role="status" className="text-sm text-ink-300 mb-5">{notice}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm text-ink-300 mb-1.5 block">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm text-ink-300 mb-1.5 block">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={loading || !configured}
                className="mt-2 text-xs text-amber hover:text-amber-soft disabled:opacity-50"
              >
                Forgot your password?
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !configured}
              className="w-full bg-amber text-base-900 font-medium py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-ink-500">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading || !configured}
            className="w-full border border-border py-2.5 rounded-lg hover:bg-base-800 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2.5"
          >
            <GoogleIcon size={18} />
            Continue with Google
          </button>

          <p className="text-center text-sm text-ink-300 mt-6">
            No account yet?{' '}
            <Link href="/signup" className="text-amber hover:text-amber-soft">Apply for the pilot</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

function mapAuthError(err) {
  const code = err?.code || '';
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Try again shortly.';
  if (code.includes('operation-not-allowed')) return 'Email and password sign-in is not enabled yet. Please contact the Brief Group team.';
  if (code.includes('network-request-failed')) return 'We could not reach the sign-in service. Check your connection and try again.';
  if (code.includes('popup-closed-by-user')) return 'Sign-in was cancelled.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
  if (code.includes('unauthorized-domain')) return "This domain isn't authorized for sign-in yet — add it under Firebase Console → Authentication → Settings → Authorized domains.";
  return 'We could not sign you in. Check your details and try again.';
}
