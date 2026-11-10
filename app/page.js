'use client';

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MapPinned,
  Pause,
  Play,
  ShieldCheck,
  Sprout,
  Wrench,
  Zap,
} from 'lucide-react';

const FIELD_PHOTOS = [
  {
    src: '/briefgroup-farm-operations.png',
    alt: 'Illustrative Brief Group farm operations scene',
    caption: 'A closer view of the work in the field.',
  },
  {
    src: '/briefgroup-office.png',
    alt: 'Illustrative Brief Group office scene',
    caption: 'A little more room to think things through.',
  },
  {
    src: '/briefgroup-field-engineer.png',
    alt: 'Illustrative Brief Group site inspection scene',
    caption: 'The details matter when you are on site.',
  },
  {
    src: '/briefgroup-workspace.png',
    alt: 'Illustrative Brief Group workspace scene',
    caption: 'Planning starts with a clear picture.',
  },
  {
    src: '/briefgroup-solar-inspection.png',
    alt: 'Illustrative Brief Group solar inspection scene',
    caption: 'Thoughtful checks, one step at a time.',
  },
  {
    src: '/briefgroup-farm-survey.png',
    alt: 'Illustrative Brief Group farm survey scene',
    caption: 'Bring field observations into your routine.',
  },
  {
    src: '/briefgroup-field-team.png',
    alt: 'Illustrative Brief Group field work scene',
    caption: 'Keep useful notes close to the work.',
  },
];

const TOOLS = [
  {
    icon: Zap,
    title: 'Energy readings',
    status: 'Available',
    description: 'Record usage and review changes over time. You can start manually; connected meter data is not assumed.',
  },
  {
    icon: Wrench,
    title: 'Equipment records',
    status: 'Available',
    description: 'Keep asset details and observations together so your team has a clearer maintenance history.',
  },
  {
    icon: Eye,
    title: 'Inspection support',
    status: 'AI-assisted',
    description: 'Turn submitted equipment photos into draft observations. A qualified person still needs to verify findings.',
  },
  {
    icon: FileText,
    title: 'Reports and notes',
    status: 'AI-assisted',
    description: 'Create a first draft from information you provide, then check it before sharing or relying on it.',
  },
  {
    icon: Sprout,
    title: 'Farm conditions',
    status: 'Available',
    description: 'Review weather-based crop observations using live forecast data and the location you select.',
  },
  {
    icon: MapPinned,
    title: 'Sites and maps',
    status: 'In progress',
    description: 'Location tools are being refined. Add only the site information your organization is comfortable sharing.',
  },
];

const STEPS = [
  ['01', 'Set up your space', 'Add your organization details and choose who can manage the workspace.'],
  ['02', 'Start with a record', 'Enter an energy reading, equipment detail, or field observation. No hardware connection is required to begin.'],
  ['03', 'Review and share carefully', 'Use reports and AI-assisted drafts as a starting point, with a person responsible for checking the result.'],
];

const QUESTIONS = [
  {
    question: 'Can my coworkers see all of my records?',
    answer: 'Not yet. Company profiles and team roles are available, but most operational records are still tied to individual accounts. Do not use the workspace as shared company record storage until that migration is complete.',
  },
  {
    question: 'Does Brief Group replace a safety inspection?',
    answer: 'No. The platform can help organize information and draft observations. It does not certify equipment, confirm legal compliance, or replace a qualified safety or engineering professional.',
  },
  {
    question: 'Do I need to connect equipment first?',
    answer: 'No. You can enter information yourself. Automated meter and device connections depend on the equipment and are not represented as available by default.',
  },
  {
    question: 'What does access cost?',
    answer: 'Pilot availability and any fees are confirmed with each organization before onboarding. Contact us if you need current pricing or a walkthrough.',
  },
];

function FieldPhotoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const shouldPause = paused || hovered || focused || prefersReducedMotion;

  useEffect(() => {
    if (shouldPause) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % FIELD_PHOTOS.length);
    }, 9000);
    return () => window.clearInterval(timer);
  }, [shouldPause]);

  function showPhoto(index) {
    setActiveIndex((index + FIELD_PHOTOS.length) % FIELD_PHOTOS.length);
  }

  return (
    <div
      className="relative mx-auto w-full max-w-[560px] px-1 py-5 sm:px-4 sm:py-8"
      role="region"
      aria-roledescription="carousel"
      aria-label="Illustrative Brief Group field and workspace photos"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="relative aspect-[0.94] overflow-hidden rounded-[26px] bg-[#E9EDF2] shadow-[0_24px_70px_rgba(18,41,79,0.16)] sm:aspect-[1.04]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={FIELD_PHOTOS[activeIndex].src}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 1.025 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.65, ease: 'easeOut' }}
          >
            <Image
              src={FIELD_PHOTOS[activeIndex].src}
              alt={FIELD_PHOTOS[activeIndex].alt}
              fill
              priority={activeIndex === 0}
              sizes="(max-width: 1024px) 90vw, 540px"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-48 bg-gradient-to-t from-black/75 via-black/25 to-transparent sm:h-56" />
        <div className="absolute left-4 top-4 z-20 rounded-full border border-white/35 bg-black/35 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white backdrop-blur-sm sm:left-5 sm:top-5 sm:text-xs">
          Illustrative Brief Group imagery
        </div>
        <div className="absolute inset-x-4 bottom-4 z-20 sm:inset-x-5 sm:bottom-5">
          <p className="max-w-sm text-lg font-medium leading-snug text-white sm:text-2xl">
            {FIELD_PHOTOS[activeIndex].caption}
          </p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5" role="group" aria-label="Choose a photo">
              {FIELD_PHOTOS.map((photo, index) => (
                <button
                  key={photo.src}
                  type="button"
                  aria-label={`Show photo ${index + 1} of ${FIELD_PHOTOS.length}`}
                  aria-pressed={activeIndex === index}
                  onClick={() => showPhoto(index)}
                  className={`h-1.5 rounded-full transition-all ${activeIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/85'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => showPhoto(activeIndex - 1)}
                aria-label="Show previous photo"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => showPhoto(activeIndex + 1)}
                aria-label="Show next photo"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
              >
                <ChevronRight size={18} />
              </button>
              {!prefersReducedMotion && (
                <button
                  type="button"
                  onClick={() => setPaused((value) => !value)}
                  aria-label={paused ? 'Play automatic photo changes' : 'Pause automatic photo changes'}
                  aria-pressed={paused}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/45 bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
                >
                  {paused ? <Play size={15} /> : <Pause size={15} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="mt-3 px-1 text-[11px] leading-5 text-ink-500">
        These images are illustrative and are not customer stories or evidence of live monitoring.
      </p>
    </div>
  );
}

function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="mb-10 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-ink-100 sm:text-4xl">{title}</h2>
      {children && <p className="mt-4 max-w-xl text-sm leading-7 text-ink-300 sm:text-base">{children}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="min-h-screen overflow-hidden bg-white text-ink-100">
        <header className="sticky top-0 z-50 border-b border-[#E8EAF0]/90 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Brief Group home">
              <Image src="/logo-192.png" alt="" width={34} height={34} className="h-[34px] w-[34px] object-contain" priority />
              <span className="font-display text-base font-semibold tracking-tight">Brief Group</span>
            </Link>
            <div className="hidden items-center gap-7 text-sm text-ink-300 md:flex">
              <a href="#tools" className="transition-colors hover:text-ink-100">Tools</a>
              <a href="#how-it-works" className="transition-colors hover:text-ink-100">How it works</a>
              <a href="#limits" className="transition-colors hover:text-ink-100">What to know</a>
              <Link href="/contact" className="transition-colors hover:text-ink-100">Contact</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-ink-300 transition-colors hover:text-ink-100 sm:inline-flex">Sign in</Link>
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-alert">
                Create account <ArrowRight size={15} />
              </Link>
            </div>
          </nav>
        </header>

        <section className="relative isolate border-b border-[#E8EAF0] bg-[linear-gradient(180deg,#F8F9FB_0%,#FFFFFF_100%)]">
          <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 pb-12 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-0 lg:py-16">
            <motion.div
              className="relative z-20 max-w-xl"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-[#DDE3ED] bg-white px-3 py-1.5 text-xs font-medium text-cyan">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                A practical operations workspace
              </span>
              <h1 className="mt-6 font-display text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.045em] text-ink-100 sm:text-5xl lg:text-[3.55rem]">
                Keep the details of your work in one place.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-ink-300 sm:text-lg sm:leading-8">
                Organize energy readings, equipment notes, and inspection records with a workspace your team can grow into.
                Start with the information you already have.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-amber px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(215,38,61,0.18)] transition-transform hover:-translate-y-0.5 hover:bg-alert">
                  Create your account <ArrowRight size={16} />
                </Link>
                <a href="#tools" className="inline-flex items-center gap-2 rounded-xl border border-[#DDE1E8] bg-white px-5 py-3 text-sm font-semibold text-cyan transition-colors hover:bg-[#F7F8FA]">
                  Explore the tools <ArrowDown size={15} />
                </a>
              </div>
              <p className="mt-5 max-w-lg text-xs leading-5 text-ink-500">
                This is an early-stage product. Company and team setup is available; most operational records are not yet shared across team accounts.
              </p>
            </motion.div>
            <FieldPhotoCarousel />
          </div>
        </section>

        <section id="tools" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
          <SectionHeading eyebrow="Tools for everyday work" title="Start with a clear record.">
            Use the parts of Brief Group that fit your workflow today. Each tool is labeled honestly, and important decisions stay with your team.
          </SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map(({ icon: Icon, title, status, description }, index) => (
              <motion.article
                key={title}
                className="rounded-2xl border border-[#E5E8ED] bg-white p-5 transition-shadow hover:shadow-[0_12px_35px_rgba(18,41,79,0.07)] sm:p-6"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3F5F8] text-cyan"><Icon size={20} /></span>
                  <span className="rounded-full bg-[#F5F6F8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-500">{status}</span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-300">{description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 border-y border-[#E8EAF0] bg-[#F7F8FA]">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <SectionHeading eyebrow="Getting started" title="A calmer way to get organized.">
                No complicated setup is needed to begin. Bring the details you have, and build from there.
              </SectionHeading>
              <Link href="/onboarding" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:text-amber">
                Learn about company setup <ArrowRight size={15} />
              </Link>
            </div>
            <div className="space-y-3">
              {STEPS.map(([number, title, description]) => (
                <div key={number} className="flex gap-4 rounded-2xl border border-[#E5E8ED] bg-white p-5 sm:gap-6 sm:p-6">
                  <span className="pt-0.5 font-mono text-xs font-medium text-amber">{number}</span>
                  <div>
                    <h3 className="font-display font-semibold tracking-tight">{title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-ink-300">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="limits" className="mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <SectionHeading eyebrow="Important to know" title="Useful support, with people in charge.">
              Brief Group is designed to help organize operational work—not make safety-critical decisions on your behalf.
            </SectionHeading>
            <div className="rounded-2xl border border-[#E5E8ED] bg-[#F7F8FA] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-cyan" size={20} />
                <p className="text-sm leading-6 text-ink-300">
                  AI output can be incomplete or wrong. Verify generated notes and recommendations, and follow your organization’s approved procedures and local requirements.
                </p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-[#E8EAF0]">
            {QUESTIONS.map(({ question, answer }) => (
              <article key={question} className="py-5 first:pt-0 last:pb-0">
                <h3 className="font-display text-base font-semibold tracking-tight">{question}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-300">{answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-[#E8EAF0] bg-[#F7F8FA]">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center md:py-16">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">See if Brief Group fits your team.</h2>
              <p className="mt-3 text-sm leading-6 text-ink-300">
                Create an account to explore the current pilot, or contact us to talk through your organization’s needs.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-amber px-5 py-3 text-sm font-semibold text-white hover:bg-alert">
                Create account <ArrowRight size={15} />
              </Link>
              <Link href="/contact" className="inline-flex items-center rounded-xl border border-[#DDE1E8] bg-white px-5 py-3 text-sm font-semibold text-cyan hover:bg-[#F2F4F7]">
                Contact us
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-[#E8EAF0] bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-7 text-xs text-ink-500 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo-192.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
              <span>© 2026 Brief Group · Based in Nigeria</span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/privacy" className="hover:text-ink-100">Privacy</Link>
              <Link href="/terms" className="hover:text-ink-100">Terms</Link>
              <Link href="/contact" className="hover:text-ink-100">Support</Link>
              <a href="mailto:Briefgroup1@gmail.com" className="hover:text-ink-100">Briefgroup1@gmail.com</a>
            </div>
          </div>
        </footer>
      </main>
    </MotionConfig>
  );
}
