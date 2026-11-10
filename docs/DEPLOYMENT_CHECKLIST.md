# Brief Group production deployment checklist

This checklist is for the Next.js application in this repository. A successful build
does not prove that Firebase, payment providers, DNS, or account flows are configured.
Complete the staging checks before sending real clients to production.

## 1. Confirm the Vercel project and domains

Earlier screenshots appeared to show different versions on the Vercel alias and
`www.briefgroup.net`. On November 9, both `/api/version` endpoints reported the same
production commit (`18a82662d9d26d2a26a68e78c7bd24cc481071e5`), and the apex
`briefgroup.net` redirected to `www`. This confirms the aliases matched at that check;
it does not prove that the correct source branch is configured. After this release,
verify the production commit, Node version, and Firebase Admin configuration from
`/api/version`.

- In Vercel, verify the project's Git repository is `Eseendurance/Brief_Group_AI`,
  its production branch is `main`, and its Root Directory points to this Next.js app.
- Confirm the newest production deployment was built from the intended commit and
  that both `brief-group-ai.vercel.app` and the desired production hostname are assigned
  to that deployment.
- Confirm `briefgroup.net` and `www.briefgroup.net` are assigned to the intended
  project, and choose one canonical hostname with the other redirecting to it. Use the
  exact DNS records Vercel displays, remove conflicting records only after confirming
  ownership, and wait for domain verification and TLS.
- Re-test the two hostnames and the Vercel alias in a private browser window after
  deployment. Their page title, `/api/version` commit and Node version, login/register
  paths, and assets should match. Confirm the runtime is Node 22 or newer. If they do
  not, check the domain's assigned project/deployment and DNS cache.

## 2. Configure Vercel environment variables

Set values separately for Production and Preview. Use test-mode payment credentials
for previews and never add secrets to `NEXT_PUBLIC_*`.

### Firebase

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY` (store the service-account key as a protected secret)
- `SITE_BASE` (canonical HTTPS URL used for invitation and payment return links)

Firebase Admin credentials are required for server-issued HttpOnly session cookies and
protected API access. The verified session route also creates a missing user profile
through Admin Firestore, so verify that the service account can access Firestore. This
avoids making successful Firebase credentials depend on client-side profile-write rules.
If any Admin value is missing, sign-in fails closed with a clear configuration response
rather than leaving the browser with a half-authenticated session.
Set `SITE_BASE` to the canonical production origin (for example, `https://briefgroup.net`);
the server requires this value in production instead of deriving invitation links from
the request Host header.
In Firebase Authentication, enable Email/Password and Google sign-in, configure the
password-reset email template, and add every production, preview, and local host used for
sign-in to Authorized domains. Firebase sends a one-time reset link with a protected
action code; the app deliberately does not collect or store a reset code itself. Create
Firestore and Storage, then deploy the repository rules:

```powershell
npx firebase-tools deploy --only firestore:rules,storage
```

Use the correct Firebase project explicitly if your CLI default is not the production
project:

```powershell
npx firebase-tools use <firebase-project-id>
npx firebase-tools deploy --only firestore:rules,storage
```

The repository includes `firebase.json`, `firestore.rules`, and `storage.rules`.
Company documents and invitations are server-managed through Firebase Admin and are
intentionally not readable or writable from client SDKs.

### AI and abuse controls

- `GEMINI_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Rate limiting uses Upstash Redis when configured and falls back to a transactional
Firestore window counter when Redis is missing or unavailable. Production endpoints
fail closed when neither backend is available; configure Firestore TTL for the
`security_rate_limits.expiresAt` field to clean expired counters.
Login attempts are limited to five per minute per IP and normalized email; failed and
successful attempt audit events include timestamp, IP, user agent, and a one-way email
digest in server logs. Confirm the Gemini project has the required quota and that
prompts/images sent to the provider are covered by your customer privacy notice and
provider terms.

### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_GROWTH`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` when needed by client-side Stripe surfaces
- Configure a recurring Stripe Price for each plan at the displayed currency/amount.
- Register `https://<canonical-host>/api/webhooks/stripe` and subscribe to checkout
  completion and subscription cancellation events.

### Paystack

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_PLAN_STARTER`
- `PAYSTACK_PLAN_GROWTH`
- Create recurring NGN plans whose amounts and intervals exactly match the pricing page.
- Register `https://<canonical-host>/api/webhooks/paystack` and configure the matching
  Paystack webhook secret.

### Flutterwave

- `FLUTTERWAVE_SECRET_KEY`
- `FLUTTERWAVE_WEBHOOK_SECRET` (the webhook verification hash from Flutterwave)
- `FLUTTERWAVE_PLAN_STARTER`
- `FLUTTERWAVE_PLAN_GROWTH`
- Create recurring NGN payment plans with amounts/intervals matching the pricing page.
- Register `https://<canonical-host>/api/webhooks/flutterwave` and select the successful
  charge and subscription lifecycle events supported by the account.
- The hosted checkout is server-created and the payment webhook verifies the transaction
  with Flutterwave before granting a plan. The public key is not used by this hosted
  server-side checkout flow.
- Flutterwave payment-plan subscriptions currently support tokenizable card payments;
  confirm the methods enabled in your account before presenting this as a bank-transfer
  subscription option. See [Flutterwave recurring payments](https://developer.flutterwave.com/docs/recurring-payments).

### Transactional email

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Verify the sending domain before sending client invitations or account mail. The team
invite flow sends a single-use link when Resend is configured. If delivery is not
configured or fails, the dashboard shows that status and provides the invitation link
for an administrator to share manually. Verify the sender domain, test delivery and
bounce handling, and ensure the canonical `SITE_BASE` is set.

## 3. Deploy and verify

- Confirm CI passes `npm ci`, `npm run lint`, and `npm run build` on the intended commit.
- Deploy to a Preview environment first, with separate Firebase and payment test projects.
- Verify signup, login, password reset, company onboarding, and Google sign-in.
- Confirm login responses set an HttpOnly, SameSite=Lax session cookie (Secure in
  production), the cookie clears on sign-out, and protected APIs work without an
  Authorization bearer header. Confirm existing Firebase users with a missing profile
  can sign in and have a trial profile restored without changing an existing plan.
- Send a malformed JSON body to `/api/auth/session` and `/api/auth/login-attempt` in
  staging; each should return a JSON 400 response. An empty 500 response indicates a
  function/runtime failure and must be investigated in Vercel function logs before
  inviting users.
- Create an owner workspace; invite a different email; accept the link with that email;
  verify wrong-email, expired, reused, and already-member cases fail.
- Confirm invitations are delivered through Resend when configured, manual-link fallback
  is clearly surfaced when not configured, and authorized admins can revoke pending
  invitations.
- Confirm owners/admins can manage company details, managers can invite only members and
  viewers, and viewers cannot create energy/fault entries, reports, or inspections.
- Test denied direct Firestore/Storage writes for viewers; deploy and test rules in a
  non-production Firebase project before rollout.
- Test each payment provider in test mode and verify that a plan is granted only after a
  signed/verified provider event. Test cancellation/failed-payment lifecycle behavior
  before describing subscriptions as fully automated.
- Check Vercel function logs for auth, Firebase Admin, Gemini, webhook, and rate-limit
  errors. Never paste service-account keys, API keys, or signed webhook bodies into
  tickets or chat.
- Promote the validated deployment and confirm both domain aliases resolve to the same
  production build.

## Known release gates

- Organization-wide operational data sharing is not yet migrated: several operational
  modules still scope records to individual user IDs.
- End-to-end authentication cannot be declared operational until production Firebase
  credentials, Firestore access, Authorized domains, and real-account sign-in have been
  verified in the Vercel deployment logs and browser.
- Billing cancellation, refunds, invoices, tax handling, and entitlement reconciliation
  need end-to-end testing with each live provider.
- Legal/safety content must be reviewed by qualified local professionals before it is
  represented as compliance advice for a jurisdiction.
- Establish backups, restore drills, monitoring/alerting, support ownership, retention
  policies, and a client incident-response process before broad production use.
