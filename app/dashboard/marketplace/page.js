'use client';

import { useState } from 'react';
import { ShoppingBag, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function MarketplacePage() {
  const [form, setForm] = useState({ email: '', company: '', interest: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join waitlist');
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><ShoppingBag className="text-amber" size={22} /> Digital Marketplace</h1>
        <p className="text-ink-300 text-sm mt-1">Phase 3 — a trusted buy-and-sell layer for energy equipment, parts, and maintenance providers.</p>
      </div>

      <div className="card p-8 text-center">
        {status === 'done' ? (
          <>
            <CheckCircle2 className="text-emerald mx-auto mb-3" size={32} />
            <h3 className="font-display font-medium text-lg mb-2">You're on the list</h3>
            <p className="text-ink-300 text-sm">We'll reach out when the marketplace opens after pilot validation.</p>
          </>
        ) : (
          <>
            <h3 className="font-display font-medium text-lg mb-2">Coming soon</h3>
            <p className="text-ink-300 text-sm mb-6 max-w-md mx-auto">
              The marketplace opens after Phase 1 and 2 pilot validation. Join the waitlist to get early access.
            </p>
            <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-3 text-left">
              <input required type="email" placeholder="you@company.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none" />
              <input placeholder="Company (optional)" value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none" />
              <input placeholder="What are you interested in buying/selling?" value={form.interest}
                onChange={(e) => setForm({ ...form, interest: e.target.value })}
                className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none" />
              {error && (
                <div className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-xs rounded-lg p-3">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}
              <button type="submit" disabled={status === 'sending'} className="w-full bg-amber text-base-900 font-medium py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {status === 'sending' ? <Loader2 className="animate-spin" size={16} /> : null}
                Join the waitlist
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
