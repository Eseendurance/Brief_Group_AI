import Link from "next/link";

const topics = [
  {
    title: "Information we use",
    text: "We use account details such as your email and name, workspace profile details you provide, and operational content you choose to save. Sign-in is handled by Firebase Authentication. Workspace, billing, and usage records may be stored in the services configured for your account.",
  },
  {
    title: "Why we use it",
    text: "We use this information to create and secure your account, provide workspace features, manage subscriptions and usage, respond to support requests, and protect the service from abuse. Optional wellbeing features are off by default and do not require health information.",
  },
  {
    title: "AI and service providers",
    text: "When you submit a question to an AI feature, the prompt is sent to the configured AI provider to produce a response. Avoid sharing confidential, personal, or sensitive information in prompts. We also rely on infrastructure and payment providers to operate the service; their own privacy terms may apply.",
  },
  {
    title: "Website fonts",
    text: "The website serves its font files from Brief Group's own domain, so your browser does not need to contact a third-party font service.",
  },
  {
    title: "Access, retention, and choices",
    text: "Workspace members and administrators may access information shared in their workspace. We retain information while needed to provide the service, meet operational obligations, or resolve disputes. You can contact us to request access, correction, or deletion, subject to applicable law and account obligations.",
  },
  {
    title: "Security and updates",
    text: "We use technical and organizational safeguards appropriate to an evolving service, but no internet service can promise absolute security. We will update this notice when our data practices materially change and show the current version during account creation.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7faf8] px-5 py-12 text-slate-800 sm:py-20">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">
          Brief Group
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Privacy notice · Version 2026-11-01
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          Your information, explained plainly
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          This notice describes how Brief Group handles information in the current
          product. It is not a claim of a particular security certification or
          regulatory status.
        </p>
        <div className="mt-8 space-y-7">
          {topics.map((topic) => (
            <section key={topic.title}>
              <h2 className="text-lg font-semibold text-slate-950">{topic.title}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">{topic.text}</p>
            </section>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-6 text-sm">
          <Link href="/terms" className="font-semibold text-emerald-800 underline">
            Read the Account Agreement
          </Link>
          <Link href="/contact" className="font-semibold text-emerald-800 underline">
            Ask about your information
          </Link>
        </div>
      </article>
    </main>
  );
}
