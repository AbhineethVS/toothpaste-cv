"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import type { AnalysisResult } from "@/lib/analysis-schema";
import { DIAGNOSTIC_DEFS } from "@/lib/analysis-schema";
import { QuadrantGrid } from "@/components/QuadrantGrid";
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

  const flaggedCount = result
    ? Object.values(result.findings).filter((finding) => finding.severity !== "none").length
    : 0;

  return (
    <div className="flex flex-1 flex-col items-center bg-surface-page">
      <main className="flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
        <div className="flex items-center justify-between">
          <Link
            href="/capture"
            className="text-sm font-medium text-ink-muted transition-colors hover:text-ink-primary"
          >
            ← Back
          </Link>
          <span className="text-sm font-medium text-ink-muted">Your screening report</span>
        </div>

        {status === "loading" && (
          <div className="mt-20 flex flex-1 flex-col items-center justify-center text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-border-subtle border-t-accent" />
            <p className="mt-6 text-sm text-ink-muted">Analyzing your photos — this takes a few seconds…</p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-20 flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm text-status-critical">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-ink hover:opacity-90"
            >
              Try again
            </button>
          </div>
        )}

        {status === "done" && result && (
          <>
            <div className="mt-8 flex items-center gap-5 rounded-2xl border border-border-subtle bg-surface-card p-5">
              <div className="shrink-0 text-center">
                <p className="text-4xl font-semibold tabular-nums text-ink-primary">
                  {flaggedCount}
                  <span className="text-lg text-ink-muted">/{DIAGNOSTIC_DEFS.length}</span>
                </p>
                <p className="mt-1 text-xs text-ink-muted">flagged</p>
              </div>
              <div className="border-l border-border-subtle pl-5">
                <p className="text-sm leading-6 text-ink-secondary">{result.overallSummary}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border-subtle bg-surface-card p-6">
              <h2 className="mb-4 text-sm font-semibold text-ink-primary">By quadrant</h2>
              <QuadrantGrid findings={result.findings} />
            </div>

            <div className="mt-6">
              <h2 className="mb-3 text-sm font-semibold text-ink-primary">Findings</h2>
              <ScoreCard findings={result.findings} />
            </div>

            {photos && (
              <div className="mt-8 grid grid-cols-5 gap-2">
                {photos.map((photo, i) => (
                  <div key={CAPTURE_STEPS[i].id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={CAPTURE_STEPS[i].title}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <p className="mt-1 truncate text-center text-[10px] text-ink-muted">
                      {CAPTURE_STEPS[i].title}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-8 text-center text-xs leading-5 text-ink-muted">
              This is a preliminary visual screening only, not a medical diagnosis. Please consult a
              licensed dentist for advice about your oral health.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
