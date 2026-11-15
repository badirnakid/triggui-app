/* ══════════════════ 💬 WHATSAPP DEL LUNES · API de Meta (V1) ══════════════════
 * Cada lunes, UNA plantilla por persona (la imagen de la vista previa, la frase y la liga de la
 * edición) y tres botones: «La tarjeta», «La melodía», «El video» (Niños: los dos primeros).
 * Las piezas las manda triggui.com/api/wa cuando la persona toca su botón, dentro de la
 * conversación que abre ese toque: sin plantilla, igual que la sala de envío.
 *
 * Solo a quien dijo que sí, con la MISMA elegibilidad del correo del lunes (listaWhatsApp_):
 *   columna «WhatsApp» de la hoja (encabezado exacto; la agrega Badir en la primera columna libre)
 *     «sí» (con o sin fecha) → plantilla de adultos  ·  «sí kids» → la de Niños  ·  «baja …» → nada
 *   triggui.com/api/wa escribe «baja AAAA-MM-DD» cuando alguien responde BAJA o STOP.
 *
 * Candados:
 *   · Nada sale si la propiedad WA_ACTIVO no dice «si». Primero waEnsayo(): cuenta y arma, no manda.
 *   · Si los elegibles pasan de WA_TOPE (60 si falta), no manda a nadie y avisa por correo.
 *   · Nunca dos veces la misma edición al mismo número (hoja «WA envíos»).
 *   · Un error de cuenta, de token, de plantilla o de cobro detiene el envío; uno de una persona, no.
 *
 * Propiedades del script (Configuración del proyecto › Propiedades del script; nunca en el código):
 *   WA_TOKEN        token del usuario del sistema con whatsapp_business_messaging
 *   WA_NUMERO_ID    identificador del número en la API (no es el número de teléfono)
 *   WA_ACTIVO       «si» para mandar de verdad
 *   WA_TOPE         máximo de personas por lunes (60 si falta)
 *   WA_PRUEBA_TEL   tu número con lada (52…), para waProbarConmigo()
 *   WA_PUENTE_CLAVE la misma clave que tiene triggui.com/api/wa en Vercel (32 caracteres o más)
 *   Para waCrearPlantillas(): WA_WABA_ID y WA_APP_ID.
 *   Opcionales: WA_VERSION (v26.0) · WA_IDIOMA_ES (es_MX) · WA_IDIOMA_EN (en_US) · WA_HORA (9)
 *
 * Usa del cartero: SHEET_NAME, UNSUBSCRIBE_COL, CONTENIDO_URL, DIAG_EMAIL, isRowUnsubscribed,
 * debeMarcarseExpired y leerIdiomaFila. El cartero llama a waPuente_ desde doPost (action=wa_puente).
 * ═══════════════════════════════════════════════════════════════════════════════ */

const WA_VERSION_DEF = "v26.0";
const WA_TOPE_DEF = 60;
const WA_HORA_DEF = 9;
const WA_PAUSA_MS = 300;
const WA_APP_BASE = "https://app.triggui.com/";
const WA_KIDS_URL = "https://raw.githubusercontent.com/badirnakid/triggui-content/main/contenido_kids.json";
const WA_MARCA = "?w=s&utm_content=lunes";        // la página la vuelve utm_source=whatsapp · utm_medium=sala
const WA_COL_PERMISO = "WHATSAPP";
const WA_HOJA_ENVIOS = "WA envíos";
const WA_HOJA_EVENTOS = "WA eventos";
const WA_ENC_ENVIOS = ["Fecha", "Edición", "Teléfono", "Nombre", "Idioma", "Catálogo", "wamid", "Resultado", "Detalle"];
const WA_ENC_EVENTOS = ["Fecha", "Tipo", "wamid", "Teléfono", "Valor", "Detalle"];
const WA_PLANTILLA_ADULTOS = "triggui_lunes";
const WA_PLANTILLA_NINOS = "triggui_lunes_ninos";

/* Las cuatro plantillas: la ÚNICA fuente de sus textos (waCrearPlantillas las manda a Meta así). */
const WA_PLANTILLAS = [
  { nombre: WA_PLANTILLA_ADULTOS, idioma: "es", cat: "adultos",
    cuerpo: "Tu libro de esta semana: *{{1}}*\n\n{{2}}\n\nÁbrelo aquí: https://app.triggui.com/{{3}}\n\nToca abajo y te mando la tarjeta, la melodía o el video.",
    pie: "Responde BAJA si ya no quieres recibirlo", botones: ["La tarjeta", "La melodía", "El video"] },
  { nombre: WA_PLANTILLA_ADULTOS, idioma: "en", cat: "adultos",
    cuerpo: "Your book this week: *{{1}}*\n\n{{2}}\n\nOpen it here: https://app.triggui.com/{{3}}\n\nTap below and I'll send you the card, the music or the video.",
    pie: "Reply STOP if you no longer want it", botones: ["The card", "The music", "The video"] },
  { nombre: WA_PLANTILLA_NINOS, idioma: "es", cat: "kids",
    cuerpo: "Para leer con tus niños esta semana: *{{1}}*\n\n{{2}}\n\nÁbrelo aquí: https://app.triggui.com/{{3}}\n\nToca abajo y te mando la tarjeta o la melodía.",
    pie: "Responde BAJA si ya no quieres recibirlo", botones: ["La tarjeta", "La melodía"] },
  { nombre: WA_PLANTILLA_NINOS, idioma: "en", cat: "kids",
    cuerpo: "To read with your kids this week: *{{1}}*\n\n{{2}}\n\nOpen it here: https://app.triggui.com/{{3}}\n\nTap below and I'll send you the card or the music.",
    pie: "Reply STOP if you no longer want it", botones: ["The card", "The music"] }
];

/* Errores de Meta que detienen el envío entero (de cuenta, token, permiso, plantilla, cobro o ritmo).
   Los demás (número que no recibe, tope de marketing de esa persona…) solo saltan a esa persona. */
const WA_ERRORES_FATALES = [1, 2, 3, 4, 10, 190, 200, 368, 80007, 130429, 131000, 131031, 131042,
  131048, 131057, 132000, 132001, 132005, 132007, 132012, 132015, 132016, 132018, 133010];

/* ─────────────────────────────── lo que corre Badir ─────────────────────────────── */

/** Cuenta y arma todo sin mandar nada ni escribir en la hoja. Córrelo antes de cada cambio. */
function waEnsayo() { return waCorrer_(true); }

/** El envío del lunes (lo llama el activador de waInstalarLunes). */
function waEnviarLunes() { return waCorrer_(false); }

/** Te manda a ti (WA_PRUEBA_TEL) la plantilla de esta semana. */
function waProbarConmigo() { return waProbar_("es", "adultos"); }
function waProbarConmigoEnIngles() { return waProbar_("en", "adultos"); }
function waProbarConmigoNinos() { return waProbar_("es", "kids"); }

/** Los activadores: el envío los lunes a WA_HORA (9) y el resumen a las 21. Es una tarea programada: pide el go de Badir. */
function waInstalarLunes() {
  const hora = parseInt(waProp_("WA_HORA", String(WA_HORA_DEF)), 10);
  const h = (isFinite(hora) && hora >= 6 && hora <= 20) ? hora : WA_HORA_DEF;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    const f = t.getHandlerFunction();
    if (f === "waEnviarLunes" || f === "waResumenDelLunes") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("waEnviarLunes").timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(h).create();
  ScriptApp.newTrigger("waResumenDelLunes").timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(21).create();
  Logger.log("Listo: envío los lunes entre las " + h + " y las " + (h + 1) + ", resumen entre las 21 y las 22.");
  return { ok: true, hora: h };
}

/** Quita los dos activadores. */
function waQuitarLunes() {
  let n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    const f = t.getHandlerFunction();
    if (f === "waEnviarLunes" || f === "waResumenDelLunes") { ScriptApp.deleteTrigger(t); n++; }
  });
  Logger.log("Quité " + n + " activador(es).");
  return { ok: true, quitados: n };
}

/* ─────────────────────────────── el envío ─────────────────────────────── */

function waCorrer_(ensayo) {
  const cfg = waConfig_();
  if (!ensayo) {
    if (!cfg.activo) return waAviso_("WA_ACTIVO no dice «si»: no mandé nada. Corre waEnsayo() para ver qué saldría.", true);
    if (!cfg.token || !cfg.numeroId) return waAviso_("Faltan WA_TOKEN o WA_NUMERO_ID: no mandé nada.", true);
  }
  const cache = CacheService.getScriptCache();
  if (!ensayo) {
    if (cache.get("wa_envio_en_curso")) return waAviso_("Ya hay un envío corriendo: no mandé nada.", true);
    cache.put("wa_envio_en_curso", "1", 1800);
  }
  try {
    const L = waPersonas_();
    const personas = L.personas;
    const resumen = { ensayo: ensayo, personas: personas.length, filtros: L.resumen, porIdioma: { es: 0, en: 0 },
      porCatalogo: { adultos: 0, kids: 0 }, aceptados: 0, yaTenian: 0, errores: 0, detenido: "", muestra: null };
    if (personas.length > cfg.tope) {
      return waAviso_("Son " + personas.length + " personas con «sí» y el tope es " + cfg.tope +
        ": no mandé a nadie. Revisa la columna WhatsApp o sube WA_TOPE.", !ensayo);
    }
    if (!personas.length) return waAviso_("Nadie tiene «sí» en la columna WhatsApp: no hay a quién mandar.", !ensayo);
    const ed = waEdiciones_(personas.some(function (p) { return p.cat === "kids"; }));
    const armados = personas.map(function (p) {
      const libro = ed[p.cat];
      const cuerpo = waPayload_(p, libro, cfg);
      resumen.porIdioma[cuerpo._lang]++;
      resumen.porCatalogo[p.cat]++;
      return { p: p, libro: libro, cuerpo: cuerpo };
    });
    if (ensayo) {
      const a = armados[0];
      const copia = JSON.parse(JSON.stringify(a.cuerpo));
      copia.to = waTapa_(copia.to);
      resumen.muestra = copia;
      Logger.log("Ensayo: " + JSON.stringify(resumen));
      return resumen;
    }
    const hoja = waHoja_(WA_HOJA_ENVIOS, WA_ENC_ENVIOS);
    const ya = {};
    for (let i = 0; i < armados.length; i++) {
      const a = armados[i];
      const slug = a.libro._slug;
      if (!ya[slug]) ya[slug] = waYaEnviados_(hoja, slug);
      if (ya[slug][a.p.clave]) { resumen.yaTenian++; continue; }
      const envio = Object.assign({}, a.cuerpo);
      delete envio._lang;
      const r = waMandar_(cfg, envio);
      hoja.appendRow([new Date(), slug, "'" + a.p.tel, a.p.nombre, a.cuerpo._lang, a.p.cat,
        r.ok ? r.wamid : "", r.ok ? "aceptado" : "error " + r.codigo, r.ok ? "" : r.detalle]);
      if (r.ok) { resumen.aceptados++; ya[slug][a.p.clave] = true; }
      else {
        resumen.errores++;
        if (waEsFatal_(r)) { resumen.detenido = (r.codigo || ("HTTP " + r.http)) + " · " + r.detalle; break; }
      }
      Utilities.sleep(WA_PAUSA_MS);
    }
    waCorreo_("Triggui WhatsApp: " + resumen.aceptados + " de " + resumen.personas + " este lunes",
      "Salieron: " + resumen.aceptados + " de " + resumen.personas + "\n" +
      "Ya la tenían de antes: " + resumen.yaTenian + "\n" +
      "Errores: " + resumen.errores + (resumen.detenido ? "\nSe detuvo: " + resumen.detenido : "") + "\n\n" +
      "Español: " + resumen.porIdioma.es + " · inglés: " + resumen.porIdioma.en + " · adultos: " + resumen.porCatalogo.adultos +
      " · Niños: " + resumen.porCatalogo.kids + "\nEl detalle está en la hoja «" + WA_HOJA_ENVIOS + "». A las 21 llega el resumen de entregados y leídos.");
    Logger.log("Envío: " + JSON.stringify(resumen));
    return resumen;
  } finally {
    if (!ensayo) cache.remove("wa_envio_en_curso");
  }
}

function waProbar_(lang, cat) {
  const cfg = waConfig_();
  if (!cfg.token || !cfg.numeroId || !cfg.pruebaTel) return waAviso_("Faltan WA_TOKEN, WA_NUMERO_ID o WA_PRUEBA_TEL.", false);
  const tel = waTel_(cfg.pruebaTel);
  if (!tel) return waAviso_("WA_PRUEBA_TEL no parece un número con lada (52…).", false);
  const ed = waEdiciones_(cat === "kids");
  const cuerpo = waPayload_({ tel: tel, clave: waClaveTel_(tel), lang: lang, cat: cat, nombre: "prueba" }, ed[cat], cfg);
  delete cuerpo._lang;
  const r = waMandar_(cfg, cuerpo);
  Logger.log(r.ok ? "Listo: revisa tu WhatsApp y toca los botones." : "No salió: " + (r.codigo || r.http) + " · " + r.detalle);
  return r;
}

/** Quiénes reciben: «sí» en la columna WhatsApp y la misma elegibilidad del correo del lunes. Solo lee. */
function waPersonas_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("No encuentro la hoja «" + SHEET_NAME + "».");
  const data = sheet.getDataRange().getValues();
  const col = waColumna_(data[0] || [], WA_COL_PERMISO);
  if (!col) throw new Error("Falta la columna «WhatsApp» en la hoja: agrégala en la primera columna libre y escribe «sí» en cada persona que te dio permiso.");
  const vistos = {};
  const personas = [];
  const r = { conSi: 0, sinTel: 0, telRaro: 0, baja: 0, unsub: 0, expirados: 0, repetidos: 0 };
  for (let i = 1; i < data.length; i++) {
    const permiso = waLeerPermiso_(data[i][col - 1]);
    if (permiso.baja) { r.baja++; continue; }
    if (!permiso.si) continue;
    r.conSi++;
    const crudo = String(data[i][3] || "");
    if (!crudo.replace(/\D/g, "")) { r.sinTel++; continue; }
    const tel = waTel_(crudo);
    if (!tel) { r.telRaro++; continue; }
    if (isRowUnsubscribed(data[i])) { r.unsub++; continue; }
    const status = String(data[i][UNSUBSCRIBE_COL - 1] || "").trim();
    if (status.startsWith("SUBSCRIBED_EXPIRED") || debeMarcarseExpired(data[i])) { r.expirados++; continue; }
    const clave = waClaveTel_(tel);
    if (vistos[clave]) { r.repetidos++; continue; }
    vistos[clave] = true;
    let lang = "es";
    try { lang = leerIdiomaFila(sheet, i + 1) || "es"; } catch (e) {}
    personas.push({ fila: i + 1, nombre: String(data[i][0] || "").trim(), tel: tel, clave: clave,
      lang: lang === "en" ? "en" : "es", cat: permiso.kids ? "kids" : "adultos" });
  }
  return { personas: personas, resumen: r };
}

/** La plantilla de una persona. _lang es solo para el resumen: se quita antes de mandar. */
function waPayload_(persona, libro, cfg) {
  const en = persona.lang === "en" && waTieneEn_(libro);
  const lang = en ? "en" : "es";
  const kids = persona.cat === "kids";
  const ruta = waRuta_(libro, persona.cat);
  const titulo = waLimpia_(en ? (libro.titulo_en || libro.titulo) : libro.titulo, 200) || libro._slug;
  const frases = (en ? libro.frases_en : libro.frases) || [];
  const frase = waLimpia_(frases[0], 500);
  const semilla = waSemilla_(persona.clave, libro);
  const mus = waMusica_(libro);
  const vid = kids ? [] : waVideos_(libro);
  const m = mus.length ? semilla % mus.length : 0;
  const v = vid.length ? Math.floor(semilla / 7) % vid.length : 0;
  const acciones = kids ? ["tarjeta", "melodia"] : ["tarjeta", "melodia", "video"];
  const botones = acciones.map(function (accion, i) {
    return { type: "button", sub_type: "quick_reply", index: String(i),
      parameters: [{ type: "payload", payload: ["tg1", accion, kids ? "k" : "a", libro._slug, lang, m, v].join("|") }] };
  });
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: persona.tel,
    type: "template",
    template: {
      name: kids ? WA_PLANTILLA_NINOS : WA_PLANTILLA_ADULTOS,
      language: { code: cfg.idioma[lang] },
      components: [
        { type: "header", parameters: [{ type: "image", image: { link: WA_APP_BASE + ruta + (en ? "og_en.jpg" : "og.jpg") } }] },
        { type: "body", parameters: [
          { type: "text", text: titulo },
          { type: "text", text: frase },
          { type: "text", text: ruta + (en ? "en/" : "") + WA_MARCA }
        ] }
      ].concat(botones)
    },
    _lang: lang
  };
}

function waMandar_(cfg, cuerpo) {
  const url = "https://graph.facebook.com/" + cfg.version + "/" + encodeURIComponent(cfg.numeroId) + "/messages";
  let resp;
  try {
    resp = UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", muteHttpExceptions: true,
      headers: { Authorization: "Bearer " + cfg.token }, payload: JSON.stringify(cuerpo) });
  } catch (e) {
    return { ok: false, http: 0, codigo: 0, detalle: "Sin conexión con Meta: " + String(e.message || e).slice(0, 200) };
  }
  const code = resp.getResponseCode();
  let j = {};
  try { j = JSON.parse(resp.getContentText("UTF-8") || "{}"); } catch (e) {}
  if (code === 200 && j.messages && j.messages[0] && j.messages[0].id) return { ok: true, wamid: String(j.messages[0].id) };
  const err = j.error || {};
  return { ok: false, http: code, codigo: Number(err.code) || 0, detalle: String(err.message || ("HTTP " + code)).slice(0, 300) };
}

function waEsFatal_(r) {
  if (r.http === 0 || r.http === 401 || r.http === 403 || r.http >= 500) return true;
  return WA_ERRORES_FATALES.indexOf(Number(r.codigo)) !== -1;
}

/* ─────────────────────────────── el resumen de la noche ─────────────────────────────── */

/** Entregados, leídos, fallidos, botones y bajas de lo que salió hoy. Lo llama el activador de las 21. */
function waResumenDelLunes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const envios = ss.getSheetByName(WA_HOJA_ENVIOS);
  if (!envios) return waAviso_("Todavía no hay hoja «" + WA_HOJA_ENVIOS + "»: no hubo envío.", false);
  const tz = Session.getScriptTimeZone();
  const hoy = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
  const deHoy = function (f) { return f instanceof Date && Utilities.formatDate(f, tz, "yyyy-MM-dd") === hoy; };
  const wamids = {};
  let enviados = 0;
  envios.getDataRange().getValues().slice(1).forEach(function (f) {
    if (deHoy(f[0]) && String(f[7]) === "aceptado" && f[6]) { wamids[String(f[6])] = "aceptado"; enviados++; }
  });
  const orden = { aceptado: 0, sent: 1, delivered: 2, read: 3, failed: 4 };
  const botones = { tarjeta: 0, melodia: 0, video: 0 };
  let bajas = 0;
  const ev = ss.getSheetByName(WA_HOJA_EVENTOS);
  if (ev) ev.getDataRange().getValues().slice(1).forEach(function (f) {
    if (!deHoy(f[0])) return;
    const tipo = String(f[1]);
    if (tipo === "estado" && wamids[String(f[2])] !== undefined) {
      const actual = wamids[String(f[2])], nuevo = String(f[4]);
      if ((orden[nuevo] || 0) > (orden[actual] || 0)) wamids[String(f[2])] = nuevo;
    } else if (tipo === "boton" && botones[String(f[4])] !== undefined) botones[String(f[4])]++;
    else if (tipo === "baja") bajas++;
  });
  const cuenta = { aceptado: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
  Object.keys(wamids).forEach(function (k) { cuenta[wamids[k]]++; });
  const r = { enviados: enviados, entregados: cuenta.delivered + cuenta.read, leidos: cuenta.read, fallidos: cuenta.failed,
    sinNoticia: cuenta.aceptado + cuenta.sent, botones: botones, bajas: bajas };
  waCorreo_("Triggui WhatsApp: el resumen del lunes",
    "Salieron: " + r.enviados + "\nEntregados: " + r.entregados + "\nLeídos: " + r.leidos +
    " (solo cuentan quienes tienen activado el aviso de leído)\nFallidos: " + r.fallidos + "\nSin noticia todavía: " + r.sinNoticia +
    "\n\nBotones: tarjeta " + botones.tarjeta + " · melodía " + botones.melodia + " · video " + botones.video +
    "\nBajas: " + bajas + "\n\nLas visitas a la edición se ven en Analytics: fuente whatsapp, contenido lunes.");
  Logger.log("Resumen: " + JSON.stringify(r));
  return r;
}

/* ─────────────────────────────── el puente con triggui.com/api/wa ─────────────────────────────── */

/** doPost(action=wa_puente): baja, estado de un mensaje o botón tocado. Lo manda triggui.com/api/wa con la clave. */
function waPuente_(p) {
  const clave = String(PropertiesService.getScriptProperties().getProperty("WA_PUENTE_CLAVE") || "");
  if (clave.length < 32 || !waIguales_(String((p && p.clave) || ""), clave)) return { ok: false, error: "clave" };
  const tipo = String(p.tipo || "");
  const tel = waTel_(p.tel);
  if (tipo === "baja") {
    if (!tel) return { ok: false, error: "tel" };
    const motivo = String(p.motivo || "BAJA").slice(0, 60);
    const n = waMarcarBaja_(waClaveTel_(tel), motivo);
    waHoja_(WA_HOJA_EVENTOS, WA_ENC_EVENTOS).appendRow([new Date(), "baja", "", "'" + tel, motivo, n + " fila(s)"]);
    return { ok: n > 0, filas: n, error: n > 0 ? "" : "sin_fila" };
  }
  if (tipo === "estado") {
    const wamid = String(p.wamid || "").slice(0, 200);
    if (!/^wamid\./.test(wamid)) return { ok: false, error: "wamid" };
    const estado = String(p.estado || "").slice(0, 20);
    if (["sent", "delivered", "read", "failed"].indexOf(estado) === -1) return { ok: false, error: "estado" };
    const codigo = String(p.codigo || "").slice(0, 12);
    waHoja_(WA_HOJA_EVENTOS, WA_ENC_EVENTOS).appendRow([new Date(), "estado", wamid, tel ? "'" + tel : "", estado,
      (codigo ? codigo + " · " : "") + String(p.detalle || "").slice(0, 200)]);
    if (estado === "failed" && codigo === "131050" && tel) waMarcarBaja_(waClaveTel_(tel), "dejó de recibir marketing");
    return { ok: true };
  }
  if (tipo === "boton") {
    const accion = String(p.accion || "");
    if (["tarjeta", "melodia", "video"].indexOf(accion) === -1 || !tel) return { ok: false, error: "boton" };
    waHoja_(WA_HOJA_EVENTOS, WA_ENC_EVENTOS).appendRow([new Date(), "boton", String(p.wamid || "").slice(0, 200), "'" + tel,
      accion, String(p.slug || "").replace(/[^a-z0-9-]/g, "").slice(0, 120)]);
    return { ok: true };
  }
  return { ok: false, error: "tipo" };
}

/** Escribe «baja AAAA-MM-DD» en la columna WhatsApp de cada fila con ese número. Devuelve cuántas. */
function waMarcarBaja_(clave, motivo) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet || !clave) return 0;
  const data = sheet.getDataRange().getValues();
  const col = waColumna_(data[0] || [], WA_COL_PERMISO);
  if (!col) return 0;
  const fecha = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const texto = "baja " + fecha + (motivo && motivo !== "BAJA" ? " (" + motivo + ")" : "");
  let n = 0;
  for (let i = 1; i < data.length; i++) {
    if (waClaveTel_(data[i][3]) === clave) { sheet.getRange(i + 1, col).setValue(texto); n++; }
  }
  return n;
}

/* ─────────────────────────────── las plantillas en Meta ─────────────────────────────── */

/** Manda las cuatro plantillas a revisión en la cuenta WA_WABA_ID (la de prueba o la de Triggui).
 *  Es un envío de formulario a Meta: pide el go de Badir. Con muestras de la edición de esta semana. */
function waCrearPlantillas() {
  const cfg = waConfig_();
  if (!cfg.token || !cfg.wabaId || !cfg.appId) return waAviso_("Faltan WA_TOKEN, WA_WABA_ID o WA_APP_ID.", false);
  const ed = waEdiciones_(true);
  const handles = {};
  const resultados = [];
  WA_PLANTILLAS.forEach(function (def) {
    const libro = ed[def.cat];
    const muestra = waPayload_({ tel: "520000000000", clave: "520000000000", lang: def.idioma, cat: def.cat, nombre: "" }, libro, cfg);
    const og = muestra.template.components[0].parameters[0].image.link;
    if (!handles[og]) handles[og] = waSubirMuestra_(cfg, og);
    const cuerpoMuestra = muestra.template.components[1].parameters.map(function (x) { return x.text; });
    const def2 = waDefinicionPlantilla_(def, cfg, handles[og], cuerpoMuestra);
    const resp = UrlFetchApp.fetch("https://graph.facebook.com/" + cfg.version + "/" + encodeURIComponent(cfg.wabaId) + "/message_templates", {
      method: "post", contentType: "application/json", muteHttpExceptions: true,
      headers: { Authorization: "Bearer " + cfg.token }, payload: JSON.stringify(def2) });
    let j = {};
    try { j = JSON.parse(resp.getContentText("UTF-8") || "{}"); } catch (e) {}
    resultados.push({ plantilla: def.nombre, idioma: def2.language, http: resp.getResponseCode(),
      id: j.id || "", estado: j.status || "", error: (j.error && j.error.message) || "" });
  });
  Logger.log("Plantillas: " + JSON.stringify(resultados));
  return resultados;
}

function waDefinicionPlantilla_(def, cfg, handle, cuerpoMuestra) {
  return {
    name: def.nombre,
    language: cfg.idioma[def.idioma],
    category: "MARKETING",
    components: [
      { type: "HEADER", format: "IMAGE", example: { header_handle: [handle] } },
      { type: "BODY", text: def.cuerpo, example: { body_text: [cuerpoMuestra] } },
      { type: "FOOTER", text: def.pie },
      { type: "BUTTONS", buttons: def.botones.map(function (t) { return { type: "QUICK_REPLY", text: t }; }) }
    ]
  };
}

/** Sube la imagen de muestra con la API de subida reanudable de Meta y devuelve su identificador. */
function waSubirMuestra_(cfg, url) {
  const img = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (img.getResponseCode() !== 200) throw new Error("No pude bajar la imagen de muestra: HTTP " + img.getResponseCode());
  const bytes = img.getBlob().getBytes();
  const sesion = UrlFetchApp.fetch("https://graph.facebook.com/" + cfg.version + "/" + encodeURIComponent(cfg.appId) + "/uploads" +
    "?file_name=muestra.jpg&file_length=" + bytes.length + "&file_type=image%2Fjpeg", {
    method: "post", muteHttpExceptions: true, headers: { Authorization: "Bearer " + cfg.token } });
  const s = JSON.parse(sesion.getContentText("UTF-8") || "{}");
  if (!s.id) throw new Error("Meta no abrió la subida: " + ((s.error && s.error.message) || ("HTTP " + sesion.getResponseCode())));
  const subida = UrlFetchApp.fetch("https://graph.facebook.com/" + cfg.version + "/" + s.id, {
    method: "post", muteHttpExceptions: true, contentType: "application/octet-stream",
    headers: { Authorization: "OAuth " + cfg.token, file_offset: "0" }, payload: bytes });
  const h = JSON.parse(subida.getContentText("UTF-8") || "{}");
  if (!h.h) throw new Error("Meta no aceptó la imagen: " + ((h.error && h.error.message) || ("HTTP " + subida.getResponseCode())));
  return h.h;
}

/* ─────────────────────────────── piezas pequeñas ─────────────────────────────── */

function waProp_(k, def) {
  const v = PropertiesService.getScriptProperties().getProperty(k);
  return (v === null || v === undefined || String(v).trim() === "") ? def : String(v).trim();
}

function waConfig_() {
  const tope = parseInt(waProp_("WA_TOPE", String(WA_TOPE_DEF)), 10);
  return {
    token: waProp_("WA_TOKEN", ""),
    numeroId: waProp_("WA_NUMERO_ID", ""),
    version: /^v\d{2}\.\d$/.test(waProp_("WA_VERSION", "")) ? waProp_("WA_VERSION", "") : WA_VERSION_DEF,
    activo: waSinAcentos_(waProp_("WA_ACTIVO", "")).toLowerCase() === "si",
    tope: (isFinite(tope) && tope > 0) ? tope : WA_TOPE_DEF,
    idioma: { es: waProp_("WA_IDIOMA_ES", "es_MX"), en: waProp_("WA_IDIOMA_EN", "en_US") },
    pruebaTel: waProp_("WA_PRUEBA_TEL", ""),
    wabaId: waProp_("WA_WABA_ID", ""),
    appId: waProp_("WA_APP_ID", "")
  };
}

function waSinAcentos_(s) { return String(s == null ? "" : s).normalize("NFD").replace(/\p{M}/gu, ""); }

/** «sí», «si 2026-11-15», «Sí, kids» → recibe; «baja …» → no; vacío o cualquier otra cosa → no. */
function waLeerPermiso_(valor) {
  const t = waSinAcentos_(valor).toLowerCase().trim();
  if (/^baja\b/.test(t)) return { si: false, baja: true, kids: false };
  if (/^si\b/.test(t)) return { si: true, baja: false, kids: /\b(kids|ninos)\b/.test(t) };
  return { si: false, baja: false, kids: false };
}

/** Para mandar: solo dígitos con lada. 10 dígitos = México; 044/045 + 10 = celular viejo de México; 00 = salida internacional. */
function waTel_(raw) {
  let d = String(raw == null ? "" : raw).replace(/\D/g, "");
  if (/^00\d{10,15}$/.test(d)) d = d.slice(2);
  if (/^04[45]\d{10}$/.test(d)) d = d.slice(3);
  if (/^\d{10}$/.test(d)) d = "52" + d;
  return /^[1-9]\d{10,14}$/.test(d) ? d : "";
}

/** Para comparar: México con y sin el «1» de antes son el mismo número. */
function waClaveTel_(raw) {
  const d = waTel_(raw);
  return /^521\d{10}$/.test(d) ? "52" + d.slice(3) : d;
}

function waTapa_(tel) { const d = String(tel || ""); return d.length > 4 ? d.slice(0, 2) + "…" + d.slice(-2) : "…"; }

/** Sin saltos de línea ni tabuladores ni más de un espacio seguido: Meta los rechaza en los parámetros. */
function waLimpia_(t, max) {
  let s = String(t == null ? "" : t).replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  if (max && s.length > max) s = s.slice(0, max - 1).trim() + "…";
  return s;
}

function waColumna_(encabezados, nombre) {
  for (let j = 0; j < encabezados.length; j++) {
    if (waSinAcentos_(encabezados[j]).trim().toUpperCase() === nombre) return j + 1;
  }
  return 0;
}

function waRuta_(libro, cat) { return (cat === "kids" ? "kids/t/" : "t/") + libro._slug + "/"; }
function waTieneEn_(libro) { return !!(libro && libro.tarjeta_en && (libro.frases_en || []).length); }
function waMusica_(libro) { return ((libro._musica || {}).candidatos || []).filter(function (c) { return c && c.preview; }).slice(0, 3); }
function waVideos_(libro) { return ((libro._video || {}).candidatos || []).filter(function (c) { return c && c.id; }).slice(0, 3); }

/** La misma semilla del correo (semillaMedios_), con el número en lugar del correo: cada quien su melodía y su video. */
function waSemilla_(clave, libro) {
  const s = String(clave || "") + "|" + String((libro && libro._edicion_numero) || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

function waLeerLibros_(url) {
  const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (resp.getResponseCode() !== 200) throw new Error("HTTP " + resp.getResponseCode() + " al leer " + url);
  const json = JSON.parse(resp.getContentText("UTF-8"));
  return Array.isArray(json && json.libros) ? json.libros : [];
}

/** libros[0] de cada catálogo, como el cartero y la sala. */
function waEdiciones_(conKids) {
  const ed = { adultos: waLeerLibros_(CONTENIDO_URL)[0] || null, kids: conKids ? (waLeerLibros_(WA_KIDS_URL)[0] || null) : null };
  ["adultos"].concat(conKids ? ["kids"] : []).forEach(function (cat) {
    const b = ed[cat];
    if (!b || !/^[a-z0-9-]{1,120}$/.test(String(b._slug || "")) || !(b.frases || []).length || !b.titulo) {
      throw new Error("La edición de " + cat + " no trae slug, título o frases: no mandé nada.");
    }
  });
  return ed;
}

function waHoja_(nombre, encabezados) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(nombre);
  if (!h) { h = ss.insertSheet(nombre); h.appendRow(encabezados); h.setFrozenRows(1); }
  return h;
}

function waYaEnviados_(hoja, slug) {
  const s = {};
  hoja.getDataRange().getValues().slice(1).forEach(function (f) {
    if (String(f[1]) === slug && String(f[7]) === "aceptado") s[waClaveTel_(f[2])] = true;
  });
  return s;
}

function waIguales_(a, b) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

function waCorreo_(asunto, texto) {
  try { MailApp.sendEmail(DIAG_EMAIL, asunto, texto); } catch (e) { Logger.log("No pude mandar el correo: " + e.message); }
}

function waAviso_(texto, conCorreo) {
  Logger.log(texto);
  if (conCorreo) waCorreo_("Triggui WhatsApp: no salió", texto);
  return { ok: false, aviso: texto };
}
