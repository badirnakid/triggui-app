from pathlib import Path
import json
import html

BASE_DIR = Path("public/lab")
DATA_FILE = BASE_DIR / "ediciones.json"
OUT_DIR = BASE_DIR / "t"

def render_edicion(edicion):
    titulo = html.escape(edicion.get("titulo", ""))
    autor = html.escape(edicion.get("autor", ""))
    palabra = html.escape(edicion.get("palabra", ""))
    descripcion = html.escape(edicion.get("descripcion", ""))
    edicion_id = html.escape(edicion.get("id", ""))
    og_image = html.escape(edicion.get("ogImage", "/lab/og-demo.png"))

    return f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>{palabra} · {titulo} · Triggui</title>

  <meta property="og:title" content="{palabra} · {titulo}" />
  <meta property="og:description" content="{descripcion}" />
  <meta property="og:image" content="{og_image}" />
  <meta property="og:url" content="/lab/t/{edicion_id}/" />
  <meta property="og:type" content="article" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{palabra} · {titulo}" />
  <meta name="twitter:description" content="{descripcion}" />
  <meta name="twitter:image" content="{og_image}" />

  <style>
    * {{ box-sizing: border-box; }}

    html, body {{
      margin: 0;
      padding: 0;
      min-height: 100%;
      font-family: Arial, sans-serif;
      background: #0a0d1a;
      color: #fff;
    }}

    body {{
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }}

    .wrap {{
      width: 100%;
      max-width: 900px;
    }}

    .card {{
      background: radial-gradient(circle at top left, #1a2147 0%, #0d1229 55%, #090d1d 100%);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 28px;
      padding: 32px;
      box-shadow: 0 24px 70px rgba(0,0,0,.45);
    }}

    .eyebrow {{
      font-size: 12px;
      letter-spacing: .14em;
      text-transform: uppercase;
      opacity: .65;
      margin-bottom: 16px;
    }}

    .word {{
      display: inline-block;
      padding: 10px 16px;
      border-radius: 999px;
      background: linear-gradient(135deg, #4fd1ff, #7c5cff);
      color: #fff;
      font-weight: 700;
      margin-bottom: 18px;
    }}

    .grid {{
      display: grid;
      grid-template-columns: 1.1fr .9fr;
      gap: 28px;
      align-items: center;
    }}

    h1 {{
      font-size: 44px;
      line-height: 1.02;
      margin: 0 0 10px 0;
    }}

    .author {{
      font-size: 18px;
      opacity: .78;
      margin-bottom: 24px;
    }}

    .desc {{
      font-size: 20px;
      line-height: 1.55;
      color: rgba(255,255,255,.9);
      margin-bottom: 24px;
    }}

    .meta {{
      font-size: 13px;
      opacity: .55;
    }}

    .preview {{
      width: 100%;
      border-radius: 22px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.08);
      box-shadow: 0 20px 60px rgba(0,0,0,.35);
      background: rgba(255,255,255,.02);
    }}

    .preview img {{
      display: block;
      width: 100%;
      height: auto;
    }}

    @media (max-width: 760px) {{
      .grid {{
        grid-template-columns: 1fr;
      }}

      .card {{
        padding: 24px;
        border-radius: 22px;
      }}

      h1 {{
        font-size: 34px;
      }}

      .desc {{
        font-size: 18px;
      }}
    }}
  </style>
</head>
<body>
  <main class="wrap">
    <section class="card">
      <div class="eyebrow">Triggui 2.0 · Edición Viva</div>

      <div class="grid">
        <div>
          <div class="word">{palabra}</div>
          <h1>{titulo}</h1>
          <div class="author">{autor}</div>
          <div class="desc">{descripcion}</div>
          <div class="meta">id: {edicion_id}</div>
        </div>

        <div class="preview">
          <img src="/lab/og-demo.svg" alt="Vista previa OG" />
        </div>
      </div>
    </section>
  </main>
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
