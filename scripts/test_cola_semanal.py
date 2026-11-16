#!/usr/bin/env python3
"""Pruebas de scripts/cola-semanal.py y de su uso en .github/workflows/triggui.yml (C477, paso 1).

Correr:  python3 -I -B scripts/test_cola_semanal.py
"""
import importlib.util
import io
import json
import os
import re
import sys
import tempfile
import unittest
from contextlib import redirect_stdout, redirect_stderr

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
_spec = importlib.util.spec_from_file_location("cola_semanal", os.path.join(AQUI, "cola-semanal.py"))
cs = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cs)

COMENTARIOS = "# 🎬 cola\n# Ejemplo:\n# Un libro | Alguien\n\n"


def escribir(ruta, texto):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(texto)


class Fixture(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.app = os.path.join(self.tmp.name, "app")
        self.con = os.path.join(self.tmp.name, "triggui-content")
        os.makedirs(self.app)
        os.makedirs(os.path.join(self.con, "data"))
        escribir(os.path.join(self.app, "cola-lunes.txt"), COMENTARIOS)
        escribir(os.path.join(self.app, "cola-kids.txt"), COMENTARIOS)
        escribir(os.path.join(self.con, "data", "libros_master_kids.csv"),
                 "titulo,autor\nEl Principito,Antoine de Saint-Exupéry\nMatilda,Roald Dahl\n"
                 "\"Charlie y la fábrica de chocolate, edición especial\",Roald Dahl\nHeidi,Johanna Spyri\n")
        escribir(os.path.join(self.con, "contenido_kids.json"),
                 json.dumps([{"titulo": "El principito", "autor": "Saint-Exupéry"}]))

    def tearDown(self):
        self.tmp.cleanup()

    def decidir(self, evento="schedule", cron=cs.CRON_KIDS, modo="", catalogo=""):
        return cs.decidir(evento, cron, modo, catalogo, self.app, self.con)


class Cola(Fixture):
    def test_disparo_manual_normal_no_usa_la_cola(self):
        r = self.decidir(evento="workflow_dispatch", cron="", modo="📘 Un libro específico", catalogo="kids")
        self.assertEqual((r["hay"], r["libro"], r["catalogo"], r["origen"]), ("", "", "", ""))

    def test_kids_toma_la_primera_linea_de_su_cola(self):
        escribir(os.path.join(self.app, "cola-kids.txt"), COMENTARIOS + "  Heidi | Johanna Spyri  \nMatilda | Roald Dahl\n")
        r = self.decidir()
        self.assertEqual((r["hay"], r["libro"], r["catalogo"], r["origen"]), ("true", "Heidi | Johanna Spyri", "kids", "cola"))

    def test_kids_vacia_usa_el_catalogo_y_salta_lo_ya_horneado_sin_importar_acentos(self):
        r = self.decidir()
        self.assertEqual((r["hay"], r["libro"], r["catalogo"], r["origen"]), ("true", "Matilda | Roald Dahl", "kids", "catalogo"))

    def test_el_respaldo_salta_la_cuarentena(self):
        escribir(os.path.join(self.con, "contenido_kids.quarantine.json"), json.dumps({"libros": [{"titulo": "MATILDA"}]}))
        r = self.decidir()
        self.assertEqual(r["libro"], "Charlie y la fábrica de chocolate, edición especial | Roald Dahl")

    def test_el_respaldo_lee_el_csv_con_bom_y_comillas(self):
        escribir(os.path.join(self.con, "data", "libros_master_kids.csv"),
                 "﻿titulo,autor\n\"Pippi, la de las medias largas\",Astrid Lindgren\n")
        self.assertEqual(self.decidir()["libro"], "Pippi, la de las medias largas | Astrid Lindgren")

    def test_sin_nada_que_hornear_descansa(self):
        escribir(os.path.join(self.con, "contenido_kids.json"),
                 json.dumps([{"titulo": t} for t in ("El Principito", "Matilda", "Charlie y la fábrica de chocolate, edición especial", "Heidi")]))
        r = self.decidir()
        self.assertEqual((r["hay"], r["libro"], r["catalogo"]), ("", "", "kids"))

    def test_sin_csv_ni_cola_descansa_sin_tronar(self):
        os.remove(os.path.join(self.con, "data", "libros_master_kids.csv"))
        self.assertEqual(self.decidir()["hay"], "")

    def test_contenido_roto_no_truena(self):
        escribir(os.path.join(self.con, "contenido_kids.json"), "{roto")
        self.assertEqual(self.decidir()["libro"], "El Principito | Antoine de Saint-Exupéry")

    def test_adultos_solo_su_cola_y_sin_respaldo(self):
        r = self.decidir(cron=cs.CRON_ADULTOS)
        self.assertEqual((r["hay"], r["catalogo"]), ("", "adulto"))
        escribir(os.path.join(self.app, "cola-lunes.txt"), COMENTARIOS + "Esencialismo | Greg McKeown\n")
        r = self.decidir(cron=cs.CRON_ADULTOS)
        self.assertEqual((r["hay"], r["libro"], r["catalogo"], r["origen"]), ("true", "Esencialismo | Greg McKeown", "adulto", "cola"))

    def test_un_cron_desconocido_es_de_adultos(self):
        self.assertEqual(self.decidir(cron="0 9 * * *")["catalogo"], "adulto")

    def test_el_modo_hornear_la_cola_usa_el_catalogo_elegido(self):
        r = self.decidir(evento="workflow_dispatch", cron="", modo="🎬 Hornear la cola ahora", catalogo="kids")
        self.assertEqual((r["catalogo"], r["origen"]), ("kids", "catalogo"))
        r = self.decidir(evento="workflow_dispatch", cron="", modo="🎬 Hornear la cola ahora", catalogo="adulto")
        self.assertEqual((r["hay"], r["catalogo"]), ("", "adulto"))

    def test_limpiar_quita_lo_que_rompe_el_shell_y_las_salidas(self):
        self.assertEqual(cs.limpiar('Uno "dos"\n$(rm -rf) `x` \\ tres'), "Uno dos (rm -rf) x tres")
        self.assertEqual(len(cs.limpiar("a" * 500)), cs.LARGO_MAXIMO)
        escribir(os.path.join(self.app, "cola-kids.txt"), 'Libro "raro" $HOME | Autor\n')
        self.assertEqual(self.decidir()["libro"], "Libro raro HOME | Autor")

    def test_main_escribe_cuatro_salidas_de_una_linea(self):
        os.environ.update({"EVENTO": "schedule", "CRON": cs.CRON_KIDS, "MODO": "", "CATALOGO_MANUAL": ""})
        try:
            salida, err = io.StringIO(), io.StringIO()
            with redirect_stdout(salida), redirect_stderr(err):
                cs.main(["--app", self.app, "--contenido", self.con])
        finally:
            for k in ("EVENTO", "CRON", "MODO", "CATALOGO_MANUAL"):
                os.environ.pop(k, None)
        lineas = salida.getvalue().splitlines()
        self.assertEqual([l.split("=", 1)[0] for l in lineas], ["hay", "libro", "catalogo", "origen"])
        self.assertEqual(lineas[1], "libro=Matilda | Roald Dahl")
        self.assertIn("Matilda", err.getvalue())


class Workflow(unittest.TestCase):
    """El YAML usa la cola como espera el script, y el cron no se queda sin imágenes ni sin proteger lo manual."""

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
        self.assertIn(cs.CRON_KIDS, crones)
        self.assertIn(cs.CRON_ADULTOS, crones)

    def test_el_modo_hornear_la_cola_existe(self):
        self.assertIn("🎬 Hornear la cola ahora", self.on["workflow_dispatch"]["inputs"]["modo"]["options"])

    def test_la_cola_entrega_catalogo_y_origen(self):
        salidas = self.yml["jobs"]["cola"]["outputs"]
        self.assertEqual(set(salidas), {"hay", "libro", "catalogo", "origen"})

    def test_generar_ya_no_mira_solo_inputs_catalogo(self):
        self.assertNotIn("inputs.catalogo == 'kids'", self.generar.replace("(inputs.catalogo || needs.cola.outputs.catalogo) == 'kids'", ""))
        self.assertNotIn("CATALOG_MODE: ${{ inputs.catalogo || 'adulto' }}", self.generar)

    def test_el_cron_genera_imagenes_y_protege_lo_manual(self):
        self.assertNotRegex(self.generar, r"if: \$\{\{ inputs\.generar_imagenes(\s*\}\}| &&)")
        self.assertIn("PRESERVE_MANUAL: ${{ (inputs.preservar_manuales || github.event_name == 'schedule') && 'true' || 'false' }}", self.generar)

    def test_el_libro_de_la_cola_entra_por_env_y_no_en_el_shell(self):
        self.assertNotIn('LIBRO_FINAL="${{ needs.cola.outputs.libro }}"', self.texto)
        self.assertIn("LIBRO_DE_LA_COLA: ${{ needs.cola.outputs.libro }}", self.texto)

    def test_consumir_solo_en_main_y_nunca_en_prueba(self):
        cond = self.yml["jobs"]["consumir"]["if"]
        self.assertIn("github.ref == 'refs/heads/main'", cond)
        self.assertIn("inputs.modo_prueba != true", cond)

    def test_consumir_limpia_la_linea_igual_que_el_script(self):
        pasos = self.yml["jobs"]["consumir"]["steps"]
        run = next(p["run"] for p in pasos if "run" in p and "python3 - <<'PY'" in p["run"])
        py = run[run.index("python3 - <<'PY'\n") + len("python3 - <<'PY'\n"): run.index("\nPY\n")]
        self.assertIn("limpiar(l.strip()) == libro", py)
        i = py.index("def limpiar(t):")
        j = py.index("\n", py.index("return ' '.join", i))
        ns = {}
        exec("import re\n" + py[i:j], ns)
        for t in ["Heidi  |  Johanna Spyri", 'Uno "dos"\n$(rm) `x` \\ tres', "a" * 300, "El Principito | Antoine de Saint-Exupéry"]:
            self.assertEqual(ns["limpiar"](t), cs.limpiar(t))

    def test_el_modo_cola_pasa_la_puerta_de_tiendas_como_el_lunes(self):
        self.assertIn("(github.event_name == 'schedule' || contains(inputs.modo, '🎬')) && 'la cola de la semana'", self.generar)

    def test_reconstruir_no_depende_de_la_cola(self):
        i = self.texto.index("\n  reconstruir:\n")
        bloque = self.texto[i:self.texto.index("\n  consumir:\n")]
        self.assertNotIn("needs.cola", bloque)


if __name__ == "__main__":
    unittest.main(verbosity=1)
