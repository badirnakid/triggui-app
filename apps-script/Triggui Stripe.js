/* ══════════════════ 💳 STRIPE · los pagos de Triggui sin intervención (V1) ══════════════════
 * triggui.com/api/stripe recibe los avisos firmados de Stripe, se queda solo con los de Triggui (por su monto)
 * y los pasa aquí por el puente (doPost, action=stripe_puente, con la clave STRIPE_PUENTE_CLAVE):
 *
 *   alta        pago completado (o factura de alta pagada): la fila queda como miembro de $149
 *               (SUBSCRIBED_MEMBER) o de $129 (SUBSCRIBED_MEMBER_129), con su fecha.
 *               Si la fila no existe, se crea (source «stripe») y recibe la bienvenida con el libro de la
 *               semana. Si ya existía, recibe el correo «Ya eres miembro». Si dio permiso de WhatsApp
 *               («sí» en la columna WhatsApp), también la bienvenida por WhatsApp (una vez por número).
 *   renovacion  la factura del mes (o de un cambio de plan) pagada: se guarda el cliente de Stripe en la fila
 *               (así se encuentra cuando cancele); si cambió de plan, se corrige su tope; si no estaba como
 *               miembro, vuelve a serlo. Una baja del correo (UNSUBSCRIBED) no se toca: se le avisa a Badir.
 *               Un aviso atrasado de una suscripción ya cancelada no la revive.
 *   baja        la suscripción terminó, quedó sin pagar o se pausó: la fila deja de ser miembro
 *               (SUBSCRIBED_EXPIRED, con el motivo), así que ya no recibe correo ni WhatsApp.
 *   fallo       un cobro no pasó: aviso a Badir.
 *   ajeno       una suscripción nueva en Stripe con un monto que no es de Triggui (la cuenta también cobra los
 *               servicios de Trestme): no se toca la hoja; solo se le avisa a Badir, por si era de Triggui.
 *
 * Reglas:
 *   · Cada aviso se atiende una sola vez (hoja «Stripe eventos»); uno repetido contesta ok sin hacer nada.
 *   · Lo que no se puede resolver solo (sin correo, sin fila) le llega a Badir por correo, queda anotado
 *     y se contesta como definitivo: Stripe no lo repite.
 *   · Una falla a medio camino (hojas, correo) no se anota: se contesta como pasajera y Stripe repite el aviso.
 *     El reintento termina lo que faltó (el correo al cliente, la bienvenida, el aviso a Badir), porque el atajo
 *     «ya era miembro» solo vale cuando el alta de esa suscripción quedó anotada como ok.
 *
 * Columna «Stripe» (nace sola en la primera columna libre): «cus_… · sub_…».
 * Propiedad del script: STRIPE_PUENTE_CLAVE (la misma que en Vercel; 32 caracteres o más).
 * Usa del cartero: SHEET_NAME, UNSUBSCRIBE_COL, DIAG_EMAIL, REMITENTE_DISPLAY_NAME, REMITENTE_REPLY_TO,
 * parseEmailsFromCell, isRowUnsubscribed, enviarTrigguiAUno, recordSend, leerIdiomaFila y sanitizarNombre.
 * Y del módulo de WhatsApp: waHoja_, waColumna_, waLeerPermiso_, waBienvenida_ y waIguales_.
 * ══════════════════════════════════════════════════════════════════════════════════════════ */

const STRIPE_HOJA_EVENTOS = "Stripe eventos";
const STRIPE_ENC_EVENTOS = ["Fecha", "Evento", "Tipo", "Cliente", "Suscripción", "Correo", "Resultado", "Detalle"];
const STRIPE_COL = "STRIPE";
const STRIPE_TIPOS = ["alta", "renovacion", "baja", "fallo", "ajeno"];
const STRIPE_MOTIVOS_BAJA = { cancelada: "canceló en Stripe", sin_pago: "quedó sin pagar en Stripe", pausada: "pausó en Stripe" };

/** doPost(action=stripe_puente). Devuelve { ok, error?, detalle? } para triggui.com/api/stripe. */
function stripePuente_(p) {
  const clave = String(PropertiesService.getScriptProperties().getProperty("STRIPE_PUENTE_CLAVE") || "");
  if (clave.length < 32 || !waIguales_(String((p && p.clave) || ""), clave)) return { ok: false, error: "clave" };
  const evento = String(p.evento || "");
  if (!/^evt_[A-Za-z0-9]{8,}$/.test(evento)) return { ok: false, error: "evento" };
  const tipo = String(p.tipo || "");
  if (STRIPE_TIPOS.indexOf(tipo) === -1) return { ok: false, error: "tipo" };
  const d = {
    tipo: tipo,
    evento: evento,
    email: String(p.email || "").trim().toLowerCase(),
    nombre: String(p.nombre || "").replace(/\s+/g, " ").trim().slice(0, 80),
    tel: String(p.tel || "").replace(/[^\d+]/g, "").slice(0, 20),
    cliente: /^cus_[A-Za-z0-9]{4,}$/.test(String(p.cliente || "")) ? String(p.cliente) : "",
    suscripcion: /^sub_[A-Za-z0-9]{4,}$/.test(String(p.suscripcion || "")) ? String(p.suscripcion) : "",
    plan: ["149", "129"].indexOf(String(p.plan || "")) !== -1 ? String(p.plan) : "otro",
    motivo: STRIPE_MOTIVOS_BAJA[String(p.motivo || "")] ? String(p.motivo) : "cancelada",
    monto: String(p.monto || "").replace(/[^\d.]/g, "").slice(0, 12),
    moneda: String(p.moneda || "").replace(/[^a-z]/gi, "").toUpperCase().slice(0, 3),
    intento: String(p.intento || "").replace(/\D/g, "").slice(0, 3),
    siguiente: String(p.siguiente || "").replace(/[^\d-]/g, "").slice(0, 10)
  };
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) d.email = "";
  let bitacora, r;
  try {
    bitacora = waHoja_(STRIPE_HOJA_EVENTOS, STRIPE_ENC_EVENTOS);
    const previos = bitacora.getDataRange().getValues().slice(1);
    if (previos.some(function (f) { return String(f[1]) === evento; })) return { ok: true, repetido: true };
    if (tipo === "alta") r = stripeAlta_(d, previos);
    else if (tipo === "renovacion") r = stripeRenovacion_(d);
    else if (tipo === "baja") r = stripeBaja_(d);
    else if (tipo === "fallo") r = stripeFallo_(d);
    else r = stripeAjeno_(d);
  } catch (e) {
    Logger.log("Stripe " + tipo + " " + evento + ": " + (e && e.message));
    return { ok: false, error: "" };   // sin nombre de error: triggui.com lo toma como pasajero y Stripe lo repite
  }
  try {
    bitacora.appendRow([new Date(), evento, tipo, d.cliente, d.suscripcion, d.email, r.ok ? "ok" : r.error, String(r.detalle || "").slice(0, 300)]);
  } catch (e) { Logger.log("Stripe: no pude anotar " + evento + ": " + (e && e.message)); }
  return r;
}

/* ─────────────────────────────── los avisos ─────────────────────────────── */

function stripeAlta_(d, previos) {
  if (!d.email) return stripeAvisar_({ ok: false, error: "sin_correo" },
    "Llegó un pago de Triggui sin correo (" + d.evento + "). Búscalo en Stripe y márcalo a mano.");
  const sheet = stripeHoja_();
  const data = sheet.getDataRange().getValues();
  const colS = stripeColumna_(sheet, data[0] || []);
  const estado = d.plan === "129" ? "SUBSCRIBED_MEMBER_129" : "SUBSCRIBED_MEMBER";
  const etiqueta = d.plan === "129" ? "$129" : "$149";
  const marca = stripeMarca_(d);
  const fila = stripeFilaPorCorreo_(data, d.email);
  const otro = d.plan === "otro" ? " El monto (" + d.monto + " " + d.moneda + ") no es de $149 ni de $129: la marqué como miembro de $149; revísalo." : "";

  if (!fila) {
    const partes = d.nombre.split(" ");
    sheet.appendRow([partes[0] || "", partes.slice(1).join(" "), d.email, d.tel ? "'" + d.tel : "", "stripe", new Date(),
      "", "", "", "", "", "", "", "", estado + " " + stripeHoy_() + " (pagó en Stripe)", ""]);
    const nueva = sheet.getLastRow();
    if (marca) sheet.getRange(nueva, colS).setValue(marca);
    const envio = enviarTrigguiAUno(d.email, nueva, partes[0] || "");
    const salio = !!(envio && envio.ok);
    if (salio) recordSend(sheet, nueva);
    const motivo = (envio && envio.reason) || "sin motivo";
    return stripeAvisar_({ ok: true, detalle: "nueva fila " + nueva + (salio ? "; bienvenida" : "; sin bienvenida: " + motivo) },
      "Nuevo miembro de Triggui (" + etiqueta + "): " + d.email + ". No estaba en la hoja: quedó en la fila " + nueva +
      (salio ? " y le mandé la bienvenida con el libro de la semana." : ". No pude mandarle la bienvenida con el libro de la semana (" +
        motivo + "); le llega con el envío del lunes.") + otro);
  }

  const previo = String(data[fila - 1][UNSUBSCRIBE_COL - 1] || "").trim();
  const yaTieneEstado = stripeEsEstado_(previo, estado);
  const altaAnotada = !!d.suscripcion && previos.some(function (f) {
    return String(f[2]) === "alta" && String(f[4]) === d.suscripcion && String(f[6]) === "ok";
  });
  if (yaTieneEstado && (altaAnotada || !d.suscripcion)) {
    if (marca && String(data[fila - 1][colS - 1] || "") !== marca) sheet.getRange(fila, colS).setValue(marca);
    return { ok: true, detalle: "ya era miembro" };   // el mismo pago avisado dos veces (sesión y factura)
  }
  // Si ya tiene el estado (un intento anterior lo escribió y falló después), no se reescribe: se termina lo que faltó.
  if (!yaTieneEstado) sheet.getRange(fila, UNSUBSCRIBE_COL).setValue(estado + " " + stripeHoy_() + " (pagó en Stripe; era " + previo.slice(0, 60) + ")");
  if (marca) sheet.getRange(fila, colS).setValue(marca);
  let lang = "es";
  try { lang = leerIdiomaFila(sheet, fila) || "es"; } catch (e) {}
  const correo = stripeCorreoMiembro_(d.email, String(data[fila - 1][0] || ""), lang);
  let whatsapp = "sin permiso de WhatsApp";
  const colWa = waColumna_(data[0] || [], WA_COL_PERMISO);
  if (colWa && waLeerPermiso_(data[fila - 1][colWa - 1]).si) whatsapp = "WhatsApp: " + waBienvenida_(data[fila - 1][3], lang, data[fila - 1][0], perfilDeFila_(data[fila - 1], data[0] || [])).motivo;
  return stripeAvisar_({ ok: true, detalle: "fila " + fila + "; correo " + (correo ? "mandado" : "sin cuota") + "; " + whatsapp },
    "Nuevo miembro de Triggui (" + etiqueta + "): " + d.email + " (fila " + fila + ", antes «" + (previo || "sin estado") + "»)." + otro +
    (correo ? "" : " No había cuota de correo para su «Ya eres miembro»."));
}

function stripeRenovacion_(d) {
  const sheet = stripeHoja_();
  const data = sheet.getDataRange().getValues();
  const colS = stripeColumna_(sheet, data[0] || []);
  const fila = (d.cliente && stripeFilaPorCliente_(data, colS, d.cliente)) || (d.email && stripeFilaPorCorreo_(data, d.email)) || 0;
  if (!fila) return stripeAvisar_({ ok: false, error: "sin_fila" },
    "Se renovó una suscripción de Triggui y no encontré su fila: " + (d.email || "sin correo") + " (" + (d.cliente || "sin cliente") +
    "). Agrégala o corrige su correo en la hoja.");
  const previo = String(data[fila - 1][UNSUBSCRIBE_COL - 1] || "").trim();
  const marcaPrevia = String(data[fila - 1][colS - 1] || "");
  if (stripeEsEstado_(previo, "SUBSCRIBED_EXPIRED") && previo.indexOf("(" + STRIPE_MOTIVOS_BAJA.cancelada) !== -1 &&
      d.suscripcion && marcaPrevia.indexOf(d.suscripcion) !== -1) {
    return { ok: true, detalle: "fila " + fila + "; aviso atrasado de una suscripción cancelada" };   // no la revive
  }
  const marca = stripeMarca_(d);
  if (marca && marcaPrevia !== marca) sheet.getRange(fila, colS).setValue(marca);
  const quien = d.email || d.cliente;
  if (stripeEsMiembro_(previo)) {
    const es129 = stripeEsEstado_(previo, "SUBSCRIBED_MEMBER_129");
    if (d.plan === "otro" || (d.plan === "129") === es129) return { ok: true, detalle: "fila " + fila + "; sigue como miembro" };
    const nuevo = d.plan === "129" ? "SUBSCRIBED_MEMBER_129" : "SUBSCRIBED_MEMBER";
    sheet.getRange(fila, UNSUBSCRIBE_COL).setValue(nuevo + " " + stripeHoy_() + " (cambió de plan en Stripe; era " + previo.slice(0, 60) + ")");
    return stripeAvisar_({ ok: true, detalle: "fila " + fila + "; cambió a $" + d.plan },
      "Triggui: " + quien + " cambió de plan: ahora es miembro de $" + d.plan + " (fila " + fila + ").");
  }
  if (isRowUnsubscribed(data[fila - 1])) return stripeAvisar_({ ok: true, detalle: "fila " + fila + "; dada de baja del correo" },
    "Triggui: " + quien + " pagó su suscripción, pero se dio de baja del correo (fila " + fila + "). No le cambié nada: decide tú.");
  const estado = d.plan === "129" ? "SUBSCRIBED_MEMBER_129" : "SUBSCRIBED_MEMBER";
  sheet.getRange(fila, UNSUBSCRIBE_COL).setValue(estado + " " + stripeHoy_() + " (renovó en Stripe; era " + previo.slice(0, 60) + ")");
  return stripeAvisar_({ ok: true, detalle: "fila " + fila + "; vuelve a ser miembro" },
    "Triggui: " + quien + " pagó su suscripción y no estaba como miembro (fila " + fila + ", «" + (previo || "sin estado") + "»). Ya lo está.");
}

function stripeBaja_(d) {
  const sheet = stripeHoja_();
  const data = sheet.getDataRange().getValues();
  const colS = stripeColumna_(sheet, data[0] || []);
  const fila = (d.cliente && stripeFilaPorCliente_(data, colS, d.cliente)) || (d.email && stripeFilaPorCorreo_(data, d.email)) || 0;
  const que = STRIPE_MOTIVOS_BAJA[d.motivo];
  if (!fila) return stripeAvisar_({ ok: false, error: "sin_fila" },
    "Una suscripción en Stripe " + que.replace(" en Stripe", "") + " (" + (d.cliente || "sin cliente") + (d.email ? ", " + d.email : "") +
    ") y no está en la hoja de Triggui. Si era de Triggui, quítale el estado de miembro a mano; si es de Trestme, no hay nada que hacer.");
  const marcaPrevia = String(data[fila - 1][colS - 1] || "");
  const subPrevia = (/sub_[A-Za-z0-9]+/.exec(marcaPrevia) || [""])[0];
  if (d.suscripcion && subPrevia && subPrevia !== d.suscripcion) return stripeAvisar_({ ok: true, detalle: "fila " + fila + "; tiene otra suscripción" },
    "Triggui: la suscripción " + d.suscripcion + " de la fila " + fila + " " + que.replace(" en Stripe", "") + ", pero su suscripción vigente es otra (" +
    subPrevia + "). No le cambié nada.");
  const previo = String(data[fila - 1][UNSUBSCRIBE_COL - 1] || "").trim();
  if (!stripeEsMiembro_(previo)) return { ok: true, detalle: "fila " + fila + "; no era miembro" };
  sheet.getRange(fila, UNSUBSCRIBE_COL).setValue("SUBSCRIBED_EXPIRED " + stripeHoy_() + " (" + que + "; era " + previo.slice(0, 60) + ")");
  const correo = String(data[fila - 1][2] || "").trim();
  return stripeAvisar_({ ok: true, detalle: "fila " + fila + "; ya no es miembro (" + d.motivo + ")" },
    "Triggui: " + (correo || d.cliente) + " ya no es miembro: " + que + " (fila " + fila + "). Ya no le llega correo ni WhatsApp.");
}

function stripeFallo_(d) {
  const despues = /^\d{4}-\d{2}-\d{2}$/.test(d.siguiente) ? "Stripe lo vuelve a intentar el " + d.siguiente + "."
    : "Stripe no tiene otro intento programado: revísalo en Stripe.";
  return stripeAvisar_({ ok: true, detalle: "aviso a Badir" },
    "Triggui: no pasó el cobro de " + (d.email || d.cliente || "un cliente sin correo") + " (" + (d.monto || "?") + " " + (d.moneda || "") +
    (d.intento ? ", intento " + d.intento : "") + "). " + despues);
}

function stripeAjeno_(d) {
  return stripeAvisar_({ ok: true, detalle: "no es de Triggui: no se tocó la hoja" },
    "Llegó una suscripción nueva en Stripe por " + (d.monto || "?") + " " + (d.moneda || "") + " (" + (d.email || d.cliente || "sin correo") +
    "). No es un monto de Triggui, así que no toqué la hoja. Si es de Triggui (por ejemplo, un precio nuevo), agrega ese monto a " +
    "STRIPE_TRIGGUI_MONTOS en Vercel y márcala a mano.");
}

/* ─────────────────────────────── piezas pequeñas ─────────────────────────────── */

function stripeHoja_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error("No encuentro la hoja «" + SHEET_NAME + "».");
  return sheet;
}

/** La columna «Stripe»; si no existe, nace en la primera columna libre. */
function stripeColumna_(sheet, encabezados) {
  const col = waColumna_(encabezados, STRIPE_COL);
  if (col) return col;
  const nueva = Math.max(encabezados.length, sheet.getLastColumn()) + 1;
  sheet.getRange(1, nueva).setValue("Stripe");
  return nueva;
}

/** ¿Es ese estado exacto? «SUBSCRIBED_MEMBER» ($149) no incluye «SUBSCRIBED_MEMBER_129». */
function stripeEsEstado_(estadoFila, estado) {
  const e = String(estadoFila || "").trim().toUpperCase();
  if (e.indexOf(estado) !== 0) return false;
  return !(estado === "SUBSCRIBED_MEMBER" && e.indexOf("SUBSCRIBED_MEMBER_129") === 0);
}

/** ¿Es miembro, de $149 o de $129? (como isRowSubscribedMember del cartero) */
function stripeEsMiembro_(estadoFila) { return String(estadoFila || "").trim().toUpperCase().indexOf("SUBSCRIBED_MEMBER") === 0; }

function stripeMarca_(d) { return d.cliente ? d.cliente + (d.suscripcion ? " · " + d.suscripcion : "") : ""; }

function stripeFilaPorCorreo_(data, email) {
  for (let i = 1; i < data.length; i++) {
    if (parseEmailsFromCell(data[i][2]).some(function (e) { return String(e).toLowerCase() === email; })) return i + 1;
  }
  return 0;
}

function stripeFilaPorCliente_(data, colS, cliente) {
  for (let i = 1; i < data.length; i++) {
    if ((/cus_[A-Za-z0-9]+/.exec(String(data[i][colS - 1] || "")) || [""])[0] === cliente) return i + 1;
  }
  return 0;
}

function stripeHoy_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"); }

/** «Ya eres miembro»: corto, sin promesas de frecuencia. Devuelve false si no hay cuota de correo. */
function stripeCorreoMiembro_(email, nombre, lang) {
  if (MailApp.getRemainingDailyQuota() < 3) return false;
  const n = sanitizarNombre(nombre);
  const en = lang === "en";
  const asunto = en ? "You're a Triggui member" : "Ya eres miembro de Triggui";
  const texto = en
    ? (n ? "Hi " + n + "," : "Hi,") + "\n\nYour Triggui subscription is active: your books arrive every week.\n\n" +
      "If a book lifts your mood, save it in your Spiral: https://app.triggui.com/espiral/\n\nFor anything, just reply to this email.\n\nTriggui"
    : (n ? "Hola, " + n + ":" : "Hola:") + "\n\nTu suscripción de Triggui ya está activa: tus libros te llegan cada semana.\n\n" +
      "Si un libro mejora tu ánimo, guárdalo en tu Espiral: https://app.triggui.com/espiral/\n\nPara cualquier cosa, responde este correo.\n\nTriggui";
  MailApp.sendEmail(email, asunto, texto, { name: REMITENTE_DISPLAY_NAME, replyTo: REMITENTE_REPLY_TO });
  return true;
}

/** El aviso a Badir. Si no hay cuota de correo, queda en el registro y en la hoja «Stripe eventos». */
function stripeAvisar_(r, texto) {
  Logger.log("Stripe: " + texto);
  try { if (MailApp.getRemainingDailyQuota() > 0) MailApp.sendEmail(DIAG_EMAIL, "Triggui Stripe", texto); }
  catch (e) { Logger.log("Stripe: no pude avisar por correo: " + (e && e.message)); }
  return r;
}
