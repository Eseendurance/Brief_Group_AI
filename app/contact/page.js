'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle, Youtube, Instagram, Linkedin, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const SOCIALS = [
  {
    name: 'YouTube',
    handle: 'Brief Group',
    icon: Youtube,
    // Placeholder — swap in your real channel URL once you have it.
    href: 'https://www.youtube.com/results?search_query=Brief+Group',
  },
  {
    name: 'Instagram',
    handle: 'Brief Group',
    icon: Instagram,
    href: 'https://www.instagram.com/briefgroup',
  },
  {
    name: 'LinkedIn',
    handle: 'Brief Group',
    icon: Linkedin,
    href: 'https://www.linkedin.com/company/brief-group',
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  return (
    <main className="min-h-screen bg-white bg-grid-fade">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Brief Group" width={32} height={32} className="h-8 w-8 object-contain" />
            <span className="font-display font-semibold">Brief Group</span>
          </Link>
          <Link href="/" className="text-sm text-ink-300 hover:text-ink-100 flex items-center gap-1.5">
            <ArrowLeft size={15} /> Back
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight mb-3">Get in touch</h1>
          <p className="text-ink-300 mb-10">
            Questions about the pilot, pricing, or a technical issue — reach us directly, or use the form.
          </p>

          <div className="space-y-5 mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber/10 text-amber flex items-center justify-center shrink-0">
                <Mail size={18} />
              </div>
              <div>
                <div className="text-xs text-ink-500">Email</div>
                <a href="mailto:briefgroup1@gmail.com" className="text-sm font-medium hover:text-amber transition-colors">briefgroup1@gmail.com</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan/10 text-cyan flex items-center justify-center shrink-0">
                <Phone size={18} />
              </div>
              <div>
                <div className="text-xs text-ink-500">Phone</div>
                <a href="tel:+2348152158339" className="text-sm font-medium hover:text-amber transition-colors">+234 815 215 8339</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald/10 text-emerald flex items-center justify-center shrink-0">
                <MessageCircle size={18} />
              </div>
              <div>
                <div className="text-xs text-ink-500">WhatsApp</div>
                <a href="https://wa.me/2348152158339" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-amber transition-colors">Chat with us</a>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-ink-500 mb-3 uppercase tracking-wide font-semibold">Follow Brief Group</div>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${s.name} — verify this link, see note below`}
                  className="w-11 h-11 rounded-lg border border-border flex items-center justify-center text-ink-300 hover:text-amber hover:border-amber/30 transition-colors"
                >
                  <s.icon size={19} />
                </a>
              ))}
            </div>
            <p className="text-xs text-ink-500 mt-3 max-w-sm">
              These point to a placeholder/search URL for now — swap in your actual channel/profile links in{' '}
              <code className="text-ink-300">app/contact/page.js</code> once your accounts are live, so visitors
              don't land on someone else's page.
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          {status === 'done' ? (
            <div className="text-center py-10">
              <CheckCircle2 className="text-emerald mx-auto mb-3" size={32} />
              <h3 className="font-display font-medium text-lg mb-1">Message sent</h3>
              <p className="text-ink-300 text-sm">We'll get back to you at {form.email}.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-ink-300 mb-1.5 block">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors" />
              </div>
              <div>
                <label className="text-sm text-ink-300 mb-1.5 block">Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors" />
              </div>
              <div>
                <label className="text-sm text-ink-300 mb-1.5 block">Message</label>
                <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-base-800 border border-border rounded-lg px-3.5 py-2.5 text-sm focus:border-amber outline-none transition-colors resize-none" />
              </div>
              {error && (
                <div className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-xs rounded-lg p-3">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" /> {error}
                </div>
              )}
              <button type="submit" disabled={status === 'sending'}
                className="w-full flex items-center justify-center gap-2 bg-amber text-white font-medium py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50">
                {status === 'sending' && <Loader2 className="animate-spin" size={16} />}
                Send message
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  );
}
