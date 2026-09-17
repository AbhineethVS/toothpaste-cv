import type { Severity } from "@/lib/analysis-schema";
import { toothSeverities, type Findings } from "@/lib/report-metrics";
import { SEVERITY_HEX, SEVERITY_LABEL, SEVERITIES_DISPLAY } from "@/lib/severity";
import {
  ARCH_LABEL_POSITIONS,
  GUM_PATHS,
  LOWER_TEETH,
  MAP_HEIGHT,
  MAP_WIDTH,
  SIDE_MARKERS,
  UPPER_TEETH,
  type ToothPosition,
} from "@/lib/tooth-map";

const TINT_OPACITY: Record<Severity, number> = {
  none: 0,
  mild: 0.55,
  moderate: 0.65,
  notable: 0.75,
};

function Tooth({ tooth, severity }: { tooth: ToothPosition; severity: Severity }) {
  const transform = `translate(${tooth.x} ${tooth.y}) rotate(${tooth.rotation})`;
  const x = -tooth.width / 2;
  const y = -tooth.height / 2;
  const radius = Math.min(tooth.width, tooth.height) * 0.34;
  const affected = severity !== "none";

  return (
    <g transform={transform}>
      <rect
        x={x}
        y={y}
        width={tooth.width}
        height={tooth.height}
        rx={radius}
        fill="var(--tooth-base)"
        stroke="var(--tooth-edge)"
        strokeWidth={1}
      />
      {affected && (
        <rect
          x={x}
          y={y}
          width={tooth.width}
          height={tooth.height}
          rx={radius}
          fill={SEVERITY_HEX[severity]}
          fillOpacity={TINT_OPACITY[severity]}
          stroke={SEVERITY_HEX[severity]}
          strokeWidth={1.75}
        />
      )}
      <title>
        {tooth.label} — {SEVERITY_LABEL[severity]}
      </title>
    </g>
  );
}

export function DentalMap({ findings }: { findings: Findings }) {
  const groupSeverities = toothSeverities(findings);
  const severityFor = (tooth: ToothPosition): Severity =>
    groupSeverities.get(`${tooth.region}:${tooth.zone}`) ?? "none";

  const teeth = [...UPPER_TEETH, ...LOWER_TEETH];
  const highlighted = teeth.filter((tooth) => severityFor(tooth) !== "none");

  return (
    <div>
      <svg
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Diagram of the upper and lower dental arches with affected areas highlighted"
      >
        <defs>
          <filter id="tooth-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <path
          d={GUM_PATHS.upper}
          fill="none"
          stroke="var(--gum)"
          strokeWidth={30}
          strokeLinecap="round"
        />
        <path
          d={GUM_PATHS.lower}
          fill="none"
          stroke="var(--gum)"
          strokeWidth={30}
          strokeLinecap="round"
        />

        <g filter="url(#tooth-glow)" opacity={0.55}>
          {highlighted.map((tooth) => (
            <ellipse
              key={`glow-${tooth.id}`}
              cx={tooth.x}
              cy={tooth.y}
              rx={tooth.width * 0.8}
              ry={tooth.height * 0.8}
              fill={SEVERITY_HEX[severityFor(tooth)]}
            />
          ))}
        </g>

        {teeth.map((tooth) => (
          <Tooth key={tooth.id} tooth={tooth} severity={severityFor(tooth)} />
        ))}

        <text
          x={ARCH_LABEL_POSITIONS.upper.x}
          y={ARCH_LABEL_POSITIONS.upper.y}
          textAnchor="middle"
          className="fill-ink-muted text-[11px] font-medium"
        >
          Upper arch
        </text>
        <text
          x={ARCH_LABEL_POSITIONS.lower.x}
          y={ARCH_LABEL_POSITIONS.lower.y}
          textAnchor="middle"
          className="fill-ink-muted text-[11px] font-medium"
        >
          Lower arch
        </text>
        <text
          x={SIDE_MARKERS.right.x}
          y={SIDE_MARKERS.right.y}
          textAnchor="start"
          className="fill-ink-muted text-[12px] font-semibold"
        >
          R
        </text>
        <text
          x={SIDE_MARKERS.left.x}
          y={SIDE_MARKERS.left.y}
          textAnchor="end"
          className="fill-ink-muted text-[12px] font-semibold"
        >
          L
        </text>
      </svg>

      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {SEVERITIES_DISPLAY.map((severity) => (
          <span key={severity} className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: SEVERITY_HEX[severity] }}
            />
            {SEVERITY_LABEL[severity]}
          </span>
        ))}
      </div>
      <p className="mt-3 text-center text-xs leading-5 text-ink-muted">
        {highlighted.length === 0
          ? "Nothing was localised to a specific area of the mouth."
          : "Highlighted areas are approximate — this screening locates concerns by region, not by individual tooth."}
      </p>
    </div>
  );
}
