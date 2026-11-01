"use client";

import {
  collection,
  doc,
  type DocumentData,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  CloudSun,
  FileText,
  Heart,
  LoaderCircle,
  LogOut,
  MapPin,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import { ProtectedRoute, useAuth } from "@/app/lib/auth";
import { db } from "@/app/lib/firebase";

type Report = {
  operationalScore: number;
  status: string;
  summary: string;
  recommendations: string[];
  createdAt?: { toMillis?: () => number };
};

type WeatherSummary = {
  temperature?: number;
  humidity?: number;
  precipitation?: number;
  windSpeed?: number;
};

const reportFields = [
  { key: "energyLoad", label: "Energy load (%)" },
  { key: "machineHealth", label: "Equipment health (%)" },
  { key: "rainfallRisk", label: "Rainfall exposure (%)" },
] as const;

function asReport(data: DocumentData): Report | null {
  if (
    typeof data.operationalScore !== "number" ||
    typeof data.status !== "string" ||
    typeof data.summary !== "string" ||
    !Array.isArray(data.recommendations) ||
    !data.recommendations.every((item: unknown) => typeof item === "string")
  ) {
    return null;
  }

  return {
    operationalScore: data.operationalScore,
    status: data.status,
    summary: data.summary,
    recommendations: data.recommendations,
    createdAt: data.createdAt,
  };
}

function DashboardContent() {
  const { user, logout } = useAuth();
  const [report, setReport] = useState<Report | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [latitude, setLatitude] = useState("6.5244");
  const [longitude, setLongitude] = useState("3.3792");
  const [healthHubEnabled, setHealthHubEnabled] = useState(false);
  const [reportInputs, setReportInputs] = useState({
    energyLoad: "62",
    machineHealth: "84",
    rainfallRisk: "31",
    inspectionFindings: "",
  });
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [uploadedName, setUploadedName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function requestHeaders() {
    if (!user) throw new Error("Please sign in again to continue.");
    return {
      Authorization: `Bearer ${await user.getIdToken()}`,
      "Content-Type": "application/json",
    };
  }

  async function loadWeather(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setError("Latitude must be between -90 and 90.");
      return;
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      setError("Longitude must be between -180 and 180.");
      return;
    }

    setError("");
    setIsLoadingWeather(true);
    try {
      const response = await fetch("/api/weather", {
        method: "POST",
        headers: await requestHeaders(),
        body: JSON.stringify({ latitude: lat, longitude: lon }),
      });
      const result = (await response.json()) as {
        weather?: {
          current?: {
            temperature_2m?: number;
            relative_humidity_2m?: number;
            precipitation?: number;
            wind_speed_10m?: number;
          };
        };
        error?: string;
      };

      if (!response.ok || !result.weather?.current) {
        throw new Error(result.error || "Weather data is not available right now.");
      }

      setWeather({
        temperature: result.weather.current.temperature_2m,
        humidity: result.weather.current.relative_humidity_2m,
        precipitation: result.weather.current.precipitation,
        windSpeed: result.weather.current.wind_speed_10m,
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "We could not load weather for those coordinates.",
      );
    } finally {
      setIsLoadingWeather(false);
    }
  }

  async function loadSavedData() {
    if (!user) return;
    const profile = await getDoc(doc(db, "users", user.uid));
    setHealthHubEnabled(profile.data()?.enableHealthHub === true);

    const savedReports = await getDocs(
      query(
        collection(db, "reports"),
        where("ownerId", "==", user.uid),
        limit(10),
      ),
    );
    const loadedReports = savedReports.docs
      .map((snapshot) => asReport(snapshot.data()))
      .filter((item): item is Report => item !== null)
      .sort(
        (left, right) =>
          (right.createdAt?.toMillis?.() ?? 0) -
          (left.createdAt?.toMillis?.() ?? 0),
      );
    setReports(loadedReports);
    setReport(loadedReports[0] ?? null);
  }

  const loadDashboardData = useEffectEvent(() => {
    void Promise.all([loadSavedData(), loadWeather()]).catch(
      (loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "We could not load your workspace information.",
        );
      },
    );
  });

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(loadDashboardData, 0);
    return () => window.clearTimeout(timer);
  }, [user]);

  async function generateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const input = {
      energyLoad: Number(reportInputs.energyLoad),
      machineHealth: Number(reportInputs.machineHealth),
      rainfallRisk: Number(reportInputs.rainfallRisk),
      inspectionFindings: reportInputs.inspectionFindings.trim(),
    };
    if (
      [input.energyLoad, input.machineHealth, input.rainfallRisk].some(
        (value) => !Number.isFinite(value) || value < 0 || value > 100,
      )
    ) {
      setError("Signal values must be between 0 and 100.");
      return;
    }

    setError("");
    setNotice("");
    setIsGeneratingReport(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: await requestHeaders(),
        body: JSON.stringify(input),
      });
      const result = (await response.json()) as Report & { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "We could not create that report.");
      }

      setReport(result);
      setReports((current) => [result, ...current].slice(0, 10));
      setNotice("Your operational summary is ready and saved to your account.");
    } catch (reportError) {
      setError(
        reportError instanceof Error
          ? reportError.message
          : "We could not save your operational summary.",
      );
    } finally {
      setIsGeneratingReport(false);
    }
  }

  async function uploadInspection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Please choose an image or PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Inspection files must be smaller than 10 MB.");
      return;
    }

    setError("");
    setNotice("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/inspections", {
        method: "POST",
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
        body: formData,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "We could not upload that file.");
      }
      setUploadedName(file.name);
      setNotice("Inspection evidence was uploaded and saved to your account.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "We could not upload that file. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function toggleHealthHub() {
    if (!user || isSavingPreference) return;
    const enabled = !healthHubEnabled;
    setError("");
    setIsSavingPreference(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enableHealthHub: enabled }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "We could not save that preference.");
      }
      setHealthHubEnabled(enabled);
      setNotice(
        enabled
          ? "Optional wellbeing reminders are on for this account."
          : "Optional wellbeing reminders are off.",
      );
    } catch (preferenceError) {
      setError(
        preferenceError instanceof Error
          ? preferenceError.message
          : "We could not save that preference.",
      );
    } finally {
      setIsSavingPreference(false);
    }
  }

  const displayName =
    user?.displayName?.trim() || user?.email?.split("@")[0] || "there";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brief-group-logo.svg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl"
            />
            <div>
              <p className="font-semibold text-slate-900">Brief Group</p>
              <p className="text-xs text-slate-500">Your operations workspace</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/workspace"
              className="inline-flex min-h-10 items-center rounded-full border border-emerald-200 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            >
              Workspace & billing
            </Link>
            <span className="hidden max-w-52 truncate text-sm text-slate-500 sm:block">
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Your pilot workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Welcome, {displayName}.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              A clearer view of your work, with your team in control.
            </p>
          </div>
          <Link
            href="/customer-care"
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-800 sm:self-auto"
          >
            <Bot className="h-4 w-4" aria-hidden="true" />
            Ask BriefGroup AI
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.section>

        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          Start with the signals you provide. No live equipment or farm sensors
          are connected to this workspace yet.
        </p>

        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            className={`mt-4 rounded-xl px-4 py-3 text-sm leading-6 ${
              error
                ? "bg-rose-50 text-rose-800"
                : "bg-emerald-50 text-emerald-900"
            }`}
          >
            {error || notice}
          </div>
        )}

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CloudSun className="h-4 w-4 text-sky-700" aria-hidden="true" />
                  Local weather
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Live forecast from Open-Meteo for the coordinates you choose.
                </p>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
                Live data
              </span>
            </div>
            <form
              className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={(event) => void loadWeather(event)}
            >
              <label className="text-xs font-medium text-slate-600">
                Latitude
                <input
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                  inputMode="decimal"
                  className="mt-1 block min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Longitude
                <input
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                  inputMode="decimal"
                  className="mt-1 block min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-emerald-500"
                />
              </label>
              <button
                type="submit"
                disabled={isLoadingWeather}
                className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {isLoadingWeather ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                )}
                Check
              </button>
            </form>
            {weather ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Temperature", weather.temperature, " C"],
                  ["Humidity", weather.humidity, "%"],
                  ["Rainfall", weather.precipitation, " mm"],
                  ["Wind", weather.windSpeed, " km/h"],
                ].map(([label, value, unit]) => (
                  <div key={String(label)} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {typeof value === "number" ? `${value}${unit}` : "-"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                {isLoadingWeather
                  ? "Loading current weather..."
                  : "Enter coordinates and check for current conditions."}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                  Account and privacy
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Signed in with Firebase Authentication. We have not connected
                  any organization sensors.
                </p>
              </div>
              <CheckCircle2
                className="h-5 w-5 shrink-0 text-emerald-700"
                aria-hidden="true"
              />
            </div>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:text-emerald-900"
            >
              Discuss pilot security requirements
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Create an operations summary
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  A transparent score from the values you enter - not a
                  connection to unconfigured sensors.
                </p>
              </div>
            </div>
            <form className="mt-5 space-y-3" onSubmit={generateReport}>
              {reportFields.map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-4 text-sm text-slate-700"
                >
                  {label}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reportInputs[key]}
                    onChange={(event) =>
                      setReportInputs((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className="min-h-10 w-24 rounded-lg border border-slate-200 px-3 text-right text-slate-900 outline-none focus:border-emerald-500"
                  />
                </label>
              ))}
              <label className="block text-sm text-slate-700">
                Optional inspection note
                <textarea
                  maxLength={500}
                  rows={2}
                  value={reportInputs.inspectionFindings}
                  onChange={(event) =>
                    setReportInputs((current) => ({
                      ...current,
                      inspectionFindings: event.target.value,
                    }))
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  placeholder="A brief note to include"
                />
              </label>
              <button
                type="submit"
                disabled={isGeneratingReport}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
              >
                {isGeneratingReport && (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {isGeneratingReport ? "Preparing summary..." : "Create and save summary"}
              </button>
            </form>
            {report && (
              <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="font-semibold text-slate-900">
                  Operations score: {report.operationalScore}% - {report.status}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {report.summary}
                </p>
                <ul className="mt-3 space-y-2">
                  {report.recommendations.map((recommendation) => (
                    <li
                      key={recommendation}
                      className="flex gap-2 text-sm leading-5 text-slate-700"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                        aria-hidden="true"
                      />
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Summaries are rule-based planning aids, not certified engineering,
              agricultural, or safety assessments.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Save inspection evidence
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Upload a private image or PDF to your Firebase Storage account.
                  It is stored for review, not automatically analyzed.
                </p>
              </div>
            </div>
            <label className="mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-emerald-500 hover:bg-emerald-50/40">
              {isUploading ? (
                <LoaderCircle
                  className="h-8 w-8 animate-spin text-emerald-700"
                  aria-hidden="true"
                />
              ) : (
                <UploadCloud
                  className="h-8 w-8 text-emerald-700"
                  aria-hidden="true"
                />
              )}
              <span className="mt-3 text-sm font-semibold text-slate-800">
                {isUploading ? "Uploading securely..." : "Choose an image or PDF"}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                Maximum 10 MB
              </span>
              <input
                type="file"
                accept="image/*,.pdf"
                disabled={isUploading}
                onChange={(event) => void uploadInspection(event)}
                className="sr-only"
              />
            </label>
            {uploadedName && (
              <p className="mt-3 flex items-center gap-2 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {uploadedName} saved
              </p>
            )}
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                <Heart className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">
                  BriefCare Shield
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  Optional, general wellbeing reminders. Your choice is saved
                  with your user profile; no health details are collected.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={healthHubEnabled}
              disabled={isSavingPreference}
              onClick={() => void toggleHealthHub()}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-60 ${
                healthHubEnabled ? "bg-emerald-700" : "bg-slate-300"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  healthHubEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
              <span className="sr-only">
                {healthHubEnabled ? "Turn off" : "Turn on"} BriefCare Shield
              </span>
            </button>
          </div>
          {healthHubEnabled && (
            <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
              {[
                "Take a short water break after outdoor work.",
                "Try a gentle wrist and shoulder stretch between tasks.",
                "Pause and follow your team's heat and safety procedures.",
              ].map((tip) => (
                <div
                  key={tip}
                  className="flex gap-2 rounded-xl bg-slate-50 p-3 text-sm leading-5 text-slate-700"
                >
                  <Activity
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                  {tip}
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs leading-5 text-slate-500">
            These prompts are not medical or occupational safety advice. Use
            qualified guidance and your organization&apos;s safety procedures.
          </p>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-semibold text-slate-900">Recent summaries</h2>
          {reports.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Your saved operations summaries will appear here.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {reports.map((savedReport, index) => (
                <li
                  key={`${savedReport.createdAt?.toMillis?.() ?? index}-${index}`}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-sm text-slate-700">
                    {savedReport.summary}
                  </p>
                  <span className="shrink-0 text-xs font-medium text-emerald-800">
                    {savedReport.operationalScore}% - {savedReport.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
