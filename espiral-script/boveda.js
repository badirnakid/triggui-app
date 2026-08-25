/* ============================================================
   TRIGGUI ESPIRAL · Bóveda v1.1.0
   Script standalone. Lee la pestaña de personas, escribe SOLO
   en la pestaña estrellas. Nunca toca el proyecto sagrado.

   REGLAS DE HIERRO (certificación 2026-08-11):
   1) Jamás escribe en la pestaña de personas (solo lectura).
   2) Columnas localizadas por NOMBRE de encabezado, no índice.
   3) El ID del archivo vive en Script Properties: SPREADSHEET_ID.
   4) La clave del miembro jamás se registra en logs.
   5) Bitácora append-only: quitar es un evento, no un borrado.

   PUERTAS:
   GET  →  ping: {ok, servicio, v}
   POST →  accion=espiral {clave}
             → {ok, nombre, estrellas:[{ts,slug,catalogo,evento,
                titulo,portada,componente,payload}]}
           accion=marcar  {clave, slug, catalogo, evento, titulo,
                           portada, componente?, payload?}
             evento: "estrella" (idempotente por slug)
                     "combo"    (idempotente por slug; payload JSON
                                 con palabras/frases/colores/textColors
                                 /bocado/eco copiados del origen)
                     "releida"  (bitácora de reapertura)
           accion=quitar  {clave, slug, catalogo, componente}
             componente: bloque0|bloque1|bloque2|bloque3|bocado|eco
                         |tarjeta|og|todo
   Errores: {ok:false, error:"clave"|"accion"|"slug"|"componente"
             |"payload"|"ocupado"|"setup: ..."|"interno"}
   ============================================================ */

'use strict';

var VERSION = '1.1.0';
var TAB_PERSONAS = 'Triggui Emails Prueba';
var TAB_ESTRELLAS = 'estrellas';
var TAB_HELICE = 'helice';
var COL_NOMBRE = 'Nombre';
var COL_EMAIL = 'Email';
var COL_CLAVE = 'espiral_clave';
var ENCABEZADOS_ESTRELLAS = ['ts', 'email', 'slug', 'catalogo', 'evento', 'titulo', 'portada_url', 'componente', 'payload'];
var EVENTOS_VALIDOS = { estrella: true, releida: true, combo: true, hecha: true, deshecha: true };
var COMPONENTES_VALIDOS = { bloque0: true, bloque1: true, bloque2: true, bloque3: true, bocado: true, eco: true, tarjeta: true, og: true, todo: true, combo: true };
var PAYLOAD_MAX = 6000;

/* ----------------- Utilidades puras ----------------- */

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Celdas con varios correos ("a@x.com, b@y.com"): el canónico es el primero.
function _normEmailCelda(celda) {
  var partes = String(celda || '').split(/[,;\s]+/);
  for (var i = 0; i < partes.length; i++) {
    var e = partes[i].trim().toLowerCase();
    if (e.indexOf('@') > 0) return e;
  }
  return '';
}

function _limpia(s, max) {
  return String(s || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
}

/* ----------------- Acceso al archivo ----------------- */

function _abrirArchivo() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('setup: falta SPREADSHEET_ID en Script Properties');
  return SpreadsheetApp.openById(id);
}

function _hojaPersonas(ss) {
  var h = ss.getSheetByName(TAB_PERSONAS);
  if (!h) throw new Error('setup: no existe la pestaña ' + TAB_PERSONAS);
  return h;
}

// La pestaña estrellas es territorio propio: si no existe, nace con
// encabezados. Si existe de la v1.0, gana sus columnas nuevas al final
// (componente, payload) sin tocar jamás lo ya escrito.
function _hojaHelice(ss) {
  var h = ss.getSheetByName(TAB_HELICE);
  if (!h) { h = ss.insertSheet(TAB_HELICE); h.appendRow(ENCABEZADOS_ESTRELLAS); return h; }
  return h;
}
function _hojaEstrellas(ss) {
  var h = ss.getSheetByName(TAB_ESTRELLAS);
  if (!h) {
    h = ss.insertSheet(TAB_ESTRELLAS);
    h.appendRow(ENCABEZADOS_ESTRELLAS);
    return h;
  }
  var ultCol = h.getLastColumn();
  var fila1 = ultCol > 0 ? h.getRange(1, 1, 1, ultCol).getValues()[0] : [];
  var presentes = {};
  for (var i = 0; i < fila1.length; i++) presentes[String(fila1[i]).trim()] = true;
  var faltan = [];
  for (var j = 0; j < ENCABEZADOS_ESTRELLAS.length; j++) {
    if (!presentes[ENCABEZADOS_ESTRELLAS[j]]) faltan.push(ENCABEZADOS_ESTRELLAS[j]);
  }
  if (faltan.length) {
    h.getRange(1, ultCol + 1, 1, faltan.length).setValues([faltan]);
  }
  return h;
}

// Mapa de columnas de estrellas por NOMBRE (regla de hierro 2).
function _idxEstrellas(hoja) {
  var enc = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0];
  var idx = {};
  for (var i = 0; i < enc.length; i++) idx[String(enc[i]).trim()] = i;
  return idx;
}

/* ----------------- Personas (solo lectura) ----------------- */

function _mapaColumnas(hojaPersonas) {
  var encabezados = hojaPersonas.getRange(1, 1, 1, hojaPersonas.getLastColumn()).getValues()[0];
  var idx = {};
  for (var i = 0; i < encabezados.length; i++) {
    idx[String(encabezados[i]).trim()] = i;
  }
  if (!(COL_EMAIL in idx)) throw new Error('setup: no existe encabezado ' + COL_EMAIL);
  if (!(COL_CLAVE in idx)) throw new Error('setup: no existe encabezado ' + COL_CLAVE + ' (Paso 2 pendiente)');
  return idx;
}

// Devuelve {email, nombre, _ss} o null. La clave jamás se registra en logs.
function _personaPorClave(clave) {
  var limpia = String(clave || '').trim();
  if (limpia.length < 6) return null;
  if (limpia.indexOf('off:') === 0) return null; // clave pausada por tu mano
  var ss = _abrirArchivo();
  var hoja = _hojaPersonas(ss);
  var idx = _mapaColumnas(hoja);
  var datos = hoja.getDataRange().getValues();
  for (var f = 1; f < datos.length; f++) {
    var celdaClave = String(datos[f][idx[COL_CLAVE]] || '').trim();
    if (celdaClave && celdaClave === limpia) {
      var iNombre = idx[COL_NOMBRE];
      return {
        email: _normEmailCelda(datos[f][idx[COL_EMAIL]]),
        nombre: iNombre === undefined ? '' : _limpia(datos[f][iNombre], 60),
        _ss: ss
      };
    }
  }
  return null;
}

/* ----------------- Estrellas ----------------- */

function _filasDe(hojaEstrellas, email) {
  var idx = _idxEstrellas(hojaEstrellas);
  var datos = hojaEstrellas.getDataRange().getValues();
  var iTs = idx['ts'], iEm = idx['email'], iSl = idx['slug'], iCa = idx['catalogo'];
  var iEv = idx['evento'], iTi = idx['titulo'], iPo = idx['portada_url'];
  var iCo = idx['componente'], iPa = idx['payload'];
  var out = [];
  for (var f = 1; f < datos.length; f++) {
    if (String(datos[f][iEm] || '').trim().toLowerCase() === email) {
      out.push({
        ts: datos[f][iTs] instanceof Date ? datos[f][iTs].toISOString() : String(datos[f][iTs] || ''),
        slug: String(datos[f][iSl] || ''),
        catalogo: String(datos[f][iCa] || ''),
        evento: String(datos[f][iEv] || ''),
        titulo: String(datos[f][iTi] || ''),
        portada: String(datos[f][iPo] || ''),
        componente: iCo === undefined ? '' : String(datos[f][iCo] || ''),
        payload: iPa === undefined ? '' : String(datos[f][iPa] || '')
      });
    }
  }
  return out;
}

function _totalPiezas(filas) {
  var vistos = {};
  var n = 0;
  for (var i = 0; i < filas.length; i++) {
    var f = filas[i];
    if ((f.evento === 'estrella' || f.evento === 'combo') && !vistos[f.slug]) {
      vistos[f.slug] = true;
      n++;
    }
  }
  return n;
}

function _appendFila(hoja, persona, slug, catalogo, evento, titulo, portada, componente, payload) {
  var idx = _idxEstrellas(hoja);
  var ancho = hoja.getLastColumn();
  var fila = [];
  for (var i = 0; i < ancho; i++) fila.push('');
  fila[idx['ts']] = new Date();
  fila[idx['email']] = persona.email;
  fila[idx['slug']] = slug;
  fila[idx['catalogo']] = catalogo;
  fila[idx['evento']] = evento;
  fila[idx['titulo']] = titulo;
  fila[idx['portada_url']] = portada;
  if (idx['componente'] !== undefined) fila[idx['componente']] = componente || '';
  if (idx['payload'] !== undefined) fila[idx['payload']] = payload || '';
  hoja.appendRow(fila);
}

function _registrar(persona, p) {
  var slug = _limpia(p.slug, 80).toLowerCase();
  if (!slug) return { ok: false, error: 'slug' };
  var evento = EVENTOS_VALIDOS[String(p.evento || '')] ? String(p.evento) : 'estrella';
  var catalogo = String(p.catalogo) === 'kids' ? 'kids' : 'adulto';
  var titulo = _limpia(p.titulo, 120);
  var portada = /^https:\/\//.test(String(p.portada || '')) ? _limpia(p.portada, 300) : '';
  var componente = String(p.componente || '').trim().toLowerCase();
  if (componente && !COMPONENTES_VALIDOS[componente]) return { ok: false, error: 'componente' };

  var payload = '';
  if (p.payload) {
    var crudo = String(p.payload).trim();
    if (crudo.length > PAYLOAD_MAX || crudo.charAt(0) !== '{') return { ok: false, error: 'payload' };
    try { JSON.parse(crudo); } catch (e) { return { ok: false, error: 'payload' }; }
    payload = crudo;
  }

  // Candado: dos taps simultáneos jamás duplican.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return { ok: false, error: 'ocupado' };
  try {
    if (evento === 'hecha' || evento === 'deshecha') {
      var hh = _hojaHelice(persona._ss);
      _appendFila(hh, persona, slug, catalogo, evento, titulo, portada, componente, payload);
      return { ok: true, evento: evento };
    }
    var hoja = _hojaEstrellas(persona._ss);
    var filas = _filasDe(hoja, persona.email);
    if (evento === 'estrella' || evento === 'combo') {
      for (var i = 0; i < filas.length; i++) {
        if (filas[i].slug === slug && filas[i].evento === evento) {
          return { ok: true, evento: evento, ya_existia: true, total: _totalPiezas(filas) };
        }
      }
    }
    // Solo agrega renglones al final: nunca edita lo existente.
    _appendFila(hoja, persona, slug, catalogo, evento, titulo, portada, componente, payload);
    filas.push({ slug: slug, evento: evento });
    return { ok: true, evento: evento, ya_existia: false, total: _totalPiezas(filas) };
  } finally {
    lock.releaseLock();
  }
}

function _quitar(persona, p) {
  var slug = _limpia(p.slug, 80).toLowerCase();
  if (!slug) return { ok: false, error: 'slug' };
  var catalogo = String(p.catalogo) === 'kids' ? 'kids' : 'adulto';
  var componente = String(p.componente || '').trim().toLowerCase();
  if (!componente || !COMPONENTES_VALIDOS[componente]) return { ok: false, error: 'componente' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return { ok: false, error: 'ocupado' };
  try {
    var hoja = _hojaEstrellas(persona._ss);
    _appendFila(hoja, persona, slug, catalogo, 'quitar', '', '', componente, '');
    return { ok: true, evento: 'quitar', componente: componente };
  } finally {
    lock.releaseLock();
  }
}

/* ----------------- Puertas ----------------- */

function doGet(e) {
  return _json({ ok: true, servicio: 'triggui-espiral', v: VERSION });
}

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    var accion = String(p.accion || '');
    var persona = _personaPorClave(p.clave);
    if (!persona) return _json({ ok: false, error: 'clave' });

    if (accion === 'espiral') {
      var hoja = _hojaEstrellas(persona._ss);
      return _json({ ok: true, nombre: persona.nombre, estrellas: _filasDe(hoja, persona.email), senales: _filasDe(_hojaHelice(persona._ss), persona.email) });
    }
    if (accion === 'marcar') {
      return _json(_registrar(persona, p));
    }
    if (accion === 'quitar') {
      return _json(_quitar(persona, p));
    }
    return _json({ ok: false, error: 'accion' });
  } catch (err) {
    var msj = String((err && err.message) || err);
    return _json({ ok: false, error: msj.indexOf('setup:') === 0 ? msj : 'interno' });
  }
}

/* ----------------- Sonda manual (editor) ----------------- */
// Verifica el setup completo sin exponer claves ni datos personales.
function sondaBoveda() {
  var ss = _abrirArchivo();
  var hoja = _hojaPersonas(ss);
  var idx = _mapaColumnas(hoja);
  Logger.log('Archivo: ' + ss.getName());
  Logger.log('Personas: ' + (hoja.getLastRow() - 1) + ' filas');
  Logger.log('Email en idx ' + idx[COL_EMAIL] + ' · espiral_clave en idx ' + idx[COL_CLAVE]);
  var est = ss.getSheetByName(TAB_ESTRELLAS);
  Logger.log('Pestaña estrellas: ' + (est ? est.getLastColumn() + ' columnas' : 'nacerá en el primer uso'));
}
