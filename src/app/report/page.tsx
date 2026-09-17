"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import type { AnalysisResult } from "@/lib/analysis-schema";
import { StatRow } from "@/components/StatRow";
import { DentalMap } from "@/components/DentalMap";
import { KeyFindings } from "@/components/KeyFindings";
import { ClinicalImages } from "@/components/ClinicalImages";
import { QuadrantSummary } from "@/components/QuadrantSummary";

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

function Panel({
  title,
  subtitle,
  children,
  centered = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-border-subtle bg-surface-card p-5">
      <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      <div className={`mt-4 ${centered ? "flex flex-1 items-center" : ""}`}>{children}</div>
    </section>
  );
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
    <div className="flex flex-1 flex-col items-center bg-surface-page">
      <main className="flex w-full max-w-6xl flex-1 flex-col px-5 py-8 sm:px-6">
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
          <div className="flex flex-1 flex-col items-center justify-center py-32 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-border-subtle border-t-accent" />
            <p className="mt-6 text-sm text-ink-muted">
              Analysing your photos — this takes a few seconds…
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center py-32 text-center">
            <p className="text-sm text-status-critical-text">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
            >
              Try again
            </button>
          </div>
        )}

        {status === "done" && result && photos && (
          <>
            <p className="mt-5 max-w-3xl text-sm leading-6 text-ink-secondary">
              {result.overallSummary}
            </p>

            <div className="mt-5">
              <StatRow findings={result.findings} />
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
              <Panel title="Dental map" subtitle="Areas flagged across your photos">
                <DentalMap findings={result.findings} />
              </Panel>

              <Panel title="Key findings" subtitle="Most serious first — tap a row for detail">
                <KeyFindings findings={result.findings} />
              </Panel>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
              <Panel title="Clinical images" subtitle={`AI analysed ${CAPTURE_STEPS.length} images`}>
                <ClinicalImages findings={result.findings} photos={photos} />
              </Panel>

              <Panel title="Quadrant summary" centered>
                <div className="w-full">
                  <QuadrantSummary findings={result.findings} />
                </div>
              </Panel>
            </div>

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
