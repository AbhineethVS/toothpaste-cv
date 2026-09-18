import type { ArchRegion, Zone } from "@/lib/analysis-schema";

export const MAP_WIDTH = 360;
export const MAP_HEIGHT = 360;

const CENTER_X = MAP_WIDTH / 2;
const UPPER_CY = 130;
const LOWER_CY = 230;
const RADIUS_X = 116;
const RADIUS_Y = 90;
const GUM_INSET = 13;

/**
 * Samples a point on the arch ellipse. `theta` runs 180deg (viewer-left) to
 * 0deg (viewer-right); the lower arch mirrors vertically.
 */
function archPoint(
  theta: number,
  options: { cx: number; cy: number; rx: number; ry: number; lower: boolean }
) {
  const radians = (theta * Math.PI) / 180;
  const offsetY = options.ry * Math.sin(radians);
  return {
    x: options.cx + options.rx * Math.cos(radians),
    y: options.lower ? options.cy + offsetY : options.cy - offsetY,
  };
}

/**
 * Builds an arch as a sampled polyline rather than an SVG `A` command --
 * arc sweep flags flip with every mirror and are easy to get subtly wrong.
 */
export function archPath(options: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  lower: boolean;
  startDeg: number;
  endDeg: number;
  samples?: number;
}): string {
  const samples = options.samples ?? 48;
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const theta = options.startDeg + ((options.endDeg - options.startDeg) * index) / samples;
    return archPoint(theta, options);
  });

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

interface ToothSpec {
  key: string;
  label: string;
  zone: Exclude<Zone, "all">;
  width: number;
  height: number;
  weight: number;
}

/** One quadrant's teeth, ordered from the midline outward. */
const QUADRANT_TEETH: ToothSpec[] = [
  { key: "central-incisor", label: "Central incisor", zone: "front", width: 16, height: 21, weight: 1 },
  { key: "lateral-incisor", label: "Lateral incisor", zone: "front", width: 13, height: 19, weight: 0.85 },
  { key: "canine", label: "Canine", zone: "front", width: 14, height: 23, weight: 0.95 },
  { key: "first-premolar", label: "1st premolar", zone: "middle", width: 15, height: 20, weight: 1 },
  { key: "second-premolar", label: "2nd premolar", zone: "middle", width: 16, height: 20, weight: 1.05 },
  { key: "first-molar", label: "1st molar", zone: "back", width: 20, height: 22, weight: 1.3 },
  { key: "second-molar", label: "2nd molar", zone: "back", width: 20, height: 21, weight: 1.3 },
  { key: "third-molar", label: "3rd molar", zone: "back", width: 18, height: 19, weight: 1.2 },
];

export interface ToothPosition {
  id: string;
  label: string;
  region: ArchRegion;
  zone: Exclude<Zone, "all">;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

/**
 * Lays one arch out along a half-ellipse. Teeth are spaced by width rather
 * than evenly by angle, so molars take the room they need.
 *
 * Viewer-left is the patient's right, matching how dental charts are drawn.
 */
function buildArch(arch: "upper" | "lower"): ToothPosition[] {
  const lower = arch === "lower";
  const viewerLeftRegion: ArchRegion = lower ? "lower-right" : "upper-right";
  const viewerRightRegion: ArchRegion = lower ? "lower-left" : "upper-left";

  const sequence = [
    ...[...QUADRANT_TEETH].reverse().map((spec) => ({ spec, region: viewerLeftRegion })),
    ...QUADRANT_TEETH.map((spec) => ({ spec, region: viewerRightRegion })),
  ];

  const totalWeight = sequence.reduce((sum, item) => sum + item.spec.weight, 0);
  const centerY = lower ? LOWER_CY : UPPER_CY;

  return sequence.map(({ spec, region }, index) => {
    const preceding = sequence
      .slice(0, index)
      .reduce((sum, item) => sum + item.spec.weight, 0);
    const theta = 180 * (1 - (preceding + spec.weight / 2) / totalWeight);
    const point = archPoint(theta, {
      cx: CENTER_X,
      cy: centerY,
      rx: RADIUS_X,
      ry: RADIUS_Y,
      lower,
    });

    return {
      id: `${region}-${spec.key}`,
      label: spec.label,
      region,
      zone: spec.zone,
      x: point.x,
      y: point.y,
      width: spec.width,
      height: spec.height,
      rotation: lower ? theta - 90 : 90 - theta,
    };
  });
}

export const UPPER_TEETH = buildArch("upper");
export const LOWER_TEETH = buildArch("lower");

/** The gum band each arch's teeth sit in, drawn just inside the tooth ring. */
export const GUM_PATHS = {
  upper: archPath({
    cx: CENTER_X,
    cy: UPPER_CY,
    rx: RADIUS_X - GUM_INSET,
    ry: RADIUS_Y - GUM_INSET,
    lower: false,
    startDeg: 180,
    endDeg: 0,
  }),
  lower: archPath({
    cx: CENTER_X,
    cy: LOWER_CY,
    rx: RADIUS_X - GUM_INSET,
    ry: RADIUS_Y - GUM_INSET,
    lower: true,
    startDeg: 180,
    endDeg: 0,
  }),
};

export const ARCH_LABEL_POSITIONS = {
  upper: { x: CENTER_X, y: UPPER_CY - 34 },
  lower: { x: CENTER_X, y: LOWER_CY + 42 },
};

const MID_Y = (UPPER_CY + LOWER_CY) / 2 + 4;
export const SIDE_MARKERS = {
  right: { x: 14, y: MID_Y },
  left: { x: MAP_WIDTH - 14, y: MID_Y },
};
