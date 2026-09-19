"""Teacher-label wear (and stain fallback) with a cheap OpenAI vision pass."""

from __future__ import annotations

import json
import random
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image
from openai import OpenAI

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import (
    DISTILL_PATH,
    MOUTHCARE_DIR,
    SEVERITIES,
    find_omni_root,
    load_dotenv,
)

SAMPLE_COUNT = 200
RANDOM_SEED = 11
DISTILL_MODEL = "gpt-4o-mini"

PROMPT = """You are labelling intraoral photos for a non-diagnostic screening model.
Look only at visible evidence in this one photo.

Return JSON with:
- wear: none | mild | moderate | notable
  none: biting edges look intact
  mild: slight flattening on one or two teeth
  moderate: flattening across several teeth
  notable: heavy flattening or dentin-looking wear
- discoloration: none | mild | moderate | notable
  none: even, reasonably white/ivory color
  mild: slight yellowing or a small stain
  moderate: obvious staining on several teeth
  notable: heavy brown/yellow stain across the smile
Be conservative. If unsure, choose the lower severity.
"""


def _iter_images(root: Path) -> list[Path]:
    return [
        path
        for path in root.rglob("*")
        if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    ]


def collect_pool() -> list[Path]:
    pool: list[Path] = []
    omni = find_omni_root()
    if omni is not None:
        pool.extend(_iter_images(omni / "train"))
        if len(pool) < 80:
            pool.extend(_iter_images(omni))
    if MOUTHCARE_DIR.exists():
        images_dir = MOUTHCARE_DIR / "images"
        pool.extend(_iter_images(images_dir if images_dir.exists() else MOUTHCARE_DIR))
    unique: dict[str, Path] = {}
    for path in pool:
        unique[str(path.resolve())] = path
    return list(unique.values())


def already_labeled() -> set[str]:
    done: set[str] = set()
    if not DISTILL_PATH.exists():
        return done
    for line in DISTILL_PATH.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        row = json.loads(line)
        done.add(row["path"])
    return done


def label_image(client: OpenAI, path: Path) -> dict[str, str]:
    import base64

    image = Image.open(path).convert("RGB")
    image.thumbnail((768, 768))
    buffer = BytesIO()
    image.save(buffer, format="JPEG", quality=80)
    b64 = base64.b64encode(buffer.getvalue()).decode("ascii")
    response = client.chat.completions.create(
        model=DISTILL_MODEL,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"{PROMPT}\nReturn only JSON like {{\"wear\":\"none\",\"discoloration\":\"mild\"}}.",
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                    },
                ],
            }
        ],
    )
    text = response.choices[0].message.content or "{}"
    parsed = json.loads(text)
    wear = parsed.get("wear", "none")
    stain = parsed.get("discoloration", "none")
    if wear not in SEVERITIES:
        wear = "none"
    if stain not in SEVERITIES:
        stain = "none"
    return {"wear": wear, "discoloration": stain}


def main() -> None:
    load_dotenv()
    client = OpenAI()
    pool = collect_pool()
    if not pool:
        raise SystemExit("No images found for distillation. Download OMNI or MouthCare first.")

    rng = random.Random(RANDOM_SEED)
    rng.shuffle(pool)
    done = already_labeled()
    remaining = [path for path in pool if str(path) not in done][:SAMPLE_COUNT]
    print(f"Labelling {len(remaining)} images (already have {len(done)}) with {DISTILL_MODEL}")

    DISTILL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DISTILL_PATH.open("a", encoding="utf-8") as handle:
        for index, path in enumerate(remaining, start=1):
            try:
                labels = label_image(client, path)
            except Exception as exc:
                print(f"[{index}/{len(remaining)}] FAIL {path.name}: {exc}")
                continue
            row = {"path": str(path), **labels}
            handle.write(json.dumps(row) + "\n")
            handle.flush()
            print(f"[{index}/{len(remaining)}] {path.name}: wear={labels['wear']} stain={labels['discoloration']}")


if __name__ == "__main__":
    main()
