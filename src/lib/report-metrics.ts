import type {
  AnalysisResult,
  ArchRegion,
  Finding,
  FindingKey,
  Severity,
} from "@/lib/analysis-schema";
import { ARCH_REGIONS, DIAGNOSTIC_DEFS } from "@/lib/analysis-schema";
import type { CaptureStepId } from "@/lib/capture-steps";
import { maxSeverity, SEVERITY_RANK } from "@/lib/severity";

export type Findings = AnalysisResult["findings"];

export interface FindingEntry {
  key: FindingKey;
  label: string;
  finding: Finding;
}

export function toEntries(findings: Findings): FindingEntry[] {
  return DIAGNOSTIC_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    finding: findings[def.key],
  }));
}

/** Everything worth showing, worst first. */
export function flaggedEntries(findings: Findings): FindingEntry[] {
  return toEntries(findings)
    .filter(({ finding }) => finding.severity !== "none")
    .sort((a, b) => SEVERITY_RANK[b.finding.severity] - SEVERITY_RANK[a.finding.severity]);
}

export function clearEntries(findings: Findings): FindingEntry[] {
  return toEntries(findings).filter(({ finding }) => finding.severity === "none");
}

export function severityCounts(findings: Findings): Record<Severity, number> {
  const counts: Record<Severity, number> = { none: 0, mild: 0, moderate: 0, notable: 0 };
  for (const finding of Object.values(findings)) counts[finding.severity] += 1;
  return counts;
}

export interface QuadrantStat {
  region: ArchRegion;
  label: string;
  severity: Severity;
  count: number;
}

const REGION_TITLES: Record<ArchRegion, string> = {
  "upper-left": "Upper left",
  "upper-right": "Upper right",
  "lower-left": "Lower left",
  "lower-right": "Lower right",
};

export function quadrantStats(findings: Findings): QuadrantStat[] {
  return ARCH_REGIONS.map((region) => {
    const inRegion = Object.values(findings).filter(
      (finding) => finding.region === region && finding.severity !== "none"
    );
    return {
      region,
      label: REGION_TITLES[region],
      severity: maxSeverity(inRegion.map((finding) => finding.severity)),
      count: inRegion.length,
    };
  });
}

export interface PhotoStat {
  count: number;
  severity: Severity;
}

export function photoStats(findings: Findings): Record<CaptureStepId, PhotoStat> {
  const stats = {} as Record<CaptureStepId, PhotoStat>;
  for (const entry of flaggedEntries(findings)) {
    const current = stats[entry.finding.photo] ?? { count: 0, severity: "none" as Severity };
    stats[entry.finding.photo] = {
      count: current.count + 1,
      severity: maxSeverity([current.severity, entry.finding.severity]),
    };
  }
  return stats;
}

export function findingsForPhoto(findings: Findings, photo: CaptureStepId): FindingEntry[] {
  return flaggedEntries(findings).filter((entry) => entry.finding.photo === photo);
}

/**
 * Which teeth on the diagram a finding covers. "overall" findings aren't
 * plotted -- painting every tooth would drown out the localized ones.
 */
export function toothSeverities(findings: Findings): Map<string, Severity> {
  const byTooth = new Map<string, Severity>();

  for (const finding of Object.values(findings)) {
    if (finding.severity === "none" || finding.region === "overall") continue;

    const zones = finding.zone === "all" ? ["front", "middle", "back"] : [finding.zone];
    for (const zone of zones) {
      const groupKey = `${finding.region}:${zone}`;
      const existing = byTooth.get(groupKey) ?? "none";
      byTooth.set(groupKey, maxSeverity([existing, finding.severity]));
    }
  }

  return byTooth;
}

export interface Urgency {
  label: string;
  detail: string;
  severity: Severity;
}

export function urgency(findings: Findings): Urgency {
  const counts = severityCounts(findings);
  if (counts.notable > 0) {
    return {
      label: "Review recommended",
      detail: "Worth booking a dental visit",
      severity: "notable",
    };
  }
  if (counts.moderate > 0) {
    return {
      label: "Worth monitoring",
      detail: "Mention these at your next visit",
      severity: "moderate",
    };
  }
  if (counts.mild > 0) {
    return { label: "Minor findings", detail: "Nothing pressing here", severity: "mild" };
  }
  return { label: "All clear", detail: "No visible concerns found", severity: "none" };
}
