'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap,
  Cpu,
  LineChart,
  FileText,
  Eye,
  ShoppingBag,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  Leaf,
  Building2,
} from 'lucide-react';

const MODULES = [
  { icon: Zap, title: 'Smart Energy I&V', phase: 'Phase 1 · Core', desc: 'Real-time energy visibility, usage verification, site benchmarking, and consumption alerts.', color: 'text-amber' },
  { icon: Cpu, title: 'AI Fault Detection', phase: 'Phase 1 · Core', desc: 'A weighted risk model flags which machine, cable, or transformer is trending toward failure before it happens.', color: 'text-alert' },
  { icon: LineChart, title: 'Energy Forecasting', phase: 'Phase 2 · Intelligence', desc: 'Live weather and usage patterns combine to predict demand and flag cost spikes before they arrive.', color: 'text-cyan' },
  { icon: FileText, title: 'Automated Reports', phase: 'Phase 2 · Automation', desc: 'Boardroom-ready energy, farm, and inspection reports, generated from your real platform data.', color: 'text-emerald' },
  { icon: Eye, title: 'Computer Vision Inspection', phase: 'Phase 3 · Vision', desc: 'Upload a photo of a panel or transformer and get an AI-assisted fault read, no site visit required.', color: 'text-cyan' },
  { icon: ShoppingBag, title: 'Digital Marketplace', phase: 'Phase 3 · Marketplace', desc: 'A trusted buy-and-sell layer for energy equipment, parts, and maintenance providers. Coming soon.', color: 'text-amber' },
];

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: 'Operational oversight', text: 'Track live site conditions across utilities, industrial assets, and agricultural operations in one place.' },
  { icon: BarChart3, title: 'Actionable intelligence', text: 'Translate raw meters, weather, and sensor signals into clean decisions and prioritized actions.' },
  { icon: Building2, title: 'Built for real operators', text: 'Designed for teams that need reporting, alerts, and field visibility without adding extra admin overhead.' },
];

const INDUSTRIES = ['Utilities', 'Manufacturing', 'Agri-tech', 'Infrastructure', 'Commercial facilities'];

const USE_CASES = [
  {
    title: 'Energy monitoring',
    href: '/solutions/energy',
    description: 'Track production, consumption, and anomaly alerts in one operational view for site teams and leadership.',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Smart farming',
    href: '/solutions/farming',
    description: 'Connect crop health, irrigation signals, and weather conditions to reduce waste and protect yield.',
    image: 'https://images.unsplash.com/photo-1464226184884-fa52ac9fcf8a?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'AI operations assistant',
    href: '/solutions',
    description: 'Answer questions, summarize readings, and surface the next best action from your platform data.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
  },
];

const ROADMAP = [
  { step: '1', title: 'Pilot Launch', desc: 'Live accounts, protected dashboard, reports, and inspections.' },
  { step: '2', title: 'Field Intelligence', desc: 'Weather, farm signals, energy verification, real-time alerts.' },
  { step: '3', title: 'Automation Layer', desc: 'Scheduled reports, fault scoring, and admin workflows.' },
  { step: '4', title: 'Marketplace', desc: 'Opens after pilot validation, connecting vendors and buyers.' },
];

const FAQ = [
  { q: 'What exactly is the pilot program?', a: 'Selected organizations get free access to Phase 1 — Smart Energy Monitoring with real-time dashboards, anomaly alerts, and automated reporting — in exchange for honest feedback that shapes the product.' },
  { q: 'Is there any cost to join?', a: 'Zero cost during the pilot. Partners also lock in preferred pricing for life once Brief Group moves to a paid subscription model.' },
  { q: 'Does it require hardware on-site?', a: 'Phase 1 can begin with existing smart meters and compatible IoT devices. We assess what you already have and work from there.' },
  { q: 'Is this only for Nigerian businesses?', a: 'No. Brief Group is headquartered in Nigeria but built for global markets from day one.' },
];

const HERO_IMAGE = 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80';
const OPERATIONS_IMAGE = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80';
const FIELD_IMAGE = 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80';

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.6, delay, ease: 'easeOut' },
  };
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-ink-100 overflow-x-hidden">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-border">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Brief Group" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="font-display font-semibold text-lg tracking-tight text-ink-100">Brief Group</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-ink-300">
            <Link href="/solutions" className="hover:text-ink-100 transition-colors">Solutions</Link>
            <Link href="/solutions/energy" className="hover:text-ink-100 transition-colors">Energy</Link>
            <Link href="/solutions/farming" className="hover:text-ink-100 transition-colors">Farming</Link>
            <Link href="/pricing" className="hover:text-ink-100 transition-colors">Pricing</Link>
            <a href="#roadmap" className="hover:text-ink-100 transition-colors">Roadmap</a>
            <a href="#faq" className="hover:text-ink-100 transition-colors">FAQ</a>
            <Link href="/contact" className="hover:text-ink-100 transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-300 hover:text-ink-100 transition-colors hidden sm:block">Log in</Link>
            <Link href="/signup" className="text-sm font-medium bg-amber text-white px-4 py-2 rounded-lg hover:bg-amber-soft transition-colors shadow-glow-amber">
              Apply for Pilot
            </Link>
          </div>
        </nav>
      </header>

      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-20 lg:pt-20 lg:pb-24">
        <div className="absolute inset-x-0 top-0 h-[500px] bg-[radial-gradient(circle_at_top,_rgba(18,41,79,0.12),transparent_60%)]" />
        <div className="relative grid lg:grid-cols-[1.05fr_0.95fr] items-center gap-12 lg:gap-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-amber bg-red-50 border border-red-100 rounded-full px-3 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-amber animate-nodeGlow" />
              Now accepting pilot partners
            </span>
            <h1 className="font-display font-semibold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight mb-6">
              AI infrastructure intelligence <span className="text-gradient">for the future.</span>
            </h1>
            <p className="text-ink-300 text-lg leading-relaxed mb-8 max-w-xl">
              Brief Group gives operations teams a real-time command center for energy monitoring, fault detection,
              farm intelligence, and remote inspection — one platform, six connected systems, born in Nigeria, built for the world.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/signup" className="inline-flex items-center gap-2 bg-amber text-white font-medium px-5 py-3 rounded-xl hover:bg-amber-soft transition-colors shadow-glow-amber">
                Start Pilot Program <ArrowRight size={16} />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center gap-2 border border-border text-ink-100 font-medium px-5 py-3 rounded-xl hover:bg-surface transition-colors">
                View Dashboard
              </Link>
            </div>
            <div className="flex flex-wrap gap-8 text-sm">
              <div>
                <div className="font-mono text-3xl text-amber font-medium mono-num">6</div>
                <div className="text-ink-500">Core SaaS modules</div>
              </div>
              <div>
                <div className="font-mono text-3xl text-cyan font-medium mono-num">24/7</div>
                <div className="text-ink-500">Monitoring posture</div>
              </div>
              <div>
                <div className="font-mono text-3xl text-emerald font-medium mono-num">100%</div>
                <div className="text-ink-500">Protected routes</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-[560px]">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-red-100 blur-3xl" />
              <div className="absolute -left-6 bottom-10 h-28 w-28 rounded-full bg-blue-100 blur-3xl" />
              <div className="relative overflow-hidden rounded-[30px] border border-border bg-white p-3 shadow-card">
                <Image src={HERO_IMAGE} alt="Operations team reviewing equipment and energy data" width={900} height={1100} className="h-[520px] w-full rounded-[22px] object-cover" priority />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="absolute -bottom-3 left-6 flex items-center gap-4 rounded-2xl border border-border bg-white/95 p-4 shadow-card backdrop-blur-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-amber">
                  <Zap size={22} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-ink-500">Live performance</div>
                  <div className="mt-1 font-display text-lg font-semibold">91.4% system health</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-slate-50/80">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-ink-500">
          {INDUSTRIES.map((item) => (
            <span key={item} className="rounded-full border border-border bg-white px-4 py-2 font-medium tracking-wide text-ink-300">{item}</span>
          ))}
        </div>
      </section>

      <section id="trust" className="max-w-7xl mx-auto px-6 py-24">
        <motion.div {...fadeUp()} className="mb-14 max-w-2xl">
          <span className="text-cyan text-sm font-medium">Why operators trust Brief Group</span>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-2 tracking-tight">
            Built to surface risk before it becomes downtime.
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
          <div className="grid md:grid-cols-3 gap-5">
            {TRUST_ITEMS.map((item, i) => (
              <motion.div key={item.title} {...fadeUp(i * 0.08)} className="card p-6">
                <item.icon className="mb-4 text-cyan" size={22} />
                <h3 className="font-display font-medium text-lg mb-2">{item.title}</h3>
                <p className="text-ink-300 text-sm leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.12)} className="relative overflow-hidden rounded-[28px] border border-border bg-white p-3 shadow-card">
            <Image src={OPERATIONS_IMAGE} alt="Solar field and operations center" width={960} height={1200} className="h-[470px] w-full rounded-[22px] object-cover" />
            <div className="absolute inset-x-8 bottom-8 rounded-2xl border border-white/60 bg-white/85 p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.14em] text-ink-500">
                <span>Site confidence</span>
                <span className="text-emerald">Up 18.6%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200">
                <div className="h-2 w-[78%] rounded-full bg-gradient-to-r from-emerald-500 to-cyan-700" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
          <motion.div {...fadeUp()} className="relative overflow-hidden rounded-[28px] border border-border bg-white p-3 shadow-card">
            <Image src={FIELD_IMAGE} alt="Field technician inspecting infrastructure" width={960} height={1200} className="h-[420px] w-full rounded-[22px] object-cover" />
          </motion.div>

          <motion.div {...fadeUp(0.08)}>
            <div className="mb-6 flex items-center gap-2 text-sm font-medium text-emerald bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5 w-fit">
              <Leaf size={16} />
              Field intelligence
            </div>
            <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight mb-5">From field conditions to boardroom decisions.</h2>
            <p className="text-ink-300 text-lg leading-relaxed mb-8">
              Brief Group connects energy, agriculture, and infrastructure data in one workflow so operational teams can act faster, document issues clearly, and reduce unplanned outages.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <div className="font-mono text-2xl text-amber mono-num">31%</div>
                <div className="text-ink-500 text-sm mt-2">Lower manual reporting time</div>
              </div>
              <div className="card p-5">
                <div className="font-mono text-2xl text-cyan mono-num">4.2x</div>
                <div className="text-ink-500 text-sm mt-2">Faster detection of site risk</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-border">
        <motion.div {...fadeUp()} className="mb-12 max-w-2xl">
          <span className="text-cyan text-sm font-medium">Use cases</span>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-2 tracking-tight">
            Built for the operations teams that keep power, farms, and infrastructure running.
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {USE_CASES.map((item, i) => (
            <motion.div key={item.title} {...fadeUp(i * 0.08)} className="group overflow-hidden rounded-[28px] border border-border bg-white shadow-card transition-transform duration-300 hover:-translate-y-1">
              <div className="relative h-56 overflow-hidden">
                <Image src={item.image} alt={item.title} width={900} height={700} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-6">
                <h3 className="font-display font-medium text-xl mb-2">{item.title}</h3>
                <p className="text-ink-300 text-sm leading-relaxed mb-4">{item.description}</p>
                <Link href={item.href} className="inline-flex items-center gap-2 text-sm font-medium text-cyan hover:text-ink-100 transition-colors">
                  Explore this solution <ArrowRight size={16} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="solutions" className="max-w-7xl mx-auto px-6 py-24 border-t border-border">
        <motion.div {...fadeUp()} className="mb-14 max-w-2xl">
          <span className="text-cyan text-sm font-medium">What we do</span>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-2 tracking-tight">
            One platform. Six intelligent systems.
          </h2>
          <p className="text-ink-300 mt-4">
            IoT, machine learning, computer vision, and marketplace infrastructure — unified into one ecosystem solving real operational problems.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m, i) => (
            <motion.div key={m.title} {...fadeUp(i * 0.08)} className="card p-6 transition-colors group hover:border-amber/30">
              <m.icon className={`${m.color} mb-4`} size={26} />
              <div className="text-xs text-ink-500 mb-1">{m.phase}</div>
              <h3 className="font-display font-medium text-lg mb-2">{m.title}</h3>
              <p className="text-ink-300 text-sm leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="roadmap" className="max-w-7xl mx-auto px-6 py-24 border-t border-border">
        <motion.div {...fadeUp()} className="mb-14 max-w-2xl">
          <span className="text-emerald text-sm font-medium">Roadmap</span>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-2 tracking-tight">
            A practical path from pilot to global operations.
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-4 gap-5">
          {ROADMAP.map((r, i) => (
            <motion.div key={r.step} {...fadeUp(i * 0.1)} className="relative card p-6">
              <div className="font-mono text-amber text-sm mb-3 mono-num">{r.step.padStart(2, '0')}</div>
              <h3 className="font-display font-medium mb-2">{r.title}</h3>
              <p className="text-ink-300 text-sm">{r.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="faq" className="max-w-4xl mx-auto px-6 py-24 border-t border-border">
        <motion.div {...fadeUp()} className="mb-12">
          <h2 className="font-display font-semibold text-3xl tracking-tight">Common questions</h2>
        </motion.div>
        <div className="space-y-4">
          {FAQ.map((f, i) => (
            <motion.div key={f.q} {...fadeUp(i * 0.06)} className="card p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald shrink-0 mt-0.5" size={18} />
                <div>
                  <h3 className="font-medium mb-1.5">{f.q}</h3>
                  <p className="text-ink-300 text-sm leading-relaxed">{f.a}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="pilot" className="max-w-5xl mx-auto px-6 py-24 border-t border-border text-center">
        <motion.div {...fadeUp()}>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight mb-4">
            Become a founding pilot partner.
          </h2>
          <p className="text-ink-300 max-w-xl mx-auto mb-8">
            Free Phase 1 access, direct product influence, and pricing locked for life. Pilot spots are limited — every application is reviewed personally.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSd-WTLo_0wyV7e97O-hMAFdDI2-IG-IxA7kIQGReslAAjWMsw/viewform" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-amber text-white font-medium px-6 py-3 rounded-xl hover:bg-amber-soft transition-colors shadow-glow-amber">
              Apply to Join the Pilot <ArrowRight size={16} />
            </a>
            <a href="mailto:Briefgroup1@gmail.com" className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-xl hover:bg-surface transition-colors">
              Email Us
            </a>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-ink-500">
          <span>© 2026 Brief Group. Headquartered in Nigeria. All rights reserved.</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
            <Link href="/privacy" className="hover:text-ink-100 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ink-100 transition-colors">Terms</Link>
            <a href="tel:+2348152158339" className="hover:text-ink-100 transition-colors">+234 815 215 8339</a>
            <a href="https://wa.me/2348152158339" target="_blank" rel="noopener noreferrer" className="hover:text-ink-100 transition-colors">WhatsApp</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
