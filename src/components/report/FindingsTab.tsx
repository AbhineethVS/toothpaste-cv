import type { AnalysisResult } from "@/lib/analysis-schema";
import { KeyFindings } from "@/components/KeyFindings";

export function FindingsTab({ result }: { result: AnalysisResult }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
      <h2 className="text-sm font-semibold text-ink-primary">All findings</h2>
      <p className="mt-0.5 text-xs text-ink-muted">Every check performed across your 5 photos</p>
      <div className="mt-4">
        <KeyFindings findings={result.findings} />
      </div>
    </div>
  );
}
