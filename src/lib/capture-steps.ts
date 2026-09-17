export type CaptureStepId =
  | "front-bite"
  | "upper-arch"
  | "lower-arch"
  | "left-buccal"
  | "right-buccal";

export interface CaptureStep {
  id: CaptureStepId;
  title: string;
  instruction: string;
}

export const CAPTURE_STEPS: CaptureStep[] = [
  {
    id: "front-bite",
    title: "Front bite",
    instruction: "Smile with your teeth together, facing the camera.",
  },
  {
    id: "upper-arch",
    title: "Upper arch",
    instruction: "Tilt your head back, open wide, and show your upper teeth.",
  },
  {
    id: "lower-arch",
    title: "Lower arch",
    instruction: "Tilt your head down, open wide, and show your lower teeth.",
  },
  {
    id: "left-buccal",
    title: "Left side",
    instruction: "Turn slightly and bite down to show the left side of your bite.",
  },
  {
    id: "right-buccal",
    title: "Right side",
    instruction: "Turn slightly and bite down to show the right side of your bite.",
  },
];
