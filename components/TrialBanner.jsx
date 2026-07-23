'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { getTrialStatus } from '@/lib/subscription';

export default function TrialBanner() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setStatus(getTrialStatus(snap.exists() ? snap.data() : null));
    });
    return () => unsub();
  }, [user]);

  if (!status || !status.onTrial && !status.expired) return null; // paid plan — no banner
  if (!status.expired && status.daysLeft > 5) return null; // don't nag early in the trial

  const expired = status.expired;

  return (
    <div className={`px-4 py-2.5 text-sm flex items-center justify-center gap-2 ${expired ? 'bg-alert text-white' : 'bg-amber/10 text-amber border-b border-amber/20'}`}>
      {expired ? <AlertTriangle size={15} /> : <Clock size={15} />}
      <span>
        {expired
          ? 'Your 14-day trial has ended. Upgrade to keep using AI reports, inspections, and the assistant.'
          : `${status.daysLeft} day${status.daysLeft === 1 ? '' : 's'} left in your free trial.`}
      </span>
      <Link href="/pricing" className={`font-medium underline underline-offset-2 ${expired ? '' : 'text-amber'}`}>
        {expired ? 'Upgrade now' : 'View plans'}
      </Link>
    </div>
  );
}
