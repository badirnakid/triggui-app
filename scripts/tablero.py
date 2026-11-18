#!/usr/bin/env python3
"""
🧭 El tablero de la curaduría (C492 · 17 de noviembre de 2026)

Lo corre una sesión el primer viernes de cada mes, con el resto del Cerebro (go de Badir del 17 de noviembre de 2026, 19:58;
el primer corte, el viernes 4 de diciembre de 2026). Lee la bitácora de decisiones (curaduria/decisiones.jsonl, la escribe
scripts/decisiones.py) y las variables (curaduria/variables.json), y escribe en la salida estándar el tablero en Markdown:

- la aprobación por lista: libros que entraron entre libros propuestos (la meta es 90 % o más);
- lo que Badir quitó, con su porqué, y en Kids, para decidir con él si fue algo delicado que el robot no avisó;
- las variables a prueba: su promedio en lo que entró y en lo que se quitó (si va en la dirección de Badir);
- el costo de las corridas que traen su costo;
- la escalera de confianza: si ya se puede pedir el escalón 1 («silencio es sí»).

Lo que no se mide todavía lo dice: las fallas de lo delicado las clasifica la sesión con Badir, los errores publicados no se
registran y el resultado de las ediciones espera su medición (B237, C283, B232).

Uso:  python3 -I -B scripts/tablero.py [--mes AAAA-MM] [--app .] [--hoy AAAA-MM-DD]
Sin --mes, el mes de hoy (en México). La escalera mira las últimas 8 semanas hasta --hoy.
"""
import argparse
import datetime
import importlib.util
import json
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("curaduria", os.path.join(AQUI, "curaduria.py"))
cu = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cu)

META = 0.9            # la aprobación que pide cada escalón
SEMANAS_ESCALON_1 = 8
MESES = ("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre",
         "diciembre")
LISTAS = ("adultos", "kids")
NOMBRE_LISTA = {"adultos": "Adultos", "kids": "Kids"}


def leer_decisiones(app_raiz):
    """Las entradas de la bitácora, sanas; una línea rota se salta y se cuenta."""
    entradas, rotas = [], 0
    try:
        with open(os.path.join(app_raiz, cu.DECISIONES), encoding="utf-8") as f:
            for linea in f:
                if not linea.strip():
                    continue
                try:
                    d = json.loads(linea)
                except ValueError:
                    rotas += 1
                    continue
                if isinstance(d, dict) and d.get("lista") in LISTAS and isinstance(d.get("libros"), list):
                    entradas.append(d)
                else:
                    rotas += 1
    except OSError:
        pass
    return entradas, rotas


def fecha(d):
    try:
        return datetime.date.fromisoformat(str(d.get("cerrada") or ""))
    except ValueError:
        return None


def cuentas(entradas):
    """Por lista: propuestas, libros propuestos, que entraron, quitados, fuera y cerradas sin Merge."""
    c = {l: {"propuestas": 0, "propuestos": 0, "entraron": 0, "quitados": 0, "fuera": 0, "sin_merge": 0} for l in LISTAS}
    for d in entradas:
        x = c[d["lista"]]
        x["propuestas"] += 1
        x["sin_merge"] += d.get("resultado") != "merge"
        for libro in d["libros"]:
            if not isinstance(libro, dict):
                continue
            x["propuestos"] += 1
            decision = libro.get("decision")
            x["entraron"] += decision == "entró"
            x["quitados"] += decision == "quitado"
            x["fuera"] += decision == "fuera"
    return c


def aprobacion(x):
    return x["entraron"] / x["propuestos"] if x["propuestos"] else None


def pct(v):
    return "sin datos" if v is None else f"{round(100 * v):d} %"


def promedio(valores):
    valores = [v for v in valores if isinstance(v, (int, float)) and not isinstance(v, bool)]
    return (sum(valores) / len(valores), len(valores)) if valores else (None, 0)


def variables(entradas, en_variables):
    """Por variable a prueba o activa: promedio en lo que entró, en lo que se quitó y cuántos libros traen dato."""
    filas = []
    for v in en_variables:
        entro, quito = [], []
        for d in entradas:
            for libro in d["libros"]:
                if not isinstance(libro, dict):
                    continue
                valor = (libro.get("variables") or {}).get(v["id"])
                if libro.get("decision") == "entró":
                    entro.append(valor)
                elif libro.get("decision") == "quitado":
                    quito.append(valor)
        (pe, ne), (pq, nq) = promedio(entro), promedio(quito)
        filas.append({"nombre": v["nombre"], "estado": v["estado"], "entro": pe, "quito": pq, "con_dato": ne + nq})
    return filas


def escalera(todas, hoy):
    """Por lista: (semanas de historia, aprobación en las últimas 8 semanas, ¿se puede pedir el escalón 1?)."""
    salida = {}
    desde = hoy - datetime.timedelta(weeks=SEMANAS_ESCALON_1)
    for l in LISTAS:
        suyas = [d for d in todas if d["lista"] == l and fecha(d)]
        if not suyas:
            salida[l] = (0, None, False)
            continue
        historia = (hoy - min(fecha(d) for d in suyas)).days // 7
        ventana = cuentas([d for d in suyas if desde < fecha(d) <= hoy])[l]
        a = aprobacion(ventana)
        salida[l] = (historia, a, historia >= SEMANAS_ESCALON_1 and a is not None and a >= META)
    return salida


def tablero(app_raiz, mes, hoy):
    todas, rotas = leer_decisiones(app_raiz)
    del_mes = [d for d in todas if fecha(d) and fecha(d).strftime("%Y-%m") == mes]
    c = cuentas(del_mes)
    anio, m = (int(x) for x in mes.split("-"))
    lineas = [f"## 🧭 Tablero de la curaduría · {MESES[m - 1]} de {anio}", "",
              f"De `{cu.DECISIONES}`: las propuestas que se cerraron en el mes (con Merge o sin él).", ""]
    filas = (("Propuestas cerradas", "propuestas"), ("Libros propuestos", "propuestos"), ("Entraron", "entraron"),
             ("Quitados (sin palomita)", "quitados"), ("Fuera (sin casilla)", "fuera"),
             ("Propuestas cerradas sin Merge", "sin_merge"))
    lineas += ["| | Adultos | Kids |", "|---|---|---|"]
    lineas += [f"| {nombre} | {c['adultos'][k]} | {c['kids'][k]} |" for nombre, k in filas]
    lineas.append(f"| **Aprobación** (meta: {round(100 * META)} % o más) | **{pct(aprobacion(c['adultos']))}** | "
                  f"**{pct(aprobacion(c['kids']))}** |")
    quitados = [(d, libro) for d in del_mes for libro in d["libros"]
                if isinstance(libro, dict) and libro.get("decision") == "quitado"]
    lineas += ["", "### Lo que quitaste, con tu porqué", ""]
    if quitados:
        for d, libro in quitados:
            lineas.append(f"- {NOMBRE_LISTA[d['lista']]} · propuesta #{d.get('pr')} · «{libro.get('linea')}»")
        for d in del_mes:
            for texto in d.get("comentarios") or []:
                lineas.append(f"  - Tu comentario en la #{d.get('pr')}: «{' '.join(str(texto).split())[:300]}»")
    else:
        lineas.append("- Nada: entró todo lo que se propuso con palomita.")
    kids = [libro.get("linea") for d, libro in quitados if d["lista"] == "kids"]
    lineas += ["", "### Lo delicado", "",
               "- **Fallas de lo delicado:** " + (
                   f"revisar contigo {cu._n(len(kids), 'libro Kids quitado', 'libros Kids quitados')} ("
                   + cu._y([f"«{x}»" for x in kids]) + "): cuenta como falla si lo quitaste por algo delicado que el robot "
                   "no avisó en «Para saber antes»." if kids else "ninguna: no quitaste ningún libro Kids."),
               "- **Errores publicados** (título, autor, acento o portada): no consta; todavía no se registran."]
    en_variables, _ = cu.leer_variables(app_raiz)
    lineas += ["", "### Las variables", ""]
    if en_variables:
        lineas += ["| Variable | Estado | Promedio en lo que entró | En lo que quitaste | Libros con dato |", "|---|---|---|---|---|"]
        for f in variables(todas, en_variables):
            lineas.append(f"| {cu._celda(f['nombre'])} | {f['estado']} | "
                          + " | ".join("sin dato" if x is None else f"{x:.2f}" for x in (f["entro"], f["quito"]))
                          + f" | {f['con_dato']} |")
        lineas.append("")
        lineas.append("Si una variable puntúa más alto en lo que entra que en lo que quitas, va en tu dirección; con 4 "
                      "propuestas a prueba ya se puede proponer activarla con un peso chico.")
    else:
        lineas.append("- Ninguna a prueba todavía: se pone a prueba con su casilla «Probar» en una propuesta.")
    costos = [d["costo_usd"] for d in del_mes if isinstance(d.get("costo_usd"), (int, float))]
    lineas += ["", "### Costo", "",
               f"- {cu._n(len(costos), 'propuesta trae', 'propuestas traen')} su costo: unos {sum(costos):.2f} USD."
               if costos else "- Ninguna propuesta del mes trae su costo en la bitácora."]
    lineas += ["", "### El resultado de las ediciones", "",
               "- Todavía no se mide: falta el termómetro de aperturas (B237), el registro del libro físico abierto (C283) "
               "y el lector de GA4 (B232). Sin esa señal, el puntaje es una hipótesis bien armada."]
    lineas += ["", f"### La escalera de confianza (al {hoy.day} de {MESES[hoy.month - 1]} de {hoy.year})", ""]
    for l, (historia, a, listo) in escalera(todas, hoy).items():
        if listo:
            estado = (f"se puede pedir el escalón 1 («silencio es sí»): {historia} semanas de historia y {pct(a)} de "
                      f"aprobación en las últimas {SEMANAS_ESCALON_1}, si contigo no hubo fallas de lo delicado.")
        else:
            estado = (f"escalón 0: {cu._n(historia, 'semana', 'semanas')} de historia (pide {SEMANAS_ESCALON_1}) y "
                      f"{pct(a)} de aprobación en las últimas {SEMANAS_ESCALON_1} (pide {round(100 * META)} % o más).")
        lineas.append(f"- **{NOMBRE_LISTA[l]}:** {estado}")
    if rotas:
        lineas += ["", f"Aviso: {cu._n(rotas, 'línea rota', 'líneas rotas')} en `{cu.DECISIONES}` no se contaron."]
    return "\n".join(lineas) + "\n"


def main(argv=None):
    p = argparse.ArgumentParser(description="El tablero de la curaduría.")
    p.add_argument("--mes", default="")
    p.add_argument("--app", default=".")
    p.add_argument("--hoy", default="")
    a = p.parse_args(argv)
    hoy = (datetime.date.fromisoformat(a.hoy) if a.hoy
           else cu.fecha_de_mexico(datetime.datetime.now(datetime.timezone.utc)))
    mes = a.mes or hoy.strftime("%Y-%m")
    try:
        datetime.date.fromisoformat(f"{mes}-01")
    except ValueError:
        print(f"🔴 «{mes}» no es un mes (AAAA-MM).", file=sys.stderr)
        return 2
    sys.stdout.write(tablero(a.app, mes, hoy))
    return 0


if __name__ == "__main__":
    sys.exit(main())
