from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ML_DIR = Path(__file__).resolve().parent
DATA_DIR = ML_DIR / "data"
WEIGHTS_DIR = ML_DIR / "weights"
RUNS_DIR = ML_DIR / "runs"

OMNI_DIR = DATA_DIR / "omni"
STAIN_DIR = DATA_DIR / "stain"
MOUTHCARE_DIR = DATA_DIR / "mouthcare"
DISTILL_PATH = DATA_DIR / "distilled.jsonl"
CROWDING_DIR = DATA_DIR / "crowding"

CROOKED_CATEGORY_HINTS = (
    "tt",
    "tm",
    "torsion",
    "misalignment",
    "crowding",
    "crooked",
    "rotation",
)

SEVERITIES = ("none", "mild", "moderate", "notable")


def ensure_dirs() -> None:
    for path in (DATA_DIR, WEIGHTS_DIR, RUNS_DIR, OMNI_DIR, STAIN_DIR, MOUTHCARE_DIR, CROWDING_DIR):
        path.mkdir(parents=True, exist_ok=True)


def load_dotenv() -> None:
    env_path = ROOT / ".env.local"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def find_omni_root() -> Path | None:
    if (OMNI_DIR / "annotations" / "instances_train.json").exists():
        return OMNI_DIR
    matches = list(OMNI_DIR.rglob("instances_train.json"))
    if not matches:
        return None
    return matches[0].parent.parent


def link_or_copy(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        return
    try:
        os.link(src, dst)
    except OSError:
        import shutil

        shutil.copy2(src, dst)


def dump_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
