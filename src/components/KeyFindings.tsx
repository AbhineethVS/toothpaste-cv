"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import { clearEntries, flaggedEntries, type Findings } from "@/lib/report-metrics";
import {
  SEVERITY_ICON,
  SEVERITY_LABEL,
  SEVERITY_TEXT_CLASS,
  SEVERITY_WASH_CLASS,
} from "@/lib/severity";

function photoTitle(photoId: string) {
  return CAPTURE_STEPS.find((step) => step.id === photoId)?.title ?? photoId;
}

export function KeyFindings({ findings }: { findings: Findings }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const flagged = flaggedEntries(findings);
  const clear = clearEntries(findings);

  return (
    <div className="flex flex-col">
      <div className="divide-y divide-border-subtle">
        {flagged.map(({ key, label, finding }) => {
          const isOpen = expanded === key;
          const Icon = SEVERITY_ICON[finding.severity];
          return (
            <div key={key}>
              <button
                onClick={() => setExpanded(isOpen ? null : key)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-ink-primary/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${SEVERITY_TEXT_CLASS[finding.severity]}`}
                      strokeWidth={2.25}
                    />
                    <h3 className="truncate text-sm font-semibold text-ink-primary">{label}</h3>
                  </div>
                  <p className="mt-1 pl-6 text-xs leading-5 text-ink-secondary">{finding.summary}</p>
                </div>

                <span className="hidden shrink-0 rounded-md bg-ink-primary/[0.06] px-2 py-1 text-xs font-medium text-ink-secondary sm:inline">
                  {finding.locationLabel}
                </span>
                <span
                  className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ${SEVERITY_WASH_CLASS[finding.severity]} ${SEVERITY_TEXT_CLASS[finding.severity]}`}
                >
                  {SEVERITY_LABEL[finding.severity]}
                </span>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-90" : ""}`}
                  strokeWidth={2}
                />
              </button>

              {isOpen && (
                <dl className="grid grid-cols-2 gap-3 pb-3 pl-6 text-xs">
                  <div>
                    <dt className="text-ink-muted">Location</dt>
                    <dd className="mt-0.5 font-medium text-ink-primary">{finding.locationLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Clearest in</dt>
                    <dd className="mt-0.5 font-medium text-ink-primary">
                      {photoTitle(finding.photo)}
                    </dd>
                  </div>
                </dl>
              )}
            </div>
          );
        })}
      </div>

      {clear.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-status-good/10 px-3 py-2.5">
          <SEVERITY_ICON.none
            className={`mt-0.5 h-4 w-4 shrink-0 ${SEVERITY_TEXT_CLASS.none}`}
            strokeWidth={2.25}
          />
          <p className="text-xs leading-5 text-ink-secondary">
            <span className="font-medium text-ink-primary">No concerns: </span>
            {clear.map(({ label }) => label).join(", ")}
          </p>
        </div>
      )}

      {flagged.length === 0 && (
        <p className="py-6 text-center text-sm text-ink-secondary">
          Nothing was flagged across all nine checks.
        </p>
      )}
    </div>
  );
}
