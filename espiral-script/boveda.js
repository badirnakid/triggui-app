/* ============================================================
   TRIGGUI ESPIRAL · Bóveda v1.0.0
   Script standalone. Lee la pestaña de personas, escribe SOLO
   en la pestaña estrellas. Nunca toca el proyecto sagrado.

   REGLAS DE HIERRO (certificación 2026-08-11):
   1) Jamás escribe en la pestaña de personas (solo lectura).
   2) Columnas localizadas por NOMBRE de encabezado, no índice.
   3) El ID del archivo vive en Script Properties: SPREADSHEET_ID.
   4) La clave del miembro jamás se registra en logs.

   PUERTAS:
   GET  →  ping: {ok, servicio, v}
   POST →  accion=espiral  {clave}
             → {ok, nombre, estrellas:[{ts,slug,catalogo,evento,titulo,portada}]}
           accion=marcar   {clave, slug, catalogo, evento, titulo, portada}
             evento: "estrella" (tap ✦, idempotente por slug)
                     "releida"  (reapertura desde la espiral, bitácora)
   Errores: {ok:false, error:"clave"|"accion"|"slug"|"ocupado"|"setup: ..."|"interno"}
   ============================================================ */

'use strict';

var VERSION = '1.0.0';
var TAB_PERSONAS = 'Triggui Emails Prueba';
var TAB_ESTRELLAS = 'estrellas';
var COL_NOMBRE = 'Nombre';
var COL_EMAIL = 'Email';
var COL_CLAVE = 'espiral_clave';
var ENCABEZADOS_ESTRELLAS = ['ts', 'email', 'slug', 'catalogo', 'evento', 'titulo', 'portada_url'];
var EVENTOS_VALIDOS = { estrella: true, releida: true };

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

// La pestaña estrellas es territorio propio: si no existe, nace con encabezados.
function _hojaEstrellas(ss) {
  var h = ss.getSheetByName(TAB_ESTRELLAS);
  if (!h) {
    h = ss.insertSheet(TAB_ESTRELLAS);
    h.appendRow(ENCABEZADOS_ESTRELLAS);
  }
  return h;
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
  var datos = hojaEstrellas.getDataRange().getValues();
  var out = [];
  for (var f = 1; f < datos.length; f++) {
    if (String(datos[f][1] || '').trim().toLowerCase() === email) {
      out.push({
        ts: datos[f][0] instanceof Date ? datos[f][0].toISOString() : String(datos[f][0] || ''),
        slug: String(datos[f][2] || ''),
        catalogo: String(datos[f][3] || ''),
        evento: String(datos[f][4] || ''),
        titulo: String(datos[f][5] || ''),
        portada: String(datos[f][6] || '')
      });
    }
  }
  return out;
}

function _totalEstrellas(filas) {
  var n = 0;
  for (var i = 0; i < filas.length; i++) if (filas[i].evento === 'estrella') n++;
  return n;
}

function _registrar(persona, p) {
  var slug = _limpia(p.slug, 80).toLowerCase();
  if (!slug) return { ok: false, error: 'slug' };
  var evento = EVENTOS_VALIDOS[String(p.evento || '')] ? String(p.evento) : 'estrella';
  var catalogo = String(p.catalogo) === 'kids' ? 'kids' : 'adulto';
  var titulo = _limpia(p.titulo, 120);
  var portada = /^https:\/\//.test(String(p.portada || '')) ? _limpia(p.portada, 300) : '';

  // Candado: dos taps simultáneos jamás duplican una estrella.
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(8000)) return { ok: false, error: 'ocupado' };
  try {
    var hoja = _hojaEstrellas(persona._ss);
    var filas = _filasDe(hoja, persona.email);
    if (evento === 'estrella') {
      for (var i = 0; i < filas.length; i++) {
        if (filas[i].slug === slug && filas[i].evento === 'estrella') {
          return { ok: true, evento: 'estrella', ya_existia: true, total: _totalEstrellas(filas) };
        }
      }
    }
    // Solo agrega renglones al final: nunca edita lo existente.
    hoja.appendRow([new Date(), persona.email, slug, catalogo, evento, titulo, portada]);
    var total = _totalEstrellas(filas) + (evento === 'estrella' ? 1 : 0);
    return { ok: true, evento: evento, ya_existia: false, total: total };
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
      return _json({ ok: true, nombre: persona.nombre, estrellas: _filasDe(hoja, persona.email) });
    }
    if (accion === 'marcar') {
      return _json(_registrar(persona, p));
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
  Logger.log('Pestaña estrellas: ' + (ss.getSheetByName(TAB_ESTRELLAS) ? 'existe' : 'nacerá en el primer uso'));
}
