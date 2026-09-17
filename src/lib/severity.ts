import { AlertTriangle, CheckCircle2, OctagonAlert, TriangleAlert } from "lucide-react";
import type { Region, Severity } from "@/lib/analysis-schema";

export const SEVERITY_RANK: Record<Severity, number> = {
  none: 0,
  mild: 1,
  moderate: 2,
  notable: 3,
};

/** Legend order: least to most serious. */
export const SEVERITIES_DISPLAY: Severity[] = ["none", "mild", "moderate", "notable"];

export const SEVERITY_LABEL: Record<Severity, string> = {
  none: "No concern",
  mild: "Mild",
  moderate: "Moderate",
  notable: "Notable",
};

// Reserved status palette -- fixed hex, never themed. See dataviz skill palette.md.
export const SEVERITY_HEX: Record<Severity, string> = {
  none: "#0ca30c",
  mild: "#fab219",
  moderate: "#ec835a",
  notable: "#d03b3b",
};

/** Text uses the darker per-mode steps; marks below use the pure status hues. */
export const SEVERITY_TEXT_CLASS: Record<Severity, string> = {
  none: "text-status-good-text",
  mild: "text-status-warning-text",
  moderate: "text-status-serious-text",
  notable: "text-status-critical-text",
};

export const SEVERITY_BG_CLASS: Record<Severity, string> = {
  none: "bg-status-good",
  mild: "bg-status-warning",
  moderate: "bg-status-serious",
  notable: "bg-status-critical",
};

export const SEVERITY_WASH_CLASS: Record<Severity, string> = {
  none: "bg-status-good/10",
  mild: "bg-status-warning/10",
  moderate: "bg-status-serious/15",
  notable: "bg-status-critical/15",
};

export const SEVERITY_BORDER_CLASS: Record<Severity, string> = {
  none: "border-status-good",
  mild: "border-status-warning",
  moderate: "border-status-serious",
  notable: "border-status-critical",
};

export const SEVERITY_ICON: Record<Severity, typeof CheckCircle2> = {
  none: CheckCircle2,
  mild: AlertTriangle,
  moderate: TriangleAlert,
  notable: OctagonAlert,
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
