import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CloudRain, Droplets, Leaf, Sprout } from 'lucide-react';

const USE_CASES = [
  { icon: CloudRain, title: 'Weather-aware decisions', text: 'Use live forecasting to plan irrigation, ventilation, and pest management before stress hits the crop.' },
  { icon: Droplets, title: 'Water efficiency', text: 'Understand consumption patterns to reduce waste and improve runoff control without harming yield.' },
  { icon: Sprout, title: 'Health monitoring', text: 'Keep track of crop performance and environmental conditions from a single operational dashboard.' },
];

export default function FarmingSolutionsPage() {
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
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald">
              <Leaf size={14} /> Smart farming
            </span>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Give your farm the visibility it needs to protect yield and reduce waste.</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-300">
              Brief Group helps agricultural teams combine crop health, weather, and resource usage into a single decision layer that supports better planning and stronger farm performance.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-amber px-5 py-3 font-medium text-white shadow-glow-amber hover:bg-amber-soft">Apply for Pilot <ArrowRight size={16} /></Link>
              <Link href="/dashboard/farm" className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 font-medium text-ink-100 hover:bg-surface">Open farm dashboard</Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-border bg-white p-3 shadow-card">
            <Image src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80" alt="Healthy green farmland and crops" width={1200} height={900} className="h-[520px] w-full rounded-[24px] object-cover" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-5 md:grid-cols-3">
          {USE_CASES.map((item) => (
            <div key={item.title} className="rounded-[24px] border border-border bg-slate-50 p-6">
              <div className="mb-4 inline-flex rounded-xl bg-white p-3 text-emerald shadow-sm">
                <item.icon size={20} />
              </div>
              <h2 className="font-display text-2xl font-medium">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-300">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
