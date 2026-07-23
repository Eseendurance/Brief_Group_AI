'use client';

import { useEffect, useRef, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { MessageSquare, Send, Loader2, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { authedFetch } from '@/lib/api-client';
import { summarizeEnergy } from '@/lib/energy-logic';

export default function AssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi, I'm your Brief Group assistant. Ask me about your energy usage, equipment risk, or how to use the platform." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const userMessage = { role: 'user', content: input };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError('');

    try {
      // Ground the assistant in the user's real, current data.
      const energyQ = query(collection(db, 'energy_readings'), where('uid', '==', user.uid), orderBy('timestamp', 'asc'));
      const energySnap = await getDocs(energyQ);
      const summary = summarizeEnergy(energySnap.docs.map((d) => d.data()));

      const result = await authedFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          context: { energySummary: summary },
        }),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto flex flex-col h-screen">
      <div className="mb-6 shrink-0">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><MessageSquare className="text-cyan" size={22} /> AI Assistant</h1>
        <p className="text-ink-300 text-sm mt-1">Powered by Claude, grounded in your real energy data.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-amber text-base-900' : 'card'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="card px-4 py-2.5 text-sm text-ink-500 flex items-center gap-2">
              <Loader2 className="animate-spin" size={14} /> Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-sm rounded-lg p-3 mb-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your energy usage, equipment risk…"
          className="flex-1 bg-base-800 border border-border rounded-xl px-4 py-3 text-sm focus:border-cyan outline-none"
        />
        <button type="submit" disabled={sending} className="bg-cyan text-base-900 font-medium px-4 rounded-xl hover:bg-cyan-soft transition-colors disabled:opacity-50">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
