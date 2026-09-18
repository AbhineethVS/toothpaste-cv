"use client";

import { ChevronRight } from "lucide-react";
import type { FindingKey } from "@/lib/analysis-schema";
import { flaggedEntries, type Findings } from "@/lib/report-metrics";
import { SEVERITY_BG_CLASS, SEVERITY_LABEL, SEVERITY_TEXT_CLASS, SEVERITY_WASH_CLASS } from "@/lib/severity";

export function FindingsList({
  findings,
  selectedKey,
  onSelect,
}: {
  findings: Findings;
  selectedKey: FindingKey | null;
  onSelect: (key: FindingKey) => void;
}) {
  const flagged = flaggedEntries(findings);

  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-card p-4">
      <h2 className="text-sm font-semibold text-ink-primary">Key findings ({flagged.length})</h2>

      {flagged.length === 0 ? (
        <p className="mt-4 text-sm text-ink-secondary">Nothing was flagged across all nine checks.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {flagged.map(({ key, label, finding }) => {
            const isSelected = key === selectedKey;
            return (
              <button
                key={key}
                onClick={() => onSelect(key)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? "border-accent bg-accent/10"
                    : "border-transparent hover:bg-ink-primary/[0.05]"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${SEVERITY_BG_CLASS[finding.severity]}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-primary">{label}</span>
                  <span className="block truncate text-xs text-ink-muted">{finding.locationLabel}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_WASH_CLASS[finding.severity]} ${SEVERITY_TEXT_CLASS[finding.severity]}`}
                >
                  {SEVERITY_LABEL[finding.severity]}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={2} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
