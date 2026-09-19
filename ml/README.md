# Local CV sidecar

This folder trains and serves the optional photo overlays for toothpaste.cv.

The web report does not depend on these models. If this service is down, `/api/cv` returns `available: false` and the Photos tab shows the five images without boxes or heatmaps.

## What it produces

For each of the five screening photos:

1. **Crowding boxes**: YOLOv11n detections for crooked or rotated teeth, drawn as yellow rectangles in image-normalized coordinates.
2. **Stain heatmap**: Lab b* yellowness on tooth-like pixels, returned as a transparent PNG overlay.
3. **Scores**: crowding, discoloration, and wear with severity `none | mild | moderate | notable`, shown next to the written report.

CLIP image embeddings are computed once per photo, then reused by the stain and wear heads.

## Models and data

| File | Role | Source |
| --- | --- | --- |
| `ml/weights/crowding.pt` | Crooked-tooth detector | OMNI intraoral COCO boxes. Categories that look like tooth torsion (TT) or tooth misalignment (TM) are mapped to one class: `crooked`. Script: `prep_omni.py`. |
| `ml/weights/stain.joblib` | Discoloration classifier on CLIP ViT-B/32 embeddings | Kaggle Oral Diseases (`salmansajid05/oral-diseases`), tooth discoloration vs clear. Script: `prep_stain.py`. |
| `ml/weights/wear.joblib` | Wear classifier on the same CLIP embeddings | 200 OMNI images labelled by `gpt-4o-mini` (`distill_labels.py`). There is no public intraoral Tooth Wear Index set in this pipeline. |

MouthCare from Hugging Face is attempted by `download_data.py` but may be gated. The current stain path does not require it.

Do not commit `ml/data/`, `ml/runs/`, `ml/.venv/`, `*.pt`, or `*.joblib`. `.gitignore` already excludes them.

## Honest metrics from the first training pass

These are ballpark numbers from the local training run, not a published clinical study.

- Crowding YOLO: validation mAP50 about 0.49, precision about 0.45, recall about 0.51 after 25 epochs.
- Stain head: validation accuracy about 68%.
- Wear head: validation accuracy about 45%, with a skewed label mix (mostly `none` and `mild`).

Use crowding boxes as the main visual demo. Treat wear as experimental.

## Setup

From the repo root, on Windows:

```bash
python -m venv ml\.venv
ml\.venv\Scripts\python.exe -m pip install -r ml/requirements.txt
```

Install a CUDA build of PyTorch if you have a GPU. CPU works, but training and CLIP embedding will be slow.

You also need:

- `OPENAI_API_KEY` in `.env.local` if you run `distill_labels.py`
- Kaggle credentials for the Oral Diseases download
- Disk space for OMNI (the Drive archive is large)

## Train

Full sequence (download, prep, distill wear labels, train YOLO, train CLIP heads):

```bash
ml\.venv\Scripts\python.exe ml/train_all.py
```

Skip steps you already finished:

```bash
ml\.venv\Scripts\python.exe ml/train_all.py --skip-download --skip-distill
```

Or run scripts one by one:

```bash
ml\.venv\Scripts\python.exe ml/download_data.py
ml\.venv\Scripts\python.exe ml/prep_omni.py
ml\.venv\Scripts\python.exe ml/distill_labels.py
ml\.venv\Scripts\python.exe ml/prep_stain.py
ml\.venv\Scripts\python.exe ml/train_crowding.py
ml\.venv\Scripts\python.exe ml/train_clip_heads.py
```

`train_crowding.py` uses `device=0` and `workers=0` so it runs on a single Windows GPU without dataloader worker issues. Change those flags in the script if you are on another machine.

Weights land in `ml/weights/`.

## Serve

```bash
ml\.venv\Scripts\python.exe ml/serve.py
```

or from the repo root:

```bash
npm run cv:serve
```

The process binds to `127.0.0.1:8765`. Next.js reads `CV_SIDECAR_URL` (default `http://127.0.0.1:8765`) and POSTs the five data-URL photos to `/analyze`.

## Files

| Script | What it does |
| --- | --- |
| `common.py` | Shared paths and helpers |
| `download_data.py` | OMNI from Google Drive, Oral Diseases from Kaggle, MouthCare if allowed |
| `prep_omni.py` | COCO TT/TM boxes to YOLO `crooked` labels |
| `prep_stain.py` | Balanced discoloration vs clear folders |
| `distill_labels.py` | Cheap vision labels for wear |
| `train_crowding.py` | YOLOv11n, 25 epochs, 640px |
| `train_clip_heads.py` | Linear probes on frozen CLIP embeddings |
| `train_all.py` | Runs the pipeline in order |
| `heatmap.py` | Lab b* yellowness overlay |
| `serve.py` | FastAPI sidecar |

## Product boundary

These models exist to put evidence on the photos the problem statement asked for: crooked teeth, tooth wear, discoloration.

They are not used to author the patient report. They are not trained on toothpaste.cv user uploads. They are not a diagnosis.
