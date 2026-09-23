#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Imprime los títulos (uno por línea) de los libros de ESTE run: /tmp/triggui-batch.jsonl (lote) o /tmp/triggui-book.json (uno)."""
import json, os
vistos = []
for ruta in ("/tmp/triggui-batch.jsonl", "/tmp/triggui-book.json"):
    if not os.path.exists(ruta):
        continue
    for linea in open(ruta, "r", encoding="utf-8").read().splitlines():
        linea = linea.strip()
        if not linea:
            continue
        try:
            t = json.loads(linea).get("titulo", "")
        except Exception:
            continue
        if t and t not in vistos:
            vistos.append(t)
# 🪪 Antes del paso de edición el manifiesto aún no existe (se escribe después), pero validate-book ya dejó
# /tmp/triggui-slug.txt: con él se identifica el libro de ESTE run en el catálogo del workspace.
if not vistos and os.path.exists("/tmp/triggui-slug.txt"):
    slug = open("/tmp/triggui-slug.txt", "r", encoding="utf-8").read().strip()
    for cat in ("contenido_kids.json" if os.environ.get("CATALOG_MODE") == "kids" else "contenido.json", "contenido_manual.json"):
        if not slug or not os.path.exists(cat):
            continue
        try:
            libros = json.load(open(cat, "r", encoding="utf-8")).get("libros") or []
        except Exception:
            continue
        hit = next((b for b in libros if isinstance(b, dict) and b.get("_slug") == slug and b.get("titulo")), None)
        if hit:
            vistos.append(hit["titulo"])
            break
for t in vistos:
    print(t)
