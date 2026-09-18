"use client";

import { useId, useMemo } from "react";
import type { Severity } from "@/lib/analysis-schema";
import {
  changesSinceLast,
  flaggedCountSeries,
  issueSeveritySeries,
} from "@/lib/timeline-compare";
import { SEVERITY_HEX, SEVERITY_LABEL, SEVERITY_RANK } from "@/lib/severity";
import type { TimelineEntry } from "@/lib/timeline-storage";

const TREND_COLOR = "#1f7a3f";

function shortDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function FlaggedTrendChart({ entries }: { entries: TimelineEntry[] }) {
  const series = useMemo(() => flaggedCountSeries(entries), [entries]);
  const gradientId = useId();

  if (series.length === 0) return null;

  const width = 320;
  const height = 120;
  const padX = 16;
  const padY = 18;
  const maxCount = Math.max(9, ...series.map((point) => point.count));
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = series.map((point, index) => {
    const x =
      series.length === 1
        ? padX + innerW / 2
        : padX + (index / (series.length - 1)) * innerW;
    const y = padY + innerH - (point.count / maxCount) * innerH;
    return { ...point, x, y };
  });

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${padY + innerH} L ${points[0].x} ${padY + innerH} Z`
      : "";

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">Flagged over time</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-ink-primary">
            {series[series.length - 1]?.count ?? 0}
            <span className="ml-1.5 text-sm font-medium text-ink-muted">latest</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
          <span>{shortDate(series[0].at)}</span>
          <span aria-hidden>→</span>
          <span>{shortDate(series[series.length - 1].at)}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" role="img" aria-label="Flagged findings over time">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TREND_COLOR} stopOpacity="0.22" />
            <stop offset="100%" stopColor={TREND_COLOR} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => {
          const y = padY + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-border-subtle"
              strokeWidth="1"
            />
          );
        })}
        {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
        <path d={linePath} fill="none" stroke={TREND_COLOR} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.at}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="var(--surface-card)" stroke={TREND_COLOR} strokeWidth="2" />
            <text
              x={point.x}
              y={point.y - 10}
              textAnchor="middle"
              fill="var(--ink-secondary)"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {point.count}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ChangeSinceLastVisual({ entries }: { entries: TimelineEntry[] }) {
  const changes = useMemo(() => changesSinceLast(entries), [entries]);
  if (!changes) {
    return (
      <div className="flex h-full min-h-28 flex-col items-center justify-center rounded-2xl bg-surface-page px-4 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">Since last visit</p>
        <p className="mt-2 text-sm text-ink-secondary">Save another screening to unlock deltas</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Improved",
      value: changes.improved.length + changes.cleared.length,
      color: "var(--status-good)",
      text: "text-status-good-text",
    },
    {
      label: "New / worse",
      value: changes.newFlags.length + changes.worse.length,
      color: "var(--status-serious)",
      text: "text-status-serious-text",
    },
    {
      label: "Same",
      value: changes.unchanged,
      color: "var(--ink-muted)",
      text: "text-ink-muted",
    },
  ];

  const total = Math.max(1, stats.reduce((sum, item) => sum + item.value, 0));

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">Since last visit</p>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface-page">
        {stats.map((stat) =>
          stat.value > 0 ? (
            <div
              key={stat.label}
              style={{ width: `${(stat.value / total) * 100}%`, background: stat.color }}
              title={`${stat.label}: ${stat.value}`}
            />
          ) : null
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-surface-page px-2 py-3 text-center">
            <p className={`text-2xl font-semibold tabular-nums ${stat.text}`}>{stat.value}</p>
            <p className="mt-0.5 text-[11px] text-ink-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeveritySparkline({ severities }: { severities: Severity[] }) {
  const width = 120;
  const height = 28;
  const pad = 6;
  const maxRank = 3;

  const points = severities.map((severity, index) => {
    const x =
      severities.length === 1 ? width / 2 : pad + (index / (severities.length - 1)) * (width - pad * 2);
    const y = height - pad - (SEVERITY_RANK[severity] / maxRank) * (height - pad * 2);
    return { severity, x, y };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-28 shrink-0" aria-hidden>
      <path d={path} fill="none" stroke="rgba(30,37,36,0.18)" strokeWidth="1.5" strokeLinecap="round" />
      {points.map((point, index) => (
        <circle
          key={`${point.severity}-${index}`}
          cx={point.x}
          cy={point.y}
          r={index === points.length - 1 ? 3.5 : 2.5}
          fill={SEVERITY_HEX[point.severity]}
        />
      ))}
    </svg>
  );
}

function IssueSparklines({ entries }: { entries: TimelineEntry[] }) {
  const series = useMemo(() => issueSeveritySeries(entries), [entries]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted">Each check</p>
        <div className="flex items-center gap-2">
          {(["none", "mild", "moderate", "notable"] as Severity[]).map((severity) => (
            <span key={severity} className="inline-flex items-center gap-1 text-[10px] text-ink-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_HEX[severity] }} />
              {severity === "none" ? "Clear" : SEVERITY_LABEL[severity]}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-3 rounded-2xl bg-surface-page/80 px-3 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink-primary">{item.label}</p>
              <p className="mt-0.5 text-[10px] text-ink-muted">
                {item.latest === "none" ? "Clear" : SEVERITY_LABEL[item.latest]}
                {item.changed ? " · shifted" : ""}
              </p>
            </div>
            <SeveritySparkline severities={item.severities} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineComparisons({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="rounded-[28px] border border-border-subtle bg-surface-card p-4 shadow-[0_18px_50px_rgba(42,54,71,0.08)] sm:p-5">
      <div className="grid gap-6 lg:grid-cols-2">
        <FlaggedTrendChart entries={entries} />
        <ChangeSinceLastVisual entries={entries} />
      </div>
      <div className="mt-6 border-t border-border-subtle pt-5">
        <IssueSparklines entries={entries} />
      </div>
    </section>
  );
}
