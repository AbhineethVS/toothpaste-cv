"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Info, MapPin } from "lucide-react";
import type { Finding } from "@/lib/analysis-schema";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import { SEVERITY_HEX, SEVERITY_LABEL, SEVERITY_RANK, SEVERITY_WASH_CLASS, SEVERITY_TEXT_CLASS } from "@/lib/severity";

const SEVERITY_METER_STEPS = 3;

export function FindingDetailPanel({
  label,
  finding,
  photos,
}: {
  label: string;
  finding: Finding;
  photos: string[];
}) {
  const sourceIndex = CAPTURE_STEPS.findIndex((step) => step.id === finding.photo);
  const [photoIndex, setPhotoIndex] = useState(Math.max(sourceIndex, 0));

  const step = CAPTURE_STEPS[photoIndex];
  const photoNumber = photoIndex + 1;
  const isSourcePhoto = photoIndex === sourceIndex;

  function goTo(delta: number) {
    setPhotoIndex((current) => (current + delta + CAPTURE_STEPS.length) % CAPTURE_STEPS.length);
  }

  return (
    <div className="rounded-[24px] border border-border-subtle bg-surface-card p-4 shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-primary">{label}</h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${SEVERITY_WASH_CLASS[finding.severity]} ${SEVERITY_TEXT_CLASS[finding.severity]}`}
        >
          {SEVERITY_LABEL[finding.severity]}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" strokeWidth={2.25} />
          {finding.locationLabel}
        </span>
        <span>
          Source: {step.title} (Photo {photoNumber})
        </span>
      </div>

      <div
        className="relative mt-3 overflow-hidden rounded-2xl"
        style={{ boxShadow: `inset 0 0 0 2px ${isSourcePhoto ? SEVERITY_HEX[finding.severity] : "transparent"}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[photoIndex]}
          alt={`${step.title} photo`}
          className="aspect-[4/3] w-full object-cover"
        />
        {isSourcePhoto && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: `inset 0 0 40px 6px ${SEVERITY_HEX[finding.severity]}55`,
            }}
          />
        )}
        <button
          onClick={() => goTo(-1)}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => goTo(1)}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
      {isSourcePhoto && (
        <p className="mt-1.5 text-center text-[11px] text-ink-muted">
          This photo shows the flagged region — the highlight is a general indicator, not an exact
          point.
        </p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface-page p-3">
          <p className="text-xs font-medium text-ink-muted">What was observed?</p>
          <p className="mt-1 text-sm text-ink-primary">{finding.summary}</p>
        </div>
        <div className="rounded-2xl bg-surface-page p-3">
          <p className="text-xs font-medium text-ink-muted">Severity</p>
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: SEVERITY_METER_STEPS }, (_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{
                  backgroundColor:
                    i < SEVERITY_RANK[finding.severity] ? SEVERITY_HEX[finding.severity] : "var(--border-subtle)",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-accent/20 bg-accent/8 px-3 py-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.25} />
        <p className="text-xs leading-5 text-ink-secondary">
          This is a preliminary screening result, not a diagnosis. Please consult a licensed dentist
          for a professional evaluation.
        </p>
      </div>
    </div>
  );
}
