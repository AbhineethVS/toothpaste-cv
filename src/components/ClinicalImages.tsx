"use client";

import { useState } from "react";
import { CAPTURE_STEPS, type CaptureStepId } from "@/lib/capture-steps";
import { findingsForPhoto, photoStats, type Findings } from "@/lib/report-metrics";
import { SEVERITY_BG_CLASS, SEVERITY_ICON, SEVERITY_TEXT_CLASS } from "@/lib/severity";

export function ClinicalImages({ findings, photos }: { findings: Findings; photos: string[] }) {
  const [selected, setSelected] = useState<CaptureStepId>(CAPTURE_STEPS[0].id);
  const stats = photoStats(findings);
  const selectedFindings = findingsForPhoto(findings, selected);

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {CAPTURE_STEPS.map((step, index) => {
          const stat = stats[step.id];
          const count = stat?.count ?? 0;
          const severity = stat?.severity ?? "none";
          const isSelected = selected === step.id;

          return (
            <button
              key={step.id}
              onClick={() => setSelected(step.id)}
              className="text-left"
              aria-pressed={isSelected}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[index]}
                alt={step.title}
                className={`aspect-square w-full rounded-lg object-cover ring-2 transition-colors ${
                  isSelected ? "ring-accent" : "ring-transparent"
                }`}
              />
              <p className="mt-1.5 truncate text-xs font-medium text-ink-primary">{step.title}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-secondary">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_BG_CLASS[severity]}`} />
                <span className="truncate">
                  {count} {count === 1 ? "finding" : "findings"}
                </span>
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-ink-primary/[0.04] p-3">
        {selectedFindings.length > 0 ? (
          <ul className="space-y-1.5">
            {selectedFindings.map(({ key, label, finding }) => {
              const Icon = SEVERITY_ICON[finding.severity];
              return (
                <li key={key} className="flex items-center gap-2 text-xs">
                  <Icon
                    className={`h-3.5 w-3.5 shrink-0 ${SEVERITY_TEXT_CLASS[finding.severity]}`}
                    strokeWidth={2.25}
                  />
                  <span className="font-medium text-ink-primary">{label}</span>
                  <span className="truncate text-ink-muted">{finding.locationLabel}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-ink-secondary">Nothing flagged in this photo.</p>
        )}
      </div>
    </div>
  );
}
