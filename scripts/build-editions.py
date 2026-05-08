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
DEFAULT_SINGLE_JSON = Path("contenido_edicion.json")
FALLBACK_SINGLE_JSON = Path("contenido.json")
SINGLE_OUT_DIR = Path("public/t")

# Base URL dinámica:
# - main -> https://app.triggui.com
# - previews -> https://beta.app.triggui.com
BASE_URL = os.environ.get("BASE_URL", "https://app.triggui.com").rstrip("/")

# Archivo canónico del pipeline single-book
TRIGGUI_EDICION_JSON_ENV = os.environ.get("TRIGGUI_EDICION_JSON", "").strip()


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
    candidates = []

    if TRIGGUI_EDICION_JSON_ENV:
        candidates.append(Path(TRIGGUI_EDICION_JSON_ENV))

    candidates.append(DEFAULT_SINGLE_JSON)
    candidates.append(FALLBACK_SINGLE_JSON)

    for candidate in candidates:
        if candidate.exists():
            return candidate

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

    toggle_open = True

    def replace_open(_match):
        nonlocal toggle_open
        token = "[H]" if toggle_open else "[/H]"
        toggle_open = not toggle_open
        return token

    value = re.sub(r"\[H\]", replace_open, value)

    opens = len(re.findall(r"\[H\]", value))
    closes = len(re.findall(r"\[/H\]", value))

    if opens > closes:
        value += "[/H]" * (opens - closes)

    if closes > opens:
        extra = closes - opens
        while extra > 0:
            idx = value.rfind("[/H]")
            if idx == -1:
                break
            value = value[:idx] + value[idx + 4 :]
            extra -= 1

    value = re.sub(r"\[H\]\s*\[/H\]", "", value)
    value = re.sub(r"[ \t]{2,}", " ", value).strip()
    return value


def escape_with_breaks(text):
    return esc(text).replace("\n", "<br>")


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


def render_edicion(edicion, mode="lab"):
    titulo = edicion.get("titulo", "")
    autor = edicion.get("autor", "")
    edicion_id = edicion.get("id", "")
    palabra = edicion.get("palabra", "")
    descripcion = edicion.get("descripcion", "")
    portada = edicion.get("portada", "")
    tagline = edicion.get("tagline", "")

    if mode == "single":
        og_image = f"{BASE_URL}/t/{edicion_id}/og.png"
        og_url = f"{BASE_URL}/t/{edicion_id}/"
    else:
        og_image = f"{BASE_URL}/lab/t/{edicion_id}/og.png"
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

    has_portada = portada.startswith("http")
    cover_src = portada if has_portada else ""
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
    radial-gradient(ellipse at 30% 20%, rgba(48,255,228,0.08), transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(255,0,128,0.06), transparent 50%);
  z-index: -1;
  pointer-events: none;
  animation: nebula-breathe 20s ease-in-out infinite;
}

@keyframes nebula-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes fire-move {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.pulse-line {
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
    inset 0 0 0 1.5px rgba(255,255,255,.22),
    0 6px 12px rgba(0,0,0,.2),
    0 16px 48px rgba(0,0,0,.45);
}
.block:active { transform: translateY(0) scale(0.995); transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1); }
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
</head>
<body data-lab-v="live-edition-card-v3" style="__BODY_STYLE__">

<div id="pulseLine" class="pulse-line"></div>
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
  setOverlayView('blocks');
  setTimeout(() => showGrid(), 180);
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
      el.innerHTML = 'Ya van <span id="pulseLineNum" style="font-weight:700;color:rgba(255,255,255,.75);">0</span> libros abiertos juntos.';
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
        "__TITLE_PAGE__": esc(f"{palabra} · {titulo} · Triggui"),
        "__OG_TITLE__": esc(og_title),
        "__META_DESCRIPTION__": esc(og_description),
        "__OG_IMAGE__": esc(og_image),
        "__OG_URL__": esc(og_url),
        "__BODY_STYLE__": esc(body_style),
        "__STATE_JSON__": js_string(state),
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
    }

    for key, value in replacements.items():
        html_output = html_output.replace(key, value)

    return html_output


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
        print("❌ Error: no existe TRIGGUI_EDICION_JSON ni contenido_edicion.json ni contenido.json. Abortando build_single.")
        sys.exit(1)

    if not TMP_BOOK_FILE.exists():
        print(f"❌ Error: {TMP_BOOK_FILE} no existe. Abortando build_single.")
        sys.exit(1)

    book_meta = json.loads(TMP_BOOK_FILE.read_text(encoding="utf-8"))
    contenido = json.loads(contenido_file.read_text(encoding="utf-8"))

    if not contenido.get("libros") or len(contenido["libros"]) == 0:
        print(f"❌ Error: {contenido_file} no tiene libros. Abortando.")
        sys.exit(1)

    libro_data = contenido["libros"][0]
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
    }

    html_content = render_edicion(edicion_single, mode="single")

    out_dir = SINGLE_OUT_DIR / slug
    out_dir.mkdir(parents=True, exist_ok=True)

    html_file = out_dir / "index.html"
    html_file.write_text(html_content, encoding="utf-8")
    print(f"✅ Edición viva generada: {html_file}")


def main():
    if TMP_BOOK_FILE.exists():
        build_single()
    else:
        build_lab()


if __name__ == "__main__":
    main()
