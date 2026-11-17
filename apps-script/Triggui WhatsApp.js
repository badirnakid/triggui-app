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
 *   · Primero los que pagan. Si los elegibles pasan de WA_TOPE (60 si falta), salen los primeros WA_TOPE en ese orden
 *     y el aviso dice cuántos quedaron fuera (C481).
 *   · La prueba de 28 días (SUBSCRIBED_TRIAL) no recibe el WhatsApp de los lunes: solo la bienvenida al registrarse
 *     y después correo (Badir, 16 de noviembre de 2026, 18:54).
 *   · Nunca dos veces la misma edición al mismo número (hoja «WA envíos»).
 *   · Un error de cuenta, de token, de plantilla o de cobro detiene el envío; uno de una persona, no.
 *   · El límite de Meta (personas distintas a las que el negocio escribe primero en 24 horas, del portafolio):
 *     antes de mandar se lee el escalón del número y se usa el 90 %; lo que no cupo sigue al día siguiente
 *     (waContinuarEnvio, una sola vez por día, hasta 6 días y solo con la misma edición), sin repetir a nadie.
 *   · La calidad del número (C485): antes de mandar se leen su calificación, su estado y lo que dice Meta de él
 *     (quality_rating, status y health_status). Si la calidad es amarilla o roja, si no está conectado, si Meta lo
 *     tiene bloqueado o si no se pudo leer, ese envío no sale y llega el aviso; con verde, o sin calificación
 *     todavía (número nuevo), sí. El resumen de la noche dice cómo quedó.
 *
 * Lo que avisa Meta por triggui.com/api/wa además de los mensajes (C485):
 *   · user_preferences: alguien dejó de aceptar el marketing desde el menú de WhatsApp → «baja» en la hoja.
 *     Si lo vuelve a aceptar, se anota y su columna no cambia: volver a mandarle es decisión de Badir.
 *   · message_template_status_update: Meta pausó, desactivó, marcó o rechazó una plantilla nuestra → correo a Badir.
 *
 * La bienvenida A (C484, plantilla de marketing «triggui_bienvenida_libro»): cuando alguien marca la casilla de
 * WhatsApp en el formulario de triggui.com (o paga en Stripe con permiso de WhatsApp), el alta escribe «sí AAAA-MM-DD»
 * en la columna y le manda, una sola vez por número, la imagen de la edición de la semana, «¡Listo, (nombre)! Ya estás
 * en Triggui. Tu primer libro llega ya: (título). Cada semana, otro aquí.», el pie de BAJA y dos botones de liga:
 * «Abrir mi libro» (la edición) y «Explorar la app». Sin «lunes» ni hora (Badir, 16 de noviembre de 2026, 21:32).
 * Sale solo si además WA_BIENVENIDA dice «si» (cuando Meta la aprobó). La crea en Meta waCrearBienvenida() (con go).
 *
 * Propiedades del script (Configuración del proyecto › Propiedades del script; nunca en el código):
 *   WA_TOKEN        token del usuario del sistema con whatsapp_business_messaging
 *   WA_NUMERO_ID    identificador del número en la API (no es el número de teléfono)
 *   WA_ACTIVO       «si» para mandar de verdad
 *   WA_TOPE         máximo de personas por lunes (60 si falta)
 *   WA_PRUEBA_TEL   tu número con lada (52…), para waProbarConmigo()
 *   WA_PUENTE_CLAVE la misma clave que tiene triggui.com/api/wa en Vercel (32 caracteres o más)
 *   WA_BIENVENIDA   «si» para mandar la bienvenida del formulario (después de que Meta apruebe la plantilla)
 *   Para waCrearPlantillas() y waCrearBienvenida(): WA_WABA_ID y WA_APP_ID.
 *   Para waRegistrarNumero(): WA_PIN, los seis dígitos de la verificación en dos pasos del número (los pone Badir).
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
const WA_PLANTILLA_BIENVENIDA = "triggui_bienvenida_libro";   // C484; la de utilidad «triggui_bienvenida» quedó atrás
const WA_EDICION_BIENVENIDA = "bienvenida";        // así se anota en «WA envíos» (columna Edición)
const WA_USO_DEL_LIMITE = 0.9;                     // del límite diario de Meta se usa el 90 %: el resto, para bienvenidas
const WA_DIAS_DE_CONTINUACION = 6;                 // lo que no cupo sigue al día siguiente, hasta 6 días después
const WA_CAMPO_LIMITE = "whatsapp_business_manager_messaging_limit";   // el de hoy; messaging_limit_tier quedó retirado
const WA_CAMPOS_CALIDAD = "quality_rating,status,health_status";       // del nodo del número (páginas de Meta del 17 de noviembre de 2026)
const WA_CALIDADES_QUE_SALEN = ["GREEN", "NA", "UNKNOWN"];             // verde, o sin calificación todavía
/* Lo que Meta puede avisar de una plantilla (message_template_status_update) y lo que amerita un correo a Badir. */
const WA_EVENTOS_PLANTILLA = ["APPROVED", "ARCHIVED", "UNARCHIVED", "DELETED", "DISABLED", "FLAGGED", "IN_APPEAL",
  "LIMIT_EXCEEDED", "LOCKED", "PAUSED", "PENDING", "REINSTATED", "PENDING_DELETION", "REJECTED"];
const WA_EVENTOS_DE_ALERTA = { PAUSED: "pausada por Meta", DISABLED: "desactivada por Meta", FLAGGED: "marcada por Meta con calidad baja",
  REJECTED: "rechazada por Meta", PENDING_DELETION: "por borrarse en Meta", DELETED: "borrada en Meta", LOCKED: "bloqueada por Meta",
  ARCHIVED: "archivada en Meta", LIMIT_EXCEEDED: "con el aviso LIMIT_EXCEEDED de Meta" };

/* La bienvenida A (C484): marketing, con la imagen de la edición, dos variables y dos botones de liga (la ÚNICA fuente
   de sus textos). {{1}} es el saludo: en español «Listo, Ana» o «Listo» si no hay nombre (un parámetro no puede ir vacío);
   en inglés, el nombre o «friend». {{2}} es el título. El primer botón lleva la ruta de la edición; el segundo es fijo. */
const WA_MARCA_BIENVENIDA = "?w=s&utm_content=bienvenida";   // la página de la edición la vuelve utm_source=whatsapp · utm_medium=sala
const WA_MARCA_PERFIL = "?w=s&utm_content=perfil";           // C477: la liga que confirma un cambio de perfil
const WA_APP_EXPLORAR = "https://app.triggui.com/?utm_source=whatsapp&utm_medium=bienvenida&utm_campaign=explorar";
const WA_BIENVENIDAS = [
  { nombre: WA_PLANTILLA_BIENVENIDA, idioma: "es",
    cuerpo: "¡{{1}}! Ya estás en Triggui. Tu primer libro llega ya: *{{2}}*. Cada semana, otro aquí.",
    pie: "Responde BAJA si ya no quieres recibirlo", botones: ["Abrir mi libro", "Explorar la app"] },
  { nombre: WA_PLANTILLA_BIENVENIDA, idioma: "en",
    cuerpo: "All set, {{1}}! You're in Triggui. Your first book is here: *{{2}}*. A new one here every week.",
    pie: "Reply STOP if you no longer want it", botones: ["Open my book", "Explore the app"] }
];

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

/** Quita los dos activadores (y la continuación, si había una programada). */
function waQuitarLunes() {
  let n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    const f = t.getHandlerFunction();
    if (f === "waEnviarLunes" || f === "waResumenDelLunes" || f === "waContinuarEnvio") { ScriptApp.deleteTrigger(t); n++; }
  });
  try { PropertiesService.getScriptProperties().deleteProperty("WA_CONTINUACION"); } catch (e) {}
  Logger.log("Quité " + n + " activador(es).");
  return { ok: true, quitados: n };
}

/** Lo corre el activador de un día después cuando el límite de Meta no alcanzó: sigue con quienes faltan. */
function waContinuarEnvio() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "waContinuarEnvio") ScriptApp.deleteTrigger(t);
  });
  return waCorrer_(false, true);
}

/* ─────────────────────────────── el envío ─────────────────────────────── */

function waCorrer_(ensayo, continuacion) {
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
  let resumen = { aceptados: 0, personas: 0 };   // afuera del try: si algo truena a medio ciclo, el aviso dice cuántos sí salieron
  try {
    const L = waPersonas_();
    const personas = L.personas;
    resumen = { ensayo: ensayo, personas: personas.length, filtros: L.resumen, porIdioma: { es: 0, en: 0 },
      porCatalogo: { adultos: 0, kids: 0 }, aceptados: 0, yaTenian: 0, errores: 0, detenido: "", muestra: null,
      pendientes: 0, limite: null, continua: false, fueraDelTope: 0 };
    // C481: si son más que el tope, salen los primeros del tope en orden (primero los que pagan) y el aviso lo dice.
    if (personas.length > cfg.tope) {
      resumen.fueraDelTope = personas.length - cfg.tope;
      personas.splice(cfg.tope);
    }
    if (!personas.length) return waAviso_(L.resumen.prueba
      ? "Nadie con «sí» recibe este lunes: los que lo tienen están en la prueba (" + L.resumen.prueba + "), que solo recibe la bienvenida."
      : "Nadie tiene «sí» en la columna WhatsApp: no hay a quién mandar.", !ensayo);
    const ed = waEdiciones_(personas.some(function (p) { return p.cat === "kids"; }));
    const armados = personas.map(function (p) {
      const libro = ed[p.cat];
      const cuerpo = waPayload_(p, libro, cfg);
      resumen.porIdioma[cuerpo._lang]++;
      resumen.porCatalogo[p.cat]++;
      return { p: p, libro: libro, cuerpo: cuerpo };
    });
    // Cada imagen de encabezado tiene que existir antes de mandar: si Meta no la encuentra, falla después y ya no se repite.
    const imagenes = {};
    armados.forEach(function (a) { imagenes[a.cuerpo.template.components[0].parameters[0].image.link] = true; });
    const faltan = Object.keys(imagenes).filter(function (u) {
      try { return UrlFetchApp.fetch(u, { muteHttpExceptions: true }).getResponseCode() !== 200; } catch (e) { return true; }
    });
    if (faltan.length) return waAviso_("No encuentro la imagen de la edición (" + faltan.join(", ") + "): no mandé nada.", !ensayo);
    const slugs = Object.keys(armados.reduce(function (s, a) { s[a.libro._slug] = true; return s; }, {})).sort();
    if (continuacion) {
      const motivo = waContinuacionVale_(slugs);
      if (motivo) { waOlvidarContinuacion_(); return waAviso_("No seguí el envío: " + motivo, true); }
    }
    if (cfg.token && cfg.numeroId) {
      // C485: con la calidad amarilla o roja, sin conexión, bloqueado por Meta o sin poder leerla, no sale nada.
      resumen.calidad = waCalidad_(cfg);
      if (!ensayo && !resumen.calidad.puede) {
        if (continuacion) waOlvidarContinuacion_();
        return waAviso_("No salió nada: " + resumen.calidad.motivo + ". Calidad: " + waCalidadTexto_(resumen.calidad) + "." +
          (resumen.calidad.detalle ? " Meta dice: " + resumen.calidad.detalle.replace(/[.\s]+$/, "") + "." : "") +
          " Revísalo en WhatsApp Manager. Cuando esté resuelto, corre waEnviarLunes(): sale sin repetir a nadie." +
          (continuacion ? " La continuación de esta edición quedó cancelada." : ""), true);
      }
      resumen.limite = waLimiteMeta_(cfg);
      resumen.limite.presupuesto = isFinite(resumen.limite.limite) ? Math.floor(resumen.limite.limite * WA_USO_DEL_LIMITE) : null;
    }
    if (ensayo) {
      const a = armados[0];
      const copia = JSON.parse(JSON.stringify(a.cuerpo));
      copia.to = waTapa_(copia.to);
      resumen.muestra = copia;
      Logger.log("Ensayo: " + JSON.stringify(resumen));
      return resumen;
    }
    const presupuesto = resumen.limite.presupuesto === null ? Infinity : resumen.limite.presupuesto;
    const hoja = waHoja_(WA_HOJA_ENVIOS, WA_ENC_ENVIOS);
    const ya = {};
    for (let i = 0; i < armados.length; i++) {
      const a = armados[i];
      const slug = a.libro._slug;
      if (!ya[slug]) ya[slug] = waYaEnviados_(hoja, slug);
      if (ya[slug][a.p.clave]) { resumen.yaTenian++; continue; }
      if (resumen.aceptados >= presupuesto) { resumen.pendientes++; continue; }   // no cupo hoy: sigue mañana
      const envio = Object.assign({}, a.cuerpo);
      delete envio._lang;
      const r = waMandar_(cfg, envio);
      if (r.ok) { resumen.aceptados++; ya[slug][a.p.clave] = true; }   // se cuenta antes de anotar: si la hoja falla, el aviso no miente
      hoja.appendRow([new Date(), slug, "'" + a.p.tel, a.p.nombre, a.cuerpo._lang, a.p.cat,
        r.ok ? r.wamid : "", r.ok ? "aceptado" : "error " + r.codigo, r.ok ? "" : r.detalle]);
      if (!r.ok) {
        resumen.errores++;
        if (waEsFatal_(r)) { resumen.detenido = (r.codigo || ("HTTP " + r.http)) + " · " + r.detalle; break; }
      }
      Utilities.sleep(WA_PAUSA_MS);
    }
    if (resumen.pendientes > 0 && !resumen.detenido) resumen.continua = waProgramarContinuacion_(slugs, !!continuacion);
    else waOlvidarContinuacion_();
    const lim = resumen.limite;
    waCorreo_("Triggui WhatsApp: " + resumen.aceptados + " de " + resumen.personas + (continuacion ? " (continuación)" : " este lunes"),
      "Salieron: " + resumen.aceptados + " de " + resumen.personas + "\n" +
      "Ya la tenían de antes: " + resumen.yaTenian + "\n" +
      (resumen.fueraDelTope ? "Fuera del tope (WA_TOPE, " + cfg.tope + "): " + resumen.fueraDelTope +
        ". Salieron primero los que pagan; sube WA_TOPE para llegar a todos.\n" : "") +
      "Errores: " + resumen.errores + (resumen.detenido ? "\nSe detuvo: " + resumen.detenido : "") + "\n" +
      "Límite de Meta hoy: " + (isFinite(lim.limite) ? lim.limite + " (se usa " + lim.presupuesto + ")" : "ilimitado") +
      (lim.leido ? "" : ", el más bajo, porque no se pudo leer el escalón") + "\n" +
      "Calidad del número: " + waCalidadTexto_(resumen.calidad) + "\n" +
      (resumen.pendientes ? "No cupieron hoy: " + resumen.pendientes + (resumen.continua ? ". Siguen mañana a esta hora, sin repetir a nadie." :
        ". No pude programar la continuación: corre waEnviarLunes() mañana.") + "\n" : "") + "\n" +
      "Español: " + resumen.porIdioma.es + " · inglés: " + resumen.porIdioma.en + " · adultos: " + resumen.porCatalogo.adultos +
      " · Niños: " + resumen.porCatalogo.kids + "\nEl detalle está en la hoja «" + WA_HOJA_ENVIOS + "». A las 21 llega el resumen de entregados y leídos.");
    Logger.log("Envío: " + JSON.stringify(resumen));
    return resumen;
  } catch (e) {
    // Antes del ciclo (falta la columna, la edición viene incompleta, el catálogo no se lee): no salió nada.
    // A medio ciclo (por ejemplo, la hoja no escribió una fila): se dice cuántos sí salieron.
    const motivo = String((e && e.message) || e);
    if (resumen.aceptados > 0) {
      return waAviso_("Se interrumpió: salieron " + resumen.aceptados + " de " + resumen.personas +
        ". Revisa la hoja «" + WA_HOJA_ENVIOS + "» antes de volver a correrlo. Motivo: " + motivo, !ensayo);
    }
    return waAviso_("No salió nada: " + motivo, !ensayo);
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
  const colPerfil = waColumna_(data[0] || [], PERFIL_HEADER);   // C477: el perfil decide de qué es su WhatsApp
  const vistos = {};
  const personas = [];
  const r = { conSi: 0, sinTel: 0, telRaro: 0, baja: 0, unsub: 0, expirados: 0, prueba: 0, repetidos: 0, lada52: 0, siSinEntender: 0 };
  for (let i = 1; i < data.length; i++) {
    const permiso = waLeerPermiso_(data[i][col - 1]);
    if (permiso.baja) { r.baja++; continue; }
    if (permiso.raro) { r.siSinEntender++; continue; }
    if (!permiso.si) continue;
    r.conSi++;
    const crudo = String(data[i][3] || "");
    if (!crudo.replace(/\D/g, "")) { r.sinTel++; continue; }
    const tel = waTel_(crudo);
    if (!tel) { r.telRaro++; continue; }
    if (isRowUnsubscribed(data[i])) { r.unsub++; continue; }
    const status = String(data[i][UNSUBSCRIBE_COL - 1] || "").trim();
    if (status.startsWith("SUBSCRIBED_EXPIRED") || debeMarcarseExpired(data[i])) { r.expirados++; continue; }
    // La prueba recibe la bienvenida por WhatsApp al registrarse y después solo correo (Badir, 16 de noviembre de 2026, 18:54).
    if (status.toUpperCase().startsWith("SUBSCRIBED_TRIAL")) { r.prueba++; continue; }
    const clave = waClaveTel_(tel);
    if (vistos[clave]) { r.repetidos++; continue; }
    vistos[clave] = true;
    let lang = "es";
    try { lang = leerIdiomaFila(sheet, i + 1) || "es"; } catch (e) {}
    if (/^(04[45])?\d{10}$/.test(crudo.replace(/\D/g, ""))) r.lada52++;   // diez dígitos: se les puso el 52 de México
    personas.push({ fila: i + 1, nombre: String(data[i][0] || "").trim(), tel: tel, clave: clave,
      lang: lang === "en" ? "en" : "es", cat: perfilDeValores_(colPerfil ? data[i][colPerfil - 1] : "", data[i][col - 1]),
      miembro: status.toUpperCase().startsWith("SUBSCRIBED_MEMBER") });
  }
  // C481: los que pagan primero; dentro de cada grupo, el orden de la hoja (el orden de JavaScript es estable).
  personas.sort(function (a, b) { return (b.miembro ? 1 : 0) - (a.miembro ? 1 : 0); });
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
  let enviados = 0, bienvenidas = 0;
  envios.getDataRange().getValues().slice(1).forEach(function (f) {
    if (!deHoy(f[0]) || String(f[7]) !== "aceptado" || !f[6]) return;
    if (String(f[1]) === WA_EDICION_BIENVENIDA) { bienvenidas++; return; }   // las del formulario no son el envío del lunes
    wamids[String(f[6])] = "aceptado"; enviados++;
  });
  const orden = { aceptado: 0, sent: 1, delivered: 2, read: 3, failed: 4 };
  const botones = { tarjeta: 0, melodia: 0, video: 0 };
  let bajas = 0, bajasMenu = 0;
  const ev = ss.getSheetByName(WA_HOJA_EVENTOS);
  if (ev) ev.getDataRange().getValues().slice(1).forEach(function (f) {
    if (!deHoy(f[0])) return;
    const tipo = String(f[1]);
    if (tipo === "estado" && wamids[String(f[2])] !== undefined) {
      const actual = wamids[String(f[2])], nuevo = String(f[4]);
      if ((orden[nuevo] || 0) > (orden[actual] || 0)) wamids[String(f[2])] = nuevo;
    } else if (tipo === "boton" && botones[String(f[4])] !== undefined) botones[String(f[4])]++;
    else if (tipo === "baja") bajas++;
    else if (tipo === "preferencia" && String(f[4]) === "stop" && parseInt(String(f[5]), 10) > 0) bajasMenu++;   // solo quien estaba en la hoja
  });
  const cuenta = { aceptado: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
  Object.keys(wamids).forEach(function (k) { cuenta[wamids[k]]++; });
  const r = { enviados: enviados, entregados: cuenta.delivered + cuenta.read, leidos: cuenta.read, fallidos: cuenta.failed,
    sinNoticia: cuenta.aceptado + cuenta.sent, botones: botones, bajas: bajas, bajasMenu: bajasMenu, bienvenidas: bienvenidas };
  if (!enviados) { Logger.log("Hoy no salió nada: no mando resumen."); return r; }
  const cfg = waConfig_();
  const calidad = (cfg.token && cfg.numeroId) ? waCalidad_(cfg) : null;   // C485: cómo quedó el número después del envío
  r.calidad = calidad ? waCalidadTexto_(calidad) : "no la leí: faltan WA_TOKEN o WA_NUMERO_ID";
  waCorreo_("Triggui WhatsApp: el resumen del lunes",
    "Salieron: " + r.enviados + "\nEntregados: " + r.entregados + "\nLeídos: " + r.leidos +
    " (solo cuentan quienes tienen activado el aviso de leído)\nFallidos: " + r.fallidos + "\nSin noticia todavía: " + r.sinNoticia +
    "\n\nBotones: tarjeta " + botones.tarjeta + " · melodía " + botones.melodia + " · video " + botones.video +
    "\nBajas: " + bajas + (bajasMenu ? "\nDejaron el marketing desde el menú de WhatsApp: " + bajasMenu : "") +
    "\nBienvenidas del formulario, hoy: " + bienvenidas +
    "\n\nCalidad del número ahora: " + r.calidad +
    (calidad && !calidad.puede ? "\nAtención: " + calidad.motivo + ". Si sigue así a la hora del próximo envío, no sale nada y te aviso." : "") +
    "\n\nLas visitas a la edición se ven en Analytics: fuente whatsapp, contenido lunes.");
  Logger.log("Resumen: " + JSON.stringify(r));
  return r;
}

/* ─────────────────────────────── el puente con triggui.com/api/wa ─────────────────────────────── */

/** doPost(action=wa_puente): baja, estado de un mensaje, botón tocado, preferencia de marketing, aviso de plantilla
 *  o cambio de perfil (C477).
 *  Lo manda triggui.com/api/wa con la clave. Una preferencia o un aviso de plantilla repetidos (mismo momento) se
 *  atienden una sola vez en 6 horas: Meta puede repetir un aviso y caer en otra instancia de Vercel. */
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
  // C485 · user_preferences: dejó de aceptar el marketing desde el menú de WhatsApp («stop») o lo volvió a aceptar («resume»).
  if (tipo === "preferencia") {
    const valor = String(p.valor || "");
    if (!tel || (valor !== "stop" && valor !== "resume")) return { ok: false, error: "preferencia" };
    const visto = waYaVisto_(p.cuando ? ["up", tel, valor, p.cuando].join("|") : "");
    if (visto.antes) return { ok: true, repetido: true };
    const n = valor === "stop" ? waMarcarBaja_(waClaveTel_(tel), "dejó de recibir marketing") : 0;
    waHoja_(WA_HOJA_EVENTOS, WA_ENC_EVENTOS).appendRow([new Date(), "preferencia", "", "'" + tel, valor,
      valor === "stop" ? n + " fila(s)" : "volvió a aceptar el marketing; su columna no cambia"]);
    visto.marcar();
    if (valor === "stop" && n === 0) return { ok: false, filas: 0, error: "sin_fila" };
    return { ok: true, filas: n };
  }
  // C485 · message_template_status_update: lo que Meta hizo con una plantilla nuestra. Si amerita, correo a Badir.
  if (tipo === "plantilla") {
    const nombre = String(p.nombre || "");
    const evento = String(p.evento || "");
    if (!/^triggui_[a-z0-9_]{1,60}$/.test(nombre) || WA_EVENTOS_PLANTILLA.indexOf(evento) === -1) return { ok: false, error: "plantilla" };
    const visto = waYaVisto_(p.cuando ? ["pl", String(p.id || nombre).slice(0, 40), String(p.idioma || "").slice(0, 12), evento, p.cuando].join("|") : "");
    if (visto.antes) return { ok: true, repetido: true };
    const idioma = waLimpia_(p.idioma, 12), motivo = waLimpia_(p.motivo, 60), titulo = waLimpia_(p.titulo, 60);
    const descripcion = waLimpia_(p.descripcion, 300), cuenta = String(p.waba || "").replace(/\D/g, "").slice(0, 30);
    waHoja_(WA_HOJA_EVENTOS, WA_ENC_EVENTOS).appendRow([new Date(), "plantilla", "", "", evento,
      [nombre + (idioma ? " (" + idioma + ")" : ""), motivo, titulo, descripcion].filter(String).join(" · ").slice(0, 500)]);
    const frase = WA_EVENTOS_DE_ALERTA[evento];
    if (frase) {
      waCorreo_("Triggui WhatsApp: la plantilla " + nombre + (idioma ? " (" + idioma + ")" : "") + ", " + frase,
        "Meta avisó " + evento + " de la plantilla " + nombre + (idioma ? " en " + idioma : "") + (cuenta ? ", de la cuenta " + cuenta : "") + ".\n" +
        (motivo && motivo !== "NONE" ? "Motivo: " + motivo + "\n" : "") + (titulo ? "Detalle: " + titulo + "\n" : "") +
        (descripcion ? "Lo que dice Meta: " + descripcion + "\n" : "") +
        "\n" + waConsecuenciaPlantilla_(evento, nombre) + "Revísala en WhatsApp Manager › Plantillas de mensajes.");
    }
    visto.marcar();
    return { ok: true };
  }
  // C477 · escribió «kids» o «adultos»: su perfil cambia en cada fila con ese número (el número dice quién es) y se le
  // contesta con la liga del libro de esta semana de su perfil nuevo. Solo con PERFIL_ACTIVO. El mismo mensaje
  // repetido (mismo wamid) se atiende una sola vez en 6 horas y recibe la MISMA respuesta (con repetido): si la
  // primera vez /api/wa no alcanzó a esperar y pidió a Meta que repitiera, la confirmación no se pierde.
  if (tipo === "perfil") {
    const perfil = perfilNormal_(p.perfil);
    if (!tel || !perfil) return { ok: false, error: "perfil" };
    if (!perfilActivo_()) return { ok: false, error: "apagado" };
    const wamid = String(p.wamid || "").slice(0, 200);
    const guardada = waRespuestaGuardada_(wamid);
    if (guardada) return Object.assign(guardada, { repetido: true });
    const r = waCambiarPerfil_(waClaveTel_(tel), perfil);
    waHoja_(WA_HOJA_EVENTOS, WA_ENC_EVENTOS).appendRow([new Date(), "perfil", wamid, "'" + tel, perfil, r.filas + " fila(s)"]);
    let respuesta;
    if (!r.filas) respuesta = { ok: false, filas: 0, error: "sin_fila" };
    else {
      let libro = null;
      try { libro = waEdiciones_(perfil === "kids")[perfil]; } catch (e) { libro = null; }
      const en = r.lang === "en" && !!libro && waTieneEn_(libro);
      respuesta = { ok: true, filas: r.filas, perfil: perfil, lang: r.lang === "en" ? "en" : "es",
        titulo: libro ? waLimpia_(en ? (libro.titulo_en || libro.titulo) : libro.titulo, 200) : "",
        liga: libro ? WA_APP_BASE + waRuta_(libro, perfil) + (en ? "en/" : "") + WA_MARCA_PERFIL : "" };
    }
    waGuardarRespuesta_(wamid, respuesta);
    return respuesta;
  }
  return { ok: false, error: "tipo" };
}

/** C477: la respuesta que ya se dio a ese mensaje (por su wamid), guardada 6 horas en CacheService. */
function waRespuestaGuardada_(wamid) {
  if (!wamid) return null;
  try {
    const t = CacheService.getScriptCache().get("wa_pf|" + wamid);
    return t ? JSON.parse(t) : null;
  } catch (e) { return null; }
}

function waGuardarRespuesta_(wamid, respuesta) {
  if (!wamid) return;
  try { CacheService.getScriptCache().put("wa_pf|" + wamid, JSON.stringify(respuesta), 21600); } catch (e) {}
}

/** C477: escribe el perfil en cada fila con ese número (crea la columna PERFIL si falta). Devuelve cuántas filas
 *  y el idioma de la primera, para contestarle en su idioma. */
function waCambiarPerfil_(clave, perfil) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet || !clave) return { filas: 0, lang: "es" };
  const data = sheet.getDataRange().getValues();
  let col = 0, n = 0, lang = "";
  for (let i = 1; i < data.length; i++) {
    if (waClaveTel_(data[i][3]) !== clave) continue;
    if (!col) col = colPerfil_(sheet, true);
    sheet.getRange(i + 1, col).setValue(perfil);
    if (!lang) { try { lang = leerIdiomaFila(sheet, i + 1); } catch (e) { lang = "es"; } }
    n++;
  }
  return { filas: n, lang: lang === "en" ? "en" : "es" };
}

/** Lo que de verdad pasa con cada aviso de plantilla, en una frase (vacía si no hay nada que añadir). */
function waConsecuenciaPlantilla_(evento, nombre) {
  if (evento === "PAUSED" || evento === "DISABLED") {
    if (nombre === WA_PLANTILLA_ADULTOS || nombre === WA_PLANTILLA_NINOS) return "Mientras esté así, el envío del lunes se detiene en el primer mensaje y te avisa. ";
    if (nombre === WA_PLANTILLA_BIENVENIDA) return "Mientras esté así, la bienvenida del formulario no sale: queda como error en «" + WA_HOJA_ENVIOS + "». ";
    return "Mientras esté así, no se puede mandar. ";
  }
  if (evento === "FLAGGED") return "Su calidad bajó: si no mejora, Meta puede pausarla. ";
  if (evento === "REJECTED") return "No se puede usar hasta corregirla y mandarla a revisión otra vez. ";
  if (evento === "DELETED" || evento === "PENDING_DELETION") return "No se podrá mandar hasta volver a crearla y que Meta la apruebe. ";
  return "";
}

/** Para avisos que Meta puede repetir: antes es true si la misma clave se atendió en las últimas 6 horas; marcar()
 *  la guarda cuando ya se atendió. Sin clave (el aviso no traía su momento) no se compara: se atiende siempre. */
function waYaVisto_(clave) {
  const k = clave ? "wa_v|" + String(clave).slice(0, 200) : "";
  let cache = null, antes = false;
  try { cache = k ? CacheService.getScriptCache() : null; antes = !!(cache && cache.get(k)); } catch (e) { cache = null; }
  return {
    antes: antes,
    marcar: function () { try { if (cache) cache.put(k, "1", 21600); } catch (e) {} }
  };
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

/* ─────────────────────────────── la bienvenida del formulario ─────────────────────────────── */

/** El alta del formulario con la casilla de WhatsApp marcada. La llama doPost con el candado puesto.
 *  telFila: el teléfono que ya tiene la fila (vacío si no tiene). telForm: el que escribió la persona.
 *  Si los dos son el mismo número (o la fila no tenía), escribe «sí AAAA-MM-DD» en la columna WhatsApp
 *  (la crea en la primera columna libre si falta; un «sí kids» se respeta) y manda la bienvenida.
 *  Con otro número en la fila no cambia nada: el formulario no reemplaza el teléfono de nadie.
 *  recibe: si la fila recibe los lunes (sin baja del correo ni prueba vencida); si no, se guarda el permiso
 *  pero no se manda la bienvenida, que promete el libro de cada lunes. Nunca truena. */
function waPermisoFormulario_(sheet, rowIdx, telFila, telForm, lang, recibe) {
  try {
    const tel = waTel_(telForm);
    if (!tel) return { permiso: false, motivo: "tel" };
    const crudoFila = String(telFila == null ? "" : telFila).replace(/\D/g, "");
    if (crudoFila && waClaveTel_(telFila) !== waClaveTel_(tel)) return { permiso: false, motivo: "otro_tel" };
    if (!crudoFila) sheet.getRange(rowIdx, 4).setValue("'" + String(telForm).trim());
    const ultima = Math.max(1, sheet.getLastColumn());
    let col = waColumna_(sheet.getRange(1, 1, 1, ultima).getValues()[0], WA_COL_PERMISO);
    if (!col) { col = ultima + 1; sheet.getRange(1, col).setValue("WhatsApp"); }
    const actual = waLeerPermiso_(sheet.getRange(rowIdx, col).getValue());
    if (!actual.si) sheet.getRange(rowIdx, col).setValue("sí " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"));
    return { permiso: true, motivo: actual.si ? "ya_tenia" : "nuevo",
      bienvenida: recibe ? waBienvenida_(tel, lang, sheet.getRange(rowIdx, 1).getValue(), leerPerfilFila_(sheet, rowIdx)) : { ok: false, motivo: "no_recibe_los_lunes" } };
  } catch (e) {
    Logger.log("Permiso de WhatsApp del formulario: " + e.message);
    return { permiso: false, motivo: "error" };
  }
}

/** La bienvenida A por WhatsApp (C484), una sola vez por número, con la edición de esta semana de su perfil (C477:
 *  la de Kids si su perfil es Kids; si no, la de adultos). Solo si WA_ACTIVO y WA_BIENVENIDA dicen «si».
 *  nombre: el de la columna Nombre de la fila (puede faltar). perfil: «kids» o «adultos» (de entrada, adultos).
 *  Si la imagen de la edición no está, no sale (queda «error sin imagen» y un alta posterior la vuelve a intentar).
 *  Se anota en «WA envíos» con la edición «bienvenida». Nunca truena. */
function waBienvenida_(telefono, lang, nombre, perfil) {
  try {
    const cfg = waConfig_();
    if (!cfg.activo || !cfg.bienvenida) return { ok: false, motivo: "apagada" };
    if (!cfg.token || !cfg.numeroId) return { ok: false, motivo: "sin_token" };
    const tel = waTel_(telefono);
    if (!tel) return { ok: false, motivo: "tel" };
    const clave = waClaveTel_(tel);
    const hoja = waHoja_(WA_HOJA_ENVIOS, WA_ENC_ENVIOS);
    if (waYaEnviados_(hoja, WA_EDICION_BIENVENIDA)[clave]) return { ok: true, motivo: "ya_la_tenia" };
    const cat = (perfil === "kids") ? "kids" : "adultos";
    const libro = waEdiciones_(cat === "kids")[cat];
    const cuerpo = waPayloadBienvenida_({ tel: tel, lang: lang === "en" ? "en" : "es", nombre: nombre, cat: cat }, libro, cfg);
    const idioma = cuerpo._lang, nombreHoja = cuerpo._nombre;
    delete cuerpo._lang; delete cuerpo._nombre;
    const imagen = cuerpo.template.components[0].parameters[0].image.link;
    let hay = false;
    try { hay = UrlFetchApp.fetch(imagen, { muteHttpExceptions: true }).getResponseCode() === 200; } catch (e) {}
    if (!hay) {
      hoja.appendRow([new Date(), WA_EDICION_BIENVENIDA, "'" + tel, nombreHoja, idioma, WA_EDICION_BIENVENIDA, "", "error sin imagen", imagen]);
      return { ok: false, motivo: "sin_imagen" };
    }
    const r = waMandar_(cfg, cuerpo);
    hoja.appendRow([new Date(), WA_EDICION_BIENVENIDA, "'" + tel, nombreHoja, idioma, cat === "kids" ? "bienvenida kids" : WA_EDICION_BIENVENIDA,
      r.ok ? r.wamid : "", r.ok ? "aceptado" : "error " + r.codigo, r.ok ? libro._slug : r.detalle]);
    return r.ok ? { ok: true, motivo: "mandada" } : { ok: false, motivo: "meta", codigo: r.codigo };
  } catch (e) {
    Logger.log("Bienvenida por WhatsApp: " + e.message);
    return { ok: false, motivo: "error" };
  }
}

/** La plantilla de la bienvenida A para una persona. _lang y _nombre son para la hoja: se quitan antes de mandar.
 *  El nombre pasa por sanitizarNombre del cartero (el mismo del correo: primera palabra, con mayúscula). */
function waPayloadBienvenida_(persona, libro, cfg) {
  const en = persona.lang === "en" && waTieneEn_(libro);
  const lang = en ? "en" : "es";
  const ruta = waRuta_(libro, persona.cat === "kids" ? "kids" : "adultos");   // C477: la página de su perfil
  let nombre = "";
  try { nombre = sanitizarNombre(persona.nombre) || ""; } catch (e) {}
  const saludo = en ? (nombre || "friend") : (nombre ? "Listo, " + nombre : "Listo");
  const titulo = waLimpia_(en ? (libro.titulo_en || libro.titulo) : libro.titulo, 200) || libro._slug;
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: persona.tel,
    type: "template",
    template: {
      name: WA_PLANTILLA_BIENVENIDA,
      language: { code: cfg.idioma[lang] },
      components: [
        { type: "header", parameters: [{ type: "image", image: { link: WA_APP_BASE + ruta + (en ? "og_en.jpg" : "og.jpg") } }] },
        { type: "body", parameters: [{ type: "text", text: saludo }, { type: "text", text: titulo }] },
        { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: ruta + (en ? "en/" : "") + WA_MARCA_BIENVENIDA }] }
      ]
    },
    _lang: lang,
    _nombre: nombre
  };
}

/* ─────────────────────────────── la calidad del número (C485) ─────────────────────────────── */

/** Lee del nodo del número su calificación (quality_rating), su estado (status) y lo que dice Meta de él
 *  (health_status), y decide con waSemaforo_. Nunca truena: si no se puede leer, el semáforo dice que no sale. */
function waCalidad_(cfg) {
  let j = null;
  for (let intento = 1; intento <= 2 && !j; intento++) {   // un tropiezo de red no deja a todos sin su libro: un segundo intento
    if (intento === 2) Utilities.sleep(3000);
    try {
      const r = UrlFetchApp.fetch("https://graph.facebook.com/" + cfg.version + "/" + encodeURIComponent(cfg.numeroId) +
        "?fields=" + WA_CAMPOS_CALIDAD, { muteHttpExceptions: true, headers: { Authorization: "Bearer " + cfg.token } });
      const leido = JSON.parse(r.getContentText("UTF-8") || "{}");
      if (r.getResponseCode() === 200 && leido && typeof leido === "object" && !leido.error) j = leido;
    } catch (e) {}
  }
  return waSemaforo_(j);
}

/** El semáforo del envío, sin red (se prueba solo). Sale con la calidad verde, o sin calificación todavía (NA o
 *  UNKNOWN: número nuevo), con el número conectado y sin bloqueo de Meta. No sale con amarilla o roja, con otro
 *  estado, con BLOCKED, con una calidad que no conocemos o si no se pudo leer. LIMITED sale, y se dice. */
function waSemaforo_(j) {
  if (!j || typeof j !== "object" || j.error) {
    return { leida: false, puede: false, calidad: "", estado: "", meta: "", motivo: "no pude leer la calidad del número en Meta", detalle: "" };
  }
  const calidad = String(j.quality_rating || "").toUpperCase();
  const estado = String(j.status || "").toUpperCase();
  const salud = (j.health_status && typeof j.health_status === "object") ? j.health_status : {};
  const meta = String(salud.can_send_message || "").toUpperCase();
  const notas = [];
  (Array.isArray(salud.entities) ? salud.entities : []).forEach(function (e) {
    if (!e || typeof e !== "object") return;
    (Array.isArray(e.errors) ? e.errors : []).forEach(function (x) {
      if (x && (x.error_description || x.error_code)) notas.push(String(e.entity_type || "") + ": " + String(x.error_description || ("error " + x.error_code)));
    });
    (Array.isArray(e.additional_info) ? e.additional_info : []).forEach(function (x) { if (x) notas.push(String(e.entity_type || "") + ": " + String(x)); });
  });
  let motivo = "";
  if (meta === "BLOCKED") motivo = "Meta tiene bloqueado el envío (BLOCKED)";
  else if (calidad === "RED" || calidad === "YELLOW") motivo = "la calidad del número es " + (calidad === "RED" ? "roja" : "amarilla");
  else if (estado && estado !== "CONNECTED") motivo = "el número no está conectado (" + estado + ")";
  else if (!calidad) motivo = "Meta no dijo la calidad del número";
  else if (WA_CALIDADES_QUE_SALEN.indexOf(calidad) === -1) motivo = "la calidad del número es «" + calidad + "», que no conozco";
  return { leida: true, puede: !motivo, calidad: calidad, estado: estado, meta: meta, motivo: motivo,
    detalle: waLimpia_(notas.join(" · "), 500) };
}

/** «verde · conectado · Meta: AVAILABLE», para los correos. */
function waCalidadTexto_(c) {
  if (!c) return "no se leyó";
  if (!c.leida) return "no se pudo leer";
  const nombres = { GREEN: "verde", YELLOW: "amarilla", RED: "roja", NA: "sin calificación todavía", UNKNOWN: "sin calificación todavía" };
  return [nombres[c.calidad] || c.calidad || "sin dato", c.estado === "CONNECTED" ? "conectado" : (c.estado || ""),
    c.meta ? "Meta: " + c.meta : ""].filter(String).join(" · ");
}

/* ─────────────────────────────── el límite de Meta y la continuación ─────────────────────────────── */

/** El límite del portafolio (lo comparten todos sus números), en el nodo del número, con el campo de hoy
 *  (whatsapp_business_manager_messaging_limit, página de Meta del 15 de noviembre de 2026; messaging_limit_tier quedó retirado).
 *  Si no se puede leer, el más bajo (250): mejor que salgan menos hoy que fallar a media lista. */
function waLimiteMeta_(cfg) {
  try {
    const r = UrlFetchApp.fetch("https://graph.facebook.com/" + cfg.version + "/" + encodeURIComponent(cfg.numeroId) +
      "?fields=" + WA_CAMPO_LIMITE, { muteHttpExceptions: true, headers: { Authorization: "Bearer " + cfg.token } });
    const j = JSON.parse(r.getContentText("UTF-8") || "{}");
    const escalon = String(j[WA_CAMPO_LIMITE] || "");
    const limite = waEscalon_(escalon);
    if (r.getResponseCode() === 200 && limite) return { limite: limite, escalon: escalon, leido: true };
  } catch (e) {}
  return { limite: 250, escalon: "TIER_250", leido: false };
}

/** «TIER_250» → 250 · «TIER_2K» → 2000 · «TIER_100K» → 100000 · «TIER_UNLIMITED» → Infinity · otra cosa → 0. */
function waEscalon_(texto) {
  if (texto === "TIER_UNLIMITED") return Infinity;
  const m = /^TIER_(\d{1,6})(K?)$/.exec(String(texto || ""));
  return m ? Number(m[1]) * (m[2] ? 1000 : 1) : 0;
}

/** Guarda qué edición se está continuando (y desde cuándo) y programa la vuelta de mañana. */
function waProgramarContinuacion_(slugs, yaEraContinuacion) {
  try {
    const props = PropertiesService.getScriptProperties();
    let estado = null;
    try { estado = JSON.parse(props.getProperty("WA_CONTINUACION") || "null"); } catch (e) {}
    if (!yaEraContinuacion || !estado || String(estado.slugs) !== String(slugs)) {
      estado = { inicio: new Date().toISOString(), slugs: slugs };
      props.setProperty("WA_CONTINUACION", JSON.stringify(estado));
    }
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (t.getHandlerFunction() === "waContinuarEnvio") ScriptApp.deleteTrigger(t);
    });
    ScriptApp.newTrigger("waContinuarEnvio").timeBased().after(24 * 60 * 60 * 1000).create();
    return true;
  } catch (e) {
    Logger.log("No pude programar la continuación: " + e.message);
    return false;
  }
}

/** Vacío si la continuación vale; si no, por qué no: otra edición, o ya pasaron los 6 días. */
function waContinuacionVale_(slugs) {
  let estado = null;
  try { estado = JSON.parse(PropertiesService.getScriptProperties().getProperty("WA_CONTINUACION") || "null"); } catch (e) {}
  if (!estado || !estado.inicio || !Array.isArray(estado.slugs)) return "no encontré qué edición se estaba continuando.";
  if (String(estado.slugs) !== String(slugs)) return "la edición cambió desde el lunes (" + estado.slugs.join(", ") + " → " + slugs.join(", ") + "); la nueva sale en el envío normal.";
  const dias = (Date.now() - new Date(estado.inicio).getTime()) / (24 * 60 * 60 * 1000);
  if (!(dias <= WA_DIAS_DE_CONTINUACION + 0.5)) return "ya pasaron " + WA_DIAS_DE_CONTINUACION + " días desde el primer envío de esta edición.";
  return "";
}

function waOlvidarContinuacion_() {
  try {
    PropertiesService.getScriptProperties().deleteProperty("WA_CONTINUACION");
    ScriptApp.getProjectTriggers().forEach(function (t) {
      if (t.getHandlerFunction() === "waContinuarEnvio") ScriptApp.deleteTrigger(t);
    });
  } catch (e) { Logger.log("No pude limpiar la continuación: " + e.message); }
}

/* ─────────────────────────────── las plantillas en Meta ─────────────────────────────── */

/** Manda a revisión, en la cuenta WA_WABA_ID (la de prueba o la de Triggui), las cuatro plantillas del lunes y las dos de
 *  la bienvenida A. Es un envío de formulario a Meta: pide el go de Badir. Con muestras de la edición de esta semana. */
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
  waMandarBienvenidas_(cfg, ed.adultos, handles).forEach(function (r) { resultados.push(r); });
  Logger.log("Plantillas: " + JSON.stringify(resultados));
  return resultados;
}

/** Solo las dos de la bienvenida A (C484), en la cuenta WA_WABA_ID. Es un envío de formulario a Meta: pide el go de Badir. */
function waCrearBienvenida() {
  const cfg = waConfig_();
  if (!cfg.token || !cfg.wabaId || !cfg.appId) return waAviso_("Faltan WA_TOKEN, WA_WABA_ID o WA_APP_ID.", false);
  const resultados = waMandarBienvenidas_(cfg, waEdiciones_(false).adultos, {});
  Logger.log("Bienvenida: " + JSON.stringify(resultados));
  return resultados;
}

/** Manda a revisión las dos plantillas de la bienvenida A, con la muestra armada por waPayloadBienvenida_ (Ana).
 *  Si la edición no trae inglés, la de inglés no se manda y se dice: su muestra saldría en español. */
function waMandarBienvenidas_(cfg, libro, handles) {
  return WA_BIENVENIDAS.map(function (def) {
    if (def.idioma === "en" && !waTieneEn_(libro)) {
      return { plantilla: def.nombre, idioma: cfg.idioma.en, http: 0, id: "", estado: "",
        error: "La edición de esta semana no trae inglés: no mandé la de inglés (su muestra saldría en español). Córrelo con una edición en inglés." };
    }
    const muestra = waPayloadBienvenida_({ tel: "520000000000", lang: def.idioma, nombre: "Ana" }, libro, cfg);
    const og = muestra.template.components[0].parameters[0].image.link;
    if (!handles[og]) handles[og] = waSubirMuestra_(cfg, og);
    const def2 = waDefinicionBienvenida_(def, cfg, handles[og],
      muestra.template.components[1].parameters.map(function (x) { return x.text; }),
      WA_APP_BASE + muestra.template.components[2].parameters[0].text);
    const resp = UrlFetchApp.fetch("https://graph.facebook.com/" + cfg.version + "/" + encodeURIComponent(cfg.wabaId) + "/message_templates", {
      method: "post", contentType: "application/json", muteHttpExceptions: true,
      headers: { Authorization: "Bearer " + cfg.token }, payload: JSON.stringify(def2) });
    let j = {};
    try { j = JSON.parse(resp.getContentText("UTF-8") || "{}"); } catch (e) {}
    return { plantilla: def.nombre, idioma: def2.language, http: resp.getResponseCode(),
      id: j.id || "", estado: j.status || "", error: (j.error && j.error.message) || "" };
  });
}

function waDefinicionBienvenida_(def, cfg, handle, cuerpoMuestra, ligaMuestra) {
  return {
    name: def.nombre,
    language: cfg.idioma[def.idioma],
    category: "MARKETING",
    components: [
      { type: "HEADER", format: "IMAGE", example: { header_handle: [handle] } },
      { type: "BODY", text: def.cuerpo, example: { body_text: [cuerpoMuestra] } },
      { type: "FOOTER", text: def.pie },
      { type: "BUTTONS", buttons: [
        { type: "URL", text: def.botones[0], url: WA_APP_BASE + "{{1}}", example: [ligaMuestra] },
        { type: "URL", text: def.botones[1], url: WA_APP_EXPLORAR }
      ] }
    ]
  };
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

/* ─────────────────────────────── el número en Meta ─────────────────────────────── */

/** Registra el número WA_NUMERO_ID en la API de WhatsApp con el PIN de verificación en dos pasos de WA_PIN.
 *  Meta lo pide al dar de alta el número y otra vez cada vez que aprueba un cambio de su nombre visible:
 *  mientras tanto el número sale «Pendiente» y cada envío regresa 133010 («Account not registered»).
 *  El PIN es la clave de seguridad del número: lo elige y lo escribe Badir en las propiedades del script,
 *  y este guion nunca lo escribe en el registro. Si el número ya tenía otro PIN (133005), lo cambia por el
 *  de WA_PIN y registra otra vez. Lo corre Badir. Meta acepta diez registros por número en 72 horas (133016). */
function waRegistrarNumero() {
  const cfg = waConfig_();
  if (!cfg.token || !cfg.numeroId) return waAviso_("Faltan WA_TOKEN o WA_NUMERO_ID.", false);
  const pin = waProp_("WA_PIN", "");
  if (!/^\d{6}$/.test(pin)) return waAviso_("Falta WA_PIN: seis dígitos que eliges tú, en las propiedades del script.", false);
  let r = waLlamarNumero_(cfg, "/register", { messaging_product: "whatsapp", pin: pin }, pin);
  let pinCambiado = false;
  if (!r.ok && r.codigo === 133005) {
    const p = waLlamarNumero_(cfg, "", { pin: pin }, pin);
    if (!p.ok) {
      Logger.log("El número tiene otro PIN y no pude poner el tuyo: " + (p.codigo || ("HTTP " + p.http)) + " · " + p.detalle);
      return { ok: false, pinCambiado: false, codigo: p.codigo, http: p.http };
    }
    pinCambiado = true;
    r = waLlamarNumero_(cfg, "/register", { messaging_product: "whatsapp", pin: pin }, pin);
  }
  Logger.log(r.ok
    ? "Listo: el número quedó registrado" + (pinCambiado ? ", con tu PIN en lugar del que tenía" : "") + ". Ahora corre waProbarConmigo."
    : "No se registró: " + (r.codigo || ("HTTP " + r.http)) + " · " + r.detalle +
      (pinCambiado ? " · Tu PIN ya quedó puesto en el número: la próxima corrida registra con él." : "") +
      (r.codigo === 133016 ? " · Meta no acepta más registros de este número durante 72 horas." : ""));
  return { ok: r.ok, pinCambiado: pinCambiado, codigo: r.codigo, http: r.http };
}

/** Un POST al nodo del número (ruta "" o "/register"). Lo que regresa nunca trae el PIN. */
function waLlamarNumero_(cfg, ruta, cuerpo, pin) {
  const url = "https://graph.facebook.com/" + cfg.version + "/" + encodeURIComponent(cfg.numeroId) + ruta;
  const tapa = function (t) { return pin ? String(t).split(pin).join("••••••") : String(t); };
  let resp;
  try {
    resp = UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", muteHttpExceptions: true,
      headers: { Authorization: "Bearer " + cfg.token }, payload: JSON.stringify(cuerpo) });
  } catch (e) {
    return { ok: false, http: 0, codigo: 0, detalle: tapa("Sin conexión con Meta: " + String(e.message || e)).slice(0, 200) };
  }
  const code = resp.getResponseCode();
  let j = {};
  try { j = JSON.parse(resp.getContentText("UTF-8") || "{}"); } catch (e) {}
  const err = j.error || {};
  return { ok: code === 200 && j.success === true, http: code, codigo: Number(err.code) || 0,
    detalle: tapa(err.message || ("HTTP " + code)).slice(0, 300) };
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
    bienvenida: waSinAcentos_(waProp_("WA_BIENVENIDA", "")).toLowerCase() === "si",
    tope: (isFinite(tope) && tope > 0) ? tope : WA_TOPE_DEF,
    idioma: { es: waProp_("WA_IDIOMA_ES", "es_MX"), en: waProp_("WA_IDIOMA_EN", "en_US") },
    pruebaTel: waProp_("WA_PRUEBA_TEL", ""),
    wabaId: waProp_("WA_WABA_ID", ""),
    appId: waProp_("WA_APP_ID", "")
  };
}

function waSinAcentos_(s) { return String(s == null ? "" : s).normalize("NFD").replace(/\p{M}/gu, ""); }

/** «sí», «sí 2026-11-15», «sí 15/11», «Sí, kids» → recibe; «baja …» → no. Después del «sí» solo se aceptan
 *  fechas y «kids» o «niños»: «si no contesta, quitar» no es permiso. Vacío o cualquier otra cosa → no. */
function waLeerPermiso_(valor) {
  const nada = { si: false, baja: false, kids: false };
  const t = waSinAcentos_(valor).toLowerCase().trim();
  if (/^baja\b/.test(t)) return { si: false, baja: true, kids: false };
  const m = /^si\b(.*)$/.exec(t);
  if (!m) return nada;
  const resto = m[1].replace(/[,;.]/g, " ").trim();
  const piezas = resto ? resto.split(/\s+/) : [];
  const valen = piezas.every(function (x) {
    return x === "kids" || x === "ninos" || /^\d{4}-\d{2}-\d{2}$/.test(x) || /^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(x);
  });
  if (!valen) return { si: false, baja: false, kids: false, raro: true };   // empieza con «sí» pero no se entiende: no cuenta y se cuenta
  return { si: true, baja: false, kids: piezas.indexOf("kids") !== -1 || piezas.indexOf("ninos") !== -1 };
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
    // Meta rechaza un parámetro vacío para todos: la primera frase (y la de inglés, si la edición trae inglés) tiene que tener texto.
    if (!b || !/^[a-z0-9-]{1,120}$/.test(String(b._slug || "")) || !waLimpia_(b.titulo) || !waLimpia_((b.frases || [])[0]) ||
        (waTieneEn_(b) && !waLimpia_(b.frases_en[0]))) {
      throw new Error("La edición de " + cat + " no trae slug, título o primera frase: no mandé nada.");
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
