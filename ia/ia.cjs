'use strict';
/*
 * IA de Triggui: un solo lugar para todas las llamadas a modelos (C278, 2 de noviembre de 2026).
 *
 * Quien llama sigue hablando en el formato de Chat Completions de OpenAI (mensajes, response_format, usage,
 * finish_reason) y pide un papel en vez de un modelo: "mini" o "grande" (los nombres viejos, como
 * "gpt-4o-mini", son alias). Este archivo decide el proveedor (config.json o TRIGGUI_IA_PROVEEDOR) y:
 *   · con openai: manda la MISMA petición de antes, solo con el nombre del modelo resuelto (mismos bytes);
 *   · con claude: la traduce a la Messages API y devuelve la respuesta con la forma de siempre.
 *
 * Dos maneras de usarlo:
 *   · crearCliente({ sdk })   reemplaza al cliente del SDK de OpenAI: .chat.completions.create(params, opciones)
 *   · chatCompat(payload, o)   reemplaza a fetch(api.openai.com/...): devuelve algo con ok, status, json() y text()
 *
 * Traducción a Claude (documentación oficial leída el 2 de noviembre de 2026):
 *   · system aparte; max_tokens siempre; sin temperature ni top_p (los modelos 5.5 no los aceptan);
 *   · response_format json_schema → output_config.format, quitando lo que Claude no acepta (largos, mínimos y
 *     máximos, cantidades) y con additionalProperties:false en todo objeto; lo quitado queda en la descripción;
 *   · response_format json_object → instrucción de responder solo JSON, extracción y un reintento;
 *   · stop_reason: max_tokens → finish_reason "length"; refusal → message.refusal (nunca un aprobado);
 *   · usage: prompt_tokens = entrada + caché; completion_tokens = salida;
 *   · max_tokens nunca baja de claude.max_tokens_minimo (el tokenizador de Claude cuenta distinto y un tope pensado
 *     para GPT puede cortar; el tope no cuesta: solo se cobra lo que se genera y no cuenta para los límites);
 *   · un 429 por tope de gasto (enforced_spend_limit_reached) no se reintenta: se dice claro;
 *   · caché del system: se marca solo cuando ese system se va a reusar y sin escrituras en paralelo (ver
 *     «Claude: caché del system» más abajo). Con openai no cambia nada.
 *
 * Registro de uso: con TRIGGUI_IA_REGISTRO=<archivo>, cada llamada (de los dos proveedores) deja una línea JSON con
 * papel, modelo, tokens, fin, milisegundos, reintentos y de dónde vino (archivo:función). «entrada» es la entrada que
 * no salió de la caché, con los dos proveedores. Sin la variable no se escribe nada y las peticiones son las mismas.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RUTA_CONFIG = process.env.TRIGGUI_IA_CONFIG || path.join(__dirname, 'config.json');
let _cfg = null;
function config() {
  if (!_cfg) _cfg = JSON.parse(fs.readFileSync(RUTA_CONFIG, 'utf8'));
  return _cfg;
}

function proveedor() {
  const p = String(process.env.TRIGGUI_IA_PROVEEDOR || config().proveedor || 'openai').trim().toLowerCase();
  if (p !== 'openai' && p !== 'claude') throw new Error(`IA: proveedor desconocido «${p}» (usa openai o claude)`);
  return p;
}
function llaveOpenAI() { return String(process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '').trim(); }
function llaveClaude() { return String(process.env.ANTHROPIC_API_KEY || '').trim(); }
function hayLlave() { return proveedor() === 'claude' ? !!llaveClaude() : !!llaveOpenAI(); }
function nombreLlave() { return proveedor() === 'claude' ? 'ANTHROPIC_API_KEY' : 'OPENAI_KEY u OPENAI_API_KEY'; }
/** Para los mensajes de error: con openai dice "OpenAI", igual que antes. */
function nombreProveedor() { return proveedor() === 'claude' ? 'Claude' : 'OpenAI'; }

/** El papel que pide un nombre de modelo ("mini", "grande" o un alias); null si es un modelo explícito. */
function papel(modelo) {
  const c = config();
  if (modelo && c.papeles[modelo]) return modelo;
  if (modelo && c.alias && c.alias[modelo]) return c.alias[modelo];
  return null;
}
/** El modelo real para un proveedor. Un nombre que no es papel ni alias pasa tal cual. */
function resolverModelo(modelo, prov) {
  const r = papel(modelo);
  if (!r) return modelo;
  return config().papeles[r][prov || proveedor()];
}
/** Para etiquetas y registros: un papel ("mini", "grande") se escribe con su modelo real; cualquier otro nombre
 *  (por ejemplo el que devolvió la respuesta) pasa tal cual. Con openai da lo mismo que se escribía antes. */
function etiqueta(modelo) { return modelo && config().papeles[modelo] ? resolverModelo(modelo) : modelo; }
/** Cambia solo el valor de "model" y conserva el orden de las llaves (el JSON sale con los mismos bytes). */
function conModelo(obj, modelo) { return Object.assign({}, obj, { model: modelo }); }

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Registro de uso (opcional) ──────────────────────────────────────────────────────────────────────────
/** archivo:función de quien llamó (el primer marco de la pila fuera de este archivo, de node y de node_modules). */
function origen() {
  for (const l of String(new Error().stack || '').split('\n').slice(1)) {
    const m = l.trim().match(/^at (?:async )?(?:(.*?) \()?(.*?):(\d+):(\d+)\)?$/);
    if (!m) continue;
    const lugar = m[2].replace(/^file:\/\//, '');
    if (lugar === __filename || lugar.startsWith('node:') || lugar.includes('node_modules')) continue;
    return `${path.basename(lugar)}:${m[1] || '(anónima)'}`;
  }
  return null;
}
function registra(dato) {
  const ruta = process.env.TRIGGUI_IA_REGISTRO;
  if (!ruta) return;
  try { fs.appendFileSync(ruta, JSON.stringify({ t: new Date().toISOString(), ...dato }) + '\n'); } catch (e) { /* el registro nunca rompe la llamada */ }
}
function anotaOpenAI(params, data, t0, de, error) {
  const u = (data && data.usage) || {};
  const ch = (data && data.choices && data.choices[0]) || {};
  registra({ proveedor: 'openai', papel: papel(params.model), modelo: (data && data.model) || resolverModelo(params.model, 'openai'), origen: de,
    entrada: (u.prompt_tokens || 0) - ((u.prompt_tokens_details && u.prompt_tokens_details.cached_tokens) || 0), salida: u.completion_tokens || 0,
    cache_lectura: (u.prompt_tokens_details && u.prompt_tokens_details.cached_tokens) || 0, cache_escritura: 0,
    fin: ch.finish_reason || null, ms: Date.now() - t0, reintentos: 0, error: error || null });
}

// ─── OpenAI: la misma petición de siempre ────────────────────────────────────────────────────────────────
function fetchOpenAI(payload, opciones = {}) {
  return fetch(config().openai.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${llaveOpenAI()}` },
    body: JSON.stringify(payload),
    signal: opciones.signal
  });
}

// ─── Claude: traducción de ida ───────────────────────────────────────────────────────────────────────────
const QUITAR = new Set(['minLength', 'maxLength', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum',
  'multipleOf', 'maxItems', 'minProperties', 'maxProperties', 'uniqueItems']);
const QUITAR_SIN_NOTA = new Set(['default', 'format', '$schema']);

/** Copia del esquema que Claude acepta: sin largos, mínimos, máximos ni cantidades, con additionalProperties:false. */
function limpiaEsquema(s) {
  if (Array.isArray(s)) return s.map(limpiaEsquema);
  if (!s || typeof s !== 'object') return s;
  const o = {};
  const notas = [];
  for (const [k, v] of Object.entries(s)) {
    if (QUITAR.has(k)) { notas.push(`${k}: ${JSON.stringify(v)}`); continue; }
    if (QUITAR_SIN_NOTA.has(k)) continue;
    if (k === 'minItems' && typeof v === 'number' && v > 1) { notas.push(`minItems: ${v}`); continue; }
    if ((k === 'properties' || k === '$defs' || k === 'definitions') && v && typeof v === 'object' && !Array.isArray(v)) {
      o[k] = {};
      for (const [pk, pv] of Object.entries(v)) o[k][pk] = limpiaEsquema(pv);
      continue;
    }
    if (k === 'enum' || k === 'required' || k === 'const') { o[k] = v; continue; }
    o[k] = (v && typeof v === 'object') ? limpiaEsquema(v) : v;
  }
  const esObjeto = o.type === 'object' || (Array.isArray(o.type) && o.type.includes('object')) || (o.properties && typeof o.properties === 'object');
  if (esObjeto) o.additionalProperties = false;
  if (notas.length) o.description = (o.description ? o.description + ' ' : '') + '(' + notas.join(', ') + ')';
  return o;
}

function texto(contenido) {
  if (typeof contenido === 'string') return contenido;
  if (Array.isArray(contenido)) return contenido.map((p) => (typeof p === 'string' ? p : (p && p.text) || '')).join('');
  return contenido == null ? '' : String(contenido);
}

const INSTRUCCION_JSON = 'Responde únicamente con un objeto JSON válido: sin texto antes ni después y sin bloques de código.';

/** Cuerpo de la Messages API a partir de una petición de Chat Completions. */
function aClaude(params) {
  const c = config();
  const rol = papel(params.model);
  const modelo = rol ? c.papeles[rol].claude : params.model;
  const sistema = [];
  const mensajes = [];
  for (const m of params.messages || []) {
    const t = texto(m.content);
    if (m.role === 'system' || m.role === 'developer') { sistema.push(t); continue; }
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    const ult = mensajes[mensajes.length - 1];
    if (ult && ult.role === role) ult.content += '\n\n' + t;   // Claude pide turnos alternados
    else mensajes.push({ role, content: t });
  }
  if (!mensajes.length || mensajes[0].role !== 'user') mensajes.unshift({ role: 'user', content: '.' });
  const body = {
    model: modelo,
    max_tokens: Math.max(params.max_tokens || params.max_completion_tokens || c.claude.max_tokens_por_omision, c.claude.max_tokens_minimo || 1),
    messages: mensajes
  };
  let jsonLibre = false;
  const rf = params.response_format;
  const salida = {};
  if (rf && rf.type === 'json_schema' && rf.json_schema && rf.json_schema.schema) {
    salida.format = { type: 'json_schema', schema: limpiaEsquema(rf.json_schema.schema) };
  } else if (rf && rf.type === 'json_object') {
    jsonLibre = true;
    sistema.push(INSTRUCCION_JSON);
  }
  const conf = rol ? c.papeles[rol] : null;
  if (conf && conf.claude_esfuerzo) salida.effort = conf.claude_esfuerzo;
  if (Object.keys(salida).length) body.output_config = salida;
  if (conf && conf.claude_thinking) body.thinking = conf.claude_thinking;
  if (sistema.length) body.system = sistema.join('\n\n');
  return { body, jsonLibre };
}

// ─── Claude: caché del system ────────────────────────────────────────────────────────────────────────────
// Documentación oficial leída el 2 de noviembre de 2026: la API guarda un prefijo solo donde se marca cache_control;
// escribirlo cuesta 1.25 veces la entrada y leerlo 0.1 veces (0.05 en Sonnet 5.5); dura 5 minutos desde el inicio de
// la última petición que lo usó; solo existe cuando ya empezó la primera respuesta, y por debajo de 512 tokens no se
// guarda nada y no hay error. Por eso el system se marca solo cuando se va a reusar, y nunca dos escrituras a la vez:
//   · la primera vez que se ve un system va sin marca: una llamada suelta nunca paga escritura;
//   · ya terminada una llamada con ese system, la siguiente lo marca y lo escribe; las que corren en paralelo
//     mientras tanto van sin marca;
//   · ya escrito, todas lo marcan y lo leen mientras no pasen 4 minutos y medio desde su último uso;
//   · si la API no lo guardó (no llega al mínimo), ese system ya no se marca en este proceso.
// La clave es el modelo, su forma de pensar, el formato de salida y el texto del system. Se apaga con
// claude.cache_sistema: false en config.json.
const CACHE_VIGENCIA_MS = 270000;
const _cache = new Map();   // clave → { estado: primera | visto | escribiendo | guardado | no, t }

function claveCache(body) {
  return crypto.createHash('sha256').update(JSON.stringify([body.model, body.thinking || null, body.output_config || null, body.system])).digest('hex');
}
/** Decide si esta petición marca su system: { clave, marca }, o null si no aplica. */
function planCache(body) {
  if (typeof body.system !== 'string' || !body.system || config().claude.cache_sistema !== true) return null;
  const clave = claveCache(body);
  const ahora = Date.now();
  const e = _cache.get(clave);
  if (!e) { _cache.set(clave, { estado: 'primera', t: ahora }); return { clave, marca: false }; }
  if (e.estado === 'primera' || e.estado === 'escribiendo' || e.estado === 'no') return { clave, marca: false };
  if (e.estado === 'guardado' && ahora - e.t < CACHE_VIGENCIA_MS) { e.t = ahora; return { clave, marca: true }; }
  e.estado = 'escribiendo';   // visto, o guardado y vencido: esta petición escribe
  e.t = ahora;
  return { clave, marca: true };
}
/** Anota cómo terminó la petición: u = usage de la respuesta, o null si falló. */
function cierraCache(plan, u) {
  if (!plan) return;
  const e = _cache.get(plan.clave);
  if (!e) return;
  if (!plan.marca) {
    if (e.estado === 'primera') { if (u) e.estado = 'visto'; else _cache.delete(plan.clave); }
    return;
  }
  if (!u) { if (e.estado === 'escribiendo') e.estado = 'visto'; return; }
  if ((u.cache_creation_input_tokens || 0) > 0 || (u.cache_read_input_tokens || 0) > 0) { if (e.estado === 'escribiendo') e.estado = 'guardado'; return; }
  e.estado = 'no';
}
/** El cuerpo con el system marcado, si toca; el original no se toca. */
function conCache(body, plan) {
  return plan && plan.marca ? Object.assign({}, body, { system: [{ type: 'text', text: body.system, cache_control: { type: 'ephemeral' } }] }) : body;
}

// ─── Claude: traducción de vuelta ────────────────────────────────────────────────────────────────────────
function extraeJson(t) {
  let s = String(t || '').trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try { JSON.parse(s); return s; } catch (e) { /* sigue */ }
  const i = s.indexOf('{');
  const j = s.lastIndexOf('}');
  if (i >= 0 && j > i) {
    const cand = s.slice(i, j + 1);
    try { JSON.parse(cand); return cand; } catch (e) { /* sigue */ }
  }
  return null;
}

function deClaude(data, jsonLibre) {
  const textos = (data.content || []).filter((b) => b && b.type === 'text').map((b) => b.text || '');
  let content = textos.join('');
  const sr = data.stop_reason;
  let finish = 'stop';
  let refusal = null;
  if (sr === 'max_tokens') finish = 'length';
  if (sr === 'refusal') { finish = 'content_filter'; refusal = 'Claude rechazó la petición (stop_reason: refusal)'; content = ''; }
  let jsonOk = true;
  if (jsonLibre && content) {
    const limpio = extraeJson(content);
    if (limpio !== null) content = limpio; else jsonOk = false;
  }
  const u = data.usage || {};
  const entrada = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  const salida = u.output_tokens || 0;
  return {
    id: data.id,
    object: 'chat.completion',
    model: data.model,
    choices: [{ index: 0, message: { role: 'assistant', content, refusal }, finish_reason: finish }],
    usage: { prompt_tokens: entrada, completion_tokens: salida, total_tokens: entrada + salida },
    _claude: { stop_reason: sr, usage: u, json_ok: jsonLibre ? jsonOk : undefined }
  };
}

async function postClaude(body, opciones = {}, cuenta = { reintentos: 0 }) {
  const c = config().claude;
  const llave = llaveClaude();
  if (!llave) { const e = new Error('IA: falta ANTHROPIC_API_KEY'); e.status = 401; throw e; }
  const maxReintentos = opciones.maxRetries != null ? opciones.maxRetries : c.reintentos;
  let espera = 1000;
  for (let i = 0; ; i++) {
    const ctrl = new AbortController();
    const ms = opciones.timeout || c.timeout_ms;
    const reloj = setTimeout(() => ctrl.abort(), ms);
    const alAbortar = () => ctrl.abort();
    if (opciones.signal) { if (opciones.signal.aborted) ctrl.abort(); else opciones.signal.addEventListener('abort', alAbortar, { once: true }); }
    let res;
    try {
      res = await fetch(c.url, {
        method: 'POST',
        headers: { 'x-api-key': llave, 'anthropic-version': c.version, 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal
      });
    } catch (e) {
      clearTimeout(reloj);
      if (opciones.signal) opciones.signal.removeEventListener('abort', alAbortar);
      const abortoAjeno = opciones.signal && opciones.signal.aborted;
      if (!abortoAjeno && i < maxReintentos) { cuenta.reintentos++; await dormir(espera); espera *= 2; continue; }
      const err = new Error(`IA Claude: ${e && e.name === 'AbortError' ? 'tiempo agotado' : (e && e.message) || e}`);
      err.status = 0;
      throw err;
    }
    clearTimeout(reloj);
    if (opciones.signal) opciones.signal.removeEventListener('abort', alAbortar);
    if (res.ok) return res.json();
    const txt = await res.text().catch(() => '');
    let tope = false;   // 429 por tope de gasto: reintentar no sirve hasta que se libere el acceso
    try { tope = res.status === 429 && JSON.parse(txt).error.details.error_code === 'enforced_spend_limit_reached'; } catch (e) { /* otro 429 */ }
    if (tope) { const err = new Error('IA Claude 429: se alcanzó el tope de gasto del espacio de trabajo (enforced_spend_limit_reached)'); err.status = 429; err.body = txt; err.tope = true; throw err; }
    if ([408, 409, 429, 500, 502, 503, 504, 529].includes(res.status) && i < maxReintentos) {
      cuenta.reintentos++;
      const ra = Number(res.headers.get('retry-after'));
      await dormir(ra > 0 ? Math.min(ra * 1000, 60000) : espera);
      espera *= 2;
      continue;
    }
    const err = new Error(`IA Claude ${res.status}: ${txt.slice(0, 300)}`);
    err.status = res.status;
    err.body = txt;
    throw err;
  }
}

/** Una petición de Chat Completions resuelta con Claude; devuelve la forma de Chat Completions. */
async function llamaClaude(params, opciones = {}) {
  const { body, jsonLibre } = aClaude(params);
  const de = process.env.TRIGGUI_IA_REGISTRO ? origen() : null;
  const una = async (intento) => {
    const t0 = Date.now();
    const cuenta = { reintentos: 0 };
    const plan = planCache(body);
    let data;
    try { data = await postClaude(conCache(body, plan), opciones, cuenta); } catch (e) {
      cierraCache(plan, null);
      registra({ proveedor: 'claude', papel: papel(params.model), modelo: body.model, origen: de, intento, entrada: 0, salida: 0, cache_lectura: 0, cache_escritura: 0,
        fin: null, ms: Date.now() - t0, reintentos: cuenta.reintentos, error: `${e.status}: ${String(e.message).slice(0, 200)}` });
      throw e;
    }
    const r = deClaude(data, jsonLibre);
    const u = data.usage || {};
    cierraCache(plan, u);
    registra({ proveedor: 'claude', papel: papel(params.model), modelo: data.model || body.model, origen: de, intento,
      entrada: u.input_tokens || 0, salida: u.output_tokens || 0, cache_lectura: u.cache_read_input_tokens || 0, cache_escritura: u.cache_creation_input_tokens || 0,
      fin: data.stop_reason || null, json_ok: jsonLibre ? r._claude.json_ok : null, ms: Date.now() - t0, reintentos: cuenta.reintentos, error: null });
    return r;
  };
  let r = await una(1);
  if (jsonLibre && r._claude.json_ok === false && r.choices[0].finish_reason === 'stop') r = await una(2);   // un reintento si no llegó JSON
  return r;
}

// ─── Las dos puertas ─────────────────────────────────────────────────────────────────────────────────────
/** Reemplazo del cliente del SDK de OpenAI. Con openai delega en el SDK que se le pase (o en fetch). */
function crearCliente({ sdk } = {}) {
  return {
    chat: {
      completions: {
        create: async (params, opciones = {}) => {
          if (proveedor() === 'openai') {
            const p = conModelo(params, resolverModelo(params.model, 'openai'));
            if (!process.env.TRIGGUI_IA_REGISTRO) {
              if (sdk) return sdk.chat.completions.create(p, opciones);
              const res = await fetchOpenAI(p, opciones);
              if (!res.ok) { const t = await res.text().catch(() => ''); const e = new Error(`OpenAI ${res.status}: ${t.slice(0, 300)}`); e.status = res.status; throw e; }
              return res.json();
            }
            const t0 = Date.now(), de = origen();
            try {
              let data;
              if (sdk) data = await sdk.chat.completions.create(p, opciones);
              else {
                const res = await fetchOpenAI(p, opciones);
                if (!res.ok) { const t = await res.text().catch(() => ''); const e = new Error(`OpenAI ${res.status}: ${t.slice(0, 300)}`); e.status = res.status; throw e; }
                data = await res.json();
              }
              anotaOpenAI(params, data, t0, de);
              return data;
            } catch (e) { anotaOpenAI(params, null, t0, de, `${e.status}: ${String(e.message).slice(0, 200)}`); throw e; }
          }
          return llamaClaude(params, opciones);
        }
      }
    }
  };
}

function respuestaHecha(status, data) {
  const txt = JSON.stringify(data);
  return { ok: status >= 200 && status < 300, status, json: async () => data, text: async () => txt, headers: { get: () => null } };
}

/** Reemplazo de fetch("https://api.openai.com/v1/chat/completions", …) con el payload de siempre. */
async function chatCompat(payload, opciones = {}) {
  if (proveedor() === 'openai') {
    if (!process.env.TRIGGUI_IA_REGISTRO) return fetchOpenAI(conModelo(payload, resolverModelo(payload.model, 'openai')), opciones);
    const t0 = Date.now(), de = origen();
    const res = await fetchOpenAI(conModelo(payload, resolverModelo(payload.model, 'openai')), opciones);
    try { const d = await res.clone().json(); anotaOpenAI(payload, res.ok ? d : null, t0, de, res.ok ? null : `${res.status}`); } catch (e) { anotaOpenAI(payload, null, t0, de, `${res.status}`); }
    return res;
  }
  try {
    return respuestaHecha(200, await llamaClaude(payload, opciones));
  } catch (e) {
    return respuestaHecha(e.status || 500, { error: { message: e.message, type: 'claude_error' } });
  }
}

module.exports = {
  config, proveedor, hayLlave, nombreLlave, nombreProveedor, papel, resolverModelo, etiqueta,
  crearCliente, chatCompat,
  // para pruebas
  _interno: { limpiaEsquema, aClaude, deClaude, extraeJson, conModelo, origen, INSTRUCCION_JSON,
    planCache, cierraCache, conCache, claveCache, _cache, CACHE_VIGENCIA_MS, _reset: () => { _cfg = null; _cache.clear(); } }
};
