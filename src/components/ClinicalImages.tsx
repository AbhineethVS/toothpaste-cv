"use client";

import { useState } from "react";
import { CAPTURE_STEPS, type CaptureStepId } from "@/lib/capture-steps";
import { findingsForPhoto, photoStats, type Findings } from "@/lib/report-metrics";
import { SEVERITY_BG_CLASS, SEVERITY_ICON, SEVERITY_LABEL, SEVERITY_TEXT_CLASS } from "@/lib/severity";
import { PhotoCvOverlay } from "@/components/report/PhotoCvOverlay";
import { cvForPhoto, type CvAnalysis, type CvFindingKey } from "@/lib/cv-schema";

const CV_ROWS: { key: CvFindingKey; label: string }[] = [
  { key: "crowding", label: "Crowding" },
  { key: "discoloration", label: "Discoloration" },
  { key: "wear", label: "Tooth wear" },
];

export function ClinicalImages({
  findings,
  photos,
  cv,
}: {
  findings: Findings;
  photos: string[];
  cv?: CvAnalysis | null;
}) {
  const [selected, setSelected] = useState<CaptureStepId>(CAPTURE_STEPS[0].id);
  const stats = photoStats(findings);
  const selectedFindings = findingsForPhoto(findings, selected);
  const selectedIndex = CAPTURE_STEPS.findIndex((step) => step.id === selected);
  const selectedCv = cvForPhoto(cv ?? null, selected);

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

      <div className="mt-4">
        {selectedCv ? (
          <PhotoCvOverlay
            photo={photos[selectedIndex]}
            heatmap={selectedCv.heatmap}
            boxes={selectedCv.boxes}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[selectedIndex]}
            alt={CAPTURE_STEPS[selectedIndex]?.title ?? "Selected photo"}
            className="w-full rounded-xl object-cover"
          />
        )}
      </div>

      {selectedCv ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-border-subtle">
          <div className="grid grid-cols-3 bg-ink-primary/[0.04] px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            <span>Finding</span>
            <span>CV model</span>
            <span>Report</span>
          </div>
          {CV_ROWS.map(({ key, label }) => {
            const cvScore = selectedCv[key];
            const llm = findings[key];
            return (
              <div
                key={key}
                className="grid grid-cols-3 items-start gap-2 border-t border-border-subtle px-3 py-2.5 text-xs"
              >
                <span className="font-medium text-ink-primary">{label}</span>
                <span>
                  <span className={SEVERITY_TEXT_CLASS[cvScore.severity]}>
                    {SEVERITY_LABEL[cvScore.severity]}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-ink-muted">
                    {cvScore.summary}
                  </span>
                </span>
                <span className={SEVERITY_TEXT_CLASS[llm.severity]}>{SEVERITY_LABEL[llm.severity]}</span>
              </div>
            );
          })}
        </div>
      ) : null}

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
