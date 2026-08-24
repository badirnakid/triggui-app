#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
resolve-videos.py v2.1 — 🎬 Videos en armonía con la edición (terna sinfónica).

Vive en triggui-app/scripts/. Lo corre triggui.yml (job `generar`, paso "🎬 Resolver videos")
cada lunes, y a mano las corridas de laboratorio.

Dos capas por libro:
  Capa 1 · VETO canon (YouTube Data API v3): 1 search.list (8 resultados, 100 u) + 1 videos.list (1 u).
           Se quedan los anclados (apellido o título) con puntaje ≥ 4. Hasta 8.
  Capa 2 · ARMONÍA (gpt-4o-mini, temperatura 0.1, JSON estricto): el juez recibe la edición tal como
           la ve el lector (frases con rol, hallazgo, gesto, voz del autor, ánimo) y la ficha completa
           de cada candidato; devuelve armonía 0–10, rol sinfónico, tipo, relación, idioma, frase_eco,
           pie de video y descarte. El prompt y el esquema viven en triggui-content/prompts/
           (el curador edita ahí; este script obedece).
  Terna  · el de mayor armonía, luego el mejor de un rol distinto, luego un tercer rol.
           Sin llave de OpenAI (o con --sin-armonia) cae a capa 1 sin romper nada.

Esquema guardado en cada libro:
  "_video": { "resuelto_el": "YYYY-MM-DD", "juez": "gpt-4o-mini" | "capa1",
              "sinfonia": "…", "candidatos": [ { "id","titulo","canal","dur",
              "armonia","rol","tipo","relacion","idioma","frase_eco","pie" }, … ] }
  (el front solo lee candidatos[].id; lo demás es para la Tarjeta v15.2 y para el log)

Garantías: idempotente (con candidatos → no toca; sin candidatos → reintenta tras --reintentar-dias),
un solo gasto por libro aunque haya varias rutas, escritura atómica y byte-idéntica a
JSON.stringify(…,null,2), no reescribe sin cambios, ids validados, cuota/llave fatal → guarda lo
resuelto y sale 0.

Uso:
  YT_API_KEY=… OPENAI_KEY=… python3 scripts/resolve-videos.py [--solo-ediciones] [--max=N]
      [--rutas=a.json,b.json] [--reintentar-dias=30] [--rehacer] [--sin-armonia]
      [--armonia-min=3] [--explicar] [--dry-run]

  --rehacer        vuelve a resolver aunque ya haya candidatos (para rehacer con armonía)
  --solo=a,b       solo libros cuyo título contenga alguno de esos textos (sin acentos/mayúsculas)
  --sin-armonia    solo capa 1
  --armonia-min=N  armonía mínima para entrar a la terna (default 3)
  --explicar       imprime los 8 de cada libro con puntaje base, armonía y pie
  --dry-run        sin red y sin escribir: imprime el plan
"""
import datetime
import html
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
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODELO = "gpt-4o-mini"          # sagrado: el mismo del pipeline
TEMPERATURA = 0.1               # consistencia, no creatividad (igual que el juez de voz)
ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
PALABRAS = ("entrevista", "interview", "talk", "charla", "conversat", "ted", "conferencia", "lecture")
UMBRAL = 4
TOP_N = 3
UNIDADES_X_LIBRO = 101
ROLES = ("abrir", "profundizar", "aterrizar", "resonar")
PIE_MAX = 140
RAW_CONTENT = "https://raw.githubusercontent.com/badirnakid/triggui-content/main/"
RUTA_PROMPT = "prompts/tasks/select-video-armonia.md"
RUTA_SCHEMA = "prompts/schemas/video-armonia.json"


class ApiFatal(Exception):
    """Error que invalida TODA la corrida de YouTube (cuota, llave, API apagada)."""


class LlmFatal(Exception):
    """Error que apaga la capa 2 para el resto de la corrida (llave inválida, sin crédito)."""


# ─────────────────────────────────────────────────────────────────── CLI ──
def _norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"\s+", " ", s).strip()


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
        "openai": (os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_KEY") or "").strip(),
        "solo_ed": "--solo-ediciones" in flags,
        "dry": "--dry-run" in flags,
        "rehacer": "--rehacer" in flags,
        "sin_armonia": "--sin-armonia" in flags,
        "explicar": "--explicar" in flags,
        "max": int(kv.get("max", "999")),
        "reintentar": int(kv.get("reintentar-dias", "30")),
        "armonia_min": int(kv.get("armonia-min", "3")),
        "solo": [_norm(x) for x in kv.get("solo", "").split(",") if x.strip()],
        "rutas": rutas,
    }


# ─────────────────────────────────────────────────────────── YOUTUBE API ──
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
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso or "")
    if not m:
        return 0
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mi * 60 + s


def puntua(it, det, autor, tit):
    """Puntaje canon v27. Devuelve (puntos, duracion_s, anclado)."""
    sn = it.get("snippet", {})
    dsn = det.get("snippet", {})
    t = ((sn.get("title") or "") + " " + (dsn.get("description") or sn.get("description") or "")).lower()
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
    return ("%s %s %s" % (tit, b.get("autor", ""), "entrevista" if lang == "es" else "interview")).strip(), lang


def capa1(b, key):
    """Candidatos anclados con puntaje ≥ UMBRAL, con ficha completa. Hasta 8, en orden de relevancia."""
    tit, _ = titulo_y_lang(b)
    autor = b.get("autor", "")
    q, lang = query_de(b)
    su = (API + "search?part=snippet&type=video&maxResults=8&relevanceLanguage=" + lang
          + "&videoEmbeddable=true&safeSearch=strict&q=" + urllib.parse.quote(q) + "&key=" + key)
    items = [i for i in api(su).get("items", []) if ID_RE.match(((i.get("id") or {}).get("videoId") or ""))]
    if not items:
        return []
    ids = ",".join(i["id"]["videoId"] for i in items)
    dets = {d.get("id"): d for d in api(API + "videos?part=snippet,contentDetails,statistics&id=" + ids + "&key=" + key).get("items", [])}
    out = []
    for it in items:
        vid = it["id"]["videoId"]
        det = dets.get(vid, {})
        p, d, anclado = puntua(it, det, autor, tit)
        if not anclado or p < UMBRAL:
            continue
        sn = it.get("snippet", {})
        dsn = det.get("snippet", {})
        try:
            vistas = int(det.get("statistics", {}).get("viewCount", 0) or 0)
        except (TypeError, ValueError):
            vistas = 0
        out.append({
            "id": vid,
            "titulo": html.unescape(dsn.get("title") or sn.get("title") or "")[:90],
            "canal": html.unescape(dsn.get("channelTitle") or sn.get("channelTitle") or "")[:60],
            "dur": d,
            "_base": p,
            "_descripcion": html.unescape(dsn.get("description") or sn.get("description") or "")[:700],
            "_etiquetas": [str(x)[:30] for x in (dsn.get("tags") or [])[:10]],
            "_idioma_audio": dsn.get("defaultAudioLanguage") or dsn.get("defaultLanguage") or "",
            "_subtitulos": str(det.get("contentDetails", {}).get("caption", "")).lower() == "true",
            "_vistas": vistas,
        })
    return out[:8]


# ──────────────────────────────────────────────────────── CAPA 2: ARMONÍA ──
_PROMPT_CACHE = {}


def _leer_local(base, rel):
    p = os.path.join(base, rel)
    if os.path.isfile(p):
        with open(p, "rb") as f:
            return f.read().decode("utf-8")
    return None


def _leer_raw(rel):
    with urllib.request.urlopen(RAW_CONTENT + rel, timeout=20) as r:
        return r.read().decode("utf-8")


def cargar_prompt():
    """Devuelve (prompt, esquema, origen). Mismo orden de resolución que prompt-composer.js:
    env TRIGGUI_CONTENT_ROOT → ./triggui-content → . → ../triggui-content → raw GitHub."""
    if "v" in _PROMPT_CACHE:
        return _PROMPT_CACHE["v"]
    bases = []
    if os.environ.get("TRIGGUI_CONTENT_ROOT"):
        bases.append(os.environ["TRIGGUI_CONTENT_ROOT"])
    bases += ["./triggui-content", ".", "../triggui-content"]
    prompt = esquema = origen = None
    for base in bases:
        p = _leer_local(base, RUTA_PROMPT)
        s = _leer_local(base, RUTA_SCHEMA)
        if p and s:
            prompt, esquema, origen = p, s, base
            break
    if prompt is None:
        try:
            prompt, esquema, origen = _leer_raw(RUTA_PROMPT), _leer_raw(RUTA_SCHEMA), "raw.githubusercontent"
        except Exception as e:
            raise LlmFatal("no pude leer el prompt de armonía (%s)" % e)
    esquema = json.loads(esquema)
    if not (isinstance(esquema, dict) and esquema.get("name") and isinstance(esquema.get("schema"), dict)):
        raise LlmFatal("el esquema de armonía no tiene {name, schema}")
    _PROMPT_CACHE["v"] = (prompt.strip(), esquema, origen)
    return _PROMPT_CACHE["v"]


def _s(x, n=300):
    return (x if isinstance(x, str) else "")[:n]


def edicion_payload(b):
    """La edición tal como la ve el lector (mismos campos que el adaptador de la espiral)."""
    n = b.get("_nucleus") or {}
    og = [p for p in (n.get("og_phrases_es") or []) if isinstance(p, dict)]
    bl = [p for p in (n.get("edition_blocks_es") or []) if isinstance(p, dict)]
    anc = n.get("book_grounding_anchors") or {}
    hallazgo = next((p.get("phrase") for p in og if p.get("rol_sinfonico") == "aterrizar"), None)
    if not hallazgo:
        hallazgo = next((f for f in (b.get("frases") or []) if isinstance(f, str) and len(f) > 12), "")
    gesto = next((p for t in ("instruccion_sensorial", "pregunta_directa") for p in bl if p.get("gesture_type") == t), None)
    card = n.get("card_es") or {}
    return {
        "libro": {"titulo": _s(b.get("titulo")), "autor": _s(b.get("autor")), "idioma_original": _s(b.get("idioma_original"), 5),
                  "titulo_es": _s(b.get("titulo_es")), "titulo_en": _s(b.get("titulo_en"))},
        "frases": [_s(f) for f in (b.get("frases") or []) if isinstance(f, str)][:6],
        "frases_con_rol": [{"frase": _s(p.get("phrase")), "rol": _s(p.get("rol_sinfonico"), 12), "eje_animo": p.get("eje_animo"), "pilar": _s(p.get("pilar"), 30)} for p in og][:6],
        "gestos": [{"tipo": _s(p.get("gesture_type"), 30), "ancla_sensorial": _s(p.get("sensory_anchor"), 20), "frase": _s(p.get("phrase")), "rol": _s(p.get("rol_sinfonico"), 12), "eje_animo": p.get("eje_animo")} for p in bl][:6],
        "hallazgo": _s(hallazgo),
        "movimiento": _s(gesto.get("phrase")) if gesto else "",
        "impacto": _s(gesto.get("sensory_anchor"), 20) if gesto else "",
        "voz_del_autor": _s(anc.get("authorial_voice_notes"), 400),
        "conceptos": [_s(x, 80) for x in (anc.get("concepts") or [])[:8]],
        "terminos": [_s(x, 40) for x in (anc.get("key_terms") or [])[:10]],
        "palabras_emocionales": [_s(x, 30) for x in (n.get("emotional_words_es") or [])[:8]],
        "animo_promedio": b.get("_animo_promedio"),
        "valor_predominante": _s(b.get("_valor_predominante"), 40),
        "tagline": _s(b.get("tagline")),
        "titulo_editorial": _s(card.get("titulo")),
    }


def candidatos_payload(cands):
    return [{"id": c["id"], "titulo": c["titulo"], "canal": c["canal"], "duracion_min": round(c["dur"] / 60, 1),
             "descripcion": c["_descripcion"], "etiquetas": c["_etiquetas"], "idioma_audio": c["_idioma_audio"],
             "subtitulos": c["_subtitulos"], "vistas": c["_vistas"], "puntaje_base": c["_base"]} for c in cands]


def llm(prompt, esquema, user_json, key):
    """Una llamada a gpt-4o-mini con JSON estricto. 401/402/403 → LlmFatal; resto → Exception."""
    body = json.dumps({
        "model": MODELO, "temperature": TEMPERATURA,
        "messages": [{"role": "system", "content": prompt}, {"role": "user", "content": user_json}],
        "response_format": {"type": "json_schema", "json_schema": esquema},
    }).encode("utf-8")
    req = urllib.request.Request(OPENAI_URL, data=body, method="POST",
                                 headers={"Content-Type": "application/json", "Authorization": "Bearer " + key})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            resp = json.load(r)
    except urllib.error.HTTPError as e:
        cuerpo = ""
        try:
            cuerpo = e.read().decode("utf-8", "replace")[:200]
        except Exception:
            pass
        msg = "OpenAI HTTP %d %s" % (e.code, cuerpo)
        if e.code in (401, 402, 403):
            raise LlmFatal(msg)
        raise Exception(msg)
    content = (((resp.get("choices") or [{}])[0].get("message") or {}).get("content")) or ""
    return json.loads(content)


def _pie(s):
    s = re.sub(r"\s+", " ", (s or "")).strip()
    if len(s) <= PIE_MAX:
        return s
    corte = s[:PIE_MAX].rsplit(" ", 1)[0].rstrip(" ,;:")
    return (corte or s[:PIE_MAX]).rstrip(".") + "…"


def armonizar(b, cands, c, st):
    """Capa 2. Devuelve (candidatos_con_armonia, sinfonia). Lanza LlmFatal/Exception si falla."""
    prompt, esquema, _ = cargar_prompt()
    pedido = {"edicion": edicion_payload(b), "candidatos": candidatos_payload(cands)}
    user_json = json.dumps(pedido, ensure_ascii=False)
    st["llm_llamadas"] += 1
    out = llm(prompt, esquema, user_json, c["openai"])
    veredictos = out.get("veredictos") if isinstance(out, dict) else None
    if not isinstance(veredictos, list):
        raise Exception("respuesta del juez sin veredictos")
    por_id = {}
    for v in veredictos:
        if isinstance(v, dict) and v.get("id"):
            por_id[str(v["id"])] = v
    res = []
    omitidos = 0
    for cand in cands:
        v = por_id.get(cand["id"])
        if not v:
            omitidos += 1          # tolerante: el video no juzgado queda fuera de la terna, los demás siguen
            continue
        try:
            arm = int(v.get("armonia"))
        except (TypeError, ValueError):
            raise Exception("armonía inválida en %s" % cand["id"])
        arm = max(0, min(10, arm))
        rol = v.get("rol") if v.get("rol") in ROLES else "profundizar"
        idioma = v.get("idioma") if v.get("idioma") in ("es", "en", "otro") else "otro"
        descartar = bool(v.get("descartar")) or (idioma == "otro" and not cand["_subtitulos"])
        res.append(dict(cand, armonia=arm, rol=rol, tipo=_s(v.get("tipo"), 20) or "otro", relacion=_s(v.get("relacion"), 12) or "acompana",
                        idioma=idioma, frase_eco=_s(v.get("frase_eco"), 200), pie=_pie(v.get("pie")),
                        _descartar=descartar, _motivo=_s(v.get("motivo_descarte"), 120)))
    if not res:
        raise Exception("el juez no devolvió ningún veredicto utilizable")
    if omitidos:
        st["llm_omitidos"] += omitidos
        print("      (el juez omitió %d de %d videos; siguen los juzgados)" % (omitidos, len(cands)))
    sinfonia = re.sub(r"\s+", " ", _s(out.get("sinfonia"), 240)).strip()
    return res, sinfonia


def terna(cands, armonia_min):
    """El de mayor armonía; luego el mejor de un rol distinto; luego un tercer rol; completa por armonía."""
    vivos = [x for x in cands if not x.get("_descartar") and x.get("armonia", 0) >= armonia_min]
    orden = sorted(vivos, key=lambda x: (-x["armonia"], -x["_base"]))
    elegidos, roles = [], set()
    for x in orden:
        if len(elegidos) >= TOP_N:
            break
        if x["rol"] not in roles:
            elegidos.append(x)
            roles.add(x["rol"])
    for x in orden:
        if len(elegidos) >= TOP_N:
            break
        if x not in elegidos:
            elegidos.append(x)
    return elegidos


def limpiar(cands):
    """Quita los campos de trabajo (_…) antes de guardar."""
    return [{k: v for k, v in x.items() if not k.startswith("_")} for x in cands]


# ─────────────────────────────────────────────────────────── ELEGIBILIDAD ──
def clave(b):
    s = "%s|%s" % (b.get("titulo", ""), b.get("autor", ""))
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9|]+", " ", s).strip()


def elegible(b, c, hoy):
    if not isinstance(b, dict):
        return False, "no es objeto"
    n = b.get("_edicion_numero")
    # 🏭 Corte 4: "tiene edición" ya no es solo la corona — todo libro con _slug tiene edición viva fabricada
    tiene_edicion = (isinstance(n, (int, float)) and not isinstance(n, bool) and n >= 1) or bool(b.get("_slug"))
    if c["solo_ed"] and not tiene_edicion:
        return False, "sin _edicion_numero"
    if c.get("solo") and not any(t in _norm(b.get("titulo", "")) for t in c["solo"]):
        return False, "sin _edicion_numero"   # mismo trato silencioso: fuera del filtro --solo
    v = b.get("_video")
    if isinstance(v, dict) and not c["rehacer"]:
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
def resolver_libro(b, c, st, nombre):
    """Capa 1 + capa 2 + terna. Devuelve el objeto _video (sin fecha). Lanza ApiFatal si YouTube cae."""
    base = capa1(b, c["key"])
    if c["explicar"]:
        for x in base:
            print("      · base %2d · %5.1f min · %s · %s" % (x["_base"], x["dur"] / 60, x["canal"][:24], x["titulo"][:56]))
    juez, sinfonia = "capa1", ""
    elegidos = base[:TOP_N]
    if base and c["openai"] and not c["sin_armonia"] and not st["llm_apagado"]:
        try:
            con_arm, sinfonia = armonizar(b, base, c, st)
            juez = MODELO
            elegidos = terna(con_arm, c["armonia_min"])
            if c["explicar"]:
                for x in con_arm:
                    print("      ♪ %2d %-11s %-13s %-9s %s%s" % (x["armonia"], x["rol"], x["tipo"], x["relacion"], x["titulo"][:40],
                                                                 (" · DESCARTADO: " + x["_motivo"]) if x["_descartar"] else ""))
        except LlmFatal as e:
            st["llm_apagado"] = str(e)
            print("  ✗ %-44s capa 2 apagada para el resto de la corrida: %s" % (nombre, e))
        except Exception as e:
            st["llm_errores"] += 1
            print("  ! %-44s capa 2 falló (%s) → terna por capa 1" % (nombre, str(e)[:90]))
    return {"juez": juez, "sinfonia": sinfonia, "candidatos": limpiar(elegidos)}


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
            v = resolver_libro(b, c, st, nombre)
        except ApiFatal as e:
            st["fatal"] = str(e)
            print("  ✗ %-44s FATAL %s — se detiene la búsqueda, se guarda lo resuelto" % (nombre, e))
            continue
        except Exception as e:
            st["errores"] += 1
            print("  ! %-44s %s (sin cambios, se reintenta en la próxima corrida)" % (nombre, e))
            time.sleep(1)
            continue
        b["_video"] = {"resuelto_el": hoy.strftime("%Y-%m-%d"), "juez": v["juez"], "sinfonia": v["sinfonia"], "candidatos": v["candidatos"]}
        cache[k] = b["_video"]
        cambios += 1
        top = v["candidatos"]
        if top:
            st["con_video"] += 1
            if v["juez"] == MODELO:
                print("  V %-44s %d candidatos · %s" % (nombre, len(top), " | ".join("♪%d %s" % (x["armonia"], x["rol"]) for x in top)))
                for x in top:
                    print("      %s — %s" % (x["titulo"][:48], x["pie"]))
                if v["sinfonia"]:
                    print("      ♫ %s" % v["sinfonia"])
            else:
                print("  V %-44s %d candidatos (capa 1) · %s" % (nombre, len(top), " | ".join(x["titulo"][:38] for x in top)))
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
    st = {"busquedas": 0, "con_video": 0, "sin_video": 0, "cache": 0, "errores": 0, "fatal": "", "escritos": [],
          "llm_llamadas": 0, "llm_errores": 0, "llm_omitidos": 0, "llm_apagado": ""}
    cache = {}
    armonia = "capa1 (sin llave OpenAI)" if not c["openai"] else ("apagada (--sin-armonia)" if c["sin_armonia"] else MODELO)
    origen = ""
    if c["openai"] and not c["sin_armonia"] and not c["dry"]:
        try:
            origen = " · prompt desde " + cargar_prompt()[2]
        except LlmFatal as e:
            st["llm_apagado"] = str(e)
            armonia = "apagada (%s)" % e
    print("🎬 resolve-videos v2.1 · rutas=%s · solo-ediciones=%s · rehacer=%s · max=%d · reintentar=%dd · armonía=%s%s · dry-run=%s"
          % (",".join(c["rutas"]), c["solo_ed"], c["rehacer"], c["max"], c["reintentar"], armonia, origen, c["dry"]))
    for r in c["rutas"]:
        if not os.path.exists(r):
            print("  ! %s no existe — se omite" % r)
            continue
        procesa(r, c, cache, st)
    print("══ resumen: %d búsquedas (≈%d unidades YouTube) · %d llamadas al juez · %d con video · %d sin video · %d vía caché · %d errores · escritos: %s"
          % (st["busquedas"], st["busquedas"] * UNIDADES_X_LIBRO, st["llm_llamadas"], st["con_video"], st["sin_video"],
             st["cache"], st["errores"], ", ".join(st["escritos"]) or "ninguno"))
    if st["llm_errores"] or st["llm_apagado"] or st["llm_omitidos"]:
        print("⚠️  capa 2: %d fallos por libro · %d videos omitidos por el juez%s" % (st["llm_errores"], st["llm_omitidos"], (" · apagada: " + st["llm_apagado"]) if st["llm_apagado"] else ""))
    if st["fatal"]:
        print("⚠️  corrida detenida por: %s — lo resuelto quedó guardado; el resto se reintenta en la próxima corrida" % st["fatal"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
