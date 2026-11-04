'use client';

import { useState } from 'react';
import { Wrench, Loader2, Sparkles } from 'lucide-react';
import { authedFetch } from '@/lib/api-client';

export default function EquipmentPage() {
  const [asset, setAsset] = useState('Transformer T3');
  const [location, setLocation] = useState('Main warehouse, Lagos');
  const [condition, setCondition] = useState('Intermittent overheating, vibration above baseline, minor insulation wear.');
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
            content: `Create a maintenance recommendation for equipment named "${asset}" in ${location}. Current condition: ${condition}. Give a concise maintenance plan, risk rating, required actions within 48 hours, and inspection checklist for site technicians. Keep it professional and suitable for industrial operations in Nigeria and global environments.`,
          }],
          context: { feature: 'equipment intelligence', asset, location },
        }),
      });
      setResult(res.reply || res.error || 'No recommendation returned.');
    } catch (err) {
      setError(err.message || 'Unable to build equipment recommendation.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><Wrench className="text-emerald" size={22} /> Equipment Intelligence</h1>
        <p className="text-ink-300 text-sm mt-1">Track equipment condition, maintenance priorities, and inspection actions from a single operational view.</p>
      </div>

      <form onSubmit={handleGenerate} className="card p-6 mb-6 space-y-4">
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Equipment name</label>
          <input value={asset} onChange={(e) => setAsset(e.target.value)} className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-emerald outline-none" />
        </div>
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Location</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-emerald outline-none" />
        </div>
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Condition summary</label>
          <textarea value={condition} onChange={(e) => setCondition(e.target.value)} rows={6} className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-emerald outline-none" />
        </div>
        <button type="submit" disabled={loading} className="bg-emerald text-base-900 font-medium px-4 py-2.5 rounded-lg hover:bg-emerald-soft transition-colors disabled:opacity-50 flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Assessing…' : 'Generate maintenance plan'}
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
