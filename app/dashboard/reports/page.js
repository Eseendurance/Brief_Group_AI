'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, onSnapshot } from 'firebase/firestore';
import { FileText, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { authedFetch } from '@/lib/api-client';
import { summarizeEnergy } from '@/lib/energy-logic';

export default function ReportsPage() {
  const { user } = useAuth();
  const [siteName, setSiteName] = useState('');
  const [reportType, setReportType] = useState('Energy Performance');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentReport, setCurrentReport] = useState('');
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'reports'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingHistory(false);
    }, () => setLoadingHistory(false));
    return () => unsub();
  }, [user]);

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setCurrentReport('');
    try {
      const energyQ = query(collection(db, 'energy_readings'), where('uid', '==', user.uid), orderBy('timestamp', 'asc'));
      const energySnap = await getDocs(energyQ);
      const readings = energySnap.docs.map((d) => d.data());
      const summary = summarizeEnergy(readings);

      const faultQ = query(collection(db, 'fault_readings'), where('uid', '==', user.uid));
      const faultSnap = await getDocs(faultQ);
      const faults = faultSnap.docs.map((d) => ({ asset: d.data().asset, ...d.data().result }));

      const data = { energySummary: summary, faultReadings: faults, readingCount: readings.length };

      const result = await authedFetch('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({ reportType, siteName, data }),
      });
      setCurrentReport(result.report);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><FileText className="text-emerald" size={22} /> Automated Reports</h1>
        <p className="text-ink-300 text-sm mt-1">Create a clear report from the energy and equipment data saved to your account.</p>
      </div>

      <form onSubmit={handleGenerate} className="card p-6 mb-6 grid sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Site name</label>
          <input required value={siteName} onChange={(e) => setSiteName(e.target.value)}
            className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" placeholder="e.g. Main Warehouse" />
        </div>
        <div>
          <label className="text-xs text-ink-500 mb-1 block">Report type</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}
            className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none">
            <option>Energy Performance</option>
            <option>Fault Risk & Maintenance</option>
            <option>Combined Operations</option>
          </select>
        </div>
        <button type="submit" disabled={generating} className="bg-amber text-base-900 font-medium py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {generating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          {generating ? 'Generating…' : 'Generate report'}
        </button>
      </form>

      {error && (
        <div className="flex items-start gap-2 bg-alert/10 border border-alert/30 text-alert text-sm rounded-lg p-4 mb-6">
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {currentReport && (
        <div className="card p-6 mb-8 whitespace-pre-wrap text-sm leading-relaxed text-ink-100">
          {currentReport}
        </div>
      )}

      <h2 className="font-medium mb-3 text-ink-300">Report history</h2>
      {loadingHistory ? (
        <div className="text-ink-500 text-sm flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Loading…</div>
      ) : history.length === 0 ? (
        <div className="card p-6 text-center text-ink-500 text-sm">No reports generated yet.</div>
      ) : (
        <div className="space-y-3">
          {history.map((r) => (
            <details key={r.id} className="card p-4">
              <summary className="cursor-pointer text-sm font-medium flex justify-between">
                <span>{r.reportType} — {r.siteName}</span>
                <span className="text-ink-500 text-xs">{r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : ''}</span>
              </summary>
              <div className="mt-3 text-sm text-ink-300 whitespace-pre-wrap">{r.content}</div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
