#!/usr/bin/env python3
# 🎬 build-video-og.py — OG del video (1200×630): miniatura de YouTube + título + canal, sobre el degradado de la edición.
# Uso: python3 scripts/build-video-og.py <catalogo.json> <slug> <out_dir>
import sys, json, html, asyncio, urllib.request
from playwright.async_api import async_playwright
LOGO = "https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/trigguiletrasblanco2.png"
def esc(s): return html.escape(str(s or ""), quote=True)
def thumb(vid):
    for q in ("maxresdefault", "hqdefault"):
        u = f"https://i.ytimg.com/vi/{vid}/{q}.jpg"
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=8)
            if r.status == 200 and int(r.headers.get("Content-Length") or 0) > 2000: return u
        except Exception: pass
    return f"https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
async def render(libro, out_path):
    """out_path = <out_dir>/video_og.jpg; escribe también video_og_1.jpg y video_og_2.jpg (uno por candidato)."""
    vc = [x for x in ((libro.get("_video") or {}).get("candidatos") or []) if x.get("id")][:3]
    if not vc: return False
    col = libro.get("colores") or []; a = col[0] if col else "#E8A838"; b = col[1] if len(col) > 1 else a
    base = open("scripts/templates/og-video.html", encoding="utf-8").read()
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(viewport={"width": 1200, "height": 630})
        for i, v in enumerate(vc):
            tit = v.get("titulo", "")
            t = (base.replace("{{ACCENT}}", esc(a)).replace("{{ACCENT2}}", esc(b)).replace("{{THUMB}}", thumb(v["id"]))
                  .replace("{{CLASE}}", " larga" if len(tit) > 60 else "").replace("{{TITULO}}", esc(tit[:140])).replace("{{CANAL}}", esc(v.get("canal", "")))
                  .replace("{{LOGO}}", LOGO).replace("{{LIBRO}}", esc(libro.get("titulo", ""))))
            await pg.set_content(t, wait_until="networkidle"); await pg.wait_for_timeout(250)
            dest = out_path if i == 0 else out_path.replace("video_og.jpg", f"video_og_{i}.jpg")
            await pg.screenshot(path=dest, type="jpeg", quality=86, clip={"x": 0, "y": 0, "width": 1200, "height": 630})
        await br.close()
    return True
if __name__ == "__main__":
    cat, slug, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
    libro = next((l for l in json.load(open(cat, encoding="utf-8"))["libros"] if l.get("_slug") == slug), None)
    if not libro: print("sin libro para", slug); sys.exit(2)
    print(("✅ " if asyncio.run(render(libro, f"{out_dir}/video_og.jpg")) else "— sin video ") + slug)
