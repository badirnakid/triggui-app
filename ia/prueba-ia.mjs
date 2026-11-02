// Pruebas del único lugar de la IA (ia/ia.cjs). Sin red: un servidor local imita a OpenAI y a Claude.
// Uso: node ia/prueba-ia.mjs
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
let fallas = 0, total = 0;
const ok = (cond, nombre, detalle) => { total++; if (cond) console.log('  ✔ ' + nombre); else { fallas++; console.log('  ✘ ' + nombre + (detalle ? ' · ' + detalle : '')); } };

// ── servidor de mentira ──
const recibidas = [];
let guion = [];   // respuestas en orden para /claude
const srv = http.createServer((req, res) => {
  let cuerpo = '';
  req.on('data', (d) => (cuerpo += d));
  req.on('end', () => {
    recibidas.push({ url: req.url, headers: req.headers, body: cuerpo });
    if (req.url === '/openai') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ id: 'x', object: 'chat.completion', model: 'gpt-4o-mini', choices: [{ index: 0, message: { role: 'assistant', content: '{"ok":true}' }, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 } }));
    }
    const paso = guion.shift() || { status: 200, data: { id: 'm', model: 'claude-haiku-5-5', content: [{ type: 'text', text: '{"ok":true}' }], stop_reason: 'end_turn', usage: { input_tokens: 7, output_tokens: 3 } } };
    res.writeHead(paso.status, { 'content-type': 'application/json', ...(paso.headers || {}) });
    res.end(typeof paso.data === 'string' ? paso.data : JSON.stringify(paso.data));
  });
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const PUERTO = srv.address().port;

// configuración de prueba: la de verdad, con las direcciones apuntando al servidor local
const real = JSON.parse(fs.readFileSync(path.join(AQUI, 'config.json'), 'utf8'));
const prueba = { ...real, openai: { url: `http://127.0.0.1:${PUERTO}/openai` }, claude: { ...real.claude, url: `http://127.0.0.1:${PUERTO}/claude` } };
const ruta = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ia-')), 'config.json');
fs.writeFileSync(ruta, JSON.stringify(prueba));
process.env.TRIGGUI_IA_CONFIG = ruta;
process.env.OPENAI_KEY = 'sk-de-mentira';
process.env.ANTHROPIC_API_KEY = 'sk-ant-de-mentira';
const IA = require('./ia.cjs');

// ── 1. OpenAI: mismos bytes que antes ──
console.log('OpenAI (sin cambio de comportamiento)');
process.env.TRIGGUI_IA_PROVEEDOR = 'openai';
const original = { model: 'gpt-4o-mini', temperature: 0.3, top_p: 0.9, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'sis ñ' }, { role: 'user', content: 'hola «ü»' }] };
const nuevo = { ...original, model: 'mini' };
recibidas.length = 0;
let r = await IA.chatCompat(nuevo);
ok(r.ok && r.status === 200, 'chatCompat responde como fetch');
ok(recibidas[0].body === JSON.stringify(original), 'el cuerpo sale con los mismos bytes que el de antes');
ok(recibidas[0].headers.authorization === 'Bearer sk-de-mentira', 'misma llave en Authorization');
ok((await r.json()).choices[0].message.content === '{"ok":true}', 'la respuesta es la de OpenAI, tal cual');
const vistos = [];
const sdk = { chat: { completions: { create: async (p, o) => { vistos.push({ p, o }); return { choices: [{ message: { content: 'sdk' }, finish_reason: 'stop' }], usage: { total_tokens: 1 } }; } } } };
const cli = IA.crearCliente({ sdk });
const rs = await cli.chat.completions.create({ model: 'grande', temperature: 0.5, messages: [{ role: 'user', content: 'x' }] }, { timeout: 90000 });
ok(rs.choices[0].message.content === 'sdk', 'crearCliente delega en el SDK de OpenAI');
ok(vistos[0].p.model === 'gpt-4o' && vistos[0].p.temperature === 0.5 && JSON.stringify(Object.keys(vistos[0].p)) === '["model","temperature","messages"]', '«grande» se resuelve a gpt-4o y el resto queda igual, en el mismo orden');
ok(vistos[0].o.timeout === 90000, 'las opciones (timeout) pasan al SDK');
ok(IA.resolverModelo('gpt-4o-mini', 'claude') === 'claude-haiku-5-5' && IA.resolverModelo('otro-modelo') === 'otro-modelo', 'alias y modelos explícitos');
ok(IA.hayLlave() === true, 'hayLlave con OpenAI');
ok(IA.nombreProveedor() === 'OpenAI' && IA.etiqueta('mini') === 'gpt-4o-mini' && IA.etiqueta('grande') === 'gpt-4o' && IA.etiqueta('gpt-4o-mini-2024-07-18') === 'gpt-4o-mini-2024-07-18' && IA.etiqueta(undefined) === undefined,
  'etiquetas con OpenAI: lo mismo que se escribía antes (un papel se escribe con su modelo; lo demás pasa tal cual)');

// ── 2. Claude ──
console.log('Claude (traducción)');
process.env.TRIGGUI_IA_PROVEEDOR = 'claude';
const esquema = { name: 'x', strict: true, schema: { type: 'object', properties: { frase: { type: 'string', minLength: 30, maxLength: 68 }, n: { type: 'number', minimum: 0, maximum: 1 }, lista: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'object', properties: { a: { type: 'string', enum: ['x', 'y'] } }, required: ['a'] } }, uno: { type: 'array', minItems: 1, items: { type: 'string' } } }, required: ['frase', 'n', 'lista', 'uno'], additionalProperties: false } };
recibidas.length = 0;
guion = [{ status: 200, data: { id: 'm1', model: 'claude-haiku-5-5', content: [{ type: 'text', text: '{"frase":"f","n":0.5,"lista":[],"uno":["a"]}' }], stop_reason: 'end_turn', usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 5 } } }];
r = await IA.chatCompat({ model: 'mini', temperature: 0.7, top_p: 0.9, max_tokens: 6000, response_format: { type: 'json_schema', json_schema: esquema }, messages: [{ role: 'system', content: 'SIS' }, { role: 'user', content: 'U' }] });
let b = JSON.parse(recibidas[0].body);
ok(recibidas[0].url === '/claude' && recibidas[0].headers['x-api-key'] === 'sk-ant-de-mentira' && recibidas[0].headers['anthropic-version'] === '2023-06-01', 'va a la Messages API con su llave y su versión');
ok(b.model === 'claude-haiku-5-5' && b.max_tokens === 6000 && b.system === 'SIS', 'modelo, tope y system');
ok(!('temperature' in b) && !('top_p' in b), 'sin temperature ni top_p');
ok(JSON.stringify(b.messages) === '[{"role":"user","content":"U"}]', 'mensajes sin el system');
ok(b.thinking && b.thinking.type === 'disabled', 'Haiku sin pensar (como gpt-4o-mini)');
const s = b.output_config && b.output_config.format && b.output_config.format.schema;
const texto = JSON.stringify(s || {});
ok(s && !/"(minLength|maxLength|minimum|maximum|maxItems)":/.test(texto), 'el esquema sale sin largos, mínimos, máximos ni cantidades (como llaves)');
ok(s && s.properties.lista.minItems === undefined && s.properties.uno.minItems === 1, 'minItems mayor que 1 se quita; 1 se queda');
ok(s && s.additionalProperties === false && s.properties.lista.items.additionalProperties === false, 'additionalProperties:false en todo objeto');
ok(s && /minLength: 30/.test(s.properties.frase.description || ''), 'lo quitado queda en la descripción');
let d = await r.json();
ok(d.choices[0].message.content === '{"frase":"f","n":0.5,"lista":[],"uno":["a"]}' && d.choices[0].finish_reason === 'stop', 'contenido y finish_reason con la forma de siempre');
ok(d.usage.prompt_tokens === 105 && d.usage.completion_tokens === 20 && d.usage.total_tokens === 125, 'usage: entrada más caché, y salida');

// json_object
recibidas.length = 0;
guion = [{ status: 200, data: { id: 'm2', model: 'claude-haiku-5-5', content: [{ type: 'text', text: '```json\n{"a":1}\n```' }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } } }];
d = await (await IA.chatCompat({ model: 'gpt-4o-mini', temperature: 0, max_tokens: 400, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'S' }, { role: 'user', content: 'U' }] })).json();
b = JSON.parse(recibidas[0].body);
ok(b.system.endsWith(IA._interno.INSTRUCCION_JSON) && !b.output_config, 'json_object: instrucción de solo JSON, sin esquema');
ok(d.choices[0].message.content === '{"a":1}', 'json_object: limpia el bloque de código');
recibidas.length = 0;
guion = [{ status: 200, data: { id: 'm3', content: [{ type: 'text', text: 'claro, aquí va' }], stop_reason: 'end_turn', usage: {} } }, { status: 200, data: { id: 'm4', content: [{ type: 'text', text: 'Respuesta: {"b":2} listo' }], stop_reason: 'end_turn', usage: {} } }];
d = await (await IA.chatCompat({ model: 'mini', response_format: { type: 'json_object' }, messages: [{ role: 'user', content: 'U' }] })).json();
ok(recibidas.length === 2 && d.choices[0].message.content === '{"b":2}', 'json_object: si no llega JSON, un reintento y extrae el objeto');
ok(JSON.parse(recibidas[0].body).max_tokens === real.claude.max_tokens_por_omision, 'sin max_tokens usa el tope por omisión');

// rechazo, corte y errores
guion = [{ status: 200, data: { id: 'm5', content: [{ type: 'text', text: 'no' }], stop_reason: 'refusal', usage: {} } }];
d = await (await IA.chatCompat({ model: 'mini', messages: [{ role: 'user', content: 'U' }] })).json();
ok(d.choices[0].message.refusal && d.choices[0].message.content === '' && d.choices[0].finish_reason === 'content_filter', 'refusal: nunca un aprobado silencioso');
guion = [{ status: 200, data: { id: 'm6', content: [{ type: 'text', text: '{"a":' }], stop_reason: 'max_tokens', usage: {} } }];
d = await (await IA.chatCompat({ model: 'mini', messages: [{ role: 'user', content: 'U' }] })).json();
ok(d.choices[0].finish_reason === 'length', 'max_tokens: finish_reason «length»');
recibidas.length = 0;
guion = [{ status: 529, data: { error: 'overloaded' } }, { status: 200, data: { id: 'm7', content: [{ type: 'text', text: 'hola' }], stop_reason: 'end_turn', usage: {} } }];
d = await (await IA.chatCompat({ model: 'mini', messages: [{ role: 'user', content: 'U' }] })).json();
ok(recibidas.length === 2 && d.choices[0].message.content === 'hola', '529: reintenta y sigue');
guion = [{ status: 400, data: { type: 'error', error: { message: 'Schema is too complex for compilation' } } }];
r = await IA.chatCompat({ model: 'mini', messages: [{ role: 'user', content: 'U' }] });
ok(!r.ok && r.status === 400 && /Schema is too complex/.test(await r.text()), 'chatCompat: un 400 sale como respuesta no ok, con su texto');
guion = [{ status: 400, data: { type: 'error', error: { message: 'malo' } } }];
let lanzo = null;
try { await IA.crearCliente({}).chat.completions.create({ model: 'mini', messages: [{ role: 'user', content: 'U' }] }); } catch (e) { lanzo = e; }
ok(lanzo && lanzo.status === 400, 'crearCliente: un 400 lanza error con su status');
recibidas.length = 0;
guion = [{ status: 200, data: { id: 'm8', content: [{ type: 'thinking', thinking: 'x' }, { type: 'text', text: 'T' }], stop_reason: 'end_turn', usage: {} } }];
d = await IA.crearCliente({}).chat.completions.create({ model: 'grande', messages: [{ role: 'system', content: 'a' }, { role: 'system', content: 'b' }, { role: 'user', content: 'u1' }, { role: 'user', content: 'u2' }] });
b = JSON.parse(recibidas[0].body);
ok(b.model === 'claude-sonnet-5-5' && b.thinking.type === 'between_tools', '«grande» va a Sonnet 5.5 sin pensar antes de responder');
ok(b.system === 'a\n\nb' && b.messages.length === 1 && b.messages[0].content === 'u1\n\nu2', 'varios system se juntan y los turnos seguidos del mismo rol se unen');
ok(d.choices[0].message.content === 'T', 'los bloques de pensamiento no entran al contenido');
delete process.env.ANTHROPIC_API_KEY;
ok(IA.hayLlave() === false && IA.nombreLlave() === 'ANTHROPIC_API_KEY', 'hayLlave sin la llave de Claude');
process.env.ANTHROPIC_API_KEY = 'sk-ant-de-mentira';
ok(IA.nombreProveedor() === 'Claude' && IA.etiqueta('mini') === 'claude-haiku-5-5' && IA.etiqueta('grande') === 'claude-sonnet-5-5' && IA.etiqueta('claude-haiku-5-5-x') === 'claude-haiku-5-5-x',
  'etiquetas con Claude: el modelo real');

// ── 3. Los esquemas reales del repositorio ──
console.log('Esquemas reales');
const archivos = [path.join(AQUI, '..', 'experiments/nucleus/edition-nucleus.schema.json')];
const dirCon = path.join(AQUI, '..', '..', 'triggui-content', 'prompts', 'schemas');
if (fs.existsSync(dirCon)) for (const f of fs.readdirSync(dirCon)) if (f.endsWith('.json')) archivos.push(path.join(dirCon, f));
const casos = [];
for (const f of archivos) {
  if (!fs.existsSync(f)) continue;
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const nombrados = Object.entries(j).filter(([, v]) => v && typeof v === 'object' && v.schema && v.strict);
  if (nombrados.length) for (const [k, v] of nombrados) casos.push([path.basename(f) + ' › ' + k, v.schema]);
  else casos.push([path.basename(f), j.schema || (j.json_schema && j.json_schema.schema) || j]);
}
for (const [nombre, sch] of casos) {
  const l = IA._interno.limpiaEsquema(sch);
  const t = JSON.stringify(l);
  let objetosSinCierre = 0, opcionales = 0, uniones = 0;
  (function recorre(x) {
    if (Array.isArray(x)) return x.forEach(recorre);
    if (!x || typeof x !== 'object') return;
    if ((x.type === 'object' || x.properties) && x.additionalProperties !== false) objetosSinCierre++;
    if (x.properties) opcionales += Object.keys(x.properties).filter((k) => !(x.required || []).includes(k)).length;
    if (Array.isArray(x.type) || x.anyOf) uniones++;
    Object.values(x).forEach(recorre);
  })(l);
  ok(!/"(minLength|maxLength|minimum|maximum|maxItems|exclusiveMinimum|exclusiveMaximum|multipleOf)"/.test(t) && objetosSinCierre === 0 && opcionales <= 24 && uniones <= 16,
    `${nombre}: limpio (opcionales ${opcionales} de 24, uniones ${uniones} de 16, ${t.length} caracteres)`);
}

srv.close();
console.log(`\n${total - fallas}/${total} comprobaciones`);
process.exit(fallas ? 1 : 0);
