#!/usr/bin/env python3
"""
🗳️ El robot de propuestas de Triggui (C480 · 17 de noviembre de 2026)

Le propone a Badir los libros que siguen en cada lista, para que él los apruebe con «Merge» en GitHub (B436). Desde el
17 de noviembre de 2026 el horno publica dos ediciones por semana en cada catálogo (lunes y jueves): cada lista pide unos
8 o 9 títulos al mes. Nada se publica sin su aprobación: el robot solo propone.

Qué hace, en orden:
1. Candidatos: del catálogo maestro (adultos: data/libros_master.csv; Kids: data/libros_master_kids.csv y
   data/libros_masterbkids.csv de triggui-content), los que no están en la app, ni en la lista, ni en
   descartados-<lista>.txt (lo que Badir ya no quiere que se le proponga). En adultos, tampoco los de un autor que ya está
   en la app, para no repetir un libro con otro título (el criterio del 16 de noviembre), aunque el maestro lo traiga con
   una errata («Deepak Shopra» es Deepak Chopra).
2. El juez de Triggui (ia/ia.py, papel «grande»): para cada candidato, la misión (que mejore el ánimo y den ganas de abrir
   el libro físico), el estado de ánimo al que le habla (apatía, tristeza, miedo, ira o serena) y qué tan claro, el
   parecido con las ediciones recientes, de qué trata, por qué, y cómo se escriben bien el título y el autor; en Kids,
   además, la edad (3-5, 6-8 o 9-12), si es apto y lo delicado. Si no conoce el libro con certeza, lo dice y no entra.
3. El puntaje de Triggui, de 0 a 100: misión 40, ánimo 20, libro real 15 (en adultos, ISBN de la tienda 10 y portada 5;
   en Kids, el ISBN vale los 15, porque su maestro casi no trae portada y la busca el horno al publicar), tienda 15 (en
   las dos tiendas 15; solo Casa del Libro 13; solo Gandhi 11) y variedad 10.
4. La tienda: la misma revisión del horno (tiendas-horno.mjs revisar). Las marcas de data/tiendas.json valen 25 días;
   lo que no tiene marca, o la tiene más vieja, se revisa en ese momento.
5. La elección: por potencial (todo menos la tienda), un libro por autor en cada propuesta. Si uno no se consigue, el
   juez busca entre los que sí se consiguen el más parecido de fondo, con el mismo mínimo, y entra en su lugar diciendo a
   cuál reemplaza. Si las tiendas no respondieron, o se consigue sin ISBN, no entra ni nadie en su lugar, y se avisa.
6. Variedad de ánimo: ningún estado con más de un tercio de la propuesta (redondeado hacia arriba), mientras haya con qué.
7. El orden de la lista: por puntaje, sin dos seguidos del mismo ánimo mientras se pueda (son dos ediciones por semana).
8. La fecha en que saldría cada uno (los lunes y jueves que siguen a los títulos que ya están en la lista, si cada uno se
   consigue el día que le toca) y, del juez, qué momento del calendario acompaña cada fecha (una fiesta, una temporada, el
   inicio de año): solo el calendario que se conoce de antemano, nunca noticias. Es dato para Badir; no cambia el puntaje.
9. Para afinar la curaduría (pedido de Badir del 17 de noviembre de 2026, 18:50): el juez sugiere hasta tres variables
   nuevas para la próxima vez, con qué miden, de dónde saldría el dato y cómo cambiarían la elección. Son ideas sin
   comprobar: entran al puntaje solo si Badir lo decide.
10. Palomitas y criterio (C492, go de Badir del 17 de noviembre de 2026, 19:58):
   - la propuesta trae una casilla por libro («¿Entran?»): quitar la palomita lo saca (scripts/decisiones.py, flujo
     «🗳️ Decisiones»), y una casilla por variable sugerida («Probar»): marcarla la pone a prueba;
   - el juez lee el criterio de Badir (curaduria/criterio.md) y sus decisiones recientes (curaduria/decisiones.jsonl);
   - las variables de curaduria/variables.json: «a prueba» se calculan y se muestran sin mover el puntaje; «activa» suma
     su peso (los demás se ajustan en proporción para que el total siga de 0 a 100);
   - en Kids, un segundo juez de otro modelo (el papel «mini» de ia/ia.py) revisa lo delicado de todos los que pasan lo
     demás: sin su «sí», no entra.

Lo duro, que ningún puntaje compensa: que el juez conozca el libro, que la misión llegue a 0.6, que el catálogo lo traiga
bien escrito (el horno publica el título y el autor de su catálogo maestro: adultos, data/libros_master.csv; Kids,
data/libros_master_kids.csv; así que una errata o un acento que falta llegarían a la edición: esos se listan para
corregir el catálogo y no entran; en Kids el filtro vale igual para data/libros_masterbkids.csv, que el horno no lee),
que se consiga (con su ISBN) y, en Kids, que sea apto, traiga su edad y tenga el «sí» del segundo juez.

Uso:
  python3 -I -B scripts/curaduria.py --lista adultos|kids [--cuantos 9] [--forzar] [--app .] \
      [--contenido triggui-content] [--nucleus experiments/nucleus] [--salida DIR] [--fecha AAAA-MM-DD]
Sin --forzar, solo propone si a la lista le quedan menos de UMBRAL títulos, y entonces completa hasta META. Con --forzar
propone aunque tenga más: los que falten para llegar a META, y al menos 4. --cuantos fija el número (de 1 a 40).
Escribe en --salida: propuesta-<lista>.md (el cuerpo del pull request), lineas-<lista>.txt (lo que se agrega a la lista),
propuesta-<lista>.json (todo, para el registro) y, en Kids, edades-kids.json (las edades, sumadas a las de la app).
Sale con 0 si propuso, con 0 y sin archivos si no hacía falta, y con 2 si no encontró ninguno.
Con --recordatorio no propone: escribe en la salida estándar el recordatorio para la propuesta que sigue abierta (cuántos
títulos le quedan a la lista y hasta qué día alcanzan), que el flujo deja como comentario con la mención de Badir.
"""
import argparse
import base64
import csv
import datetime
import importlib.util
import json
import math
import os
import re
import subprocess
import sys
import unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("lista_semanal", os.path.join(AQUI, "lista-semanal.py"))
lista_semanal = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(lista_semanal)

UMBRAL = 6           # con menos títulos que esto en la lista, el robot propone
META = 12            # y completa hasta aquí (6 semanas a dos por semana)
MIN_MISION = 0.6     # la misión mínima para entrar
MIN_PARECIDO = 0.6   # el parecido mínimo para entrar en lugar de otro
DIAS_VIGENCIA = 25   # lo mismo que el horno (tiendas-horno.mjs)
LOTE = 25            # candidatos por llamada al juez
RECIENTES = 12       # ediciones recientes para medir la variedad
POOL_PARECIDO = 40   # candidatos que el juez compara al buscar el más parecido
SEGUIDAS_SIN_RESPUESTA = 3   # como el horno: tras 3 revisiones de tiendas sin respuesta, seguidas, ya no se revisa más
ESTADOS = ("apatia", "tristeza", "miedo", "ira", "serena")
EDADES = ("3-5", "6-8", "9-12")
NOMBRE_ESTADO = {"apatia": "apatía", "tristeza": "tristeza", "miedo": "miedo", "ira": "ira", "serena": "serena"}
NOMBRE_TIENDA = {"ambas": "Casa del Libro y Gandhi", "casadelibro": "Casa del Libro", "gandhi": "Gandhi"}
PUNTOS_TIENDA = {"ambas": 15, "casadelibro": 13, "gandhi": 11}

MAESTROS = {"adultos": ["data/libros_master.csv"], "kids": ["data/libros_master_kids.csv", "data/libros_masterbkids.csv"]}
APP = {"adultos": "contenido.json", "kids": "contenido_kids.json"}
EDICIONES = {"adultos": "contenido_manual.json", "kids": "contenido_kids_manual.json"}
LISTAS = {"adultos": "lista-adultos.txt", "kids": "lista-kids.txt"}
DESCARTADOS = {"adultos": "descartados-adultos.txt", "kids": "descartados-kids.txt"}
EDADES_ARCHIVO = "edades-kids.json"
DIAS_DE_EDICION = (0, 3)   # lunes y jueves (datetime: lunes = 0)
HORA_DEL_HORNO = {"kids": 11, "adultos": 12}   # en UTC: los crons del horno en triggui.yml (5 y 6 de la mañana en México)
MARGEN_DEL_HORNO = 3   # horas: la demora de GitHub más lo que tarda el horno en publicar y quitar el título de la lista
DIAS_CORTOS = ("lun", "mar", "mié", "jue", "vie", "sáb", "dom")
MESES_CORTOS = ("ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic")
DE_LA_LISTA = {"adultos": "de adultos", "kids": "Kids"}
CRITERIO = os.path.join("curaduria", "criterio.md")          # el criterio de Badir, con sus palabras (lo lee el juez)
DECISIONES = os.path.join("curaduria", "decisiones.jsonl")   # la bitácora de decisiones (la escribe scripts/decisiones.py)
VARIABLES = os.path.join("curaduria", "variables.json")      # las variables a prueba y activas
CASOS = 30              # decisiones recientes que el juez lee
TOPE_PESOS = 30         # lo más que pueden pesar juntas las variables activas, de 100
LOTE_SEGUNDO = 40       # en Kids, candidatos por llamada al segundo juez
MEXICO = datetime.timezone(datetime.timedelta(hours=-6))   # la hora de México (sin horario de verano desde 2022)
REGISTRO_INICIO = "<!-- triggui-registro:"   # el registro de la propuesta, escondido al final de su descripción
MARCA_PROPUESTA = "# 🗳️ Propuesta del robot del "   # la línea que abre, en la lista, los libros de una propuesta
SIN_DATO = None         # el valor de una variable que el juez no puede calificar sin un dato de fuera
RESERVADOS = ("mision", "animo", "libro_real", "tienda", "variedad")   # las partes del puntaje: ninguna variable se llama así
# Lo que ya mide el robot: el juez no las sugiere otra vez.
VARIABLES_EN_USO = ("la misión (que mejore el ánimo y den ganas de abrir el libro físico)", "el estado de ánimo al que le "
                    "habla y qué tan claro", "el libro real (ISBN y portada)", "la tienda (Casa del Libro y Gandhi)",
                    "la variedad contra las últimas ediciones", "un libro por autor", "la escritura del catálogo",
                    "en Kids, la edad, si es apto y lo delicado", "la fecha en que saldría y su momento del calendario")
# Lo que se quitó de los candidatos, en el orden en que se revisa, con su frase en singular y en plural.
EXCLUSIONES = {
    "repetido en el maestro": ("repetido en el catálogo", "repetidos en el catálogo"),
    "en la app": ("que ya está en la app", "que ya están en la app"),
    "en la lista": ("que ya está en la lista", "que ya están en la lista"),
    "descartado por Badir": ("que descartaste", "que descartaste"),
    "autor en la app": ("de un autor que ya está en la app", "de autores que ya están en la app"),
}

normalizar = lista_semanal.normalizar


# ─────────────────────────────── lectura ───────────────────────────────

def leer_csv(ruta):
    if not os.path.exists(ruta):
        return []
    with open(ruta, encoding="utf-8-sig", newline="") as f:
        filas = []
        for r in csv.DictReader(f):
            t = " ".join(str(r.get("titulo") or "").split())
            a = " ".join(str(r.get("autor") or "").split())
            if t:
                filas.append({"titulo": t, "autor": a, "portada": str(r.get("portada") or "").strip(),
                              "tagline": " ".join(str(r.get("tagline") or "").split())[:300]})
        return filas


def leer_libros(ruta):
    try:
        with open(ruta, encoding="utf-8-sig") as f:
            d = json.load(f)
    except (OSError, ValueError):
        return []
    libros = d.get("libros", []) if isinstance(d, dict) else d
    return [b for b in (libros if isinstance(libros, list) else []) if isinstance(b, dict)]


def clave(titulo, autor):
    """La clave de data/tiendas.json (claveLibro de tiendas.mjs)."""
    return f"{str(titulo or '').strip().lower()}__{str(autor or '').strip().lower()}"


def apellidos(autor):
    """Las palabras del autor con más de dos letras, normalizadas, para reconocer al mismo autor escrito distinto."""
    return {p for p in normalizar(autor).split() if len(p) > 2}


def misma_palabra(x, y):
    """Igual, o con una errata: de cinco letras o más y a una letra de distancia (cambiada, sobrante o faltante)."""
    if x == y:
        return True
    if min(len(x), len(y)) < 5 or abs(len(x) - len(y)) > 1:
        return False
    if len(x) == len(y):
        return sum(a != b for a, b in zip(x, y)) == 1
    corta, larga = (x, y) if len(x) < len(y) else (y, x)
    return any(larga[:k] + larga[k + 1:] == corta for k in range(len(larga)))


def mismo_autor(a, b):
    """El mismo autor escrito distinto: sus palabras caben en las del otro, con acentos o una errata por palabra."""
    pa, pb = apellidos(a), apellidos(b)
    if not pa or not pb:
        return False
    menor, mayor = (pa, pb) if len(pa) <= len(pb) else (pb, pa)
    return all(any(misma_palabra(x, y) for y in mayor) for x in menor)


def _letras(s):
    """En minúsculas, con sus acentos, solo letras y números: mayúsculas y puntuación no cuentan."""
    return " ".join(re.sub(r"[\W_]+", " ", unicodedata.normalize("NFC", str(s or "")).lower()).split())


def a_una_letra(x, y):
    """A lo más una errata de distancia, de cualquier largo: una letra cambiada, sobrante o faltante, o dos letras
    vecinas al revés («amra» y «amar»)."""
    if x == y:
        return True
    if abs(len(x) - len(y)) > 1:
        return False
    if len(x) == len(y):
        dif = [k for k, (a, b) in enumerate(zip(x, y)) if a != b]
        return len(dif) == 1 or (len(dif) == 2 and dif[1] == dif[0] + 1
                                 and x[dif[0]] == y[dif[1]] and x[dif[1]] == y[dif[0]])
    corta, larga = (x, y) if len(x) < len(y) else (y, x)
    return any(larga[:k] + larga[k + 1:] == corta for k in range(len(larga)))


def errata(original, bien):
    """¿«bien» corrige un acento, una errata o un espacio de «original»? Solo eso: mayúsculas y puntuación no cuentan,
    y otra redacción, una traducción u otra edición no son errata (ahí manda el catálogo). Un falso positivo solo manda
    el libro a la lista de erratas del catálogo, que Badir ve."""
    a, b = _letras(original), _letras(bien)
    if not a or not b or a == b:
        return False
    if a.replace(" ", "") == b.replace(" ", ""):
        return True   # palabras pegadas o separadas: «Elprincipito»
    pa, pb = a.split(), b.split()
    if len(pa) != len(pb):
        return False
    return all(a_una_letra(normalizar(x), normalizar(y)) for x, y in zip(pa, pb))


def titulo_en(titulo, titulos):
    """El título ya está: igual, o uno empieza con el otro (la regla de ya_entro de lista-semanal.py)."""
    t = normalizar(titulo)
    if not t:
        return False
    for x in titulos:
        if x == t:
            return True
        if x.startswith(t + " ") and lista_semanal._prefijo_suficiente(t):
            return True
        if t.startswith(x + " ") and lista_semanal._prefijo_suficiente(x):
            return True
    return False


def candidatos(perfil, contenido, app_raiz):
    """Los candidatos del catálogo maestro y lo que se excluyó, contado por regla."""
    maestro = []
    for r in MAESTROS[perfil]:
        maestro += leer_csv(os.path.join(contenido, r))
    en_app = leer_libros(os.path.join(contenido, APP[perfil]))
    titulos_app = {normalizar(b.get("titulo")) for b in en_app if b.get("titulo")}
    titulos_app.discard("")
    autores_app = [b.get("autor") for b in en_app if b.get("autor")]
    en_lista = [l.split(" | ")[0] for l in lista_semanal.lineas_utiles(os.path.join(app_raiz, LISTAS[perfil]))]
    titulos_lista = {normalizar(t) for t in en_lista if normalizar(t)}
    descartados = [l.split(" | ")[0] for l in lista_semanal.lineas_utiles(os.path.join(app_raiz, DESCARTADOS[perfil]))]
    titulos_descartados = {normalizar(t) for t in descartados if normalizar(t)}
    excluidos = {k: 0 for k in EXCLUSIONES}
    vistos, salida = set(), []
    for r in maestro:
        n = normalizar(r["titulo"])
        if n in vistos:
            excluidos["repetido en el maestro"] += 1
            continue
        vistos.add(n)
        if titulo_en(r["titulo"], titulos_app):
            excluidos["en la app"] += 1
            continue
        if titulo_en(r["titulo"], titulos_lista):
            excluidos["en la lista"] += 1
            continue
        if titulo_en(r["titulo"], titulos_descartados):
            excluidos["descartado por Badir"] += 1
            continue
        if perfil == "adultos" and any(mismo_autor(r["autor"], a) for a in autores_app):
            excluidos["autor en la app"] += 1
            continue
        salida.append(dict(r, clave=clave(r["titulo"], r["autor"])))
    return salida, excluidos, len(lista_semanal.lineas_utiles(os.path.join(app_raiz, LISTAS[perfil])))


def recientes(perfil, contenido):
    return [str(b.get("titulo")) for b in leer_libros(os.path.join(contenido, EDICIONES[perfil]))[:RECIENTES] if b.get("titulo")]


# ─────────────────────────────── tiendas ───────────────────────────────

def leer_marcas(ruta):
    try:
        with open(ruta, encoding="utf-8") as f:
            return (json.load(f) or {}).get("libros") or {}
    except (OSError, ValueError):
        return {}


def vigente(marca, hoy):
    try:
        d = datetime.date.fromisoformat(str(marca.get("revisado") or "")[:10])
    except ValueError:
        return False
    return (hoy - d).days < DIAS_VIGENCIA


def donde(marca):
    """«ambas», «casadelibro», «gandhi» o «» según la marca de tiendas."""
    if not marca or marca.get("tienda") not in ("casadelibro", "gandhi") or not marca.get("isbn"):
        return ""
    cdl = bool((marca.get("casadelibro") or {}).get("disponible"))
    gan = bool((marca.get("gandhi") or {}).get("disponible"))
    if cdl and gan:
        return "ambas"
    return marca["tienda"]


class Tiendas:
    """Las marcas de data/tiendas.json y, para lo que no tiene marca vigente, la revisión del horno en ese momento."""

    def __init__(self, ruta, nucleus, hoy, revisar=None):
        self.ruta, self.nucleus, self.hoy = ruta, nucleus, hoy
        self.marcas = leer_marcas(ruta)
        self._revisar = revisar
        self.revisados = 0       # las revisiones de hoy que respondieron («si» o «no»)
        self.sin_respuesta = 0   # las que no dieron una respuesta clara
        self.sin_isbn = 0
        self.seguidas = 0        # revisiones sin respuesta, seguidas
        self.cortado = False     # tras SEGUIDAS_SIN_RESPUESTA ya no se revisa más (como el horno)
        self.sin_revisar = 0     # los que necesitaban revisión después del corte

    def sin_marca(self, m):
        """Como falta() y vencido() de tiendas-horno.mjs: sin marca, sin fecha, con error de red o de 25 días o más."""
        return not m or not m.get("revisado") or m.get("motivo") == "error_red" or not vigente(m, self.hoy)

    def segun_marca(self, c):
        m = self.marcas.get(c["clave"])
        return None if self.sin_marca(m) else donde(m)   # None: no se sabe todavía

    def confirmar(self, c):
        """La tienda de hoy, su ISBN y, si no entra, por qué: (dónde, isbn, motivo). Dónde es «ambas», «casadelibro»,
        «gandhi» o «»; el motivo es «» si se consigue, «no» si no se consigue, «?» si no hubo una respuesta clara de las
        tiendas y «sin isbn» si se consigue pero sin ISBN registrado. Solo «no» autoriza a decir que no se consigue."""
        m = self.marcas.get(c["clave"])
        if self.sin_marca(m):
            if self._revisar is None or self.cortado:
                if self.cortado:
                    self.sin_revisar += 1
                return "", "", "?"
            estado = self._revisar(f"{c['titulo']} | {c['autor']}")
            self.marcas = leer_marcas(self.ruta)
            m = self.marcas.get(c["clave"])
            if estado == "no":
                self.revisados, self.seguidas = self.revisados + 1, 0
                return "", "", "no"
            if estado != "si" or self.sin_marca(m):
                # No respondieron, o dijo que sí con una marca vieja (la red falló y el horno conservó la anterior).
                self.sin_respuesta, self.seguidas = self.sin_respuesta + 1, self.seguidas + 1
                self.cortado = self.seguidas >= SEGUIDAS_SIN_RESPUESTA
                return "", "", "?"
            self.revisados, self.seguidas = self.revisados + 1, 0
        d = donde(m)
        if d:
            return d, m.get("isbn") or "", ""
        if m.get("tienda") in ("casadelibro", "gandhi"):
            self.sin_isbn += 1
            return "", "", "sin isbn"
        return "", "", "no"


def revisar_con_horno(nucleus, ruta_tiendas):
    """«si», «no» o «?»: la revisión del horno (escribe la marca nueva en data/tiendas.json del espacio de trabajo)."""
    r = lista_semanal.revisar_con_horno(os.path.abspath(nucleus), os.path.abspath(ruta_tiendas))
    return lambda libro: r(libro)[0]


# ─────────────────────────────── el juez ───────────────────────────────

SISTEMA = """Eres el juez editorial de Triggui. Triggui manda cada semana la idea de un gran libro para mejorar el ánimo de quien la lee y darle ganas de abrir el libro físico.
Calificas libros candidatos para el catálogo de {perfil}. Sé exigente y honesto: lo que propongas lo aprueba Badir, y luego le llega a personas reales.
Para cada libro:
- conoce: true solo si sabes con certeza qué libro es (título y autor). Si no, false, y no inventes nada.
- mision (0 a 1): qué tanto puede mejorar el ánimo y dar ganas de abrir el libro físico a un lector de ese catálogo. Un libro técnico, de nicho, de pseudociencia, sin fondo, de una franquicia comercial, o que no se sostiene como lectura en papel, recibe 0.3 o menos. Un clásico o un libro reconocido que transforma, 0.8 o más.
- estado: el estado de ánimo al que mejor le habla: apatia, tristeza, miedo, ira o serena.
- claridad (0 a 1): qué tan claro le habla a ese estado.
- parecido (0 a 1): qué tanto se parece de fondo (tema y tono) a alguna de las ediciones recientes que te doy. 1 es casi el mismo libro.
- de_que_trata: hasta 15 palabras, en español.
- razon: hasta 25 palabras, en español: por qué sí o por qué no.
- titulo_bien y autor_bien: el título y el autor como se escriben bien (acentos y letras), en la misma edición e idioma que te doy. Corrige solo erratas y acentos que faltan; no traduzcas, no cambies de edición ni agregues subtítulos. Si ya están bien, devuélvelos iguales.
{kids}"""

KIDS = """- edad: la edad en que mejor se lee con niñas y niños: 3-5, 6-8 o 9-12.
- apto: false si trae violencia gráfica, insultos raciales, guerra u Holocausto contados para mayores, sexualidad, terror intenso, o si es de una franquicia comercial (series de televisión, juguetes). Si no, true.
- delicado: en pocas palabras, lo que un papá o una mamá debería saber antes de leerlo; vacío si no hay nada."""

NO_KIDS = """- edad: siempre "".
- apto: siempre true.
- delicado: siempre ""."""


def esquema(perfil, variables=()):
    edad = {"type": "string", "enum": list(EDADES)} if perfil == "kids" else {"type": "string"}
    item = {"type": "object", "additionalProperties": False,
            "required": ["i", "conoce", "mision", "estado", "claridad", "parecido", "de_que_trata", "razon",
                         "titulo_bien", "autor_bien", "edad", "apto", "delicado"],
            "properties": {
                "i": {"type": "integer"}, "conoce": {"type": "boolean"}, "mision": {"type": "number"},
                "estado": {"type": "string", "enum": list(ESTADOS)}, "claridad": {"type": "number"},
                "parecido": {"type": "number"}, "de_que_trata": {"type": "string"}, "razon": {"type": "string"},
                "titulo_bien": {"type": "string"}, "autor_bien": {"type": "string"},
                "edad": edad, "apto": {"type": "boolean"}, "delicado": {"type": "string"}}}
    if variables:
        item["required"] = item["required"] + ["variables"]
        item["properties"]["variables"] = {"type": "array", "items": {
            "type": "object", "additionalProperties": False, "required": ["id", "valor"],
            "properties": {"id": {"type": "string", "enum": [v["id"] for v in variables]}, "valor": {"type": "number"}}}}
    return {"type": "object", "additionalProperties": False, "required": ["libros"],
            "properties": {"libros": {"type": "array", "items": item}}}


def _acotar(x, lo=0.0, hi=1.0):
    try:
        return max(lo, min(hi, float(x)))
    except (TypeError, ValueError):
        return lo


def juez_ia(perfil, avisos=None, papeles=("grande", "grande", "mini")):
    """El juez de verdad: Claude por ia/ia.py (la misma llave y el mismo registro de uso que el horno). El papel «grande»
    (el del núcleo del horno), con un reintento; si no responde, el papel «mini» (el del reordenador del horno), y se dice.
    El segundo juez de Kids usa solo el «mini», con su reintento: otro modelo que el primero."""
    sys.path.insert(0, os.path.join(os.path.dirname(AQUI), "ia"))
    import ia  # noqa: E402
    usado = set()

    def llamar(sistema, usuario, esq, tope):
        ultimo = None
        for papel in papeles:
            payload = {"model": papel, "max_tokens": tope, "temperature": 0.05,
                       "response_format": {"type": "json_schema", "json_schema": {"name": "juicio", "schema": esq}},
                       "messages": [{"role": "system", "content": sistema}, {"role": "user", "content": usuario}]}
            try:
                d = ia.chat(payload, timeout=300)
                r = json.loads(d["choices"][0]["message"]["content"] or "{}")
                faltan = [k for k in esq.get("required", []) if k not in (r if isinstance(r, dict) else {})]
                if faltan:   # un rechazo llega vacío: es una falla, no un lote sin libros
                    raise ValueError(f"respuesta sin {', '.join(faltan)}")
                if papel == "mini" and papeles[0] != "mini" and "mini" not in usado and avisos is not None:
                    avisos.append("El juez «grande» no respondió en alguna llamada; esa la calificó el «mini» del horno.")
                usado.add(papel)
                llamar.ultimo_papel = papel   # el segundo juez de Kids necesita saber qué modelo calificó cada lote
                return r
            except Exception as e:   # una falla pasajera se reintenta; después, ese lote no entra
                ultimo = e
        raise RuntimeError(f"el juez no respondió: {ultimo}")
    return llamar


def costo_ia(ruta_registro, ruta_config):
    """Llamadas y dólares del juez, con el registro de ia/ia.py y los precios de ia/config.json. (0, 0.0) si no hay registro."""
    try:
        with open(ruta_config, encoding="utf-8") as f:
            precios = json.load(f).get("precios_usd_por_millon") or {}
        with open(ruta_registro, encoding="utf-8") as f:
            lineas = [json.loads(l) for l in f if l.strip()]
    except (OSError, ValueError, AttributeError):
        return 0, 0.0
    usd = 0.0
    for r in lineas:
        p = precios.get(r.get("modelo")) or {}
        usd += (r.get("entrada", 0) * p.get("entrada", 0) + r.get("salida", 0) * p.get("salida", 0)
                + r.get("cache_lectura", 0) * p.get("cache_lectura", p.get("entrada", 0))
                + r.get("cache_escritura", 0) * p.get("cache_escritura", p.get("entrada", 0))) / 1e6
    return len(lineas), round(usd, 4)


def sistema_del_juez(perfil, criterio=(), casos=(), variables=()):
    sistema = SISTEMA.format(perfil="Kids (niñas y niños de 3 a 12 años)" if perfil == "kids" else "adultos",
                             kids=KIDS if perfil == "kids" else NO_KIDS)
    if variables:
        sistema += ("\n- variables: para cada una de estas (por su id), un valor de 0 a 1 de qué tanto el libro la cumple, "
                    "por lo que sabes del libro; si calificarla pide un dato que no tienes (ventas, noticias, el Pulse, el "
                    "clima), -1:\n" + "\n".join(f"  {v['id']}: {v['que_mide']}" for v in variables))
    if criterio:
        sistema += "\n\nEl criterio de Badir, con sus palabras (manda sobre todo lo demás):\n" + "\n".join(f"- {r}" for r in criterio)
    if casos:
        sistema += ("\n\nSus decisiones recientes en este catálogo (aprende de ellas; no las copies a ciegas):\n"
                    + "\n".join(f"- {c}" for c in casos))
    return sistema


def juzgar(perfil, cands, recientes_, llamar, avisos, criterio=(), casos=(), variables=()):
    sistema = sistema_del_juez(perfil, criterio, casos, variables)
    esq = esquema(perfil, variables)
    activas = [v for v in variables if v["estado"] == "activa" and v["peso"]]
    factor = (100 - sum(v["peso"] for v in activas)) / 100
    juicios = {}
    for k in range(0, len(cands), LOTE):
        lote = cands[k:k + LOTE]
        usuario = ("Ediciones recientes de Triggui (para el parecido): " + json.dumps(recientes_, ensure_ascii=False) +
                   "\n\nLibros candidatos (califica todos, con su mismo número i):\n" +
                   json.dumps([{"i": k + n, "titulo": c["titulo"], "autor": c["autor"], "de_que_trata": c.get("tagline", "")}
                               for n, c in enumerate(lote)], ensure_ascii=False))
        try:
            r = llamar(sistema, usuario, esq, 600 + 300 * len(lote))   # holgado: un JSON cortado tira el lote entero
        except Exception as e:
            avisos.append(f"Un lote de {len(lote)} candidatos no se calificó ({e}); esos no entran esta vez.")
            continue
        papel = getattr(llamar, "ultimo_papel", None)
        antes = len(juicios)
        for j in (r or {}).get("libros") or []:
            i = j.get("i")
            if not isinstance(i, int) or not (k <= i < k + len(lote)):
                continue
            titulo_bien = " ".join(str(j.get("titulo_bien") or "").split())[:200]
            autor_bien = " ".join(str(j.get("autor_bien") or "").split())[:120]
            juicios[i] = {
                "conoce": bool(j.get("conoce")), "mision": _acotar(j.get("mision")),
                "estado": j.get("estado") if j.get("estado") in ESTADOS else "serena",
                "claridad": _acotar(j.get("claridad")), "parecido": _acotar(j.get("parecido")),
                "de_que_trata": " ".join(str(j.get("de_que_trata") or "").split())[:160],
                "razon": " ".join(str(j.get("razon") or "").split())[:220],
                "titulo_bien": titulo_bien, "autor_bien": autor_bien,
                "errata": errata(cands[i]["titulo"], titulo_bien) or errata(cands[i]["autor"], autor_bien),
                "edad": (j.get("edad") if j.get("edad") in EDADES else "") if perfil == "kids" else "",
                "apto": bool(j.get("apto")) if perfil == "kids" else True,
                "delicado": " ".join(str(j.get("delicado") or "").split())[:160] if perfil == "kids" else ""}
            valores = {v["id"]: SIN_DATO for v in variables}
            for x in (j.get("variables") or []) if variables else []:
                if isinstance(x, dict) and x.get("id") in valores and isinstance(x.get("valor"), (int, float)) \
                        and not isinstance(x.get("valor"), bool) and x["valor"] >= 0:
                    valores[x["id"]] = round(_acotar(x["valor"]), 2)
            juicios[i]["variables"] = valores
            juicios[i]["papel"] = papel
            juicios[i]["factor"] = factor
            juicios[i]["extras"] = {v["id"]: round(v["peso"] * (valores[v["id"]] or 0.0), 1) for v in activas}
        sin_juicio = len(lote) - (len(juicios) - antes)
        if sin_juicio:
            avisos.append(f"El juez dejó sin calificar {_n(sin_juicio, 'candidato', 'candidatos')} de un lote de {len(lote)}: "
                          "esos no entran esta vez.")
    return juicios


PARECIDO_SISTEMA = """Eres el juez editorial de Triggui. Un libro que Triggui quería proponer no se consigue en Casa del Libro ni en Gandhi.
De la lista que te doy, elige el más parecido de fondo (tema, tono y lo que le deja al lector), que cumpla igual la misión de Triggui: mejorar el ánimo y dar ganas de abrir el libro físico.
Responde el número i del elegido y qué tan parecido es (0 a 1). Si ninguno se parece al menos {minimo}, responde i = -1."""


def esquema_parecido():
    return {"type": "object", "additionalProperties": False, "required": ["i", "parecido", "por_que"],
            "properties": {"i": {"type": "integer"}, "parecido": {"type": "number"}, "por_que": {"type": "string"}}}


def mas_parecido(c, pool, llamar, avisos):
    """El más parecido de fondo, del pool (lista de candidatos), o None."""
    if not pool:
        return None, 0.0, ""
    usuario = (f"El libro que no se consigue: «{c['titulo']}» de {c['autor']}: {c['juicio']['de_que_trata']}\n\n"
               "La lista (solo libros que sí se consiguen):\n" +
               json.dumps([{"i": n, "titulo": p["titulo"], "autor": p["autor"], "de_que_trata": p["juicio"]["de_que_trata"]}
                           for n, p in enumerate(pool)], ensure_ascii=False))
    try:
        r = llamar(PARECIDO_SISTEMA.format(minimo=MIN_PARECIDO), usuario, esquema_parecido(), 1024)
    except Exception as e:
        avisos.append(f"No pude buscar el más parecido a «{c['titulo']}» ({e}).")
        return None, 0.0, ""
    i, par = r.get("i"), _acotar(r.get("parecido"))
    if not isinstance(i, int) or not (0 <= i < len(pool)) or par < MIN_PARECIDO:
        return None, par, ""
    return pool[i], par, " ".join(str(r.get("por_que") or "").split())[:200]


# ─────────────────────────── el criterio, los casos y las variables ───────────────────────────

def leer_criterio(app_raiz):
    """Las reglas del criterio de Badir: los renglones que empiezan con «- » en curaduria/criterio.md."""
    try:
        with open(os.path.join(app_raiz, CRITERIO), encoding="utf-8") as f:
            texto = f.read()
    except OSError:
        return []
    return [" ".join(l[2:].split()) for l in texto.splitlines() if l.startswith("- ") and l[2:].strip()]


def leer_casos(app_raiz, perfil, n=CASOS):
    """Las decisiones recientes de Badir en esa lista, en frases para el juez (las más nuevas al final)."""
    casos = []
    try:
        with open(os.path.join(app_raiz, DECISIONES), encoding="utf-8") as f:
            lineas = [json.loads(l) for l in f if l.strip()]
    except (OSError, ValueError):
        return []
    for d in lineas:
        if not isinstance(d, dict) or d.get("lista") != perfil:
            continue
        for libro in d.get("libros") or []:
            if not isinstance(libro, dict):
                continue
            linea = str(libro.get("linea") or "").strip()
            if libro.get("decision") == "entró":
                casos.append(f"Aprobó «{linea}» (propuesta #{d.get('pr')}).")
            elif libro.get("decision") == "quitado":
                casos.append(f"Quitó «{linea}» (propuesta #{d.get('pr')}).")
        for c in d.get("comentarios") or []:
            casos.append(f"Comentó en la propuesta #{d.get('pr')}: «{' '.join(str(c).split())[:300]}»")
    return casos[-n:]


def leer_variables(app_raiz):
    """Las variables a prueba y activas, sanas: id, nombre, estado, peso y qué miden. Las activas pesan juntas lo más
    TOPE_PESOS; si pasan, se avisa y ninguna activa cuenta (mejor sin variables que con un puntaje roto)."""
    try:
        with open(os.path.join(app_raiz, VARIABLES), encoding="utf-8") as f:
            datos = json.load(f)
    except (OSError, ValueError):
        return [], ""
    salida = []
    for v in (datos.get("variables") if isinstance(datos, dict) else datos) or []:
        if not isinstance(v, dict):
            continue
        vid = re.sub(r"[^a-z0-9_]", "", str(v.get("id") or "").lower())[:40]
        estado = v.get("estado")
        if not vid or vid in RESERVADOS or estado not in ("a prueba", "activa") or not v.get("que_mide"):
            continue
        peso = v.get("peso") if estado == "activa" else 0
        peso = peso if isinstance(peso, (int, float)) and 0 < peso <= TOPE_PESOS else 0
        salida.append({"id": vid, "nombre": str(v.get("nombre") or vid)[:80], "estado": estado, "peso": peso,
                       "que_mide": " ".join(str(v["que_mide"]).split())[:300]})
    aviso = ""
    if sum(v["peso"] for v in salida) > TOPE_PESOS:
        aviso = (f"Las variables activas pesan más de {TOPE_PESOS} de 100 juntas: esta vez ninguna movió el puntaje "
                 "(se calcularon y se muestran).")
        for v in salida:
            v["peso"] = 0
    return salida, aviso


# ─────────────────────────────── el puntaje ───────────────────────────────

def puntos_portada(c, perfil):
    if perfil == "kids":
        return 0
    return 5 if str(c.get("portada") or "").startswith("https://") else 0


def potencial(c, perfil):
    """Todo menos la tienda. Con variables activas, lo de siempre se ajusta en proporción y se suma lo suyo."""
    j = c["juicio"]
    base = 40 * j["mision"] + 20 * j["claridad"] + 10 * (1 - j["parecido"]) + puntos_portada(c, perfil)
    return round(base * j.get("factor", 1) + sum((j.get("extras") or {}).values()), 2)


def puntaje(c, donde_, isbn, perfil):
    j = c["juicio"]
    factor = j.get("factor", 1)
    libro_real = (15 if isbn else 0) if perfil == "kids" else (10 if isbn else 0) + puntos_portada(c, perfil)
    partes = {"mision": 40 * j["mision"], "animo": 20 * j["claridad"], "libro_real": libro_real,
              "tienda": PUNTOS_TIENDA.get(donde_, 0), "variedad": 10 * (1 - j["parecido"])}
    partes = {k: round(v * factor, 1) for k, v in partes.items()}
    partes.update(j.get("extras") or {})
    return round(sum(partes.values()), 1), partes


def pasa(c, perfil, con_errata=True, con_segundo=True):
    """Lo duro del juez: que conozca el libro, que el catálogo lo traiga bien escrito, la misión mínima y, en Kids, apto,
    con edad y con el «sí» del segundo juez. Devuelve el motivo si no; vacío si pasa. Con con_errata=False, sin mirar la
    escritura (para la lista de erratas que vale la pena corregir en el catálogo); con con_segundo=False, sin el segundo
    juez (para elegir a quién revisa)."""
    j = c.get("juicio")
    if not j:
        return "sin juicio"
    if not j["conoce"]:
        return "el juez no lo conoce con certeza"
    if con_errata and j.get("errata"):
        return "el catálogo lo trae mal escrito"
    if j["mision"] < MIN_MISION:
        return "misión baja"
    if perfil == "kids" and not j["apto"]:
        return "no apto para Kids"
    if perfil == "kids" and not j["edad"]:
        return "sin edad"
    if perfil == "kids" and con_segundo and j.get("segundo") != "si":
        return "el segundo juez no lo ve apto" if j.get("segundo") == "no" else "sin el «sí» del segundo juez"
    return ""


SEGUNDO_SISTEMA = """Eres el segundo juez de Triggui Kids: un modelo distinto del primero, que revisa solo lo delicado. Triggui Kids recomienda libros para leer con niñas y niños de 3 a 12 años.
Para cada libro, con la edad que le puso el primer juez:
- conoce: true solo si sabes con certeza qué libro es (título y autor).
- apto: false si no lo conoces con certeza, o si trae violencia gráfica, insultos raciales, guerra u Holocausto contados para mayores, sexualidad o terror intenso para esa edad, o si es de una franquicia comercial (series de televisión, juguetes). Si no, true.
- por_que: hasta 20 palabras en español; si es apto, puede ir vacío.
Califica todos, con su mismo número i.{criterio}"""


def esquema_segundo():
    return {"type": "object", "additionalProperties": False, "required": ["libros"], "properties": {"libros": {
        "type": "array", "items": {"type": "object", "additionalProperties": False,
                                   "required": ["i", "conoce", "apto", "por_que"],
                                   "properties": {"i": {"type": "integer"}, "conoce": {"type": "boolean"},
                                                  "apto": {"type": "boolean"}, "por_que": {"type": "string"}}}}}}


def segundo_juez(perfil, cands, llamar2, avisos, criterio=()):
    """En Kids, un segundo juez de otro modelo revisa lo delicado de todos los que pasan lo demás, por lotes (los de más
    potencial primero). Marca juicio["segundo"]: «si»; «no», con su porqué; o «sin revisar», si su lote falló o lo dejó
    fuera. Solo «si» entra: sin la segunda revisión un libro Kids no entra, igual que sin la primera."""
    if perfil != "kids":
        return
    validos = sorted((c for c in cands if not pasa(c, perfil, con_segundo=False)),
                     key=lambda c: (-potencial(c, perfil), normalizar(c["titulo"])))
    # Si al primer juez no le respondió el «grande» y calificó el «mini», el segundo juez sería el mismo modelo: esos no
    # entran esta vez (sin dos modelos, no hay doble revisión).
    mismo = [c for c in validos if c["juicio"].get("papel") == "mini"]
    for c in mismo:
        c["juicio"]["segundo"] = "sin revisar"
    if mismo:
        avisos.append(f"{_n(len(mismo), 'candidato Kids lo calificó', 'candidatos Kids los calificó')} el «mini» porque el "
                      "«grande» no respondió; como el segundo juez también es el «mini», esos no entran esta vez.")
    validos = [c for c in validos if c not in mismo]
    sistema = SEGUNDO_SISTEMA.format(criterio=("\n\nEl criterio de Badir, con sus palabras (manda sobre todo lo demás):\n"
                                               + "\n".join(f"- {r}" for r in criterio)) if criterio else "")
    fuera, sin_revisar = [], 0
    for k in range(0, len(validos), LOTE_SEGUNDO):
        lote = validos[k:k + LOTE_SEGUNDO]
        usuario = "Libros, con la edad que les puso el primer juez:\n" + json.dumps(
            [{"i": n, "titulo": c["titulo"], "autor": c["autor"], "edad": c["juicio"]["edad"],
              "de_que_trata": c["juicio"]["de_que_trata"]} for n, c in enumerate(lote)], ensure_ascii=False)
        try:
            r = llamar2(sistema, usuario, esquema_segundo(), 400 + 80 * len(lote))
        except Exception as e:
            for c in lote:
                c["juicio"]["segundo"] = "sin revisar"
            avisos.append(f"El segundo juez de Kids no respondió en un lote de {len(lote)} ({e}): esos no entran esta vez.")
            continue
        vistos = {}
        for x in (r or {}).get("libros") or []:
            if isinstance(x, dict) and isinstance(x.get("i"), int) and 0 <= x["i"] < len(lote):
                vistos[x["i"]] = x
        for n, c in enumerate(lote):
            x = vistos.get(n)
            if x is None:
                c["juicio"]["segundo"] = "sin revisar"
                sin_revisar += 1
            elif x.get("conoce") is True and x.get("apto") is True:
                c["juicio"]["segundo"] = "si"
            else:
                c["juicio"]["segundo"] = "no"
                motivo = " ".join(str(x.get("por_que") or "").split())[:200]
                c["juicio"]["segundo_por_que"] = motivo if x.get("conoce") is True else "no lo conoce con certeza"
                fuera.append(c)
    if fuera:
        avisos.append(f"El segundo juez de Kids (otro modelo) dejó fuera {_n(len(fuera), 'libro', 'libros')}: "
                      + _y([f"«{c['titulo']}» ({c['juicio']['segundo_por_que'] or 'sin porqué'})" for c in fuera[:8]])
                      + (f" y {len(fuera) - 8} más (en el registro)" if len(fuera) > 8 else "") + ".")
    if sin_revisar:
        avisos.append(f"El segundo juez de Kids dejó sin revisar {_n(sin_revisar, 'candidato', 'candidatos')}: esos no entran "
                      "esta vez.")


def elegir(perfil, cands, cuantos, tiendas, llamar, avisos):
    """La propuesta: por potencial, un libro por autor, con su tienda de hoy y el más parecido para lo que no se consigue."""
    validos = [c for c in cands if not pasa(c, perfil)]
    validos.sort(key=lambda c: (-potencial(c, perfil), normalizar(c["titulo"])))
    tope_estado = max(1, math.ceil(cuantos / 3))
    elegidos, ya, intentados, no_se_consiguen = [], set(), set(), []
    por_estado = {e: 0 for e in ESTADOS}

    def autor_ya(c):   # un libro por autor en cada propuesta (en Kids también: dos de la misma serie no son variedad)
        return any(mismo_autor(c["autor"], e["autor"]) for e in elegidos)

    def cabe(c, ronda):
        return ronda == 2 or por_estado[c["juicio"]["estado"]] < tope_estado

    def tomar(c, donde_, isbn, reemplaza=None, parecido=None, por_que=""):
        total, partes = puntaje(c, donde_, isbn, perfil)
        elegidos.append(dict(c, donde=donde_, isbn=isbn, total=total, partes=partes,
                             reemplaza=reemplaza, parecido_al_reemplazado=parecido, por_que_parecido=por_que))
        ya.add(c["clave"])
        por_estado[c["juicio"]["estado"]] += 1

    for ronda in (1, 2):   # la primera respeta el tope por estado; la segunda llena si faltan
        for c in validos:
            if len(elegidos) >= cuantos:
                break
            if c["clave"] in ya or c["clave"] in intentados or autor_ya(c) or not cabe(c, ronda):
                continue
            donde_, isbn, motivo = tiendas.confirmar(c)
            if donde_:
                tomar(c, donde_, isbn)
                continue
            intentados.add(c["clave"])
            if motivo != "no":   # no respondieron o no trae ISBN: no entra, y no se dice que no se consigue
                continue
            # No se consigue: una sola búsqueda del más parecido, entre los que sí se consiguen según su marca.
            no_se_consiguen.append(c)
            pool = [p for p in validos if p["clave"] not in ya and p["clave"] not in intentados
                    and not autor_ya(p) and tiendas.segun_marca(p) and cabe(p, ronda)]
            sust, par, por_que = mas_parecido(c, pool[:POOL_PARECIDO], llamar, avisos)
            if sust is None:
                continue
            donde_s, isbn_s, _ = tiendas.confirmar(sust)
            if donde_s:
                tomar(sust, donde_s, isbn_s, reemplaza=c, parecido=par, por_que=por_que)
            else:
                intentados.add(sust["clave"])
    return elegidos, no_se_consiguen, validos


def ordenar(elegidos):
    """El orden de la lista: por puntaje (y por título si empatan), sin dos seguidos del mismo ánimo mientras se pueda.
    En cada paso va el mejor de un ánimo distinto del anterior; si un ánimo distinto del anterior tiene más de la mitad
    de lo que falta, va el mejor de ese ánimo, porque si no, al final quedarían dos seguidos que se podían evitar."""
    resto = sorted(elegidos, key=lambda c: (-c["total"], normalizar(c["titulo"])))
    orden = []
    while resto:
        previo = orden[-1]["juicio"]["estado"] if orden else None
        cuenta = {}
        for c in resto:
            cuenta[c["juicio"]["estado"]] = cuenta.get(c["juicio"]["estado"], 0) + 1
        forzado = next((e for e, n in cuenta.items() if e != previo and 2 * n > len(resto)), None)
        if forzado:
            k = next(n for n, c in enumerate(resto) if c["juicio"]["estado"] == forzado)
        else:
            k = next((n for n, c in enumerate(resto) if c["juicio"]["estado"] != previo), 0)
        orden.append(resto.pop(k))
    return orden


def erratas(perfil, cands):
    """Los que pasarían todo lo demás pero el catálogo trae mal escritos: para corregirlos en el maestro."""
    malos = [c for c in cands if c.get("juicio") and c["juicio"].get("errata")
             and not pasa(c, perfil, con_errata=False, con_segundo=False)]
    malos.sort(key=lambda c: (-potencial(c, perfil), normalizar(c["titulo"])))
    return [{"titulo": c["titulo"], "autor": c["autor"], "titulo_bien": c["juicio"]["titulo_bien"],
             "autor_bien": c["juicio"]["autor_bien"]} for c in malos]


# ─────────────────────────────── la salida ───────────────────────────────

def fechas_de_publicacion(ahora, despues_de, cuantas, perfil):
    """Las fechas en que saldrían los libros nuevos si cada uno se consigue el día que le toca: los lunes y jueves que
    vienen, saltando los que ocupan los títulos que ya están en la lista. Un lunes o jueves cuenta mientras su horno no
    haya pasado (su hora en UTC más el margen): hasta entonces, el primer título de la lista todavía es de ese día.
    «ahora» es un datetime en UTC."""
    d = ahora.date()
    corte = datetime.datetime.combine(d, datetime.time(HORA_DEL_HORNO[perfil] + MARGEN_DEL_HORNO),
                                      tzinfo=datetime.timezone.utc)
    fechas = [d] if d.weekday() in DIAS_DE_EDICION and ahora < corte else []
    while len(fechas) < despues_de + cuantas:
        d += datetime.timedelta(days=1)
        if d.weekday() in DIAS_DE_EDICION:
            fechas.append(d)
    return fechas[despues_de:despues_de + cuantas]


def ahora_de(a):
    """El momento de la corrida en UTC; con --fecha, el final de ese día (como si su horno ya hubiera pasado)."""
    if getattr(a, "fecha", ""):
        return datetime.datetime.combine(datetime.date.fromisoformat(a.fecha), datetime.time(23, 59),
                                         tzinfo=datetime.timezone.utc)
    return datetime.datetime.now(datetime.timezone.utc)


def fecha_de_mexico(ahora):
    """La fecha en México de un momento en UTC: la que lee Badir (la del título, la de la marca en la lista)."""
    return ahora.astimezone(MEXICO).date()


def fecha_corta(d, hoy):
    """«lun 21 dic»; con el año si no es el de hoy («lun 4 ene 2027»)."""
    texto = f"{DIAS_CORTOS[d.weekday()]} {d.day} {MESES_CORTOS[d.month - 1]}"
    return texto if d.year == hoy.year else f"{texto} {d.year}"


def titulos_en_lista(app_raiz, perfil):
    return len(lista_semanal.lineas_utiles(os.path.join(app_raiz, LISTAS[perfil])))


def recordatorio(perfil, app_raiz, ahora):
    """El comentario para la propuesta que sigue abierta: menciona a Badir y dice hasta cuándo alcanza la lista."""
    n = titulos_en_lista(app_raiz, perfil)
    nombre = DE_LA_LISTA[perfil]
    hoy = ahora.date()
    if n:
        ultima = fechas_de_publicacion(ahora, 0, n, perfil)[-1]
        quedan = (f"A la lista {nombre} " + ("le queda 1 título: alcanza" if n == 1 else f"le quedan {n} títulos: alcanzan")
                  + f" hasta el {fecha_corta(ultima, hoy)}, si cada uno se consigue el día que le toca.")
    else:
        siguiente = fechas_de_publicacion(ahora, 0, 1, perfil)[0]
        quedan = (f"La lista {nombre} está vacía: si no das Merge antes, el {fecha_corta(siguiente, hoy)} no sale "
                  f"edición {nombre}.")
    return (f"@badirnakid, esta propuesta sigue esperando tu Merge. {quedan} Si ya no la quieres, ciérrala; si quieres "
            "quitar alguno, quítale su palomita.")


MOMENTO_SISTEMA = """Eres el juez editorial de Triggui. Triggui manda la idea de un gran libro para mejorar el ánimo de quien la lee y darle ganas de abrir el libro físico; desde noviembre de 2026 sale lunes y jueves. Te doy los libros propuestos, en orden, con la fecha en que saldría cada uno.

1. momento: para cada libro (por su i), hasta 15 palabras en español sobre el momento del calendario que esa fecha trae y que el libro acompaña bien o mal: una fiesta, una temporada, el fin o el inicio de año, el regreso a clases, en México y en los países de habla hispana. Solo el calendario que se conoce de antemano; nunca noticias ni sucesos que no puedes saber. Si la fecha no trae nada que decir, nota "".
2. variables: hasta 3 variables nuevas que harían más precisa la curaduría para el momento del mundo, como el Pulse de Triggui (la atmósfera del mundo por país, leída de Wikipedia y del tono de las noticias). Para cada una: nombre (hasta 6 palabras), que_mide (hasta 20 palabras), de_donde (de dónde saldría el dato, hasta 20 palabras; si pide una cuenta o una llave, dilo) y como_cambia (cómo cambiaría la elección, hasta 25 palabras). No repitas las que ya se usan: {en_uso}.
Responde solo con el JSON pedido."""


def esquema_momento():
    return {"type": "object", "additionalProperties": False, "required": ["momento", "variables"], "properties": {
        "momento": {"type": "array", "items": {"type": "object", "additionalProperties": False, "required": ["i", "nota"],
                                               "properties": {"i": {"type": "integer"}, "nota": {"type": "string"}}}},
        "variables": {"type": "array", "items": {"type": "object", "additionalProperties": False,
                                                 "required": ["nombre", "que_mide", "de_donde", "como_cambia"],
                                                 "properties": {k: {"type": "string"} for k in
                                                                ("nombre", "que_mide", "de_donde", "como_cambia")}}}}}


def momento_y_variables(perfil, elegidos, hoy, llamar, avisos, en_juego=()):
    """Una llamada al juez: el momento del calendario de cada fecha y hasta tres variables sugeridas. Si falla, la propuesta
    sale sin esa parte y con su aviso. Devuelve ({i: nota}, [variables])."""
    libros = [{"i": i, "titulo": c["titulo"], "autor": c["autor"], "estado": NOMBRE_ESTADO[c["juicio"]["estado"]],
               "de_que_trata": c["juicio"].get("de_que_trata", ""),
               "sale": f"{fecha_corta(datetime.date.fromisoformat(c['sale']), hoy)} ({c['sale']})"}
              for i, c in enumerate(elegidos) if c.get("sale")]
    if not libros:
        return {}, []
    catalogo = "Kids (niñas y niños de 3 a 12 años)" if perfil == "kids" else "adultos"
    usuario = (f"Catálogo: {catalogo}. Hoy es {hoy.isoformat()}.\n"
               f"Libros propuestos, en orden:\n{json.dumps(libros, ensure_ascii=False)}")
    try:
        en_uso = list(VARIABLES_EN_USO) + [f"{v['nombre']} ({v['estado']})" for v in en_juego]
        r = llamar(MOMENTO_SISTEMA.format(en_uso="; ".join(en_uso)), usuario, esquema_momento(),
                   1500 + 150 * len(libros))
    except Exception as e:
        avisos.append(f"No pude pedirle al juez el momento de cada fecha ni las variables sugeridas ({e}); la propuesta "
                      "sale sin esa parte.")
        return {}, []
    notas = {}
    for m in (r or {}).get("momento") or []:
        i = m.get("i")
        if isinstance(i, int) and 0 <= i < len(elegidos):
            notas[i] = " ".join(str(m.get("nota") or "").split())[:140]
    variables = []
    for v in ((r or {}).get("variables") or [])[:3]:
        limpia = {k: " ".join(str(v.get(k) or "").split())[:220] for k in ("nombre", "que_mide", "de_donde", "como_cambia")}
        limpia["nombre"] = re.sub(r"[«»]", "", limpia["nombre"]).strip()[:80]   # el nombre va entre «» en su casilla
        if limpia["nombre"] and limpia["que_mide"]:
            variables.append(limpia)
    return notas, variables


def _celda(t):
    return str(t or "").replace("|", "/").replace("\n", " ").strip()


def _frase(t):
    """La frase cerrada con punto si no trae su signo: así las partes no quedan pegadas."""
    t = str(t or "").strip()
    return t if not t or t[-1] in ".!?…»)" else t + "."


def _y(partes):
    """«a», «a y b», «a, b y c»."""
    partes = [p for p in partes if p]
    if len(partes) <= 1:
        return "".join(partes)
    return ", ".join(partes[:-1]) + " y " + partes[-1]


def _n(cantidad, singular, plural):
    return f"{cantidad} {singular if cantidad == 1 else plural}"


TOPE_ERRATAS = 30   # las que se muestran en la propuesta; todas van en el registro de la corrida


def linea_de(c):
    """La línea de la lista para un libro elegido: la misma que el robot agrega a lista-<lista>.txt."""
    return lista_semanal.limpiar(f"{c['titulo']} | {c['autor']}")


def registro_compacto(perfil, fecha, elegidos, sugeridas, costo_usd=None):
    """Lo que scripts/decisiones.py necesita de la propuesta: cada libro con su número, su línea y sus datos, las
    variables sugeridas (para ponerlas a prueba con su casilla) y lo que costó el juez, si se sabe (para el tablero)."""
    return {"v": 1, "lista": perfil, "fecha": fecha, "marca": f"{MARCA_PROPUESTA}{fecha}: entra con el Merge de Badir",
            "costo_usd": costo_usd,
            "libros": [{"n": n, "linea": linea_de(c), "clave": c["clave"], "estado": c["juicio"]["estado"],
                        "total": c["total"], "edad": c["juicio"].get("edad", ""),
                        "variables": c["juicio"].get("variables") or {}} for n, c in enumerate(elegidos, 1)],
            "variables": [dict(v) for v in sugeridas]}


def registro_a_texto(reg):
    """El registro escondido al final de la descripción: un comentario HTML con el JSON en base64 (sin «-->» posible)."""
    crudo = json.dumps(reg, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return f"{REGISTRO_INICIO}{base64.b64encode(crudo).decode('ascii')} -->"


def leer_registro(cuerpo):
    """El registro de una descripción, o None si no lo trae o no se puede leer."""
    m = re.search(re.escape(REGISTRO_INICIO) + r"([A-Za-z0-9+/=]+) -->", cuerpo or "")
    if not m:
        return None
    try:
        reg = json.loads(base64.b64decode(m.group(1), validate=True).decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return None
    return reg if isinstance(reg, dict) and isinstance(reg.get("libros"), list) else None


def texto_entran(perfil):
    return (f"Todos llevan palomita. Si no quieres alguno, quítasela: en unos minutos el robot lo saca de esta propuesta, lo "
            f"anota en `{DESCARTADOS[perfil]}` para no volver a proponértelo y te contesta aquí. Si fue un error, vuelve a "
            "ponérsela. Si quieres decir por qué, deja un comentario: el juez lo lee desde la próxima propuesta.")


TEXTO_PROBAR = ("Ideas del juez para medir mejor el momento, sin comprobar. Si quieres probar una, márcala: al cerrar esta "
                "propuesta (con Merge o sin él) queda a prueba, y desde la siguiente el juez la califica y la tabla la muestra "
                "sin mover el puntaje. Para que cuente en el puntaje, dilo en el chat con Claude.")


def casilla_probar(v):
    return (f"- [ ] Probar «{v['nombre']}» · {_frase(_celda(v['que_mide']))} Dato: {_frase(_celda(v.get('de_donde')))} "
            f"Cambiaría: {_frase(_celda(v.get('como_cambia')))}")


def markdown(perfil, fecha, elegidos, resumen, avisos, malos=(), variables=(), en_juego=(), costo_usd=None):
    kids = perfil == "kids"
    de_la_lista = DE_LA_LISTA[perfil]
    activas = [v for v in en_juego if v["estado"] == "activa" and v["peso"]]
    a_prueba = [v for v in en_juego if v not in activas]
    lineas = [
        f"## 🗳️ Propuesta de libros · {'Kids' if kids else 'adultos'} · {fecha}",
        "",
        f"@badirnakid, estos son los libros que el robot propone para la lista {de_la_lista}. Si estás de acuerdo, dale "
        "**Merge**: entran al final de la lista en este orden, y el horno los publica los lunes y los jueves, el primero "
        "que se consiga ese día. Nada se publica sin tu Merge.",
        "",
        "### ¿Entran?",
        "",
        texto_entran(perfil),
        "",
    ]
    # Las casillas van antes de cualquier sección plegable: en la app de GitHub, un toque puede caer en una casilla
    # escondida dentro de una sección plegada (error conocido de mayo de 2026). Dentro de lo plegable no hay casillas.
    lineas += [f"- [x] {n} · {linea_de(c)}" for n, c in enumerate(elegidos, 1)]
    lineas.append("")
    hoy = datetime.date.fromisoformat(fecha)
    cab = "| # | Portada | Libro | " + ("Edad | " if kids else "") + "Puntaje | Ánimo | Dónde | Sale | Por qué |"
    sep = "|---|---|---|" + ("---|" if kids else "") + "---|---|---|---|---|"
    lineas += [cab, sep]
    for n, c in enumerate(elegidos, 1):
        j, p = c["juicio"], c["partes"]
        portada = f'<img src="{c["portada"]}" width="56">' if c.get("portada", "").startswith("https://") else ""
        libro = f"**{_celda(c['titulo'])}**<br>{_celda(c['autor'])}"
        if j.get("de_que_trata"):
            libro += f"<br><sub>{_celda(j['de_que_trata'])}</sub>"
        desglose = (f"**{c['total']:g}**<br><sub>misión {p['mision']:g} · ánimo {p['animo']:g} · libro {p['libro_real']:g}"
                    f" · tienda {p['tienda']:g} · variedad {p['variedad']:g}"
                    + "".join(f" · {_celda(v['nombre'])} {p.get(v['id'], 0):g}" for v in activas) + "</sub>")
        por_que = _celda(j["razon"])
        if c.get("reemplaza"):
            por_que += (f"<br><sub>En lugar de «{_celda(c['reemplaza']['titulo'])}», que no se consigue "
                        f"(parecido {c['parecido_al_reemplazado']:.2f})</sub>")
        if kids and j.get("delicado"):
            por_que += f"<br><sub>Para saber antes: {_celda(j['delicado'])}</sub>"
        if a_prueba:
            valores = j.get("variables") or {}
            por_que += "<br><sub>A prueba: " + "; ".join(
                f"«{_celda(v['nombre'])}» " + ("sin dato" if valores.get(v["id"]) is None else f"{valores[v['id']]:.2f}")
                for v in a_prueba) + "</sub>"
        sale = fecha_corta(datetime.date.fromisoformat(c["sale"]), hoy) if c.get("sale") else ""
        if c.get("momento"):
            sale += f"<br><sub>📅 {_celda(c['momento'])}</sub>"
        fila = f"| {n} | {portada} | {libro} | " + (f"{j['edad']} | " if kids else "") + \
               f"{desglose} | {NOMBRE_ESTADO[j['estado']]} ({j['claridad']:.2f}) | {NOMBRE_TIENDA.get(c['donde'], '')} | {sale} | {por_que} |"
        lineas.append(fila)
    quitados = _y([_n(v, *EXCLUSIONES[k]) for k, v in resumen["excluidos"].items() if v])
    revisados, no_se, reemplazos = resumen["revisados_hoy"], resumen["no_se_consiguen"], resumen["reemplazos"]
    dudas, sin_revisar = resumen.get("sin_respuesta", 0), resumen.get("sin_revisar", 0)
    if revisados or dudas or sin_revisar:
        hechas = []
        if revisados:
            hechas.append(f"{_n(revisados, 'revisado', 'revisados')} hoy en Casa del Libro y Gandhi")
        if dudas:
            hechas.append(f"{_n(dudas, 'revisión de hoy', 'revisiones de hoy')} sin respuesta clara")
        if sin_revisar:
            hechas.append(f"{_n(sin_revisar, 'libro', 'libros')} sin revisar porque las tiendas dejaron de responder")
        tiendas = _y(hechas) + f"; el resto, con su marca de menos de {DIAS_VIGENCIA} días."
    else:
        tiendas = f"con sus marcas de Casa del Libro y Gandhi de menos de {DIAS_VIGENCIA} días; ninguno hizo falta revisarlo hoy."
    if no_se:
        tiendas += (f" {_n(no_se, 'de los mejores no se conseguía', 'de los mejores no se conseguían')}"
                    + (f"; {_n(reemplazos, 'entró en su lugar por parecido', 'entraron en su lugar por parecido')}"
                       if reemplazos else "") + ".")
    n_criterio, n_casos = resumen.get("criterio", 0), resumen.get("casos", 0)
    if n_criterio or n_casos:
        criterio = (f"el juez leyó {_n(n_criterio, 'regla', 'reglas')} de tu criterio (`{CRITERIO}`) y "
                    f"{_n(n_casos, 'decisión tuya', 'decisiones tuyas')} de esta lista (`{DECISIONES}`).")
    else:
        criterio = f"todavía no hay reglas en `{CRITERIO}` ni decisiones tuyas anotadas de esta lista."
    puntaje = ("- **Puntaje de Triggui (0 a 100):** misión 40, ánimo 20, libro real 15 ("
               + ("ISBN de la tienda" if kids else "ISBN de la tienda 10 y portada 5") + "), tienda 15 (las dos tiendas 15, "
               "solo Casa del Libro 13, solo Gandhi 11) y variedad 10 (que no se parezca a las últimas ediciones).")
    if activas:
        resto = 100 - sum(v["peso"] for v in activas)
        puntaje += (f" Con las variables activas, eso vale {resto:g} de 100, en proporción, y se suman "
                    + _y([f"«{_celda(v['nombre'])}» {v['peso']:g}" for v in activas]) + ".")
    lineas += [
        "",
        "### Cómo se eligió",
        "",
        f"- **Candidatos:** {resumen['maestro']} del catálogo maestro; "
        + (f"quedaron {resumen['candidatos']} al quitar {quitados}." if quitados else "todos son candidatos."),
        f"- **El juez de Triggui** calificó {resumen['juzgados']}; pasaron lo duro {resumen['validos']} (lo conoce, el "
        f"catálogo lo trae bien escrito, misión de {MIN_MISION:g} o más"
        + (", apto y con edad, y el segundo juez, de otro modelo, también lo vio apto" if kids else "") + ").",
        f"- **Tu criterio:** {criterio}",
        f"- **Tiendas:** {tiendas}",
        puntaje,
    ]
    if a_prueba:
        lineas.append("- **Variables a prueba:** " + _y([f"«{_celda(v['nombre'])}» ({_celda(v['que_mide'])})" for v in a_prueba])
                      + ". El juez las califica de 0 a 1 en cada libro y no mueven el puntaje.")
    lineas += [
        f"- **Variedad de ánimo:** ningún estado con más de {resumen['tope_estado']} de {resumen['cuantos']}, mientras hubo con qué.",
        "- **Orden:** por puntaje, sin dos seguidos del mismo ánimo mientras se pudo.",
        f"- **Sale:** la fecha estimada, a dos por semana (lunes y jueves) después de "
        f"{_n(resumen.get('en_lista', 0), 'título que ya está', 'títulos que ya están')} en la lista, si cada uno se consigue "
        "el día que le toca y si das Merge antes de la primera fecha." + (" El 📅 es el momento del calendario que ve el juez; no cambia el puntaje."
                                 if any(c.get("momento") for c in elegidos) else ""),
    ]
    if variables:
        lineas += ["", "### 🧭 Para afinar la curaduría", "", TEXTO_PROBAR, ""]
        lineas += [casilla_probar(v) for v in variables]
    if malos:
        lineas += ["", f"<details><summary>Erratas del catálogo ({len(malos)})</summary>", "",
                   "Estos pasarían lo demás" + (" del primer juez (el segundo los revisa cuando el catálogo los traiga bien "
                                                "escritos)" if kids else "") + ", pero el catálogo maestro los trae con una "
                   "errata o sin un acento, y el horno publica el título y el autor del catálogo. No entraron; con tu go, una "
                   "sesión los corrige en el catálogo y quedan para la próxima propuesta.", ""]
        lineas += [f"- «{_celda(m['titulo'])}» de {_celda(m['autor'])} → «{_celda(m['titulo_bien'])}» de {_celda(m['autor_bien'])}"
                   for m in malos[:TOPE_ERRATAS]]
        if len(malos) > TOPE_ERRATAS:
            lineas.append(f"- y {len(malos) - TOPE_ERRATAS} más, en el registro de la corrida.")
        lineas += ["", "</details>"]
    if avisos:
        lineas += ["", "### Avisos", ""] + [f"- {a}" for a in avisos]
    lineas += ["", "<sub>Lo armó el robot de propuestas (`scripts/curaduria.py`, C480 y C492). Al publicar, el horno vuelve a "
               "revisar que se consiga; si un libro ya no está, lo salta y lo deja en la lista.</sub>", "",
               registro_a_texto(registro_compacto(perfil, fecha, elegidos, variables, costo_usd)), ""]
    return "\n".join(lineas)


def main(argv=None):
    p = argparse.ArgumentParser(description="El robot de propuestas de Triggui.")
    p.add_argument("--lista", choices=("adultos", "kids"), required=True)
    p.add_argument("--cuantos", type=int, default=0, help="cuántos proponer (por omisión, hasta META)")
    p.add_argument("--forzar", action="store_true", help="proponer aunque a la lista le queden UMBRAL o más")
    p.add_argument("--app", default=".")
    p.add_argument("--contenido", default="triggui-content")
    p.add_argument("--nucleus", default=os.path.join("experiments", "nucleus"))
    p.add_argument("--salida", default="/tmp/triggui-propuesta")
    p.add_argument("--fecha", default="")
    p.add_argument("--recordatorio", action="store_true", help="solo escribir el recordatorio de la propuesta abierta")
    a = p.parse_args(argv)
    if a.recordatorio:
        print(recordatorio(a.lista, a.app, ahora_de(a)))
        return 0
    return correr(a, juez=None, revisar=None)


def correr(a, juez=None, revisar=None, juez2=None):
    """El cuerpo de main, con los jueces y la revisión de tiendas inyectables (las pruebas no tocan la red). Las fechas que
    lee Badir van en la hora de México; las marcas de tiendas, en UTC, como las escribe el horno."""
    ahora = ahora_de(a)
    hoy = ahora.date()
    hoy_mx = fecha_de_mexico(ahora)
    cands, excluidos, en_lista = candidatos(a.lista, a.contenido, a.app)
    if not a.forzar and en_lista >= UMBRAL:
        print(f"ℹ️  La lista {a.lista} tiene {en_lista} títulos (el robot propone con menos de {UMBRAL}): no hace falta.", file=sys.stderr)
        return 0
    if a.cuantos and not (1 <= a.cuantos <= 40):
        print(f"🔴 «cuantos» va de 1 a 40 (llegó {a.cuantos}).", file=sys.stderr)
        return 2
    cuantos = a.cuantos or max(META - en_lista, 4)
    avisos = []
    llamar = juez or juez_ia(a.lista, avisos)
    llamar2 = juez2 or juez or juez_ia(a.lista, avisos, papeles=("mini", "mini"))
    criterio = leer_criterio(a.app)
    casos = leer_casos(a.app, a.lista)
    en_juego, aviso_variables = leer_variables(a.app)
    if aviso_variables:
        avisos.append(aviso_variables)
    ruta_tiendas = os.path.join(a.contenido, "data", "tiendas.json")
    if revisar is None:
        revisar = revisar_con_horno(a.nucleus, ruta_tiendas)
    tiendas = Tiendas(ruta_tiendas, a.nucleus, hoy, revisar)
    juicios = juzgar(a.lista, cands, recientes(a.lista, a.contenido), llamar, avisos, criterio, casos, en_juego)
    for i, c in enumerate(cands):
        c["juicio"] = juicios.get(i)
    segundo_juez(a.lista, cands, llamar2, avisos, criterio)
    elegidos, no_se_consiguen, validos = elegir(a.lista, cands, cuantos, tiendas, llamar, avisos)
    elegidos = ordenar(elegidos)
    for c, d in zip(elegidos, fechas_de_publicacion(ahora, en_lista, len(elegidos), a.lista)):
        c["sale"] = d.isoformat()
    notas, variables = momento_y_variables(a.lista, elegidos, hoy_mx, llamar, avisos, en_juego) if elegidos else ({}, [])
    for i, c in enumerate(elegidos):
        c["momento"] = notas.get(i, "")
    malos = erratas(a.lista, cands)
    if tiendas.sin_respuesta:
        avisos.append(f"En {_n(tiendas.sin_respuesta, 'revisión', 'revisiones')} de hoy las tiendas no dieron una respuesta "
                      "clara (no respondieron, o la red falló): esos libros no entraron esta vez, y nadie entró en su lugar.")
    if tiendas.cortado:
        avisos.append(f"Las tiendas no respondieron {SEGUIDAS_SIN_RESPUESTA} veces seguidas y dejé de revisarlas, como hace "
                      f"el horno: {_n(tiendas.sin_revisar, 'libro sin marca vigente se quedó', 'libros sin marca vigente se quedaron')} "
                      "sin revisar y no entraron.")
    if tiendas.sin_isbn:
        avisos.append(f"{_n(tiendas.sin_isbn, 'libro se consigue', 'libros se consiguen')} pero sin ISBN registrado: "
                      "no entraron esta vez.")
    registro_ia = os.environ.get("TRIGGUI_IA_REGISTRO")
    costo_usd = None
    if registro_ia and juez is None:
        n, usd = costo_ia(registro_ia, os.path.join(os.path.dirname(AQUI), "ia", "config.json"))
        if n:
            costo_usd = usd
            avisos.append(f"El juez hizo {n} llamadas en esta corrida: unos {usd * 100:.1f} centavos de dólar.")
    os.makedirs(a.salida, exist_ok=True)
    resumen = {"maestro": sum(len(leer_csv(os.path.join(a.contenido, r))) for r in MAESTROS[a.lista]),
               "candidatos": len(cands), "excluidos": excluidos, "juzgados": len(juicios), "validos": len(validos),
               "revisados_hoy": tiendas.revisados, "sin_respuesta": tiendas.sin_respuesta, "sin_revisar": tiendas.sin_revisar,
               "no_se_consiguen": len(no_se_consiguen),
               "reemplazos": sum(1 for c in elegidos if c.get("reemplaza")), "cuantos": cuantos,
               "tope_estado": max(1, math.ceil(cuantos / 3)), "en_lista": en_lista,
               "criterio": len(criterio), "casos": len(casos)}
    registro = {"lista": a.lista, "fecha": hoy_mx.isoformat(), "resumen": resumen, "avisos": avisos, "en_juego": en_juego,
                "elegidos": [{k: v for k, v in c.items() if k != "reemplaza"} | ({"reemplaza": c["reemplaza"]["titulo"]} if c.get("reemplaza") else {})
                             for c in elegidos],
                "erratas": malos, "variables": variables}
    with open(os.path.join(a.salida, f"propuesta-{a.lista}.json"), "w", encoding="utf-8") as f:
        json.dump(registro, f, ensure_ascii=False, indent=2)
    if malos:
        print(f"✏️  {len(malos)} libros que pasarían lo demás vienen mal escritos en el catálogo (están en el registro).", file=sys.stderr)
    if not elegidos:
        print(f"🟡 No encontré ningún libro que pase todo para la lista {a.lista}.", file=sys.stderr)
        return 2
    with open(os.path.join(a.salida, f"propuesta-{a.lista}.md"), "w", encoding="utf-8") as f:
        f.write(markdown(a.lista, hoy_mx.isoformat(), elegidos, resumen, avisos, malos, variables, en_juego, costo_usd))
    with open(os.path.join(a.salida, f"lineas-{a.lista}.txt"), "w", encoding="utf-8") as f:
        f.write(f"{MARCA_PROPUESTA}{hoy_mx.isoformat()}: entra con el Merge de Badir\n")
        for c in elegidos:
            f.write(lista_semanal.limpiar(f"{c['titulo']} | {c['autor']}") + "\n")
    if a.lista == "kids":
        previas = {}
        try:
            with open(os.path.join(a.app, EDADES_ARCHIVO), encoding="utf-8") as f:
                previas = json.load(f) or {}
        except (OSError, ValueError):
            previas = {}
        edades = previas.get("edades") or {}
        for c in elegidos:
            edades[c["clave"]] = c["juicio"]["edad"]
        with open(os.path.join(a.salida, EDADES_ARCHIVO), "w", encoding="utf-8") as f:
            json.dump({"_nota": "La edad de cada libro Kids (3-5, 6-8 o 9-12), con la clave de data/tiendas.json "
                                "(título y autor en minúsculas). La pone el robot de propuestas (C480) y entra con el "
                                "Merge de Badir.", "edades": dict(sorted(edades.items()))},
                      f, ensure_ascii=False, indent=2)
            f.write("\n")
    print(f"🗳️ Propuesta {a.lista}: {len(elegidos)} libros ({resumen['reemplazos']} por parecido).", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
