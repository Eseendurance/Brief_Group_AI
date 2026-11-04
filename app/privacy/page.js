import Link from 'next/link';
import Image from 'next/image';

export const metadata = { title: 'Privacy Policy — Brief Group' };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <Image src="/logo.png" alt="Brief Group" width={32} height={32} className="h-8 w-8 object-contain" />
          <Link href="/" className="font-display font-semibold">Brief Group</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-14 prose-custom text-sm leading-relaxed text-ink-300">
        <h1 className="font-display font-semibold text-3xl text-ink-100 mb-2">Privacy Policy</h1>
        <p className="text-ink-500 mb-8">Last updated: July 2026</p>

        <p className="mb-6">
          Brief Group ("we", "us", "our") operates an AI infrastructure intelligence platform covering
          energy monitoring, fault detection, farm prediction, automated reporting, and computer vision
          inspection. This policy explains what we collect, why, and what rights you have over it.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">1. What we collect</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li><strong>Account and company profile data:</strong> name, email, organization name, country, region, industry, organization size, website, phone, and address when provided. Authentication credentials are handled by Firebase Authentication — we never see or store your raw password.</li>
          <li><strong>Operational data you submit:</strong> energy readings, equipment sensor values, uploaded inspection photos, and any text you send the AI Assistant.</li>
          <li><strong>Payment data:</strong> if you subscribe to a paid plan, billing details are collected and processed directly by Stripe and/or Paystack — we do not store your card number.</li>
          <li><strong>Usage data:</strong> pages visited and basic performance metrics via Vercel Analytics, used in aggregate, not tied to advertising.</li>
        </ul>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">2. How we use it</h2>
        <ul className="list-disc pl-5 space-y-1 mb-4">
          <li>To operate the dashboard: store your readings, compute anomaly/fault scores, and display them back to you.</li>
          <li>To generate AI features you request: report text, chat replies, and image inspection findings are sent to Google Gemini for processing. We do not sell this data or use it to train models.</li>
          <li>To send account-related email (welcome messages, waitlist confirmations) via Resend.</li>
          <li>To process payments via Stripe, Paystack, and/or Flutterwave for paid subscriptions.</li>
          <li>To keep the platform secure — rate limiting and abuse prevention via Upstash.</li>
        </ul>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">3. Who we share data with</h2>
        <p className="mb-4">
          We share data only with the service providers required to run the platform: Firebase/Google Cloud
          (authentication, database, storage), Google Gemini (AI processing of content you submit), Stripe,
          Paystack, and Flutterwave (payment processing), Resend (transactional email), and Upstash (rate limiting).
          We do not sell your data to third parties or brokers.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">4. Data retention</h2>
        <p className="mb-4">
          We retain your account and operational data for as long as your account is active. You can request
          deletion of your account and associated data at any time by contacting us — see Section 7.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">5. Your rights</h2>
        <p className="mb-4">
          Depending on your location (including under Nigeria's Data Protection Act 2023 and, where
          applicable, the EU GDPR), you may have the right to access, correct, export, or delete your
          personal data, and to object to certain processing. Contact us to exercise any of these rights.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">6. Security</h2>
        <p className="mb-4">
          Data is stored in Firebase/Firestore with per-user access rules enforced at the database level —
          your operational data is never readable by other users' accounts. Uploaded inspection photos are
          similarly restricted to your own account. No system is 100% secure, and we can't guarantee absolute
          security, but we take reasonable, industry-standard measures to protect your data.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">7. Contact</h2>
        <p className="mb-4">
          Questions about this policy or your data: <a href="mailto:Briefgroup1@gmail.com" className="text-amber hover:underline">Briefgroup1@gmail.com</a>.
        </p>

        <div className="mt-10 p-4 rounded-lg border border-border bg-base-800 text-xs text-ink-500">
          This policy is a genuine, working draft covering the data this platform actually collects and
          processes — it is not filler text. That said, it has not been reviewed by a lawyer. Before you rely
          on it for real customers (especially once you're collecting payment), have a lawyer familiar with
          Nigerian data protection law (and any other jurisdictions you operate in) review and finalize it.
        </div>
      </article>
    </main>
  );
}
