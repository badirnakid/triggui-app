// Pruebas del perfil (C477, paso 2) en el cartero de Triggui: la columna PERFIL, el cambio por la liga del correo,
// el correo Kids del lunes, la bienvenida y el alta que llega por Kids. Con dobles de Apps Script: sin red y sin Google.
// Carga el cartero y el módulo de WhatsApp juntos, como en el proyecto (un «sí kids» lo lee waLeerPermiso_).
// Uso: node experiments/correo/prueba-perfil.js
'use strict';
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');
const assert = require('assert');
const path = require('path');

const DIR = path.join(__dirname, '..', '..', 'apps-script');
const CARTERO = fs.readFileSync(path.join(DIR, 'Triggui Correos Semanales.js'), 'utf8');
const WHATSAPP = fs.readFileSync(path.join(DIR, 'Triggui WhatsApp.js'), 'utf8');
const URL_ADULTOS = 'https://raw.githubusercontent.com/badirnakid/triggui-content/main/contenido_manual.json';
const URL_KIDS = 'https://raw.githubusercontent.com/badirnakid/triggui-content/main/contenido_kids.json';

function bytesFirmados(buf) { return Array.from(buf, b => (b > 127 ? b - 256 : b)); }
function haceDias(n) { const d = new Date(Date.now() - n * 86400000); return d.toISOString().slice(0, 10); }
const SECRETO = 'x'.repeat(96);
function firma(correo) {
  return crypto.createHmac('sha256', Buffer.from(SECRETO, 'utf8')).update(Buffer.from(correo.trim().toLowerCase(), 'utf8')).digest('hex').slice(0, 32);
}

const TARJETA = { titulo: 'Título de tarjeta', subtitulo: 'Sub', parrafoTop: 'Arriba.', parrafoBot: 'Abajo.', style: { accent: '#3355AA' } };
const LIBRO_A = { titulo: 'Libro de adultos', autor: 'Autora', _slug: 'libro-de-adultos', _edicion_numero: 112, tarjeta: TARJETA };
const LIBRO_K = { titulo: 'Cuento de Kids', autor: 'Autor Kids', _slug: 'cuento-de-kids', _edicion_numero: 113,
  tarjeta: Object.assign({}, TARJETA, { style: { accent: '#AA3355' } }) };

// Encabezados como los de la hoja real: A..P fijas y después las que nacen por encabezado.
const ENC = ['Nombre', 'Apellido', 'Correo', 'Teléfono', 'Source', 'Fecha', '', '', '', 'Último libro', '', '', 'Fecha último', 'Edición', 'Estado', 'Envios', 'IDIOMA', 'WhatsApp', 'PERFIL'];
function fila(nombre, correo, op) {
  op = op || {};
  const f = new Array(19).fill('');
  f[0] = nombre; f[2] = correo; f[3] = op.tel || ''; f[14] = op.estado || ''; f[16] = op.idioma || 'es';
  f[17] = op.whatsapp || ''; f[18] = op.perfil || '';
  if (op.ultimo) {
    f[9] = op.ultimo;
    const d = new Date(Date.now() - (op.dias || 10) * 86400000);
    f[12] = d; f[15] = d.toISOString();
  }
  return f;
}

function nuevoMundo(op) {
  op = op || {};
  const props = Object.assign({ BAJAS_SECRETO: SECRETO }, op.props || {});
  const enviados = [], avisos = [], bitacora = [], preparados = [], pedidas = [];
  let cuota = op.cuota === undefined ? 1000 : op.cuota;
  const datos = [(op.encabezados || ENC).slice()].concat((op.filas || []).map(f => f.slice()));
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
  const json = { [URL_ADULTOS]: { libros: [LIBRO_A] }, [URL_KIDS]: { libros: [LIBRO_K] } };
  const ctx = {
    console,
    Logger: { log: m => bitacora.push(String(m)) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => (k in props ? props[k] : null),
      setProperty: (k, v) => { props[k] = String(v); },
      deleteProperty: k => { delete props[k]; },
    }) },
    CacheService: { getScriptCache: () => ({ get: () => null, put: () => {}, remove: () => {} }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock() { return true; }, releaseLock() {} }) },
    Session: { getScriptTimeZone: () => 'UTC' },
    ContentService: {
      MimeType: { JSON: 'json', TEXT: 'text' },
      createTextOutput: t => ({ texto: t, setMimeType() { return this; } }),
    },
    MailApp: {
      getRemainingDailyQuota: () => cuota,
      sendEmail: (para, asunto, texto) => { avisos.push({ para, asunto, texto }); cuota--; },
    },
    GmailApp: {
      sendEmail: (para, asunto, texto, opciones) => {
        enviados.push({ para, asunto, texto, html: opciones && opciones.htmlBody, imagenes: opciones && opciones.inlineImages });
        cuota -= String(para).split(',').length;
      },
    },
    DriveApp: { getFilesByName: () => ({ hasNext: () => false }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => hoja, insertSheet: () => hoja }) },
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
        if (op.fallaKids && url === URL_KIDS) return { getResponseCode: () => 500, getContentText: () => '' };
        if (json[url]) return { getResponseCode: () => 200, getContentText: () => JSON.stringify(json[url]) };
        throw new Error('URL inesperada: ' + url);
      },
    },
  };
  vm.createContext(ctx);
  vm.runInContext(CARTERO, ctx, { filename: 'cartero.js' });
  vm.runInContext(WHATSAPP, ctx, { filename: 'whatsapp.js' });
  // Lo que pesa del correo (la tarjeta y las puertas) se simula salvo que la prueba pida lo real. Cada preparación
  // anota con qué perfil e idioma se armó y lleva su propio libro, su asunto y su imagen.
  if (!op.prepReal) {
    ctx.__anotar = (perfil, idioma, opciones) => preparados.push({ perfil, idioma, libro: opciones && opciones.libro });
    ctx.__fallaKids = !!op.fallaKids;
    vm.runInContext([
      'prepararEmailParaEnvio = function (nombre, correo, fila, opciones) {',
      '  __anotar(PERFIL_ENVIO_ACTUAL, IDIOMA_ENVIO_ACTUAL, opciones);',
      '  var kids = PERFIL_ENVIO_ACTUAL === "kids";',
      '  if (kids && __fallaKids) return { ok: false, reason: "HTTP 500 al leer contenido_kids.json" };',
      '  var libro = (opciones && opciones.libro) || (kids ? ' + JSON.stringify(LIBRO_K) + ' : ' + JSON.stringify(LIBRO_A) + ');',
      '  var marca = (kids ? "KIDS" : "ADULTOS") + "-" + IDIOMA_ENVIO_ACTUAL;',
      '  return { ok: true, libro: libro, subject: "Asunto " + marca,',
      '    finalHTML: "<html><body>{{LANG_BAR}}{{PERFIL_BAR}}{{GREETING_BLOCK}}{{KIDS_PROMO_BOTTOM}}<p>" + marca + "</p>{{UNSUB_LINK}}</body></html>",',
      '    finalPlain: "{{GREETING_PLAIN}}" + marca + " {{UNSUB_LINK}}", inlineImages: { portadaTriggui: marca } };',
      '};',
      'generarMediosTopHTML = function () { return ""; };',
      'generarMediosTopPlain = function () { return ""; };',
    ].join('\n'), ctx);
  }
  vm.runInContext('Math.random = function () { return 0.9; };', ctx);
  return { ctx, datos, enviados, avisos, bitacora, preparados, pedidas, props };
}

let pruebas = 0;
function prueba(nombre, fn) {
  try { fn(); pruebas++; console.log('✔ ' + nombre); }
  catch (e) { console.log('✘ ' + nombre + '\n  ' + (e && e.stack || e)); process.exitCode = 1; }
}
const col = (m, nombre) => m.datos[0].findIndex(h => String(h).toUpperCase() === nombre) + 1;

// ── la lectura del perfil ────────────────────────────────────────────────────────────────────────────────
prueba('el perfil: la columna PERFIL manda; vacía, un «sí kids» cuenta como Kids; lo demás, adultos', () => {
  const m = nuevoMundo();
  const v = (p, w) => m.ctx.perfilDeValores_(p, w);
  assert.strictEqual(v('kids', ''), 'kids');
  assert.strictEqual(v(' Kids ', ''), 'kids');
  assert.strictEqual(v('Niños', ''), 'kids');
  assert.strictEqual(v('adultos', 'sí kids'), 'adultos');   // el perfil escrito gana al permiso viejo
  assert.strictEqual(v('', 'sí kids 2026-11-15'), 'kids');
  assert.strictEqual(v('', 'sí'), 'adultos');
  assert.strictEqual(v('', ''), 'adultos');
  assert.strictEqual(v('otra cosa', ''), 'adultos');
  assert.strictEqual(v('', 'baja 2026-11-01'), 'adultos');
});

prueba('leer el perfil nunca crea la columna; cambiarlo la crea una sola vez, en la primera libre', () => {
  const sinPerfil = ENC.slice(0, 18);
  const m = nuevoMundo({ encabezados: sinPerfil, filas: [fila('Ana', 'ana@ejemplo.com').slice(0, 18)] });
  assert.strictEqual(m.ctx.leerPerfilFila_({ getLastColumn: () => 18, getRange: (r, c, nr, nc) => ({ getValues: () => [m.datos[r - 1].slice(c - 1, c - 1 + nc)] }) }, 2), 'adultos');
  assert.strictEqual(m.datos[0].length, 18);
  const hoja = m.ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('x');
  assert.strictEqual(m.ctx.colPerfil_(hoja, false), 0);
  assert.strictEqual(m.ctx.colPerfil_(hoja, true), 19);
  assert.strictEqual(m.datos[0][18], 'PERFIL');
  assert.strictEqual(m.ctx.colPerfil_(hoja, true), 19);
  assert.strictEqual(m.datos[0].length, 19);
});

// ── el cambio por la liga del correo ────────────────────────────────────────────────────────────────────
prueba('la liga firmada cambia el perfil, contesta con el nombre y no manda nada', () => {
  const m = nuevoMundo({ filas: [fila('ana', 'Ana@Ejemplo.com')] });
  const r1 = JSON.parse(m.ctx.doGet({ parameter: { action: 'perfil', email: 'ana@ejemplo.com', token: firma('ana@ejemplo.com'), p: 'kids', format: 'json' } }).texto);
  assert.deepStrictEqual(r1, { ok: true, first_name: 'Ana', perfil: 'kids', changed: true });
  assert.strictEqual(m.datos[1][col(m, 'PERFIL') - 1], 'kids');
  const r2 = JSON.parse(m.ctx.manejarCambioPerfil_('ana@ejemplo.com', firma('ana@ejemplo.com'), 'Kids', 'json').texto);
  assert.strictEqual(r2.changed, false);
  const r3 = JSON.parse(m.ctx.manejarCambioPerfil_('ana@ejemplo.com', firma('ana@ejemplo.com'), 'adultos', 'json').texto);
  assert.deepStrictEqual([r3.perfil, r3.changed], ['adultos', true]);
  assert.strictEqual(m.datos[1][col(m, 'PERFIL') - 1], 'adultos');
  assert.strictEqual(m.enviados.length + m.avisos.length, 0, 'el perfil no reenvía ni avisa');
});

prueba('la liga con otra firma, sin perfil o de un correo que no está: no escribe nada', () => {
  const m = nuevoMundo({ filas: [fila('Ana', 'ana@ejemplo.com')] });
  const pide = (correo, token, p) => JSON.parse(m.ctx.manejarCambioPerfil_(correo, token, p, 'json').texto);
  assert.deepStrictEqual(pide('ana@ejemplo.com', firma('otra@ejemplo.com'), 'kids'), { ok: false, error: 'token' });
  assert.deepStrictEqual(pide('ana@ejemplo.com', 'a'.repeat(32), 'kids'), { ok: false, error: 'token' });
  assert.deepStrictEqual(pide('ana@ejemplo.com', firma('ana@ejemplo.com'), 'todos'), { ok: false, error: 'parametros' });
  assert.deepStrictEqual(pide('nadie@ejemplo.com', firma('nadie@ejemplo.com'), 'kids'), { ok: true, first_name: '', perfil: 'kids', changed: false });
  assert.strictEqual(m.datos[1][18], '');
  const texto = m.ctx.manejarCambioPerfil_('ana@ejemplo.com', firma('ana@ejemplo.com'), 'kids', 'html').texto;
  assert.ok(/Triggui Kids/.test(texto), texto);
});

// ── el correo del lunes ─────────────────────────────────────────────────────────────────────────────────
prueba('el lunes: cada fila recibe la edición de su perfil, con su imagen, y se anota lo que recibió', () => {
  const m = nuevoMundo({ filas: [
    fila('Ana', 'ana@ejemplo.com'),
    fila('Kim', 'kim@ejemplo.com', { perfil: 'kids' }),
    fila('Kat', 'kat@ejemplo.com', { whatsapp: 'sí kids' }),
    fila('Ken', 'ken@ejemplo.com', { perfil: 'kids', idioma: 'en' }),
    fila('Bob', 'bob@ejemplo.com', { idioma: 'en' }),
  ] });
  m.ctx.enviarTrigguiLunes();
  const por = {}; m.enviados.forEach(e => { por[e.para] = e; });
  assert.ok(/ADULTOS-es/.test(por['ana@ejemplo.com'].html));
  assert.ok(/ADULTOS-en/.test(por['bob@ejemplo.com'].html));
  assert.ok(/KIDS-es/.test(por['kim@ejemplo.com'].html));
  assert.ok(/KIDS-es/.test(por['kat@ejemplo.com'].html), 'un «sí kids» sin perfil recibe Kids');
  assert.ok(/KIDS-en/.test(por['ken@ejemplo.com'].html));
  assert.strictEqual(por['kim@ejemplo.com'].imagenes.portadaTriggui, 'KIDS-es', 'la portada es la de su edición');
  assert.strictEqual(por['ana@ejemplo.com'].imagenes.portadaTriggui, 'ADULTOS-es');
  assert.strictEqual(m.datos[2][9], LIBRO_K.titulo);
  assert.strictEqual(m.datos[2][13], '#113 Kids');
  assert.strictEqual(m.datos[1][9], LIBRO_A.titulo);
  assert.strictEqual(m.datos[1][13], '#112');
  assert.ok(m.bitacora.some(l => /perfil Kids que recibieron: 3/.test(l)), m.bitacora.join('\n'));
  // Cada correo base se arma una sola vez: adultos en español (arriba), Kids en español y Kids en inglés.
  assert.deepStrictEqual(m.preparados.map(p => p.perfil + '|' + p.idioma).sort(), ['adultos|en', 'adultos|es', 'kids|en', 'kids|es']);
});

prueba('el lunes: Kids no promueve Kids, y «ya lo recibió» se mide contra la edición de su perfil', () => {
  const m = nuevoMundo({ filas: [
    fila('Kim', 'kim@ejemplo.com', { perfil: 'kids', ultimo: LIBRO_K.titulo, dias: 10 }),   // ya tiene la de Kids
    fila('Ana', 'ana@ejemplo.com', { ultimo: LIBRO_K.titulo, dias: 10 }),                   // pasó de Kids a adultos
    fila('Leo', 'leo@ejemplo.com', { perfil: 'kids', ultimo: LIBRO_A.titulo, dias: 10 }),   // pasó de adultos a Kids
  ] });
  m.ctx.enviarTrigguiLunes();
  assert.deepStrictEqual(m.enviados.map(e => e.para).sort(), ['ana@ejemplo.com', 'leo@ejemplo.com']);
  const leo = m.enviados.find(e => e.para === 'leo@ejemplo.com');
  const ana = m.enviados.find(e => e.para === 'ana@ejemplo.com');
  assert.ok(/KIDS/.test(leo.html));
  assert.ok(/app\.triggui\.com\/kids/.test(ana.html), 'el de adultos sí trae la promoción de Kids (la prueba no es vacía)');
  assert.ok(!/app\.triggui\.com\/kids/.test(leo.html), 'el correo Kids no trae la promoción de Kids');
});

prueba('el lunes: si el correo Kids no se puede armar, los adultos reciben y Badir recibe un aviso con el motivo', () => {
  const m = nuevoMundo({ fallaKids: true, filas: [fila('Ana', 'ana@ejemplo.com'), fila('Kim', 'kim@ejemplo.com', { perfil: 'kids' })] });
  m.ctx.enviarTrigguiLunes();
  assert.deepStrictEqual(m.enviados.map(e => e.para), ['ana@ejemplo.com']);
  assert.strictEqual(m.avisos.length, 1);
  assert.ok(/Kids de hoy no salió/.test(m.avisos[0].asunto));
  assert.ok(/contenido_kids\.json/.test(m.avisos[0].texto) && /esperan: 1/.test(m.avisos[0].texto), m.avisos[0].texto);
  assert.strictEqual(m.datos[2][9], '', 'la fila Kids queda para la siguiente corrida');
});

prueba('la franja del perfil: solo con PERFIL_ACTIVO, con la liga firmada al otro perfil y en el idioma de la fila', () => {
  const apagado = nuevoMundo({ filas: [fila('Ana', 'ana@ejemplo.com')] });
  apagado.ctx.enviarTrigguiLunes();
  assert.ok(!/triggui\.com\/perfil/.test(apagado.enviados[0].html));
  const m = nuevoMundo({ props: { PERFIL_ACTIVO: 'Sí' }, filas: [
    fila('Ana', 'ana@ejemplo.com'),
    fila('Kim', 'kim@ejemplo.com', { perfil: 'kids' }),
    fila('Bob', 'bob@ejemplo.com', { idioma: 'en' }),
  ] });
  m.ctx.enviarTrigguiLunes();
  const por = {}; m.enviados.forEach(e => { por[e.para] = e.html; });
  const liga = (correo, p, l) => 'https://triggui.com/perfil?email=' + encodeURIComponent(correo) + '&token=' + firma(correo) + '&p=' + p + '&l=' + l;
  assert.ok(por['ana@ejemplo.com'].includes(liga('ana@ejemplo.com', 'kids', 'es')) && /Cambiar a Kids/.test(por['ana@ejemplo.com']));
  assert.ok(por['kim@ejemplo.com'].includes(liga('kim@ejemplo.com', 'adultos', 'es')) && /Cambiar a adultos/.test(por['kim@ejemplo.com']));
  assert.ok(por['bob@ejemplo.com'].includes(liga('bob@ejemplo.com', 'kids', 'en')) && /Switch to Kids/.test(por['bob@ejemplo.com']));
  assert.ok(!/\{\{[A-Z_]+\}\}/.test(Object.values(por).join('')), 'no queda ningún marcador');
});

// ── la bienvenida y el alta ─────────────────────────────────────────────────────────────────────────────
prueba('la bienvenida (y el reenvío por idioma) sale del perfil de la fila', () => {
  const m = nuevoMundo({ filas: [fila('Kim', 'kim@ejemplo.com', { perfil: 'kids' }), fila('Ana', 'ana@ejemplo.com')] });
  const r = m.ctx.enviarTrigguiAUno('kim@ejemplo.com', 2, 'Kim');
  assert.deepStrictEqual([r.ok, r.perfil], [true, 'kids']);
  assert.ok(/KIDS-es/.test(m.enviados[0].html));
  assert.strictEqual(m.datos[1][13], '#113 (auto-bienvenida)');
  const r2 = m.ctx.enviarTrigguiAUno('ana@ejemplo.com', 3, 'Ana');
  assert.deepStrictEqual([r2.ok, r2.perfil], [true, 'adultos']);
  assert.ok(/ADULTOS-es/.test(m.enviados[1].html));
});

prueba('el alta que llega por Kids nace con perfil Kids y su bienvenida es Kids; la demás no escribe la columna', () => {
  const sinPerfil = ENC.slice(0, 18);
  const alta = (m, extra) => m.ctx.doPost({ parameter: Object.assign({ action: 'lead', email: 'nueva@ejemplo.com', first_name: 'Nora',
    phone: '5511111111', source: 'triggui_god_v18k_form', t0: String(Date.now() - 10000) }, extra) });
  const k = nuevoMundo({ encabezados: sinPerfil, filas: [] });
  alta(k, { utm_source: 'app', utm_campaign: 'lunes_kids' });
  assert.strictEqual(k.datos[0][18], 'PERFIL');
  assert.strictEqual(k.datos[1][18], 'kids');
  assert.ok(/KIDS-es/.test(k.enviados[0].html), 'la bienvenida es la de Kids');
  const p = nuevoMundo({ encabezados: sinPerfil, filas: [] });
  alta(p, { perfil: 'kids' });
  assert.strictEqual(p.datos[1][18], 'kids');
  const a = nuevoMundo({ encabezados: sinPerfil, filas: [] });
  alta(a, { utm_source: 'instagram', utm_campaign: 'kidsbooks' });
  assert.strictEqual(a.datos[0].length, 18, 'sin Kids no se crea la columna');
  assert.ok(/ADULTOS-es/.test(a.enviados[0].html));
});

// ── lo real: el catálogo de cada perfil y sus puertas ───────────────────────────────────────────────────
prueba('prepararEmailParaEnvio lee contenido_kids.json con perfil Kids y contenido_manual.json con adultos', () => {
  const m = nuevoMundo({ prepReal: true });
  vm.runInContext('renderTarjetaEditorial = function () { return "<html><body><p>tarjeta</p>{{KIDS_PROMO_BOTTOM}}</body></html>"; };', m.ctx);
  vm.runInContext('PERFIL_ENVIO_ACTUAL = "kids";', m.ctx);
  const k = m.ctx.prepararEmailParaEnvio();
  assert.ok(k.ok, k.reason);
  assert.strictEqual(k.libro.titulo, LIBRO_K.titulo);
  assert.deepStrictEqual(m.pedidas, [URL_KIDS]);
  assert.ok(/\{\{PERFIL_BAR\}\}/.test(k.finalHTML), 'deja el lugar de la franja del perfil');
  vm.runInContext('PERFIL_ENVIO_ACTUAL = "adultos";', m.ctx);
  const a = m.ctx.prepararEmailParaEnvio();
  assert.strictEqual(a.libro.titulo, LIBRO_A.titulo);
  assert.deepStrictEqual(m.pedidas, [URL_KIDS, URL_ADULTOS]);
  const f = nuevoMundo({ prepReal: true, fallaKids: true });
  vm.runInContext('PERFIL_ENVIO_ACTUAL = "kids";', f.ctx);
  const r = f.ctx.prepararEmailParaEnvio();
  assert.ok(!r.ok && /contenido_kids\.json/.test(r.reason), r.reason);
  const forzado = f.ctx.prepararEmailParaEnvio('', '', 0, { libro: Object.assign({}, LIBRO_A, { titulo: 'Del archivo' }) });
  assert.ok(forzado.ok && forzado.libro.titulo === 'Del archivo', 'con un libro elegido no se lee ningún catálogo');
});

prueba('las puertas del correo Kids abren las páginas Kids y ofrecen más Kids; las de adultos, igual que antes', () => {
  const m = nuevoMundo({ prepReal: true });
  const libro = Object.assign({}, LIBRO_K, { _musica: { candidatos: [{ cancion: 'C', artista: 'A', preview: 'https://x' }] } });
  vm.runInContext('PERFIL_ENVIO_ACTUAL = "kids";', m.ctx);
  const k = m.ctx.puertasMedios_(libro, 'es', 7);
  assert.ok(k[0].u.startsWith('https://app.triggui.com/kids/t/cuento-de-kids/'), k[0].u);
  assert.ok(k[1].u.startsWith('https://app.triggui.com/kids/t/cuento-de-kids/pieza/'), k[1].u);
  assert.strictEqual(k[k.length - 1].k, 'Más Kids');
  vm.runInContext('PERFIL_ENVIO_ACTUAL = "adultos";', m.ctx);
  const a = m.ctx.puertasMedios_(libro, 'es', 7);
  assert.ok(a[0].u.startsWith('https://app.triggui.com/t/cuento-de-kids/'), a[0].u);
  assert.strictEqual(a[a.length - 1].k, 'Kids');
});

console.log(process.exitCode ? 'FALLÓ: ' + pruebas + ' pruebas pasadas.' : 'Todo en verde: ' + pruebas + ' pruebas pasadas.');
