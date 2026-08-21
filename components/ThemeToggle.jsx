'use client';
import { useEffect, useState } from 'react';
nexport default function ThemeToggle({ className = '' }) {
  // Initialize theme from localStorage or system preference to avoid setState in effects.
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('brief:theme');
      if (stored) return stored;
      const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    } catch (e) {
      return 'light';
    }
  });
n  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('brief:theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('brief:theme', 'light');
      }
    } catch (e) {}
  }, [theme]);
n  return (
    <button
      aria-label="Toggle theme"
      className={`px-3 py-2 rounded-md border border-border text-sm ${className}`}
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
    >
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}
