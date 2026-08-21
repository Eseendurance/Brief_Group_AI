'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Onboarding() {
  // Initialize from localStorage to avoid calling setState inside an effect.
  const [show, setShow] = useState(() => {
    try {
      const seen = localStorage.getItem('brief:onboardShown');
      return !seen; // show when not seen
    } catch (e) {
      return true;
    }
  });
n  function dismiss() {
    try {
      localStorage.setItem('brief:onboardShown', '1');
    } catch (e) {}
    setShow(false);
  }
n  if (!show) return null;
n  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="max-w-xl w-full card p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold text-lg">Welcome to Brief Group</h3>
            <p className="text-ink-500 text-sm mt-2">This short guide shows where to find modules, how to open the dashboard, and how to use the AI assistant.</p>
            <ul className="mt-4 text-sm space-y-2 text-ink-500">
              <li><strong>Dashboard</strong>: Protected view of live monitoring and AI tools.</li>
              <li><strong>Marketplace</strong>: Buy and sell equipment (coming soon).</li>
              <li><strong>AI Assistant</strong>: Ask about your energy data from the Dashboard → Assistant.</li>
            </ul>
            <div className="mt-4 flex gap-2">
              <Link href="/signup" className="bg-amber text-base-900 px-4 py-2 rounded-md font-medium">Get started</Link>
              <button onClick={dismiss} className="border border-border px-4 py-2 rounded-md">Dismiss</button>
            </div>
          </div>
          <div className="hidden sm:block w-36 h-28 bg-surface border border-border rounded-md" />
        </div>
      </div>
    </div>
  );
}
