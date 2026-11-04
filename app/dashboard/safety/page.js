'use client';

import { useState } from 'react';
import { ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import { authedFetch } from '@/lib/api-client';

const safetyAreas = [
  { label: 'Nigeria OSHA / HSE requirements', status: 'Aligned' },
  { label: 'International OHS standards', status: 'Aligned' },
  { label: 'Permit-to-work controls', status: 'Healthy' },
  { label: 'Incident logging', status: 'Updated' },
  { label: 'Training & inductions', status: 'Ready' },
  { label: 'Emergency response', status: 'Prepared' },
];

export default function SafetyPage() {
  const [context, setContext] = useState('We operate a mixed industrial and logistics site with equipment maintenance, forklift movement, and contractor access.');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPlan('');

    try {
      const res = await authedFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Draft a professional occupational safety, health, and environment management plan for this scenario: ${context}. Include: Nigerian legal baseline, international best-practice controls, hazard identification, risk controls, training actions, incident escalation, and contractor compliance. Keep it practical and suitable for employers and operational managers.`,
          }],
          context: { feature: 'safety management' },
        }),
      });
      setPlan(res.reply || res.error || 'No output generated.');
    } catch (err) {
      setError(err.message || 'Unable to generate safety plan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><ShieldCheck className="text-emerald" size={22} /> Occupational Safety & Compliance</h1>
        <p className="text-ink-300 text-sm mt-1">Track compliance, risk controls, and site readiness using Nigerian and international HSE standards.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {safetyAreas.map((item) => (
          <div key={item.label} className="card p-4">
            <div className="text-xs text-ink-500 mb-1">{item.label}</div>
            <div className="font-medium text-sm">{item.status}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleGenerate} className="card p-6 mb-6">
        <label className="text-xs text-ink-500 mb-1 block">Site context</label>
        <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={6} className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-emerald outline-none" />
        <button type="submit" disabled={loading} className="mt-4 bg-emerald text-base-900 font-medium px-4 py-2.5 rounded-lg hover:bg-emerald-soft transition-colors disabled:opacity-50 flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Generating…' : 'Generate safety plan'}
        </button>
      </form>

      {error && <div className="card p-4 mb-6 text-alert text-sm">{error}</div>}

      {plan && (
        <div className="card p-6 whitespace-pre-wrap text-sm leading-relaxed text-ink-100">
          {plan}
        </div>
      )}
    </div>
  );
}
