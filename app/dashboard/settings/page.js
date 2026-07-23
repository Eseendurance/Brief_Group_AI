'use client';

import { Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user, logOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logOut();
    router.push('/');
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><Settings className="text-ink-300" size={22} /> Settings</h1>
        <p className="text-ink-300 text-sm mt-1">Your account details.</p>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <div className="text-xs text-ink-500 mb-1">Name</div>
          <div className="text-sm">{user?.displayName || '—'}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500 mb-1">Email</div>
          <div className="text-sm">{user?.email}</div>
        </div>
        <div>
          <div className="text-xs text-ink-500 mb-1">Account ID</div>
          <div className="text-sm font-mono mono-num text-ink-500">{user?.uid}</div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-alert text-sm font-medium mt-4 hover:text-alert/80 transition-colors">
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}
