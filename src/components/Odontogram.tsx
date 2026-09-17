import type { AnalysisResult, Region } from "@/lib/analysis-schema";
import { maxSeverity, SEVERITY_BG_CLASS, SEVERITY_LABEL } from "@/lib/severity";

const QUADRANTS: { region: Region; label: string }[] = [
  { region: "upper-left", label: "Upper left" },
  { region: "upper-right", label: "Upper right" },
  { region: "lower-left", label: "Lower left" },
  { region: "lower-right", label: "Lower right" },
];

export function Odontogram({ findings }: { findings: AnalysisResult["findings"] }) {
  const values = Object.values(findings);

  function severityFor(region: Region) {
    return maxSeverity(
      values.filter((finding) => finding.region === region).map((finding) => finding.severity)
    );
  }

  const upperLeft = severityFor("upper-left");
  const upperRight = severityFor("upper-right");
  const lowerLeft = severityFor("lower-left");
  const lowerRight = severityFor("lower-right");

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-[220px]">
        <div className="flex h-20 overflow-hidden rounded-t-full border border-zinc-300 dark:border-zinc-700">
          <div className={`w-1/2 border-r border-zinc-300 dark:border-zinc-700 ${SEVERITY_BG_CLASS[upperLeft]}`} />
          <div className={`w-1/2 ${SEVERITY_BG_CLASS[upperRight]}`} />
        </div>
        <div className="mt-2 flex h-20 overflow-hidden rounded-b-full border border-zinc-300 dark:border-zinc-700">
          <div className={`w-1/2 border-r border-zinc-300 dark:border-zinc-700 ${SEVERITY_BG_CLASS[lowerLeft]}`} />
          <div className={`w-1/2 ${SEVERITY_BG_CLASS[lowerRight]}`} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        {QUADRANTS.map(({ region, label }) => (
          <span key={region}>{label}</span>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {(Object.keys(SEVERITY_LABEL) as (keyof typeof SEVERITY_LABEL)[]).map((severity) => (
          <span key={severity} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className={`h-2.5 w-2.5 rounded-full ${SEVERITY_BG_CLASS[severity]}`} />
            {SEVERITY_LABEL[severity]}
          </span>
        ))}
      </div>
    </div>
  );
}
