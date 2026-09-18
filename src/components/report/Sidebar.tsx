import { Check, ShieldCheck } from "lucide-react";
import { CAPTURE_STEPS } from "@/lib/capture-steps";

export function Sidebar({ analysisSeconds }: { analysisSeconds: number | null }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border-subtle px-5 py-6 lg:flex">
      <ol className="flex flex-1 flex-col gap-0">
        {CAPTURE_STEPS.map((step, index) => (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-status-good/15 text-status-good-text">
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </span>
              {index < CAPTURE_STEPS.length - 1 && (
                <span className="my-1 w-px flex-1 bg-border-subtle" />
              )}
            </div>
            <div className="pb-6">
              <p className="text-sm font-medium text-ink-primary">{step.title}</p>
              <p className="text-xs text-ink-muted">Uploaded</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex items-start gap-2.5 rounded-xl border border-border-subtle bg-surface-card p-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-good-text" strokeWidth={2.25} />
        <div>
          <p className="text-xs font-medium text-ink-primary">
            {CAPTURE_STEPS.length} photos analyzed
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            {analysisSeconds !== null
              ? `Completed in ${analysisSeconds}s`
              : "Analysis complete"}
          </p>
        </div>
      </div>
    </aside>
  );
}

/** Horizontal, scrollable equivalent of the sidebar step list for small screens. */
export function MobileStepStrip() {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 lg:hidden">
      {CAPTURE_STEPS.map((step) => (
        <div
          key={step.id}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-3 py-1.5"
        >
          <Check className="h-3.5 w-3.5 text-status-good-text" strokeWidth={2.5} />
          <span className="whitespace-nowrap text-xs font-medium text-ink-primary">{step.title}</span>
        </div>
      ))}
    </div>
  );
}
