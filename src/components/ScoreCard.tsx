import type { AnalysisResult } from "@/lib/analysis-schema";
import { DIAGNOSTIC_DEFS } from "@/lib/analysis-schema";
import {
  REGION_LABEL,
  SEVERITY_BORDER_CLASS,
  SEVERITY_ICON,
  SEVERITY_LABEL,
  SEVERITY_RANK,
  SEVERITY_TEXT_CLASS,
} from "@/lib/severity";

export function ScoreCard({ findings }: { findings: AnalysisResult["findings"] }) {
  const entries = DIAGNOSTIC_DEFS.map((def) => ({ def, finding: findings[def.key] }));
  const flagged = entries
    .filter(({ finding }) => finding.severity !== "none")
    .sort((a, b) => SEVERITY_RANK[b.finding.severity] - SEVERITY_RANK[a.finding.severity]);
  const clear = entries.filter(({ finding }) => finding.severity === "none");

  return (
    <div className="space-y-3">
      {flagged.map(({ def, finding }) => {
        const Icon = SEVERITY_ICON[finding.severity];
        return (
          <div
            key={def.key}
            className={`rounded-xl border-l-4 bg-surface-card p-4 ${SEVERITY_BORDER_CLASS[finding.severity]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${SEVERITY_TEXT_CLASS[finding.severity]}`} strokeWidth={2.25} />
                <h3 className="text-sm font-semibold text-ink-primary">{def.label}</h3>
              </div>
              <span className={`shrink-0 text-xs font-medium ${SEVERITY_TEXT_CLASS[finding.severity]}`}>
                {SEVERITY_LABEL[finding.severity]}
              </span>
            </div>
            <p className="mt-1.5 pl-6 text-sm leading-6 text-ink-secondary">{finding.summary}</p>
            {finding.region !== "overall" && (
              <p className="mt-1 pl-6 text-xs text-ink-muted">{REGION_LABEL[finding.region]}</p>
            )}
          </div>
        );
      })}

      {clear.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-border-subtle bg-surface-card px-4 py-3">
          <SEVERITY_ICON.none className="mt-0.5 h-4 w-4 shrink-0 text-status-good" strokeWidth={2.25} />
          <p className="text-sm leading-6 text-ink-secondary">
            <span className="font-medium text-ink-primary">No concerns: </span>
            {clear.map(({ def }) => def.label).join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
