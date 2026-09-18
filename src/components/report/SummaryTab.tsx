"use client";

import { useState } from "react";
import type { AnalysisResult, FindingKey } from "@/lib/analysis-schema";
import { flaggedEntries } from "@/lib/report-metrics";
import { DentalMap } from "@/components/DentalMap";
import { FindingsList } from "@/components/report/FindingsList";
import { FindingDetailPanel } from "@/components/report/FindingDetailPanel";

export function SummaryTab({ result, photos }: { result: AnalysisResult; photos: string[] }) {
  const flagged = flaggedEntries(result.findings);
  const [selectedKey, setSelectedKey] = useState<FindingKey | null>(flagged[0]?.key ?? null);

  const selectedEntry = flagged.find((entry) => entry.key === selectedKey) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="rounded-2xl border border-border-subtle bg-surface-card p-5">
        <h2 className="text-lg font-semibold text-ink-primary">Dental map</h2>
        <p className="mt-0.5 text-xs text-ink-muted">
          {flagged.length > 0
            ? "Click on a highlighted region to view details"
            : "No areas were flagged in this screening"}
        </p>
        <div className="mt-4">
          <DentalMap
            findings={result.findings}
            selectedKey={selectedKey}
            onSelectFinding={setSelectedKey}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <FindingsList findings={result.findings} selectedKey={selectedKey} onSelect={setSelectedKey} />

        {selectedEntry && (
          <FindingDetailPanel
            key={selectedEntry.key}
            label={selectedEntry.label}
            finding={selectedEntry.finding}
            photos={photos}
          />
        )}
      </div>
    </div>
  );
}
