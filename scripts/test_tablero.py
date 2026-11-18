#!/usr/bin/env python3
"""Pruebas del tablero de la curaduría (scripts/tablero.py, C492), sin red.

Correr:  python3 -I -B scripts/test_tablero.py
"""
import datetime
import importlib.util
import io
import json
import os
import shutil
import tempfile
import unittest
from contextlib import redirect_stdout

AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("tablero", os.path.join(AQUI, "tablero.py"))
ta = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ta)
cu = ta.cu


def libro(linea, decision, **datos):
    return dict({"linea": linea, "decision": decision}, **datos)


class Tablero(unittest.TestCase):
    def setUp(self):
        self.app = tempfile.mkdtemp()
        os.makedirs(os.path.join(self.app, "curaduria"))

    def tearDown(self):
        shutil.rmtree(self.app)

    def escribir(self, entradas, extra=""):
        with open(os.path.join(self.app, cu.DECISIONES), "w", encoding="utf-8") as f:
            f.write("".join(json.dumps(e, ensure_ascii=False) + "\n" for e in entradas) + extra)

    def variables(self, lista):
        with open(os.path.join(self.app, cu.VARIABLES), "w", encoding="utf-8") as f:
            json.dump({"variables": lista}, f)

    def test_la_aprobacion_lo_quitado_y_lo_delicado(self):
        self.escribir([
            {"pr": 1, "lista": "adultos", "cerrada": "2026-11-20", "resultado": "merge", "costo_usd": 1.1,
             "libros": [libro("A | a", "entró"), libro("B | b", "quitado"), libro("C | c", "entró"), libro("D | d", "fuera")],
             "comentarios": ["Quité B:\n por técnico."]},
            {"pr": 2, "lista": "kids", "cerrada": "2026-11-17", "resultado": "merge", "costo_usd": 0.45,
             "libros": [libro("K1 | k", "entró"), libro("Mafalda | Quino", "quitado")]},
            {"pr": 3, "lista": "kids", "cerrada": "2026-11-25", "resultado": "cerrada sin merge",
             "libros": [libro("K2 | k", "no entró")]},
            {"pr": 4, "lista": "adultos", "cerrada": "2026-10-30", "resultado": "merge", "libros": [libro("Viejo | v", "entró")]},
        ], extra="{rota\n")
        t = ta.tablero(self.app, "2026-11", datetime.date(2026, 12, 4))
        self.assertIn("## 🧭 Tablero de la curaduría · noviembre de 2026", t)
        self.assertIn("| Propuestas cerradas | 1 | 2 |", t)
        self.assertIn("| Libros propuestos | 4 | 3 |", t)
        self.assertIn("| Entraron | 2 | 1 |", t)
        self.assertIn("| Fuera (sin casilla) | 1 | 0 |", t)
        self.assertIn("| Propuestas cerradas sin Merge | 0 | 1 |", t)
        self.assertIn("| **Aprobación** (meta: 90 % o más) | **50 %** | **33 %** |", t)
        self.assertIn("- Adultos · propuesta #1 · «B | b»", t)
        self.assertIn("  - Tu comentario en la #1: «Quité B: por técnico.»", t)
        self.assertIn("revisar contigo 1 libro Kids quitado («Mafalda | Quino»)", t)
        self.assertIn("2 propuestas traen su costo: unos 1.55 USD.", t)
        self.assertIn("1 línea rota", t)
        self.assertNotIn("Viejo", t)   # es de octubre
        self.assertNotIn("—", t)

    def test_la_escalera(self):
        entradas = [{"pr": n, "lista": "adultos", "cerrada": (datetime.date(2026, 10, 1) + datetime.timedelta(weeks=n)).isoformat(),
                     "resultado": "merge", "libros": [libro(f"L{n} | x", "entró")] * 9 + [libro(f"Q{n} | x", "quitado")]}
                    for n in range(10)]
        self.escribir(entradas)
        hoy = datetime.date(2026, 12, 11)
        e = ta.escalera(ta.leer_decisiones(self.app)[0], hoy)
        self.assertEqual(e["adultos"][0], 10)        # del 1 de octubre al 11 de diciembre
        self.assertAlmostEqual(e["adultos"][1], 0.9)
        self.assertTrue(e["adultos"][2])
        self.assertEqual(e["kids"], (0, None, False))
        t = ta.tablero(self.app, "2026-12", hoy)
        self.assertIn("- **Adultos:** se puede pedir el escalón 1", t)
        self.assertIn("- **Kids:** escalón 0: 0 semanas de historia (pide 8) y sin datos de aprobación", t)
        corta = ta.escalera(ta.leer_decisiones(self.app)[0], datetime.date(2026, 11, 1))
        self.assertFalse(corta["adultos"][2])        # 4 semanas de historia

    def test_las_variables_a_prueba(self):
        self.variables([{"id": "breve", "nombre": "Lectura breve", "estado": "a prueba", "que_mide": "x"}])
        self.escribir([{"pr": 1, "lista": "adultos", "cerrada": "2026-11-20", "resultado": "merge", "libros": [
            libro("A | a", "entró", variables={"breve": 0.8}), libro("B | b", "entró", variables={"breve": 0.6}),
            libro("C | c", "quitado", variables={"breve": 0.2}), libro("D | d", "entró", variables={"breve": None}), "roto"]}])
        t = ta.tablero(self.app, "2026-11", datetime.date(2026, 11, 30))
        self.assertIn("| Lectura breve | a prueba | 0.70 | 0.20 | 3 |", t)

    def test_sin_nada(self):
        t = ta.tablero(self.app, "2026-11", datetime.date(2026, 11, 30))
        self.assertIn("| **Aprobación** (meta: 90 % o más) | **sin datos** | **sin datos** |", t)
        self.assertIn("Nada: entró todo lo que se propuso con palomita.", t)
        self.assertIn("Ninguna a prueba todavía", t)
        self.assertIn("Ninguna propuesta del mes trae su costo", t)

    def test_la_linea_de_ordenes(self):
        salida = io.StringIO()
        with redirect_stdout(salida):
            self.assertEqual(ta.main(["--app", self.app, "--mes", "2026-11", "--hoy", "2026-12-04"]), 0)
        self.assertIn("noviembre de 2026", salida.getvalue())
        self.assertEqual(ta.main(["--app", self.app, "--mes", "2026-13"]), 2)


if __name__ == "__main__":
    unittest.main(verbosity=1)
