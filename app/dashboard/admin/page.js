'use client';

import Link from 'next/link';
import { ShieldCheck, Wrench, ClipboardList, BarChart3, MapPinned, Headset } from 'lucide-react';

const cards = [
  { label: 'Active equipment', value: '184', icon: Wrench },
  { label: 'Safety compliance', value: '96%', icon: ShieldCheck },
  { label: 'Open actions', value: '24', icon: ClipboardList },
  { label: 'Site coverage', value: '7 locations', icon: MapPinned },
];

export default function AdminDashboardPage() {
  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl">Business Admin Dashboard</h1>
        <p className="text-ink-300 text-sm mt-1">Track equipment, safety, operations, and team activity from a single management view.</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-ink-300">{label}</span>
              <Icon className="text-cyan" size={18} />
            </div>
            <div className="font-display text-3xl font-semibold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4"><BarChart3 className="text-amber" size={18} /> <h2 className="font-medium">Operational priorities</h2></div>
          <ul className="space-y-3 text-sm text-ink-300">
            <li>• Preventive maintenance for 12 critical assets</li>
            <li>• Safety inductions for 3 contractor teams</li>
            <li>• Weekly energy performance review</li>
            <li>• Compliance gap close-out for two sites</li>
          </ul>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4"><Headset className="text-cyan" size={18} /> <h2 className="font-medium">Operations tools</h2></div>
          <div className="space-y-3 text-sm">
            <Link href="/dashboard/equipment" className="block card p-3 hover:bg-base-800 transition-colors">Equipment tracking</Link>
            <Link href="/dashboard/safety" className="block card p-3 hover:bg-base-800 transition-colors">Safety & compliance</Link>
            <Link href="/dashboard/notes" className="block card p-3 hover:bg-base-800 transition-colors">AI notes generator</Link>
            <Link href="/dashboard/support" className="block card p-3 hover:bg-base-800 transition-colors">Support assistant</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
