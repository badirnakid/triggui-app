#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
resolve-videos.py v1.0 — 🎬 TOP-3 videos VETADOS por libro ("random pero controlado").

Vive en triggui-app/scripts/ (junto a build-editions.py). Lo corre triggui.yml
(job `generar`, paso "🎬 Resolver videos") cada lunes, y a mano la corrida inicial.

Por cada libro elegible sin candidatos: 1 search.list (8 resultados, 100 u) +
1 videos.list (1 u) = 101 u / libro. Puntúa (VETO canon v27) y guarda TOP-3 en:

  "_video": { "resuelto_el": "YYYY-MM-DD",
              "candidatos": [ { "id", "titulo", "canal", "dur" }, … ] }

El front (espiral) rota al azar entre los candidatos.

Garantías:
  · Idempotente: con candidatos → no toca. Sin candidatos → reintenta solo si pasaron
    ≥ --reintentar-dias (default 30) desde resuelto_el (no quema cuota cada lunes).
  · Un solo gasto por libro aunque haya varias rutas (caché por título|autor).
  · Escritura atómica (tmp → os.replace) y formato byte-idéntico a JSON.stringify(…,null,2).
  · No escribe un archivo si no hubo cambios. Verifica releyendo lo escrito.
  · id de video validado (^[A-Za-z0-9_-]{11}$) antes de guardarse (va a un iframe).
  · Cuota agotada / llave inválida / API deshabilitada: deja de buscar, guarda lo ya
    resuelto y sale 0 (el tren del lunes nunca se cae por el video).

Uso:
  YT_API_KEY=xxx python3 scripts/resolve-videos.py [--solo-ediciones] [--max=N]
      [--rutas=contenido.json,contenido_manual.json] [--reintentar-dias=30] [--dry-run]

  --solo-ediciones   solo libros con _edicion_numero ≥ 1
  --max=N            tope de BÚSQUEDAS (gasto) en esta corrida (default 999)
  --rutas=a,b        archivos a procesar (default: los que existan de contenido.json,
                     contenido_manual.json en el directorio actual)
  --dry-run          sin API y sin escribir: imprime el plan (qué buscaría y con qué query)
"""
import datetime
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

API = "https://www.googleapis.com/youtube/v3/"
ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
PALABRAS = ("entrevista", "interview", "talk", "charla", "conversat", "ted", "conferencia", "lecture")
UMBRAL = 4          # canon v27: pasan ≥ 4
TOP_N = 3           # canon v27: TOP-3
UNIDADES_X_LIBRO = 101


class ApiFatal(Exception):
    """Error que invalida TODA la corrida (cuota, llave, API apagada)."""


# ─────────────────────────────────────────────────────────────────── CLI ──
def _arg(nombre, default):
    pref = "--" + nombre + "="
    for a in sys.argv[1:]:
        if a.startswith(pref):
            return a[len(pref):]
    return default


def config(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    flags = set(a for a in argv if "=" not in a)
    kv = dict(a[2:].split("=", 1) for a in argv if a.startswith("--") and "=" in a)
    rutas = kv.get("rutas")
    if rutas:
        rutas = [r.strip() for r in rutas.split(",") if r.strip()]
    else:
        rutas = [p for p in ("contenido.json", "contenido_manual.json") if os.path.exists(p)]
    return {
        "key": os.environ.get("YT_API_KEY", "").strip(),
        "solo_ed": "--solo-ediciones" in flags,
        "dry": "--dry-run" in flags,
        "max": int(kv.get("max", "999")),
        "reintentar": int(kv.get("reintentar-dias", "30")),
        "rutas": rutas,
    }


# ─────────────────────────────────────────────────────────────────── API ──
def api(url):
    """GET JSON. Errores de cuota/llave/API → ApiFatal; el resto → Exception normal."""
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        cuerpo = ""
        try:
            cuerpo = e.read().decode("utf-8", "replace")
        except Exception:
            pass
        razon = ""
        try:
            err = json.loads(cuerpo).get("error", {})
            razon = (err.get("errors") or [{}])[0].get("reason") or err.get("status") or ""
        except Exception:
            razon = cuerpo[:120]
        fatal = e.code in (401,) or (
            e.code == 403 and razon in ("quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded",
                                         "accessNotConfigured", "forbidden", "PERMISSION_DENIED")
        ) or (e.code == 400 and razon in ("keyInvalid", "API_KEY_INVALID", "badRequest"))
        msg = "HTTP %d %s" % (e.code, razon or "(sin razón)")
        if fatal:
            raise ApiFatal(msg)
        raise Exception(msg)


def dur(iso):
    """ISO-8601 de YouTube (PT1H2M3S) → segundos. Sin match → 0."""
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mi * 60 + s


# ──────────────────────────────────────────────────────────────── VETO ──
def puntua(it, det, autor, tit):
    """Puntaje canon v27. Devuelve (puntos, duracion_s, anclado).
    anclado = el video menciona el apellido del autor o el título: sin ancla NO pasa,
    aunque sume ≥ 4 por 'entrevista' + duración (evita entrevistas ajenas)."""
    sn = it.get("snippet", {})
    t = ((sn.get("title") or "") + " " + (sn.get("description") or "")).lower()
    ape = autor.split()[-1].lower() if autor else ""
    p = 0
    ape_hit = bool(ape and ape in t)
    if ape_hit:
        p += 4
    if any(w in t for w in PALABRAS):
        p += 3
    tit_frag = tit.lower().split(":")[0][:18] if tit else ""
    tit_hit = bool(tit_frag and tit_frag in t)
    if tit_hit:
        p += 2
    d = dur(det.get("contentDetails", {}).get("duration"))
    if 360 <= d <= 5400:
        p += 2
    elif d < 180:
        p -= 3
    try:
        vistas = int(det.get("statistics", {}).get("viewCount", 0) or 0)
    except (TypeError, ValueError):
        vistas = 0
    if vistas > 50000:
        p += 1
    return p, d, (ape_hit or tit_hit)


def titulo_y_lang(b):
    idi = (b.get("idioma_original") or "es").lower()
    es = idi.startswith("es")
    tit = b.get("titulo_es" if es else "titulo_en") or b.get("titulo", "")
    return tit, ("es" if es else "en")


def query_de(b):
    tit, lang = titulo_y_lang(b)
    autor = b.get("autor", "")
    return ("%s %s %s" % (tit, autor, "entrevista" if lang == "es" else "interview")).strip(), lang


def resolver(b, key):
    """Devuelve lista TOP-3 (puede ser vacía). Lanza ApiFatal/Exception si la API falla."""
    tit, _ = titulo_y_lang(b)
    autor = b.get("autor", "")
    q, lang = query_de(b)
    su = (API + "search?part=snippet&type=video&maxResults=8&relevanceLanguage=" + lang
          + "&videoEmbeddable=true&safeSearch=strict&q=" + urllib.parse.quote(q) + "&key=" + key)
    items = api(su).get("items", [])
    items = [i for i in items if ID_RE.match(((i.get("id") or {}).get("videoId") or ""))]
    if not items:
        return []
    ids = ",".join(i["id"]["videoId"] for i in items)
    dets = {d.get("id"): d for d in api(API + "videos?part=contentDetails,statistics&id=" + ids + "&key=" + key).get("items", [])}
    c = []
    for it in items:
        vid = it["id"]["videoId"]
        p, d, anclado = puntua(it, dets.get(vid, {}), autor, tit)
        if not anclado:
            continue
        sn = it.get("snippet", {})
        c.append((p, {"id": vid, "titulo": (sn.get("title") or "")[:90],
                      "canal": (sn.get("channelTitle") or "")[:60], "dur": d}))
    c.sort(key=lambda x: -x[0])            # estable: empates conservan orden de relevancia
    return [x for p, x in c if p >= UMBRAL][:TOP_N]


# ─────────────────────────────────────────────────────────── ELEGIBILIDAD ──
def clave(b):
    s = "%s|%s" % (b.get("titulo", ""), b.get("autor", ""))
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9|]+", " ", s).strip()


def elegible(b, c, hoy):
    """(True, motivo) si hay que buscar; (False, motivo) si se deja como está."""
    if not isinstance(b, dict):
        return False, "no es objeto"
    n = b.get("_edicion_numero")
    if c["solo_ed"] and not (isinstance(n, (int, float)) and not isinstance(n, bool) and n >= 1):
        return False, "sin _edicion_numero"
    v = b.get("_video")
    if isinstance(v, dict):
        if v.get("candidatos"):
            return False, "ya resuelto"
        try:
            fecha = datetime.date.fromisoformat(str(v.get("resuelto_el", "")))
            dias = (hoy - fecha).days
            if dias < c["reintentar"]:
                return False, "sin video, reintento en %d días" % (c["reintentar"] - dias)
        except ValueError:
            pass
    return True, "buscar"


# ───────────────────────────────────────────────────────────── ESCRITURA ──
def serializar(d):
    """Mismo formato que JSON.stringify(d, null, 2) — verificado byte a byte."""
    return json.dumps(d, ensure_ascii=False, indent=2).encode("utf-8")


def escribir_atomico(ruta, d):
    out = serializar(d)
    tmp = "%s.tmp-%d" % (ruta, os.getpid())
    try:
        with open(tmp, "wb") as f:
            f.write(out)
            f.flush()
            os.fsync(f.fileno())
        with open(tmp, "rb") as f:
            if json.loads(f.read().decode("utf-8")) != d:
                raise RuntimeError("verificación post-escritura falló")
        os.replace(tmp, ruta)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise
    return len(out)


# ─────────────────────────────────────────────────────────────── PROCESO ──
def procesa(ruta, c, cache, st, hoy=None):
    hoy = hoy or datetime.date.today()
    with open(ruta, "rb") as f:
        raw = f.read()
    d = json.loads(raw.decode("utf-8"))
    libros = d.get("libros") if isinstance(d, dict) else None
    if not isinstance(libros, list):
        print("  ! %s: sin .libros — se omite" % ruta)
        return
    cambios = 0
    print("── %s: %d libros" % (ruta, len(libros)))
    for b in libros:
        ok, motivo = elegible(b, c, hoy)
        nombre = (b.get("titulo", "?") if isinstance(b, dict) else "?")[:44]
        if not ok:
            if motivo != "sin _edicion_numero":
                print("  · %-44s %s" % (nombre, motivo))
            continue
        k = clave(b)
        if k in cache:
            if cache[k] is None:
                st["cache"] += 1
                print("  = %-44s misma búsqueda ya planeada (caché)" % nombre)
                continue
            b["_video"] = json.loads(json.dumps(cache[k]))
            cambios += 1
            st["cache"] += 1
            print("  = %-44s caché (%d candidatos)" % (nombre, len(cache[k]["candidatos"])))
            continue
        if c["dry"]:
            q, lang = query_de(b)
            st["busquedas"] += 1
            cache[k] = None
            print("  ? %-44s [%s] q=\"%s\"" % (nombre, lang, q))
            continue
        if st["fatal"]:
            print("  ~ %-44s pendiente (corrida detenida)" % nombre)
            continue
        if st["busquedas"] >= c["max"]:
            print("  ~ %-44s pendiente (--max=%d alcanzado)" % (nombre, c["max"]))
            continue
        try:
            st["busquedas"] += 1
            top = resolver(b, c["key"])
        except ApiFatal as e:
            st["fatal"] = str(e)
            print("  ✗ %-44s FATAL %s — se detiene la búsqueda, se guarda lo resuelto" % (nombre, e))
            continue
        except Exception as e:
            st["errores"] += 1
            print("  ! %-44s %s (sin cambios, se reintenta en la próxima corrida)" % (nombre, e))
            time.sleep(1)
            continue
        b["_video"] = {"resuelto_el": hoy.strftime("%Y-%m-%d"), "candidatos": top}
        cache[k] = b["_video"]
        cambios += 1
        if top:
            st["con_video"] += 1
            print("  V %-44s %d candidatos · %s" % (nombre, len(top), " | ".join(x["titulo"][:38] for x in top)))
        else:
            st["sin_video"] += 1
            print("  0 %-44s sin candidatos que pasen el veto" % nombre)
        time.sleep(0.3)
    if c["dry"]:
        print("   (dry-run) %s: %d búsquedas planeadas, 0 escritos" % (ruta, st["busquedas"]))
        return
    if cambios:
        n = escribir_atomico(ruta, d)
        st["escritos"].append(ruta)
        print("   ✅ %s escrito atómicamente (%d cambios, %d bytes)" % (ruta, cambios, n))
    else:
        print("   = %s sin cambios (no se reescribe)" % ruta)


def main(argv=None):
    c = config(argv)
    if not c["rutas"]:
        print("ℹ️  No hay contenido.json ni contenido_manual.json aquí — nada que hacer")
        return 0
    if not c["key"] and not c["dry"]:
        print("❌ Falta YT_API_KEY (o usa --dry-run para ver el plan sin llave)")
        return 2
    st = {"busquedas": 0, "con_video": 0, "sin_video": 0, "cache": 0, "errores": 0, "fatal": "", "escritos": []}
    cache = {}
    print("🎬 resolve-videos v1.0 · rutas=%s · solo-ediciones=%s · max=%d · reintentar=%dd · dry-run=%s"
          % (",".join(c["rutas"]), c["solo_ed"], c["max"], c["reintentar"], c["dry"]))
    for r in c["rutas"]:
        if not os.path.exists(r):
            print("  ! %s no existe — se omite" % r)
            continue
        procesa(r, c, cache, st)
    print("══ resumen: %d búsquedas (≈%d unidades) · %d con video · %d sin video · %d vía caché · %d errores · escritos: %s"
          % (st["busquedas"], st["busquedas"] * UNIDADES_X_LIBRO, st["con_video"], st["sin_video"],
             st["cache"], st["errores"], ", ".join(st["escritos"]) or "ninguno"))
    if st["fatal"]:
        print("⚠️  corrida detenida por: %s — lo resuelto quedó guardado; el resto se reintenta en la próxima corrida" % st["fatal"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
