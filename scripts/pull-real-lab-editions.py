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
    palabras = libro.get("palabras") or []
    frases = libro.get("frases") or []

    palabra = clean_text(palabras[0] if palabras else "Señal")
    descripcion = clean_text(frases[0] if frases else "Abre un libro físico que tengas cerca.")
    edicion_id = f"{i:03d}-{slugify(titulo)[:36]}"

    # por ahora seguimos usando assets del lab
    og_image = "/lab/og-demo-001.svg" if i % 2 else "/lab/og-demo-002.svg"

    ediciones.append({
        "id": edicion_id,
        "titulo": titulo,
        "autor": autor,
        "palabra": palabra,
        "descripcion": descripcion,
        "ogImage": og_image
    })

payload = {"ediciones": ediciones}
OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

print(f"OK: {OUT_FILE} generado con {len(ediciones)} edición(es) reales")
for e in ediciones:
    print(f"- {e['id']} -> {e['titulo']}")
