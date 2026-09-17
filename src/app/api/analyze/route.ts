import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseInputContent } from "openai/resources/responses/responses";
import { AnalysisSchema, DIAGNOSTIC_DEFS } from "@/lib/analysis-schema";
import { CAPTURE_STEPS } from "@/lib/capture-steps";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are assisting a free, non-diagnostic oral health screening widget aimed at everyday consumers.
You will be shown 5 photos of a patient's teeth from different angles (front bite, upper arch, lower arch, left side, right side).
For each of the following diagnostics, assess what is visible across the photos and report a severity plus which quadrant it is most associated with (upper-left, upper-right, lower-left, lower-right), or "overall" if it isn't localized to one area:

${DIAGNOSTIC_DEFS.map((d) => `- ${d.key}: ${d.label} — ${d.prompt}`).join("\n")}

Use "none" severity when nothing notable is visible for that diagnostic. Be conservative: only use "notable" when something is clearly visible and would be worth a dentist's attention. Never state a definitive medical diagnosis — describe only what is visually observed, and frame findings as things to mention to a dentist rather than confirmed conditions.

Be terse. Every "summary" field is ONE short sentence, no more than ~18 words, stated plainly with no hedging filler ("may want to consider having a professional take a look at potentially..."). The overall summary is at most 2 sentences. This copy is read on a phone screen inside a small card — write for that, not for a report.`;

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

  const content: ResponseInputContent[] = [{ type: "input_text", text: SYSTEM_PROMPT }];
  CAPTURE_STEPS.forEach((step, i) => {
    content.push({
      type: "input_text",
      text: `Photo ${i + 1} of ${CAPTURE_STEPS.length} — ${step.title}: ${step.instruction}`,
    });
    content.push({ type: "input_image", image_url: photos[i] as string, detail: "auto" });
  });

  try {
    const client = new OpenAI();
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      input: [{ role: "user", content }],
      text: { format: zodTextFormat(AnalysisSchema, "oral_health_screening") },
    });

    if (!response.output_parsed) {
      return NextResponse.json({ error: "The model did not return a parsable result." }, { status: 502 });
    }

    return NextResponse.json(response.output_parsed);
  } catch (error) {
    console.error("toothpaste-cv analyze failed:", error);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 502 });
  }
}
