import type { Region, Severity } from "@/lib/analysis-schema";

export const SEVERITY_RANK: Record<Severity, number> = {
  none: 0,
  mild: 1,
  moderate: 2,
  notable: 3,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  none: "No concern",
  mild: "Mild",
  moderate: "Moderate",
  notable: "Notable",
};

export const SEVERITY_BG_CLASS: Record<Severity, string> = {
  none: "bg-emerald-400",
  mild: "bg-yellow-300",
  moderate: "bg-orange-400",
  notable: "bg-red-500",
};

export const SEVERITY_TEXT_CLASS: Record<Severity, string> = {
  none: "text-emerald-700 dark:text-emerald-400",
  mild: "text-yellow-700 dark:text-yellow-400",
  moderate: "text-orange-700 dark:text-orange-400",
  notable: "text-red-700 dark:text-red-400",
};

export const REGION_LABEL: Record<Region, string> = {
  "upper-left": "Upper left",
  "upper-right": "Upper right",
  "lower-left": "Lower left",
  "lower-right": "Lower right",
  overall: "Overall",
};

export function maxSeverity(severities: Severity[]): Severity {
  return severities.reduce<Severity>(
    (worst, current) => (SEVERITY_RANK[current] > SEVERITY_RANK[worst] ? current : worst),
    "none"
  );
}
