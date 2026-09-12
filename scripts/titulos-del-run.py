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
for t in vistos:
    print(t)
