"""Gera as versões responsivas (WebP) das fotos em assets-src/ para public/img/.

Uso: python3 scripts/build-images.py
Fonte das fotos: acervo oficial publicado em barastor.com.br (wp-content/uploads).
"""
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
OUT = ROOT / "public" / "img"
OUT.mkdir(parents=True, exist_ok=True)

WIDTHS = [640, 1080, 1600, 2400]
manifest = {}

for f in sorted(SRC.glob("*.jpg")):
    im = ImageOps.exif_transpose(Image.open(f)).convert("RGB")
    w, h = im.size
    sizes = [x for x in WIDTHS if x < w] + [min(w, WIDTHS[-1])]
    sizes = sorted(set(sizes))
    for tw in sizes:
        th = round(h * tw / w)
        im.resize((tw, th), Image.LANCZOS).save(
            OUT / f"{f.stem}-{tw}.webp", "WEBP", quality=74, method=6
        )
    manifest[f.stem] = {"w": w, "h": h, "sizes": sizes}
    print(f.stem, w, h, sizes)

# Open Graph 1200x630
og = ImageOps.fit(
    ImageOps.exif_transpose(Image.open(SRC / "servico.jpg")).convert("RGB"),
    (1200, 630),
    centering=(0.5, 0.45),
)
og.save(ROOT / "public" / "og-astor.jpg", "JPEG", quality=82, optimize=True)

(ROOT / "src").mkdir(exist_ok=True)
(ROOT / "src" / "images.json").write_text(json.dumps(manifest, indent=2))
