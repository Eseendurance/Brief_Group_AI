'use client';

import { motion } from 'framer-motion';

// Signature visual motif: signal traveling through infrastructure nodes.
// Used on the landing hero (large) and echoed small in the dashboard header.
// Nodes represent the six product modules; lines represent the platform
// unifying them into one signal path.

const NODES = [
  { id: 'energy', x: 60, y: 200, color: '#12294F', label: 'Energy' },
  { id: 'fault', x: 190, y: 90, color: '#D7263D', label: 'Fault' },
  { id: 'forecast', x: 340, y: 150, color: '#12294F', label: 'Forecast' },
  { id: 'reports', x: 340, y: 280, color: '#12294F', label: 'Reports' },
  { id: 'vision', x: 190, y: 340, color: '#12294F', label: 'Vision' },
  { id: 'core', x: 220, y: 215, color: '#D7263D', label: 'Core' },
];

const EDGES = [
  ['core', 'energy'],
  ['core', 'fault'],
  ['core', 'forecast'],
  ['core', 'reports'],
  ['core', 'vision'],
];

export default function PulseGrid({ size = 'large', className = '' }) {
  const dims = size === 'large' ? { w: 420, h: 420 } : { w: 160, h: 160 };
  const scale = size === 'large' ? 1 : 0.38;

  const findNode = (id) => NODES.find((n) => n.id === id);

  return (
    <svg
      viewBox="0 0 420 420"
      width={dims.w}
      height={dims.h}
      className={className}
      role="img"
      aria-label="Animated diagram of Brief Group's connected AI modules"
    >
      {EDGES.map(([from, to], i) => {
        const a = findNode(from);
        const b = findNode(to);
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#E3E6EC" strokeWidth="1.5" />
            <motion.line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={b.color}
              strokeWidth="2"
              strokeDasharray="6 10"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: -160 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'linear', delay: i * 0.3 }}
              opacity={0.8}
            />
          </g>
        );
      })}
      {NODES.map((n, i) => (
        <g key={n.id}>
          <motion.circle
            cx={n.x}
            cy={n.y}
            r={n.id === 'core' ? 14 : 9}
            fill={n.color}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: (i * 0.37) % 1.5 }}
            style={{ filter: `drop-shadow(0 0 6px ${n.color})` }}
          />
          {size === 'large' && (
            <text
              x={n.x}
              y={n.y + 26}
              textAnchor="middle"
              fill="#454B57"
              fontSize="11"
              fontFamily="var(--font-inter)"
            >
              {n.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
