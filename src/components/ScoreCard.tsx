import type { AnalysisResult } from "@/lib/analysis-schema";
import { DIAGNOSTIC_DEFS } from "@/lib/analysis-schema";
import { REGION_LABEL, SEVERITY_BG_CLASS, SEVERITY_LABEL, SEVERITY_TEXT_CLASS } from "@/lib/severity";

export function ScoreCard({ findings }: { findings: AnalysisResult["findings"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {DIAGNOSTIC_DEFS.map((def) => {
        const finding = findings[def.key];
        return (
          <div
            key={def.key}
            className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{def.label}</h3>
              <span
                className={`flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-900 ${SEVERITY_TEXT_CLASS[finding.severity]}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${SEVERITY_BG_CLASS[finding.severity]}`} />
                {SEVERITY_LABEL[finding.severity]}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{finding.summary}</p>
            {finding.region !== "overall" && (
              <p className="mt-2 text-xs text-zinc-400">{REGION_LABEL[finding.region]}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
