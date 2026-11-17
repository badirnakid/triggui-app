#!/usr/bin/env node
/* Pruebas del flujo sin intervención (C463) en el Apps Script, con dobles de Apps Script (sin red, sin Google, sin Meta):
 *   · el puente de Stripe (apps-script/Triggui Stripe.js): altas, renovaciones, bajas, cobros fallidos y avisos repetidos;
 *   · el alta del formulario con la casilla de WhatsApp y la página en inglés (doPost del cartero).
 * Carga los tres archivos reales en un mismo contexto, como Apps Script; solo enviarTrigguiAUno (el correo con el
 * libro de la semana) es un doble.   Correr: node experiments/stripe/prueba-stripe.js */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const RAIZ = path.join(__dirname, "..", "..", "apps-script");
const ARCHIVOS = ["Triggui Correos Semanales.js", "Triggui WhatsApp.js", "Triggui Stripe.js"];
const HOY = new Date().toISOString().slice(0, 10);
const CLAVE = "s".repeat(40);
const ENC = ["Nombre", "Apellido", "Email", "Teléfono", "Source", "Fecha", "UTM Source", "UTM Medium", "UTM Campaign",
  "Libro", "Autor", "Frases", "Fecha envío", "Edición", "Status", "Envíos semana", "IDIOMA", "WhatsApp"];

function fila(nombre, email, tel, estado, idioma, whatsapp) {
  const f = new Array(18).fill("");
  f[0] = nombre; f[2] = email; f[3] = tel; f[14] = estado; f[16] = idioma || ""; f[17] = whatsapp || "";
  return f;
}
function filasBase() {
  return [ENC.slice(),
    fila("Ana", "a@x.com", "'+525511111111", "SUBSCRIBED_TRIAL " + HOY + " 10:00", "", "sí 2026-11-10"),
    fila("Bob", "b@x.com", "'+15125550101", "SUBSCRIBED_MEMBER", "en", ""),
    fila("Cy", "c@x.com", "", "UNSUBSCRIBED 2026-10-01", "", ""),
    fila("Di", "d@x.com", "'+525544444444", "SUBSCRIBED_EXPIRED 2026-11-01 (era SUBSCRIBED_TRIAL 2026-10-01)", "", "sí"),
    fila("Eve", "e@x.com, e2@x.com", "'+525555555555", "SUBSCRIBED_MEMBER_129 2026-10-01", "", "")];
}

function hojaFalsa(filas, opciones) {
  opciones = opciones || {};
  const h = {
    filas: filas.map(function (f) { return f.slice(); }), congeladas: 0,
    getDataRange: function () {
      if (opciones.truena) throw new Error("Servicio de hojas: tiempo agotado");
      return { getValues: function () { return h.filas.map(function (f) { return f.slice(); }); } };
    },
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
  const props = Object.assign({ STRIPE_PUENTE_CLAVE: CLAVE, WA_TOKEN: "TOKEN-DE-PRUEBA", WA_NUMERO_ID: "1234567890",
    WA_ACTIVO: "si", WA_BIENVENIDA: "si" }, opciones.props || {});
  const correos = [], logs = [], llamadas = [], librosMandados = [];
  let cuota = opciones.cuota === undefined ? 90 : opciones.cuota;
  let falloYa = false;
  const libro = {
    hojas: { "Triggui Emails Prueba": hojaFalsa(opciones.filas || filasBase(), { truena: opciones.truena }) },
    getSheetByName: function (n) { return this.hojas[n] || null; },
    insertSheet: function (n) { this.hojas[n] = hojaFalsa([]); return this.hojas[n]; }
  };
  let n = 0;
  const sandbox = {
    console: console,
    Logger: { log: function (x) { logs.push(String(x)); } },
    PropertiesService: { getScriptProperties: function () { return {
      getProperty: function (k) { return props[k] === undefined ? null : props[k]; },
      setProperty: function (k, v) { props[k] = String(v); }, deleteProperty: function (k) { delete props[k]; } }; } },
    SpreadsheetApp: { getActiveSpreadsheet: function () { return libro; } },
    LockService: { getScriptLock: function () { return { waitLock: function () {}, releaseLock: function () {} }; } },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: function (s) { return { contenido: s, setMimeType: function () { return this; } }; } },
    Utilities: { sleep: function () {}, formatDate: function (d) { return new Date(d).toISOString().slice(0, 10); } },
    Session: { getScriptTimeZone: function () { return "UTC"; } },
    MailApp: {
      getRemainingDailyQuota: function () { return cuota; },
      sendEmail: function (to, asunto, texto, o) {
        if (opciones.fallaCorreoA && to === opciones.fallaCorreoA && !falloYa) { falloYa = true; throw new Error("Servicio de correo: tiempo agotado"); }
        cuota--; correos.push({ to: to, asunto: asunto, texto: texto, o: o || {} });
      }
    },
    CacheService: { getScriptCache: function () { return { get: function () { return null; }, put: function () {}, remove: function () {} }; } },
    UrlFetchApp: {
      fetch: function (url, o) {
        llamadas.push({ url: url, o: o || {} });
        if (/\/messages$/.test(url)) { n++; return resp(200, JSON.stringify({ messages: [{ id: "wamid.B" + n }] })); }
        // La bienvenida A (C484) lleva la edición de esta semana y mira que su imagen exista.
        if (/\/contenido_manual\.json$/.test(url)) return resp(200, JSON.stringify({ libros: [{ _slug: "libro-de-la-semana", titulo: "Libro de la semana",
          titulo_en: "Book of the week", frases: ["Una frase."], frases_en: ["A phrase."], tarjeta_en: { titulo: "x" }, _edicion_numero: 113 }] }));
        if (/^https:\/\/app\.triggui\.com\/t\/libro-de-la-semana\/og(_en)?\.jpg$/.test(url)) return resp(200, "");
        throw new Error("URL inesperada: " + url);
      }
    }
  };
  const ctx = vm.createContext(sandbox);
  ARCHIVOS.forEach(function (a) { vm.runInContext(fs.readFileSync(path.join(RAIZ, a), "utf8"), ctx, { filename: a }); });
  // El correo con el libro de la semana es otra pieza (y otra prueba): aquí solo se anota a quién y con qué fila.
  ctx.enviarTrigguiAUno = function (email, rowIdx, nombre) {
    librosMandados.push([email, rowIdx, nombre]);
    return opciones.libroFalla ? { ok: false, reason: "Sin quota Gmail (restantes: 2)" } : { ok: true, libro: "L", edicion: 1 };
  };
  return { ctx: ctx, props: props, correos: correos, logs: logs, llamadas: llamadas, librosMandados: librosMandados, hojas: libro.hojas,
    principal: libro.hojas["Triggui Emails Prueba"], run: function (e) { return vm.runInContext(e, ctx); } };
}

const J = function (x) { return JSON.parse(JSON.stringify(x)); };
const avisosABadir = function (E) { return E.correos.filter(function (c) { return c.to === "badir@triggui.com"; }); };
const alClient = function (E, email) { return E.correos.filter(function (c) { return c.to === email; }); };
const mensajes = function (E) { return E.llamadas.filter(function (l) { return /\/messages$/.test(l.url); }).map(function (l) { return JSON.parse(l.o.payload); }); };
let folio = 0;
const ev = function () { folio++; return "evt_PRUEBA" + String(folio).padStart(6, "0"); };
function puente(E, datos) { return J(E.ctx.stripePuente_(Object.assign({ clave: CLAVE, evento: ev() }, datos))); }
function doPost(E, params) { return JSON.parse(E.ctx.doPost({ parameter: params }).contenido); }
const formulario = function (extra) {
  return Object.assign({ first_name: "Zoe", last_name: "Rojas", email: "z@x.com", phone: "+525599998888", source: "triggui_god_v18k_form",
    website: "", t0: String(Date.now() - 6000) }, extra || {});
};

let pasadas = 0;
function prueba(nombre, fn) {
  try { fn(); pasadas++; console.log("  ✔ " + nombre); }
  catch (e) { console.log("  ✘ " + nombre + "\n    " + (e && e.stack || e)); process.exitCode = 1; }
}

console.log("Flujo sin intervención · Apps Script (Stripe y el formulario)");

prueba("la clave del puente: sin propiedad, corta o equivocada, no entra; y valida evento y tipo", function () {
  assert.strictEqual(J(entorno({ props: { STRIPE_PUENTE_CLAVE: null } }).ctx.stripePuente_({ clave: "", evento: ev(), tipo: "fallo" })).error, "clave");
  assert.strictEqual(J(entorno({ props: { STRIPE_PUENTE_CLAVE: "corta" } }).ctx.stripePuente_({ clave: "corta", evento: ev(), tipo: "fallo" })).error, "clave");
  const E = entorno();
  assert.strictEqual(J(E.ctx.stripePuente_({ clave: "x".repeat(40), evento: ev(), tipo: "fallo" })).error, "clave");
  assert.strictEqual(puente(E, { evento: "evt_x", tipo: "fallo" }).error, "evento");
  assert.strictEqual(puente(E, { tipo: "otra" }).error, "tipo");
  assert.strictEqual(E.correos.length, 0);
  assert.ok(!E.hojas["Stripe eventos"], "nada se anota sin clave ni con datos malos");
});

prueba("alta de quien estaba en prueba: miembro de $149, columna Stripe, «Ya eres miembro», WhatsApp de bienvenida y aviso", function () {
  const E = entorno();
  const r = puente(E, { tipo: "alta", email: "A@X.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149", monto: "149.00", moneda: "mxn" });
  assert.strictEqual(r.ok, true);
  const f = E.principal.filas[1];
  assert.strictEqual(f[14], "SUBSCRIBED_MEMBER " + HOY + " (pagó en Stripe; era SUBSCRIBED_TRIAL " + HOY + " 10:00)");
  assert.strictEqual(E.principal.filas[0][18], "Stripe", "la columna nace en la primera libre");
  assert.strictEqual(f[18], "cus_ANA123 · sub_ANA123");
  const c = alClient(E, "a@x.com");
  assert.strictEqual(c.length, 1);
  assert.strictEqual(c[0].asunto, "Ya eres miembro de Triggui");
  assert.ok(/^Hola, Ana:\n\nTu suscripción de Triggui ya está activa: tus libros te llegan cada semana\./.test(c[0].texto) &&
    /app\.triggui\.com\/espiral\//.test(c[0].texto));
  assert.ok(!/dos libros|2 por semana/i.test(c[0].texto), "no promete frecuencia");
  assert.deepStrictEqual([c[0].o.name, c[0].o.replyTo], [E.run("REMITENTE_DISPLAY_NAME"), E.run("REMITENTE_REPLY_TO")]);
  assert.deepStrictEqual(mensajes(E).map(function (m) { return [m.to, m.template.name, m.template.language.code, m.template.components[1].parameters[0].text]; }),
    [["525511111111", "triggui_bienvenida_libro", "es_MX", "Listo, Ana"]], "la bienvenida A con el nombre de la fila");
  const b = avisosABadir(E);
  assert.strictEqual(b.length, 1);
  assert.ok(/Nuevo miembro de Triggui \(\$149\): a@x\.com \(fila 2/.test(b[0].texto), b[0].texto);
  const bit = E.hojas["Stripe eventos"].filas;
  assert.deepStrictEqual(J(bit[0]), ["Fecha", "Evento", "Tipo", "Cliente", "Suscripción", "Correo", "Resultado", "Detalle"]);
  assert.deepStrictEqual([bit[1][2], bit[1][3], bit[1][4], bit[1][5], bit[1][6]], ["alta", "cus_ANA123", "sub_ANA123", "a@x.com", "ok"]);
});

prueba("el mismo aviso dos veces no hace nada; el mismo pago por sesión y por factura tampoco duplica", function () {
  const E = entorno();
  const id = ev();
  const datos = { clave: CLAVE, evento: id, tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" };
  assert.strictEqual(J(E.ctx.stripePuente_(datos)).ok, true);
  assert.deepStrictEqual(J(E.ctx.stripePuente_(datos)), { ok: true, repetido: true });
  const r = puente(E, { tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" });
  assert.deepStrictEqual(r, { ok: true, detalle: "ya era miembro" });
  assert.strictEqual(alClient(E, "a@x.com").length, 1);
  assert.strictEqual(avisosABadir(E).length, 1);
  assert.strictEqual(mensajes(E).length, 1);
});

prueba("alta de alguien que no estaba en la hoja: fila nueva de $129 con su teléfono, libro de la semana y aviso", function () {
  const E = entorno();
  const r = puente(E, { tipo: "alta", email: "nueva@x.com", nombre: "  ZOE   ROJAS PEREZ ", tel: "+52 55 9999 8888",
    cliente: "cus_NUEVA1", suscripcion: "sub_NUEVA1", plan: "129", monto: "129", moneda: "mxn" });
  assert.strictEqual(r.ok, true);
  const f = E.principal.filas[6];
  assert.deepStrictEqual([f[0], f[1], f[2], f[3], f[4], f[14]], ["ZOE", "ROJAS PEREZ", "nueva@x.com", "'+525599998888", "stripe",
    "SUBSCRIBED_MEMBER_129 " + HOY + " (pagó en Stripe)"]);
  assert.strictEqual(f[18], "cus_NUEVA1 · sub_NUEVA1");
  assert.deepStrictEqual(E.librosMandados, [["nueva@x.com", 7, "ZOE"]]);
  assert.ok(String(f[15]).length > 10, "el envío quedó registrado en la columna P");
  assert.ok(/Nuevo miembro de Triggui \(\$129\): nueva@x\.com\. No estaba en la hoja: quedó en la fila 7/.test(avisosABadir(E)[0].texto));
  assert.strictEqual(mensajes(E).length, 0, "pagar no es permiso de WhatsApp");
});

prueba("un monto que no es de $149 ni de $129 queda como $149 y se le avisa a Badir; sin correo, solo aviso", function () {
  const E = entorno();
  assert.strictEqual(puente(E, { tipo: "alta", email: "d@x.com", cliente: "cus_DI1234", plan: "otro", monto: "100.00", moneda: "mxn" }).ok, true);
  assert.ok(E.principal.filas[4][14].indexOf("SUBSCRIBED_MEMBER " + HOY) === 0);
  assert.ok(/no es de \$149 ni de \$129/.test(avisosABadir(E)[0].texto));
  const r = puente(E, { tipo: "alta", email: "", cliente: "cus_SIN123", plan: "149" });
  assert.deepStrictEqual([r.ok, r.error], [false, "sin_correo"]);
  assert.ok(/sin correo/.test(avisosABadir(E)[1].texto));
});

prueba("cambio de plan y correo en inglés: de $129 a $149, y quien tiene IDIOMA en inglés recibe «You're a Triggui member»", function () {
  const E = entorno();
  puente(E, { tipo: "alta", email: "e2@x.com", cliente: "cus_EVE123", suscripcion: "sub_EVE2", plan: "149" });
  assert.ok(E.principal.filas[5][14].indexOf("SUBSCRIBED_MEMBER " + HOY + " (pagó en Stripe; era SUBSCRIBED_MEMBER_129") === 0);
  puente(E, { tipo: "alta", email: "b@x.com", cliente: "cus_BOB123", suscripcion: "sub_BOB2", plan: "149" });
  const c = alClient(E, "b@x.com")[0];
  assert.strictEqual(c.asunto, "You're a Triggui member");
  assert.ok(/^Hi Bob,\n\nYour Triggui subscription is active: your books arrive every week\./.test(c.texto));
  assert.strictEqual(alClient(E, "e@x.com, e2@x.com").length + alClient(E, "e2@x.com").length, 1);
});

prueba("renovación: guarda el cliente, no molesta a nadie si sigue como miembro, devuelve a una prueba vencida y respeta una baja", function () {
  const E = entorno();
  assert.deepStrictEqual(puente(E, { tipo: "renovacion", email: "e2@x.com", cliente: "cus_EVE123", suscripcion: "sub_EVE1", plan: "129" }),
    { ok: true, detalle: "fila 6; sigue como miembro" });
  assert.strictEqual(E.principal.filas[5][18], "cus_EVE123 · sub_EVE1");
  assert.strictEqual(E.correos.length, 0);
  const r = puente(E, { tipo: "renovacion", email: "d@x.com", cliente: "cus_DI1234", plan: "149" });
  assert.strictEqual(r.detalle, "fila 5; vuelve a ser miembro");
  assert.ok(E.principal.filas[4][14].indexOf("SUBSCRIBED_MEMBER " + HOY + " (renovó en Stripe; era SUBSCRIBED_EXPIRED") === 0);
  assert.strictEqual(puente(E, { tipo: "renovacion", email: "c@x.com", cliente: "cus_CY1234", plan: "149" }).detalle, "fila 4; dada de baja del correo");
  assert.ok(E.principal.filas[3][14].indexOf("UNSUBSCRIBED") === 0, "una baja del correo no se toca");
  const s = puente(E, { tipo: "renovacion", email: "nadie@x.com", cliente: "cus_NADIE1", plan: "149" });
  assert.deepStrictEqual([s.ok, s.error], [false, "sin_fila"]);
  assert.strictEqual(avisosABadir(E).length, 3);
  assert.strictEqual(E.correos.filter(function (c) { return c.to !== "badir@triggui.com"; }).length, 0, "la renovación no le escribe al cliente");
});

prueba("baja: por el cliente guardado deja de ser miembro; con otra suscripción vigente o sin fila, no toca nada y avisa", function () {
  const E = entorno();
  puente(E, { tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" });
  assert.strictEqual(puente(E, { tipo: "baja", cliente: "cus_ANA123", suscripcion: "sub_VIEJA9" }).detalle, "fila 2; tiene otra suscripción");
  assert.ok(E.principal.filas[1][14].indexOf("SUBSCRIBED_MEMBER") === 0);
  assert.strictEqual(puente(E, { tipo: "baja", cliente: "cus_ANA123", suscripcion: "sub_ANA123" }).detalle, "fila 2; ya no es miembro (cancelada)");
  assert.ok(E.principal.filas[1][14].indexOf("SUBSCRIBED_EXPIRED " + HOY + " (canceló en Stripe; era SUBSCRIBED_MEMBER " + HOY) === 0);
  assert.strictEqual(E.ctx.waPersonas_().personas.filter(function (p) { return p.fila === 2; }).length, 0, "ya no recibe WhatsApp los lunes");
  assert.strictEqual(E.ctx.getCapSemanal(E.principal.filas[1]), 0, "ni correo");
  const s = puente(E, { tipo: "baja", cliente: "cus_NADIE1", suscripcion: "sub_NADIE1" });
  assert.deepStrictEqual([s.ok, s.error], [false, "sin_fila"]);
  assert.ok(/Una suscripción en Stripe canceló \(cus_NADIE1\) y no está en la hoja de Triggui\. Si era de Triggui, quítale el estado de miembro a mano; si es de Trestme, no hay nada que hacer\./
    .test(avisosABadir(E).slice(-1)[0].texto), avisosABadir(E).slice(-1)[0].texto);
  assert.ok(/a@x\.com ya no es miembro: canceló en Stripe \(fila 2\)/.test(avisosABadir(E).slice(-2)[0].texto));
});

prueba("baja sin pago o pausada: deja de ser miembro con su motivo, y si después paga, vuelve; un aviso atrasado de una cancelada no la revive", function () {
  const E = entorno();
  puente(E, { tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" });
  assert.strictEqual(puente(E, { tipo: "baja", motivo: "sin_pago", cliente: "cus_ANA123", suscripcion: "sub_ANA123" }).detalle, "fila 2; ya no es miembro (sin_pago)");
  assert.ok(E.principal.filas[1][14].indexOf("SUBSCRIBED_EXPIRED " + HOY + " (quedó sin pagar en Stripe; era SUBSCRIBED_MEMBER") === 0);
  assert.strictEqual(puente(E, { tipo: "renovacion", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" }).detalle, "fila 2; vuelve a ser miembro");
  assert.ok(E.principal.filas[1][14].indexOf("SUBSCRIBED_MEMBER " + HOY + " (renovó en Stripe; era SUBSCRIBED_EXPIRED") === 0);
  puente(E, { tipo: "baja", motivo: "pausada", cliente: "cus_ANA123", suscripcion: "sub_ANA123" });
  assert.ok(E.principal.filas[1][14].indexOf("SUBSCRIBED_EXPIRED " + HOY + " (pausó en Stripe;") === 0);
  const F = entorno();
  puente(F, { tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" });
  puente(F, { tipo: "baja", cliente: "cus_ANA123", suscripcion: "sub_ANA123" });
  const tarde = puente(F, { tipo: "renovacion", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" });
  assert.strictEqual(tarde.detalle, "fila 2; aviso atrasado de una suscripción cancelada");
  assert.ok(F.principal.filas[1][14].indexOf("SUBSCRIBED_EXPIRED") === 0, "sigue fuera");
  const nueva = puente(F, { tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA999", plan: "129" });
  assert.strictEqual(nueva.ok, true, "una suscripción nueva sí la vuelve a hacer miembro");
  assert.ok(F.principal.filas[1][14].indexOf("SUBSCRIBED_MEMBER_129 " + HOY) === 0);
});

prueba("renovación con cambio de plan: corrige el tope y avisa; un monto «otro» no cambia nada", function () {
  const E = entorno();
  assert.strictEqual(puente(E, { tipo: "renovacion", email: "e2@x.com", cliente: "cus_EVE123", suscripcion: "sub_EVE1", plan: "149" }).detalle, "fila 6; cambió a $149");
  assert.ok(E.principal.filas[5][14].indexOf("SUBSCRIBED_MEMBER " + HOY + " (cambió de plan en Stripe; era SUBSCRIBED_MEMBER_129") === 0);
  assert.strictEqual(E.ctx.getCapSemanal(E.principal.filas[5]), 2);
  assert.ok(/e2@x\.com cambió de plan: ahora es miembro de \$149 \(fila 6\)/.test(avisosABadir(E)[0].texto));
  assert.strictEqual(puente(E, { tipo: "renovacion", email: "b@x.com", cliente: "cus_BOB123", plan: "129" }).detalle, "fila 3; cambió a $129");
  assert.strictEqual(E.ctx.getCapSemanal(E.principal.filas[2]), 1);
  assert.strictEqual(puente(E, { tipo: "renovacion", email: "b@x.com", cliente: "cus_BOB123", plan: "otro" }).detalle, "fila 3; sigue como miembro");
});

prueba("una suscripción con un monto que no es de Triggui solo avisa a Badir; no toca la hoja", function () {
  const E = entorno();
  const antes = J(E.principal.filas);
  const r = puente(E, { tipo: "ajeno", email: "cliente@trestme.com", cliente: "cus_TRES12", suscripcion: "sub_TRES12", monto: "5500.00", moneda: "mxn" });
  assert.deepStrictEqual(r, { ok: true, detalle: "no es de Triggui: no se tocó la hoja" });
  assert.deepStrictEqual(J(E.principal.filas), antes);
  assert.ok(/Llegó una suscripción nueva en Stripe por 5500\.00 MXN \(cliente@trestme\.com\)\. No es un monto de Triggui/.test(avisosABadir(E)[0].texto));
  assert.strictEqual(E.correos.length, 1, "al cliente no le llega nada");
});

prueba("cobro fallido: aviso a Badir con monto, intento y fecha del siguiente; nada cambia en la hoja", function () {
  const E = entorno();
  const antes = J(E.principal.filas);
  assert.strictEqual(puente(E, { tipo: "fallo", email: "b@x.com", cliente: "cus_BOB123", monto: "149.00", moneda: "mxn", intento: "2", siguiente: "2026-11-20" }).ok, true);
  assert.ok(/no pasó el cobro de b@x\.com \(149\.00 MXN, intento 2\)\. Stripe lo vuelve a intentar el 2026-11-20\./.test(avisosABadir(E)[0].texto));
  assert.deepStrictEqual(J(E.principal.filas), antes);
  puente(E, { tipo: "fallo", email: "b@x.com", monto: "149.00", moneda: "mxn", intento: "4" });
  assert.ok(/intento 4\)\. Stripe no tiene otro intento programado: revísalo en Stripe\./.test(avisosABadir(E)[1].texto), "sin fecha no promete otro intento");
});

prueba("si la hoja falla antes de escribir, contesta como pasajera y no se anota", function () {
  const E = entorno({ truena: true });
  const id = ev();
  const r = J(E.ctx.stripePuente_({ clave: CLAVE, evento: id, tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", plan: "149" }));
  assert.deepStrictEqual(r, { ok: false, error: "" });
  assert.strictEqual(E.hojas["Stripe eventos"].filas.length, 1, "solo el encabezado: no quedó como atendido");
  assert.strictEqual(E.correos.length, 0);
});

prueba("una falla a medio camino (el estado ya escrito, el correo truena): el reintento del mismo aviso termina lo que faltó", function () {
  const E = entorno({ fallaCorreoA: "a@x.com" });
  const datos = { clave: CLAVE, evento: ev(), tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" };
  assert.deepStrictEqual(J(E.ctx.stripePuente_(datos)), { ok: false, error: "" }, "pasajero: Stripe lo repite");
  const estado = E.principal.filas[1][14];
  assert.ok(estado.indexOf("SUBSCRIBED_MEMBER " + HOY + " (pagó en Stripe; era SUBSCRIBED_TRIAL") === 0, "el estado sí quedó escrito");
  assert.strictEqual(E.hojas["Stripe eventos"].filas.length, 1, "no quedó como atendido");
  assert.deepStrictEqual([alClient(E, "a@x.com").length, avisosABadir(E).length, mensajes(E).length], [0, 0, 0]);
  const r = J(E.ctx.stripePuente_(datos));   // el mismo aviso, otra vez
  assert.strictEqual(r.ok, true);
  assert.strictEqual(E.principal.filas[1][14], estado, "el estado no se reescribe: conserva lo que era antes");
  assert.deepStrictEqual([alClient(E, "a@x.com").length, avisosABadir(E).length, mensajes(E).length], [1, 1, 1], "correo, aviso y bienvenida: una vez cada uno");
  assert.strictEqual(E.hojas["Stripe eventos"].filas[1][6], "ok");
  assert.deepStrictEqual(J(E.ctx.stripePuente_(datos)), { ok: true, repetido: true }, "ya atendido");
  const F = entorno({ fallaCorreoA: "a@x.com" });   // y la factura de alta, con otro aviso, después de la falla de la sesión
  F.ctx.stripePuente_({ clave: CLAVE, evento: ev(), tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" });
  assert.strictEqual(puente(F, { tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" }).ok, true);
  assert.deepStrictEqual([alClient(F, "a@x.com").length, avisosABadir(F).length], [1, 1], "la factura termina lo que la sesión no pudo");
  assert.deepStrictEqual(puente(F, { tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" }),
    { ok: true, detalle: "ya era miembro" }, "y desde ahí, el atajo vale");
});

prueba("fila nueva cuyo libro de bienvenida no salió: el aviso a Badir lo dice, no lo da por hecho", function () {
  const E = entorno({ libroFalla: true });
  puente(E, { tipo: "alta", email: "nueva@x.com", nombre: "Zoe Rojas", cliente: "cus_NUEVA1", suscripcion: "sub_NUEVA1", plan: "149" });
  const aviso = avisosABadir(E)[0].texto;
  assert.ok(/No pude mandarle la bienvenida con el libro de la semana \(Sin quota Gmail \(restantes: 2\)\); le llega con el envío del lunes\./.test(aviso), aviso);
  assert.ok(!/le mandé la bienvenida/.test(aviso));
  assert.ok(!E.principal.filas[6][15], "sin envío no se registra en la columna P");
});

prueba("sin cuota de correo no truena: la fila queda como miembro y el detalle lo dice", function () {
  const E = entorno({ cuota: 0 });
  const r = puente(E, { tipo: "alta", email: "a@x.com", cliente: "cus_ANA123", suscripcion: "sub_ANA123", plan: "149" });
  assert.strictEqual(r.ok, true);
  assert.ok(/correo sin cuota/.test(r.detalle));
  assert.ok(E.principal.filas[1][14].indexOf("SUBSCRIBED_MEMBER") === 0);
});

prueba("doPost: action=stripe_puente pasa por el puente con su clave", function () {
  const E = entorno();
  assert.strictEqual(doPost(E, { action: "stripe_puente", clave: "mala", evento: ev(), tipo: "fallo" }).error, "clave");
  assert.strictEqual(doPost(E, { action: "stripe_puente", clave: CLAVE, evento: ev(), tipo: "fallo", email: "b@x.com" }).ok, true);
});

prueba("formulario nuevo con la casilla y en inglés: fila en inglés, «sí» con fecha y bienvenida en en_US", function () {
  const E = entorno();
  const r = doPost(E, formulario({ wa_ok: "1", lang: "en" }));
  assert.strictEqual(r.result, "new");
  const f = E.principal.filas[6];
  assert.deepStrictEqual([f[2], f[3], f[14].indexOf("SUBSCRIBED_TRIAL"), f[16], f[17]], ["z@x.com", "'+525599998888", 0, "en", "sí " + HOY]);
  assert.deepStrictEqual(E.librosMandados, [["z@x.com", 7, "Zoe"]]);
  assert.deepStrictEqual(mensajes(E).map(function (m) { return [m.to, m.template.name, m.template.language.code]; }), [["525599998888", "triggui_bienvenida_libro", "en_US"]]);
});

prueba("formulario nuevo sin la casilla: solo correo, y en español", function () {
  const E = entorno();
  assert.strictEqual(doPost(E, formulario()).result, "new");
  const f = E.principal.filas[6];
  assert.deepStrictEqual([f[16] || "", f[17] || ""], ["", ""]);
  assert.strictEqual(mensajes(E).length, 0);
});

prueba("formulario de alguien que ya estaba: mismo número, «sí» y bienvenida; prueba vencida, permiso sin bienvenida; otro número, nada", function () {
  const E = entorno({ props: { WA_ACTIVO: "si" } });
  const filas = E.principal.filas;
  filas[2][17] = "";
  assert.strictEqual(doPost(E, formulario({ email: "b@x.com", phone: "+15125550101", wa_ok: "1" })).result, "already_active");
  assert.strictEqual(filas[2][17], "sí " + HOY);
  assert.strictEqual(doPost(E, formulario({ email: "d@x.com", phone: "+525544444444", wa_ok: "1" })).result, "already_active");
  assert.strictEqual(filas[4][17], "sí", "ya tenía permiso: se respeta");
  assert.strictEqual(doPost(E, formulario({ email: "e@x.com", phone: "+525500000000", wa_ok: "1" })).result, "already_active");
  assert.strictEqual(filas[5][17], "", "con otro número no se toca");
  assert.deepStrictEqual(mensajes(E).map(function (m) { return [m.to, m.template.language.code]; }), [["15125550101", "en_US"]],
    "solo Bob: Di tiene la prueba vencida y no recibe los lunes");
});

prueba("formulario de quien se había dado de baja: vuelve (RESUSCRITO) con bienvenida si su prueba sigue; si ya venció, permiso sin bienvenida", function () {
  const E = entorno();
  E.principal.filas[3][14] = "UNSUBSCRIBED " + HOY + " 12:00 (era SUBSCRIBED_TRIAL " + HOY + " 09:00)";
  const r = doPost(E, formulario({ email: "c@x.com", phone: "+525533333333", wa_ok: "1" }));
  assert.strictEqual(r.result, "reactivated");
  assert.ok(E.principal.filas[3][14].indexOf("RESUSCRITO") === 0);
  assert.deepStrictEqual([E.principal.filas[3][3], E.principal.filas[3][17]], ["'+525533333333", "sí " + HOY]);
  assert.strictEqual(mensajes(E).length, 1);
  const F = entorno();   // se dio de baja el 1 de octubre: su prueba ya venció y vuelve sin envío esta semana
  assert.strictEqual(doPost(F, formulario({ email: "c@x.com", phone: "+525533333333", wa_ok: "1" })).result, "reactivated_capped");
  assert.strictEqual(F.principal.filas[3][17], "sí " + HOY, "el permiso se guarda");
  assert.strictEqual(mensajes(F).length, 0, "pero no hay bienvenida: no recibe los lunes");
});

prueba("el portón antibot no escribe nada aunque venga la casilla", function () {
  const E = entorno();
  const antes = J(E.principal.filas);
  assert.strictEqual(doPost(E, formulario({ wa_ok: "1", website: "spam" })).result, "new");
  assert.strictEqual(doPost(E, formulario({ wa_ok: "1", t0: String(Date.now()) })).result, "new");
  assert.deepStrictEqual(J(E.principal.filas), antes);
  assert.strictEqual(mensajes(E).length, 0);
});

console.log((process.exitCode ? "FALLÓ" : "Todo en verde") + ": " + pasadas + " pruebas pasadas.");
