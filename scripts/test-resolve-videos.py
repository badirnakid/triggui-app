#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test-resolve-videos.py — SHIM de resolve-videos v2 (sin red, sin llaves).
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
rv.time.sleep = lambda *_a, **_k: None

HOY = datetime.date(2026, 8, 22)
PROMPT = "# Selección de video · Armonía con la edición\n\nPrueba."
ESQUEMA = {"name": "video_armonia", "strict": True, "schema": {"type": "object", "properties": {}}}


def item(vid, titulo, desc="", canal="Canal"):
    return {"id": {"kind": "youtube#video", "videoId": vid},
            "snippet": {"title": titulo, "description": desc, "channelTitle": canal}}


def det(vid, iso, vistas, desc=None, tags=None, lang="", caption=False, title=None):
    return {"id": vid, "contentDetails": {"duration": iso, "caption": "true" if caption else "false"},
            "statistics": {"viewCount": str(vistas)},
            "snippet": {"title": title, "description": desc or "", "tags": tags or [], "defaultAudioLanguage": lang, "channelTitle": None}}


# 8 resultados para "Ganbatte! Albert Liebermann entrevista"
SEARCH = {"items": [
    item("AAAAAAAAAA1", "Entrevista a Albert Liebermann sobre Ganbatte", "charla completa"),     # base 9
    item("AAAAAAAAAA2", "Liebermann: conferencia en Madrid", ""),                                # base 10
    item("AAAAAAAAAA3", "Ganbatte! resumen animado", ""),                                        # base 4
    item("AAAAAAAAAA4", "Entrevista motivacional con alguien más", "larga"),                     # sin ancla
    item("AAAAAAAAAA5", "Liebermann short", ""),                                                 # 1
    item("AAAAAAAAAA6", "Liebermann explica Ganbatte en 1 minuto", ""),                          # 1
    item("bad id", "Liebermann entrevista (id inválido)", ""),
    item("AAAAAAAAAA8", "Albert Liebermann interview " + "x" * 200, "", "Canal " + "y" * 100),   # base 9
]}
DETS = {"items": [
    det("AAAAAAAAAA1", "PT45M10S", 1200, desc="Descripción &quot;completa&quot; de la charla " + "d" * 900, tags=["ganbatte", "liebermann"], lang="es"),
    det("AAAAAAAAAA2", "PT1H10M", 120000, lang="es"),
    det("AAAAAAAAAA3", "PT8M", 10, lang="es"),
    det("AAAAAAAAAA4", "PT30M", 999999),
    det("AAAAAAAAAA5", "PT1M", 5),
    det("AAAAAAAAAA6", "PT2M59S", 5),
    det("AAAAAAAAAA8", "PT20M", 7000, lang="pt", caption=False),
]}


class ApiFalsa:
    def __init__(self, fatal_en=None, error_en=None):
        self.calls = []; self.fatal_en = fatal_en; self.error_en = error_en; self.searches = 0

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
            assert "bad" not in url and "part=snippet,contentDetails,statistics" in url
            return json.loads(json.dumps(DETS))
        raise AssertionError("URL inesperada " + url)


class JuezFalso:
    """Devuelve veredictos por id. armonias: dict id→(armonia, rol, idioma, descartar, tipo)."""
    def __init__(self, armonias=None, fatal=False, error=False, omitir=None):
        self.llamadas = []; self.armonias = armonias or {}; self.fatal = fatal; self.error = error; self.omitir = omitir

    def __call__(self, prompt, esquema, user_json, key):
        self.llamadas.append(json.loads(user_json))
        if self.fatal:
            raise rv.LlmFatal("OpenAI HTTP 401 invalid_api_key")
        if self.error:
            raise Exception("OpenAI HTTP 500")
        pedido = json.loads(user_json)
        ver = []
        for cnd in pedido["candidatos"]:
            if cnd["id"] == self.omitir:
                continue
            a, rol, idioma, desc, tipo = self.armonias.get(cnd["id"], (7, "profundizar", "es", False, "tercero_habla"))
            ver.append({"id": cnd["id"], "armonia": a, "rol": rol, "tipo": tipo, "relacion": "invita", "idioma": idioma,
                        "frase_eco": pedido["edicion"]["frases"][0] if pedido["edicion"]["frases"] else "",
                        "pie": "Pie de prueba para %s: eco con el libro. " % cnd["id"] + "palabra " * 40, "descartar": desc, "motivo_descarte": "ajeno" if desc else ""})
        return {"veredictos": ver, "sinfonia": "Terna: abrir con la charla, profundizar con la conferencia, aterrizar con el resumen."}


def libro(titulo, autor, ed=None, idioma="es", video=None, **extra):
    b = {"titulo": titulo, "autor": autor, "titulo_es": titulo, "titulo_en": titulo, "idioma_original": idioma,
         "frases": ["🔭 Observa tu entorno.", "📻 ¿Escuchas?"], "colores": ["#111111", "#222222"],
         "_nucleus": {"og_phrases_es": [{"phrase": "🕊 Frase aterrizar.", "rol_sinfonico": "aterrizar", "eje_animo": 0.6, "pilar": "negocios"}],
                      "edition_blocks_es": [{"gesture_type": "instruccion_sensorial", "sensory_anchor": "vista", "phrase": "🔭 Observa tu entorno.", "rol_sinfonico": "aterrizar", "eje_animo": 0.4}],
                      "book_grounding_anchors": {"authorial_voice_notes": "Voz directa.", "concepts": ["c1"], "key_terms": ["k1"]},
                      "card_es": {"titulo": "Título editorial"}, "emotional_words_es": ["calma"]},
         "_animo_promedio": 0.5}
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
        self.dir = tempfile.mkdtemp(prefix="rv2-"); self.cwd = os.getcwd(); os.chdir(self.dir)
        self.api_real, self.llm_real, self.raw_real = rv.api, rv.llm, rv._leer_raw
        rv._PROMPT_CACHE.clear()
        # prompt local como en CI: ./triggui-content/prompts/...
        os.makedirs("triggui-content/prompts/tasks"); os.makedirs("triggui-content/prompts/schemas")
        open("triggui-content/" + rv.RUTA_PROMPT, "w", encoding="utf-8").write(PROMPT)
        open("triggui-content/" + rv.RUTA_SCHEMA, "w", encoding="utf-8").write(json.dumps(ESQUEMA))
        rv._leer_raw = lambda rel: (_ for _ in ()).throw(AssertionError("no debe ir a raw GitHub en pruebas"))

    def tearDown(self):
        rv.api, rv.llm, rv._leer_raw = self.api_real, self.llm_real, self.raw_real
        rv._PROMPT_CACHE.clear(); os.chdir(self.cwd); shutil.rmtree(self.dir, ignore_errors=True)

    def escribe(self, nombre, libros):
        raw = js_stringify_like({"libros": libros, "meta": {"next_edition_number": 94}})
        open(nombre, "wb").write(raw); return raw

    def lee(self, nombre):
        return open(nombre, "rb").read()

    def corre(self, argv, fake=None, juez=None, key="K", openai="O"):
        rv.api = fake or ApiFalsa(); rv.llm = juez or JuezFalso()
        os.environ["YT_API_KEY"] = key
        if openai:
            os.environ["OPENAI_KEY"] = openai
        else:
            os.environ.pop("OPENAI_KEY", None); os.environ.pop("OPENAI_API_KEY", None)
        orig = rv.procesa
        rv.procesa = lambda ruta, c, cache, st, hoy=None: orig(ruta, c, cache, st, hoy=HOY)
        try:
            return rv.main(argv)
        finally:
            rv.procesa = orig; os.environ.pop("YT_API_KEY", None); os.environ.pop("OPENAI_KEY", None)


class T01Capa1(Base):
    def test_dur_y_veto(self):
        self.assertEqual(rv.dur("PT1H2M3S"), 3723); self.assertEqual(rv.dur(None), 0)
        p, d, anc = rv.puntua(item("X", "Entrevista motivacional con alguien más"), det("X", "PT30M", 999999), "Albert Liebermann", "Ganbatte!")
        self.assertEqual((p, anc), (6, False))

    def test_candidatos_base(self):
        rv.api = ApiFalsa()
        base = rv.capa1(libro("Ganbatte!", "Albert Liebermann", 85), "K")
        self.assertEqual([x["id"] for x in base], ["AAAAAAAAAA1", "AAAAAAAAAA2", "AAAAAAAAAA3", "AAAAAAAAAA8"])  # anclados y ≥4, orden YouTube
        self.assertEqual([x["_base"] for x in base], [9, 10, 4, 9])
        x = base[0]
        self.assertIn('"completa"', x["_descripcion"]); self.assertEqual(len(x["_descripcion"]), 700)   # unescape + tope
        self.assertEqual(x["_etiquetas"], ["ganbatte", "liebermann"]); self.assertEqual(x["_idioma_audio"], "es")
        self.assertFalse(x["_subtitulos"]); self.assertEqual(x["_vistas"], 1200)
        self.assertEqual(len(base[3]["titulo"]), 90); self.assertEqual(len(base[3]["canal"]), 60)


class T02Armonia(Base):
    def test_payload_edicion(self):
        e = rv.edicion_payload(libro("Ganbatte!", "Albert Liebermann", 85))
        self.assertEqual(e["hallazgo"], "🕊 Frase aterrizar."); self.assertEqual(e["movimiento"], "🔭 Observa tu entorno."); self.assertEqual(e["impacto"], "vista")
        self.assertEqual(e["voz_del_autor"], "Voz directa."); self.assertEqual(e["frases_con_rol"][0]["rol"], "aterrizar"); self.assertEqual(e["animo_promedio"], 0.5)

    def test_terna_roles_distintos_y_piso(self):
        juez = JuezFalso({"AAAAAAAAAA1": (9, "abrir", "es", False, "autor_habla"), "AAAAAAAAAA2": (8, "abrir", "es", False, "autor_habla"),
                          "AAAAAAAAAA3": (5, "aterrizar", "es", False, "resumen"), "AAAAAAAAAA8": (2, "profundizar", "es", False, "otro")})
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        self.assertEqual(self.corre(["--solo-ediciones"], juez=juez), 0)
        v = json.loads(self.lee("contenido.json"))["libros"][0]["_video"]
        self.assertEqual(v["juez"], "gpt-4o-mini"); self.assertTrue(v["sinfonia"].startswith("Terna:"))
        self.assertEqual([(x["id"], x["armonia"], x["rol"]) for x in v["candidatos"]],
                         [("AAAAAAAAAA1", 9, "abrir"), ("AAAAAAAAAA3", 5, "aterrizar"), ("AAAAAAAAAA2", 8, "abrir")])  # rol distinto antes que armonía; 8 (♪2) fuera por piso
        self.assertEqual(set(v["candidatos"][0].keys()), {"id", "titulo", "canal", "dur", "armonia", "rol", "tipo", "relacion", "idioma", "frase_eco", "pie"})
        self.assertLessEqual(len(v["candidatos"][0]["pie"]), 141); self.assertTrue(v["candidatos"][0]["pie"].endswith("…"))
        self.assertEqual(v["candidatos"][0]["frase_eco"], "🔭 Observa tu entorno.")
        self.assertEqual(len(juez.llamadas), 1); self.assertEqual([c["id"] for c in juez.llamadas[0]["candidatos"]], ["AAAAAAAAAA1", "AAAAAAAAAA2", "AAAAAAAAAA3", "AAAAAAAAAA8"])

    def test_descarte_e_idioma_sin_subtitulos(self):
        juez = JuezFalso({"AAAAAAAAAA1": (9, "abrir", "es", True, "otro"),            # descartado por el juez
                          "AAAAAAAAAA8": (9, "resonar", "otro", False, "otro")})      # idioma otro + sin subtítulos → fuera
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        self.assertEqual(self.corre(["--solo-ediciones"], juez=juez), 0)
        ids = [x["id"] for x in json.loads(self.lee("contenido.json"))["libros"][0]["_video"]["candidatos"]]
        self.assertEqual(ids, ["AAAAAAAAAA2", "AAAAAAAAAA3"])

    def test_sin_llave_openai_capa1(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        juez = JuezFalso()
        self.assertEqual(self.corre(["--solo-ediciones"], juez=juez, openai=""), 0)
        v = json.loads(self.lee("contenido.json"))["libros"][0]["_video"]
        self.assertEqual(v["juez"], "capa1"); self.assertEqual(juez.llamadas, [])
        self.assertEqual([x["id"] for x in v["candidatos"]], ["AAAAAAAAAA1", "AAAAAAAAAA2", "AAAAAAAAAA3"])
        self.assertEqual(set(v["candidatos"][0].keys()), {"id", "titulo", "canal", "dur"})

    def test_juez_fatal_apaga_capa2_y_sigue(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85), libro("Ikigai", "Albert Liebermann", 70)])
        juez = JuezFalso(fatal=True)
        self.assertEqual(self.corre(["--solo-ediciones"], juez=juez), 0)
        L = json.loads(self.lee("contenido.json"))["libros"]
        self.assertEqual([b["_video"]["juez"] for b in L], ["capa1", "capa1"]); self.assertEqual(len(juez.llamadas), 1)   # no insiste

    def test_juez_omite_un_video_tolerante(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        juez = JuezFalso({"AAAAAAAAAA1": (9, "abrir", "es", False, "autor_habla"), "AAAAAAAAAA2": (8, "profundizar", "es", False, "autor_habla"), "AAAAAAAAAA8": (7, "resonar", "es", False, "otro")}, omitir="AAAAAAAAAA3")
        self.assertEqual(self.corre(["--solo-ediciones"], juez=juez), 0)
        v = json.loads(self.lee("contenido.json"))["libros"][0]["_video"]
        self.assertEqual(v["juez"], "gpt-4o-mini"); self.assertEqual([x["id"] for x in v["candidatos"]], ["AAAAAAAAAA1", "AAAAAAAAAA2", "AAAAAAAAAA8"])  # el omitido queda fuera, el resto sigue

    def test_juez_error_solo_ese_libro(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85), libro("Ikigai", "Albert Liebermann", 70)])
        class JuezRoto(JuezFalso):
            n = 0
            def __call__(self, *a):
                self.n += 1
                if self.n == 1:
                    raise Exception("OpenAI HTTP 500")
                return JuezFalso.__call__(self, *a)
        juez = JuezRoto()
        self.assertEqual(self.corre(["--solo-ediciones"], juez=juez), 0)
        L = json.loads(self.lee("contenido.json"))["libros"]
        self.assertEqual([b["_video"]["juez"] for b in L], ["capa1", "gpt-4o-mini"]); self.assertEqual(juez.n, 2)

    def test_filtro_solo(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85), libro("Ikigai", "Albert Liebermann", 70), libro("Grit", "Angela Duckworth", 60, video={"resuelto_el": "2026-08-22", "candidatos": [{"id": "AAAAAAAAAA1"}]})])
        fake = ApiFalsa()
        self.assertEqual(self.corre(["--solo-ediciones", "--rehacer", "--solo=IKIGAI, grit"], fake), 0)
        L = json.loads(self.lee("contenido.json"))["libros"]
        self.assertEqual(["_video" in b for b in L], [False, True, True]); self.assertEqual(fake.searches, 2)
        self.assertEqual(rv.config(["--solo=El Gran Nervio, Élan"])["solo"], ["el gran nervio", "elan"])

    def test_prompt_desde_cwd_content(self):
        os.rename("triggui-content/prompts", "prompts"); shutil.rmtree("triggui-content")
        self.assertEqual(rv.cargar_prompt()[2], ".")

    def test_sin_prompt_apaga_capa2(self):
        shutil.rmtree("triggui-content")
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        self.assertEqual(self.corre(["--solo-ediciones"]), 0)
        self.assertEqual(json.loads(self.lee("contenido.json"))["libros"][0]["_video"]["juez"], "capa1")


class T03Idempotencia(Base):
    def test_reglas_y_rehacer(self):
        c = rv.config(["--solo-ediciones"]); ok = lambda b: rv.elegible(b, c, HOY)[0]
        self.assertFalse(ok(libro("A", "B", 1, video={"resuelto_el": "2026-08-01", "candidatos": [{"id": "x"}]})))
        self.assertFalse(ok(libro("A", "B", 1, video={"resuelto_el": "2026-08-22", "candidatos": []})))
        self.assertTrue(ok(libro("A", "B", 1, video={"resuelto_el": "2026-07-22", "candidatos": []})))
        self.assertTrue(ok(libro("A", "B", 1)))
        c2 = rv.config(["--solo-ediciones", "--rehacer"])
        self.assertTrue(rv.elegible(libro("A", "B", 1, video={"resuelto_el": "2026-08-22", "candidatos": [{"id": "x"}]}), c2, HOY)[0])

    def test_segunda_corrida_no_gasta_y_rehacer_si(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        self.assertEqual(self.corre(["--solo-ediciones"]), 0)
        fake = ApiFalsa(); self.assertEqual(self.corre(["--solo-ediciones"], fake), 0); self.assertEqual(fake.calls, [])
        fake = ApiFalsa(); self.assertEqual(self.corre(["--solo-ediciones", "--rehacer"], fake), 0); self.assertEqual(fake.searches, 1)


class T04CacheFormatoAtomico(Base):
    def test_un_gasto_dos_archivos_y_formato(self):
        o1 = self.escribe("contenido.json", [libro("Otro", "Autor X"), libro("Ganbatte!", "Albert Liebermann", 85, raro="ñ á 🌒 — “comillas”")])
        o2 = self.escribe("contenido_manual.json", [libro("Ganbatte!", "Albert Liebermann", 85, raro="ñ á 🌒 — “comillas”")])
        fake = ApiFalsa(); juez = JuezFalso()
        self.assertEqual(self.corre(["--solo-ediciones"], fake, juez), 0)
        self.assertEqual(fake.searches, 1); self.assertEqual(len(juez.llamadas), 1)
        a = json.loads(self.lee("contenido.json")); b = json.loads(self.lee("contenido_manual.json"))
        self.assertEqual(a["libros"][1]["_video"], b["libros"][0]["_video"]); self.assertNotIn("_video", a["libros"][0])
        for d, o, f in ((a, o1, "contenido.json"), (b, o2, "contenido_manual.json")):
            for x in d["libros"]:
                x.pop("_video", None)
            self.assertEqual(js_stringify_like(d), o)
            self.assertFalse(self.lee(f).endswith(b"\n"))
        self.assertEqual([f for f in os.listdir(".") if ".tmp-" in f], [])

    def test_sin_cambios_no_reescribe(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85, video={"resuelto_el": "2026-08-22", "candidatos": [{"id": "AAAAAAAAAA1"}]})])
        md5 = hashlib.md5(self.lee("contenido.json")).hexdigest(); os.utime("contenido.json", (1000000000, 1000000000))
        self.assertEqual(self.corre(["--solo-ediciones"]), 0)
        self.assertEqual(hashlib.md5(self.lee("contenido.json")).hexdigest(), md5); self.assertEqual(int(os.stat("contenido.json").st_mtime), 1000000000)


class T05Filtros(Base):
    def test_dry_run(self):
        o1 = self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85)])
        fake = ApiFalsa(); juez = JuezFalso()
        self.assertEqual(self.corre(["--solo-ediciones", "--dry-run"], fake, juez, key=""), 0)
        self.assertEqual(fake.calls, []); self.assertEqual(juez.llamadas, []); self.assertEqual(self.lee("contenido.json"), o1)

    def test_youtube_fatal_guarda_lo_resuelto(self):
        self.escribe("contenido.json", [libro("Ganbatte!", "Albert Liebermann", 85), libro("Grit", "Angela Duckworth", 70), libro("Ok", "X Y", 71)])
        fake = ApiFalsa(fatal_en=2)
        self.assertEqual(self.corre(["--solo-ediciones"], fake), 0)
        L = json.loads(self.lee("contenido.json"))["libros"]
        self.assertEqual(["_video" in b for b in L], [True, False, False]); self.assertEqual(fake.searches, 2)

    def test_solo_ediciones_max_sin_llave(self):
        self.escribe("contenido.json", [libro("Sin ed", "A"), libro("Bool", "B", True), libro("Float", "C", 2.0), libro("Ganbatte!", "Albert Liebermann", 85)])
        fake = ApiFalsa(); self.assertEqual(self.corre(["--solo-ediciones", "--max=1"], fake), 0)
        self.assertEqual([("_video" in b) for b in json.loads(self.lee("contenido.json"))["libros"]], [False, False, True, False]); self.assertEqual(fake.searches, 1)
        self.assertEqual(self.corre(["--solo-ediciones"], key=""), 2)

    def test_config(self):
        c = rv.config(["--solo-ediciones", "--max=2", "--reintentar-dias=7", "--rutas=a.json,b.json", "--rehacer", "--sin-armonia", "--armonia-min=5", "--explicar", "--dry-run"])
        self.assertEqual((c["solo_ed"], c["max"], c["reintentar"], c["rutas"], c["rehacer"], c["sin_armonia"], c["armonia_min"], c["explicar"], c["dry"]),
                         (True, 2, 7, ["a.json", "b.json"], True, True, 5, True, True))

    def test_pie(self):
        self.assertEqual(rv._pie("  dos   espacios "), "dos espacios")
        largo = rv._pie("palabra " * 40); self.assertLessEqual(len(largo), 141); self.assertTrue(largo.endswith("…"))


if __name__ == "__main__":
    suite = unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
    res = unittest.TextTestRunner(verbosity=1).run(suite)
    total = res.testsRun; ok = total - len(res.failures) - len(res.errors)
    print("══ resolve-videos v2 SHIM: %d/%d pruebas OK" % (ok, total))
    sys.exit(0 if ok == total else 1)
