# toothpaste.cv

### DSOLVE 2026 | DRISHTI | College of Engineering Trivandrum (CET)

**BUILD. SOLVE. DEMONSTRATE.**

| **Problem:** | Oral Health Screening Widget |
| --- | --- |
| **Team Name:** | Quriosity |
| **Team Members:** | Abhineeth V S, Siddarth Narayan, Christta Ann Mathew, Ham P R |
| **Institution:** | College of Engineering Trivandrum |
| **Live Demo:** | [https://toothpaste-cv.vercel.app/](https://toothpaste-cv.vercel.app/) |
| **Pitch Video:** | [https://lnkd.in/p/gRzzE49X](https://lnkd.in/p/gRzzE49X) |

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Our Solution](#our-solution)
- [Key Features](#key-features)
- [Screenshots & Demo](#screenshots--demo)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Usage / Demo Script](#usage--demo-script)
- [Limitations & Future Scope](#limitations--future-scope)
- [Team](#team)
- [Submission Checklist](#submission-checklist)

---

## Problem Statement

Develop a free, two-minute oral health screening widget for web or smartphones that guides patients through a simple set of prompts and captures five quick images of their teeth.

The solution should analyse these images and generate an instant visual report highlighting potential oral health concerns such as crooked teeth, tooth wear, or discoloration. The goal is to provide patients with an easy, accessible way to get an initial visual assessment of their oral health and understand whether they may need to consult a dentist.

### Why this matters

People often notice stains, chips, crowding, or gum changes early, but wait until pain starts before taking action. toothpaste.cv gives them a simple first step: guided photos, a plain report, and a clear reminder when a dentist should review it.

---

## Our Solution

toothpaste.cv is a browser-based visual oral health screening tool. It guides the user through five oral photos, sends them through a fixed AI screening rubric, and returns a clear report with severity, visible evidence, mouth-region context, and next steps.

It is not a diagnosis, not an X-ray, and not a treatment plan. It is a triage tool that helps users decide whether a visible change needs a closer look from a licensed dentist.

---

## Key Features

- **Five guided photos** - front bite, upper arch, lower arch, left side, and right side.
- **Instant visual report** - summary, findings, severity labels, photo references, and mouth-region context.
- **Nine screening categories** - crowding, wear, discoloration, gum health, plaque, bite alignment, spacing, chips, and possible decay.
- **Dentist-ready summary** - report language users can save, export, and bring to a dental visit.
- **Optional timeline** - signed-in users can save reports and compare later screenings.
- **Honest safety boundary** - every flow clearly states that this is screening only, not medical diagnosis.

---

## Screenshots & Demo

| Item | Link | Description |
| --- | --- | --- |
| Live demo | [toothpaste-cv.vercel.app](https://toothpaste-cv.vercel.app/) | Working web app with the full screening flow. |
| Pitch video | [LinkedIn pitch](https://lnkd.in/p/gRzzE49X) | Short product pitch and walkthrough. |
| Example photo views | [`tooth-sides/`](tooth-sides/) | Five reference tooth views used for guided capture. |

---

## Tech Stack

| Layer | Technology | Why we chose it |
| --- | --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 | Fast web app, strong typing, responsive UI, and easy deployment. |
| Backend | Next.js API routes | Keeps capture, report generation, and API calls in one app. |
| Database / Auth | Supabase Auth, browser local storage | Optional sign-in and saved screening timeline without forcing accounts. |
| ML / AI | OpenAI, Anthropic Claude, Zod schema validation | Structured visual screening report with a fixed rubric and safer output shape. |
| Computer Vision | Python, FastAPI, YOLOv11n, OpenCLIP, OpenCV | Optional local overlays for crooked-tooth boxes and stain heatmaps. |
| PDF / Export | html2canvas-pro, jsPDF | Lets users save and share a report. |
| Hosting | Vercel | Simple public deployment for the demo. |

---

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- OpenAI API key for report generation
- Optional Anthropic API key for second-model review
- Optional Supabase project for sign-in and saved timelines
- Optional Python environment for local CV overlays

### Installation

```bash
git clone https://github.com/AbhineethVS/toothpaste-cv.git
cd toothpaste-cv
npm install
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the needed values.

| Variable | Description | Required |
| --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI key used by `/api/analyze` | Yes |
| `OPENAI_MODEL` | OpenAI vision model name | Yes |
| `ANTHROPIC_API_KEY` | Anthropic key for optional second review | No |
| `ANTHROPIC_MODEL` | Claude model name | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | No |
| `CV_SIDECAR_URL` | Local CV sidecar URL | No |

Do not commit `.env.local` or real API keys.

### Run the Web App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Optional CV Sidecar

Train or place the model weights first. See [`ml/README.md`](ml/README.md).

```bash
npm run cv:serve
```

If your Python environment is elsewhere, run:

```bash
python ml/serve.py
```

---

## Documentation

Supporting documentation is available in [`docs/`](docs/):

- [`docs/problem-statement.md`](docs/problem-statement.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/demo-script.md`](docs/demo-script.md)
- [`docs/privacy-and-safety.md`](docs/privacy-and-safety.md)

The project submission checklist is in [`SUBMISSION_CHECKLIST.md`](SUBMISSION_CHECKLIST.md).

---

## Usage / Demo Script

1. **Boot** - open the live demo or run the app locally.
2. **Start screening** - show the landing page and the "not a diagnosis" boundary.
3. **Capture photos** - take or upload five guided views: front bite, upper arch, lower arch, left side, and right side.
4. **Generate report** - wait for the AI screening result.
5. **Review findings** - show severity, location, photo evidence, and plain next steps.
6. **Export or save** - show PDF export and optional saved timeline.
7. **Wrap up** - explain that flagged concerns should be reviewed by a dentist.

---

## Limitations & Future Scope

### Known Limitations

- It only screens what is visible in phone photos.
- It cannot detect cavities between teeth, root problems, bone issues, or gum pocket depth.
- Poor lighting, blur, closed lips, and wrong angles can reduce quality.
- AI output can vary slightly between runs.
- The CV sidecar is optional and experimental. The written report is the main product output.
- It is not a certified medical device.

### Future Scope

- Better photo quality checks before analysis.
- Stronger computer-vision models trained on larger labelled dental datasets.
- Dentist review workflow with user consent.
- Long-term progress tracking across repeated screenings.
- Multilingual reports for wider access.

---

## Team

| Name | Role(s) | GitHub | Email |
| --- | --- | --- | --- |
| Abhineeth V S | Full-stack, AI integration, product | [@AbhineethVS](https://github.com/AbhineethVS) |  |
| Siddarth Narayan | Product, engineering | [@siddarthcet2007-glitch](https://github.com/siddarthcet2007-glitch) | siddarthcet2007@gmail.com |
| Christta Ann Mathew | Product, research | [@ChristtaAnn](https://github.com/ChristtaAnn) | christtaannmathew@gmail.com |
| Ham P R | Product, engineering | [@HAM-2K5](https://github.com/HAM-2K5) | hamplivingston1020@gmail.com |

---

## Submission Checklist

- Public repository is ready.
- README follows the D-Solve template.
- Live demo link is added.
- Pitch video link is added.
- Secrets are kept out of the repository.
- App can be run from a fresh clone with the required environment variables.

---

## Important Safety Note

toothpaste.cv provides preliminary visual screening only. It is not a medical diagnosis. Always consult a licensed dentist for oral health advice, urgent symptoms, or treatment decisions.
