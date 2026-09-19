"use client";

import type { CvBox } from "@/lib/cv-schema";

export function PhotoCvOverlay({
  photo,
  heatmap,
  boxes,
}: {
  photo: string;
  heatmap: string | null;
  boxes: CvBox[];
}) {
  return (
    <div className="relative overflow-hidden rounded-xl bg-ink-primary/[0.04]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="Selected screening photo" className="block h-auto w-full" />
      {heatmap ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heatmap}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      ) : null}
      {boxes.length > 0 ? (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
        >
          {boxes.map((box, index) => (
            <rect
              key={`${box.x}-${box.y}-${index}`}
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              fill="rgba(250, 178, 25, 0.18)"
              stroke="#fab219"
              strokeWidth={0.008}
            />
          ))}
        </svg>
      ) : null}
    </div>
  );
}
