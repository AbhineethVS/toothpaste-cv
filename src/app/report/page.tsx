"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import type { AnalysisResult } from "@/lib/analysis-schema";
import { Odontogram } from "@/components/Odontogram";
import { ScoreCard } from "@/components/ScoreCard";

type Status = "loading" | "error" | "done";

function readStoredPhotos(): string[] | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("toothpaste-cv:photos");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === CAPTURE_STEPS.length && parsed.every(Boolean)) {
      return parsed as string[];
    }
  } catch {
    // fall through to null
  }
  return null;
}

export default function ReportPage() {
  const router = useRouter();
  const [photos] = useState<string[] | null>(readStoredPhotos);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!photos) router.replace("/capture");
  }, [photos, router]);

  useEffect(() => {
    if (!photos) return;

    let cancelled = false;

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || "Analysis failed.");
        if (cancelled) return;
        setResult(data as AnalysisResult);
        setStatus("done");
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setErrorMessage(error.message);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [photos, attempt]);

  function handleRetry() {
    setStatus("loading");
    setErrorMessage(null);
    setAttempt((n) => n + 1);
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/capture"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Back
          </Link>
          <span className="text-sm font-medium text-zinc-500">Your screening report</span>
        </div>

        {status === "loading" && (
          <div className="mt-20 flex flex-1 flex-col items-center justify-center text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950 dark:border-zinc-700 dark:border-t-zinc-50" />
            <p className="mt-6 text-sm text-zinc-500">Analyzing your photos — this takes a few seconds…</p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-20 flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Try again
            </button>
          </div>
        )}

        {status === "done" && result && (
          <>
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
              <h1 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Summary</h1>
              <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {result.overallSummary}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
              <Odontogram findings={result.findings} />
            </div>

            <div className="mt-6">
              <ScoreCard findings={result.findings} />
            </div>

            {photos && (
              <div className="mt-6 grid grid-cols-5 gap-2">
                {photos.map((photo, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={CAPTURE_STEPS[i].id}
                    src={photo}
                    alt={CAPTURE_STEPS[i].title}
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}

            <p className="mt-8 text-center text-xs leading-5 text-zinc-400">
              This is a preliminary visual screening only, not a medical diagnosis. Please consult a
              licensed dentist for advice about your oral health.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
