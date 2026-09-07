#!/usr/bin/env python3
# 🎧 build-pieza-og.py — OG de la pieza (1200×630) para una edición: HTML (scripts/templates/og-pieza.html) → captura con Playwright.
# Uso: python3 scripts/build-pieza-og.py <ruta_catalogo.json> <slug> <out_dir>   (toma _musica.candidatos[0] del libro cuyo _slug == slug)
import sys, json, html, asyncio, re
from playwright.async_api import async_playwright
LOGO = "https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/trigguiletrasblanco2.png"
def esc(s): return html.escape(str(s or ""), quote=True)
async def render(libro, out_path):
    """out_path = <out_dir>/pieza_og.jpg; escribe también pieza_og_1.jpg y pieza_og_2.jpg (una por candidata)."""
    cands = [c for c in ((libro.get("_musica") or {}).get("candidatos") or []) if c.get("preview")][:3]
    if not cands: return False
    col = libro.get("colores") or []; a = col[0] if len(col) > 0 else "#E8A838"; b = col[1] if len(col) > 1 else (col[0] if col else "#FF6B4A")
    base = open("scripts/templates/og-pieza.html", encoding="utf-8").read()
    import os
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(viewport={"width": 1200, "height": 630})
        for i, c in enumerate(cands):
            art = (c.get("art") or "").replace("100x100bb", "600x600bb")
            art_tag = f'<img class="art" src="{esc(art)}" alt="">' if art else '<div class="art-fallback">🎧</div>'
            t = (base.replace("{{ACCENT}}", esc(a)).replace("{{ACCENT2}}", esc(b)).replace("{{ART_TAG}}", art_tag)
                  .replace("{{CLASE}}", " larga" if len(c.get("cancion", "")) > 40 else "").replace("{{CANCION}}", esc(c.get("cancion", "")[:110])).replace("{{ARTISTA}}", esc(c.get("artista", "")[:80]))
                  .replace("{{PIE}}", esc(c.get("pie", "")[:220])).replace("{{LOGO}}", LOGO).replace("{{LIBRO}}", esc(libro.get("titulo", ""))))
            await pg.set_content(t, wait_until="networkidle"); await pg.wait_for_timeout(250)
            dest = out_path if i == 0 else out_path.replace("pieza_og.jpg", f"pieza_og_{i}.jpg")
            await pg.screenshot(path=dest, type="jpeg", quality=86, clip={"x": 0, "y": 0, "width": 1200, "height": 630})
        await br.close()
    return True
def main():
    cat, slug, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    libros = json.load(open(cat, encoding="utf-8"))["libros"]
    libro = next((l for l in libros if l.get("_slug") == slug), None)
    if not libro: print("sin libro para", slug); sys.exit(2)
    ok = asyncio.run(render(libro, f"{out_dir}/pieza_og.jpg")); print(("✅ " if ok else "— sin pieza ") + slug)
if __name__ == "__main__": main()
