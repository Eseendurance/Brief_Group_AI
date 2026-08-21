import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Cpu, Factory, Leaf, ShieldCheck } from 'lucide-react';

const SOLUTIONS = [
  {
    title: 'Energy monitoring',
    icon: Factory,
    href: '/solutions/energy',
    description: 'Track consumption, detect anomalies, and surface operational risk with near real-time visibility across sites.',
  },
  {
    title: 'Smart farming intelligence',
    icon: Leaf,
    href: '/solutions/farming',
    description: 'Use weather, crop signals, and field trends to protect yield and reduce resource waste on the farm.',
  },
  {
    title: 'AI operations assistant',
    icon: Cpu,
    href: '/dashboard/assistant',
    description: 'Ask questions grounded in your energy, faults, and platform data. Get faster answers without digging through reports.',
  },
];

export default function SolutionsPage() {
  return (
    <main className="min-h-screen bg-white text-ink-100">
      <header className="border-b border-border bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Brief Group" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="font-display text-lg font-semibold">Brief Group</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-ink-300">
            <Link href="/solutions" className="hover:text-ink-100">Solutions</Link>
            <Link href="/solutions/energy" className="hover:text-ink-100">Energy</Link>
            <Link href="/solutions/farming" className="hover:text-ink-100">Farming</Link>
            <Link href="/pricing" className="hover:text-ink-100">Pricing</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-amber">
              <ShieldCheck size={14} /> Built for real-world operations
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">One platform for site risk, field performance, and smarter decisions.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-300">
              Brief Group connects energy, equipment, weather, and field data into one reliable operating view so teams can act earlier, report faster, and reduce avoidable downtime.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-amber px-5 py-3 font-medium text-white shadow-glow-amber transition-colors hover:bg-amber-soft">Start Pilot Program <ArrowRight size={16} /></Link>
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 font-medium text-ink-100 transition-colors hover:bg-surface">View Dashboard</Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-border bg-white p-3 shadow-card">
            <Image src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80" alt="Industrial monitoring and operations control room" width={1200} height={900} className="h-[470px] w-full rounded-[22px] object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {SOLUTIONS.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-[24px] border border-border bg-slate-50 p-6 transition-colors hover:border-cyan/30 hover:bg-white">
              <div className="mb-4 inline-flex rounded-xl bg-white p-3 text-cyan shadow-sm">
                <item.icon size={20} />
              </div>
              <h2 className="font-display text-2xl font-medium">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-300">{item.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-cyan">Learn more <ArrowRight size={16} /></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
