'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutGrid, Zap, Sprout, Cpu, FileText, Eye, ShoppingBag, MessageSquare, LogOut, Settings, Sparkles,
  ShieldCheck, NotebookPen, BrainCircuit, Headset, Wrench, MapPinned, BarChart3,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { authedFetch } from '@/lib/api-client';

const NAV_GROUPS = [
  {
    label: 'Monitor',
    items: [
      { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
      { href: '/dashboard/energy', label: 'Energy Monitoring', icon: Zap },
      { href: '/dashboard/fault-detection', label: 'AI Fault Detection', icon: Cpu },
      { href: '/dashboard/farm', label: 'Smart Farm Prediction', icon: Sprout },
    ],
  },
  {
    label: 'Automate',
    items: [
      { href: '/dashboard/reports', label: 'Automated Reports', icon: FileText },
      { href: '/dashboard/inspection', label: 'Computer Vision', icon: Eye },
      { href: '/dashboard/assistant', label: 'AI Assistant', icon: MessageSquare },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/dashboard/equipment', label: 'Equipment', icon: Wrench },
      { href: '/dashboard/safety', label: 'Safety & Compliance', icon: ShieldCheck },
      { href: '/dashboard/maps', label: 'Maps', icon: MapPinned },
      { href: '/dashboard/notes', label: 'AI Notes', icon: NotebookPen },
      { href: '/dashboard/recommendations', label: 'Recommendations', icon: BrainCircuit },
      { href: '/dashboard/support', label: 'Support Assistant', icon: Headset },
      { href: '/dashboard/admin', label: 'Admin Dashboard', icon: BarChart3 },
    ],
  },
  {
    label: 'Grow',
    items: [
      { href: '/dashboard/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { href: '/pricing', label: 'Upgrade Plan', icon: Sparkles },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logOut } = useAuth();
  const [companyRole, setCompanyRole] = useState('');

  useEffect(() => {
    if (!user) return;
    let active = true;
    authedFetch('/api/companies')
      .then((data) => {
        if (active) setCompanyRole(data.membership?.role || '');
      })
      .catch((error) => console.error('workspace role lookup failed', error));
    return () => {
      active = false;
    };
  }, [user]);

  async function handleLogout() {
    await logOut();
    router.push('/');
  }

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 border-r border-border bg-white flex flex-col">
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <Image src="/logo.png" alt="Brief Group" width={32} height={32} className="h-8 w-8 object-contain" />
        <span className="font-display font-semibold tracking-tight">Brief Group</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.filter((item) => item.href !== '/dashboard/admin' || ['owner', 'admin', 'manager'].includes(companyRole)).map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      active
                        ? 'bg-amber/[0.07] text-amber font-medium'
                        : 'text-ink-300 hover:text-ink-100 hover:bg-base-800'
                    )}
                  >
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-amber" />}
                    <item.icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-300 hover:text-ink-100 hover:bg-base-800 transition-colors">
          <Settings size={17} />
          Settings
        </Link>
        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <div className="w-8 h-8 rounded-full bg-cyan/10 text-cyan flex items-center justify-center text-xs font-semibold shrink-0">
            {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{user?.displayName || 'Pilot Partner'}</div>
            <div className="text-xs text-ink-500 truncate">{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="text-ink-500 hover:text-alert transition-colors" title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
