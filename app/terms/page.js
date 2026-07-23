import Link from 'next/link';
import Image from 'next/image';

export const metadata = { title: 'Terms of Service — Brief Group' };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <Image src="/logo.png" alt="Brief Group" width={32} height={32} className="h-8 w-8 object-contain" />
          <Link href="/" className="font-display font-semibold">Brief Group</Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-14 text-sm leading-relaxed text-ink-300">
        <h1 className="font-display font-semibold text-3xl text-ink-100 mb-2">Terms of Service</h1>
        <p className="text-ink-500 mb-8">Last updated: July 2026</p>

        <p className="mb-6">
          These Terms govern your use of the Brief Group platform (energy monitoring, AI fault detection,
          smart farm prediction, automated reports, computer vision inspection, and the digital marketplace).
          By creating an account, you agree to these Terms.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">1. The service</h2>
        <p className="mb-4">
          Brief Group provides software tools to monitor energy usage, flag equipment fault risk, assess farm
          conditions, and generate reports and inspections, some of which are powered by third-party AI
          models (Anthropic's Claude). Outputs from AI features (reports, chat replies, image analysis) are
          decision-support material, not a substitute for professional engineering, agronomic, or safety
          judgment. Do not rely on an AI fault-risk score alone before taking equipment out of service or
          declaring it safe — always verify with qualified personnel.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">2. Accounts</h2>
        <p className="mb-4">
          You're responsible for the accuracy of the data you enter and for keeping your login credentials
          secure. You must be authorized to act on behalf of any company you register under.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">3. Subscriptions and billing</h2>
        <p className="mb-4">
          Paid plans are billed in advance on a recurring basis via Stripe or Paystack, per the plan you
          select at checkout. You can cancel at any time from Settings; cancellation takes effect at the end
          of the current billing period. Fees already paid are non-refundable except where required by law.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">4. Acceptable use</h2>
        <p className="mb-4">
          Don't use the platform to upload content you don't have rights to, attempt to disrupt or overload
          the service, or use it to make safety-critical decisions without independent human verification.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">5. Data ownership</h2>
        <p className="mb-4">
          You own the data you submit (readings, images, reports generated from your data). We process it to
          provide the service, as described in our <Link href="/privacy" className="text-amber hover:underline">Privacy Policy</Link>.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">6. Disclaimers and limitation of liability</h2>
        <p className="mb-4">
          The platform, including all AI-generated content, is provided "as is" without warranties of any
          kind. To the maximum extent permitted by law, Brief Group is not liable for indirect, incidental,
          or consequential damages arising from use of the platform, including decisions made based on
          fault-risk scores, crop-health scores, or AI-generated reports.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">7. Termination</h2>
        <p className="mb-4">
          You may stop using the service and delete your account at any time. We may suspend accounts that
          violate these Terms or abuse the platform (including excessive automated requests).
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">8. Changes</h2>
        <p className="mb-4">
          We may update these Terms as the platform evolves. Continued use after a change means you accept
          the updated Terms.
        </p>

        <h2 className="font-display font-semibold text-ink-100 text-lg mt-8 mb-2">9. Contact</h2>
        <p className="mb-4">
          <a href="mailto:Briefgroup1@gmail.com" className="text-amber hover:underline">Briefgroup1@gmail.com</a>
        </p>

        <div className="mt-10 p-4 rounded-lg border border-border bg-base-800 text-xs text-ink-500">
          This is a genuine, working draft reflecting how this platform actually operates — not filler text.
          It has not been reviewed by a lawyer. Have one review and finalize it, especially the billing and
          liability sections, before you take real paying customers.
        </div>
      </article>
    </main>
  );
}
