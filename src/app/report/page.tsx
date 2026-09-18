"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import type { AnalysisResult } from "@/lib/analysis-schema";
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
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6">
        <div>
          <p className="text-lg font-bold tracking-tight text-ink-primary">
            toothpaste<span className="text-accent">.cv</span>
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">AI Dental Screening</p>
        </div>
        <div className="flex items-center gap-2.5">
          {status === "done" && result && (
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary disabled:opacity-50"
            >
              <Download className="h-4 w-4" strokeWidth={2.25} />
              {isExporting ? "Exporting…" : "Download PDF"}
            </button>
          )}
          <Link
            href="/capture"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            New Screening
          </Link>
        </div>
      </header>
      {exportError && (
        <p className="px-5 pt-2 text-right text-xs text-status-critical-text sm:px-6">{exportError}</p>
      )}

      <div className="flex flex-1">
        <Sidebar analysisSeconds={analysisSeconds} />

        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
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
              <MobileStepStrip />
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
