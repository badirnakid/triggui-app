#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🛡️ PUERTA DE CALIDAD — corre al final del job `generar`, ANTES del commit. Si una edición del run está coja,
el run FALLA y NO se publica nada (mejor una edición que llega tarde que una que llega rota).

DURO (rompe el run): activos base faltantes · portada placeholder o < 380 px · sin melodía (o sin su página/OG)
                     · adulto sin video (o sin su página/OG) · adulto sin gemelo EN.
SUAVE (solo avisa):  melodías < 3 · videos < 3 · portada < 600 px.

Uso: python3 scripts/puerta-calidad.py [--catalogo=contenido.json] [--base=public/t] [--kids]
Lee los libros del run de /tmp/triggui-batch.jsonl o /tmp/triggui-book.json.
"""
import os, sys, json, re, unicodedata
ARGS = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:]}
KIDS = bool(ARGS.get("--kids"))
CAT = ARGS.get("--catalogo") or ("contenido_kids.json" if KIDS else "contenido.json")
BASE = ARGS.get("--base") or ("public/kids/t" if KIDS else "public/t")
sg = lambda t: re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', t).encode('ascii', 'ignore').decode().lower())).strip('-')

def es_placeholder(ruta):
    try:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from es_placeholder import es_placeholder as f
        return f(open(ruta, "rb").read()) == 1
    except Exception:
        return False

def ancho(ruta):
    try:
        from PIL import Image
        return Image.open(ruta).size[0]
    except Exception:
        return 0

libros = []
for ruta in ("/tmp/triggui-batch.jsonl", "/tmp/triggui-book.json"):
    if os.path.exists(ruta):
        for l in open(ruta, "r", encoding="utf-8").read().splitlines():
            try:
                o = json.loads(l.strip()) if l.strip() else None
            except Exception:
                o = None
            if o and o.get("titulo"):
                libros.append(o)
if not libros:
    print("🛡️ puerta: sin libros en el run (nada que verificar)"); sys.exit(0)
try:
    cat = json.load(open(CAT, encoding="utf-8")).get("libros") or []
except Exception as e:
    print("🔴 puerta: no pude leer %s: %s" % (CAT, e)); sys.exit(1)

duros, suaves, ok = [], [], []
for o in libros:
    tit = o["titulo"]; slug = o.get("slug") or sg(tit)
    b = next((x for x in cat if x.get("_slug") == slug), None) or next((x for x in cat if sg(x.get("titulo", "")) == sg(tit)), None)
    d = os.path.join(BASE, slug)
    D, S = [], []
    if not b:
        D.append("no está en el catálogo (%s)" % CAT)
    for f in (["index.html", "og.jpg", "tarjeta.png", "portada.jpg"] + ([] if KIDS else ["en/index.html", "og_en.jpg"])):
        if not os.path.exists(os.path.join(d, f)):
            D.append("falta %s" % f)
    p = os.path.join(d, "portada.jpg")
    if os.path.exists(p):
        if es_placeholder(p):
            D.append("portada.jpg es PLACEHOLDER (Google sin portada): la escalera debió caer a Apple o a la Colección Triggui")
        w = ancho(p)
        if w and w < 380:
            D.append("portada.jpg de %d px (mínimo 380)" % w)
        elif w and w < 600:
            S.append("portada de %d px (ideal ≥600)" % w)
    if b:
        nm = len([c for c in ((b.get("_musica") or {}).get("candidatos") or []) if c.get("preview")])
        if nm == 0:
            D.append("sin melodía (jamás silencio)")
        else:
            if nm < 3:
                S.append("solo %d melodía(s) (ideal 3)" % nm)
            if not (os.path.exists(os.path.join(d, "pieza", "index.html")) and os.path.exists(os.path.join(d, "pieza_og.jpg"))):
                D.append("melodía sin página/OG (pieza/)")
            for i in range(1, min(nm, 3)):
                if not (os.path.exists(os.path.join(d, "pieza", str(i), "index.html")) and os.path.exists(os.path.join(d, "pieza_og_%d.jpg" % i))):
                    S.append("melodía %d sin subpágina/OG" % i)
        if not KIDS:
            nv = len([v for v in ((b.get("_video") or {}).get("candidatos") or []) if v.get("id")])
            if nv == 0:
                D.append("sin video (el resolutor no encontró nada anclado ni por autor ni por tema)")
            else:
                if nv < 3:
                    S.append("solo %d video(s) (ideal 3)" % nv)
                if not (os.path.exists(os.path.join(d, "video", "index.html")) and os.path.exists(os.path.join(d, "video_og.jpg"))):
                    D.append("video sin página/OG (video/)")
            if not ((b.get("tarjeta_en") or {}).get("titulo")):
                D.append("sin gemelo EN (tarjeta_en)")
            if len(b.get("colores") or []) < 4 or len(b.get("textColors") or []) < 4:
                D.append("sin 4 colores/textColors (bloques, correo)")
    if D:
        duros.append((tit, slug, D))
    if S:
        suaves.append((tit, slug, S))
    if not D:
        ok.append(tit)

lineas = ["## 🛡️ Puerta de calidad"]
for tit, slug, D in duros:
    lineas.append("### 🔴 %s (%s) — NO SE PUBLICA" % (tit, slug)); lineas += ["- " + x for x in D]
for tit, slug, S in suaves:
    lineas.append("### 🟡 %s (%s) — avisos" % (tit, slug)); lineas += ["- " + x for x in S]
for tit in ok:
    lineas.append("- 🟢 %s: completa" % tit)
txt = "\n".join(lineas)
print(txt)
if os.environ.get("GITHUB_STEP_SUMMARY"):
    with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
        f.write(txt + "\n")
if duros:
    print("\n🔴 puerta de calidad: %d edición(es) coja(s). El run falla y NO se publica. Corrige y vuelve a correr." % len(duros)); sys.exit(1)
print("\n✅ puerta de calidad: todas las ediciones del run están completas")
