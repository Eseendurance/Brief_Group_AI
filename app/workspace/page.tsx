"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  Save,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ProtectedRoute, useAuth } from "@/app/lib/auth";

type Gateway = "STRIPE" | "PAYSTACK" | "FLUTTERWAVE";
type Plan = "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";

type Workspace = {
  id: string;
  name: string;
  region: string | null;
  teamSize: string | null;
  plan: Plan;
  subscriptionStatus: string;
  gateway: Gateway | null;
  billingEmail: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string;
  brandName: string | null;
  logoUrl: string | null;
  brandColor: string;
  customDomain: string | null;
  _count: { members: number };
  members: {
    role: string;
    createdAt: string;
    user: { name: string | null; email: string };
  }[];
};

type WorkspaceResponse = {
  workspace: Workspace;
  trialDaysRemaining: number;
  memberRole: string;
  canManage: boolean;
};

const planDetails = [
  {
    plan: "PRO" as const,
    name: "Pro",
    price: "$29",
    description: "For a person or small team getting a first workflow into shape.",
    features: ["Workspace dashboard", "Subscription status and billing history", "USD and NGN checkout options"],
  },
  {
    plan: "BUSINESS" as const,
    name: "Business / Pilot",
    price: "$99",
    description: "For teams running a supported operational pilot together.",
    features: ["Workspace branding settings", "Provider-confirmed subscription state", "Partner support by agreement"],
  },
];

function WorkspaceContent() {
  const { user } = useAuth();
  const [data, setData] = useState<WorkspaceResponse | null>(null);
  const [settings, setSettings] = useState({
    name: "",
    brandName: "",
    logoUrl: "",
    brandColor: "#047857",
    customDomain: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyPlan, setBusyPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadWorkspace = useCallback(async () => {
    if (!user) return;
    const response = await fetch("/api/workspaces/current", {
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      cache: "no-store",
    });
    const result = (await response.json()) as WorkspaceResponse & { error?: string };
    if (!response.ok || !result.workspace) {
      throw new Error(result.error || "We could not load this workspace.");
    }
    setData(result);
    setSettings({
      name: result.workspace.name,
      brandName: result.workspace.brandName ?? "",
      logoUrl: result.workspace.logoUrl ?? "",
      brandColor: result.workspace.brandColor,
      customDomain: result.workspace.customDomain ?? "",
    });
  }, [user]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void loadWorkspace()
        .catch((loadError: unknown) => {
          if (active) {
            setError(
              loadError instanceof Error
                ? loadError.message
                : "We could not load this workspace.",
            );
          }
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadWorkspace]);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/workspaces/current", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Settings were not saved.");
      await loadWorkspace();
      setNotice("Workspace settings saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Settings were not saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function startCheckout(plan: "PRO" | "BUSINESS", gateway: Gateway) {
    if (!user || busyPlan) return;
    setBusyPlan(plan);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, gateway }),
      });
      const result = (await response.json()) as {
        redirectUrl?: string;
        error?: string;
      };
      if (!response.ok || !result.redirectUrl) {
        throw new Error(result.error || "Checkout could not be started.");
      }
      window.location.assign(result.redirectUrl);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Checkout could not be started.",
      );
      setBusyPlan(null);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        <div className="flex items-center gap-3" role="status">
          <LoaderCircle className="h-5 w-5 animate-spin text-emerald-700" />
          <span>Opening your workspace…</span>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16 text-slate-800">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Workspace setup needed</h1>
          <p className="mt-3 leading-7 text-slate-600">
            {error || "We could not find a workspace for this account."} If you just joined,
            finish onboarding first.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 font-semibold text-white"
          >
            Continue setup
          </Link>
        </div>
      </main>
    );
  }

  const workspace = data.workspace;
  const trialIsOpen =
    workspace.subscriptionStatus === "TRIALING" && data.trialDaysRemaining > 0;

  return (
    <main className="min-h-screen bg-[#f7faf8] px-5 py-8 text-slate-800 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to pilot dashboard
        </Link>
        <header className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {workspace.name}
            </h1>
            <p className="mt-2 text-slate-600">
              A clear home for your team, settings, and subscription.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-medium text-emerald-800">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {workspace.plan} · {workspace.subscriptionStatus.replaceAll("_", " ").toLowerCase()}
          </span>
        </header>

        {trialIsOpen && (
          <div className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center">
            <p className="font-medium text-amber-950">
              {data.trialDaysRemaining} day{data.trialDaysRemaining === 1 ? "" : "s"} left in your
              workspace trial.
            </p>
            <a href="#billing" className="font-semibold text-amber-900 underline underline-offset-4">
              Review plans
            </a>
          </div>
        )}
        {notice && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
            {notice}
          </div>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">
            {error}
          </p>
        )}

        <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">Workspace identity</h2>
                <p className="text-sm text-slate-500">Make the pilot feel like your team.</p>
              </div>
            </div>
            <form className="mt-6 space-y-4" onSubmit={saveSettings}>
              <label className="block text-sm font-medium text-slate-700">
                Workspace name
                <input
                  required
                  maxLength={80}
                  value={settings.name}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, name: event.target.value }))
                  }
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Brand name
                <input
                  maxLength={80}
                  value={settings.brandName}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, brandName: event.target.value }))
                  }
                  placeholder="Optional"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Logo URL
                <input
                  maxLength={500}
                  value={settings.logoUrl}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, logoUrl: event.target.value }))
                  }
                  placeholder="https://… or /your-logo.svg"
                  className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Brand color
                  <span className="mt-1.5 flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 px-3">
                    <input
                      type="color"
                      value={settings.brandColor}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          brandColor: event.target.value,
                        }))
                      }
                      className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="font-mono text-sm text-slate-600">{settings.brandColor}</span>
                  </span>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Custom domain
                  <input
                    maxLength={253}
                    value={settings.customDomain}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        customDomain: event.target.value,
                      }))
                    }
                    placeholder="pilot.example.com"
                    className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Custom-domain routing and DNS verification must be configured separately before
                a domain is live.
              </p>
              <button
                type="submit"
                disabled={isSaving || !data.canManage}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save workspace settings
              </button>
              {!data.canManage && (
                <p className="text-xs text-slate-500">Ask a workspace owner or admin to make changes.</p>
              )}
            </form>
          </section>

          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-800">
                  <Users className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-950">Your people</h2>
                  <p className="text-sm text-slate-500">
                    {workspace._count.members} member{workspace._count.members === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <ul className="mt-5 divide-y divide-slate-100">
                {workspace.members.map((member) => (
                  <li key={`${member.user.email}-${member.role}`} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {member.user.name || member.user.email}
                      </p>
                      {member.user.name && (
                        <p className="truncate text-xs text-slate-500">{member.user.email}</p>
                      )}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                      {member.role.toLowerCase()}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Invite people to the workspace so the team can work from one shared plan and clear
                ownership model.
              </p>
            </section>

            <section id="billing" className="scroll-mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-800">
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-950">Billing</h2>
                  <p className="text-sm text-slate-500">Provider confirmation controls access.</p>
                </div>
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Current plan</dt>
                  <dd className="font-medium text-slate-800">{workspace.plan}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Status</dt>
                  <dd className="font-medium capitalize text-slate-800">
                    {workspace.subscriptionStatus.replaceAll("_", " ").toLowerCase()}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Billing provider</dt>
                  <dd className="font-medium text-slate-800">{workspace.gateway ?? "Not selected"}</dd>
                </div>
                {workspace.billingEmail && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Billing email</dt>
                    <dd className="truncate font-medium text-slate-800">{workspace.billingEmail}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                Checkout returns do not change access by themselves. This page reflects paid
                access after the selected provider&apos;s verified webhook arrives.
              </p>
            </section>
          </div>
        </div>

        <section className="mt-8" aria-labelledby="plan-heading">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Choose your next step
              </p>
              <h2 id="plan-heading" className="mt-2 text-2xl font-semibold text-slate-950">
                Plans for a growing pilot
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Stripe charges in USD. Paystack and Flutterwave use merchant-configured NGN pricing,
              shown during their checkout.
            </p>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {planDetails.map((item) => (
              <article key={item.plan} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-emerald-800">{item.name}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">
                  {item.price}<span className="text-sm font-medium text-slate-500"> / month</span>
                </p>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{item.description}</p>
                <ul className="mt-5 space-y-2">
                  {item.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 space-y-2">
                  {(["STRIPE", "PAYSTACK", "FLUTTERWAVE"] as const).map((gateway) => (
                    <button
                      key={gateway}
                      type="button"
                      disabled={!data.canManage || busyPlan !== null || workspace.plan === item.plan}
                      onClick={() => void startCheckout(item.plan, gateway)}
                      className="flex min-h-10 w-full items-center justify-between rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>
                        {busyPlan === item.plan
                          ? "Connecting to provider…"
                          : `${workspace.plan === item.plan ? "Current" : "Continue"} with ${gateway}`}
                      </span>
                      {busyPlan === item.plan ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  ))}
                </div>
              </article>
            ))}
            <article className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-6">
              <p className="text-sm font-semibold text-emerald-800">Enterprise / Partner</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">Designed together</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Scope seats, integration needs, support expectations, and a responsible pilot plan
                with our team.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-emerald-800 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                Talk through a partnership
                <ArrowLeft className="h-4 w-4 rotate-180" aria-hidden="true" />
              </Link>
            </article>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            The application does not yet enforce seat counts or AI-credit budgets. Enterprise
            capacity, dedicated infrastructure, and service levels require a signed agreement.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function WorkspacePage() {
  return (
    <ProtectedRoute>
      <WorkspaceContent />
    </ProtectedRoute>
  );
}
