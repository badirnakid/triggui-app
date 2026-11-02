"""Equivalencia de C278 en Python: la función llm() de resolve-videos.py y de resolve-musica.py, versión de antes
contra versión de ahora, con el proveedor openai. Deben mandar la misma petición (ruta, llave y bytes), devolver lo
mismo y mapear los errores igual. Después, la versión de ahora con el proveedor claude (sin llaves de OpenAI) contra
una Messages API local. Sin red: un servidor local imita a los dos.

Uso (lo llama ia/prueba-equivalencia.mjs; también solo):
  python3 -I ia/prueba_equivalencia.py --base=<raíz de antes> --nuevo=<raíz de ahora> --contenido=<triggui-content>
"""
import http.server
import importlib.util
import json
import os
import sys
import tempfile
import threading
import urllib.error


def arg(k, d=None):
    for a in sys.argv[1:]:
        if a.startswith("--" + k + "="):
            return a.split("=", 1)[1]
    return d


BASE, NUEVO, CONTENIDO = arg("base"), arg("nuevo"), arg("contenido")
if not (BASE and NUEVO and CONTENIDO):
    print("uso: --base=… --nuevo=… --contenido=…")
    sys.exit(2)

recibidas, guion = [], []


class Imitacion(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        n = int(self.headers.get("content-length") or 0)
        cuerpo = self.rfile.read(n)
        recibidas.append({"ruta": self.path, "auth": self.headers.get("authorization", ""),
                          "tipo": self.headers.get("content-type", ""), "cuerpo": cuerpo,
                          "x-api-key": self.headers.get("x-api-key", ""), "version": self.headers.get("anthropic-version", "")})
        status, data = guion.pop(0) if guion else (200, {"ok": True})
        b = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)


srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Imitacion)
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = "http://127.0.0.1:%d/v1/chat/completions" % srv.server_address[1]

# Config de la versión nueva apuntando al servidor local (antes de cargarla: ia.py lee la ruta al importarse)
real = json.load(open(os.path.join(NUEVO, "ia", "config.json"), encoding="utf-8"))
real["openai"] = {"url": URL}
real["claude"] = dict(real["claude"], url=URL.replace("/v1/chat/completions", "/v1/messages"))
ruta_cfg = os.path.join(tempfile.mkdtemp(), "config.json")
json.dump(real, open(ruta_cfg, "w", encoding="utf-8"))
os.environ["TRIGGUI_IA_CONFIG"] = ruta_cfg
os.environ.pop("TRIGGUI_IA_PROVEEDOR", None)
os.environ.pop("ANTHROPIC_API_KEY", None)
LLAVE = "sk-prueba-equivalencia"
os.environ["OPENAI_KEY"] = LLAVE
os.environ["OPENAI_API_KEY"] = LLAVE


def carga(raiz, archivo, nombre):
    spec = importlib.util.spec_from_file_location(nombre, os.path.join(raiz, "scripts", archivo))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


vb, vn = carga(BASE, "resolve-videos.py", "v_base"), carga(NUEVO, "resolve-videos.py", "v_nuevo")
mb, mn = carga(BASE, "resolve-musica.py", "m_base"), carga(NUEVO, "resolve-musica.py", "m_nuevo")
vb.OPENAI_URL = URL
mb.OPENAI_URL = URL

fallas = total = 0


def ok(c, nombre, detalle=""):
    global fallas, total
    total += 1
    print(("  ✔ " if c else "  ✘ ") + nombre + ("" if c else (" · " + detalle if detalle else "")))
    if not c:
        fallas += 1


def respuesta(contenido):
    return (200, {"id": "x", "object": "chat.completion", "model": "gpt-4o-mini",
                  "choices": [{"index": 0, "message": {"role": "assistant", "content": contenido}, "finish_reason": "stop"}],
                  "usage": {"prompt_tokens": 1, "completion_tokens": 1, "total_tokens": 2}})


def una(fn, *args, resp):
    del recibidas[:]
    guion[:] = [resp]
    try:
        r = ("ok", fn(*args))
    except Exception as e:  # noqa: BLE001
        r = (type(e).__name__, str(e), getattr(e, "code", None))
    return r, list(recibidas)


def igual(nombre, a, b):
    (ra, qa), (rb, qb) = a, b
    misma = len(qa) == len(qb) and all(x["ruta"] == y["ruta"] and x["auth"] == y["auth"] and x["tipo"] == y["tipo"]
                                       and x["cuerpo"] == y["cuerpo"] for x, y in zip(qa, qb))
    ok(misma, nombre + ": misma petición (ruta, llave, tipo y bytes)",
       "antes %r · ahora %r" % ([x["cuerpo"][:160] for x in qa], [x["cuerpo"][:160] for x in qb]))
    ok(ra == rb, nombre + ": mismo resultado", "antes %r · ahora %r" % (ra, rb))
    ok(all(b'"model": "gpt-4o-mini"' in x["cuerpo"] for x in qb), nombre + ": el modelo sale resuelto (nunca un papel)")


print("resolve-videos.py · llm()")
esq_v = json.load(open(os.path.join(CONTENIDO, "prompts", "schemas", "video-armonia.json"), encoding="utf-8"))
uj = json.dumps({"edicion": {"titulo": "Ganbatte!", "frases": ["El esfuerzo es la puerta."]}, "candidatos": [{"id": "AAAAAAAAAA1", "titulo": "Charla ñ"}]}, ensure_ascii=False)
bien = respuesta(json.dumps({"veredictos": [{"id": "AAAAAAAAAA1", "armonia": 8}], "sinfonia": "Terna."}))
igual("200", una(vb.llm, "Juez de armonía «ñ»", esq_v, uj, LLAVE, resp=bien), una(vn.llm, "Juez de armonía «ñ»", esq_v, uj, True, resp=bien))
igual("401 (fatal)", una(vb.llm, "p", esq_v, uj, LLAVE, resp=(401, {"error": {"message": "invalid_api_key"}})),
      una(vn.llm, "p", esq_v, uj, True, resp=(401, {"error": {"message": "invalid_api_key"}})))
igual("500 (no fatal)", una(vb.llm, "p", esq_v, uj, LLAVE, resp=(500, {"error": "x"})), una(vn.llm, "p", esq_v, uj, True, resp=(500, {"error": "x"})))
ok(vb.MODELO == vn.MODELO == "gpt-4o-mini", "MODELO (la etiqueta del juez) es la misma: %s" % vn.MODELO)
ok(bool(vb.config([])["openai"]) == vn.config([])["ia"] is True, "con llave: la capa 2 se enciende igual")
os.environ.pop("OPENAI_KEY")
os.environ.pop("OPENAI_API_KEY")
ok(bool(vb.config([])["openai"]) == vn.config([])["ia"] is False, "sin llave: cae a capa 1 igual")
os.environ["OPENAI_KEY"] = LLAVE
os.environ["OPENAI_API_KEY"] = LLAVE

print("resolve-musica.py · llm()")
esq_m = json.load(open(os.path.join(CONTENIDO, "prompts", "schemas", "musica-queries.json"), encoding="utf-8"))
ped = {"edicion": {"titulo": "Frida", "frases": ["Pies, ¿para qué los quiero?"]}, "ya_sonaron_en_otros_libros": ["a"]}
bien = respuesta(json.dumps({"canonicas": ["Chavela Vargas La Llorona"], "afines": []}))
igual("200", una(mb.llm, "Compositor «ñ»", esq_m, ped, LLAVE, resp=bien), una(mn.llm, "Compositor «ñ»", esq_m, ped, True, resp=bien))
igual("429 (fatal)", una(mb.llm, "p", esq_m, ped, LLAVE, resp=(429, {"error": "rate"})), una(mn.llm, "p", esq_m, ped, True, resp=(429, {"error": "rate"})))
igual("500 (lanza HTTPError)", una(mb.llm, "p", esq_m, ped, LLAVE, resp=(500, {"error": "x"})), una(mn.llm, "p", esq_m, ped, True, resp=(500, {"error": "x"})))
ok(mb.MODELO == mn.MODELO == "gpt-4o-mini", "MODELO (la etiqueta del juez) es la misma: %s" % mn.MODELO)
ok(bool(mb.config([])["openai"]) == mn.config([])["ia"] is True, "con llave: compositor y juez se encienden igual")

print("Claude simulado (proveedor claude, sin llaves de OpenAI)")
os.environ["TRIGGUI_IA_PROVEEDOR"] = "claude"
os.environ["ANTHROPIC_API_KEY"] = "sk-ant-prueba"
os.environ.pop("OPENAI_KEY", None)
os.environ.pop("OPENAI_API_KEY", None)
vc, mc = carga(NUEVO, "resolve-videos.py", "v_claude"), carga(NUEVO, "resolve-musica.py", "m_claude")


def mensaje(texto):
    return (200, {"id": "msg", "type": "message", "role": "assistant", "model": "claude-haiku-5-5",
                  "content": [{"type": "text", "text": texto}], "stop_reason": "end_turn",
                  "usage": {"input_tokens": 9, "output_tokens": 3}})


def cerrado(x):
    if isinstance(x, dict):
        if (x.get("type") == "object" or "properties" in x) and x.get("additionalProperties") is not False:
            return False
        malos = {"minLength", "maxLength", "minimum", "maximum", "maxItems"} & set(x.keys()) if "type" in x else set()
        return not malos and all(cerrado(v) for k, v in x.items() if k != "enum")
    if isinstance(x, list):
        return all(cerrado(v) for v in x)
    return True


def reglas(nombre, q, prompt):
    b = json.loads(q["cuerpo"].decode("utf-8"))
    ok(q["ruta"] == "/v1/messages" and q["x-api-key"] == "sk-ant-prueba" and q["version"] == "2023-06-01" and not q["auth"],
       nombre + ": va a la Messages API con su llave, su versión y sin la de OpenAI")
    ok(b["model"] == "claude-haiku-5-5" and b.get("thinking") == {"type": "disabled"} and "temperature" not in b and "response_format" not in b
       and b["system"] == prompt and b["messages"][0]["role"] == "user" and isinstance(b["max_tokens"], int),
       nombre + ": Haiku sin pensar, sin temperature, system aparte, max_tokens")
    ok(cerrado(b["output_config"]["format"]["schema"]), nombre + ": esquema aceptable para Claude (cerrado y sin largos ni mínimos)")


armonia = {"veredictos": [{"id": "AAAAAAAAAA1", "armonia": 8}], "sinfonia": "Terna."}
(r, q) = una(vc.llm, "Juez de armonía «ñ»", esq_v, uj, True, resp=mensaje(json.dumps(armonia)))
ok(r == ("ok", armonia) and len(q) == 1, "videos: el juez responde lo mismo por Claude")
reglas("videos", q[0], "Juez de armonía «ñ»")
(r, q) = una(vc.llm, "p", esq_v, uj, True, resp=(401, {"type": "error", "error": {"message": "invalid x-api-key"}}))
ok(r[0] == "LlmFatal" and r[1].startswith("Claude HTTP 401"), "videos: 401 apaga la capa 2 (LlmFatal), como antes", repr(r))
del recibidas[:]
guion[:] = [(529, {"type": "error"}), mensaje(json.dumps(armonia))]
ok(vc.llm("p", esq_v, uj, True) == armonia and len(recibidas) == 2, "videos: un 529 se reintenta y sigue")
ok(vc.MODELO == "claude-haiku-5-5", "videos: la etiqueta del juez es el modelo real (%s)" % vc.MODELO)
ok(vc.config([])["ia"] is True, "videos: con la llave de Claude (y sin la de OpenAI) la capa 2 se enciende")
queries = {"canonicas": ["Chavela Vargas La Llorona"], "afines": []}
(r, q) = una(mc.llm, "Compositor «ñ»", esq_m, ped, True, resp=mensaje(json.dumps(queries)))
ok(r == ("ok", queries) and len(q) == 1, "música: el compositor responde lo mismo por Claude")
reglas("música", q[0], "Compositor «ñ»")
del recibidas[:]
guion[:] = [(429, {"type": "error"})] * 3
try:
    mc.llm("p", esq_m, ped, True)
    ok(False, "música: 429 sostenido → LlmFatal tras los reintentos")
except mc.LlmFatal as e:
    ok(str(e) == "Claude 429" and len(recibidas) == 3, "música: 429 sostenido → LlmFatal tras 2 reintentos (%s)" % e)
ok(mc.MODELO == "claude-haiku-5-5" and mc.config([])["ia"] is True, "música: etiqueta y encendido con la llave de Claude")
os.environ.pop("ANTHROPIC_API_KEY")
ok(vc.config([])["ia"] is False and mc.config([])["ia"] is False, "sin la llave de Claude: capa 1 y mapa, sin romper")

srv.shutdown()
print("\n%d/%d comprobaciones (Python)" % (total - fallas, total))
sys.exit(1 if fallas else 0)
