'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const COLOR_MAP = {
  amber: 'text-amber',
  cyan: 'text-cyan',
  emerald: 'text-emerald',
  alert: 'text-alert',
};

export default function StatCard({ label, value, sub, color = 'amber', icon: Icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-ink-500 text-xs font-medium uppercase tracking-wide">{label}</span>
        {Icon && <Icon size={16} className={COLOR_MAP[color]} />}
      </div>
      <div className={clsx('font-mono text-2xl font-medium mono-num', COLOR_MAP[color])}>{value}</div>
      {sub && <div className="text-ink-500 text-xs mt-1">{sub}</div>}
    </motion.div>
  );
}
