'use client';

import { cloneElement, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Building2, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authedFetch } from '@/lib/api-client';

const INITIAL_FORM = {
  name: '',
  legalName: '',
  country: '',
  region: '',
  industry: '',
  companySize: '',
  website: '',
  phone: '',
  address: '',
};

const COUNTRIES = [
  'Nigeria',
  'Ghana',
  'Kenya',
  'South Africa',
  'United Kingdom',
  'United States',
  'Other',
];

const INDUSTRIES = [
  'Agriculture',
  'Energy and utilities',
  'Manufacturing',
  'Construction',
  'Logistics and transport',
  'Facilities management',
  'Mining',
  'Professional services',
  'Other',
];

export default function OnboardingPage() {
  const { user, loading, configured, logOut } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(INITIAL_FORM);
  const [inviteToken] = useState(() => (
    typeof window === 'undefined'
      ? ''
      : new URLSearchParams(window.location.hash.slice(1)).get('invite') || ''
  ));
  const [pageReady, setPageReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [inviteBlocked, setInviteBlocked] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    let active = true;
    async function loadWorkspace() {
      setError('');
      try {
        const data = await authedFetch('/api/companies');
        if (!active) return;
        if (data.company) {
          if (inviteToken) {
            setError('This account already belongs to a company workspace. Ask your admin to invite a different account.');
            setInviteBlocked(true);
            setPageReady(true);
            return;
          }
          router.replace('/dashboard');
          return;
        }
        if (inviteToken) {
          setPageReady(true);
          return;
        }
        setForm((current) => ({ ...current, name: data.suggestedCompanyName || '' }));
        setPageReady(true);
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
          setPageReady(true);
        }
      }
    }

    loadWorkspace();
    return () => {
      active = false;
    };
  }, [user, loading, inviteToken, router]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await authedFetch('/api/companies', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.replace('/dashboard');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const nextPath = inviteToken
    ? `/onboarding#invite=${encodeURIComponent(inviteToken)}`
    : '/onboarding';

  if (!configured) {
    return <InfoState title="Workspace setup is unavailable" message="Configure Firebase to start a company workspace." />;
  }

  if (loading || (user && !pageReady)) {
    return (
      <main className="min-h-screen bg-base-900 flex items-center justify-center">
        <Loader2 className="animate-spin text-amber" size={28} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-base-900 flex items-center justify-center px-6 py-12 bg-grid-fade">
        <div className="card w-full max-w-md p-8 text-center">
          <Building2 className="mx-auto mb-4 text-cyan" size={30} />
          <h1 className="font-display font-semibold text-2xl mb-2">Set up your Brief Group workspace</h1>
          <p className="text-sm text-ink-300 mb-6">
            {inviteToken
              ? 'Sign in or create an account using the email address this invitation was sent to.'
              : 'Create an account to establish your company profile and invite your team.'}
          </p>
          <div className="space-y-3">
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="block w-full bg-amber text-base-900 font-medium py-2.5 rounded-lg">
              Sign in
            </Link>
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="block w-full border border-border py-2.5 rounded-lg text-sm">
              Create an account
            </Link>
          </div>
          {inviteToken && (
            <p className="text-xs text-ink-500 mt-5">
              For security, invitations can only be accepted by the invited email address.
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base-900 px-6 py-10 sm:py-16 bg-grid-fade">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="flex items-center gap-2 justify-center mb-8">
          <Image src="/logo.png" alt="Brief Group" width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="font-display font-semibold text-lg">Brief Group</span>
        </Link>

        <div className="card p-6 sm:p-9 shadow-card">
          <div className="flex items-start gap-4 mb-8">
            <div className="rounded-xl bg-cyan/10 p-3 text-cyan"><Building2 size={22} /></div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-cyan">Client onboarding</p>
              <h1 className="font-display font-semibold text-2xl mt-1">
                {inviteToken ? 'Join your company workspace' : 'Set up your company'}
              </h1>
              <p className="text-sm text-ink-300 mt-2">
                {inviteToken
                  ? `Signed in as ${user.email}. We will verify that this matches the invited address.`
                  : 'These details personalize your workspace and help us tailor country-specific operational guidance.'}
              </p>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-sm rounded-lg p-3 mb-5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {inviteToken ? (
            <div className="rounded-xl border border-border bg-base-800 p-5">
              <div className="flex gap-3 items-start">
                <ShieldCheck className="text-emerald shrink-0" size={20} />
                <div>
                  <h2 className="font-medium">Invitation is ready to accept</h2>
                  <p className="text-sm text-ink-300 mt-1">
                    The invitation is single-use, expires after seven days, and grants only the role selected by your company administrator.
                  </p>
                </div>
              </div>
              {!inviteBlocked && (
                <button
                  type="button"
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await authedFetch('/api/companies/invitations/accept', {
                        method: 'POST',
                        body: JSON.stringify({ token: inviteToken }),
                      });
                      router.replace('/dashboard');
                    } catch (requestError) {
                      setError(requestError.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  disabled={busy}
                  className="mt-5 w-full bg-amber text-base-900 font-medium py-2.5 rounded-lg disabled:opacity-50"
                >
                  {busy ? 'Joining workspace…' : 'Accept invitation'}
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    await logOut();
                  } catch (requestError) {
                    setError(requestError.message || 'Could not sign out. Please try again.');
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
                className="mt-3 w-full text-sm text-ink-300 hover:text-ink-100 disabled:opacity-50"
              >
                Sign out to use a different account
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-base-800/70 p-3 text-xs text-ink-300 mb-6">
                You will become this workspace's <strong className="text-ink-100">Owner</strong>. You can invite coworkers and assign roles after setup.
              </div>
              <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
                <Field label="Company or organization name" required>
                  <input required maxLength={160} value={form.name} onChange={(event) => update('name', event.target.value)} />
                </Field>
                <Field label="Legal name (optional)">
                  <input maxLength={160} value={form.legalName} onChange={(event) => update('legalName', event.target.value)} />
                </Field>
                <Field label="Country" required>
                  <select required value={form.country} onChange={(event) => update('country', event.target.value)}>
                    <option value="" disabled>Select country</option>
                    {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                  </select>
                </Field>
                <Field label="State, province, or region">
                  <input maxLength={160} value={form.region} onChange={(event) => update('region', event.target.value)} />
                </Field>
                <Field label="Industry" required>
                  <select required value={form.industry} onChange={(event) => update('industry', event.target.value)}>
                    <option value="" disabled>Select industry</option>
                    {INDUSTRIES.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
                  </select>
                </Field>
                <Field label="Organization size" required>
                  <select required value={form.companySize} onChange={(event) => update('companySize', event.target.value)}>
                    <option value="" disabled>Select team size</option>
                    {['1-10', '11-50', '51-200', '201-1000', '1000+'].map((size) => <option key={size} value={size}>{size} people</option>)}
                  </select>
                </Field>
                <Field label="Website (optional)">
                  <input type="url" maxLength={2048} placeholder="https://example.com" value={form.website} onChange={(event) => update('website', event.target.value)} />
                </Field>
                <Field label="Work phone (optional)">
                  <input type="tel" maxLength={40} value={form.phone} onChange={(event) => update('phone', event.target.value)} />
                </Field>
                <Field label="Office or primary site address (optional)" fullWidth>
                  <input maxLength={500} value={form.address} onChange={(event) => update('address', event.target.value)} />
                </Field>
                <div className="sm:col-span-2 pt-2">
                  <button type="submit" disabled={busy} className="w-full bg-amber text-base-900 font-medium py-3 rounded-lg disabled:opacity-50">
                    {busy ? 'Creating workspace…' : 'Create company workspace'}
                  </button>
                </div>
              </form>
            </>
          )}
          <p className="text-xs text-ink-500 mt-6">
            Company details are visible only to authorized workspace members. Country information is used to tailor guidance; it is not legal advice.
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({ label, required, fullWidth, children }) {
  return (
    <label className={`block ${fullWidth ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm text-ink-300 mb-1.5 block">{label}{required ? ' *' : ''}</span>
      {cloneElement(children, {
        className: 'w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors',
      })}
    </label>
  );
}

function InfoState({ title, message }) {
  return (
    <main className="min-h-screen bg-base-900 flex items-center justify-center px-6">
      <div className="card max-w-md p-8 text-center">
        <AlertCircle className="text-alert mx-auto mb-3" size={28} />
        <h1 className="font-display font-semibold text-xl mb-2">{title}</h1>
        <p className="text-sm text-ink-300">{message}</p>
      </div>
    </main>
  );
}
