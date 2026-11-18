#!/usr/bin/env python3
"""Pruebas del robot de propuestas (scripts/curaduria.py, C480) y de su flujo, sin red: el juez y las tiendas son dobles.

Correr:  python3 -I -B scripts/test_curaduria.py
"""
import argparse
import csv
import datetime
import importlib.util
import io
import json
import os
import sys
import tempfile
import unittest
from contextlib import redirect_stderr

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
_spec = importlib.util.spec_from_file_location("curaduria", os.path.join(AQUI, "curaduria.py"))
cu = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cu)

HOY = "2026-11-17"


def escribir(ruta, texto):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(texto)


def csv_de(filas, campos=("titulo", "autor", "portada", "tagline")):
    s = io.StringIO()
    w = csv.DictWriter(s, fieldnames=list(campos))
    w.writeheader()
    for f in filas:
        w.writerow({k: f.get(k, "") for k in campos})
    return s.getvalue()


def marca(titulo, autor, tienda, revisado=HOY, cdl=None, gandhi=None, isbn="9780000000001"):
    return {"titulo": titulo, "autor": autor, "tienda": tienda, "isbn": isbn if tienda != "ninguna" else None,
            "casadelibro": None if cdl is None else {"disponible": cdl},
            "gandhi": None if gandhi is None else {"disponible": gandhi},
            "motivo": None if tienda != "ninguna" else "agotado", "revisado": revisado}


def juicio(mision=0.8, estado="tristeza", claridad=0.8, parecido=0.1, conoce=True, edad="", apto=True, delicado="",
           trata="Un libro que ayuda.", razon="Mejora el ánimo.", titulo_bien=None, autor_bien=None):
    """titulo_bien y autor_bien en None: el doble del juez devuelve los del candidato (bien escritos)."""
    return {"conoce": conoce, "mision": mision, "estado": estado, "claridad": claridad, "parecido": parecido,
            "de_que_trata": trata, "razon": razon, "edad": edad, "apto": apto, "delicado": delicado,
            "titulo_bien": titulo_bien, "autor_bien": autor_bien}


class JuezFalso:
    """Contesta por título; para «el más parecido», según el mapa parecidos {título que falta: (título elegido, parecido)}."""

    def __init__(self, juicios, parecidos=None, falla_en=None, momento=None, momento_falla=False):
        self.juicios, self.parecidos, self.falla_en = juicios, parecidos or {}, falla_en
        self.momento, self.momento_falla = momento, momento_falla
        self.llamadas, self.parecido_llamadas, self.momento_llamadas = 0, 0, 0
        self.momento_usuario = ""

    def __call__(self, sistema, usuario, esq, tope):
        if "variables" in esq["properties"]:   # el momento de cada fecha y las variables sugeridas
            self.momento_llamadas += 1
            self.momento_usuario = usuario
            if self.momento_falla:
                raise RuntimeError("no respondió")
            return self.momento or {"momento": [], "variables": []}
        if "por_que" in esq["properties"]:
            self.parecido_llamadas += 1
            falta = usuario.split("«", 1)[1].split("»", 1)[0]
            lista = json.loads(usuario.split("\n", 2)[-1].split(":\n", 1)[1])
            elegido, par = self.parecidos.get(falta, (None, 0.0))
            for p in lista:
                if p["titulo"] == elegido:
                    return {"i": p["i"], "parecido": par, "por_que": "Mismo fondo."}
            return {"i": -1, "parecido": par, "por_que": ""}
        self.llamadas += 1
        lista = json.loads(usuario.split("\n", 2)[-1].split(":\n", 1)[1])
        if self.falla_en and any(p["titulo"] == self.falla_en for p in lista):
            raise RuntimeError("se cayó")
        salida = []
        for p in lista:
            j = self.juicios.get(p["titulo"])
            if j:
                j = dict(j, i=p["i"])
                j["titulo_bien"] = p["titulo"] if j.get("titulo_bien") is None else j["titulo_bien"]
                j["autor_bien"] = p["autor"] if j.get("autor_bien") is None else j["autor_bien"]
                salida.append(j)
        return {"libros": salida}


class RevisarFalso:
    """La revisión del horno: escribe la marca nueva en tiendas.json, como hace tiendas-horno.mjs."""

    def __init__(self, ruta, respuestas):
        self.ruta, self.respuestas, self.vistos = ruta, respuestas, []

    def __call__(self, libro):
        self.vistos.append(libro)
        titulo, autor = [x.strip() for x in libro.split(" | ", 1)]
        r = self.respuestas.get(titulo, "no")
        if r == "si-viejo":   # la red falló y el horno conservó la marca buena vieja: sale con 0, «se consigue»
            return "si"
        if r in ("si", "no"):
            d = json.load(open(self.ruta, encoding="utf-8"))
            d["libros"][cu.clave(titulo, autor)] = marca(titulo, autor, "gandhi" if r == "si" else "ninguna", gandhi=(r == "si"))
            json.dump(d, open(self.ruta, "w", encoding="utf-8"))
        return r


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.app = os.path.join(self.tmp.name, "app")
        self.con = os.path.join(self.tmp.name, "triggui-content")
        self.sal = os.path.join(self.tmp.name, "salida")
        escribir(os.path.join(self.app, "lista-adultos.txt"), "# lista\nYa en la lista | Alguien\n")
        escribir(os.path.join(self.app, "lista-kids.txt"), "# lista\n")
        self.maestro = [
            {"titulo": "Libro A", "autor": "Ana Uno", "portada": "https://img/a.jpg", "tagline": "a"},
            {"titulo": "Libro B", "autor": "Beto Dos", "portada": "https://img/b.jpg", "tagline": "b"},
            {"titulo": "Libro C", "autor": "Ceci Tres", "portada": "", "tagline": "c"},
            {"titulo": "Libro D", "autor": "Dani Cuatro", "portada": "https://img/d.jpg", "tagline": "d"},
            {"titulo": "Libro E", "autor": "Eva Cinco", "portada": "https://img/e.jpg", "tagline": "e"},
            {"titulo": "En la app: edicion larga", "autor": "Fede Seis", "portada": "", "tagline": ""},
            {"titulo": "Ya en la lista", "autor": "Alguien", "portada": "", "tagline": ""},
            {"titulo": "Otro de Gil", "autor": "Gil Siete", "portada": "", "tagline": ""},
            {"titulo": "Libro A", "autor": "Ana Uno", "portada": "", "tagline": "repetido"},
        ]
        escribir(os.path.join(self.con, "data", "libros_master.csv"), csv_de(self.maestro))
        escribir(os.path.join(self.con, "data", "libros_master_kids.csv"),
                 csv_de([{"titulo": "Cuento K1", "autor": "Roald Dahl"}, {"titulo": "Cuento K2", "autor": "Roald Dahl"},
                         {"titulo": "Franquicia", "autor": "Tele"}], campos=("titulo", "autor")))
        escribir(os.path.join(self.con, "data", "libros_masterbkids.csv"),
                 csv_de([{"titulo": "Cuento K3", "autor": "Otra", "portada": "https://img/k3.jpg", "tagline": "k3"}]))
        escribir(os.path.join(self.con, "contenido.json"), json.dumps({"libros": [
            {"titulo": "En la app", "autor": "Fede Seis"}, {"titulo": "Otro libro", "autor": "Gil Siete"}]}))
        escribir(os.path.join(self.con, "contenido_kids.json"), json.dumps({"libros": [{"titulo": "Matilda", "autor": "Roald Dahl"}]}))
        escribir(os.path.join(self.con, "contenido_manual.json"), json.dumps({"libros": [{"titulo": "Edición reciente 1"}]}))
        escribir(os.path.join(self.con, "contenido_kids_manual.json"), json.dumps({"libros": [{"titulo": "Kids reciente"}]}))
        self.ruta_tiendas = os.path.join(self.con, "data", "tiendas.json")
        self.marcas = {
            "Libro A": marca("Libro A", "Ana Uno", "casadelibro", cdl=True, gandhi=True),
            "Libro B": marca("Libro B", "Beto Dos", "ninguna"),
            "Libro C": marca("Libro C", "Ceci Tres", "gandhi", gandhi=True),
            "Libro D": marca("Libro D", "Dani Cuatro", "casadelibro", cdl=True, gandhi=False),
            "Libro E": marca("Libro E", "Eva Cinco", "gandhi", revisado="2026-09-01", gandhi=True),
            "Cuento K1": marca("Cuento K1", "Roald Dahl", "casadelibro", cdl=True),
            "Cuento K2": marca("Cuento K2", "Roald Dahl", "gandhi", gandhi=True),
            "Cuento K3": marca("Cuento K3", "Otra", "casadelibro", cdl=True),
            "Franquicia": marca("Franquicia", "Tele", "casadelibro", cdl=True),
        }
        self.guardar_marcas()

    def guardar_marcas(self):
        escribir(self.ruta_tiendas, json.dumps({"version": 1, "libros": {
            cu.clave(m["titulo"], m["autor"]): m for m in self.marcas.values()}}))

    def tearDown(self):
        self.tmp.cleanup()

    def args(self, lista="adultos", cuantos=0, forzar=True):
        return argparse.Namespace(lista=lista, cuantos=cuantos, forzar=forzar, app=self.app, contenido=self.con,
                                  nucleus="no-se-usa", salida=self.sal, fecha=HOY)

    def correr(self, juez, respuestas=None, **kw):
        rev = RevisarFalso(self.ruta_tiendas, respuestas or {})
        err = io.StringIO()
        with redirect_stderr(err):
            codigo = cu.correr(self.args(**kw), juez=juez, revisar=rev)
        self.err = err.getvalue()
        return codigo, rev

    def leer(self, nombre):
        with open(os.path.join(self.sal, nombre), encoding="utf-8") as f:
            return f.read()

    def registro(self, lista="adultos"):
        return json.loads(self.leer(f"propuesta-{lista}.json"))


JUICIOS = {
    "Libro A": juicio(mision=0.9, estado="tristeza"),
    "Libro B": juicio(mision=0.95, estado="miedo", trata="Sobre el miedo."),
    "Libro C": juicio(mision=0.85, estado="ira"),
    "Libro D": juicio(mision=0.7, estado="serena", parecido=0.6),
    "Libro E": juicio(mision=0.8, estado="apatia"),
}


class Candidatos(Base):
    def test_quita_lo_que_ya_esta_y_lo_repetido(self):
        cands, ex, en_lista = cu.candidatos("adultos", self.con, self.app)
        titulos = [c["titulo"] for c in cands]
        self.assertEqual(titulos, ["Libro A", "Libro B", "Libro C", "Libro D", "Libro E"])
        self.assertEqual(ex, {"repetido en el maestro": 1, "en la app": 1, "en la lista": 1, "descartado por Badir": 0,
                              "autor en la app": 1})
        self.assertEqual(en_lista, 1)

    def test_lo_descartado_por_badir_no_vuelve(self):
        escribir(os.path.join(self.app, "descartados-adultos.txt"), "# descartados\nLibro B | Beto Dos\n")
        cands, ex, _ = cu.candidatos("adultos", self.con, self.app)
        self.assertEqual([c["titulo"] for c in cands], ["Libro A", "Libro C", "Libro D", "Libro E"])
        self.assertEqual(ex["descartado por Badir"], 1)

    def test_el_autor_de_la_app_con_una_errata_en_el_maestro(self):
        # El 17 de noviembre el maestro traía «Deepak Shopra» y la app ya tenía dos de Deepak Chopra.
        self.maestro.append({"titulo": "Cuerpos sin edad", "autor": "Deepak Shopra", "portada": "", "tagline": ""})
        escribir(os.path.join(self.con, "data", "libros_master.csv"), csv_de(self.maestro))
        escribir(os.path.join(self.con, "contenido.json"), json.dumps({"libros": [
            {"titulo": "En la app", "autor": "Fede Seis"}, {"titulo": "Otro libro", "autor": "Gil Siete"},
            {"titulo": "Sincrodestino", "autor": "Deepak Chopra"}]}))
        cands, ex, _ = cu.candidatos("adultos", self.con, self.app)
        self.assertNotIn("Cuerpos sin edad", [c["titulo"] for c in cands])
        self.assertEqual(ex["autor en la app"], 2)

    def test_en_kids_el_mismo_autor_si_puede_entrar(self):
        cands, ex, _ = cu.candidatos("kids", self.con, self.app)
        self.assertEqual([c["titulo"] for c in cands], ["Cuento K1", "Cuento K2", "Franquicia", "Cuento K3"])
        self.assertEqual(ex["autor en la app"], 0)

    def test_el_mismo_autor_escrito_distinto(self):
        self.assertTrue(cu.mismo_autor("Craig Wright", "Wright"))
        self.assertTrue(cu.mismo_autor("Gabriel García Márquez", "Gabriel Garcia Marquez"))
        self.assertFalse(cu.mismo_autor("Ana Uno", "Beto Dos"))
        self.assertFalse(cu.mismo_autor("", "Beto Dos"))
        self.assertTrue(cu.mismo_autor("Deepak Shopra", "Deepak Chopra"))          # una letra cambiada
        self.assertTrue(cu.mismo_autor("Mihaly Csikszentmihaly", "Mihaly Csikszentmihalyi"))   # una que falta
        self.assertFalse(cu.mismo_autor("Ana Martín", "Ana Martínez"))             # dos letras de distancia

    def test_misma_palabra(self):
        self.assertTrue(cu.misma_palabra("chopra", "shopra"))
        self.assertTrue(cu.misma_palabra("questions", "questons"))
        self.assertTrue(cu.misma_palabra("questons", "questions"))
        self.assertFalse(cu.misma_palabra("gil", "gill"))       # menos de cinco letras: solo igual
        self.assertFalse(cu.misma_palabra("martin", "martinez"))
        self.assertFalse(cu.misma_palabra("ab", "abc"))


class Propuesta(Base):
    def test_no_hace_falta_si_la_lista_tiene_suficientes(self):
        escribir(os.path.join(self.app, "lista-adultos.txt"), "".join(f"T{i} | A{i}\n" for i in range(cu.UMBRAL)))
        juez = JuezFalso(JUICIOS)
        codigo, _ = self.correr(juez, forzar=False)
        self.assertEqual(codigo, 0)
        self.assertFalse(os.path.exists(self.sal))
        self.assertEqual(juez.llamadas, 0)
        self.assertIn("no hace falta", self.err)

    def test_elige_por_potencial_con_la_tienda_de_hoy_y_el_puntaje_exacto(self):
        codigo, rev = self.correr(JuezFalso(JUICIOS, parecidos={"Libro B": ("Libro C", 0.7)}),
                                  respuestas={"Libro E": "si"}, cuantos=4)
        self.assertEqual(codigo, 0)
        r = self.registro()
        titulos = [c["titulo"] for c in r["elegidos"]]
        # B es el de más potencial, pero no se consigue: entra C en su lugar. Entran A, E (revisado hoy) y D, y la lista
        # queda por puntaje: A 91, E 83, C 80, D 76.
        self.assertEqual(titulos, ["Libro A", "Libro E", "Libro C", "Libro D"])
        self.assertEqual([c["total"] for c in r["elegidos"]], [91.0, 83.0, 80.0, 76.0])
        self.assertEqual(r["elegidos"][2]["reemplaza"], "Libro B")
        a = r["elegidos"][0]
        self.assertEqual(a["donde"], "ambas")
        self.assertEqual(a["partes"], {"mision": 36.0, "animo": 16.0, "libro_real": 15, "tienda": 15, "variedad": 9.0})
        self.assertEqual(a["total"], 91.0)
        self.assertEqual(r["elegidos"][2]["partes"]["libro_real"], 10)   # C no trae portada
        self.assertEqual(rev.vistos, ["Libro E | Eva Cinco"])            # solo lo de marca vieja se revisa
        self.assertEqual(r["resumen"]["revisados_hoy"], 1)
        self.assertEqual(r["resumen"]["no_se_consiguen"], 1)
        self.assertEqual(r["resumen"]["reemplazos"], 1)

    def test_lo_duro_no_lo_compensa_el_puntaje(self):
        juicios = dict(JUICIOS)
        juicios["Libro A"] = juicio(mision=0.99, conoce=False)
        juicios["Libro C"] = juicio(mision=0.59)
        codigo, _ = self.correr(JuezFalso(juicios), respuestas={"Libro E": "si"}, cuantos=5)
        titulos = [c["titulo"] for c in self.registro()["elegidos"]]
        self.assertNotIn("Libro A", titulos)
        self.assertNotIn("Libro C", titulos)
        self.assertEqual(self.registro()["resumen"]["validos"], 3)

    def test_sin_parecido_suficiente_no_entra_nadie_en_su_lugar(self):
        codigo, _ = self.correr(JuezFalso(JUICIOS, parecidos={"Libro B": ("Libro C", 0.5)}), respuestas={"Libro E": "si"}, cuantos=5)
        r = self.registro()
        self.assertFalse(any(c.get("reemplaza") for c in r["elegidos"]))
        self.assertIn("Libro C", [c["titulo"] for c in r["elegidos"]])   # C entra por su cuenta, no en lugar de B
        self.assertNotIn("Libro B", [c["titulo"] for c in r["elegidos"]])

    def test_las_tiendas_sin_respuesta_no_entran_y_se_avisa(self):
        juez = JuezFalso(JUICIOS, parecidos={"Libro E": ("Libro D", 0.9)})
        codigo, _ = self.correr(juez, respuestas={"Libro E": "?"}, cuantos=5)
        r = self.registro()
        self.assertNotIn("Libro E", [c["titulo"] for c in r["elegidos"]])
        self.assertTrue(any("En 1 revisión de hoy las tiendas no dieron una respuesta clara" in a for a in r["avisos"]), r["avisos"])
        # No se sabe si E se consigue: nadie entra «en su lugar» ni se dice que no se consigue.
        self.assertFalse(any(c.get("reemplaza") == "Libro E" for c in r["elegidos"]))
        self.assertEqual(r["resumen"]["no_se_consiguen"], 1)   # solo B, que su marca dice que no
        md = self.leer("propuesta-adultos.md")
        self.assertNotIn("«Libro E», que no se consigue", md)
        self.assertIn("- **Tiendas:** 1 revisión de hoy sin respuesta clara; el resto, con su marca de menos de 25 días. "
                      "1 de los mejores no se conseguía.", md)
        self.assertNotIn("ninguno hizo falta revisarlo hoy", md)

    def test_una_marca_con_error_de_red_se_revisa_otra_vez(self):
        # Como falta() de tiendas-horno.mjs: una marca «error_red» no dice que no se consigue; se revisa en el momento.
        self.marcas["Libro D"] = dict(marca("Libro D", "Dani Cuatro", "ninguna"), motivo="error_red")
        self.guardar_marcas()
        codigo, rev = self.correr(JuezFalso(JUICIOS, parecidos={"Libro D": ("Libro C", 0.9)}),
                                  respuestas={"Libro E": "si", "Libro D": "si"}, cuantos=5)
        r = self.registro()
        self.assertIn("Libro D | Dani Cuatro", rev.vistos)
        self.assertIn("Libro D", [c["titulo"] for c in r["elegidos"]])
        self.assertFalse(any(c.get("reemplaza") == "Libro D" for c in r["elegidos"]))
        self.assertEqual(r["resumen"]["revisados_hoy"], 2)   # D y E respondieron

    def test_dice_que_si_con_una_marca_vieja_no_entra(self):
        # La red falló y el horno conservó la marca buena del 1 de septiembre: no es una respuesta de hoy.
        codigo, rev = self.correr(JuezFalso(JUICIOS, parecidos={"Libro E": ("Libro D", 0.9)}),
                                  respuestas={"Libro E": "si-viejo"}, cuantos=5)
        r = self.registro()
        self.assertEqual(rev.vistos, ["Libro E | Eva Cinco"])
        self.assertNotIn("Libro E", [c["titulo"] for c in r["elegidos"]])
        self.assertFalse(any(c.get("reemplaza") == "Libro E" for c in r["elegidos"]))
        self.assertEqual(r["resumen"]["revisados_hoy"], 0)
        self.assertTrue(any("no dieron una respuesta clara" in a for a in r["avisos"]), r["avisos"])

    def test_tres_sin_respuesta_seguidas_y_deja_de_revisar(self):
        for t, a, tienda in (("Libro A", "Ana Uno", "casadelibro"), ("Libro C", "Ceci Tres", "gandhi"),
                             ("Libro D", "Dani Cuatro", "casadelibro")):
            self.marcas[t] = marca(t, a, tienda, revisado="2026-09-01", cdl=True, gandhi=True)
        self.guardar_marcas()
        respuestas = {t: "?" for t in ("Libro A", "Libro C", "Libro D", "Libro E")}
        codigo, rev = self.correr(JuezFalso(JUICIOS), respuestas=respuestas, cuantos=4)
        self.assertEqual(codigo, 2)   # B no se consigue y nadie más se pudo revisar
        # Por potencial: B (marca de hoy: no), A 66, E 62 y C 59 (sin portada) sin respuesta; D ya no se revisa.
        self.assertEqual(rev.vistos, ["Libro A | Ana Uno", "Libro E | Eva Cinco", "Libro C | Ceci Tres"])
        avisos = self.registro()["avisos"]
        self.assertTrue(any("no respondieron 3 veces seguidas y dejé de revisarlas" in a and "1 libro sin marca vigente se quedó" in a
                            for a in avisos), avisos)
        resumen = self.registro()["resumen"]
        self.assertEqual((resumen["revisados_hoy"], resumen["sin_respuesta"], resumen["sin_revisar"]), (0, 3, 1))

    def test_la_frase_de_tiendas_con_respuestas_dudas_y_corte(self):
        resumen = {"maestro": 9, "candidatos": 5, "excluidos": {}, "juzgados": 5, "validos": 5, "revisados_hoy": 2,
                   "sin_respuesta": 3, "sin_revisar": 1, "no_se_consiguen": 0, "reemplazos": 0, "cuantos": 4, "tope_estado": 2}
        md = cu.markdown("adultos", HOY, [], resumen, [])
        self.assertIn("- **Tiendas:** 2 revisados hoy en Casa del Libro y Gandhi, 3 revisiones de hoy sin respuesta clara y "
                      "1 libro sin revisar porque las tiendas dejaron de responder; el resto, con su marca de menos de 25 días.", md)
        self.assertIn("todos son candidatos.", md)

    def test_el_juez_que_deja_libros_sin_calificar_se_avisa(self):
        juicios = {t: j for t, j in JUICIOS.items() if t != "Libro D"}
        codigo, _ = self.correr(JuezFalso(juicios), respuestas={"Libro E": "si"}, cuantos=3)
        avisos = self.registro()["avisos"]
        self.assertTrue(any("El juez dejó sin calificar 1 candidato de un lote de 5" in a for a in avisos), avisos)

    def test_se_consigue_sin_isbn_no_entra_y_se_avisa(self):
        self.marcas["Libro D"] = marca("Libro D", "Dani Cuatro", "casadelibro", cdl=True, isbn="")
        self.guardar_marcas()
        codigo, _ = self.correr(JuezFalso(JUICIOS, parecidos={"Libro D": ("Libro C", 0.9)}), respuestas={"Libro E": "si"}, cuantos=5)
        r = self.registro()
        self.assertNotIn("Libro D", [c["titulo"] for c in r["elegidos"]])
        self.assertFalse(any(c.get("reemplaza") == "Libro D" for c in r["elegidos"]))
        self.assertTrue(any("1 libro se consigue pero sin ISBN registrado" in a for a in r["avisos"]), r["avisos"])

    def test_un_libro_por_autor_en_cada_propuesta(self):
        self.maestro.append({"titulo": "Libro F", "autor": "Ana Uno", "portada": "https://img/f.jpg", "tagline": "f"})
        escribir(os.path.join(self.con, "data", "libros_master.csv"), csv_de(self.maestro))
        self.marcas["Libro F"] = marca("Libro F", "Ana Uno", "casadelibro", cdl=True, gandhi=True)
        self.guardar_marcas()
        juicios = dict(JUICIOS, **{"Libro F": juicio(mision=0.88, estado="ira")})
        codigo, _ = self.correr(JuezFalso(juicios), respuestas={"Libro E": "si"}, cuantos=5)
        titulos = [c["titulo"] for c in self.registro()["elegidos"]]
        self.assertIn("Libro A", titulos)
        self.assertNotIn("Libro F", titulos)   # mismo autor que A, que tiene más potencial

    def test_el_tope_por_estado_y_la_segunda_ronda(self):
        juicios = {t: juicio(mision=m, estado="tristeza") for t, m in
                   (("Libro A", 0.9), ("Libro C", 0.88), ("Libro D", 0.86))}
        juicios["Libro E"] = juicio(mision=0.65, estado="serena")
        codigo, _ = self.correr(JuezFalso(juicios), respuestas={"Libro E": "si"}, cuantos=3)
        titulos = [c["titulo"] for c in self.registro()["elegidos"]]
        # Tope de 1 por estado con 3: A (tristeza) y E (serena) en la primera ronda; la segunda llena con D, que tiene
        # más potencial que C (trae portada).
        self.assertEqual(titulos, ["Libro A", "Libro E", "Libro D"])

    def test_una_falla_del_juez_se_avisa_y_lo_demas_sigue(self):
        self.maestro_grande = [{"titulo": f"Extra {i}", "autor": f"Autor {i}"} for i in range(cu.LOTE)]
        escribir(os.path.join(self.con, "data", "libros_master.csv"), csv_de(self.maestro + self.maestro_grande))
        juez = JuezFalso(JUICIOS, falla_en="Extra 24")
        codigo, _ = self.correr(juez, respuestas={"Libro E": "si"}, cuantos=3)
        r = self.registro()
        self.assertEqual(codigo, 0)
        self.assertTrue(any("no se calificó" in a for a in r["avisos"]), r["avisos"])
        self.assertEqual(juez.llamadas, 2)
        self.assertEqual(juez.momento_llamadas, 1)

    def test_si_nada_pasa_sale_con_2_y_sin_tabla(self):
        juicios = {t: juicio(mision=0.2) for t in JUICIOS}
        codigo, _ = self.correr(JuezFalso(juicios), cuantos=3)
        self.assertEqual(codigo, 2)
        self.assertTrue(os.path.exists(os.path.join(self.sal, "propuesta-adultos.json")))
        self.assertFalse(os.path.exists(os.path.join(self.sal, "propuesta-adultos.md")))

    def test_la_errata_del_catalogo_no_entra_y_se_lista_para_corregirla(self):
        juicios = dict(JUICIOS)
        juicios["Libro A"] = juicio(mision=0.9, estado="tristeza", titulo_bien="Libro Á")       # le falta el acento
        juicios["Libro D"] = juicio(mision=0.5, estado="serena", autor_bien="Dani Cuatros")     # errata, pero no pasaría
        codigo, _ = self.correr(JuezFalso(juicios), respuestas={"Libro E": "si"}, cuantos=4)
        self.assertEqual(codigo, 0)
        r = self.registro()
        self.assertEqual([c["titulo"] for c in r["elegidos"]], ["Libro E", "Libro C"])
        self.assertEqual(r["erratas"], [{"titulo": "Libro A", "autor": "Ana Uno", "titulo_bien": "Libro Á", "autor_bien": "Ana Uno"}])
        self.assertEqual(r["resumen"]["validos"], 3)   # B, C y E: A trae errata y D no llega a la misión
        md = self.leer("propuesta-adultos.md")
        self.assertIn("<details><summary>Erratas del catálogo (1)</summary>", md)
        self.assertIn("- «Libro A» de Ana Uno → «Libro Á» de Ana Uno", md)
        self.assertIn("el catálogo lo trae bien escrito", md)

    def test_el_orden_por_puntaje_sin_dos_seguidos_del_mismo_animo(self):
        def e(titulo, total, estado):
            return {"titulo": titulo, "total": total, "juicio": {"estado": estado}}
        orden = cu.ordenar([e("Uno", 90, "tristeza"), e("Dos", 89, "tristeza"), e("Tres", 70, "ira"), e("Cuatro", 60, "tristeza")])
        self.assertEqual([c["titulo"] for c in orden], ["Uno", "Tres", "Dos", "Cuatro"])
        empate = cu.ordenar([e("Beta", 80, "ira"), e("Alfa", 80, "miedo")])
        self.assertEqual([c["titulo"] for c in empate], ["Alfa", "Beta"])
        # El voraz simple deja «C, C» al final; hay un orden sin dos seguidos y debe salir ese.
        seis = cu.ordenar([e("A95", 95, "ira"), e("A90", 90, "ira"), e("B85", 85, "miedo"), e("B80", 80, "miedo"),
                           e("C75", 75, "serena"), e("C70", 70, "serena")])
        self.assertEqual([c["titulo"] for c in seis], ["A95", "B85", "A90", "C75", "B80", "C70"])
        # El caso del ensayo real: 3 apatía, 3 ira, 2 miedo y 1 tristeza, sin dos seguidos.
        nueve = cu.ordenar([e("m1", 93, "miedo"), e("a1", 92, "apatia"), e("i1", 92, "ira"), e("i2", 91, "ira"),
                            e("t1", 90, "tristeza"), e("i3", 90, "ira"), e("m2", 89, "miedo"), e("a2", 89, "apatia"),
                            e("a3", 87, "apatia")])
        estados = [c["juicio"]["estado"] for c in nueve]
        self.assertFalse(any(x == y for x, y in zip(estados, estados[1:])), estados)

    def test_cuantos_fuera_de_rango_no_corre(self):
        juez = JuezFalso(JUICIOS)
        codigo, _ = self.correr(juez, cuantos=99)
        self.assertEqual(codigo, 2)
        self.assertEqual(juez.llamadas, 0)
        self.assertFalse(os.path.exists(self.sal))
        self.assertIn("va de 1 a 40", self.err)

    def test_la_fecha_de_cada_uno_su_momento_y_las_variables_sugeridas(self):
        momento = {"momento": [{"i": 0, "nota": "Cae en Nochebuena: acompaña la reunión"}, {"i": 7, "nota": "fuera de rango"}],
                   "variables": [{"nombre": "El pulso del mundo al publicar", "que_mide": "La emoción que sube hoy por país.",
                                  "de_donde": "El Pulse de Triggui (Wikipedia y el tono de las noticias).",
                                  "como_cambia": "El horno elegiría entre los primeros aprobados el que sube un nivel."},
                                 {"nombre": "", "que_mide": "sin nombre"}, {"nombre": "Dos", "que_mide": "b", "de_donde": "c",
                                  "como_cambia": "d"}, {"nombre": "Tres", "que_mide": "b", "de_donde": "c", "como_cambia": "d"},
                                 {"nombre": "Cuatro", "que_mide": "b", "de_donde": "c", "como_cambia": "d"}]}
        juez = JuezFalso(JUICIOS, parecidos={"Libro B": ("Libro C", 0.7)}, momento=momento)
        self.correr(juez, respuestas={"Libro E": "si"}, cuantos=4)
        r = self.registro()
        # Hoy es martes 17 de noviembre y la lista tiene 1 título (el jueves 19): los nuevos salen del lunes 23 en adelante.
        self.assertEqual([c["sale"] for c in r["elegidos"]], ["2026-11-23", "2026-11-26", "2026-11-30", "2026-12-03"])
        self.assertEqual(r["elegidos"][0]["momento"], "Cae en Nochebuena: acompaña la reunión")
        self.assertEqual([v["nombre"] for v in r["variables"]], ["El pulso del mundo al publicar", "Dos"])   # 3 como mucho; sin nombre, fuera
        self.assertEqual(juez.momento_llamadas, 1)
        self.assertIn('"sale": "lun 23 nov (2026-11-23)"', juez.momento_usuario)
        md = self.leer("propuesta-adultos.md")
        self.assertIn("| Dónde | Sale | Por qué |", md)
        self.assertIn("| lun 23 nov<br><sub>📅 Cae en Nochebuena: acompaña la reunión</sub> |", md)
        self.assertIn("### 🧭 Para afinar la curaduría", md)
        self.assertIn("- **El pulso del mundo al publicar.** La emoción que sube hoy por país. Dato: El Pulse de Triggui", md)
        self.assertIn("- **Sale:** la fecha estimada, a dos por semana (lunes y jueves) después de 1 título que ya está en la lista", md)

    def test_si_el_momento_falla_la_propuesta_sale_sin_esa_parte(self):
        juez = JuezFalso(JUICIOS, momento_falla=True)
        codigo, _ = self.correr(juez, respuestas={"Libro E": "si"}, cuantos=2)
        self.assertEqual(codigo, 0)
        r = self.registro()
        self.assertEqual(r["variables"], [])
        self.assertTrue(any("No pude pedirle al juez el momento de cada fecha" in a for a in r["avisos"]), r["avisos"])
        md = self.leer("propuesta-adultos.md")
        self.assertNotIn("Para afinar la curaduría", md)
        self.assertNotIn("📅", md)

    def test_la_misma_entrada_da_la_misma_propuesta(self):
        self.correr(JuezFalso(JUICIOS, parecidos={"Libro B": ("Libro C", 0.7)}), respuestas={"Libro E": "si"}, cuantos=4)
        uno = self.leer("propuesta-adultos.md")
        self.guardar_marcas()
        self.correr(JuezFalso(JUICIOS, parecidos={"Libro B": ("Libro C", 0.7)}), respuestas={"Libro E": "si"}, cuantos=4)
        self.assertEqual(uno, self.leer("propuesta-adultos.md"))


class Salida(Base):
    def test_la_tabla_las_lineas_y_la_mencion(self):
        self.correr(JuezFalso(JUICIOS, parecidos={"Libro B": ("Libro C", 0.7)}), respuestas={"Libro E": "si"}, cuantos=4)
        md = self.leer("propuesta-adultos.md")
        self.assertIn("@badirnakid", md)
        self.assertIn("**Merge**", md)
        self.assertIn('<img src="https://img/a.jpg" width="56">', md)
        self.assertIn("En lugar de «Libro B», que no se consigue (parecido 0.70)", md)
        self.assertIn("| 1 | ", md)
        self.assertNotIn("Edad", md)
        self.assertNotIn("—", md)
        lineas = self.leer("lineas-adultos.txt").splitlines()
        self.assertTrue(lineas[0].startswith("# 🗳️ Propuesta del robot del 2026-11-17"))
        self.assertEqual(lineas[1:], ["Libro A | Ana Uno", "Libro E | Eva Cinco", "Libro C | Ceci Tres", "Libro D | Dani Cuatro"])

    def test_las_frases_de_como_se_eligio(self):
        self.correr(JuezFalso(JUICIOS, parecidos={"Libro B": ("Libro C", 0.7)}), respuestas={"Libro E": "si"}, cuantos=4)
        md = self.leer("propuesta-adultos.md")
        self.assertIn("- **Candidatos:** 9 del catálogo maestro; quedaron 5 al quitar 1 repetido en el catálogo, 1 que ya "
                      "está en la app, 1 que ya está en la lista y 1 de un autor que ya está en la app.", md)
        self.assertIn("- **Tiendas:** 1 revisado hoy en Casa del Libro y Gandhi; el resto, con su marca de menos de 25 días. "
                      "1 de los mejores no se conseguía; 1 entró en su lugar por parecido.", md)
        self.assertIn("libro real 15 (ISBN de la tienda 10 y portada 5)", md)
        self.assertIn("- **Orden:** por puntaje, sin dos seguidos del mismo ánimo mientras se pudo.", md)
        self.assertIn("**Libro A**<br>Ana Uno<br><sub>Un libro que ayuda.</sub>", md)
        self.assertIn("`descartados-adultos.txt`", md)
        self.assertNotIn("Erratas del catálogo", md)

    def test_las_frases_sin_revisiones_de_hoy(self):
        self.marcas["Libro E"] = marca("Libro E", "Eva Cinco", "gandhi", gandhi=True)
        self.guardar_marcas()
        codigo, rev = self.correr(JuezFalso(JUICIOS), cuantos=2)
        self.assertEqual(rev.vistos, [])
        md = self.leer("propuesta-adultos.md")
        self.assertIn("- **Tiendas:** con sus marcas de Casa del Libro y Gandhi de menos de 25 días; ninguno hizo falta "
                      "revisarlo hoy. 1 de los mejores no se conseguía.", md)

    def test_kids_lleva_edad_lo_delicado_y_sus_edades(self):
        escribir(os.path.join(self.app, "edades-kids.json"), json.dumps({"edades": {"viejo__autor": "6-8"}}))
        juicios = {"Cuento K1": juicio(mision=0.9, edad="6-8", estado="miedo", delicado="Una bruja da miedo."),
                   "Cuento K2": juicio(mision=0.8, edad="9-12", estado="serena"),
                   "Franquicia": juicio(mision=0.9, edad="3-5", apto=False),
                   "Cuento K3": juicio(mision=0.85, edad="", estado="ira")}
        codigo, _ = self.correr(JuezFalso(juicios), lista="kids", cuantos=4)
        self.assertEqual(codigo, 0)
        md = self.leer("propuesta-kids.md")
        self.assertIn("| Edad |", md)
        self.assertIn("Para saber antes: Una bruja da miedo.", md)
        titulos = [c["titulo"] for c in self.registro("kids")["elegidos"]]
        # K1 entra aunque Matilda (Roald Dahl) ya esté en la app; K2 no, porque es del mismo autor que K1 (uno por autor
        # en cada propuesta); la franquicia no es apta y K3 no trae edad.
        self.assertEqual(titulos, ["Cuento K1"])
        k1 = self.registro("kids")["elegidos"][0]
        self.assertEqual(k1["partes"]["libro_real"], 15)        # en Kids el ISBN vale los 15
        edades = json.loads(self.leer("edades-kids.json"))["edades"]
        self.assertEqual(edades, {"cuento k1__roald dahl": "6-8", "viejo__autor": "6-8"})

    def test_la_errata_solo_es_acento_o_letra(self):
        self.assertTrue(cu.errata("El Tercer Jesus", "El tercer Jesús"))                       # acento
        self.assertTrue(cu.errata("Deepak Shopra", "Deepak Chopra"))                            # una letra
        self.assertFalse(cu.errata("Good to great", "Good to Great"))                          # mayúsculas
        self.assertFalse(cu.errata("Cuerpos sin edad mentes sin tiempo", "Cuerpos sin edad, mentes sin tiempo"))
        self.assertFalse(cu.errata("The Creative Act", "El acto creativo"))                    # traducción
        self.assertFalse(cu.errata("Dejar ir", "Dejar ir: el camino de la entrega"))           # subtítulo
        self.assertFalse(cu.errata("Libro A", ""))
        self.assertFalse(cu.errata("Libro A", "Libro A"))
        self.assertTrue(cu.errata("Hermann Hese", "Hermann Hesse"))                            # palabra corta
        self.assertTrue(cu.errata("Homo Deux", "Homo Deus"))
        self.assertTrue(cu.errata("Tao Te Kin", "Tao Te King"))
        self.assertTrue(cu.errata("El arte de amra", "El arte de amar"))                      # dos letras al revés
        self.assertTrue(cu.errata("Elprincipito", "El principito"))                            # palabras pegadas
        self.assertFalse(cu.errata("El arte de amar", "El arte de la guerra"))

    def test_las_fechas_de_publicacion(self):
        martes = datetime.date(2026, 11, 17)
        self.assertEqual(cu.fechas_de_publicacion(martes, 9, 3),
                         [datetime.date(2026, 12, 21), datetime.date(2026, 12, 24), datetime.date(2026, 12, 28)])
        lunes = datetime.date(2026, 11, 23)   # un lunes: la de hoy ya salió a las 5 o 6 de la mañana
        self.assertEqual(cu.fechas_de_publicacion(lunes, 0, 2), [datetime.date(2026, 11, 26), datetime.date(2026, 11, 30)])
        self.assertEqual(cu.fecha_corta(datetime.date(2026, 12, 24), martes), "jue 24 dic")
        self.assertEqual(cu.fecha_corta(datetime.date(2027, 1, 4), martes), "lun 4 ene 2027")

    def test_el_recordatorio_de_la_propuesta_abierta(self):
        app = tempfile.mkdtemp()
        escribir(os.path.join(app, "lista-adultos.txt"), "# lista\nUno | A\nDos | B\nTres | C\n")
        martes = datetime.date(2026, 11, 17)
        texto = cu.recordatorio("adultos", app, martes)
        self.assertTrue(texto.startswith("@badirnakid, esta propuesta sigue esperando tu Merge."))
        self.assertIn("A la lista de adultos le quedan 3 títulos: alcanzan hasta el jue 26 nov", texto)
        escribir(os.path.join(app, "lista-kids.txt"), "# vacía\n")
        self.assertIn("La lista Kids está vacía: si no das Merge antes, el jue 19 nov no sale edición Kids.",
                      cu.recordatorio("kids", app, martes))
        escribir(os.path.join(app, "lista-kids.txt"), "Uno | A\n")
        self.assertIn("le quedan 1 título: alcanzan hasta el jue 19 nov", cu.recordatorio("kids", app, martes))

    def test_el_esquema_del_juez(self):
        self.assertEqual(cu.esquema("kids")["properties"]["libros"]["items"]["properties"]["edad"]["enum"], ["3-5", "6-8", "9-12"])
        req = cu.esquema("adultos")["properties"]["libros"]["items"]["required"]
        self.assertIn("titulo_bien", req)
        self.assertIn("autor_bien", req)
        self.assertEqual(cu.esquema("adultos")["properties"]["libros"]["items"]["properties"]["edad"], {"type": "string"})
        self.assertIn("NIÑ", cu.SISTEMA.format(perfil="Kids (niñas y niños de 3 a 12 años)", kids=cu.KIDS).upper())


class IaFalsa:
    """El módulo ia de ia/ia.py, con respuestas en orden: «» es lo que devuelve un rechazo de Claude."""

    def __init__(self, respuestas):
        self.respuestas, self.papeles = list(respuestas), []

    def chat(self, payload, timeout=0):
        self.papeles.append(payload["model"])
        return {"choices": [{"message": {"content": self.respuestas.pop(0) if self.respuestas else ""}}]}


class Juez(unittest.TestCase):
    """El envoltorio del juez de verdad (juez_ia), con ia/ia.py cambiado por un doble."""

    def setUp(self):
        self.antes = sys.modules.get("ia")

    def tearDown(self):
        if self.antes is None:
            sys.modules.pop("ia", None)
        else:
            sys.modules["ia"] = self.antes

    def llamar(self, respuestas):
        sys.modules["ia"] = falsa = IaFalsa(respuestas)
        avisos = []
        return cu.juez_ia("adultos", avisos), falsa, avisos

    def test_un_rechazo_vacio_es_falla_y_se_reintenta(self):
        llamar, falsa, avisos = self.llamar(["", json.dumps({"libros": []})])
        self.assertEqual(llamar("s", "u", cu.esquema("adultos"), 100), {"libros": []})
        self.assertEqual(falsa.papeles, ["grande", "grande"])
        self.assertEqual(avisos, [])

    def test_si_el_grande_no_responde_califica_el_mini_y_se_avisa(self):
        llamar, falsa, avisos = self.llamar(["", "{}", json.dumps({"libros": []})])
        self.assertEqual(llamar("s", "u", cu.esquema("adultos"), 100), {"libros": []})
        self.assertEqual(falsa.papeles, ["grande", "grande", "mini"])
        self.assertTrue(any("«mini»" in a for a in avisos), avisos)

    def test_tres_fallas_tiran_el_lote_con_su_aviso(self):
        llamar, falsa, avisos = self.llamar(["", "", ""])
        with self.assertRaises(RuntimeError):
            llamar("s", "u", cu.esquema("adultos"), 100)
        juicios = cu.juzgar("adultos", [{"titulo": "X", "autor": "Y", "clave": "x__y"}], [], llamar, avisos)
        self.assertEqual(juicios, {})
        self.assertTrue(any("no se calificó" in a for a in avisos), avisos)


class Flujo(unittest.TestCase):
    """El flujo .github/workflows/propuestas.yml: los martes y a mano, con su llave, un pull request por lista y el aviso a Badir."""

    @classmethod
    def setUpClass(cls):
        import yaml
        ruta = os.path.join(RAIZ, ".github", "workflows", "propuestas.yml")
        with open(ruta, encoding="utf-8") as f:
            cls.texto = f.read()
        cls.yml = yaml.safe_load(cls.texto)
        cls.on = cls.yml.get("on") or cls.yml.get(True)

    def test_los_martes_y_a_mano(self):
        # Go de Badir del 17 de noviembre de 2026, 18:50 (B438): martes 10:17 de la mañana, hora de México (UTC-6).
        self.assertEqual(self.on["schedule"], [{"cron": "17 16 * * 2"}])
        self.assertIn("workflow_dispatch", self.on)
        g = self.guion()
        self.assertIn('LISTA="${LISTA:-las dos}"', g)          # el horario no trae entradas
        self.assertIn('if [ "${FORZAR:-false}" = "true" ]', g)  # y sin forzar: solo si a la lista le quedan menos de 6

    def test_el_aviso_a_badir(self):
        g = self.guion()
        self.assertIn('--title "🗳️ Para autorizar: libros $nombre · $hoy"', g)
        self.assertIn('gh pr edit "$url" --add-assignee badirnakid', g)
        self.assertIn('gh pr edit "$url" --add-reviewer badirnakid', g)
        # Mientras siga abierta, el recordatorio con su mención (el texto lo arma curaduria.py --recordatorio).
        self.assertIn('scripts/curaduria.py --lista "$l" --app . --recordatorio', g)
        self.assertIn('gh pr comment "$numero" --body "$texto"', g)

    def test_permisos_y_llaves(self):
        self.assertEqual(self.yml["permissions"], {"contents": "write", "pull-requests": "write", "issues": "write"})
        self.assertIn("secrets.ANTHROPIC_API_KEY", self.texto)
        self.assertIn("secrets.CONTENT_REPO_TOKEN", self.texto)
        self.assertNotIn("OPENAI", self.texto)

    def pasos(self):
        return self.yml["jobs"]["proponer"]["steps"]

    def guion(self):
        return next(p["run"] for p in self.pasos() if "gh pr create" in str(p.get("run", "")))

    def test_un_pull_request_por_lista_y_no_dos_abiertos(self):
        g = self.guion()
        self.assertIn("scripts/curaduria.py", g)
        self.assertIn("gh pr create --base main --head \"$rama\"", g)
        # La propuesta abierta se reconoce por su rama (sin etiquetas: crearlas pide otro permiso).
        self.assertIn('rama="propuestas/$hoy-$l-$(date -u +%H%M)"', g)
        self.assertIn("gh pr list --state open --base main", g)
        self.assertIn('test(\\"^propuestas/.*-$l-[0-9]{4}\\$\\")', g)
        self.assertNotIn("gh label", g)
        self.assertNotIn("|| true)", g)   # si gh falla, la corrida se detiene: no abre una segunda propuesta

    def test_no_sube_tiendas_ni_contenido(self):
        contenido = next(p for p in self.pasos() if (p.get("with") or {}).get("repository") == "badirnakid/triggui-content")
        self.assertIs(contenido["with"]["persist-credentials"], False)
        g = self.guion()
        empujes = [l.strip() for l in g.splitlines() if "git push" in l]
        self.assertEqual(empujes, ['git push --quiet origin "$rama"'])
        self.assertNotIn("cd triggui-content", g)
        self.assertNotIn("-C triggui-content", g)

    def test_tiempo_y_registro(self):
        self.assertGreaterEqual(self.yml["jobs"]["proponer"]["timeout-minutes"], 120)
        registro = next(p for p in self.pasos() if "upload-artifact" in str(p.get("uses", "")))
        self.assertEqual(registro.get("if"), "always()")


if __name__ == "__main__":
    unittest.main(verbosity=1)
