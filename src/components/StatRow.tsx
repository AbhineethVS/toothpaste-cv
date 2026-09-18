import { Camera, ShieldCheck } from "lucide-react";
import type { Severity } from "@/lib/analysis-schema";
import { DIAGNOSTIC_DEFS } from "@/lib/analysis-schema";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import {
  clearEntries,
  flaggedEntries,
  quadrantStats,
  severityCounts,
  urgency,
  type Findings,
} from "@/lib/report-metrics";
import {
  SEVERITY_HEX,
  SEVERITY_ICON,
  SEVERITY_TEXT_CLASS,
  SEVERITY_WASH_CLASS,
} from "@/lib/severity";
import { ToothIcon } from "@/components/ToothIcon";

const RING_SIZE = 72;
const RING_STROKE = 8;

function Ring({ segments, total }: { segments: { value: number; color: string }[]; total: number }) {
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = RING_SIZE / 2;

  const visible = segments.filter((segment) => segment.value > 0);
  const arcs = visible
    .map((segment, index) => {
      const preceding = visible
        .slice(0, index)
        .reduce((sum, earlier) => sum + earlier.value, 0);
      return {
        color: segment.color,
        offset: (preceding / Math.max(total, 1)) * circumference,
        // 2px gap between adjacent fills so segments stay distinguishable.
        drawn: Math.max((segment.value / Math.max(total, 1)) * circumference - 2, 1),
      };
    })
    .map((arc, index) => (
      <circle
        key={index}
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={arc.color}
        strokeWidth={RING_STROKE}
        strokeLinecap="round"
        strokeDasharray={`${arc.drawn} ${circumference - arc.drawn}`}
        strokeDashoffset={-arc.offset}
        transform={`rotate(-90 ${center} ${center})`}
      />
    ));

  return (
    <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} aria-hidden>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="var(--border-subtle)"
        strokeWidth={RING_STROKE}
      />
      {arcs}
    </svg>
  );
}

function StatCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-[24px] border border-border-subtle bg-surface-card p-4 shadow-[0_14px_36px_rgba(42,54,71,0.07)]">
      {children}
    </div>
  );
}

function IconBadge({ severity, children }: { severity: Severity; children: React.ReactNode }) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${SEVERITY_WASH_CLASS[severity]} ${SEVERITY_TEXT_CLASS[severity]}`}
    >
      {children}
    </div>
  );
}

export function StatRow({ findings }: { findings: Findings }) {
  const counts = severityCounts(findings);
  const flagged = flaggedEntries(findings).length;
  const clear = clearEntries(findings).length;
  const quadrants = quadrantStats(findings);
  const affectedQuadrants = quadrants.filter((quadrant) => quadrant.count > 0).length;
  const tone = urgency(findings);
  const ToneIcon = SEVERITY_ICON[tone.severity];

  const breakdown = [
    { label: "notable", value: counts.notable, severity: "notable" as const },
    { label: "moderate", value: counts.moderate, severity: "moderate" as const },
    { label: "mild", value: counts.mild, severity: "mild" as const },
  ].filter((item) => item.value > 0);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard>
        <div className="relative shrink-0">
          <Ring
            total={DIAGNOSTIC_DEFS.length}
            segments={[
              { value: counts.notable, color: SEVERITY_HEX.notable },
              { value: counts.moderate, color: SEVERITY_HEX.moderate },
              { value: counts.mild, color: SEVERITY_HEX.mild },
            ]}
          />
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums text-ink-primary">
            {flagged}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-primary">Findings detected</p>
          <p className="mt-0.5 text-xs text-ink-secondary">
            {breakdown.length > 0
              ? breakdown.map((item, i) => (
                  <span key={item.label} className="whitespace-nowrap">
                    {i > 0 && <span className="text-ink-muted"> · </span>}
                    <span className={SEVERITY_TEXT_CLASS[item.severity]}>
                      {item.value} {item.label}
                    </span>
                  </span>
                ))
              : "Nothing flagged"}
          </p>
          <span
            className={`mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ${SEVERITY_WASH_CLASS[tone.severity]} ${SEVERITY_TEXT_CLASS[tone.severity]}`}
          >
            <ToneIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
            {tone.label}
          </span>
        </div>
      </StatCard>

      <StatCard>
        <IconBadge severity={affectedQuadrants > 0 ? "moderate" : "none"}>
          <ToothIcon className="h-6 w-6" />
        </IconBadge>
        <div>
          <p className="text-xl font-semibold tabular-nums text-ink-primary">
            {affectedQuadrants} <span className="text-ink-muted">/ {quadrants.length}</span>
          </p>
          <p className="mt-0.5 text-sm text-ink-secondary">Quadrants with concerns</p>
        </div>
      </StatCard>

      <StatCard>
        <IconBadge severity="none">
          <ShieldCheck className="h-6 w-6" strokeWidth={2} />
        </IconBadge>
        <div>
          <p className="text-xl font-semibold tabular-nums text-ink-primary">
            {clear} <span className="text-ink-muted">/ {DIAGNOSTIC_DEFS.length}</span>
          </p>
          <p className="mt-0.5 text-sm text-ink-secondary">Areas all clear</p>
        </div>
      </StatCard>

      <StatCard>
        <IconBadge severity="none">
          <Camera className="h-6 w-6" strokeWidth={2} />
        </IconBadge>
        <div>
          <p className="text-xl font-semibold tabular-nums text-ink-primary">
            {CAPTURE_STEPS.length}
          </p>
          <p className="mt-0.5 text-sm text-ink-secondary">Photos reviewed</p>
        </div>
      </StatCard>
    </div>
  );
}
