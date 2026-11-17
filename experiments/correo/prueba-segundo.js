// Pruebas del segundo correo de la semana (C477, paso 3) y de la historia de libros (columna LIBROS) del cartero.
// Con dobles de Apps Script, sin red y sin Google, y con el reloj fijo: hoy es el jueves 19 de noviembre de 2026.
// Uso: node experiments/correo/prueba-segundo.js
'use strict';
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'apps-script');
const CARTERO = fs.readFileSync(path.join(DIR, 'Triggui Correos Semanales.js'), 'utf8');
const WHATSAPP = fs.readFileSync(path.join(DIR, 'Triggui WhatsApp.js'), 'utf8');
const RAW = 'https://raw.githubusercontent.com/badirnakid/triggui-content/main/';
const URL_MANUAL = RAW + 'contenido_manual.json', URL_CATALOGO = RAW + 'contenido.json', URL_KIDS = RAW + 'contenido_kids.json';

const JUEVES = Date.UTC(2026, 10, 19, 15, 0, 0);   // 19 de noviembre de 2026; la zona del guion en la prueba es UTC
const LUNES = '2026-11-16T13:00:00.000Z';            // el envío de este lunes
function bytesFirmados(buf) { return Array.from(buf, b => (b > 127 ? b - 256 : b)); }

const T = { titulo: 'Tarjeta', subtitulo: 'Sub', parrafoTop: 'Arriba.', parrafoBot: 'Abajo.', style: { accent: '#3355AA' } };
const libro = (titulo, extra) => Object.assign({ titulo, autor: 'Autora', tarjeta: T, portada: 'https://portadas.ejemplo.com/' + encodeURIComponent(titulo) + '.jpg' }, extra || {});
// Las ediciones de adultos, la más nueva primero, con su fecha de publicación.
const CUR = libro('Edición actual', { _slug: 'edicion-actual', _edicion_numero: 112, _manual_generated_at: '2026-11-14T01:00:00Z' });
const MANUAL = [CUR,
  libro('Edición 111', { _slug: 'e111', _edicion_numero: 111, _manual_generated_at: '2026-11-07T01:00:00Z' }),
  libro('Edición 110', { _slug: 'e110', _edicion_numero: 110, _manual_generated_at: '2026-11-03T01:00:00Z' }),
  libro('Edición 100', { _slug: 'e100', _edicion_numero: 100, _manual_generated_at: '2026-09-01T01:00:00Z' }),
  libro('Edición 90', { _slug: 'e90', _edicion_numero: 90, _manual_generated_at: '2026-07-01T01:00:00Z' }),
  libro('Edición 80', { _edicion_numero: 80, _manual: true, _manual_generated_at: '2026-06-10T01:00:00Z' })];   // sin slug: sin página
const CATALOGO = [
  libro('Catálogo A', { _slug: 'cat-a' }),
  libro('Catálogo B'),                                                        // nunca fue edición y no tiene página
  libro('Edición 111', { _slug: 'e111', _edicion_numero: 111 }),              // es edición: no es del catálogo
  libro('Edición 100'),                                                       // mismo título que una edición: fuera
  libro('Sin tarjeta', { tarjeta: { titulo: 'x' } })];                        // inválido para el correo: fuera
const KIDS = [libro('Kids actual', { _slug: 'kids-actual', _edicion_numero: 113 }), libro('Cuento Uno', { _slug: 'cuento-uno' }), libro('Cuento Dos')];

const ENC = ['Nombre', 'Apellido', 'Correo', 'Teléfono', 'Source', 'Fecha', '', '', '', 'Último libro', '', '', 'Fecha último', 'Edición', 'Estado', 'Envios', 'IDIOMA', 'WhatsApp', 'PERFIL', 'LIBROS'];
function fila(nombre, correo, op) {
  op = op || {};
  const f = new Array(20).fill('');
  f[0] = nombre; f[2] = correo; f[4] = 'triggui_god_v18k_form'; f[5] = op.alta ? new Date(op.alta) : '';
  f[9] = op.j === undefined ? CUR.titulo : op.j; f[13] = op.n || '#112'; f[14] = op.estado || '';
  f[15] = (op.envios || [LUNES]).join(','); f[16] = op.idioma || 'es'; f[17] = op.whatsapp || ''; f[18] = op.perfil || ''; f[19] = op.libros || '';
  return f;
}
const MIEMBRO = 'SUBSCRIBED_MEMBER 2026-10-01 (pagó en Stripe)';

function nuevoMundo(op) {
  op = op || {};
  const props = { BAJAS_SECRETO: 'x'.repeat(96) };
  const enviados = [], avisos = [], bitacora = [], pedidas = [], preparados = [];
  let cuota = op.cuota === undefined ? 1000 : op.cuota;
  const datos = [ENC.slice()].concat((op.filas || []).map(f => f.slice()));
  const hoja = {
    getDataRange() { return { getValues: () => datos.map(f => f.slice()) }; },
    getLastRow() { return datos.length; },
    getLastColumn() { return Math.max(...datos.map(f => f.length)); },
    deleteRow(r) { datos.splice(r - 1, 1); },
    appendRow(f) { datos.push(f.slice()); },
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
  const catalogos = { [URL_MANUAL]: op.manual || MANUAL, [URL_CATALOGO]: op.catalogo || CATALOGO, [URL_KIDS]: op.kids || KIDS };
  const activadores = [];
  const ctx = {
    console,
    Logger: { log: m => bitacora.push(String(m)) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in props ? props[k] : null), setProperty: (k, v) => { props[k] = String(v); }, deleteProperty: k => { delete props[k]; } }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock() { return true; }, releaseLock() {} }) },
    Session: { getScriptTimeZone: () => 'UTC' },
    MailApp: { getRemainingDailyQuota: () => cuota, sendEmail: (para, asunto, texto) => { avisos.push({ para, asunto, texto }); cuota--; } },
    GmailApp: {
      sendEmail: (para, asunto, texto, opciones) => {
        enviados.push({ para, asunto, texto, html: opciones && opciones.htmlBody });
        cuota -= String(para).split(',').length;
      },
    },
    DriveApp: { getFilesByName: () => ({ hasNext: () => false }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => hoja }) },
    ScriptApp: {
      WeekDay: { MONDAY: 'MONDAY', THURSDAY: 'THURSDAY' },
      getProjectTriggers: () => activadores.slice(),
      deleteTrigger: t => activadores.splice(activadores.indexOf(t), 1),
      newTrigger: f => { const t = { f, getHandlerFunction: () => f }; const c = { timeBased: () => c, onWeekDay: d => { t.dia = d; return c; }, atHour: h => { t.hora = h; return c; }, create: () => { activadores.push(t); return t; } }; return c; },
    },
    Utilities: {
      Charset: { UTF_8: 'UTF-8' },
      computeHmacSha256Signature: (valor, llave) => bytesFirmados(crypto.createHmac('sha256', Buffer.from(llave, 'utf8')).update(Buffer.from(valor, 'utf8')).digest()),
      getUuid: () => crypto.randomUUID(),
      sleep: () => {},
      formatDate: (d, tz, fmt) => {
        const iso = new Date(d).toISOString();
        return fmt.replace('yyyy', iso.slice(0, 4)).replace('MM', iso.slice(5, 7)).replace('dd', iso.slice(8, 10)).replace('HH', iso.slice(11, 13)).replace('mm', iso.slice(14, 16));
      },
    },
    UrlFetchApp: {
      fetch: url => {
        pedidas.push(url);
        if (catalogos[url]) {
          if (op.fallaCatalogo === url) return { getResponseCode: () => 500, getContentText: () => '' };
          return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ libros: catalogos[url] }) };
        }
        if (/^https:\/\/app\.triggui\.com\//.test(url)) return { getResponseCode: () => ((op.sinPagina || []).some(s => s === '*' || url.indexOf('/' + s + '/') !== -1) ? 404 : 200) };
        if (/^https:\/\/portadas\.ejemplo\.com\//.test(url)) return { getResponseCode: () => 404 };   // la portada va por su liga, sin incrustar
        throw new Error('URL inesperada: ' + url);
      },
    },
  };
  vm.createContext(ctx);
  vm.runInContext(CARTERO, ctx, { filename: 'cartero.js' });
  vm.runInContext(WHATSAPP, ctx, { filename: 'whatsapp.js' });
  // El reloj fijo (op.hoy o el jueves), con el mismo Date de siempre para todo lo demás.
  vm.runInContext('(function () { var D = Date, FIJO = ' + (op.hoy || JUEVES) + '; function F() { return arguments.length ? new (Function.prototype.bind.apply(D, [null].concat([].slice.call(arguments))))() : new D(FIJO); }' +
    ' F.prototype = D.prototype; F.now = function () { return FIJO; }; F.UTC = D.UTC; F.parse = D.parse; Date = F; })();', ctx);
  if (!op.prepReal) {
    ctx.__anotar = (opciones, perfil) => preparados.push({ libro: opciones && opciones.libro, perfil, opciones });
    vm.runInContext([
      'prepararEmailParaEnvio = function (nombre, correo, fila, opciones) {',
      '  __anotar(opciones, PERFIL_ENVIO_ACTUAL);',
      '  var l = (opciones && opciones.libro) || { titulo: "Lunes", autor: "x", tarjeta: { parrafoBot: "", style: {} } };',
      '  return { ok: true, libro: l, subject: "Asunto", finalHTML: "<html><body>{{GREETING_BLOCK}}<p>" + l.titulo + "</p>{{UNSUB_LINK}}</body></html>", finalPlain: l.titulo, inlineImages: {} };',
      '};',
    ].join('\n'), ctx);
  } else {
    vm.runInContext('renderTarjetaEditorial = function (l) { return "<html><body><p>" + l.titulo + "</p></body></html>"; }; generarMediosTopHTML = function () { return ""; }; generarMediosTopPlain = function () { return ""; };', ctx);
  }
  vm.runInContext('Math.random = function () { return 0.9; };', ctx);
  return { ctx, datos, enviados, avisos, bitacora, pedidas, preparados, activadores };
}

let pruebas = 0;
function prueba(nombre, fn) {
  try { fn(); pruebas++; console.log('✔ ' + nombre); }
  catch (e) { console.log('✘ ' + nombre + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
}
const libroDe = (m, correo) => { const e = m.enviados.find(x => x.para === correo); return e ? (e.html.match(/<p>([^<]*)<\/p>/) || [])[1] : null; };

// ── quién recibe ────────────────────────────────────────────────────────────────────────────────────────
prueba('quién recibe: tope 2 con su envío de este lunes; los demás, no', () => {
  const m = nuevoMundo({ filas: [
    fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] }),
    fila('Lu', 'lu@ejemplo.com', { estado: 'SUBSCRIBED_MEMBER_129 2026-10-01', alta: '2026-10-01' }),             // $129: tope 1
    fila('Tea', 'tea@ejemplo.com', { estado: 'SUBSCRIBED_TRIAL 2026-11-10 09:00', alta: '2026-11-10', envios: ['2026-11-10T09:00:00Z', LUNES] }),
    fila('Wen', 'wen@ejemplo.com', { estado: 'SUBSCRIBED_TRIAL 2026-11-18 09:00', alta: '2026-11-18', envios: ['2026-11-18T09:00:00Z'] }),   // llegó el miércoles
    fila('Tom', 'tom@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z'], j: 'Edición 111' }),   // el de este lunes no le llegó
    fila('Uri', 'uri@ejemplo.com', { estado: 'UNSUBSCRIBED 2026-11-01', alta: '2026-10-01' }),
    fila('Eve', 'eve@ejemplo.com', { estado: 'SUBSCRIBED_TRIAL 2026-10-01 09:00', alta: '2026-10-01' }),         // prueba vencida
    fila('Ben', 'ben@ejemplo.com', { estado: '' }),                                                             // base vieja: tope 1
    fila('Fer', 'fer@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-13T13:00:00Z', LUNES] }),   // el segundo de la semana pasada salió el viernes
  ] });
  const r = m.ctx.enviarTrigguiSegundo();
  assert.deepStrictEqual(m.enviados.map(e => e.para).sort(), ['fer@ejemplo.com', 'mia@ejemplo.com', 'tea@ejemplo.com']);
  assert.deepStrictEqual([r.candidatos, r.filas, r.enviados, r.sinLibro, r.errores, r.esperanLunes], [3, 3, 3, 0, 0, 1]);
  assert.strictEqual(m.avisos.length, 1);
  assert.ok(/No han recibido el correo de este lunes: 1\. Corre enviarTrigguiLunes\(\)/.test(m.avisos[0].texto), m.avisos[0].texto);
  const sinNovedad = nuevoMundo({ filas: [fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] })] });
  sinNovedad.ctx.enviarTrigguiSegundo();
  assert.strictEqual(sinNovedad.avisos.length, 0, 'sin novedades no se avisa');
});

prueba('después de mandar: su tope (P) y su historia (LIBROS) se anotan; J a N, que son del lunes, no cambian', () => {
  const m = nuevoMundo({ filas: [fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] })] });
  m.ctx.enviarTrigguiSegundo();
  const f = m.datos[1];
  assert.deepStrictEqual(f[15].split(','), [LUNES, new Date(JUEVES).toISOString()]);
  assert.strictEqual(f[19], 'e90,t:edicion-90', 'su alta es del 1 de octubre: el archivo anterior a la edición de entonces (la 100) es la 90 (con página); se anotan sus dos fichas');
  assert.deepStrictEqual([f[9], f[13]], [CUR.titulo, '#112']);
  assert.strictEqual(m.preparados[0].opciones.etiqueta, '(segundo de la semana)');
  assert.ok(m.preparados[0].opciones.segundo && m.preparados[0].opciones.soloHistoria);
  // Correrlo otra vez el mismo día (o el viernes) no repite a nadie: su último envío ya no es el del lunes.
  m.ctx.enviarTrigguiSegundo();
  assert.strictEqual(m.enviados.length, 1);
});

prueba('el lunes no corre; el ensayo dice a quién le toca qué y no manda ni escribe nada', () => {
  const lunes = nuevoMundo({ hoy: Date.UTC(2026, 10, 16, 15, 0, 0), filas: [fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01' })] });
  assert.strictEqual(lunes.ctx.enviarTrigguiSegundo().motivo, 'lunes');
  assert.strictEqual(lunes.enviados.length + lunes.pedidas.length, 0);
  const m = nuevoMundo({ filas: [fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] }),
    fila('Kim', 'kim@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', perfil: 'kids', j: 'Kids actual' })] });
  const antes = JSON.stringify(m.datos);
  const r = m.ctx.ensayoSegundoCorreo();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(r.plan)), [{ fila: 2, perfil: 'adultos', libro: 'e90', grupo: 0, segundo: true }, { fila: 3, perfil: 'kids', libro: 'cuento-uno', grupo: 0, segundo: true }]);
  assert.strictEqual(m.enviados.length + m.avisos.length, 0);
  assert.strictEqual(JSON.stringify(m.datos), antes);
});

// ── qué libro ───────────────────────────────────────────────────────────────────────────────────────────
prueba('qué libro, adultos: el archivo anterior a su alta, con página primero; nunca la J ni su historia; después el catálogo', () => {
  const m = nuevoMundo();
  const cats = { manual: MANUAL, catalogo: CATALOGO, kids: KIDS, avisos: [] };
  const elige = (f, semilla) => { const r = m.ctx.elegirLibroSegundo_(f, ENC, cats, semilla || 0); return r.libro ? m.ctx.fichaLibro_(r.libro) : null; };
  // Alta del 10 de noviembre: la edición al día era la 111 (del 7), que pudo llegarle; antes de ella, la 110, la 100 y
  // la 90 (con página) y la 80 (sin página), que nunca le llegaron.
  const tea = fila('Tea', 'tea@ejemplo.com', { alta: '2026-11-10' });
  assert.deepStrictEqual([0, 1, 2, 3].map(s => elige(tea, s)), ['e100', 'e110', 'e90', 'e100'], 'uno fijo por semilla, de los que tienen página');
  assert.strictEqual(elige(fila('x', 'x@x.com', { alta: '2026-11-10', libros: 'e100,e110,e90' })), 't:edicion-80', 'sin las de página, la del archivo sin página');
  assert.strictEqual(elige(fila('x', 'x@x.com', { alta: '2026-11-10', libros: 'e100,e110,e90,t:edicion-80' })), 'cat-a', 'sin archivo, el catálogo con página');
  assert.strictEqual(elige(fila('x', 'x@x.com', { alta: '2026-11-10', libros: 'e100,e110,e90,t:edicion-80,cat-a' })), 't:catalogo-b');
  assert.strictEqual(elige(fila('x', 'x@x.com', { alta: '2026-11-10', libros: 'e100,e110,e90,t:edicion-80,cat-a,t:catalogo-b' })), null, 'ni la edición 111 del catálogo ni el título de una edición ni un libro sin tarjeta');
  assert.strictEqual(elige(fila('x', 'x@x.com', { alta: '2026-11-10', j: 'Edición 100' }), 0), 'e110', 'el de su columna J no se repite');
  assert.strictEqual(elige(fila('x', 'x@x.com', { alta: '2026-11-07T02:00:00Z' }), 0), 'e100', 'alta justo después de la 111: la 111 pudo llegarle, la 110 no');
  // Sin fecha de alta no se sabe qué ediciones le llegaron: solo el catálogo, que nunca fue edición.
  assert.strictEqual(elige(fila('x', 'x@x.com', { alta: '' })), 'cat-a');
  // Alta antes de todo el archivo: ninguna edición es segura.
  assert.strictEqual(elige(fila('x', 'x@x.com', { alta: '2026-05-01' })), 'cat-a');
  // Sin columna F, la fecha de su prueba.
  const sinF = fila('x', 'x@x.com', { estado: 'SUBSCRIBED_TRIAL 2026-11-10 09:00' }); sinF[5] = '';
  assert.ok(['e100', 'e110', 'e90'].indexOf(elige(sinF)) !== -1, elige(sinF));
});

prueba('qué libro, Kids: del catálogo Kids, nunca la edición de esta semana ni su historia', () => {
  const m = nuevoMundo();
  const cats = { manual: MANUAL, catalogo: CATALOGO, kids: KIDS, avisos: [] };
  const elige = (f) => { const r = m.ctx.elegirLibroSegundo_(f, ENC, cats, 0); return r.libro ? m.ctx.fichaLibro_(r.libro) : null; };
  assert.strictEqual(elige(fila('k', 'k@x.com', { perfil: 'kids', alta: '2026-11-10', j: 'Kids actual' })), 'cuento-uno');
  assert.strictEqual(elige(fila('k', 'k@x.com', { perfil: 'kids', libros: 'cuento-uno' })), 't:cuento-dos');
  assert.strictEqual(elige(fila('k', 'k@x.com', { perfil: 'kids', libros: 'cuento-uno,t:cuento-dos' })), null);
  assert.strictEqual(elige(fila('k', 'k@x.com', { whatsapp: 'sí kids' })), 'cuento-uno', 'sin PERFIL, un «sí kids» es Kids');
  assert.strictEqual(elige(fila('k', 'k@x.com', { whatsapp: 'sí kids', perfil: 'adultos', alta: '2026-11-10' })), 'e100', 'con PERFIL adultos, adultos');
});

prueba('una página que no abre no se manda: se elige el siguiente', () => {
  const m = nuevoMundo({ sinPagina: ['e90'], filas: [fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] })] });
  m.ctx.enviarTrigguiSegundo();
  assert.strictEqual(m.datos[1][19], 't:edicion-80');
  assert.ok(m.pedidas.indexOf('https://app.triggui.com/t/e90/') !== -1);
  const todas = nuevoMundo({ sinPagina: ['*'], catalogo: [CATALOGO[0]], filas: [fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-05-01', envios: ['2026-11-09T13:00:00Z', LUNES] })] });
  todas.ctx.enviarTrigguiSegundo();
  assert.strictEqual(todas.enviados.length, 0);
  assert.ok(/Sin un libro cuya página abra: 1/.test(todas.avisos[0].texto) && !/se les acabaron/.test(todas.avisos[0].texto), todas.avisos[0].texto);
});

prueba('sin libro que no haya recibido, sin cuota o sin un catálogo: no sale a quien no toca y Badir recibe el aviso', () => {
  const sin = nuevoMundo({ filas: [fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-05-01', envios: ['2026-11-09T13:00:00Z', LUNES], libros: 'cat-a,t:catalogo-b' })] });
  sin.ctx.enviarTrigguiSegundo();
  assert.strictEqual(sin.enviados.length, 0);
  assert.strictEqual(sin.avisos.length, 1);
  assert.ok(/Sin un libro que no hayan recibido: 1/.test(sin.avisos[0].texto), sin.avisos[0].texto);
  const cuota = nuevoMundo({ cuota: 21, filas: [
    fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] }),
    fila('Tea', 'tea@ejemplo.com', { estado: 'SUBSCRIBED_TRIAL 2026-11-10 09:00', alta: '2026-11-10', envios: ['2026-11-10T09:00:00Z', LUNES] })] });
  cuota.ctx.enviarTrigguiSegundo();
  assert.deepStrictEqual(cuota.enviados.map(e => e.para), ['mia@ejemplo.com'], 'los que pagan primero; caben 21 - 20 = 1');
  assert.ok(/Sin cuota hoy: 1/.test(cuota.avisos[0].texto), cuota.avisos[0].texto);
  const roto = nuevoMundo({ fallaCatalogo: URL_MANUAL, filas: [fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01' })] });
  const r = roto.ctx.enviarTrigguiSegundo();
  assert.strictEqual(r.ok, false);
  assert.strictEqual(roto.enviados.length, 0);
  assert.ok(/no pude leer los catálogos/.test(roto.avisos[0].texto));
  const sinKids = nuevoMundo({ fallaCatalogo: URL_KIDS, filas: [fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] })] });
  sinKids.ctx.enviarTrigguiSegundo();
  assert.strictEqual(sinKids.enviados.length, 1, 'sin el catálogo Kids, los adultos igual reciben');
  assert.ok(/Catálogos que no pude leer: HTTP 500 al leer contenido_kids\.json/.test(sinKids.avisos[0].texto), sinKids.avisos[0].texto);
});

prueba('el correo real: «Tu segundo libro de la semana», a todos los correos de la fila y sin nombre si son varios', () => {
  const m = nuevoMundo({ prepReal: true, filas: [
    fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] }),
    fila('Pareja', 'a@ejemplo.com, b@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES], idioma: 'en' })] });
  m.ctx.enviarTrigguiSegundo();
  const mia = m.enviados.find(e => e.para === 'mia@ejemplo.com');
  const par = m.enviados.find(e => e.para === 'a@ejemplo.com,b@ejemplo.com');
  assert.ok(mia && par, JSON.stringify(m.enviados.map(e => e.para)));
  assert.ok(/Tu segundo libro de la semana/.test(mia.html) && /Tu segundo libro de la semana/.test(mia.texto));
  assert.ok(/Mia/.test(mia.texto), 'una sola persona: con su nombre');
  assert.ok(/Your second book of the week/.test(par.html));
  assert.ok(!/Pareja/.test(par.texto) && !/Pareja/.test(par.html), 'varios correos: sin el nombre de la fila');
  assert.ok(/email=a%40ejemplo\.com/.test(par.html), 'las ligas son del primer correo, como el lunes');
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(mia.html + par.html));
});

// ── el lunes y la historia ──────────────────────────────────────────────────────────────────────────────
prueba('el lunes anota su historia y no repite un libro que ya está en ella, aunque la J diga otro', () => {
  const m = nuevoMundo({ hoy: Date.UTC(2026, 10, 23, 13, 0, 0), filas: [
    fila('Ana', 'ana@ejemplo.com', { j: 'Otro libro', envios: ['2026-11-16T13:00:00Z'] }),
    fila('Leo', 'leo@ejemplo.com', { j: 'Otro libro', envios: ['2026-11-16T13:00:00Z'], libros: 'e90,edicion-actual' })] });
  vm.runInContext('prepararEmailParaEnvio = function () { return { ok: true, libro: ' + JSON.stringify(CUR) + ', subject: "S", finalHTML: "<html><body>x</body></html>", finalPlain: "x", inlineImages: {} }; };', m.ctx);
  m.ctx.enviarTrigguiLunes();
  assert.deepStrictEqual(m.enviados.map(e => e.para), ['ana@ejemplo.com']);
  assert.strictEqual(m.datos[1][19], 'edicion-actual,t:edicion-actual');
  assert.strictEqual(m.datos[2][19], 'e90,edicion-actual');
});

prueba('la historia: crea la columna si falta, anota las dos fichas de cada libro sin repetirlas y guarda las últimas 300', () => {
  const m = nuevoMundo({ filas: [fila('Ana', 'ana@ejemplo.com').slice(0, 19)] });
  m.datos[0] = ENC.slice(0, 19);
  const hoja = m.ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('x');
  m.ctx.anotarLibroEnviado_(hoja, 2, CUR);
  assert.deepStrictEqual([m.datos[0][19], m.datos[1][19]], ['LIBROS', 'edicion-actual,t:edicion-actual']);
  m.ctx.anotarLibroEnviado_(hoja, 2, CUR);
  m.ctx.anotarLibroEnviado_(hoja, 2, libro('Sin Slug Ñandú'));
  assert.strictEqual(m.datos[1][19], 'edicion-actual,t:edicion-actual,t:sin-slug-nandu');
  for (let k = 0; k < 160; k++) m.ctx.anotarLibroEnviado_(hoja, 2, libro('L' + k, { _slug: 'l' + k }));
  const fichas = m.datos[1][19].split(',');
  assert.strictEqual(fichas.length, 300);
  assert.deepStrictEqual([fichas[0], fichas[299]], ['l10', 't:l159']);
});

prueba('el activador: los jueves hacia las 7, sin duplicar; quitarlo lo quita', () => {
  const m = nuevoMundo();
  m.ctx.instalarSegundoCorreo();
  m.ctx.instalarSegundoCorreo();
  assert.deepStrictEqual(m.activadores.map(t => [t.f, t.dia, t.hora]), [['enviarTrigguiSegundo', 'THURSDAY', 7]]);
  m.ctx.quitarSegundoCorreo();
  assert.strictEqual(m.activadores.length, 0);
});

prueba('el ensayo del lunes (previewMasivo) también lee la historia, como el envío', () => {
  const m = nuevoMundo({ hoy: Date.UTC(2026, 10, 23, 13, 0, 0), filas: [
    fila('Leo', 'leo@ejemplo.com', { j: 'Otro libro', envios: ['2026-11-16T13:00:00Z'], libros: 'e90,edicion-actual' }),
    fila('Ana', 'ana@ejemplo.com', { j: 'Otro libro', envios: ['2026-11-16T13:00:00Z'] })] });
  vm.runInContext('prepararEmailParaEnvio = function () { return { ok: true, libro: ' + JSON.stringify(CUR) + ', subject: "S", finalHTML: "x", finalPlain: "x", inlineImages: {} }; };', m.ctx);
  m.ctx.previewMasivo();
  const linea = re => (m.bitacora.find(l => re.test(l)) || '');
  assert.ok(/Ya recibieron este libro: 1/.test(linea(/Ya recibieron/)), linea(/Ya recibieron/));
  assert.ok(/TOTAL ENVIABLES:\s+1/.test(linea(/TOTAL ENVIABLES/)), linea(/TOTAL ENVIABLES/));
});

// ── los objetivos de la primera revisión ────────────────────────────────────────────────────────────────
prueba('O1: un libro del catálogo sin slug que después es edición con slug no se repite (lo reconoce por su título)', () => {
  const ESEN = libro('Esencialismo', { _slug: 'esencialismo', _edicion_numero: 113, _manual_generated_at: '2026-11-21T01:00:00Z' });
  const m = nuevoMundo({ hoy: Date.UTC(2026, 10, 23, 13, 0, 0), filas: [
    fila('Ana', 'ana@ejemplo.com', { j: 'Edición actual', envios: ['2026-11-16T13:00:00Z', '2026-11-19T15:00:00Z'], libros: 'edicion-actual,t:edicion-actual,t:esencialismo' })] });
  vm.runInContext('prepararEmailParaEnvio = function () { return { ok: true, libro: ' + JSON.stringify(ESEN) + ', subject: "S", finalHTML: "x", finalPlain: "x", inlineImages: {} }; };', m.ctx);
  m.ctx.enviarTrigguiLunes();
  assert.strictEqual(m.enviados.length, 0, 'el lunes ya no se lo repite');
  const cats = { manual: [ESEN].concat(MANUAL), catalogo: [libro('Esencialismo')].concat(CATALOGO), kids: KIDS, avisos: [] };
  const r = m.ctx.elegirLibroSegundo_(fila('x', 'x@x.com', { alta: '2026-05-01', libros: 'esencialismo' }), ENC, cats, 0);
  assert.notStrictEqual(m.ctx.normalTitulo_(r.libro && r.libro.titulo), 'esencialismo', 'ni al revés: con su slug en la historia, el del catálogo sin slug tampoco');
});

prueba('O2: quien ya tenía la edición de esta semana (el lunes lo saltó) recibe su correo de la semana el jueves, sin decir «segundo»', () => {
  const m = nuevoMundo({ prepReal: true, filas: [
    fila('Ana', 'ana@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', '2026-11-12T15:00:00Z'], libros: 'edicion-actual,t:edicion-actual' })] });
  const r = m.ctx.enviarTrigguiSegundo();
  assert.deepStrictEqual([r.candidatos, r.filas, r.esperanLunes], [1, 1, 0]);
  assert.ok(!/segundo libro de la semana/.test(m.enviados[0].html), 'es su único correo de la semana');
  assert.strictEqual(m.avisos.length, 0);
  // Y el lunes siguiente no se le bloquea: el jueves queda a 4 días del lunes, y el envío anterior a más de 7.
  const tope = m.datos[1][15].split(',');
  assert.deepStrictEqual(tope, ['2026-11-12T15:00:00Z', new Date(JUEVES).toISOString()]);
});

prueba('O3: un alta en las horas entre generar y publicar una edición no cuenta la anterior como «nunca le llegó»', () => {
  const m = nuevoMundo();
  const cats = { manual: MANUAL, catalogo: CATALOGO, kids: KIDS, avisos: [] };
  const elige = (alta, s) => m.ctx.fichaLibro_(m.ctx.elegirLibroSegundo_(fila('x', 'x@x.com', { alta }), ENC, cats, s || 0).libro);
  // La 111 se generó el 7 a la 01:00 UTC; a las 01:20 todavía podía estar llegando la 110 como bienvenida.
  const cerca = [0, 1, 2].map(s => elige('2026-11-07T01:20:00Z', s));
  assert.ok(cerca.indexOf('e110') === -1, 'la 110 queda fuera: ' + cerca);
  const lejos = [0, 1, 2].map(s => elige('2026-11-07T09:00:00Z', s));
  assert.ok(lejos.indexOf('e110') !== -1, 'pasado el margen, la 110 sí es del archivo: ' + lejos);
});

prueba('O5: si no se puede anotar el tope de una fila, se avisa y las demás siguen', () => {
  const m = nuevoMundo({ filas: [
    fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] }),
    fila('Tea', 'tea@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] })] });
  vm.runInContext('var __rs = recordSend, __n = 0; recordSend = function (s, r) { if (++__n === 1) throw new Error("Servicio de hojas"); return __rs(s, r); };', m.ctx);
  const r = m.ctx.enviarTrigguiSegundo();
  assert.deepStrictEqual([r.filas, r.sinTope], [2, 1]);
  assert.ok(/no pude anotar su tope \(columna P\): 1/.test(m.avisos[0].texto), m.avisos[0].texto);
});

prueba('O6: el domingo el aviso no promete «mañana»', () => {
  const m = nuevoMundo({ hoy: Date.UTC(2026, 10, 22, 15, 0, 0), cuota: 20, filas: [
    fila('Mia', 'mia@ejemplo.com', { estado: MIEMBRO, alta: '2026-10-01', envios: ['2026-11-09T13:00:00Z', LUNES] })] });
  m.ctx.enviarTrigguiSegundo();
  assert.ok(/Hoy es domingo: esta semana ya no les sale/.test(m.avisos[0].texto) && !/mañana/.test(m.avisos[0].texto), m.avisos[0].texto);
});

prueba('un libro sin portada nunca se elige', () => {
  const m = nuevoMundo();
  const sinPortada = libro('Sin portada', { _slug: 'aaa-sin-portada', portada: '' });
  const cats = { manual: MANUAL, catalogo: [sinPortada].concat(CATALOGO), kids: KIDS, avisos: [] };
  const vistos = [0, 1, 2, 3, 4].map(s => m.ctx.fichaLibro_(m.ctx.elegirLibroSegundo_(fila('x', 'x@x.com', { alta: '' }), ENC, cats, s).libro));
  assert.ok(vistos.indexOf('aaa-sin-portada') === -1, vistos.join());
});

console.log(process.exitCode ? 'FALLÓ: ' + pruebas + ' pruebas pasadas.' : 'Todo en verde: ' + pruebas + ' pruebas pasadas.');
