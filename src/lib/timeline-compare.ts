import { DIAGNOSTIC_DEFS, type FindingKey, type Severity } from "@/lib/analysis-schema";
import { flaggedEntries } from "@/lib/report-metrics";
import { SEVERITY_RANK } from "@/lib/severity";
import type { TimelineEntry } from "@/lib/timeline-storage";

export type ChangeKind = "improved" | "worse" | "new" | "cleared" | "unchanged";

export interface IssueChange {
  key: FindingKey;
  label: string;
  kind: ChangeKind;
  from: Severity;
  to: Severity;
}

export interface IssueSeries {
  key: FindingKey;
  label: string;
  severities: Severity[]; // oldest → newest
  latest: Severity;
  changed: boolean;
}

/** Oldest → newest for charts. */
export function chronological(entries: TimelineEntry[]): TimelineEntry[] {
  return [...entries].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

export function flaggedCountSeries(entries: TimelineEntry[]): { at: string; count: number }[] {
  return chronological(entries).map((entry) => ({
    at: entry.createdAt,
    count: flaggedEntries(entry.result.findings).length,
  }));
}

export function issueSeveritySeries(entries: TimelineEntry[]): IssueSeries[] {
  const ordered = chronological(entries);
  return DIAGNOSTIC_DEFS.map((def) => {
    const severities = ordered.map((entry) => entry.result.findings[def.key].severity);
    const latest = severities[severities.length - 1] ?? "none";
    const changed = severities.some((severity) => severity !== severities[0]);
    return {
      key: def.key,
      label: def.label,
      severities,
      latest,
      changed,
    };
  }).sort((a, b) => {
    // Changed + currently flagged first, then by latest severity.
    const score = (item: IssueSeries) =>
      (item.changed ? 100 : 0) + SEVERITY_RANK[item.latest] * 10 + (item.latest !== "none" ? 1 : 0);
    return score(b) - score(a);
  });
}

export function changesSinceLast(entries: TimelineEntry[]): {
  improved: IssueChange[];
  worse: IssueChange[];
  newFlags: IssueChange[];
  cleared: IssueChange[];
  unchanged: number;
} | null {
  if (entries.length < 2) return null;

  // entries are newest-first from readTimeline
  const current = entries[0];
  const previous = entries[1];
  const improved: IssueChange[] = [];
  const worse: IssueChange[] = [];
  const newFlags: IssueChange[] = [];
  const cleared: IssueChange[] = [];
  let unchanged = 0;

  for (const def of DIAGNOSTIC_DEFS) {
    const from = previous.result.findings[def.key].severity;
    const to = current.result.findings[def.key].severity;
    const base = { key: def.key, label: def.label, from, to };

    if (from === to) {
      unchanged += 1;
      continue;
    }
    if (from === "none" && to !== "none") {
      newFlags.push({ ...base, kind: "new" });
      continue;
    }
    if (from !== "none" && to === "none") {
      cleared.push({ ...base, kind: "cleared" });
      continue;
    }
    if (SEVERITY_RANK[to] < SEVERITY_RANK[from]) {
      improved.push({ ...base, kind: "improved" });
    } else {
      worse.push({ ...base, kind: "worse" });
    }
  }

  return { improved, worse, newFlags, cleared, unchanged };
}
