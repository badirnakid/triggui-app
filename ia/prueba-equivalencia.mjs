#!/usr/bin/env node
/*
 * Prueba de equivalencia de C278 (2 de noviembre de 2026).
 *
 * Con el proveedor openai, cada punto de llamada debe mandar EXACTAMENTE la misma petición que antes de la
 * migración (misma ruta, mismos bytes de cuerpo, misma llave) y dejar los mismos archivos. Esta prueba corre la
 * versión de antes (--base) y la de ahora (--nuevo) contra un servidor local que imita a OpenAI, y compara.
 *
 * Nada sale a la red: el fetch hacia api.openai.com se redirige al servidor local, el SDK de OpenAI apunta a él
 * con OPENAI_BASE_URL y cualquier otro destino de fetch falla de inmediato, igual para las dos versiones. El azar
 * (Math.random, crypto.randomInt) va con semilla fija y el reloj arranca en la misma hora, para que las dos
 * versiones vean exactamente lo mismo. Para los esquemas JSON, el servidor responde un objeto válido construido
 * desde el esquema de la petición, así el pipeline avanza fase por fase y se comparan todas sus llamadas.
 *
 * Segunda parte, «Claude simulado»: la versión de ahora con TRIGGUI_IA_PROVEEDOR=claude y SIN llaves de OpenAI,
 * contra una Messages API local estricta (rechaza con 400 lo que la real no acepta: temperature, top_p, llaves de
 * OpenAI, turnos mal alternados, prefill, esquemas con largos, mínimos o máximos, objetos sin
 * additionalProperties:false, modelos o thinking equivocados). Cada punto debe terminar igual que con openai.
 *
 * Uso, desde la raíz de triggui-app (con experiments/nucleus/node_modules instalado):
 *   node ia/prueba-equivalencia.mjs [--base=f440d0b] [--nuevo=HEAD] [--contenido=../triggui-content]
 *        [--contenido-base=origin/main] [--contenido-nuevo=claude-en-el-horno] [--tmp=<carpeta temporal>]
 */
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const BASE = arg('base', 'f440d0b');
const NUEVO = arg('nuevo', 'HEAD');
const CONTENIDO = path.resolve(RAIZ, arg('contenido', '../triggui-content'));
const C_BASE = arg('contenido-base', 'origin/main');
const C_NUEVO = arg('contenido-nuevo', 'claude-en-el-horno');
const T = fs.mkdtempSync(path.join(arg('tmp', os.tmpdir()), 'equivalencia-c278-'));
const GUARDA = arg('guarda', '');   // carpeta donde dejar los dos lados de cada comparación que falle
const NM = path.join(RAIZ, 'experiments/nucleus/node_modules');
if (!fs.existsSync(NM)) { console.error('Falta experiments/nucleus/node_modules: corre «npm ci» ahí primero.'); process.exit(2); }

let fallas = 0, total = 0;
const ok = (c, nombre, detalle) => { total++; if (c) console.log('  ✔ ' + nombre); else { fallas++; console.log('  ✘ ' + nombre + (detalle ? '\n      ' + detalle : '')); } };
const igualOGuarda = (a, b, nombre) => {
  if (a === b) return true;
  if (GUARDA) { fs.mkdirSync(GUARDA, { recursive: true }); const n = nombre.replace(/[^\wáéíóúñ-]+/gi, '_'); fs.writeFileSync(path.join(GUARDA, n + '.antes.txt'), String(a)); fs.writeFileSync(path.join(GUARDA, n + '.ahora.txt'), String(b)); }
  return false;
};

// ── Las dos versiones, cada una en su propia copia ─────────────────────────────────────────────────────────
const git = (cwd, ...a) => execFileSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 64 << 20 });
const raices = { base: path.join(T, 'base'), nuevo: path.join(T, 'nuevo') };
git(RAIZ, 'worktree', 'add', '-q', '--detach', raices.base, BASE);
git(RAIZ, 'worktree', 'add', '-q', '--detach', raices.nuevo, NUEVO);
for (const r of Object.values(raices)) {
  fs.symlinkSync(NM, path.join(r, 'experiments/nucleus/node_modules'));
  // Como en el workflow: triggui-content junto al motor, con la constitución, los lentes y su registro
  // (copia, para que nada de lo que escriba el pipeline toque el repositorio real).
  fs.cpSync(path.join(CONTENIDO, 'prompts'), path.join(r, 'triggui-content/prompts'), { recursive: true });
  fs.copyFileSync(path.join(CONTENIDO, 'lenses-registry.json'), path.join(r, 'triggui-content/lenses-registry.json'));
}
const saneador = { base: path.join(T, 'san-base.cjs'), nuevo: path.join(T, 'san-nuevo.cjs') };
fs.writeFileSync(saneador.base, git(CONTENIDO, 'show', `${C_BASE}:auditoria-editorial/phrase-sanitizer-llm.cjs`));
fs.writeFileSync(saneador.nuevo, git(CONTENIDO, 'show', `${C_NUEVO}:auditoria-editorial/phrase-sanitizer-llm.cjs`));

// ── Precarga: red cerrada salvo el servidor local, azar con semilla y reloj fijo ───────────────────────────
const PRECARGA = path.join(T, 'precarga.cjs');
fs.writeFileSync(PRECARGA, `'use strict';
const P = process.env.PRUEBA_PUERTO;
const fetchReal = globalThis.fetch;
globalThis.fetch = async function (url, opts) {
  const u = String(url && typeof url === 'object' && url.url ? url.url : url);
  if (u.startsWith('https://api.openai.com/')) return fetchReal('http://127.0.0.1:' + P + u.slice('https://api.openai.com'.length), opts);
  if (u.startsWith('https://api.anthropic.com/')) return fetchReal('http://127.0.0.1:' + P + u.slice('https://api.anthropic.com'.length), opts);
  if (u.startsWith('http://127.0.0.1:' + P + '/')) return fetchReal(url, opts);
  throw new TypeError('fetch failed (prueba: red cerrada) ' + u.slice(0, 80));
};
let s = 20261102;
Math.random = function () { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return s / 4294967296; };
const crypto = require('crypto');
crypto.randomInt = function (a, b, cb) {
  if (typeof b !== 'number') { cb = b; b = a; a = 0; }
  const n = a + Math.floor(Math.random() * (b - a));
  if (typeof cb === 'function') { process.nextTick(cb, null, n); return undefined; }
  return n;
};
require('module').syncBuiltinESMExports();
const DateReal = Date;
const inicio = DateReal.now();
const FIJO = DateReal.UTC(2026, 10, 2, 16, 0, 0);
const ahora = () => FIJO + (DateReal.now() - inicio);
globalThis.Date = new Proxy(DateReal, {
  construct(t, a) { return a.length ? new t(...a) : new t(ahora()); },
  apply() { return new DateReal(ahora()).toString(); },
  get(t, p) { return p === 'now' ? ahora : Reflect.get(t, p); }
});
`);

// ── El servidor que imita a OpenAI ─────────────────────────────────────────────────────────────────────────
let recibidas = [];
let alResponder = null;   // (pedido, cuerpo) → { status, contenido } para un caso; null = respuesta desde el esquema
function resolverRef(raiz, s) {
  if (s && s.$ref && s.$ref.startsWith('#/')) return s.$ref.slice(2).split('/').reduce((o, k) => (o ? o[k] : undefined), raiz) || {};
  return s;
}
// El adaptador quita de los esquemas para Claude los largos, mínimos y máximos, y los deja anotados al final de la
// descripción: «(minLength: 30, maxLength: 68)». El modelo real los lee ahí; el simulado también, así responde
// exactamente lo mismo con los dos proveedores y el pipeline sigue el mismo camino.
function conNotas(s) {
  const m = s && typeof s.description === 'string' && s.description.match(/\(([^()]*)\)\s*$/);
  if (!m) return s;
  const extra = {};
  for (const par of m[1].split(', ')) {
    const [k, v] = par.split(': ');
    if (/^(minLength|maxLength|minimum|maximum|exclusiveMinimum|exclusiveMaximum|minItems|maxItems)$/.test(k)) { try { extra[k] = JSON.parse(v); } catch { /* nota ajena */ } }
  }
  return { ...extra, ...s };
}
// i: posición dentro del arreglo más cercano; los enum rotan con ella (así un arreglo de 4 cubre los 4 roles).
function sintetiza(raiz, s0, prof = 0, i = 0) {
  const s = conNotas(resolverRef(raiz, s0));
  if (!s || typeof s !== 'object' || prof > 40) return null;
  if (s.const !== undefined) return s.const;
  if (Array.isArray(s.enum) && s.enum.length) return s.enum[i % s.enum.length];
  if (s.anyOf || s.oneOf) { const ops = s.anyOf || s.oneOf; return sintetiza(raiz, ops.find((x) => x && x.type !== 'null') || ops[0], prof + 1, i); }
  let t = s.type;
  if (Array.isArray(t)) t = t.find((x) => x !== 'null') || t[0];
  if (!t && s.properties) t = 'object';
  if (t === 'object') { const o = {}; for (const [k, v] of Object.entries(s.properties || {})) o[k] = sintetiza(raiz, v, prof + 1, i); return o; }
  if (t === 'array') { const n = Math.max(1, s.minItems || 0); return Array.from({ length: n }, (_, k) => sintetiza(raiz, s.items || {}, prof + 1, k)); }
  if (t === 'string') {
    const frase = 'La lectura abre una puerta concreta hacia la calma y la acción de hoy. ';
    const meta = Math.max(s.minLength || 0, Math.min(s.maxLength || 90, 90));
    let x = frase; while (x.length < meta) x += frase;
    x = x.slice(0, meta).trimEnd();
    while (x.length < (s.minLength || 0)) x += '.';
    return x;
  }
  if (t === 'number' || t === 'integer') {
    const lo = s.minimum ?? s.exclusiveMinimum ?? 0, hi = s.maximum ?? s.exclusiveMaximum ?? 1;
    const v = (lo + hi) / 2 || 0.8;
    return t === 'integer' ? Math.round(v) || 1 : v;
  }
  if (t === 'boolean') return true;
  return null;
}
// Lo que la Messages API real rechaza (documentación oficial leída el 2 de noviembre de 2026; ver ia/ia.cjs).
const LLAVES_CLAUDE = new Set(['model', 'max_tokens', 'messages', 'system', 'thinking', 'output_config', 'metadata', 'stop_sequences']);
const NO_EN_ESQUEMA = ['minLength', 'maxLength', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf', 'maxItems', 'minProperties', 'maxProperties', 'uniqueItems'];
function validaEsquemaClaude(raiz) {
  const e = []; let opcionales = 0, uniones = 0;
  (function nodo(x, ruta) {
    if (!x || typeof x !== 'object' || Array.isArray(x)) return;
    for (const k of NO_EN_ESQUEMA) if (k in x) e.push(`esquema: «${k}» en ${ruta}`);
    if (typeof x.minItems === 'number' && x.minItems > 1) e.push(`esquema: minItems ${x.minItems} en ${ruta}`);
    const esObjeto = x.type === 'object' || (Array.isArray(x.type) && x.type.includes('object')) || (x.properties && typeof x.properties === 'object');
    if (esObjeto && x.additionalProperties !== false) e.push(`esquema: objeto sin additionalProperties:false en ${ruta}`);
    if ((Array.isArray(x.type) && x.type.length > 1) || x.anyOf) uniones++;
    if (x.properties) { opcionales += Object.keys(x.properties).filter((k) => !(x.required || []).includes(k)).length; for (const [k, v] of Object.entries(x.properties)) nodo(v, ruta + '.' + k); }
    if (x.items) nodo(x.items, ruta + '[]');
    for (const k of ['anyOf', 'oneOf', 'allOf']) if (Array.isArray(x[k])) x[k].forEach((y, i) => nodo(y, `${ruta}.${k}${i}`));
    for (const k of ['$defs', 'definitions']) if (x[k]) for (const [n, v] of Object.entries(x[k])) nodo(v, `${ruta}.${k}.${n}`);
  })(raiz, '$');
  if (opcionales > 24) e.push(`esquema: ${opcionales} parámetros opcionales (máximo 24)`);
  if (uniones > 16) e.push(`esquema: ${uniones} uniones (máximo 16)`);
  return e;
}
function validaClaude(p, h) {
  const e = [];
  if (h['x-api-key'] !== 'sk-ant-prueba') e.push('x-api-key');
  if (h['anthropic-version'] !== '2023-06-01') e.push('anthropic-version');
  if (h.authorization) e.push('manda Authorization (llave de OpenAI)');
  for (const k of Object.keys(p)) if (!LLAVES_CLAUDE.has(k)) e.push('llave no admitida: ' + k);
  const papel = { 'claude-haiku-5-5': 'disabled', 'claude-sonnet-5-5': 'between_tools' }[p.model];
  if (!papel) e.push('modelo ' + p.model);
  else if (!p.thinking || p.thinking.type !== papel) e.push(`thinking de ${p.model}: ${JSON.stringify(p.thinking)}`);
  if (!Number.isInteger(p.max_tokens) || p.max_tokens < 1) e.push('max_tokens');
  const ms = p.messages;
  if (!Array.isArray(ms) || !ms.length) e.push('messages vacío');
  else {
    if (ms[0].role !== 'user') e.push('el primer turno no es user');
    if (ms[ms.length - 1].role !== 'user') e.push('termina en assistant (prefill)');
    ms.forEach((m, i) => { if (i && m.role === ms[i - 1].role) e.push('dos turnos seguidos del mismo rol'); if (typeof m.content !== 'string' || !m.content.trim()) e.push('turno ' + i + ' vacío'); });
  }
  if (p.system !== undefined && (typeof p.system !== 'string' || !p.system.trim())) e.push('system vacío o no texto');
  if (p.output_config) {
    for (const k of Object.keys(p.output_config)) if (!['format', 'effort'].includes(k)) e.push('output_config.' + k);
    const f = p.output_config.format;
    if (f && (f.type !== 'json_schema' || !f.schema)) e.push('format sin json_schema');
    else if (f) e.push(...validaEsquemaClaude(f.schema));
  }
  return e;
}
let violaciones = [];
const srv = http.createServer((req, res) => {
  let cuerpo = '';
  req.setEncoding('utf8');
  req.on('data', (c) => { cuerpo += c; });
  req.on('end', () => {
    recibidas.push({ ruta: req.url, auth: req.headers.authorization || '', tipo: req.headers['content-type'] || '', cuerpo });
    let pedido = {};
    try { pedido = JSON.parse(cuerpo); } catch { /* cuerpo raro: se compara igual */ }
    const claude = req.url.startsWith('/v1/messages');
    if (claude) {
      const e = validaClaude(pedido, req.headers);
      if (e.length) {
        violaciones.push(...e);
        const b = JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: e.join('; ') } });
        res.writeHead(400, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(b) });
        return res.end(b);
      }
    }
    let r = alResponder ? alResponder(pedido, cuerpo) : null;
    if (!r) {
      const js = claude ? pedido.output_config && pedido.output_config.format : pedido.response_format && pedido.response_format.json_schema;
      r = { status: 200, contenido: js && js.schema ? JSON.stringify(sintetiza(js.schema, js.schema)) : '{}' };
    }
    if (claude) {
      const b = JSON.stringify(r.status === 200
        ? { id: 'msg_prueba', type: 'message', role: 'assistant', model: pedido.model, content: [{ type: 'text', text: r.contenido }], stop_reason: 'end_turn', stop_sequence: null,
            usage: { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } }
        : { type: 'error', error: { type: 'api_error', message: 'error de prueba ' + r.status } });
      res.writeHead(r.status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(b) });
      return res.end(b);
    }
    const data = r.status === 200
      ? { id: 'chatcmpl-prueba', object: 'chat.completion', created: 1793635200, model: pedido.model || '',
          choices: [{ index: 0, message: { role: 'assistant', content: r.contenido, refusal: null }, logprobs: null, finish_reason: 'stop' }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } }
      : { error: { message: 'error de prueba ' + r.status, type: 'prueba' } };
    const b = JSON.stringify(data);
    res.writeHead(r.status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(b) });
    res.end(b);
  });
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const PUERTO = srv.address().port;

// ── Correr una versión y quedarse con lo que mandó ─────────────────────────────────────────────────────────
function limpiaTmp() { for (const f of fs.readdirSync('/tmp')) if (f.startsWith('triggui-')) fs.rmSync(path.join('/tmp', f), { recursive: true, force: true }); }
// Cada corrida dentro de una de las dos copias arranca de su estado limpio (el pipeline deja archivos que la
// siguiente corrida leería: historial de tonos, métricas, catálogos de prueba).
function limpiaRaiz(cwd) {
  for (const r of Object.values(raices)) if (cwd && (cwd === r || cwd.startsWith(r + path.sep))) {
    git(r, 'checkout', '-q', '--', '.');
    git(r, 'clean', '-fdxq', '-e', 'experiments/nucleus/node_modules', '-e', 'triggui-content');
  }
}
function corre(args, { cwd, env = {}, ms = 300000 }) {
  return new Promise((resolve) => {
    recibidas = [];
    limpiaTmp();
    limpiaRaiz(cwd);
    const e = { PATH: process.env.PATH, HOME: process.env.HOME, TZ: 'America/Mexico_City', LANG: 'C.UTF-8',
      OPENAI_KEY: 'sk-prueba-equivalencia', OPENAI_API_KEY: 'sk-prueba-equivalencia', PRUEBA_PUERTO: String(PUERTO),
      OPENAI_BASE_URL: `http://127.0.0.1:${PUERTO}/v1`, ...env };
    for (const k of Object.keys(e)) if (e[k] == null) delete e[k];   // null = sin esa variable
    const p = spawn(process.execPath, ['--require', PRECARGA, ...args], { cwd, env: e, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    const reloj = setTimeout(() => p.kill('SIGKILL'), ms);
    p.on('close', (code) => { clearTimeout(reloj); resolve({ code, out, pedidos: recibidas.slice() }); });
  });
}
const normaliza = (t, quitar = []) => [...quitar, raices.base, raices.nuevo].reduce((x, q) => x.split(q).join('<ruta>'), String(t))
  .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z/g, '<fecha>')
  .replace(/"(\w*_ms)":\s*\d+/g, '"$1": <t>')
  .replace(/\b\d+(\.\d+)?\s?(ms|s)\b/g, '<t>')
  .replace(/(\.(?:c|m)?js):\d+:\d+\)/g, '$1:<línea>)');   // la línea de una pila de error se movió con el código nuevo
function comparaPedidos(nombre, a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const x = a[i], y = b[i];
    if (!x || !y || x.ruta !== y.ruta || x.auth !== y.auth || x.tipo !== y.tipo || x.cuerpo !== y.cuerpo) {
      let det = `antes ${a.length} peticiones, ahora ${b.length}; la ${i + 1}ª difiere`;
      if (x && y && x.cuerpo !== y.cuerpo) {
        let k = 0; while (k < x.cuerpo.length && x.cuerpo[k] === y.cuerpo[k]) k++;
        det += `\n      antes: …${x.cuerpo.slice(Math.max(0, k - 60), k + 80)}\n      ahora: …${y.cuerpo.slice(Math.max(0, k - 60), k + 80)}`;
      } else if (x && y) det += ` (ruta ${x.ruta} / ${y.ruta}, llave ${x.auth === y.auth ? 'igual' : 'distinta'})`;
      ok(false, `${nombre}: las peticiones son idénticas`, det);
      return false;
    }
  }
  ok(n > 0, `${nombre}: ${n} peticiones idénticas (ruta, llave, tipo y bytes)`, 'no hubo ninguna petición');
  const papel = b.find((x) => /"model":\s*"(mini|grande)"/.test(x.cuerpo));
  ok(!papel, `${nombre}: ningún papel («mini», «grande») llega a OpenAI; el modelo sale resuelto`, papel && papel.cuerpo.slice(0, 120));
  return true;
}
const leeSiHay = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '<no existe>');
const copiaFixture = (dir, archivos) => { fs.mkdirSync(dir, { recursive: true }); for (const [n, c] of Object.entries(archivos)) { fs.mkdirSync(path.dirname(path.join(dir, n)), { recursive: true }); fs.writeFileSync(path.join(dir, n), typeof c === 'string' ? c : JSON.stringify(c, null, 2) + '\n'); } };

try {
  // ── 1. audience-blocker.cjs ──────────────────────────────────────────────────────────────────────────────
  console.log('audience-blocker.cjs');
  const libro = (t, a, extra = {}) => ({ titulo: t, autor: a, tagline: 'Una lectura para ' + t, frases: ['Frase de ' + t + '.'], ...extra });
  const catAud = { libros: [libro('Libro Uno', 'Autora Uno'), libro('Libro Dos', 'Autor Dos'), libro('Libro Tres', 'Autora Tres')] };
  for (const [nombre, responder] of [
    ['pasa, rechaza y degrada', (p, c) => (c.includes('Libro Dos') ? { status: 503 } : { status: 200, contenido: JSON.stringify(c.includes('Libro Tres')
      ? { matches: false, confidence: 0.9, reason: 'libro infantil', detected_audience: 'kids' }
      : { matches: true, confidence: 0.95, reason: 'adulto', detected_audience: 'adult' }) })],
    ['JSON roto', () => ({ status: 200, contenido: 'no es json' })]
  ]) {
    const r = {};
    for (const v of ['base', 'nuevo']) {
      const dir = path.join(T, `aud-${nombre.replace(/\W+/g, '-')}-${v}`);
      copiaFixture(dir, { 'contenido.json': catAud });
      alResponder = responder;
      r[v] = await corre([path.join(raices[v], 'experiments/nucleus/audience-blocker.cjs')],
        { cwd: dir, env: { CATALOG_PATH: path.join(dir, 'contenido.json'), TARGET_AUDIENCE: 'adult', BATCH_SIZE: '3' } });
      r[v].archivos = fs.readdirSync(dir).sort().map((f) => f + '\n' + normaliza(leeSiHay(path.join(dir, f)), [dir])).join('\n---\n');
      r[v].dir = dir;
    }
    comparaPedidos(`${nombre}`, r.base.pedidos, r.nuevo.pedidos);
    ok(r.base.code === r.nuevo.code, `${nombre}: mismo código de salida (${r.nuevo.code})`, `antes ${r.base.code}, ahora ${r.nuevo.code}`);
    ok(normaliza(r.base.out, [r.base.dir]) === normaliza(r.nuevo.out, [r.nuevo.dir]), `${nombre}: misma salida en pantalla`, normaliza(r.nuevo.out, [r.nuevo.dir]).slice(0, 300));
    ok(r.base.archivos === r.nuevo.archivos, `${nombre}: mismos archivos escritos (catálogo y rechazados)`);
  }

  // ── 2. gemelos-en.mjs ────────────────────────────────────────────────────────────────────────────────────
  console.log('gemelos-en.mjs');
  const conGemelos = (t) => ({ titulo: t, autor: 'A', _nucleus: { book_grounding_anchors: { authorial_voice_notes: 'Voz serena de ' + t + ' «ñ»' } }, _video: { candidatos: [{ id: 'AAAAAAAAAA1', pie: 'Un pie para ' + t }, { id: 'AAAAAAAAAA2', pie: 'Otro pie', pie_en: 'Already' }] } });
  const traduce = (p) => { const u = JSON.parse((p.messages || []).filter((m) => m.role === 'user').pop().content); return { status: 200, contenido: JSON.stringify({ t: u.textos.map((x) => 'EN ' + x) }) }; };
  {
    const r = {};
    for (const v of ['base', 'nuevo']) {
      const dir = path.join(T, `gem-${v}`);
      copiaFixture(dir, { 'triggui-content/contenido.json': { libros: [conGemelos('Uno'), conGemelos('Dos')] }, 'triggui-content/contenido_manual.json': { libros: [conGemelos('Tres')] } });
      alResponder = traduce;
      r[v] = await corre([path.join(raices[v], 'scripts/gemelos-en.mjs')], { cwd: dir });
      r[v].archivos = ['contenido.json', 'contenido_manual.json'].map((f) => leeSiHay(path.join(dir, 'triggui-content', f))).join('\n---\n');
    }
    comparaPedidos('traducción por lotes', r.base.pedidos, r.nuevo.pedidos);
    ok(r.base.code === r.nuevo.code && r.base.out === r.nuevo.out, `misma salida y código (${r.nuevo.code})`, r.nuevo.out.slice(0, 300));
    ok(r.base.archivos === r.nuevo.archivos, 'mismos archivos escritos');
  }

  // ── 3. phrase-sanitizer-llm.cjs (triggui-content) ────────────────────────────────────────────────────────
  console.log('phrase-sanitizer-llm.cjs (triggui-content)');
  const catSan = { meta: {}, libros: [{ titulo: 'La mente en calma', autor: 'Autora', frases: ['Una frase completa y cerrada.', 'La mente que se entrena para'],
    tarjeta: { parrafoTop: 'Respira y vuelve al centro.', parrafoBot: 'Hoy basta con un paso' },
    _nucleus: { book_grounding_anchors: { concepts: ['calma', 'atención'], key_terms: ['respiración'], authorial_voice_notes: 'Serena' }, book_identity: { titulo_es: 'La mente en calma', autor_completo: 'Autora' } } }] };
  const juzga = (p, c) => ({ status: 200, contenido: JSON.stringify(c.includes('La mente que se entrena para') || c.includes('Hoy basta con un paso')
    ? { truncated: true, kind: 'truncated', confidence: 0.9, fixed_phrase: (c.includes('Hoy basta') ? 'Hoy basta con un paso pequeño y verdadero.' : 'La mente que se entrena para la calma encuentra su centro.'), reason: 'final colgado' }
    : { truncated: false, kind: 'ok', confidence: 0.95, fixed_phrase: null, reason: 'completa' }) });
  {
    const r = {};
    const variantes = { base: [saneador.base, {}], nuevo: [saneador.nuevo, {}], 'nuevo con TRIGGUI_IA_LIB': [saneador.nuevo, { TRIGGUI_IA_LIB: path.join(raices.nuevo, 'ia/ia.cjs') }] };
    for (const [v, [script, env]] of Object.entries(variantes)) {
      const dir = path.join(T, `san-${v.replace(/\W+/g, '-')}`);
      copiaFixture(dir, { 'contenido.json': catSan });
      alResponder = juzga;
      r[v] = await corre([script, `--catalog=${path.join(dir, 'contenido.json')}`, '--mode=fix', '--only-last=true', '--batch-size=1'], { cwd: dir, env });
      r[v].archivos = normaliza(leeSiHay(path.join(dir, 'contenido.json')), [dir]);
      r[v].dir = dir;
    }
    for (const v of ['nuevo', 'nuevo con TRIGGUI_IA_LIB']) {
      comparaPedidos(v, r.base.pedidos, r[v].pedidos);
      ok(r.base.code === r[v].code && normaliza(r.base.out, [r.base.dir]) === normaliza(r[v].out, [r[v].dir]), `${v}: misma salida y código (${r[v].code})`, normaliza(r[v].out, [r[v].dir]).slice(0, 300));
      ok(r.base.archivos === r[v].archivos, `${v}: el mismo catálogo reparado`);
    }
  }

  // ── 4. validate-book.js (modo 💭 constrained: normaliza el trigger y elige del CSV) ──────────────────────
  console.log('validate-book.js (💭 constrained)');
  {
    const csv = 'titulo,autor,tagline,portada,isbn,editorial,tema,contexto\n'
      + '"El hombre en busca de sentido","Viktor E. Frankl","Sentido en medio del dolor","","","Herder","duelo","pérdida y propósito"\n'
      + '"Las cuatro estaciones","Autora Prueba","Ciclos de la vida","","","Ed","naturaleza","cambio"\n';
    const r = {};
    for (const v of ['base', 'nuevo']) {
      const dir = path.join(T, `vb-${v}`);
      copiaFixture(dir, { 'libros.csv': csv });
      alResponder = null;
      r[v] = await corre(['validate-book.js'], { cwd: path.join(raices[v], 'experiments/nucleus'),
        env: { INPUT_MODE: 'trigger', SELECTOR_MODE: 'constrained', ENTRADA_RAW: 'en duelo', CATALOG_SCOPE: 'libros_master_csv', CATALOG_CSV_PATH: path.join(dir, 'libros.csv'), TARGET_AUDIENCE: 'adult' } });
      r[v].book = normaliza(leeSiHay('/tmp/triggui-book.json'));
    }
    comparaPedidos('selección', r.base.pedidos, r.nuevo.pedidos);
    ok(r.base.code === r.nuevo.code, `mismo código de salida (${r.nuevo.code})`, `antes ${r.base.code}, ahora ${r.nuevo.code}`);
    ok(igualOGuarda(r.base.book, r.nuevo.book, 'validate-book libro'), 'el mismo libro elegido (/tmp/triggui-book.json)');
  }

  // ── 5. build-contenido-nucleus.js (un libro, SINGLE_MODE; el SDK de OpenAI va al servidor local) ─────────
  console.log('build-contenido-nucleus.js (un libro)');
  {
    const libroUno = JSON.stringify({ titulo: 'El hombre en busca de sentido', autor: 'Viktor E. Frankl', tagline: 'Sentido en medio del dolor', identity_sealed: true });
    const r = {};
    for (const v of ['base', 'nuevo']) {
      alResponder = null;
      r[v] = await corre(['build-contenido-nucleus.js'], { cwd: path.join(raices[v], 'experiments/nucleus'), ms: 600000,
        env: { SINGLE_MODE: 'true', UNIFIED_MODE: 'false', SINGLE_BOOK: libroUno, CATALOG_MODE: 'adulto', TRIGGUI_CRONO_ENABLED: 'true' } });
    }
    // El juez de voz corre ES y EN a la vez: el orden de llegada cambia de una corrida a otra. Se comparan en
    // orden de cuerpo (mismo conjunto exacto de peticiones); las respuestas dependen solo del cuerpo, no del orden.
    const enOrden = (xs) => xs.slice().sort((x, y) => (x.cuerpo < y.cuerpo ? -1 : x.cuerpo > y.cuerpo ? 1 : 0));
    comparaPedidos('todas las fases (mismo conjunto exacto)', enOrden(r.base.pedidos), enOrden(r.nuevo.pedidos));
    ok(r.base.code === r.nuevo.code, `mismo código de salida (${r.nuevo.code})`, `antes ${r.base.code}, ahora ${r.nuevo.code}\n      ${r.nuevo.out.slice(-400)}`);
    const sinIA = (t) => normaliza(t).split('\n').filter((l) => !l.startsWith('🧠 IA: proveedor')).join('\n');
    ok(igualOGuarda(sinIA(r.base.out), sinIA(r.nuevo.out), 'build salida'), 'misma salida en pantalla (fuera de la línea nueva «🧠 IA: proveedor…»)');
    const fases = [...new Set(r.nuevo.pedidos.map((x) => { try { const p = JSON.parse(x.cuerpo); return (p.response_format && p.response_format.json_schema && p.response_format.json_schema.name) || (p.response_format && p.response_format.type) || 'texto'; } catch { return '?'; } }))];
    console.log(`      fases vistas: ${fases.join(', ')}`);
  }

  // ══ Segunda parte: Claude simulado (la versión de ahora con TRIGGUI_IA_PROVEEDOR=claude y sin llaves de OpenAI) ══
  console.log('\nClaude simulado (proveedor claude, sin llaves de OpenAI, Messages API estricta)');
  const CLAUDE = { TRIGGUI_IA_PROVEEDOR: 'claude', ANTHROPIC_API_KEY: 'sk-ant-prueba', OPENAI_KEY: null, OPENAI_API_KEY: null, OPENAI_BASE_URL: null };
  const modelos = (t) => String(t).split('claude-haiku-5-5').join('<mini>').split('gpt-4o-mini').join('<mini>').split('claude-sonnet-5-5').join('<grande>').split('gpt-4o').join('<grande>');
  async function dos(nombre, args, opts, responder, archivos) {
    const r = {};
    for (const [v, extra] of [['openai', {}], ['claude', CLAUDE]]) {
      const dir = opts.dir ? opts.dir(v) : null;
      if (opts.fixture) copiaFixture(dir, opts.fixture);
      alResponder = responder;
      violaciones = [];
      r[v] = await corre(typeof args === 'function' ? args(dir) : args, { cwd: opts.cwd ? opts.cwd : dir, ms: opts.ms, env: { ...(opts.env ? opts.env(dir) : {}), ...extra } });
      r[v].violaciones = violaciones.slice();
      r[v].archivos = archivos ? modelos(normaliza(archivos(dir), dir ? [dir] : [])) : '';
    }
    const c = r.claude;
    ok(c.violaciones.length === 0, `${nombre}: todas sus peticiones cumplen las reglas de la Messages API`, [...new Set(c.violaciones)].slice(0, 6).join(' | '));
    const aOpenAI = c.pedidos.filter((x) => !x.ruta.startsWith('/v1/messages'));
    ok(c.pedidos.length > 0 && aOpenAI.length === 0, `${nombre}: ${c.pedidos.length} peticiones, todas a Claude`, `${aOpenAI.length} fueron a OpenAI`);
    ok(c.pedidos.length === r.openai.pedidos.length, `${nombre}: el mismo número de llamadas que con openai (${r.openai.pedidos.length})`, `openai ${r.openai.pedidos.length}, claude ${c.pedidos.length}`);
    ok(c.code === r.openai.code, `${nombre}: termina igual que con openai (código ${r.openai.code})`, `openai ${r.openai.code}, claude ${c.code}\n      ${c.out.slice(-500)}`);
    if (archivos) ok(igualOGuarda(r.openai.archivos, c.archivos, 'claude ' + nombre), `${nombre}: deja los mismos archivos que con openai (fuera del nombre del modelo)`);
    return r;
  }
  const decide = (p, c) => ({ status: 200, contenido: JSON.stringify(c.includes('Libro Tres')
    ? { matches: false, confidence: 0.9, reason: 'libro infantil', detected_audience: 'kids' }
    : { matches: true, confidence: 0.95, reason: 'adulto', detected_audience: 'adult' }) });
  const leeDir = (dir) => fs.readdirSync(dir).sort().map((f) => f + '\n' + leeSiHay(path.join(dir, f))).join('\n---\n');
  await dos('audience-blocker', () => [path.join(raices.nuevo, 'experiments/nucleus/audience-blocker.cjs')],
    { dir: (v) => path.join(T, 'c-aud-' + v), fixture: { 'contenido.json': catAud }, env: (dir) => ({ CATALOG_PATH: path.join(dir, 'contenido.json'), TARGET_AUDIENCE: 'adult', BATCH_SIZE: '3' }) },
    decide, leeDir);
  {
    // Un 529 (saturado) se reintenta y la decisión es la misma que sin error
    const dir = path.join(T, 'c-aud-529');
    copiaFixture(dir, { 'contenido.json': catAud });
    let vistos = 0;
    alResponder = (p, c) => (c.includes('Libro Dos') && vistos++ === 0 ? { status: 529 } : decide(p, c));
    violaciones = [];
    const r = await corre([path.join(raices.nuevo, 'experiments/nucleus/audience-blocker.cjs')], { cwd: dir, env: { CATALOG_PATH: path.join(dir, 'contenido.json'), TARGET_AUDIENCE: 'adult', BATCH_SIZE: '3', ...CLAUDE } });
    const refDir = path.join(T, 'c-aud-claude');
    ok(r.pedidos.length === 4 && modelos(normaliza(leeDir(dir), [dir])) === modelos(normaliza(leeDir(refDir), [refDir])), 'audience-blocker: un 529 se reintenta y la decisión es la misma', `${r.pedidos.length} peticiones`);
  }
  await dos('gemelos-en', () => [path.join(raices.nuevo, 'scripts/gemelos-en.mjs')],
    { dir: (v) => path.join(T, 'c-gem-' + v), fixture: { 'triggui-content/contenido.json': { libros: [conGemelos('Uno'), conGemelos('Dos')] }, 'triggui-content/contenido_manual.json': { libros: [conGemelos('Tres')] } } },
    traduce, (dir) => ['contenido.json', 'contenido_manual.json'].map((f) => leeSiHay(path.join(dir, 'triggui-content', f))).join('\n---\n'));
  await dos('saneador (con TRIGGUI_IA_LIB)', (dir) => [saneador.nuevo, `--catalog=${path.join(dir, 'contenido.json')}`, '--mode=fix', '--only-last=true', '--batch-size=1'],
    { dir: (v) => path.join(T, 'c-san-' + v), fixture: { 'contenido.json': catSan }, env: () => ({ TRIGGUI_IA_LIB: path.join(raices.nuevo, 'ia/ia.cjs') }) },
    juzga, (dir) => leeSiHay(path.join(dir, 'contenido.json')));
  {
    const csv = 'titulo,autor,tagline,portada,isbn,editorial,tema,contexto\n'
      + '"El hombre en busca de sentido","Viktor E. Frankl","Sentido en medio del dolor","","","Herder","duelo","pérdida y propósito"\n'
      + '"Las cuatro estaciones","Autora Prueba","Ciclos de la vida","","","Ed","naturaleza","cambio"\n';
    await dos('validate-book (💭)', ['validate-book.js'],
      { cwd: path.join(raices.nuevo, 'experiments/nucleus'), dir: (v) => path.join(T, 'c-vb-' + v), fixture: { 'libros.csv': csv },
        env: (dir) => ({ INPUT_MODE: 'trigger', SELECTOR_MODE: 'constrained', ENTRADA_RAW: 'en duelo', CATALOG_SCOPE: 'libros_master_csv', CATALOG_CSV_PATH: path.join(dir, 'libros.csv'), TARGET_AUDIENCE: 'adult' }) },
      null, () => leeSiHay('/tmp/triggui-book.json'));
  }
  {
    const libroUno = JSON.stringify({ titulo: 'El hombre en busca de sentido', autor: 'Viktor E. Frankl', tagline: 'Sentido en medio del dolor', identity_sealed: true });
    const r = await dos('build-contenido (un libro)', ['build-contenido-nucleus.js'],
      { cwd: path.join(raices.nuevo, 'experiments/nucleus'), ms: 600000, env: () => ({ SINGLE_MODE: 'true', UNIFIED_MODE: 'false', SINGLE_BOOK: libroUno, CATALOG_MODE: 'adulto', TRIGGUI_CRONO_ENABLED: 'true' }) },
      null, null);
    // retryOnce corta el error a 80 caracteres: con nombres de modelo de otro largo, el corte cae en otro lugar.
    const pantalla = (t) => modelos(normaliza(t)).replace(/falló \(.*\), reintentando/g, 'falló (<error>), reintentando')
      .split('\n').filter((l) => !l.startsWith('🧠 IA: proveedor')).join('\n');
    ok(igualOGuarda(pantalla(r.openai.out), pantalla(r.claude.out), 'claude build salida'), 'build-contenido: la misma salida en pantalla que con openai (fuera del nombre del modelo)');
    const porModelo = (xs) => xs.reduce((a, x) => { try { const m = JSON.parse(x.cuerpo).model; a[m] = (a[m] || 0) + 1; } catch { /* nada */ } return a; }, {});
    console.log(`      llamadas por modelo · openai ${JSON.stringify(porModelo(r.openai.pedidos))} · claude ${JSON.stringify(porModelo(r.claude.pedidos))}`);
  }

  // ── 6. Python: resolve-videos.py y resolve-musica.py ─────────────────────────────────────────────────────
  console.log('Python');
  const py = await new Promise((resolve) => {
    const p = spawn('python3', ['-I', path.join(AQUI, 'prueba_equivalencia.py'), `--base=${raices.base}`, `--nuevo=${raices.nuevo}`, `--contenido=${CONTENIDO}`],
      { env: { PATH: process.env.PATH, HOME: process.env.HOME, PYTHONDONTWRITEBYTECODE: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { out += d; });
    p.on('close', (code) => resolve({ code, out }));
  });
  process.stdout.write(py.out.split('\n').filter((l) => l.trim()).map((l) => '  ' + l.trim()).join('\n') + '\n');
  ok(py.code === 0, 'Python: todas sus comprobaciones');
} finally {
  srv.close();
  limpiaTmp();
  for (const r of Object.values(raices)) { try { git(RAIZ, 'worktree', 'remove', '--force', r); } catch { /* ya no está */ } }
  fs.rmSync(T, { recursive: true, force: true });
}
console.log(`\n${total - fallas}/${total} comprobaciones de equivalencia`);
process.exit(fallas ? 1 : 0);
