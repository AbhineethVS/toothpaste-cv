"""Build a stain dataset from Kaggle Oral Diseases, or fall back to distilled labels."""

from __future__ import annotations

import random
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import DISTILL_PATH, STAIN_DIR, dump_json, link_or_copy

CLEAR_CAP_PER_CLASS = 400
RANDOM_SEED = 7


def _iter_images(folder: Path) -> list[Path]:
    return [
        path
        for path in folder.rglob("*")
        if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    ]


def _find_class_dirs(root: Path) -> dict[str, Path]:
    hits: dict[str, Path] = {}
    for folder in [root, *root.rglob("*")]:
        if not folder.is_dir():
            continue
        name = folder.name.lower().replace(" ", "_").replace("-", "_")
        if "discolor" in name or "stain" in name:
            hits.setdefault("discoloration", folder)
        elif any(token in name for token in ("calculus", "caries", "gingivitis", "hypodontia", "ulcer", "healthy")):
            hits.setdefault(name, folder)
    return hits


def build_from_oral_diseases(raw_root: Path) -> dict[str, int]:
    class_dirs = _find_class_dirs(raw_root)
    if "discoloration" not in class_dirs:
        raise SystemExit(f"No discoloration folder under {raw_root}")

    dest_pos = STAIN_DIR / "images" / "discoloration"
    dest_neg = STAIN_DIR / "images" / "clear"
    if dest_pos.exists():
        shutil.rmtree(dest_pos)
    if dest_neg.exists():
        shutil.rmtree(dest_neg)

    pos_images = _iter_images(class_dirs["discoloration"])
    for image in pos_images:
        link_or_copy(image, dest_pos / image.name)

    rng = random.Random(RANDOM_SEED)
    neg_images: list[Path] = []
    for key, folder in class_dirs.items():
        if key == "discoloration":
            continue
        candidates = _iter_images(folder)
        rng.shuffle(candidates)
        neg_images.extend(candidates[:CLEAR_CAP_PER_CLASS])
    rng.shuffle(neg_images)
    neg_images = neg_images[: max(len(pos_images), 400)]
    for image in neg_images:
        link_or_copy(image, dest_neg / f"{image.parent.name}_{image.name}")

    summary = {"source": str(raw_root), "discoloration": len(pos_images), "clear": len(neg_images)}
    dump_json(STAIN_DIR / "prep_summary.json", summary)
    print(summary)
    return summary


def build_from_distilled() -> dict[str, int] | None:
    if not DISTILL_PATH.exists():
        return None
    dest_pos = STAIN_DIR / "images" / "discoloration"
    dest_neg = STAIN_DIR / "images" / "clear"
    dest_pos.mkdir(parents=True, exist_ok=True)
    dest_neg.mkdir(parents=True, exist_ok=True)

    counts = {"discoloration": 0, "clear": 0}
    for line in DISTILL_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        import json

        row = json.loads(line)
        src = Path(row["path"])
        if not src.exists():
            continue
        severity = row.get("discoloration", "none")
        if severity in {"mild", "moderate", "notable"}:
            link_or_copy(src, dest_pos / src.name)
            counts["discoloration"] += 1
        else:
            link_or_copy(src, dest_neg / src.name)
            counts["clear"] += 1
    dump_json(STAIN_DIR / "prep_summary.json", {"source": "distilled", **counts})
    print(counts)
    return counts


def main() -> None:
    raw_candidates = [
        STAIN_DIR / "oral-diseases",
        *STAIN_DIR.glob("*"),
    ]
    for candidate in raw_candidates:
        if candidate.is_dir() and _find_class_dirs(candidate).get("discoloration"):
            build_from_oral_diseases(candidate)
            return
    distilled = build_from_distilled()
    if distilled is None:
        raise SystemExit("No stain images yet. Run download_data.py and/or distill_labels.py.")


if __name__ == "__main__":
    main()
