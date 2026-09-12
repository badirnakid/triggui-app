#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🖼️ Detector de portadas placeholder — por PÍXELES, no por huella.
Un placeholder ("image not available", cualquier variante/tamaño/formato) no tiene ni un pixel oscuro
ni saturado: su percentil 1 de luminancia es ≥ ~184. Cualquier portada real, incluso una blanca
minimalista, tiene texto negro o color (percentil 1 ≤ ~47). Margen: >130 niveles.

Uso:  python3 es_placeholder.py <ruta|-> → imprime 1 (placeholder) o 0 (portada) · exit 0 siempre.
      Sin Pillow o con imagen ilegible → 0 (jamás bloquea).
"""
import sys, io
def es_placeholder(datos):
    try:
        from PIL import Image
        im = Image.open(io.BytesIO(datos)).convert("RGB")
        im.thumbnail((128, 192))
        px = list(im.getdata())
        n = len(px)
        if n < 50:
            return 0
        lum = sorted(int(0.299 * r + 0.587 * g + 0.114 * b) for r, g, b in px)
        p1 = lum[n // 100]
        oscuros = sum(1 for l in lum if l < 110) / n
        saturados = sum(1 for r, g, b in px if max(r, g, b) - min(r, g, b) > 40) / n
        # placeholder: nada oscuro (p1 alto) y, además, casi nada oscuro ni saturado
        return 1 if (p1 >= 150 and oscuros < 0.005 and saturados < 0.02) else 0
    except Exception:
        return 0
if __name__ == "__main__":
    ruta = sys.argv[1] if len(sys.argv) > 1 else "-"
    datos = sys.stdin.buffer.read() if ruta == "-" else open(ruta, "rb").read()
    print(es_placeholder(datos)); sys.exit(0)
