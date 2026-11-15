// Arnés de pruebas del cartero de Triggui con dobles de Apps Script (rotación del secreto de bajas, B20).
// Uso: node experiments/correo/prueba-bajas.js [RUTA_DEL_CARTERO]   (sin ruta, el de apps-script/)
'use strict';
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');

const path = require('path');
const ruta = process.argv[2] || path.join(__dirname, '..', '..', 'apps-script', 'Triggui Correos Semanales.js');
const codigo = fs.readFileSync(ruta, 'utf8');

function bytesFirmados(buf) { return Array.from(buf, b => (b > 127 ? b - 256 : b)); }

function nuevoMundo(opciones = {}) {
  const props = Object.assign({}, opciones.props || {});
  const cache = new Map();
  const correos = [];
  const bitacora = [];
  const encabezados = ['Nombre', 'Fecha', 'Correo', '', '', '', '', '', '', '', '', '', '', '', 'Estado', 'Envios', 'IDIOMA', 'IDIOMA_TS'];
  const filas = (opciones.filas || [
    ['Ana', '', 'ana@ejemplo.com', '', '', '', '', '', '', '', '', '', '', '', '', '', 'es', ''],
    ['Bob', '', 'bob@ejemplo.org, otro@ejemplo.org', '', '', '', '', '', '', '', '', '', '', '', '', '', 'en', ''],
    ['Cris', '', 'cris@ejemplo.com', '', '', '', '', '', '', '', '', '', '', '', 'UNSUBSCRIBED 2026-11-01 10:00', '', 'es', ''],
    ['Badir', '', 'badir@triggui.com', '', '', '', '', '', '', '', '', '', '', '', '', '', 'es', ''],
  ]).map(f => f.slice());
  const datos = [encabezados.slice()].concat(filas);
  const hoja = {
    getDataRange() { return { getValues: () => datos.map(f => f.slice()) }; },
    getLastColumn() { return Math.max(...datos.map(f => f.length)); },
    getRange(r, c, nr, nc) {
      if (nr !== undefined) {
        return { getValues: () => datos.slice(r - 1, r - 1 + nr).map(f => f.slice(c - 1, c - 1 + nc)) };
      }
      return {
        getValue: () => (datos[r - 1] && datos[r - 1][c - 1] !== undefined ? datos[r - 1][c - 1] : ''),
        setValue: v => { while (datos.length < r) datos.push([]); while (datos[r - 1].length < c) datos[r - 1].push(''); datos[r - 1][c - 1] = v; },
      };
    },
  };
  const salida = (s) => ({ contenido: s, tipo: 'texto', setMimeType(m) { this.tipo = m; return this; }, getContent() { return this.contenido; } });
  const ctx = {
    console,
    Logger: { log: m => bitacora.push(String(m)) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = String(v); },
      deleteProperty: k => { delete props[k]; },
    }) },
    CacheService: { getScriptCache: () => ({ get: k => (cache.has(k) ? cache.get(k) : null), put: (k, v) => { cache.set(k, v); } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Session: { getScriptTimeZone: () => 'America/Mexico_City' },
    MailApp: { getRemainingDailyQuota: () => (opciones.cuota === undefined ? 1000 : opciones.cuota) },
    GmailApp: { sendEmail: (para, asunto, texto, op) => correos.push({ para, asunto, texto, op }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => (opciones.sinHoja ? null : hoja) }) },
    ContentService: { createTextOutput: salida, MimeType: { JSON: 'json', TEXT: 'text' } },
    HtmlService: { createHtmlOutput: h => ({ html: h, setTitle() { return this; }, setXFrameOptionsMode() { return this; } }), XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' } },
    Utilities: {
      Charset: { UTF_8: 'UTF-8' },
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeHmacSha256Signature: (valor, llave) => bytesFirmados(crypto.createHmac('sha256', Buffer.from(llave, 'utf8')).update(Buffer.from(valor, 'utf8')).digest()),
      computeDigest: (alg, valor) => bytesFirmados(crypto.createHash('sha256').update(Buffer.from(valor, 'utf8')).digest()),
      base64EncodeWebSafe: bytes => Buffer.from(bytes.map(b => b & 0xff)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
      getUuid: () => crypto.randomUUID(),
      formatDate: (d, tz, fmt) => {
        const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).reduce((a, x) => (a[x.type] = x.value, a), {});
        return fmt.replace('yyyy', p.year).replace('MM', p.month).replace('dd', p.day).replace('HH', p.hour).replace('mm', p.minute);
      },
    },
    UrlFetchApp: { fetch: () => { throw new Error('sin red en la prueba'); } },
  };
  vm.createContext(ctx);
  vm.runInContext(codigo, ctx, { filename: 'cartero.js' });
  // El reenvío al cambiar de idioma se simula: su correo real necesita el contenido del horno.
  vm.runInContext('enviarTrigguiAUno = function () { return { ok: true }; };', ctx);
  return { ctx, props, cache, correos, bitacora, datos };
}

function pide(m, params) {
  const r = m.ctx.doGet({ parameter: params });
  if (r && r.html !== undefined) return { html: r.html };
  try { return JSON.parse(r.getContent()); } catch (e) { return { texto: r.getContent() }; }
}

let pruebas = 0;
function prueba(nombre, fn) { fn(); pruebas++; console.log('✔ ' + nombre); }

// ── Sin secreto: todo falla cerrado, con su nombre ─────────────────────────
prueba('sin secreto, la firma se detiene con el nombre de la propiedad', () => {
  const m = nuevoMundo();
  assert.throws(() => m.ctx.generarTokenUnsub('ana@ejemplo.com'), /BAJAS_SECRETO/);
  assert.deepStrictEqual(pide(m, { action: 'unsubscribe', email: 'ana@ejemplo.com', token: 'a'.repeat(32), format: 'json' }), { ok: false, error: 'interno' });
  assert.deepStrictEqual(pide(m, { action: 'lang', email: 'ana@ejemplo.com', token: 'a'.repeat(32), l: 'en', format: 'json' }), { ok: false, error: 'interno' });
  assert.deepStrictEqual(pide(m, { action: 'nuevo_enlace', email: 'ana@ejemplo.com' }), { ok: false, error: 'interno' });
  assert.deepStrictEqual(pide(m, { action: 'nuevo_enlace', email: 'nadie@ejemplo.com' }), { ok: false, error: 'interno' });
  assert.strictEqual(m.correos.length, 0);
  assert.strictEqual(m.datos[1][14], '');
});

prueba('un secreto corto no se acepta', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: 'corto' } });
  assert.throws(() => m.ctx.generarTokenUnsub('ana@ejemplo.com'), /BAJAS_SECRETO/);
});

// ── crearSecretoBajas ───────────────────────────────────────────────────────
prueba('crearSecretoBajas crea 96 hex, no lo muestra y no lo pisa', () => {
  const m = nuevoMundo();
  assert.strictEqual(m.ctx.crearSecretoBajas(), true);
  const s = m.props.BAJAS_SECRETO;
  assert.match(s, /^[0-9a-f]{96}$/);
  assert.ok(m.bitacora.every(l => !l.includes(s)));
  assert.strictEqual(m.ctx.crearSecretoBajas(), false);
  assert.strictEqual(m.props.BAJAS_SECRETO, s);
  const otro = nuevoMundo(); otro.ctx.crearSecretoBajas();
  assert.notStrictEqual(otro.props.BAJAS_SECRETO, s);
});

// ── La firma ────────────────────────────────────────────────────────────────
const SECRETO = 'f'.repeat(40) + '0123456789abcdef0123456789abcdef';
function firmaEsperada(correo) {
  return crypto.createHmac('sha256', SECRETO).update(correo.trim().toLowerCase()).digest('hex').slice(0, 32);
}
prueba('la firma es el HMAC-SHA256 del correo normalizado, 32 hex', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  for (const c of ['ana@ejemplo.com', ' Ana@Correo.MX ', 'bob@ejemplo.org', 'ñandú@ejemplo.com']) {
    assert.strictEqual(m.ctx.generarTokenUnsub(c), firmaEsperada(c));
  }
});
prueba('probarSecretoBajas: todo verdadero', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  const r = m.ctx.probarSecretoBajas();
  assert.ok(Object.values(r).every(v => v === true), JSON.stringify(r));
});
prueba('validarTokenUnsub rechaza formas raras y la firma vieja', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  const t = firmaEsperada('ana@ejemplo.com');
  const vieja = crypto.createHash('sha256').update('ana@ejemplo.com:' + SECRETO).digest('hex').slice(0, 16);
  for (const malo of ['', null, undefined, t.toUpperCase(), t + '0', t.slice(1), vieja, 'z'.repeat(32), { length: 32 }, t.slice(0, 31) + ' ']) {
    assert.strictEqual(m.ctx.validarTokenUnsub('ana@ejemplo.com', malo), false, String(malo));
  }
  assert.strictEqual(m.ctx.validarTokenUnsub('ana@ejemplo.com', t), true);
  assert.strictEqual(m.ctx.validarTokenUnsub('', t), false);
});

// ── La baja ─────────────────────────────────────────────────────────────────
prueba('baja con firma válida: queda y dice el nombre', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  const r = pide(m, { action: 'unsubscribe', email: 'ana@ejemplo.com', token: firmaEsperada('ana@ejemplo.com'), format: 'json' });
  assert.deepStrictEqual(r, { ok: true, first_name: 'Ana' });
  assert.match(m.datos[1][14], /^UNSUBSCRIBED \d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
});
prueba('baja con firma vieja o falsa: no toca la hoja y lo dice', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  const vieja = crypto.createHash('sha256').update('ana@ejemplo.com:' + SECRETO).digest('hex').slice(0, 16);
  for (const t of [vieja, '0'.repeat(32), firmaEsperada('bob@ejemplo.org')]) {
    assert.deepStrictEqual(pide(m, { action: 'unsubscribe', email: 'ana@ejemplo.com', token: t, format: 'json' }), { ok: false, error: 'token' });
  }
  assert.strictEqual(m.datos[1][14], '');
  assert.ok(m.bitacora.every(l => !l.includes('ana@ejemplo.com')), 'la bitácora no debe guardar el correo en una firma inválida');
});
prueba('baja sin datos: «parametros»; sin hoja: «interno»', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  assert.deepStrictEqual(pide(m, { action: 'unsubscribe', format: 'json' }), { ok: false, error: 'parametros' });
  assert.deepStrictEqual(pide(m, { action: 'unsubscribe', email: 'ana@ejemplo.com', format: 'json' }), { ok: false, error: 'parametros' });
  const s = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO }, sinHoja: true });
  assert.deepStrictEqual(pide(s, { action: 'unsubscribe', email: 'ana@ejemplo.com', token: firmaEsperada('ana@ejemplo.com'), format: 'json' }), { ok: false, error: 'interno' });
});
prueba('baja con firma válida de un correo que no está: listo, sin nombre', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  assert.deepStrictEqual(pide(m, { action: 'unsubscribe', email: 'nadie@ejemplo.com', token: firmaEsperada('nadie@ejemplo.com'), format: 'json' }), { ok: true, first_name: '' });
});
prueba('ruta HTML vieja: con firma inválida dice que ya no sirve y manda a triggui.com', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  const r = pide(m, { action: 'unsubscribe', email: 'a"<b>@ejemplo.com', token: 'x"y' });
  assert.ok(r.html.includes('Este enlace ya no sirve'));
  assert.ok(r.html.includes('href="https://triggui.com/entendido?email=a%22%3Cb%3E%40ejemplo.com&amp;token=x%22y"'), r.html.slice(-400));
  assert.ok(!r.html.includes('<b>'));
  const ok = pide(m, { action: 'unsubscribe', email: 'ana@ejemplo.com', token: firmaEsperada('ana@ejemplo.com') });
  assert.ok(ok.html && !ok.html.includes('ya no sirve'));
});

// ── El idioma ───────────────────────────────────────────────────────────────
prueba('idioma: firma válida al mismo idioma no cambia ni reenvía; firma falsa se rechaza', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  const r = pide(m, { action: 'lang', email: 'ana@ejemplo.com', token: firmaEsperada('ana@ejemplo.com'), l: 'es', format: 'json' });
  assert.strictEqual(r.ok, true); assert.strictEqual(r.changed, false); assert.strictEqual(r.resent, false);
  const r2 = pide(m, { action: 'lang', email: 'ana@ejemplo.com', token: firmaEsperada('ana@ejemplo.com'), l: 'en', format: 'json' });
  assert.strictEqual(r2.ok, true); assert.strictEqual(r2.changed, true); assert.strictEqual(r2.resent, true);
  assert.deepStrictEqual(pide(m, { action: 'lang', email: 'ana@ejemplo.com', token: '0'.repeat(32), l: 'es', format: 'json' }), { ok: false, error: 'token' });
  assert.ok(String(pide(m, { action: 'lang', email: 'ana@ejemplo.com', token: '0'.repeat(32), l: 'es' }).texto).includes('ya no sirve'));
});

// ── El enlace nuevo (B20) ───────────────────────────────────────────────────
prueba('enlace nuevo: llega a quien está suscrito, en su idioma, y su liga sirve', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  assert.deepStrictEqual(pide(m, { action: 'nuevo_enlace', email: ' Bob@Ejemplo.org ' }), { ok: true });
  assert.strictEqual(m.correos.length, 1);
  const c = m.correos[0];
  assert.strictEqual(c.para, 'bob@ejemplo.org');
  assert.strictEqual(c.asunto, 'Your link to stop receiving Triggui');
  assert.strictEqual(c.op.name, 'Triggui');
  const liga = c.texto.match(/https:\/\/triggui\.com\/entendido\?email=[^\s]+/)[0];
  assert.ok(c.op.htmlBody.includes(liga.replace(/&/g, '&amp;')));
  const u = new URL(liga);
  assert.deepStrictEqual(pide(m, { action: 'unsubscribe', email: u.searchParams.get('email'), token: u.searchParams.get('token'), format: 'json' }), { ok: true, first_name: 'Bob' });
  assert.match(m.datos[2][14], /^UNSUBSCRIBED /);
  const es = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  pide(es, { action: 'nuevo_enlace', email: 'ana@ejemplo.com' });
  assert.strictEqual(es.correos[0].asunto, 'Tu enlace para dejar de recibir Triggui');
});
prueba('enlace nuevo: una vez cada 6 horas por correo, y responde igual', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  assert.deepStrictEqual(pide(m, { action: 'nuevo_enlace', email: 'ana@ejemplo.com' }), { ok: true });
  assert.deepStrictEqual(pide(m, { action: 'nuevo_enlace', email: 'ANA@ejemplo.com' }), { ok: true });
  assert.strictEqual(m.correos.length, 1);
});
prueba('enlace nuevo: a quien no está o ya se dio de baja no se le manda nada, y responde igual', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  assert.deepStrictEqual(pide(m, { action: 'nuevo_enlace', email: 'nadie@ejemplo.com' }), { ok: true });
  assert.deepStrictEqual(pide(m, { action: 'nuevo_enlace', email: 'cris@ejemplo.com' }), { ok: true });
  assert.strictEqual(m.correos.length, 0);
});
prueba('enlace nuevo: correo inválido, tope del día y cuota baja se dicen', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  for (const e of ['', 'sin-arroba', 'a@b', 'a b@c.com', 'a@ejemplo.com,c@ejemplo.com', 'x'.repeat(250) + '@ejemplo.com']) {
    assert.deepStrictEqual(pide(m, { action: 'nuevo_enlace', email: e }), { ok: false, error: 'correo' }, e);
  }
  const hoy = m.ctx.Utilities.formatDate(new Date(), 'America/Mexico_City', 'yyyy-MM-dd');
  m.props.NUEVO_ENLACE_DIA = hoy + ':100';
  assert.deepStrictEqual(pide(m, { action: 'nuevo_enlace', email: 'ana@ejemplo.com' }), { ok: false, error: 'tope' });
  // con tope, también «tope» a quien ya recibió enlace en las últimas 6 horas (no revela pertenencia)
  const r = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  pide(r, { action: 'nuevo_enlace', email: 'ana@ejemplo.com' });
  r.props.NUEVO_ENLACE_DIA = hoy + ':100';
  for (const e of ['ana@ejemplo.com', 'nadie@ejemplo.com']) assert.deepStrictEqual(pide(r, { action: 'nuevo_enlace', email: e }), { ok: false, error: 'tope' }, e);
  m.props.NUEVO_ENLACE_DIA = '2000-01-01:100';
  assert.deepStrictEqual(pide(m, { action: 'nuevo_enlace', email: 'ana@ejemplo.com' }), { ok: true });
  assert.strictEqual(m.props.NUEVO_ENLACE_DIA, hoy + ':1');
  const q = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO }, cuota: 10 });
  assert.deepStrictEqual(pide(q, { action: 'nuevo_enlace', email: 'ana@ejemplo.com' }), { ok: false, error: 'tope' });
  assert.strictEqual(q.correos.length, 0);
});

prueba('enlace nuevo: sin secreto y con cuota baja contesta igual esté o no el correo', () => {
  const sin = nuevoMundo();
  for (const e of ['ana@ejemplo.com', 'nadie@ejemplo.com']) assert.deepStrictEqual(pide(sin, { action: 'nuevo_enlace', email: e }), { ok: false, error: 'interno' }, e);
  const q = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO }, cuota: 10 });
  for (const e of ['ana@ejemplo.com', 'nadie@ejemplo.com', 'cris@ejemplo.com']) assert.deepStrictEqual(pide(q, { action: 'nuevo_enlace', email: e }), { ok: false, error: 'tope' }, e);
  assert.strictEqual(sin.correos.length + q.correos.length, 0);
});

// ── En vivo (simulado: la red se dirige al doGet de este mismo mundo) ───────
prueba('probarBajasEnVivo: firma nueva aceptada, falsa rechazada, sin cambiar nada', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  m.ctx.UrlFetchApp = { fetch: (url) => { const u = new URL(url); const p = Object.fromEntries(u.searchParams); return { getContentText: () => m.ctx.doGet({ parameter: p }).getContent() }; } };
  const antes = JSON.stringify(m.datos);
  const r = m.ctx.probarBajasEnVivo();
  assert.ok(Object.values(r).every(v => v === true), JSON.stringify(r));
  assert.strictEqual(JSON.stringify(m.datos), antes);
  assert.strictEqual(m.correos.length, 0);
});

// ── Nada secreto en la bitácora ─────────────────────────────────────────────
prueba('la bitácora nunca trae el secreto ni una firma', () => {
  const m = nuevoMundo({ props: { BAJAS_SECRETO: SECRETO } });
  m.ctx.probarSecretoBajas();
  pide(m, { action: 'unsubscribe', email: 'ana@ejemplo.com', token: firmaEsperada('ana@ejemplo.com'), format: 'json' });
  pide(m, { action: 'nuevo_enlace', email: 'bob@ejemplo.org' });
  const todo = m.bitacora.join('\n');
  assert.ok(!todo.includes(SECRETO));
  assert.ok(!todo.includes(firmaEsperada('ana@ejemplo.com')) && !todo.includes(firmaEsperada('bob@ejemplo.org')));
});

console.log(`\n${pruebas} pruebas en verde`);
