'use client';

import { useState } from 'react';
import { BrainCircuit, Loader2, Sparkles } from 'lucide-react';
import { authedFetch } from '@/lib/api-client';

export default function RecommendationsPage() {
  const [prompt, setPrompt] = useState('Site has rising energy use, two critical equipment alerts, and delayed preventive maintenance.');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    try {
      const res = await authedFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `You are an industrial operations strategist. Based on this scenario: ${prompt}. Give 5 highly actionable recommendations prioritized by impact, urgency, and cost. Include specific actions, KPI targets, and a short implementation plan for a mid-sized operations team.`,
          }],
          context: { feature: 'recommendations' },
        }),
      });
      setResult(res.reply || res.error || 'No recommendation returned.');
    } catch (err) {
      setError(err.message || 'Unable to generate recommendations.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><BrainCircuit className="text-amber" size={22} /> AI Recommendations</h1>
        <p className="text-ink-300 text-sm mt-1">Prioritize interventions for equipment, energy, maintenance, and workforce efficiency.</p>
      </div>

      <form onSubmit={handleGenerate} className="card p-6 mb-6">
        <label className="text-xs text-ink-500 mb-1 block">Operational scenario</label>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" />
        <button type="submit" disabled={loading} className="mt-4 bg-amber text-base-900 font-medium px-4 py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50 flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Generating…' : 'Generate plan'}
        </button>
      </form>

      {error && <div className="card p-4 mb-6 text-alert text-sm">{error}</div>}

      {result && (
        <div className="card p-6 whitespace-pre-wrap text-sm leading-relaxed text-ink-100">
          {result}
        </div>
      )}
    </div>
  );
}
