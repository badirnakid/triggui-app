import os
import sys
import json
import re
import html
import urllib.parse
from pathlib import Path

# Configuración Lab
LAB_BASE_DIR = Path("public/lab")
LAB_DATA_FILE = LAB_BASE_DIR / "ediciones.json"
LAB_OUT_DIR = LAB_BASE_DIR / "t"

# Configuración Single (Pipeline)
TMP_BOOK_FILE = Path("/tmp/triggui-book.json")
# 🌒 V13 NIVEL DIOS CUÁNTICO-QUARK: contenido.json es la ÚNICA fuente de verdad
# Eliminado contenido_edicion.json fósil que tenía data del 5 mayo (El mesias mistico)
SINGLE_JSON = Path("contenido.json")
SINGLE_OUT_DIR = Path(os.environ.get("TRIGGUI_OUT_BASE", "public/t"))

# Base URL dinámica:
# - main -> https://app.triggui.com
# - previews -> https://beta.app.triggui.com
BASE_URL = os.environ.get("BASE_URL", "https://app.triggui.com").rstrip("/")

# 🌒 V13: env var aún soportada para tests/CI (override explícito), pero ya no
# busca contenido_edicion.json automáticamente
TRIGGUI_EDICION_JSON_ENV = os.environ.get("TRIGGUI_EDICION_JSON", "").strip()


# ════════════════════════════════════════════════════════════════════════════
# 🌒 NUMERACIÓN NIVEL DIOS CUÁNTICO-QUARK (V10)
# ════════════════════════════════════════════════════════════════════════════
# PADDING_DIGITS controla cuántos dígitos del número se renderean.
# Cambiar a 4 cuando se acerque #800 (próximas 4 décadas con 1 edición/semana).
# El integer en contenido.json NO cambia — solo cómo se renderea.
PADDING_DIGITS = 3


def format_edicion_numero(n):
    """
    Formatea un número de edición como '#047' (con padding).
    Retorna None si n no es un entero válido (no se renderea badge).
    """
    if n is None:
        return None
    try:
        num = int(n)
    except (TypeError, ValueError):
        return None
    if num < 1:
        return None
    return "#" + str(num).zfill(PADDING_DIGITS)


# ════════════════════════════════════════════════════════════════════════════
# 🌒 ENSURE_TEXT_CLOSURE — Bug 2 defensa (parrafoTop cortado)
# ════════════════════════════════════════════════════════════════════════════
# Si el modelo terminó la respuesta sin completar la frase (max_tokens limit),
# detectar texto sin cierre y aplicar estrategia A+B:
#   A) Buscar último signo de cierre legítimo (. ? ! … —) a >50% del texto
#      y truncar ahí
#   B) Si no hay, agregar "…" al final
# Texto que YA termina con cierre legítimo se preserva intacto.
def tg_darken_hex(h, f=0.72):
    try:
        h = str(h or "").strip().lstrip("#")
        if len(h) == 3: h = "".join(c*2 for c in h)
        r, g, b = (int(h[i:i+2], 16) for i in (0, 2, 4))
        return "#%02x%02x%02x" % (int(r*f), int(g*f), int(b*f))
    except Exception:
        return "#333333"


def ensure_text_closure(text):
    if not text:
        return text
    value = str(text).rstrip()
    if not value:
        return value
    # Cierres legítimos
    LEGITIMATE_CLOSURES = (".", "?", "!", "…", "—", '"', "»", ")", "]", "."  )
    if value.endswith(LEGITIMATE_CLOSURES):
        return value
    # Estrategia A: buscar último cierre legítimo a >=50% del texto
    half = max(1, len(value) // 2)
    best_idx = -1
    for closure in (".", "?", "!", "…"):
        idx = value.rfind(closure)
        if idx >= half and idx > best_idx:
            best_idx = idx
    if best_idx >= 0:
        # Truncar incluyendo el carácter de cierre
        return value[: best_idx + 1].rstrip()
    # Estrategia B: agregar elipsis
    # Limpiar trailing comas, conjunciones cortadas, etc.
    value = value.rstrip(" ,;:")
    return value + "…"


# ════════════════════════════════════════════════════════════════════════════
# 🌒 REMOVE_PSEUDO_HTML_PAIRS — Bug 3 defensa (tags inventados por modelo)
# ════════════════════════════════════════════════════════════════════════════
# El modelo (gpt-4o-mini) a veces inventa tags pseudo-HTML como [em]...[/em],
# [dB]...[/dB], [strong]...[/strong]. Estos NO son [H] (highlight legítimo).
#
# Filosofía cuántico-quark: SOLO eliminar PARES emparejados [name]X[/name].
# Texto editorial entre corchetes SIN par (ej. "[sic]", "[música]", "[1]")
# se preserva intacto porque NO es tag, es notación literal.
#
# Aplicado iterativamente para tags anidados (ej. [em][strong]X[/strong][/em]).
def remove_pseudo_html_pairs(value):
    if not value:
        return value
    # Pattern: [name]X[/name] donde name != H (case-sensitive)
    # name puede tener atributos opcionales (ej. [span class=foo])
    # X es el contenido (lazy match)
    pattern = re.compile(
        r'\[(?!H\])([a-zA-Z][a-zA-Z0-9]*)(?:\s[^\]]*)?\](.*?)\[/\1\]',
        re.DOTALL
    )
    prev = None
    while value != prev:
        prev = value
        value = pattern.sub(lambda m: m.group(2), value)
    return value


def esc(value):
    return html.escape(str(value or ""), quote=True)


def js_string(value):
    return json.dumps(value, ensure_ascii=False)


def pad_list(values, size, fallback):
    values = list(values or [])
    while len(values) < size:
        values.append(fallback)
    return values[:size]


def with_alpha(hex_color, alpha="2e"):
    clean = str(hex_color or "").strip()
    if re.fullmatch(r"#[0-9a-fA-F]{6}", clean):
        return f"{clean}{alpha}"
    return clean or "#E35D302e"


def resolve_single_json_file():
    """
    🌒 V13 NIVEL DIOS CUÁNTICO-QUARK: solo busca contenido.json
    (excepto si TRIGGUI_EDICION_JSON env var explícita override)
    """
    if TRIGGUI_EDICION_JSON_ENV:
        env_path = Path(TRIGGUI_EDICION_JSON_ENV)
        if env_path.exists():
            return env_path

    if SINGLE_JSON.exists():
        return SINGLE_JSON

    return None


def resolve_cover(book_meta, libro_data):
    return (
        book_meta.get("portada_url")
        or book_meta.get("portada")
        or libro_data.get("portada_url")
        or libro_data.get("portada")
        or ""
    )


def resolve_text_colors(libro_data, colores):
    text_colors = libro_data.get("textColors") or []
    if text_colors:
        return pad_list(text_colors, 4, "#FFFFFF")
    return ["#FFFFFF"] * len(colores)


def resolve_palabra_dominante(libro_data):
    tarjeta = libro_data.get("tarjeta", {}) or {}
    return (
        tarjeta.get("titulo")
        or (libro_data.get("palabras") or [None])[0]
        or libro_data.get("titulo", "")
    )


def build_bocado_eco_pool(libro_data, lang="es"):
    """
    🌒 V14 SINFÓNICO NIVEL DIOS CUÁNTICO-QUARK MATEMÁTICAMENTE.

    V13 → V14 cambio:
      - ANTES: pool = [str, str, ...] (concepts del nucleus, sin metadata)
      - AHORA: pool = [{phrase, rol, animo, origin}, ...] (sinfónico con metadata)

    Razón: la app webview ya usa _nucleus.edition_blocks_es + _nucleus.og_phrases_es
    con rol_sinfonico (abrir/profundizar/aterrizar/resonar). La edición viva HTML
    debe consumir lo mismo para paridad sinfónica entre ambos consumidores.

    Cascade de fuentes (cero tolerancia, backwards-compatible):
      1. _nucleus.edition_blocks_es  (Triggui v12+, 4 phrases con rol)
      2. _nucleus.og_phrases_es      (Triggui v12+, 4 phrases con rol)
      3. _nucleus.book_grounding_anchors.concepts[]  (legacy V13, ~5 strings)

    Formato del item:
      - Si hay metadata sinfónica → dict {phrase, rol, animo, origin}
      - Si no (libros pre-v12) → string (backwards compat con JS V13)

    El JS detecta el tipo automáticamente (typeof === 'object' vs 'string')
    y elige modo de selección (por rol vs random).
    """
    pool = []
    seen = set()

    def add_phrase(text, rol=None, animo=None, origin=None):
        if not text:
            return
        clean = normalize_text(strip_highlight_tags(text))
        if not clean:
            return
        clean = clean[0].upper() + clean[1:] if len(clean) >= 1 else clean
        if not clean.endswith((".", "?", "!", "…")):
            clean += "."
        key = clean.casefold()
        if key in seen:
            return
        seen.add(key)

        # 🌒 V14: emitir OBJETO si hay metadata sinfónica, STRING si legacy
        if rol is not None:
            pool.append({
                "phrase": clean,
                "rol": rol,
                "animo": animo,
                "origin": origin,
            })
        else:
            pool.append(clean)

    nucleus = libro_data.get("_nucleus", {}) or {}

    # 🌒 V14 PRIORIDAD 1: edition_blocks_es (sinfónico)
    for block in (nucleus.get(f"edition_blocks_{lang}", []) or []):
        if isinstance(block, dict) and block.get("rol_sinfonico"):
            add_phrase(
                block.get("phrase", ""),
                rol=block.get("rol_sinfonico"),
                animo=block.get("eje_animo"),
                origin="edition_block_es",
            )

    # 🌒 V14 PRIORIDAD 2: og_phrases_es (sinfónico)
    for og in (nucleus.get(f"og_phrases_{lang}", []) or []):
        if isinstance(og, dict) and og.get("rol_sinfonico"):
            add_phrase(
                og.get("phrase", ""),
                rol=og.get("rol_sinfonico"),
                animo=og.get("eje_animo"),
                origin="og_phrase_es",
            )

    # 🌒 V14 FALLBACK: concepts del nucleus (legacy V13)
    # Solo si NO se logró pool sinfónico
    if not any(isinstance(p, dict) for p in pool):
        grounding = nucleus.get("book_grounding_anchors", {}) or {}
        for concept in (grounding.get("concepts", []) or []):
            add_phrase(concept)

    return pool


def strip_highlight_tags(text):
    return re.sub(r"\[/?H\]", "", str(text or ""), flags=re.IGNORECASE)


def normalize_text(text):
    return re.sub(r"\s+", " ", str(text or "")).strip()


def clamp(number, minimum, maximum):
    return max(minimum, min(number, maximum))


def lerp(start, end, amount):
    return start + ((end - start) * amount)


def compute_editorial_layout_metrics(title, author, top, subtitle, bottom, has_cover):
    title_len = len(normalize_text(strip_highlight_tags(title)))
    author_len = len(normalize_text(strip_highlight_tags(author)))
    top_len = len(normalize_text(strip_highlight_tags(top)))
    subtitle_len = len(normalize_text(strip_highlight_tags(subtitle)))
    bottom_len = len(normalize_text(strip_highlight_tags(bottom)))

    density = (
        (title_len * 1.9)
        + (author_len * 0.4)
        + top_len
        + (subtitle_len * 0.65)
        + (bottom_len * 0.9)
        + (36 if has_cover else 0)
    )
    ratio = clamp((density - 120) / 220, 0.0, 1.0)

    title_size = round(clamp(lerp(30.4, 25.4, ratio), 23.8, 31.2), 2)
    title_size_mobile = round(clamp(lerp(26.0, 22.8, ratio), 21.8, 26.4), 2)
    para_size = round(clamp(lerp(19.4, 17.4, ratio), 16.8, 19.8), 2)
    para_size_mobile = round(clamp(lerp(18.8, 17.0, ratio), 16.4, 19.2), 2)
    sub_size = round(clamp(lerp(18.8, 17.2, ratio), 16.8, 19.0), 2)
    sub_size_mobile = round(clamp(lerp(18.4, 16.8, ratio), 16.0, 18.6), 2)
    chip_size = round(clamp(lerp(15.8, 14.3, ratio), 13.6, 16.0), 2)
    chip_size_mobile = round(clamp(lerp(14.8, 13.6, ratio), 13.0, 15.0), 2)
    cover_width = round(clamp(lerp(128.0, 110.0, ratio), 104.0, 132.0), 2)
    cover_width_mobile = round(clamp(lerp(116.0, 98.0, ratio), 94.0, 118.0), 2)

    return {
        "title": title_size,
        "title_mobile": title_size_mobile,
        "para": para_size,
        "para_mobile": para_size_mobile,
        "sub": sub_size,
        "sub_mobile": sub_size_mobile,
        "chip": chip_size,
        "chip_mobile": chip_size_mobile,
        "cover": cover_width,
        "cover_mobile": cover_width_mobile,
    }


def truncate_text(text, limit):
    value = normalize_text(text)
    if not value:
        return ""
    if len(value) <= limit:
        return value
    return value[: max(0, limit - 3)].rstrip(" ,.;:!?-–—") + "..."


def strip_explicit_book_refs(text, titulo="", autor=""):
    value = normalize_text(strip_highlight_tags(text))
    if not value:
        return ""

    for term in [titulo, autor]:
        clean_term = normalize_text(term)
        if not clean_term:
            continue
        value = re.sub(re.escape(clean_term), "", value, flags=re.IGNORECASE)

    value = re.sub(r"\(\s*\)", "", value)
    value = re.sub(r"\s+([,.;:!?])", r"\1", value)
    value = re.sub(r"[ \t]{2,}", " ", value)
    value = value.strip(" \t\n\r,.;:!?·-–—")
    value = re.sub(r"[ \t]{2,}", " ", value).strip()
    return value


def unique_nonempty(values):
    out = []
    seen = set()

    for value in values or []:
        clean = normalize_text(value)
        if not clean:
            continue
        key = clean.casefold()
        if key in seen:
            continue
        seen.add(key)
        out.append(clean)

    return out


def phrase_is_weak(text):
    value = normalize_text(text).lower()
    if not value:
        return True

    weak_patterns = [
        r"\binvita a\b",
        r"\binvitar a\b",
        r"\bexplora\b",
        r"\bexplorar\b",
        r"\bdescubre\b",
        r"\bdescubrir\b",
        r"\breflexiona\b",
        r"\breflexionar\b",
        r"\bnos recuerda\b",
        r"\bnos muestra\b",
        r"\bhabla de\b",
        r"\btrata de\b",
        r"\bpropone\b",
        r"\bpropone una\b",
        r"\buna reflexión\b",
        r"\buna mirada\b",
        r"\bmuestra cómo\b",
        r"\bpermite\b.+\balcanzar\b",
    ]

    return any(re.search(pattern, value) for pattern in weak_patterns)


def score_phrase(text):
    value = normalize_text(text)
    if not value:
        return -999

    score = 0
    length = len(value)

    if 22 <= length <= 74:
        score += 40
    elif 16 <= length <= 88:
        score += 22
    else:
        score -= 18

    if 28 <= length <= 58:
        score += 16

    if not re.search(r"[,:;()]", value):
        score += 10

    if value.count(",") == 0:
        score += 8

    strong_patterns = [
        r"\bdeja\b",
        r"\bprotege\b",
        r"\brecupera\b",
        r"\bordena\b",
        r"\bdetén\b",
        r"\bsuelta\b",
        r"\brespira\b",
        r"\bcorta\b",
        r"\belige\b",
        r"\bquita\b",
        r"\bpon\b",
        r"\babre\b",
        r"\brenuncia\b",
        r"\bvuelve\b",
        r"\bhabita\b",
        r"\baprende\b",
        r"\bcuida\b",
        r"\bescucha\b",
    ]

    if any(re.search(pattern, value.lower()) for pattern in strong_patterns):
        score += 10

    if phrase_is_weak(value):
        score -= 55

    if length > 90:
        score -= 14

    if length < 18:
        score -= 18

    return score


def pick_og_phrases(edicion):
    titulo = edicion.get("titulo", "")
    autor = edicion.get("autor", "")

    frases = unique_nonempty(edicion.get("frases") or [])
    frases = [
        strip_explicit_book_refs(frase, titulo=titulo, autor=autor)
        for frase in frases
    ]
    frases = [frase for frase in frases if frase]

    ranked = sorted(
        [{"phrase": frase, "score": score_phrase(frase)} for frase in frases],
        key=lambda item: item["score"],
        reverse=True,
    )

    headline = truncate_text((ranked[0]["phrase"] if ranked else ""), 82)

    secondary = ""
    for item in ranked:
        if normalize_text(item["phrase"]).casefold() != normalize_text(headline).casefold():
            secondary = item["phrase"]
            break

    secondary = truncate_text(secondary, 180)
    return headline, secondary


def build_og_title(edicion):
    palabras = unique_nonempty(edicion.get("palabras") or [])
    if palabras:
        lowered = [palabra.lower() for palabra in palabras[:4]]
        return truncate_text(" · ".join(lowered), 90)

    palabra = normalize_text(edicion.get("palabra", ""))
    if palabra:
        return truncate_text(palabra.lower(), 90)

    return "triggui"


def build_og_description(edicion):
    headline, secondary = pick_og_phrases(edicion)

    if secondary:
        return truncate_text(secondary, 180)

    if headline:
        return truncate_text(headline, 180)

    tarjeta = edicion.get("tarjeta", {}) or {}
    candidates = [
        tarjeta.get("subtitulo", ""),
        tarjeta.get("parrafoBot", ""),
        tarjeta.get("parrafoTop", ""),
        edicion.get("descripcion", ""),
    ]

    for candidate in candidates:
        cleaned = strip_explicit_book_refs(
            candidate,
            titulo=edicion.get("titulo", ""),
            autor=edicion.get("autor", ""),
        )
        if cleaned and not phrase_is_weak(cleaned):
            return truncate_text(cleaned, 180)

    return "Abre esta edición viva de Triggui."


def normalize_highlight_syntax(text):
    value = str(text or "").strip()
    if not value:
        return ""

    value = re.sub(r"\{\{H\}\}", "[H]", value, flags=re.IGNORECASE)
    value = re.sub(r"\{\{\/H\}\}", "[/H]", value, flags=re.IGNORECASE)
    value = re.sub(r"\[h\]", "[H]", value)
    value = re.sub(r"\[\/h\]", "[/H]", value)

    # 🌒 BUG 4 FIX (V10): eliminar toggle que rompía múltiples [H] legítimos
    # ANTES (bug): `[H]uno[/H] y [H]dos[/H]` → toggle convertía 2do [H] a [/H]
    #              → balanceación eliminaba [/H] extras → "[H]uno[/H] y dos"
    # DESPUÉS:    [H] = apertura, [/H] = cierre, balance al final solo si necesita
    opens = len(re.findall(r"\[H\]", value))
    closes = len(re.findall(r"\[/H\]", value))

    if opens > closes:
        # Agregar [/H] faltantes al final
        value += "[/H]" * (opens - closes)
    elif closes > opens:
        # Eliminar [/H] extras desde el final
        extra = closes - opens
        while extra > 0:
            idx = value.rfind("[/H]")
            if idx == -1:
                break
            value = value[:idx] + value[idx + 4 :]
            extra -= 1

    # 🌒 BUG 3 FIX (V10): eliminar tags pseudo-HTML inventados por el modelo
    # Aplicado DESPUÉS del balanceo de [H] para no romper highlights legítimos
    value = remove_pseudo_html_pairs(value)

    value = re.sub(r"\[H\]\s*\[/H\]", "", value)
    value = re.sub(r"[ \t]{2,}", " ", value).strip()
    return value


def escape_with_breaks(text):
    return esc(text).replace("\n", "<br>")


# ════════════════════════════════════════════════════════════════════════════
# 🌒 V16 NIVEL DIOS CUÁNTICO-QUARK MATEMÁTICO GEOMÉTRICO AXIOMÁTICO
# Paridad exacta con build-tarjeta-png.js para garantizar consistencia
# visual perfecta entre HTML edición viva y tarjeta.png.
#
# ANTES V15: si el modelo no puso [H]...[/H] en parrafoTop, la viva quedaba
# SIN highlights mientras tarjeta.png los forzaba con ensureOneHighlight().
# Resultado: discrepancia visual entre los dos renders del mismo libro.
#
# AHORA V16: ambos renderers fuerzan al menos un highlight cuando el modelo
# no puso ninguno. Estrategia: primer segmento ≥18 chars como [H]...[/H].
# ════════════════════════════════════════════════════════════════════════════
def count_highlights(text):
    """🌒 V16 NIVEL DIOS: cuenta highlights NO-VACÍOS en el texto.

    Paridad EXACTA con countHighlights() de build-tarjeta-png.js línea 318-322.
    - Normaliza la sintaxis [H]...[/H]
    - Busca patrón [H](.*?)[/H] con flags case-insensitive + dotall
    - Cuenta solo los matches con contenido no-vacío después de trim
    """
    normalized = normalize_highlight_syntax(text)
    if not normalized:
        return 0
    matches = re.findall(r"\[H\](.*?)\[/H\]", normalized, flags=re.IGNORECASE | re.DOTALL)
    return sum(1 for m in matches if m.strip())


def ensure_one_highlight(text):
    """🌒 V16 NIVEL DIOS: fuerza al menos un highlight si el modelo no puso ninguno.

    Paridad EXACTA con ensureOneHighlight() de build-tarjeta-png.js línea 324-339.

    Estrategia:
      1. Si ya hay ≥1 highlight no-vacío, retornar sin cambios (respeta modelo)
      2. Sino, obtener texto plano sin tags
      3. Dividir por oraciones (split después de . ! ? con lookbehind)
      4. Filtrar segmentos ≥18 caracteres
      5. Tomar el primer segmento (o el plano completo si no hay)
      6. Escapar caracteres regex especiales del segmento
      7. Reemplazar la PRIMERA ocurrencia por [H]{segmento}[/H]
      8. Normalizar resultado

    Garantía cuántico-quark: idempotente (aplicar 2 veces da mismo resultado).
    """
    normalized = normalize_highlight_syntax(text)
    if not normalized:
        return normalized

    # Si ya hay highlights del modelo, respetarlos
    if count_highlights(normalized) >= 1:
        return normalized

    # Obtener texto plano sin tags
    plain = strip_highlight_tags(normalized)
    if not plain:
        return normalized

    # Dividir por oraciones usando lookbehind: split después de . ! ?
    # Equivalente exacto de /(?<=[.!?])\s+/ en JS
    segments = re.split(r"(?<=[.!?])\s+", plain)
    segments = [s.strip() for s in segments if len(s.strip()) >= 18]

    chosen = segments[0] if segments else plain.strip()
    if not chosen:
        return normalized

    # Escapar caracteres regex especiales del segmento elegido
    # Equivalente de /[.*+?^${}()|[\]\\]/g en JS
    safe = re.escape(chosen)

    # Reemplazar SOLO la primera ocurrencia (count=1 equivale a sin flag /g en JS)
    result = re.sub(safe, f"[H]{chosen}[/H]", normalized, count=1)

    # Re-normalizar por si quedaron tags extra
    return normalize_highlight_syntax(result)


def render_highlight_html(text):
    normalized = normalize_highlight_syntax(text)
    if not normalized:
        return ""

    pattern = re.compile(r"\[H\](.*?)\[/H\]", flags=re.IGNORECASE | re.DOTALL)
    parts = []
    last = 0

    for match in pattern.finditer(normalized):
        before = normalized[last : match.start()]
        if before:
            parts.append(escape_with_breaks(before))

        inner = match.group(1).strip()
        if inner:
            parts.append(f'<span class="tg-hl">{escape_with_breaks(inner)}</span>')

        last = match.end()

    after = normalized[last:]
    if after:
        parts.append(escape_with_breaks(after))

    return "".join(parts)


# ═══════════════════════════════════════════════════════════════════════════
# 🌐 GEMELA EN INGLÉS — /t/<slug>/en/
# Doctrina: la gemela es la MISMA página, byte por byte, salvo tres cosas:
#   (1) el encabezado social en inglés, para que la previsualización de
#       WhatsApp salga en inglés (el robot lee el HTML crudo: JavaScript
#       no puede cambiarlo);
#   (2) la imagen de previsualización apunta a og_en;
#   (3) la semilla de idioma arranca en "en" — el toggle sigue mandando.
# Nada estructural se toca: la paridad con la española es la ley.
# ═══════════════════════════════════════════════════════════════════════════
def _og_titulo_en(edicion):
    palabras = unique_nonempty(edicion.get("palabras_en") or [])
    if palabras:
        return truncate_text(" · ".join([p.lower() for p in palabras[:4]]), 90)
    return build_og_title(edicion)


def _og_descripcion_en(edicion):
    tarjeta_en = edicion.get("tarjeta_en") or {}
    frases_en = [f for f in (edicion.get("frases_en") or []) if str(f or "").strip()]
    candidatos = [
        tarjeta_en.get("subtitulo", ""),
        tarjeta_en.get("parrafoTop", ""),
        tarjeta_en.get("parrafoBot", ""),
        frases_en[0] if frases_en else "",
    ]
    for c in candidatos:
        limpio = normalize_text(strip_highlight_markers(c) if "strip_highlight_markers" in globals() else c)
        limpio = re.sub(r"\[/?H\]", "", str(limpio or "")).strip()
        if limpio:
            return truncate_text(limpio, 180)
    return "Open this living edition of Triggui."


def _titulo_pagina_en(edicion):
    t = str(edicion.get("titulo_en") or "").strip() or str(edicion.get("titulo") or "").strip()
    tarjeta_en = edicion.get("tarjeta_en") or {}
    tc = str(tarjeta_en.get("titulo") or "").strip()
    return f"{tc or t} · Triggui"


def escribir_gemela_en(html_es, out_dir, edicion, base_url):
    """Escribe /en/index.html a partir del HTML español ya generado."""
    tarjeta_en = edicion.get("tarjeta_en") or {}
    if not (tarjeta_en.get("titulo") and (tarjeta_en.get("parrafoTop") or tarjeta_en.get("parrafoBot"))):
        print("   ⏭️  Sin tarjeta en inglés — se omite la gemela /en/")
        return None

    edicion_id = str(edicion.get("id") or "").strip()
    og_img_es = f"{base_url}/t/{edicion_id}/og.jpg"
    og_img_en = f"{base_url}/t/{edicion_id}/og_en.jpg"
    url_es = f"{base_url}/t/{edicion_id}/"
    url_en = f"{base_url}/t/{edicion_id}/en/"

    h = html_es
    # (1) encabezado social en inglés
    h = h.replace(f'content="{esc(build_og_title(edicion))}"', f'content="{esc(_og_titulo_en(edicion))}"')
    h = h.replace(f'content="{esc(build_og_description(edicion))}"', f'content="{esc(_og_descripcion_en(edicion))}"')
    h = h.replace(f"<title>{esc(str(edicion.get('titulo') or ''))} · Triggui</title>",
                  f"<title>{esc(_titulo_pagina_en(edicion))}</title>")
    # (2) previsualización e identidad de la gemela
    h = h.replace(og_img_es, og_img_en)
    h = h.replace(f'content="{esc(url_es)}"', f'content="{esc(url_en)}"')
    h = h.replace(f'<link rel="canonical" href="{esc(url_es)}" />',
                  f'<link rel="canonical" href="{esc(url_en)}" />')
    h = h.replace('content="es_MX"', 'content="en_US"')
    h = h.replace('<html lang="es"', '<html lang="en"', 1)
    # (3) semilla de idioma: arranca en inglés, el toggle sigue mandando
    h = re.sub(r"let tgLang = \(function\(\)\{[\s\S]{0,400}?\}\)\(\);",
               "let tgLang = 'en';", h, count=1)
    # (4) ⚠️ la gemela vive en una SUBCARPETA: toda ruta relativa se rompería
    #     ("./portada.jpg" resolvería a /t/<slug>/en/portada.jpg → 404).
    #     Se absolutizan contra la carpeta de la edición.
    h = h.replace('"./', f'"{base_url}/t/{edicion_id}/')
    h = h.replace("'./", f"'{base_url}/t/{edicion_id}/")
    # hermanas declaradas para los buscadores
    h = h.replace("</head>",
                  f'<link rel="alternate" hreflang="es" href="{esc(url_es)}" />'
                  f'<link rel="alternate" hreflang="en" href="{esc(url_en)}" />'
                  f'<link rel="alternate" hreflang="x-default" href="{esc(url_es)}" />\n</head>', 1)

    en_dir = out_dir / "en"
    en_dir.mkdir(parents=True, exist_ok=True)
    destino = en_dir / "index.html"
    destino.write_text(h, encoding="utf-8")
    print(f"🌐 Gemela en inglés: {destino}")
    return destino


def render_edicion(edicion, mode="lab"):
    titulo = edicion.get("titulo", "")
    autor = edicion.get("autor", "")
    edicion_id = edicion.get("id", "")
    palabra = edicion.get("palabra", "")
    descripcion = edicion.get("descripcion", "")
    portada = edicion.get("portada", "")
    tagline = edicion.get("tagline", "")

    if mode == "single":
        og_image = f"{BASE_URL}/t/{edicion_id}/og.jpg"
        og_url = f"{BASE_URL}/t/{edicion_id}/"
    else:
        og_image = f"{BASE_URL}/lab/t/{edicion_id}/og.jpg"
        og_url = f"{BASE_URL}/lab/t/{edicion_id}/"

    palabras = pad_list(edicion.get("palabras"), 4, "Señal")
    frases = pad_list(edicion.get("frases"), 4, "Abre un libro físico que tengas cerca.")
    colores = pad_list(edicion.get("colores"), 4, "#4FD1FF")
    text_colors = pad_list(edicion.get("textColors"), 4, "#FFFFFF")

    tarjeta = edicion.get("tarjeta", {}) or {}
    t_titulo = str(tarjeta.get("titulo", "") or "").strip()
    t_parrafo_top = normalize_highlight_syntax(tarjeta.get("parrafoTop", "") or "")
    t_subtitulo = str(tarjeta.get("subtitulo", "") or "").strip()
    t_parrafo_bot = normalize_highlight_syntax(tarjeta.get("parrafoBot", "") or "")

    # 🌒 V16 NIVEL DIOS CUÁNTICO-QUARK MATEMÁTICO AXIOMÁTICO:
    # Forzar al menos un highlight en cada párrafo si el modelo no puso ninguno.
    # Paridad EXACTA con build-tarjeta-png.js para consistencia entre renders.
    # Si el modelo ya puso [H]...[/H], se respetan tal cual (idempotente).
    t_parrafo_top = ensure_one_highlight(t_parrafo_top)
    t_parrafo_bot = ensure_one_highlight(t_parrafo_bot)

    # 🌒 BUG 2 FIX (V10): aplicar ensure_text_closure al render
    # Si el modelo cortó el parrafoTop por max_tokens, aplicar elipsis o
    # truncar a última oración completa. Defensa final en render.
    t_parrafo_top = ensure_text_closure(t_parrafo_top)
    t_parrafo_bot = ensure_text_closure(t_parrafo_bot)

    # 🌐 D2-A: gemelos EN — mismo pipeline editorial; datos ya existentes en el catálogo
    tarjeta_en = edicion.get("tarjeta_en", {}) or {}
    t_titulo_en = str(tarjeta_en.get("titulo", "") or "").strip() or t_titulo
    t_top_en = ensure_text_closure(ensure_one_highlight(normalize_highlight_syntax(tarjeta_en.get("parrafoTop", "") or "")))
    t_sub_en = str(tarjeta_en.get("subtitulo", "") or "").strip()
    t_bot_en = ensure_text_closure(ensure_one_highlight(normalize_highlight_syntax(tarjeta_en.get("parrafoBot", "") or "")))
    frases_en_ed = pad_list(edicion.get("frases_en"), 4, "Open a physical book you have nearby.")
    palabras_en_ed = pad_list(edicion.get("palabras_en"), 4, "Signal")

    # 🌒 NUMERACIÓN NIVEL DIOS (V10): extraer número de edición si existe
    edicion_numero_raw = edicion.get("_edicion_numero")
    edicion_label = format_edicion_numero(edicion_numero_raw)

    style = tarjeta.get("style", {}) or {}
    accent = style.get("accent") or "#E35D30"
    marker = with_alpha(accent, "30")
    chip_bg = with_alpha(accent, "14")
    card_paper = "#F7F7F5"
    card_ink = "#1A1A1A"
    card_border = "rgba(26,26,26,0.06)"

    description_plain = strip_highlight_tags(t_parrafo_top or descripcion).strip()
    if not description_plain:
        description_plain = strip_highlight_tags(t_parrafo_bot).strip()
    if not description_plain:
        description_plain = palabra or titulo

    og_title = build_og_title(edicion)
    og_description = build_og_description(edicion)

    primary_word_default = normalize_text((palabras[0] if palabras else "") or palabra or titulo)
    busca_comprar = urllib.parse.quote(f"{titulo} {autor}")
    busca_explorar = urllib.parse.quote(primary_word_default) if primary_word_default else busca_comprar
    penguin_q = urllib.parse.quote(primary_word_default) if primary_word_default else urllib.parse.quote(titulo)

    # 🖼️ Cover verificado a nivel partícula: local premium si EXISTE; si no, remota del libro; jamás roto
    _out_base_dir = SINGLE_OUT_DIR if mode == "single" else LAB_OUT_DIR
    _local_ok = (_out_base_dir / edicion_id / "portada.jpg").exists()
    _remote_ok = portada.startswith("http")
    has_portada = _local_ok or _remote_ok
    cover_src = "./portada.jpg" if _local_ok else (portada if _remote_ok else "")
    has_tarjeta = bool(t_parrafo_top)
    layout_metrics = compute_editorial_layout_metrics(
        t_titulo or titulo,
        autor,
        t_parrafo_top or descripcion,
        t_subtitulo,
        t_parrafo_bot,
        has_cover=has_portada,
    )

    state = {
        "id": edicion_id,
        "titulo": titulo,
        "autor": autor,
        "palabra": palabra,
        "descripcion": description_plain,
        "palabras": palabras,
        "frases": frases,
        "colores": colores,
        "textColors": text_colors,
        "ogImage": og_image,
        "portada": portada,
        "tagline": tagline,
        "frases_en": frases_en_ed,
        "palabras_en": palabras_en_ed,
        "i18nEn": {
            "cardTitle": t_titulo_en,
            "top": render_highlight_html(t_top_en) if t_top_en else "",
            "sub": t_sub_en,
            "bot": render_highlight_html(t_bot_en) if t_bot_en else "",
        },
        "bocadoEcoPool": edicion.get("bocadoEcoPool") or [],
        "bocadoEcoPool_en": edicion.get("bocadoEcoPool_en") or [],
        "titulo_en": str(edicion.get("titulo_en", "") or ""),
    }

    cover_cta_html = ""
    if has_portada:
        cover_cta_html = f"""
          <div class="ed-cover-wrap" id="coverCTA">
            <img src="{esc(cover_src)}" alt="{esc(titulo)}" />
            <span class="cover-hint">Toca el libro</span>
          </div>"""

    second_block_html = ""
    if has_tarjeta and (t_subtitulo or t_parrafo_bot):
        second_block_html = f"""
      <div class="ed-gap"></div>
      <div class="ed-block" id="editorialBlockBottom">
        <div class="ed-sub" id="editorialSub">{esc(t_subtitulo)}</div>
        <div class="ed-para" id="editorialBottomPara">{render_highlight_html(t_parrafo_bot)}</div>
      </div>"""

    silence_cover_html = ""
    if has_portada:
        silence_cover_html = f"""
    <img class="sil-cover" id="silCover" src="{esc(cover_src)}" alt="{esc(titulo)}" />"""

    top_html = render_highlight_html(t_parrafo_top or descripcion)

    body_style = (
        f"--accent:{esc(accent)};"
        f"--marker:{esc(marker)};"
        f"--chip-bg:{esc(chip_bg)};"
        f"--card-paper:{esc(card_paper)};"
        f"--card-ink:{esc(card_ink)};"
        f"--card-border:{esc(card_border)};"
        f"--ed-title-size:{layout_metrics['title']}px;"
        f"--ed-title-size-mobile:{layout_metrics['title_mobile']}px;"
        f"--ed-para-size:{layout_metrics['para']}px;"
        f"--ed-para-size-mobile:{layout_metrics['para_mobile']}px;"
        f"--ed-sub-size:{layout_metrics['sub']}px;"
        f"--ed-sub-size-mobile:{layout_metrics['sub_mobile']}px;"
        f"--ed-chip-size:{layout_metrics['chip']}px;"
        f"--ed-chip-size-mobile:{layout_metrics['chip_mobile']}px;"
        f"--ed-cover-width:{layout_metrics['cover']}px;"
        f"--ed-cover-width-mobile:{layout_metrics['cover_mobile']}px;"
    )

    html_output = """<!doctype html>
<html lang="es" style="background:#000;">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">

<title>__TITLE_PAGE__</title>
<meta name="description" content="__META_DESCRIPTION__" />
<link rel="canonical" href="__OG_URL__" />

<meta property="og:title" content="__OG_TITLE__" />
<meta property="og:description" content="__META_DESCRIPTION__" />
<meta property="og:image" content="__OG_IMAGE__" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="__OG_URL__" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Triggui" />
<meta property="og:locale" content="es_MX" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="__OG_TITLE__" />
<meta name="twitter:description" content="__META_DESCRIPTION__" />
<meta name="twitter:image" content="__OG_IMAGE__" />

<link rel="preconnect" href="https://www.penguinlibros.com" crossorigin>
<link rel="preconnect" href="https://www.buscalibre.com.mx" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Poppins:wght@500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;0,800;1,500;1,700&display=swap" rel="stylesheet">

<style>
*, *::before, *::after { box-sizing: border-box; }

html, body {
  background: #000 !important;
  color: #fff;
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Archivo', sans-serif;
  -webkit-overflow-scrolling: touch;
  -webkit-text-size-adjust: 100%;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

vercel-live-feedback,[data-vercel-toolbar],#__vercel_live_token,vercel-toolbar{display:none!important;height:0!important;overflow:hidden!important;}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(40, 100, 220, 0.14), transparent 65%),
    radial-gradient(ellipse at 70% 80%, rgba(80, 230, 200, 0.06), transparent 65%);
  z-index: -1;
  pointer-events: none;
  opacity: 0.9;
}

@keyframes fire-move {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.pulse-line {
  pointer-events: none;
  position: fixed;
  top: 16px;
  left: 0;
  right: 0;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: rgba(255,255,255,.4);
  z-index: 50;
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity .8s ease, transform .8s ease;
  pointer-events: none;
  user-select: none;
}
.pulse-line.visible { opacity: 1; transform: translateY(0); }

.grid {
  position: absolute;
  inset: 5vh 1.5vw;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(4, 1fr);
  gap: 1vw;
  transition: opacity .4s ease;
}
.grid.hidden { opacity: 0; pointer-events: none; }
@media(orientation:landscape) { .grid { grid-template-columns: repeat(4,1fr); grid-template-rows: 1fr; } }

.block {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-radius: 24px;
  font-weight: 700;
  cursor: pointer;
  background-size: 320% 320%;
  transition: transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  overflow: hidden;
  isolation: isolate;
  width: 100%;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  user-select: none;
  box-shadow: inset 0 0 0 1.5px rgba(255,255,255,.15), 0 4px 6px rgba(0,0,0,.15), 0 12px 32px rgba(0,0,0,.35);
  z-index: 1;
}

.block * { pointer-events: none !important; }

.block::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(145deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,.08) 40%, transparent 100%);
  z-index: 1;
}
.block::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.12), transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}
.block:hover::after { opacity: 1; }
.block:hover {
  transform: translateY(-2px) scale(1.005);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.28),
    inset 0 -1px 0 rgba(0,0,0,.16),
    inset 0 0 0 1px rgba(255,255,255,.16),
    0 3px 7px rgba(0,0,0,.14),
    0 18px 46px rgba(0,0,0,.42);
}
.block:active {
  transform: translateY(0) scale(0.995);
  transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.20),
    inset 0 -1px 0 rgba(0,0,0,.18),
    inset 0 0 0 1px rgba(255,255,255,.10),
    0 1px 3px rgba(0,0,0,.12),
    0 8px 24px rgba(0,0,0,.30);
}
.block.dim { opacity: 0.6; transform: scale(0.98); }

.label, .frase {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 2;
  text-align: center;
  transition: opacity 0.25s ease, transform 0.25s ease;
  text-shadow: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.label { opacity: 1; transform: translateY(0); font-size: clamp(1.05rem, 3.2vw, 1.7rem); font-weight: 700; line-height: 1.35; letter-spacing: 0.2px; }
.frase { opacity: 0; transform: translateY(6px); font-size: clamp(1rem, 3vw, 1.5rem); font-weight: 600; line-height: 1.4; }
.block.show .label { opacity: 0; transform: translateY(-6px); }
.block.show .frase { opacity: 1; transform: translateY(0); }

#tgLangPill{position:fixed;top:max(54px, calc(env(safe-area-inset-top,0px) + 14px));right:16px;z-index:650;display:flex;background:rgba(255,255,255,.05);border:.5px solid rgba(255,255,255,.1);border-radius:99px;padding:3px;font:600 11px/1 'Poppins',sans-serif}
#tgLangPill span{padding:5px 11px;border-radius:99px;transition:all .35s cubic-bezier(.19,1,.22,1);color:rgba(255,255,255,.45);cursor:pointer}
#tgLangPill span.lang-active{color:#000;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.15)}
.reveal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: none;
  flex-direction: column;
  align-items: center;
  background: rgba(0,0,0,0.92);
  opacity: 0;
  pointer-events: none;
  transition: opacity .3s ease;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: max(6px, env(safe-area-inset-top, 6px)) 6px max(6px, env(safe-area-inset-bottom, 6px));
  cursor: pointer;
}
.reveal-overlay::-webkit-scrollbar { display: none; }

.reveal-card {
  width: 100%;
  max-width: 520px;
  margin: auto 0;
  border-radius: 20px;
  position: relative;
  background-color: var(--card-paper);
  color: var(--card-ink);
  box-shadow: 0 25px 60px rgba(0,0,0,0.06), 0 0 0 1px var(--card-border);
  overflow: visible;
  cursor: default;
  transform: scale(0.94) translateY(15px);
  opacity: 0;
  transition: transform 0.45s cubic-bezier(0.19,1,0.22,1), opacity 0.4s ease;
}

.reveal-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
  opacity: 0.03;
  border-radius: 20px;
}

.card-inner { position: relative; z-index: 2; padding: 0; }

.btn-close {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 20;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.06);
  color: #1A1A1A;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background .2s ease, transform .2s ease;
  padding: 0;
  touch-action: manipulation;
}
.btn-close:hover { background: rgba(0,0,0,0.12); }
.btn-close:active { transform: scale(0.9); }

.ed-block {
  margin: 0 5px;
  background: linear-gradient(145deg, #FFFFFF 0%, #F0F0EE 100%);
  border: 1px solid rgba(26,26,26,0.05);
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.03);
}
.ed-block:first-child { margin-top: 18px; }

.ed-flow {
  overflow: hidden;
}

.ed-block .ed-title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: var(--ed-title-size, 28px);
  line-height: 1.2;
  font-weight: 700;
  color: #1A1A1A;
  letter-spacing: -0.5px;
  margin: 0 0 8px 0;
}

.ed-block .ed-chip {
  display: inline-block;
  font-family: 'Archivo', sans-serif;
  font-size: var(--ed-chip-size, 15px);
  line-height: 1;
  font-weight: 700;
  background: var(--chip-bg);
  color: var(--accent);
  padding: 4px 11px;
  border-radius: 12px;
  letter-spacing: 0.3px;
  margin: 0 0 12px 0;
  /* 🌒 BUG 1 FIX (V10): permitir wrap natural cuando autor es largo */
  /* Antes: chip inline-block + texto largo creaba hueco vertical bajo el título */
  /* Ahora: el chip se rompe en líneas dentro de su contenedor sin afectar layout */
  max-width: 100%;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
  vertical-align: top;
  line-height: 1.35;
  /* TODO: refactor a CSS Grid en Phase futura para eliminar dependencia de float */
}

.ed-block .ed-para {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: var(--ed-para-size, 18px);
  line-height: 1.7;
  font-weight: 400;
  color: #4A4A4A;
  letter-spacing: 0.2px;
  margin: 0;
}

.ed-block .ed-sub {
  font-family: 'Archivo', sans-serif;
  font-size: var(--ed-sub-size, 18px);
  line-height: 1.4;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.15px;
  margin: 0 0 8px 0;
}

.tg-hl {
  display: inline;
  color: inherit;
  font-weight: 600;
  background: var(--marker);
  padding: 0.03em 0.10em 0.08em;
  border-radius: 0.14em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

/* ════════════════════════════════════════════════════════════════════════════
   🌒 NUMERACIÓN V12 NIVEL DIOS CUÁNTICO-QUARK — eyebrow ARRIBA del título
   Posición: dentro del ed-block, inmediatamente antes del .ed-title
   Filosofía: notable PREMIUM. Label sans + número Playfair italic con color accent
   V12 cambios: tamaño aumentado para ser visible + color accent en #N para
   coherencia cromática con el resto del diseño del libro
   ════════════════════════════════════════════════════════════════════════════ */
.edicion-eyebrow {
  display: block;
  /* 🌒 V15: aire arriba (separa del techo) + abajo (separa del título) */
  margin: 6px 27px 14px 27px;
  font-family: 'Archivo', sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: rgba(26, 26, 26, 0.48);
  line-height: 1;
  user-select: none;
}
.edicion-eyebrow-sep {
  display: inline-block;
  margin: 0 0.55em;
  opacity: 0.5;
  font-weight: 400;
}
.edicion-eyebrow-num {
  font-family: 'Playfair Display', Georgia, serif;
  font-weight: 700;
  font-style: italic;
  letter-spacing: 0;
  font-size: 22px;
  color: var(--accent, #1a1a1a);
  text-transform: none;
  vertical-align: baseline;
  margin-left: 2px;
}
@media (max-width: 480px) {
  .edicion-eyebrow { font-size: 12px; letter-spacing: 0.30em; margin: 6px 22px 8px 22px; }
  .edicion-eyebrow-num { font-size: 20px; }
}

.ed-cover-wrap {
  float: right;
  width: var(--ed-cover-width, 120px);
  cursor: pointer;
  position: relative;
  touch-action: manipulation;
  padding: 0;
  margin: 0 0 10px 18px;
}
.ed-cover-wrap img {
  display: block;
  width: 100%;
  height: auto;
  border: 1px solid #EAEAEA;
  border-radius: 4px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.12);
  animation: coverBreathe 2.8s cubic-bezier(0.32,0.01,0.16,1) infinite;
  will-change: transform, filter;
}
@keyframes coverBreathe {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(0,0,0,0)); }
  50% { transform: scale(1.03); filter: drop-shadow(0 10px 20px rgba(227,93,48,0.25)); }
}
.cover-hint {
  display: block;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: rgba(26,26,26,0.4);
  margin-top: 6px;
  letter-spacing: 0.3px;
  animation: hintFade 4s ease forwards;
}
@keyframes hintFade { 0%, 70% { opacity: 1; } 100% { opacity: 0; } }

.ed-gap { height: 14px; }

.card-actions {
  padding: 16px 22px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.btn-row { display: grid; gap: 8px; }
.btn-row-2 { grid-template-columns: 1fr 48px; }
.btn-row-3 { grid-template-columns: 1fr 48px 1fr; }

.btn-light {
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  cursor: pointer;
  background: #FFFFFF;
  border: 1px solid rgba(26,26,26,0.08);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.btn-light:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.05); border-color: rgba(26,26,26,0.15); }
.btn-light:active { transform: scale(0.97); }

.btn-light img { height: 16px; width: auto; display: block; }
.btn-light .btn-triggui-logo { height: 20px; opacity: 0.9; }
.btn-light .btn-ig-icon { width: 18px; height: 18px; opacity: 0.9; }
.btn-ig-icon rect, .btn-ig-icon circle { stroke: #1A1A1A; }
.btn-ig-icon circle[fill="white"] { fill: #1A1A1A; }

.btn-dark {
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  cursor: pointer;
  background: #1A1A1A;
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
}
.btn-dark:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.15); border-color: rgba(255,255,255,0.1); }
.btn-dark:active { transform: scale(0.97); }

.btn-dark .btn-busca-logo {
  height: 14px;
  filter: none;
  opacity: 0.95;
}

.btn-dark.btn-penguin-icon img {
  height: 36px;
  mix-blend-mode: screen;
  filter: contrast(120%) grayscale(1);
  opacity: 0.95;
}

.btn-crystal.btn-dark { background: #1A1A1A; }
.btn-crystal .btn-emoji { font-size: 20px; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }

.silence-screen {
  display: none;
  position: absolute;
  inset: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  background: radial-gradient(circle at 50% 35%, rgba(20,25,40,0.95) 0%, rgba(0,0,0,1) 80%);
  overflow: hidden;
}
.silence-screen::before {
  content: "";
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(227,93,48,0.35) 0%, transparent 70%);
  filter: blur(40px);
  z-index: 0;
  pointer-events: none;
  animation: pulseGlow 4s ease-in-out infinite;
}
@keyframes pulseGlow { 0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.95); } 50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); } }

.silence-screen > * { position: relative; z-index: 1; }
.silence-screen .sil-cover {
  width: 180px;
  height: auto;
  border-radius: 6px;
  opacity: 1;
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 30px 60px -10px rgba(0,0,0,0.9), 0 0 50px rgba(227,93,48,0.4);
  margin-bottom: 40px;
  cursor: pointer;
  animation: floatMagic 5s ease-in-out infinite;
}
@keyframes floatMagic {
  0%, 100% { transform: translateY(0); box-shadow: 0 30px 60px -10px rgba(0,0,0,0.9), 0 0 50px rgba(227,93,48,0.4); }
  50% { transform: translateY(-12px); box-shadow: 0 45px 75px -10px rgba(0,0,0,0.7), 0 0 70px rgba(227,93,48,0.65); }
}
.silence-screen .sil-cover:active { transform: scale(0.96) translateY(0); transition: transform .1s; }
.silence-screen .sil-title {
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: clamp(16px,4vw,22px);
  color: rgba(255,255,255,0.9);
  margin-bottom: 20px;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 4px 20px rgba(255,255,255,0.4);
  letter-spacing: 1px;
}
.silence-screen .sil-call {
  font-family: 'Poppins', sans-serif;
  font-size: clamp(18px,5vw,26px);
  font-weight: 600;
  line-height: 1.5;
  background: linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.75) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  text-align: center;
  filter: drop-shadow(0 4px 15px rgba(0,0,0,0.6));
  animation: silCallIn 1s ease .3s both;
}
.silence-screen .sil-sub {
  font-family: 'Poppins', sans-serif;
  font-size: clamp(14px,3.5vw,18px);
  font-weight: 500;
  line-height: 1.4;
  color: rgba(255,255,255,.5);
  margin-bottom: 24px;
  text-align: center;
  animation: silCallIn 1s ease .5s both;
}
@keyframes silCallIn { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }

.silence-screen .sil-pulse {
  font-family: 'Poppins', sans-serif;
  margin-bottom: 28px;
  text-align: center;
  animation: silCallIn 1s ease .7s both;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.pulse-num {
  display: block;
  font-size: clamp(48px,11vw,72px);
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #FF0055 0%, #FF5E00 50%, #FFD700 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
  filter: drop-shadow(0 10px 25px rgba(255,0,85,0.5));
  animation: fire-move 4s ease infinite, popNumber 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes popNumber { 0% { opacity: 0; transform: scale(0.4) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
.pulse-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,.6);
  letter-spacing: 0.8px;
  text-transform: uppercase;
  animation: popNumber 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: 0.1s;
}
.loading-text { animation: breatheLoading 1.5s infinite ease-in-out; color: rgba(255,255,255,0.5); font-size: 15px; letter-spacing: 1.5px; }
@keyframes breatheLoading { 0%, 100% { opacity: 0.3; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1.02); } }

.silence-screen .sil-mark { opacity: 0.2; animation: silCallIn 1s ease 1s both; }
.silence-screen .sil-mark img { height: 22px; width: auto; display: block; margin: 0 auto; filter: invert(1) brightness(1.5); }

/* ════════════════════════════════════════════════════════════════════
   🌒 BOCADO + ECO — Frase oracular antes/después
   Pool: concepts del nucleus del libro (cap + punto en Python)
   Timing: 1500ms appear + 2000ms hold + 1200ms fade = 4.7s total
═══════════════════════════════════════════════════════════════════════ */
.bocado-eco-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  opacity: 0;
  transition: opacity 0.5s ease;
}
.bocado-eco-overlay.visible { display: flex; opacity: 1; }

.bocado-eco-phrase {
  font-family: 'Archivo', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 300;
  font-size: clamp(22px, 6vw, 32px);
  line-height: 1.32;
  color: #fff;
  text-align: center;
  max-width: 640px;
  letter-spacing: -0.5px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@keyframes triggui-word-appear {
  0%   { opacity: 0; transform: translateY(8px); filter: blur(12px); }
  100% { opacity: 1; transform: translateY(0); filter: blur(0); }
}
@keyframes triggui-underline-appear {
  0%   { opacity: 0; transform: scaleX(0); }
  60%  { opacity: 1; transform: scaleX(1); }
  100% { opacity: 0.65; transform: scaleX(1); }
}
.bm-bocado-w, .bm-bocado-anchor {
  display: inline-block;
  opacity: 0;
  animation: triggui-word-appear 1500ms cubic-bezier(0.19, 1, 0.22, 1) forwards;
  will-change: opacity, transform, filter;
}
.bm-bocado-anchor {
  font-weight: 400;
  position: relative;
}
.bm-bocado-anchor::after {
  content: "";
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: -6px;
  height: 1px;
  opacity: 0;
  transform: scaleX(0);
  background: linear-gradient(90deg, transparent, var(--bocado-anchor-color, #FF5E00), transparent);
  animation: triggui-underline-appear 2100ms cubic-bezier(0.19, 1, 0.22, 1) forwards;
  animation-delay: 900ms;
}
.bm-bocado-fading {
  transition: opacity 1200ms cubic-bezier(0.55, 0, 0.55, 1), filter 1200ms cubic-bezier(0.55, 0, 0.55, 1) !important;
  opacity: 0 !important;
  filter: blur(10px) !important;
}

/* Cuando el bocado o eco están activos, los bloques quedan atenuados como contexto detrás del blur */
.grid.bocado-active, .grid.eco-active {
  opacity: 0.25;
  pointer-events: none;
  filter: saturate(0.7);
  transition: opacity 0.5s ease, filter 0.5s ease;
}

@media (max-width: 640px) {
  .grid { gap: 1.2vw; }
  .label { font-size: clamp(0.95rem,4vw,1.4rem); }
  .frase { font-size: clamp(0.9rem,3.5vw,1.3rem); }
  .reveal-overlay { padding: max(4px, env(safe-area-inset-top, 4px)) 4px max(4px, env(safe-area-inset-bottom, 4px)); }
  .reveal-card { border-radius: 18px; max-width: 100%; }
  .reveal-card::after { border-radius: 18px; }
  .ed-block { padding: 20px 18px; margin: 0 4px; }
  .ed-block:first-child { margin-top: 12px; }
  .ed-cover-wrap { width: var(--ed-cover-width-mobile, 110px); margin: 0 0 10px 14px; }
  .ed-block .ed-title { font-size: var(--ed-title-size-mobile, 24px); line-height: 1.18; }
  .ed-block .ed-para { font-size: var(--ed-para-size-mobile, 18px); line-height: 1.65; }
  .ed-block .ed-sub { font-size: var(--ed-sub-size-mobile, 18px); }
  .ed-block .ed-chip { font-size: var(--ed-chip-size-mobile, 14px); margin-bottom: 10px; }
  .card-actions { padding: 14px 18px 20px; }
  .btn-close { top: 8px; left: 8px; }
  .silence-screen .sil-cover { width: 140px; margin-bottom: 25px; }
  .silence-screen .sil-pulse { min-height: 100px; }
}
</style>
<style id="tg-juego">
/* ══ TG JUEGO: capa gemela del organismo (calco verbatim) ══ */
#tgCapa{position:fixed;inset:0;z-index:600;background:transparent;overflow:hidden}
.grid{display:none !important}
.tg-grid.tg-dim,.tg-cta.tg-dim{opacity:0.25;pointer-events:none;filter:saturate(0.7);transition:opacity 0.5s ease, filter 0.5s ease}
body{overflow:hidden}
body.tg-tarjeta .tg-cta{display:none !important}
#revealOverlay{z-index:900}

.tg-grid{position:absolute;inset:5vh 1.5vw;display:grid;gap:1vw}
@media(orientation:landscape){.tg-grid{grid-template-columns:repeat(4,1fr)}}
@media(orientation:portrait){.tg-grid{grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr)}}

.tg-block{position:relative;display:flex;align-items:center;justify-content:center;padding:1rem;border-radius:24px;font-weight:700;cursor:pointer;background-size:320% 320%;transition:transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94);overflow:hidden;isolation:isolate;touch-action:manipulation;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.15),0 4px 6px rgba(0,0,0,.15),0 12px 32px rgba(0,0,0,.35);animation:tgEnter .52s cubic-bezier(.19,1,.22,1) both}
.tg-block::before{content:"";position:absolute;inset:0;border-radius:inherit;background:linear-gradient(145deg,rgba(255,255,255,.18) 0%,rgba(255,255,255,.08) 40%,transparent 100%);pointer-events:none;z-index:1}
.tg-block::after{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.12),transparent 60%);pointer-events:none;opacity:0;transition:opacity .3s ease;z-index:0}
.tg-block:hover::after{opacity:1}
.tg-block:hover{transform:translateY(-2px) scale(1.005);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.22),0 6px 12px rgba(0,0,0,.2),0 16px 48px rgba(0,0,0,.45)}
.tg-block:active{transform:translateY(0) scale(0.995);transition:transform .1s cubic-bezier(0.4,0,0.2,1)}
@keyframes tgEnter{0%{opacity:0;transform:translateY(8px) scale(.992)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes tgHint{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.015)}}
.tg-hint{animation:tgEnter .52s cubic-bezier(.19,1,.22,1) both, tgHint 1.8s ease-in-out 1 2s}

.tg-label,.tg-frase{z-index:2;text-align:center;transition:opacity .25s ease,transform .25s ease;text-shadow:none;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
.tg-label{opacity:1;transform:translateY(0);font-size:clamp(1.05rem,3.2vw,1.7rem);font-weight:700;line-height:1.35;letter-spacing:.2px}
.tg-frase{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:1rem;opacity:0;transform:translateY(6px);font-size:clamp(1rem,3vw,1.5rem);font-weight:600;line-height:1.4;pointer-events:none}
.tg-block.show .tg-label{opacity:0;transform:translateY(-6px)}
.tg-block.show .tg-frase{opacity:1;transform:translateY(0);pointer-events:auto}

.tg-portada{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;padding:1rem;animation:tgPop .6s cubic-bezier(0.34,1.56,0.64,1) forwards;max-height:90%}
@keyframes tgPop{0%{transform:scale(.85);opacity:0}100%{transform:scale(1);opacity:1}}
.tg-portada img{max-width:100%;max-height:100%;border-radius:10px;box-shadow:0 14px 40px rgba(0,0,0,.5);pointer-events:none;-webkit-touch-callout:none;-webkit-user-drag:none;user-select:none;-webkit-user-select:none}
.tg-porttext{text-align:center;color:#fff}
.tg-porttext h2{font-family:'Playfair Display',serif;font-size:clamp(1.1rem,3.4vw,1.6rem);margin:0 0 6px}
.tg-porttext p{font-size:.85rem;opacity:.8;margin:0}

.tg-cta{position:fixed;bottom:max(3vh,env(safe-area-inset-bottom,3vh));left:50%;transform:translateX(-50%);z-index:640;display:none;gap:clamp(0.5rem,2vw,0.9rem);justify-content:center}
.tg-cta button{width:clamp(3.5rem,min(8vw,8vh),4.5rem);height:clamp(3.5rem,min(8vw,8vh),4.5rem);border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:clamp(1.5rem,3.5vw,2rem);cursor:pointer;background-size:200% 200%;box-shadow:0 0 0 1px rgba(255,255,255,.15),0 6px 18px rgba(0,0,0,.35);transition:transform .2s cubic-bezier(0.34,1.56,0.64,1);touch-action:manipulation}
.tg-cta button:hover{transform:translateY(-3px) scale(1.05);box-shadow:0 0 0 1px rgba(255,255,255,.25),0 8px 24px rgba(0,0,0,.45)}
.tg-cta button:active{transform:translateY(0) scale(0.95);transition:transform .1s ease}
__BTN_CSS__

#tgModal{display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center;background:rgba(0,0,0,0.92);opacity:0;transition:opacity .3s ease}
#tgModal.visible{display:flex;opacity:1}
.tg-mglass{background:linear-gradient(145deg,rgba(30,34,50,0.98),rgba(10,12,20,0.99));border:1px solid rgba(255,255,255,0.14);border-radius:28px;padding:32px;width:88%;max-width:400px;text-align:center;transform:scale(0.92);transition:transform .4s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 30px 80px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.08),inset 0 1px 0 rgba(255,255,255,0.15)}
#tgModal.visible .tg-mglass{transform:scale(1)}
.tg-memoji{font-size:44px;line-height:1}
.tg-mtitle{font-family:'Poppins',sans-serif;font-weight:700;font-size:20px;margin:12px 0 6px;color:#fff}
.tg-mtext{font-size:15px;line-height:1.55;color:rgba(255,255,255,.85)}
.tg-mtext .hl{display:block;margin-top:10px;color:var(--accent,#42d97c);font-weight:600}
.tg-mbtns{display:flex;gap:10px;margin-top:22px}
.tg-btn{flex:1;padding:13px 0;border-radius:14px;border:none;font-family:'Poppins',sans-serif;font-weight:600;font-size:14px;cursor:pointer}
.tg-bp{background:#fff;color:#111}
.tg-bs{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.15)}

#tgToast{position:fixed;top:90px;left:50%;transform:translateX(-50%) translateY(-20px);z-index:660;background:rgba(20,24,38,0.98);border:1px solid rgba(255,255,255,0.12);padding:12px 24px;border-radius:16px;font-size:15px;color:#fff;font-weight:600;opacity:0;pointer-events:none;transition:all .3s ease;box-shadow:0 8px 24px rgba(0,0,0,0.4);text-align:center;max-width:80%}
#tgToast.visible{opacity:1;transform:translateX(-50%) translateY(0)}

.tg-giro{display:inline-block;filter:grayscale(1) brightness(2.6);animation:tgGira .9s linear infinite}
@keyframes tgGira{to{transform:rotate(360deg)}}
#tgModal.espera{background:rgba(0,0,0,0.5)}
#tgModal.espera .tg-mglass{background:transparent;border:none;box-shadow:none;padding:0;width:auto;max-width:none}
#tgModal.espera .tg-giro{font-size:30px}
#tgModal.espera .tg-mtitle,#tgModal.espera .tg-mbtns{display:none}
#tgModal.espera .tg-mtext{display:block;font-size:12px;letter-spacing:.02em;color:rgba(255,255,255,.75);margin:14px 0 0 0}
#tgModal.espera .tg-mtext .hl{display:none}
.tg-heart{position:fixed;pointer-events:none;z-index:700;font-size:24px;opacity:0;animation:tgFloatUp 1.2s ease-out forwards;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))}
@keyframes tgFloatUp{0%{transform:translate(0,0) scale(0.5) rotate(0deg);opacity:0}20%{opacity:1;transform:translate(var(--tx),-40px) scale(1.2) rotate(15deg)}100%{opacity:0;transform:translate(var(--tx),-150px) scale(1) rotate(30deg)}}
</style>
</head>
<body data-lab-v="live-edition-card-v3" style="__BODY_STYLE__">

<button id="tgLangPill" type="button" aria-label="Toggle language"><span id="tgLangEs">Español</span><span id="tgLangEn">English</span></button>
<div id="pulseLine" class="pulse-line"></div>
<div class="bocado-eco-overlay" id="bocadoEcoOverlay">
  <div class="bocado-eco-phrase" id="bocadoEcoPhrase"></div>
</div>
<div class="grid" id="grid"></div>

<div id="revealOverlay" class="reveal-overlay">
  <div class="reveal-card" onclick="event.stopPropagation()">
    <button class="btn-close" id="btnBack" aria-label="Cerrar">×</button>
    <div class="card-inner">

      <div class="ed-block" id="editorialBlockTop">
        <div class="ed-flow" id="editorialFlowTop">
          __COVER_CTA_HTML__
          <div class="ed-title" id="editorialTitle">__CARD_TITLE__</div>
          <div class="ed-chip" id="editorialChip">__CARD_AUTHOR__</div>
          <div class="ed-para" id="editorialTopPara">__TOP_HTML__</div>
        </div>
      </div>__SECOND_BLOCK_HTML__

      __EDICION_EYEBROW_HTML__

      <div class="card-actions">
        <div class="btn-row btn-row-2">
          <a class="btn-light" href="https://triggui.com" target="_blank" rel="noopener noreferrer">
            <img class="btn-triggui-logo" src="https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/trigguiletras2.png" alt="Triggui">
          </a>
          <a class="btn-light" href="https://www.instagram.com/triggui/" target="_blank" rel="noopener noreferrer">
            <svg class="btn-ig-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="6" stroke="white" stroke-width="1.8"/>
              <circle cx="12" cy="12" r="5" stroke="white" stroke-width="1.8"/>
              <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
            </svg>
          </a>
        </div>

        <div class="btn-row btn-row-3">
          <a class="btn-dark" href="https://www.buscalibre.com.mx/libros/search/?q=__BUSCA_COMPRAR__" target="_blank" rel="noopener noreferrer">
            <img class="btn-busca-logo" src="/buscalibre.png" alt="Buscalibre">
          </a>

          <a class="btn-dark btn-crystal" id="btnCrystal" href="https://www.buscalibre.com.mx/libros/search/?q=__BUSCA_EXPLORAR__" target="_blank" rel="noopener noreferrer">
            <span class="btn-emoji">🔮</span>
          </a>

          <a class="btn-dark btn-penguin-icon" id="btnPenguin" href="https://www.penguinlibros.com/mx/?mot_q=__PENGUIN_Q__" target="_blank" rel="noopener noreferrer">
            <img src="/logopenguin.png" alt="Penguin">
          </a>
        </div>
      </div>

    </div>
  </div>

  <div class="silence-screen" id="silenceScreen">__SILENCE_COVER_HTML__
    <div class="sil-title">__SILENCE_TITLE__</div>
    <div class="sil-call">Queremos que te den ganas<br>de abrir un libro.</div>
    <div class="sil-sub">Eso es Triggui.</div>
    <div class="sil-pulse" id="silPulse"></div>
    <div class="sil-mark">
      <img src="https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/trigguiletras2.png" alt="Triggui">
    </div>
  </div>
</div>

<script>
const state = __STATE_JSON__;
const TG_COVER_SRC = __TG_COVER_SRC__;
/* 🌐 D2-A — idioma de la edición: misma llave del imperio (triggui_lang) */
const TG_ES_SNAP = { t: null, p: null, su: null, b: null };
let tgLang = (function(){ try { const v = JSON.parse(localStorage.getItem('triggui_lang')||'null'); if (v==='en'||v==='es') return v; } catch(e){} return ((navigator.language||'es').slice(0,2)==='en') ? 'en' : 'es'; })();
function tgIds(){ return { t: document.getElementById('editorialTitle'), p: document.getElementById('editorialTopPara'), su: document.getElementById('editorialSub'), b: document.getElementById('editorialBottomPara') }; }
function tgSnap(){ const n=tgIds(); if(n.t&&TG_ES_SNAP.t===null)TG_ES_SNAP.t=n.t.innerHTML; if(n.p&&TG_ES_SNAP.p===null)TG_ES_SNAP.p=n.p.innerHTML; if(n.su&&TG_ES_SNAP.su===null)TG_ES_SNAP.su=n.su.innerHTML; if(n.b&&TG_ES_SNAP.b===null)TG_ES_SNAP.b=n.b.innerHTML; }
function tgApplyCard(){ const en=state.i18nEn||{}; tgSnap(); const n=tgIds();
  if(tgLang==='en'){ if(n.t&&en.cardTitle)n.t.textContent=en.cardTitle; if(n.p&&en.top)n.p.innerHTML=en.top; if(n.su&&en.sub)n.su.textContent=en.sub; if(n.b&&en.bot)n.b.innerHTML=en.bot; }
  else { if(n.t&&TG_ES_SNAP.t!==null)n.t.innerHTML=TG_ES_SNAP.t; if(n.p&&TG_ES_SNAP.p!==null)n.p.innerHTML=TG_ES_SNAP.p; if(n.su&&TG_ES_SNAP.su!==null)n.su.innerHTML=TG_ES_SNAP.su; if(n.b&&TG_ES_SNAP.b!==null)n.b.innerHTML=TG_ES_SNAP.b; } }
function tgApplyGrid(){ const en=(tgLang==='en');
  if(en){ state._fes=state._fes||state.frases; state._pes=state._pes||state.palabras; state._tes=state._tes||state.titulo; state._bes=state._bes||state.bocadoEcoPool;
    if(Array.isArray(state.frases_en)&&state.frases_en.length===4) state.frases=state.frases_en;
    if(Array.isArray(state.palabras_en)&&state.palabras_en.length===4) state.palabras=state.palabras_en;
    if(state.titulo_en) state.titulo=state.titulo_en;
    if(Array.isArray(state.bocadoEcoPool_en)&&state.bocadoEcoPool_en.length) state.bocadoEcoPool=state.bocadoEcoPool_en;
  } else if(state._fes){ state.frases=state._fes; state.palabras=state._pes||state.palabras; state.titulo=state._tes||state.titulo; state.bocadoEcoPool=state._bes||state.bocadoEcoPool; }
  var LL=window.__tgL; if(LL){ LL.palabras=(state.palabras||[]).slice(0,4); LL.frases=(state.frases||[]).slice(0,4); LL.titulo=state.titulo||LL.titulo; } }
function tgApplySilence(){ const en=(tgLang==='en'); const t=document.querySelector('.sil-title'); if(t) t.textContent=state.titulo||''; const c=document.querySelector('.sil-call'); if(c) c.innerHTML= en?'We want you to feel like<br>opening a book.':'Queremos que te den ganas<br>de abrir un libro.'; const su=document.querySelector('.sil-sub'); if(su) su.textContent= en?"That's Triggui.":'Eso es Triggui.'; }
function tgRepaintGrid(){ var blocks=document.querySelectorAll('.tg-block');
  for(var i=0;i<blocks.length&&i<4;i++){
    var lb=blocks[i].querySelector('.tg-label'); if(lb) lb.textContent=state.palabras[i]||'';
    var fr=blocks[i].querySelector('.tg-frase'); if(fr) fr.textContent=state.frases[i]||'';
    var h2=blocks[i].querySelector('.tg-porttext h2'); if(h2) h2.textContent=state.titulo||''; } }
function tgApplyMisc(){
  var EN=(tgLang==='en');
  var num=document.getElementById('pulseLineNum');
  if(num){ var pl=num.parentNode; var n=num.textContent;
    pl.innerHTML = EN ? ('Already <span id="pulseLineNum" style="font-weight:700;color:rgba(255,255,255,.75);">'+n+'</span> books opened together.') : ('Ya van <span id="pulseLineNum" style="font-weight:700;color:rgba(255,255,255,.75);">'+n+'</span> libros abiertos juntos.'); }
  [['tgLibro','Abrir tarjeta','Open the card'],['tgLike','Guardar en mi espiral','Save to my spiral'],['tgEsp','Tu espiral','Your spiral']].forEach(function(p){ var e=document.getElementById(p[0]); if(e) e.setAttribute('aria-label', EN?p[2]:p[1]); });
  var bb=document.getElementById('btnBack'); if(bb) bb.setAttribute('aria-label', EN?'Close':'Cerrar');
  var ch=document.querySelector('.cover-hint'); if(ch) ch.textContent = EN?'Tap the book':'Toca el libro';
}
function tgPillPlace(){ try{ var p=document.getElementById('tgLangPill'); if(!p) return;
  var bs=document.querySelectorAll('.tg-block'); var blk=bs[bs.length-1];
  if(blk){ var r=blk.getBoundingClientRect();
    if(r.width>40 && r.height>40){
      p.style.top=(Math.round(r.top)+18)+'px';
      p.style.right=(Math.round(window.innerWidth - r.right)+18)+'px'; return; } }
  p.style.top=''; p.style.right=''; }catch(e){} }
window.addEventListener('resize', function(){ tgPillPlace(); });
window.addEventListener('load', function(){ tgPillPlace(); setTimeout(tgPillPlace, 650); });
function tgPillPaint(){ const a=document.getElementById('tgLangEs'), b=document.getElementById('tgLangEn'); if(a&&b){ a.classList.toggle('lang-active', tgLang==='es'); b.classList.toggle('lang-active', tgLang==='en'); } }
function tgSetLang(l){ if(l===tgLang){ tgPillPaint(); return; } tgLang=l; window.tgLang=l; try{ localStorage.setItem('triggui_lang', JSON.stringify(l)); }catch(e){} tgApplyGrid(); tgRepaintGrid(); tgApplyCard(); tgApplySilence(); tgPillPaint(); tgApplyMisc(); }
tgApplyGrid(); /* swap pre-pintado: el grid nace en el idioma correcto */
document.addEventListener('DOMContentLoaded', function(){ window.tgLang=tgLang; tgPillPlace(); tgApplyMisc(); tgApplyCard(); tgApplySilence(); tgPillPaint(); const a=document.getElementById('tgLangEs'), b=document.getElementById('tgLangEn'); if(a)a.addEventListener('click',function(){tgSetLang('es');}); if(b)b.addEventListener('click',function(){tgSetLang('en');}); const pl=document.getElementById('tgLangPill'); if(pl)pl.addEventListener('click',function(ev){ if(ev.target&&ev.target.closest&&ev.target.closest('#tgLangEs,#tgLangEn'))return; tgSetLang(tgLang==='en'?'es':'en'); }); const _ro=document.getElementById('revealOverlay'); if(_ro&&pl){ const _sync=function(){ const cs=getComputedStyle(_ro); const abierto=(cs.display!=='none'); pl.style.display=abierto?'none':'flex'; }; new MutationObserver(_sync).observe(_ro,{attributes:true,attributeFilter:['class','style']}); _sync(); } });
const grid = document.getElementById('grid');
const revealOverlay = document.getElementById('revealOverlay');
const btnBack = document.getElementById('btnBack');
const coverCTA = document.getElementById('coverCTA');
const coverHint = coverCTA ? coverCTA.querySelector('.cover-hint') : null;
const revealCard = document.querySelector('.reveal-card');
const silenceScreen = document.getElementById('silenceScreen');
const silPulse = document.getElementById('silPulse');
const pulseEditionKey = 'triggui_lab_opened_' + state.id;
const btnCrystal = document.getElementById('btnCrystal');
const btnPenguin = document.getElementById('btnPenguin');

const ANG = [115, 205, 35, 320];
function grad(i) {
  return 'linear-gradient(' + ANG[i % 4] + 'deg,' + state.colores[i] + ',' + state.colores[(i + 1) % 4] + ')';
}

let overlayView = 'blocks';
let coverBusy = false;
const revealIndex = Math.floor(Math.random() * 4);
const emojis = ['🌊', '🛡️', '🧠', '✨', '📘', '🔮', '❤️', '🪞'];

function clearBlockStates() {
  Array.from(grid.children).forEach((block) => {
    block.classList.remove('show', 'dim');
  });
}

function hideGrid() {
  grid.classList.add('hidden');
}

function showGrid() {
  clearBlockStates();
  grid.classList.remove('hidden');
}

function resetCardState() {
  coverBusy = false;
  if (coverCTA) coverCTA.style.pointerEvents = '';
  if (coverHint) coverHint.textContent = 'Toca el libro';
}

function setOverlayView(next) {
  overlayView = next;
  const overlayVisible = next !== 'blocks';

  if (overlayVisible) {
    revealOverlay.style.display = 'flex';
    void revealOverlay.offsetWidth;
  }

  revealOverlay.style.opacity = overlayVisible ? '1' : '0';
  revealOverlay.style.pointerEvents = overlayVisible ? 'auto' : 'none';

  if (next === 'blocks') {
    resetCardState();
    revealCard.style.display = '';
    silenceScreen.style.display = 'none';
    revealCard.style.transform = 'scale(0.94) translateY(15px)';
    revealCard.style.opacity = '0';

    setTimeout(() => {
      if (overlayView === 'blocks') {
        revealOverlay.style.display = 'none';
      }
    }, 350);
    return;
  }

  if (next === 'card') {
    resetCardState();
    revealCard.style.display = '';
    silenceScreen.style.display = 'none';
    revealCard.style.transform = 'scale(0.98) translateY(10px)';
    revealCard.style.opacity = '0';

    requestAnimationFrame(() => {
      revealCard.style.transform = 'scale(1) translateY(0)';
      revealCard.style.opacity = '1';
      requestAnimationFrame(() => fitRevealTypography());
    });
    return;
  }

  if (next === 'silence') {
    revealCard.style.display = 'none';
    silenceScreen.style.display = 'flex';
  }
}

function openOverlayFromBlocks() {
  hideGrid();
  setOverlayView('card');
}

function closeOverlayToBlocks() {
  // 🌒 Si venimos de tarjeta o silence-screen, disparar eco antes de los bloques
  const cameFromCardOrSilence = (overlayView === 'card' || overlayView === 'silence');
  setOverlayView('blocks');
  setTimeout(() => {
    showGrid();
    if (cameFromCardOrSilence && state.bocadoEcoPool && state.bocadoEcoPool.length > 0) {
      grid.classList.add('eco-active');
      setTimeout(() => {
        showEco(() => {
          grid.classList.remove('eco-active');
        });
      }, 100);
    }
  }, 180);
}

function moveToSilence() {
  setOverlayView('silence');
}

async function getCollectivePulse() {
  try {
    const res = await fetch('https://triggui-api.vercel.app/api/get?cb=' + Date.now(), {
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const total = Number(data && data.total ? data.total : 0);
    if (!isFinite(total) || total <= 0) return null;
    return total;
  } catch (e) {
    console.warn('[pulse] get failed:', e && e.message ? e.message : e);
    return null;
  }
}

async function registerCollectivePhysicalOpen() {
  try {
    if (localStorage.getItem(pulseEditionKey) === '1') {
      const count = await getCollectivePulse();
      return { count: count, repeated: true, ok: count !== null };
    }
  } catch (e) {
    // localStorage bloqueado (Safari private, cookies disabled): continuamos sin memoria
  }

  try {
    const res = await fetch('https://triggui-api.vercel.app/api/increment', {
      method: 'GET',
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const total = Number(data && data.total ? data.total : 0);

    if (data && data.success !== false && total > 0) {
      try { localStorage.setItem(pulseEditionKey, '1'); } catch (e) { /* ignore */ }
      return { count: total, repeated: false, ok: true };
    }
    // Respuesta del servidor no OK semánticamente: fallback a get
    const fallback = await getCollectivePulse();
    return { count: fallback, repeated: false, ok: fallback !== null };
  } catch (e) {
    console.warn('[pulse] increment failed:', e && e.message ? e.message : e);
    // Fallback graceful: si increment falla, lee el total actual
    const fallback = await getCollectivePulse();
    return { count: fallback, repeated: false, ok: fallback !== null };
  }
}

// Animación suave 0 -> target con easeOutQuart (1.2-1.5s típicos).
// Safe: si element es null, targetNumber no-positivo, o el span cambia, no rompe.
function animatePulseNumber(element, targetNumber, durationMs) {
  if (!element || typeof targetNumber !== 'number' || !isFinite(targetNumber) || targetNumber <= 0) return;
  var duration = (typeof durationMs === 'number' && durationMs > 0) ? durationMs : 1200;
  var start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
  var raf = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : function (cb) { return setTimeout(cb, 16); };
  var step = function (now) {
    // Si el elemento fue removido del DOM, abortar limpio
    if (!document.body.contains(element)) return;
    var elapsed = now - start;
    var progress = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 4);
    var current = Math.floor(targetNumber * eased);
    try {
      element.textContent = current.toLocaleString('es-MX');
    } catch (e) {
      element.textContent = String(current);
    }
    if (progress < 1) {
      raf(step);
    } else {
      try { element.textContent = targetNumber.toLocaleString('es-MX'); }
      catch (e) { element.textContent = String(targetNumber); }
    }
  };
  raf(step);
}

function getChronoOrder(hour) {
  if (hour >= 4 && hour <= 6) return [3, 2, 1, 0];
  if (hour >= 7 && hour <= 11) return [0, 2, 1, 3];
  if (hour >= 12 && hour <= 16) return [2, 0, 1, 3];
  if (hour >= 17 && hour <= 20) return [1, 3, 2, 0];
  return [3, 1, 2, 0];
}

const currentHour = new Date().getHours();
const chronoOrder = getChronoOrder(currentHour);

function getPrimaryChronoWord() {
  const idx = chronoOrder[0];
  const candidate = (state.palabras && state.palabras[idx]) || state.palabra || state.titulo || '';
  return String(candidate || '').trim();
}

function applyDynamicActionLinks() {
  const word = getPrimaryChronoWord();
  if (!word) return;

  const encoded = encodeURIComponent(word);

  if (btnCrystal) {
    btnCrystal.href = 'https://www.buscalibre.com.mx/libros/search/?q=' + encoded;
  }

  if (btnPenguin) {
    btnPenguin.href = 'https://www.penguinlibros.com/mx/?mot_q=' + encoded;
  }
}

function fitRevealTypography() {
  const title = document.getElementById('editorialTitle');
  const chip = document.getElementById('editorialChip');
  const topPara = document.getElementById('editorialTopPara');
  const sub = document.getElementById('editorialSub');
  const bottomPara = document.getElementById('editorialBottomPara');
  const cover = document.getElementById('coverCTA');

  if (!title || !topPara) return;

  const rootStyles = getComputedStyle(document.body);
  const px = (el, prop) => el ? (parseFloat(getComputedStyle(el)[prop]) || 0) : 0;
  const setPx = (el, prop, value) => { if (el) el.style[prop] = `${value}px`; };
  const readVar = (name, fallback) => {
    const value = parseFloat(rootStyles.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const limits = {
    titleMin: readVar('--ed-title-size', 28) * 0.88,
    titleMax: readVar('--ed-title-size', 28) * 1.10,
    chipMin: readVar('--ed-chip-size', 15) * 0.92,
    chipMax: readVar('--ed-chip-size', 15) * 1.08,
    paraMin: readVar('--ed-para-size', 18) * 0.92,
    paraMax: readVar('--ed-para-size', 18) * 1.10,
    subMin: readVar('--ed-sub-size', 18) * 0.92,
    subMax: readVar('--ed-sub-size', 18) * 1.08,
    coverMin: readVar('--ed-cover-width', 120) * 0.90,
    coverMax: readVar('--ed-cover-width', 120) * 1.08,
  };

  const textGapToCover = () => {
    if (!cover) return 0;
    const coverRect = cover.getBoundingClientRect();
    const candidates = [title, chip, topPara].filter(Boolean);
    const bottom = Math.max(...candidates.map((el) => el.getBoundingClientRect().bottom));
    return coverRect.bottom - bottom;
  };

  let guard = 0;
  while (cover && textGapToCover() > 12 && guard < 120) {
    const nextTitle = clamp(px(title, 'fontSize') + 0.20, limits.titleMin, limits.titleMax);
    const nextChip = clamp(px(chip, 'fontSize') + 0.06, limits.chipMin, limits.chipMax);
    const nextPara = clamp(px(topPara, 'fontSize') + 0.14, limits.paraMin, limits.paraMax);
    const nextCover = clamp(px(cover, 'width') + (guard % 2 === 0 ? 0.35 : 0), limits.coverMin, limits.coverMax);

    if (
      nextTitle === px(title, 'fontSize')
      && nextChip === px(chip, 'fontSize')
      && nextPara === px(topPara, 'fontSize')
      && nextCover === px(cover, 'width')
    ) {
      break;
    }

    setPx(title, 'fontSize', nextTitle);
    setPx(chip, 'fontSize', nextChip);
    setPx(topPara, 'fontSize', nextPara);
    setPx(cover, 'width', nextCover);
    guard += 1;
  }

  if (sub && bottomPara) {
    const density = (sub.textContent.trim().length * 0.85) + bottomPara.textContent.trim().length;
    const boost = clamp((145 - density) / 145, 0, 1);
    if (boost > 0) {
      setPx(sub, 'fontSize', clamp(px(sub, 'fontSize') + (boost * 0.7), limits.subMin, limits.subMax));
      setPx(bottomPara, 'fontSize', clamp(px(bottomPara, 'fontSize') + (boost * 0.9), limits.paraMin, limits.paraMax));
    }
  }
}

/* ════════════════════════════════════════════════════════════════════
   🌒 BOCADO + ECO — funciones cuánticas
═══════════════════════════════════════════════════════════════════════ */
const bocadoEcoState = {
  used: new Set(),
  active: false,
};
const BOCADO_TIMING = { appear: 1500, hold: 2000, fade: 1200, wordStagger: 60 };

function pickFromPool(roleHints) {
  // 🌒 V14 sinfónico: detecta auto si pool es de objetos o strings
  const raw = state.bocadoEcoPool || [];
  if (raw.length === 0) return null;

  const firstItem = raw[0];
  const isSinfonico = firstItem && typeof firstItem === 'object';

  if (isSinfonico) {
    // Pool V14: objetos {phrase, rol, animo, origin}
    let candidates = raw.filter(o => o && o.phrase && o.phrase.length >= 8);
    if (candidates.length === 0) return null;

    if (roleHints && roleHints.length > 0) {
      const filtered = candidates.filter(o => roleHints.indexOf(o.rol) !== -1);
      if (filtered.length > 0) candidates = filtered;
    }

    let available = candidates.filter(o => !bocadoEcoState.used.has(o.phrase));
    if (available.length === 0) {
      bocadoEcoState.used.clear();
      available = candidates.slice();
    }

    const chosen = available[Math.floor(Math.random() * available.length)];
    bocadoEcoState.used.add(chosen.phrase);

    return {
      phrase: chosen.phrase,
      rol_solicitado: (roleHints && roleHints.length > 0) ? roleHints.join(',') : '(cualquiera)',
      rol_obtenido: chosen.rol,
      eje_animo: chosen.animo,
      origin: chosen.origin,
    };
  }

  // Pool V13 legacy: strings (backward-compat para libros pre-v12)
  const pool = raw.filter(p => typeof p === 'string' && p && p.length >= 8);
  if (pool.length === 0) return null;
  let available = pool.filter(p => !bocadoEcoState.used.has(p));
  if (available.length === 0) {
    bocadoEcoState.used.clear();
    available = pool.slice();
  }
  const phrase = available[Math.floor(Math.random() * available.length)];
  bocadoEcoState.used.add(phrase);

  return {
    phrase: phrase,
    rol_solicitado: (roleHints && roleHints.length > 0) ? roleHints.join(',') : '(cualquiera)',
    rol_obtenido: '(legacy_string)',
    eje_animo: null,
    origin: 'concept_legacy',
  };
}

function segmentPhrase(text) {
  const words = String(text || '').split(/\\s+/).filter(w => w.length > 0);
  const n = words.length;
  if (n < 2) return { body: '', anchor: words.join(' ') };
  const anchorCount = n <= 4 ? 1 : 2;
  return {
    body: words.slice(0, n - anchorCount).join(' '),
    anchor: words.slice(n - anchorCount).join(' '),
  };
}

function buildPhraseHTML(text, accentColor) {
  const seg = segmentPhrase(text);
  let html = '';
  let delay = 0;
  if (seg.body) {
    const bodyWords = seg.body.split(/\\s+/);
    for (const w of bodyWords) {
      html += '<span class="bm-bocado-w" style="animation-delay:' + delay + 'ms">' + w + '&nbsp;</span>';
      delay += BOCADO_TIMING.wordStagger;
    }
  }
  html += '<span class="bm-bocado-anchor" style="animation-delay:' + delay + 'ms;color:' + accentColor + ';">' + seg.anchor + '</span>';
  return html;
}

function showBocadoEco(kind, onComplete, roleHints) {
  if (bocadoEcoState.active) return false;
  const picked = pickFromPool(roleHints);
  if (!picked) {
    if (typeof onComplete === 'function') onComplete();
    return false;
  }
  const phrase = picked.phrase;
  bocadoEcoState.active = true;

  const overlay = document.getElementById('bocadoEcoOverlay');
  const phraseEl = document.getElementById('bocadoEcoPhrase');
  if (!overlay || !phraseEl) {
    bocadoEcoState.active = false;
    if (typeof onComplete === 'function') onComplete();
    return false;
  }

  // Color del anchor: usar el accent del libro o color de bloque 1
  let accentColor = '#FF5E00';
  try {
    if (state.colores && state.colores[1]) {
      accentColor = state.colores[1];
    }
  } catch (_) {}
  overlay.style.setProperty('--bocado-anchor-color', accentColor);

  phraseEl.classList.remove('bm-bocado-fading');
  phraseEl.innerHTML = buildPhraseHTML(phrase, accentColor);
  overlay.classList.add('visible');

  const totalWords = phrase.split(/\\s+/).length;
  const fullAppear = BOCADO_TIMING.appear + totalWords * BOCADO_TIMING.wordStagger + 300;
  const holdEnd = fullAppear + BOCADO_TIMING.hold;

  setTimeout(() => phraseEl.classList.add('bm-bocado-fading'), holdEnd);

  setTimeout(() => {
    overlay.classList.remove('visible');
    phraseEl.innerHTML = '';
    phraseEl.classList.remove('bm-bocado-fading');
    bocadoEcoState.active = false;
    if (typeof onComplete === 'function') onComplete();
    if (typeof console !== 'undefined' && console.log) {
      // 🌒 V14 SINFÓNICO: log con paridad matemática a la app webview
      console.log('[Triggui ' + kind + ' v14]', {
        role_solicitado: picked.rol_solicitado,
        role_obtenido: picked.rol_obtenido,
        eje_animo: picked.eje_animo,
        source: state.titulo,
        origin: picked.origin,
        phrase: phrase,
      });
    }
  }, holdEnd + BOCADO_TIMING.fade + 100);

  return true;
}

function showBocado(onComplete) {
  // 🌒 V14: opening → preferir abrir/profundizar (lleva al usuario adentro)
  return showBocadoEco('Bocado', onComplete, ['abrir', 'profundizar']);
}

function showEco(onComplete) {
  // 🌒 V14: closing → preferir resonar/aterrizar (deja resonancia al cerrar)
  return showBocadoEco('Eco', onComplete, ['resonar', 'aterrizar']);
}

function renderBlocks() {
  grid.innerHTML = '';

  for (let visualIdx = 0; visualIdx < 4; visualIdx++) {
    const realIdx = chronoOrder[visualIdx];

    const card = document.createElement('div');
    card.className = 'block';
    card.style.background = grad(realIdx);
    card.dataset.idx = String(visualIdx);
    card.dataset.realIdx = String(realIdx);

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = emojis[realIdx % emojis.length] + ' ' + state.palabras[realIdx];
    label.style.color = state.textColors[realIdx] || '#fff';

    const frase = document.createElement('div');
    frase.className = 'frase';
    frase.textContent = state.frases[realIdx];
    frase.style.color = state.textColors[realIdx] || '#fff';

    card.append(label, frase);

    card.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const blocks = Array.from(grid.children);

      if (visualIdx === revealIndex) {
        openOverlayFromBlocks();
        return;
      }

      const already = card.classList.contains('show');
      clearBlockStates();

      if (!already) {
        card.classList.add('show');
        blocks.forEach((b, j) => {
          if (j !== visualIdx) b.classList.add('dim');
        });
      }
    };

    grid.append(card);
  }
}

btnBack.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeOverlayToBlocks();
});

revealOverlay.addEventListener('click', (e) => {
  if (e.target === revealOverlay && overlayView === 'card') {
    closeOverlayToBlocks();
  }
});

if (coverCTA) {
  coverCTA.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (overlayView !== 'card' || coverBusy) return;

    coverBusy = true;
    coverCTA.style.pointerEvents = 'none';
    if (coverHint) coverHint.textContent = '...';

    moveToSilence();
    silPulse.innerHTML = '<span class="pulse-label loading-text">Conectando...</span>';

    registerCollectivePhysicalOpen().then(function (result) {
      if (result && result.ok && typeof result.count === 'number' && result.count > 0) {
        // El CSS .pulse-num anima el span (gradiente fuego + popNumber bounce).
        // El JS anima el textContent interno (0 -> total con easeOutQuart).
        silPulse.innerHTML = '<span class="pulse-num" id="postTapNum">0</span><span class="pulse-label">libros abiertos juntos</span>';
        var numEl = document.getElementById('postTapNum');
        animatePulseNumber(numEl, result.count, 1400);
      } else {
        silPulse.innerHTML = '<span class="pulse-label">Se registró el acto.</span>';
      }
    }).catch(function (err) {
      console.warn('[pulse] post-tap error:', err && err.message ? err.message : err);
      silPulse.innerHTML = '<span class="pulse-label">Se registró el acto.</span>';
    });
  });
}

silenceScreen.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (overlayView === 'silence') {
    closeOverlayToBlocks();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (overlayView === 'silence' || overlayView === 'card') {
    closeOverlayToBlocks();
  }
});

window.addEventListener('resize', () => {
  if (overlayView === 'card') {
    requestAnimationFrame(() => fitRevealTypography());
  }
});

renderBlocks();
applyDynamicActionLinks();
setOverlayView('blocks');

// 🌒 Bocado al cargar — primero ocultamos bloques, mostramos bocado, y
// cuando termina volvemos a mostrar bloques con su atmósfera intacta.
/* 🌀 v7: FOTO DE REGRESO de la edición — si el viaje a la espiral salió de ESTA edición con los
   bloques abiertos, al volver se repone la pantalla tal cual: sin eco de apertura y ya revelada. */
var __tgRegresando=false;
try{
  window.addEventListener('pageshow', function(ev){ if(ev && ev.persisted){ try{ sessionStorage.removeItem('tg_ed_foto'); }catch(e){} } });
  var __f=JSON.parse(sessionStorage.getItem('tg_ed_foto')||'null');
  if(__f && __f.ruta===location.pathname && (Date.now()-(__f.t||0))<6*3600*1000){
    __tgRegresando=true;
    try{ if(typeof __f.port==='number') window.__tgFotoPort=__f.port; }catch(e){}
    sessionStorage.removeItem('tg_ed_foto');
    var __rep=function(){ try{ if(document.querySelector('.tg-block.show')) return;
      var q=document.querySelector('.tg-block .tg-portada');
      if(q && q.parentElement) q.parentElement.click(); }catch(e){} };
    __rep(); setTimeout(__rep,0); setTimeout(__rep,150);
    /* el gemelo atenua el grid al cargar contando con que el bocado lo despierte;
       en el regreso el bocado no corre, asi que despertamos nosotros la pantalla. */
    var __despierta=function(){ try{
      var g=document.getElementById('tgGrid'), k=document.getElementById('tgCta');
      if(g) g.classList.remove('tg-dim','bocado-active','eco-active');
      if(k) k.classList.remove('tg-dim');
      var v=document.getElementById('bocadoEcoOverlay'); if(v) v.classList.remove('visible');
    }catch(e){} };
    __despierta(); setTimeout(__despierta,0); setTimeout(__despierta,150);
    setTimeout(__despierta,450); setTimeout(__despierta,1000); setTimeout(__despierta,1800);
  }
  try{ window.__tgRegresando=__tgRegresando; }catch(e){}
}catch(e){}
(function triggerOpeningBocado() {
  if (__tgRegresando) return;
  if (!state.bocadoEcoPool || state.bocadoEcoPool.length === 0) return;
  grid.classList.add('bocado-active');
  // Pequeño delay para que el browser pinte la página primero
  setTimeout(() => {
    showBocado(() => {
      grid.classList.remove('bocado-active');
    });
  }, 200);
})();

(function() {
  const k = () => {
    document.querySelectorAll('vercel-live-feedback,vercel-toolbar,[data-vercel-toolbar]').forEach((el) => el.remove());
    const v = document.getElementById('__vercel_live_token');
    if (v) v.remove();
  };
  k();
  setTimeout(k, 500);
  setTimeout(k, 2000);
  new MutationObserver(() => k()).observe(document.documentElement, { childList: true, subtree: true });
})();

(async () => {
  const total = await getCollectivePulse();
  const el = document.getElementById('pulseLine');
  if (total !== null and False):
    pass
})();
</script>
<div id="tgCapa">
  <div class="tg-grid" id="tgGrid"></div>
</div>
<div class="tg-cta" id="tgCta">
  <button id="tgDado" aria-label="Otra edici&oacute;n al azar"><span>&#127922;</span></button>
  <button id="tgLupa" aria-label="Ir a Triggui"><span>&#128269;</span></button>
  <button id="tgLibro" aria-label="Abrir tarjeta"><span>&#128214;</span></button>
  <button id="tgLike" aria-label="Guardar en mi espiral"><span>&#128525;</span></button>
  <button id="tgEsp" aria-label="Tu espiral"><span>&#127744;</span></button>
</div>
<div id="tgModal"><div class="tg-mglass"><div class="tg-memoji" id="tgMEmoji">&#10024;</div><div class="tg-mtitle" id="tgMTitle"></div><div class="tg-mtext" id="tgMText"></div><div class="tg-mbtns"><button class="tg-btn tg-bp" id="tgMP"></button><button class="tg-btn tg-bs" id="tgMS"></button></div></div></div>
<div id="tgToast"></div>
<script id="tg-juego-js">
(function(){
'use strict';
var st = (typeof state !== 'undefined' && state) ? state : null;
var capa = document.getElementById('tgCapa');
if (!st || !capa) { if (capa) capa.style.display = 'none'; return; }

(function(){
  if (typeof showBocadoEco === 'function') {
    var __cerNativa = showBocadoEco;
    showBocadoEco = function(kind, onComplete, roleHints){
      grid.classList.add('tg-dim');
      cta.classList.add('tg-dim');
      return __cerNativa(kind, function(){
        grid.classList.remove('tg-dim');
        cta.classList.remove('tg-dim');
        if (typeof onComplete === 'function') onComplete();
      }, roleHints);
    };
  }
})();

var EXEC = 'https://script.google.com/macros/s/AKfycbwWcUceg333PMcmSsLbEUAsx3os8AJ3Wdmjruv7zshHTqNmoxTastOsDU1h7V8qPk0nIQ/exec';
var LS_PAR = 'triggui_espiral_v1';

function fraseTexto(o){
  if (typeof o === 'string') return o;
  if (o && typeof o.phrase === 'string') return o.phrase;
  return '';
}

var pool = Array.isArray(st.bocadoEcoPool) ? st.bocadoEcoPool : [];
var L = window.__tgL = {
  palabras: (st.palabras || []).slice(0, 4),
  frases: (st.frases || []).slice(0, 4),
  colores: (st.colores || []).slice(0, 4),
  textColors: (st.textColors || []).slice(0, 4),
  titulo: st.titulo || '',
  autor: st.autor || '',
  portada: st.portada || ''
};
// INVARIANTE 4: si falta una frase, rellenar fiel desde el pool (mismo libro)
(function(){
  var usadas = {};
  for (var i = 0; i < 4; i++) if (L.frases[i]) usadas[L.frases[i]] = true;
  for (var j = 0; j < 4; j++) {
    if (L.frases[j]) continue;
    for (var k = 0; k < pool.length; k++) {
      var t = fraseTexto(pool[k]);
      if (t && !usadas[t]) { L.frases[j] = t; usadas[t] = true; break; }
    }
    if (!L.frases[j]) L.frases[j] = L.frases[0] || '';
  }
})();

var ANG = [115, 205, 35, 320];
function grad(i){ return 'linear-gradient(' + ANG[i % 4] + 'deg,' + L.colores[i] + ',' + L.colores[(i + 1) % 4] + ')'; }
function isURL(s){ return /^https?:\/\//i.test(s || ''); }
function luminance(hex){ try { var c = hex.replace('#','').match(/.{1,2}/g).map(function(x){ return parseInt(x,16)/255; }); var f = function(v){ return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055,2.4); }; return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2]); } catch(e){ return 0; } }
function pickText(bg){ try { return luminance(bg) > 0.35 ? '#000' : '#fff'; } catch(e){ return '#fff'; } }

var grid = document.getElementById('tgGrid');
var cta = document.getElementById('tgCta');
var bEsp = document.getElementById('tgEsp');
var bLupa = document.getElementById('tgLupa');
var bLibro = document.getElementById('tgLibro');
var bLike = document.getElementById('tgLike');
var bDado = document.getElementById('tgDado');
var revealed = false;
/* 🌀 v7.1: si venimos de regreso con foto, la portada vive en el MISMO bloque que se dejó
   (sin esto el sorteo la mueve y el escenario deja de ser idéntico). */
var portIdx = (function(){ try{ var f=window.__tgFotoPort;
  if(typeof f==='number' && f>=0 && f<4) return f; }catch(e){} return Math.floor(Math.random() * 4); })();

var TgModal = {
  el: document.getElementById('tgModal'),
  show: function(cfg){
    document.getElementById('tgMEmoji').innerHTML = cfg.emoji || '\u2728';
    document.getElementById('tgMTitle').textContent = cfg.title || 'Triggui';
    document.getElementById('tgMText').innerHTML = cfg.text || '';
    var p = document.getElementById('tgMP');
    var s = document.getElementById('tgMS');
    if (cfg.btn) {
      p.style.display = '';
      p.textContent = cfg.btn;
      p.onclick = function(){ TgModal.close(); if (cfg.onBtn) cfg.onBtn(); };
    } else { p.style.display = 'none'; }
    if (cfg.btn2) {
      s.style.display = '';
      s.textContent = cfg.btn2;
      s.onclick = function(){ TgModal.close(); if (cfg.onBtn2) cfg.onBtn2(); };
    } else { s.style.display = 'none'; }
    this.el.style.display = 'flex';
    var self = this;
    setTimeout(function(){ self.el.classList.add('visible'); }, 10);
  },
  close: function(){
    var self = this;
    this.el.classList.remove('visible');
    this.el.classList.remove('espera');
    setTimeout(function(){ self.el.style.display = 'none'; }, 300);
  }
};

function corazon(x, y){
  var h = document.createElement('div');
  h.className = 'tg-heart';
  h.textContent = ['❤️', '😍', '🔥'][Math.floor(Math.random() * 3)];
  document.body.appendChild(h);
  h.style.left = x + 'px';
  h.style.top = y + 'px';
  h.style.setProperty('--tx', ((Math.random() - 0.5) * 60) + 'px');
  setTimeout(function(){ h.remove(); }, 1200);
}

function buildPort(){
  var d = document.createElement('div');
  d.className = 'tg-portada';
  if (TG_COVER_SRC) {
    var img = new Image();
    img.src = TG_COVER_SRC;
    img.loading = 'lazy';
    d.appendChild(img);
  } else {
    var w = document.createElement('div');
    w.className = 'tg-porttext';
    var h2 = document.createElement('h2'); h2.textContent = L.titulo;
    var p = document.createElement('p'); p.textContent = L.autor;
    w.appendChild(h2); w.appendChild(p);
    d.appendChild(w);
  }
  d.addEventListener('click', function(e){ e.stopPropagation(); abrirTarjeta(); });
  return d;
}

function abrirTarjeta(){
  document.body.classList.add('tg-tarjeta');
  if (typeof openOverlayFromBlocks === 'function') openOverlayFromBlocks();
}
(function(){
  if (typeof closeOverlayToBlocks === 'function') {
    var __cerrarNativo = closeOverlayToBlocks;
    closeOverlayToBlocks = function(){
      document.body.classList.remove('tg-tarjeta');
      if ((overlayView === 'card' || overlayView === 'silence') && pool.length) {
        var velo = document.getElementById('bocadoEcoOverlay');
        if (velo) velo.classList.add('visible');
        grid.classList.add('tg-dim');
        cta.classList.add('tg-dim');
      }
      __cerrarNativo();
    };
  }
})();
bLibro.onclick = abrirTarjeta;
bEsp.onclick = function(){ try{ if(document.querySelector('.tg-block.show')) sessionStorage.setItem('tg_ed_foto', JSON.stringify({ruta:location.pathname,port:portIdx,t:Date.now()})); }catch(e){} window.location.href = '/espiral/'; };
// 🎲 otra edición viva al azar (congruente con el dado de la app). Lista estática /t/ediciones.json.
bDado.onclick = function(){
  try{gtag('event','edicion_dado',{});}catch(e){}
  fetch('/t/ediciones.json', { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(d){
    var kids = window.location.pathname.indexOf('/kids/') === 0;
    var rl = rutaLibro();
    var lista = ((d && d[kids ? 'kids' : 'adulto']) || []).filter(function(x){ return x && x !== rl.slug; });
    if (!lista.length) return;
    var s = lista[Math.floor(Math.random() * lista.length)];
    window.location.href = (kids ? '/kids/t/' : '/t/') + s + '/';
  }).catch(function(){});
};
(function(){
  var kids = window.location.pathname.indexOf('/kids/') === 0;
  fetch('/t/ediciones.json').then(function(r){ return r.json(); }).then(function(d){
    var n = ((d && d[kids ? 'kids' : 'adulto']) || []).length;
    if (n < 2) bDado.style.display = 'none';
  }).catch(function(){ bDado.style.display = 'none'; });
})();
bLupa.onclick = function(){ try{gtag('event','edicion_lupa',{});}catch(e){} window.location.href = 'https://app.triggui.com/?barra=1'; };

function render(){
  grid.innerHTML = '';
  for (var i = 0; i < 4; i++) (function(i){
    var card = document.createElement('div');
    card.className = 'tg-block';
    card.style.background = grad(i);
    card.style.animationDelay = (40 + i * 50) + 'ms';
    var label = document.createElement('div');
    label.className = 'tg-label';
    label.textContent = L.palabras[i] || '';
    label.style.color = L.textColors[i] || '#fff';
    var frase = document.createElement('div');
    frase.className = 'tg-frase';
    frase.textContent = L.frases[i] || '';
    frase.style.color = L.textColors[i] || '#fff';
    if (i === portIdx) {
      var port = buildPort();
      card.appendChild(port); card.appendChild(label); card.appendChild(frase);
      card.classList.add('tg-hint');
      card.onclick = function(e){
        if (!revealed) {
          label.style.display = 'none';
          port.style.display = 'flex';
          var hijos = grid.children;
          for (var j = 0; j < hijos.length; j++) if (j !== portIdx) hijos[j].classList.add('show');
          cta.style.display = 'flex';
          revealed = true;
          var c = L.colores;
          bEsp.style.background = 'linear-gradient(135deg,' + c[0] + ',' + c[1] + ')';
          bLupa.style.background = 'linear-gradient(135deg,' + c[1] + ',' + c[2] + ')';
          bLibro.style.background = 'linear-gradient(135deg,' + c[2] + ',' + c[3] + ')';
          bLike.style.background = 'linear-gradient(135deg,#ff416c,#ff4b2b)';
          bEsp.style.color = pickText(c[0]);
          bLupa.style.color = pickText(c[1]);
          bLibro.style.color = pickText(c[2]);
        } else { e.stopPropagation(); abrirTarjeta(); }
      };
    } else {
      card.appendChild(label); card.appendChild(frase);
      card.onclick = function(){ card.classList.toggle('show'); };
    }
    grid.appendChild(card);
  })(i);
}

/* ══ EL COMBO (leyes v7): anti-frases + asiento og[1] + roles ══ */
function norm(t){
  return String(t || '').toLowerCase()
    .replace(/[^0-9a-z\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1 ]/g, '')
    .replace(/\s+/g, ' ').trim();
}
function elegirNotas(){
  var proh = [];
  for (var i = 0; i < 4; i++) { var n = norm(L.frases[i]); if (n) proh.push(n); }
  function choca(t){
    var n = norm(t);
    if (!n) return true;
    for (var k = 0; k < proh.length; k++) {
      var q = proh[k];
      if (n === q || n.indexOf(q) >= 0 || q.indexOf(n) >= 0) return true;
    }
    return false;
  }
  var cand = [];
  var ogIdx = -1;
  for (var j = 0; j < pool.length; j++) {
    var o = pool[j];
    var esDict = o && typeof o === 'object';
    var origin = esDict ? String(o.origin || '').toLowerCase() : '';
    if (origin.indexOf('og') >= 0) {
      ogIdx++;
      if (ogIdx === 1) continue; /* asiento impreso */
    }
    var t = fraseTexto(o);
    if (!t || choca(t)) continue;
    cand.push({ t: t, rol: esDict ? String(o.rol || '').toLowerCase() : '' });
  }
  var boc = '', eco = '';
  for (var a = 0; a < cand.length; a++) {
    var r = cand[a].rol;
    if (!boc && (r.indexOf('abrir') >= 0 || r.indexOf('entrada') >= 0 || r.indexOf('profundizar') >= 0)) boc = cand[a].t;
  }
  for (var b = cand.length - 1; b >= 0; b--) {
    var r2 = cand[b].rol;
    if (!eco && (r2.indexOf('resonar') >= 0 || r2.indexOf('aterrizar') >= 0 || r2.indexOf('salida') >= 0) && norm(cand[b].t) !== norm(boc)) eco = cand[b].t;
  }
  if (!boc && cand.length) boc = cand[0].t;
  if (!eco) for (var d = cand.length - 1; d >= 0; d--) { if (norm(cand[d].t) !== norm(boc)) { eco = cand[d].t; break; } }
  return { bocado: boc ? boc.slice(0, 220) : '', eco: eco ? eco.slice(0, 220) : '' };
}

function rutaLibro(){
  var partes = window.location.pathname.split('/').filter(Boolean);
  var kids = partes[0] === 'kids';
  return { catalogo: kids ? 'kids' : 'adulto', slug: (kids ? partes[2] : partes[1]) || '' };
}
function claveMiembro(){
  try { var p = JSON.parse(window.localStorage.getItem(LS_PAR) || 'null'); return (p && p.c) ? String(p.c) : ''; }
  catch(e){ return ''; }
}

var OUTBOX = 'triggui_outbox_v1';
function tgOutboxLeer(){
  try { var a = JSON.parse(window.localStorage.getItem(OUTBOX) || '[]'); return Array.isArray(a) ? a : []; }
  catch(e){ return []; }
}
function tgOutboxEscribir(a){
  try { window.localStorage.setItem(OUTBOX, JSON.stringify(a.slice(-20))); } catch(e){}
}
function tgOutboxGuardar(id, q){
  var a = tgOutboxLeer(); a.push({ id: id, q: q, ts: Date.now() }); tgOutboxEscribir(a);
}
function tgOutboxQuitar(id){
  tgOutboxEscribir(tgOutboxLeer().filter(function(x){ return x.id !== id; }));
}
var PENDIENTES = 'triggui_pendiente_v1';
function tgPendLeer(){
  try { var a = JSON.parse(window.localStorage.getItem(PENDIENTES) || '[]'); return Array.isArray(a) ? a : []; }
  catch(e){ return []; }
}
function tgPendEscribir(a){
  try { window.localStorage.setItem(PENDIENTES, JSON.stringify(a.slice(-10))); } catch(e){}
}
function tgPendGuardar(q0){
  var a = tgPendLeer();
  a.push({ id: String(Date.now()) + '-' + Math.floor(Math.random() * 100000), q0: q0, ts: Date.now() });
  tgPendEscribir(a);
}
function tgCasarPendientes(){
  var k = claveMiembro();
  if (k) {
    var a = tgPendLeer();
    for (var i = 0; i < a.length; i++) {
      tgOutboxGuardar(a[i].id, a[i].q0 + '&clave=' + encodeURIComponent(k));
    }
    if (a.length) tgPendEscribir([]);
  }
  tgOutboxVaciar();
}
function armarCuerpo(){
  var notas = elegirNotas();
  var accent = '';
  try { accent = (getComputedStyle(document.body).getPropertyValue('--accent') || '').trim(); } catch(e){}
  var payload = {
    palabras: ((typeof state !== 'undefined' && state._pes && state._pes.length) ? state._pes : L.palabras),
    frases: ((typeof state !== 'undefined' && state._fes && state._fes.length) ? state._fes : L.frases),
    palabras_en: ((typeof state !== 'undefined' && Array.isArray(state.palabras_en)) ? state.palabras_en.slice(0, 4) : []),
    frases_en: ((typeof state !== 'undefined' && Array.isArray(state.frases_en)) ? state.frases_en.slice(0, 4) : []),
    titulo: ((typeof state !== 'undefined' && state._tes) ? state._tes : L.titulo),
    titulo_en: ((typeof state !== 'undefined' && state.titulo_en) ? state.titulo_en : ''),
    colores: L.colores, textColors: L.textColors,
    autor: L.autor, accent: accent || (L.colores[1] || '')
  };
  /* 🌐 El bocado y el eco viajan EN PAR: se busca el gemelo por posición en los
     dos pools (español e inglés) para que el portal pueda voltearlos después. */
  var __poolES = ((typeof state !== 'undefined' && state._bes && state._bes.length) ? state._bes
                  : ((typeof state !== 'undefined' && state.bocadoEcoPool) || []));
  var __poolEN = ((typeof state !== 'undefined' && state.bocadoEcoPool_en) || []);
  function __txtP(o){ return (o && typeof o === 'object') ? String(o.phrase || '') : String(o || ''); }
  function __gemelo(t){
    /* Los pools ES y EN NO tienen la misma longitud (8 vs 4 es habitual), así que
       emparejar por posición falla. Se localiza la frase en su propio pool y se
       toma la inglesa por posición relativa: siempre del mismo libro, siempre
       una frase válida, y determinista para que no cambie entre visitas. */
    var n = String(t || ''), idx = -1;
    for (var a = 0; a < __poolES.length; a++) if (__txtP(__poolES[a]) === n) { idx = a; break; }
    if (idx < 0) for (var c = 0; c < __poolEN.length; c++) if (__txtP(__poolEN[c]) === n) { idx = c; break; }
    if (idx < 0) idx = 0;
    var es = __txtP(__poolES.length ? __poolES[idx % __poolES.length] : '') || n;
    var en = __txtP(__poolEN.length ? __poolEN[idx % __poolEN.length] : '');
    /* si la frase venía en inglés (toggle en EN), ella misma es la inglesa */
    for (var d = 0; d < __poolEN.length; d++) if (__txtP(__poolEN[d]) === n) { en = n; break; }
    return { es: es, en: en };
  }
  if (notas.bocado) { var __gb = __gemelo(notas.bocado); payload.bocado = __gb.es; payload.bocado_en = __gb.en; }
  if (notas.eco) { var __ge = __gemelo(notas.eco); payload.eco = __ge.es; payload.eco_en = __ge.en; }
  var rl = rutaLibro();
  var cuerpo = new URLSearchParams();
  cuerpo.append('accion', 'marcar');
  cuerpo.append('slug', rl.slug);
  cuerpo.append('catalogo', rl.catalogo);
  cuerpo.append('evento', 'combo');
  cuerpo.append('componente', 'combo');
  cuerpo.append('titulo', L.titulo);
  cuerpo.append('portada', isURL(L.portada) ? L.portada : '');
  cuerpo.append('payload', JSON.stringify(payload));
  return cuerpo;
}
function tgEnviar(q, ok, mal, lento){
  var resuelto = false;
  var cuerpoEnvio = q;
  try { cuerpoEnvio = new URLSearchParams(q); } catch(e){}
  var tSusurro = setTimeout(function(){
    if (!resuelto && typeof lento === 'function') {
      try { lento(); } catch(x){}
    }
  }, 2500);
  var t = setTimeout(function(){
    if (!resuelto) {
      try { console.log('[Triggui buzon] paciencia agotada: aviso, la peticion sigue viva'); } catch(x){}
      mal();
    }
  }, 25000);
  var p = null;
  try { p = fetch(EXEC, { method: 'POST', body: cuerpoEnvio }); }
  catch(e){
    resuelto = true; clearTimeout(t); clearTimeout(tSusurro);
    try { console.log('[Triggui buzon] constructor:', e && e.message); } catch(x){}
    mal(); return;
  }
  p.then(function(r){
     try { window.__tgStatus = r.status; } catch(x){}
     return r.json();
   })
   .then(function(r){
     resuelto = true; clearTimeout(t); clearTimeout(tSusurro);
     if (r && r.ok) { ok(r); }
     else {
       try { console.log('[Triggui buzon] respuesta no-ok:', JSON.stringify(r)); } catch(x){}
       mal();
     }
   })
   .catch(function(err){
     resuelto = true; clearTimeout(t); clearTimeout(tSusurro);
     try { console.log('[Triggui buzon] fallo:', (err && err.message) || String(err), '| status:', window.__tgStatus); } catch(x){}
     mal();
   });
}
function tgOutboxVaciar(){
  var a = tgOutboxLeer();
  if (!a.length) return;
  var i = 0;
  (function paso(){
    if (i >= a.length) return;
    var e = a[i++];
    tgEnviar(e.q, function(){ tgOutboxQuitar(e.id); paso(); }, function(){ paso(); });
  })();
}

var likeBusy = false;
bLike.onclick = function(){
  var r = bLike.getBoundingClientRect();
  var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (var i = 0; i < 8; i++) corazon(cx, cy);
  if (likeBusy) return;
  likeBusy = true;
  setTimeout(function(){ likeBusy = false; }, 1400);

  var k = claveMiembro();
  if (!k) {
    tgPendGuardar(armarCuerpo().toString());
    TgModal.show({
      emoji: '🌀',
      title: 'Este libro qued\u00f3 guardado',
      text: 'Para verlo en tu espiral,<span class="hl">entra con tu clave de miembro.</span>',
      btn: 'Conocer mi espiral',
      onBtn: function(){ window.location.href = '/mi/'; },
      btn2: 'Ahora no'
    });
    return;
  }

  var cuerpo = armarCuerpo();
  cuerpo.append('clave', k);

  TgModal.show({ emoji: '<span class="tg-giro">🌀</span>', title: '', text: '' });
  TgModal.el.classList.add('espera');
  function completar(em, t, cuerpoTxt){
    if (!TgModal.el.classList.contains('visible')) return;
    TgModal.el.classList.remove('espera');
    document.getElementById('tgMEmoji').innerHTML = em;
    document.getElementById('tgMTitle').textContent = t;
    document.getElementById('tgMText').innerHTML = cuerpoTxt;
    var p = document.getElementById('tgMP');
    var s = document.getElementById('tgMS');
    p.style.display = '';
    p.textContent = (tgLang==='en')?'See my spiral':'Ver mi espiral';
    p.onclick = function(){ TgModal.close(); window.location.href = '/mi/'; };
    s.style.display = '';
    s.textContent = (tgLang==='en')?'Stay here':'Seguir aqu\u00ED';
    s.onclick = function(){ TgModal.close(); };
  }
  var idBuzon = String(Date.now()) + '-' + Math.floor(Math.random() * 100000);
  var qBuzon = cuerpo.toString();
  tgOutboxGuardar(idBuzon, qBuzon);
  tgEnviar(qBuzon, function(res){
    tgOutboxQuitar(idBuzon);
    if (res.ya_existia) {
      if(tgLang==='en'){ completar('🌀', 'Already in your spiral', '\u00AB' + L.titulo + '\u00BB has been with you all along.<span class="hl">Your spiral remembers it.</span>'); } else { completar('🌀', 'Ya vive en tu espiral', '\u00AB' + L.titulo + '\u00BB ya est\u00E1 contigo desde antes.<span class="hl">Tu espiral lo recuerda.</span>'); }
    } else {
      if(tgLang==='en'){ completar('😍', 'It lives in your spiral', '\u00AB' + L.titulo + '\u00BB stayed with you: its words, its phrases and its card.<span class="hl">Whenever you need it, it will be there.</span>'); } else { completar('😍', 'Vive en tu espiral', '\u00AB' + L.titulo + '\u00BB se qued\u00F3 contigo: sus palabras, sus frases y su tarjeta.<span class="hl">Cuando lo necesites, ah\u00ED estar\u00E1.</span>'); }
    }
  }, function(){
    if(tgLang==='en'){ completar('🌀', 'Saved en camino', 'Se entregar\u00E1 solo en tu pr\u00F3xima visita.<span class="hl">Your spiral is waiting for it.</span>'); } else { completar('🌀', 'Guardado en camino', 'Se entregar\u00E1 solo en tu pr\u00F3xima visita.<span class="hl">Tu espiral lo est\u00E1 esperando.</span>'); }
  }, function(){
    var mt = document.getElementById('tgMText');
    if (mt && TgModal.el.classList.contains('espera')) mt.textContent = 'Guardando\u2026';
  });
};

if (pool.length && !window.__tgRegresando) {
  grid.classList.add('tg-dim');
  cta.classList.add('tg-dim');
}
render();
tgCasarPendientes();
})();
</script>
</body>
</html>
"""

    # Corrige el bloque anterior para Python: inserta JS intacto
    html_output = html_output.replace(
        """(async () => {
  const total = await getCollectivePulse();
  const el = document.getElementById('pulseLine');
  if (total !== null and False):
    pass
})();""",
        """(async () => {
  // Precarga del contador global al cargar la edicion viva.
  // Anima de 0 al total en 1.5s. Si la API falla, el pulseLine queda invisible.
  try {
    const total = await getCollectivePulse();
    const el = document.getElementById('pulseLine');
    if (!el) return;
    if (total !== null && typeof total === 'number' && total > 0) {
      el.innerHTML = (window.tgLang==='en') ? 'Already <span id="pulseLineNum" style="font-weight:700;color:rgba(255,255,255,.75);">0</span> books opened together.' : 'Ya van <span id="pulseLineNum" style="font-weight:700;color:rgba(255,255,255,.75);">0</span> libros abiertos juntos.';
      el.classList.add('visible');
      const numEl = document.getElementById('pulseLineNum');
      if (typeof animatePulseNumber === 'function') {
        animatePulseNumber(numEl, total, 1500);
      } else if (numEl) {
        numEl.textContent = total.toLocaleString('es-MX');
      }
    }
  } catch (e) {
    console.warn('[pulse] preload error:', e && e.message ? e.message : e);
  }
})();"""
    )

    replacements = {
        # 🌒 NUMERACIÓN (V10): prefix "Edición #047 · " si hay número
        "__TITLE_PAGE__": esc(
            f"{titulo} · Triggui"
            if edicion_label
            else f"{palabra} · {titulo} · Triggui"
        ),
        "__OG_TITLE__": esc(
            og_title
            if edicion_label
            else og_title
        ),
        "__META_DESCRIPTION__": esc(og_description),
        "__OG_IMAGE__": esc(og_image),
        "__OG_URL__": esc(og_url),
        "__BODY_STYLE__": esc(body_style),
        "__STATE_JSON__": js_string(state),
        "__TG_COVER_SRC__": js_string(cover_src),
        "__BTN_CSS__": "".join(
            f"#{bid}{{background:linear-gradient(135deg,{colores[ci]},{tg_darken_hex(colores[ci])});color:{text_colors[ci]}}}\n"
            for bid, ci in (("tgDado",0),("tgEsp",1),("tgLupa",2),("tgLibro",3),("tgLike",0))
        ),
        "__COVER_CTA_HTML__": cover_cta_html,
        "__CARD_TITLE__": esc(t_titulo or titulo),
        "__CARD_AUTHOR__": esc(autor),
        "__TOP_HTML__": top_html,
        "__SECOND_BLOCK_HTML__": second_block_html,
        "__BUSCA_COMPRAR__": esc(busca_comprar),
        "__BUSCA_EXPLORAR__": esc(busca_explorar),
        "__PENGUIN_Q__": esc(penguin_q),
        "__SILENCE_COVER_HTML__": silence_cover_html,
        "__SILENCE_TITLE__": esc(titulo),
        # 🌒 NUMERACIÓN (V11): eyebrow HTML arriba del título — sutil, una línea
        "__EDICION_EYEBROW_HTML__": (
            f'<div class="edicion-eyebrow" aria-hidden="true">'
            f'EDICIÓN'
            f'<span class="edicion-eyebrow-sep">·</span>'
            f'<span class="edicion-eyebrow-num">{esc(edicion_label)}</span>'
            f'</div>'
            if edicion_label
            else ""
        ),
    }

    for key, value in replacements.items():
        html_output = html_output.replace(key, value)

    return html_output


# ════════════════════════════════════════════════════════════════════════════
# 🌒 V14 FIX CRÍTICO ARQUITECTÓNICO NIVEL DIOS CUÁNTICO-QUARK
# ════════════════════════════════════════════════════════════════════════════
def find_libro_by_meta(libros, book_meta):
    """
    🌒 V14: Busca el libro_data correcto en contenido["libros"] basándose
    en el book_meta del run actual (TMP_BOOK_FILE).

    Estrategia (en orden de prioridad):
      1. Match por slug (si existe en libro_data — actualmente NO existe)
      2. Match por titulo + autor exacto (case-insensitive, normalized)
      3. Match por titulo solamente (case-insensitive, normalized)

    NO hay fallback a libros[0] — si no hay match, abortar el build.
    El bug V10-V13 era usar libros[0] como fallback, lo que generaba HTMLs
    con contenido del libro equivocado cuando el array estaba desordenado.
    """
    def normalize(s):
        return re.sub(r"\s+", " ", str(s or "")).strip().casefold()

    meta_slug = book_meta.get("slug", "").strip()
    meta_titulo = normalize(book_meta.get("titulo", ""))
    meta_autor = normalize(book_meta.get("autor", ""))

    # Estrategia 1: match exacto por slug (si libro_data tiene slug)
    if meta_slug:
        for l in libros:
            if l.get("slug") and l.get("slug") == meta_slug:
                return l
            if l.get("id") and l.get("id") == meta_slug:
                return l

    # Estrategia 2: match por titulo + autor (más preciso)
    if meta_titulo and meta_autor:
        for l in libros:
            if (normalize(l.get("titulo", "")) == meta_titulo
                    and normalize(l.get("autor", "")) == meta_autor):
                return l

    # Estrategia 3: match solo por titulo (fallback aceptable, único en el array)
    if meta_titulo:
        matches = [l for l in libros if normalize(l.get("titulo", "")) == meta_titulo]
        if len(matches) == 1:
            return matches[0]
        if len(matches) > 1:
            # Múltiples libros con mismo título — preferir el que tenga _edicion_numero
            with_num = [l for l in matches if isinstance(l.get("_edicion_numero"), int)]
            if with_num:
                return with_num[0]
            return matches[0]

    # NO hay match — abortar
    raise SystemExit(
        f"❌ V14 ABORT: no se encontró libro_data para book_meta. "
        f"slug='{meta_slug}', titulo='{meta_titulo}', autor='{meta_autor}'. "
        f"Total libros en contenido.json: {len(libros)}. "
        f"Esto previene generar HTMLs con contenido del libro equivocado."
    )


def build_lab():
    if not LAB_DATA_FILE.exists():
        raise SystemExit(f"No existe {LAB_DATA_FILE}")

    data = json.loads(LAB_DATA_FILE.read_text(encoding="utf-8"))
    ediciones = data.get("ediciones", [])

    LAB_OUT_DIR.mkdir(parents=True, exist_ok=True)

    for edicion in ediciones:
        edicion_id = edicion.get("id")
        if not edicion_id:
            continue

        destino = LAB_OUT_DIR / edicion_id
        destino.mkdir(parents=True, exist_ok=True)

        html_file = destino / "index.html"
        html_file.write_text(render_edicion(edicion, mode="lab"), encoding="utf-8")
        print(f"OK (Lab) -> {html_file}")


def build_single():
    contenido_file = resolve_single_json_file()

    if not contenido_file:
        print("❌ Error: no existe TRIGGUI_EDICION_JSON ni contenido.json. Abortando build_single.")
        sys.exit(1)

    if not TMP_BOOK_FILE.exists():
        print(f"❌ Error: {TMP_BOOK_FILE} no existe. Abortando build_single.")
        sys.exit(1)

    book_meta = json.loads(TMP_BOOK_FILE.read_text(encoding="utf-8"))
    contenido = json.loads(contenido_file.read_text(encoding="utf-8"))

    if not contenido.get("libros") or len(contenido["libros"]) == 0:
        print(f"❌ Error: {contenido_file} no tiene libros. Abortando.")
        sys.exit(1)

    # 🌒 V14 FIX CRÍTICO ARQUITECTÓNICO NIVEL DIOS CUÁNTICO-QUARK
    # ANTES (V10-V13): libro_data = contenido["libros"][0]
    # PROBLEMA: el libro recién agregado NO siempre está en posición [0].
    # En el caso real diagnosticado, Cardalda (#038) quedó en [18] mientras
    # Volf (#037) ocupaba [0]. Eso causaba que TODOS los HTMLs nuevos llevaran
    # contenido del libro Volf (título, texto, número, eco) — solo el slug y
    # la portada venían del book_meta correcto.
    #
    # FIX V14: matchear el libro_data por TÍTULO (única propiedad confiable
    # presente en ambos lados — slug e id son undefined en libro_data).
    # Tie-breaker por autor. ABORT si no hay match (NO fallback a [0]).
    libro_data = find_libro_by_meta(contenido["libros"], book_meta)
    slug = book_meta.get("slug") or libro_data.get("slug")

    if not slug:
        print("❌ Error: No hay slug en book_meta/libro_data.")
        sys.exit(1)

    print(f"🏗️  Construyendo edición viva SINGLE para: {slug}")
    print(f"📚 Fuente single: {contenido_file}")
    print(f"🌐 BASE_URL: {BASE_URL}")

    colores = pad_list(libro_data.get("colores"), 4, "#4FD1FF")
    text_colors = resolve_text_colors(libro_data, colores)
    portada = resolve_cover(book_meta, libro_data)
    palabra_dominante = resolve_palabra_dominante(libro_data)

    tarjeta = libro_data.get("tarjeta", {}) or {}
    tarjeta["parrafoTop"] = normalize_highlight_syntax(tarjeta.get("parrafoTop", ""))
    tarjeta["parrafoBot"] = normalize_highlight_syntax(tarjeta.get("parrafoBot", ""))

    bocado_eco_pool = build_bocado_eco_pool(libro_data)
    # 🌐 gemelo EN del pool — filtro dict mata el fallback legacy ES (anchors)
    bocado_eco_pool_en = [p for p in build_bocado_eco_pool(libro_data, "en") if isinstance(p, dict)]
    if not bocado_eco_pool_en:
        # fallback V13-compat: strings desde frases_en (163/163 garantizado) — jamás mudo, jamás mezclado
        bocado_eco_pool_en = [normalize_text(strip_highlight_tags(f)) for f in (libro_data.get("frases_en") or []) if str(f).strip()][:8]
    # 🌒 V14: contar sinfónicas (dicts con metadata) vs legacy (strings)
    _sinfonico_count = sum(1 for p in bocado_eco_pool if isinstance(p, dict))
    _legacy_count = sum(1 for p in bocado_eco_pool if isinstance(p, str))
    if _sinfonico_count > 0:
        # Cobertura por rol — para validación matemática del smoke
        _roles = {}
        for p in bocado_eco_pool:
            if isinstance(p, dict) and p.get("rol"):
                _roles[p["rol"]] = _roles.get(p["rol"], 0) + 1
        _roles_str = ", ".join(f"{k}={v}" for k, v in sorted(_roles.items()))
        print(f"🌒 Pool bocado/eco V14: {len(bocado_eco_pool)} frases sinfónicas ({_roles_str})")
    else:
        print(f"🌒 Pool bocado/eco V13 legacy: {len(bocado_eco_pool)} frases (concepts del nucleus, sin metadata sinfónica)")

    edicion_single = {
        "id": slug,
        "titulo": book_meta.get("titulo", libro_data.get("titulo", "")),
        "autor": book_meta.get("autor", libro_data.get("autor", "")),
        "palabra": palabra_dominante,
        "descripcion": strip_highlight_tags((tarjeta or {}).get("parrafoTop", "")),
        "portada": portada,
        "tagline": book_meta.get("tagline", libro_data.get("tagline", "")),
        "palabras": pad_list(libro_data.get("palabras"), 4, "Señal"),
        "frases": pad_list(libro_data.get("frases"), 4, "Abre un libro físico que tengas cerca."),
        "colores": colores,
        "textColors": text_colors,
        "fondo": libro_data.get("fondo", "#0a0a0a"),
        "tarjeta": tarjeta,
        "bocadoEcoPool": bocado_eco_pool,
        # 🌒 V11 FIX CRÍTICO: propagar número de edición del libro al edicion dict
        # Sin esto, render_edicion() no podía detectar el número y el badge no aparecía
        "_edicion_numero": libro_data.get("_edicion_numero"),
        # 🌐 D2-A fix: el single perdía el inglés en esta aduana — propagar gemelos EN
        "frases_en": libro_data.get("frases_en"),
        "palabras_en": libro_data.get("palabras_en"),
        "tarjeta_en": libro_data.get("tarjeta_en"),
        "bocadoEcoPool_en": bocado_eco_pool_en,
        "titulo_en": str(libro_data.get("titulo_en", "") or ""),
    }

    html_content = render_edicion(edicion_single, mode="single")

    out_dir = SINGLE_OUT_DIR / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    html_file = out_dir / "index.html"
    html_file.write_text(html_content, encoding="utf-8")
    print(f"✅ Edición viva generada: {html_file}")

    # 🌐 la gemela en inglés nace junto a la española, siempre
    try:
        escribir_gemela_en(html_content, out_dir, edicion_single, BASE_URL)
    except Exception as _e:
        print(f"   ⚠️ gemela /en/ omitida: {_e}")

    # 🎲 auto-registro en la lista del dado (public/t/ediciones.json): la lista se mantiene sola.
    # Idempotente (sin duplicados); si el archivo falta o está corrupto, arranca limpio; kids por ruta del out_dir.
    try:
        import json as _json
        _lista_path = Path("public") / "t" / "ediciones.json"
        try:
            _lista = _json.loads(_lista_path.read_text(encoding="utf-8"))
            if not isinstance(_lista, dict): raise ValueError
        except Exception:
            _lista = {}
        _lista.setdefault("adulto", []); _lista.setdefault("kids", [])
        _cat = "kids" if "kids" in str(out_dir) else "adulto"
        if slug not in _lista[_cat]:
            _lista[_cat].append(slug)
            _lista_path.parent.mkdir(parents=True, exist_ok=True)
            _lista_path.write_text(_json.dumps(_lista, ensure_ascii=False), encoding="utf-8")
            print(f"🎲 ediciones.json: +{slug} ({_cat}, total {len(_lista[_cat])})")
        else:
            print(f"🎲 ediciones.json: {slug} ya registrado ({_cat})")
        # 🗺️ sitemap.xml auto: raíz + todas las ediciones de la lista (adulto y kids), lastmod hoy
        try:
            import datetime as _dt
            _urls = ["https://app.triggui.com/"]
            _urls += [f"https://app.triggui.com/t/{x}/" for x in _lista.get("adulto", [])]
            _urls += [f"https://app.triggui.com/kids/t/{x}/" for x in _lista.get("kids", [])]
            _hoy = _dt.date.today().isoformat()
            _sm = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
            _sm += "".join(f"  <url><loc>{u}</loc><lastmod>{_hoy}</lastmod></url>\n" for u in _urls)
            _sm += "</urlset>\n"
            (Path("public") / "sitemap.xml").write_text(_sm, encoding="utf-8")
            print(f"🗺️ sitemap.xml: {len(_urls)} URLs")
        except Exception as _e2:
            print(f"⚠️ sitemap no actualizado: {_e2}")
    except Exception as _e:
        print(f"⚠️ ediciones.json no actualizado: {_e}")


def main():
    if TMP_BOOK_FILE.exists():
        build_single()
    else:
        build_lab()


if __name__ == "__main__":
    main()
