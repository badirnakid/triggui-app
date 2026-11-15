#!/usr/bin/env python3
"""🏷️ utm-ediciones.py — pone las marcas UTM en las ligas a las tiendas de las ediciones ya publicadas
(14 de noviembre de 2026, BC56).
    python3 scripts/utm-ediciones.py            # censo, no escribe
    python3 scripts/utm-ediciones.py --aplicar  # escribe
Las ediciones nuevas salen de la plantilla (scripts/build-editions.py) ya con las marcas. A las ya publicadas se les
cambian solo dos pedazos, con exactamente lo mismo que pone la plantilla:
    1. el renglón de las tres tiendas → el mismo, con las tres ligas marcadas (tiendas_botones_html con lugar);
    2. la función que aplica la regla de /tiendas.js → la que pasa el lugar y el slug, y marca las ligas de respaldo.
Comprobaciones de cada página, antes de escribir un byte (censo antes de escribir):
    · el renglón actual es, carácter por carácter, el de B417 rehecho con los datos de la página y la tienda de su
      botón «Comprar»; la función de B417 está exactamente una vez;
    · después: cada pedazo nuevo una vez, tres ligas con utm_source=triggui en el renglón, y quitando los pedazos,
      la página vieja y la nueva son idénticas byte por byte (comparación después: nada más cambió).
Si una sola página no cuadra, no se escribe ninguna.
"""
import argparse
import html
import importlib.util
import json
import re
import sys
from collections import Counter
from pathlib import Path

RAIZ_APP = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("build_editions", RAIZ_APP / "scripts" / "build-editions.py")
be = importlib.util.module_from_spec(_spec)
_argv = sys.argv
sys.argv = ["build-editions.py"]
_spec.loader.exec_module(be)
sys.argv = _argv

# La función de B417 tal como la puso la plantilla del commit f83a94b (14 de noviembre de 2026, 12:22).
VIEJA_FUNCION = "/* 🛒 B417 · Tiendas, con la misma regla que la app y el correo (/tiendas.js). En México, «Comprar» lleva a\n   Casa del Libro o Gandhi, y 🔮 y «Explorar» buscan la palabra del momento en Casa del Libro y en Gandhi.\n   Fuera de México, Amazon del país del lector, con el título en el idioma de la página. Mientras /tiendas.js\n   no llega (o si no llega), se quedan las ligas de México que trae la página. */\nfunction tgEnc(s) { try { return encodeURIComponent(String(s == null ? '' : s).replace(/\\s+/g, ' ').trim()); } catch (e) { return ''; } }\n\nfunction tgPintaTienda(a, tienda, texto) {\n  if (!a) return;\n  const img = a.querySelector('img');\n  const span = a.querySelector('.btn-tienda-txt');\n  const logo = tienda === 'casadelibro' ? ['/tiendas/casadellibro-blanco.png', 'Casa del Libro', 'logo-casadelibro']\n    : (tienda === 'gandhi' ? ['/tiendas/gandhi-blanco.png', 'Gandhi', 'logo-gandhi'] : null);\n  if (img) {\n    if (logo) {\n      if (img.getAttribute('src') !== logo[0]) img.setAttribute('src', logo[0]);\n      img.alt = logo[1];\n      img.className = logo[2];\n      img.style.display = '';\n    } else {\n      img.style.display = 'none';\n    }\n  }\n  if (span && span.textContent !== texto) span.textContent = texto;\n}\n\nfunction applyDynamicActionLinks() {\n  const T = window.TrigguiTiendas || null;\n  const EN = (typeof tgLang !== 'undefined' && tgLang === 'en');\n  const mx = T ? T.enMexico() : true;\n\n  if (btnComprar && TG_COMPRA) {\n    const c = T\n      ? T.comprar({ titulo: state._tes || state.titulo, titulo_en: state.titulo_en || '', autor: state.autor || '', tienda_compra: TG_COMPRA }, EN ? 'en' : 'es', mx)\n      : TG_COMPRA;\n    btnComprar.href = c.url;\n    btnComprar.setAttribute('data-tienda', c.tienda);\n    tgPintaTienda(btnComprar, c.tienda, c.tienda === 'amazon' ? (EN ? 'Buy on Amazon' : 'Comprar en Amazon') : (EN ? 'Buy' : 'Comprar'));\n  }\n\n  /* «Explorar en Gandhi» solo en México; fuera, el renglón queda en dos: «Comprar en Amazon» y 🔮. */\n  if (btnGandhi) {\n    btnGandhi.style.display = mx ? '' : 'none';\n    tgPintaTienda(btnGandhi, 'gandhi', EN ? 'Explore' : 'Explorar');\n  }\n  if (tgTiendas) tgTiendas.className = 'btn-row ' + (mx ? 'btn-row-3' : 'btn-row-2');\n\n  /* Sin palabra del momento, se quedan las búsquedas que trae la página. */\n  const word = getPrimaryChronoWord();\n  if (!word) return;\n\n  if (btnCrystal) {\n    const x = T ? T.explorar(word, mx) : { url: 'https://casadelibro.com.mx/search/?q=' + tgEnc(word), tienda: 'casadelibro' };\n    btnCrystal.href = x.url;\n    btnCrystal.setAttribute('data-tienda', x.tienda);\n  }\n\n  if (btnGandhi && mx) {\n    const g = T ? T.explorarGandhi(word, true) : null;\n    btnGandhi.href = g ? g.url : 'https://www.gandhi.com.mx/?query=' + tgEnc(word);\n  }\n}\n\n/* /tiendas.js carga sin detener la página: cuando llega, avisa y las ligas se rehacen con la regla completa. */\nwindow.addEventListener('trigguitiendas', function () { try { applyDynamicActionLinks(); } catch (e) {} });\n\n/* 🛒 B417: los clics a las tiendas se miden con los mismos nombres que en la app, con la tienda en su parámetro. */\n[['btnComprar', 'comprar'], ['btnCrystal', 'explorar'], ['btnGandhi', 'explorar_gandhi']].forEach(function (p) {\n  const el = document.getElementById(p[0]);\n  if (el) el.addEventListener('click', function () {\n    try { gtag('event', p[1] + '_clicked', { book: state._tes || state.titulo || '', tienda: el.getAttribute('data-tienda') || '', contexto: 'edicion', slug: state.id || '' }); } catch (e) {}\n  });\n});"

ESTADO = re.compile(r"^const state = (\{.*\});$", re.MULTILINE)
RENGLON = re.compile(r'<div class="btn-row btn-row-3" id="tgTiendas">\n.*?\n        </div>', re.S)
COMPRAR = re.compile(r'<a class="btn-dark btn-comprar" id="btnComprar" href="([^"]*)" data-tienda="([a-z]+)"')
MARCA = "\x00PEDAZO\x00"


class NoCuadra(Exception):
    pass


def paginas(raiz):
    for base in (raiz / "t", raiz / "kids" / "t"):
        if not base.is_dir():
            continue
        for d in sorted(p for p in base.iterdir() if p.is_dir()):
            for f in (d / "index.html", d / "en" / "index.html"):
                if f.is_file() and 'id="tgTiendas"' in f.read_text(encoding="utf-8"):
                    yield f


def lugar_de(f, raiz):
    return "edicion-ninos" if f.relative_to(raiz).parts[0] == "kids" else "edicion"


def cambiar(texto, lugar):
    """Devuelve (texto nuevo, detalle). Lanza NoCuadra si algo no está exactamente como se espera."""
    m = ESTADO.search(texto)
    if not m:
        raise NoCuadra("no trae «const state = {…};» en un renglón")
    estado = json.loads(m.group(1))
    titulo = estado.get("titulo", "")
    slug = str(estado.get("id") or "").strip()
    if not slug:
        raise NoCuadra("el estado no trae id (el slug)")
    palabras = estado.get("palabras") or []
    palabra = be.normalize_text((palabras[0] if palabras else "") or estado.get("palabra") or titulo)

    renglones = RENGLON.findall(texto)
    if len(renglones) != 1:
        raise NoCuadra(f"el renglón de tiendas está {len(renglones)} veces (se espera 1)")
    actual = renglones[0]
    if texto.count(actual) != 1:
        raise NoCuadra("el renglón de tiendas se repite")
    mc = COMPRAR.search(actual)
    if not mc:
        raise NoCuadra("el botón «Comprar» no está como se espera")
    tc = {"tienda": mc.group(2), "url": html.unescape(mc.group(1))}
    viejo = be.tiendas_botones_html(titulo, tc, palabra)
    if viejo != actual:
        raise NoCuadra("el renglón no es el de B417 rehecho con los datos de la página")
    if "utm_" in actual:
        raise NoCuadra("el renglón ya trae marcas")
    nuevo_renglon = be.tiendas_botones_html(titulo, tc, palabra, slug, lugar)
    if texto.count(VIEJA_FUNCION) != 1:
        raise NoCuadra(f"la función de B417 está {texto.count(VIEJA_FUNCION)} veces (se espera 1)")

    nuevo = texto.replace(actual, nuevo_renglon, 1).replace(VIEJA_FUNCION, be.TIENDAS_FUNCION_JS, 1)

    # Comparación después: cada pedazo nuevo una vez, las tres ligas marcadas, y nada más cambió.
    for nombre, pedazo in (("renglón", nuevo_renglon), ("función", be.TIENDAS_FUNCION_JS)):
        if nuevo.count(pedazo) != 1:
            raise NoCuadra(f"el pedazo nuevo «{nombre}» está {nuevo.count(pedazo)} veces")
    if nuevo_renglon.count("utm_source=triggui") != 3:
        raise NoCuadra("el renglón nuevo no trae las tres ligas marcadas")
    sin_viejos = texto.replace(actual, MARCA).replace(VIEJA_FUNCION, MARCA)
    sin_nuevos = nuevo.replace(nuevo_renglon, MARCA).replace(be.TIENDAS_FUNCION_JS, MARCA)
    if sin_viejos != sin_nuevos:
        raise NoCuadra("fuera de los pedazos algo cambió")
    return nuevo, {"slug": slug, "lugar": lugar, "tienda": tc["tienda"]}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--raiz", default=str(RAIZ_APP / "public"), help="la carpeta public de triggui-app")
    ap.add_argument("--aplicar", action="store_true", help="escribe; sin esto solo cuenta")
    a = ap.parse_args()
    raiz = Path(a.raiz)
    cambios, fallas, detalle = [], [], []
    for f in paginas(raiz):
        try:
            nuevo, d = cambiar(f.read_text(encoding="utf-8"), lugar_de(f, raiz))
            cambios.append((f, nuevo))
            detalle.append(d)
        except NoCuadra as e:
            fallas.append((f, str(e)))
    print(f"páginas con el renglón de tiendas: {len(cambios) + len(fallas)} · cuadran: {len(cambios)} · no cuadran: {len(fallas)}")
    print("por lugar:", dict(Counter(d["lugar"] for d in detalle)), "· por tienda de «Comprar»:", dict(Counter(d["tienda"] for d in detalle)))
    for f, e in fallas:
        print(f"  ✗ {f.relative_to(raiz)}: {e}")
    if fallas:
        print("No se escribió ninguna página.")
        return 1
    if not a.aplicar:
        print("Censo en orden. Para escribir: --aplicar")
        return 0
    for f, nuevo in cambios:
        f.write_text(nuevo, encoding="utf-8")
    print(f"Escritas {len(cambios)} páginas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
