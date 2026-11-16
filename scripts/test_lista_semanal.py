#!/usr/bin/env python3
"""Pruebas de scripts/lista-semanal.py, de su uso en .github/workflows/triggui.yml y de las rutas Kids (C477, paso 1).

Correr:  python3 -I -B scripts/test_lista_semanal.py
"""
import importlib.util
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr
from unittest import mock

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
_spec = importlib.util.spec_from_file_location("lista_semanal", os.path.join(AQUI, "lista-semanal.py"))
ls = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ls)

COMENTARIOS = "# 🎬 lista\n# Ejemplo:\n# Un libro | Alguien\n\n"


def escribir(ruta, texto):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(texto)


def tiendas(no=(), desconocidos=()):
    """Un revisor de tiendas de mentira: «no» para los que se nombran, «?» para los desconocidos, «si» para el resto."""
    vistos = []

    def revisar(libro):
        vistos.append(libro)
        titulo = libro.split(" | ")[0]
        if titulo in no:
            return "no", "no está como libro físico ni en Casa del Libro ni en Gandhi"
        if titulo in desconocidos:
            return "?", "las tiendas no respondieron"
        return "si", "se consigue en Gandhi"
    revisar.vistos = vistos
    return revisar


class Fixture(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.app = os.path.join(self.tmp.name, "app")
        self.con = os.path.join(self.tmp.name, "triggui-content")
        os.makedirs(self.app)
        os.makedirs(os.path.join(self.con, "data"))
        escribir(os.path.join(self.app, "cola-lunes.txt"), COMENTARIOS)
        escribir(os.path.join(self.app, "lista-kids.txt"), COMENTARIOS + "Heidi | Johanna Spyri\nMatilda | Roald Dahl\nPippi | Astrid Lindgren\n")
        escribir(os.path.join(self.con, "contenido_kids.json"),
                 json.dumps([{"titulo": "El principito", "autor": "Saint-Exupéry", "_slug": "el-principito"}]))

    def tearDown(self):
        self.tmp.cleanup()

    def decidir(self, evento="schedule", cron=ls.CRON_KIDS, modo="", catalogo="", ref="refs/heads/main", revisar=None):
        return ls.decidir(evento, cron, modo, catalogo, self.app, ref=ref, revisar=revisar or tiendas())


class Lista(Fixture):
    def test_disparo_manual_normal_no_usa_la_lista(self):
        r = self.decidir(evento="workflow_dispatch", cron="", modo="📘 Un libro específico", catalogo="kids")
        self.assertEqual((r["hay"], r["libro"], r["catalogo"]), ("", "", ""))

    def test_kids_publica_el_primero_aprobado_que_se_consigue(self):
        r = self.decidir()
        self.assertEqual((r["hay"], r["libro"], r["catalogo"], r["origen"], r["saltados"]),
                         ("true", "Heidi | Johanna Spyri", "kids", "lista", ""))

    def test_salta_los_que_no_se_consiguen_y_los_deja_en_la_lista(self):
        rev = tiendas(no=("Heidi",))
        r = self.decidir(revisar=rev)
        self.assertEqual(r["libro"], "Matilda | Roald Dahl")
        self.assertIn("Heidi | Johanna Spyri", r["saltados"])
        self.assertEqual(rev.vistos, ["Heidi | Johanna Spyri", "Matilda | Roald Dahl"])

    def test_si_las_tiendas_no_responden_toma_el_aprobado(self):
        r = self.decidir(revisar=tiendas(desconocidos=("Heidi",)))
        self.assertEqual((r["hay"], r["libro"]), ("true", "Heidi | Johanna Spyri"))

    def test_si_ninguno_se_consigue_no_publica_nada(self):
        r = self.decidir(revisar=tiendas(no=("Heidi", "Matilda", "Pippi")))
        self.assertEqual((r["hay"], r["libro"], r["catalogo"]), ("", "", "kids"))
        self.assertEqual(r["saltados"].count("("), 3)
        self.assertIn("Ningún título", r["mensaje"])

    def test_la_lista_vacia_no_elige_nada_sola(self):
        escribir(os.path.join(self.app, "lista-kids.txt"), COMENTARIOS)
        escribir(os.path.join(self.con, "data", "libros_master_kids.csv"), "titulo,autor\nMatilda,Roald Dahl\n")
        r = self.decidir()
        self.assertEqual((r["hay"], r["libro"], r["catalogo"]), ("", "", "kids"))
        self.assertIn("vacía", r["mensaje"])

    def test_sin_archivo_de_lista_no_truena(self):
        os.remove(os.path.join(self.app, "lista-kids.txt"))
        self.assertEqual(self.decidir()["hay"], "")

    def test_adultos_usan_la_cola_del_director_con_la_misma_regla(self):
        self.assertEqual(self.decidir(cron=ls.CRON_ADULTOS)["hay"], "")
        escribir(os.path.join(self.app, "cola-lunes.txt"), COMENTARIOS + "Libro raro | Nadie\nEsencialismo | Greg McKeown\n")
        r = self.decidir(cron=ls.CRON_ADULTOS, revisar=tiendas(no=("Libro raro",)))
        self.assertEqual((r["hay"], r["libro"], r["catalogo"]), ("true", "Esencialismo | Greg McKeown", "adulto"))

    def test_un_cron_desconocido_es_de_adultos(self):
        self.assertEqual(self.decidir(cron="0 9 * * *")["catalogo"], "adulto")

    def test_el_modo_publicar_usa_el_catalogo_elegido_y_solo_desde_main(self):
        r = self.decidir(evento="workflow_dispatch", cron="", modo="🎬 Publicar ya el siguiente libro", catalogo="kids")
        self.assertEqual((r["libro"], r["catalogo"]), ("Heidi | Johanna Spyri", "kids"))
        r = self.decidir(evento="workflow_dispatch", cron="", modo="🎬 Publicar ya el siguiente libro", catalogo="kids", ref="refs/heads/otra")
        self.assertEqual((r["hay"], r["libro"]), ("", ""))
        self.assertIn("solo corre desde main", r["mensaje"])

    def test_una_linea_que_queda_vacia_no_tapa_las_siguientes(self):
        escribir(os.path.join(self.app, "lista-kids.txt"), COMENTARIOS + "$$\n``\n  Heidi  |  Johanna Spyri \n")
        self.assertEqual(self.decidir()["libro"], "Heidi | Johanna Spyri")

    def test_lee_la_lista_con_bom(self):
        with open(os.path.join(self.app, "lista-kids.txt"), "w", encoding="utf-8-sig") as f:
            f.write("Heidi | Johanna Spyri\n")
        self.assertEqual(self.decidir()["libro"], "Heidi | Johanna Spyri")

    def test_limpiar_quita_lo_que_rompe_el_shell_y_las_salidas(self):
        self.assertEqual(ls.limpiar('Uno "dos"\n$(rm -rf) `x` \\ tres'), "Uno dos (rm -rf) x tres")
        self.assertEqual(len(ls.limpiar("a" * 500)), ls.LARGO_MAXIMO)

    def test_main_escribe_cinco_salidas_y_el_resumen(self):
        resumen = os.path.join(self.tmp.name, "resumen.md")
        os.environ.update({"EVENTO": "schedule", "CRON": ls.CRON_KIDS, "MODO": "", "CATALOGO_MANUAL": "",
                           "REF": "refs/heads/main", "GITHUB_STEP_SUMMARY": resumen})
        try:
            salida, err = io.StringIO(), io.StringIO()
            with redirect_stdout(salida), redirect_stderr(err):
                ls.main(["--app", self.app, "--contenido", self.con, "--sin-tiendas"])
        finally:
            for k in ("EVENTO", "CRON", "MODO", "CATALOGO_MANUAL", "REF", "GITHUB_STEP_SUMMARY"):
                os.environ.pop(k, None)
        lineas = salida.getvalue().splitlines()
        self.assertEqual([l.split("=", 1)[0] for l in lineas], ["hay", "libro", "catalogo", "origen", "saltados"])
        self.assertEqual(lineas[1], "libro=Heidi | Johanna Spyri")
        with open(resumen, encoding="utf-8") as f:
            self.assertIn("Heidi", f.read())


class Tiendas(unittest.TestCase):
    """Cómo se lee la salida de tiendas-horno.mjs revisar."""

    def leer(self, codigo, salida):
        proc = subprocess.CompletedProcess(args=[], returncode=codigo, stdout=salida, stderr="")
        with mock.patch.object(ls.subprocess, "run", return_value=proc):
            return ls.revisar_con_horno("/x", "/x/tiendas.json")("Heidi | Johanna Spyri")

    def test_se_consigue(self):
        self.assertEqual(self.leer(0, "🛒 Se consigue en Gandhi: https://ejemplo/heidi"), ("si", "se consigue en Gandhi (https://ejemplo/heidi)"))
        self.assertEqual(self.leer(0, "🛒 Se consigue en Casa del Libro: https://casadelibro.com.mx/libro-x/9786070000000/1"),
                         ("si", "se consigue en Casa del Libro (https://casadelibro.com.mx/libro-x/9786070000000/1)"))
        self.assertEqual(self.leer(0, "listo"), ("si", "se consigue"))

    def test_no_se_consigue_con_su_motivo(self):
        estado, detalle = self.leer(3, "::error::«Heidi» no se consigue (está en el catálogo, pero agotado en las dos tiendas). No se genera nada.")
        self.assertEqual((estado, detalle), ("no", "está en el catálogo, pero agotado en las dos tiendas"))

    def test_las_tiendas_no_responden_es_desconocido(self):
        self.assertEqual(self.leer(3, "::error::«Heidi» no se consigue (no se pudo leer alguna de las tiendas). No se genera nada.")[0], "?")

    def test_otro_error_o_sin_node_es_desconocido(self):
        self.assertEqual(self.leer(1, "Error: algo")[0], "?")
        with mock.patch.object(ls.subprocess, "run", side_effect=OSError("sin node")):
            self.assertEqual(ls.revisar_con_horno("/x", "/t")("Heidi | J")[0], "?")
        with mock.patch.object(ls.subprocess, "run", side_effect=subprocess.TimeoutExpired("node", 1)):
            self.assertEqual(ls.revisar_con_horno("/x", "/t")("Heidi | J")[0], "?")


class Verificar(Fixture):
    def test_ya_entro_acepta_el_titulo_corto_o_el_largo(self):
        escribir(os.path.join(self.con, "contenido.json"),
                 json.dumps({"libros": [{"titulo": "12 reglas para vivir: Un antídoto al caos"}]}))
        self.assertTrue(ls.ya_entro("12 reglas para vivir | Jordan B. Peterson", "adulto", self.con))
        self.assertTrue(ls.ya_entro("12 Reglas para vivir: un antidoto al caos | J. B. Peterson", "adulto", self.con))
        self.assertTrue(ls.ya_entro("El principito | Antoine", "kids", self.con))
        self.assertFalse(ls.ya_entro("Reglas para vivir | Alguien", "adulto", self.con))
        self.assertFalse(ls.ya_entro("Matilda | Roald Dahl", "kids", self.con))
        self.assertFalse(ls.ya_entro("", "kids", self.con))
        self.assertFalse(ls.ya_entro("El | X", "kids", self.con))

    def test_ya_entro_con_slug_es_exacto(self):
        self.assertTrue(ls.ya_entro("Otro título | X", "kids", self.con, slug="el-principito"))
        self.assertFalse(ls.ya_entro("El principito | X", "kids", self.con, slug="otro-slug"))

    def test_verificar_sale_con_cero_o_uno(self):
        err = io.StringIO()
        with redirect_stderr(err):
            self.assertEqual(ls.main(["--verificar", "--catalogo", "kids", "--libro", "El Principito | A", "--contenido", self.con]), 0)
            self.assertEqual(ls.main(["--verificar", "--catalogo", "kids", "--libro", "Matilda | Roald Dahl", "--contenido", self.con]), 1)


class Workflow(unittest.TestCase):
    """El YAML usa la lista como espera el script, y el cron no se queda sin imágenes, sin proteger lo manual ni sin subir el catálogo."""

    @classmethod
    def setUpClass(cls):
        import yaml
        ruta = os.path.join(RAIZ, ".github", "workflows", "triggui.yml")
        with open(ruta, encoding="utf-8") as f:
            cls.texto = f.read()
        cls.yml = yaml.safe_load(cls.texto)
        cls.on = cls.yml.get("on") or cls.yml.get(True)
        i = cls.texto.index("\n  generar:\n")
        cls.generar = cls.texto[i:cls.texto.index("\n  reconstruir:\n")]

    def test_los_dos_cron_coinciden_con_el_script(self):
        crones = [c["cron"] for c in self.on["schedule"]]
        self.assertIn(ls.CRON_KIDS, crones)
        self.assertIn(ls.CRON_ADULTOS, crones)

    def test_el_boton_se_llama_publicar_y_ya_no_hornear_la_cola(self):
        opciones = self.on["workflow_dispatch"]["inputs"]["modo"]["options"]
        self.assertIn("🎬 Publicar ya el siguiente libro", opciones)
        self.assertNotIn("Hornear", self.texto)
        self.assertNotIn("needs.cola.", self.texto)

    def test_la_lista_entrega_sus_salidas_y_revisa_tiendas(self):
        job = self.yml["jobs"]["lista"]
        self.assertEqual(set(job["outputs"]), {"hay", "libro", "catalogo", "origen", "saltados"})
        nombres = [p.get("name", "") for p in job["steps"]]
        self.assertTrue(any("triggui-content" in n for n in nombres))
        self.assertTrue(any("Node" in n for n in nombres))
        leer = next(p for p in job["steps"] if p.get("id") == "leer")
        self.assertIn("scripts/lista-semanal.py", leer["run"])
        self.assertNotIn("--sin-tiendas", leer["run"])
        self.assertEqual(leer["env"]["REF"], "${{ github.ref }}")

    def test_generar_ya_no_mira_solo_inputs_catalogo(self):
        self.assertNotIn("inputs.catalogo == 'kids'", self.generar.replace("(inputs.catalogo || needs.lista.outputs.catalogo) == 'kids'", ""))
        self.assertNotIn("CATALOG_MODE: ${{ inputs.catalogo || 'adulto' }}", self.generar)

    def test_el_cron_genera_imagenes_protege_lo_manual_y_sube_el_catalogo(self):
        self.assertNotRegex(self.generar, r"if: \$\{\{ inputs\.generar_imagenes(\s*\}\}| &&)")
        self.assertIn("PRESERVE_MANUAL: ${{ (inputs.preservar_manuales || github.event_name == 'schedule') && 'true' || 'false' }}", self.generar)
        self.assertNotIn('if [ "${{ inputs.modo_prueba }}" = "false" ]', self.texto)
        self.assertIn('if [ "${{ inputs.modo_prueba }}" != "true" ]', self.generar)

    def test_el_libro_de_la_lista_entra_por_env(self):
        self.assertIn("LIBRO_DE_LA_LISTA: ${{ needs.lista.outputs.libro }}", self.texto)
        self.assertNotRegex(self.texto, r'LIBRO_FINAL="\$\{\{ needs\.')

    def test_la_puerta_de_tiendas_detiene_la_lista_salvo_si_las_tiendas_no_responden(self):
        paso = next(p for p in self.yml["jobs"]["generar"]["steps"] if p.get("name") == "🛒 ¿Se consigue el libro? (Casa del Libro o Gandhi)")
        self.assertEqual(paso["env"]["FORZAR"], "${{ inputs.forzar_sin_tienda && 'forzar_sin_tienda' || '' }}")
        self.assertIn("contains(inputs.modo, '🎬')", paso["env"]["ES_LISTA"])
        self.assertIn('grep -q "no se pudo leer alguna de las tiendas"', paso["run"])
        self.assertIn('exit "$CODIGO"', paso["run"])
        self.assertNotIn("la lista de la semana' ||", self.texto)

    def test_generar_entrega_el_slug_y_consumir_lo_verifica(self):
        self.assertEqual(self.yml["jobs"]["generar"]["outputs"]["slug"], "${{ steps.guardado.outputs.slug }}")
        guardado = next(p for p in self.yml["jobs"]["generar"]["steps"] if p.get("id") == "guardado")
        self.assertIn("/tmp/triggui-committed.flag", guardado["run"])
        pasos = [p.get("name", "") for p in self.yml["jobs"]["consumir"]["steps"]]
        i = pasos.index("🔎 ¿El libro ya está en su catálogo?")
        self.assertLess(i, pasos.index("🎬 Consumir linea y dejar acta"))
        paso = self.yml["jobs"]["consumir"]["steps"][i]
        self.assertEqual(paso["env"]["SLUG"], "${{ needs.generar.outputs.slug }}")
        self.assertIn('scripts/lista-semanal.py --verificar', paso["run"])
        self.assertIn('--slug "$SLUG"', paso["run"])

    def test_consumir_solo_en_main_nunca_en_prueba_y_con_la_lista_kids(self):
        cond = self.yml["jobs"]["consumir"]["if"]
        self.assertIn("github.ref == 'refs/heads/main'", cond)
        self.assertIn("inputs.modo_prueba != true", cond)
        paso = next(p for p in self.yml["jobs"]["consumir"]["steps"] if p.get("name") == "🎬 Consumir linea y dejar acta")
        self.assertIn('COLA="lista-kids.txt"', paso["run"])
        self.assertIn("encoding='utf-8-sig'", paso["run"])

    def test_consumir_limpia_la_linea_igual_que_el_script(self):
        paso = next(p for p in self.yml["jobs"]["consumir"]["steps"] if p.get("name") == "🎬 Consumir linea y dejar acta")
        run = paso["run"]
        py = run[run.index("python3 - <<'PY'\n") + len("python3 - <<'PY'\n"): run.index("\nPY\n")]
        compile(py, "consumir", "exec")
        self.assertIn("limpiar(l.strip()) == libro", py)
        i = py.index("def limpiar(t):")
        j = py.index("\n", py.index("return ' '.join", i))
        ns = {}
        exec("import re\n" + py[i:j], ns)
        for t in ["Heidi  |  Johanna Spyri", 'Uno "dos"\n$(rm) `x` \\ tres', "a" * 300, "El Principito | Antoine de Saint-Exupéry"]:
            self.assertEqual(ns["limpiar"](t), ls.limpiar(t))

    def test_reconstruir_no_depende_de_la_lista(self):
        i = self.texto.index("\n  reconstruir:\n")
        bloque = self.texto[i:self.texto.index("\n  consumir:\n")]
        self.assertNotIn("needs.lista", bloque)


_spec_rt = importlib.util.spec_from_file_location("revisar_tiendas", os.path.join(AQUI, "revisar-tiendas.py"))
rt = importlib.util.module_from_spec(_spec_rt)
_spec_rt.loader.exec_module(rt)


class RevisarTiendas(unittest.TestCase):
    """El flujo «🛒 Revisar tiendas de una lista»: parte la lista, revisa cada título y no publica nada."""

    def test_partir_por_punto_y_coma_o_renglon_sin_repetir(self):
        self.assertEqual(rt.partir('Heidi | Johanna Spyri; matilda | Roald Dahl\nHEIDI | Johanna Spyri;  ;"Raro" $x | A'),
                         ["Heidi | Johanna Spyri", "matilda | Roald Dahl", "Raro x | A"])
        self.assertEqual(len(rt.partir(";".join(f"L{n} | A" for n in range(99)))), rt.TOPE)

    def test_la_tabla_cuenta_y_escapa_las_barras(self):
        texto, cuenta = rt.tabla(["Heidi | Johanna Spyri", "Matilda | Roald Dahl", "Pippi | A"],
                                 tiendas(no=("Matilda",), desconocidos=("Pippi",)))
        self.assertEqual(cuenta, {"si": 1, "no": 1, "?": 1})
        self.assertIn("| 1 | Heidi ¦ Johanna Spyri | ✅ se consigue |", texto)
        self.assertIn("Se consiguen 1 de 3", texto)

    def test_el_flujo_solo_lee(self):
        import yaml
        with open(os.path.join(RAIZ, ".github", "workflows", "revisar-tiendas.yml"), encoding="utf-8") as f:
            texto = f.read()
        yml = yaml.safe_load(texto)
        self.assertEqual(yml["permissions"], {"contents": "read"})
        self.assertNotRegex(texto, r"git (push|commit)")
        paso = yml["jobs"]["revisar"]["steps"][-1]
        self.assertEqual(paso["env"]["LIBROS"], "${{ inputs.libros }}")
        self.assertIn('--libros="$LIBROS"', paso["run"])
        self.assertFalse(yml["jobs"]["revisar"]["steps"][1]["with"]["persist-credentials"])


class RutasKids(unittest.TestCase):
    """Las páginas Kids apuntan a /kids/t/, no a /t/ (imagen para compartir, canónica y gemela en inglés)."""

    def test_el_generador_usa_la_carpeta_de_su_catalogo(self):
        codigo = (
            "import os, importlib.util\n"
            "os.environ['TRIGGUI_OUT_BASE']=os.environ['OUT']\n"
            "s=importlib.util.spec_from_file_location('be', os.environ['BE']); m=importlib.util.module_from_spec(s); s.loader.exec_module(m)\n"
            "print('RUTA=' + m.ruta_ediciones())\n")
        for out, esperado in (("public/kids/t", "/kids/t"), ("public/t", "/t")):
            p = subprocess.run([sys.executable, "-I", "-B", "-c", codigo], capture_output=True, text=True, timeout=60,
                               cwd=os.path.join(RAIZ, "experiments", "nucleus"),
                               env=dict(os.environ, OUT=out, BE=os.path.join(AQUI, "build-editions.py")))
            self.assertIn("RUTA=" + esperado, p.stdout, p.stderr[-400:])

    def test_el_generador_ya_no_arma_rutas_fijas_de_adultos(self):
        with open(os.path.join(AQUI, "build-editions.py"), encoding="utf-8") as f:
            codigo = f.read()
        self.assertNotRegex(codigo, r'f"\{(base_url|BASE_URL)\}/t/\{edicion_id\}')
        self.assertNotRegex(codigo, r"f['\"]\{?['\"]?\{base_url\}/t/\{edicion_id\}/")

    def test_ninguna_pagina_kids_apunta_a_la_ruta_de_adultos(self):
        carpeta = os.path.join(RAIZ, "public", "kids", "t")
        malas = []
        for slug in os.listdir(carpeta):
            for base, _, archivos in os.walk(os.path.join(carpeta, slug)):
                for n in archivos:
                    if n.endswith(".html"):
                        with open(os.path.join(base, n), encoding="utf-8") as f:
                            if f"https://app.triggui.com/t/{slug}/" in f.read():
                                malas.append(os.path.join(slug, n))
        self.assertEqual(malas, [])


if __name__ == "__main__":
    unittest.main(verbosity=1)
