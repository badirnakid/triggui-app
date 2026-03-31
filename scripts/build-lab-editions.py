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
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

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

  <style>
    * {{ box-sizing: border-box; }}

    html, body {{
      margin: 0;
      padding: 0;
      min-height: 100%;
      font-family: Arial, sans-serif;
      background: {esc(fondo)};
      color: #fff;
    }}

    body {{
      padding: 24px;
    }}

    .wrap {{
      width: 100%;
      max-width: 1100px;
      margin: 0 auto;
    }}

    .top {{
      margin-bottom: 22px;
    }}

    .eyebrow {{
      font-size: 12px;
      letter-spacing: .14em;
      text-transform: uppercase;
      opacity: .6;
      margin-bottom: 12px;
    }}

    h1 {{
      font-size: 42px;
      line-height: 1.02;
      margin: 0 0 8px 0;
    }}

    .author {{
      font-size: 18px;
      opacity: .74;
      margin-bottom: 12px;
    }}

    .hint {{
      font-size: 16px;
      line-height: 1.55;
      color: rgba(255,255,255,.78);
      max-width: 760px;
      margin: 0;
    }}

    .stage {{
      background: radial-gradient(circle at top left, rgba(255,255,255,.05) 0%, rgba(255,255,255,.02) 60%, rgba(255,255,255,.01) 100%);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 28px;
      padding: 24px;
      box-shadow: 0 24px 70px rgba(0,0,0,.35);
      overflow: hidden;
    }}

    .grid {{
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }}

    .block {{
      appearance: none;
      border: none;
      width: 100%;
      min-height: 200px;
      border-radius: 24px;
      padding: 20px;
      text-align: left;
      font: inherit;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0,0,0,.16);
      transition: transform .18s ease, box-shadow .18s ease, opacity .18s ease;
    }}

    .block:hover {{
      transform: translateY(-2px);
      box-shadow: 0 20px 40px rgba(0,0,0,.22);
    }}

    .block.dim {{
      opacity: .82;
    }}

    .word-chip {{
      display: inline-block;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255,255,255,.16);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }}

    .label {{
      font-size: 34px;
      line-height: 1.02;
      font-weight: 800;
      max-width: 90%;
    }}

    .phrase {{
      display: none;
      font-size: 24px;
      line-height: 1.35;
      font-weight: 700;
      max-width: 92%;
      margin-top: 8px;
    }}

    .block.show-phrase .label,
    .block.show-phrase .word-chip {{
      display: none;
    }}

    .block.show-phrase .phrase {{
      display: block;
    }}

    .reveal {{
      display: none;
      grid-template-columns: 1.05fr .95fr;
      gap: 24px;
      align-items: center;
    }}

    .reveal.show {{
      display: grid;
    }}

    .book-panel {{
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 24px;
      padding: 24px;
    }}

    .book-kicker {{
      font-size: 12px;
      letter-spacing: .14em;
      text-transform: uppercase;
      opacity: .58;
      margin-bottom: 14px;
    }}

    .book-title {{
      font-size: 42px;
      line-height: 1.02;
      font-weight: 800;
      margin-bottom: 10px;
    }}

    .book-author {{
      font-size: 20px;
      opacity: .74;
      margin-bottom: 18px;
    }}

    .book-desc {{
      font-size: 20px;
      line-height: 1.5;
      color: rgba(255,255,255,.86);
      margin-bottom: 20px;
    }}

    .book-call {{
      font-size: 18px;
      line-height: 1.5;
      color: rgba(255,255,255,.95);
      margin-bottom: 22px;
    }}

    .actions {{
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }}

    .btn {{
      appearance: none;
      border: none;
      display: inline-block;
      text-decoration: none;
      border-radius: 999px;
      padding: 12px 16px;
      font-weight: 800;
      font-size: 14px;
      cursor: pointer;
    }}

    .btn-main {{
      background: linear-gradient(135deg, #4fd1ff, #7c5cff);
      color: #fff;
    }}

    .btn-sub {{
      background: rgba(255,255,255,.08);
      color: #fff;
      border: 1px solid rgba(255,255,255,.1);
    }}

    .asset-panel {{
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.02);
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
    }}

    .asset-panel img {{
      display: block;
      width: 100%;
      height: auto;
    }}

    .success {{
      display: none;
      margin-top: 18px;
      font-size: 16px;
      color: #b8ffcf;
      font-weight: 700;
    }}

    .success.show {{
      display: block;
    }}

    @media (max-width: 840px) {{
      .grid {{
        grid-template-columns: 1fr;
      }}

      .reveal.show {{
        grid-template-columns: 1fr;
      }}

      .label {{
        font-size: 28px;
      }}

      .phrase {{
        font-size: 22px;
      }}

      .book-title {{
        font-size: 34px;
      }}
    }}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="top">
      <div class="eyebrow">Triggui 2.0 · Edición Viva</div>
      <h1>{esc(titulo)}</h1>
      <div class="author">{esc(autor)}</div>
      <p class="hint">Elige una palabra. Verás un libro. Abre uno físico que tengas cerca.</p>
    </section>

    <section class="stage">
      <div id="grid" class="grid"></div>

      <div id="reveal" class="reveal">
        <div class="book-panel">
          <div class="book-kicker">Revelación</div>
          <div class="book-title">{esc(titulo)}</div>
          <div class="book-author">{esc(autor)}</div>
          <div class="book-desc">{esc(descripcion)}</div>
          <div class="book-call">Cierra esto. Abre un libro físico que tengas cerca.</div>

          <div class="actions">
            <a class="btn btn-sub" href="/lab/">Volver al laboratorio</a>
            <button class="btn btn-main" id="btnFisico">📖 Abrí un libro físico</button>
          </div>

          <div id="success" class="success">Bien. Eso es Triggui.</div>
        </div>

        <div class="asset-panel">
          <img src="{esc(og_image)}" alt="Vista previa de la edición" />
        </div>
      </div>
    </section>
  </main>

  <script>
    const state = {js_string(state)};
    const grid = document.getElementById('grid');
    const reveal = document.getElementById('reveal');
    const success = document.getElementById('success');
    const btnFisico = document.getElementById('btnFisico');
    const revealIndex = Math.floor(Math.random() * 4);

    function renderBlocks() {{
      grid.innerHTML = state.palabras.map((palabra, idx) => `
        <button
          class="block"
          data-idx="${{idx}}"
          style="background:${{state.colores[idx]}}; color:${{state.textColors[idx]}}"
        >
          <div class="word-chip">Bloque ${{idx + 1}}</div>
          <div class="label">${{palabra}}</div>
          <div class="phrase">${{state.frases[idx]}}</div>
        </button>
      `).join('');

      const blocks = [...grid.querySelectorAll('.block')];

      blocks.forEach((block, idx) => {{
        block.addEventListener('click', () => {{
          if (idx === revealIndex) {{
            grid.style.display = 'none';
            reveal.classList.add('show');
            return;
          }}

          const already = block.classList.contains('show-phrase');
          blocks.forEach(b => b.classList.remove('show-phrase', 'dim'));
          if (!already) {{
            block.classList.add('show-phrase');
            blocks.forEach((b, j) => {{
              if (j !== idx) b.classList.add('dim');
            }});
          }}
        }});
      }});
    }}

    btnFisico.addEventListener('click', () => {{
      success.classList.add('show');
    }});

    renderBlocks();
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
