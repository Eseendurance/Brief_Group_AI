'use client';
import { useEffect } from 'react';

// Simple theme bootstrapper: sets initial html.dark class from localStorage or system preference.
export default function ThemeProvider() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem('brief:theme');
      if (stored === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (stored === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // respect system preference by default
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) document.documentElement.classList.add('dark');
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return null;
}
