"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Clock3,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  clearTimeline,
  readTimeline,
  timelineEntryHasFullReport,
  type TimelineEntry,
} from "@/lib/timeline-storage";
import { clearEntries, flaggedEntries, urgency } from "@/lib/report-metrics";
import { SEVERITY_ICON, SEVERITY_TEXT_CLASS, SEVERITY_WASH_CLASS } from "@/lib/severity";
import { AuthButton } from "@/components/auth/AuthButton";
import { TimelineComparisons } from "@/components/timeline/TimelineComparisons";

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function trendFor(current: TimelineEntry, previous: TimelineEntry | null) {
  if (!previous) return { label: "Baseline", detail: "First saved screening", tone: "neutral" as const };

  const currentFlags = flaggedEntries(current.result.findings).length;
  const previousFlags = flaggedEntries(previous.result.findings).length;
  const delta = currentFlags - previousFlags;

  if (delta < 0) {
    return {
      label: "Improved",
      detail: `${Math.abs(delta)} fewer flagged ${Math.abs(delta) === 1 ? "area" : "areas"}`,
      tone: "good" as const,
    };
  }
  if (delta > 0) {
    return {
      label: "More flags",
      detail: `${delta} more flagged ${delta === 1 ? "area" : "areas"}`,
      tone: "watch" as const,
    };
  }
  return { label: "Stable", detail: "Same flagged count", tone: "neutral" as const };
}

function TrendBadge({ trend }: { trend: ReturnType<typeof trendFor> }) {
  const Icon = trend.tone === "good" ? TrendingDown : trend.tone === "watch" ? TrendingUp : Clock3;
  const classes =
    trend.tone === "good"
      ? "bg-status-good/10 text-status-good-text"
      : trend.tone === "watch"
        ? "bg-status-warning/10 text-status-warning-text"
        : "bg-accent/10 text-accent";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {trend.label}
    </span>
  );
}

export default function TimelinePage() {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Timeline entries are localStorage-backed, so load them after hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    setEntries(readTimeline());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const latest = entries[0] ?? null;
  const latestTone = latest ? urgency(latest.result.findings) : null;
  const LatestIcon = latestTone ? SEVERITY_ICON[latestTone.severity] : Sparkles;

  const timelineRows = useMemo(
    () =>
      entries.map((entry, index) => ({
        entry,
        trend: trendFor(entry, entries[index + 1] ?? null),
        flagged: flaggedEntries(entry.result.findings),
        clear: clearEntries(entry.result.findings),
        tone: urgency(entry.result.findings),
      })),
    [entries]
  );

  function handleClear() {
    clearTimeline();
    setEntries([]);
  }

  return (
    <div className="theme-report min-h-screen w-full min-w-0 bg-surface-page text-ink-primary">
      <header className="w-full border-b border-border-subtle bg-surface-page/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
            Home
          </Link>
          <div className="min-w-0 text-center">
            <p className="truncate text-sm font-semibold text-ink-primary">Oral health timeline</p>
            <p className="text-xs text-ink-muted">
              {ready ? `${entries.length} saved screenings` : "Loading…"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AuthButton />
            <Link
              href="/capture"
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-2 text-sm font-medium text-accent-ink shadow-[0_10px_24px_rgba(35,95,100,0.18)] transition-opacity hover:opacity-90 sm:px-4"
            >
              <Camera className="h-4 w-4" strokeWidth={2.25} />
              New
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {!ready ? (
          <div className="flex justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-subtle border-t-accent" />
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1f7a3f]/10 px-3 py-1.5 text-xs font-semibold text-[#1f7a3f]">
                  <LatestIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
                  {latestTone?.label ?? "No baseline yet"}
                </span>
                {latest && (
                  <span className="text-xs text-ink-muted">
                    {flaggedEntries(latest.result.findings).length} flagged · {entries.length} saved
                  </span>
                )}
              </div>
            </div>

            {entries.length === 0 ? (
              <section className="rounded-[28px] border border-dashed border-border-subtle bg-surface-card p-8 text-center shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Clock3 className="h-6 w-6" strokeWidth={2.25} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-ink-primary">No saved screenings yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
                  Complete a screening, then save the report to start comparisons.
                </p>
                <Link
                  href="/capture"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink"
                >
                  Start a screening
                </Link>
              </section>
            ) : (
              <>
                <TimelineComparisons entries={entries} />

                <section className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold text-ink-primary">Saved screenings</h2>
                    <button
                      onClick={handleClear}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-status-critical-text"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                      Clear
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {timelineRows.map(({ entry, trend, flagged, clear, tone }) => {
                      const ToneIcon = SEVERITY_ICON[tone.severity];
                      const canOpenReport = timelineEntryHasFullReport(entry);
                      const cardClassName =
                        "flex items-center gap-3 rounded-[24px] border border-border-subtle bg-surface-card p-3 shadow-[0_12px_32px_rgba(42,54,71,0.06)] transition-colors sm:gap-4 sm:p-3.5";

                      const cardBody = (
                        <>
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-page sm:h-20 sm:w-20">
                            {entry.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={entry.thumbnail} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-ink-muted">
                                <Camera className="h-5 w-5" strokeWidth={2.25} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-ink-primary">{formatDate(entry.createdAt)}</p>
                              <TrendBadge trend={trend} />
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-ink-muted">
                                {flagged.length} flagged · {clear.length} clear
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${SEVERITY_WASH_CLASS[tone.severity]} ${SEVERITY_TEXT_CLASS[tone.severity]}`}
                              >
                                <ToneIcon className="h-3 w-3" strokeWidth={2.25} />
                                {tone.label}
                              </span>
                            </div>
                            {!canOpenReport && (
                              <p className="mt-1 text-[11px] text-ink-muted">
                                Full report unavailable for this older save
                              </p>
                            )}
                          </div>

                          {canOpenReport && (
                            <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" strokeWidth={2} />
                          )}
                        </>
                      );

                      return canOpenReport ? (
                        <Link
                          key={entry.id}
                          href={`/report?entry=${entry.id}`}
                          className={`${cardClassName} hover:border-accent/40 hover:bg-surface-page/50`}
                        >
                          {cardBody}
                        </Link>
                      ) : (
                        <article key={entry.id} className={`${cardClassName} opacity-90`}>
                          {cardBody}
                        </article>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
