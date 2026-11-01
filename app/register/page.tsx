"use client";

import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { ArrowLeft, ArrowRight, Check, Sprout } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { countries } from "@/app/lib/countries";
import { currentTermsVersion } from "@/app/lib/legal-terms";
const roles = [
  "Farm owner",
  "Equipment operator",
  "Operations manager",
  "Enterprise lead",
] as const;

const goals = [
  "Smart farming",
  "Equipment and maintenance",
  "Machine inspection",
  "Team collaboration",
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [teamSize, setTeamSize] = useState("1");
  const [region, setRegion] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileSavePending, setProfileSavePending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (step === 1) {
      if (!role) {
        setError("Choose the role that best describes your work.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!goal) {
        setError("Choose what you would most like Brief Group to help with.");
        return;
      }
      setStep(3);
      return;
    }

    if (!acceptedTerms) {
      setError("Please review and accept the account agreement before continuing.");
      return;
    }

    setIsLoading(true);
    let accountCreated = profileSavePending;
    try {
      await setPersistence(auth, browserLocalPersistence);
      const user =
        profileSavePending && auth.currentUser
          ? auth.currentUser
          : (
              await createUserWithEmailAndPassword(auth, email, password)
            ).user;
      accountCreated = true;
      setProfileSavePending(true);

      const profileResponse = await fetch("/api/profile", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role,
          goal,
          workspaceName: workspaceName.trim(),
          teamSize,
          region: region.trim(),
          acceptedTerms: true,
          termsVersion: currentTermsVersion,
        }),
      });
      const profileResult = (await profileResponse.json()) as { error?: string };
      if (!profileResponse.ok) {
        throw new Error(profileResult.error || "We could not save your pilot profile.");
      }

      const workspaceResponse = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceName: workspaceName.trim(),
          teamSize,
          region: region.trim(),
          role,
          goal,
        }),
      });
      const workspaceResult = (await workspaceResponse.json()) as {
        error?: string;
      };
      if (!workspaceResponse.ok) {
        throw new Error(
          workspaceResult.error || "We could not set up your workspace.",
        );
      }

      setProfileSavePending(false);
      router.push("/dashboard");
    } catch (registrationError) {
      if (accountCreated) {
        setError(
          registrationError instanceof Error
            ? `Your account exists, but setup is not complete: ${registrationError.message}`
            : "Your account exists, but we couldn't finish workspace setup. Please retry.",
        );
      } else if (
        registrationError instanceof FirebaseError &&
        registrationError.code === "auth/email-already-in-use"
      ) {
        setError("An account already exists for this email. Try signing in instead.");
      } else if (
        registrationError instanceof FirebaseError &&
        registrationError.code === "auth/weak-password"
      ) {
        setError("Choose a stronger password with at least six characters.");
      } else {
        setError(
          "We couldn't finish creating your account. Please check your connection and try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  function chooseOption(
    options: readonly string[],
    selected: string,
    onSelect: (value: string) => void,
  ) {
    return (
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              onSelect(option);
              setError("");
            }}
            aria-pressed={selected === option}
            className={`flex min-h-14 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
              selected === option
                ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
            }`}
          >
            {option}
            {selected === option && (
              <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf8] px-5 py-10 text-slate-800">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Brief Group
        </Link>
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/brief-group-logo.svg"
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl"
              />
              <div>
                <p className="font-semibold text-slate-900">Brief Group</p>
                <p className="text-sm text-slate-500">A few details to get started</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              Step {step} of 3
            </span>
          </div>

          <div
            aria-label={`Step ${step} of 3`}
            className="mt-6 flex gap-2"
          >
            {[1, 2, 3].map((stepNumber) => (
              <span
                key={stepNumber}
                className={`h-1.5 flex-1 rounded-full ${
                  stepNumber <= step ? "bg-emerald-600" : "bg-slate-100"
                }`}
              />
            ))}
          </div>

          <form className="mt-8" onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <p className="text-sm font-semibold text-emerald-700">
                  First, a little about you
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  What best describes your role?
                </h1>
                {chooseOption(roles, role, setRole)}
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm font-semibold text-emerald-700">
                  Let&apos;s make this relevant
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  What would you like help with first?
                </h1>
                {chooseOption(goals, goal, setGoal)}
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-sm font-semibold text-emerald-700">
                  A place for your team
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  Let&apos;s set up your pilot profile.
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  These details help us understand your context. You can change
                  them later.
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Organization or workspace name
                    <input
                      required
                      maxLength={80}
                      value={workspaceName}
                      onChange={(event) => setWorkspaceName(event.target.value)}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 px-4 font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="Your organization"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Team size
                    <select
                      value={teamSize}
                      onChange={(event) => setTeamSize(event.target.value)}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="1">Just me</option>
                      <option value="2-5">2-5 people</option>
                      <option value="6-20">6-20 people</option>
                      <option value="21+">More than 20 people</option>
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Country or territory
                    <select
                      required
                      value={region}
                      onChange={(event) => setRegion(event.target.value)}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 px-4 font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Choose your country</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.name}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Work email
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 px-4 font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="you@company.com"
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Create a password
                    <input
                      required
                      type="password"
                      minLength={6}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-200 px-4 font-normal text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      placeholder="At least 6 characters"
                    />
                  </label>
                </div>
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
                  <Sprout className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  BriefCare wellbeing reminders are optional and are off by
                  default. You do not need to share health information.
                </p>
                <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-700">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-emerald-700"
                  />
                  <span>
                    I have read and agree to the{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-800 underline underline-offset-2"
                    >
                      Account Agreement
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-800 underline underline-offset-2"
                    >
                      Privacy Notice
                    </Link>
                    . I understand Brief Group is an evolving service and that operational AI
                    responses require human review.
                  </span>
                </label>
              </>
            )}

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-rose-50 p-3 text-sm leading-5 text-rose-800"
              >
                {error}
              </p>
            )}

            <div className="mt-7 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep((currentStep) => currentStep - 1);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? profileSavePending
                    ? "Saving your profile..."
                    : "Creating your account..."
                  : step === 3
                    ? profileSavePending
                      ? "Retry profile setup"
                      : "Create my account"
                    : "Continue"}
                {!isLoading && (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-800 hover:text-emerald-900"
            >
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
