#!/usr/bin/env python3
"""
🎬 La cola de la semana (C477, paso 1 · 16 de noviembre de 2026)

Decide qué libro hornea el cron de los lunes, para adultos o para Kids, y lo
escribe como salidas de GitHub Actions (hay, libro, catalogo, origen).

  · Lunes 5:00 (CDMX), cron «0 11 * * 1»  → Kids
  · Lunes 6:00 (CDMX), cron «0 12 * * 1»  → adultos (la Cola del Director)
  · Disparo manual con el modo «🎬 Hornear la cola ahora», solo desde main → el catálogo que se elija

Kids: primero la primera línea útil de cola-kids.txt. Si está vacía, el respaldo:
uno de los primeros títulos de triggui-content/data/libros_master_kids.csv que
todavía no están en contenido_kids.json ni en su cuarentena. Se turnan por semana
entre los tres primeros, así un título que falla no detiene a los demás. Ningún
lunes se queda sin libro Kids por un título que falla. Adultos: solo cola-lunes.txt.

Uso (lee el entorno: EVENTO, CRON, MODO, CATALOGO_MANUAL, REF):
  python3 scripts/cola-semanal.py --app . --contenido triggui-content >> "$GITHUB_OUTPUT"
Comprobar que un libro de la cola ya entró a su catálogo (para el job consumir):
  python3 scripts/cola-semanal.py --verificar --catalogo kids --libro "Título | Autor" --slug "slug" --contenido triggui-content
"""
import argparse
import csv
import datetime
import json
import os
import re
import sys
import unicodedata

CRON_KIDS = "0 11 * * 1"
CRON_ADULTOS = "0 12 * * 1"
MARCA_MODO_COLA = "🎬"
REF_MAIN = "refs/heads/main"

COLA_ADULTOS = "cola-lunes.txt"
COLA_KIDS = "cola-kids.txt"
CSV_KIDS = os.path.join("data", "libros_master_kids.csv")
CONTENIDO_KIDS = "contenido_kids.json"
CONTENIDO_ADULTOS = "contenido.json"
CUARENTENA_KIDS = "contenido_kids.quarantine.json"

LARGO_MAXIMO = 200
VENTANA_RESPALDO = 3


def es_corrida_de_cola(evento, modo):
    """El cron siempre; a mano, solo con el modo «🎬 Hornear la cola ahora»."""
    return evento == "schedule" or MARCA_MODO_COLA in (modo or "")


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


def primera_linea_util(ruta):
    """La primera línea que no es comentario y que, ya limpia, no queda vacía; vacío si no hay."""
    if not os.path.exists(ruta):
        return ""
    with open(ruta, encoding="utf-8-sig") as f:
        for linea in f:
            cruda = linea.strip()
            if cruda and not cruda.startswith("#") and limpiar(cruda):
                return limpiar(cruda)
    return ""


def normalizar(titulo):
    """Sin acentos, en minúsculas y solo letras y números, para comparar títulos."""
    t = unicodedata.normalize("NFKD", str(titulo or ""))
    t = "".join(c for c in t if not unicodedata.combining(c)).lower()
    return " ".join(re.sub(r"[^a-z0-9]+", " ", t).split())


def titulos_de(ruta):
    """Los títulos normalizados de un catálogo (lista, o un dict con «libros»)."""
    if not os.path.exists(ruta):
        return set()
    try:
        with open(ruta, encoding="utf-8-sig") as f:
            datos = json.load(f)
    except (OSError, ValueError):
        return set()
    libros = datos.get("libros", []) if isinstance(datos, dict) else datos
    vistos = set()
    for libro in libros if isinstance(libros, list) else []:
        if isinstance(libro, dict):
            for clave in ("titulo", "title"):
                if libro.get(clave):
                    vistos.add(normalizar(libro[clave]))
    vistos.discard("")
    return vistos


def semana_del(hoy=None):
    """Un contador de semanas que no se reinicia con el año (así el turno no se repite en enero)."""
    hoy = hoy or datetime.datetime.now(datetime.timezone.utc).date()
    return hoy.toordinal() // 7


def respaldo_kids(raiz_contenido, semana):
    """Uno de los primeros títulos del catálogo Kids que no están horneados ni en cuarentena, por turno semanal."""
    ruta_csv = os.path.join(raiz_contenido, CSV_KIDS)
    if not os.path.exists(ruta_csv):
        return ""
    ya = titulos_de(os.path.join(raiz_contenido, CONTENIDO_KIDS)) | titulos_de(
        os.path.join(raiz_contenido, CUARENTENA_KIDS)
    )
    candidatos = []
    with open(ruta_csv, encoding="utf-8-sig", newline="") as f:
        for fila in csv.DictReader(f):
            titulo = (fila.get("titulo") or "").strip()
            autor = (fila.get("autor") or "").strip()
            libro = limpiar(f"{titulo} | {autor}" if autor else titulo)
            if not titulo or not libro or normalizar(titulo) in ya:
                continue
            candidatos.append(libro)
            if len(candidatos) == VENTANA_RESPALDO:
                break
    if not candidatos:
        return ""
    return candidatos[semana % len(candidatos)]


def decidir(evento, cron, modo, catalogo_manual, raiz_app, raiz_contenido, ref="", semana=None):
    """Devuelve un dict con hay, libro, catalogo, origen y un mensaje para el registro."""
    if not es_corrida_de_cola(evento, modo):
        return {"hay": "", "libro": "", "catalogo": "", "origen": "",
                "mensaje": "ℹ️  Disparo manual: la cola no aplica"}
    if evento != "schedule" and ref and ref != REF_MAIN:
        return {"hay": "", "libro": "", "catalogo": "", "origen": "",
                "mensaje": f"🛑 «🎬 Hornear la cola ahora» solo corre desde main (aquí: {ref}): no se hornea nada"}
    catalogo = catalogo_de(evento, cron, catalogo_manual)
    if catalogo == "kids":
        libro = primera_linea_util(os.path.join(raiz_app, COLA_KIDS))
        origen = "cola" if libro else ""
        if not libro:
            libro = respaldo_kids(raiz_contenido, semana_del() if semana is None else semana)
            origen = "catalogo" if libro else ""
    else:
        libro = primera_linea_util(os.path.join(raiz_app, COLA_ADULTOS))
        origen = "cola" if libro else ""
    if not libro:
        nombre = "Kids" if catalogo == "kids" else "de adultos"
        return {"hay": "", "libro": "", "catalogo": catalogo, "origen": "",
                "mensaje": f"🟡 Cola {nombre} vacía: el horno descansa"}
    de_donde = "de la cola" if origen == "cola" else "del catálogo Kids (la cola está vacía)"
    return {"hay": "true", "libro": libro, "catalogo": catalogo, "origen": origen,
            "mensaje": f"🎬 Próximo libro ({catalogo}), {de_donde}: {libro}"}


def slugs_de(ruta):
    """Los «_slug» de un catálogo (lista, o un dict con «libros»)."""
    try:
        with open(ruta, encoding="utf-8-sig") as f:
            datos = json.load(f)
    except (OSError, ValueError):
        return set()
    libros = datos.get("libros", []) if isinstance(datos, dict) else datos
    return {str(l.get("_slug")).strip() for l in (libros if isinstance(libros, list) else [])
            if isinstance(l, dict) and l.get("_slug")}


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
    p = argparse.ArgumentParser(description="Decide el libro de la cola de la semana.")
    p.add_argument("--app", default=".", help="raíz de triggui-app (donde viven las colas)")
    p.add_argument("--contenido", default="triggui-content", help="raíz de triggui-content")
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
    semana = os.environ.get("SEMANA")
    r = decidir(os.environ.get("EVENTO", ""), os.environ.get("CRON", ""),
                os.environ.get("MODO", ""), os.environ.get("CATALOGO_MANUAL", ""),
                a.app, a.contenido, ref=os.environ.get("REF", ""),
                semana=int(semana) if semana and semana.isdigit() else None)
    print(r["mensaje"], file=sys.stderr)
    for clave in ("hay", "libro", "catalogo", "origen"):
        print(f"{clave}={r[clave]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
