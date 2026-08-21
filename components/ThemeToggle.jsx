'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('brief:theme');
      if (stored) setTheme(stored);
      else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
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

  return (
    <button
      aria-label="Toggle theme"
      className={`px-3 py-2 rounded-md border border-border text-sm ${className}`}
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
    >
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  );
}
