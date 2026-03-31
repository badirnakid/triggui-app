from pathlib import Path
import json
import urllib.request
import re

SOURCE_URL = "https://raw.githubusercontent.com/badirnakid/triggui-content/main/contenido.json"
OUT_FILE = Path("public/lab/ediciones.json")
LIMIT = 6

def slugify(text):
    text = (text or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "edicion"

def clean_text(value):
    return " ".join(str(value or "").split()).strip()

with urllib.request.urlopen(SOURCE_URL) as response:
    data = json.loads(response.read().decode("utf-8"))

libros = data.get("libros", [])
ediciones = []

for i, libro in enumerate(libros[:LIMIT], start=1):
    titulo = clean_text(libro.get("titulo"))
    autor = clean_text(libro.get("autor"))

    palabras = [clean_text(x) for x in (libro.get("palabras") or [])][:4]
    frases = [clean_text(x) for x in (libro.get("frases") or [])][:4]

    while len(palabras) < 4:
        palabras.append(f"Señal {len(palabras)+1}")

    while len(frases) < 4:
        frases.append("Abre un libro físico que tengas cerca.")

    palabra = palabras[0]
    descripcion = frases[0]
    edicion_id = f"{i:03d}-{slugify(titulo)[:36]}"

    ediciones.append({
        "id": edicion_id,
        "titulo": titulo,
        "autor": autor,
        "palabra": palabra,
        "descripcion": descripcion,
        "palabras": palabras,
        "frases": frases,
        "fondo": libro.get("fondo", "#0a0d1a"),
        "colores": (libro.get("colores") or ["#4FD1FF", "#7C5CFF", "#47E5C2", "#FFD166"])[:4],
        "textColors": (libro.get("textColors") or ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF"])[:4],
        "ogImage": f"/lab/og/{edicion_id}.svg"
    })

payload = {"ediciones": ediciones}
OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"OK: {OUT_FILE} generado con {len(ediciones)} edición(es) reales")
for e in ediciones:
    print(f'- {e["id"]} -> {e["titulo"]}')
