import type { AnalysisResult } from "@/lib/analysis-schema";

const TIMELINE_STORAGE_KEY = "toothpaste-cv:timeline";
const MAX_TIMELINE_ENTRIES = 12;

export interface TimelineEntry {
  id: string;
  createdAt: string;
  result: AnalysisResult;
  thumbnail: string | null;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readTimeline(): TimelineEntry[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(TIMELINE_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is TimelineEntry => {
        return (
          typeof entry?.id === "string" &&
          typeof entry?.createdAt === "string" &&
          typeof entry?.result?.overallSummary === "string"
        );
      })
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch {
    return [];
  }
}

function writeTimeline(entries: TimelineEntry[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    TIMELINE_STORAGE_KEY,
    JSON.stringify(entries.slice(0, MAX_TIMELINE_ENTRIES))
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not create timeline thumbnail."));
    img.src = src;
  });
}

async function createThumbnail(photo: string | null): Promise<string | null> {
  if (!photo) return null;
  try {
    const img = await loadImage(photo);
    const size = 220;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const scale = Math.max(size / img.width, size / img.height);
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    ctx.drawImage(img, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight);
    return canvas.toDataURL("image/jpeg", 0.68);
  } catch {
    return null;
  }
}

export async function saveTimelineEntry(result: AnalysisResult, photos: string[]): Promise<TimelineEntry> {
  const entry: TimelineEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    result,
    thumbnail: await createThumbnail(photos[0] ?? null),
  };
  writeTimeline([entry, ...readTimeline()]);
  return entry;
}

export function clearTimeline() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(TIMELINE_STORAGE_KEY);
}
