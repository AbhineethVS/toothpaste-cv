# Architecture

## Overview

toothpaste.cv is a Next.js web app with a guided capture flow, AI report generation, optional saved timeline, and optional local computer-vision overlays.

## User Flow

1. User opens the landing page.
2. User starts a screening and accepts the screening-only safety boundary.
3. User captures or uploads five guided photos.
4. The app sends the photos to the analysis API.
5. The report page shows summary, findings, photo evidence, and export options.
6. Signed-in users can save reports to a timeline.

## Main App Modules

| Area | Path | Purpose |
| --- | --- | --- |
| Landing page | `src/app/page.tsx` | Explains the product and starts the flow. |
| Capture flow | `src/app/capture/page.tsx` | Guides the five photo views. |
| Report UI | `src/app/report/page.tsx` | Shows summary, findings, photos, map, and export. |
| Analysis API | `src/app/api/analyze/route.ts` | Produces the structured screening report. |
| CV API proxy | `src/app/api/cv/route.ts` | Calls the optional local CV sidecar. |
| Report schema | `src/lib/analysis-schema.ts` | Defines findings, severity, and output shape. |
| Capture steps | `src/lib/capture-steps.ts` | Defines the five required photo views. |
| Timeline storage | `src/lib/timeline-storage.ts` | Stores saved reports for comparison. |

## Analysis Flow

The report pipeline uses a fixed oral-health rubric and structured schema validation.

- OpenAI is required for report generation.
- Anthropic Claude is optional for a second review.
- When both models are available, findings are merged conservatively.
- Zod validates the final response shape before the app uses it.

## Optional CV Sidecar

The local CV service lives in `ml/` and can add visual overlays to photos.

- YOLOv11n detects likely crooked or rotated teeth.
- CLIP-based classifiers estimate discoloration and wear.
- OpenCV generates stain heatmap overlays.
- FastAPI serves the sidecar on `127.0.0.1:8765`.

The sidecar is optional. If it is unavailable, the written report still works.

## Data Handling

- One-off screening does not require an account.
- Live photos stay in browser session storage for the report view.
- Photos are sent to configured AI providers to generate the report.
- Saved timeline entries are stored only when the user chooses to save.
- The free screening flow does not permanently store photo uploads on the app server.

## Deployment

The public demo is deployed on Vercel:

[https://toothpaste-cv.vercel.app/](https://toothpaste-cv.vercel.app/)
