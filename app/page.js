'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Zap, Cpu, LineChart, FileText, Eye, ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import PulseGrid from '@/components/PulseGrid';

const MODULES = [
  { icon: Zap, title: 'Smart Energy Intelligence', phase: 'Core', desc: 'Real-time energy visibility, usage verification, benchmarking, and live site anomaly alerts for power-heavy operations.', color: 'text-amber' },
  { icon: Cpu, title: 'AI Fault Detection', phase: 'Core', desc: 'Weighted risk scoring identifies which asset or equipment cluster is trending toward failure before downtime hits.', color: 'text-alert' },
  { icon: LineChart, title: 'AI Recommendations', phase: 'Optimization', desc: 'Operational action plans ranked by impact, cost, urgency, and maintenance priority for teams and leadership.', color: 'text-cyan' },
  { icon: FileText, title: 'Automated Reports', phase: 'Automation', desc: 'Board-ready reports, compliance summaries, site health notes, and executive reviews generated from real data.', color: 'text-emerald' },
  { icon: Eye, title: 'Computer Vision Inspection', phase: 'Vision', desc: 'Upload photos of transformers, panels, or machinery to get AI-assisted fault detection and visual risk summaries.', color: 'text-cyan' },
  { icon: ShoppingBag, title: 'Marketplace & Procurement', phase: 'Growth', desc: 'Trusted vendor and equipment marketplace for parts, maintenance services, and operational sourcing.', color: 'text-amber' },
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
    <main className="min-h-screen bg-base-900 overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-base-900/80 border-b border-border">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Brief Group" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="font-display font-semibold text-lg tracking-tight">Brief Group</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-ink-300">
            <a href="#solutions" className="hover:text-ink-100 transition-colors">Solutions</a>
            <Link href="/pricing" className="hover:text-ink-100 transition-colors">Pricing</Link>
            <a href="#roadmap" className="hover:text-ink-100 transition-colors">Roadmap</a>
            <a href="#faq" className="hover:text-ink-100 transition-colors">FAQ</a>
            <Link href="/contact" className="hover:text-ink-100 transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-ink-300 hover:text-ink-100 transition-colors hidden sm:block">Log in</Link>
            <Link href="/signup" className="text-sm font-medium bg-amber text-base-900 px-4 py-2 rounded-lg hover:bg-amber-soft transition-colors shadow-glow-amber">
              Apply for Pilot
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-2 gap-12 items-center bg-grid-fade">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-amber bg-amber/10 border border-amber/20 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber animate-nodeGlow" />
            Now accepting pilot partners
          </span>
          <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-[1.1] tracking-tight mb-6">
            AI infrastructure intelligence <span className="text-gradient">for the future.</span>
          </h1>
          <p className="text-ink-300 text-lg leading-relaxed mb-8 max-w-lg">
            Brief Group gives operations teams a real-time command center for energy monitoring, fault detection,
            farm intelligence, and remote inspection — one platform, six connected systems, born in Nigeria, built for the world.
          </p>
          <div className="flex flex-wrap gap-4 mb-10">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-amber text-base-900 font-medium px-5 py-3 rounded-xl hover:bg-amber-soft transition-colors shadow-glow-amber">
              Start Pilot Program <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 border border-border text-ink-100 font-medium px-5 py-3 rounded-xl hover:bg-surface transition-colors">
              View Dashboard
            </Link>
          </div>
          <div className="flex gap-8 text-sm">
            <div>
              <div className="font-mono text-2xl text-amber font-medium mono-num">6</div>
              <div className="text-ink-500">Core SaaS modules</div>
            </div>
            <div>
              <div className="font-mono text-2xl text-cyan font-medium mono-num">5</div>
              <div className="text-ink-500">Company access roles</div>
            </div>
            <div>
              <div className="font-mono text-2xl text-emerald font-medium mono-num">7 days</div>
              <div className="text-ink-500">Secure team invitations</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center animate-floaty"
        >
          <div className="card p-10 shadow-card">
            <PulseGrid size="large" />
          </div>
        </motion.div>
      </section>

      {/* Product suite */}
      <section id="solutions" className="max-w-7xl mx-auto px-6 py-24">
        <motion.div {...fadeUp()} className="mb-14 max-w-2xl">
          <span className="text-cyan text-sm font-medium">What we do</span>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl mt-2 tracking-tight">
            One platform. Six intelligent systems.
          </h2>
          <p className="text-ink-300 mt-4">
            IoT, machine learning, computer vision, and marketplace infrastructure — unified into one ecosystem
            solving real operational problems.
          </p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m, i) => (
            <motion.div key={m.title} {...fadeUp(i * 0.08)} className="card p-6 hover:border-amber/30 transition-colors group">
              <m.icon className={`${m.color} mb-4`} size={26} />
              <div className="text-xs text-ink-500 mb-1">{m.phase}</div>
              <h3 className="font-display font-medium text-lg mb-2">{m.title}</h3>
              <p className="text-ink-300 text-sm leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roadmap */}
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

      {/* FAQ */}
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

      {/* Pilot CTA */}
      <section id="pilot" className="max-w-5xl mx-auto px-6 py-24 border-t border-border text-center">
        <motion.div {...fadeUp()}>
          <h2 className="font-display font-semibold text-3xl sm:text-4xl tracking-tight mb-4">
            Become a founding pilot partner.
          </h2>
          <p className="text-ink-300 max-w-xl mx-auto mb-8">
            Free Phase 1 access, direct product influence, and pricing locked for life. Pilot spots are limited —
            every application is reviewed personally.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSd-WTLo_0wyV7e97O-hMAFdDI2-IG-IxA7kIQGReslAAjWMsw/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber text-base-900 font-medium px-6 py-3 rounded-xl hover:bg-amber-soft transition-colors shadow-glow-amber"
            >
              Apply to Join the Pilot <ArrowRight size={16} />
            </a>
            <a
              href="mailto:Briefgroup1@gmail.com"
              className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-xl hover:bg-surface transition-colors"
            >
              Email Us
            </a>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-ink-500">
          <span>© 2026 Brief Group. Headquartered in Nigeria. All rights reserved.</span>
          <div className="flex gap-6">
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
