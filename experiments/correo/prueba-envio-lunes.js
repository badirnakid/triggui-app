// Pruebas del envío del lunes del cartero de Triggui (enviarTrigguiLunes) con dobles de Apps Script (C476 y el
// recuadro de WhatsApp del 16 de noviembre de 2026). Sin red y sin Google.
// Uso: node experiments/correo/prueba-envio-lunes.js [RUTA_DEL_CARTERO]   (sin ruta, el de apps-script/)
'use strict';
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');
const path = require('path');

const ruta = process.argv[2] || path.join(__dirname, '..', '..', 'apps-script', 'Triggui Correos Semanales.js');
const codigo = fs.readFileSync(ruta, 'utf8');

function bytesFirmados(buf) { return Array.from(buf, b => (b > 127 ? b - 256 : b)); }
function haceDias(n) { const d = new Date(Date.now() - n * 86400000); return d.toISOString().slice(0, 10); }

const LIBRO = { titulo: 'Libro nuevo', autor: 'Autora', _edicion_numero: 113, tarjeta: { parrafoBot: '', style: { accent: '#3355AA' } } };
const ENC = ['Nombre', 'Apellido', 'Correo', 'Teléfono', '', '', '', '', '', 'Último libro', '', '', 'Fecha último', '', 'Estado', 'Envios', 'IDIOMA', 'IDIOMA_TS'];

// Una fila: nombre, correo(s), estado, último libro (col J), días desde el último envío (col M y col P).
function fila(nombre, correo, estado, ultimo, diasUltimo) {
  const f = new Array(18).fill('');
  f[0] = nombre; f[2] = correo; f[14] = estado || ''; f[16] = 'es';
  if (ultimo) {
    f[9] = ultimo;
    const d = new Date(Date.now() - (diasUltimo || 10) * 86400000);
    f[12] = d; f[15] = d.toISOString();
  }
  return f;
}

function nuevoMundo(op) {
  op = op || {};
  const props = { BAJAS_SECRETO: 'x'.repeat(96) };
  const cache = new Map();
  const enviados = [];      // GmailApp.sendEmail: el envío del lunes
  const avisos = [];        // MailApp.sendEmail: los avisos a Badir
  const intentos = [];
  const bitacora = [];
  let cuota = op.cuota === undefined ? 1000 : op.cuota;
  const datos = [ENC.slice()].concat((op.filas || []).map(f => f.slice()));
  const hoja = {
    getDataRange() { return { getValues: () => datos.map(f => f.slice()) }; },
    getLastRow() { return datos.length; },
    getLastColumn() { return Math.max(...datos.map(f => f.length)); },
    deleteRow(r) { datos.splice(r - 1, 1); },
    getRange(r, c, nr, nc) {
      if (nr !== undefined) {
        return { getValues: () => datos.slice(r - 1, r - 1 + nr).map(f => { const o = []; for (let j = 0; j < nc; j++) o.push(f[c - 1 + j] === undefined ? '' : f[c - 1 + j]); return o; }) };
      }
      return {
        getValue: () => (datos[r - 1] && datos[r - 1][c - 1] !== undefined ? datos[r - 1][c - 1] : ''),
        setValue: v => { while (datos.length < r) datos.push([]); while (datos[r - 1].length < c) datos[r - 1].push(''); datos[r - 1][c - 1] = v; },
      };
    },
  };
  const ctx = {
    console,
    Logger: { log: m => bitacora.push(String(m)) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = String(v); },
      deleteProperty: k => { delete props[k]; },
    }) },
    CacheService: { getScriptCache: () => ({ get: k => (cache.has(k) ? cache.get(k) : null), put: (k, v) => { cache.set(k, v); }, remove: k => cache.delete(k) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock() { return true; }, releaseLock() {} }) },
    Session: { getScriptTimeZone: () => 'UTC' },
    MailApp: {
      getRemainingDailyQuota: () => cuota,
      sendEmail: (para, asunto, texto) => { avisos.push({ para, asunto, texto }); cuota--; },
    },
    GmailApp: {
      sendEmail: (para, asunto, texto, opciones) => {
        intentos.push(para);
        if (op.fallaEn && intentos.length >= op.fallaEn) {
          if (op.cuotaCeroAlFallar) cuota = 0;
          throw new Error(op.mensajeFalla || 'Service invoked too many times for one day: email.');
        }
        enviados.push({ para, asunto, texto, html: opciones && opciones.htmlBody });
        cuota -= String(para).split(',').length;
      },
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => (op.sinHoja ? null : hoja) }) },
    Utilities: {
      Charset: { UTF_8: 'UTF-8' },
      DigestAlgorithm: { SHA_256: 'sha256' },
      computeHmacSha256Signature: (valor, llave) => bytesFirmados(crypto.createHmac('sha256', Buffer.from(llave, 'utf8')).update(Buffer.from(valor, 'utf8')).digest()),
      computeDigest: (alg, valor) => bytesFirmados(crypto.createHash('sha256').update(Buffer.from(valor, 'utf8')).digest()),
      base64EncodeWebSafe: bytes => Buffer.from(bytes.map(b => b & 0xff)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
      getUuid: () => crypto.randomUUID(),
      sleep: () => {},
      formatDate: (d, tz, fmt) => {
        const iso = new Date(d).toISOString();
        return fmt.replace('yyyy', iso.slice(0, 4)).replace('MM', iso.slice(5, 7)).replace('dd', iso.slice(8, 10)).replace('HH', iso.slice(11, 13)).replace('mm', iso.slice(14, 16));
      },
    },
    UrlFetchApp: { fetch: () => { throw new Error('sin red en la prueba'); } },
  };
  vm.createContext(ctx);
  vm.runInContext(codigo, ctx, { filename: 'cartero.js' });
  // La preparación del correo necesita el contenido del horno: se simula. Las piezas que dependen del libro, también.
  ctx.__prep = op.prep || { ok: true, libro: LIBRO, subject: 'Edición #113 · Prueba',
    finalHTML: '<html><body>{{GREETING_BLOCK}}{{TRIAL_BANNER_TOP}}{{WHATSAPP_PROMO_TOP}}<p>libro</p>{{UNSUB_LINK}}</body></html>',
    finalPlain: '{{GREETING_PLAIN}}{{TRIAL_BANNER_TOP_PLAIN}}{{WHATSAPP_PROMO_TOP_PLAIN}}libro {{UNSUB_LINK}}', inlineImages: {} };
  vm.runInContext([
    'prepararEmailParaEnvio = function () { return __prep; };',
    'generarMediosTopHTML = function () { return ""; };',
    'generarMediosTopPlain = function () { return ""; };',
    'Math.random = function () { return ' + (op.azar === undefined ? 0.9 : op.azar) + '; };',
  ].join('\n'), ctx);
  return { ctx, datos, enviados, avisos, intentos, bitacora, cuota: () => cuota };
}

let pruebas = 0;
function prueba(nombre, fn) {
  try { fn(); pruebas++; console.log('✔ ' + nombre); }
  catch (e) { console.log('✘ ' + nombre + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
}

const PRUEBA = 'SUBSCRIBED_TRIAL ' + haceDias(10) + ' 09:00';

// ── C476, punto 4: la prueba va justo después de los miembros, antes de la base vieja ─────────────────────
prueba('la prueba de 28 días va con los consentidos: después de los miembros y antes de la base vieja', () => {
  const m = nuevoMundo({ cuota: 23, filas: [   // 23 de cuota y 20 de reserva: caben 3
    fila('Ana', 'ana@ejemplo.com', ''),
    fila('Beto', 'beto@ejemplo.com', ''),
    fila('Pia', 'pia@ejemplo.com', PRUEBA, 'Libro viejo', 10),
    fila('Sol', 'sol@ejemplo.com', 'SUBSCRIBED_MEMBER 2026-11-01', 'Libro viejo', 7),
  ] });
  m.ctx.enviarTrigguiLunes();
  assert.deepStrictEqual(m.enviados.map(e => e.para), ['sol@ejemplo.com', 'pia@ejemplo.com', 'ana@ejemplo.com']);
  assert.ok(m.bitacora.some(l => /Quedan 1 para la siguiente corrida/.test(l)), m.bitacora.join('\n'));
  assert.ok(!m.bitacora.some(l => /Base completa cubierta/.test(l)));
});

prueba('la prueba vencida no recibe y queda marcada como vencida', () => {
  const m = nuevoMundo({ filas: [fila('Vic', 'vic@ejemplo.com', 'SUBSCRIBED_TRIAL ' + haceDias(30) + ' 09:00', 'Libro viejo', 20)] });
  m.ctx.enviarTrigguiLunes();
  assert.strictEqual(m.enviados.length, 0);
  assert.ok(/^SUBSCRIBED_EXPIRED /.test(m.datos[1][14]), m.datos[1][14]);
});

prueba('quien ya recibió el libro de la semana no lo recibe otra vez (la corrida diaria no repite)', () => {
  const m = nuevoMundo({ filas: [fila('Sol', 'sol@ejemplo.com', 'SUBSCRIBED_MEMBER 2026-11-01', 'Libro nuevo', 1)] });
  m.ctx.enviarTrigguiLunes();
  assert.strictEqual(m.enviados.length, 0);
});

// ── C476, punto 2: la cuota se mide por destinatarios ─────────────────────────────────────────────────────
prueba('la cuota se cuenta por destinatarios: una fila con dos correos gasta dos', () => {
  const m = nuevoMundo({ cuota: 22, filas: [   // caben 2
    fila('Doble', 'x@ejemplo.com, y@ejemplo.com', 'SUBSCRIBED_MEMBER 2026-11-01', 'Libro viejo', 7),
    fila('Uno', 'uno@ejemplo.com', ''),
  ] });
  m.ctx.enviarTrigguiLunes();
  assert.deepStrictEqual(m.enviados.map(e => e.para), ['x@ejemplo.com,y@ejemplo.com']);
  const m2 = nuevoMundo({ cuota: 21, filas: [   // cabe 1: la fila doble espera y la sencilla sale
    fila('Doble', 'x@ejemplo.com, y@ejemplo.com', 'SUBSCRIBED_MEMBER 2026-11-01', 'Libro viejo', 7),
    fila('Uno', 'uno@ejemplo.com', ''),
  ] });
  m2.ctx.enviarTrigguiLunes();
  assert.deepStrictEqual(m2.enviados.map(e => e.para), ['uno@ejemplo.com']);
  assert.ok(m2.bitacora.some(l => /Quedan 1 para la siguiente corrida/.test(l)));
});

// ── C476, punto 1: al primer error de cuota se detiene ────────────────────────────────────────────────────
prueba('al primer error de cuota se detiene, no sigue intentando, y lo demás queda para la siguiente corrida', () => {
  const filas = [1, 2, 3, 4, 5].map(n => fila('B' + n, 'b' + n + '@ejemplo.com', ''));
  const m = nuevoMundo({ filas, fallaEn: 3 });
  m.ctx.enviarTrigguiLunes();
  assert.strictEqual(m.enviados.length, 2);
  assert.strictEqual(m.intentos.length, 3);
  assert.ok(m.bitacora.some(l => /Quedan 3 para la siguiente corrida: la cuota de Google se acabó/.test(l)), m.bitacora.join('\n'));
});

prueba('también se detiene si el error viene en otro idioma pero la cuota ya está en cero', () => {
  const filas = [1, 2, 3, 4].map(n => fila('B' + n, 'b' + n + '@ejemplo.com', ''));
  const m = nuevoMundo({ filas, fallaEn: 2, mensajeFalla: 'Límite excedido', cuotaCeroAlFallar: true });
  m.ctx.enviarTrigguiLunes();
  assert.strictEqual(m.intentos.length, 2);
});

prueba('un error que no es de cuota no detiene a los demás', () => {
  const filas = [1, 2, 3].map(n => fila('B' + n, 'b' + n + '@ejemplo.com', ''));
  const m = nuevoMundo({ filas, fallaEn: 99 });
  vm.runInContext('(function(){ var o = GmailApp.sendEmail; var n = 0; GmailApp.sendEmail = function (p, a, t, x) { n++; if (n === 1) throw new Error("Invalid email: b1@ejemplo.com"); return o(p, a, t, x); }; })();', m.ctx);
  m.ctx.enviarTrigguiLunes();
  assert.deepStrictEqual(m.enviados.map(e => e.para), ['b2@ejemplo.com', 'b3@ejemplo.com']);
});

// ── C476, punto 5: si no puede armarse, avisa ─────────────────────────────────────────────────────────────
prueba('si el correo no puede armarse, no sale a nadie y le avisa a Badir', () => {
  const m = nuevoMundo({ filas: [fila('Ana', 'ana@ejemplo.com', '')], prep: { ok: false, reason: 'HTTP 500 al leer contenido_manual.json' } });
  m.ctx.enviarTrigguiLunes();
  assert.strictEqual(m.enviados.length, 0);
  assert.strictEqual(m.avisos.length, 1);
  assert.strictEqual(m.avisos[0].para, 'badir@triggui.com');
  assert.ok(/no salió/.test(m.avisos[0].asunto) && /HTTP 500 al leer contenido_manual\.json/.test(m.avisos[0].texto));
});

prueba('si falta la hoja, también avisa', () => {
  const m = nuevoMundo({ sinHoja: true });
  m.ctx.enviarTrigguiLunes();
  assert.strictEqual(m.avisos.length, 1);
  assert.ok(/No existe la hoja/.test(m.avisos[0].texto));
});

// ── El recuadro de WhatsApp: «si quieres recibirlo por WhatsApp, paga aquí» ──────────────────────────────
prueba('el recuadro de WhatsApp lleva el botón de $149 para la prueba, los gratis y los de $129, y no aparece a los de $149', () => {
  const m = nuevoMundo();
  const L149 = m.ctx.STRIPE_LINK_PREMIUM_149 || vm.runInContext('STRIPE_LINK_PREMIUM_149', m.ctx);
  const html = estado => m.ctx.generarWhatsAppPromoTopHTML(600, fila('X', 'x@ejemplo.com', estado));
  const plano = estado => m.ctx.whatsappPromoTopPlain_(fila('X', 'x@ejemplo.com', estado));
  assert.strictEqual(html('SUBSCRIBED_MEMBER 2026-11-01'), '');
  assert.strictEqual(plano('SUBSCRIBED_MEMBER 2026-11-01'), '');
  for (const e of [PRUEBA, 'SUBSCRIBED_FREE 2026-11-01', 'SUBSCRIBED_MEMBER_129 2026-11-01', 'RESUSCRITO 2026-11-01']) {
    assert.ok(html(e).includes(L149) && /Recíbelo en tu WhatsApp por \$149 al mes/.test(html(e)), e);
    assert.ok(plano(e).includes(L149), e);
  }
  assert.ok(/Recibe también Triggui en tu WhatsApp/.test(html('')) && !html('').includes(L149));
  assert.ok(!plano('').includes(L149));
});

prueba('en inglés, el botón sale en inglés', () => {
  const m = nuevoMundo();
  vm.runInContext('IDIOMA_ENVIO_ACTUAL = "en";', m.ctx);
  const h = m.ctx.generarWhatsAppPromoTopHTML(600, fila('X', 'x@ejemplo.com', PRUEBA));
  assert.ok(/Get it on your WhatsApp for MXN \$149\/month/.test(h), h);
  assert.ok(!/Recíbelo/.test(h));
});

prueba('en el envío del lunes, la prueba ve el botón y el miembro de $149 no ve el recuadro', () => {
  const m = nuevoMundo({ azar: 0.1, filas: [
    fila('Pia', 'pia@ejemplo.com', PRUEBA, 'Libro viejo', 10),
    fila('Sol', 'sol@ejemplo.com', 'SUBSCRIBED_MEMBER 2026-11-01', 'Libro viejo', 7),
  ] });
  m.ctx.enviarTrigguiLunes();
  const L149 = vm.runInContext('STRIPE_LINK_PREMIUM_149', m.ctx);
  const pia = m.enviados.find(e => e.para === 'pia@ejemplo.com');
  const sol = m.enviados.find(e => e.para === 'sol@ejemplo.com');
  assert.ok(pia.html.includes(L149) && pia.texto.includes(L149));
  assert.ok(!/Recibe también Triggui en tu WhatsApp/.test(sol.html) && !/RECIBE TAMBIÉN TRIGGUI/.test(sol.texto));
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(pia.html + pia.texto + sol.html + sol.texto));
});

console.log(pruebas + ' pruebas en verde');
