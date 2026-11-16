#!/usr/bin/env python3
"""
🎬 La cola de la semana (C477, paso 1 · 16 de noviembre de 2026)

Decide qué libro hornea el cron de los lunes, para adultos o para Kids, y lo
escribe como salidas de GitHub Actions (hay, libro, catalogo, origen).

  · Lunes 5:00 (CDMX), cron «0 11 * * 1»  → Kids
  · Lunes 6:00 (CDMX), cron «0 12 * * 1»  → adultos (la Cola del Director)
  · Disparo manual con el modo «🎬 Hornear la cola ahora» → el catálogo que se elija

Kids: primero la primera línea útil de cola-kids.txt. Si está vacía, el respaldo:
el primer título de triggui-content/data/libros_master_kids.csv que todavía no
está en contenido_kids.json ni en su cuarentena. Así ningún lunes se queda sin
libro Kids. Adultos: solo cola-lunes.txt, como siempre (sin respaldo).

Uso (lee el entorno: EVENTO, CRON, MODO, CATALOGO_MANUAL):
  python3 scripts/cola-semanal.py --app . --contenido triggui-content >> "$GITHUB_OUTPUT"
"""
import argparse
import csv
import json
import os
import re
import sys
import unicodedata

CRON_KIDS = "0 11 * * 1"
CRON_ADULTOS = "0 12 * * 1"
MARCA_MODO_COLA = "🎬"

COLA_ADULTOS = "cola-lunes.txt"
COLA_KIDS = "cola-kids.txt"
CSV_KIDS = os.path.join("data", "libros_master_kids.csv")
CONTENIDO_KIDS = "contenido_kids.json"
CUARENTENA_KIDS = "contenido_kids.quarantine.json"

LARGO_MAXIMO = 200


def es_corrida_de_cola(evento, modo):
    """El cron siempre; a mano, solo con el modo «🎬 Hornear la cola ahora»."""
    return evento == "schedule" or MARCA_MODO_COLA in (modo or "")


def catalogo_de(evento, cron, catalogo_manual):
    if evento == "schedule":
        return "kids" if (cron or "").strip() == CRON_KIDS else "adulto"
    return "kids" if (catalogo_manual or "").strip() == "kids" else "adulto"


def primera_linea_util(ruta):
    """La primera línea que no está vacía ni empieza con «#»; vacío si no hay archivo."""
    if not os.path.exists(ruta):
        return ""
    with open(ruta, encoding="utf-8-sig") as f:
        for linea in f:
            limpia = linea.strip()
            if limpia and not limpia.startswith("#"):
                return limpia
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


def respaldo_kids(raiz_contenido):
    """El primer título del catálogo maestro Kids que todavía no está horneado ni en cuarentena."""
    ruta_csv = os.path.join(raiz_contenido, CSV_KIDS)
    if not os.path.exists(ruta_csv):
        return ""
    ya = titulos_de(os.path.join(raiz_contenido, CONTENIDO_KIDS)) | titulos_de(
        os.path.join(raiz_contenido, CUARENTENA_KIDS)
    )
    with open(ruta_csv, encoding="utf-8-sig", newline="") as f:
        for fila in csv.DictReader(f):
            titulo = (fila.get("titulo") or "").strip()
            autor = (fila.get("autor") or "").strip()
            if not titulo or normalizar(titulo) in ya:
                continue
            return f"{titulo} | {autor}" if autor else titulo
    return ""


def limpiar(libro):
    """Una sola línea, sin caracteres que rompan el shell o las salidas de Actions."""
    t = re.sub(r"[\r\n\t]+", " ", str(libro or ""))
    t = re.sub(r'["`$\\]', "", t)
    t = " ".join(t.split())
    return t[:LARGO_MAXIMO].strip()


def decidir(evento, cron, modo, catalogo_manual, raiz_app, raiz_contenido):
    """Devuelve un dict con hay, libro, catalogo, origen y un mensaje para el registro."""
    if not es_corrida_de_cola(evento, modo):
        return {"hay": "", "libro": "", "catalogo": "", "origen": "",
                "mensaje": "ℹ️  Disparo manual: la cola no aplica"}
    catalogo = catalogo_de(evento, cron, catalogo_manual)
    if catalogo == "kids":
        libro = limpiar(primera_linea_util(os.path.join(raiz_app, COLA_KIDS)))
        origen = "cola" if libro else ""
        if not libro:
            libro = limpiar(respaldo_kids(raiz_contenido))
            origen = "catalogo" if libro else ""
    else:
        libro = limpiar(primera_linea_util(os.path.join(raiz_app, COLA_ADULTOS)))
        origen = "cola" if libro else ""
    if not libro:
        nombre = "Kids" if catalogo == "kids" else "de adultos"
        return {"hay": "", "libro": "", "catalogo": catalogo, "origen": "",
                "mensaje": f"🟡 Cola {nombre} vacía: el horno descansa"}
    de_donde = "de la cola" if origen == "cola" else "del catálogo Kids (la cola está vacía)"
    return {"hay": "true", "libro": libro, "catalogo": catalogo, "origen": origen,
            "mensaje": f"🎬 Próximo libro ({catalogo}), {de_donde}: {libro}"}


def main(argv=None):
    p = argparse.ArgumentParser(description="Decide el libro de la cola de la semana.")
    p.add_argument("--app", default=".", help="raíz de triggui-app (donde viven las colas)")
    p.add_argument("--contenido", default="triggui-content", help="raíz de triggui-content")
    a = p.parse_args(argv)
    r = decidir(os.environ.get("EVENTO", ""), os.environ.get("CRON", ""),
                os.environ.get("MODO", ""), os.environ.get("CATALOGO_MANUAL", ""),
                a.app, a.contenido)
    print(r["mensaje"], file=sys.stderr)
    for clave in ("hay", "libro", "catalogo", "origen"):
        print(f"{clave}={r[clave]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
