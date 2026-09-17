import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseInputContent } from "openai/resources/responses/responses";
import { AnalysisSchema, DIAGNOSTIC_DEFS, type FindingKey } from "@/lib/analysis-schema";
import { CAPTURE_STEPS } from "@/lib/capture-steps";

export const runtime = "nodejs";

/**
 * Concrete anchors for each severity step, per category. Without these the model has to
 * improvise where "mild" ends and "moderate" begins, which is the main source of the
 * same-photo-different-report inconsistency -- borderline calls swing randomly run to run.
 */
const SEVERITY_RUBRICS: Record<FindingKey, { mild: string; moderate: string; notable: string }> = {
  crowding: {
    mild: "Slight overlap or rotation on one or two teeth; arch otherwise reads as aligned.",
    moderate: "Noticeable overlapping or rotation across several teeth, or visible arch crowding.",
    notable: "Severe overlap -- teeth significantly rotated or displaced across multiple teeth.",
  },
  wear: {
    mild: "Slight flattening of biting edges; enamel surface still intact.",
    moderate: "Visible flattening across multiple teeth, with some enamel thinning.",
    notable: "Significant wear with dentin exposure or sharply flattened edges.",
  },
  discoloration: {
    mild: "Slight yellowing or light staining confined to a small area.",
    moderate: "Noticeable staining or discoloration visible across several teeth.",
    notable: "Heavy, widespread staining or strongly uneven dark discoloration.",
  },
  gumHealth: {
    mild: "Slight redness or minor puffiness in one small area.",
    moderate: "Visible redness or swelling across multiple areas, or mild recession.",
    notable: "Significant swelling, heavy redness, or clear recession/bleeding signs.",
  },
  plaque: {
    mild: "Light film visible near the gumline in a small area.",
    moderate: "Visible buildup along several teeth.",
    notable: "Heavy, hardened tartar visibly covering multiple teeth.",
  },
  biteAlignment: {
    mild: "Slight misalignment between the upper and lower arches.",
    moderate: "A clear overbite, underbite, or crossbite is visible.",
    notable: "Severe misalignment that clearly affects how the bite closes.",
  },
  spacing: {
    mild: "A small gap between one or two teeth.",
    moderate: "Noticeable gaps between several teeth.",
    notable: "Large gaps, or teeth that appear to be missing, across multiple areas.",
  },
  chipsOrFractures: {
    mild: "A tiny chip or minor edge irregularity on one tooth.",
    moderate: "A visible chip or crack affecting tooth shape, on one or more teeth.",
    notable: "A significant fracture or clear structural damage.",
  },
  possibleDecay: {
    mild: "A small, isolated dark spot or pit.",
    moderate: "Multiple dark spots, or one larger visibly pitted area.",
    notable: "Clear dark lesions or holes visible across multiple teeth.",
  },
};

const SYSTEM_PROMPT = `You are assisting a free, non-diagnostic oral health screening widget aimed at everyday consumers.
You will be shown 5 photos of a patient's teeth from different angles (front bite, upper arch, lower arch, left side, right side).

Assess each of the following diagnostics across all the photos. Use the severity anchors given for each one -- they define exactly what separates "mild" from "moderate" from "notable", so apply them consistently rather than improvising. If a case sits right on the boundary between two severities, choose the lower one.

${DIAGNOSTIC_DEFS.map((d) => {
  const r = SEVERITY_RUBRICS[d.key];
  return `- ${d.key}: ${d.label} — ${d.prompt}
  mild: ${r.mild}
  moderate: ${r.moderate}
  notable: ${r.notable}`;
}).join("\n\n")}

For every diagnostic report:
- severity: "none" when nothing at or above the "mild" anchor is visible. Be conservative — only use "notable" when something clearly meets that anchor's description.
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
    const model = process.env.OPENAI_MODEL || "gpt-5.5";
    const requestParams = {
      model,
      input: [{ role: "user" as const, content }],
      text: { format: zodTextFormat(AnalysisSchema, "oral_health_screening") },
    };

    let response;
    try {
      response = await client.responses.parse({ ...requestParams, temperature: 0 });
    } catch (error) {
      // Some reasoning models reject a non-default temperature outright -- retry without it.
      if (error instanceof OpenAI.BadRequestError && /temperature/i.test(error.message)) {
        response = await client.responses.parse(requestParams);
      } else {
        throw error;
      }
    }

    if (!response.output_parsed) {
      return NextResponse.json({ error: "The model did not return a parsable result." }, { status: 502 });
    }

    return NextResponse.json(response.output_parsed);
  } catch (error) {
    console.error("toothpaste-cv analyze failed:", error);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 502 });
  }
}
