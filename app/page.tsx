"use client";

import {
  ArrowRight,
  BarChart3,
  Camera,
  Check,
  ChevronRight,
  HeartHandshake,
  LockKeyhole,
  Sprout,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FieldCarousel } from "@/app/components/landing/field-carousel";
import { DemoSandbox } from "@/app/components/landing/demo-sandbox";

const features = [
  {
    title: "Energy, made easier to understand",
    description:
      "Bring site readings together, spot unusual consumption, and give your team a clearer place to start.",
    icon: Zap,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "A little more certainty in the field",
    description:
      "Put weather, soil, crop, and irrigation context in reach when a growing decision cannot wait.",
    icon: Sprout,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Useful checks before the next shift",
    description:
      "Bring inspection notes and equipment signals into one practical view for the people doing the work.",
    icon: Camera,
    tone: "bg-indigo-50 text-indigo-700",
  },
  {
    title: "Updates people can actually use",
    description:
      "Turn operational details into readable summaries for site teams, managers, and pilot partners.",
    icon: BarChart3,
    tone: "bg-sky-50 text-sky-700",
  },
];

const assurances = [
  "Your team stays in control",
  "Real weather data when you need it",
  "Human support is one message away",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-800">
      <nav
        aria-label="Primary navigation"
        className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/brief-group-logo.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl"
            />
            <span className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              Brief Group
            </span>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a className="transition hover:text-emerald-700" href="#platform">
              What we do
            </a>
            <a className="transition hover:text-emerald-700" href="#fieldwork">
              In the field
            </a>
            <a className="transition hover:text-emerald-700" href="#try-it">
              Try it
            </a>
            <a className="transition hover:text-emerald-700" href="#pricing">
              Pricing
            </a>
            <Link
              className="transition hover:text-emerald-700"
              href="/customer-care"
            >
              Talk to us
            </Link>
          </div>

          <Link
            href="/register"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:scale-[1.02] hover:bg-emerald-800 active:scale-[0.98] sm:px-5"
          >
            Join a pilot <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-5 pb-16 pt-12 sm:pb-24 sm:pt-20 lg:pt-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-emerald-50 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3.5 py-2 text-sm font-medium text-emerald-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Built alongside real-world teams
            </div>
            <h1 className="mt-6 max-w-2xl text-[2.65rem] font-semibold leading-[1.08] tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-[4.1rem]">
              Good work deserves tools that work{" "}
              <span className="text-emerald-700">with people.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Brief Group helps farming and industrial teams make sense of
              operations, act on useful signals, and keep people in the loop -
              without making the work feel more complicated.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:scale-[1.02] hover:bg-emerald-800 active:scale-[0.98]"
              >
                Let&apos;s explore a pilot
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#try-it"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/60"
              >
                Take a look around
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Curious first? You can try the Brief Group workspace preview below
              without creating an account.
            </p>
          </motion.div>

          <FieldCarousel />
        </div>
      </section>

      <section
        aria-label="What matters to our pilot teams"
        className="border-y border-slate-100 bg-slate-50/80 px-5 py-5"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-9 gap-y-3 sm:justify-between">
          {assurances.map((item) => (
            <p
              key={item}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600"
            >
              <Check
                className="h-4 w-4 text-emerald-700"
                aria-hidden="true"
              />
              {item}
            </p>
          ))}
        </div>
      </section>

      <section id="platform" className="scroll-mt-20 px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              A calmer way to run complex work
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              One useful view. Room for the whole team.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Less time joining the dots. More time making decisions with the
              people closest to the work.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/60"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tone}`}
                >
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold leading-7 text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="fieldwork"
        className="scroll-mt-20 bg-[#f7faf8] px-5 py-16 sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              People first, in every setting
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Designed for the places where work really happens.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              A field visit, a busy site, a long shift: the useful details
              shouldn&apos;t be hard to find. We&apos;re building Brief Group
              with the teams who live these decisions every day.
            </p>
            <Link
              href="/contact"
              className="mt-7 inline-flex items-center gap-2 font-semibold text-emerald-800 transition hover:gap-3"
            >
              Tell us what your team needs
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-[1.75rem] border border-white bg-white p-2 shadow-xl shadow-slate-300/40 sm:p-3">
            <Image
              src="/images/briefgroup-field-team.png"
              alt="A Brief Group team member working out in the field"
              width={1400}
              height={900}
              className="h-[300px] w-full rounded-3xl object-cover sm:h-[440px]"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Built around real work
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Start with one important handoff.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Every team has a different starting point. These are pilot scenarios we can
              shape with partners—not customer case studies or claimed outcomes.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              {
                image: "/images/farm-analytics.png",
                alt: "Farm team reviewing crop and weather information",
                eyebrow: "Field planning",
                title: "Bring observations into one calmer view.",
                detail:
                  "Explore how weather context, field notes, and next-step decisions could travel together.",
                measure: "Potential measure: time from observation to shared plan.",
              },
              {
                image: "/images/solar-inspection.png",
                alt: "Technician inspecting equipment at an energy site",
                eyebrow: "Equipment checks",
                title: "Make the next inspection easier to prepare.",
                detail:
                  "Give operators a consistent way to capture findings and prepare a useful handoff.",
                measure: "Potential measure: completeness of inspection records.",
              },
              {
                image: "/images/team-analytics.png",
                alt: "Operations team looking at a shared report",
                eyebrow: "Team operations",
                title: "Turn a busy shift into a clearer update.",
                detail:
                  "Shape site notes into a concise summary that managers and field teams can both use.",
                measure: "Potential measure: time to prepare and acknowledge a handoff.",
              },
            ].map((story) => (
              <article
                key={story.eyebrow}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
              >
                <div className="relative h-52 bg-slate-100">
                  <Image
                    src={story.image}
                    alt={story.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
                    Pilot scenario
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    {story.eyebrow}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold leading-7 text-slate-950">
                    {story.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{story.detail}</p>
                  <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
                    {story.measure}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-slate-500">
            We publish partner results only with permission and measured baselines. No customer
            names, savings, uptime, or performance outcomes are implied here.
          </p>
        </div>
      </section>

      <section className="px-5 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="order-2 overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50 lg:order-1">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">
                  BriefCare Shield
                </p>
                <p className="text-sm text-slate-500">
                  Optional team wellbeing resources
                </p>
              </div>
              <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                Opt in
              </span>
            </div>
            <div className="space-y-3 p-5">
              {[
                "A one-minute reminder to drink water outdoors",
                "Gentle stretches for the end of a long inspection",
                "A nudge to take a screen break when you need one",
              ].map((tip, index) => (
                <div
                  key={tip}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{tip}</p>
                </div>
              ))}
              <p className="pt-2 text-xs leading-5 text-slate-500">
                These are general wellbeing prompts, not medical advice. They
                are optional and never require personal health information.
              </p>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">
              Care is part of good operations
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Better work includes looking after the people doing it.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              BriefCare Shield is an optional collection of gentle safety and
              wellbeing reminders for busy teams. No health profiling, no
              pressure - just small, practical prompts when people want them.
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4">
              <LockKeyhole
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"
                aria-hidden="true"
              />
              <p className="text-sm leading-6 text-slate-600">
                Your team chooses what to use. Personal health details are not
                needed to get started.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 border-y border-slate-100 bg-slate-50 px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Clear ways to get started
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Start small. Grow with your team.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Begin with a 14-day workspace trial. Choose a paid plan when you are ready to keep
              working together.
            </p>
          </div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {[
              {
                name: "Pro",
                price: "$29",
                description: "For an individual or a first working group.",
                features: ["Workspace dashboard", "Subscription status", "USD and NGN checkout options"],
              },
              {
                name: "Business / Pilot",
                price: "$99",
                description: "For a team validating a real operating workflow.",
                features: ["Workspace branding settings", "Provider-confirmed subscription", "Partner support by agreement"],
              },
              {
                name: "Enterprise / Partner",
                price: "Let’s scope it",
                description: "A conversation about your sites, systems, and goals.",
                features: [
                  "Custom seat and usage needs",
                  "Integration planning",
                  "Service commitments by agreement",
                ],
              },
            ].map((plan, index) => (
              <article
                key={plan.name}
                className={`rounded-3xl border p-6 shadow-sm sm:p-7 ${
                  index === 1
                    ? "border-emerald-200 bg-white shadow-emerald-900/5"
                    : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-sm font-semibold text-emerald-800">{plan.name}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {plan.price}
                  {index < 2 && (
                    <span className="text-sm font-medium text-slate-500"> / month</span>
                  )}
                </p>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600">
                  {plan.description}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={index === 2 ? "/contact" : "/register"}
                  className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-emerald-200 px-5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
                >
                  {index === 2 ? "Talk about a partnership" : "Start a free trial"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-slate-500">
            Prices shown are monthly USD reference prices for Stripe checkout. Paystack and
            Flutterwave use NGN plans and amounts configured in the merchant accounts and shown
            by those providers. Seat counts and AI-credit budgets are not automatically enforced
            yet. Enterprise features, dedicated infrastructure, and SLAs require a signed agreement.
          </p>
        </div>
      </section>

      <section
        id="try-it"
        className="scroll-mt-20 border-y border-emerald-100 bg-emerald-50/60 px-5 py-20 sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">
              A first look, no sign-up needed
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Ask a real question. See what BriefGroup AI can do.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600">
              Try a small, guided preview of BriefGroup AI. It can help you
              explore a farm, equipment, inspection, or workflow question.
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Preview responses are AI-generated starting points, not
              professional agronomy, engineering, or safety advice. Avoid
              entering confidential or personal information.
            </p>
          </div>
          <DemoSandbox />
        </div>
      </section>

      <section className="px-5 py-20 sm:py-24">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-[1.75rem] bg-emerald-800 px-6 py-10 text-white sm:px-10 sm:py-12 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">
              Built with partners, not behind closed doors
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Have a real-world challenge worth working on together?
            </h2>
            <p className="mt-3 leading-7 text-emerald-50">
              We&apos;d love to hear how your team works and explore whether a
              focused pilot could help.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-emerald-900 transition hover:scale-[1.02] hover:bg-emerald-50 active:scale-[0.98]"
            >
              Start a conversation
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-slate-50 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Brief Group - practical tools for people doing important work.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link className="hover:text-emerald-800" href="/contact">
              Contact
            </Link>
            <Link className="hover:text-emerald-800" href="/customer-care">
              Customer care
            </Link>
            <Link className="hover:text-emerald-800" href="/login">
              Sign in
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-5 max-w-7xl text-xs leading-5 text-slate-400">
          We do not claim independent SOC 2 or ISO 27001 certification. Please
          contact us to discuss current security controls and pilot requirements.
        </p>
      </footer>
    </main>
  );
}
