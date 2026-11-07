'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import GoogleIcon from '@/components/GoogleIcon';

const credentialsSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function LoginPage() {
  const { logIn, logInWithGoogle, configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setNotice('');

    const credentials = credentialsSchema.safeParse({ email, password });
    if (!credentials.success) {
      const issue = credentials.error.issues[0];
      setFieldErrors({ [issue.path[0]]: issue.message });
      return;
    }

    setLoading(true);
    let authenticationStarted = false;
    try {
      const preflight = await fetch('/api/auth/login-attempt', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check', email: credentials.data.email }),
      });
      const preflightData = await preflight.json().catch(() => ({}));
      if (!preflight.ok) {
        const error = new Error(preflightData.error || 'Sign-in protection is unavailable.');
        error.status = preflight.status;
        throw error;
      }

      authenticationStarted = true;
      await logIn(credentials.data.email, credentials.data.password);
      recordLoginAttempt('succeeded', credentials.data.email)
        .catch((auditError) => console.error('[AUTH_LOGIN_AUDIT_ERROR]', auditError?.stack || auditError));
      router.push(getNextPath());
    } catch (err) {
      console.error('[AUTH_LOGIN_ERROR]', err?.stack || err);
      if (authenticationStarted) {
        recordLoginAttempt('failed', credentials.data.email)
          .catch((auditError) => console.error('[AUTH_LOGIN_AUDIT_ERROR]', auditError?.stack || auditError));
      }
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
    const emailCheck = z.string().trim().email().max(254).safeParse(normalizedEmail);
    if (!emailCheck.success) {
      setError('Enter a valid email address to receive a reset link.');
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setNotice('If an account exists for this email, check your inbox for a one-time reset link with a secure code.');
    } catch (err) {
      console.error('[AUTH_PASSWORD_RESET_ERROR]', err?.stack || err);
      if (err?.code === 'auth/user-not-found') {
        setNotice('If an account exists for this email, check your inbox for a one-time reset link with a secure code.');
      } else {
        setError(mapAuthError(err));
      }
    } finally {
      setResetLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setNotice('');
    setLoading(true);
    try {
      await logInWithGoogle();
      router.push(getNextPath());
    } catch (err) {
      console.error('[AUTH_GOOGLE_LOGIN_ERROR]', err?.stack || err);
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
          <p className="text-ink-300 text-sm mb-6">Good to see you again. Your Brief Group workspace is ready when you are.</p>

          {!configured && (
            <div className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-xs rounded-lg p-3 mb-5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>Firebase isn't configured yet. Add your Firebase keys to .env.local — see README.md.</span>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-xs rounded-lg p-3 mb-5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {notice && <p role="status" aria-live="polite" className="text-sm text-ink-300 mb-5">{notice}</p>}

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
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setFieldErrors((current) => ({ ...current, email: '' }));
                  setNotice('');
                }}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors"
                placeholder="you@company.com"
              />
              {fieldErrors.email && <p id="email-error" className="mt-1 text-xs text-alert">{fieldErrors.email}</p>}
            </div>
            <div className="relative">
              <label htmlFor="password" className="text-sm text-ink-300 mb-1.5 block">Password</label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                  setFieldErrors((current) => ({ ...current, password: '' }));
                  setNotice('');
                }}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 pr-11 text-sm focus:border-amber outline-none transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
                disabled={loading || resetLoading}
                className="absolute right-3 top-8 text-ink-300 hover:text-ink-100 disabled:opacity-50"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
              {fieldErrors.password && <p id="password-error" className="mt-1 text-xs text-alert">{fieldErrors.password}</p>}
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={loading || resetLoading || !configured}
                className="mt-2 text-xs text-amber hover:text-amber-soft disabled:opacity-50"
                aria-live="polite"
              >
                {resetLoading ? 'Sending your reset email…' : 'Email me a secure reset code'}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || resetLoading || !configured}
              className="w-full bg-amber text-base-900 font-medium py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 className="inline mr-2 animate-spin" size={16} />Signing you in…</> : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-ink-500">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading || resetLoading || !configured}
            className="w-full border border-border py-2.5 rounded-lg hover:bg-base-800 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2.5"
          >
            <GoogleIcon size={18} />
            Continue with Google
          </button>

          <p className="text-center text-sm text-ink-300 mt-6">
            No account yet?{' '}
            <Link
              href="/signup"
              onClick={(event) => {
                event.preventDefault();
                router.push(`/signup?next=${encodeURIComponent(getNextPath())}`);
              }}
              className="text-amber hover:text-amber-soft"
            >
              Apply for the pilot
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

async function recordLoginAttempt(action, email) {
  const response = await fetch('/api/auth/login-attempt', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, email }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Login audit could not be recorded.');
  }
}

function getNextPath() {
  if (typeof window === 'undefined') return '/dashboard';
  const nextPath = new URLSearchParams(window.location.search).get('next');
  return nextPath === '/onboarding' || nextPath?.startsWith('/onboarding?') || nextPath?.startsWith('/onboarding#')
    ? nextPath
    : '/dashboard';
}

function mapAuthError(err) {
  const code = err?.code || '';
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential') ||
      code.includes('invalid-login-credentials') || err?.status === 401) {
    return 'Invalid email or password.';
  }
  if (code.includes('too-many-requests') || err?.status === 429) return 'Too many attempts. Please wait a minute and try again.';
  if (err?.status === 503) return err.message || 'Sign-in protection is temporarily unavailable. Please try again shortly.';
  if (code.toLowerCase().includes('auth_not_configured') || code.includes('session-unavailable')) {
    return 'Secure sign-in is not ready yet. Please contact the Brief Group team.';
  }
  if (code.includes('operation-not-allowed')) return 'Email and password sign-in is not enabled yet. Please contact the Brief Group team.';
  if (code.includes('invalid-api-key')) return 'Sign-in is temporarily unavailable. Please contact the Brief Group team.';
  if (code.includes('network-request-failed')) return 'We could not reach the sign-in service. Check your connection and try again.';
  if (code.includes('popup-closed-by-user')) return 'Sign-in was cancelled.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
  if (code.includes('unauthorized-domain')) return "This domain isn't authorized for sign-in yet — add it under Firebase Console → Authentication → Settings → Authorized domains.";
  return 'We could not sign you in. Check your details and try again.';
}
