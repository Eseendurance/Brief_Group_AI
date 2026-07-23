'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Zap, Cpu, FileText, Eye, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { summarizeEnergy } from '@/lib/energy-logic';
import StatCard from '@/components/StatCard';
import PulseGrid from '@/components/PulseGrid';
import Link from 'next/link';

export default function DashboardOverview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [energySummary, setEnergySummary] = useState(null);
  const [faultCount, setFaultCount] = useState({ elevated: 0, critical: 0, total: 0 });
  const [reportCount, setReportCount] = useState(0);
  const [inspectionCount, setInspectionCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const energyQ = query(
          collection(db, 'energy_readings'),
          where('uid', '==', user.uid),
          orderBy('timestamp', 'asc'),
          limit(60)
        );
        const energySnap = await getDocs(energyQ);
        const readings = energySnap.docs.map((d) => d.data());
        if (!cancelled) setEnergySummary(summarizeEnergy(readings));

        const faultQ = query(collection(db, 'fault_readings'), where('uid', '==', user.uid), limit(100));
        const faultSnap = await getDocs(faultQ);
        let elevated = 0, critical = 0;
        faultSnap.docs.forEach((d) => {
          const level = d.data().result?.level;
          if (level === 'Elevated') elevated++;
          if (level === 'Critical') critical++;
        });
        if (!cancelled) setFaultCount({ elevated, critical, total: faultSnap.size });

        const reportsQ = query(collection(db, 'reports'), where('uid', '==', user.uid));
        const reportsSnap = await getDocs(reportsQ);
        if (!cancelled) setReportCount(reportsSnap.size);

        const inspectQ = query(collection(db, 'inspections'), where('uid', '==', user.uid));
        const inspectSnap = await getDocs(inspectQ);
        if (!cancelled) setInspectionCount(inspectSnap.size);
      } catch (err) {
        console.error('overview load error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-semibold text-2xl">Pilot Command</h1>
          <p className="text-ink-300 text-sm mt-1">
            Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}. Here's your live operational picture.
          </p>
        </div>
        <PulseGrid size="small" className="hidden md:block opacity-80" />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-500 py-16 justify-center">
          <Loader2 className="animate-spin" size={20} /> Loading your data…
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Energy" value={`${energySummary?.totalKwh ?? 0} kWh`} sub={`Trend: ${energySummary?.trend ?? 'flat'}`} color="amber" icon={Zap} />
            <StatCard label="Anomalies Flagged" value={energySummary?.anomalyCount ?? 0} sub="Statistically significant spikes" color="cyan" icon={Zap} />
            <StatCard label="Equipment At Risk" value={faultCount.critical + faultCount.elevated} sub={`${faultCount.critical} critical · ${faultCount.elevated} elevated`} color="alert" icon={Cpu} />
            <StatCard label="Reports Generated" value={reportCount} sub={`${inspectionCount} inspections logged`} color="emerald" icon={FileText} />
          </div>

          {energySummary?.totalKwh === 0 && faultCount.total === 0 && reportCount === 0 && inspectionCount === 0 && (
            <div className="card p-8 text-center">
              <h3 className="font-display font-medium text-lg mb-2">No pilot data yet</h3>
              <p className="text-ink-300 text-sm mb-5 max-w-md mx-auto">
                Log your first energy reading or equipment sensor check to start seeing real anomaly detection and fault scoring here.
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/dashboard/energy" className="bg-amber text-base-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-soft transition-colors">Log Energy Reading</Link>
                <Link href="/dashboard/fault-detection" className="border border-border text-sm font-medium px-4 py-2 rounded-lg hover:bg-surface transition-colors">Log Equipment Reading</Link>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/dashboard/farm" className="card p-6 hover:border-emerald/30 transition-colors">
              <Eye className="text-emerald mb-3" size={20} />
              <h3 className="font-medium mb-1">Check Farm Conditions</h3>
              <p className="text-ink-300 text-sm">Pull live weather and score crop health for your site.</p>
            </Link>
            <Link href="/dashboard/reports" className="card p-6 hover:border-amber/30 transition-colors">
              <FileText className="text-amber mb-3" size={20} />
              <h3 className="font-medium mb-1">Generate a Report</h3>
              <p className="text-ink-300 text-sm">Turn your real platform data into a boardroom-ready report.</p>
            </Link>
            <Link href="/dashboard/assistant" className="card p-6 hover:border-cyan/30 transition-colors">
              <Cpu className="text-cyan mb-3" size={20} />
              <h3 className="font-medium mb-1">Ask the AI Assistant</h3>
              <p className="text-ink-300 text-sm">Get answers grounded in your own energy and fault data.</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
