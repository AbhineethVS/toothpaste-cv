import type { AnalysisResult } from "@/lib/analysis-schema";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import { ClinicalImages } from "@/components/ClinicalImages";

export function PhotosTab({ result, photos }: { result: AnalysisResult; photos: string[] }) {
  return (
    <div className="rounded-[24px] border border-border-subtle bg-surface-card p-5 shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
      <h2 className="text-sm font-semibold text-ink-primary">Photos</h2>
      <p className="mt-0.5 text-xs text-ink-muted">
        AI analysed {CAPTURE_STEPS.length} images — select one to see what was flagged in it
      </p>
      <div className="mt-4">
        <ClinicalImages findings={result.findings} photos={photos} />
      </div>
    </div>
  );
}
