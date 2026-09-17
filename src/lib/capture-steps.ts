export const CAPTURE_STEP_IDS = [
  "front-bite",
  "upper-arch",
  "lower-arch",
  "left-buccal",
  "right-buccal",
] as const;

export type CaptureStepId = (typeof CAPTURE_STEP_IDS)[number];

export interface CaptureStep {
  id: CaptureStepId;
  title: string;
  instruction: string;
  /** Reference photo shown as a small corner thumbnail, e.g. `/examples/<id>.jpg` under `public/`. */
  exampleImage?: string;
}

export const CAPTURE_STEPS: CaptureStep[] = [
  {
    id: "front-bite",
    title: "Front bite",
    instruction: "Smile with your teeth together, facing the camera.",
    exampleImage: "/examples/front-bite.jpg",
  },
  {
    id: "upper-arch",
    title: "Upper arch",
    instruction: "Tilt your head back, open wide, and show your upper teeth.",
    exampleImage: "/examples/upper-arch.jpg",
  },
  {
    id: "lower-arch",
    title: "Lower arch",
    instruction: "Tilt your head down, open wide, and show your lower teeth.",
    exampleImage: "/examples/lower-arch.jpg",
  },
  {
    id: "left-buccal",
    title: "Left side",
    instruction: "Turn slightly and bite down to show the left side of your bite.",
    exampleImage: "/examples/left-buccal.jpg",
  },
  {
    id: "right-buccal",
    title: "Right side",
    instruction: "Turn slightly and bite down to show the right side of your bite.",
    exampleImage: "/examples/right-buccal.jpg",
  },
];
