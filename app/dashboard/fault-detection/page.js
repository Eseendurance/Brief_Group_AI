'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Cpu, Plus, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { computeFaultRisk } from '@/lib/fault-logic';
import { clsx } from 'clsx';

const LEVEL_STYLES = {
  Low: 'text-emerald bg-emerald/10 border-emerald/30',
  Watch: 'text-cyan bg-cyan/10 border-cyan/30',
  Elevated: 'text-amber bg-amber/10 border-amber/30',
  Critical: 'text-alert bg-alert/10 border-alert/30',
};

export default function FaultDetectionPage() {
  const { user } = useAuth();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ asset: '', temperature: '', vibration: '', voltageDeviationPct: '', loadPct: '' });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'fault_readings'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setReadings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  function updateForm(field, value) {
    const next = { ...form, [field]: value };
    setForm(next);
    const numeric = {
      temperature: Number(next.temperature) || undefined,
      vibration: Number(next.vibration) || undefined,
      voltageDeviationPct: Number(next.voltageDeviationPct) || undefined,
      loadPct: Number(next.loadPct) || undefined,
    };
    setPreview(computeFaultRisk(numeric));
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.asset) return;
    setSaving(true);
    try {
      const numeric = {
        temperature: Number(form.temperature) || undefined,
        vibration: Number(form.vibration) || undefined,
        voltageDeviationPct: Number(form.voltageDeviationPct) || undefined,
        loadPct: Number(form.loadPct) || undefined,
      };
      const result = computeFaultRisk(numeric);
      await addDoc(collection(db, 'fault_readings'), {
        uid: user.uid,
        asset: form.asset,
        inputs: numeric,
        result,
        createdAt: serverTimestamp(),
      });
      setForm({ asset: form.asset, temperature: '', vibration: '', voltageDeviationPct: '', loadPct: '' });
      setPreview(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><Cpu className="text-alert" size={22} /> AI Fault Detection</h1>
        <p className="text-ink-300 text-sm mt-1">A weighted, explainable risk model over temperature, vibration, voltage deviation, and load.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="h-40 flex items-center justify-center text-ink-500"><Loader2 className="animate-spin" size={20} /></div>
          ) : readings.length === 0 ? (
            <div className="card p-8 text-center text-ink-500 text-sm">No equipment readings logged yet.</div>
          ) : (
            <div className="space-y-3">
              {readings.map((r) => (
                <div key={r.id} className="card p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.asset}</div>
                    <div className="text-xs text-ink-500 mt-1">{r.result?.recommendation}</div>
                  </div>
                  <div className={clsx('shrink-0 text-right px-3 py-1.5 rounded-lg border text-xs font-medium', LEVEL_STYLES[r.result?.level])}>
                    <div className="mono-num text-sm">{r.result?.score}</div>
                    {r.result?.level}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6 h-fit sticky top-6">
          <h3 className="font-medium mb-4 flex items-center gap-2"><Plus size={16} className="text-amber" /> Log sensor reading</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Asset / equipment name</label>
              <input required value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })}
                className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" placeholder="e.g. Transformer T-2" />
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Surface temperature (°C)</label>
              <input type="number" value={form.temperature} onChange={(e) => updateForm('temperature', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" placeholder="e.g. 58" />
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Vibration (mm/s RMS)</label>
              <input type="number" step="0.1" value={form.vibration} onChange={(e) => updateForm('vibration', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" placeholder="e.g. 3.2" />
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Voltage deviation (%)</label>
              <input type="number" step="0.1" value={form.voltageDeviationPct} onChange={(e) => updateForm('voltageDeviationPct', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" placeholder="e.g. 3" />
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Load (% of rated capacity)</label>
              <input type="number" value={form.loadPct} onChange={(e) => updateForm('loadPct', e.target.value)}
                className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" placeholder="e.g. 75" />
            </div>

            {preview && (
              <div className={clsx('text-xs px-3 py-2 rounded-lg border flex justify-between items-center', LEVEL_STYLES[preview.level])}>
                <span>Live risk preview</span>
                <span className="font-medium mono-num">{preview.score} · {preview.level}</span>
              </div>
            )}

            <button type="submit" disabled={saving} className="w-full bg-amber text-base-900 font-medium py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save reading'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
