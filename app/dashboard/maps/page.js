'use client';

import { useState } from 'react';
import { MapPinned } from 'lucide-react';

export default function MapsPage() {
  const [query, setQuery] = useState('Lekki Free Trade Zone, Lagos');
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><MapPinned className="text-amber" size={22} /> Site Maps & Asset Locations</h1>
        <p className="text-ink-300 text-sm mt-1">View site locations, equipment clusters, and operational map zones in a client-ready overview.</p>
      </div>

      <div className="card p-6 mb-6">
        <label className="text-xs text-ink-500 mb-1 block">Location search</label>
        <div className="flex gap-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" />
        </div>
      </div>

      <div className="card overflow-hidden">
        <iframe
          title="Site map"
          src={mapsUrl}
          className="w-full h-[520px] border-0"
          loading="lazy"
          allowFullScreen
        />
      </div>
    </div>
  );
}
