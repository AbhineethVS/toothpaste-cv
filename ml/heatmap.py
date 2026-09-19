from __future__ import annotations

import base64
from io import BytesIO

import cv2
import numpy as np
from PIL import Image


def decode_image(data_url: str) -> np.ndarray:
    if "," in data_url:
        payload = data_url.split(",", 1)[1]
    else:
        payload = data_url
    raw = base64.b64decode(payload)
    image = Image.open(BytesIO(raw)).convert("RGB")
    return np.array(image)


def encode_png(rgba: np.ndarray) -> str:
    ok, buffer = cv2.imencode(".png", cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
    if not ok:
        raise RuntimeError("Failed to encode heatmap.")
    b64 = base64.b64encode(buffer.tobytes()).decode("ascii")
    return f"data:image/png;base64,{b64}"


def yellowness_heatmap(rgb: np.ndarray) -> tuple[np.ndarray, float]:
    """Return 0-1 heatmap and a 0-1 stain score from Lab b* on tooth-like pixels."""
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
    lightness, a_channel, b_channel = cv2.split(lab)
    tooth = (lightness > 90) & (a_channel < 145) & (a_channel > 110)
    yellow = np.clip((b_channel.astype(np.float32) - 138.0) / 35.0, 0, 1)
    heat = np.where(tooth, yellow, 0.0).astype(np.float32)
    if tooth.any():
        score = float(np.percentile(heat[tooth], 85))
    else:
        score = float(heat.mean())
    return heat, score


def colorize_heatmap(heat: np.ndarray, max_side: int = 480) -> str:
    height, width = heat.shape[:2]
    scale = min(1.0, max_side / max(height, width))
    if scale < 1:
        heat = cv2.resize(
            heat,
            (max(1, int(width * scale)), max(1, int(height * scale))),
            interpolation=cv2.INTER_LINEAR,
        )
    heat_u8 = np.clip(heat * 255, 0, 255).astype(np.uint8)
    color_bgr = cv2.applyColorMap(heat_u8, cv2.COLORMAP_JET)
    color_rgb = cv2.cvtColor(color_bgr, cv2.COLOR_BGR2RGB)
    alpha = np.clip(heat * 170, 0, 170).astype(np.uint8)
    alpha[heat < 0.08] = 0
    rgba = np.dstack([color_rgb, alpha])
    return encode_png(rgba)


def score_to_severity(score: float) -> str:
    if score < 0.22:
        return "none"
    if score < 0.40:
        return "mild"
    if score < 0.62:
        return "moderate"
    return "notable"
