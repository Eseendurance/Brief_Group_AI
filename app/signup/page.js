'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { authedFetch } from '@/lib/api-client';
import GoogleIcon from '@/components/GoogleIcon';

const signupSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(120),
  email: z.string().trim().email('Enter a valid email address.').max(254),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function SignupPage() {
  const { signUp, logInWithGoogle, configured } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', company: '', workRole: '', email: '', password: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const validation = signupSchema.safeParse(form);
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Check your details and try again.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (!form.workRole) {
      setError('Choose the role that best describes your work.');
      return;
    }
    setLoading(true);
    try {
      await signUp(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.company.trim(), form.workRole);
      authedFetch('/api/notify/welcome', { method: 'POST', body: JSON.stringify({ name: form.name.trim() }) })
        .catch((err) => console.error('welcome email failed', err)); // best-effort, never blocks navigation
      router.push(getNextPath());
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (!form.workRole) {
      setError('Choose the role that best describes your work.');
      return;
    }
    setLoading(true);
    try {
      await logInWithGoogle({ company: form.company.trim(), workRole: form.workRole });
      router.push(getNextPath());
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-base-900 flex items-center justify-center px-6 py-12 bg-grid-fade">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/logo.png" alt="Brief Group" width={40} height={40} className="h-10 w-10 object-contain" />
          <span className="font-display font-semibold text-lg">Brief Group</span>
        </Link>

        <div className="card p-8 shadow-card">
          <h1 className="font-display font-semibold text-2xl mb-1">Join the pilot</h1>
          <p className="text-ink-300 text-sm mb-6">A few details help us make Brief Group useful for your team.</p>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm text-ink-300 mb-1.5 block">Full name</label>
              <input id="name" name="name" autoComplete="name" required maxLength={120} value={form.name} onChange={(e) => update('name', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors" placeholder="Ada Obi" />
            </div>
            <div>
              <label htmlFor="workRole" className="text-sm text-ink-300 mb-1.5 block">What best describes your role?</label>
              <select id="workRole" name="workRole" required value={form.workRole} onChange={(e) => update('workRole', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors">
                <option value="" disabled>Choose your role</option>
                <option value="Farm owner">Farm owner</option>
                <option value="Equipment operator">Equipment operator</option>
                <option value="Operations manager">Operations manager</option>
                <option value="Enterprise lead">Enterprise lead</option>
              </select>
            </div>
            <div>
              <label htmlFor="company" className="text-sm text-ink-300 mb-1.5 block">Company or team</label>
              <input id="company" name="company" autoComplete="organization" maxLength={160} value={form.company} onChange={(e) => update('company', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors" placeholder="Your organization" />
            </div>
            <div>
              <label htmlFor="email" className="text-sm text-ink-300 mb-1.5 block">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(e) => update('email', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors" placeholder="you@company.com" />
            </div>
            <div>
              <label htmlFor="password" className="text-sm text-ink-300 mb-1.5 block">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors" placeholder="At least 6 characters" />
            </div>
            <label className="flex items-start gap-2.5 text-xs text-ink-300 pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setError('');
                }}
                className="mt-0.5 h-4 w-4 rounded border-border accent-amber shrink-0"
              />
              <span>
                I agree to Brief Group's{' '}
                <Link href="/terms" target="_blank" className="text-amber hover:text-amber-soft underline underline-offset-2">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" className="text-amber hover:text-amber-soft underline underline-offset-2">Privacy Policy</Link>.
              </span>
            </label>
            <button type="submit" disabled={loading || !configured}
              className="w-full bg-amber text-base-900 font-medium py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 className="inline mr-2 animate-spin" size={16} />Creating your secure account…</> : 'Create account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-ink-500">or</span>
            <div className="h-px bg-border flex-1" />
          </div>

          <button onClick={handleGoogle} disabled={loading || !configured}
            className="w-full border border-border py-2.5 rounded-lg hover:bg-base-800 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2.5">
            <GoogleIcon size={18} />
            Continue with Google
          </button>

          <p className="text-center text-sm text-ink-300 mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              onClick={(event) => {
                event.preventDefault();
                router.push(`/login?next=${encodeURIComponent(getNextPath())}`);
              }}
              className="text-amber hover:text-amber-soft"
            >
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

function getNextPath() {
  if (typeof window === 'undefined') return '/onboarding';
  const nextPath = new URLSearchParams(window.location.search).get('next');
  return nextPath === '/onboarding' || nextPath?.startsWith('/onboarding?') || nextPath?.startsWith('/onboarding#')
    ? nextPath
    : '/onboarding';
}

function mapAuthError(err) {
  const code = err?.code || '';
  if (code.includes('email-already-in-use')) return 'An account with this email already exists.';
  if (code.includes('weak-password')) return 'Password is too weak.';
  if (code.includes('invalid-email')) return 'That email address looks invalid.';
  if (code.includes('operation-not-allowed')) return 'Email and password sign-up is not enabled yet. Please contact the Brief Group team.';
  if (code.includes('network-request-failed')) return 'We could not reach the sign-in service. Check your connection and try again.';
  if (code.includes('permission-denied')) return 'Your sign-in was created, but profile setup could not finish. Try signing in again to complete setup, or contact support.';
  if (code.toLowerCase().includes('auth_not_configured') || code.includes('session-unavailable')) return 'Secure sign-in is not ready yet. Please contact the Brief Group team.';
  if (code.includes('too-many-requests')) return 'Too many account attempts. Please wait a moment and try again.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
  if (code.includes('unauthorized-domain')) return "This domain isn't authorized for sign-in yet — add it under Firebase Console → Authentication → Settings → Authorized domains.";
  return 'We could not create your account. Please try again.';
}
