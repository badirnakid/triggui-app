#!/usr/bin/env python3
"""Pruebas de las decisiones de Badir (scripts/decisiones.py, C492) y de su flujo, sin red: GitHub es un doble y git corre
contra un repositorio de origen local.

Correr:  python3 -I -B scripts/test_decisiones.py
"""
import datetime
import importlib.util
import json
import os
import shutil
import subprocess
import tempfile
import unittest

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
_spec = importlib.util.spec_from_file_location("decisiones", os.path.join(AQUI, "decisiones.py"))
de = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(de)
cu = de.cu

RAMA = "propuestas/2026-11-17-adultos-1017"
REPO = "badirnakid/triggui-app"
AHORA = datetime.datetime(2026, 11, 18, 3, 31, tzinfo=datetime.timezone.utc)   # martes 17, 21:31 en México
LIBROS = [("El hombre en busca de sentido", "Viktor E. Frankl", "tristeza", 91.0),
          ("El Alquimista", "Paulo Coelho", "apatia", 88.5),
          ("Juntos: El poder de la conexión humana", "Vivek H. Murthy", "miedo", 84.0),
          ("Open", "Andre Agassi", "ira", 80.0)]
SUGERIDAS = [{"nombre": "El pulso del mundo al publicar", "que_mide": "La emoción que sube hoy por país.",
              "de_donde": "El Pulse de Triggui.", "como_cambia": "El horno elegiría el que sube un nivel."},
             {"nombre": "Lectura breve", "que_mide": "Si se lee en una semana.", "de_donde": "El juez.",
              "como_cambia": "Subirían los cortos en diciembre."}]
CABEZA_LISTA = "# 📚 LISTA de adultos\n# comentario\nUno de antes | Alguien\nDos de antes | Otra\n"
CABEZA_DESC = "# 🚫 DESCARTADOS · lista de adultos\n# Una línea por libro.\n"


def elegido(titulo, autor, estado, total, n):
    return {"titulo": titulo, "autor": autor, "clave": cu.clave(titulo, autor), "portada": "",
            "juicio": {"estado": estado, "claridad": 0.8, "razon": "Mejora el ánimo.", "de_que_trata": "Trata de algo.",
                       "edad": "", "delicado": "", "variables": {}},
            "partes": {"mision": 36, "animo": 16, "libro_real": 10, "tienda": 15, "variedad": 9}, "total": total,
            "donde": "ambas", "sale": f"2026-12-{20 + n:02d}", "momento": "", "reemplaza": None}


RESUMEN = {"maestro": 100, "candidatos": 80, "excluidos": {}, "juzgados": 80, "validos": 40, "revisados_hoy": 0,
           "sin_respuesta": 0, "sin_revisar": 0, "no_se_consiguen": 0, "reemplazos": 0, "cuantos": 4, "tope_estado": 2,
           "en_lista": 2, "criterio": 0, "casos": 0}


def cuerpo_nuevo(fecha="2026-11-17", costo_usd=None):
    """Una descripción como la escribe hoy curaduria.py: casillas, tabla, variables y registro."""
    elegidos = [elegido(t, a, e, s, n) for n, (t, a, e, s) in enumerate(LIBROS, 1)]
    return cu.markdown("adultos", fecha, elegidos, RESUMEN, [], (), SUGERIDAS, (), costo_usd)


def sin_entran(cuerpo):
    """La descripción con la sección «¿Entran?» borrada (el registro se queda)."""
    a = cuerpo.index(de.ENTRAN)
    return cuerpo[:a] + cuerpo[cuerpo.index("| # |"):]


def cuerpo_viejo():
    """Una descripción como la del 17 de noviembre (#1): sin casillas ni registro."""
    filas = "\n".join(f"| {n} |  | **{t}**<br>{a}<br><sub>Trata.</sub> | **{s:g}**<br><sub>misión 36</sub> | "
                      f"{cu.NOMBRE_ESTADO[e]} (0.80) | Casa del Libro y Gandhi | lun {20 + n} dic | Mejora. |"
                      for n, (t, a, e, s) in enumerate(LIBROS, 1))
    return ("## 🗳️ Propuesta de libros · adultos · 2026-11-18\r\n\r\n@badirnakid, estos son los libros. Dale **Merge**.\r\n\r\n"
            "¿Quitar alguno? Pídeselo a una sesión de Claude («quita el 3 de la propuesta de adultos»): lo quita de "
            "`lista-adultos.txt` en este pull request y lo anota en `descartados-adultos.txt`.\r\n\r\n"
            "| # | Portada | Libro | Puntaje | Ánimo | Dónde | Sale | Por qué |\r\n|---|---|---|---|---|---|---|---|\r\n"
            + filas.replace("\n", "\r\n") + "\r\n\r\n### Cómo se eligió\r\n\r\n- **Candidatos:** muchos.\r\n\r\n"
            "### 🧭 Para afinar la curaduría\r\n\r\nIdeas del juez para medir mejor el momento, sin comprobar. Si quieres "
            "sumar una al puntaje, pídeselo a una sesión de Claude («suma la variable …»).\r\n\r\n"
            "- **El pulso del mundo al publicar.** La emoción que sube hoy por país. Dato: El Pulse de Triggui. "
            "Cambiaría: El horno elegiría el que sube un nivel.\r\n"
            "- **Lectura breve.** Si se lee en una semana. Dato: El juez. Cambiaría: Subirían los cortos.\r\n\r\n"
            "<sub>Lo armó el robot de propuestas (`scripts/curaduria.py`, C480).</sub>\r\n")


def lineas_de_libros():
    return [f"{t} | {a}" for t, a, _, _ in LIBROS]


def bloque_de_lista(fecha="2026-11-17"):
    return f"\n{cu.MARCA_PROPUESTA}{fecha}: entra con el Merge de Badir\n" + "".join(f"{l}\n" for l in lineas_de_libros())


def desmarcar(cuerpo, *numeros):
    for n in numeros:
        cuerpo = cuerpo.replace(f"- [x] {n} · ", f"- [ ] {n} · ")
    return cuerpo


def marcar_probar(cuerpo, nombre):
    return cuerpo.replace(f"- [ ] Probar «{nombre}»", f"- [x] Probar «{nombre}»")


class Lectura(unittest.TestCase):
    def test_las_casillas_de_libros_y_de_variables(self):
        cuerpo = desmarcar(marcar_probar(cuerpo_nuevo(), "Lectura breve"), 2).replace("\n", "\r\n")
        libros, probar = de.casillas(cuerpo)
        self.assertEqual(libros[1], (True, "El hombre en busca de sentido | Viktor E. Frankl"))
        self.assertEqual(libros[2], (False, "El Alquimista | Paulo Coelho"))
        self.assertEqual(sorted(libros), [1, 2, 3, 4])
        self.assertEqual(probar, {"El pulso del mundo al publicar": False, "Lectura breve": True})
        self.assertEqual(de.casillas("- [x] uno · sin número\n- [X] 7 · Siete | S\n* [x] 8 · Ocho | O"), ({7: (True, "Siete | S")}, {}))

    def test_la_ultima_marca_y_su_bloque(self):
        texto = CABEZA_LISTA + bloque_de_lista("2026-11-10") + bloque_de_lista()
        marca, lineas = de.ultima_marca(texto)
        self.assertEqual(marca, f"{cu.MARCA_PROPUESTA}2026-11-17: entra con el Merge de Badir")
        self.assertEqual(lineas, lineas_de_libros())
        self.assertEqual(de.ultima_marca(CABEZA_LISTA), ("", []))

    def test_los_libros_del_registro_de_las_casillas_o_de_la_rama(self):
        cuerpo = cuerpo_nuevo()
        reg = cu.leer_registro(cuerpo)
        libros, marca, ignoradas = de.libros_de(reg, cuerpo, "", "", 1)
        self.assertEqual(libros, list(enumerate(lineas_de_libros(), 1)))
        self.assertEqual(marca, f"{cu.MARCA_PROPUESTA}2026-11-17: entra con el Merge de Badir")
        # Sin registro: solo las casillas cuya línea ya es de la propuesta.
        lista = CABEZA_LISTA + bloque_de_lista()
        falso = cuerpo + "\n- [x] 9 · Un libro inventado | Nadie\n"
        libros, _, ignoradas = de.libros_de(None, falso, lista, "", 1)
        self.assertEqual([n for n, _ in libros], [1, 2, 3, 4])
        self.assertEqual(ignoradas, [(9, "Un libro inventado | Nadie")])
        # Lo quitado (en su bloque de descartados) sigue siendo de la propuesta.
        lista_sin_2 = lista.replace("El Alquimista | Paulo Coelho\n", "")
        desc = de.poner_quitados(CABEZA_DESC, 1, "2026-11-17", ["El Alquimista | Paulo Coelho"])
        libros, _, ignoradas = de.libros_de(None, cuerpo, lista_sin_2, desc, 1)
        self.assertEqual([n for n, _ in libros], [1, 2, 3, 4])
        # Sin registro ni casillas (de antes de las palomitas): las líneas de su bloque.
        libros, _, _ = de.libros_de(None, cuerpo_viejo(), lista, "", 1)
        self.assertEqual(libros, list(enumerate(lineas_de_libros(), 1)))

    def test_lo_que_dicen_las_palomitas(self):
        libros = list(enumerate(lineas_de_libros(), 1))
        cuerpo = desmarcar(cuerpo_nuevo(), 2).replace("- [x] 4 · Open | Andre Agassi\n", "")
        estado = de.decidir(libros, cuerpo)
        self.assertEqual(list(estado.values()), ["entra", "quitado", "entra", "fuera"])
        self.assertEqual(set(de.decidir(libros, cuerpo_viejo(), sin_casillas_entran=True).values()), {"entra"})
        self.assertEqual(set(de.decidir(libros, cuerpo_viejo()).values()), {"fuera"})

    def test_los_datos_de_la_tabla_vieja(self):
        datos = de.datos_de_la_tabla(cuerpo_viejo(), "adultos")
        self.assertEqual(datos[1], {"titulo": "El hombre en busca de sentido", "total": 91.0, "estado": "tristeza", "edad": ""})
        self.assertEqual(datos[2]["total"], 88.5)
        kids = "| 1 | <img src=\"https://x\" width=\"56\"> | **El patito feo**<br>Andersen | 6-8 | **77**<br><sub>m</sub> | apatía (0.70) | Gandhi | x | y |"
        self.assertEqual(de.datos_de_la_tabla(kids, "kids"), {1: {"titulo": "El patito feo", "total": 77.0, "estado": "apatia", "edad": "6-8"}})


class Archivos(unittest.TestCase):
    def test_el_bloque_de_la_lista_queda_como_las_palomitas(self):
        texto = CABEZA_LISTA + bloque_de_lista()
        marca, _ = de.ultima_marca(texto)
        permitidas = set(lineas_de_libros())
        nuevo, antes = de.poner_bloque_de_lista(texto, marca, permitidas, [lineas_de_libros()[0], lineas_de_libros()[3]])
        self.assertEqual(antes, lineas_de_libros())
        self.assertTrue(nuevo.startswith(CABEZA_LISTA))
        self.assertTrue(nuevo.endswith(f"{marca}\nEl hombre en busca de sentido | Viktor E. Frankl\nOpen | Andre Agassi\n"))
        vuelve, antes = de.poner_bloque_de_lista(nuevo, marca, permitidas, lineas_de_libros())
        self.assertEqual(vuelve, texto)
        vacio, _ = de.poner_bloque_de_lista(texto, marca, permitidas, [])
        self.assertTrue(vacio.endswith(f"{marca}\n"))
        self.assertIn("Dos de antes | Otra", vacio)

    def test_no_toca_un_bloque_con_lineas_ajenas_ni_sin_marca(self):
        texto = CABEZA_LISTA + bloque_de_lista() + "Uno que agregó alguien | A mano\n"
        marca, _ = de.ultima_marca(texto)
        self.assertEqual(de.poner_bloque_de_lista(texto, marca, set(lineas_de_libros()), []), (texto, None))
        self.assertEqual(de.poner_bloque_de_lista(CABEZA_LISTA, marca, set(lineas_de_libros()), []), (CABEZA_LISTA, None))
        self.assertEqual(de.poner_bloque_de_lista(CABEZA_LISTA + "\n\n", "", set(), []), (CABEZA_LISTA + "\n\n", None))

    def test_el_bloque_de_quitados(self):
        uno = de.poner_quitados(CABEZA_DESC, 1, "2026-11-17", ["El Alquimista | Paulo Coelho"])
        self.assertEqual(uno, CABEZA_DESC + "\n# 🗳️ Quitados de la propuesta #1 (2026-11-17)\nEl Alquimista | Paulo Coelho\n")
        dos = de.poner_quitados(uno, 1, "2026-11-17", ["El Alquimista | Paulo Coelho", "Open | Andre Agassi"])
        self.assertEqual(dos.count("Quitados de la propuesta #1"), 1)
        self.assertTrue(dos.endswith("El Alquimista | Paulo Coelho\nOpen | Andre Agassi\n"))
        self.assertEqual(de.poner_quitados(dos, 1, "2026-11-17", []), CABEZA_DESC)
        # La #10 no es la #1, y lo que ya estaba descartado fuera del bloque no se repite.
        diez = de.poner_quitados(uno, 10, "2026-11-20", ["Otro | O"])
        self.assertEqual(de.poner_quitados(diez, 1, "2026-11-17", []), CABEZA_DESC + "\n# 🗳️ Quitados de la propuesta #10 (2026-11-20)\nOtro | O\n")
        ya = CABEZA_DESC + "Open | Andre Agassi\n"
        self.assertEqual(de.poner_quitados(ya, 1, "2026-11-17", ["Open | Andre Agassi"]), ya)
        self.assertEqual(de.poner_quitados("", 1, "2026-11-17", ["X | Y"]), "# 🗳️ Quitados de la propuesta #1 (2026-11-17)\nX | Y\n")
        self.assertEqual(de.poner_quitados("", 1, "2026-11-17", []), "")
        self.assertEqual(de.poner_quitados("sin salto", 1, "f", []), "sin salto\n")

    def test_las_variables_quedan_a_prueba(self):
        texto, agregadas = de.agregar_variables(None, SUGERIDAS, "2026-11-18", 1)
        datos = json.loads(texto)
        self.assertEqual(agregadas, ["El pulso del mundo al publicar", "Lectura breve"])
        self.assertEqual(datos["variables"][0]["id"], "el_pulso_del_mundo_al_publicar")
        self.assertEqual(datos["variables"][0]["estado"], "a prueba")
        self.assertEqual(datos["variables"][0]["fuente"], "propuesta #1: palomita de Badir")
        self.assertIn("_nota", datos)
        # Lo que ya está no se repite; un id tomado lleva su número; lo leen las propuestas.
        otra = [{"nombre": "Lectura breve"}, {"nombre": "Lectura  BREVE!"}, {"nombre": "Lectura breve 2", "que_mide": "x"}]
        datos["variables"].append({"id": "lectura_breve_2", "nombre": "Otra cosa", "estado": "a prueba", "que_mide": "y"})
        texto2, agregadas2 = de.agregar_variables(json.dumps(datos), otra, "2026-11-19", 3)
        self.assertEqual(agregadas2, ["Lectura breve 2"])
        reservada, _ = de.agregar_variables(None, [{"nombre": "Variedad", "que_mide": "x"}], "2026-11-19", 3)
        self.assertEqual(json.loads(reservada)["variables"][0]["id"], "variedad_2")   # nunca pisa una parte del puntaje
        self.assertEqual(json.loads(texto2)["variables"][-1]["id"], "lectura_breve_2_2")
        tmp = tempfile.mkdtemp()
        os.makedirs(os.path.join(tmp, "curaduria"))
        with open(os.path.join(tmp, cu.VARIABLES), "w", encoding="utf-8") as f:
            f.write(texto2)
        en_juego, aviso = cu.leer_variables(tmp)
        self.assertEqual([v["id"] for v in en_juego], ["el_pulso_del_mundo_al_publicar", "lectura_breve", "lectura_breve_2",
                                                        "lectura_breve_2_2"])
        shutil.rmtree(tmp)
        with self.assertRaises(de.Fallo):
            de.agregar_variables("{roto", SUGERIDAS, "2026-11-18", 1)
        with self.assertRaises(de.Fallo):
            de.agregar_variables("[]", SUGERIDAS, "2026-11-18", 1)

    def test_la_bitacora_no_duplica_ni_borra(self):
        uno = de.poner_en_bitacora(None, {"pr": 1, "a": 1})
        dos = de.poner_en_bitacora(uno + "{roto\n", {"pr": 2, "a": 2})
        tres = de.poner_en_bitacora(dos, {"pr": 1, "a": 3})
        lineas = tres.splitlines()
        self.assertEqual(lineas[0], "{roto")
        self.assertEqual([json.loads(l) for l in lineas[1:]], [{"pr": 2, "a": 2}, {"pr": 1, "a": 3}])

    def test_las_palomitas_en_una_propuesta_vieja(self):
        libros = list(enumerate(lineas_de_libros(), 1))
        reg = {"v": 1, "lista": "adultos", "fecha": "2026-11-18", "marca": "m", "libros": [{"n": 1, "linea": "x"}]}
        nuevo = de.con_palomitas(cuerpo_viejo(), "adultos", libros, reg)
        self.assertNotIn("\r", nuevo)
        self.assertNotIn("¿Quitar alguno?", nuevo)
        self.assertNotIn("pídeselo a una sesión", nuevo.lower())
        self.assertLess(nuevo.index(de.ENTRAN), nuevo.index("| # |"))
        self.assertIn("- [x] 4 · Open | Andre Agassi\n\n| # |", nuevo)
        self.assertIn("- [ ] Probar «El pulso del mundo al publicar» · La emoción que sube hoy por país. Dato: El Pulse de "
                      "Triggui. Cambiaría: El horno elegiría el que sube un nivel.", nuevo)
        self.assertIn(cu.TEXTO_PROBAR, nuevo)
        self.assertEqual([v["nombre"] for v in reg["variables"]], ["El pulso del mundo al publicar", "Lectura breve"])
        self.assertEqual(cu.leer_registro(nuevo)["variables"][1]["como_cambia"], "Subirían los cortos.")
        libros_leidos, probar = de.casillas(nuevo)
        self.assertEqual([t for _, (_, t) in sorted(libros_leidos.items())], lineas_de_libros())
        self.assertEqual(set(probar), {"El pulso del mundo al publicar", "Lectura breve"})


class GitHubFalso:
    def __init__(self, prs, comentarios=None):
        self.prs, self.coms, self.repo = prs, comentarios or {}, REPO
        self.comentados, self.cuerpos = [], []

    def pr(self, n):
        return dict(self.prs[n])

    def comentarios(self, n):
        return list(self.coms.get(n, []))

    def editar_cuerpo(self, n, cuerpo):
        self.prs[n]["body"] = cuerpo
        self.cuerpos.append((n, cuerpo))

    def comentar(self, n, texto):
        self.comentados.append((n, texto))


def git(cwd, *args):
    return subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True).stdout


class ConGit(unittest.TestCase):
    """De punta a punta: un origen local con main y una rama de propuesta, y la copia del flujo."""

    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.origen = os.path.join(self.tmp, "origen.git")
        git(self.tmp, "init", "--quiet", "--bare", "--initial-branch=main", self.origen)
        self.trabajo = self.clonar("trabajo")
        self.escribir(self.trabajo, cu.LISTAS["adultos"], CABEZA_LISTA)
        self.escribir(self.trabajo, cu.DESCARTADOS["adultos"], CABEZA_DESC)
        git(self.trabajo, "add", "-A")
        git(self.trabajo, "commit", "--quiet", "-m", "main")
        git(self.trabajo, "push", "--quiet", "origin", "HEAD:refs/heads/main")
        git(self.trabajo, "switch", "--quiet", "-c", RAMA)
        self.escribir(self.trabajo, cu.LISTAS["adultos"], CABEZA_LISTA + bloque_de_lista())
        git(self.trabajo, "commit", "--quiet", "-am", "propuesta")
        git(self.trabajo, "push", "--quiet", "origin", f"HEAD:refs/heads/{RAMA}", "HEAD:refs/pull/1/head")
        self.flujo = self.clonar("flujo")
        self.repo = de.Repo(self.flujo)
        self.gh = GitHubFalso({1: {"number": 1, "state": "OPEN", "body": cuerpo_nuevo(), "headRefName": RAMA,
                                   "baseRefName": "main", "mergedAt": None, "closedAt": None,
                                   "autor": "github-actions[bot]", "repo_cabeza": REPO}})

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def clonar(self, nombre):
        ruta = os.path.join(self.tmp, nombre)
        git(self.tmp, "clone", "--quiet", self.origen, ruta)
        git(ruta, "config", "user.name", "Prueba")
        git(ruta, "config", "user.email", "prueba@triggui.com")
        return ruta

    def escribir(self, raiz, ruta, texto):
        with open(os.path.join(raiz, ruta), "w", encoding="utf-8") as f:
            f.write(texto)

    def en_origen(self, ref, ruta):
        p = subprocess.run(["git", "show", f"{ref}:{ruta}"], cwd=self.origen, capture_output=True, text=True)
        return p.stdout if p.returncode == 0 else None

    def commits(self, ref):
        return int(git(self.origen, "rev-list", "--count", ref).strip())

    def unir(self, cuerpo):
        """Badir da Merge con lo que tenga la rama en ese momento."""
        git(self.trabajo, "fetch", "--quiet", "origin")
        git(self.trabajo, "switch", "--quiet", "main")
        git(self.trabajo, "reset", "--quiet", "--hard", "origin/main")
        git(self.trabajo, "merge", "--quiet", "--no-ff", f"origin/{RAMA}", "-m", "Merge pull request #1")
        git(self.trabajo, "push", "--quiet", "origin", "HEAD:refs/heads/main", f"origin/{RAMA}:refs/pull/1/head")
        self.gh.prs[1].update(state="MERGED", body=cuerpo, mergedAt="2026-11-18T03:30:00Z", closedAt="2026-11-18T03:30:00Z")

    def horno_publica(self, linea):
        """El horno publica un libro de main: quita su línea de la lista (job consumir de triggui.yml)."""
        git(self.trabajo, "fetch", "--quiet", "origin")
        git(self.trabajo, "switch", "--quiet", "main")
        git(self.trabajo, "reset", "--quiet", "--hard", "origin/main")
        ruta = os.path.join(self.trabajo, cu.LISTAS["adultos"])
        with open(ruta, encoding="utf-8") as f:
            texto = f.read()
        self.escribir(self.trabajo, cu.LISTAS["adultos"], texto.replace(linea + "\n", "", 1))
        git(self.trabajo, "commit", "--quiet", "-am", f"publicado {linea}")
        git(self.trabajo, "push", "--quiet", "origin", "HEAD:refs/heads/main")

    def test_quitar_y_volver_a_poner_una_palomita(self):
        self.gh.prs[1]["body"] = desmarcar(cuerpo_nuevo(), 2)
        texto = de.revisar(self.gh, self.repo, 1, AHORA)
        lista = self.en_origen(RAMA, cu.LISTAS["adultos"])
        self.assertNotIn("El Alquimista", lista)
        self.assertTrue(lista.startswith(CABEZA_LISTA))
        desc = self.en_origen(RAMA, cu.DESCARTADOS["adultos"])
        self.assertEqual(desc, CABEZA_DESC + "\n# 🗳️ Quitados de la propuesta #1 (2026-11-17)\nEl Alquimista | Paulo Coelho\n")
        self.assertEqual(self.gh.comentados, [(1, texto)])
        self.assertIn("Quité de la propuesta «El Alquimista | Paulo Coelho» y lo anoté en `descartados-adultos.txt`", texto)
        self.assertEqual(self.en_origen("main", cu.LISTAS["adultos"]), CABEZA_LISTA)   # main no se toca
        # Otra vez lo mismo: nada que cambiar, ni commit ni comentario.
        antes = self.commits(RAMA)
        de.revisar(self.gh, self.repo, 1, AHORA)
        self.assertEqual(self.commits(RAMA), antes)
        self.assertEqual(len(self.gh.comentados), 1)
        # Vuelve a ponerle su palomita: regresa a su lugar y sale de los descartados.
        self.gh.prs[1]["body"] = cuerpo_nuevo()
        texto = de.revisar(self.gh, self.repo, 1, AHORA)
        self.assertEqual(self.en_origen(RAMA, cu.LISTAS["adultos"]), CABEZA_LISTA + bloque_de_lista())
        self.assertEqual(self.en_origen(RAMA, cu.DESCARTADOS["adultos"]), CABEZA_DESC)
        self.assertEqual(texto, "Volví a poner «El Alquimista | Paulo Coelho» en la propuesta, en su lugar.")

    def test_una_linea_ajena_en_el_bloque_no_se_toca(self):
        git(self.trabajo, "switch", "--quiet", RAMA)
        self.escribir(self.trabajo, cu.LISTAS["adultos"], CABEZA_LISTA + bloque_de_lista() + "A mano | Alguien\n")
        git(self.trabajo, "commit", "--quiet", "-am", "a mano")
        git(self.trabajo, "push", "--quiet", "origin", f"HEAD:refs/heads/{RAMA}")
        self.gh.prs[1]["body"] = desmarcar(cuerpo_nuevo(), 4)
        antes = self.commits(RAMA)
        texto = de.revisar(self.gh, self.repo, 1, AHORA)
        self.assertEqual(self.commits(RAMA), antes)          # ni la lista ni los descartados: nada a medias
        self.assertIn("A mano | Alguien", self.en_origen(RAMA, cu.LISTAS["adultos"]))
        self.assertIn("Open | Andre Agassi", self.en_origen(RAMA, cu.LISTAS["adultos"]))
        self.assertEqual(self.en_origen(RAMA, cu.DESCARTADOS["adultos"]), CABEZA_DESC)
        self.assertIn("No cambié nada: en `lista-adultos.txt` no encontré los libros de esta propuesta", texto)
        # Si así le da Merge, la decisión se anota, la corrida queda en rojo y se le avisa.
        self.unir(desmarcar(cuerpo_nuevo(), 4))
        with self.assertRaises(de.Fallo) as fallo:
            de.cerrar(self.gh, self.repo, 1, AHORA)
        self.assertIn("Ojo: no encontré en main los libros de esta propuesta", str(fallo.exception))
        self.assertEqual(json.loads(self.en_origen("main", cu.DECISIONES))["libros"][3]["decision"], "quitado")
        self.assertIn("Open | Andre Agassi", self.en_origen("main", cu.LISTAS["adultos"]))
        self.assertEqual(self.gh.comentados[-1][1], str(fallo.exception))

    def test_cerrar_con_merge_anota_corrige_main_y_pone_variables(self):
        self.gh.prs[1]["body"] = desmarcar(cuerpo_nuevo(), 2)
        de.revisar(self.gh, self.repo, 1, AHORA)
        # Badir quita también el 3 y pone a prueba una variable, y da Merge antes de que «revisar» termine.
        final = marcar_probar(desmarcar(cuerpo_nuevo(), 2, 3), "Lectura breve")
        self.unir(final)
        self.gh.coms[1] = [("badirnakid", "Quité El Alquimista:\n  ya lo leyó todo el mundo."), ("github-actions[bot]", "yo no"),
                           ("otra-persona", "tampoco"), ("badirnakid", "   ")]
        antes = self.commits("main")
        texto = de.cerrar(self.gh, self.repo, 1, AHORA)
        self.assertEqual(self.commits("main"), antes + 1)   # un solo commit
        lista = self.en_origen("main", cu.LISTAS["adultos"])
        self.assertNotIn("El Alquimista", lista)
        self.assertNotIn("Juntos", lista)
        self.assertTrue(lista.endswith("El hombre en busca de sentido | Viktor E. Frankl\nOpen | Andre Agassi\n"))
        desc = self.en_origen("main", cu.DESCARTADOS["adultos"])
        self.assertTrue(desc.endswith("# 🗳️ Quitados de la propuesta #1 (2026-11-17)\nEl Alquimista | Paulo Coelho\n"
                                      "Juntos: El poder de la conexión humana | Vivek H. Murthy\n"))
        entrada = json.loads(self.en_origen("main", cu.DECISIONES))
        self.assertEqual((entrada["pr"], entrada["lista"], entrada["resultado"], entrada["cerrada"]), (1, "adultos", "merge", "2026-11-17"))
        self.assertEqual([l["decision"] for l in entrada["libros"]], ["entró", "quitado", "quitado", "entró"])
        self.assertEqual(entrada["libros"][0]["total"], 91.0)
        self.assertEqual(entrada["comentarios"], ["Quité El Alquimista: ya lo leyó todo el mundo."])
        self.assertEqual(entrada["variables_marcadas"], ["Lectura breve"])
        variables = json.loads(self.en_origen("main", cu.VARIABLES))["variables"]
        self.assertEqual([(v["id"], v["estado"]) for v in variables], [("lectura_breve", "a prueba")])
        self.assertIn("entraron 2 y quitaste «El Alquimista | Paulo Coelho» y «Juntos: El poder de la conexión humana | "
                      "Vivek H. Murthy», que quedaron en `descartados-adultos.txt`.", texto)
        self.assertIn("Guardé 1 comentario tuyo como tu porqué.", texto)
        self.assertIn("«Lectura breve» queda a prueba", texto)
        # Lo que el juez va a leer en la próxima propuesta.
        tmp = self.clonar("lectura")
        casos = cu.leer_casos(tmp, "adultos")
        self.assertEqual(casos, ["Aprobó «El hombre en busca de sentido | Viktor E. Frankl» (propuesta #1).",
                                 "Quitó «El Alquimista | Paulo Coelho» (propuesta #1).",
                                 "Quitó «Juntos: El poder de la conexión humana | Vivek H. Murthy» (propuesta #1).",
                                 "Aprobó «Open | Andre Agassi» (propuesta #1).",
                                 "Comentó en la propuesta #1: «Quité El Alquimista: ya lo leyó todo el mundo.»"])
        self.assertEqual([v["nombre"] for v in cu.leer_variables(tmp)[0]], ["Lectura breve"])
        # Cerrar dos veces no duplica la bitácora ni cambia nada más.
        antes = self.commits("main")
        de.cerrar(self.gh, self.repo, 1, AHORA)
        self.assertEqual(self.commits("main"), antes)
        self.assertEqual(len(self.en_origen("main", cu.DECISIONES).splitlines()), 1)

    def test_cerrar_otra_vez_no_regresa_lo_que_el_horno_publico(self):
        self.unir(cuerpo_nuevo(costo_usd=1.1))
        de.cerrar(self.gh, self.repo, 1, AHORA)
        self.assertEqual(json.loads(self.en_origen("main", cu.DECISIONES))["costo_usd"], 1.1)
        frankl = lineas_de_libros()[0]
        self.horno_publica(frankl)
        antes = self.commits("main")
        de.cerrar(self.gh, self.repo, 1, AHORA)   # alguien la vuelve a correr a mano días después
        self.assertEqual(self.commits("main"), antes)
        self.assertNotIn(frankl, self.en_origen("main", cu.LISTAS["adultos"]))
        # Y si después le quita la palomita a lo ya publicado: se anota, pero no se descarta ni se toca nada.
        self.gh.prs[1]["body"] = desmarcar(cuerpo_nuevo(costo_usd=1.1), 1)
        texto = de.revisar(self.gh, self.repo, 1, AHORA)
        self.assertIn("«El hombre en busca de sentido | Viktor E. Frankl» ya no estaba en la lista (ya se publicó o alguien "
                      "lo quitó): no lo toqué.", texto)
        self.assertEqual(self.en_origen("main", cu.DESCARTADOS["adultos"]), CABEZA_DESC)
        self.assertEqual(json.loads(self.en_origen("main", cu.DECISIONES))["libros"][0]["decision"], "quitado")
        # Ni volviéndosela a poner regresa: lo publicado no vuelve a la lista.
        self.gh.prs[1]["body"] = cuerpo_nuevo(costo_usd=1.1)
        de.revisar(self.gh, self.repo, 1, AHORA)
        self.assertNotIn(frankl, self.en_origen("main", cu.LISTAS["adultos"]))

    def test_quitar_y_poner_despues_del_merge(self):
        self.unir(cuerpo_nuevo())
        de.cerrar(self.gh, self.repo, 1, AHORA)
        comentarios = len(self.gh.comentados)
        self.assertIn("ya está cerrada", de.revisar(self.gh, self.repo, 1, AHORA))   # nada cambió: no contesta
        self.assertEqual(len(self.gh.comentados), comentarios)
        self.gh.prs[1]["body"] = desmarcar(cuerpo_nuevo(), 4)
        texto = de.revisar(self.gh, self.repo, 1, AHORA)
        self.assertNotIn("Open | Andre Agassi", self.en_origen("main", cu.LISTAS["adultos"]))
        self.assertTrue(self.en_origen("main", cu.DESCARTADOS["adultos"]).endswith("#1 (2026-11-17)\nOpen | Andre Agassi\n"))
        self.assertEqual(json.loads(self.en_origen("main", cu.DECISIONES))["libros"][3]["decision"], "quitado")
        self.assertIn("entraron 3 y quitaste «Open | Andre Agassi», que quedó en `descartados-adultos.txt`.", texto)
        self.gh.prs[1]["body"] = cuerpo_nuevo()
        texto = de.revisar(self.gh, self.repo, 1, AHORA)
        self.assertEqual(self.en_origen("main", cu.LISTAS["adultos"]), CABEZA_LISTA + bloque_de_lista())
        self.assertEqual(self.en_origen("main", cu.DESCARTADOS["adultos"]), CABEZA_DESC)
        self.assertIn("Volví a poner «Open | Andre Agassi» en la lista, en su lugar.", texto)

    def test_si_se_borran_todas_las_palomitas_no_se_adivina(self):
        self.gh.prs[1]["body"] = sin_entran(desmarcar(cuerpo_nuevo(), 2))
        antes = self.commits(RAMA)
        texto = de.revisar(self.gh, self.repo, 1, AHORA)
        self.assertEqual(self.commits(RAMA), antes)
        self.assertIn("La descripción ya no trae las palomitas de «¿Entran?»: no toqué la propuesta.", texto)
        with self.assertRaises(de.Fallo):
            de.palomitas(self.gh, self.repo, 1, AHORA)   # ya tuvo palomitas: no se las pone a ciegas
        self.unir(self.gh.prs[1]["body"])
        texto = de.cerrar(self.gh, self.repo, 1, AHORA)
        self.assertEqual(self.en_origen("main", cu.LISTAS["adultos"]), CABEZA_LISTA + bloque_de_lista())
        self.assertEqual(self.en_origen("main", cu.DESCARTADOS["adultos"]), CABEZA_DESC)
        entrada = json.loads(self.en_origen("main", cu.DECISIONES))
        self.assertTrue(entrada["palomitas_borradas"])
        self.assertEqual([l["decision"] for l in entrada["libros"]], ["entró"] * 4)   # lo que de verdad entró a main
        self.assertIn("no toqué la lista ni los descartados", texto)

    def test_cerrar_con_una_casilla_borrada(self):
        self.unir(cuerpo_nuevo().replace("- [x] 2 · El Alquimista | Paulo Coelho\n", ""))
        texto = de.cerrar(self.gh, self.repo, 1, AHORA)
        self.assertNotIn("El Alquimista", self.en_origen("main", cu.LISTAS["adultos"]))
        self.assertEqual(self.en_origen("main", cu.DESCARTADOS["adultos"]), CABEZA_DESC)
        self.assertEqual(json.loads(self.en_origen("main", cu.DECISIONES))["libros"][1]["decision"], "fuera")
        self.assertIn("«El Alquimista | Paulo Coelho» ya no tenía casilla en la descripción: no entró y tampoco lo descarté.", texto)

    def test_cerrar_sin_merge(self):
        self.gh.prs[1].update(state="CLOSED", body=desmarcar(cuerpo_nuevo(), 4), closedAt="2026-11-19T18:00:00Z")
        texto = de.cerrar(self.gh, self.repo, 1, AHORA)
        self.assertEqual(self.en_origen("main", cu.LISTAS["adultos"]), CABEZA_LISTA)   # nada entra a la lista
        self.assertTrue(self.en_origen("main", cu.DESCARTADOS["adultos"]).endswith("#1 (2026-11-17)\nOpen | Andre Agassi\n"))
        entrada = json.loads(self.en_origen("main", cu.DECISIONES))
        self.assertEqual(entrada["resultado"], "cerrada sin merge")
        self.assertEqual([l["decision"] for l in entrada["libros"]], ["no entró", "no entró", "no entró", "quitado"])
        self.assertIsNone(self.en_origen("main", cu.VARIABLES))
        self.assertIn("cerraste la propuesta sin Merge, así que no entró ningún libro y quitaste «Open | Andre Agassi»", texto)

    def test_cerrar_una_propuesta_de_antes_de_las_palomitas(self):
        self.unir(cuerpo_viejo())
        texto = de.cerrar(self.gh, self.repo, 1, AHORA)
        entrada = json.loads(self.en_origen("main", cu.DECISIONES))
        self.assertTrue(entrada["sin_palomitas"])
        self.assertEqual(entrada["propuesta"], "2026-11-17")
        self.assertEqual([l["decision"] for l in entrada["libros"]], ["entró"] * 4)
        self.assertEqual(entrada["libros"][1]["total"], 88.5)        # de su tabla
        self.assertEqual(entrada["libros"][1]["estado"], "apatia")
        self.assertEqual(self.en_origen("main", cu.LISTAS["adultos"]), CABEZA_LISTA + bloque_de_lista())
        self.assertIn("Esta propuesta es de antes de las palomitas", texto)

    def test_poner_palomitas_a_una_propuesta_vieja_y_usarlas(self):
        self.gh.prs[1]["body"] = cuerpo_viejo()
        texto = de.palomitas(self.gh, self.repo, 1, AHORA)
        self.assertIn("Le puse palomitas a esta propuesta", texto)
        nuevo = self.gh.prs[1]["body"]
        reg = cu.leer_registro(nuevo)
        self.assertEqual([l["linea"] for l in reg["libros"]], lineas_de_libros())
        self.assertEqual(reg["marca"], f"{cu.MARCA_PROPUESTA}2026-11-17: entra con el Merge de Badir")
        self.assertEqual(reg["libros"][2]["estado"], "miedo")
        self.assertEqual(de.palomitas(self.gh, self.repo, 1, AHORA), "La #1 ya tiene sus palomitas.")
        self.assertEqual(len(self.gh.cuerpos), 1)
        self.gh.prs[1]["body"] = desmarcar(nuevo, 1)
        de.revisar(self.gh, self.repo, 1, AHORA)
        self.assertNotIn("El hombre en busca de sentido", self.en_origen(RAMA, cu.LISTAS["adultos"]))

    def test_si_la_tabla_no_cuadra_no_pone_palomitas(self):
        self.gh.prs[1]["body"] = cuerpo_viejo().replace("**Open**", "**Otro libro**")
        with self.assertRaises(de.Fallo):
            de.palomitas(self.gh, self.repo, 1, AHORA)
        self.assertEqual(self.gh.cuerpos, [])

    def test_lo_que_no_es_propuesta_o_no_toca(self):
        for campo, valor in (("headRefName", "otra-rama"), ("autor", "badirnakid"), ("repo_cabeza", "otro/repo"),
                             ("baseRefName", "otra")):
            original = self.gh.prs[1][campo]
            self.gh.prs[1][campo] = valor
            with self.assertRaises(de.Fallo):
                de.revisar(self.gh, self.repo, 1, AHORA)
            self.gh.prs[1][campo] = original
        with self.assertRaises(de.Fallo):
            de.cerrar(self.gh, self.repo, 1, AHORA)          # sigue abierta
        self.gh.prs[1]["state"] = "CLOSED"
        with self.assertRaises(de.Fallo):
            de.palomitas(self.gh, self.repo, 1, AHORA)
        self.gh.prs[1].update(state="OPEN", body=cuerpo_viejo())
        self.assertIn("no tiene palomitas", de.revisar(self.gh, self.repo, 1, AHORA))
        self.assertEqual(self.gh.comentados, [])

    def test_si_alguien_sube_en_medio_se_vuelve_a_calcular(self):
        llamadas = []
        real = self.repo.leer

        def calcular(leer):
            llamadas.append(1)
            if len(llamadas) == 1:   # mientras calcula, otro sube a main
                self.escribir(self.trabajo, "otro.txt", "otro\n")
                git(self.trabajo, "switch", "--quiet", "main")
                git(self.trabajo, "reset", "--quiet", "--hard", "origin/main")
                git(self.trabajo, "add", "otro.txt")
                git(self.trabajo, "commit", "--quiet", "-m", "otro")
                git(self.trabajo, "push", "--quiet", "origin", "HEAD:refs/heads/main")
            return {"nuevo.txt": "nuevo\n"}, "listo"
        resumen, sha = self.repo.aplicar("main", calcular, "prueba")
        self.assertEqual((resumen, len(llamadas)), ("listo", 2))
        self.assertEqual(self.en_origen("main", "otro.txt"), "otro\n")
        self.assertEqual(self.en_origen("main", "nuevo.txt"), "nuevo\n")
        self.assertEqual(git(self.origen, "rev-parse", "main").strip(), sha)
        self.assertEqual(self.repo.leer, real)
        self.assertNotIn("decisiones-", " ".join(os.listdir(tempfile.gettempdir())))   # no deja árboles


class GitHubDeVerdad(unittest.TestCase):
    """La clase GitHub, con gh cambiado por un doble que guarda lo que se le pidió."""

    def falso(self, respuestas):
        pedidos = []

        class Falso(de.GitHub):
            def _gh(self, *args, entrada=None):
                pedidos.append((args, entrada))
                return respuestas.pop(0) if respuestas else "{}"
        return Falso(REPO), pedidos

    def test_la_propuesta_por_su_api(self):
        rest = {"number": 1, "state": "closed", "merged": True, "body": None, "merged_at": "2026-11-18T01:46:16Z",
                "closed_at": "2026-11-18T01:46:16Z", "user": {"login": "github-actions[bot]"},
                "head": {"ref": RAMA, "repo": {"full_name": REPO}}, "base": {"ref": "main"}}
        gh, pedidos = self.falso([json.dumps(rest), json.dumps(dict(rest, merged=False)), json.dumps(dict(rest, state="open", merged=False))])
        pr = gh.pr(1)
        self.assertEqual((pr["state"], pr["headRefName"], pr["baseRefName"], pr["autor"], pr["repo_cabeza"], pr["body"]),
                         ("MERGED", RAMA, "main", "github-actions[bot]", REPO, ""))
        self.assertEqual(gh.pr(1)["state"], "CLOSED")
        self.assertEqual(gh.pr(1)["state"], "OPEN")
        self.assertEqual(pedidos[0][0], ("api", f"repos/{REPO}/pulls/1"))

    def test_editar_y_comentar_por_su_api(self):
        gh, pedidos = self.falso([])
        gh.editar_cuerpo(1, "cuerpo «nuevo» -->")
        gh.comentar(1, "hola")
        self.assertEqual(pedidos[0][0], ("api", "-X", "PATCH", f"repos/{REPO}/pulls/1", "--input", "-"))
        self.assertEqual(json.loads(pedidos[0][1]), {"body": "cuerpo «nuevo» -->"})
        self.assertEqual(pedidos[1][0], ("api", "-X", "POST", f"repos/{REPO}/issues/1/comments", "--input", "-"))
        self.assertEqual(json.loads(pedidos[1][1]), {"body": "hola"})


class ComentariosDeGitHub(unittest.TestCase):
    def test_comentarios_y_resenas_en_orden(self):
        class Falso(de.GitHub):
            def _gh(self, *args, entrada=None):
                if "issues" in args[1]:
                    return json.dumps([{"created_at": "2026-11-18T02:00:00Z", "user": {"login": "badirnakid"}, "body": "dos"}])
                return json.dumps([{"submitted_at": "2026-11-18T01:00:00Z", "user": {"login": "badirnakid"}, "body": "uno"},
                                   {"submitted_at": "2026-11-18T03:00:00Z", "user": None, "body": None}])
        self.assertEqual(Falso("x/y").comentarios(1), [("badirnakid", "uno"), ("badirnakid", "dos"), (None, "")])


class Flujo(unittest.TestCase):
    """.github/workflows/decisiones.yml: cuándo corre, con qué permisos y qué nunca hace."""

    @classmethod
    def setUpClass(cls):
        import yaml
        with open(os.path.join(RAIZ, ".github", "workflows", "decisiones.yml"), encoding="utf-8") as f:
            cls.texto = f.read()
        cls.yml = yaml.safe_load(cls.texto)
        cls.on = cls.yml.get("on") or cls.yml.get(True)
        cls.trabajo = cls.yml["jobs"]["decidir"]

    def test_el_nombre_de_cada_corrida_no_se_corta(self):
        # Sin comillas, « #» empieza un comentario de YAML y la corrida se llamaba solo «🗳️ Decisiones ·» (17 de noviembre).
        self.assertEqual(self.yml["run-name"], "🗳️ Decisiones · #${{ github.event.pull_request.number || inputs.pr }} · "
                         "${{ inputs.accion || (github.event.action == 'closed' && 'cerrar' || 'revisar') }}")

    def test_cuando_corre(self):
        self.assertEqual(self.on["pull_request_target"], {"types": ["edited", "closed"]})
        self.assertNotIn("pull_request", self.on)
        entradas = self.on["workflow_dispatch"]["inputs"]
        self.assertEqual(entradas["accion"]["options"], ["palomitas", "revisar", "cerrar"])
        self.assertTrue(entradas["pr"]["required"])

    def test_solo_propuestas_del_robot_y_lo_que_hace_badir(self):
        condicion = self.trabajo["if"]
        for pedazo in ("github.event.pull_request.head.repo.full_name == github.repository",
                       "startsWith(github.event.pull_request.head.ref, 'propuestas/')",
                       "github.event.pull_request.user.login == 'github-actions[bot]'",
                       "github.event.sender.login == 'badirnakid'",
                       "github.event.changes.body != null"):
            self.assertIn(pedazo, condicion)

    def test_permisos_y_turnos(self):
        self.assertEqual(self.yml["permissions"], {"contents": "write", "pull-requests": "write", "issues": "write"})
        self.assertNotIn("concurrency", self.yml)   # en el trabajo: una corrida saltada no ocupa el turno
        self.assertIs(self.trabajo["concurrency"]["cancel-in-progress"], False)
        self.assertIn("'cerrar' || 'editar'", self.trabajo["concurrency"]["group"])

    def test_nunca_corre_el_codigo_de_la_propuesta(self):
        pasos = self.trabajo["steps"]
        checkout = pasos[0]
        self.assertEqual(checkout["uses"], "actions/checkout@v4")
        self.assertEqual(checkout["with"]["ref"], "main")
        self.assertNotIn("head.sha", self.texto)
        self.assertNotIn("head.ref }}", self.texto)
        for p in pasos:
            self.assertNotIn("${{", p.get("run", ""))   # lo de fuera entra por variables de entorno, nunca en el guion
        guion = pasos[-1]["run"]
        self.assertIn('[[ "$PR" =~ ^[0-9]+$ ]]', guion)
        self.assertIn("scripts/decisiones.py --pr \"$PR\" --accion \"$ACCION\"", guion)
        self.assertIn('exit "$codigo"', guion)
        nombres = [p.get("name", "") for p in pasos]
        self.assertLess(nombres.index("🧪 Pruebas de las decisiones"), nombres.index("🗳️ Decidir"))
        self.assertIn("pip install --quiet pyyaml", pasos[nombres.index("🧪 Pruebas de las decisiones")]["run"])


if __name__ == "__main__":
    unittest.main(verbosity=1)
