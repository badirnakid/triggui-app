#!/usr/bin/env python3
"""
🗳️ Las decisiones de Badir sobre las propuestas del robot (C492 · 17 de noviembre de 2026)

Lo pidió Badir el 17 de noviembre de 2026, 19:45 («si no me gusta alguno, no puedo quitarlo más fácil ahí mismo en
github?»), y dio su go a las 19:58. Lo corre el flujo «🗳️ Decisiones» (.github/workflows/decisiones.yml).

Las palomitas mandan. Cada propuesta del robot trae una casilla por libro en «¿Entran?», todas marcadas, y una por variable
sugerida («Probar»), sin marcar. Lo que tiene palomita entra; lo que no, no. Si la casilla de un libro desaparece de la
descripción, ese libro no entra, pero tampoco se descarta.

Tres acciones:
- revisar: cada vez que Badir cambia la descripción de una propuesta abierta, deja su rama como dicen las palomitas. En
  lista-<lista>.txt, debajo de la línea «# 🗳️ Propuesta del robot del …», quedan los libros con palomita, en su orden. Los
  que no tienen palomita van a descartados-<lista>.txt, debajo de «# 🗳️ Quitados de la propuesta #N», para que el robot no
  se los vuelva a proponer. Si algo cambió, le contesta en la conversación.
- cerrar: cuando Badir da Merge o cierra la propuesta, hace un solo commit a main:
  - anota su decisión en curaduria/decisiones.jsonl: cada libro con lo que decidió y sus datos, y sus comentarios y reseñas
    en la propuesta, que son sus porqués; el juez los lee desde la siguiente propuesta;
  - pone a prueba en curaduria/variables.json las variables que marcó;
  - revisa en main que la lista (si dio Merge) y los descartados digan lo mismo que las palomitas, por si dio Merge antes de
    que «revisar» terminara.
  Después le contesta. Una propuesta de antes de las palomitas (sin casillas) cuenta como si todas estuvieran marcadas.
- palomitas (a mano): les pone sus casillas y su registro a una propuesta abierta de antes de C492 (la #1).

Lo que lee de una propuesta (descripción, comentarios, archivos) es dato: nunca se ejecuta. Solo cuentan los comentarios de
Badir (AUTOR). Los libros salen del registro escondido de la descripción (lo escribe scripts/curaduria.py); sin registro,
de las casillas, y solo si su línea ya es de la propuesta. Nunca toca una lista cuyo bloque trae líneas ajenas.

Uso:
  python3 -I -B scripts/decisiones.py --pr N --accion revisar|cerrar|palomitas [--repo dueño/nombre] [--raiz .]
Sale con 0 si terminó (aunque no hubiera nada que cambiar) y con 1 si algo falló (la corrida queda en rojo y GitHub le
avisa a Badir por correo).
"""
import argparse
import datetime
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("curaduria", os.path.join(AQUI, "curaduria.py"))
cu = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cu)

AUTOR = "badirnakid"                    # solo lo que escribe Badir cuenta como su porqué
RAMA_PROPUESTA = re.compile(r"^propuestas/.+-(adultos|kids)-\d{4}$")
RE_LIBRO = re.compile(r"^- \[([ xX])\] (\d+) · (.+?)\s*$")
RE_PROBAR = re.compile(r"^- \[([ xX])\] Probar «([^«»]+)»")
RE_VIEJA_VARIABLE = re.compile(r"^- \*\*(.+?)\*\* (.*?) Dato: (.*?) Cambiaría: (.*)$")
MARCA_QUITADOS = "# 🗳️ Quitados de la propuesta #"
ENTRAN = "### ¿Entran?"
AFINAR = "### 🧭 Para afinar la curaduría"
TOPE_COMENTARIO = 2000                  # caracteres que se guardan de cada comentario
ESTADO_DE_NOMBRE = {v: k for k, v in cu.NOMBRE_ESTADO.items()}
NOTA_VARIABLES = ("Las variables de la curaduría (C492). «a prueba»: el juez la califica de 0 a 1 en cada libro y la "
                  "propuesta la muestra, sin mover el puntaje. «activa»: suma su peso, de 100, y lo demás se ajusta en "
                  "proporción; las activas pesan juntas 30 como mucho. Una variable pasa a «a prueba» con la palomita de "
                  "Badir en una propuesta, y a «activa» solo con su decisión, que una sesión anota aquí con su fecha.")


class Fallo(Exception):
    """Algo que impide terminar: la corrida sale con 1."""


# ─────────────────────────────── lo que dice la propuesta ───────────────────────────────

def casillas(cuerpo):
    """{n: (marcada, texto)} de los libros y {nombre: marcada} de las variables, en la descripción de una propuesta."""
    libros, probar = {}, {}
    for linea in (cuerpo or "").splitlines():
        linea = linea.rstrip("\r")
        m = RE_LIBRO.match(linea)
        if m:
            libros.setdefault(int(m.group(2)), (m.group(1) != " ", m.group(3)))
            continue
        m = RE_PROBAR.match(linea)
        if m:
            probar.setdefault(m.group(2).strip(), m.group(1) != " ")
    return libros, probar


def bloque(lineas, k):
    """(a, b): las líneas que siguen a la línea k, hasta una vacía, un comentario o el final."""
    b = k + 1
    while b < len(lineas) and lineas[b].strip() and not lineas[b].lstrip().startswith("#"):
        b += 1
    return k + 1, b


def ultima_marca(texto_lista):
    """(marca, líneas de su bloque) de la última propuesta en una lista, o ("", [])."""
    lineas = (texto_lista or "").split("\n")
    for k in range(len(lineas) - 1, -1, -1):
        if lineas[k].startswith(cu.MARCA_PROPUESTA):
            a, b = bloque(lineas, k)
            return lineas[k].strip(), [l.strip() for l in lineas[a:b]]
    return "", []


def marca_quitados(pr):
    return f"{MARCA_QUITADOS}{pr}"


def es_marca_quitados(linea, pr):
    m = marca_quitados(pr)
    return linea.strip() == m or linea.startswith(m + " ")


def quitados_actuales(texto_descartados, pr):
    lineas = (texto_descartados or "").split("\n")
    for k, linea in enumerate(lineas):
        if es_marca_quitados(linea, pr):
            a, b = bloque(lineas, k)
            return [l.strip() for l in lineas[a:b]]
    return []


def libros_de(reg, cuerpo, texto_lista, texto_descartados, pr):
    """([(n, línea)], marca, ignoradas): los libros de la propuesta, en su orden, y la línea que los abre en la lista.
    - Con registro: los del registro.
    - Sin registro y con casillas: las casillas cuya línea ya es de la propuesta (su bloque en la lista de su rama o su
      bloque de quitados); ignoradas son las que no.
    - Sin registro ni casillas (una propuesta de antes de las palomitas): las líneas de su bloque en la lista de su rama."""
    if reg:
        libros, vistos = [], set()
        for l in reg.get("libros") or []:
            if not isinstance(l, dict):
                continue
            n, linea = l.get("n"), cu.lista_semanal.limpiar(l.get("linea"))
            if isinstance(n, int) and not isinstance(n, bool) and linea and n not in vistos:
                libros.append((n, linea))
                vistos.add(n)
        marca = reg.get("marca") or f"{cu.MARCA_PROPUESTA}{reg.get('fecha')}: entra con el Merge de Badir"
        return sorted(libros), marca, []
    marca, actuales = ultima_marca(texto_lista)
    cas = casillas(cuerpo)[0]
    if not cas:
        return list(enumerate(actuales, 1)), marca, []
    universo = set(actuales) | set(quitados_actuales(texto_descartados, pr))
    libros, ignoradas = [], []
    for n, (_, texto) in sorted(cas.items()):
        (libros if texto.strip() in universo else ignoradas).append((n, texto.strip()))
    return libros, marca, ignoradas


def decidir(libros, cuerpo, sin_casillas_entran=False):
    """{línea: «entra» | «quitado» | «fuera»} según las palomitas. Sin ninguna casilla de libro y con
    sin_casillas_entran (una propuesta de antes de las palomitas, al cerrarla), todas entran."""
    cas = casillas(cuerpo)[0]
    if not cas and sin_casillas_entran:
        return {linea: "entra" for _, linea in libros}
    return {linea: ("entra" if cas[n][0] else "quitado") if n in cas else "fuera" for n, linea in libros}


# ─────────────────────────────── los archivos ───────────────────────────────

def poner_bloque_de_lista(texto, marca, permitidas, entran):
    """(texto nuevo, líneas que había) con el bloque de la propuesta, debajo de su marca, igual a entran. Busca la marca
    desde el final y solo toca un bloque cuyas líneas son todas de la propuesta. (texto, None) si no lo encuentra."""
    if not marca:
        return texto, None
    lineas = texto.split("\n")
    for k in range(len(lineas) - 1, -1, -1):
        if lineas[k].strip() != marca:
            continue
        a, b = bloque(lineas, k)
        antes = [l.strip() for l in lineas[a:b]]
        if all(l in permitidas for l in antes):
            return "\n".join(lineas[:a] + list(entran) + lineas[b:]), antes
    return texto, None


def poner_quitados(texto, pr, fecha, quitados):
    """descartados-<lista>.txt con el bloque «# 🗳️ Quitados de la propuesta #N (fecha)» igual a quitados, sin las líneas que
    ya están descartadas fuera del bloque; sin bloque si no queda ninguna."""
    lineas = (texto or "").split("\n")
    k = next((i for i, l in enumerate(lineas) if es_marca_quitados(l, pr)), None)
    if k is not None:
        _, b = bloque(lineas, k)
        inicio = k - 1 if k > 0 and not lineas[k - 1].strip() else k
        lineas = lineas[:inicio] + lineas[b:]
    resto = "\n".join(lineas).rstrip("\n")
    fuera_del_bloque = {l.strip() for l in lineas if l.strip() and not l.lstrip().startswith("#")}
    nuevos = [l for l in quitados if l not in fuera_del_bloque]
    salida = (resto + "\n") if resto else ""
    if nuevos:
        salida += ("\n" if resto else "") + f"{marca_quitados(pr)} ({fecha})\n" + "".join(f"{l}\n" for l in nuevos)
    return salida


def slug(nombre):
    return "_".join(cu.normalizar(nombre).split())[:40].strip("_")


def agregar_variables(texto, marcadas, hoy, pr):
    """(texto nuevo de curaduria/variables.json, nombres agregados): las variables marcadas, «a prueba», si no están ya."""
    try:
        datos = json.loads(texto) if texto and texto.strip() else {}
    except ValueError as e:
        raise Fallo(f"{cu.VARIABLES} no es un JSON válido ({e}): no lo toco.")
    if not isinstance(datos, dict) or not isinstance(datos.get("variables", []), list):
        raise Fallo(f"{cu.VARIABLES} no tiene la forma esperada: no lo toco.")
    datos.setdefault("_nota", NOTA_VARIABLES)
    variables = datos.setdefault("variables", [])
    ids = {str(v.get("id")) for v in variables if isinstance(v, dict)}
    nombres = {cu.normalizar(v.get("nombre")) for v in variables if isinstance(v, dict)}
    agregadas = []
    for v in marcadas:
        if cu.normalizar(v["nombre"]) in nombres or not slug(v["nombre"]):
            continue
        base = vid = slug(v["nombre"])
        k = 2
        while vid in ids:
            vid, k = f"{base[:37]}_{k}", k + 1
        variables.append({"id": vid, "nombre": v["nombre"], "estado": "a prueba", "peso": 0,
                          "que_mide": v.get("que_mide", ""), "de_donde": v.get("de_donde", ""),
                          "como_cambia": v.get("como_cambia", ""), "desde": hoy, "fuente": f"propuesta #{pr}: palomita de Badir"})
        ids.add(vid)
        nombres.add(cu.normalizar(v["nombre"]))
        agregadas.append(v["nombre"])
    return json.dumps(datos, ensure_ascii=False, indent=2) + "\n", agregadas


def poner_en_bitacora(texto, entrada):
    """curaduria/decisiones.jsonl con la entrada de esa propuesta (la reemplaza si ya estaba: cerrar dos veces no duplica)."""
    lineas = []
    for l in (texto or "").splitlines():
        if not l.strip():
            continue
        try:
            if json.loads(l).get("pr") == entrada["pr"]:
                continue
        except (ValueError, AttributeError):
            pass   # una línea rota se conserva tal cual: la bitácora no borra
        lineas.append(l)
    lineas.append(json.dumps(entrada, ensure_ascii=False, separators=(",", ":")))
    return "\n".join(lineas) + "\n"


# ─────────────────────────────── las frases ───────────────────────────────

def _lista_de(lineas):
    return cu._y([f"«{l}»" for l in lineas])


def fecha_mx(iso):
    """La fecha en México de un momento ISO de GitHub («2026-11-18T01:46:16Z»), o "" si no trae."""
    if not iso:
        return ""
    return cu.fecha_de_mexico(datetime.datetime.fromisoformat(iso.replace("Z", "+00:00"))).isoformat()


# ─────────────────────────────── GitHub y git ───────────────────────────────

class GitHub:
    """Lo poco que hace falta de GitHub, con gh (GH_TOKEN del flujo)."""

    def __init__(self, repo):
        self.repo = repo

    def _gh(self, *args, entrada=None):
        p = subprocess.run(["gh", *args], capture_output=True, text=True, input=entrada, timeout=120)
        if p.returncode:
            raise Fallo(f"gh {' '.join(args[:2])} falló: {p.stderr.strip()[:300]}")
        return p.stdout

    def pr(self, n):
        return json.loads(self._gh("pr", "view", str(n), "--repo", self.repo, "--json",
                                   "number,state,body,headRefName,baseRefName,mergedAt,closedAt"))

    def comentarios(self, n):
        """[(login, texto)] de los comentarios y de las reseñas con texto, en orden."""
        uno = json.loads(self._gh("api", f"repos/{self.repo}/issues/{n}/comments?per_page=100"))
        dos = json.loads(self._gh("api", f"repos/{self.repo}/pulls/{n}/reviews?per_page=100"))
        todos = [(c.get("created_at") or "", (c.get("user") or {}).get("login"), c.get("body") or "") for c in uno]
        todos += [(r.get("submitted_at") or "", (r.get("user") or {}).get("login"), r.get("body") or "") for r in dos]
        return [(login, texto) for _, login, texto in sorted(todos, key=lambda x: x[0])]

    def editar_cuerpo(self, n, cuerpo):
        self._gh("pr", "edit", str(n), "--repo", self.repo, "--body-file", "-", entrada=cuerpo)

    def comentar(self, n, texto):
        self._gh("pr", "comment", str(n), "--repo", self.repo, "--body-file", "-", entrada=texto)


class Repo:
    """La copia del repositorio en el flujo. Cada cambio se hace en un árbol aparte (git worktree), sobre la rama recién
    traída, y se sube; si alguien subió algo en medio, se vuelve a traer y a calcular (tres intentos)."""

    def __init__(self, raiz):
        self.raiz = raiz

    def _git(self, *args, cwd=None):
        p = subprocess.run(["git", *args], cwd=cwd or self.raiz, capture_output=True, text=True, timeout=180)
        if p.returncode:
            raise Fallo(f"git {' '.join(args[:2])} falló: {p.stderr.strip()[:300]}")
        return p.stdout

    def traer(self, ref, local):
        self._git("fetch", "--quiet", "origin", f"+{ref}:{local}")
        return local

    def leer(self, ref, ruta):
        p = subprocess.run(["git", "show", f"{ref}:{ruta}"], cwd=self.raiz, capture_output=True, timeout=60)
        return p.stdout.decode("utf-8") if p.returncode == 0 else None

    def aplicar(self, rama, calcular, mensaje, intentos=3):
        """calcular(leer) -> ({ruta: texto nuevo}, resumen). Devuelve (resumen, sha del commit o None si no hubo cambios)."""
        local = f"refs/decisiones/{rama}"
        for _ in range(intentos):
            self.traer(f"refs/heads/{rama}", local)
            cambios, resumen = calcular(lambda ruta: self.leer(local, ruta))
            cambios = {r: t for r, t in cambios.items() if t is not None and t != (self.leer(local, r) or "")}
            if not cambios:
                return resumen, None
            arbol = tempfile.mkdtemp(prefix="decisiones-")
            try:
                self._git("worktree", "add", "--quiet", "--detach", arbol, local)
                for ruta, texto in cambios.items():
                    destino = os.path.join(arbol, ruta)
                    os.makedirs(os.path.dirname(destino), exist_ok=True)
                    with open(destino, "w", encoding="utf-8", newline="") as f:
                        f.write(texto)
                self._git("add", "--", *sorted(cambios), cwd=arbol)
                self._git("commit", "--quiet", "-m", mensaje, cwd=arbol)
                p = subprocess.run(["git", "push", "--quiet", "origin", f"HEAD:refs/heads/{rama}"], cwd=arbol,
                                   capture_output=True, text=True, timeout=180)
                if p.returncode == 0:
                    return resumen, self._git("rev-parse", "HEAD", cwd=arbol).strip()
            finally:
                subprocess.run(["git", "worktree", "remove", "--force", arbol], cwd=self.raiz, capture_output=True)
                shutil.rmtree(arbol, ignore_errors=True)
        raise Fallo(f"No pude subir a {rama} después de {intentos} intentos (alguien más subía cambios al mismo tiempo).")


# ─────────────────────────────── las acciones ───────────────────────────────

def propuesta(gh, n):
    """La propuesta n y su lista, o Fallo si no es una propuesta del robot."""
    pr = gh.pr(n)
    m = RAMA_PROPUESTA.match(pr.get("headRefName") or "")
    if not m or pr.get("baseRefName") != "main":
        raise Fallo(f"La #{n} no es una propuesta del robot (rama «{pr.get('headRefName')}»): no hago nada.")
    return pr, m.group(1)


def revisar(gh, repo, n, ahora):
    pr, lista = propuesta(gh, n)
    if pr["state"] != "OPEN":
        return f"La #{n} ya no está abierta: de su cierre se encarga «cerrar»."
    cuerpo = pr.get("body") or ""
    if not casillas(cuerpo)[0]:
        return f"La #{n} no tiene palomitas: no hay nada que revisar."
    reg = cu.leer_registro(cuerpo)
    ruta_lista, ruta_desc = cu.LISTAS[lista], cu.DESCARTADOS[lista]

    def calcular(leer):
        texto_lista, texto_desc = leer(ruta_lista) or "", leer(ruta_desc) or ""
        libros, marca, ignoradas = libros_de(reg, cuerpo, texto_lista, texto_desc, n)
        if not libros:
            raise Fallo(f"No encontré los libros de la #{n}: ni su registro ni casillas que cuadren con su rama.")
        estado = decidir(libros, cuerpo)
        entran = [l for _, l in libros if estado[l] == "entra"]
        quitados = [l for _, l in libros if estado[l] == "quitado"]
        nueva_lista, antes = poner_bloque_de_lista(texto_lista, marca, {l for _, l in libros}, entran)
        fecha = (reg or {}).get("fecha") or marca[len(cu.MARCA_PROPUESTA):][:10]
        resumen = {"antes": antes, "entran": entran, "estado": estado, "ignoradas": ignoradas}
        if antes is None:   # sin la lista no se toca nada: los descartados solos dejarían la propuesta a medias
            return {}, resumen
        return {ruta_lista: nueva_lista, ruta_desc: poner_quitados(texto_desc, n, fecha, quitados)}, resumen

    resumen, sha = repo.aplicar(pr["headRefName"], calcular,
                                f"🗳️ Propuesta #{n}: como dicen las palomitas de Badir (C492)")
    texto = frase_revisar(lista, resumen)
    if texto:
        gh.comentar(n, texto)
    return texto or f"La #{n} ya estaba como dicen sus palomitas."


def frase_revisar(lista, r):
    """Lo que se le contesta a Badir después de revisar; "" si no cambió nada."""
    partes = []
    estado, antes = r["estado"], r["antes"]
    if antes is not None:
        salieron = [l for l in antes if l not in r["entran"]]
        volvieron = [l for l in r["entran"] if l not in antes]
        quitados = [l for l in salieron if estado.get(l) == "quitado"]
        fuera = [l for l in salieron if estado.get(l) != "quitado"]
        if quitados:
            partes.append(f"Quité de la propuesta {_lista_de(quitados)} y " + ("lo" if len(quitados) == 1 else "los")
                          + f" anoté en `{cu.DESCARTADOS[lista]}`: el robot no te " + ("lo" if len(quitados) == 1 else "los")
                          + " vuelve a proponer. Si fue un error, vuelve a ponerle su palomita.")
        if fuera:
            partes.append(f"La casilla de {_lista_de(fuera)} ya no está en la descripción: " +
                          ("lo saqué" if len(fuera) == 1 else "los saqué") + " de la propuesta, sin descartar" +
                          ("lo." if len(fuera) == 1 else "los."))
        if volvieron:
            partes.append(f"Volví a poner {_lista_de(volvieron)} en la propuesta, en su lugar.")
    else:
        partes.append(f"No cambié nada: en `{cu.LISTAS[lista]}` no encontré los libros de esta propuesta juntos debajo de su "
                      f"línea «{cu.MARCA_PROPUESTA}…» (alguien editó el archivo a mano). Revísalo con Claude en el chat antes "
                      "de dar Merge.")
    if r["ignoradas"]:
        partes.append("Estas casillas no corresponden a ningún libro de la propuesta y no las tomé en cuenta: "
                      + _lista_de([l for _, l in r["ignoradas"]]) + ".")
    return " ".join(partes)


def cerrar(gh, repo, n, ahora):
    pr, lista = propuesta(gh, n)
    if pr["state"] == "OPEN":
        raise Fallo(f"La #{n} sigue abierta: se anota cuando le des Merge o la cierres.")
    unida = pr["state"] == "MERGED"
    cuerpo = pr.get("body") or ""
    reg = cu.leer_registro(cuerpo)
    cabeza = repo.traer(f"refs/pull/{n}/head", f"refs/decisiones/pr-{n}")
    libros, marca, ignoradas = libros_de(reg, cuerpo, repo.leer(cabeza, cu.LISTAS[lista]) or "",
                                         repo.leer(cabeza, cu.DESCARTADOS[lista]) or "", n)
    if not libros:
        raise Fallo(f"No encontré los libros de la #{n} (ni en su registro ni en su rama): no anoto nada.")
    sin_casillas = not casillas(cuerpo)[0]
    estado = decidir(libros, cuerpo, sin_casillas_entran=True)
    datos = {l["n"]: l for l in (reg or {}).get("libros") or [] if isinstance(l, dict) and isinstance(l.get("n"), int)}
    if not reg:   # de antes de las palomitas: los datos de su tabla, si cuadra fila por fila con su lista
        tabla = datos_de_la_tabla(cuerpo, lista)
        datos = {k: tabla[k] for k, linea in libros
                 if k in tabla and cu.normalizar(tabla[k]["titulo"]) == cu.normalizar(cu._celda(linea.split(" | ")[0]))}
    nombre_decision = {"entra": "entró" if unida else "no entró", "quitado": "quitado", "fuera": "fuera"}
    fecha = (reg or {}).get("fecha") or marca[len(cu.MARCA_PROPUESTA):][:10]
    entrada = {
        "pr": n, "lista": lista, "propuesta": fecha, "cerrada": fecha_mx(pr.get("mergedAt") or pr.get("closedAt")),
        "resultado": "merge" if unida else "cerrada sin merge", "sin_palomitas": sin_casillas,
        "libros": [dict({"n": k, "linea": linea, "decision": nombre_decision[estado[linea]]},
                        **{c: datos[k][c] for c in ("estado", "total", "edad", "variables") if c in datos.get(k, {})})
                   for k, linea in libros],
        "comentarios": [" ".join(t.split())[:TOPE_COMENTARIO] for login, t in gh.comentarios(n)
                        if login == AUTOR and t.strip()],
    }
    _, probar = casillas(cuerpo)
    sugeridas = {v.get("nombre"): v for v in (reg or {}).get("variables") or [] if isinstance(v, dict) and v.get("nombre")}
    marcadas = [sugeridas[nombre] for nombre, si in probar.items() if si and nombre in sugeridas]
    entrada["variables_marcadas"] = [v["nombre"] for v in marcadas]
    entran = [l for _, l in libros if estado[l] == "entra"]
    quitados = [l for _, l in libros if estado[l] == "quitado"]
    fuera = [l for _, l in libros if estado[l] == "fuera"]
    hoy = cu.fecha_de_mexico(ahora).isoformat()

    def calcular(leer):
        cambios = {cu.DECISIONES: poner_en_bitacora(leer(cu.DECISIONES), entrada),
                   cu.DESCARTADOS[lista]: poner_quitados(leer(cu.DESCARTADOS[lista]) or "", n, fecha, quitados)}
        texto_vars, agregadas = agregar_variables(leer(cu.VARIABLES), marcadas, hoy, n)
        if agregadas:
            cambios[cu.VARIABLES] = texto_vars
        antes = None
        if unida:
            nueva, antes = poner_bloque_de_lista(leer(cu.LISTAS[lista]) or "", marca, {l for _, l in libros}, entran)
            if antes is not None:
                cambios[cu.LISTAS[lista]] = nueva
        return cambios, {"agregadas": agregadas, "antes": antes}

    resumen, sha = repo.aplicar("main", calcular, f"🗳️ Decisión de Badir sobre la propuesta #{n} (C492)")
    texto = frase_cerrar(lista, unida, entrada, entran, quitados, fuera, resumen, ignoradas)
    gh.comentar(n, texto)
    if unida and resumen["antes"] is None:   # la corrida queda en rojo: GitHub le avisa a Badir por correo
        raise Fallo(texto)
    return texto


def frase_cerrar(lista, unida, entrada, entran, quitados, fuera, r, ignoradas):
    partes = [f"Anoté tu decisión en `{cu.DECISIONES}`"]
    if unida:
        partes[0] += f": {'entró' if len(entran) == 1 else 'entraron'} {len(entran)}"
    else:
        partes[0] += ": cerraste la propuesta sin Merge, así que no entró ningún libro"
    if quitados:
        partes[0] += f" y quitaste {_lista_de(quitados)}, que " + ("quedó" if len(quitados) == 1 else "quedaron") + \
                     f" en `{cu.DESCARTADOS[lista]}`"
    partes[0] += "."
    if fuera:
        partes.append(f"{_lista_de(fuera)} ya no " + ("tenía" if len(fuera) == 1 else "tenían") + " casilla en la "
                      "descripción: no " + ("entró" if len(fuera) == 1 else "entraron") + " y tampoco " +
                      ("lo" if len(fuera) == 1 else "los") + " descarté.")
    if entrada["comentarios"]:
        partes.append(f"Guardé {cu._n(len(entrada['comentarios']), 'comentario tuyo', 'comentarios tuyos')} como tu porqué.")
    partes.append("El juez la lee desde la próxima propuesta.")
    if r["agregadas"]:
        partes.append(f"Desde la próxima, {_lista_de(r['agregadas'])} " + ("queda" if len(r["agregadas"]) == 1 else "quedan")
                      + " a prueba: el juez " + ("la califica" if len(r["agregadas"]) == 1 else "las califica")
                      + " con lo que sabe de cada libro, sin mover el puntaje; si pide un dato de fuera, sale «sin dato» "
                      "hasta que una sesión lo conecte.")
    if unida and r["antes"] is None:
        partes.append(f"Ojo: no encontré en main los libros de esta propuesta juntos debajo de su línea en "
                      f"`{cu.LISTAS[lista]}` y no toqué la lista; si quitaste alguno, puede seguir ahí. Revísalo con Claude "
                      "en el chat.")
    if entrada["sin_palomitas"]:
        partes.append("Esta propuesta es de antes de las palomitas: conté todos sus libros como aprobados con tu Merge.")
    if ignoradas:
        partes.append("No tomé en cuenta estas casillas, que no son de ningún libro de la propuesta: "
                      + _lista_de([l for _, l in ignoradas]) + ".")
    return " ".join(partes)


def datos_de_la_tabla(cuerpo, lista):
    """{n: {"titulo", "total", "estado"}} de la tabla de una propuesta de antes de las palomitas (la arma curaduria.py)."""
    datos = {}
    desplazar = 1 if lista == "kids" else 0   # Kids trae la columna «Edad» antes del puntaje
    for linea in (cuerpo or "").splitlines():
        celdas = [c.strip() for c in linea.rstrip("\r").split("|")]
        if len(celdas) < 9 + desplazar or not celdas[1].isdigit():
            continue
        titulo = re.match(r"\*\*(.+?)\*\*", celdas[3])
        total = re.match(r"\*\*([\d.]+)\*\*", celdas[4 + desplazar])
        estado = ESTADO_DE_NOMBRE.get(celdas[5 + desplazar].split(" (")[0])
        datos[int(celdas[1])] = {"titulo": titulo.group(1) if titulo else "", "total": float(total.group(1)) if total else None,
                                 "estado": estado, "edad": celdas[4] if desplazar else ""}
    return datos


def con_palomitas(cuerpo, lista, libros, reg):
    """La descripción con sus casillas: «¿Entran?» en lugar del párrafo viejo de «¿Quitar alguno?» (o antes de la tabla),
    las variables con su «Probar» y el registro al final."""
    lineas = (cuerpo or "").replace("\r\n", "\n").rstrip("\n").split("\n")
    seccion = [ENTRAN, "", cu.texto_entran(lista), ""] + [f"- [x] {n} · {l}" for n, l in libros] + [""]
    k = next((i for i, l in enumerate(lineas) if l.startswith("¿Quitar alguno?")), None)
    if k is not None:
        fin = k + 2 if k + 1 < len(lineas) and not lineas[k + 1].strip() else k + 1
        lineas[k:fin] = seccion
    else:
        k = next((i for i, l in enumerate(lineas) if l.startswith("| # |")), None)
        if k is None:
            raise Fallo("No encontré dónde poner las palomitas en la descripción (ni «¿Quitar alguno?» ni la tabla).")
        lineas[k:k] = seccion
    sugeridas = []
    if AFINAR in lineas:
        i = lineas.index(AFINAR) + 1
        while i < len(lineas) and not lineas[i].startswith(("### ", "<details>", "<sub>")):
            if lineas[i].startswith("Ideas del juez"):
                lineas[i] = cu.TEXTO_PROBAR
            m = RE_VIEJA_VARIABLE.match(lineas[i])
            if m:
                v = {"nombre": re.sub(r"[«»]", "", m.group(1)).rstrip(".").strip()[:80], "que_mide": m.group(2),
                     "de_donde": m.group(3), "como_cambia": m.group(4)}
                if v["nombre"]:
                    sugeridas.append(v)
                    lineas[i] = cu.casilla_probar(v)
            i += 1
    reg["variables"] = sugeridas
    return "\n".join(lineas) + "\n\n" + cu.registro_a_texto(reg) + "\n"


def palomitas(gh, repo, n, ahora):
    pr, lista = propuesta(gh, n)
    if pr["state"] != "OPEN":
        raise Fallo(f"La #{n} ya no está abierta: ya no tiene caso ponerle palomitas.")
    cuerpo = pr.get("body") or ""
    if ENTRAN in cuerpo or casillas(cuerpo)[0]:
        return f"La #{n} ya tiene sus palomitas."
    rama = repo.traer(f"refs/heads/{pr['headRefName']}", f"refs/decisiones/{pr['headRefName']}")
    marca, lineas = ultima_marca(repo.leer(rama, cu.LISTAS[lista]) or "")
    if not marca or not lineas:
        raise Fallo(f"No encontré los libros de la #{n} en `{cu.LISTAS[lista]}` de su rama.")
    tabla = datos_de_la_tabla(cuerpo, lista)
    libros = list(enumerate(lineas, 1))
    for k, linea in libros:   # la tabla y la lista van en el mismo orden: si no cuadran, no se adivina
        titulo = cu._celda(linea.split(" | ")[0])
        if k not in tabla or cu.normalizar(tabla[k]["titulo"]) != cu.normalizar(titulo):
            raise Fallo(f"La fila {k} de la tabla no es «{titulo}»: no pongo palomitas que no cuadren.")
    reg = {"v": 1, "lista": lista, "fecha": marca[len(cu.MARCA_PROPUESTA):][:10], "marca": marca,
           "libros": [{"n": k, "linea": linea, "estado": tabla[k]["estado"], "total": tabla[k]["total"],
                       "edad": tabla[k]["edad"]} for k, linea in libros]}
    nuevo = con_palomitas(cuerpo, lista, libros, reg)
    gh.editar_cuerpo(n, nuevo)
    con_variables = bool(reg["variables"])
    texto = ("Le puse palomitas a esta propuesta: cada libro trae su casilla en «¿Entran?», todas marcadas. Si no quieres "
             "alguno, quítale su palomita y en un minuto lo saco de la propuesta y lo anoto en "
             f"`{cu.DESCARTADOS[lista]}`. Si quieres decir por qué, deja un comentario aquí." +
             (" Las ideas de «🧭 Para afinar la curaduría» también traen su casilla «Probar»." if con_variables else ""))
    gh.comentar(n, texto)
    return texto


ACCIONES = {"revisar": revisar, "cerrar": cerrar, "palomitas": palomitas}


def main(argv=None):
    p = argparse.ArgumentParser(description="Las decisiones de Badir sobre las propuestas del robot.")
    p.add_argument("--pr", type=int, required=True)
    p.add_argument("--accion", choices=sorted(ACCIONES), required=True)
    p.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY") or "badirnakid/triggui-app")
    p.add_argument("--raiz", default=".")
    a = p.parse_args(argv)
    try:
        texto = ACCIONES[a.accion](GitHub(a.repo), Repo(a.raiz), a.pr, datetime.datetime.now(datetime.timezone.utc))
    except Fallo as e:
        print(f"🔴 {e}", file=sys.stderr)
        return 1
    print(texto)
    return 0


if __name__ == "__main__":
    sys.exit(main())
