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
    let paso = guion.shift() || { status: 200, data: { id: 'm', model: 'claude-haiku-5-5', content: [{ type: 'text', text: '{"ok":true}' }], stop_reason: 'end_turn', usage: { input_tokens: 7, output_tokens: 3 } } };
    if (typeof paso === 'function') paso = paso(cuerpo);   // respuesta que depende de la petición
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

// ── 2b. Tope mínimo, tope de gasto y registro de uso ──
console.log('Tope mínimo, tope de gasto y registro de uso');
recibidas.length = 0;
await (await IA.chatCompat({ model: 'mini', max_tokens: 150, messages: [{ role: 'user', content: 'u' }] })).json();
ok(JSON.parse(recibidas[0].body).max_tokens === real.claude.max_tokens_minimo, `max_tokens 150 sube al mínimo (${real.claude.max_tokens_minimo})`);
recibidas.length = 0;
guion = [{ status: 429, data: { type: 'error', error: { type: 'rate_limit_error', message: 'spend', details: { error_code: 'enforced_spend_limit_reached' } } } }];
r = await IA.chatCompat({ model: 'mini', messages: [{ role: 'user', content: 'u' }] });
ok(recibidas.length === 1 && r.status === 429 && /tope de gasto/.test(await r.text()), 'tope de gasto: un solo intento y el error lo dice claro');
guion = [{ status: 429, data: { type: 'error', error: { type: 'rate_limit_error', message: 'spend', details: { error_code: 'enforced_spend_limit_reached' } } } }];
lanzo = null;
try { await IA.crearCliente().chat.completions.create({ model: 'mini', messages: [{ role: 'user', content: 'u' }] }); } catch (e) { lanzo = e; }
ok(lanzo && lanzo.status === 429 && lanzo.tope === true, 'tope de gasto: crearCliente lanza el error marcado');
const reg = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ia-reg-')), 'uso.jsonl');
process.env.TRIGGUI_IA_REGISTRO = reg;
guion = [{ status: 200, data: { id: 'm', model: 'claude-haiku-5-5', content: [{ type: 'text', text: '{"a":1}' }], stop_reason: 'end_turn', usage: { input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50, cache_creation_input_tokens: 10 } } }];
await IA.chatCompat({ model: 'mini', response_format: { type: 'json_object' }, messages: [{ role: 'user', content: 'u' }] });
guion = [{ status: 400, data: { type: 'error', error: { message: 'malo' } } }];
await IA.chatCompat({ model: 'grande', messages: [{ role: 'user', content: 'u' }] });
process.env.TRIGGUI_IA_PROVEEDOR = 'openai';
await (await IA.chatCompat({ model: 'mini', messages: [{ role: 'user', content: 'u' }] })).json();
await IA.crearCliente({ sdk }).chat.completions.create({ model: 'grande', messages: [{ role: 'user', content: 'x' }] });
process.env.TRIGGUI_IA_PROVEEDOR = 'claude';
delete process.env.TRIGGUI_IA_REGISTRO;
await IA.chatCompat({ model: 'mini', messages: [{ role: 'user', content: 'u' }] });
const lineas = fs.readFileSync(reg, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
ok(lineas.length === 4, `registro: una línea por llamada, y nada sin la variable (${lineas.length} de 4)`);
const [c1, c2, o1, o2] = lineas;
ok(c1.proveedor === 'claude' && c1.papel === 'mini' && c1.modelo === 'claude-haiku-5-5' && c1.entrada === 100 && c1.salida === 20 && c1.cache_lectura === 50
  && c1.cache_escritura === 10 && c1.fin === 'end_turn' && c1.json_ok === true && /prueba-ia\.mjs/.test(c1.origen || ''),
  'registro Claude: papel, modelo, tokens con caché, fin, JSON y de dónde vino', JSON.stringify(c1));
ok(c2.papel === 'grande' && c2.modelo === 'claude-sonnet-5-5' && /^400/.test(c2.error || ''), 'registro Claude: el error queda anotado', JSON.stringify(c2));
ok(o1.proveedor === 'openai' && o1.papel === 'mini' && o1.entrada === 10 && o1.salida === 2 && o1.fin === 'stop' && o1.modelo === 'gpt-4o-mini', 'registro OpenAI por fetch: tokens y fin', JSON.stringify(o1));
ok(o2.proveedor === 'openai' && o2.papel === 'grande' && o2.modelo === 'gpt-4o' && o2.fin === 'stop', 'registro OpenAI por el SDK', JSON.stringify(o2));

// ── 2c. Caché del system (Claude) ──
console.log('Caché del system (Claude)');
process.env.TRIGGUI_IA_PROVEEDOR = 'claude';
// La API de mentira guarda lo marcado como la real: escribe la primera vez, lee después, y nada por debajo del mínimo.
const escritos = new Set();
const simula = (cuerpo) => {
  const q = JSON.parse(cuerpo);
  const marcado = Array.isArray(q.system);
  const txt = marcado ? q.system[0].text : (q.system || '');
  let u = {};
  if (marcado && txt.length >= 1800) {
    const k = q.model + '|' + JSON.stringify(q.output_config || null) + '|' + txt;
    u = escritos.has(k) ? { cache_read_input_tokens: Math.round(txt.length / 4) } : { cache_creation_input_tokens: Math.round(txt.length / 4) };
    escritos.add(k);
  }
  return { status: 200, data: { id: 'mc', model: q.model, content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn', usage: { input_tokens: 20, output_tokens: 2, ...u } } };
};
const conGuion = (n) => Array.from({ length: n }, () => simula);
const pide = (sis, extra = {}) => IA.chatCompat({ model: 'mini', messages: [{ role: 'system', content: sis }, { role: 'user', content: 'u' }], ...extra });
const sisDe = (i) => JSON.parse(recibidas[i].body).system;
const marcado = (x, txt) => Array.isArray(x) && x.length === 1 && x[0].type === 'text' && x[0].text === txt
  && JSON.stringify(x[0].cache_control) === '{"type":"ephemeral"}' && Object.keys(x[0]).length === 3;
const estado = (sis, extra = {}) => { const e = IA._interno._cache.get(IA._interno.claveCache(IA._interno.aClaude({ model: 'mini', messages: [{ role: 'system', content: sis }, { role: 'user', content: 'u' }], ...extra }).body)); return e ? e.estado : 'sin ver'; };
const SIS = 'Sistema largo y constante, como el del saneador. ' + 'x'.repeat(4000);

recibidas.length = 0;
guion = conGuion(4);
await pide(SIS);
ok(sisDe(0) === SIS && estado(SIS) === 'visto', 'la primera vez el system va sin marca: una llamada suelta nunca paga escritura');
await pide(SIS);
ok(marcado(sisDe(1), SIS) && estado(SIS) === 'guardado', 'ya terminada una, la siguiente lo marca con cache_control ephemeral y lo escribe');
await pide(SIS);
ok(marcado(sisDe(2), SIS) && estado(SIS) === 'guardado', 'después, lo marca y lo lee');
const crudo = IA._interno.aClaude({ model: 'mini', messages: [{ role: 'system', content: SIS }, { role: 'user', content: 'u' }] }).body;
const marcadoCrudo = IA._interno.conCache(crudo, { marca: true });
ok(crudo.system === SIS && Array.isArray(marcadoCrudo.system) && JSON.stringify(Object.keys(marcadoCrudo)) === JSON.stringify(Object.keys(crudo)), 'marcar no toca el cuerpo original y conserva el orden de las llaves');

const SIS2 = 'Otro system, el de un juez que corre en paralelo. ' + 'y'.repeat(4000);
recibidas.length = 0;
guion = conGuion(3);
await Promise.all([pide(SIS2), pide(SIS2), pide(SIS2)]);
ok([0, 1, 2].every((i) => sisDe(i) === SIS2) && estado(SIS2) === 'visto', 'tres en paralelo la primera vez: ninguna marca');
recibidas.length = 0;
guion = conGuion(3);
await Promise.all([pide(SIS2), pide(SIS2), pide(SIS2)]);
let marcas = [0, 1, 2].filter((i) => marcado(sisDe(i), SIS2)).length;
ok(marcas === 1 && estado(SIS2) === 'guardado', 'otra vez en paralelo: una sola escribe y las otras van sin marca (nunca dos escrituras a la vez)', `${marcas} marcadas`);
recibidas.length = 0;
guion = conGuion(3);
await Promise.all([pide(SIS2), pide(SIS2), pide(SIS2)]);
marcas = [0, 1, 2].filter((i) => marcado(sisDe(i), SIS2)).length;
ok(marcas === 3, 'ya escrito, las tres en paralelo lo marcan y lo leen', `${marcas} marcadas`);

const CORTO = 'System corto, por debajo del mínimo.';
recibidas.length = 0;
guion = conGuion(3);
await pide(CORTO); await pide(CORTO); await pide(CORTO);
ok(sisDe(0) === CORTO && marcado(sisDe(1), CORTO) && sisDe(2) === CORTO && estado(CORTO) === 'no', 'si la API no lo guardó (0 y 0), ese system ya no se marca');

recibidas.length = 0;
guion = conGuion(2);
await IA.chatCompat({ model: 'grande', messages: [{ role: 'system', content: SIS }, { role: 'user', content: 'u' }] });
await pide(SIS, { response_format: { type: 'json_schema', json_schema: { name: 'z', strict: true, schema: { type: 'object', properties: { a: { type: 'string' } }, required: ['a'], additionalProperties: false } } } });
ok(sisDe(0) === SIS && sisDe(1) === SIS, 'otro modelo u otro formato de salida es otra entrada: la primera vez va sin marca');

const reloj = Date.now;
try {
  Date.now = () => reloj() + IA._interno.CACHE_VIGENCIA_MS + 1000;
  recibidas.length = 0;
  guion = conGuion(2);
  await Promise.all([pide(SIS), pide(SIS)]);
  marcas = [0, 1].filter((i) => marcado(sisDe(i), SIS)).length;
  ok(marcas === 1 && estado(SIS) === 'guardado', 'pasados 4 minutos y medio sin uso: una sola lo vuelve a escribir', `${marcas} marcadas`);
} finally { Date.now = reloj; }

const SIS3 = 'System cuya escritura falla. ' + 'z'.repeat(4000);
recibidas.length = 0;
guion = [simula, { status: 400, data: { type: 'error', error: { message: 'malo' } } }, simula];
await pide(SIS3);
r = await pide(SIS3);
ok(!r.ok && marcado(sisDe(1), SIS3) && estado(SIS3) === 'visto', 'si la escritura falla, vuelve a «visto»');
await pide(SIS3);
ok(marcado(sisDe(2), SIS3) && estado(SIS3) === 'guardado', 'y la siguiente la intenta de nuevo');

const SIS4 = 'System con la caché apagada en config.json. ' + 'w'.repeat(4000);
IA.config().claude.cache_sistema = false;
try {
  recibidas.length = 0;
  guion = conGuion(3);
  await pide(SIS4); await pide(SIS4); await pide(SIS4);
  ok([0, 1, 2].every((i) => sisDe(i) === SIS4), 'con claude.cache_sistema: false nunca se marca');
} finally { IA.config().claude.cache_sistema = true; }

process.env.TRIGGUI_IA_PROVEEDOR = 'openai';
recibidas.length = 0;
const conOpenAI = { model: 'gpt-4o-mini', temperature: 0, messages: [{ role: 'system', content: SIS }, { role: 'user', content: 'u' }] };
await (await IA.chatCompat({ ...conOpenAI, model: 'mini' })).json();
await (await IA.chatCompat({ ...conOpenAI, model: 'mini' })).json();
ok(recibidas.length === 2 && recibidas.every((x) => x.body === JSON.stringify(conOpenAI)), 'con openai, el mismo system repetido sale con los mismos bytes de siempre');
process.env.TRIGGUI_IA_PROVEEDOR = 'claude';

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
