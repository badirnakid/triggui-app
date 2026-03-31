from pathlib import Path
import json
import html

DATA_FILE = Path("public/lab/ediciones.json")
OG_DIR = Path("public/lab/og")
OG_DIR.mkdir(parents=True, exist_ok=True)

PALETTES = [
    {"bg1":"#0D1229","bg2":"#111833","bg3":"#090D1D","a1":"#4FD1FF","a2":"#7C5CFF"},
    {"bg1":"#10181B","bg2":"#13252A","bg3":"#0B1114","a1":"#47E5C2","a2":"#4E8BFF"},
    {"bg1":"#1A1022","bg2":"#241233","bg3":"#110817","a1":"#FF6FD8","a2":"#7A5CFF"},
    {"bg1":"#17140C","bg2":"#241D10","bg3":"#120E08","a1":"#FFD166","a2":"#FF7A59"},
]

def esc(s):
    return html.escape(str(s or ""), quote=True)

def wrap_text(text, max_chars=22, max_lines=3):
    words = str(text or "").split()
    if not words:
        return [""]
    lines = []
    current = words[0]
    for word in words[1:]:
        trial = current + " " + word
        if len(trial) <= max_chars:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:max_lines]

def wrap_desc(text, max_chars=46, max_lines=2):
    words = str(text or "").split()
    if not words:
        return [""]
    lines = []
    current = words[0]
    for word in words[1:]:
        trial = current + " " + word
        if len(trial) <= max_chars:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:max_lines]

data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
ediciones = data.get("ediciones", [])

for idx, e in enumerate(ediciones):
    palette = PALETTES[idx % len(PALETTES)]
    eid = e.get("id", f"edicion-{idx+1}")
    palabra = e.get("palabra", "Señal")
    titulo = e.get("titulo", "")
    autor = e.get("autor", "")
    descripcion = e.get("descripcion", "")

    title_lines = wrap_text(titulo, max_chars=22, max_lines=3)
    desc_lines = wrap_desc(descripcion, max_chars=46, max_lines=2)

    title_y = 250
    title_svg = []
    for i, line in enumerate(title_lines):
        y = title_y + i * 78
        title_svg.append(
            f'<text x="92" y="{y}" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="74" font-weight="700">{esc(line)}</text>'
        )

    author_y = title_y + len(title_lines) * 78 + 22
    desc_y = author_y + 60

    desc_svg = []
    for i, line in enumerate(desc_lines):
        y = desc_y + i * 38
        desc_svg.append(
            f'<text x="92" y="{y}" fill="white" fill-opacity="0.92" font-family="Arial, Helvetica, sans-serif" font-size="30">{esc(line)}</text>'
        )

    svg = f'''<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630">
      <stop stop-color="{palette["bg1"]}"/>
      <stop offset="0.5" stop-color="{palette["bg2"]}"/>
      <stop offset="1" stop-color="{palette["bg3"]}"/>
    </linearGradient>
    <linearGradient id="pill" x1="90" y1="120" x2="340" y2="120">
      <stop stop-color="{palette["a1"]}"/>
      <stop offset="1" stop-color="{palette["a2"]}"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="60" y="50" width="1080" height="530" rx="34" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"/>

  <text x="92" y="98" fill="white" fill-opacity="0.56" font-family="Arial, Helvetica, sans-serif" font-size="22" letter-spacing="3">TRIGGUI 2.0 · EDICIÓN VIVA</text>

  <rect x="92" y="122" width="240" height="58" rx="29" fill="url(#pill)"/>
  <text x="212" y="159" text-anchor="middle" fill="white" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">{esc(palabra)}</text>

  {"".join(title_svg)}

  <text x="92" y="{author_y}" fill="white" fill-opacity="0.72" font-family="Arial, Helvetica, sans-serif" font-size="34">{esc(autor)}</text>

  {"".join(desc_svg)}

  <text x="92" y="540" fill="white" fill-opacity="0.44" font-family="Arial, Helvetica, sans-serif" font-size="22">Abre. Un Libro. Físico.</text>
</svg>
'''
    out_file = OG_DIR / f"{eid}.svg"
    out_file.write_text(svg, encoding="utf-8")
    e["ogImage"] = f"/lab/og/{eid}.svg"

DATA_FILE.write_text(json.dumps({"ediciones": ediciones}, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"OK: {len(ediciones)} asset(s) OG generado(s)")
for e in ediciones:
    print(f'- {e["id"]} -> {e["ogImage"]}')
