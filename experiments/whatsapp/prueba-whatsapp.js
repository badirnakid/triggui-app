#!/usr/bin/env node
/* Pruebas de apps-script/Triggui WhatsApp.js con dobles de Apps Script (sin red, sin Google, sin Meta).
 * Correr: node experiments/whatsapp/prueba-whatsapp.js */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const ARCHIVO = path.join(__dirname, "..", "..", "apps-script", "Triggui WhatsApp.js");
const CODIGO = fs.readFileSync(ARCHIVO, "utf8");
const CONTENIDO_URL = "https://raw.githubusercontent.com/badirnakid/triggui-content/main/contenido_manual.json";
const KIDS_URL = "https://raw.githubusercontent.com/badirnakid/triggui-content/main/contenido_kids.json";

const LIBRO_A = {
  _slug: "libro-de-prueba", titulo: "Libro de prueba", titulo_en: "Test book", autor: "Autora", _edicion_numero: 112,
  frases: ["🗺 Primera frase.", "🌓 Segunda\nfrase.", "✋ Tercera."], frases_en: ["First phrase.", "Second phrase."],
  tarjeta_en: { titulo: "x" },
  _musica: { candidatos: [{ cancion: "C1", artista: "A1", pie: "Pie 1", preview: "https://x/1" },
    { cancion: "C2", artista: "A2", pie: "Pie 2", preview: "https://x/2" }, { cancion: "C3", artista: "A3", pie: "", preview: null }] },
  _video: { candidatos: [{ id: "vid1", titulo: "V1" }, { id: "vid2", titulo: "V2" }] }
};
const LIBRO_K = {
  _slug: "cuento-de-prueba", titulo: "Cuento", _edicion_numero: 40, frases: ["K1", "K2"], tarjeta_en: null,
  _musica: { candidatos: [{ cancion: "KC", artista: "KA", pie: "KP", preview: "https://k" }] }, _video: { candidatos: [] }
};

const ENC = ["Nombre", "Apellido", "Email", "Teléfono", "", "", "", "", "", "", "", "", "", "", "Estado", "IDIOMA", "WhatsApp", "", "", "Trial"];
function fila(nombre, tel, estado, idioma, whatsapp, trial) {
  const f = new Array(20).fill("");
  f[0] = nombre; f[3] = tel; f[14] = estado; f[15] = idioma; f[16] = whatsapp; f[19] = trial || "";
  return f;
}
function filasBase() {
  return [ENC.slice(),
    fila("Ana", "55 1111 1111", "SUBSCRIBED", "es", "sí 2026-11-15"),
    fila("Bob", "+1 512 555 0101", "SUBSCRIBED", "en", "Sí"),
    fila("Carla", "5522222222", "SUBSCRIBED", "", "si kids"),
    fila("Dan", "5533333333", "UNSUBSCRIBED 2026-10-01", "es", "sí"),
    fila("Eva", "", "SUBSCRIBED", "es", "sí"),
    fila("Fer", "5544444444", "SUBSCRIBED", "es", ""),
    fila("Gil", "5555555555", "SUBSCRIBED", "es", "baja 2026-11-01"),
    fila("Hugo", "+52 1 55 1111 1111", "SUBSCRIBED", "es", "sí"),
    fila("Ines", "5566666666", "SUBSCRIBED_EXPIRED", "es", "sí"),
    fila("Juan", "123", "SUBSCRIBED", "es", "sí"),
    fila("Kim", "5577777777", "TRIAL", "es", "sí", "vencido"),
    fila("Luis", "5588888888", "SUBSCRIBED", "es", "sí ✔")];
}

function hojaFalsa(filas) {
  const h = {
    filas: filas.map(function (f) { return f.slice(); }), congeladas: 0,
    getDataRange: function () { return { getValues: function () { return h.filas.map(function (f) { return f.slice(); }); } }; },
    getRange: function (r, c, nr, nc) {
      return {
        getValue: function () { const v = (h.filas[r - 1] || [])[c - 1]; return v === undefined ? "" : v; },
        setValue: function (v) { while (h.filas.length < r) h.filas.push([]); h.filas[r - 1][c - 1] = v; },
        getValues: function () {
          const out = [];
          for (let i = 0; i < (nr || 1); i++) {
            const f = [];
            for (let j = 0; j < (nc || 1); j++) { const v = (h.filas[r - 1 + i] || [])[c - 1 + j]; f.push(v === undefined ? "" : v); }
            out.push(f);
          }
          return out;
        }
      };
    },
    appendRow: function (f) { h.filas.push(f.slice()); },
    getLastRow: function () { return h.filas.length; },
    getLastColumn: function () { return Math.max.apply(null, [0].concat(h.filas.map(function (f) { return f.length; }))); },
    setFrozenRows: function (n) { h.congeladas = n; }
  };
  return h;
}

function resp(code, texto) { return { getResponseCode: function () { return code; }, getContentText: function () { return texto; } }; }

function entorno(opciones) {
  opciones = opciones || {};
  const props = Object.assign({}, opciones.props || {});
  const cache = {};
  const llamadas = [], correos = [], logs = [], activadores = [];
  const libroHojas = {
    hojas: { "Triggui Emails Prueba": hojaFalsa(opciones.filas || filasBase()) },
    getSheetByName: function (n) { return this.hojas[n] || null; },
    insertSheet: function (n) {
      const h = hojaFalsa([]);
      if (opciones.fallaEnLlamada) {   // la llamada número N a appendRow de esta hoja truena (la 1 es el encabezado)
        let veces = 0;
        const original = h.appendRow;
        h.appendRow = function (f) { veces++; if (veces === opciones.fallaEnLlamada) throw new Error("Servicio de hojas"); return original(f); };
      }
      this.hojas[n] = h;
      return h;
    }
  };
  let n = 0;
  const meta = opciones.meta || function () { return { code: 200, body: { messages: [{ id: "wamid.T" + n }] } }; };
  const sandbox = {
    console: console,
    SHEET_NAME: "Triggui Emails Prueba", UNSUBSCRIBE_COL: 15, CONTENIDO_URL: CONTENIDO_URL, DIAG_EMAIL: "diag@ejemplo.com",
    isRowUnsubscribed: function (row) { return String(row[14] || "").toUpperCase().startsWith("UNSUBSCRIBED"); },
    debeMarcarseExpired: function (row) { return row[19] === "vencido"; },
    leerIdiomaFila: function (sheet, rowIdx) { return String(sheet.getRange(rowIdx, 16).getValue() || "").toLowerCase() === "en" ? "en" : "es"; },
    PropertiesService: { getScriptProperties: function () { return {
      getProperty: function (k) { return props[k] === undefined ? null : props[k]; },
      setProperty: function (k, v) { props[k] = String(v); },
      deleteProperty: function (k) { delete props[k]; } }; } },
    CacheService: { getScriptCache: function () { return { get: function (k) { return cache[k] || null; }, put: function (k, v) { cache[k] = v; }, remove: function (k) { delete cache[k]; } }; } },
    SpreadsheetApp: { getActiveSpreadsheet: function () { return libroHojas; } },
    Utilities: { sleep: function () {}, formatDate: function (d) { return d.toISOString().slice(0, 10); } },
    Session: { getScriptTimeZone: function () { return "UTC"; } },
    MailApp: { sendEmail: function (to, asunto, texto) { correos.push({ to: to, asunto: asunto, texto: texto }); } },
    Logger: { log: function (x) { logs.push(String(x)); } },
    ScriptApp: {
      WeekDay: { MONDAY: "MONDAY" },
      getProjectTriggers: function () { return activadores.slice(); },
      deleteTrigger: function (t) { activadores.splice(activadores.indexOf(t), 1); },
      newTrigger: function (f) {
        const t = { f: f, getHandlerFunction: function () { return f; } };
        const cadena = { timeBased: function () { return cadena; }, onWeekDay: function (d) { t.dia = d; return cadena; },
          atHour: function (h) { t.hora = h; return cadena; }, after: function (ms) { t.despues = ms; return cadena; },
          create: function () { activadores.push(t); return t; } };
        return cadena;
      }
    },
    UrlFetchApp: {
      fetch: function (url, o) {
        o = o || {};
        llamadas.push({ url: url, o: o });
        if (url === CONTENIDO_URL) return resp(200, JSON.stringify({ libros: [opciones.libroA || LIBRO_A] }));
        if (url === KIDS_URL) return resp(200, JSON.stringify({ libros: [LIBRO_K] }));
        if (/\/messages$/.test(url)) { n++; const r = meta(JSON.parse(o.payload), n); return resp(r.code, JSON.stringify(r.body)); }
        if (/\?fields=whatsapp_business_manager_messaging_limit$/.test(url)) {
          if (!opciones.escalon) throw new Error("sin red");
          return resp(200, JSON.stringify({ whatsapp_business_manager_messaging_limit: opciones.escalon, id: "1234567890" }));
        }
        if (/messaging_limit_tier/.test(url)) return resp(400, JSON.stringify({ error: { code: 100, message: "campo retirado" } }));
        if (/\/uploads\?/.test(url)) return resp(200, JSON.stringify({ id: "upload:ABC" }));
        if (/\/upload:ABC$/.test(url)) return resp(200, JSON.stringify({ h: "HANDLE1" }));
        if (/\/og(_en)?\.jpg$/.test(url)) {
          const codigo = (opciones.ogFalta && url.indexOf(opciones.ogFalta) !== -1) ? 404 : 200;
          return { getResponseCode: function () { return codigo; }, getBlob: function () { return { getBytes: function () { return [1, 2, 3]; } }; } };
        }
        if (/\/message_templates$/.test(url)) return resp(200, JSON.stringify({ id: "tpl", status: "PENDING" }));
        throw new Error("URL inesperada: " + url);
      }
    }
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(CODIGO, ctx, { filename: "Triggui WhatsApp.js" });
  return { ctx: ctx, props: props, llamadas: llamadas, correos: correos, logs: logs, activadores: activadores, hojas: libroHojas.hojas,
    run: function (expr) { return vm.runInContext(expr, ctx); } };
}

const PROPS_OK = { WA_TOKEN: "TOKEN-DE-PRUEBA", WA_NUMERO_ID: "1234567890", WA_ACTIVO: "si", WA_PUENTE_CLAVE: "k".repeat(40) };

function semilla(clave, libro) {
  const s = String(clave) + "|" + String(libro._edicion_numero || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

let pasadas = 0;
function prueba(nombre, fn) {
  try { fn(); pasadas++; console.log("  ✔ " + nombre); }
  catch (e) { console.log("  ✘ " + nombre + "\n    " + (e && e.stack || e)); process.exitCode = 1; }
}

console.log("WhatsApp del lunes · Apps Script");

prueba("el permiso: sí, kids, baja y lo demás", function () {
  const E = entorno();
  const p = function (v) { return JSON.parse(JSON.stringify(E.ctx.waLeerPermiso_(v))); };
  assert.deepStrictEqual(p("sí"), { si: true, baja: false, kids: false });
  assert.deepStrictEqual(p("SÍ 2026-11-15"), { si: true, baja: false, kids: false });
  assert.deepStrictEqual(p("Sí, kids"), { si: true, baja: false, kids: true });
  assert.deepStrictEqual(p("si niños"), { si: true, baja: false, kids: true });
  assert.deepStrictEqual(p("baja 2026-11-20"), { si: false, baja: true, kids: false });
  assert.deepStrictEqual(p("sin permiso"), { si: false, baja: false, kids: false });
  assert.deepStrictEqual(p(""), { si: false, baja: false, kids: false });
  assert.deepStrictEqual(p(null), { si: false, baja: false, kids: false });
  assert.deepStrictEqual(p("no"), { si: false, baja: false, kids: false });
  assert.deepStrictEqual(p("si no contesta, quitar"), { si: false, baja: false, kids: false, raro: true });
  assert.deepStrictEqual(p("sí 15/11"), { si: true, baja: false, kids: false });
  assert.deepStrictEqual(p("Sí. 15/11/2026, kids"), { si: true, baja: false, kids: true });
  assert.deepStrictEqual(p("sí, por WhatsApp"), { si: false, baja: false, kids: false, raro: true });
});

prueba("los teléfonos: lada, México con y sin 1, 044 y salida internacional", function () {
  const E = entorno();
  const t = E.ctx.waTel_, c = E.ctx.waClaveTel_;
  assert.strictEqual(t("55 1111 1111"), "525511111111");
  assert.strictEqual(t("+52 1 55 1111 1111"), "5215511111111");
  assert.strictEqual(c("+52 1 55 1111 1111"), "525511111111");
  assert.strictEqual(c("5511111111"), "525511111111");
  assert.strictEqual(t("044 55 1111 1111"), "525511111111");
  assert.strictEqual(t("001 512 555 0101"), "15125550101");
  assert.strictEqual(t("+1 512 555 0101"), "15125550101");
  assert.strictEqual(t("123"), "");
  assert.strictEqual(t(""), "");
  assert.strictEqual(t("0123456789012"), "");
});

prueba("quiénes reciben: solo «sí», con la elegibilidad del lunes y sin repetidos", function () {
  const E = entorno();
  const L = JSON.parse(JSON.stringify(E.ctx.waPersonas_()));
  assert.deepStrictEqual(L.personas.map(function (p) { return [p.nombre, p.tel, p.lang, p.cat]; }), [
    ["Ana", "525511111111", "es", "adultos"], ["Bob", "15125550101", "en", "adultos"], ["Carla", "525522222222", "es", "kids"]]);
  assert.deepStrictEqual(L.resumen, { conSi: 9, sinTel: 1, telRaro: 1, baja: 1, unsub: 1, expirados: 2, prueba: 0, repetidos: 1, lada52: 2, siSinEntender: 1 });
});

prueba("si la hoja falla a medio envío, el aviso dice cuántos sí salieron", function () {
  const E = entorno({ props: PROPS_OK, fallaEnLlamada: 3 });
  const r = E.ctx.waEnviarLunes();
  assert.ok(/^Se interrumpió: salieron 2 de 3\./.test(r.aviso), r.aviso);
  assert.ok(/WA envíos/.test(r.aviso));
  assert.strictEqual(E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }).length, 2);
  assert.strictEqual(E.correos.length, 1);
});

prueba("si falta la columna, el lunes no sale nada y avisa por correo (no truena)", function () {
  const filas = filasBase(); filas[0][16] = "Otra cosa";
  const E = entorno({ props: PROPS_OK, filas: filas });
  const r = E.ctx.waEnviarLunes();
  assert.strictEqual(r.ok, false);
  assert.ok(/Falta la columna «WhatsApp»/.test(r.aviso));
  assert.strictEqual(E.correos.length, 1);
  assert.strictEqual(E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }).length, 0);
});

prueba("sin la imagen de la edición no sale nada", function () {
  const E = entorno({ props: PROPS_OK, ogFalta: "og_en.jpg" });
  const r = E.ctx.waEnviarLunes();
  assert.ok(/No encuentro la imagen/.test(r.aviso) && /og_en\.jpg/.test(r.aviso));
  assert.strictEqual(E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }).length, 0);
  assert.strictEqual(E.correos.length, 1);
});

prueba("con la primera frase vacía no sale nada", function () {
  const E = entorno({ props: PROPS_OK, libroA: Object.assign({}, LIBRO_A, { frases: ["  ", "b"] }) });
  const r = E.ctx.waEnviarLunes();
  assert.ok(/primera frase/.test(r.aviso));
  assert.strictEqual(E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }).length, 0);
  const F = entorno({ props: PROPS_OK, libroA: Object.assign({}, LIBRO_A, { frases_en: ["", "x"] }) });
  assert.ok(/primera frase/.test(F.ctx.waEnviarLunes().aviso));
});

prueba("sin la columna WhatsApp no sigue y lo dice", function () {
  const filas = filasBase(); filas[0][16] = "Otra cosa";
  const E = entorno({ filas: filas });
  assert.throws(function () { E.ctx.waPersonas_(); }, /Falta la columna «WhatsApp»/);
});

prueba("el ensayo arma todo y no manda nada ni escribe en la hoja", function () {
  const E = entorno({ props: PROPS_OK });
  const r = JSON.parse(JSON.stringify(E.ctx.waEnsayo()));
  assert.strictEqual(r.personas, 3);
  assert.deepStrictEqual(r.porIdioma, { es: 2, en: 1 });
  assert.deepStrictEqual(r.porCatalogo, { adultos: 2, kids: 1 });
  assert.strictEqual(r.muestra.to, "52…11");
  assert.strictEqual(E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }).length, 0);
  assert.ok(!E.hojas["WA envíos"] && !E.hojas["WA eventos"]);
  assert.strictEqual(E.correos.length, 0);
});

prueba("la plantilla de adultos en español: imagen, tres parámetros y tres botones con su carga", function () {
  const E = entorno({ props: PROPS_OK });
  const cfg = E.ctx.waConfig_();
  const p = { tel: "525511111111", clave: "525511111111", lang: "es", cat: "adultos" };
  const c = JSON.parse(JSON.stringify(E.ctx.waPayload_(p, LIBRO_A, cfg)));
  const s = semilla("525511111111", LIBRO_A), m = s % 2, v = Math.floor(s / 7) % 2;
  assert.strictEqual(c.template.name, "triggui_lunes");
  assert.strictEqual(c.template.language.code, "es_MX");
  assert.strictEqual(c.to, "525511111111");
  const comp = c.template.components;
  assert.deepStrictEqual(comp[0], { type: "header", parameters: [{ type: "image", image: { link: "https://app.triggui.com/t/libro-de-prueba/og.jpg" } }] });
  assert.deepStrictEqual(comp[1].parameters.map(function (x) { return x.text; }),
    ["Libro de prueba", "🗺 Primera frase.", "t/libro-de-prueba/?w=s&utm_content=lunes"]);
  assert.deepStrictEqual(comp.slice(2).map(function (b) { return [b.sub_type, b.index, b.parameters[0].payload]; }), [
    ["quick_reply", "0", "tg1|tarjeta|a|libro-de-prueba|es|" + m + "|" + v],
    ["quick_reply", "1", "tg1|melodia|a|libro-de-prueba|es|" + m + "|" + v],
    ["quick_reply", "2", "tg1|video|a|libro-de-prueba|es|" + m + "|" + v]]);
  assert.strictEqual(c._lang, "es");
});

prueba("en inglés: plantilla en_US, imagen og_en, título, frase y liga en inglés", function () {
  const E = entorno({ props: PROPS_OK });
  const c = JSON.parse(JSON.stringify(E.ctx.waPayload_({ tel: "15125550101", clave: "15125550101", lang: "en", cat: "adultos" }, LIBRO_A, E.ctx.waConfig_())));
  assert.strictEqual(c.template.language.code, "en_US");
  assert.strictEqual(c.template.components[0].parameters[0].image.link, "https://app.triggui.com/t/libro-de-prueba/og_en.jpg");
  assert.deepStrictEqual(c.template.components[1].parameters.map(function (x) { return x.text; }),
    ["Test book", "First phrase.", "t/libro-de-prueba/en/?w=s&utm_content=lunes"]);
  assert.ok(/\|en\|/.test(c.template.components[2].parameters[0].payload));
});

prueba("Niños: su plantilla, sus rutas y dos botones; sin video", function () {
  const E = entorno({ props: PROPS_OK });
  const c = JSON.parse(JSON.stringify(E.ctx.waPayload_({ tel: "525522222222", clave: "525522222222", lang: "es", cat: "kids" }, LIBRO_K, E.ctx.waConfig_())));
  assert.strictEqual(c.template.name, "triggui_lunes_ninos");
  assert.strictEqual(c.template.components[0].parameters[0].image.link, "https://app.triggui.com/kids/t/cuento-de-prueba/og.jpg");
  assert.strictEqual(c.template.components[1].parameters[2].text, "kids/t/cuento-de-prueba/?w=s&utm_content=lunes");
  assert.strictEqual(c.template.components.length, 4);
  assert.deepStrictEqual(c.template.components.slice(2).map(function (b) { return b.parameters[0].payload.split("|").slice(1, 3); }), [["tarjeta", "k"], ["melodia", "k"]]);
  assert.ok(/\|0\|0$/.test(c.template.components[2].parameters[0].payload));
});

prueba("si la edición no trae inglés, quien pidió inglés recibe la de español", function () {
  const E = entorno({ props: PROPS_OK });
  const sinEn = Object.assign({}, LIBRO_A, { tarjeta_en: null });
  const c = JSON.parse(JSON.stringify(E.ctx.waPayload_({ tel: "15125550101", clave: "15125550101", lang: "en", cat: "adultos" }, sinEn, E.ctx.waConfig_())));
  assert.strictEqual(c.template.language.code, "es_MX");
  assert.strictEqual(c.template.components[0].parameters[0].image.link, "https://app.triggui.com/t/libro-de-prueba/og.jpg");
  assert.strictEqual(c.template.components[1].parameters[2].text, "t/libro-de-prueba/?w=s&utm_content=lunes");
});

prueba("sin WA_ACTIVO no sale nada y avisa por correo", function () {
  const E = entorno({ props: Object.assign({}, PROPS_OK, { WA_ACTIVO: "" }) });
  const r = E.ctx.waEnviarLunes();
  assert.strictEqual(r.ok, false);
  assert.ok(/WA_ACTIVO/.test(r.aviso));
  assert.strictEqual(E.llamadas.length, 0);
  assert.strictEqual(E.correos.length, 1);
});

prueba("el envío: tres plantillas, su bitácora, su correo; y la segunda vez no repite", function () {
  const E = entorno({ props: PROPS_OK });
  const r = JSON.parse(JSON.stringify(E.ctx.waEnviarLunes()));
  assert.strictEqual(r.aceptados, 3);
  assert.strictEqual(r.errores, 0);
  const envios = E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); });
  assert.strictEqual(envios.length, 3);
  assert.ok(envios.every(function (l) { return l.url === "https://graph.facebook.com/v26.0/1234567890/messages"; }));
  assert.ok(envios.every(function (l) { return l.o.headers.Authorization === "Bearer TOKEN-DE-PRUEBA" && l.o.muteHttpExceptions === true; }));
  assert.ok(envios.every(function (l) { return JSON.parse(l.o.payload)._lang === undefined; }));
  const hoja = E.hojas["WA envíos"];
  assert.deepStrictEqual(JSON.parse(JSON.stringify(hoja.filas[0])), ["Fecha", "Edición", "Teléfono", "Nombre", "Idioma", "Catálogo", "wamid", "Resultado", "Detalle"]);
  assert.deepStrictEqual(hoja.filas.slice(1).map(function (f) { return [f[1], f[2], f[4], f[5], f[6], f[7]]; }), [
    ["libro-de-prueba", "'525511111111", "es", "adultos", "wamid.T1", "aceptado"],
    ["libro-de-prueba", "'15125550101", "en", "adultos", "wamid.T2", "aceptado"],
    ["cuento-de-prueba", "'525522222222", "es", "kids", "wamid.T3", "aceptado"]]);
  assert.strictEqual(E.correos.length, 1);
  assert.ok(/3 de 3/.test(E.correos[0].asunto));
  const r2 = JSON.parse(JSON.stringify(E.ctx.waEnviarLunes()));
  assert.strictEqual(r2.aceptados, 0);
  assert.strictEqual(r2.yaTenian, 3);
  assert.strictEqual(E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }).length, 3);
});

prueba("si pasan del tope salen los primeros del tope y el aviso dice cuántos quedaron fuera (C481)", function () {
  const E = entorno({ props: Object.assign({}, PROPS_OK, { WA_TOPE: "2" }) });
  const r = E.ctx.waEnviarLunes();
  assert.strictEqual(r.aceptados, 2);
  assert.strictEqual(r.fueraDelTope, 1);
  assert.strictEqual(E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }).length, 2);
  const aviso = E.correos.filter(function (c) { return /Fuera del tope/.test(c.texto); });
  assert.strictEqual(aviso.length, 1, JSON.stringify(E.correos.map(function (c) { return c.asunto; })));
  assert.ok(/Fuera del tope \(WA_TOPE, 2\): 1\. Salieron primero los que pagan/.test(aviso[0].texto));
});

prueba("los que pagan primero, y la prueba de 28 días sin WhatsApp los lunes (Badir, 18:54 del 16 de noviembre)", function () {
  const filas = [ENC.slice(),
    fila("Pia", "5512121212", "SUBSCRIBED_TRIAL 2026-11-10 09:00", "es", "sí"),
    fila("Quim", "5513131313", "", "es", "sí"),
    fila("Rosa", "5514141414", "SUBSCRIBED_MEMBER_129 2026-11-01", "es", "sí"),
    fila("Sol", "5515151515", "SUBSCRIBED_MEMBER 2026-11-01", "es", "sí")];
  const L = JSON.parse(JSON.stringify(entorno({ filas: filas }).ctx.waPersonas_()));
  assert.deepStrictEqual(L.personas.map(function (p) { return p.nombre; }), ["Rosa", "Sol", "Quim"]);
  assert.strictEqual(L.resumen.prueba, 1);
  const E = entorno({ filas: filas, props: Object.assign({}, PROPS_OK, { WA_TOPE: "2" }) });
  const r = E.ctx.waEnviarLunes();
  assert.strictEqual(r.aceptados, 2);
  assert.strictEqual(r.fueraDelTope, 1);
  const a = E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }).map(function (l) { return JSON.parse(l.o.payload).to; });
  assert.deepStrictEqual(a, ["525514141414", "525515151515"]);
});

prueba("el error de una persona no detiene a las demás", function () {
  const E = entorno({ props: PROPS_OK, meta: function (c, n) {
    if (c.to === "15125550101") return { code: 400, body: { error: { code: 131026, message: "Message undeliverable" } } };
    return { code: 200, body: { messages: [{ id: "wamid.T" + n }] } };
  } });
  const r = JSON.parse(JSON.stringify(E.ctx.waEnviarLunes()));
  assert.strictEqual(r.aceptados, 2);
  assert.strictEqual(r.errores, 1);
  assert.strictEqual(r.detenido, "");
  assert.strictEqual(E.hojas["WA envíos"].filas[2][7], "error 131026");
});

prueba("un error de token detiene el envío", function () {
  const E = entorno({ props: PROPS_OK, meta: function () { return { code: 401, body: { error: { code: 190, message: "Invalid OAuth access token" } } }; } });
  const r = JSON.parse(JSON.stringify(E.ctx.waEnviarLunes()));
  assert.strictEqual(r.aceptados, 0);
  assert.strictEqual(E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }).length, 1);
  assert.ok(/^190 · /.test(r.detenido));
});

prueba("los parámetros salen sin saltos de línea ni espacios de más, y con tope de largo", function () {
  const E = entorno();
  assert.strictEqual(E.ctx.waLimpia_("a\nb\t c     d  "), "a b c d");
  assert.strictEqual(E.ctx.waLimpia_("x".repeat(20), 10), "xxxxxxxxx…");
  assert.strictEqual(E.ctx.waLimpia_(null), "");
});

prueba("el puente: la clave, la baja, el estado, el 131050 y los botones", function () {
  const E = entorno({ props: PROPS_OK });
  const C = "k".repeat(40);
  assert.strictEqual(E.ctx.waPuente_({ clave: "mala", tipo: "baja", tel: "5215511111111" }).error, "clave");
  const corto = entorno({ props: Object.assign({}, PROPS_OK, { WA_PUENTE_CLAVE: "corta" }) });
  assert.strictEqual(corto.ctx.waPuente_({ clave: "corta", tipo: "baja", tel: "5215511111111" }).error, "clave");
  const b = JSON.parse(JSON.stringify(E.ctx.waPuente_({ clave: C, tipo: "baja", tel: "5215511111111", motivo: "BAJA" })));
  assert.deepStrictEqual(b, { ok: true, filas: 2, error: "" });
  const hoy = new Date().toISOString().slice(0, 10);
  const principal = E.hojas["Triggui Emails Prueba"];
  assert.strictEqual(principal.filas[1][16], "baja " + hoy);
  assert.strictEqual(principal.filas[8][16], "baja " + hoy);
  assert.strictEqual(principal.filas[2][16], "Sí");
  assert.strictEqual(E.ctx.waPuente_({ clave: C, tipo: "baja", tel: "5299999999" }).error, "sin_fila");
  assert.strictEqual(E.ctx.waPuente_({ clave: C, tipo: "estado", wamid: "otro", estado: "read" }).error, "wamid");
  assert.strictEqual(E.ctx.waPuente_({ clave: C, tipo: "estado", wamid: "wamid.X", estado: "raro" }).error, "estado");
  assert.strictEqual(E.ctx.waPuente_({ clave: C, tipo: "estado", wamid: "wamid.X", estado: "read", tel: "15125550101" }).ok, true);
  assert.strictEqual(E.ctx.waPuente_({ clave: C, tipo: "estado", wamid: "wamid.Y", estado: "failed", codigo: "131050", tel: "5522222222" }).ok, true);
  assert.strictEqual(principal.filas[3][16], "baja " + hoy + " (dejó de recibir marketing)");
  assert.strictEqual(E.ctx.waPuente_({ clave: C, tipo: "boton", accion: "melodia", tel: "5215511111111", wamid: "wamid.T1", slug: "libro-de-prueba" }).ok, true);
  assert.strictEqual(E.ctx.waPuente_({ clave: C, tipo: "boton", accion: "otra", tel: "5215511111111" }).error, "boton");
  assert.strictEqual(E.ctx.waPuente_({ clave: C, tipo: "nada" }).error, "tipo");
  const ev = E.hojas["WA eventos"].filas;
  assert.deepStrictEqual(ev.slice(1).map(function (f) { return [f[1], f[2], f[4], f[5]]; }), [
    ["baja", "", "BAJA", "2 fila(s)"], ["baja", "", "BAJA", "0 fila(s)"], ["estado", "wamid.X", "read", ""],
    ["estado", "wamid.Y", "failed", "131050 · "], ["boton", "wamid.T1", "melodia", "libro-de-prueba"]]);
});

prueba("el resumen de la noche junta envíos, estados, botones y bajas de hoy", function () {
  const E = entorno({ props: PROPS_OK });
  E.ctx.waEnviarLunes();
  const C = "k".repeat(40);
  E.ctx.waPuente_({ clave: C, tipo: "estado", wamid: "wamid.T1", estado: "delivered" });
  E.ctx.waPuente_({ clave: C, tipo: "estado", wamid: "wamid.T1", estado: "read" });
  E.ctx.waPuente_({ clave: C, tipo: "estado", wamid: "wamid.T2", estado: "delivered" });
  E.ctx.waPuente_({ clave: C, tipo: "estado", wamid: "wamid.ZZ", estado: "read" });
  E.ctx.waPuente_({ clave: C, tipo: "boton", accion: "tarjeta", tel: "525511111111", wamid: "wamid.T1" });
  E.ctx.waPuente_({ clave: C, tipo: "baja", tel: "525522222222" });
  const r = JSON.parse(JSON.stringify(E.ctx.waResumenDelLunes()));
  assert.deepStrictEqual(r, { enviados: 3, entregados: 2, leidos: 1, fallidos: 0, sinNoticia: 1,
    botones: { tarjeta: 1, melodia: 0, video: 0 }, bajas: 1, bienvenidas: 0 });
  assert.ok(/el resumen del lunes/.test(E.correos[E.correos.length - 1].asunto));
  const F = entorno({ props: PROPS_OK });
  F.ctx.waHoja_("WA envíos", ["Fecha"]);
  assert.strictEqual(JSON.parse(JSON.stringify(F.ctx.waResumenDelLunes())).enviados, 0);
  assert.strictEqual(F.correos.length, 0, "si hoy no salió nada, no hay correo");
});

prueba("las seis plantillas a Meta: textos, muestras, imagen subida una vez por imagen y la bienvenida de utilidad", function () {
  const E = entorno({ props: Object.assign({}, PROPS_OK, { WA_WABA_ID: "999", WA_APP_ID: "777" }) });
  const r = JSON.parse(JSON.stringify(E.ctx.waCrearPlantillas()));
  assert.strictEqual(r.length, 6);
  const todas = E.llamadas.filter(function (l) { return /\/message_templates$/.test(l.url); }).map(function (l) { return JSON.parse(l.o.payload); });
  assert.deepStrictEqual(todas.map(function (d) { return [d.name, d.language, d.category]; }), [
    ["triggui_lunes", "es_MX", "MARKETING"], ["triggui_lunes", "en_US", "MARKETING"],
    ["triggui_lunes_ninos", "es_MX", "MARKETING"], ["triggui_lunes_ninos", "en_US", "MARKETING"],
    ["triggui_bienvenida", "es_MX", "UTILITY"], ["triggui_bienvenida", "en_US", "UTILITY"]]);
  const bienv = JSON.parse(JSON.stringify(E.run("WA_BIENVENIDAS")));
  todas.slice(4).forEach(function (d, i) {
    assert.deepStrictEqual(d.components, [{ type: "BODY", text: bienv[i].cuerpo }, { type: "FOOTER", text: bienv[i].pie }]);
  });
  const altas = todas.slice(0, 4);
  const defs = JSON.parse(JSON.stringify(E.run("WA_PLANTILLAS")));
  altas.forEach(function (d, i) {
    assert.deepStrictEqual(d.components[0], { type: "HEADER", format: "IMAGE", example: { header_handle: ["HANDLE1"] } });
    assert.strictEqual(d.components[1].text, defs[i].cuerpo);
    assert.strictEqual(d.components[1].example.body_text[0].length, 3);
    assert.strictEqual(d.components[2].text, defs[i].pie);
    assert.deepStrictEqual(d.components[3].buttons, defs[i].botones.map(function (t) { return { type: "QUICK_REPLY", text: t }; }));
  });
  assert.strictEqual(altas[0].components[1].example.body_text[0][2], "t/libro-de-prueba/?w=s&utm_content=lunes");
  assert.strictEqual(E.llamadas.filter(function (l) { return /\/uploads\?/.test(l.url); }).length, 3);
  const sesion = E.llamadas.filter(function (l) { return /\/uploads\?/.test(l.url); })[0];
  assert.ok(/^https:\/\/graph\.facebook\.com\/v26\.0\/777\/uploads\?file_name=muestra\.jpg&file_length=3&file_type=image%2Fjpeg$/.test(sesion.url));
  const subida = E.llamadas.filter(function (l) { return /\/upload:ABC$/.test(l.url); })[0];
  assert.strictEqual(subida.o.headers.Authorization, "OAuth TOKEN-DE-PRUEBA");
  assert.strictEqual(subida.o.headers.file_offset, "0");
});

prueba("los textos de las plantillas cumplen las reglas de Meta", function () {
  const E = entorno();
  const defs = JSON.parse(JSON.stringify(E.run("WA_PLANTILLAS")));
  defs.forEach(function (d) {
    const vars = (d.cuerpo.match(/\{\{\d+\}\}/g) || []).map(function (x) { return Number(x.replace(/\D/g, "")); });
    assert.deepStrictEqual(vars, [1, 2, 3], d.nombre + " " + d.idioma + ": variables en orden");
    assert.ok(!/^\s*\{\{/.test(d.cuerpo) && !/\}\}\s*$/.test(d.cuerpo), "no empieza ni termina con variable");
    assert.ok(!/\}\}\s*\{\{/.test(d.cuerpo), "sin variables pegadas");
    assert.ok(d.cuerpo.length <= 1024 && d.pie.length <= 60, "largos");
    assert.ok(d.botones.length <= 3 && d.botones.every(function (b) { return b.length <= 25; }), "botones");
    assert.ok(!/[—]/.test(d.cuerpo + d.pie + d.botones.join("")), "sin rayas largas");
  });
  const cuerpos = defs.map(function (d) { return d.cuerpo + "|" + d.pie; });
  assert.strictEqual(new Set(cuerpos).size, cuerpos.length, "ninguna repite cuerpo y pie");
  const bienv = JSON.parse(JSON.stringify(E.run("WA_BIENVENIDAS")));
  assert.deepStrictEqual(bienv.map(function (d) { return d.idioma; }), ["es", "en"]);
  bienv.forEach(function (d) {
    assert.ok(!/\{\{/.test(d.cuerpo), "la bienvenida no lleva variables (nunca sale un parámetro vacío)");
    assert.ok(d.cuerpo.length <= 1024 && d.pie.length <= 60, "largos");
    assert.ok(!/[—]/.test(d.cuerpo + d.pie), "sin rayas largas");
    assert.ok(!/https?:\/\//.test(d.cuerpo), "sin ligas: es de utilidad, confirma el alta y no promociona");
  });
});

prueba("los activadores: lunes a la hora pedida y a las 21; sin duplicar", function () {
  const E = entorno({ props: { WA_HORA: "8" } });
  E.ctx.waInstalarLunes();
  E.ctx.waInstalarLunes();
  assert.deepStrictEqual(E.activadores.map(function (t) { return [t.f, t.dia, t.hora]; }), [
    ["waEnviarLunes", "MONDAY", 8], ["waResumenDelLunes", "MONDAY", 21]]);
  const F = entorno({ props: { WA_HORA: "23" } });
  F.ctx.waInstalarLunes();
  assert.strictEqual(F.activadores[0].hora, 9);
  assert.strictEqual(F.ctx.waQuitarLunes().quitados, 2);
});

/* ─────────────── el flujo sin intervención (C463): bienvenida, permiso del formulario y límite de Meta ─────────────── */

const HOY = new Date().toISOString().slice(0, 10);
const mensajes = function (E) { return E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }); };

prueba("la bienvenida: solo con WA_ACTIVO y WA_BIENVENIDA, una vez por número, sin variables y anotada", function () {
  const apagada = entorno({ props: PROPS_OK });
  assert.strictEqual(apagada.ctx.waBienvenida_("+52 55 9999 0000", "es").motivo, "apagada");
  assert.strictEqual(apagada.llamadas.length, 0);
  const E = entorno({ props: Object.assign({}, PROPS_OK, { WA_BIENVENIDA: "sí" }) });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(E.ctx.waBienvenida_("+52 55 9999 0000", "en"))), { ok: true, motivo: "mandada" });
  assert.deepStrictEqual(mensajes(E).map(function (l) { return JSON.parse(l.o.payload); }), [{ messaging_product: "whatsapp",
    recipient_type: "individual", to: "525599990000", type: "template", template: { name: "triggui_bienvenida", language: { code: "en_US" } } }]);
  const f = E.hojas["WA envíos"].filas[1];
  assert.deepStrictEqual([f[1], f[2], f[4], f[5], f[7]], ["bienvenida", "'525599990000", "en", "bienvenida", "aceptado"]);
  assert.strictEqual(E.ctx.waBienvenida_("5215599990000", "es").motivo, "ya_la_tenia", "con el «1» viejo es el mismo número");
  assert.strictEqual(mensajes(E).length, 1);
  assert.strictEqual(E.ctx.waBienvenida_("123", "es").motivo, "tel");
  const F = entorno({ props: Object.assign({}, PROPS_OK, { WA_BIENVENIDA: "si" }), meta: function () {
    return { code: 400, body: { error: { code: 132001, message: "Template name does not exist in the translation" } } }; } });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(F.ctx.waBienvenida_("5599990000", "es"))), { ok: false, motivo: "meta", codigo: 132001 });
  assert.strictEqual(F.hojas["WA envíos"].filas[1][7], "error 132001");
});

prueba("el permiso del formulario: columna nueva, «sí kids» se respeta, vuelve de «baja» y otro número no se toca", function () {
  const filas = [["Nombre", "Apellido", "Email", "Teléfono"], ["Ana", "", "a@x.com", "'+525511111111"],
    ["Bob", "", "b@x.com", ""], ["Cy", "", "c@x.com", "'+525533333333"]];
  const E = entorno({ props: Object.assign({}, PROPS_OK, { WA_BIENVENIDA: "si" }), filas: filas });
  const h = E.hojas["Triggui Emails Prueba"];
  const P = function (fila, telFila, telForm, lang, recibe) {
    return JSON.parse(JSON.stringify(E.ctx.waPermisoFormulario_(h, fila, telFila, telForm, lang, recibe)));
  };
  const r1 = P(2, "'+525511111111", "+525511111111", "es", true);
  assert.deepStrictEqual([r1.permiso, r1.motivo, r1.bienvenida.motivo], [true, "nuevo", "mandada"]);
  assert.strictEqual(h.filas[0][4], "WhatsApp", "nace en la primera columna libre");
  assert.strictEqual(h.filas[1][4], "sí " + HOY);
  const r2 = P(3, "", "+15125550101", "en", true);
  assert.deepStrictEqual([r2.permiso, r2.bienvenida.motivo], [true, "mandada"]);
  assert.strictEqual(h.filas[2][3], "'+15125550101", "sin teléfono en la fila, se escribe el del formulario");
  const r3 = P(4, "'+525533333333", "+525544444444", "es", true);
  assert.deepStrictEqual([r3.permiso, r3.motivo], [false, "otro_tel"]);
  assert.ok(!h.filas[3][4], "con otro número no se escribe nada");
  h.filas[1][4] = "sí kids";
  const r4 = P(2, "'+525511111111", "+5215511111111", "es", true);
  assert.deepStrictEqual([r4.motivo, r4.bienvenida.motivo], ["ya_tenia", "ya_la_tenia"]);
  assert.strictEqual(h.filas[1][4], "sí kids");
  h.filas[3][3] = "'+525544444444"; h.filas[3][4] = "baja 2026-11-01";
  const r5 = P(4, "'+525544444444", "+525544444444", "es", false);
  assert.deepStrictEqual([r5.permiso, r5.motivo, r5.bienvenida.motivo], [true, "nuevo", "no_recibe_los_lunes"]);
  assert.strictEqual(h.filas[3][4], "sí " + HOY, "marcar la casilla es permiso nuevo");
  assert.strictEqual(P(2, "", "12", "es", true).motivo, "tel");
  assert.deepStrictEqual(mensajes(E).map(function (l) { const c = JSON.parse(l.o.payload); return [c.to, c.template.language.code]; }),
    [["525511111111", "es_MX"], ["15125550101", "en_US"]]);
});

prueba("el límite de Meta: el campo de hoy en el nodo del número, los escalones y, si no se puede leer, 250", function () {
  [["TIER_250", 250], ["TIER_2K", 2000], ["TIER_10K", 10000], ["TIER_100K", 100000], ["TIER_1K", 1000]].forEach(function (x) {
    const E = entorno({ props: PROPS_OK, escalon: x[0] });
    const r = E.ctx.waLimiteMeta_(E.ctx.waConfig_());
    assert.deepStrictEqual([r.limite, r.escalon, r.leido], [x[1], x[0], true]);
  });
  const U = entorno({ props: PROPS_OK, escalon: "TIER_UNLIMITED" });
  assert.strictEqual(U.ctx.waLimiteMeta_(U.ctx.waConfig_()).limite, Infinity);
  const X = entorno({ props: PROPS_OK });
  const rx = X.ctx.waLimiteMeta_(X.ctx.waConfig_());
  assert.deepStrictEqual([rx.limite, rx.leido], [250, false]);
  const Y = entorno({ props: PROPS_OK, escalon: "TIER_RARO" });
  assert.strictEqual(Y.ctx.waLimiteMeta_(Y.ctx.waConfig_()).leido, false);
  const l = X.llamadas.filter(function (z) { return /messaging_limit/.test(z.url); })[0];
  assert.strictEqual(l.url, "https://graph.facebook.com/v26.0/1234567890?fields=whatsapp_business_manager_messaging_limit");
  assert.ok(!X.llamadas.some(function (z) { return /messaging_limit_tier/.test(z.url); }), "el campo retirado ya no se pide");
  assert.strictEqual(l.o.headers.Authorization, "Bearer TOKEN-DE-PRUEBA");
});

function filasMuchas(n) {
  const filas = [ENC.slice()];
  for (let i = 0; i < n; i++) filas.push(fila("P" + i, "55" + String(10000000 + i), "SUBSCRIBED", "es", "sí"));
  return filas;
}

prueba("lo que no cupo hoy sigue mañana: 90 % del límite, continuación a las 24 horas y sin repetir a nadie", function () {
  const E = entorno({ props: Object.assign({}, PROPS_OK, { WA_TOPE: "100" }), escalon: "TIER_50", filas: filasMuchas(60) });
  const r = JSON.parse(JSON.stringify(E.ctx.waEnviarLunes()));
  assert.deepStrictEqual([r.aceptados, r.pendientes, r.continua], [45, 15, true]);
  assert.deepStrictEqual(E.activadores.map(function (t) { return [t.f, t.despues]; }), [["waContinuarEnvio", 86400000]]);
  assert.deepStrictEqual(JSON.parse(E.props.WA_CONTINUACION).slugs, ["libro-de-prueba"]);
  assert.ok(/Límite de Meta hoy: 50 \(se usa 45\)/.test(E.correos[0].texto), E.correos[0].texto);
  assert.ok(/No cupieron hoy: 15\. Siguen mañana a esta hora, sin repetir a nadie\./.test(E.correos[0].texto));
  const r2 = JSON.parse(JSON.stringify(E.ctx.waContinuarEnvio()));
  assert.deepStrictEqual([r2.aceptados, r2.yaTenian, r2.pendientes, r2.continua], [15, 45, 0, false]);
  assert.strictEqual(E.activadores.length, 0, "sin pendientes no queda continuación");
  assert.strictEqual(E.props.WA_CONTINUACION, undefined);
  assert.strictEqual(mensajes(E).length, 60, "nadie recibió dos veces");
  assert.ok(/\(continuación\)/.test(E.correos[1].asunto));
});

prueba("la continuación se detiene si cambió la edición, si pasaron 6 días o si no sabe qué seguía, y avisa", function () {
  const ambas = ["cuento-de-prueba", "libro-de-prueba"];
  const E = entorno({ props: Object.assign({}, PROPS_OK, { WA_CONTINUACION: JSON.stringify({ inicio: new Date().toISOString(), slugs: ["otra-edicion"] }) }), escalon: "TIER_250" });
  E.activadores.push({ f: "waContinuarEnvio", getHandlerFunction: function () { return "waContinuarEnvio"; } });
  const r = E.ctx.waContinuarEnvio();
  assert.ok(/^No seguí el envío: la edición cambió/.test(r.aviso), r.aviso);
  assert.strictEqual(mensajes(E).length, 0);
  assert.strictEqual(E.props.WA_CONTINUACION, undefined);
  assert.strictEqual(E.activadores.length, 0, "el activador que la llamó ya no está");
  assert.strictEqual(E.correos.length, 1);
  const viejo = new Date(Date.now() - 7 * 86400000).toISOString();
  const F = entorno({ props: Object.assign({}, PROPS_OK, { WA_CONTINUACION: JSON.stringify({ inicio: viejo, slugs: ambas }) }), escalon: "TIER_250" });
  assert.ok(/ya pasaron 6 días/.test(F.ctx.waContinuarEnvio().aviso));
  const G = entorno({ props: PROPS_OK, escalon: "TIER_250" });
  assert.ok(/no encontré qué edición/.test(G.ctx.waContinuarEnvio().aviso));
  const dos = new Date(Date.now() - 2 * 86400000).toISOString();
  const H = entorno({ props: Object.assign({}, PROPS_OK, { WA_CONTINUACION: JSON.stringify({ inicio: dos, slugs: ambas }) }), escalon: "TIER_250" });
  assert.strictEqual(JSON.parse(JSON.stringify(H.ctx.waContinuarEnvio())).aceptados, 3, "misma edición dentro de los 6 días: sigue");
});

prueba("el resumen de la noche no cuenta las bienvenidas como envío del lunes", function () {
  const E = entorno({ props: Object.assign({}, PROPS_OK, { WA_BIENVENIDA: "si" }) });
  E.ctx.waBienvenida_("5599990000", "es");
  E.ctx.waEnviarLunes();
  const r = JSON.parse(JSON.stringify(E.ctx.waResumenDelLunes()));
  assert.deepStrictEqual([r.enviados, r.bienvenidas], [3, 1]);
  assert.ok(/Bienvenidas del formulario, hoy: 1/.test(E.correos[E.correos.length - 1].texto));
});

prueba("quitar los activadores también quita la continuación", function () {
  const E = entorno({ props: PROPS_OK });
  E.ctx.waInstalarLunes();
  assert.strictEqual(E.ctx.waProgramarContinuacion_(["libro-de-prueba"], false), true);
  assert.strictEqual(E.activadores.length, 3);
  assert.strictEqual(E.ctx.waQuitarLunes().quitados, 3);
  assert.strictEqual(E.props.WA_CONTINUACION, undefined);
});

console.log((process.exitCode ? "FALLÓ" : "Todo en verde") + ": " + pasadas + " pruebas pasadas.");
