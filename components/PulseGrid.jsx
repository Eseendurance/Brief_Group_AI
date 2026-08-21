'use client';

// Static diagram version of PulseGrid — animations removed for a clean, enterprise look.
// Keeps the same positions and labels but renders without motion or CSS animations.

const NODES = [
  { id: 'energy', x: 60, y: 200, color: '#12294F', label: 'AI Operations Command Center' },
  { id: 'fault', x: 190, y: 90, color: '#D7263D', label: 'Computer Vision Inspection' },
  { id: 'forecast', x: 340, y: 150, color: '#12294F', label: 'Energy Forecasting' },
  { id: 'reports', x: 340, y: 280, color: '#12294F', label: 'Automated Reports' },
  { id: 'vision', x: 190, y: 340, color: '#12294F', label: 'Digital Marketplace' },
  { id: 'core', x: 220, y: 215, color: '#D7263D', label: 'Global Operations' },
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

  const findNode = (id) => NODES.find((n) => n.id === id);

  return (
    <svg
      viewBox="0 0 420 420"
      width={dims.w}
      height={dims.h}
      className={className}
      role="img"
      aria-label="Diagram of Brief Group's connected modules"
    >
      {EDGES.map(([from, to], i) => {
        const a = findNode(from);
        const b = findNode(to);
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#E3E6EC" strokeWidth="1.5" />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={b.color} strokeWidth="2" strokeDasharray="6 10" opacity={0.8} />
          </g>
        );
      })}
      {NODES.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r={n.id === 'core' ? 14 : 9} fill={n.color} />
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
