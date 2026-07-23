'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from 'recharts';
import { Zap, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { detectEnergyAnomalies, summarizeEnergy } from '@/lib/energy-logic';
import StatCard from '@/components/StatCard';

export default function EnergyPage() {
  const { user } = useAuth();
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ site: '', kwh: '', cost: '' });

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'energy_readings'), where('uid', '==', user.uid), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setReadings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, [user]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.site || !form.kwh) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'energy_readings'), {
        uid: user.uid,
        site: form.site,
        kwh: Number(form.kwh),
        cost: Number(form.cost) || 0,
        timestamp: Date.now(),
        createdAt: serverTimestamp(),
      });
      setForm({ site: form.site, kwh: '', cost: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const annotated = detectEnergyAnomalies(readings);
  const summary = summarizeEnergy(readings);
  const chartData = annotated.map((r, i) => ({
    idx: i + 1,
    kwh: r.kwh,
    rollingMean: r.rollingMean,
    isAnomaly: r.isAnomaly,
    site: r.site,
  }));

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl flex items-center gap-2"><Zap className="text-amber" size={22} /> Energy Monitoring</h1>
        <p className="text-ink-300 text-sm mt-1">Real-time usage tracking with statistical anomaly detection (rolling z-score).</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total kWh" value={summary.totalKwh} color="amber" icon={Zap} />
        <StatCard label="Total Cost" value={`₦${summary.totalCost.toLocaleString()}`} color="cyan" />
        <StatCard label="Anomalies" value={summary.anomalyCount} sub={`Trend: ${summary.trend}`} color="alert" icon={AlertTriangle} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-medium mb-4">Usage over time</h3>
          {loading ? (
            <div className="h-72 flex items-center justify-center text-ink-500"><Loader2 className="animate-spin" size={20} /></div>
          ) : readings.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-ink-500 text-sm">Log a reading to see your chart.</div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#232D44" strokeDasharray="3 3" />
                <XAxis dataKey="idx" stroke="#7C879E" fontSize={12} />
                <YAxis stroke="#7C879E" fontSize={12} />
                <Tooltip contentStyle={{ background: '#131A2C', border: '1px solid #232D44', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="kwh" stroke="#FFB020" strokeWidth={2} dot={{ r: 3 }} name="kWh" />
                <Line type="monotone" dataKey="rollingMean" stroke="#22D3EE" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Rolling avg" />
                {chartData.filter((d) => d.isAnomaly).map((d) => (
                  <ReferenceDot key={d.idx} x={d.idx} y={d.kwh} r={6} fill="#FB5A5A" stroke="none" />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2"><Plus size={16} className="text-amber" /> Log a reading</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Site / meter</label>
              <input required value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })}
                className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" placeholder="e.g. Main Warehouse" />
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Usage (kWh)</label>
              <input required type="number" step="0.1" value={form.kwh} onChange={(e) => setForm({ ...form, kwh: e.target.value })}
                className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" placeholder="e.g. 142.5" />
            </div>
            <div>
              <label className="text-xs text-ink-500 mb-1 block">Cost (₦, optional)</label>
              <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full bg-base-800 border border-border rounded-lg px-3 py-2 text-sm focus:border-amber outline-none" placeholder="e.g. 21000" />
            </div>
            <button type="submit" disabled={saving} className="w-full bg-amber text-base-900 font-medium py-2.5 rounded-lg hover:bg-amber-soft transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Add reading'}
            </button>
          </form>
        </div>
      </div>

      {annotated.some((r) => r.isAnomaly) && (
        <div className="card p-5 mt-6 border-alert/30">
          <h3 className="font-medium text-alert flex items-center gap-2 mb-3"><AlertTriangle size={16} /> Flagged anomalies</h3>
          <div className="space-y-2">
            {annotated.filter((r) => r.isAnomaly).slice(-5).reverse().map((r, i) => (
              <div key={i} className="flex justify-between text-sm border-b border-border/60 pb-2 last:border-0">
                <span className="text-ink-300">{r.site}</span>
                <span className="mono-num">{r.kwh} kWh <span className="text-ink-500">(z={r.zScore})</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
