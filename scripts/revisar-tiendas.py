#!/usr/bin/env python3
"""
🛒 Revisar tiendas de una lista (C477 · 16 de noviembre de 2026)

Para proponerle a Badir libros que de verdad se consiguen: revisa cada título en Casa del Libro
y en Gandhi con la misma revisión del horno (tiendas-horno.mjs revisar) y escribe una tabla en
Markdown. No publica ni guarda nada: el flujo «🛒 Revisar tiendas de una lista» la deja en el
resumen de la corrida.

Uso:  python3 -I -B scripts/revisar-tiendas.py --libros "Título | Autor; Otro | Autora" \
        --nucleus experiments/nucleus --tiendas triggui-content/data/tiendas.json >> "$GITHUB_STEP_SUMMARY"
"""
import argparse
import importlib.util
import os
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("lista_semanal", os.path.join(AQUI, "lista-semanal.py"))
lista = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(lista)

ICONO = {"si": "✅ se consigue", "no": "❌ no se consigue", "?": "❔ sin respuesta"}
TOPE = 40


def partir(libros):
    """Los títulos, separados por «;» o por saltos de línea, limpios y sin repetir."""
    vistos, salida = set(), []
    for crudo in re.split(r"[;\n]", str(libros or "")):
        libro = lista.limpiar(crudo)
        if libro and libro.lower() not in vistos:
            vistos.add(libro.lower())
            salida.append(libro)
    return salida[:TOPE]


def celda(t):
    return str(t).replace("|", "¦")


def tabla(libros, revisar):
    filas = ["| # | Libro | ¿Se consigue? | Detalle |", "|---|---|---|---|"]
    cuenta = {"si": 0, "no": 0, "?": 0}
    for n, libro in enumerate(libros, 1):
        estado, detalle = revisar(libro)
        cuenta[estado] = cuenta.get(estado, 0) + 1
        filas.append(f"| {n} | {celda(libro)} | {ICONO.get(estado, estado)} | {celda(detalle)} |")
    resumen = f"Se consiguen {cuenta['si']} de {len(libros)}; no se consiguen {cuenta['no']}; sin respuesta {cuenta['?']}."
    return "### 🛒 Revisión de tiendas (Casa del Libro o Gandhi)\n\n" + "\n".join(filas) + "\n\n" + resumen + "\n", cuenta


def main(argv=None):
    p = argparse.ArgumentParser(description="Revisa en las tiendas una lista de títulos.")
    p.add_argument("--libros", required=True)
    p.add_argument("--nucleus", default=os.path.join("experiments", "nucleus"))
    p.add_argument("--tiendas", default=os.path.join("triggui-content", "data", "tiendas.json"))
    a = p.parse_args(argv)
    libros = partir(a.libros)
    if not libros:
        print("No hay títulos para revisar.", file=sys.stderr)
        return 1
    texto, _ = tabla(libros, lista.revisar_con_horno(os.path.abspath(a.nucleus), os.path.abspath(a.tiendas)))
    print(texto)
    print(texto, file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
