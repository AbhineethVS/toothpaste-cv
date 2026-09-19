"""FastAPI sidecar: crowding boxes + stain heatmap + wear/stain CLIP heads."""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Literal

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np
import cv2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from common import WEIGHTS_DIR
from heatmap import colorize_heatmap, decode_image, score_to_severity, yellowness_heatmap

PHOTO_IDS = (
    "front-bite",
    "upper-arch",
    "lower-arch",
    "left-buccal",
    "right-buccal",
)
Severity = Literal["none", "mild", "moderate", "notable"]

app = FastAPI(title="toothpaste-cv CV sidecar")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_yolo = None
_clip = None
_clip_preprocess = None
_stain_head = None
_wear_head = None
_device = "cpu"


class FindingScore(BaseModel):
    severity: Severity
    confidence: float
    source: str
    summary: str


class Box(BaseModel):
    x: float
    y: float
    w: float
    h: float
    score: float
    cls: str = "crooked"


class PhotoResult(BaseModel):
    photo: str
    boxes: list[Box]
    heatmap: str | None
    crowding: FindingScore
    discoloration: FindingScore
    wear: FindingScore


class AnalyzeRequest(BaseModel):
    photos: list[str] = Field(min_length=1, max_length=5)


class AnalyzeResponse(BaseModel):
    available: bool = True
    models: dict[str, bool]
    photos: list[PhotoResult]


def _load_models() -> None:
    global _yolo, _clip, _clip_preprocess, _stain_head, _wear_head, _device
    crowding_path = WEIGHTS_DIR / "crowding.pt"
    if crowding_path.exists() and _yolo is None:
        from ultralytics import YOLO

        _yolo = YOLO(str(crowding_path))
        print(f"Loaded crowding detector {crowding_path}")

    stain_path = WEIGHTS_DIR / "stain.joblib"
    wear_path = WEIGHTS_DIR / "wear.joblib"
    need_clip = (stain_path.exists() or wear_path.exists()) and _clip is None
    if need_clip:
        import joblib
        import open_clip
        import torch

        _device = "cuda" if torch.cuda.is_available() else "cpu"
        payload = joblib.load(stain_path if stain_path.exists() else wear_path)
        _clip, _, _clip_preprocess = open_clip.create_model_and_transforms(
            payload["clip_arch"], pretrained=payload["clip_pretrained"]
        )
        _clip.to(_device)
        _clip.eval()
        if stain_path.exists():
            _stain_head = joblib.load(stain_path)
            print(f"Loaded stain head {stain_path}")
        if wear_path.exists():
            _wear_head = joblib.load(wear_path)
            print(f"Loaded wear head {wear_path}")


def _embed(rgb: np.ndarray) -> np.ndarray:
    import torch
    from PIL import Image

    assert _clip is not None and _clip_preprocess is not None
    image = _clip_preprocess(Image.fromarray(rgb)).unsqueeze(0).to(_device)
    with torch.no_grad():
        feat = _clip.encode_image(image)
        feat = feat / feat.norm(dim=-1, keepdim=True)
    return feat.squeeze(0).float().cpu().numpy()


def _predict_head(head, feat: np.ndarray) -> tuple[str, float]:
    clf = head["clf"]
    encoder = head["encoder"]
    proba = clf.predict_proba(feat.reshape(1, -1))[0]
    index = int(np.argmax(proba))
    label = str(encoder.inverse_transform([index])[0])
    return label, float(proba[index])


def _crowding_from_boxes(boxes: list[Box]) -> FindingScore:
    if not boxes:
        return FindingScore(
            severity="none",
            confidence=0.55,
            source="yolo" if _yolo is not None else "unavailable",
            summary="No crooked-tooth boxes on this photo.",
        )
    top = max(box.score for box in boxes)
    count = len(boxes)
    if count >= 5 or top >= 0.75:
        severity: Severity = "notable"
    elif count >= 3 or top >= 0.55:
        severity = "moderate"
    else:
        severity = "mild"
    return FindingScore(
        severity=severity,
        confidence=round(top, 3),
        source="yolo",
        summary=f"{count} crooked-tooth box{'es' if count != 1 else ''} (top {top:.2f}).",
    )


def _stain_score(rgb: np.ndarray, heat_score: float, feat: np.ndarray | None) -> FindingScore:
    if _stain_head is not None and feat is not None:
        label, conf = _predict_head(_stain_head, feat)
        if label == "clear":
            severity: Severity = "none"
            summary = "CLIP stain head called this photo clear."
        else:
            severity = score_to_severity(max(heat_score, conf * 0.7))
            if conf >= 0.8 and heat_score >= 0.45:
                severity = "notable" if severity == "moderate" else severity
            summary = f"CLIP stain head={label} ({conf:.2f}), yellowness={heat_score:.2f}."
        return FindingScore(severity=severity, confidence=round(conf, 3), source="clip", summary=summary)

    severity = score_to_severity(heat_score)
    return FindingScore(
        severity=severity,
        confidence=round(min(0.9, 0.35 + heat_score), 3),
        source="color",
        summary=f"Lab yellowness score {heat_score:.2f} (model not trained yet).",
    )


def _wear_score(feat: np.ndarray | None) -> FindingScore:
    if _wear_head is None or feat is None:
        return FindingScore(
            severity="none",
            confidence=0.2,
            source="unavailable",
            summary="Wear head not trained yet.",
        )
    label, conf = _predict_head(_wear_head, feat)
    severity: Severity = label if label in {"none", "mild", "moderate", "notable"} else "none"
    return FindingScore(
        severity=severity,
        confidence=round(conf, 3),
        source="clip",
        summary=f"CLIP wear head={severity} ({conf:.2f}).",
    )


def _detect_boxes(rgb: np.ndarray) -> list[Box]:
    if _yolo is None:
        return []
    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    result = _yolo.predict(bgr, verbose=False, conf=0.25, imgsz=640)[0]
    boxes: list[Box] = []
    if result.boxes is None:
        return boxes
    for box in result.boxes:
        xyxyn = box.xyxyn[0].tolist()
        x1, y1, x2, y2 = xyxyn
        boxes.append(
            Box(
                x=float(x1),
                y=float(y1),
                w=float(max(0, x2 - x1)),
                h=float(max(0, y2 - y1)),
                score=float(box.conf[0]),
                cls="crooked",
            )
        )
    return boxes


@app.get("/health")
def health() -> dict:
    _load_models()
    return {
        "ok": True,
        "crowding": _yolo is not None,
        "stain": _stain_head is not None,
        "wear": _wear_head is not None,
    }


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    _load_models()
    photos: list[PhotoResult] = []
    for index, data_url in enumerate(request.photos):
        rgb = decode_image(data_url)
        heat, heat_score = yellowness_heatmap(rgb)
        boxes = _detect_boxes(rgb)
        feat = _embed(rgb) if _stain_head is not None or _wear_head is not None else None
        photo_id = PHOTO_IDS[index] if index < len(PHOTO_IDS) else f"photo-{index}"
        photos.append(
            PhotoResult(
                photo=photo_id,
                boxes=boxes,
                heatmap=colorize_heatmap(heat),
                crowding=_crowding_from_boxes(boxes),
                discoloration=_stain_score(rgb, heat_score, feat),
                wear=_wear_score(feat),
            )
        )
    return AnalyzeResponse(
        available=True,
        models={
            "crowding": _yolo is not None,
            "stain": _stain_head is not None,
            "wear": _wear_head is not None,
        },
        photos=photos,
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("CV_SIDECAR_PORT", "8765"))
    uvicorn.run("serve:app", host="127.0.0.1", port=port, reload=False)
