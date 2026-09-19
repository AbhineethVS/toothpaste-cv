"""Train YOLOv11n on OMNI crooked-tooth boxes."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import CROWDING_DIR, RUNS_DIR, WEIGHTS_DIR


def main() -> None:
    yaml_path = CROWDING_DIR / "data.yaml"
    if not yaml_path.exists():
        raise SystemExit("Run python ml/prep_omni.py first.")

    from ultralytics import YOLO

    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    model = YOLO("yolo11n.pt")
    model.train(
        data=str(yaml_path),
        epochs=25,
        imgsz=640,
        batch=8,
        device=0,
        project=str(RUNS_DIR),
        name="crowding",
        patience=6,
        exist_ok=True,
        workers=0,
        plots=True,
        hsv_h=0.015,
        hsv_s=0.4,
        hsv_v=0.3,
        fliplr=0.5,
    )
    best = RUNS_DIR / "crowding" / "weights" / "best.pt"
    dest = WEIGHTS_DIR / "crowding.pt"
    if not best.exists():
        raise SystemExit(f"Missing {best}")
    shutil.copy2(best, dest)
    print(f"Saved {dest}")


if __name__ == "__main__":
    main()
