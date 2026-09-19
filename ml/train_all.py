"""Run download → prep → distill → train in order. Long steps can be skipped with flags."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent
PYTHON = sys.executable


def run(script: str) -> None:
    print(f"\n>>> {script}")
    subprocess.check_call([PYTHON, str(ML_DIR / script)], cwd=str(ML_DIR))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-download", action="store_true")
    parser.add_argument("--skip-distill", action="store_true")
    parser.add_argument("--skip-crowding", action="store_true")
    parser.add_argument("--skip-clip", action="store_true")
    args = parser.parse_args()

    if not args.skip_download:
        run("download_data.py")
    run("prep_omni.py")
    if not args.skip_distill:
        run("distill_labels.py")
    run("prep_stain.py")
    if not args.skip_crowding:
        run("train_crowding.py")
    if not args.skip_clip:
        run("train_clip_heads.py")


if __name__ == "__main__":
    main()
