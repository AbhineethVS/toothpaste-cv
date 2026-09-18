import type { AnalysisResult } from "@/lib/analysis-schema";
import { CAPTURE_STEPS } from "@/lib/capture-steps";

const TIMELINE_STORAGE_KEY = "toothpaste-cv:timeline";
const MAX_TIMELINE_ENTRIES = 12;
const ARCHIVE_MAX_DIMENSION = 960;
const ARCHIVE_JPEG_QUALITY = 0.58;

export interface TimelineEntry {
  id: string;
  createdAt: string;
  result: AnalysisResult;
  thumbnail: string | null;
  /** Full photo set needed to reopen the report UI. Older saves may omit this. */
  photos?: string[];
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

export function getTimelineEntry(id: string): TimelineEntry | null {
  return readTimeline().find((entry) => entry.id === id) ?? null;
}

export function timelineEntryHasFullReport(entry: TimelineEntry) {
  return (
    Array.isArray(entry.photos) &&
    entry.photos.length === CAPTURE_STEPS.length &&
    entry.photos.every((photo) => typeof photo === "string" && photo.startsWith("data:image/"))
  );
}

function writeTimeline(entries: TimelineEntry[]) {
  if (!canUseStorage()) return;

  let next = entries.slice(0, MAX_TIMELINE_ENTRIES);
  while (next.length > 0) {
    try {
      window.localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(next));
      return;
    } catch {
      // Drop the oldest entry (end of newest-first list) and retry.
      next = next.slice(0, -1);
    }
  }

  throw new Error("Not enough browser storage to save this report.");
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

/** Shrink capture photos so multiple full reports can fit in localStorage. */
async function compressPhotoForArchive(dataUrl: string): Promise<string> {
  try {
    const img = await loadImage(dataUrl);
    const scale = Math.min(1, ARCHIVE_MAX_DIMENSION / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", ARCHIVE_JPEG_QUALITY);
  } catch {
    return dataUrl;
  }
}

export async function saveTimelineEntry(result: AnalysisResult, photos: string[]): Promise<TimelineEntry> {
  if (photos.length !== CAPTURE_STEPS.length || !photos.every(Boolean)) {
    throw new Error("A full photo set is required to save the report.");
  }

  const archivedPhotos = await Promise.all(photos.map((photo) => compressPhotoForArchive(photo)));
  const entry: TimelineEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    result,
    thumbnail: await createThumbnail(archivedPhotos[0] ?? null),
    photos: archivedPhotos,
  };
  writeTimeline([entry, ...readTimeline()]);
  return entry;
}

export function clearTimeline() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(TIMELINE_STORAGE_KEY);
}
