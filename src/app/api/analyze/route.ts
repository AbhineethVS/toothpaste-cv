import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ResponseInputContent } from "openai/resources/responses/responses";
import {
  AnalysisSchema,
  DIAGNOSTIC_DEFS,
  SEVERITIES,
  type AnalysisResult,
  type Finding,
  type FindingKey,
  type Severity,
} from "@/lib/analysis-schema";
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

const CLAUDE_JSON_PROMPT = `${SYSTEM_PROMPT}

Return ONLY valid JSON matching this exact shape:
{
  "overallSummary": "string",
  "findings": {
    "crowding": { "severity": "none|mild|moderate|notable", "region": "upper-left|upper-right|lower-left|lower-right|overall", "zone": "front|middle|back|all", "locationLabel": "string", "photo": "front-bite|upper-arch|lower-arch|left-buccal|right-buccal", "summary": "string" },
    "wear": { "severity": "none|mild|moderate|notable", "region": "upper-left|upper-right|lower-left|lower-right|overall", "zone": "front|middle|back|all", "locationLabel": "string", "photo": "front-bite|upper-arch|lower-arch|left-buccal|right-buccal", "summary": "string" },
    "discoloration": { "severity": "none|mild|moderate|notable", "region": "upper-left|upper-right|lower-left|lower-right|overall", "zone": "front|middle|back|all", "locationLabel": "string", "photo": "front-bite|upper-arch|lower-arch|left-buccal|right-buccal", "summary": "string" },
    "gumHealth": { "severity": "none|mild|moderate|notable", "region": "upper-left|upper-right|lower-left|lower-right|overall", "zone": "front|middle|back|all", "locationLabel": "string", "photo": "front-bite|upper-arch|lower-arch|left-buccal|right-buccal", "summary": "string" },
    "plaque": { "severity": "none|mild|moderate|notable", "region": "upper-left|upper-right|lower-left|lower-right|overall", "zone": "front|middle|back|all", "locationLabel": "string", "photo": "front-bite|upper-arch|lower-arch|left-buccal|right-buccal", "summary": "string" },
    "biteAlignment": { "severity": "none|mild|moderate|notable", "region": "upper-left|upper-right|lower-left|lower-right|overall", "zone": "front|middle|back|all", "locationLabel": "string", "photo": "front-bite|upper-arch|lower-arch|left-buccal|right-buccal", "summary": "string" },
    "spacing": { "severity": "none|mild|moderate|notable", "region": "upper-left|upper-right|lower-left|lower-right|overall", "zone": "front|middle|back|all", "locationLabel": "string", "photo": "front-bite|upper-arch|lower-arch|left-buccal|right-buccal", "summary": "string" },
    "chipsOrFractures": { "severity": "none|mild|moderate|notable", "region": "upper-left|upper-right|lower-left|lower-right|overall", "zone": "front|middle|back|all", "locationLabel": "string", "photo": "front-bite|upper-arch|lower-arch|left-buccal|right-buccal", "summary": "string" },
    "possibleDecay": { "severity": "none|mild|moderate|notable", "region": "upper-left|upper-right|lower-left|lower-right|overall", "zone": "front|middle|back|all", "locationLabel": "string", "photo": "front-bite|upper-arch|lower-arch|left-buccal|right-buccal", "summary": "string" }
  }
}`;

const SEVERITY_RANK: Record<Severity, number> = Object.fromEntries(
  SEVERITIES.map((severity, index) => [severity, index])
) as Record<Severity, number>;

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data URL.");
  }

  return { mediaType: match[1], data: match[2] };
}

function parseClaudeJson(text: string) {
  const trimmed = text.trim();
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return JSON.parse(fencedJson?.[1] ?? trimmed);
}

function downgradeSeverity(severity: Severity): Severity {
  const index = Math.max(0, SEVERITY_RANK[severity] - 1);
  return SEVERITIES[index];
}

function lowerSeverity(a: Severity, b: Severity): Severity {
  return SEVERITY_RANK[a] <= SEVERITY_RANK[b] ? a : b;
}

function mergeFinding(gptFinding: Finding, claudeFinding: Finding): Finding {
  const gptSeverity = gptFinding.severity;
  const claudeSeverity = claudeFinding.severity;
  const oneModelDetected = gptSeverity === "none" || claudeSeverity === "none";
  const severity = oneModelDetected
    ? downgradeSeverity(gptSeverity === "none" ? claudeSeverity : gptSeverity)
    : lowerSeverity(gptSeverity, claudeSeverity);
  const preferredFinding =
    SEVERITY_RANK[gptSeverity] <= SEVERITY_RANK[claudeSeverity] ? gptFinding : claudeFinding;

  if (severity === "none") {
    return {
      ...preferredFinding,
      severity,
      region: "overall",
      zone: "all",
      locationLabel: "No concern",
      summary: "No clear visible concern was confirmed.",
    };
  }

  const sameRegion = gptFinding.region === claudeFinding.region;
  const sameZone = gptFinding.zone === claudeFinding.zone;

  return {
    ...preferredFinding,
    severity,
    region: sameRegion ? gptFinding.region : preferredFinding.region,
    zone: sameZone ? gptFinding.zone : preferredFinding.zone,
    locationLabel: sameRegion && sameZone ? preferredFinding.locationLabel : "Visible area",
    summary: oneModelDetected
      ? `One review noted: ${preferredFinding.summary.replace(/\.$/, "")}.`
      : preferredFinding.summary,
  };
}

function buildMergedSummary(findings: AnalysisResult["findings"]) {
  const visibleFindings = DIAGNOSTIC_DEFS.map((def) => ({
    label: def.label,
    finding: findings[def.key],
  }))
    .filter(({ finding }) => finding.severity !== "none")
    .sort((a, b) => SEVERITY_RANK[b.finding.severity] - SEVERITY_RANK[a.finding.severity]);

  if (visibleFindings.length === 0) {
    return "No clear visible concerns were confirmed across the photos. Keep routine dental checkups for a complete exam.";
  }

  const topFindings = visibleFindings
    .slice(0, 2)
    .map(({ label }) => label.toLowerCase())
    .join(" and ");

  return `${topFindings} stood out in the visual screening. Use this as a non-diagnostic summary to discuss with a dentist.`;
}

function mergeAnalysisResults(gptResult: AnalysisResult, claudeResult: AnalysisResult): AnalysisResult {
  const findings = Object.fromEntries(
    DIAGNOSTIC_DEFS.map((def) => [
      def.key,
      mergeFinding(gptResult.findings[def.key], claudeResult.findings[def.key]),
    ])
  ) as AnalysisResult["findings"];

  return {
    overallSummary: buildMergedSummary(findings),
    findings,
  };
}

async function analyzeWithOpenAI(photos: string[]) {
  const content: ResponseInputContent[] = [{ type: "input_text", text: SYSTEM_PROMPT }];
  CAPTURE_STEPS.forEach((step, i) => {
    content.push({
      type: "input_text",
      text: `Photo ${i + 1} of ${CAPTURE_STEPS.length} — ${step.title}: ${step.instruction}`,
    });
    content.push({ type: "input_image", image_url: photos[i], detail: "auto" });
  });

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
    throw new Error("The OpenAI model did not return a parsable result.");
  }

  return response.output_parsed;
}

async function analyzeWithClaude(photos: string[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }

  const content = [
    { type: "text", text: CLAUDE_JSON_PROMPT },
    ...CAPTURE_STEPS.flatMap((step, i) => {
      const image = parseDataUrl(photos[i]);
      return [
        {
          type: "text",
          text: `Photo ${i + 1} of ${CAPTURE_STEPS.length} — ${step.title}: ${step.instruction}`,
        },
        {
          type: "image",
          source: {
            type: "base64",
            media_type: image.mediaType,
            data: image.data,
          },
        },
      ];
    }),
  ];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
      max_tokens: 2200,
      temperature: 0,
      messages: [{ role: "user", content }],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Claude analysis failed: ${response.status} ${message}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((item) => item.type === "text")?.text;
  if (!text) {
    throw new Error("Claude did not return text content.");
  }

  return AnalysisSchema.parse(parseClaudeJson(text));
}

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
    const typedPhotos = photos as string[];
    const [gptResult, claudeResult] = await Promise.allSettled([
      analyzeWithOpenAI(typedPhotos),
      analyzeWithClaude(typedPhotos),
    ]);

    if (gptResult.status === "rejected") {
      throw gptResult.reason;
    }

    if (claudeResult.status === "rejected") {
      console.warn("toothpaste-cv Claude second review skipped:", claudeResult.reason);
    }

    const result =
      claudeResult.status === "fulfilled" && claudeResult.value
        ? mergeAnalysisResults(gptResult.value, claudeResult.value)
        : gptResult.value;

    return NextResponse.json(result);
  } catch (error) {
    console.error("toothpaste-cv analyze failed:", error);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 502 });
  }
}
