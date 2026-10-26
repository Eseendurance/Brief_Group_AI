"use client";

import { ArrowUp, LoaderCircle, MessageSquareText, Sparkles } from "lucide-react";
import { FormEvent, useState } from "react";

type Domain = "farm" | "equipment" | "inspection" | "automation";

const domains: { value: Domain; label: string }[] = [
  { value: "farm", label: "Farming" },
  { value: "equipment", label: "Equipment" },
  { value: "inspection", label: "Inspection" },
  { value: "automation", label: "Operations" },
];

export function DemoSandbox() {
  const [domain, setDomain] = useState<Domain>("farm");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || isLoading) return;

    setIsLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, message: prompt }),
      });
      const result = (await response.json()) as {
        reply?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "That request could not be completed.");
      }

      if (!result.reply) {
        throw new Error("The Brief Group preview did not return a response. Please retry.");
      }

      setAnswer(result.reply);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "We could not reach the Brief Group preview. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-xl shadow-emerald-900/5 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
          <MessageSquareText className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold text-slate-900">Brief Group preview</p>
          <p className="text-sm text-slate-500">A useful place to begin</p>
        </div>
        <Sparkles
          className="ml-auto h-5 w-5 text-amber-500"
          aria-hidden="true"
        />
      </div>

      <form className="mt-6" onSubmit={handleSubmit}>
        <label
          htmlFor="preview-domain"
          className="text-sm font-medium text-slate-700"
        >
          What would you like to explore?
        </label>
        <select
          id="preview-domain"
          value={domain}
          onChange={(event) => {
            const selected = domains.find(
              (item) => item.value === event.target.value,
            );
            if (selected) setDomain(selected.value);
          }}
          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          {domains.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <label htmlFor="preview-question" className="sr-only">
          Ask a question
        </label>
        <div className="mt-3 flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
          <textarea
            id="preview-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={1200}
            rows={3}
            placeholder="For example: What should I check before a hot afternoon shift?"
            className="min-h-20 min-w-0 flex-1 resize-y bg-transparent p-2 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            aria-label="Send question"
            className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <LoaderCircle
                className="h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p className="mt-2 text-right text-xs text-slate-400">
          {question.length}/1200
        </p>
      </form>

      {isLoading && (
        <div
          aria-live="polite"
          aria-label="BriefGroup AI is preparing a response"
          className="mt-5 space-y-2"
        >
          <div className="h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
        </div>
      )}
      {answer && (
        <div
          aria-live="polite"
          className="mt-5 whitespace-pre-wrap rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-slate-700"
        >
          {answer}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      )}
    </div>
  );
}
