import type { ArchRegion, Severity } from "@/lib/analysis-schema";
import { quadrantStats, urgency, type Findings } from "@/lib/report-metrics";
import {
  SEVERITY_HEX,
  SEVERITY_ICON,
  SEVERITY_LABEL,
  SEVERITY_TEXT_CLASS,
  SEVERITY_WASH_CLASS,
} from "@/lib/severity";
import { archPath } from "@/lib/tooth-map";

const MINI_WIDTH = 112;
const MINI_HEIGHT = 98;
const MINI_CX = MINI_WIDTH / 2;
const UPPER_CY = 34;
const LOWER_CY = 66;
const RX = 32;
const RY = 24;
const MIDLINE_GAP = 5;

/** Each quadrant is half of one arch, with a small gap at the midline. */
function quadrantPath(region: ArchRegion): string {
  const lower = region.startsWith("lower");
  // Viewer-left is the patient's right, so patient-right spans 180deg..90deg.
  const isPatientRight = region.endsWith("right");

  return archPath({
    cx: MINI_CX,
    cy: lower ? LOWER_CY : UPPER_CY,
    rx: RX,
    ry: RY,
    lower,
    startDeg: isPatientRight ? 180 : 90 - MIDLINE_GAP,
    endDeg: isPatientRight ? 90 + MIDLINE_GAP : 0,
    samples: 24,
  });
}

function MiniArch({ severities }: { severities: Record<ArchRegion, Severity> }) {
  return (
    <svg
      width={MINI_WIDTH}
      height={MINI_HEIGHT}
      viewBox={`0 0 ${MINI_WIDTH} ${MINI_HEIGHT}`}
      aria-hidden
      className="shrink-0"
    >
      {(Object.keys(severities) as ArchRegion[]).map((region) => (
        <path
          key={region}
          d={quadrantPath(region)}
          fill="none"
          stroke={SEVERITY_HEX[severities[region]]}
          strokeWidth={9}
          strokeLinecap="round"
          opacity={severities[region] === "none" ? 0.7 : 1}
        />
      ))}
      <text x={8} y={MINI_HEIGHT / 2 + 4} textAnchor="middle" className="fill-ink-muted text-[10px] font-semibold">
        R
      </text>
      <text
        x={MINI_WIDTH - 8}
        y={MINI_HEIGHT / 2 + 4}
        textAnchor="middle"
        className="fill-ink-muted text-[10px] font-semibold"
      >
        L
      </text>
    </svg>
  );
}

export function QuadrantSummary({ findings }: { findings: Findings }) {
  const stats = quadrantStats(findings);
  const severities = Object.fromEntries(
    stats.map((stat) => [stat.region, stat.severity])
  ) as Record<ArchRegion, Severity>;

  const cardFor = (region: ArchRegion) => {
    const stat = stats.find((item) => item.region === region)!;
    const Icon = SEVERITY_ICON[stat.severity];
    return (
      <div className="rounded-xl border border-border-subtle bg-surface-page/70 p-2.5">
        <p className="text-xs font-medium text-ink-primary">{stat.label}</p>
        <p
          className={`mt-1 flex items-center gap-1 text-xs font-medium leading-4 ${SEVERITY_TEXT_CLASS[stat.severity]}`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          {SEVERITY_LABEL[stat.severity]}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-muted">
          {stat.count} {stat.count === 1 ? "finding" : "findings"}
        </p>
      </div>
    );
  };

  const tone = urgency(findings);
  const ToneIcon = SEVERITY_ICON[tone.severity];

  return (
    <div className="w-full">
      <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_112px_minmax(0,1fr)]">
        <div className="grid flex-1 gap-2">
          {cardFor("upper-right")}
          {cardFor("lower-right")}
        </div>
        <div className="flex justify-center">
          <MiniArch severities={severities} />
        </div>
        <div className="grid flex-1 gap-2">
          {cardFor("upper-left")}
          {cardFor("lower-left")}
        </div>
      </div>

      <div
        className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 ${SEVERITY_WASH_CLASS[tone.severity]}`}
      >
        <ToneIcon
          className={`h-4 w-4 shrink-0 ${SEVERITY_TEXT_CLASS[tone.severity]}`}
          strokeWidth={2.25}
        />
        <p className="text-xs text-ink-secondary">
          <span className={`font-medium ${SEVERITY_TEXT_CLASS[tone.severity]}`}>{tone.label}</span>
          {" — "}
          {tone.detail}
        </p>
      </div>
    </div>
  );
}
