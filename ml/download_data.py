"""Download OMNI, MouthCare, and (if authenticated) Oral Diseases."""

from __future__ import annotations

import shutil
import sys
import zipfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import DATA_DIR, MOUTHCARE_DIR, OMNI_DIR, STAIN_DIR, ensure_dirs

OMNI_DRIVE_ID = "1eSyipRJTDlAbRs0yb44l5vQjVYibRXy1"
OMNI_URL = f"https://drive.google.com/uc?id={OMNI_DRIVE_ID}"


def _unzip_if_needed(archive: Path, dest: Path) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    if (dest / "annotations" / "instances_train.json").exists():
        return
    if any(dest.rglob("instances_train.json")):
        return
    print(f"Extracting {archive.name} ...")
    with zipfile.ZipFile(archive) as zf:
        zf.extractall(dest)


def download_omni() -> None:
    ensure_dirs()
    if any(OMNI_DIR.rglob("instances_train.json")):
        print(f"OMNI already present under {OMNI_DIR}")
        return

    import gdown

    archive = DATA_DIR / "omni.zip"
    if not archive.exists():
        print("Downloading OMNI dataset from Google Drive (this is large)...")
        gdown.download(url=OMNI_URL, output=str(archive), quiet=False)
    _unzip_if_needed(archive, OMNI_DIR)
    print("OMNI ready.")


def download_mouthcare() -> None:
    ensure_dirs()
    marker = MOUTHCARE_DIR / "images"
    if marker.exists() and any(marker.rglob("*")):
        print(f"MouthCare already present under {MOUTHCARE_DIR}")
        return

    from huggingface_hub import snapshot_download

    print("Downloading MouthCare intraoral sample from Hugging Face...")
    snapshot_download(
        repo_id="MouthCare/intraoral-sample",
        repo_type="dataset",
        local_dir=str(MOUTHCARE_DIR),
    )
    print("MouthCare ready.")


def download_oral_diseases() -> Path | None:
    """Kaggle Oral Diseases — stain classifier source. Needs Kaggle credentials."""
    ensure_dirs()
    existing = list(STAIN_DIR.rglob("*discolor*"))
    if existing:
        print(f"Stain images already present under {STAIN_DIR}")
        return STAIN_DIR

    try:
        import kagglehub
    except ImportError:
        print("kagglehub not installed; skipping Oral Diseases.")
        return None

    try:
        print("Trying Kaggle Oral Diseases download...")
        path = Path(kagglehub.dataset_download("salmansajid05/oral-diseases"))
        dest = STAIN_DIR / "oral-diseases"
        if dest.exists():
            return dest
        shutil.copytree(path, dest, dirs_exist_ok=True)
        print(f"Oral Diseases copied to {dest}")
        return dest
    except Exception as exc:
        print(f"Kaggle Oral Diseases skipped ({exc}). Stain head will use distilled labels.")
        return None


def main() -> None:
    ensure_dirs()
    try:
        download_omni()
    except Exception as exc:
        print(f"OMNI download failed: {exc}")
    try:
        download_mouthcare()
    except Exception as exc:
        print(f"MouthCare download failed: {exc}")
    download_oral_diseases()


if __name__ == "__main__":
    main()
