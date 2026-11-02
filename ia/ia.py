"""IA de Triggui para Python: el mismo único lugar que ia.cjs (C278, 2 de noviembre de 2026).

Quien llama arma el payload de Chat Completions de siempre, con el papel "mini" o "grande" en "model" (los
nombres viejos de OpenAI son alias), y llama chat(payload, timeout). Devuelve el JSON con la forma de Chat
Completions. Los errores HTTP salen como urllib.error.HTTPError, igual que antes, para que los except de
siempre sigan valiendo.

  · con openai: la misma petición de antes (mismos bytes), solo con el modelo resuelto;
  · con claude: la Messages API, traducida y de vuelta con la forma de siempre (ver ia.cjs).

Registro de uso: con TRIGGUI_IA_REGISTRO=<archivo>, cada llamada deja una línea JSON (papel, modelo, tokens, fin,
milisegundos, reintentos y de dónde vino). Sin la variable no se escribe nada.
"""
import datetime
import inspect
import io
import json
import os
import time
import urllib.error
import urllib.request

_AQUI = os.path.dirname(os.path.abspath(__file__))
_RUTA = os.environ.get("TRIGGUI_IA_CONFIG") or os.path.join(_AQUI, "config.json")
_CFG = None


def config():
    global _CFG
    if _CFG is None:
        with open(_RUTA, encoding="utf-8") as f:
            _CFG = json.load(f)
    return _CFG


def proveedor():
    p = (os.environ.get("TRIGGUI_IA_PROVEEDOR") or config().get("proveedor") or "openai").strip().lower()
    if p not in ("openai", "claude"):
        raise ValueError("IA: proveedor desconocido «%s» (usa openai o claude)" % p)
    return p


def llave_openai():
    return (os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENAI_KEY") or "").strip()


def llave_claude():
    return (os.environ.get("ANTHROPIC_API_KEY") or "").strip()


def hay_llave():
    return bool(llave_claude() if proveedor() == "claude" else llave_openai())


def nombre_llave():
    return "ANTHROPIC_API_KEY" if proveedor() == "claude" else "OPENAI_KEY u OPENAI_API_KEY"


def nombre_proveedor():
    """Para los mensajes de error: con openai dice "OpenAI", igual que antes."""
    return "Claude" if proveedor() == "claude" else "OpenAI"


def papel(modelo):
    c = config()
    if modelo in c["papeles"]:
        return modelo
    return (c.get("alias") or {}).get(modelo)


def resolver_modelo(modelo, prov=None):
    r = papel(modelo)
    if not r:
        return modelo
    return config()["papeles"][r][prov or proveedor()]


def etiqueta(modelo):
    """Para etiquetas y registros: un papel se escribe con su modelo real; cualquier otro nombre pasa tal cual."""
    return resolver_modelo(modelo) if modelo in config()["papeles"] else modelo


_QUITAR = {"minLength", "maxLength", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum",
           "multipleOf", "maxItems", "minProperties", "maxProperties", "uniqueItems"}
_QUITAR_SIN_NOTA = {"default", "format", "$schema"}


def limpia_esquema(s):
    """Copia del esquema que Claude acepta (ver limpiaEsquema en ia.cjs)."""
    if isinstance(s, list):
        return [limpia_esquema(x) for x in s]
    if not isinstance(s, dict):
        return s
    o, notas = {}, []
    for k, v in s.items():
        if k in _QUITAR:
            notas.append("%s: %s" % (k, json.dumps(v, ensure_ascii=False)))
            continue
        if k in _QUITAR_SIN_NOTA:
            continue
        if k == "minItems" and isinstance(v, (int, float)) and not isinstance(v, bool) and v > 1:
            notas.append("minItems: %s" % json.dumps(v))
            continue
        if k in ("properties", "$defs", "definitions") and isinstance(v, dict):
            o[k] = {pk: limpia_esquema(pv) for pk, pv in v.items()}
            continue
        if k in ("enum", "required", "const"):
            o[k] = v
            continue
        o[k] = limpia_esquema(v) if isinstance(v, (dict, list)) else v
    t = o.get("type")
    if t == "object" or (isinstance(t, list) and "object" in t) or isinstance(o.get("properties"), dict):
        o["additionalProperties"] = False
    if notas:
        o["description"] = ((o["description"] + " ") if o.get("description") else "") + "(" + ", ".join(notas) + ")"
    return o


_INSTRUCCION_JSON = "Responde únicamente con un objeto JSON válido: sin texto antes ni después y sin bloques de código."


def _origen():
    """archivo:función de quien llamó (el primer marco fuera de este archivo)."""
    for f in inspect.stack()[1:]:
        if os.path.abspath(f.filename) != os.path.abspath(__file__):
            return "%s:%s" % (os.path.basename(f.filename), f.function)
    return None


def _registra(dato):
    ruta = os.environ.get("TRIGGUI_IA_REGISTRO")
    if not ruta:
        return
    try:
        with open(ruta, "a", encoding="utf-8") as f:
            f.write(json.dumps(dict({"t": datetime.datetime.now(datetime.timezone.utc).isoformat()}, **dato), ensure_ascii=False) + "\n")
    except Exception:  # noqa: BLE001  el registro nunca rompe la llamada
        pass


def _texto(c):
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        return "".join(p if isinstance(p, str) else (p or {}).get("text", "") for p in c)
    return "" if c is None else str(c)


def a_claude(params):
    c = config()
    r = papel(params.get("model"))
    modelo = c["papeles"][r]["claude"] if r else params.get("model")
    sistema, mensajes = [], []
    for m in params.get("messages") or []:
        t = _texto(m.get("content"))
        if m.get("role") in ("system", "developer"):
            sistema.append(t)
            continue
        role = "assistant" if m.get("role") == "assistant" else "user"
        if mensajes and mensajes[-1]["role"] == role:
            mensajes[-1]["content"] += "\n\n" + t
        else:
            mensajes.append({"role": role, "content": t})
    if not mensajes or mensajes[0]["role"] != "user":
        mensajes.insert(0, {"role": "user", "content": "."})
    tope = params.get("max_tokens") or params.get("max_completion_tokens") or c["claude"]["max_tokens_por_omision"]
    body = {"model": modelo,
            "max_tokens": max(tope, c["claude"].get("max_tokens_minimo") or 1),
            "messages": mensajes}
    json_libre = False
    salida = {}
    rf = params.get("response_format") or {}
    if rf.get("type") == "json_schema" and (rf.get("json_schema") or {}).get("schema"):
        salida["format"] = {"type": "json_schema", "schema": limpia_esquema(rf["json_schema"]["schema"])}
    elif rf.get("type") == "json_object":
        json_libre = True
        sistema.append(_INSTRUCCION_JSON)
    conf = c["papeles"][r] if r else None
    if conf and conf.get("claude_esfuerzo"):
        salida["effort"] = conf["claude_esfuerzo"]
    if salida:
        body["output_config"] = salida
    if conf and conf.get("claude_thinking"):
        body["thinking"] = conf["claude_thinking"]
    if sistema:
        body["system"] = "\n\n".join(sistema)
    return body, json_libre


def extrae_json(t):
    s = (t or "").strip()
    if s.startswith("```"):
        s = s.split("\n", 1)[1] if "\n" in s else ""
    if s.endswith("```"):
        s = s[:-3]
    s = s.strip()
    try:
        json.loads(s)
        return s
    except Exception:
        pass
    i, j = s.find("{"), s.rfind("}")
    if i >= 0 and j > i:
        cand = s[i:j + 1]
        try:
            json.loads(cand)
            return cand
        except Exception:
            pass
    return None


def de_claude(data, json_libre):
    textos = [b.get("text", "") for b in (data.get("content") or []) if isinstance(b, dict) and b.get("type") == "text"]
    content = "".join(textos)
    sr = data.get("stop_reason")
    finish, refusal = "stop", None
    if sr == "max_tokens":
        finish = "length"
    if sr == "refusal":
        finish, refusal, content = "content_filter", "Claude rechazó la petición (stop_reason: refusal)", ""
    json_ok = True
    if json_libre and content:
        limpio = extrae_json(content)
        if limpio is not None:
            content = limpio
        else:
            json_ok = False
    u = data.get("usage") or {}
    entrada = (u.get("input_tokens") or 0) + (u.get("cache_creation_input_tokens") or 0) + (u.get("cache_read_input_tokens") or 0)
    salida = u.get("output_tokens") or 0
    return {"id": data.get("id"), "object": "chat.completion", "model": data.get("model"),
            "choices": [{"index": 0, "message": {"role": "assistant", "content": content, "refusal": refusal}, "finish_reason": finish}],
            "usage": {"prompt_tokens": entrada, "completion_tokens": salida, "total_tokens": entrada + salida},
            "_claude": {"stop_reason": sr, "usage": u, "json_ok": json_ok if json_libre else None}}


def _post_claude(body, timeout, cuenta=None):
    cuenta = cuenta if cuenta is not None else {"reintentos": 0}
    c = config()["claude"]
    llave = llave_claude()
    if not llave:
        raise urllib.error.HTTPError(c["url"], 401, "IA: falta ANTHROPIC_API_KEY", {}, io.BytesIO(b"IA: falta ANTHROPIC_API_KEY"))
    datos = json.dumps(body, ensure_ascii=False).encode("utf-8")
    espera = 1.0
    for i in range(int(c.get("reintentos", 2)) + 1):
        req = urllib.request.Request(c["url"], data=datos, method="POST",
                                     headers={"x-api-key": llave, "anthropic-version": c["version"],
                                              "content-type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err = e
            if e.code == 429:   # tope de gasto: reintentar no sirve hasta que se libere el acceso
                cuerpo = b""
                try:
                    cuerpo = e.read()
                    tope_gasto = json.loads(cuerpo.decode("utf-8"))["error"]["details"]["error_code"] == "enforced_spend_limit_reached"
                except Exception:  # noqa: BLE001
                    tope_gasto = False
                if tope_gasto:
                    raise urllib.error.HTTPError(c["url"], 429, "IA Claude: se alcanzó el tope de gasto del espacio de trabajo (enforced_spend_limit_reached)",
                                                 e.headers, io.BytesIO(cuerpo))
                err = urllib.error.HTTPError(e.url, e.code, e.msg, e.headers, io.BytesIO(cuerpo))   # el cuerpo ya se leyó: va de nuevo
            if err.code in (408, 409, 429, 500, 502, 503, 504, 529) and i < int(c.get("reintentos", 2)):
                cuenta["reintentos"] += 1
                ra = err.headers.get("retry-after") if err.headers else None
                try:
                    pausa = min(float(ra), 60.0) if ra else espera
                except ValueError:
                    pausa = espera
                time.sleep(pausa)
                espera *= 2
                continue
            raise err
        except (urllib.error.URLError, TimeoutError, OSError):
            if i < int(c.get("reintentos", 2)):
                cuenta["reintentos"] += 1
                time.sleep(espera)
                espera *= 2
                continue
            raise


def chat(payload, timeout=90):
    """Una llamada de Chat Completions. Devuelve el dict de respuesta; los errores HTTP son urllib.error.HTTPError."""
    de = _origen() if os.environ.get("TRIGGUI_IA_REGISTRO") else None
    rol = papel(payload.get("model"))
    if proveedor() == "openai":
        p = dict(payload)
        p["model"] = resolver_modelo(payload.get("model"), "openai")
        req = urllib.request.Request(config()["openai"]["url"], data=json.dumps(p).encode("utf-8"), method="POST",
                                     headers={"Content-Type": "application/json", "Authorization": "Bearer " + llave_openai()})
        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                d = json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            _registra({"proveedor": "openai", "papel": rol, "modelo": p["model"], "origen": de, "entrada": 0, "salida": 0, "cache_lectura": 0,
                       "cache_escritura": 0, "fin": None, "ms": int((time.time() - t0) * 1000), "reintentos": 0, "error": str(e.code)})
            raise
        u = d.get("usage") or {}
        _registra({"proveedor": "openai", "papel": rol, "modelo": d.get("model") or p["model"], "origen": de,
                   "entrada": (u.get("prompt_tokens") or 0) - ((u.get("prompt_tokens_details") or {}).get("cached_tokens") or 0),
                   "salida": u.get("completion_tokens") or 0,
                   "cache_lectura": (u.get("prompt_tokens_details") or {}).get("cached_tokens") or 0, "cache_escritura": 0,
                   "fin": ((d.get("choices") or [{}])[0] or {}).get("finish_reason"), "ms": int((time.time() - t0) * 1000), "reintentos": 0, "error": None})
        return d
    body, json_libre = a_claude(payload)

    def una(intento):
        t0, cuenta = time.time(), {"reintentos": 0}
        try:
            data = _post_claude(body, timeout, cuenta)
        except Exception as e:
            _registra({"proveedor": "claude", "papel": rol, "modelo": body["model"], "origen": de, "intento": intento, "entrada": 0, "salida": 0,
                       "cache_lectura": 0, "cache_escritura": 0, "fin": None, "ms": int((time.time() - t0) * 1000),
                       "reintentos": cuenta["reintentos"], "error": "%s: %s" % (getattr(e, "code", ""), str(e)[:200])})
            raise
        r = de_claude(data, json_libre)
        u = data.get("usage") or {}
        _registra({"proveedor": "claude", "papel": rol, "modelo": data.get("model") or body["model"], "origen": de, "intento": intento,
                   "entrada": u.get("input_tokens") or 0, "salida": u.get("output_tokens") or 0,
                   "cache_lectura": u.get("cache_read_input_tokens") or 0, "cache_escritura": u.get("cache_creation_input_tokens") or 0,
                   "fin": data.get("stop_reason"), "json_ok": r["_claude"]["json_ok"] if json_libre else None,
                   "ms": int((time.time() - t0) * 1000), "reintentos": cuenta["reintentos"], "error": None})
        return r

    r = una(1)
    if json_libre and r["_claude"]["json_ok"] is False and r["choices"][0]["finish_reason"] == "stop":
        r = una(2)
    return r
