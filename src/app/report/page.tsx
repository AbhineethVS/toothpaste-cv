"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock3, Download, Plus, Save } from "lucide-react";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import type { AnalysisResult } from "@/lib/analysis-schema";
import { clearEntries, flaggedEntries, urgency } from "@/lib/report-metrics";
import { saveTimelineEntry, getTimelineEntry, timelineEntryHasFullReport } from "@/lib/timeline-storage";
import { SEVERITY_ICON, SEVERITY_TEXT_CLASS, SEVERITY_WASH_CLASS } from "@/lib/severity";
import { Sidebar, MobileStepStrip } from "@/components/report/Sidebar";
import { Tabs, type ReportTabId } from "@/components/report/Tabs";
import { SummaryTab } from "@/components/report/SummaryTab";
import { FindingsTab } from "@/components/report/FindingsTab";
import { PhotosTab } from "@/components/report/PhotosTab";
import { ReportTab } from "@/components/report/ReportTab";
import { AuthButton } from "@/components/auth/AuthButton";
import { useAuth } from "@/components/auth/AuthProvider";
import { SignInRequiredModal } from "@/components/auth/SignInRequiredModal";
import { TimelineNavButton } from "@/components/auth/TimelineNavButton";

type Status = "loading" | "error" | "done";
type AuthGateAction = "timeline" | "save" | null;

const AUTH_GATE_COPY: Record<Exclude<AuthGateAction, null>, string> = {
  timeline:
    "Your timeline is your personal dashboard of saved screenings. Sign in to open it and track changes over time.",
  save: "Sign in to save this screening to your timeline so you can compare results across visits.",
};

function readEntryIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("entry");
}

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
  isSavedView,
}: {
  result: AnalysisResult;
  analysisSeconds: number | null;
  isSavedView?: boolean;
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
              {analysisSeconds !== null ? `${analysisSeconds}s` : isSavedView ? "Saved" : "Ready"}
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
  const { user } = useAuth();
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[] | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [analysisSeconds, setAnalysisSeconds] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTabId>("summary");
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingTimeline, setIsSavingTimeline] = useState(false);
  const [timelineStatus, setTimelineStatus] = useState<"idle" | "saved" | "error">("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const [authGate, setAuthGate] = useState<AuthGateAction>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const isSavedView = Boolean(savedEntryId);

  useEffect(() => {
    // Saved reports and capture photos are browser-only state read after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    const entryId = readEntryIdFromUrl();
    if (entryId) {
      const entry = getTimelineEntry(entryId);
      if (!entry || !timelineEntryHasFullReport(entry)) {
        setSavedEntryId(entryId);
        setStatus("error");
        setErrorMessage(
          entry
            ? "This saved screening doesn’t include the full report photos. Run a new screening and save again."
            : "That saved screening could not be found on this device."
        );
        return;
      }
      setSavedEntryId(entryId);
      setPhotos(entry.photos ?? null);
      setResult(entry.result);
      setAnalysisSeconds(null);
      setTimelineStatus("saved");
      setStatus("done");
      return;
    }

    const sessionPhotos = readStoredPhotos();
    if (!sessionPhotos) {
      router.replace("/capture");
      return;
    }
    setPhotos(sessionPhotos);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router]);

  useEffect(() => {
    if (isSavedView || !photos) return;

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
  }, [photos, attempt, isSavedView]);

  function handleRetry() {
    if (isSavedView) {
      router.push("/timeline");
      return;
    }
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

  async function handleSaveTimeline() {
    if (!result || !photos) return;
    if (!user) {
      setAuthGate("save");
      return;
    }
    setIsSavingTimeline(true);
    setTimelineStatus("idle");
    try {
      await saveTimelineEntry(result, photos);
      setTimelineStatus("saved");
    } catch {
      setTimelineStatus("error");
    } finally {
      setIsSavingTimeline(false);
    }
  }

  function handleTimelineClick() {
    if (!user) {
      setAuthGate("timeline");
      return;
    }
    router.push("/timeline");
  }

  return (
    <div className="theme-report flex min-h-screen w-full min-w-0 flex-col bg-surface-page">
      <header className="w-full border-b border-border-subtle bg-surface-page/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-ink-primary transition-opacity hover:opacity-80"
            >
              toothpaste<span className="text-accent">.cv</span>
            </Link>
            <p className="mt-0.5 text-xs text-ink-muted">Visual screening report</p>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-2.5">
            <AuthButton />
            {isSavedView ? (
              <Link
                href="/timeline"
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-3 py-2 text-sm font-medium text-ink-secondary shadow-[0_8px_24px_rgba(42,54,71,0.06)] transition-colors hover:text-ink-primary sm:px-4"
              >
                <Clock3 className="h-4 w-4" strokeWidth={2.25} />
                Back
              </Link>
            ) : user ? (
              <TimelineNavButton />
            ) : (
              <button
                type="button"
                onClick={handleTimelineClick}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-3 py-2 text-sm font-medium text-ink-secondary shadow-[0_8px_24px_rgba(42,54,71,0.06)] transition-colors hover:text-ink-primary sm:px-4"
              >
                <Clock3 className="h-4 w-4" strokeWidth={2.25} />
                Timeline
              </button>
            )}
            {status === "done" && result && !isSavedView && (
              <button
                onClick={handleSaveTimeline}
                disabled={isSavingTimeline || timelineStatus === "saved"}
                className="inline-flex items-center gap-1.5 rounded-full bg-status-critical px-3 py-2 text-sm font-medium text-white shadow-[0_10px_24px_rgba(208,59,59,0.28)] transition-opacity hover:opacity-90 disabled:opacity-55 sm:px-4"
              >
                <Save className="h-4 w-4" strokeWidth={2.25} />
                {isSavingTimeline ? "Saving..." : timelineStatus === "saved" ? "Saved" : "Save"}
              </button>
            )}
            {status === "done" && result && (
              <button
                onClick={handleExportPdf}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-3 py-2 text-sm font-medium text-ink-secondary shadow-[0_8px_24px_rgba(42,54,71,0.06)] transition-colors hover:text-ink-primary disabled:opacity-50 sm:px-4"
              >
                <Download className="h-4 w-4" strokeWidth={2.25} />
                <span className="sm:hidden">{isExporting ? "..." : "PDF"}</span>
                <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Download PDF"}</span>
              </button>
            )}
            <Link
              href="/capture"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-sm font-medium text-accent-ink shadow-[0_10px_24px_rgba(35,95,100,0.18)] transition-opacity hover:opacity-90 sm:px-4"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New screening</span>
            </Link>
          </div>
        </div>
      </header>
      <SignInRequiredModal
        open={authGate !== null}
        reason={authGate ? AUTH_GATE_COPY[authGate] : ""}
        onClose={() => setAuthGate(null)}
      />
      {exportError && (
        <p className="px-5 pt-2 text-right text-xs text-status-critical-text sm:px-6">{exportError}</p>
      )}
      {timelineStatus === "error" && !isSavedView && (
        <p className="px-5 pt-2 text-right text-xs text-status-critical-text sm:px-6">
          Couldn&apos;t save this screening to your timeline.
        </p>
      )}
      {timelineStatus === "saved" && !isSavedView && (
        <p className="px-5 pt-2 text-right text-xs text-status-good-text sm:px-6">
          Saved to your oral health timeline.
        </p>
      )}

      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-1">
        <Sidebar analysisSeconds={analysisSeconds} />

        <main className="w-full min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">
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
                  {isSavedView
                    ? "You can return to your timeline or start a new screening."
                    : "You can retry with the same photos or start a new screening."}
                </p>
              <button
                onClick={handleRetry}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-accent-ink transition-opacity hover:opacity-90"
              >
                {isSavedView ? "Back to timeline" : "Try again"}
              </button>
              </div>
            </div>
          )}

          {status === "done" && result && photos && (
            <>
              <MobileStepStrip />
              <ReportOverview
                result={result}
                analysisSeconds={analysisSeconds}
                isSavedView={isSavedView}
              />
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
