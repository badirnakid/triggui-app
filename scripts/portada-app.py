#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🖼️ PORTADA DE LA APP (C292 · 1 de noviembre de 2026) — cada libro del catálogo lleva su portada verificada,
propia y ligera, para que la app jamás enseñe un hueco, un texto o una portada a medio pintar.

Por cada libro del catálogo:
  · `portada_app` vigente (salió de la misma `portada` y sus archivos están en disco) → no se toca.
  · `portada` http(s) → baja la mejor versión de ESA MISMA imagen (Apple a 3000 px, el original de Open Library,
    Google a 1600 px; una versión mayor solo se acepta si su huella coincide con la de la original), la verifica
    (abre, no es placeholder, ≥ 280 px de ancho, proporción de libro) y escribe en public/portadas/ sus versiones
    WebP de 640 y 1280 px de ancho (nunca más anchas que el original; Lanczos, calidad 92, método 6, en sRGB).
    El nombre lleva el sello del contenido: un archivo jamás cambia, así que se guarda en caché para siempre.
  · `portada` vacía o `data:` (portada de texto) → {"estado": "sin_portada"}: la app no elige ese libro hasta que
    su `portada` cambie. Placeholder, diminuta o sin proporción de libro → lo mismo, pero se vuelve a intentar cada
    30 días (la fuente puede mejorar).
  · Descarga fallida (se reintenta una vez al final) → no escribe nada (la app usa `portada` como antes), lo reporta y
    deja la lista en la marca (TRIGGUI_PORTADA_APP_MARCA, por omisión /tmp/triggui-portada-app.json) para que la
    puerta de calidad lo trate como aviso y no como falla: la siguiente corrida lo vuelve a intentar.

La verificación hecha a mano (--decisiones) se aplica sola a cada libro que aún no tenga su `portada_app` vigente y cuya
`portada` siga siendo la que se verificó (o la ya corregida). Para deshacer una decisión no basta con regresar la
`portada`: hay que editar el archivo de decisiones. Los libros se reconocen por slug y título (únicos entre adultos y
Kids el 1 nov 2026); si un día se repitieran, `de_antes` impide aplicar una decisión a un libro con otra portada.

Uso:
  python3 scripts/portada-app.py --catalogo=contenido.json
  python3 scripts/portada-app.py --catalogo=contenido.json --decisiones=docs/portadas-verificadas-2026-11-01.json
  python3 scripts/portada-app.py --catalogo=contenido.json --verificar      (solo revisa; sale 1 si algo falta)
Opciones: --dir=public/portadas  --url=https://app.triggui.com/portadas
"""
import hashlib, io, json, os, re, sys, time, unicodedata, urllib.error, urllib.request
from datetime import datetime, timezone

ARGS = {a.split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:]}
CAT = ARGS.get("--catalogo") or "contenido.json"
DIR = ARGS.get("--dir") or "public/portadas"
URL = (ARGS.get("--url") or "https://app.triggui.com/portadas").rstrip("/")
ANCHOS = (640, 1280)          # 640: teléfonos, tabletas y laptops · 1280: pantallas grandes (hasta 6K)
CALIDAD, METODO = 92, 6
VERSION = b"portada-app-v1"   # cambia si cambian los anchos o la calidad: renombra todos los archivos
MIN_ANCHO = 280
HOY = datetime.now(timezone.utc).strftime("%Y-%m-%d")
REINTENTO_DIAS = 30           # un sin_portada automático (placeholder, diminuta, proporción) se reintenta pasado este plazo
MARCA = os.environ.get("TRIGGUI_PORTADA_APP_MARCA") or "/tmp/triggui-portada-app.json"
UA = {"User-Agent": "Mozilla/5.0 (compatible; Triggui portada-app)"}

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from es_placeholder import es_placeholder
except Exception:
    def es_placeholder(datos):
        return 0

sg = lambda t: re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', t or '').encode('ascii', 'ignore').decode().lower())).strip('-')


def huella_texto(s):
    return hashlib.sha1((s or "").encode("utf-8")).hexdigest()[:12]


def slug_de(b):
    s = re.sub(r"[^a-z0-9-]+", "-", str(b.get("_slug") or sg(b.get("titulo", ""))).lower())
    return re.sub(r"-+", "-", s).strip("-")[:60].strip("-") or "libro"


def nombres(pa):
    """Nombres de archivo de una portada_app (de src y srcset)."""
    out = []
    for u in [pa.get("src") or ""] + [x.strip().split(" ")[0] for x in (pa.get("srcset") or "").split(",") if x.strip()]:
        n = u.rsplit("/", 1)[-1]
        if n and n not in out:
            out.append(n)
    return out


def vigente(b):
    pa = b.get("portada_app")
    if not isinstance(pa, dict) or pa.get("de") != huella_texto(b.get("portada")):
        return False
    if pa.get("estado") == "sin_portada":
        if pa.get("auto"):
            try:
                dias = (datetime.now(timezone.utc).date() - datetime.strptime(str(pa.get("fecha")), "%Y-%m-%d").date()).days
            except Exception:
                dias = REINTENTO_DIAS
            return dias < REINTENTO_DIAS
        return True
    if not str(pa.get("src") or "").startswith("http"):
        return False
    return all(os.path.exists(os.path.join(DIR, n)) for n in nombres(pa))


def candidatas(u):
    """La misma imagen en versiones más grandes, de mayor a menor esperanza (sin la original)."""
    v = []
    if "mzstatic.com" in u:
        v.append(re.sub(r"/\d+x\d+(bb|cc|-\d+)?\.(jpg|jpeg|png|webp)$", "/3000x3000bb.jpg", u, flags=re.I))
    if "covers.openlibrary.org" in u:
        v.append(re.sub(r"-(S|M|L)\.jpg$", ".jpg", u))
    if "images-amazon.com" in u or "media-amazon.com" in u:
        v.append(re.sub(r"\._[^/]*_\.(jpg|png)$", r".\1", u))
    if "books.google" in u:
        base = re.sub(r"&(zoom|fife|edge)=[^&]*", "", u)
        v += [base + "&zoom=0&fife=w1600", base + "&fife=w1600"]
    out = []
    for x in v:
        if x != u and x not in out:
            out.append(x)
    return out


def bajar(url, intentos=3):
    for k in range(intentos):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                datos = r.read(25_000_001)
            return datos if 0 < len(datos) <= 25_000_000 else None
        except urllib.error.HTTPError as e:
            if 400 <= e.code < 500 and e.code != 429:
                return None
        except Exception:
            pass
        if k < intentos - 1:
            time.sleep(1.5 * (k + 1))
    return None


def abrir(datos):
    from PIL import Image, ImageOps
    im = Image.open(io.BytesIO(datos))
    im.load()
    try:
        im = ImageOps.exif_transpose(im)
    except Exception:
        pass
    return im


def dhash(im):
    from PIL import Image
    px = im.convert("L").resize((9, 8), Image.LANCZOS).tobytes()
    bits = 0
    for y in range(8):
        for x in range(8):
            bits = (bits << 1) | (1 if px[y * 9 + x] > px[y * 9 + x + 1] else 0)
    return bits


def a_srgb(im):
    """Colores tal como se ven hoy: aplica el perfil ICC si lo trae y deja la imagen en sRGB (RGB o RGBA)."""
    from PIL import ImageCms
    icc = im.info.get("icc_profile")
    if im.mode == "P":
        im = im.convert("RGBA" if "transparency" in im.info else "RGB")
    elif im.mode in ("LA", "PA", "La"):
        im = im.convert("RGBA")
    elif im.mode not in ("RGB", "RGBA", "CMYK", "L"):
        im = im.convert("RGB")
    if icc:
        try:
            modo = "RGBA" if im.mode == "RGBA" else "RGB"
            im = ImageCms.profileToProfile(im, ImageCms.ImageCmsProfile(io.BytesIO(icc)), ImageCms.createProfile("sRGB"),
                                           renderingIntent=0, outputMode=modo)
        except Exception:
            pass
    if im.mode == "RGBA" and im.getchannel("A").getextrema()[0] == 255:
        im = im.convert("RGB")
    if im.mode not in ("RGB", "RGBA"):
        im = im.convert("RGB")
    im.info.pop("icc_profile", None)
    return im


def escribir_variantes(datos, slug):
    """Escribe las versiones WebP que falten y devuelve (sello, ancho, alto, [(ancho, nombre)])."""
    from PIL import Image
    im = a_srgb(abrir(datos))
    W, H = im.size
    sello = hashlib.sha256(VERSION + datos).hexdigest()[:10]
    os.makedirs(DIR, exist_ok=True)
    hechos = []
    for a in sorted(set(min(x, W) for x in ANCHOS)):
        nombre = "%s.%s.%d.webp" % (slug, sello, a)
        ruta = os.path.join(DIR, nombre)
        if not os.path.exists(ruta):
            r = im if a == W else im.resize((a, max(1, round(H * a / W))), Image.LANCZOS)
            buf = io.BytesIO()
            r.save(buf, "WEBP", quality=CALIDAD, method=METODO)
            with open(ruta + ".tmp", "wb") as f:
                f.write(buf.getvalue())
            os.replace(ruta + ".tmp", ruta)
        hechos.append((a, nombre))
    return sello, W, H, hechos


def ficha(hechos, W, H, origen, de, fecha=None):
    pa = {"src": "%s/%s" % (URL, hechos[0][1])}
    if len(hechos) > 1:
        pa["srcset"] = ", ".join("%s/%s %dw" % (URL, n, a) for a, n in hechos)
    pa.update({"w": W, "h": H, "origen": origen, "de": de, "fecha": fecha or HOY})
    return pa


def sin_portada(b, motivo, fecha=None, auto=False):
    b["portada_app"] = {"estado": "sin_portada", "motivo": motivo, "de": huella_texto(b.get("portada")), "fecha": fecha or HOY}
    if auto:
        b["portada_app"]["auto"] = True   # se reintenta cada REINTENTO_DIAS
    return "sin_portada"


def procesar(b):
    por = str(b.get("portada") or "")
    if not re.match(r"^https?://", por, re.I):
        return sin_portada(b, "sin imagen real (vacía o portada de texto)")
    datos = bajar(por)
    if not datos:   # caída de la fuente (pasajera): una vieja jamás se queda; la app usa `portada` tal cual
        b.pop("portada_app", None)
        return "fallo"
    try:
        ref = abrir(datos)
    except Exception:   # la dirección responde, pero no con una imagen (una página, un error): no es pasajero
        return sin_portada(b, "la dirección no da una imagen", auto=True)
    mejor = (ref.size[0], datos, por)
    h0 = dhash(ref)
    for u in candidatas(por):
        d = bajar(u, intentos=2)
        if not d:
            continue
        try:
            im = abrir(d)
        except Exception:
            continue
        if im.size[0] > mejor[0] and bin(dhash(im) ^ h0).count("1") <= 10 and not es_placeholder(d):
            mejor = (im.size[0], d, u)
    w, datos, origen = mejor
    if es_placeholder(datos):
        return sin_portada(b, "placeholder (imagen genérica de «sin portada»)", auto=True)
    im = abrir(datos)
    W, H = im.size
    if W < MIN_ANCHO:
        return sin_portada(b, "diminuta (%d px de ancho; mínimo %d)" % (W, MIN_ANCHO), auto=True)
    if not (0.4 <= W / H <= 2.2):
        return sin_portada(b, "sin proporción de libro (%dx%d)" % (W, H), auto=True)
    sello, W, H, hechos = escribir_variantes(datos, slug_de(b))
    b["portada_app"] = ficha(hechos, W, H, origen, huella_texto(por))
    return "nueva"


def aplicar_decisiones(libros, ruta):
    """Verificación hecha a mano (1 nov 2026): cambia `portada` donde estaba equivocada y escribe `portada_app`
    con archivos que YA están en public/portadas (si falta uno, no se escribe nada). Es segura en cada run:
    una decisión solo se aplica a un libro sin `portada_app` vigente y cuya `portada` sigue siendo la que se
    verificó (`de_antes`) o la ya corregida; si alguien cambió la `portada` después, manda el paso normal."""
    dec = json.load(open(ruta, encoding="utf-8"))
    hechas, errores = 0, []
    indice = {(slug_de(x), x.get("titulo")): x for x in libros}   # (slug, título) es único en y entre catálogos
    for e in dec:
        b = indice.get((e["slug"], e["titulo"]))
        if b is None or vigente(b):
            continue
        nueva = e.get("portada_nueva")
        if huella_texto(b.get("portada")) not in ({e.get("de_antes")} | ({huella_texto(nueva)} if nueva else set())):
            continue
        if nueva:
            vieja = b.get("portada")
            b["portada"] = nueva
            if "portada_url" in b and b.get("portada_url") in (vieja, "", None):
                b["portada_url"] = nueva
        if e["estado"] == "sin_portada":
            sin_portada(b, e.get("motivo") or "verificada a mano: no hay portada real", e.get("fecha"))
        else:
            hechos = [(a, "%s.%s.%d.webp" % (e["slug"], e["sello"], a)) for a in e["anchos"]]
            faltan = [n for a, n in hechos if not os.path.exists(os.path.join(DIR, n))]
            if faltan:
                errores.append("%s: faltan %s" % (e["slug"], ", ".join(faltan)))
                continue
            b["portada_app"] = ficha(hechos, e["w"], e["h"], e["origen"], huella_texto(b.get("portada")), e.get("fecha"))
        hechas += 1
    return hechas, errores


def main():
    try:
        raw = open(CAT, encoding="utf-8").read()
        d = json.loads(raw)
        libros = d.get("libros") if isinstance(d, dict) else None
        assert isinstance(libros, list)
    except Exception as e:
        print("🔴 portada-app: no pude leer %s: %s" % (CAT, e))
        sys.exit(1)

    if ARGS.get("--verificar"):
        falta = [(b.get("titulo"), str(b.get("portada") or "")[:60]) for b in libros if not vigente(b)]
        sinp = sum(1 for b in libros if vigente(b) and b["portada_app"].get("estado") == "sin_portada")
        print("🖼️ %s: %d libros · %d con portada de la app · %d sin portada real · %d sin verificar"
              % (CAT, len(libros), len(libros) - sinp - len(falta), sinp, len(falta)))
        for t, p in falta:
            print("   🔴 %s · %s" % (t, p))
        sys.exit(1 if falta else 0)

    cuenta = {"vigente": 0, "nueva": 0, "sin_portada": 0, "fallo": 0}
    fallos, sinp = [], []
    if ARGS.get("--decisiones"):
        hechas, errores = aplicar_decisiones(libros, ARGS["--decisiones"])
        print("🖼️ decisiones aplicadas: %d" % hechas)
        if errores:
            print("🔴 portada-app: decisiones con archivos faltantes; no se escribe nada:\n   " + "\n   ".join(errores))
            sys.exit(1)
    def intentar(b):
        try:
            return procesar(b)
        except Exception as e:   # una imagen rara jamás tumba el run: ese libro queda como antes y se reporta
            print("⚠️ portada-app: «%s»: %s" % (b.get("titulo", "?"), e))
            b.pop("portada_app", None)
            return "fallo"
    pendientes = []
    for b in libros:
        if vigente(b):
            cuenta["vigente"] += 1
            continue
        r = intentar(b)
        if r == "fallo":
            pendientes.append(b)
            continue
        cuenta[r] += 1
        if r == "sin_portada":
            sinp.append("%s (%s)" % (b.get("titulo", "?"), b["portada_app"]["motivo"]))
    if pendientes:   # una caída pasajera de la fuente: un segundo intento, al final y con calma
        time.sleep(8)
        for b in pendientes:
            r = intentar(b)
            cuenta[r] += 1
            if r == "fallo":
                fallos.append(b)
            elif r == "sin_portada":
                sinp.append("%s (%s)" % (b.get("titulo", "?"), b["portada_app"]["motivo"]))
    try:   # la marca para la puerta de calidad: estos libros fallaron por la descarga, no por el guion
        with open(MARCA, "w", encoding="utf-8") as f:
            json.dump({"catalogo": CAT, "fallos": [slug_de(b) for b in fallos]}, f, ensure_ascii=False)
    except Exception as e:
        print("⚠️ portada-app: no pude escribir la marca %s: %s" % (MARCA, e))

    nuevo = json.dumps(d, ensure_ascii=False, indent=2) + ("\n" if raw.endswith("\n") else "")
    if nuevo != raw:
        with open(CAT + ".tmp", "w", encoding="utf-8") as f:
            f.write(nuevo)
        os.replace(CAT + ".tmp", CAT)
    lineas = ["## 🖼️ Portada de la app (%s)" % CAT,
              "- vigentes: %d · nuevas: %d · sin portada real: %d · descarga fallida: %d"
              % (cuenta["vigente"], cuenta["nueva"], cuenta["sin_portada"], cuenta["fallo"])]
    lineas += ["- ⚪ sin portada real (no aparece en la app): " + x for x in sinp]
    lineas += ["- 🟡 descarga fallida dos veces (la app usa `portada` tal cual; la siguiente corrida reintenta): " + b.get("titulo", "?") for b in fallos]
    txt = "\n".join(lineas)
    print(txt)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write(txt + "\n")


if __name__ == "__main__":
    main()
