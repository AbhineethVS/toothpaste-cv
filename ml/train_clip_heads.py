"""CLIP linear probes for discoloration (binary) and wear (4-way)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
from PIL import Image
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import DISTILL_PATH, SEVERITIES, STAIN_DIR, WEIGHTS_DIR

CLIP_ARCH = "ViT-B-32"
CLIP_PRETRAINED = "openai"
RANDOM_SEED = 13


def load_clip(device: str):
    import open_clip
    import torch

    model, _, preprocess = open_clip.create_model_and_transforms(
        CLIP_ARCH, pretrained=CLIP_PRETRAINED
    )
    model.to(device)
    model.eval()
    return model, preprocess


def embed_paths(paths: list[Path], device: str) -> np.ndarray:
    import torch

    model, preprocess = load_clip(device)
    vectors: list[np.ndarray] = []
    with torch.no_grad():
        for index, path in enumerate(paths, start=1):
            image = preprocess(Image.open(path).convert("RGB")).unsqueeze(0).to(device)
            feat = model.encode_image(image)
            feat = feat / feat.norm(dim=-1, keepdim=True)
            vectors.append(feat.squeeze(0).float().cpu().numpy())
            if index % 50 == 0:
                print(f"  encoded {index}/{len(paths)}")
    return np.stack(vectors)


def _device() -> str:
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except ImportError:
        return "cpu"


def _iter_images(folder: Path) -> list[Path]:
    return [
        path
        for path in folder.rglob("*")
        if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    ]


def train_logistic(features: np.ndarray, labels: list[str], name: str) -> None:
    encoder = LabelEncoder()
    y = encoder.fit_transform(labels)
    if len(set(labels)) < 2:
        raise SystemExit(f"{name}: need at least two classes, got {set(labels)}")

    try:
        x_train, x_val, y_train, y_val = train_test_split(
            features, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
        )
    except ValueError:
        x_train, x_val, y_train, y_val = train_test_split(
            features, y, test_size=0.2, random_state=RANDOM_SEED
        )
    clf = LogisticRegression(
        max_iter=400,
        class_weight="balanced",
        C=1.0,
    )
    clf.fit(x_train, y_train)
    pred = clf.predict(x_val)
    print(f"\n=== {name} val report ===")
    print(classification_report(y_val, pred, target_names=list(encoder.classes_)))
    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    payload = {
        "clip_arch": CLIP_ARCH,
        "clip_pretrained": CLIP_PRETRAINED,
        "classes": list(encoder.classes_),
        "coef": clf.coef_,
        "intercept": clf.intercept_,
        "clf": clf,
        "encoder": encoder,
    }
    dest = WEIGHTS_DIR / f"{name}.joblib"
    joblib.dump(payload, dest)
    print(f"Saved {dest}")


def collect_stain() -> tuple[list[Path], list[str]]:
    pos = _iter_images(STAIN_DIR / "images" / "discoloration")
    neg = _iter_images(STAIN_DIR / "images" / "clear")
    paths = pos + neg
    labels = ["discoloration"] * len(pos) + ["clear"] * len(neg)
    return paths, labels


def collect_wear() -> tuple[list[Path], list[str]]:
    if not DISTILL_PATH.exists():
        raise SystemExit("Run python ml/distill_labels.py first.")
    paths: list[Path] = []
    labels: list[str] = []
    for line in DISTILL_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        path = Path(row["path"])
        wear = row.get("wear")
        if wear not in SEVERITIES or not path.exists():
            continue
        paths.append(path)
        labels.append(wear)
    return paths, labels


def maybe_collect_stain_from_distill() -> tuple[list[Path], list[str]] | None:
    pos_dir = STAIN_DIR / "images" / "discoloration"
    if pos_dir.exists() and _iter_images(pos_dir):
        return None
    if not DISTILL_PATH.exists():
        return None
    paths: list[Path] = []
    labels: list[str] = []
    for line in DISTILL_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        path = Path(row["path"])
        stain = row.get("discoloration")
        if stain not in SEVERITIES or not path.exists():
            continue
        paths.append(path)
        labels.append("discoloration" if stain != "none" else "clear")
    return paths, labels


def main() -> None:
    device = _device()
    print(f"Encoding with CLIP {CLIP_ARCH} on {device}")

    stain_pack = maybe_collect_stain_from_distill()
    if stain_pack is None:
        stain_paths, stain_labels = collect_stain()
    else:
        stain_paths, stain_labels = stain_pack

    if stain_paths:
        print(f"Stain images: {len(stain_paths)}")
        stain_feat = embed_paths(stain_paths, device)
        train_logistic(stain_feat, stain_labels, "stain")
    else:
        print("No stain images; skip stain head.")

    wear_paths, wear_labels = collect_wear()
    print(f"Wear images: {len(wear_paths)}")
    if wear_paths:
        wear_feat = embed_paths(wear_paths, device)
        train_logistic(wear_feat, wear_labels, "wear")


if __name__ == "__main__":
    main()
