'use client';

import { useState } from 'react';
import { NotebookPen, Loader2, Sparkles } from 'lucide-react';
import { authedFetch } from '@/lib/api-client';

export default function NotesGeneratorPage() {
  const [title, setTitle] = useState('Daily safety observation');
  const [context, setContext] = useState('Refinery shutdown checklist, lift inspections, and housekeeping observations for the next shift.');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOutput('');

    try {
      const result = await authedFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Write a concise operational note titled "${title}". Use this context: ${context}. Include: 1) brief summary, 2) key risks, 3) required actions, 4) date/owner and follow-up. Keep it professional, action-oriented, and suitable for site teams in Nigeria and international teams.`,
          }],
          context: { feature: 'AI note generator', title },
        }),
      });
      setOutput(result.reply || result.error || 'No note generated.');
    } catch (err) {
      setError(err.message || 'Unable to generate note.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><NotebookPen className="text-cyan" size={22} /> AI Notes Generator</h1>
        <p className="text-ink-300 text-sm mt-1">Create professional operational notes, handover records, and safety observations in seconds.</p>
      </div>

      <form onSubmit={handleGenerate} className="card p-6 mb-6 space-y-4">
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-cyan outline-none" />
        </div>
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Context</label>
          <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={6} className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-cyan outline-none" />
        </div>
        <button type="submit" disabled={loading} className="bg-cyan text-base-900 font-medium px-4 py-2.5 rounded-lg hover:bg-cyan-soft transition-colors disabled:opacity-50 flex items-center gap-2">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {loading ? 'Generating…' : 'Generate note'}
        </button>
      </form>

      {error && <div className="card p-4 text-alert text-sm mb-6">{error}</div>}

      {output && (
        <div className="card p-6 whitespace-pre-wrap text-sm leading-relaxed text-ink-100">
          {output}
        </div>
      )}
    </div>
  );
}
