import { z } from "zod";
import { CAPTURE_STEP_IDS } from "@/lib/capture-steps";

export const SEVERITIES = ["none", "mild", "moderate", "notable"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const ARCH_REGIONS = [
  "upper-left",
  "upper-right",
  "lower-left",
  "lower-right",
] as const;
export type ArchRegion = (typeof ARCH_REGIONS)[number];

export const REGIONS = [...ARCH_REGIONS, "overall"] as const;
export type Region = (typeof REGIONS)[number];

export const ZONES = ["front", "middle", "back", "all"] as const;
export type Zone = (typeof ZONES)[number];

const FindingSchema = z.object({
  severity: z.enum(SEVERITIES),
  region: z
    .enum(REGIONS)
    .describe(
      "Which quadrant this is most associated with, using the PATIENT'S OWN left and right. Use 'overall' only when it genuinely is not localized to one quadrant."
    ),
  zone: z
    .enum(ZONES)
    .describe(
      "Which group of teeth within that quadrant: 'front' (incisors and canines), 'middle' (premolars), 'back' (molars), or 'all' if it spans the whole quadrant."
    ),
  locationLabel: z
    .string()
    .describe(
      "A 1-3 word location label for display, e.g. 'Gumline', 'Upper front', 'Back molars', 'Multiple areas'."
    ),
  photo: z
    .enum(CAPTURE_STEP_IDS)
    .describe("Which of the 5 photos shows this finding most clearly."),
  summary: z
    .string()
    .describe(
      "ONE short plain-language sentence (max ~18 words) a patient can understand, describing what was observed. No filler, no hedging phrases -- just the observation."
    ),
});
export type Finding = z.infer<typeof FindingSchema>;

export interface DiagnosticDef {
  key: keyof AnalysisResult["findings"];
  label: string;
  prompt: string;
}

export const DIAGNOSTIC_DEFS: DiagnosticDef[] = [
  {
    key: "crowding",
    label: "Crowding & alignment",
    prompt: "Crooked, rotated, or overlapping teeth.",
  },
  {
    key: "wear",
    label: "Tooth wear",
    prompt: "Flattened edges, chipping, or visible enamel wear consistent with grinding or erosion.",
  },
  {
    key: "discoloration",
    label: "Discoloration & staining",
    prompt: "Yellowing, staining, or noticeably uneven tooth color.",
  },
  {
    key: "gumHealth",
    label: "Gum health",
    prompt: "Redness, swelling, puffiness, or recession that could suggest gum inflammation.",
  },
  {
    key: "plaque",
    label: "Plaque & tartar buildup",
    prompt: "Visible film, chalky buildup, or hardened tartar, especially near the gumline.",
  },
  {
    key: "biteAlignment",
    label: "Bite alignment",
    prompt: "Overbite, underbite, crossbite, or other misalignment between upper and lower teeth.",
  },
  {
    key: "spacing",
    label: "Spacing & gaps",
    prompt: "Visible gaps between teeth, or teeth that appear to be missing.",
  },
  {
    key: "chipsOrFractures",
    label: "Chips & fractures",
    prompt: "Visible chips, cracks, or fractures in the tooth surface.",
  },
  {
    key: "possibleDecay",
    label: "Possible decay",
    prompt:
      "Dark spots, pitting, or holes that could suggest cavities. Never state a definitive diagnosis, only that it may be worth a dentist's look.",
  },
];

export const AnalysisSchema = z.object({
  overallSummary: z
    .string()
    .describe(
      "A short, friendly, plain-language summary of the overall screening in AT MOST 2 sentences, for a patient with no dental background. Lead with the most important thing to know."
    ),
  findings: z.object({
    crowding: FindingSchema,
    wear: FindingSchema,
    discoloration: FindingSchema,
    gumHealth: FindingSchema,
    plaque: FindingSchema,
    biteAlignment: FindingSchema,
    spacing: FindingSchema,
    chipsOrFractures: FindingSchema,
    possibleDecay: FindingSchema,
  }),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;
export type FindingKey = keyof AnalysisResult["findings"];
