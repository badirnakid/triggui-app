#!/usr/bin/env python3
"""🛒 tiendas-ediciones.py — cambia Buscalibre y Penguin por Casa del Libro y Gandhi en las ediciones ya publicadas
(14 de noviembre de 2026, B417).

    python3 scripts/tiendas-ediciones.py --tiendas ../triggui-content/data/tiendas.json            # censo, no escribe
    python3 scripts/tiendas-ediciones.py --tiendas ../triggui-content/data/tiendas.json --aplicar  # escribe

Las ediciones nuevas salen de la plantilla (scripts/build-editions.py). Las ya publicadas no se vuelven a generar,
porque muchas son de plantillas anteriores: se les cambian solo los siete pedazos de las tiendas, con exactamente
el mismo HTML que pone la plantilla (las mismas constantes y funciones de build-editions.py):

    1. el encabezado: las precargas de penguinlibros.com y buscalibre.com.mx → las de las tiendas y /tiendas.js
    2. los estilos de los logos de Buscalibre y Penguin → los de Casa del Libro y Gandhi
    3. los tres botones → «Comprar» (la tienda que marcó el horno), 🔮 (Casa del Libro) y «Explorar» (Gandhi)
    4. la referencia a btnPenguin → las de los botones nuevos
    5. la función que cambia las ligas con la hora → la que aplica la regla de /tiendas.js
    6. el cambio de idioma → rehace también las ligas (fuera de México, el título de Amazon sigue al idioma)

Comprobaciones de cada página, antes de escribir un byte (censo antes de escribir):
    · cada pedazo viejo está exactamente una vez, y las búsquedas viejas se reconstruyen con los datos de la página;
    · el libro está en tiendas.json;
    · después: cero menciones de las tiendas viejas, cada pedazo nuevo una vez, y quitando los pedazos, la página
      vieja y la nueva son idénticas byte por byte (comparación después: nada más cambió).
Si una sola página no cuadra, no se escribe ninguna.
"""
import argparse
import importlib.util
import json
import re
import sys
import urllib.parse
from pathlib import Path

RAIZ_APP = Path(__file__).resolve().parent.parent

_spec = importlib.util.spec_from_file_location("build_editions", RAIZ_APP / "scripts" / "build-editions.py")
be = importlib.util.module_from_spec(_spec)
_argv = sys.argv
sys.argv = ["build-editions.py"]
_spec.loader.exec_module(be)
sys.argv = _argv

VIEJAS = re.compile(r"buscalibre|busca[ -]libre|bookdelivery|penguin|random ?house|megustaleer", re.IGNORECASE)

VIEJO_HEAD = (
    '<link rel="preconnect" href="https://www.penguinlibros.com" crossorigin>\n'
    '<link rel="preconnect" href="https://www.buscalibre.com.mx" crossorigin>\n'
)

VIEJO_CSS = """.btn-dark .btn-busca-logo {
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
"""

VIEJO_BOTONES = re.compile(
    r'<div class="btn-row btn-row-3">\n'
    r'          <a class="btn-dark" href="https://www\.buscalibre\.com\.mx/libros/search/\?q=(?P<qc>[^"]*)" target="_blank" rel="noopener noreferrer">\n'
    r'            <img class="btn-busca-logo" src="/buscalibre\.png" alt="Buscalibre">\n'
    r'          </a>\n'
    r'\n'
    r'          <a class="btn-dark btn-crystal" id="btnCrystal" href="https://www\.buscalibre\.com\.mx/libros/search/\?q=(?P<qe>[^"]*)" target="_blank" rel="noopener noreferrer">\n'
    r'            <span class="btn-emoji">🔮</span>\n'
    r'          </a>\n'
    r'\n'
    r'          <a class="btn-dark btn-penguin-icon" id="btnPenguin" href="https://www\.penguinlibros\.com/mx/\?mot_q=(?P<qp>[^"]*)" target="_blank" rel="noopener noreferrer">\n'
    r'            <img src="/logopenguin\.png" alt="Penguin">\n'
    r'          </a>\n'
    r'        </div>'
)

VIEJO_REFS = ("const btnCrystal = document.getElementById('btnCrystal');\n"
              "const btnPenguin = document.getElementById('btnPenguin');")
NUEVO_REFS = "const btnCrystal = document.getElementById('btnCrystal');\n" + be.TIENDAS_REFS_JS

VIEJA_FUNCION = """function applyDynamicActionLinks() {
  const word = getPrimaryChronoWord();
  if (!word) return;

  const encoded = encodeURIComponent(word);

  if (btnCrystal) {
    btnCrystal.href = 'https://www.buscalibre.com.mx/libros/search/?q=' + encoded;
  }

  if (btnPenguin) {
    btnPenguin.href = 'https://www.penguinlibros.com/mx/?mot_q=' + encoded;
  }
}"""

VIEJO_IDIOMA = "tgApplySilence(); tgPillPaint(); tgApplyMisc(); }\ntgApplyGrid(); /* swap pre-pintado"
NUEVO_IDIOMA = "tgApplySilence(); tgPillPaint(); tgApplyMisc(); try{ applyDynamicActionLinks(); }catch(e){} }\ntgApplyGrid(); /* swap pre-pintado"

ESTADO = re.compile(r"^const state = (\{.*\});$", re.MULTILINE)


def clave(titulo, autor):
    """claveLibro() de experiments/nucleus/tiendas.mjs: `${trim().toLowerCase()}__${trim().toLowerCase()}`."""
    return f"{str(titulo or '').strip(be._TG_ESPACIOS).lower()}__{str(autor or '').strip(be._TG_ESPACIOS).lower()}"


def suelta(s):
    return re.sub(r"\s+", " ", str(s or "")).strip().casefold()


class NoCuadra(Exception):
    pass


def paginas(raiz):
    for base in (raiz / "t", raiz / "kids" / "t"):
        if not base.is_dir():
            continue
        for d in sorted(p for p in base.iterdir() if p.is_dir()):
            for f in (d / "index.html", d / "en" / "index.html"):
                if f.is_file():
                    yield f


def tienda_del_libro(libros, indice_suelto, titulo, autor):
    r = libros.get(clave(titulo, autor))
    if r is None:
        candidatos = indice_suelto.get((suelta(titulo), suelta(autor)), [])
        if len(candidatos) == 1:
            r = candidatos[0]
    if r is None:
        raise NoCuadra(f"el libro no está en tiendas.json: «{titulo}» | {autor}")
    if r.get("tienda") in ("casadelibro", "gandhi"):
        return {"tienda": r["tienda"], "url": r.get("url")}, r
    return None, r


def cambiar(texto, libros, indice_suelto, lugar="edicion"):
    """Devuelve (texto nuevo, detalle). Lanza NoCuadra si algo no está exactamente como se espera."""
    m = ESTADO.search(texto)
    if not m:
        raise NoCuadra("no trae «const state = {…};» en un renglón")
    estado = json.loads(m.group(1))
    titulo, autor = estado.get("titulo", ""), estado.get("autor", "")

    # Las ediciones anteriores al botón de idioma (D2-A) no traen tgSetLang ni gemela en inglés: ahí no hay
    # cambio de idioma que enganchar. Si lo traen, el enganche tiene que estar exactamente como se espera.
    con_idioma = "function tgSetLang" in texto
    viejos = [("encabezado", VIEJO_HEAD), ("estilos", VIEJO_CSS), ("referencias", VIEJO_REFS), ("función", VIEJA_FUNCION)]
    if con_idioma:
        viejos.append(("idioma", VIEJO_IDIOMA))
    elif "tgLang" in texto:
        raise NoCuadra("trae tgLang sin tgSetLang: es una variante que no se conoce")
    for nombre, viejo in viejos:
        n = texto.count(viejo)
        if n != 1:
            raise NoCuadra(f"{nombre}: está {n} veces (se espera 1)")
    botones = list(VIEJO_BOTONES.finditer(texto))
    if len(botones) != 1:
        raise NoCuadra(f"botones: están {len(botones)} veces (se espera 1)")
    b = botones[0]

    # Las búsquedas viejas se reconstruyen con los datos de la página: así se sabe que se lee el libro correcto.
    palabras = estado.get("palabras") or []
    palabra = be.normalize_text((palabras[0] if palabras else "") or estado.get("palabra") or titulo)
    busca_comprar = urllib.parse.quote(f"{titulo} {autor}")
    esperado = {
        "qc": be.esc(busca_comprar),
        "qe": be.esc(urllib.parse.quote(palabra) if palabra else busca_comprar),
        "qp": be.esc(urllib.parse.quote(palabra) if palabra else urllib.parse.quote(titulo)),
    }
    for g, v in esperado.items():
        if b.group(g) != v:
            raise NoCuadra(f"la búsqueda vieja {g} no sale de los datos de la página: {b.group(g)!r} ≠ {v!r}")

    tienda_compra, revision = tienda_del_libro(libros, indice_suelto, titulo, autor)
    # 🏷️ BC56: con las marcas UTM de la plantilla (el libro por el id del estado y el lugar por la carpeta).
    nuevos_botones = be.tiendas_botones_html(titulo, tienda_compra, palabra, str(estado.get("id") or "").strip(), lugar)

    nuevo = texto
    nuevo = nuevo.replace(VIEJO_HEAD, be.TIENDAS_HEAD)
    nuevo = nuevo.replace(VIEJO_CSS, be.TIENDAS_CSS)
    nuevo = nuevo[:nuevo.index(b.group(0))] + nuevos_botones + nuevo[nuevo.index(b.group(0)) + len(b.group(0)):]
    nuevo = nuevo.replace(VIEJO_REFS, NUEVO_REFS)
    nuevo = nuevo.replace(VIEJA_FUNCION, be.TIENDAS_FUNCION_JS)
    if con_idioma:
        nuevo = nuevo.replace(VIEJO_IDIOMA, NUEVO_IDIOMA)

    # Comparación después: cero tiendas viejas, cada pedazo nuevo una vez, y nada más cambió.
    quedan = VIEJAS.findall(nuevo)
    if quedan:
        raise NoCuadra(f"quedan {len(quedan)} menciones de las tiendas viejas: {sorted(set(quedan))}")
    nuevos = [("encabezado", be.TIENDAS_HEAD), ("estilos", be.TIENDAS_CSS), ("botones", nuevos_botones),
              ("referencias", NUEVO_REFS), ("función", be.TIENDAS_FUNCION_JS)]
    pares = [(VIEJO_HEAD, be.TIENDAS_HEAD), (VIEJO_CSS, be.TIENDAS_CSS), (b.group(0), nuevos_botones),
             (VIEJO_REFS, NUEVO_REFS), (VIEJA_FUNCION, be.TIENDAS_FUNCION_JS)]
    if con_idioma:
        nuevos.append(("idioma", NUEVO_IDIOMA))
        pares.append((VIEJO_IDIOMA, NUEVO_IDIOMA))
    for nombre, pedazo in nuevos:
        if nuevo.count(pedazo) != 1:
            raise NoCuadra(f"el pedazo nuevo «{nombre}» está {nuevo.count(pedazo)} veces")
    marca = "\x00PEDAZO\x00"
    sin_viejos = texto
    sin_nuevos = nuevo
    for viejo, nuevo_pedazo in pares:
        sin_viejos = sin_viejos.replace(viejo, marca)
        sin_nuevos = sin_nuevos.replace(nuevo_pedazo, marca)
    if sin_viejos != sin_nuevos:
        raise NoCuadra("fuera de los pedazos de las tiendas algo cambió")

    url, tienda = be.tienda_comprar(titulo, tienda_compra)
    return nuevo, {"titulo": titulo, "autor": autor, "tienda": tienda, "url": url, "con_idioma": con_idioma,
                   "motivo": revision.get("motivo"), "revisado": revision.get("revisado")}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--tiendas", required=True, help="data/tiendas.json de triggui-content")
    ap.add_argument("--raiz", default=str(RAIZ_APP / "public"), help="la carpeta public de triggui-app")
    ap.add_argument("--aplicar", action="store_true", help="escribe; sin esto solo cuenta")
    ap.add_argument("--informe", help="escribe aquí el detalle de cada página (JSON)")
    a = ap.parse_args()

    libros = json.loads(Path(a.tiendas).read_text(encoding="utf-8"))["libros"]
    raros = [k for k, r in libros.items() if clave(r.get("titulo"), r.get("autor")) != k]
    if raros:
        raise SystemExit(f"❌ {len(raros)} claves de tiendas.json no salen de su título y autor con la clave de Python: {raros[:3]}")
    indice_suelto = {}
    for r in libros.values():
        indice_suelto.setdefault((suelta(r.get("titulo")), suelta(r.get("autor"))), []).append(r)

    raiz = Path(a.raiz)
    cambios, ya, sin_tiendas, fallas, informe = [], [], [], [], {}
    for f in paginas(raiz):
        texto = f.read_bytes().decode("utf-8")  # bytes exactos: sin traducir finales de renglón
        if not VIEJAS.search(texto):
            (ya if 'id="btnComprar"' in texto else sin_tiendas).append(f)
            continue
        try:
            nuevo, detalle = cambiar(texto, libros, indice_suelto,
                                     "edicion-ninos" if f.relative_to(raiz).parts[0] == "kids" else "edicion")
        except NoCuadra as e:
            fallas.append((f, str(e)))
            continue
        cambios.append((f, nuevo))
        informe[str(f.relative_to(raiz))] = detalle

    from collections import Counter
    por_tienda = Counter(d["tienda"] for d in informe.values())
    print(f"🛒 {len(cambios)} páginas por cambiar · {len(ya)} ya cambiadas · {len(sin_tiendas)} sin tiendas · {len(fallas)} que no cuadran")
    print(f"   «Comprar» quedaría en: {dict(por_tienda)} (gandhi incluye la búsqueda por título de los que no se consiguen: "
          f"{sum(1 for d in informe.values() if d['motivo'])})")
    for f, e in fallas:
        print(f"   ❌ {f.relative_to(raiz)}: {e}")
    if a.informe:
        Path(a.informe).write_text(json.dumps(informe, ensure_ascii=False, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    if fallas:
        raise SystemExit("❌ No se escribe nada: hay páginas que no cuadran.")
    if not a.aplicar:
        print("   (censo: no se escribió nada; con --aplicar se escriben)")
        return
    for f, nuevo in cambios:
        tmp = f.with_name(f.name + ".tmp")
        tmp.write_bytes(nuevo.encode("utf-8"))
        tmp.replace(f)
    print(f"✅ {len(cambios)} páginas escritas")


if __name__ == "__main__":
    main()
