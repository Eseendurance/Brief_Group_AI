# Brief Group — Platform

A real, working full-stack Next.js app for Brief Group: Smart Energy Monitoring, AI Fault
Detection, Smart Farm Prediction, Automated Reports, Computer Vision Inspection, an AI
Assistant, and a Digital Marketplace waitlist — with real Firebase auth/data, live
weather data, and Gemini-powered reports/chat/vision analysis.

Nothing in here is mocked: every module reads and writes real Firestore data, and the
scoring logic (energy anomaly detection, fault risk, crop health) is real math, not
random placeholder numbers. The two things that need your API keys before they light up
are the AI Assistant / Report Generator / Vision Inspection (Gemini) and everything
auth/database related (Firebase).

## 1. What you need to add

You said you want Gemini as the default AI provider. Here's exactly what goes where:

1. Copy `.env.local.example` to `.env.local`
2. Fill in your **Firebase** project keys (client + admin — see below for where to get each)
3. Add a valid `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) — the AI Assistant, Report Generator, and
   Vision Inspection pages will show a clear "not configured yet" message instead of
   crashing until you add it.
4. Weather uses **Open-Meteo** by default, which needs no API key at all. If you'd rather
   use OpenWeatherMap, set `WEATHER_PROVIDER=openweather` and add `OPENWEATHER_API_KEY`.

### Getting Firebase keys

1. Go to [Firebase Console](https://console.firebase.google.com) → create a project (or use an existing one)
2. **Client config**: Project Settings → General → "Your apps" → add a Web app → copy the
   `firebaseConfig` values into `NEXT_PUBLIC_FIREBASE_*`
3. **Admin config**: Project Settings → Service Accounts → "Generate new private key" →
   downloads a JSON file. From it, copy:
   - `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
   - `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY` (keep the `\n` characters as-is, the code converts them back to real newlines)
4. In Firebase Console, enable **Authentication** → Sign-in method → turn on Email/Password and Google
5. Enable **Firestore Database** (production mode) and **Storage**
6. Deploy the included security rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```
   (or paste the contents of `firestore.rules` / `storage.rules` into the Firebase Console rules editor)

## 2. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`. Until Firebase keys are added, auth pages will show a
"Firebase isn't configured yet" notice instead of crashing — that's intentional.

## 3. Deploy to Vercel

```bash
vercel
```

Or connect the GitHub repo in the Vercel dashboard. **Add every variable from
`.env.local` in Vercel → Project → Settings → Environment Variables** before your first
deploy — this is the single most common cause of a working-locally-but-broken-on-Vercel
deploy for this kind of app.

### The specific bug this build already avoids

Your Omnicore AI error was very likely this: Firebase's `getAuth()` throws
`auth/invalid-api-key` the instant it's called with an empty/invalid key. Next.js
prerenders "use client" pages on the server at build time too — so if any page imports
something that calls `getAuth()`/`initializeApp()` at module load time, and the env vars
aren't set yet in Vercel, **the entire build fails**, even though the page only needed
auth in the browser. `lib/firebase.js` in this repo guards against exactly that: it only
initializes Firebase if all required keys are present, and every page checks
`isFirebaseConfigured()` before relying on it. If you paste me the actual Vercel build
log for Omnicore AI, I can confirm whether it's this same root cause or something else.

## 4. Project structure

```
app/
  page.js                    Landing page
  login/, signup/             Auth pages (Firebase email/password + Google)
  dashboard/
    layout.js                 Sidebar + auth guard
    page.js                    Overview — aggregates real data across modules
    energy/                    Energy Monitoring — Firestore + rolling z-score anomaly detection
    fault-detection/           AI Fault Detection — weighted risk scoring model
    farm/                      Smart Farm Prediction — live weather + crop-health scoring
    reports/                   Automated Reports — Gemini-generated from real data
    inspection/                Computer Vision — Firebase Storage upload + Gemini vision analysis
    assistant/                 AI Assistant — Gemini chat grounded in your data
    marketplace/                Coming soon + real waitlist capture
  api/                        Server routes (weather, chat, reports, vision, waitlist)
lib/
  firebase.js                 Client SDK init (guarded against build-time crashes)
  firebaseAdmin.js             Server SDK init + auth token verification
  energy-logic.js              Real anomaly detection algorithm
  fault-logic.js                Real weighted fault risk-scoring model
  farm-logic.js                 Real crop-health scoring from live weather
firestore.rules / storage.rules  Per-user data isolation — deploy these, don't skip it
```

## 5. What's real vs. what needs your keys to activate

| Feature | Status |
|---|---|
| Auth (signup/login, Google sign-in) | Real — needs Firebase keys |
| Energy anomaly detection | Real algorithm, works the moment you log a reading |
| Fault risk scoring | Real weighted model, works immediately |
| Live weather / crop health | Real — Open-Meteo, no key needed |
| AI Assistant | Real Gemini call — needs `GEMINI_API_KEY` |
| Automated Reports | Real Gemini call over your real data — needs `GEMINI_API_KEY` |
| Computer Vision Inspection | Real Gemini vision call on your uploaded photo — needs `GEMINI_API_KEY` |
| Marketplace | Real waitlist capture to Firestore; the marketplace itself is intentionally "coming soon" per your own roadmap |

## 6. Additional API keys worth adding (pre-paying-client stage)

You asked what else is worth adding before you have a paying client. Priority order,
cheapest/highest-value first — **all are optional, the app runs fine without them**,
each just no-ops with a clear message until configured:

| Priority | Key | Why | Cost |
|---|---|---|---|
| 🔴 High | `UPSTASH_REDIS_REST_URL` / `TOKEN` | **Caps your Gemini spend.** Without it, nothing stops a bot or one enthusiastic user from hammering `/api/chat`, `/api/reports/generate`, or `/api/vision/analyze` in a loop — each call costs you real money. Now wired in with sane limits (30 chats/hr, 15 reports/day, 20 inspections/day per user). | Free tier, no card |
| 🟡 Medium | `RESEND_API_KEY` | Sends a real welcome email on signup and a waitlist confirmation — makes the pilot feel like a real product, not a form that goes nowhere. | Free: 3,000 emails/mo |
| 🟢 Already added, no key needed | Vercel Analytics + Speed Insights | Zero-config once deployed to Vercel — shows you real visitor counts and page performance without adding any env var. Useful for showing traction to prospective pilot partners. | Free tier |

**Recommended but not yet wired in** (add when you're closer to launch, not urgent today):
- **Cloudflare Turnstile** — free bot-protection widget for the signup and waitlist
  forms. Worth adding once the pilot link is public, to stop fake signups.
- **Sentry** — free-tier error tracking. Vercel's own function logs cover you for now;
  add Sentry once you have real users you don't want to lose silently to an error.

## 7. Deploying — the actual steps

**Fastest path: connect the repo in the Vercel dashboard.**
1. Push this project to a GitHub repo
2. In [vercel.com](https://vercel.com) → Add New → Project → import the repo
3. Add every variable from `.env.local.example` under Project → Settings →
   Environment Variables (Production **and** Preview) — this is the step people skip
   and then wonder why the deploy "works locally but not on Vercel"
4. Deploy. Every future push to `main` auto-deploys.

**CI is already set up** (`.github/workflows/ci.yml`): every push and PR runs
`npm ci && npm run lint && npm run build` on GitHub's servers first. If that fails, you
find out on GitHub in ~60 seconds instead of watching a red X in the Vercel dashboard —
and it builds with placeholder Firebase values to prove the app genuinely builds clean,
not just that your secrets happen to be set.

**Manual/one-off deploy from your machine:**
```bash
./scripts/deploy.sh          # deploys a preview
./scripts/deploy.sh --prod   # deploys to production
```
This script runs the same lint + build checks locally before it lets Vercel see the
code — it refuses to deploy a broken build.

`vercel.json` pins functions to the `lhr1` (London) region, the closest Vercel region to
Nigeria, and gives the three Gemini-calling routes a 30-second max duration (the default
10s can be tight for report generation).

## 8. Deployment audit (what was cross-checked and fixed)

This was actually run through `npm install`, `next build`, `next lint`, and a live local
server hitting every API route — not just written and assumed correct. Fixed in this pass:

- **Upgraded Next.js 14.2.5 → 16.2.10.** The 14.x line had multiple high-severity CVEs
  (DoS via Server Components, SSRF via WebSocket upgrades, cache poisoning) with no fix
  available inside 14.x itself — only 16.x is clean. Requires **Node.js ≥20.9** (pinned in
  `package.json` → `engines`), which Vercel will pick up automatically.
- **Upgraded `firebase` 10.x → 12.16.0 and `firebase-admin` 12.x → 14.2.0**, resolving 12
  of 20 flagged vulnerabilities.
- **Fixed a real SSR hydration bug** in `PulseGrid.jsx`: node animation delays were using
  `Math.random()` during render, which produces different output on the server vs. the
  client and can cause React hydration mismatches in production. Replaced with a
  deterministic value.
- **Fixed a React state-update pattern** in `lib/auth-context.js` flagged by React's
  strict effect rules (`react-hooks/set-state-in-effect`) — initial loading state is now
  derived instead of set synchronously inside the effect.
- **Added ESLint** (`eslint-config-next`, flat config in `eslint.config.mjs`) and ran it
  clean — 0 errors, 2 advisory warnings (both `<img>` vs `next/image`, intentionally left
  as plain `<img>` since one is a local blob preview and the other a 64px thumbnail,
  neither benefits from the optimization pipeline).
- **Verified every API route's error handling by hand**, hitting each with `curl`:
  `/api/chat` and `/api/reports/generate` return a clean `503` with a human-readable
  message when `GEMINI_API_KEY` is missing (not a crash/500), `/api/waitlist` returns
  `400` on a malformed email, and `/api/weather` catches upstream failures and returns
  `502` with the real error message instead of throwing.

### Known remaining `npm audit` items — read before you worry about them

`npm audit` still flags **8 moderate-severity issues**, all inside `firebase-admin`'s own
dependency tree (`@google-cloud/storage` → `teeny-request`/`gaxios` → `uuid`, an
"insecure randomness" advisory). This is a long-standing, unresolved upstream issue in
Google's Node client libraries, not something fixable from this app's `package.json`
without downgrading `firebase-admin` to a stale major version (npm's own suggested "fix"
is `firebase-admin@10.3.0`, which is older and worse). The `uuid` calls in question are
used for internal request tracing IDs inside Google's HTTP client, not for anything
security-sensitive like session tokens in this app. Re-run `npm audit` after your first
`npm install` on deploy — if Google ships a fix, a routine `npm update firebase-admin`
will pick it up.

## 9. What changed in the rebrand (logo, colors, trial, payments)

- **Your uploaded logo is now the real logo everywhere** — background removed, cropped,
  and used across the landing page, login, signup, sidebar, contact page, favicon, and
  the installable app icon. Raw files are in `public/logo.jpg` (original) and
  `public/logo.png` (transparent).
- **Full re-theme to black/white/red/blue.** Done by repointing the Tailwind color
  tokens in `tailwind.config.js` rather than touching every file — see the comment block
  at the top of that file for exactly what each color key now maps to. One deliberate
  exception: a small green is kept *only* for "Healthy / Low risk" status indicators in
  the fault-detection and farm modules, because collapsing a 4-level risk scale (Low →
  Watch → Elevated → Critical) into two hues would genuinely hurt legibility on a
  safety-relevant tool. Everything else — nav, buttons, hero, sidebar — is strictly
  black/white/red/blue.
- **Google Sign-In** now has the real Google "G" mark, on both login and signup, plus
  specific error messages for the two most common real-world causes of "Google sign-in
  is broken in production": a blocked popup, and — the more likely culprit for
  Omnicore AI — the deployed domain not being added under **Firebase Console →
  Authentication → Settings → Authorized domains**.
- **Team-aware registration** collects a work role from the roles shown on the public
  site. The profile rules limit client-created data to a 14-day trial and keep billing
  status and access roles out of user-controlled updates.
- **Terms of Service and Privacy Policy** at `/terms` and `/privacy` — real content
  describing what this app actually collects and does (not lorem ipsum), with a required
  checkbox on signup (blocks both email and Google signup until checked). Both pages say
  plainly that they haven't been reviewed by a lawyer yet — get that done before real
  paying customers.
- **14-day trial, enforced server-side.** New accounts get a bounded `trial` profile in
  Firestore. Security rules prevent users from changing their plan, role, or trial end
  date; AI routes reject missing/invalid profiles and check access on the server.
  `components/TrialBanner.jsx` reads the same trial state for the UI.
- **Production rate limits fail closed.** Configure Upstash Redis before enabling AI,
  contact, or waitlist endpoints in production. Local development remains usable without
  Redis; production requests return `503` until the limiter is configured.
- **Real Stripe + Paystack checkout**, with webhooks that actually upgrade the user's
  plan in Firestore on successful payment (`/api/webhooks/stripe`,
  `/api/webhooks/paystack`) — see `.env.local.example` for exact setup steps for both,
  including creating Prices in Stripe first and pointing each provider's webhook at your
  domain.
- **Contact page** (`/contact`) with your details and a working form (saves to
  Firestore, emails you via Resend). The YouTube/Instagram/LinkedIn icons point to
  placeholder/search URLs — I searched and couldn't confirm your real handles (there are
  unrelated companies using similar names), so I didn't guess. Swap in your real profile
  URLs in `app/contact/page.js` once those accounts exist.
- **Optional installable app (PWA)** — `public/manifest.json` + `public/sw.js` +
  `components/InstallPrompt.jsx`. This is the same Next.js app made installable, not a
  separate codebase — a real separate native app is outside what can be built here.
  The install prompt only appears when the browser's own install criteria are met, and
  is dismissible (remembered via `localStorage`, never nags again once dismissed).

## 10. Design

Dark command-center palette (`#0A0E1A` base, amber `#FFB020` for energy, cyan `#22D3EE`
for live data, emerald for healthy states, red for faults) — chosen because this is an
infrastructure monitoring tool, not a marketing site. Space Grotesk for display type,
Inter for body, JetBrains Mono for all numeric/data displays. The animated pulse-grid
diagram (hero + dashboard header) is the signature element: it's literally a signal
traveling through connected infrastructure nodes, which is what the product does.
