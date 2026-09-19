import type { AnalysisResult } from "@/lib/analysis-schema";
import type { CvAnalysis } from "@/lib/cv-schema";
import { CAPTURE_STEPS } from "@/lib/capture-steps";
import { StatRow } from "@/components/StatRow";
import { DentalMap } from "@/components/DentalMap";
import { KeyFindings } from "@/components/KeyFindings";
import { ClinicalImages } from "@/components/ClinicalImages";
import { QuadrantSummary } from "@/components/QuadrantSummary";

function Panel({
  title,
  subtitle,
  children,
  centered = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <section className="flex h-full flex-col rounded-[24px] border border-border-subtle bg-surface-card p-5 shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
      <h2 className="text-sm font-semibold text-ink-primary">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      <div className={`mt-4 ${centered ? "flex flex-1 items-center" : ""}`}>{children}</div>
    </section>
  );
}

/**
 * The full, printable report -- combines every section in one scroll. This is
 * also the PDF export target, so it stays independent of which tab the user
 * is actively viewing.
 */
export function ReportTab({
  result,
  photos,
  cv,
}: {
  result: AnalysisResult;
  photos: string[];
  cv?: CvAnalysis | null;
}) {
  return (
    <div>
      <div className="rounded-[24px] border border-border-subtle bg-surface-card p-5 shadow-[0_18px_50px_rgba(42,54,71,0.08)]">
        <p className="max-w-3xl text-sm leading-6 text-ink-secondary">{result.overallSummary}</p>
      </div>

      <div className="mt-5">
        <StatRow findings={result.findings} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Panel title="Dental map" subtitle="Flagged regions">
          <DentalMap findings={result.findings} />
        </Panel>

        <Panel title="Key findings" subtitle="Most serious first — tap a row for detail">
          <KeyFindings findings={result.findings} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <Panel title="Clinical images" subtitle={`${CAPTURE_STEPS.length} photos reviewed`}>
          <ClinicalImages findings={result.findings} photos={photos} cv={cv} />
        </Panel>

        <Panel title="Quadrant summary" centered>
          <div className="w-full">
            <QuadrantSummary findings={result.findings} />
          </div>
        </Panel>
      </div>

      <p className="mt-8 text-center text-xs leading-5 text-ink-muted">
        This is a preliminary visual screening only, not a medical diagnosis. Please consult a
        licensed dentist for advice about your oral health.
      </p>
    </div>
  );
}
