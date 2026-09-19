"""Convert OMNI COCO boxes for torsion/misalignment into a YOLO crowding dataset."""

from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (
    CROWDING_DIR,
    CROOKED_CATEGORY_HINTS,
    dump_json,
    find_omni_root,
    link_or_copy,
)


def _is_crooked_category(name: str) -> bool:
    lowered = name.lower()
    return any(hint in lowered for hint in CROOKED_CATEGORY_HINTS)


def _coco_bbox_to_yolo(bbox: list[float], width: int, height: int) -> tuple[float, float, float, float] | None:
    x, y, w, h = bbox
    if width <= 0 or height <= 0 or w <= 1 or h <= 1:
        return None
    cx = (x + w / 2) / width
    cy = (y + h / 2) / height
    nw = w / width
    nh = h / height
    if min(cx, cy, nw, nh) < 0 or max(cx, cy, nw, nh) > 1.5:
        return None
    return (
        min(max(cx, 0), 1),
        min(max(cy, 0), 1),
        min(max(nw, 0), 1),
        min(max(nh, 0), 1),
    )


def _resolve_image_path(omni_root: Path, split: str, file_name: str) -> Path | None:
    candidates = [
        omni_root / split / file_name,
        omni_root / file_name,
        omni_root / Path(file_name).name,
        omni_root / split / Path(file_name).name,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    matches = list(omni_root.rglob(Path(file_name).name))
    return matches[0] if matches else None


def convert_split(omni_root: Path, split: str) -> dict[str, int]:
    ann_path = omni_root / "annotations" / f"instances_{split}.json"
    payload = json.loads(ann_path.read_text(encoding="utf-8"))
    categories = {item["id"]: item["name"] for item in payload["categories"]}
    crooked_ids = {cid for cid, name in categories.items() if _is_crooked_category(name)}
    print(f"{split}: categories={categories}")
    print(f"{split}: crooked ids={ {cid: categories[cid] for cid in crooked_ids} }")

    anns_by_image: dict[int, list] = defaultdict(list)
    for ann in payload["annotations"]:
        if ann.get("iscrowd"):
            continue
        if ann["category_id"] in crooked_ids:
            anns_by_image[ann["image_id"]].append(ann)

    image_dir = CROWDING_DIR / "images" / split
    label_dir = CROWDING_DIR / "labels" / split
    image_dir.mkdir(parents=True, exist_ok=True)
    label_dir.mkdir(parents=True, exist_ok=True)

    stats = {"images": 0, "with_boxes": 0, "boxes": 0, "missing": 0}
    for image in payload["images"]:
        src = _resolve_image_path(omni_root, split, image["file_name"])
        if src is None:
            stats["missing"] += 1
            continue
        dest = image_dir / src.name
        link_or_copy(src, dest)
        width = int(image.get("width") or 0)
        height = int(image.get("height") or 0)
        lines: list[str] = []
        for ann in anns_by_image.get(image["id"], []):
            yolo = _coco_bbox_to_yolo(ann["bbox"], width, height)
            if yolo is None:
                continue
            lines.append(f"0 {yolo[0]:.6f} {yolo[1]:.6f} {yolo[2]:.6f} {yolo[3]:.6f}")
        (label_dir / f"{src.stem}.txt").write_text("\n".join(lines), encoding="utf-8")
        stats["images"] += 1
        stats["boxes"] += len(lines)
        if lines:
            stats["with_boxes"] += 1
    return stats


def main() -> None:
    omni_root = find_omni_root()
    if omni_root is None:
        raise SystemExit("OMNI dataset not found. Run python ml/download_data.py first.")

    summary = {}
    for split in ("train", "val", "test"):
        ann = omni_root / "annotations" / f"instances_{split}.json"
        if not ann.exists():
            print(f"Skipping missing split {split}")
            continue
        summary[split] = convert_split(omni_root, split)
        print(f"{split} stats: {summary[split]}")

    yaml_path = CROWDING_DIR / "data.yaml"
    yaml_path.write_text(
        "\n".join(
            [
                f"path: {CROWDING_DIR.as_posix()}",
                "train: images/train",
                "val: images/val",
                "test: images/test",
                "names:",
                "  0: crooked",
                "",
            ]
        ),
        encoding="utf-8",
    )
    dump_json(CROWDING_DIR / "prep_summary.json", summary)
    print(f"Wrote {yaml_path}")


if __name__ == "__main__":
    main()
