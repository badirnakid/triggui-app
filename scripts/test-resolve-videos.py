#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test-resolve-videos.py — SHIM del resolver (sin red, sin llave).
Uso: python3 scripts/test-resolve-videos.py   (desde la raíz de triggui-app)
"""
import datetime
import hashlib
import importlib.util
import json
import os
import shutil
import sys
import tempfile
import unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
SPEC = importlib.util.spec_from_file_location("rv", os.path.join(AQUI, "resolve-videos.py"))
rv = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(rv)
rv.time.sleep = lambda *_a, **_k: None  # sin esperas en pruebas

HOY = datetime.date(2026, 8, 21)


def item(vid, titulo, desc="", canal="Canal"):
    return {"id": {"kind": "youtube#video", "videoId": vid},
            "snippet": {"title": titulo, "description": desc, "channelTitle": canal}}


def det(vid, iso, vistas):
    return {"id": vid, "contentDetails": {"duration": iso}, "statistics": {"viewCount": str(vistas)}}


# 8 resultados para "Ganbatte! Albert Liebermann entrevista"
SEARCH = {"items": [
    item("AAAAAAAAAA1", "Entrevista a Albert Liebermann sobre Ganbatte", "charla completa"),          # ape+ent+dur = 4+3+2 = 9 (sin "!" no cuenta título)
    item("AAAAAAAAAA2", "Liebermann: conferencia en Madrid", ""),                                     # ape+conf+dur+vistas = 4+3+2+1 = 10
    item("AAAAAAAAAA3", "Ganbatte! resumen animado", ""),                                             # tit+dur = 2+2 = 4 (pasa justo)
    item("AAAAAAAAAA4", "Entrevista motivacional con alguien más", "larga"),                          # sin ancla: 3+2 = 5 → GATE lo saca
    item("AAAAAAAAAA5", "Liebermann short", ""),                                                      # ape pero <3min: 4-3 = 1 → no pasa
    item("AAAAAAAAAA6", "Liebermann explica Ganbatte en 1 minuto", ""),                               # ape pero short: 4-3 = 1 → no pasa
    item("bad id", "Liebermann entrevista (id inválido)", ""),                                        # id inválido → se descarta antes de pedir detalles
    item("AAAAAAAAAA8", "Albert Liebermann interview " + "x" * 200, "", "Canal " + "y" * 100),        # ape+int+dur = 9; trunca titulo[:90] canal[:60]
]}
DETS = {"items": [
    det("AAAAAAAAAA1", "PT45M10S", 1200),
    det("AAAAAAAAAA2", "PT1H10M", 120000),
    det("AAAAAAAAAA3", "PT8M", 10),
    det("AAAAAAAAAA4", "PT30M", 999999),
    det("AAAAAAAAAA5", "PT1M", 5),
    det("AAAAAAAAAA6", "PT2M59S", 5),
    det("AAAAAAAAAA8", "PT20M", 7000),
]}


class ApiFalsa:
    def __init__(self, fatal_en=None, error_en=None):
        self.calls = []
        self.fatal_en = fatal_en    # nº de search (1-based) que lanza ApiFatal
        self.error_en = error_en    # nº de search (1-based) que lanza Exception normal
        self.searches = 0

    def __call__(self, url):
        self.calls.append(url)
        if "/search?" in url:
            self.searches += 1
            if self.fatal_en == self.searches:
                raise rv.ApiFatal("HTTP 403 quotaExceeded")
            if self.error_en == self.searches:
                raise Exception("HTTP 500 backendError")
            assert "videoEmbeddable=true" in url and "type=video" in url and "maxResults=8" in url
            return json.loads(json.dumps(SEARCH))
        if "/videos?" in url:
            assert "bad" not in url, "no se deben pedir detalles de ids inválidos"
            return json.loads(json.dumps(DETS))
        raise AssertionError("URL inesperada " + url)


def libro(titulo, autor, ed=None, idioma="es", video=None, **extra):
    b = {"titulo": titulo, "autor": autor, "titulo_es": titulo, "titulo_en": titulo,
         "idioma_original": idioma, "frases": ["🔭 una", "🌓 dos"], "colores": ["#111111", "#222222"]}
    if ed is not None:
        b["_edicion_numero"] = ed
    if video is not None:
        b["_video"] = video
    b.update(extra)
    return b


def js_stringify_like(d):
    return json.dumps(d, ensure_ascii=False, indent=2).encode("utf-8")


class Base(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix="rv-")
        self.cwd = os.getcwd()
        os.chdir(self.dir)
        self.api_real = rv.api

    def tearDown(self):
        rv.api = self.api_real
        os.chdir(self.cwd)
        shutil.rmtree(self.dir, ignore_errors=True)

    def escribe(self, nombre, libros, meta=None):
        raw = js_stringify_like({"libros": libros, "meta": meta or {"next_edition_number": 94}})
        with open(nombre, "wb") as f:
            f.write(raw)
        return raw

    def lee(self, nombre):
        with open(nombre, "rb") as f:
            return f.read()

    def corre(self, argv, fake=None, key="K"):
        rv.api = fake or ApiFalsa()
        os.environ["YT_API_KEY"] = key
        # hoy fijo para reintentos
        orig = rv.procesa
        def procesa_fijo(ruta, c, cache, st, hoy=None):
            return orig(ruta, c, cache, st, hoy=HOY)
        rv.procesa = procesa_fijo
        try:
            return rv.main(argv)
        finally:
            rv.procesa = orig
            os.environ.pop("YT_API_KEY", None)


class T01Dur(unittest.TestCase):
    def test_dur(self):
        self.assertEqual(rv.dur("PT1H2M3S"), 3723)
        self.assertEqual(rv.dur("PT45S"), 45)
        self.assertEqual(rv.dur("PT8M"), 480)
        self.assertEqual(rv.dur(None), 0)
        self.assertEqual(rv.dur("P0D"), 0)


class T02Veto(unittest.TestCase):
    def test_gate_sin_ancla(self):
        it = item("X", "Entrevista motivacional con alguien más", "larga")
        p, d, anclado = rv.puntua(it, det("X", "PT30M", 999999), "Albert Liebermann", "Ganbatte!")
        self.assertEqual(p, 3 + 2 + 1)       # entrevista + duración + vistas
        self.assertFalse(anclado)            # … pero sin apellido ni título: no pasa

    def test_puntaje_canon(self):
        it = item("X", "Entrevista a Albert Liebermann sobre Ganbatte")
        p, d, anclado = rv.puntua(it, det("X", "PT45M10S", 1200), "Albert Liebermann", "Ganbatte!")
        self.assertEqual((p, d, anclado), (9, 2710, True))   # 4 ape + 3 entrevista + 2 dur; "ganbatte!" (con !) no está en el título
        it = item("X", "Liebermann short")
        p, d, _ = rv.puntua(it, det("X", "PT1M", 5), "Albert Liebermann", "Ganbatte!")
        self.assertEqual(p, 1)               # 4 - 3 (short)


class T03Resolver(Base):
    def test_ranking_campos_y_top3(self):
        fake = ApiFalsa()
        rv.api = fake
        top = rv.resolver(libro("Ganbatte!", "Albert Liebermann", 85), "K")
        self.assertEqual([x["id"] for x in top], ["AAAAAAAAAA2", "AAAAAAAAAA1", "AAAAAAAAAA8"])  # 10, 9, 9 (empate: orden de relevancia)
        self.assertEqual(len(fake.calls), 2)                      # 1 search + 1 videos.list
        self.assertNotIn("bad", fake.calls[1])                    # id inválido nunca se pide
        self.assertEqual(len(top[2]["titulo"]), 90)
        self.assertEqual(len(top[2]["canal"]), 60)
        self.assertEqual((top[0]["dur"], top[1]["dur"]), (4200, 2710))
        self.assertEqual(set(top[0].keys()), {"id", "titulo", "canal", "dur"})

    def test_query_por_idioma(self):
        q, lang = rv.query_de(libro("El obstáculo es el camino", "Ryan Holiday", idioma="en",
                                    titulo_en="The Obstacle Is the Way"))
        self.assertEqual((q, lang), ("The Obstacle Is the Way Ryan Holiday interview", "en"))
        q, lang = rv.query_de(libro("Ganbatte!", "Albert Liebermann", idioma="es"))
        self.assertEqual((q, lang), ("Ganbatte! Albert Liebermann entrevista", "es"))


class T04Idempotencia(Base):
    def test_reglas(self):
        c = rv.config(["--solo-ediciones"])
        ok = lambda b: rv.elegible(b, c, HOY)[0]
        self.assertFalse(ok(libro("A", "B", 1, video={"resuelto_el": "2026-08-01", "candidatos": [{"id": "x"}]})))
        self.assertFalse(ok(libro("A", "B", 1, video={"resuelto_el": "2026-08-21", "candidatos": []})))
        self.assertFalse(ok(libro("A", "B", 1, video={"resuelto_el": "2026-07-23", "candidatos": []})))  # 29 días
        self.assertTrue(ok(libro("A", "B", 1, video={"resuelto_el": "2026-07-22", "candidatos": []})))   # 30 días
        self.assertTrue(ok(libro("A", "B", 1, video={"resuelto_el": "basura", "candidatos": []})))
        self.assertTrue(ok(libro("A", "B", 1)))

    def test_segunda_corrida_no_gasta(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        self.assertEqual(self.corre(["--solo-ediciones"]), 0)
        fake = ApiFalsa()
        self.assertEqual(self.corre(["--solo-ediciones"], fake), 0)
        self.assertEqual(fake.calls, [])


class T05CacheEntreRutas(Base):
    def test_un_gasto_dos_archivos(self):
        self.escribe("contenido.json", [libro("Otro", "Autor X"), libro("Ganbatte!", "Albert Liebermann", 85)])
        self.escribe("contenido_manual.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        fake = ApiFalsa()
        self.assertEqual(self.corre(["--solo-ediciones"], fake), 0)
        self.assertEqual(fake.searches, 1)
        a = json.loads(self.lee("contenido.json"))["libros"][1]["_video"]
        b = json.loads(self.lee("contenido_manual.json"))["libros"][0]["_video"]
        self.assertEqual(a, b)
        self.assertEqual(a["resuelto_el"], "2026-08-21")
        self.assertEqual(len(a["candidatos"]), 3)
        self.assertNotIn("_video", json.loads(self.lee("contenido.json"))["libros"][0])  # sin edición: intacto


class T06AtomicoYFormato(Base):
    def test_formato_preservado_y_sin_tmp(self):
        original = self.escribe("contenido_manual.json", [libro("Ganbatte!", "Albert Liebermann", 85, extra_unicode="ñ á 🌒 — “comillas”")])
        self.assertEqual(self.corre(["--solo-ediciones"]), 0)
        escrito = self.lee("contenido_manual.json")
        self.assertNotEqual(escrito, original)
        d = json.loads(escrito)
        for b in d["libros"]:
            b.pop("_video", None)
        self.assertEqual(js_stringify_like(d), original)           # quitar _video = bytes originales
        self.assertEqual([f for f in os.listdir(".") if ".tmp-" in f], [])
        self.assertFalse(escrito.endswith(b"\n"))                  # igual que JSON.stringify

    def test_sin_cambios_no_reescribe(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85, video={"resuelto_el": "2026-08-21", "candidatos": [{"id": "AAAAAAAAAA1"}]})])
        md5_antes = hashlib.md5(self.lee("contenido.json")).hexdigest()
        os.utime("contenido.json", (1000000000, 1000000000))
        self.assertEqual(self.corre(["--solo-ediciones"]), 0)
        self.assertEqual(hashlib.md5(self.lee("contenido.json")).hexdigest(), md5_antes)
        self.assertEqual(int(os.stat("contenido.json").st_mtime), 1000000000)


class T07DryRun(Base):
    def test_cero_api_cero_escritura(self):
        o1 = self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        o2 = self.escribe("contenido_manual.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        fake = ApiFalsa()
        self.assertEqual(self.corre(["--solo-ediciones", "--dry-run"], fake, key=""), 0)
        self.assertEqual(fake.calls, [])
        self.assertEqual(self.lee("contenido.json"), o1)
        self.assertEqual(self.lee("contenido_manual.json"), o2)


class T08Fatal(Base):
    def test_detiene_y_guarda_lo_resuelto(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85), libro("Grit", "Angela Duckworth", 70), libro("Ok", "X Y", 71)])
        fake = ApiFalsa(fatal_en=2)
        self.assertEqual(self.corre(["--solo-ediciones"], fake), 0)   # nunca rompe el tren
        libros = json.loads(self.lee("contenido.json"))["libros"]
        self.assertIn("_video", libros[0])
        self.assertNotIn("_video", libros[1])
        self.assertNotIn("_video", libros[2])
        self.assertEqual(fake.searches, 2)                              # no insiste tras el fatal

    def test_error_normal_solo_salta_ese_libro(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85), libro("Grit", "Angela Duckworth", 70)])
        fake = ApiFalsa(error_en=1)
        self.assertEqual(self.corre(["--solo-ediciones"], fake), 0)
        libros = json.loads(self.lee("contenido.json"))["libros"]
        self.assertNotIn("_video", libros[0])                           # se reintenta la próxima corrida
        self.assertIn("_video", libros[1])


class T09Filtros(Base):
    def test_solo_ediciones_y_max(self):
        self.escribe("contenido.json", [libro("Sin ed", "A"), libro("Bool", "B", True), libro("Float", "C", 2.0), libro("Ganbatte!", "Albert Liebermann", 85)])
        fake = ApiFalsa()
        self.assertEqual(self.corre(["--solo-ediciones", "--max=1"], fake), 0)
        libros = json.loads(self.lee("contenido.json"))["libros"]
        self.assertEqual([("_video" in b) for b in libros], [False, False, True, False])
        self.assertEqual(fake.searches, 1)

    def test_sin_llave(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        self.assertEqual(self.corre(["--solo-ediciones"], key=""), 2)
        self.assertNotIn("_video", json.loads(self.lee("contenido.json"))["libros"][0])

    def test_config(self):
        c = rv.config(["--solo-ediciones", "--max=2", "--reintentar-dias=7", "--rutas=a.json,b.json", "--dry-run"])
        self.assertEqual((c["solo_ed"], c["max"], c["reintentar"], c["rutas"], c["dry"]), (True, 2, 7, ["a.json", "b.json"], True))


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    res = unittest.TextTestRunner(verbosity=1).run(suite)
    total = res.testsRun
    ok = total - len(res.failures) - len(res.errors)
    print("══ resolve-videos SHIM: %d/%d pruebas OK" % (ok, total))
    sys.exit(0 if ok == total else 1)
