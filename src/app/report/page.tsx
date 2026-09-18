"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import type { AnalysisResult } from "@/lib/analysis-schema";
import { clearEntries, flaggedEntries, urgency } from "@/lib/report-metrics";
import { SEVERITY_ICON, SEVERITY_TEXT_CLASS, SEVERITY_WASH_CLASS } from "@/lib/severity";
import { Sidebar, MobileStepStrip } from "@/components/report/Sidebar";
import { Tabs, type ReportTabId } from "@/components/report/Tabs";
import { SummaryTab } from "@/components/report/SummaryTab";
import { FindingsTab } from "@/components/report/FindingsTab";
import { PhotosTab } from "@/components/report/PhotosTab";
import { ReportTab } from "@/components/report/ReportTab";

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

function ReportOverview({
  result,
  analysisSeconds,
}: {
  result: AnalysisResult;
  analysisSeconds: number | null;
}) {
  const tone = urgency(result.findings);
  const ToneIcon = SEVERITY_ICON[tone.severity];
  const flagged = flaggedEntries(result.findings).length;
  const clear = clearEntries(result.findings).length;

  return (
    <section className="mb-5 rounded-[28px] border border-border-subtle bg-surface-card p-5 shadow-[0_18px_50px_rgba(42,54,71,0.08)] sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div
            className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${SEVERITY_WASH_CLASS[tone.severity]} ${SEVERITY_TEXT_CLASS[tone.severity]}`}
          >
            <ToneIcon className="h-4 w-4" strokeWidth={2.25} />
            {tone.label}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-primary sm:text-3xl">
            Your visual oral health report
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-secondary sm:text-base sm:leading-7">
            {result.overallSummary}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
          <div className="rounded-2xl bg-surface-page px-3 py-3">
            <p className="text-xl font-semibold tabular-nums text-ink-primary">{flagged}</p>
            <p className="mt-0.5 text-xs text-ink-muted">flagged</p>
          </div>
          <div className="rounded-2xl bg-surface-page px-3 py-3">
            <p className="text-xl font-semibold tabular-nums text-ink-primary">{clear}</p>
            <p className="mt-0.5 text-xs text-ink-muted">clear</p>
          </div>
          <div className="rounded-2xl bg-surface-page px-3 py-3">
            <p className="text-xl font-semibold tabular-nums text-ink-primary">
              {analysisSeconds !== null ? `${analysisSeconds}s` : "Ready"}
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">analysis</p>
          </div>
        </div>
      </div>
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
  const [analysisSeconds, setAnalysisSeconds] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTabId>("summary");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!photos) router.replace("/capture");
  }, [photos, router]);

  useEffect(() => {
    if (!photos) return;

    let cancelled = false;
    const startedAt = performance.now();

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
        setAnalysisSeconds(Math.max(1, Math.round((performance.now() - startedAt) / 1000)));
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
    const previousTab = activeTab;
    setIsExporting(true);
    setExportError(null);

    try {
      // The exported PDF always contains the full report, regardless of which
      // tab is on screen -- switch there, let it paint, then capture it.
      if (previousTab !== "report") {
        setActiveTab("report");
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }

      if (!exportRef.current) throw new Error("Nothing to export yet.");

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(exportRef.current, {
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
      setActiveTab(previousTab);
      setIsExporting(false);
    }
  }

  return (
    <div className="theme-report flex min-h-screen flex-col bg-surface-page">
      <header className="border-b border-border-subtle bg-surface-page/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
          <div>
            <p className="text-lg font-bold tracking-tight text-ink-primary">
              toothpaste<span className="text-accent">.cv</span>
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">Visual screening report</p>
          </div>
          <div className="flex items-center gap-2.5">
            {status === "done" && result && (
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium text-ink-secondary shadow-[0_8px_24px_rgba(42,54,71,0.06)] transition-colors hover:text-ink-primary disabled:opacity-50"
              >
                <Download className="h-4 w-4" strokeWidth={2.25} />
                {isExporting ? "Exporting..." : "Download PDF"}
              </button>
            )}
            <Link
              href="/capture"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink shadow-[0_10px_24px_rgba(35,95,100,0.18)] transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              New screening
            </Link>
          </div>
        </div>
      </header>
      {exportError && (
        <p className="px-5 pt-2 text-right text-xs text-status-critical-text sm:px-6">{exportError}</p>
      )}

      <div className="mx-auto flex w-full max-w-6xl flex-1">
        <Sidebar analysisSeconds={analysisSeconds} />

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {status === "loading" && (
            <div className="flex flex-1 flex-col items-center justify-center py-32 text-center">
              <div className="rounded-[28px] border border-border-subtle bg-surface-card px-8 py-9 shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-border-subtle border-t-accent" />
                </div>
                <p className="mt-5 text-sm font-medium text-ink-primary">Reviewing your photos</p>
                <p className="mt-1 text-sm text-ink-muted">This usually takes a few seconds.</p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-1 flex-col items-center justify-center py-32 text-center">
              <div className="rounded-[28px] border border-border-subtle bg-surface-card px-8 py-9 shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
                <p className="text-sm font-medium text-status-critical-text">{errorMessage}</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">
                  You can retry with the same photos or start a new screening.
                </p>
              <button
                onClick={handleRetry}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
              >
                Try again
              </button>
              </div>
            </div>
          )}

          {status === "done" && result && photos && (
            <>
              <MobileStepStrip />
              <ReportOverview result={result} analysisSeconds={analysisSeconds} />
              <div className="mb-4">
                <Tabs active={activeTab} onChange={setActiveTab} />
              </div>

              <div className={activeTab === "summary" ? "" : "hidden"}>
                <SummaryTab result={result} photos={photos} />
              </div>
              <div className={activeTab === "findings" ? "" : "hidden"}>
                <FindingsTab result={result} />
              </div>
              <div className={activeTab === "photos" ? "" : "hidden"}>
                <PhotosTab result={result} photos={photos} />
              </div>
              <div ref={exportRef} className={activeTab === "report" ? "" : "hidden"}>
                <ReportTab result={result} photos={photos} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
