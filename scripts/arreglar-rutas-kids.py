#!/usr/bin/env python3
"""
🔧 Arregla las rutas de las páginas Kids que ya existen (C477 · 16 de noviembre de 2026).

build-editions.py armaba la imagen para compartir, la URL canónica, la gemela en inglés y sus
rutas absolutas con /t/<slug>/ también para Niños, que viven en /kids/t/<slug>/. Ya está corregido
para lo nuevo (ruta_ediciones); esto deja igual lo que ya se publicó: en cada carpeta
public/kids/t/<slug>/, cambia «https://app.triggui.com/t/<slug>/» por «https://app.triggui.com/kids/t/<slug>/».
Solo toca la URL de la propia carpeta; es idempotente (la segunda vez no cambia nada).

Uso:  python3 -I -B scripts/arreglar-rutas-kids.py [--raiz .] [--aplicar]
      Sin --aplicar solo cuenta lo que cambiaría.
"""
import argparse
import os
import sys

BASE = "https://app.triggui.com"


def arreglar(raiz, aplicar):
    carpeta = os.path.join(raiz, "public", "kids", "t")
    total_archivos, total_cambios = 0, 0
    for slug in sorted(os.listdir(carpeta)):
        dir_slug = os.path.join(carpeta, slug)
        if not os.path.isdir(dir_slug):
            continue
        viejo, nuevo = f"{BASE}/t/{slug}/", f"{BASE}/kids/t/{slug}/"
        for base, _, archivos in os.walk(dir_slug):
            for nombre in archivos:
                if not nombre.endswith(".html"):
                    continue
                ruta = os.path.join(base, nombre)
                with open(ruta, encoding="utf-8") as f:
                    texto = f.read()
                n = texto.count(viejo)
                if not n:
                    continue
                total_archivos += 1
                total_cambios += n
                if aplicar:
                    with open(ruta, "w", encoding="utf-8") as f:
                        f.write(texto.replace(viejo, nuevo))
                print(f"{'✔' if aplicar else '·'} {os.path.relpath(ruta, raiz)}: {n}")
    print(f"{'Arreglados' if aplicar else 'Por arreglar'}: {total_archivos} archivos, {total_cambios} rutas", file=sys.stderr)
    return total_archivos, total_cambios


def main(argv=None):
    p = argparse.ArgumentParser(description="Arregla las rutas /t/ de las páginas Kids.")
    p.add_argument("--raiz", default=".")
    p.add_argument("--aplicar", action="store_true")
    a = p.parse_args(argv)
    arreglar(a.raiz, a.aplicar)
    return 0


if __name__ == "__main__":
    sys.exit(main())
