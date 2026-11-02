"""Pruebas de ia.py sin red: un servidor local imita a OpenAI y a Claude. Uso: python3 -I ia/prueba_ia.py"""
import http.server
import json
import os
import sys
import tempfile
import threading
import urllib.error

AQUI = os.path.dirname(os.path.abspath(__file__))
recibidas, guion = [], []


class Mentira(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        n = int(self.headers.get("content-length") or 0)
        cuerpo = self.rfile.read(n).decode("utf-8")
        recibidas.append({"url": self.path, "headers": {k.lower(): v for k, v in self.headers.items()}, "body": cuerpo})
        if self.path == "/openai":
            data = {"choices": [{"message": {"content": "{\"ok\": true}"}, "finish_reason": "stop"}], "usage": {"total_tokens": 3}}
            status = 200
        else:
            paso = guion.pop(0) if guion else {"status": 200, "data": {"content": [{"type": "text", "text": "{\"ok\": true}"}], "stop_reason": "end_turn", "usage": {"input_tokens": 4, "output_tokens": 2}}}
            status, data = paso["status"], paso["data"]
        b = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)


srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Mentira)
threading.Thread(target=srv.serve_forever, daemon=True).start()
P = srv.server_address[1]
real = json.load(open(os.path.join(AQUI, "config.json"), encoding="utf-8"))
prueba = dict(real, openai={"url": "http://127.0.0.1:%d/openai" % P}, claude=dict(real["claude"], url="http://127.0.0.1:%d/claude" % P))
ruta = os.path.join(tempfile.mkdtemp(), "config.json")
json.dump(prueba, open(ruta, "w"))
os.environ["TRIGGUI_IA_CONFIG"] = ruta
os.environ["OPENAI_KEY"] = "sk-de-mentira"
os.environ["ANTHROPIC_API_KEY"] = "sk-ant-de-mentira"
sys.path.insert(0, AQUI)
import ia as IA  # noqa: E402

fallas = total = 0


def ok(c, nombre, detalle=""):
    global fallas, total
    total += 1
    print(("  ✔ " if c else "  ✘ ") + nombre + ("" if c or not detalle else " · " + detalle))
    if not c:
        fallas += 1


print("OpenAI (sin cambio de comportamiento)")
os.environ["TRIGGUI_IA_PROVEEDOR"] = "openai"
esquema = {"name": "q", "strict": True, "schema": {"type": "object", "additionalProperties": False, "required": ["a"], "properties": {"a": {"type": "string", "minLength": 3}}}}
original = {"model": "gpt-4o-mini", "temperature": 0.1, "response_format": {"type": "json_schema", "json_schema": esquema},
            "messages": [{"role": "system", "content": "sis ñ"}, {"role": "user", "content": json.dumps({"x": "ü"}, ensure_ascii=False)}]}
nuevo = dict(original, model="mini")
del recibidas[:]
d = IA.chat(nuevo, timeout=10)
ok(recibidas[0]["body"] == json.dumps(original), "el cuerpo sale con los mismos bytes que el de antes")
ok(recibidas[0]["headers"].get("authorization") == "Bearer sk-de-mentira", "misma llave en Authorization")
ok(d["choices"][0]["message"]["content"] == "{\"ok\": true}", "la respuesta es la de OpenAI, tal cual")
ok(IA.hay_llave() and IA.resolver_modelo("gpt-4o", "claude") == "claude-sonnet-5-5", "llave y alias")
ok(IA.nombre_proveedor() == "OpenAI" and IA.etiqueta("mini") == "gpt-4o-mini" and IA.etiqueta("gpt-4o-mini-2024-07-18") == "gpt-4o-mini-2024-07-18" and IA.nombre_llave() == "OPENAI_KEY u OPENAI_API_KEY", "etiquetas con OpenAI: lo mismo que antes")

print("Claude (traducción)")
os.environ["TRIGGUI_IA_PROVEEDOR"] = "claude"
del recibidas[:]
guion[:] = [{"status": 200, "data": {"content": [{"type": "text", "text": "{\"a\": \"hola\"}"}], "stop_reason": "end_turn", "usage": {"input_tokens": 50, "output_tokens": 5, "cache_read_input_tokens": 2}}}]
d = IA.chat(nuevo, timeout=10)
b = json.loads(recibidas[0]["body"])
ok(recibidas[0]["url"] == "/claude" and recibidas[0]["headers"].get("x-api-key") == "sk-ant-de-mentira" and recibidas[0]["headers"].get("anthropic-version") == "2023-06-01", "Messages API con su llave y versión")
ok(b["model"] == "claude-haiku-5-5" and b["system"] == "sis ñ" and "temperature" not in b and b["thinking"] == {"type": "disabled"}, "modelo, system, sin temperatura y sin pensar")
ok(b["max_tokens"] == real["claude"]["max_tokens_por_omision"], "tope por omisión")
ok(IA.nombre_proveedor() == "Claude" and IA.etiqueta("mini") == "claude-haiku-5-5" and IA.nombre_llave() == "ANTHROPIC_API_KEY", "etiquetas con Claude: el modelo real")
sc = b["output_config"]["format"]["schema"]
ok("minLength" not in sc["properties"]["a"] and sc["additionalProperties"] is False and "minLength: 3" in sc["properties"]["a"].get("description", ""), "esquema limpio, con la nota en la descripción")
ok(d["choices"][0]["message"]["content"] == "{\"a\": \"hola\"}" and d["usage"]["prompt_tokens"] == 52 and d["usage"]["completion_tokens"] == 5, "contenido y usage con la forma de siempre")
del recibidas[:]
guion[:] = [{"status": 200, "data": {"content": [{"type": "text", "text": "nada"}], "stop_reason": "end_turn", "usage": {}}},
            {"status": 200, "data": {"content": [{"type": "text", "text": "```json\n{\"b\": 1}\n```"}], "stop_reason": "end_turn", "usage": {}}}]
d = IA.chat({"model": "mini", "response_format": {"type": "json_object"}, "messages": [{"role": "user", "content": "u"}]}, timeout=10)
ok(len(recibidas) == 2 and d["choices"][0]["message"]["content"] == "{\"b\": 1}", "json_object: reintento y extracción")
guion[:] = [{"status": 200, "data": {"content": [{"type": "text", "text": "no"}], "stop_reason": "refusal", "usage": {}}}]
d = IA.chat({"model": "mini", "messages": [{"role": "user", "content": "u"}]}, timeout=10)
ok(d["choices"][0]["message"]["refusal"] and d["choices"][0]["message"]["content"] == "", "refusal: nunca un aprobado")
del recibidas[:]
guion[:] = [{"status": 529, "data": {"error": "x"}}, {"status": 200, "data": {"content": [{"type": "text", "text": "hola"}], "stop_reason": "end_turn", "usage": {}}}]
d = IA.chat({"model": "mini", "messages": [{"role": "user", "content": "u"}]}, timeout=10)
ok(len(recibidas) == 2 and d["choices"][0]["message"]["content"] == "hola", "529: reintenta y sigue")
guion[:] = [{"status": 403, "data": {"error": "prohibido"}}]
try:
    IA.chat({"model": "mini", "messages": [{"role": "user", "content": "u"}]}, timeout=10)
    ok(False, "403 lanza urllib.error.HTTPError")
except urllib.error.HTTPError as e:
    ok(e.code == 403, "403 lanza urllib.error.HTTPError, como antes")
del recibidas[:]
IA.chat({"model": "mini", "max_tokens": 150, "messages": [{"role": "user", "content": "u"}]}, timeout=10)
ok(json.loads(recibidas[0]["body"])["max_tokens"] == real["claude"]["max_tokens_minimo"], "max_tokens 150 sube al mínimo")
del recibidas[:]
guion[:] = [{"status": 429, "data": {"type": "error", "error": {"type": "rate_limit_error", "message": "spend", "details": {"error_code": "enforced_spend_limit_reached"}}}}]
try:
    IA.chat({"model": "mini", "messages": [{"role": "user", "content": "u"}]}, timeout=10)
    ok(False, "tope de gasto: lanza HTTPError 429 sin reintentar")
except urllib.error.HTTPError as e:
    ok(e.code == 429 and len(recibidas) == 1 and "tope de gasto" in str(e.msg) and b"enforced_spend_limit_reached" in e.read(),
       "tope de gasto: un solo intento, 429 dicho claro y con el cuerpo legible")
del recibidas[:]
guion[:] = [{"status": 429, "data": {"error": "rate"}}] * 3
try:
    IA.chat({"model": "mini", "messages": [{"role": "user", "content": "u"}]}, timeout=10)
    ok(False, "429 sostenido: lanza tras los reintentos")
except urllib.error.HTTPError as e:
    ok(e.code == 429 and len(recibidas) == 3 and b"rate" in e.read(), "429 sostenido: 2 reintentos y el cuerpo del error sigue legible")
reg = os.path.join(tempfile.mkdtemp(), "uso.jsonl")
os.environ["TRIGGUI_IA_REGISTRO"] = reg
guion[:] = [{"status": 200, "data": {"model": "claude-haiku-5-5", "content": [{"type": "text", "text": "{\"a\": 1}"}], "stop_reason": "end_turn",
                                     "usage": {"input_tokens": 100, "output_tokens": 20, "cache_read_input_tokens": 50}}}]
IA.chat({"model": "mini", "response_format": {"type": "json_object"}, "messages": [{"role": "user", "content": "u"}]}, timeout=10)
os.environ["TRIGGUI_IA_PROVEEDOR"] = "openai"
IA.chat({"model": "mini", "messages": [{"role": "user", "content": "u"}]}, timeout=10)
os.environ["TRIGGUI_IA_PROVEEDOR"] = "claude"
del os.environ["TRIGGUI_IA_REGISTRO"]
IA.chat({"model": "mini", "messages": [{"role": "user", "content": "u"}]}, timeout=10)
lineas = [json.loads(x) for x in open(reg, encoding="utf-8")]
ok(len(lineas) == 2 and lineas[0]["proveedor"] == "claude" and lineas[0]["papel"] == "mini" and lineas[0]["entrada"] == 100
   and lineas[0]["cache_lectura"] == 50 and lineas[0]["json_ok"] is True and "prueba_ia.py" in (lineas[0]["origen"] or "")
   and lineas[1]["proveedor"] == "openai" and lineas[1]["fin"] == "stop" and lineas[1]["modelo"] == "gpt-4o-mini",
   "registro de uso: una línea por llamada (tokens, caché, JSON y origen), y nada sin la variable", repr(lineas))
del os.environ["ANTHROPIC_API_KEY"]
ok(not IA.hay_llave(), "sin la llave de Claude, hay_llave es falso")
srv.shutdown()
print("\n%d/%d comprobaciones" % (total - fallas, total))
sys.exit(1 if fallas else 0)
