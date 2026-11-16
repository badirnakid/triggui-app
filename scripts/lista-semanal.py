#!/usr/bin/env python3
"""
🎬 La lista de la semana (C477, paso 1 · 16 de noviembre de 2026)

Decide qué libro publica el lunes, para adultos o para Kids, y lo escribe como salidas
de GitHub Actions (hay, libro, catalogo, origen, saltados).

  · Lunes 5:00 (CDMX), cron «0 11 * * 1»  → Kids: lista-kids.txt
  · Lunes 6:00 (CDMX), cron «0 12 * * 1»  → adultos: cola-lunes.txt (la Cola del Director)
  · A mano, con el modo «🎬 Publicar ya el siguiente libro», solo desde main → el catálogo que se elija

Curaduría (decisión de Badir del 16 de noviembre, 14:17): solo se publica lo que Badir aprobó,
es decir, lo que está en su lista. Nada se elige solo. Se toma el primer título de la lista que
se consiga en Casa del Libro o en Gandhi (tiendas-horno.mjs revisar). Los que no se consiguen se
saltan y se quedan en la lista. Si ninguno se consigue, o la lista está vacía, no se publica nada.
Si las tiendas no responden, se toma el título aprobado: la puerta de tiendas del horno lo vuelve
a revisar.

Uso (lee el entorno: EVENTO, CRON, MODO, CATALOGO_MANUAL, REF):
  python3 scripts/lista-semanal.py --app . --contenido triggui-content --nucleus experiments/nucleus >> "$GITHUB_OUTPUT"
Comprobar que un libro ya entró a su catálogo (job consumir):
  python3 scripts/lista-semanal.py --verificar --catalogo kids --libro "Título | Autor" --slug "slug" --contenido triggui-content
"""
import argparse
import json
import os
import re
import subprocess
import sys
import unicodedata

CRON_KIDS = "0 11 * * 1"
CRON_ADULTOS = "0 12 * * 1"
MARCA_MODO_LISTA = "🎬"
REF_MAIN = "refs/heads/main"

LISTA_ADULTOS = "cola-lunes.txt"
LISTA_KIDS = "lista-kids.txt"
CONTENIDO_KIDS = "contenido_kids.json"
CONTENIDO_ADULTOS = "contenido.json"
TIENDAS = os.path.join("data", "tiendas.json")

LARGO_MAXIMO = 200
SEGUNDOS_POR_REVISION = 180


def es_corrida_de_lista(evento, modo):
    """El cron siempre; a mano, solo con el modo «🎬 Publicar ya el siguiente libro»."""
    return evento == "schedule" or MARCA_MODO_LISTA in (modo or "")


def catalogo_de(evento, cron, catalogo_manual):
    if evento == "schedule":
        return "kids" if (cron or "").strip() == CRON_KIDS else "adulto"
    return "kids" if (catalogo_manual or "").strip() == "kids" else "adulto"


def limpiar(libro):
    """Una sola línea, sin caracteres que rompan el shell o las salidas de Actions."""
    t = re.sub(r"[\r\n\t]+", " ", str(libro or ""))
    t = re.sub(r'["`$\\]', "", t)
    t = " ".join(t.split())
    return t[:LARGO_MAXIMO].strip()


def lineas_utiles(ruta):
    """Los títulos de la lista, en orden: sin comentarios ni líneas que quedan vacías al limpiarlas."""
    if not os.path.exists(ruta):
        return []
    with open(ruta, encoding="utf-8-sig") as f:
        crudas = [l.strip() for l in f]
    return [limpiar(c) for c in crudas if c and not c.startswith("#") and limpiar(c)]


def revisar_con_horno(nucleus, tiendas):
    """La revisión de tiendas del horno (Casa del Libro o Gandhi): devuelve ("si"|"no"|"?", detalle)."""
    def revisar(libro):
        try:
            p = subprocess.run(["node", "tiendas-horno.mjs", "revisar", "--libro", libro, "--tiendas", tiendas],
                               cwd=nucleus, capture_output=True, text=True, timeout=SEGUNDOS_POR_REVISION)
        except (OSError, subprocess.TimeoutExpired) as e:
            return "?", f"sin respuesta de la revisión ({type(e).__name__})"
        salida = " ".join((p.stdout + " " + p.stderr).split())
        if p.returncode == 0:
            m = re.search(r"Se consigue en ([^:]+):\s*(\S+)?", salida)
            if not m:
                return "si", "se consigue"
            return "si", "se consigue en " + m.group(1).strip() + (f" ({m.group(2)})" if m.group(2) else "")
        if "no se pudo leer alguna de las tiendas" in salida:
            return "?", "las tiendas no respondieron"
        if p.returncode == 3:
            m = re.search(r"no se consigue \(([^)]*)\)", salida)
            return "no", m.group(1) if m else "no se consigue"
        return "?", f"la revisión salió con {p.returncode}"
    return revisar


def decidir(evento, cron, modo, catalogo_manual, raiz_app, ref="", revisar=None):
    """Devuelve un dict con hay, libro, catalogo, origen, saltados y un mensaje para el registro."""
    vacio = {"hay": "", "libro": "", "catalogo": "", "origen": "", "saltados": ""}
    if not es_corrida_de_lista(evento, modo):
        return dict(vacio, mensaje="ℹ️  Disparo manual: la lista no aplica")
    if evento != "schedule" and ref and ref != REF_MAIN:
        return dict(vacio, mensaje=f"🛑 «🎬 Publicar ya el siguiente libro» solo corre desde main (aquí: {ref}): no se publica nada")
    catalogo = catalogo_de(evento, cron, catalogo_manual)
    nombre = "Kids" if catalogo == "kids" else "de adultos"
    lineas = lineas_utiles(os.path.join(raiz_app, LISTA_KIDS if catalogo == "kids" else LISTA_ADULTOS))
    if not lineas:
        return dict(vacio, catalogo=catalogo, mensaje=f"🟡 La lista {nombre} está vacía: no se publica nada")
    saltados = []
    for libro in lineas:
        estado, detalle = revisar(libro) if revisar else ("?", "sin revisar tiendas")
        if estado == "no":
            saltados.append(f"{libro} ({detalle})")
            continue
        aviso = f" · saltados: {'; '.join(saltados)}" if saltados else ""
        return {"hay": "true", "libro": libro, "catalogo": catalogo, "origen": "lista",
                "saltados": limpiar("; ".join(saltados)),
                "mensaje": f"🎬 Libro de la semana ({catalogo}): {libro} · {detalle}{aviso}"}
    return dict(vacio, catalogo=catalogo, saltados=limpiar("; ".join(saltados)),
                mensaje=f"🟡 Ningún título de la lista {nombre} se consigue hoy: no se publica nada · {'; '.join(saltados)}")


def normalizar(titulo):
    """Sin acentos, en minúsculas y solo letras y números, para comparar títulos."""
    t = unicodedata.normalize("NFKD", str(titulo or ""))
    t = "".join(c for c in t if not unicodedata.combining(c)).lower()
    return " ".join(re.sub(r"[^a-z0-9]+", " ", t).split())


def _libros(ruta):
    try:
        with open(ruta, encoding="utf-8-sig") as f:
            datos = json.load(f)
    except (OSError, ValueError):
        return []
    libros = datos.get("libros", []) if isinstance(datos, dict) else datos
    return [l for l in (libros if isinstance(libros, list) else []) if isinstance(l, dict)]


def titulos_de(ruta):
    """Los títulos normalizados de un catálogo (lista, o un dict con «libros»)."""
    vistos = {normalizar(l.get(c)) for l in _libros(ruta) for c in ("titulo", "title") if l.get(c)}
    vistos.discard("")
    return vistos


def slugs_de(ruta):
    """Los «_slug» de un catálogo (lista, o un dict con «libros»)."""
    return {str(l.get("_slug")).strip() for l in _libros(ruta) if l.get("_slug")}


def _prefijo_suficiente(t):
    """Un título corto solo vale como prefijo si no es casi nada: dos palabras o al menos ocho letras."""
    return len(t.split()) >= 2 or len(t) >= 8


def ya_entro(libro, catalogo, raiz_contenido, slug=""):
    """¿El libro ya está en su catálogo?

    Con «slug» (el que guardó el horno en esta corrida) la prueba es exacta: ese «_slug» está en el
    catálogo. Sin él, por título: igual, o uno empieza con el otro (título corto o con subtítulo)."""
    archivo = os.path.join(raiz_contenido, CONTENIDO_KIDS if catalogo == "kids" else CONTENIDO_ADULTOS)
    slug = str(slug or "").strip()
    if slug:
        return slug in slugs_de(archivo)
    buscado = normalizar(str(libro or "").split(" | ")[0])
    if not buscado:
        return False
    for t in titulos_de(archivo):
        if t == buscado:
            return True
        if t.startswith(buscado + " ") and _prefijo_suficiente(buscado):
            return True
        if buscado.startswith(t + " ") and _prefijo_suficiente(t):
            return True
    return False


def main(argv=None):
    p = argparse.ArgumentParser(description="Decide el libro de la lista de la semana.")
    p.add_argument("--app", default=".", help="raíz de triggui-app (donde viven las listas)")
    p.add_argument("--contenido", default="triggui-content", help="raíz de triggui-content")
    p.add_argument("--nucleus", default=os.path.join("experiments", "nucleus"), help="donde vive tiendas-horno.mjs")
    p.add_argument("--sin-tiendas", action="store_true", help="no revisar tiendas (pruebas locales)")
    p.add_argument("--verificar", action="store_true", help="solo comprobar que --libro ya entró a su catálogo")
    p.add_argument("--catalogo", default="adulto")
    p.add_argument("--libro", default="")
    p.add_argument("--slug", default="", help="el «_slug» que guardó el horno en esta corrida")
    a = p.parse_args(argv)
    if a.verificar:
        ok = ya_entro(a.libro, a.catalogo, a.contenido, slug=a.slug)
        que = f"{a.libro} (slug {a.slug})" if a.slug else a.libro
        print(("✅ Ya está en el catálogo: " if ok else "🔴 No está en el catálogo: ") + que, file=sys.stderr)
        return 0 if ok else 1
    revisar = None if a.sin_tiendas else revisar_con_horno(
        os.path.abspath(a.nucleus), os.path.abspath(os.path.join(a.contenido, TIENDAS)))
    r = decidir(os.environ.get("EVENTO", ""), os.environ.get("CRON", ""),
                os.environ.get("MODO", ""), os.environ.get("CATALOGO_MANUAL", ""),
                a.app, ref=os.environ.get("REF", ""), revisar=revisar)
    print(r["mensaje"], file=sys.stderr)
    resumen = os.environ.get("GITHUB_STEP_SUMMARY")
    if resumen:
        with open(resumen, "a", encoding="utf-8") as f:
            f.write(f"### 🎬 La lista de la semana\n\n{r['mensaje']}\n\n")
    for clave in ("hay", "libro", "catalogo", "origen", "saltados"):
        print(f"{clave}={r[clave]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
