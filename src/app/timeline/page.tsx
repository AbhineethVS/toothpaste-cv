"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Clock3, Sparkles, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { clearTimeline, readTimeline, type TimelineEntry } from "@/lib/timeline-storage";
import { clearEntries, flaggedEntries, urgency } from "@/lib/report-metrics";
import { SEVERITY_ICON, SEVERITY_TEXT_CLASS, SEVERITY_WASH_CLASS } from "@/lib/severity";
import { AuthButton } from "@/components/auth/AuthButton";

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
  const [entries, setEntries] = useState<TimelineEntry[]>(() => readTimeline());

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
            <p className="text-xs text-ink-muted">{entries.length} saved screenings</p>
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
        <section className="rounded-[28px] border border-border-subtle bg-surface-card p-5 shadow-[0_18px_50px_rgba(42,54,71,0.08)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-sm font-medium text-accent">
                <LatestIcon className="h-4 w-4" strokeWidth={2.25} />
                {latestTone?.label ?? "No baseline yet"}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink-primary">
                Track visible changes over time.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-secondary sm:text-base sm:leading-7">
                Save each screening to compare flagged areas, severity, and notes from one check to
                the next. This timeline stays on this device for now.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
              <div className="rounded-2xl bg-surface-page px-3 py-3">
                <p className="text-xl font-semibold tabular-nums text-ink-primary">{entries.length}</p>
                <p className="mt-0.5 text-xs text-ink-muted">saved</p>
              </div>
              <div className="rounded-2xl bg-surface-page px-3 py-3">
                <p className="text-xl font-semibold tabular-nums text-ink-primary">
                  {latest ? flaggedEntries(latest.result.findings).length : 0}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">latest flags</p>
              </div>
              <div className="rounded-2xl bg-surface-page px-3 py-3">
                <p className="text-xl font-semibold tabular-nums text-ink-primary">
                  {entries.length > 1 ? "On" : "New"}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">comparison</p>
              </div>
            </div>
          </div>
        </section>

        {entries.length === 0 ? (
          <section className="mt-5 rounded-[28px] border border-dashed border-border-subtle bg-surface-card p-8 text-center shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Clock3 className="h-6 w-6" strokeWidth={2.25} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-ink-primary">No saved screenings yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-secondary">
              Complete a screening, then save the report to start your baseline.
            </p>
            <Link
              href="/capture"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-ink"
            >
              Start a screening
            </Link>
          </section>
        ) : (
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

            <div className="grid gap-4">
              {timelineRows.map(({ entry, trend, flagged, clear, tone }) => {
                const ToneIcon = SEVERITY_ICON[tone.severity];
                return (
                  <article
                    key={entry.id}
                    className="grid gap-4 rounded-[28px] border border-border-subtle bg-surface-card p-4 shadow-[0_18px_50px_rgba(42,54,71,0.08)] md:grid-cols-[120px_minmax(0,1fr)]"
                  >
                    <div className="aspect-square overflow-hidden rounded-2xl bg-surface-page">
                      {entry.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-muted">
                          <Camera className="h-7 w-7" strokeWidth={2.25} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-ink-primary">{formatDate(entry.createdAt)}</p>
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {flagged.length} flagged · {clear.length} clear
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <TrendBadge trend={trend} />
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_WASH_CLASS[tone.severity]} ${SEVERITY_TEXT_CLASS[tone.severity]}`}
                          >
                            <ToneIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
                            {tone.label}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-ink-secondary">{entry.result.overallSummary}</p>

                      {flagged.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {flagged.slice(0, 4).map(({ key, label, finding }) => (
                            <span
                              key={key}
                              className="rounded-full bg-surface-page px-2.5 py-1 text-xs font-medium text-ink-secondary"
                            >
                              {label}: {finding.locationLabel}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="mt-3 text-xs text-ink-muted">{trend.detail}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
