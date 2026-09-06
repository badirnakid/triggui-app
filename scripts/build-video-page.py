#!/usr/bin/env python3
# 🎬 build-video-page.py — paso del pipeline tras resolver videos: escribe /t/<slug>/video/index.html (y la pieza si faltara).
# Lee /tmp/triggui-book.json (slug) y el catálogo con _video (contenido.json). Idempotente. Nunca rompe el pipeline.
import json, os, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from paginas_medios import escribir_video, escribir_pieza
cat = sys.argv[1] if len(sys.argv) > 1 else "contenido.json"
base = os.environ.get("BASE_URL", "https://app.triggui.com").rstrip("/")
out_base = os.environ.get("TRIGGUI_OUT_BASE", "public/t")
meta = json.load(open("/tmp/triggui-book.json", encoding="utf-8")); slug = meta.get("slug")
libros = json.load(open(cat, encoding="utf-8")).get("libros") or []
libro = next((l for l in libros if l.get("_slug") == slug), None) or next((l for l in libros if l.get("titulo") == meta.get("titulo")), None)
if not libro: print(f"ℹ️  sin libro para {slug}"); sys.exit(0)
out_dir = Path(out_base) / slug
v = escribir_video(libro, out_dir, slug, base); p = (not (out_dir / "pieza" / "index.html").exists()) and escribir_pieza(libro, out_dir, slug, base)
print(f"🎬 video: {'escrito' if v else 'sin video'} · 🎧 pieza: {'escrita' if p else 'ya existía o sin música'} · {out_dir}")
