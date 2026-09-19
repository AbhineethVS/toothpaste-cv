import { NextRequest, NextResponse } from "next/server";
import { CAPTURE_STEPS } from "@/lib/capture-steps";

export const runtime = "nodejs";

const SIDECAR_URL = process.env.CV_SIDECAR_URL || "http://127.0.0.1:8765";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const photos = (body as { photos?: unknown } | null)?.photos;
  if (
    !Array.isArray(photos) ||
    photos.length !== CAPTURE_STEPS.length ||
    !photos.every((photo) => typeof photo === "string" && photo.startsWith("data:image/"))
  ) {
    return NextResponse.json(
      { error: `Expected exactly ${CAPTURE_STEPS.length} photos as data URLs.` },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${SIDECAR_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos }),
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(`CV sidecar ${response.status}: ${message}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.warn("toothpaste-cv CV sidecar unavailable:", error);
    return NextResponse.json({
      available: false,
      models: { crowding: false, stain: false, wear: false },
      photos: [],
    });
  }
}
