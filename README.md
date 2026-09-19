# toothpaste.cv

A free, two-minute oral health screening widget for web and smartphones.

This is a visual screening tool only. It is not a medical diagnosis, not a treatment plan, and not a substitute for a licensed dentist.

---

## Complete description

### Problem title

Oral Health Screening Widget

### Problem statement

Develop a free, two-minute oral health screening widget for web or smartphones that guides patients through a simple set of prompts and captures five quick images of their teeth.

The solution should analyse these images and generate an instant visual report highlighting potential oral health concerns such as crooked teeth, tooth wear, or discoloration. The goal is to provide patients with an easy, accessible way to get an initial visual assessment of their oral health and understand whether they may need to consult a dentist.

### Why this problem exists

Most people notice a stain, a crooked tooth, or worn edges long before they book a dental visit. They do not have a simple way to check, in a couple of minutes, whether that change is worth a dentist's time.

Clinic exams, X-rays, and periodontal probing still matter. Those cannot be replaced by a phone photo. What is missing is a first step: guided photos, a plain-language report, and a clear next step.

### Aim

1. Let a person finish a screening in about two minutes, on a phone or laptop, without installing an app.
2. Capture five standard views of the teeth with on-screen prompts, so photos are consistent enough to review.
3. Return an instant visual report that flags crooked teeth, tooth wear, discoloration, and related surface concerns.
4. Help the person decide whether they should see a dentist, without claiming a clinical diagnosis.
5. Give them a report they can save, compare later, and take to a visit.

### Summary of the solution

toothpaste.cv is a web widget. The person starts a screening, agrees that this is not a diagnosis, then takes or uploads five photos:

1. Front bite
2. Upper arch
3. Lower arch
4. Left side of the bite
5. Right side of the bite

Those photos are reviewed against a fixed oral-health rubric. The product then shows a report with severity labels, photo evidence, a simple dental map, and next-step language.

A second, optional computer-vision layer draws boxes on likely crooked teeth and a stain heatmap on the photos. That overlay is for visual grounding. The written report still comes from the screening pipeline, not from the overlay models.

---

## What a user does

1. Open the site and tap Start Screening. No account is required for a one-off check.
2. Accept Terms and Privacy, and confirm they understand this is a visual screening only.
3. Follow five capture steps. Each step shows framing cues, a short instruction, and an example. Camera capture and photo upload both work.
4. Wait while the photos are analysed.
5. Read the report:
   - **Summary**: overall read and how urgent it looks
   - **Findings**: nine screening categories with severity, location, and a short note
   - **Photos**: the five images, with optional boxes and stain overlay
   - **Report**: the full printable view, including a dental map and PDF export
6. Optionally sign in to save the screening to a timeline and compare later checks.

Photos for a live screening stay in the browser session. They are sent to the analysis services to generate the report. The free flow does not keep a permanent photo archive on our servers.

---

## Objectives

1. Guide five intraoral photos with simple prompts, not a blank camera.
2. Analyse the set in one pass and return a structured report in seconds.
3. Call out crooked teeth, tooth wear, and discoloration clearly, because those are named in the problem.
4. Also screen other visible surface issues that a photo can reasonably show: gum redness, plaque, bite alignment, gaps, chips, and possible decay spots.
5. Use the same severity scale everywhere: none, mild, moderate, notable.
6. Tie each finding to a photo, a mouth region, and a short sentence a patient can understand.
7. Overlay local CV evidence on the photos for the three problem-statement findings, without replacing the written report.
8. Let people save and compare screenings over time after they sign in.
9. Keep the product boundary honest: triage and conversation starter, not diagnosis.

---

## What the report covers

Each finding gets a severity, a location on the mouth, the photo where it is most visible, and one plain sentence.

| Category | What we look for in the photos |
| --- | --- |
| Crowding and alignment | Crooked, rotated, or overlapping teeth |
| Tooth wear | Flattened edges, chipping, or visible enamel wear |
| Discoloration and staining | Yellowing, staining, or uneven tooth color |
| Gum health | Redness, swelling, puffiness, or recession that looks inflamed |
| Plaque and tartar | Visible film or hardened buildup, especially near the gumline |
| Bite alignment | Overbite, underbite, crossbite, or a bite that does not meet evenly |
| Spacing and gaps | Visible gaps, or teeth that appear to be missing |
| Chips and fractures | Visible chips, cracks, or broken edges |
| Possible decay | Dark spots, pitting, or holes that may be worth a dentist's look |

Severity meaning:

- **None**: nothing at or above a mild visual sign
- **Mild**: small, limited, still easy to miss
- **Moderate**: clear across several teeth or a larger area
- **Notable**: heavy, widespread, or structurally obvious in the photo

On a boundary between two levels, the pipeline prefers the lower one. That is intentional. Over-calling looks worse than being conservative on a screening widget.

---

## What this product does not do

toothpaste.cv can only see what a phone photo can see.

It cannot:

- find cavities between teeth or under the surface
- measure gum pocket depth
- assess roots, nerves, or bone
- read X-rays
- prescribe treatment, braces, fillings, or any clinical plan

If something is flagged, the right next step is a licensed dentist. If nothing is flagged, that is still not a clean bill of health.

---

## Status

Built and working in this repository:

1. Landing page that states the two-minute promise and the not-a-diagnosis boundary.
2. Guided five-photo capture on web, with camera or upload, on phone and desktop.
3. Instant visual report with summary, findings, photos, dental map, and PDF export.
4. Dual-model screening writeup: OpenAI writes a structured report, Claude reviews the same photos, and the two are merged conservatively.
5. Optional local CV sidecar for crooked-tooth boxes, a stain yellowness heatmap, and wear/stain scores on the Photos tab.
6. Optional sign-in (Supabase) to save a timeline of screenings on the device.
7. Terms of Use and Privacy Policy in-product, with consent before capture.

Still a screening demo, not a certified medical device.

---

## How analysis works

There are two layers. They run in parallel. They are not the same thing.

### 1. The written report (required)

`/api/analyze` sends the five photos to:

- **OpenAI** (default model from `OPENAI_MODEL`) with a fixed rubric and a structured JSON schema
- **Anthropic Claude** (default model from `ANTHROPIC_MODEL`) with the same rubric

If both succeed, findings are merged. If only one model saw an issue, the severity is stepped down. If both saw it, the lower severity wins. OpenAI is required. If Claude is missing or fails, the OpenAI report is still returned.

This layer writes the patient-facing report: summaries, locations, and the nine findings.

### 2. The photo overlay (optional)

`/api/cv` talks to a local Python service on `http://127.0.0.1:8765`. That service can:

- draw yellow boxes where a trained detector thinks a tooth looks crooked or rotated
- wash a heatmap over yellower tooth-like pixels
- score crowding, discoloration, and wear for a side-by-side table against the written report

If the Python service is off, the product still works. The report is unchanged. The Photos tab simply has no boxes or heatmap.

The overlay is evidence on the image. It does not rewrite the report.

---

## Local computer vision models

These are specialist models for the three concerns named in the problem statement. They are trained separately from the LLM report.

| Concern | Model | Training data | Honest read of quality |
| --- | --- | --- | --- |
| Crooked teeth | YOLOv11n detector | OMNI intraoral boxes for tooth torsion and tooth misalignment, mapped to one class: crooked | Strongest of the three. Validation mAP50 is about 0.49. Boxes are useful as visual evidence, not a census of every rotated tooth. |
| Discoloration | CLIP ViT-B/32 image embedding plus a linear classifier, with a Lab b* yellowness heatmap | Kaggle Oral Diseases: tooth discoloration vs clear | Validation accuracy about 68%. The heatmap is a color cue on tooth-like pixels, not a stain diagnosis. |
| Tooth wear | CLIP ViT-B/32 embedding plus a 4-way linear classifier (none / mild / moderate / notable) | 200 OMNI photos labelled by `gpt-4o-mini` because no public intraoral TWI set was available | Weak. Labels are distilled, the set is small, and validation accuracy is about 45%. Treat wear overlay as experimental. |

Training datasets and weight files are not committed. See [ml/README.md](ml/README.md) to download data, train, and serve the sidecar.

---

## Tech stack

**Product (web)**

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- Zod for the report schema
- OpenAI and Anthropic for the screening writeup
- Supabase Auth for optional email/password sign-in
- html2canvas-pro and jsPDF for PDF export

**Local CV sidecar**

- Python, FastAPI, Ultralytics YOLOv11n, OpenCLIP, scikit-learn, OpenCV

**Where things run**

- Browser: capture, session photos, report UI, local timeline
- Next.js API: `/api/analyze` and `/api/cv`
- Optional Python process: `ml/serve.py` on port 8765

---

## Project layout

```
src/app/page.tsx              Landing page
src/app/capture/page.tsx      Five-step photo capture
src/app/report/page.tsx       Report, PDF, save to timeline
src/app/api/analyze/route.ts  GPT + Claude screening pipeline
src/app/api/cv/route.ts       Proxy to the local CV sidecar
src/lib/analysis-schema.ts    Nine findings and severity scale
src/lib/capture-steps.ts      The five photo views
src/components/report/        Summary, findings, photos, printable report
ml/                           Download, train, and serve CV models
.env.local.example            Keys and optional sidecar URL
```

---

## How to run

### 1. Clone and install

```bash
git clone https://github.com/AbhineethVS/toothpaste-cv.git
cd toothpaste-cv
npm install
```

### 2. Add keys

Copy `.env.local.example` to `.env.local` and fill in:

```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-5
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
CV_SIDECAR_URL=http://127.0.0.1:8765
```

- OpenAI is required for a report.
- Anthropic is optional. If it is missing, the report still returns from OpenAI alone.
- Supabase is optional. Without it, people can still screen. They cannot sign in or save a cloud-backed account.
- `CV_SIDECAR_URL` is optional. The default already matches `ml/serve.py`.

Do not commit `.env.local`.

### 3. Start the web app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Optional: start the CV overlay

Train or place weights first (see [ml/README.md](ml/README.md)), then:

```bash
npm run cv:serve
```

On Windows that script uses `ml\.venv\Scripts\python.exe`. If your venv is elsewhere, run:

```bash
python ml/serve.py
```

The sidecar listens on `127.0.0.1:8765`. Keep it running while you generate a report if you want boxes and heatmaps on the Photos tab.

---

## Privacy, in short

- A screening does not require an account.
- Live photos stay in browser session storage for the report.
- Saved timeline entries (compressed photos plus results) stay in that browser's local storage, up to a small cap.
- Photos are sent to the configured AI providers to produce the report.
- Screening photos are not used to train toothpaste.cv's own models.
- Full text: `/privacy` and `/terms` in the app.

---

## Limits we are honest about

- Lighting, blur, and closed lips will change the report. Retake a bad shot.
- Two runs on the same photos can still differ slightly because the writeup models are not deterministic. The merge step is there to reduce over-calling, not to freeze every word.
- Local CV weights are trained on public intraoral datasets, not on this product's user photos.
- Wear labels were teacher-labelled by a cheaper vision model. That is a gap, not a secret.
- This is preliminary visual screening. A dentist still has to look.

---

## Links

- Repository: [https://github.com/AbhineethVS/toothpaste-cv](https://github.com/AbhineethVS/toothpaste-cv)
- Local app: [http://localhost:3000](http://localhost:3000)
- CV training notes: [ml/README.md](ml/README.md)
