#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔬 AGENTE REVISOR — Triggui (S7 Ritual de Mantenimiento · auditoría técnica)

Corre en paralelo y cada cierto tiempo (jueves 9 AM CDMX) o bajo demanda. NO implementa nada:
lee los repos y escribe sus hallazgos en docs/AUDIT_REPORT.md para que Badir decida qué aplicar.

Cada hallazgo lleva: ID · severidad (🔴 🟠 🟡) · ubicación exacta · impacto real · propuesta concreta.
Categorías (8): Eficiencia · Robustez · Idempotencia · Seguridad · Costo · Trazabilidad · UX del operador ·
Consistencia semántica. También marca los 🟢 (lo que está bien hecho) para no perderlo en refactorizaciones.

Determinista, sin LLM, sin escritura fuera de docs/. Uso:
  python3 scripts/agente-revisor.py [--content=ruta/triggui-content] [--sin-red] [--out=docs/AUDIT_REPORT.md]
"""
import os, re, sys, json, glob, hashlib, subprocess, tempfile, datetime, urllib.request
from html.parser import HTMLParser

class _Scripts(HTMLParser):
    """Extrae scripts inline con un parser real (una regex se corta si un comentario JS menciona <script>)."""
    def __init__(self):
        super().__init__(convert_charrefs=False); self.en = False; self.omitir = False; self.buf = []; self.out = []
    def handle_starttag(self, tag, attrs):
        if tag == "script":
            a = dict(attrs); self.en = True; self.buf = []
            self.omitir = bool(a.get("src")) or ("json" in str(a.get("type") or "")) or ("module" in str(a.get("type") or "") and False)
    def handle_endtag(self, tag):
        if tag == "script" and self.en:
            if not self.omitir: self.out.append("".join(self.buf))
            self.en = False
    def handle_data(self, d):
        if self.en: self.buf.append(d)
    def handle_comment(self, d):
        if self.en: self.buf.append("<!--" + d + "-->")

def scripts_inline(html):
    p = _Scripts(); p.feed(html or ""); return p.out

APP = os.path.abspath(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ARGS = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:]}
CONTENT = os.path.abspath(ARGS.get("--content") or os.path.join(APP, "triggui-content"))
SIN_RED = bool(ARGS.get("--sin-red"))
OUT = os.path.join(APP, ARGS.get("--out") or "docs/AUDIT_REPORT.md")
HOY = datetime.date.today().isoformat()

H = []      # hallazgos: dict(id, sev, cat, donde, impacto, propuesta)
OK = []     # 🟢
STATS = {}

def hallazgo(hid, sev, cat, donde, impacto, propuesta):
    H.append({"id": hid, "sev": sev, "cat": cat, "donde": donde, "impacto": impacto, "propuesta": propuesta})

def bien(txt):
    OK.append(txt)

def leer(p):
    try:
        with open(p, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception:
        return ""

def carga(p):
    try:
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f).get("libros") or []
    except Exception as e:
        hallazgo("C0", "🔴", "Robustez", p, "el catálogo no se pudo leer: %s" % e, "revisar el JSON (¿commit a medias?)")
        return []

# ═══════════════════════════════ A · CATÁLOGO ═══════════════════════════════
def auditar_catalogo():
    ad = carga(os.path.join(CONTENT, "contenido.json"))
    ma = carga(os.path.join(CONTENT, "contenido_manual.json"))
    ki = carga(os.path.join(CONTENT, "contenido_kids.json"))
    STATS["libros_adulto"], STATS["libros_kids"] = len(ad), len(ki)
    eds = [b for b in ad if b.get("_slug")]
    edk = [b for b in ki if b.get("_slug")]
    STATS["ediciones_adulto"], STATS["ediciones_kids"] = len(eds), len(edk)

    def n_mus(b):
        return len([c for c in ((b.get("_musica") or {}).get("candidatos") or []) if c.get("preview")])
    def n_vid(b):
        return len([v for v in ((b.get("_video") or {}).get("candidatos") or []) if v.get("id")])

    pocas = [(b["titulo"], n_mus(b)) for b in eds if n_mus(b) < 3]
    if pocas:
        hallazgo("C1", "🟠", "Consistencia semántica", "contenido.json · %d ediciones" % len(pocas),
                 "la sala y el correo prometen elegir entre 3 melodías; estas tienen %s" % ", ".join("«%s»=%d" % (t[:28], n) for t, n in pocas[:8]) + (" …" if len(pocas) > 8 else ""),
                 "disparar musica-uno con `*+` (completar ediciones a 3, conserva lo existente); el pipeline completa 10 por corrida")
    else:
        bien("todas las ediciones adultas tienen ≥3 melodías con preview")
    pocas_k = [(b["titulo"], n_mus(b)) for b in edk if n_mus(b) < 3]
    if pocas_k:
        hallazgo("C1k", "🟡", "Consistencia semántica", "contenido_kids.json · %d ediciones" % len(pocas_k),
                 "kids con menos de 3 melodías: %s" % ", ".join("«%s»=%d" % (t[:26], n) for t, n in pocas_k[:6]),
                 "musica-uno con `kids:*+`")
    sin_v = [b["titulo"] for b in eds if n_vid(b) == 0]
    poco_v = [(b["titulo"], n_vid(b)) for b in eds if 0 < n_vid(b) < 3]
    if sin_v:
        hallazgo("C2", "🟠", "Consistencia semántica", "contenido.json · %d ediciones" % len(sin_v),
                 "ediciones adultas sin video: %s" % ", ".join(t[:28] for t in sin_v[:8]),
                 "correr `video-uno.yml` / paso de videos del pipeline para esas ediciones")
    if poco_v:
        hallazgo("C2b", "🟡", "Consistencia semántica", "contenido.json · %d ediciones" % len(poco_v),
                 "menos de 3 videos: %s" % ", ".join("«%s»=%d" % (t[:26], n) for t, n in poco_v[:8]), "resolver videos con `--completar` (mismo patrón que música)")
    mudas = [b["titulo"] for b in eds + edk if n_mus(b) == 0]
    if mudas:
        hallazgo("C3", "🔴", "Robustez", "catálogos · %d ediciones" % len(mudas), "ediciones MUDAS (jamás silencio violado): %s" % ", ".join(mudas[:6]), "musica-uno `+` (rescate) y verificar el pool de emergencia")
    else:
        bien("jamás silencio: 0 ediciones mudas (adulto + kids)")
    zoom1 = [b["titulo"] for b in eds if "zoom=1" in str(b.get("portada_url") or b.get("portada") or "")]
    if zoom1:
        hallazgo("C4", "🟡", "Consistencia semántica", "contenido.json", "portadas Google zoom=1 (doctrina: inaceptable): %s" % ", ".join(zoom1[:6]), "buscar hi-res (Apple/Google zoom=0&fife=w1200) y `reconstruir` un libro por corrida")
    else:
        bien("ninguna edición viva con portada Google zoom=1")
    sin_col = [b["titulo"] for b in eds + edk if len(b.get("colores") or []) < 4 or len(b.get("textColors") or []) < 4]
    if sin_col:
        hallazgo("C5", "🟠", "Robustez", "catálogos", "sin 4 colores/textColors (las cuatro puertas del correo y los bloques dependen de ellos): %s" % ", ".join(sin_col[:6]), "re-generar paleta (nucleus) para esas fichas")
    else:
        bien("todas las ediciones traen 4 colores + 4 textColors")
    sin_en = [b["titulo"] for b in eds if not ((b.get("tarjeta_en") or {}).get("titulo"))]
    if sin_en:
        hallazgo("C6", "🟡", "Consistencia semántica", "contenido.json", "ediciones sin gemelo EN (tarjeta_en): %s" % ", ".join(sin_en[:6]), "correr el nucleus EN para esas ediciones (o aceptar que son legado)")
    else:
        bien("todas las ediciones adultas tienen tarjeta_en")
    # contaminación LLM (marcadores)
    rx = re.compile(r"```|\bAquí tienes\b|\bHere is\b|\"phrase\"\s*:|\{\{|\}\}")
    conta = []
    for b in eds + edk:
        txt = " ".join(str(x) for x in (b.get("frases") or []) + [(b.get("tarjeta") or {}).get("parrafoTop", ""), (b.get("tarjeta") or {}).get("parrafoBot", "")])
        if rx.search(txt):
            conta.append(b["titulo"])
    if conta:
        hallazgo("C7", "🔴", "Robustez", "catálogos", "marcadores de contaminación LLM en frases/tarjeta: %s" % ", ".join(conta[:6]), "correr `sanitize-catalog.mjs` y re-hornear")
    else:
        bien("0 marcadores de contaminación LLM en frases y tarjetas")
    pool = [b["titulo"] for b in eds if str((b.get("_musica") or {}).get("juez", "")).startswith("pool-emergencia")]
    if pool:
        hallazgo("C8", "🟡", "Costo", "contenido.json", "ediciones que aún suenan con el cajón de emergencia (no con música propia): %s" % ", ".join(pool[:6]), "`*+` completar les buscará música propia manteniendo el cajón como respaldo")
    # dedupe de slugs
    slugs = [b["_slug"] for b in eds]
    dup = set(s for s in slugs if slugs.count(s) > 1)
    if dup:
        hallazgo("C9", "🔴", "Idempotencia", "contenido.json", "slugs duplicados: %s" % ", ".join(dup), "fusionar fichas; el builder escribe una carpeta por slug")
    else:
        bien("slugs de edición únicos")
    return eds, edk

# ═══════════════════════════════ B · SUPERFICIES ═══════════════════════════════
def nodeok(js):
    f = tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8"); f.write(js); f.close()
    r = subprocess.run(["node", "--check", f.name], capture_output=True, text=True); os.unlink(f.name)
    return r.returncode == 0, (r.stderr or "").strip().splitlines()[-1:] if r.returncode else ""

def auditar_superficies(eds, edk):
    faltan, pz_mal, vd_mal, js_mal = [], [], [], []
    for base, lista in (("public/t", eds), ("public/kids/t", edk)):
        for b in lista:
            d = os.path.join(APP, base, b["_slug"])
            req = ["index.html", "en/index.html", "og.jpg", "og_en.jpg", "tarjeta.png", "portada.jpg"] if base == "public/t" else ["index.html", "og.jpg", "tarjeta.png", "portada.jpg"]
            for f in req:
                if not os.path.exists(os.path.join(d, f)):
                    faltan.append("%s/%s" % (b["_slug"], f))
            nm = len([c for c in ((b.get("_musica") or {}).get("candidatos") or []) if c.get("preview")][:3])
            for i in range(nm):
                pg = os.path.join(d, "pieza", str(i) if i else "", "index.html"); og = os.path.join(d, "pieza_og.jpg" if i == 0 else "pieza_og_%d.jpg" % i)
                if not os.path.exists(pg) or not os.path.exists(og):
                    pz_mal.append("%s/pieza/%s" % (b["_slug"], i or ""))
            if base == "public/t":
                nv = len([v for v in ((b.get("_video") or {}).get("candidatos") or []) if v.get("id")][:3])
                for i in range(nv):
                    pg = os.path.join(d, "video", str(i) if i else "", "index.html"); og = os.path.join(d, "video_og.jpg" if i == 0 else "video_og_%d.jpg" % i)
                    if not os.path.exists(pg) or not os.path.exists(og):
                        vd_mal.append("%s/video/%s" % (b["_slug"], i or ""))
            h = leer(os.path.join(d, "index.html"))
            for js in scripts_inline(h):
                ok, err = nodeok(js)
                if not ok:
                    js_mal.append(b["_slug"]); break
    if faltan:
        hallazgo("S1", "🔴", "Robustez", "public/ · %d activos" % len(faltan), "activos faltantes de ediciones vivas: %s" % ", ".join(faltan[:8]), "`🔁 Reconstruir` (un libro por corrida) para cada edición afectada")
    else:
        bien("activos base completos (index, en, og, og_en, tarjeta, portada) en las %d ediciones vivas" % (len(eds) + len(edk)))
    if pz_mal:
        hallazgo("S2", "🟠", "Consistencia semántica", "public/ · %d subpáginas" % len(pz_mal), "melodías del catálogo sin su página/OG propio: %s" % ", ".join(pz_mal[:8]), "re-hornear con build-editions.py + build-pieza-og.py (o `🔁 Reconstruir`)")
    else:
        bien("cada melodía del catálogo tiene su página y su OG (%d ediciones)" % (len(eds) + len(edk)))
    if vd_mal:
        hallazgo("S3", "🟠", "Consistencia semántica", "public/ · %d subpáginas" % len(vd_mal), "videos del catálogo sin su página/OG propio: %s" % ", ".join(vd_mal[:8]), "build-video-page.py + build-video-og.js para esas ediciones")
    else:
        bien("cada video del catálogo tiene su página y su OG")
    if js_mal:
        hallazgo("S4", "🔴", "Robustez", "public/t · %d ediciones" % len(js_mal), "scripts inline con error de sintaxis: %s" % ", ".join(js_mal[:6]), "re-hornear desde el template (node --check en cada script)")
    else:
        bien("node --check limpio en todos los scripts inline de las ediciones vivas")
    # paridad root/kids y sintaxis de superficies fijas
    a = hashlib.md5(open(os.path.join(APP, "public/index.html"), "rb").read()).hexdigest()
    k = hashlib.md5(open(os.path.join(APP, "public/kids/index.html"), "rb").read()).hexdigest()
    if a != k:
        hallazgo("S5", "🔴", "Idempotencia", "public/index.html vs public/kids/index.html", "paridad rota (kids debe ser copia byte a byte)", "`cp public/index.html public/kids/index.html` y commit")
    else:
        bien("paridad byte a byte public/index.html = public/kids/index.html")
    malos = []
    for f in ("public/index.html", "public/mi/index.html", "public/espiral/index.html"):
        for js in scripts_inline(leer(os.path.join(APP, f))):
            ok, _ = nodeok(js)
            if not ok:
                malos.append(f); break
    for f in ("public/radio.js", "public/espiral/spiral.js"):
        r = subprocess.run(["node", "--check", os.path.join(APP, f)], capture_output=True)
        if r.returncode:
            malos.append(f)
    if malos:
        hallazgo("S6", "🔴", "Robustez", ", ".join(malos), "error de sintaxis en superficie fija", "revisar el último commit que la tocó")
    else:
        bien("sintaxis limpia en app, /mi, /espiral, radio.js, spiral.js")
    # sitemap vs ediciones
    sm = leer(os.path.join(APP, "public/sitemap.xml"))
    fuera = [b["_slug"] for b in eds if ("/t/%s/" % b["_slug"]) not in sm]
    if fuera:
        hallazgo("S7", "🟡", "Trazabilidad", "public/sitemap.xml", "ediciones vivas fuera del sitemap: %s" % ", ".join(fuera[:6]), "regenerar sitemap (lo hace el builder)")
    else:
        bien("todas las ediciones adultas vivas están en el sitemap")

# ═══════════════════════════════ C · PIPELINE ═══════════════════════════════
def auditar_pipeline():
    for wf in sorted(glob.glob(os.path.join(APP, ".github/workflows/*.yml"))):
        y = leer(wf); nombre = os.path.basename(wf)
        loops = len(re.findall(r"for i in 1 2 3", y)); guards = len(re.findall(r'PUSH_OK" != "1"', y)) + len(re.findall(r'"\$PUSH_OK" != "1"', y))
        if loops and guards < loops:
            hallazgo("P1·" + nombre, "🔴", "Robustez", wf, "%d bucle(s) de push reintentan y NO fallan el run si las 3 fallan (R2: éxito mentiroso)" % (loops - guards), "envolver con PUSH_OK y `exit 1`")
        runs = len(re.findall(r"^\s+run: \|", y, re.M)); strict = len(re.findall(r"set -euo pipefail", y))
        if runs and strict < runs * 0.5 and nombre == "triggui.yml":
            hallazgo("P2·" + nombre, "🟡", "Robustez", wf, "solo %d de %d bloques run usan `set -euo pipefail`" % (strict, runs), "añadirlo a los bloques que ejecutan más de un comando")
        if re.search(r"run-name:[\s\S]{0,200}sentimiento", y):
            hallazgo("P3·" + nombre, "🟡", "Seguridad", wf, "run-name expone texto libre del usuario (S2)", "quitar `sentimiento` del run-name")
        if "playwright install" in y and "ms-playwright" not in y:
            hallazgo("P4·" + nombre, "🟠", "Eficiencia", wf, "Playwright se descarga en cada run (E2: 60–80 % del tiempo)", "actions/cache@v4 sobre ~/.cache/ms-playwright")
        if re.search(r"\$\{\{\s*secrets\.[A-Z_]+\s*\}\}", y) and re.search(r"echo .*secrets\.", y):
            hallazgo("P5·" + nombre, "🔴", "Seguridad", wf, "un `echo` imprime un secret", "quitar el echo")
    y = leer(os.path.join(APP, ".github/workflows/triggui.yml"))
    if 'PUSH_OK" != "1"' in y:
        bien("triggui.yml: todos los bucles de push fallan el run si no guardan (R2 cerrado)")
    if "ms-playwright" in y:
        bien("triggui.yml: caché de navegadores Playwright (E2 cerrado)")
    if not re.search(r"run-name:[\s\S]{0,200}sentimiento", y):
        bien("triggui.yml: run-name sin texto libre del usuario (S2 cerrado)")
    if "--completar-min" in y:
        bien("triggui.yml: el paso de música completa candidatas en cada corrida")

# ═══════════════════════════════ D · PRODUCCIÓN (red opcional) ═══════════════════════════════
def auditar_produccion(eds):
    if SIN_RED:
        return
    def head(u):
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, method="HEAD", headers={"User-Agent": "Mozilla/5.0 triggui-revisor"}), timeout=12)
            return r.status
        except Exception as e:
            return getattr(e, "code", 0)
    ultimo = eds[0]["_slug"] if eds else "rafa"
    urls = ["https://app.triggui.com/", "https://app.triggui.com/kids/", "https://app.triggui.com/mi/", "https://triggui.com/", "https://triggui.com/wa/",
            "https://app.triggui.com/t/%s/" % ultimo, "https://app.triggui.com/t/%s/pieza/" % ultimo, "https://app.triggui.com/t/%s/og.jpg" % ultimo]
    caidas = [u for u in urls if head(u) != 200]
    if caidas:
        hallazgo("D1", "🔴", "Robustez", ", ".join(caidas), "superficies en producción que no responden 200", "revisar el último deploy de Vercel")
    else:
        bien("producción responde 200 en app, kids, /mi, sitio, sala y la última edición (%s)" % ultimo)
    try:
        r = urllib.request.urlopen("https://script.google.com/macros/s/AKfycby6OJhLRDItCPo6SonyFeX48mA4OqPEd84evMj_ektG7RT67VOL3CmYpr2QrfcKAKFN0w/exec", timeout=20)
        t = r.read(300).decode("utf-8", "replace")
        m = re.search(r"Apps Script (V[\d.]+)", t)
        STATS["cartero"] = m.group(1) if m else "?"
        bien("cartero vivo (%s)" % STATS["cartero"])
    except Exception:
        hallazgo("D2", "🟠", "Robustez", "Apps Script cartero", "el endpoint no respondió", "revisar despliegue (Administrar implementaciones)")

# ═══════════════════════════════ INFORME ═══════════════════════════════
def escribir_informe():
    orden = {"🔴": 0, "🟠": 1, "🟡": 2}
    H.sort(key=lambda x: (orden.get(x["sev"], 9), x["id"]))
    tot = {s: sum(1 for x in H if x["sev"] == s) for s in ("🔴", "🟠", "🟡")}
    L = []
    L.append("# 🔬 AUDIT_REPORT — Agente revisor Triggui\n")
    L.append("**Fecha:** %s · **Modo:** solo sugerencias (nada se implementa solo) · **Hallazgos:** 🔴 %d · 🟠 %d · 🟡 %d · 🟢 %d\n" % (HOY, tot["🔴"], tot["🟠"], tot["🟡"], len(OK)))
    L.append("**Inventario:** %d libros adultos (%d ediciones) · %d libros kids (%d ediciones) · cartero %s\n" % (STATS.get("libros_adulto", 0), STATS.get("ediciones_adulto", 0), STATS.get("libros_kids", 0), STATS.get("ediciones_kids", 0), STATS.get("cartero", "—")))
    L.append("\n## Hallazgos\n")
    if not H:
        L.append("_Ninguno. Cero partículas fuera de lugar._\n")
    for x in H:
        L.append("### %s %s · %s\n- **Dónde:** %s\n- **Impacto:** %s\n- **Propuesta:** %s\n" % (x["sev"], x["id"], x["cat"], x["donde"], x["impacto"], x["propuesta"]))
    L.append("\n## 🟢 Lo que está bien hecho (no perderlo)\n")
    for o in OK:
        L.append("- %s" % o)
    L.append("\n## Para el «va» de Badir\n")
    props = [x for x in H if x["sev"] in ("🔴", "🟠")]
    if props:
        for x in props:
            L.append("- [ ] %s **%s** → %s" % (x["sev"], x["id"], x["propuesta"]))
    else:
        L.append("- nada urgente esta semana")
    L.append("\n---\n_Método: barrido determinista de catálogo (C), superficies (S), pipeline (P) y producción (D). Categorías: Eficiencia · Robustez · Idempotencia · Seguridad · Costo · Trazabilidad · UX del operador · Consistencia semántica._\n")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    hist = os.path.join(os.path.dirname(OUT), "AUDIT_HISTORY.md")
    linea = "| %s | 🔴 %d | 🟠 %d | 🟡 %d | 🟢 %d | %s |\n" % (HOY, tot["🔴"], tot["🟠"], tot["🟡"], len(OK), ", ".join(x["id"] for x in H if x["sev"] == "🔴") or "—")
    if not os.path.exists(hist):
        with open(hist, "w", encoding="utf-8") as f:
            f.write("# Historial del agente revisor\n\n| fecha | 🔴 | 🟠 | 🟡 | 🟢 | críticos |\n|---|---|---|---|---|---|\n")
    with open(hist, "a", encoding="utf-8") as f:
        f.write(linea)
    print("\n".join(L[:6])); print("… informe:", OUT)
    return tot

if __name__ == "__main__":
    eds, edk = auditar_catalogo()
    auditar_superficies(eds, edk)
    auditar_pipeline()
    auditar_produccion(eds)
    tot = escribir_informe()
    # el revisor nunca falla el run por hallazgos: informa. Solo falla si no pudo leer el catálogo.
    sys.exit(1 if any(x["id"] == "C0" for x in H) else 0)
