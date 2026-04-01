from pathlib import Path
import json
import html

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

    palabras = pad_list(edicion.get("palabras"), 4, "Señal")
    frases = pad_list(edicion.get("frases"), 4, "Abre un libro físico que tengas cerca.")
    colores = pad_list(edicion.get("colores"), 4, "#4FD1FF")
    text_colors = pad_list(edicion.get("textColors"), 4, "#FFFFFF")
    fondo = edicion.get("fondo", "#0a0d1a")

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
    }

    return f"""<!doctype html>
<html lang="es" style="background:#0e0f1b;">
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

<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Poppins:wght@500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,700;0,800;1,500;1,700&display=swap" rel="stylesheet">

<style>
*, *::before, *::after {{ box-sizing: border-box; }}

html, body {{
  background: #0e0f1b !important;
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
}}

body::before {{
  content: "";
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(48,255,228,0.08), transparent 50%),
    radial-gradient(ellipse at 70% 80%, rgba(255,0,128,0.06), transparent 50%);
  z-index: -1;
  pointer-events: none;
  animation: nebula-breathe 20s ease-in-out infinite;
}}

@keyframes nebula-breathe {{
  0%, 100% {{ opacity: 1; }}
  50% {{ opacity: 0.7; }}
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
}}

.pulse-line.visible {{
  opacity: 1;
  transform: translateY(0);
}}

.grid {{
  position: absolute;
  inset: 5vh 1.5vw;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(4, 1fr);
  gap: 1vw;
  transition: opacity .4s ease;
}}

.grid.hidden {{
  opacity: 0;
  pointer-events: none;
}}

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
  border: none;
  appearance: none;
  font: inherit;
  color: inherit;
  width: 100%;
  box-shadow:
    inset 0 0 0 1.5px rgba(255,255,255,.15),
    0 4px 6px rgba(0,0,0,.15),
    0 12px 32px rgba(0,0,0,.35);
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

.block.dim {{
  opacity: 0.6;
  transform: scale(0.98);
}}

.label, .frase {{
  z-index: 2;
  text-align: center;
  transition: opacity 0.25s ease, transform 0.25s ease;
  text-shadow: none;
  -webkit-font-smoothing: antialiased;
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
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
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
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  background: rgba(14,15,27,0.97);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  opacity: 0;
  pointer-events: none;
  transition: opacity .5s ease;
  padding: 5vh 6vw;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}}

.reveal-overlay.visible {{
  opacity: 1;
  pointer-events: auto;
}}

.reveal-glass {{
  width: 100%;
  max-width: 500px;
  text-align: center;
  transform: scale(0.92) translateY(20px);
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
  opacity: 0;
}}

.reveal-overlay.visible .reveal-glass {{
  transform: scale(1) translateY(0);
  opacity: 1;
}}

.reveal-og {{
  width: 100%;
  max-width: 360px;
  margin: 0 auto 28px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.1);
  animation: portPop .6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}}

@keyframes portPop {{
  0% {{ transform: scale(.85); opacity: 0; }}
  100% {{ transform: scale(1); opacity: 1; }}
}}

.reveal-og img {{ display: block; width: 100%; height: auto; }}

.reveal-kicker {{
  font-family: 'Archivo', sans-serif;
  font-size: 11px;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  opacity: .5;
  font-weight: 800;
  margin-bottom: 16px;
}}

.reveal-title {{
  font-family: 'Playfair Display', serif;
  font-style: italic;
  font-weight: 800;
  font-size: clamp(28px, 7vw, 42px);
  line-height: 1.05;
  margin: 0 0 10px 0;
  letter-spacing: -0.5px;
}}

.reveal-author {{
  font-family: 'Archivo', sans-serif;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: .6;
  font-weight: 700;
  margin-bottom: 20px;
}}

.reveal-divider {{
  width: 40px;
  height: 1px;
  background: rgba(255,255,255,.2);
  margin: 0 auto 20px;
}}

.reveal-desc {{
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  line-height: 1.6;
  opacity: .85;
  margin-bottom: 28px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}}

.reveal-call {{
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  color: rgba(255,255,255,.9);
  margin-bottom: 24px;
  transition: all .4s ease;
}}

.btn-fisico {{
  appearance: none;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 32px;
  border-radius: 999px;
  font-family: 'Archivo', sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, #30ffe4, #7c5cff);
  box-shadow: 0 0 0 1px rgba(255,255,255,.15), 0 6px 20px rgba(48,255,228,0.3);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
  -webkit-font-smoothing: antialiased;
}}

.btn-fisico:hover {{
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 0 0 1px rgba(255,255,255,.25), 0 8px 28px rgba(48,255,228,0.4);
}}

.btn-fisico:active {{
  transform: translateY(0) scale(0.97);
  transition: transform 0.1s ease;
}}

.btn-fisico:disabled {{
  opacity: .6;
  cursor: default;
  transform: none;
}}

.btn-back {{
  appearance: none;
  border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.06);
  color: #fff;
  padding: 12px 24px;
  border-radius: 999px;
  font-family: 'Archivo', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  transition: background .2s ease;
  -webkit-font-smoothing: antialiased;
}}

.btn-back:hover {{ background: rgba(255,255,255,.1); }}

.success {{
  margin-top: 20px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 600;
  opacity: 0;
  transition: opacity .6s ease;
}}

.success.visible {{ opacity: 1; }}

.success .total {{
  background: linear-gradient(120deg, #30ffe4 0%, #FF0080 50%, #FFD700 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fire-move 4s ease infinite;
  font-weight: 800;
  text-shadow: none;
}}

@keyframes fire-move {{
  0%, 100% {{ background-position: 0% 50%; }}
  50% {{ background-position: 100% 50%; }}
}}

.reveal-overlay.silence .reveal-og,
.reveal-overlay.silence .reveal-kicker,
.reveal-overlay.silence .reveal-author,
.reveal-overlay.silence .reveal-divider,
.reveal-overlay.silence .reveal-desc,
.reveal-overlay.silence .btn-fisico,
.reveal-overlay.silence .btn-back {{
  display: none;
}}

.reveal-overlay.silence .reveal-title {{
  font-size: clamp(22px, 5.5vw, 32px);
  margin-bottom: 16px;
  opacity: .4;
}}

.reveal-overlay.silence .reveal-call {{
  font-size: clamp(20px, 5vw, 28px);
  color: rgba(255,255,255,.98);
  line-height: 1.55;
}}

@media (max-width: 480px) {{
  .grid {{ gap: 1.2vw; }}
  .label {{ font-size: clamp(0.95rem, 4vw, 1.4rem); }}
  .frase {{ font-size: clamp(0.9rem, 3.5vw, 1.3rem); }}
}}

@media (orientation: landscape) {{
  .grid {{
    grid-template-columns: repeat(4, 1fr);
    grid-template-rows: 1fr;
  }}
}}
</style>
</head>
<body>

<div id="pulseLine" class="pulse-line"></div>
<div class="grid" id="grid"></div>

<div id="revealOverlay" class="reveal-overlay">
  <div class="reveal-glass">
    <div class="reveal-og">
      <img src="{esc(og_image)}" alt="{esc(titulo)}" />
    </div>
    <div class="reveal-kicker">Revelación</div>
    <h1 class="reveal-title">{esc(titulo)}</h1>
    <div class="reveal-author">{esc(autor)}</div>
    <div class="reveal-divider"></div>
    <div class="reveal-desc">{esc(descripcion)}</div>
    <div class="reveal-call">Cierra esto. Abre un libro físico que tengas cerca.</div>
    <button class="btn-fisico" id="btnFisico">📖 Abrí un libro físico</button>
    <button class="btn-back" id="btnBack">Volver</button>
    <div class="success" id="success"></div>
  </div>
</div>

<script>
const state = {js_string(state)};
const grid = document.getElementById('grid');
const revealOverlay = document.getElementById('revealOverlay');
const btnFisico = document.getElementById('btnFisico');
const btnBack = document.getElementById('btnBack');
const success = document.getElementById('success');
const revealCall = document.querySelector('.reveal-call');
const pulseEditionKey = `triggui_lab_opened_${{state.id}}`;

const ANG = [115, 205, 35, 320];
function grad(i) {{
  return `linear-gradient(${{ANG[i % 4]}}deg, ${{state.colores[i]}}, ${{state.colores[(i + 1) % 4]}})`;
}}

async function getCollectivePulse() {{
  try {{
    const res = await fetch('/api/get-lab', {{ cache: 'no-store' }});
    if (!res.ok) throw new Error('get-lab failed');
    const data = await res.json();
    return Number(data.total || 0);
  }} catch (err) {{
    console.error(err);
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
    if (!res.ok) throw new Error('increment-lab failed');
    const data = await res.json();
    localStorage.setItem(pulseEditionKey, '1');
    return {{ count: Number(data.total || 0), repeated: false, ok: true }};
  }} catch (err) {{
    console.error(err);
    return {{ count: null, repeated: false, ok: false }};
  }}
}}

function getChronoOrder(hour) {{
  if (hour >= 4 && hour <= 6) return [3, 2, 1, 0];
  if (hour >= 7 && hour <= 11) return [0, 2, 1, 3];
  if (hour >= 12 && hour <= 16) return [2, 0, 1, 3];
  if (hour >= 17 && hour <= 20) return [1, 3, 2, 0];
  return [3, 1, 2, 0];
}}

const currentHour = new Date().getHours();
const chronoOrder = getChronoOrder(currentHour);
const revealIndex = Math.floor(Math.random() * 4);
const emojis = ['🌊', '🛡️', '🧠', '✨'];

function renderBlocks() {{
  grid.innerHTML = chronoOrder.map((realIdx, idx) => `
    <button class="block" data-idx="${{idx}}" data-real-idx="${{realIdx}}" style="background:${{grad(realIdx)}}">
      <div class="label" style="color:${{state.textColors[realIdx]}}">${{emojis[realIdx % 4]}} ${{state.palabras[realIdx]}}</div>
      <div class="frase" style="color:${{state.textColors[realIdx]}}">${{state.frases[realIdx]}}</div>
    </button>
  `).join('');

  const blocks = [...grid.querySelectorAll('.block')];
  blocks.forEach((block, idx) => {{
    block.addEventListener('click', () => {{
      if (idx === revealIndex) {{
        grid.classList.add('hidden');
        setTimeout(() => revealOverlay.classList.add('visible'), 200);
        return;
      }}
      const already = block.classList.contains('show');
      blocks.forEach(b => b.classList.remove('show', 'dim'));
      if (!already) {{
        block.classList.add('show');
        blocks.forEach((b, j) => {{ if (j !== idx) b.classList.add('dim'); }});
      }}
    }});
  }});
}}

btnBack.addEventListener('click', () => {{
  revealOverlay.classList.remove('visible');
  setTimeout(() => grid.classList.remove('hidden'), 200);
}});

btnFisico.addEventListener('click', async () => {{
  btnFisico.disabled = true;
  btnFisico.textContent = 'Registrando...';
  const result = await registerCollectivePhysicalOpen();
  revealOverlay.classList.add('silence');
  revealCall.textContent = 'Bien. Ahora sal de la pantalla. Abre el libro.';
  let msg = '';
  if (!result.ok) {{
    msg = 'Se registró el acto.';
  }} else if (result.repeated) {{
    msg = `Ya lo habías marcado. Hoy van <span class="total">${{result.count}}</span> libros abiertos.`;
  }} else {{
    msg = `Eso es Triggui. Hoy van <span class="total">${{result.count}}</span> libros abiertos.`;
  }}
  success.innerHTML = msg;
  success.classList.add('visible');
}});

renderBlocks();

(async () => {{
  const total = await getCollectivePulse();
  const el = document.getElementById('pulseLine');
  if (total !== null && total > 0) {{
    el.textContent = `Hoy se abrieron ${{total}} libros.`;
    el.classList.add('visible');
  }}
}})();
</script>
</body>
</html>
"""

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