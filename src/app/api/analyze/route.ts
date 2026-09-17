import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseInputContent } from "openai/resources/responses/responses";
import { AnalysisSchema, DIAGNOSTIC_DEFS } from "@/lib/analysis-schema";
import { CAPTURE_STEPS } from "@/lib/capture-steps";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are assisting a free, non-diagnostic oral health screening widget aimed at everyday consumers.
You will be shown 5 photos of a patient's teeth from different angles (front bite, upper arch, lower arch, left side, right side).

Assess each of the following diagnostics across all the photos:

${DIAGNOSTIC_DEFS.map((d) => `- ${d.key}: ${d.label} — ${d.prompt}`).join("\n")}

For every diagnostic report:
- severity: "none" when nothing notable is visible. Be conservative — only use "notable" when something is clearly visible and would genuinely be worth a dentist's attention.
- region: the quadrant it is most associated with, using the PATIENT'S OWN left and right (their left side is the side that appears on the right of a photo taken facing them). Use "overall" only when it truly is not localized to one quadrant.
- zone: which group of teeth within that quadrant — "front" (incisors and canines), "middle" (premolars), "back" (molars), or "all" when it spans the whole quadrant.
- locationLabel: a 1-3 word label for display, e.g. "Gumline", "Upper front", "Back molars", "Multiple areas".
- photo: which of the 5 photos shows it most clearly.
- summary: what you actually see.

These results are plotted on a tooth diagram, so prefer a specific region + zone whenever the finding is visible in a particular area, rather than defaulting to "overall" and "all".

Never state a definitive medical diagnosis — describe only what is visually observed, and frame findings as things to mention to a dentist rather than confirmed conditions.

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
