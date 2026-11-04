'use client';

import { useState } from 'react';
import { Headset, Loader2, Sparkles } from 'lucide-react';
import { authedFetch } from '@/lib/api-client';

export default function SupportAssistantPage() {
  const [issue, setIssue] = useState('Users cannot access inspection history after login and the dashboard shows stale equipment readings.');
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
            content: `Act as a support manager for a B2B industrial software platform. Draft a clear customer-facing response for this issue: ${issue}. Include: 1) empathy statement, 2) root cause possibilities, 3) troubleshooting steps, 4) escalation path, 5) prevention actions. Also provide a concise internal support note for the operations team.`,
          }],
          context: { feature: 'support assistant' },
        }),
      });
      setResult(res.reply || res.error || 'No response generated.');
    } catch (err) {
      setError(err.message || 'Unable to draft support response.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><Headset className="text-cyan" size={22} /> Support Assistant</h1>
        <p className="text-ink-300 text-sm mt-1">Draft clear support responses, troubleshooting instructions, and escalation guidance in a client-ready format.</p>
      </div>

      <form onSubmit={handleGenerate} className="card p-6 mb-6">
        <label className="text-xs text-ink-500 mb-1 block">Issue summary</label>
        <textarea value={issue} onChange={(e) => setIssue(e.target.value)} rows={7} className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-cyan outline-none" />
        <button type="submit" disabled={loading} className="mt-4 bg-cyan text-base-900 font-medium px-4 py-2.5 rounded-lg hover:bg-cyan-soft transition-colors disabled:opacity-50 flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Drafting…' : 'Draft support response'}
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
