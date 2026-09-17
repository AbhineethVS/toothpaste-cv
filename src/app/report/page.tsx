"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

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

  async function handleExportPdf() {
    if (!reportRef.current) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        useCORS: true,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save("toothpaste-cv-report.pdf");
    } catch {
      setExportError("Couldn't export the PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
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
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ink-muted">Your screening report</span>
            {status === "done" && result && (
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle px-3 py-1.5 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2.25} />
                {isExporting ? "Exporting…" : "Export PDF"}
              </button>
            )}
          </div>
        </div>
        {exportError && (
          <p className="mt-2 text-right text-xs text-status-critical-text">{exportError}</p>
        )}

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
          <div ref={reportRef}>
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
          </div>
        )}
      </main>
    </div>
  );
}
