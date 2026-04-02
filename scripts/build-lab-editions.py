from pathlib import Path
import json
import html
import urllib.parse

BASE_DIR = Path("public/lab")
DATA_FILE = BASE_DIR / "ediciones.json"
OUT_DIR = BASE_DIR / "t"


def esc(value):
    return html.escape(str(value or ""), quote=True)


def js_string(value):
    return json.dumps(value, ensure_ascii=False)


def pad_list(values, size, fallback):
    values = list(values or [])
    while len(values) < size:
        values.append(fallback)
    return values[:size]


def render_edicion(edicion):
    titulo = edicion.get("titulo", "")
    autor = edicion.get("autor", "")
    edicion_id = edicion.get("id", "")
    palabra = edicion.get("palabra", "")
    descripcion = edicion.get("descripcion", "")
    og_image = edicion.get("ogImage", "/lab/og-demo-001.svg")
    portada = edicion.get("portada", "")
    tagline = edicion.get("tagline", "")

    palabras = pad_list(edicion.get("palabras"), 4, "Señal")
    frases = pad_list(edicion.get("frases"), 4, "Abre un libro físico que tengas cerca.")
    colores = pad_list(edicion.get("colores"), 4, "#4FD1FF")
    text_colors = pad_list(edicion.get("textColors"), 4, "#FFFFFF")
    fondo = edicion.get("fondo", "#0a0d1a")

    tarjeta = edicion.get("tarjeta") or {}
    t_titulo = tarjeta.get("titulo", "")
    t_parrafo_top = tarjeta.get("parrafoTop", "")
    t_subtitulo = tarjeta.get("subtitulo", "")
    t_parrafo_bot = tarjeta.get("parrafoBot", "")
    t_style = tarjeta.get("style") or {}
    t_accent = t_style.get("accent", "#30ffe4")
    t_ink = t_style.get("ink", "#ffffff")
    t_paper = t_style.get("paper", "#1a1a1a")

    busca_comprar = urllib.parse.quote(f"{titulo} {autor}")
    busca_explorar = urllib.parse.quote(palabra) if palabra else busca_comprar
    penguin_q = urllib.parse.quote(palabra) if palabra else urllib.parse.quote(titulo)

    has_portada = portada.startswith("http")
    cover_src = portada if has_portada else ""
    has_tarjeta = bool(t_parrafo_top)

    is_dark_paper = t_ink not in ("#000000", "#1A1A1A")
    sub_rgba = "255,255,255" if is_dark_paper else "0,0,0"
    logo_filter = "invert(1) brightness(1.5)" if is_dark_paper else "none"

    state = {
        "id": edicion_id,
        "titulo": titulo,
        "autor": autor,
        "palabra": palabra,
        "descripcion": descripcion,
        "palabras": palabras,
        "frases": frases,
        "colores": colores,
        "textColors": text_colors,
        "fondo": fondo,
        "ogImage": og_image,
        "portada": portada,
        "tagline": tagline,
    }

    return f'''<!doctype html>
<html lang="es" style="background:#000;">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">

<title>{esc(palabra)} · {esc(titulo)} · Triggui</title>

<meta property="og:title" content="{esc(palabra)} · {esc(titulo)}" />
<meta property="og:description" content="{esc(descripcion)}" />
<meta property="og:image" content="{esc(og_image)}" />
<meta property="og:url" content="/lab/t/{esc(edicion_id)}/" />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{esc(palabra)} · {esc(titulo)}" />
<meta name="twitter:description" content="{esc(descripcion)}" />
<meta name="twitter:image" content="{esc(og_image)}" />

<link rel="preconnect" href="https://www.penguinlibros.com" crossorigin>
<link rel="preconnect" href="https://www.buscalibre.com.mx" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Poppins:wght@500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;0,800;1,500;1,700&display=swap" rel="stylesheet">

<style>
*, *::before, *::after {{ box-sizing: border-box; }}

html, body {{
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
}}

vercel-live-feedback,[data-vercel-toolbar],#__vercel_live_token,vercel-toolbar{{display:none!important;height:0!important;overflow:hidden!important;}}

body::before {{
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(255,0,85,0.18), transparent 65%),
    radial-gradient(ellipse at 70% 80%, rgba(255,94,0,0.08), transparent 65%);
  z-index: -1;
  pointer-events: none;
  opacity: 0.85;
}}

@keyframes fire-move {{
  0%, 100% {{ background-position: 0% 50%; }}
  50% {{ background-position: 100% 50%; }}
}}

.pulse-line {{
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
  -webkit-user-select: none;
}}
.pulse-line.visible {{ opacity: 1; transform: translateY(0); }}

.grid {{
  position: absolute;
  inset: 5vh 1.5vw;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(4, 1fr);
  gap: 1vw;
  transition: opacity .4s ease;
}}
.grid.hidden {{ opacity: 0; pointer-events: none; }}
@media(orientation:landscape) {{ .grid {{ grid-template-columns: repeat(4,1fr); grid-template-rows: 1fr; }} }}

.block {{
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
  -webkit-user-select: none;
  box-shadow:
    inset 0 0 0 1.5px rgba(255,255,255,.15),
    0 4px 6px rgba(0,0,0,.15),
    0 12px 32px rgba(0,0,0,.35);
  z-index: 1;
}}

.block * {{
  pointer-events: none !important;
}}

.block::before {{
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(145deg, rgba(255,255,255,.18) 0%, rgba(255,255,255,.08) 40%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}}

.block::after {{
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.12), transparent 60%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}}

.block:hover::after {{ opacity: 1; }}
.block:hover {{
  transform: translateY(-2px) scale(1.005);
  box-shadow:
    inset 0 0 0 1.5px rgba(255,255,255,.22),
    0 6px 12px rgba(0,0,0,.2),
    0 16px 48px rgba(0,0,0,.45);
}}
.block:active {{
  transform: translateY(0) scale(0.995);
  transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}}
.block.dim {{ opacity: 0.6; transform: scale(0.98); }}

.label, .frase {{
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
  pointer-events: none;
}}

.label {{
  opacity: 1;
  transform: translateY(0);
  font-size: clamp(1.05rem, 3.2vw, 1.7rem);
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.2px;
}}

.frase {{
  opacity: 0;
  transform: translateY(6px);
  font-size: clamp(1rem, 3vw, 1.5rem);
  font-weight: 600;
  line-height: 1.4;
}}

.block.show .label {{ opacity: 0; transform: translateY(-6px); }}
.block.show .frase {{ opacity: 1; transform: translateY(0); }}

.reveal-overlay {{
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
}}
.reveal-overlay::-webkit-scrollbar {{ display: none; }}

.reveal-card {{
  width: 100%;
  max-width: 520px;
  margin: auto 0;
  border-radius: 22px;
  position: relative;
  background-color: {esc(t_paper)};
  color: {esc(t_ink)};
  box-shadow: 0 60px 120px -30px rgba(0,0,0,0.85), 0 0 0 1px {esc(t_accent)}22, 0 0 40px {esc(t_accent)}15;
  overflow: hidden;
  cursor: default;
  transform: scale(0.94) translateY(15px);
  opacity: 0;
  transition: transform 0.45s cubic-bezier(0.19,1,0.22,1), opacity 0.4s ease;
}}

.reveal-card::after {{
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
  opacity: 0.04;
  border-radius: 22px;
}}

.card-inner {{ position: relative; z-index: 2; padding: 0; }}

.btn-close {{
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 20;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,.35);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: rgba(255,255,255,.7);
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background .2s ease, color .2s ease;
  padding: 0;
  touch-action: manipulation;
}}
.btn-close:hover {{ background: rgba(0,0,0,.55); color: #fff; }}
.btn-close:active {{ transform: scale(0.9); }}

.ed-block {{
  margin: 0 5px;
  background: linear-gradient(145deg, {esc(t_accent)}0A 0%, rgba(255,255,255,0.03) 100%);
  border: 1px solid {esc(t_accent)}18;
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.03);
}}
.ed-block:first-child {{ margin-top: 18px; }}

.ed-block .ed-title {{
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 24px;
  line-height: 1.3;
  font-weight: 400;
  color: {esc(t_ink)};
  letter-spacing: 0.5px;
  margin: 0 0 6px 0;
}}
.ed-block .ed-chip {{
  display: inline-block;
  font-family: 'Archivo', sans-serif;
  font-size: 15px;
  line-height: 1;
  font-weight: 700;
  background: {esc(t_accent)};
  color: #fff;
  padding: 4px 11px;
  border-radius: 12px;
  letter-spacing: 0.3px;
  margin: 4px 0 8px 0;
}}
.ed-block .ed-para {{
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 18px;
  line-height: 1.7;
  font-weight: 400;
  color: rgba({sub_rgba}, 0.8);
  letter-spacing: 0.2px;
  margin: 0;
}}
.ed-block .ed-sub {{
  font-family: 'Archivo', sans-serif;
  font-size: 18px;
  line-height: 1.4;
  font-weight: 600;
  color: {esc(t_accent)};
  letter-spacing: 0.15px;
  margin: 0 0 8px 0;
}}

.ed-cover-wrap {{
  float: right;
  margin: 0 0 12px 18px;
  cursor: pointer;
  position: relative;
  touch-action: manipulation;
}}
.ed-cover-wrap img {{
  display: block;
  width: 130px;
  height: auto;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  box-shadow: 0 15px 35px {esc(t_accent)}30, 0 0 0 1px rgba(255,255,255,0.06);
  animation: coverBreathe 2.8s cubic-bezier(0.32,0.01,0.16,1) infinite;
  will-change: transform, filter;
}}
@keyframes coverBreathe {{
  0%, 100% {{ transform: scale(1); filter: drop-shadow(0 0 0px rgba(255,255,255,0)); }}
  50% {{ transform: scale(1.05); filter: drop-shadow(0 0 10px {esc(t_accent)}50); }}
}}
.cover-hint {{
  display: block;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: rgba({sub_rgba}, 0.3);
  margin-top: 6px;
  letter-spacing: 0.3px;
  animation: hintFade 4s ease forwards;
}}
@keyframes hintFade {{
  0%, 70% {{ opacity: 1; }}
  100% {{ opacity: 0; }}
}}

.ed-gap {{ height: 14px; }}

.card-actions {{
  padding: 16px 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}}
.btn-row {{ display: grid; gap: 8px; }}
.btn-row-2 {{ grid-template-columns: 1fr 48px; }}
.btn-row-3 {{ grid-template-columns: 1fr 48px 1fr; }}

.btn-icon {{
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
  cursor: pointer;
  background: #0a0a0a;
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 4px 16px -4px rgba(0,0,0,0.4);
  transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  touch-action: manipulation;
  color: #fff;
}}
.btn-icon:active {{ transform: scale(0.97); }}
.btn-icon img {{ height: 16px; width: auto; display: block; }}
.btn-icon .btn-triggui-logo {{ height: 20px; }}
.btn-icon .btn-busca-logo {{ height: 14px; }}
.btn-icon .btn-ig-icon {{ width: 18px; height: 18px; }}
.btn-icon.btn-penguin-icon img {{ height: 36px; }}
.btn-icon.btn-crystal {{
  background: rgba(125,125,125,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  animation: btn-breathe 3s ease-in-out infinite;
}}
@keyframes btn-breathe {{
  0%, 100% {{ transform: scale(1); }}
  50% {{ transform: scale(1.05); }}
}}
.btn-crystal .btn-emoji {{ font-size: 20px; line-height: 1; }}

.silence-screen {{
  display: none;
  position: absolute;
  inset: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  background: rgba(0,0,0,0.98);
}}
.silence-screen .sil-cover {{
  width: 160px;
  height: auto;
  border-radius: 8px;
  opacity: 0.7;
  box-shadow: 0 24px 60px rgba(0,0,0,.5), 0 0 30px {esc(t_accent)}20;
  margin-bottom: 36px;
  cursor: pointer;
  transition: transform .2s ease;
}}
.silence-screen .sil-cover:active {{ transform: scale(0.96); }}
.silence-screen .sil-title {{
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-size: clamp(16px,4vw,22px);
  opacity: .3;
  margin-bottom: 20px;
  font-weight: 700;
  text-align: center;
}}
.silence-screen .sil-call {{
  font-family: 'Poppins', sans-serif;
  font-size: clamp(18px,5vw,26px);
  font-weight: 600;
  line-height: 1.5;
  color: rgba(255,255,255,.85);
  margin-bottom: 8px;
  text-align: center;
  animation: silCallIn 1s ease .3s both;
}}
.silence-screen .sil-sub {{
  font-family: 'Poppins', sans-serif;
  font-size: clamp(14px,3.5vw,18px);
  font-weight: 500;
  line-height: 1.4;
  color: rgba(255,255,255,.45);
  margin-bottom: 24px;
  text-align: center;
  animation: silCallIn 1s ease .5s both;
}}
@keyframes silCallIn {{
  0% {{ opacity: 0; transform: translateY(10px); }}
  100% {{ opacity: 1; transform: translateY(0); }}
}}
.silence-screen .sil-pulse {{
  font-family: 'Poppins', sans-serif;
  margin-bottom: 28px;
  text-align: center;
  animation: silCallIn 1s ease .7s both;
}}
.sil-pulse .pulse-num {{
  display: block;
  font-size: clamp(36px,9vw,52px);
  font-weight: 800;
  line-height: 1;
  background: linear-gradient(135deg, #FF0055 0%, #FF5E00 50%, #FFD700 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fire-move 4s ease infinite;
  margin-bottom: 4px;
}}
.sil-pulse .pulse-label {{
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,.4);
  letter-spacing: 0.5px;
}}
.silence-screen .sil-mark {{ opacity: 0.2; animation: silCallIn 1s ease 1s both; }}
.silence-screen .sil-mark img {{
  height: 22px;
  width: auto;
  display: block;
  margin: 0 auto;
  filter: invert(1) brightness(1.5);
}}

@media (max-width: 640px) {{
  .grid {{ gap: 1.2vw; }}
  .label {{ font-size: clamp(0.95rem,4vw,1.4rem); }}
  .frase {{ font-size: clamp(0.9rem,3.5vw,1.3rem); }}
  .reveal-overlay {{ padding: max(4px, env(safe-area-inset-top, 4px)) 4px max(4px, env(safe-area-inset-bottom, 4px)); }}
  .reveal-card {{ border-radius: 18px; max-width: 100%; }}
  .reveal-card::after {{ border-radius: 18px; }}
  .ed-block {{ padding: 20px 20px; margin: 0 4px; }}
  .ed-block:first-child {{ margin-top: 12px; }}
  .ed-cover-wrap img {{ width: 120px; }}
  .ed-block .ed-title {{ font-size: 22px; }}
  .ed-block .ed-para {{ font-size: 18px; line-height: 1.65; }}
  .ed-block .ed-sub {{ font-size: 18px; }}
  .ed-block .ed-chip {{ font-size: 15px; }}
  .card-actions {{ padding: 14px 14px 20px; }}
  .btn-close {{ top: 8px; left: 8px; }}
}}
</style>
</head>
<body data-lab-v="final-direct-block-click">

<div id="pulseLine" class="pulse-line"></div>
<div class="grid" id="grid"></div>

<div id="revealOverlay" class="reveal-overlay">
  <div class="reveal-card" onclick="event.stopPropagation()">
    <button class="btn-close" id="btnBack" aria-label="Cerrar">×</button>
    <div class="card-inner">

      <div class="ed-block">
        <div style="overflow:hidden;">
          {f'''<div class="ed-cover-wrap" id="coverCTA">
            <img src="{esc(cover_src)}" alt="{esc(titulo)}" />
            <span class="cover-hint">Toca el libro</span>
          </div>''' if has_portada else ''}
          <div class="ed-title">{esc(t_titulo or titulo)}</div>
          <div class="ed-chip">{esc(autor)}</div>
          <div class="ed-para">{esc(t_parrafo_top or descripcion)}</div>
        </div>
      </div>

      {f'''<div class="ed-gap"></div>
      <div class="ed-block">
        <div class="ed-sub">{esc(t_subtitulo)}</div>
        <div class="ed-para">{esc(t_parrafo_bot)}</div>
      </div>''' if has_tarjeta and (t_subtitulo or t_parrafo_bot) else ''}

      <div class="card-actions">
        <div class="btn-row btn-row-2">
          <a class="btn-icon" href="https://triggui.com" target="_blank" rel="noopener noreferrer">
            <img class="btn-triggui-logo" src="https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/trigguiletras2.png" alt="Triggui" style="filter:{logo_filter};">
          </a>
          <a class="btn-icon" href="https://www.instagram.com/triggui/" target="_blank" rel="noopener noreferrer">
            <svg class="btn-ig-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="20" height="20" rx="6" stroke="white" stroke-width="1.8"/>
              <circle cx="12" cy="12" r="5" stroke="white" stroke-width="1.8"/>
              <circle cx="17.5" cy="6.5" r="1.2" fill="white"/>
            </svg>
          </a>
        </div>

        <div class="btn-row btn-row-3">
          <a class="btn-icon" href="https://www.buscalibre.com.mx/libros/search/?q={busca_comprar}" target="_blank" rel="noopener noreferrer">
            <img class="btn-busca-logo" src="/buscalibre.png" alt="Buscalibre">
          </a>
          <a class="btn-icon btn-crystal" href="https://www.buscalibre.com.mx/libros/search/?q={busca_explorar}" target="_blank" rel="noopener noreferrer">
            <span class="btn-emoji">🔮</span>
          </a>
          <a class="btn-icon btn-penguin-icon" href="https://www.penguinlibros.com/mx/?mot_q={penguin_q}" target="_blank" rel="noopener noreferrer">
            <img src="/logopenguin.png" alt="Penguin">
          </a>
        </div>
      </div>

    </div>
  </div>

  <div class="silence-screen" id="silenceScreen">
    {f'<img class="sil-cover" id="silCover" src="{esc(cover_src)}" alt="{esc(titulo)}" />' if has_portada else ''}
    <div class="sil-title">{esc(titulo)}</div>
    <div class="sil-call">Queremos que te den ganas<br>de abrir un libro.</div>
    <div class="sil-sub">Eso es Triggui.</div>
    <div class="sil-pulse" id="silPulse"></div>
    <div class="sil-mark">
      <img src="https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/trigguiletras2.png" alt="Triggui">
    </div>
  </div>
</div>

<script>
const state = {js_string(state)};
const grid = document.getElementById('grid');
const revealOverlay = document.getElementById('revealOverlay');
const btnBack = document.getElementById('btnBack');
const coverCTA = document.getElementById('coverCTA');
const coverHint = coverCTA ? coverCTA.querySelector('.cover-hint') : null;
const revealCard = document.querySelector('.reveal-card');
const silenceScreen = document.getElementById('silenceScreen');
const silPulse = document.getElementById('silPulse');
const pulseEditionKey = `triggui_lab_opened_${{state.id}}`;

const ANG = [115,205,35,320];
function grad(i) {{ return `linear-gradient(${{ANG[i%4]}}deg,${{state.colores[i]}},${{state.colores[(i+1)%4]}})`; }}

let overlayView = 'blocks';
let coverBusy = false;
const revealIndex = Math.floor(Math.random() * 4);
const emojis = ['🌊','🛡️','🧠','✨'];

function clearBlockStates() {{
  [...grid.children].forEach((block) => {{
    block.classList.remove('show', 'dim');
  }});
}}

function hideGrid() {{
  grid.classList.add('hidden');
}}

function showGrid() {{
  clearBlockStates();
  grid.classList.remove('hidden');
}}

function resetCardState() {{
  coverBusy = false;
  if (coverCTA) coverCTA.style.pointerEvents = '';
  if (coverHint) coverHint.textContent = 'Toca el libro';
}}

function setOverlayView(next) {{
  overlayView = next;

  const overlayVisible = next !== 'blocks';

  if (overlayVisible) {{
    revealOverlay.style.display = 'flex';
    void revealOverlay.offsetWidth;
  }}

  revealOverlay.style.opacity = overlayVisible ? '1' : '0';
  revealOverlay.style.pointerEvents = overlayVisible ? 'auto' : 'none';

  if (next === 'blocks') {{
    resetCardState();
    revealCard.style.display = '';
    silenceScreen.style.display = 'none';
    revealCard.style.transform = 'scale(0.94) translateY(15px)';
    revealCard.style.opacity = '0';

    setTimeout(() => {{
      if (overlayView === 'blocks') {{
        revealOverlay.style.display = 'none';
      }}
    }}, 350);
    return;
  }}

  if (next === 'card') {{
    resetCardState();
    revealCard.style.display = '';
    silenceScreen.style.display = 'none';

    revealCard.style.transform = 'scale(0.98) translateY(10px)';
    revealCard.style.opacity = '0';

    requestAnimationFrame(() => {{
      revealCard.style.transform = 'scale(1) translateY(0)';
      revealCard.style.opacity = '1';
    }});
    return;
  }}

  if (next === 'silence') {{
    revealCard.style.display = 'none';
    silenceScreen.style.display = 'flex';
  }}
}}

function openOverlayFromBlocks() {{
  hideGrid();
  setOverlayView('card');
}}

function closeOverlayToBlocks() {{
  setOverlayView('blocks');
  setTimeout(() => showGrid(), 180);
}}

function moveToSilence() {{
  setOverlayView('silence');
}}

async function getCollectivePulse() {{
  try {{
    const res = await fetch('/api/get-lab', {{ cache: 'no-store' }});
    if (!res.ok) throw new Error('fail');
    const data = await res.json();
    return Number(data.total || 0);
  }} catch (e) {{
    console.error(e);
    return null;
  }}
}}

async function registerCollectivePhysicalOpen() {{
  if (localStorage.getItem(pulseEditionKey) === '1') {{
    const count = await getCollectivePulse();
    return {{ count, repeated: true, ok: count !== null }};
  }}

  try {{
    const res = await fetch('/api/increment-lab', {{
      method: 'POST',
      headers: {{ 'Content-Type': 'application/json' }},
      body: JSON.stringify({{ editionId: state.id }}),
    }});

    if (!res.ok) throw new Error('fail');

    const data = await res.json();
    localStorage.setItem(pulseEditionKey, '1');
    return {{ count: Number(data.total || 0), repeated: false, ok: true }};
  }} catch (e) {{
    console.error(e);
    return {{ count: null, repeated: false, ok: false }};
  }}
}}

function getChronoOrder(hour) {{
  if (hour >= 4 && hour <= 6) return [3,2,1,0];
  if (hour >= 7 && hour <= 11) return [0,2,1,3];
  if (hour >= 12 && hour <= 16) return [2,0,1,3];
  if (hour >= 17 && hour <= 20) return [1,3,2,0];
  return [3,1,2,0];
}}

const currentHour = new Date().getHours();
const chronoOrder = getChronoOrder(currentHour);

function renderBlocks() {{
  grid.innerHTML = '';

  for (let visualIdx = 0; visualIdx < 4; visualIdx++) {{
    const realIdx = chronoOrder[visualIdx];

    const card = document.createElement('div');
    card.className = 'block';
    card.style.background = grad(realIdx);
    card.dataset.idx = String(visualIdx);
    card.dataset.realIdx = String(realIdx);

    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = `${{emojis[realIdx % emojis.length]}} ${{state.palabras[realIdx]}}`;
    label.style.color = state.textColors[realIdx] || '#fff';

    const frase = document.createElement('div');
    frase.className = 'frase';
    frase.textContent = state.frases[realIdx];
    frase.style.color = state.textColors[realIdx] || '#fff';

    card.append(label, frase);

    card.onclick = (e) => {{
      e.preventDefault();
      e.stopPropagation();

      const blocks = [...grid.children];

      if (visualIdx === revealIndex) {{
        openOverlayFromBlocks();
        return;
      }}

      const already = card.classList.contains('show');
      clearBlockStates();

      if (!already) {{
        card.classList.add('show');
        blocks.forEach((b, j) => {{
          if (j !== visualIdx) b.classList.add('dim');
        }});
      }}
    }};

    grid.append(card);
  }}
}}

btnBack.addEventListener('click', (e) => {{
  e.preventDefault();
  e.stopPropagation();
  closeOverlayToBlocks();
}});

revealOverlay.addEventListener('click', (e) => {{
  if (e.target === revealOverlay && overlayView === 'card') {{
    closeOverlayToBlocks();
  }}
}});

if (coverCTA) {{
  coverCTA.addEventListener('click', (e) => {{
    e.preventDefault();
    e.stopPropagation();

    if (overlayView !== 'card' || coverBusy) return;

    coverBusy = true;
    coverCTA.style.pointerEvents = 'none';
    if (coverHint) coverHint.textContent = '...';

    moveToSilence();

    silPulse.innerHTML = `<span class="pulse-label">Conectando...</span>`;

    registerCollectivePhysicalOpen().then((result) => {{
      if (result.ok && result.count !== null) {{
        silPulse.innerHTML = `<span class="pulse-num">${{result.count}}</span><span class="pulse-label">libros abiertos</span>`;
      }} else {{
        silPulse.innerHTML = `<span class="pulse-label">Se registró el acto.</span>`;
      }}
    }}).catch(err => {{
      console.error(err);
      silPulse.innerHTML = `<span class="pulse-label">Se registró el acto.</span>`;
    }});
  }});
}}

silenceScreen.addEventListener('click', (e) => {{
  e.preventDefault();
  e.stopPropagation();
  if (overlayView === 'silence') {{
    closeOverlayToBlocks();
  }}
}});

document.addEventListener('keydown', (e) => {{
  if (e.key !== 'Escape') return;
  if (overlayView === 'silence' || overlayView === 'card') {{
    closeOverlayToBlocks();
  }}
}});

renderBlocks();
setOverlayView('blocks');

(function() {{
  const k = () => {{
    document.querySelectorAll('vercel-live-feedback,vercel-toolbar,[data-vercel-toolbar]').forEach((el) => el.remove());
    const v = document.getElementById('__vercel_live_token');
    if (v) v.remove();
  }};
  k();
  setTimeout(k, 500);
  setTimeout(k, 2000);
  new MutationObserver(() => k()).observe(document.documentElement, {{ childList: true, subtree: true }});
}})();

(async () => {{
  const total = await getCollectivePulse();
  const el = document.getElementById('pulseLine');
  if (total !== null && total > 0) {{
    el.textContent = `Ya van ${{total}} libros abiertos.`;
    el.classList.add('visible');
  }}
}})();
</script>
</body>
</html>
'''


def main():
    if not DATA_FILE.exists():
        raise SystemExit(f"No existe {DATA_FILE}")

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    ediciones = data.get("ediciones", [])

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for edicion in ediciones:
        edicion_id = edicion.get("id")
        if not edicion_id:
            continue

        destino = OUT_DIR / edicion_id
        destino.mkdir(parents=True, exist_ok=True)

        html_file = destino / "index.html"
        html_file.write_text(render_edicion(edicion), encoding="utf-8")
        print(f"OK -> {html_file}")


if __name__ == "__main__":
    main()