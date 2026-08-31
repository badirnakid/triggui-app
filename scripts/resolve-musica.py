#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
resolve-musica.py v1.0 — 🎵 El bocado sonoro (quinteto sinfónico por libro).

Vive en triggui-app/scripts/. Lo correrá triggui.yml (job `generar`, paso "🎵 Resolver música")
junto al paso de videos, y a mano las corridas de laboratorio. Calco estructural fiel de
resolve-videos.py v2.1: mismas garantías, mismas banderas, mismo juez — fuente distinta.

Tres capas por libro:
  Capa 0 · COMPOSITOR (gpt-4o-mini, temp 0.1, JSON estricto): recibe la edición como la ve el
           lector y propone hasta 3 búsquedas CONCRETAS para iTunes (artista y/o pieza con
           nombre propio). CONSTITUCIÓN: jamás el título del libro como query — iTunes es
           literal y "frida soundtrack" trae telenovela, no a Chavela (sonda 2026-08-30).
           Prioridad absoluta: si el libro trae `_musica_queries` (sembrado por nucleus o
           curador), se usa tal cual y no se gasta LLM. Sin llave de OpenAI → mapa
           determinista de semillas por idioma (juez "mapa"): nunca rompe.
  Capa 1 · VETO canon (iTunes Search API, keyless, ~20 llamadas/min): por query, hasta 8
           canciones con previewUrl OBLIGATORIO (el bocado de 30 s ES el producto).
           Castiga karaoke/tribute/cover/lullaby/explicit; premia soundtrack y match de
           artista. Dedup por trackId entre queries.
  Capa 2 · ARMONÍA (gpt-4o-mini): el juez recibe la edición y la ficha de cada pieza;
           devuelve armonía 0–10, rol sinfónico, pie y descarte. Prompt y esquema viven en
           triggui-content/prompts/ (el curador edita ahí; este script obedece).
  Quinteto · hasta 5, primero diversidad de roles, luego por armonía. La crono del front
           elige entre ellos al momento del tap.

Esquema guardado en cada libro:
  "_musica": { "resuelto_el": "YYYY-MM-DD", "juez": "gpt-4o-mini" | "mapa" | "semilla",
               "sinfonia": "…", "candidatos": [ { "id","cancion","artista","album","genero",
               "dur","preview","link","art","armonia","rol","pie","frase_eco" }, … ] }
  (el front solo necesita preview/cancion/artista/link/art; lo demás viste la Tarjeta y el log)

Garantías (calcadas del molde): idempotente (con candidatos → no toca; sin candidatos →
reintenta tras --reintentar-dias), un solo gasto por libro aunque haya varias rutas
(caché por título|autor), escritura atómica con verificación post-escritura, no reescribe
sin cambios, rate-limit fatal → guarda lo resuelto y sale 0. Kids NO entra aquí: su
curaduría espera la Doctrina Kids (S2); la maquinaria le llegará gratis cuando se selle.

Uso:
  OPENAI_KEY=… python3 scripts/resolve-musica.py [--solo-ediciones] [--max=N]
      [--rutas=a.json,b.json] [--reintentar-dias=30] [--rehacer] [--solo=a,b]
      [--sin-armonia] [--armonia-min=3] [--explicar] [--dry-run]

  APPLE_AT=token   → añade &at= de afiliado a cada link (Performance Partners; opcional)
"""
import datetime
import hashlib
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

ITUNES = "https://itunes.apple.com/search"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"
MODELO = "gpt-4o-mini"
TEMPERATURA = 0.1               # consistencia, no creatividad (igual que el juez de videos)
TOP_N = 5                       # quinteto: previews sobran, que haya de dónde rotar
PAUSA_ITUNES = 3.05             # ~20 llamadas/min es el techo documentado de iTunes Search
PAISES = ("mx", "us")           # búsqueda mx primero; us rescata catálogo faltante

RAW_CONTENT = "https://raw.githubusercontent.com/badirnakid/triggui-content/main/"
RUTA_PROMPT_COMP = "prompts/tasks/compose-musica-queries.md"
RUTA_SCHEMA_COMP = "prompts/schemas/musica-queries.json"
RUTA_PROMPT_ARM = "prompts/tasks/select-musica-armonia.md"
RUTA_SCHEMA_ARM = "prompts/schemas/musica-armonia.json"

# Semillas del mapa determinista (fallback sin LLM). Piezas con nombre propio, probadas
# buscables en iTunes. El hash del título elige, no el azar: misma entrada, misma música.
SEMILLAS_UNIV = [
    "max richter on the nature of daylight",
    "ludovico einaudi una mattina",
    "olafur arnalds saman",
    "erik satie gymnopedie",
    "nils frahm says",
    "philip glass metamorphosis",
]
SEMILLAS_ES = [
    "gustavo santaolalla de ushuaia a la quiaca",
    "rodrigo y gabriela tamacun",
    "natalia lafourcade instrumental",
]

KARAOKE_RX = re.compile(
    r"karaoke|tribute|in the style|made famous|as popularized|lullab|8[\s-]?bit|"
    r"music box|rendition|cover version|originally performed", re.I)
VIVO_RX = re.compile(r"en vivo|\blive\b|unplugged|remix|sped up|slowed", re.I)

_PROMPT_CACHE = {}


class ApiFatal(Exception):
    pass


class LlmFatal(Exception):
    pass


def _norm(s):
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9 ]+", " ", s)


def config(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    flags = set(a for a in argv if not a.startswith("--rutas") and "=" not in a) | \
            set(a.split("=")[0] for a in argv if "=" in a)
    def val(pref, default):
        return next((a.split("=", 1)[1] for a in argv if a.startswith(pref + "=")), default)
    rutas = [r for r in val("--rutas", "contenido.json").split(",") if r]
    solo = [_norm(t).strip() for t in val("--solo", "").split(",") if t.strip()]
    return {
        "openai": (os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_KEY") or "").strip(),
        "at": (os.environ.get("APPLE_AT") or "").strip(),
        "solo_ed": "--solo-ediciones" in flags,
        "max": int(val("--max", "999")),
        "rutas": rutas,
        "reintentar": int(val("--reintentar-dias", "30")),
        "rehacer": "--rehacer" in flags,
        "solo": solo,
        "sin_armonia": "--sin-armonia" in flags,
        "armonia_min": int(val("--armonia-min", "3")),
        "explicar": "--explicar" in flags,
        "dry": "--dry-run" in flags,
    }


# ──────────────────────────────────────────────────────────────── ITUNES ──
def api_itunes(params):
    """GET a iTunes Search con reintento suave; 403/429 persistente = ApiFatal (rate)."""
    url = ITUNES + "?" + urllib.parse.urlencode(params)
    for intento in (1, 2):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "triggui-musica/1.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (403, 429):
                if intento == 2:
                    raise ApiFatal("iTunes rate-limit (%d)" % e.code)
                time.sleep(8)
                continue
            raise
        except Exception:
            if intento == 2:
                raise
            time.sleep(2)


def puntua_pieza(r, query):
    """Veto música. previewUrl/trackViewUrl obligatorios; devuelve (puntaje, pieza) o None."""
    prev, link = r.get("previewUrl"), r.get("trackViewUrl")
    if not prev or not link:
        return None
    nombre = "%s %s %s" % (r.get("trackName", ""), r.get("collectionName", ""), r.get("artistName", ""))
    p = 0
    if (r.get("trackExplicitness") or "") == "explicit":
        p -= 5
    if KARAOKE_RX.search(nombre):
        p -= 5
    if VIVO_RX.search(nombre):
        p -= 3                                          # aplausos y ruido rompen la lectura
    qt = set(_norm(query).split())
    at = set(_norm(r.get("artistName", "")).split())
    p += 2 * min(2, len(qt & at))                      # el artista pedido apareció
    if re.search(r"soundtrack|banda sonora|motion picture", nombre, re.I):
        p += 1
    dur = int(r.get("trackTimeMillis") or 0) // 1000
    if 0 < dur < 45:
        p -= 2
    return p, {
        "id": str(r.get("trackId") or ""),
        "cancion": (r.get("trackName") or "")[:90],
        "artista": (r.get("artistName") or "")[:70],
        "album": (r.get("collectionName") or "")[:90],
        "genero": (r.get("primaryGenreName") or "")[:30],
        "dur": dur,
        "preview": prev,
        "link": link,
        "art": (r.get("artworkUrl100") or "").replace("100x100bb", "600x600bb"),
        "_base": 0,
    }


def capa1(queries, c, usadas=None, umbral=1, rescate=False):
    c = dict(c); c["_usadas"] = usadas or set()
    """Busca cada query en iTunes (mx→us), veta, dedup (trackId y canción+artista) y
    conserva hasta 3 por query: la diversidad es alimento del juez, no adorno."""
    vistos, huellas, piezas = set(), set(), []
    for q in queries[:3]:
        cosecha = []
        for pais in PAISES:
            d = api_itunes({"term": q, "media": "music", "entity": "song",
                            "limit": 8, "country": pais})
            time.sleep(PAUSA_ITUNES)
            for r in d.get("results", []):
                pz = puntua_pieza(r, q)
                if not pz:
                    continue
                p, x = pz
                huella = _norm(x["cancion"] + "|" + x["artista"])
                hcorta = _huella(x)
                if hcorta in (c.get("_usadas") or ()):  # coronada por otro libro: fuera del universo
                    continue
                if hcorta in huellas:
                    continue
                huellas.add(hcorta)
                if rescate and (KARAOKE_RX.search((x["cancion"]+" "+x["album"])) or p <= -5):
                    continue
                if p < umbral or x["id"] in vistos or huella in huellas:
                    continue
                x["_base"], x["_q"] = p, q
                vistos.add(x["id"])
                huellas.add(huella)
                cosecha.append(x)
            if cosecha:
                break                                   # mx dio fruto: us no hace falta
        cosecha.sort(key=lambda x: -x["_base"])
        piezas += cosecha[:3]
    piezas.sort(key=lambda x: -x["_base"])
    if c["at"]:
        for x in piezas:
            x["link"] += ("&" if "?" in x["link"] else "?") + "at=" + c["at"]
    return piezas[:8]


# ───────────────────────────────────────────────────────────────── PROMPTS ──
def _leer_local(base, rel):
    p = os.path.join(base, rel)
    if os.path.isfile(p):
        with open(p, "rb") as f:
            return f.read().decode("utf-8")
    return None


def _leer_raw(rel):
    with urllib.request.urlopen(RAW_CONTENT + rel, timeout=20) as r:
        return r.read().decode("utf-8")


def cargar_prompt(ruta_p, ruta_s, etiqueta):
    """Mismo orden de resolución que el molde: TRIGGUI_CONTENT_ROOT → ./triggui-content →
    . → ../triggui-content → raw GitHub. Devuelve (prompt, esquema)."""
    k = etiqueta
    if k in _PROMPT_CACHE:
        return _PROMPT_CACHE[k]
    bases = []
    if os.environ.get("TRIGGUI_CONTENT_ROOT"):
        bases.append(os.environ["TRIGGUI_CONTENT_ROOT"])
    bases += ["./triggui-content", ".", "../triggui-content"]
    prompt = esquema = None
    for base in bases:
        p, s = _leer_local(base, ruta_p), _leer_local(base, ruta_s)
        if p and s:
            prompt, esquema = p, s
            break
    if prompt is None:
        try:
            prompt, esquema = _leer_raw(ruta_p), _leer_raw(ruta_s)
        except Exception as e:
            raise LlmFatal("no pude leer el prompt %s (%s)" % (etiqueta, e))
    esquema = json.loads(esquema)
    if not (isinstance(esquema, dict) and esquema.get("name") and isinstance(esquema.get("schema"), dict)):
        raise LlmFatal("el esquema %s no tiene {name, schema}" % etiqueta)
    _PROMPT_CACHE[k] = (prompt.strip(), esquema)
    return _PROMPT_CACHE[k]


def _s(x, n=300):
    return (x if isinstance(x, str) else "")[:n]


def edicion_payload(b):
    """La edición como la ve el lector (calco recortado del molde de videos)."""
    n = b.get("_nucleus") or {}
    og = [p for p in (n.get("og_phrases_es") or []) if isinstance(p, dict)]
    card = n.get("card_es") or {}
    return {
        "libro": {"titulo": _s(b.get("titulo")), "autor": _s(b.get("autor")),
                  "idioma_original": _s(b.get("idioma_original"), 5)},
        "tagline": _s(b.get("tagline"), 160),
        "palabras": [_s(w, 24) for w in (b.get("palabras") or []) if isinstance(w, str)][:4],
        "frases_con_rol": [{"frase": _s(p.get("phrase")), "rol": _s(p.get("rol_sinfonico"), 12),
                            "eje_animo": p.get("eje_animo")} for p in og][:4],
        "voz_tarjeta": _s(card.get("parrafoTop"), 240),
    }


def llm(prompt, esquema, user_json, key):
    body = json.dumps({
        "model": MODELO, "temperature": TEMPERATURA,
        "response_format": {"type": "json_schema", "json_schema": esquema},
        "messages": [{"role": "system", "content": prompt},
                     {"role": "user", "content": json.dumps(user_json, ensure_ascii=False)}],
    }).encode("utf-8")
    req = urllib.request.Request(OPENAI_URL, data=body, method="POST",
                                 headers={"Content-Type": "application/json",
                                          "Authorization": "Bearer " + key})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            d = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code in (401, 403, 429):
            raise LlmFatal("OpenAI %d" % e.code)
        raise
    txt = (d.get("choices") or [{}])[0].get("message", {}).get("content", "")
    return json.loads(txt)


# ─────────────────────────────────────────────────────────────── CAPA 0 ──
def mapa_queries(b):
    """Fallback determinista: mismas entradas, mismas semillas. Hash elige, no el azar."""
    h = int(hashlib.md5(_norm(b.get("titulo", "")).encode()).hexdigest(), 16)
    univ = SEMILLAS_UNIV[h % len(SEMILLAS_UNIV):] + SEMILLAS_UNIV[:h % len(SEMILLAS_UNIV)]
    if (b.get("idioma_original") or "").lower().startswith("es"):
        es = SEMILLAS_ES[h % len(SEMILLAS_ES)]
        return [es, univ[0], univ[1]]
    return univ[:3]


def _huella(x):
    c = re.split(r"[\(\[]| - | – ", x.get("cancion",""))[0]
    c = re.sub(r"\b(feat\.?|ft\.?|remix|live|edit|version|versión)\b.*$", "", c, flags=re.I)
    a = re.split(r"[,&]|\bfeat", x.get("artista",""), flags=re.I)[0]
    return _norm(c).strip() + "|" + _norm(a).strip()


def componer_queries(b, c, st):
    """Capa 0. Devuelve (canonicas, afines, origen).
    semilla del curador → canónicas (saltan la exclusión) · LLM → {canonicas, afines} · sin llave → mapa (afines)."""
    semb = b.get("_musica_queries")
    if isinstance(semb, list) and any(isinstance(q, str) and q.strip() for q in semb):
        return [q.strip() for q in semb if isinstance(q, str) and q.strip()][:3], [], "semilla"
    if c["openai"] and not st["llm_apagado"]:
        try:
            prompt, esquema = cargar_prompt(RUTA_PROMPT_COMP, RUTA_SCHEMA_COMP, "compositor")
            payload = edicion_payload(b)
            if st.get("usadas"):
                payload["ya_sonaron_en_otros_libros"] = sorted(st["usadas"])[:60]
            out = llm(prompt, esquema, payload, c["openai"])
            can = [q.strip() for q in (out.get("canonicas") or []) if isinstance(q, str) and q.strip()][:3]
            afi = [q.strip() for q in (out.get("afines") or []) if isinstance(q, str) and q.strip()][:3]
            if can or afi:
                return can, afi, MODELO
        except LlmFatal as e:
            st["llm_apagado"] = str(e)
            print("      (compositor apagado para el resto de la corrida: %s)" % e)
        except Exception as e:
            st["llm_errores"] += 1
            print("      (compositor falló: %s → mapa)" % str(e)[:80])
    return [], mapa_queries(b), "mapa"


# ─────────────────────────────────────────────────────────────── CAPA 2 ──
def candidatos_payload(cands):
    return [{"id": x["id"], "cancion": x["cancion"], "artista": x["artista"],
             "album": x["album"], "genero": x["genero"], "dur": x["dur"],
             "canonica": bool(x.get("canon"))} for x in cands]


def _pie(s):
    return _s(s, 140).strip()


def armonizar(b, cands, c, st):
    """Capa 2. Devuelve (candidatos_con_armonia, sinfonia)."""
    prompt, esquema = cargar_prompt(RUTA_PROMPT_ARM, RUTA_SCHEMA_ARM, "armonia")
    out = llm(prompt, esquema, {"edicion": edicion_payload(b),
                                "piezas": candidatos_payload(cands)}, c["openai"])
    vered = {str(v.get("id")): v for v in (out.get("veredictos") or []) if isinstance(v, dict)}
    if not vered:
        raise Exception("respuesta del juez sin veredictos")
    con, omitidos = [], 0
    for x in cands:
        v = vered.get(x["id"])
        if not v:
            omitidos += 1
            continue
        y = dict(x)
        y["armonia"] = max(0, min(10, int(v.get("armonia") or 0)))
        y["rol"] = v.get("rol") if v.get("rol") in ("abrir", "profundizar", "aterrizar", "resonar") else "abrir"
        y["pie"] = _pie(v.get("pie"))
        y["frase_eco"] = _s(v.get("frase_eco"), 200)
        y["_descartar"] = bool(v.get("descartar"))
        y["_motivo"] = _s(v.get("motivo_descarte"), 90)
        con.append(y)
    if not con:
        raise Exception("el juez no devolvió ningún veredicto utilizable")
    if omitidos:
        print("      (el juez omitió %d de %d piezas; siguen las juzgadas)" % (omitidos, len(cands)))
    return con, _s(out.get("sinfonia"), 200)


def quinteto(cands, armonia_min):
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
    if c["solo_ed"] and not (isinstance(n, (int, float)) and not isinstance(n, bool) and n >= 1):
        return False, "sin _edicion_numero"
    if c.get("solo") and not any(t in _norm(b.get("titulo", "")) for t in c["solo"]):
        return False, "sin _edicion_numero"    # mismo trato silencioso del molde
    v = b.get("_musica")
    if isinstance(v, dict) and not c["rehacer"]:
        if v.get("candidatos"):
            return False, "ya resuelto"
        try:
            fecha = datetime.date.fromisoformat(str(v.get("resuelto_el", "")))
            dias = (hoy - fecha).days
            if dias < c["reintentar"]:
                return False, "sin música, reintento en %d días" % (c["reintentar"] - dias)
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
def resolver_libro(p, c, st):
    """PASO 2 de un libro: afines (con exclusión) + canónicas reclamadas en el PASO 1 → cascada → juez → quinteto."""
    b = p["b"]
    base = list(p["canon_base"])
    huellas = set(_huella(x) for x in base)
    if p["afi"]:
        for x in capa1(p["afi"], c, st.get("usadas")):
            if _huella(x) not in huellas:
                base.append(x); huellas.add(_huella(x))
    if not base:
        base = capa1(mapa_queries(b), c, st.get("usadas"))
        if base and c["explicar"]:
            print("      (rescate-mapa: %d piezas)" % len(base))
    if not base:
        base = capa1(p["afi"] + mapa_queries(b), c, st.get("usadas"), umbral=-9, rescate=True)
        if base:
            print("      (rescate-piso: %d piezas)" % len(base))
    base.sort(key=lambda x: (-(1 if x.get("canon") else 0), -x["_base"]))
    if c["explicar"]:
        for x in base:
            print("      · %s base %2d · %s — %s [%s]" % ("👑" if x.get("canon") else "  ", x["_base"], x["cancion"][:34], x["artista"][:24], x["genero"]))
    origen = p["origen"]
    juez, sinfonia = ("mapa" if origen == "mapa" else "semilla" if origen == "semilla" else "capa1"), ""
    elegidos = base[:TOP_N]
    if base and c["openai"] and not c["sin_armonia"] and not st["llm_apagado"]:
        try:
            con_arm, sinfonia = armonizar(b, base, c, st)
            frases_ed = set(_norm(f.get("frase","")) for f in edicion_payload(b)["frases_con_rol"])
            for _y in con_arm:
                if _y.get("armonia", 0) >= 8 and not _y.get("canon") and _norm(_y.get("frase_eco","")) not in frases_ed:
                    _y["armonia"] = 6
            juez = MODELO
            elegidos = quinteto(con_arm, c["armonia_min"])
            if not elegidos and con_arm:
                vivos = sorted((x for x in con_arm if not x.get("_descartar")),
                               key=lambda x: (-x.get("armonia",0), -x["_base"]))
                elegidos = (vivos or sorted(con_arm, key=lambda x: -x["_base"]))[:2]
                juez = MODELO + "+rescate"
                print("      (rescate-juez: %d piezas, el silencio no está permitido)" % len(elegidos))
            if c["explicar"]:
                for x in con_arm:
                    print("      ♪ %2d %-11s %s%s — %s%s" % (x["armonia"], x["rol"], "👑" if x.get("canon") else "", x["cancion"][:30], x["artista"][:22],
                                                             (" · DESCARTADA: " + x["_motivo"]) if x["_descartar"] else ""))
        except LlmFatal as e:
            st["llm_apagado"] = str(e)
            print("  ✗ %-44s capa 2 apagada para el resto de la corrida: %s" % (p["nombre"], e))
        except Exception as e:
            st["llm_errores"] += 1
            print("  ! %-44s capa 2 falló (%s) → quinteto por capa 1" % (p["nombre"], str(e)[:90]))
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
    print("── %s: %d libros" % (ruta, len(libros)))
    plan, cambios = [], 0
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
            b["_musica"] = json.loads(json.dumps(cache[k]))
            cambios += 1
            st["cache"] += 1
            print("  = %-44s caché (%d candidatas)" % (nombre, len(cache[k]["candidatos"])))
            continue
        if c["dry"]:
            queries, origen = (b.get("_musica_queries"), "semilla") if b.get("_musica_queries") else (mapa_queries(b), "mapa")
            st["busquedas"] += 1
            cache[k] = None
            print("  ? %-44s [%s] q=%s" % (nombre, origen, " | ".join(queries or [])[:70]))
            continue
        if st["fatal"]:
            print("  ~ %-44s pendiente (corrida detenida)" % nombre)
            continue
        if st["busquedas"] >= c["max"]:
            print("  ~ %-44s pendiente (--max=%d alcanzado)" % (nombre, c["max"]))
            continue
        st["busquedas"] += 1
        cache[k] = None
        plan.append({"b": b, "k": k, "nombre": nombre, "can": [], "afi": [], "origen": "mapa", "canon_base": []})
    # siembra: territorio ocupado = lo coronado en libros que NO se rehacen en esta corrida
    en_plan = set(id(p["b"]) for p in plan)
    for _b in libros:
        if id(_b) in en_plan:
            continue
        for _x in ((_b.get("_musica") or {}).get("candidatos") or []):
            st["usadas"].add(_huella(_x))
    if plan:
        print("  ▸ PASO 1 · derecho de canon (%d libros, memoria sembrada: %d huellas)" % (len(plan), len(st["usadas"])))
    for p in plan:
        if st["fatal"]:
            break
        try:
            can, afi, origen = componer_queries(p["b"], c, st)
        except Exception:
            can, afi, origen = [], mapa_queries(p["b"]), "mapa"
        p.update(can=can, afi=afi, origen=origen)
        if c["explicar"]:
            print("  %-44s [%s] 👑 %s | ♫ %s" % (p["nombre"], origen, " ; ".join(can) or "—", " ; ".join(afi) or "—"))
        if can:
            try:
                base = capa1(can, c, set() if origen == "semilla" else st["usadas"])
            except ApiFatal as e:
                st["fatal"] = str(e)
                print("  ✗ %-44s FATAL %s en el PASO 1" % (p["nombre"], e))
                break
            for x in base:
                x["canon"] = True
                st["usadas"].add(_huella(x))
            p["canon_base"] = base
    if plan:
        print("  ▸ PASO 2 · afines + juez")
    for p in plan:
        b, nombre = p["b"], p["nombre"]
        if st["fatal"]:
            print("  ~ %-44s pendiente (corrida detenida)" % nombre)
            continue
        try:
            v = resolver_libro(p, c, st)
        except ApiFatal as e:
            st["fatal"] = str(e)
            print("  ✗ %-44s FATAL %s — se detiene la búsqueda, se guarda lo resuelto" % (nombre, e))
            continue
        except Exception as e:
            st["errores"] += 1
            print("  ! %-44s %s (sin cambios, se reintenta en la próxima corrida)" % (nombre, str(e)[:90]))
            time.sleep(1)
            continue
        b["_musica"] = {"resuelto_el": hoy.strftime("%Y-%m-%d"), "juez": v["juez"],
                        "sinfonia": v["sinfonia"], "candidatos": v["candidatos"]}
        for _x in v["candidatos"]:
            st["usadas"].add(_huella(_x))
        cache[p["k"]] = b["_musica"]
        cambios += 1
        top = v["candidatos"]
        if top:
            st["con_musica"] += 1
            marca = " | ".join((("👑" if x.get("canon") else "") + ("♪%d %s" % (x.get("armonia", 0), x.get("rol", "")) if "armonia" in x
                               else x["artista"][:16])) for x in top)
            print("  M %-44s %d candidatas · %s" % (nombre, len(top), marca))
        else:
            print("  0 %-44s sin música digna (silencio; reintento en %d días)" % (nombre, c["reintentar"]))
    if cambios and not c["dry"]:
        nuevo = serializar(d)
        if nuevo != raw:
            n = escribir_atomico(ruta, d)
            print("  ✍ %s: %d libro(s) tocados, %d bytes" % (ruta, cambios, n))
        else:
            print("  = %s: sin cambios de bytes" % ruta)


def main():
    c = config()
    st = {"busquedas": 0, "con_musica": 0, "errores": 0, "cache": 0, "usadas": set(),
          "fatal": "", "llm_apagado": "", "llm_errores": 0}
    cache = {}
    for ruta in c["rutas"]:
        if not os.path.exists(ruta):
            print("  · %s no existe — se omite" % ruta)
            continue
        procesa(ruta, c, cache, st)
    print("── búsquedas %d · con música %d · caché %d · errores %d%s%s" % (
        st["busquedas"], st["con_musica"], st["cache"], st["errores"],
        (" · FATAL: " + st["fatal"]) if st["fatal"] else "",
        (" · LLM apagado: " + st["llm_apagado"]) if st["llm_apagado"] else ""))
    sys.exit(0)


if __name__ == "__main__":
    main()
