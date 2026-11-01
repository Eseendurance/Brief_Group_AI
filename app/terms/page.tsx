import Link from "next/link";

const sections = [
  {
    title: "Using the service",
    paragraphs: [
      "Brief Group provides workspace tools for organizing operational information, team handoffs, inspections, and pilot workflows. You must provide accurate account details, protect your login credentials, and use the service lawfully.",
      "You are responsible for the content your organization submits and for deciding who can access its workspace. Do not upload information you do not have permission to share, or use the service to store emergency, highly sensitive, or regulated personal information unless we have separately agreed in writing.",
    ],
  },
  {
    title: "AI-assisted information",
    paragraphs: [
      "Some features may generate summaries or suggestions using AI services. Outputs can be incomplete or incorrect and are not professional agronomy, engineering, legal, medical, financial, or safety advice. A qualified person must review outputs before acting on them, especially where people, equipment, crops, or property could be affected.",
      "Do not treat an AI response as an instruction to operate, repair, isolate, or bypass equipment. Follow applicable laws, site procedures, and manufacturer guidance.",
    ],
  },
  {
    title: "Your information and privacy",
    paragraphs: [
      "You retain ownership of information you submit. You give Brief Group permission to process it only as needed to provide, secure, and improve the service for your workspace. Our Privacy Notice explains the categories of data, service providers, and choices involved.",
      "Workspace administrators may manage access and see workspace information. Do not place personal or confidential information in a shared workspace unless it is appropriate for the people who can access it.",
    ],
  },
  {
    title: "Availability, plans, and changes",
    paragraphs: [
      "The service is evolving and may change or be temporarily unavailable while we maintain or improve it. Trial access, plan features, limits, and payment terms are those displayed at checkout or agreed in a separate signed order. Paid subscriptions renew and can be cancelled according to the checkout terms and the payment provider's process.",
      "We do not promise an uptime percentage, certification, or service-level commitment unless it is expressly included in a separate written agreement signed by both parties.",
    ],
  },
  {
    title: "Acceptable use and account action",
    paragraphs: [
      "You may not interfere with the service, attempt unauthorized access, evade workspace limits, or use Brief Group to violate another person's rights or applicable law. We may restrict access when reasonably needed to protect users, investigate abuse, comply with law, or address non-payment.",
    ],
  },
  {
    title: "Limits and contact",
    paragraphs: [
      "To the extent permitted by law, Brief Group is not responsible for indirect losses or decisions made solely from unverified service output. Nothing in this agreement removes rights that cannot legally be excluded. Any enterprise commitments or different risk terms must be made in a separate signed agreement.",
      "Questions about this agreement can be raised through the Contact link. This plain-language account agreement is provided for product use and is not a substitute for jurisdiction-specific legal advice.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7faf8] px-5 py-12 text-slate-800 sm:py-20">
      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-semibold text-emerald-800 hover:underline">
          Brief Group
        </Link>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
          Account agreement · Version 2026-11-01
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
          A clear agreement for working together
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Please read this before creating an account. By accepting it, you confirm
          that you are authorized to use Brief Group for yourself or your
          organization and agree to the terms below.
        </p>
        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-950">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-7 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
        <p className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-600">
          Also review our{" "}
          <Link href="/privacy" className="font-semibold text-emerald-800 underline">
            Privacy Notice
          </Link>{" "}
          before signing up. For questions,{" "}
          <Link href="/contact" className="font-semibold text-emerald-800 underline">
            contact our team
          </Link>
          .
        </p>
      </article>
    </main>
  );
}
