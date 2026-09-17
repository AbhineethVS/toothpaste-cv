import type { AnalysisResult, Region } from "@/lib/analysis-schema";
import {
  maxSeverity,
  SEVERITY_BORDER_CLASS,
  SEVERITY_ICON,
  SEVERITY_LABEL,
  SEVERITY_TEXT_CLASS,
  SEVERITY_WASH_CLASS,
} from "@/lib/severity";

const QUADRANTS: { region: Region; label: string }[] = [
  { region: "upper-left", label: "Upper left" },
  { region: "upper-right", label: "Upper right" },
  { region: "lower-left", label: "Lower left" },
  { region: "lower-right", label: "Lower right" },
];

export function QuadrantGrid({ findings }: { findings: AnalysisResult["findings"] }) {
  const values = Object.values(findings);

  function severityFor(region: Region) {
    return maxSeverity(values.filter((finding) => finding.region === region).map((finding) => finding.severity));
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {QUADRANTS.map(({ region, label }) => {
        const severity = severityFor(region);
        const Icon = SEVERITY_ICON[severity];
        return (
          <div
            key={region}
            className={`rounded-xl border-l-4 p-4 ${SEVERITY_BORDER_CLASS[severity]} ${SEVERITY_WASH_CLASS[severity]}`}
          >
            <p className="text-sm font-medium text-ink-primary">{label}</p>
            <div className={`mt-2 flex items-center gap-1.5 text-sm font-medium ${SEVERITY_TEXT_CLASS[severity]}`}>
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
              {SEVERITY_LABEL[severity]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
