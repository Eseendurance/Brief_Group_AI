'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'briefgroup_install_dismissed';

// Genuinely optional: only shows when the browser fires its native
// beforeinstallprompt event (meaning install criteria — manifest, HTTPS,
// service worker — are already met), and never shows again once dismissed
// or once the app is already installed.
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const alreadyDismissed = localStorage.getItem(DISMISS_KEY);
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (alreadyDismissed || alreadyInstalled) return;

    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-border shadow-card rounded-xl px-4 py-3 max-w-sm w-[calc(100%-2rem)]">
      <Image src="/logo-192.png" alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-contain shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">Install Brief Group</div>
        <div className="text-xs text-ink-500">Optional — same platform, works like an app.</div>
      </div>
      <button onClick={handleInstall} className="bg-amber text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-amber-soft transition-colors shrink-0 flex items-center gap-1.5">
        <Download size={13} /> Install
      </button>
      <button onClick={handleDismiss} className="text-ink-500 hover:text-ink-100 transition-colors shrink-0" aria-label="Dismiss">
        <X size={16} />
      </button>
    </div>
  );
}
