'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authedFetch } from '@/lib/api-client';
import GoogleIcon from '@/components/GoogleIcon';

export default function SignupPage() {
  const { signUp, logInWithGoogle, configured } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', company: '', email: '', password: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(form.name, form.email, form.password, form.company);
      authedFetch('/api/notify/welcome', { method: 'POST', body: JSON.stringify({ name: form.name }) })
        .catch((err) => console.error('welcome email failed', err)); // best-effort, never blocks navigation
      router.push('/dashboard');
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
    <main className="min-h-screen bg-base-900 flex items-center justify-center px-6 py-12 bg-grid-fade">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/logo.png" alt="Brief Group" width={40} height={40} className="h-10 w-10 object-contain" />
          <span className="font-display font-semibold text-lg">Brief Group</span>
        </Link>

        <div className="card p-8 shadow-card">
          <h1 className="font-display font-semibold text-2xl mb-1">Join the pilot</h1>
          <p className="text-ink-300 text-sm mb-6">Create your account and launch the dashboard.</p>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-ink-300 mb-1.5 block">Full name</label>
              <input required value={form.name} onChange={(e) => update('name', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors" placeholder="Ada Obi" />
            </div>
            <div>
              <label className="text-sm text-ink-300 mb-1.5 block">Company</label>
              <input value={form.company} onChange={(e) => update('company', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors" placeholder="Your organization" />
            </div>
            <div>
              <label className="text-sm text-ink-300 mb-1.5 block">Email</label>
              <input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors" placeholder="you@company.com" />
            </div>
            <div>
              <label className="text-sm text-ink-300 mb-1.5 block">Password</label>
              <input type="password" required value={form.password} onChange={(e) => update('password', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors" placeholder="At least 6 characters" />
            </div>
            <label className="flex items-start gap-2.5 text-xs text-ink-300 pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
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
              {loading ? 'Creating account…' : 'Create account'}
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
            <Link href="/login" className="text-amber hover:text-amber-soft">Log in</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

function mapAuthError(err) {
  const code = err?.code || '';
  if (code.includes('email-already-in-use')) return 'An account with this email already exists.';
  if (code.includes('weak-password')) return 'Password is too weak.';
  if (code.includes('invalid-email')) return 'That email address looks invalid.';
  if (code.includes('popup-blocked')) return 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
  if (code.includes('unauthorized-domain')) return "This domain isn't authorized for sign-in yet — add it under Firebase Console → Authentication → Settings → Authorized domains.";
  return err?.message || 'Something went wrong. Please try again.';
}
