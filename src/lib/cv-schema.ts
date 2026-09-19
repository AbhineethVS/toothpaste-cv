import type { CaptureStepId } from "@/lib/capture-steps";
import type { Severity } from "@/lib/analysis-schema";

export const CV_FINDING_KEYS = ["crowding", "discoloration", "wear"] as const;
export type CvFindingKey = (typeof CV_FINDING_KEYS)[number];

export interface CvBox {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  cls: string;
}

export interface CvFindingScore {
  severity: Severity;
  confidence: number;
  source: string;
  summary: string;
}

export interface CvPhotoResult {
  photo: CaptureStepId | string;
  boxes: CvBox[];
  heatmap: string | null;
  crowding: CvFindingScore;
  discoloration: CvFindingScore;
  wear: CvFindingScore;
}

export interface CvAnalysis {
  available: boolean;
  models: {
    crowding: boolean;
    stain: boolean;
    wear: boolean;
  };
  photos: CvPhotoResult[];
}

export function cvForPhoto(cv: CvAnalysis | null, photo: string): CvPhotoResult | null {
  if (!cv?.available) return null;
  return cv.photos.find((item) => item.photo === photo) ?? null;
}
