/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Triggui · Tarjeta Editorial Email — NIVEL DIOS CUÁNTICO-QUARK V18
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * REFACTOR MATEMÁTICO GEOMÉTRICO AXIOMÁTICO (V18 sobre v9.6):
 *
 * 1. CONGRUENCIA TOTAL CON LA EDICIÓN VIVA
 *    - Lee contenido_manual.json y toma libros[0] (el más reciente)
 *    - Usa libro.tarjeta directamente (sin llamadas a OpenAI)
 *    - Pinta TODO con accent del libro (tarjeta.style.accent)
 *    - Eyebrow "EDICIÓN · #NNN" idéntico a la viva
 *    - Botones inferiores: Buscalibre + Bola Mágica + Penguin Random House
 *
 * 2. CERO LLAMADAS A OPENAI
 *    - Eliminado construirPromptContenido + generarContenidoDesdeOpenAI
 *    - El contenido viene pre-generado del pipeline (build-contenido-nucleus.js)
 *    - Tiempo de ejecución: 4-8s → 0.5-1s
 *
 * 3. COMPATIBILIDAD EMAIL CUÁNTICO-QUARK (intocable)
 *    - mso-line-height-rule:exactly (Outlook)
 *    - x-apple-disable-message-reformatting (Apple Mail)
 *    - -webkit-text-size-adjust:100% (iOS)
 *    - color-scheme:light (Apple Mail dark mode)
 *    - Tablas role="presentation" (Outlook layout)
 *    - parseFont sin shorthand (Outlook Mobile)
 *    - Tokens ASCII {{H}} (encoding-safe)
 *    - mixHex precalculado hex6 (Outlook 2010-2013 sin rgba)
 *
 * 4. ABORT-IF-INVALID
 *    - Si libros[0] no tiene tarjeta válida, ABORTA con error log
 *    - No envía email mal renderizado
 *
 * 5. SAGRADO (no se toca ni una partícula)
 *    - INTRO_MESSAGES + shouldShowIntro (frequency=1)
 *    - FOOTER_CTA permanente
 *    - cid:logoTriggui + cid:portadaTriggui inline
 *    - Tracking columnas J/K/L/M/N
 *    - resetearContadorIntro + verEstadoIntro + testEnviarConIntro
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

const CONTENIDO_URL = "https://raw.githubusercontent.com/badirnakid/triggui-content/main/contenido_manual.json";
const SHEET_NAME    = "Triggui Emails Prueba";

/* ════════════════════ V18h DELIVERABILITY CONFIG ════════════════════════
 * Estos valores controlan cómo aparece el remitente en el cliente de email.
 *
 * REMITENTE_DISPLAY_NAME:
 *   Nombre que verá el destinatario. Ej: "Triggui · Badir" o solo "Triggui"
 *   IMPORTANTE: NO use "noreply" ni términos genéricos. Gmail los penaliza.
 *
 * REMITENTE_REPLY_TO:
 *   Email al que se responden los mensajes.
 *   FASE 1 (hoy): badirnakid@gmail.com (tu cuenta personal)
 *   FASE 2 (cuando tengas Workspace): hola@triggui.com
 *
 *   Tener un Reply-To real (no noreply) MEJORA significativamente la
 *   deliverability porque Gmail premia emails con canal de respuesta válido.
 * ══════════════════════════════════════════════════════════════════════════ */
const REMITENTE_DISPLAY_NAME = "Triggui";
const REMITENTE_REPLY_TO     = "badirnakid@gmail.com";  // FASE 2: cambiar a hola@triggui.com

/* ════════════════════ V18i UNSUBSCRIBE CONFIG ═══════════════════════════
 *
 * UNSUBSCRIBE_SECRET:
 *   Clave secreta para firmar tokens HMAC. Previene que alguien manipule
 *   URLs y de baja a tus suscriptores sin permiso.
 *
 *   ⚠️ NO cambies después de producción. Si cambias, todos los tokens
 *   en emails ya enviados quedarán inválidos.
 *
 * UNSUBSCRIBE_COL:
 *   Columna O (15) — guarda el status del suscriptor.
 *   Valores posibles:
 *     - ""                      → activo (default, fila nueva)
 *     - "UNSUBSCRIBED [fecha]"  → se dio de baja
 *     - "RESUSCRITO [fecha]"    → reactivada tras unsub
 *
 * WEB_APP_URL:
 *   URL base del Web App para construir links de unsubscribe.
 *   ⚠️ ACTUALIZAR si re-deployas con nueva URL.
 * ══════════════════════════════════════════════════════════════════════════ */
const UNSUBSCRIBE_SECRET = "triggui_unsub_v18i_axiomatic_quantum_quark_2026";
const UNSUBSCRIBE_COL    = 15;
// V18l — Cap semanal cuántico-quark
const SENDS_WEEK_COL     = 16;   // Col P (1-based): historial timestamps últimos envíos
const CAP_MAX_GLOBAL     = 2;    // Máximo global (MEMBER cap). FREE/RESUSCRITO/BULK usan 1.
const WEB_APP_URL        = "https://script.google.com/macros/s/AKfycbwQHyASB3kiqKxdNszpZtxl2IZ9MXrvzrTp4mygKaSZzXVRKWae2VScJ9xCREcbOWk0/exec";

/* ═══════════════════════════ TOKENS ASCII ═══════════════════════════════ */
const TOKEN_OPEN  = "{{H}}";
const TOKEN_CLOSE = "{{/H}}";

/* ═══════════════════════════ URLS PÚBLICAS ══════════════════════════════ */
const URL_BUSCALIBRE_LOGO = "https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/buscalibre.png";
const URL_PENGUIN_LOGO    = "https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/logopenguin.png";

/* ════════════════════ V20 KIDS PROMO BANNER ═══════════════════════════════
 * Banner promocional al inicio del email anunciando Triggui Kids.
 *
 * KIDS_PROMO_ENABLED:
 *   true  → mostrar banner en TODOS los emails
 *   false → desactivar (cuando ya no aplique, 2-3 semanas o cuando decidas)
 *
 * KIDS_URL_TARGET:
 *   URL destino del CTA. No cambiar a menos que cambie el dominio.
 * ════════════════════════════════════════════════════════════════════════ */
const KIDS_PROMO_ENABLED = true;
const KIDS_URL_TARGET = "https://app.triggui.com/kids";

/* ═══════════════════════ CONFIGURACIÓN DE ESTILO ═══════════════════════════
 *
 * V18c NIVEL DIOS CUÁNTICO-QUARK MATEMÁTICO GEOMÉTRICO AXIOMÁTICO:
 *
 * Cambios sobre V18b:
 * 1. UN solo contenedor visual (no 2 anidados)
 * 2. Eyebrow #NNN más prominente arriba del título
 * 3. Layout título+portada con TABLA 2 columnas (no align="right")
 *    → resuelve espacio en blanco entre título y chip en iOS Mail
 * 4. parrafoTop/Bot full width (sin wrap problemático por la portada)
 * 5. Logos proporcionales: buscalibre 20px, penguin 36px
 * 6. font-size:0 en <a> para alineación vertical de logos en iOS
 *
 * Espacio matemático para título (iPhone 390px viewport):
 *   cardWidth(520) capped → 390px
 *   paddingCard(5*2):  -10 → 380px
 *   blockPadding(18*2): -36 → 344px (un solo contenedor más generoso)
 *   coverWidth(130) + colGap(16): -146 → 198px para título
 *   → 'autenticidad' (20px serif) ~120px CABE PERFECTO ✓
 * ═══════════════════════════════════════════════════════════════════════════ */
const TRIGGUI_STYLE_CONFIG = {
  name: "Triggui Email · Espejo de la Edición Viva",
  version: "V18d",

  /* Lienzo */
  cardWidth: 520,
  background: "#ffffff",

  /* Defaults */
  defaultPaper:  "#FFFFFF",
  defaultInk:    "#1A1A1A",
  defaultAccent: "#1A1A1A",
  defaultBorder: "#E5E7EB",

  /* Marco — V18d: UN solo contenedor con FONDO BLANCO + border accent */
  cardRadius: 20,
  cardBorderWidth: 1,
  cardPadding: "20px",                  // un poco más generoso

  /* Portada */
  coverWidth: 130,
  coverRadius: 6,
  coverMaxHeight: 200,
  coverShadow: "0 4px 12px rgba(0,0,0,0.08)",

  /* Layout título+portada */
  titlePortadaColGap: 16,

  /* Tipografías */
  serif: "'Noto Serif Display', Georgia, 'Times New Roman', serif",
  sans:  "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",

  /* Jerarquía — V18d: párrafos más legibles */
  fontEyebrowLabel:  "600 12px/1.0",
  fontEyebrowNumber: "700 18px/1.0",
  fontTitle:         "700 22px/1.32",   // 20 → 22 (un poco más prominente)
  fontParagraph:     "400 17px/1.6",    // 16/1.55 → 17/1.6 (MÁS LEGIBLE como pediste)
  fontSubtitle:      "700 17px/1.4",    // 16 → 17 (coherente con parrafo)
  fontFooter:        "400 13px/1.5",
  fontButton:        "700 14px/1.0",
  fontButtonDescubre:"700 17px/1.0",    // Descubre/Discover MÁS GRANDE

  /* Letter spacing */
  titleLetterSpacing: "-0.2px",
  paragraphLetterSpacing: "0px",
  subtitleLetterSpacing: "0px",
  eyebrowLetterSpacing: "0.18em",

  /* Colores fijos */
  paragraphColor: "#2A2A2A",
  paragraphColorMuted: "#4A4A4A",
  footerTextColor: "#475569",
  eyebrowLabelColor: "#9CA3AF",
  separatorColor: "#00000012",          // hairline 7% opacity, ligeramente más visible

  /* Spacing */
  spaceAfterEyebrow: "16px",
  spaceAfterTitle: "10px",
  spaceAfterChip: "16px",
  spaceAfterParrafoTop: "22px",
  spaceAfterSeparator: "22px",
  spaceAfterSubtitle: "10px",

  /* Highlight */
  highlightWeight: "700",
  highlightPadding: "3px 8px",
  highlightRadius: 6,
  highlightLetterSpacing: "0.1px",

  /* Author chip */
  authorChipEnabled: true,
  authorChipPadding: "5px 12px",
  authorChipRadius: 14,
  authorChipWeight: "700",
  authorChipLetterSpacing: "0.1px",

  /* Botones V18d — logos finales nivel dios */
  buttonHeight: 54,
  buttonRadius: 14,
  buttonGap: 10,
  buttonLogoBuscalibre: 18,             // 20 → 18 (más pequeño como pediste)
  buttonLogoPenguin: 40,                // 36 → 40 (más grande como pediste)
  buscalibreBg: "#000000",
  buscalibreInk: "#FFFFFF",
  descubreBg:   "#1F1F1F",
  descubreInk:  "#FFFFFF",
  penguinBg:    "#101010",
  penguinInk:   "#FFFFFF",

  /* Espacio entre tarjeta ES y tarjeta EN */
  espacioEntreVersiones: "24px",

  /* Divisor entre versión ES e EN */
  divisorVersionesText: "English version",

  /* Logo variant */
  logoVariant: "negro",

  /* Footer logo strip */
  logoStripBackground: "#ffffff",
  logoStripBorder: "#EBEBEB",
  logoStripPadding: "20px 16px",

  /* Contraste */
  minContrastAA: 4.5,
  minContrastAAA: 7.0
};

/* ═══════════════════════ URLS BOTONES ESPAÑOL/INGLÉS ════════════════════ */
const URLS_BOTONES = {
  es: {
    buscalibre:  (query) => "https://www.buscalibre.com.mx/libros/search/?q=" + encodeURIComponent(query),
    descubre:    (palabra) => "https://www.buscalibre.com.mx/libros/search/?q=" + encodeURIComponent(palabra),
    penguin:     (palabra) => "https://www.penguinlibros.com/mx/?mot_q=" + encodeURIComponent(palabra),
    descubreLabel: "Descubre"
  },
  en: {
    // V18d: librería en inglés (bookdelivery.com como pediste)
    buscalibre:  (query) => "https://www.bookdelivery.com/books/search/?q=" + encodeURIComponent(query),
    descubre:    (palabra) => "https://www.bookdelivery.com/books/search/?q=" + encodeURIComponent(palabra),
    // V18d: penguin US con query param ?q (formato pedido por Badir)
    penguin:     (palabra) => "https://www.penguinrandomhouse.com/search/" + encodeURIComponent(palabra) + "?q=" + encodeURIComponent(palabra),
    descubreLabel: "Discover"
  }
};

/* ═════════════════════════ MENSAJES INTRO/CTA ══════════════════════════
 * SAGRADO: no se toca. frequency=1 (sale en cada envío como pidió Badir).
 * ═══════════════════════════════════════════════════════════════════════ */
const INTRO_MESSAGES = {
  frequency: 1,
  texts: [
    {
      html: `<div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;text-align:center;padding:0 20px 20px 20px;margin:0;">
  Te comparto estas tarjetas con mucho gusto. Si ya estás suscrito, qué bien! Si no, <a href="https://triggui.com" style="color:#2563EB;text-decoration:underline;">suscríbete aquí</a> para recibirlas por WhatsApp cada semana.
</div>`,
      plain: "Te comparto estas tarjetas con mucho gusto. Si ya estás suscrito, qué bien! Si no, suscríbete en https://triggui.com para recibirlas por WhatsApp cada semana.\n\n"
    },
    {
      html: `<div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;text-align:center;padding:0 20px 20px 20px;margin:0;">
  Escríbenos al <strong style="color:#111827;">+52 155 3239 4017</strong> o <a href="https://triggui.com" style="color:#2563EB;text-decoration:underline;">suscríbete aquí</a> para recibir estas chispas de lectura por WhatsApp.
</div>`,
      plain: "Escríbenos al +52 155 3239 4017 o suscríbete en https://triggui.com para recibir estas chispas de lectura por WhatsApp.\n\n"
    },
    {
      html: `<div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;text-align:center;padding:0 20px 20px 20px;margin:0;">
  Hoy te comparto tarjetas que vale la pena guardar. Recíbelas directo en tu WhatsApp cada semana → <a href="https://triggui.com" style="color:#2563EB;text-decoration:underline;">suscríbete aquí</a>
</div>`,
      plain: "Hoy te comparto tarjetas que vale la pena guardar. Recíbelas directo en tu WhatsApp cada semana → https://triggui.com\n\n"
    }
  ]
};

/* ═══════════════════════ FOOTER CTA NIVEL DIOS V18e ═══════════════════════
 *
 * Texto que diferencia Triggui de TODO lo demás en el mercado.
 *
 * Estrategia matemática:
 *   - Eyebrow "RECIBE TRIGGUI EN TU WHATSAPP" en accent gris suave
 *   - Promesa concreta + emocional: "Una tarjeta como esta en el momento
 *     exacto que mejore un poco tu ánimo"
 *   - CTA limpio: triggui.com con underline accent
 *   - Contacto alternativo: WhatsApp +52
 *
 * Tipografía: Inter sans, jerarquía clara (eyebrow 11px / cuerpo 15px)
 * Defensas: mso-line-height-rule, antiWrapCss en textos largos
 * ══════════════════════════════════════════════════════════════════════════ */
// V19.2.2: bloque "Recibe TAMBIÉN Triggui en tu WhatsApp" — SOLO para arriba (aleatorio).
// NO incluye triggui.com ni número de WhatsApp (eso vive permanentemente en el footer).
// Mismo tipo de letra que el footer para coherencia visual cuántico-quark.
function generarWhatsAppPromoTopHTML(cardWidth) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding:10px 12px 14px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${cardWidth}px;">
        <tr><td style="text-align:center;background:#FAFAFA;border-radius:8px;padding:16px 18px;">
          <div style="
            font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
            font-size:11px;
            line-height:1;
            font-weight:600;
            color:#9CA3AF;
            letter-spacing:0.22em;
            text-transform:uppercase;
            margin:0 0 12px 0;
            mso-line-height-rule:exactly;
          ">Recibe también Triggui en tu WhatsApp</div>

          <div style="
            font-family:'Noto Serif Display',Georgia,'Times New Roman',serif;
            font-size:16px;
            line-height:1.5;
            font-weight:400;
            color:#1A1A1A;
            letter-spacing:-0.1px;
            margin:0;
            mso-line-height-rule:exactly;
          ">Una tarjeta como esta en el momento exacto que mejore un poco tu ánimo.</div>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

const WHATSAPP_PROMO_TOP_PLAIN = "\n────────────────────────────\nRECIBE TAMBIÉN TRIGGUI EN TU WHATSAPP\n\nUna tarjeta como esta en el momento exacto que mejore un poco tu ánimo.\n────────────────────────────\n";

// ═══════════════════════════════════════════════════════════════════════════
// V20 — KIDS PROMO BANNER (clonado del patrón WhatsApp promo)
// Mismo formato visual (table-based, mismas fuentes, padding consistente).
// Diferenciado por: borde sutil oro + CTA naranja Triggui.
// Compatible Gmail/Outlook/iOS Mail (VML fallback para Outlook button).
// Toggleable global con KIDS_PROMO_ENABLED.
// ═══════════════════════════════════════════════════════════════════════════
function generarKidsPromoTopHTML(cardWidth) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding:10px 12px 14px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${cardWidth}px;">
        <tr><td style="text-align:center;background:#FAFAFA;border:1px solid #F0E6D0;border-radius:8px;padding:18px 18px 20px 18px;">
          <div style="
            font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
            font-size:11px;
            line-height:1;
            font-weight:600;
            color:#B8862A;
            letter-spacing:0.22em;
            text-transform:uppercase;
            margin:0 0 12px 0;
            mso-line-height-rule:exactly;
          ">Algo nuevo</div>

          <div style="
            font-family:'Noto Serif Display',Georgia,'Times New Roman',serif;
            font-size:16px;
            line-height:1.5;
            font-weight:400;
            color:#1A1A1A;
            letter-spacing:-0.1px;
            margin:0 0 16px 0;
            mso-line-height-rule:exactly;
          ">Conoce <strong style="font-weight:600;">Triggui Kids</strong>. Un valor en 30 segundos para los niños.</div>

          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${KIDS_URL_TARGET}" style="height:38px;v-text-anchor:middle;width:150px;" arcsize="16%" stroke="f" fillcolor="#E8A838">
            <w:anchorlock/>
            <center style="color:#FFFFFF;font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.05em;">Conocer &rarr;</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${KIDS_URL_TARGET}" target="_blank" style="
            display:inline-block;
            background:#E8A838;
            color:#FFFFFF;
            text-decoration:none;
            padding:10px 22px;
            border-radius:6px;
            font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
            font-size:13px;
            font-weight:600;
            letter-spacing:0.05em;
            mso-line-height-rule:exactly;
            line-height:1;
          ">Conocer &rarr;</a>
          <!--<![endif]-->
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

const KIDS_PROMO_TOP_PLAIN = "\n────────────────────────────\nALGO NUEVO · CONOCE TRIGGUI KIDS\n\nUn valor en 30 segundos para los niños.\n" + KIDS_URL_TARGET + "\n────────────────────────────\n";

// V19.2.2: FOOTER PERMANENTE con triggui.com + número + cancelar (siempre presente).
const FOOTER_CTA = {
  html: `<tr><td style="padding:24px 20px 28px 20px;text-align:center;background:#FAFAFA;border-top:1px solid #EBEBEB;">
    <div style="
      font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
      font-size:15px;
      line-height:1.4;
      font-weight:500;
      margin:0;
      mso-line-height-rule:exactly;
    ">
      <a href="https://triggui.com" style="color:#1A1A1A;text-decoration:none;border-bottom:2px solid #1A1A1A;padding-bottom:1px;">triggui.com</a>
    </div>

    <div style="
      font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
      font-size:12px;
      line-height:1.4;
      font-weight:400;
      color:#9CA3AF;
      margin:14px 0 0 0;
      mso-line-height-rule:exactly;
    ">o por WhatsApp al <strong style="color:#6B7280;font-weight:500;">+52 155 3239 4017</strong></div>

    <div style="
      font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;
      font-size:11px;
      line-height:1.4;
      font-weight:400;
      color:#C5C5C5;
      margin:22px 0 0 0;
      mso-line-height-rule:exactly;
    ">
      <a href="{{UNSUB_LINK}}" style="color:#B0B0B0;text-decoration:underline;">Cancelar suscripción</a>
    </div>
  </td></tr>`,
  plain: "\n\n────────────────────────────\n→ triggui.com\no WhatsApp +52 155 3239 4017\n────────────────────────────\n\nCancelar suscripción: {{UNSUB_LINK}}"
};

function shouldShowIntro() {
  const props = PropertiesService.getScriptProperties();
  let counter = parseInt(props.getProperty("INTRO_COUNTER") || "0");
  counter++;
  props.setProperty("INTRO_COUNTER", counter.toString());
  return (counter % INTRO_MESSAGES.frequency === 0);
}

function getRandomIntro() {
  const messages = INTRO_MESSAGES.texts;
  return messages[Math.floor(Math.random() * messages.length)];
}

/* ════════════════════════════ UTILIDADES ═════════════════════════════════
 * SAGRADO: las defensas email se conservan exactas a v9.6.
 * ═════════════════════════════════════════════════════════════════════════ */
function _esc(s){ return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function limpiarFrase(texto){ return (texto||"").normalize("NFKD").replace(/\s+/g," ").trim(); }
function getPortadaURL(libro){ const url=String(libro?.portada||"").trim(); return /^https?:\/\//i.test(url)?url:""; }
function fetchPortadaBlob(url){ try{ const res=UrlFetchApp.fetch(url); if(res.getResponseCode()!==200) return null; const blob=res.getBlob(); blob.setName("portada"); return blob; }catch(e){return null;} }
function escapeRegExp(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function parseFont(sh, fb){ const m=String(sh||"").match(/^\s*(\d{3})\s+(\d+(?:\.\d+)?px)\/(\d+(?:\.\d+)?)/); return m?{w:m[1],sz:m[2],lh:m[3]}:(fb||{w:"400",sz:"16px",lh:"1.5"}); }

function htmlDecodeDeep(s){
  let out = String(s || "");
  for (let i = 0; i < 3; i++) {
    out = out
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'");
  }
  return out;
}

/* ─── Contraste WCAG (SAGRADO v9.6) ─── */
function _lum(hex){ const [r,g,b]=hex.replace("#","").match(/.{2}/g).map(x=>parseInt(x,16)/255); const f=v=>(v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)); return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); }
function _contrast(a,b){ const L1=_lum(a), L2=_lum(b); const hi=Math.max(L1,L2), lo=Math.min(L1,L2); return (hi+0.05)/(lo+0.05); }
function _bestInkFor(bg, pref, minAA){ const b = (pref && _contrast(pref,bg)>=minAA) ? pref : null; const black="#000000", white="#FFFFFF"; return b || (_contrast(black,bg)>=_contrast(white,bg) ? black : white); }

/* ─── Random determinista (SAGRADO v9.6) ─── */
function _hash32(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619);} return h>>>0; }
function _mulberry32(a){ return function(){ let t=a+=0x6D2B79F5; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }

/* ─── Defensa tokens unicode (SAGRADO v9.6) ─── */
function _stripInvis(s){
  return String(s || "")
    .replace(/[\u00A0\u1680\u180E\u2000-\u200F\u202F\u205F\u2060-\u2064\u2066-\u2069\uFEFF]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "");
}

const LB = "(?:\\{|\\uFF5B|\\uFE5B)";
const RB = "(?:\\}|\\uFF5D|\\uFE5C)";
const INV = "[\\s\\u00A0\\u1680\\u180E\\u2000-\\u200F\\u202F\\u205F\\u2060-\\u2064\\u2066-\\u2069\\uFEFF]*";
const TOKEN_ANY_RE = new RegExp(`${LB}${LB}${INV}\\/?${INV}H${INV}${RB}${RB}`, "gi");

function normalizeTokens(text){
  let s = String(text || "");
  s = s.replace(new RegExp(`${LB}${LB}${INV}H${INV}${RB}${RB}`, "gi"), TOKEN_OPEN);
  s = s.replace(new RegExp(`${LB}${LB}${INV}\\/${INV}H${INV}${RB}${RB}`, "gi"), TOKEN_CLOSE);
  s = s.replace(/\[\s*H\s*\]/gi, TOKEN_OPEN).replace(/\[\s*\/\s*H\s*\]/gi, TOKEN_CLOSE);
  return _stripInvis(s);
}

function sanitizeParagraph(html) {
  let out = htmlDecodeDeep(String(html || ""));
  out = out
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/^#+\s+/gm, "");
  return out.replace(/[ \t]{2,}/g, " ").trim();
}

/* ═══════════════════════ FUNCIONES NUEVAS V18 ════════════════════════════ */

/**
 * V18b NIVEL DIOS: defensa anti-wrap matemática geométrica axiomática.
 *
 * Retorna CSS que indica a TODOS los clientes email:
 *   "Si una palabra no cabe, rompela CON GUION como tipógrafo profesional"
 *   "NO la cortes en mitad de sílaba sin guion como cliente email bruto"
 *
 * Combinación cuántico-quark de propiedades CSS:
 *   - word-wrap:break-word     → fallback legacy
 *   - overflow-wrap:break-word → estándar moderno
 *   - hyphens:auto             → permite hyphenation por sílabas si cabe con guion
 *   - -webkit-hyphens:auto     → Safari/iOS Mail
 *   - -ms-hyphens:auto         → Outlook
 *   - mso-text-justify:auto    → Outlook desktop bonus
 *
 * Aplicado a: título, párrafos, subtítulo, chip autor.
 * NO se aplica a: botones (no queremos quiebre dentro de un botón).
 */
function antiWrapCss() {
  return [
    "word-wrap:break-word",
    "overflow-wrap:break-word",
    "hyphens:auto",
    "-webkit-hyphens:auto",
    "-ms-hyphens:auto",
    "word-break:normal"
  ].join(";");
}

/**
 * mixHex(hexA, hexB, alpha) — calcula color sólido hex6 mezclando A con B
 *
 * RAZÓN MATEMÁTICA: Outlook 2010-2013 NO entiende rgba() ni hex8.
 * Esta función precalcula el resultado de "accent al 14% sobre paper" como
 * un hex6 sólido que TODOS los clientes email renderizan idéntico.
 *
 * Fórmula geométrica axiomática:
 *   resultado_RGB = colorA_RGB * alpha + colorB_RGB * (1 - alpha)
 *
 * Ejemplos:
 *   mixHex("#1258E2", "#FFFFFF", 0.14) → "#E5EBFC" (chip azul Cuestión Límites)
 *   mixHex("#12E2D1", "#FFFFFF", 0.14) → "#E0FAF8" (chip turquesa Markus Gabriel)
 *   mixHex("#1258E2", "#FFFFFF", 0.20) → "#D9E2F9" (border más visible)
 */
function mixHex(hexA, hexB, alpha) {
  const norm = (h) => {
    let x = String(h || "").trim().replace(/^#/, "");
    if (x.length === 3) x = x.split("").map(c => c + c).join("");
    if (x.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(x)) return null;
    return x;
  };
  const a = norm(hexA);
  const b = norm(hexB);
  if (!a || !b) return hexA || "#000000";
  const al = Math.max(0, Math.min(1, alpha));
  const ar = parseInt(a.slice(0,2), 16), ag = parseInt(a.slice(2,4), 16), ab = parseInt(a.slice(4,6), 16);
  const br = parseInt(b.slice(0,2), 16), bg = parseInt(b.slice(2,4), 16), bb = parseInt(b.slice(4,6), 16);
  const r = Math.round(ar * al + br * (1 - al));
  const g = Math.round(ag * al + bg * (1 - al));
  const bl = Math.round(ab * al + bb * (1 - al));
  const toHex = (n) => n.toString(16).padStart(2, "0").toUpperCase();
  return "#" + toHex(r) + toHex(g) + toHex(bl);
}

/**
 * formatEdicionNumero(n) — normaliza 41 → "041", "041" → "041", null → ""
 *
 * Idempotente, defensivo. Si el pipeline manda número crudo o string, queda igual.
 */
function formatEdicionNumero(n) {
  if (n === null || n === undefined || n === "") return "";
  const s = String(n).trim().replace(/^#/, "");
  if (!/^\d+$/.test(s)) return "";
  return s.padStart(3, "0");
}
/**
 * V14 SINFÓNICO NIVEL DIOS CUÁNTICO-QUARK MATEMÁTICO
 *
 * Selecciona una phrase sinfónica del _nucleus del libro según rol preferido.
 *
 * El pipeline (build-contenido-nucleus.js v12+) genera 4 phrases con
 * rol_sinfonico (abrir/profundizar/aterrizar/resonar) en cada idioma:
 *   - _nucleus.edition_blocks_es (4 phrases)
 *   - _nucleus.og_phrases_es     (4 phrases)
 *
 * Total: 8 phrases con metadata sinfónica por libro (más en EN).
 *
 * Args:
 *   libro: objeto del JSON
 *   rolesPreferidos: array ['abrir', 'profundizar', 'aterrizar', 'resonar']
 *                    Si se incluyen múltiples, prefiere cualquiera de ellos.
 *                    Si está vacío, cualquier phrase del pool sirve.
 *   idioma: 'es' o 'en' (default 'es')
 *
 * Returns: { phrase, rol, animo, origin } o null si NO hay metadata sinfónica.
 *
 * Garantía cuántico-quark: si retorna null, el caller usa el fallback legacy.
 * NUNCA rompe el email. Defensa total para libros pre-v12.
 */
function pickSinfonicaPhrase(libro, rolesPreferidos, idioma) {
  const nucleus = (libro && libro._nucleus) || {};
  const isEN = (idioma === 'en');

  // Las dos fuentes sinfónicas del nucleus
  const editionBlocks = isEN
    ? (nucleus.edition_blocks_en || [])
    : (nucleus.edition_blocks_es || []);
  const ogPhrases = isEN
    ? (nucleus.og_phrases_en || [])
    : (nucleus.og_phrases_es || []);

  // Construir pool combinado (soporta rol_sinfonico ES y role_symphonic EN)
  const pool = [];
  for (const block of editionBlocks) {
    if (!block || typeof block !== 'object' || !block.phrase) continue;
    const rol = block.rol_sinfonico || block.role_symphonic;
    if (!rol) continue;
    pool.push({
      phrase: String(block.phrase).trim(),
      rol: rol,
      animo: block.eje_animo || block.mood_axis,
      origin: 'edition_block'
    });
  }
  for (const og of ogPhrases) {
    if (!og || typeof og !== 'object' || !og.phrase) continue;
    const rol = og.rol_sinfonico || og.role_symphonic;
    if (!rol) continue;
    pool.push({
      phrase: String(og.phrase).trim(),
      rol: rol,
      animo: og.eje_animo || og.mood_axis,
      origin: 'og_phrase'
    });
  }

  // Sin sinfonía → null (caller usa fallback)
  if (pool.length === 0) return null;

  // Filtrar por roles preferidos si están definidos
  let candidates = pool;
  if (rolesPreferidos && rolesPreferidos.length > 0) {
    const filtered = pool.filter(p => rolesPreferidos.indexOf(p.rol) !== -1);
    if (filtered.length > 0) candidates = filtered;
  }

  // Selección aleatoria del pool filtrado
  return candidates[Math.floor(Math.random() * candidates.length)];
}
/**
 * pickRandomPalabra(libro) — selecciona palabra random de libro.palabras
 *
 * Usada para:
 *   - Bola mágica → buscalibre search
 *   - Penguin Random House → mot_q search
 *
 * Misma lógica que la viva línea 3352 (palabrasForCard random).
 */
function pickRandomPalabra(libro) {
  const palabras = Array.isArray(libro?.palabras) ? libro.palabras.filter(x => /\S/.test(x)) : [];
  if (!palabras.length) return "";
  return palabras[Math.floor(Math.random() * palabras.length)];
}

/**
 * validarLibroEmail(libro) — verifica que el libro tenga todo lo necesario
 *
 * Retorna { ok: true } o { ok: false, reason: "..." }
 *
 * AXIOMA: Si retorna ok=false, enviarTrigguiLunes ABORTA con error log.
 * No enviamos email mal renderizado.
 */
function validarLibroEmail(libro) {
  if (!libro) return { ok: false, reason: "libro es null/undefined" };
  if (!libro.titulo || !/\S/.test(libro.titulo)) return { ok: false, reason: "libro.titulo vacío" };
  if (!libro.autor || !/\S/.test(libro.autor)) return { ok: false, reason: "libro.autor vacío" };
  const t = libro.tarjeta;
  if (!t || typeof t !== "object") return { ok: false, reason: "libro.tarjeta no existe" };
  if (!t.titulo || !/\S/.test(t.titulo)) return { ok: false, reason: "libro.tarjeta.titulo vacío" };
  if (!t.parrafoTop || !/\S/.test(t.parrafoTop)) return { ok: false, reason: "libro.tarjeta.parrafoTop vacío" };
  if (!t.subtitulo || !/\S/.test(t.subtitulo)) return { ok: false, reason: "libro.tarjeta.subtitulo vacío" };
  if (!t.parrafoBot || !/\S/.test(t.parrafoBot)) return { ok: false, reason: "libro.tarjeta.parrafoBot vacío" };
  return { ok: true };
}

/**
 * Resuelve la paleta cromática efectiva del libro con defaults defensivos.
 * Retorna { paper, ink, accent, border, tintBg, borderSubtle, accentSafe }.
 */
function resolveLibroPalette(libro) {
  return resolveLibroPaletteFromStyle((libro && libro.tarjeta && libro.tarjeta.style) || {});
}

/**
 * V18d NIVEL DIOS: variante que acepta style directamente.
 *
 * Esto permite que renderTarjetaCard use el style específico de cada
 * tarjeta (tarjeta.style para ES, tarjeta_en.style para EN). Si
 * tarjeta_en tiene accent diferente al de tarjeta, cada versión usa
 * SU propio color matemáticamente axiomático.
 *
 * En la práctica los accents suelen ser similares pero no idénticos
 * (#1258E2 vs #1269E2 para Cuestión de límites). Honrar esa diferencia
 * es lo que diferencia un email "casi bien" de uno nivel dios.
 */
function resolveLibroPaletteFromStyle(style) {
  const c = TRIGGUI_STYLE_CONFIG;
  style = style || {};
  const paper  = style.paper  || c.defaultPaper;
  const ink    = style.ink    || c.defaultInk;
  const accent = style.accent || c.defaultAccent;
  const border = style.border || c.defaultBorder;

  // Mezclas precalculadas hex6 (Outlook 2010 friendly)
  const tintBg       = mixHex(accent, paper, 0.14);  // chip + highlights bg
  const borderSubtle = mixHex(accent, paper, 0.22);  // card border más visible que default
  const tintBgSoft   = mixHex(accent, paper, 0.10);  // block bg ultra sutil

  // Accent con contraste AA garantizado sobre paper
  const accentSafe = _contrast(accent, paper) >= c.minContrastAA
    ? accent
    : _bestInkFor(paper, accent, c.minContrastAA);

  // Ink con contraste AAA garantizado sobre paper
  const inkSafe = _contrast(ink, paper) >= c.minContrastAAA
    ? ink
    : _bestInkFor(paper, ink, c.minContrastAAA);

  return { paper, ink: inkSafe, accent: accentSafe, border, tintBg, tintBgSoft, borderSubtle };
}

/* ══════════════════════ RENDER HIGHLIGHTS V18 ════════════════════════════
 *
 * V18 CAMBIO: en lugar de paleta universal random, los highlights usan
 * el accent del libro. Idéntico a la viva.
 *
 * Background: mixHex(accent, paper, 0.14) — hex6 sólido para Outlook.
 * Texto: accent puro (bold, validado WCAG).
 *
 * Compatibilidad:
 * - Outlook 2010-2013 ✅ (hex6 sólido)
 * - Gmail ✅ (todo)
 * - iOS Mail ✅ (todo)
 * - Apple Mail ✅ (todo)
 * ══════════════════════════════════════════════════════════════════════════ */
function renderHighlights(text, palette) {
  const c = TRIGGUI_STYLE_CONFIG;
  const accent = palette.accent;
  const tintBg = palette.tintBg;

  let source = normalizeTokens(String(text || ""));
  source = _stripInvis(source);

  const baseParts = [
    `background:${tintBg}`,
    `color:${accent}`,
    `font-weight:${c.highlightWeight}`,
    `padding:${c.highlightPadding}`,
    `border-radius:${c.highlightRadius}px`,
    `letter-spacing:${c.highlightLetterSpacing}`
  ];

  const OPEN  = `${LB}${LB}${INV}H${INV}${RB}${RB}`;
  const CLOSE = `${LB}${LB}${INV}\\/${INV}H${INV}${RB}${RB}`;
  const re = new RegExp(OPEN + "([\\s\\S]*?)" + CLOSE, "gi");

  source = source.replace(re, (_, frag) => {
    const inner = String(frag || "").replace(/\s*\n+\s*/g, " ").trim();
    const style = baseParts.join(";");
    return `<span style="${style}">${_esc(inner)}</span>`;
  });

  // Limpia cualquier token huérfano que haya quedado
  source = source.replace(TOKEN_ANY_RE, "");
  return source;
}

/* ════════════════════════ RENDER EYEBROW V18c ════════════════════════════
 *
 * V18c: "EDICIÓN · #043" más prominente, mejor acomodado arriba del título.
 *   - fontEyebrowLabel:  12px (era 11)
 *   - fontEyebrowNumber: 18px italic accent (era 14)
 *   - Más letter-spacing en "EDICIÓN" (0.18em)
 *   - vertical-align baseline para alinear EDICIÓN con #NNN perfecto
 * ══════════════════════════════════════════════════════════════════════════ */
/* renderEyebrow está definida más abajo (V18d con label customizable) */

/* ════════════════════ RENDER BOTONES INFERIORES V18c ═════════════════════
 *
 * V18c NIVEL DIOS: 3 botones apilados full-width con alineación cuántico-quark.
 *
 *   ┌──────────────────────────────────────┐
 *   │       [logo 20px] buscalibre         │  ← Buscalibre proporcionado
 *   ├──────────────────────────────────────┤  ← gap 10px
 *   │              Descubre                │  ← texto centrado
 *   ├──────────────────────────────────────┤  ← gap 10px
 *   │   [logo 36px] Penguin Random House   │  ← Penguin proporcionado
 *   └──────────────────────────────────────┘
 *
 * SECRETO CUÁNTICO-QUARK NIVEL DIOS:
 * Para alinear logos perfectamente verticalmente en iOS Mail/Outlook iOS,
 * el <a> debe tener font-size:0 (matar la altura residual de la línea
 * de texto). El <img> con vertical-align:middle queda perfectamente
 * centrado SIN compensar contra la línea-base del texto fantasma.
 *
 * Para el botón Descubre (texto): font-size NO va a 0 porque hay texto.
 * ══════════════════════════════════════════════════════════════════════════ */
function renderBotonesCompra(libro, palabraRandom, idioma) {
  const c = TRIGGUI_STYLE_CONFIG;
  const lang = (idioma === "en") ? "en" : "es";
  const urls = URLS_BOTONES[lang];

  const tituloAutor = String(libro.titulo || "") + " " + String(libro.autor || "");
  const buscalibreURL = urls.buscalibre(tituloAutor.trim());
  const descubreURL   = palabraRandom ? urls.descubre(palabraRandom) : buscalibreURL;
  const penguinURL    = palabraRandom ? urls.penguin(palabraRandom)  : urls.penguin("");

  const btnHeight = c.buttonHeight;
  const btnRadius = c.buttonRadius;
  const fBtnDescubre = parseFont(c.fontButtonDescubre, {w:"700",sz:"17px",lh:"1.0"});

  // Base style común (alineación matemática)
  const btnBaseStyle = [
    "display:block",
    "width:100%",
    "box-sizing:border-box",
    `height:${btnHeight}px`,
    `line-height:${btnHeight}px`,
    `border-radius:${btnRadius}px`,
    "text-align:center",
    "text-decoration:none",
    "mso-line-height-rule:exactly",
    "mso-padding-alt:0"
  ];

  // Estilo botones con LOGO (font-size:0 mata altura residual en iOS)
  const btnLogoStyle = btnBaseStyle.concat([
    "font-size:0",
    "line-height:0"
  ]).join(";");

  // Estilo botón TEXTO (Descubre/Discover) — V18d más grande
  const btnTextStyle = btnBaseStyle.concat([
    `font-family:${c.sans}`,
    `font-size:${fBtnDescubre.sz}`,
    `font-weight:${fBtnDescubre.w}`,
    "letter-spacing:0.02em"
  ]).join(";");

  // Img style helper
  const imgStyle = (heightPx) => [
    "display:inline-block",
    "vertical-align:middle",
    `height:${heightPx}px`,
    "width:auto",
    "border:0",
    "outline:none",
    "text-decoration:none"
  ].join(";");

  // Ghost span para alineación vertical en clientes con font-size:0
  const ghostSpan = `<span style="display:inline-block;height:${btnHeight}px;vertical-align:middle;line-height:${btnHeight}px;font-size:0;">&zwj;</span>`;

  // Botón 1: Buscalibre / Bookdelivery
  const btnBuscalibre = `
    <a href="${_esc(buscalibreURL)}" target="_blank" rel="noopener noreferrer" style="
      ${btnLogoStyle};
      background:${c.buscalibreBg};
      color:${c.buscalibreInk};
    ">${ghostSpan}<img src="${URL_BUSCALIBRE_LOGO}" alt="${lang==='en' ? 'Bookdelivery' : 'Buscalibre'}" height="${c.buttonLogoBuscalibre}" style="${imgStyle(c.buttonLogoBuscalibre)}"></a>`.trim();

  // Botón 2: Descubre / Discover (texto, V18d más grande)
  const btnDescubre = `
    <a href="${_esc(descubreURL)}" target="_blank" rel="noopener noreferrer" style="
      ${btnTextStyle};
      background:${c.descubreBg};
      color:${c.descubreInk};
    ">${urls.descubreLabel}</a>`.trim();

  // Botón 3: Penguin Random House (logo más grande)
  const btnPenguin = `
    <a href="${_esc(penguinURL)}" target="_blank" rel="noopener noreferrer" style="
      ${btnLogoStyle};
      background:${c.penguinBg};
      color:${c.penguinInk};
    ">${ghostSpan}<img src="${URL_PENGUIN_LOGO}" alt="Penguin Random House" height="${c.buttonLogoPenguin}" style="${imgStyle(c.buttonLogoPenguin)}"></a>`.trim();

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;">
    <tr><td>${btnBuscalibre}</td></tr>
    <tr><td height="${c.buttonGap}" style="height:${c.buttonGap}px;line-height:${c.buttonGap}px;font-size:0;">&nbsp;</td></tr>
    <tr><td>${btnDescubre}</td></tr>
    <tr><td height="${c.buttonGap}" style="height:${c.buttonGap}px;line-height:${c.buttonGap}px;font-size:0;">&nbsp;</td></tr>
    <tr><td>${btnPenguin}</td></tr>
  </table>`.trim();
}

/* ═════════════════════════ RENDER LOGO STRIP ═════════════════════════════
 *
 * V18: un solo footer al final del card (NO afterEachBlock).
 * Mantiene cid:logoTriggui inline (sagrado v9.6).
 * ══════════════════════════════════════════════════════════════════════════ */
function renderLogoStrip() {
  const c = TRIGGUI_STYLE_CONFIG;
  const fFooter = parseFont(c.fontFooter, {w:"400",sz:"13px",lh:"1.5"});

  return `
    <tr><td style="
      padding:${c.logoStripPadding};
      border-top:1px solid ${c.logoStripBorder};
      background:${c.logoStripBackground};
      text-align:center;
    ">
      <a href="https://triggui.com" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
        <img src="cid:logoTriggui" alt="Triggui" height="22" style="height:22px;width:auto;display:block;margin:0 auto 8px auto;border:0;outline:none;text-decoration:none;">
      </a>
      <div style="
        font-family:${c.sans};
        font-size:${fFooter.sz};
        line-height:${fFooter.lh};
        font-weight:${fFooter.w};
        color:${c.footerTextColor};
        margin:0;
        mso-line-height-rule:exactly;
      ">
        <a href="https://www.instagram.com/triggui/" target="_blank" rel="noopener noreferrer" style="color:${c.footerTextColor};text-decoration:none;margin:0 6px;">@triggui</a>
        ·
        <a href="https://triggui.com" target="_blank" rel="noopener noreferrer" style="color:${c.footerTextColor};text-decoration:none;margin:0 6px;">triggui.com</a>
      </div>
    </td></tr>`.trim();
}

/* ════════════════════════ RENDER TARJETA EDITORIAL ════════════════════════
 *
 * V18 REFACTOR COMPLETO: espejo de la edición viva.
 *
 * Estructura (orden NATURAL, sin cables cruzados):
 *
 *   ╔═══════════════════════════════════════╗
 *   ║ EDICIÓN · #041                        ║  ← eyebrow accent
 *   ║                                       ║
 *   ║ Título grande serif         ╔════════╗║
 *   ║ [Chip Autor]                ║Portada ║║
 *   ║ Párrafo con [highlights]    ╚════════╝║
 *   ║                                       ║
 *   ╠═══════════════════════════════════════╣
 *   ║ Subtítulo accent                      ║
 *   ║ Párrafo bottom con [highlights]       ║
 *   ╚═══════════════════════════════════════╝
 *   [Comprar Buscalibre] [🔮]
 *   [Penguin Random House]
 *   ─── logo Triggui ───
 *   @triggui · triggui.com
 *   FOOTER CTA: Recibe Triggui...
 * ══════════════════════════════════════════════════════════════════════════ */
/* ════════════════════ RENDER UNA TARJETA (ES o EN) ═══════════════════════
 *
 * V18d NIVEL DIOS: función reutilizable para renderizar UNA tarjeta editorial.
 * Acepta:
 *   - libro:        el libro completo del JSON
 *   - portadaRef:   URL o cid: para la portada
 *   - tarjetaKey:   'tarjeta' (ES) o 'tarjeta_en' (EN)
 *   - idioma:       'es' o 'en' (para URLs de botones y labels)
 *   - palabrasKey:  'palabras' (ES) o 'palabras_en' (EN)
 *
 * V18d CAMBIOS clave:
 *   - FONDO BLANCO siempre (no tintBgSoft)
 *   - Border colorido sigue del accent del libro
 *   - Solo highlights/chip/subtítulo usan accent tinted
 *   - Botones con URLs ES o EN según idioma
 *
 * Colores DINÁMICOS por libro:
 *   - eyebrow #NNN     → accent
 *   - chip autor       → tintBg + accent
 *   - subtítulo        → accent
 *   - highlights       → tintBg + accent
 *   - border contenedor → accent (borderSubtle)
 *   - fondo            → SIEMPRE blanco
 * ══════════════════════════════════════════════════════════════════════════ */
function renderTarjetaCard(libro, portadaRef, tarjetaKey, idioma, palabrasKey) {
  const c = TRIGGUI_STYLE_CONFIG;

  // Contenido sanitizado de la tarjeta especificada (ES o EN)
  const tarjeta = libro[tarjetaKey] || {};

  // V18d NIVEL DIOS: palette ESPECÍFICA de esta tarjeta
  // Si tarjeta_en tiene accent diferente al de tarjeta, cada versión usa SU accent
  const palette = resolveLibroPaletteFromStyle(tarjeta.style || (libro.tarjeta && libro.tarjeta.style) || {});

  // Fuentes
  const fTitle = parseFont(c.fontTitle, {w:"700",sz:"22px",lh:"1.32"});
  const fSub   = parseFont(c.fontSubtitle, {w:"700",sz:"17px",lh:"1.4"});
  const fPara  = parseFont(c.fontParagraph, {w:"400",sz:"17px",lh:"1.6"});

  const titulo    = sanitizeParagraph(tarjeta.titulo || "");
  const subtitulo = sanitizeParagraph(tarjeta.subtitulo || "");
  const parrafoTopRaw = normalizeTokens(tarjeta.parrafoTop || "");
  const parrafoBotRaw = normalizeTokens(tarjeta.parrafoBot || "");
  const richParrafoTop = renderHighlights(parrafoTopRaw, palette);
  const richParrafoBot = renderHighlights(parrafoBotRaw, palette);

  // Chip autor (V18d: pegado al título, color accent dinámico)
  const chipHTML = (c.authorChipEnabled && /\S/.test(libro.autor || "")) ? `
      <div style="
        display:inline-block;
        font-family:${c.sans};
        font-size:14px;
        line-height:1;
        font-weight:${c.authorChipWeight};
        background:${palette.tintBg};
        color:${palette.accent};
        padding:${c.authorChipPadding};
        border-radius:${c.authorChipRadius}px;
        letter-spacing:${c.authorChipLetterSpacing};
        margin:0;
        mso-line-height-rule:exactly;
        ${antiWrapCss()};
      ">${_esc(libro.autor)}</div>` : "";

  // Eyebrow EDICIÓN/EDITION · #NNN
  const numeroEdicion = formatEdicionNumero(libro._edicion_numero);
  const labelEyebrow = (idioma === "en") ? "EDITION ·" : "EDICIÓN ·";
  const eyebrowHTML = renderEyebrowConLabel(numeroEdicion, palette, labelEyebrow);

  // Botones inferiores con idioma + palabra random
  const palabras = Array.isArray(libro[palabrasKey]) ? libro[palabrasKey].filter(x => /\S/.test(x)) : [];
  const palabra  = palabras.length > 0 ? palabras[Math.floor(Math.random() * palabras.length)] : "";
  const botonesHTML = renderBotonesCompra(libro, palabra, idioma);

  // V18d: UN solo contenedor BLANCO con border accent dinámico
  const contenedorStyle = [
    "background:#FFFFFF",                                          // V18d: SIEMPRE blanco
    `border:${c.cardBorderWidth}px solid ${palette.borderSubtle}`,// border colorido dinámico
    `border-radius:${c.cardRadius}px`
  ].join(";");

  // Portada cell (columna derecha)
  const portadaCellHTML = portadaRef ? `
                <td valign="top" width="${c.coverWidth + c.titlePortadaColGap}" style="
                  width:${c.coverWidth + c.titlePortadaColGap}px;
                  padding:0 0 0 ${c.titlePortadaColGap}px;
                  vertical-align:top;
                ">
                  <img src="${portadaRef}" width="${c.coverWidth}" alt="${_esc(libro.titulo || '')}" style="
                    display:block;
                    width:${c.coverWidth}px;
                    height:auto;
                    max-height:${c.coverMaxHeight}px;
                    border-radius:${c.coverRadius}px;
                    border:0;
                    outline:none;
                    text-decoration:none;
                    box-shadow:${c.coverShadow};
                  "/>
                </td>` : "";

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"
         style="width:100%;max-width:${c.cardWidth}px;">

    <!-- Eyebrow afuera del contenedor visual -->
    <tr><td style="padding:0 4px ${c.spaceAfterEyebrow} 4px;">
      ${eyebrowHTML}
    </td></tr>

    <!-- ÚNICO contenedor visual con fondo blanco + border accent -->
    <tr><td>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="${contenedorStyle}">
        <tr><td style="padding:${c.cardPadding};">

          <!-- Tabla 2 cols: título+chip / portada -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="top" style="vertical-align:top;">
                <div style="
                  font-family:${c.serif};
                  font-size:${fTitle.sz};
                  line-height:${fTitle.lh};
                  font-weight:${fTitle.w};
                  color:${palette.ink};
                  letter-spacing:${c.titleLetterSpacing};
                  margin:0 0 ${c.spaceAfterTitle} 0;
                  mso-line-height-rule:exactly;
                  ${antiWrapCss()};
                ">${_esc(titulo)}</div>
                ${chipHTML}
              </td>
              ${portadaCellHTML}
            </tr>
          </table>

          <!-- parrafoTop full width -->
          <div style="
            font-family:${c.serif};
            font-size:${fPara.sz};
            line-height:${fPara.lh};
            font-weight:${fPara.w};
            color:${c.paragraphColor};
            letter-spacing:${c.paragraphLetterSpacing};
            margin:${c.spaceAfterChip} 0 0 0;
            mso-line-height-rule:exactly;
            ${antiWrapCss()};
          ">${richParrafoTop}</div>

          <!-- Separator hairline -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:${c.spaceAfterParrafoTop} 0;">
            <tr><td style="border-top:1px solid ${c.separatorColor};line-height:1px;font-size:0;height:1px;">&nbsp;</td></tr>
          </table>

          <!-- Subtítulo accent -->
          <div style="
            font-family:${c.sans};
            font-size:${fSub.sz};
            line-height:${fSub.lh};
            font-weight:${fSub.w};
            color:${palette.accent};
            letter-spacing:${c.subtitleLetterSpacing};
            margin:0 0 ${c.spaceAfterSubtitle} 0;
            mso-line-height-rule:exactly;
            ${antiWrapCss()};
          ">${_esc(subtitulo)}</div>

          <!-- parrafoBot full width -->
          <div style="
            font-family:${c.serif};
            font-size:${fPara.sz};
            line-height:${fPara.lh};
            font-weight:${fPara.w};
            color:${c.paragraphColor};
            letter-spacing:${c.paragraphLetterSpacing};
            margin:0;
            mso-line-height-rule:exactly;
            ${antiWrapCss()};
          ">${richParrafoBot}</div>

        </td></tr>
      </table>
    </td></tr>

    <!-- Botones afuera del contenedor -->
    <tr><td style="padding:0 4px;">
      ${botonesHTML}
    </td></tr>
  </table>`.trim();
}


/* ════════════════════ RENDER EMAIL COMPLETO V18d ═════════════════════════
 *
 * V18d: el email ahora tiene DOS tarjetas (ES y EN) con divisor entre ellas.
 *
 * Estructura:
 *   ┌─ Intro CTA (esporádico)
 *   ├─ TARJETA ES: EDICIÓN · #043 + Cuestión de límites
 *   │  └─ Botones: Buscalibre / Descubre / Penguin
 *   ├─ Divisor "—  English version  —"
 *   ├─ TARJETA EN: EDITION · #043 + The Set Boundaries Workbook
 *   │  └─ Botones: Bookdelivery / Discover / Penguin RH
 *   ├─ Logo Triggui footer
 *   └─ Footer CTA permanente
 * ══════════════════════════════════════════════════════════════════════════ */

/* ════════════════════ RENDER BOCADO SINFÓNICO V14 ════════════════════════
 *
 * V14 NIVEL DIOS: bloque visual sutil que precede a la tarjeta principal
 * con una phrase del pool sinfónico (rol=abrir).
 *
 * Diseño matemático axiomático:
 *   - Serif italic 17px / line-height 1.55 (legibilidad gentle)
 *   - Color #4A4A4A (mismo paragraphColorMuted, no compite con tarjeta)
 *   - Centrado, padding generoso (no parece banner)
 *   - SIN border, SIN background → se siente como "marca tipográfica"
 *   - Si el libro NO tiene sinfonía (pre-v12) → retorna "" (no se renderiza)
 *
 * Posición: antes de la tarjeta ES, después del greeting/trial banner top.
 * ══════════════════════════════════════════════════════════════════════════ */
function renderBocadoSinfonico(libro, cardWidth) {
  const sinfonica = pickSinfonicaPhrase(libro, ['abrir'], 'es');
  if (!sinfonica || !sinfonica.phrase) return ""; // No sinfonía → no se renderiza

  const c = TRIGGUI_STYLE_CONFIG;
  Logger.log(`✨ V14 bocado sinfónico: rol=${sinfonica.rol} origin=${sinfonica.origin}`);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding:4px 12px 14px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${cardWidth}px;">
        <tr><td style="text-align:center;padding:10px 24px;">
          <div style="
            font-family:${c.serif};
            font-size:17px;
            line-height:1.55;
            font-weight:400;
            font-style:italic;
            color:#4A4A4A;
            letter-spacing:-0.1px;
            margin:0;
            mso-line-height-rule:exactly;
            ${antiWrapCss()};
          ">${_esc(sinfonica.phrase)}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

/* ════════════════════ RENDER ECO SINFÓNICO V14 ═══════════════════════════
 *
 * V14 NIVEL DIOS: bloque visual sutil que cierra el email con una phrase
 * del pool sinfónico (rol=resonar o aterrizar).
 *
 * Diferencias con el Bocado:
 *   - Color más sutil #6B7280 (footer-grade)
 *   - Tamaño 16px (un punto menor que bocado)
 *   - Border-top hairline (marca separación con la tarjeta)
 *   - Italic preserva el "feel literario"
 *
 * Posición: después de la tarjeta EN, antes del logo strip + footer CTA.
 * ══════════════════════════════════════════════════════════════════════════ */
function renderEcoSinfonico(libro, cardWidth) {
  const sinfonica = pickSinfonicaPhrase(libro, ['resonar', 'aterrizar'], 'es');
  if (!sinfonica || !sinfonica.phrase) return "";

  const c = TRIGGUI_STYLE_CONFIG;
  Logger.log(`✨ V14 eco sinfónico: rol=${sinfonica.rol} origin=${sinfonica.origin}`);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding:20px 12px 8px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${cardWidth}px;">
        <tr><td style="text-align:center;padding:20px 24px 8px 24px;border-top:1px solid #EBEBEB;">
          <div style="
            font-family:${c.serif};
            font-size:16px;
            line-height:1.55;
            font-weight:400;
            font-style:italic;
            color:#6B7280;
            letter-spacing:-0.1px;
            margin:0;
            mso-line-height-rule:exactly;
            ${antiWrapCss()};
          ">${_esc(sinfonica.phrase)}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

function renderTarjetaEditorial(libro, portadaRef) {
  const c = TRIGGUI_STYLE_CONFIG;

  // Renderizar AMBAS tarjetas (ES y EN si está disponible)
  const tarjetaES = renderTarjetaCard(libro, portadaRef, "tarjeta", "es", "palabras");

  const tieneIngles = libro.tarjeta_en
    && libro.tarjeta_en.titulo
    && libro.tarjeta_en.parrafoTop;

  let tarjetaEN = "";
  if (tieneIngles) {
    tarjetaEN = `
      <!-- Espacio entre versiones -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="${c.espacioEntreVersiones}" style="height:${c.espacioEntreVersiones};line-height:${c.espacioEntreVersiones};font-size:0;">&nbsp;</td></tr>
      </table>

      <!-- Divisor: — English version — -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;max-width:${c.cardWidth}px;">
        <tr>
          <td width="40%" style="border-bottom:1px solid #D1D5DB;line-height:1px;font-size:0;">&nbsp;</td>
          <td align="center" style="
            font-family:${c.sans};
            font-size:11px;
            font-weight:600;
            color:#9CA3AF;
            letter-spacing:0.2em;
            text-transform:uppercase;
            padding:0 14px;
            white-space:nowrap;
            mso-line-height-rule:exactly;
          ">${c.divisorVersionesText}</td>
          <td width="40%" style="border-bottom:1px solid #D1D5DB;line-height:1px;font-size:0;">&nbsp;</td>
        </tr>
      </table>

      <!-- Espacio entre divisor y tarjeta EN -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td height="${c.espacioEntreVersiones}" style="height:${c.espacioEntreVersiones};line-height:${c.espacioEntreVersiones};font-size:0;">&nbsp;</td></tr>
      </table>

      ${renderTarjetaCard(libro, portadaRef, "tarjeta_en", "en", "palabras_en")}
    `;
  }

 // V14 SINFÓNICO: Bocado antes de la tarjeta, Eco después
  const bocadoSinfonicoHTML = renderBocadoSinfonico(libro, c.cardWidth);
  const ecoSinfonicoHTML = renderEcoSinfonico(libro, c.cardWidth);

  return `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting" content="yes">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Triggui</title>
</head>
<body style="margin:0;padding:0;background:${c.background};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:${c.background};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
    <tr><td align="center" valign="top" style="padding:20px 12px;">

      ${bocadoSinfonicoHTML}

      ${tarjetaES}

      ${tarjetaEN}

      ${ecoSinfonicoHTML}

      <!-- Footer Triggui (compartido entre ambas versiones) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"
             style="width:100%;max-width:${c.cardWidth}px;margin-top:${c.espacioEntreVersiones};">
        ${renderLogoStrip()}
        ${FOOTER_CTA.html}
      </table>

    </td></tr>
  </table>
</body>
</html>`.trim();
}


/* Helper: renderEyebrow con label personalizado (EDICIÓN/EDITION) */
function renderEyebrowConLabel(numeroFormat, palette, label) {
  if (!numeroFormat) return "";
  const c = TRIGGUI_STYLE_CONFIG;
  const fLabel  = parseFont(c.fontEyebrowLabel, {w:"600",sz:"12px",lh:"1.0"});
  const fNumber = parseFont(c.fontEyebrowNumber, {w:"700",sz:"18px",lh:"1.0"});

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td valign="middle" style="
        font-family:${c.sans};
        font-size:${fLabel.sz};
        line-height:${fLabel.lh};
        font-weight:${fLabel.w};
        color:${c.eyebrowLabelColor};
        letter-spacing:${c.eyebrowLetterSpacing};
        text-transform:uppercase;
        padding-right:10px;
        mso-line-height-rule:exactly;
        vertical-align:middle;
      ">${_esc(label)}</td>
      <td valign="middle" style="
        font-family:${c.serif};
        font-size:${fNumber.sz};
        line-height:${fNumber.lh};
        font-weight:${fNumber.w};
        color:${palette.accent};
        font-style:italic;
        mso-line-height-rule:exactly;
        vertical-align:middle;
      ">#${_esc(numeroFormat)}</td>
    </tr>
  </table>`.trim();
}

/* Función legacy para compatibilidad (renderEyebrow es ES por default) */
function renderEyebrow(numeroFormat, palette) {
  return renderEyebrowConLabel(numeroFormat, palette, "EDICIÓN ·");
}


/* ═══════════════════════ TEXTO PLANO SEGURO ═════════════════════════════
 * SAGRADO v9.6: para fallback de clientes que no renderizan HTML.
 * ═════════════════════════════════════════════════════════════════════════ */
function toPlainTextFromTokens(bodyTokens){
  return String(bodyTokens || "")
    .replace(TOKEN_ANY_RE, "")
    .replace(/<(?:.|\n)*?>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Construye el cuerpo plain text concatenando título, parrafoTop, subtítulo, parrafoBot.
 */
function buildPlainTextBody(libro) {
  const t = libro.tarjeta || {};
  const partes = [
    libro._edicion_numero ? `EDICIÓN · #${formatEdicionNumero(libro._edicion_numero)}` : "",
    "",
    sanitizeParagraph(t.titulo || ""),
    libro.autor ? `— ${libro.autor}` : "",
    "",
    toPlainTextFromTokens(t.parrafoTop || ""),
    "",
    sanitizeParagraph(t.subtitulo || ""),
    "",
    toPlainTextFromTokens(t.parrafoBot || "")
  ];
  return partes.filter(x => x !== null && x !== undefined).join("\n").trim();
}

/* ══════════════════════════════ MAIN ═════════════════════════════════════
 *
 * V18 REFACTOR:
 * - libros[0] (NO random)
 * - validarLibroEmail() → aborta si está corrupto
 * - SIN llamadas a OpenAI (usa libro.tarjeta directo)
 * - Mantiene intro esporádica + footer CTA + tracking columnas
 * ══════════════════════════════════════════════════════════════════════════ */
/* ════════════════════ HELPERS DE EMAILS V18f ═══════════════════════════════
 *
 * V18f NIVEL DIOS CUÁNTICO-QUARK:
 *
 * 1. parseEmailsFromCell(str) — extrae múltiples emails de una sola celda
 *    Soporta: separadores , ; espacios | / + saltos de línea
 *    Ejemplo: "hola@a.com, hola2@b.com" → ["hola@a.com", "hola2@b.com"]
 *
 * 2. normalizeEmail(email) — lowercase + trim para comparación deduplicada
 *    Ejemplo: "  Badir@Hotmail.COM " → "badir@hotmail.com"
 *
 * 3. dedupSheetByEmail(sheet) — elimina filas con emails duplicados
 *    - Considera UN registro como duplicado si CUALQUIER email en su celda
 *      ya apareció en una fila anterior
 *    - Preserva la primera ocurrencia (con sus datos de envío histórico)
 *    - Borra de abajo hacia arriba (mantiene integridad de índices)
 *    - Log detallado de qué se eliminó
 * ══════════════════════════════════════════════════════════════════════════ */

function parseEmailsFromCell(cellValue) {
  if (!cellValue) return [];
  const raw = String(cellValue).trim();
  if (!raw) return [];

  // Split por: coma, punto y coma, pipe, slash, espacios múltiples, saltos de línea
  const candidates = raw.split(/[,;|\/\n\r\t]+|\s{2,}/);

  const emails = [];
  for (const c of candidates) {
    const trimmed = c.trim();
    // Validación matemática del formato email (regex RFC-lite pero práctica)
    if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      emails.push(trimmed);
    }
  }
  return emails;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function dedupSheetByEmail(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    Logger.log("⚠️  Sheet vacía, no hay nada que deduplicar");
    return { dedupped: 0, totalEmails: 0, uniqueEmails: 0 };
  }

  // Construir mapa: email normalizado → primer índice de fila donde apareció
  const seen = new Map();              // email → idx primera aparición
  const rowsToDelete = [];             // índices de fila (en data) a eliminar
  let totalEmails = 0;

  for (let i = 1; i < data.length; i++) {
    const cellC = data[i][2];           // Col C = email
    const emailsInRow = parseEmailsFromCell(cellC);

    if (emailsInRow.length === 0) {
      // No tiene email válido → marcar para eliminar
      rowsToDelete.push(i);
      continue;
    }

    totalEmails += emailsInRow.length;

    // ¿Alguno de los emails de esta fila ya apareció antes?
    let isDuplicate = false;
    for (const email of emailsInRow) {
      const normalized = normalizeEmail(email);
      if (seen.has(normalized)) {
        isDuplicate = true;
        Logger.log(`   🗑️  Fila ${i + 1} duplicada: "${email}" ya está en fila ${seen.get(normalized) + 1}`);
        break;
      }
    }

    if (isDuplicate) {
      rowsToDelete.push(i);
    } else {
      // Registrar TODOS los emails de esta fila (puede tener varios)
      for (const email of emailsInRow) {
        seen.set(normalizeEmail(email), i);
      }
    }
  }

  // Borrar de abajo hacia arriba para preservar índices
  // (deleteRow usa 1-indexed, data está 0-indexed, fila 1 es header)
  rowsToDelete.sort((a, b) => b - a);
  for (const idx of rowsToDelete) {
    sheet.deleteRow(idx + 1);  // +1 porque deleteRow es 1-indexed
  }

  return {
    dedupped: rowsToDelete.length,
    totalEmails,
    uniqueEmails: seen.size
  };
}


/* ════════════════════ PREPARAR EMAIL PARA ENVÍO V18h ═════════════════════
 *
 * V18h NIVEL DIOS DELIVERABILITY: función reutilizable que prepara TODO lo
 * necesario para enviar el email del libro actual con MÁXIMA deliverability.
 *
 * Mejoras V18h sobre V18g:
 *   - Acepta nombreDestinatario para personalización
 *   - Subject personalizado con nombre (anti-marketing-look)
 *   - Greeting "Hola {Nombre}," en el HTML
 *   - Plain text mejorado (Gmail prioriza emails con plain coherente)
 *
 * Args:
 *   nombreDestinatario: string opcional (ej "Badir"). Si vacío, usa fórmula genérica.
 *
 * Returns: { ok, libro, subject, finalHTML, finalPlain, inlineImages, replyTo }
 * ══════════════════════════════════════════════════════════════════════════ */
/* ════════════════════ SANITIZAR NOMBRE V18h NIVEL DIOS ════════════════════
 *
 * V18h: Sanitización cuántica de nombres antes de usar en subject/HTML.
 *
 * Cubre TODOS los casos cuánticos posibles que pueden venir de la sheet
 * o del form de captación:
 *
 *   - null/undefined          → ""  (sin personalización)
 *   - "" o solo espacios       → ""  (sin personalización)
 *   - "BADIR"                  → "Badir"    (capitaliza correctamente)
 *   - "badir"                  → "Badir"    (capitaliza correctamente)
 *   - "Badir Nakid"            → "Badir"    (solo primer nombre)
 *   - "Badir!@#$%"             → "Badir"    (limpia basura no-alfabética)
 *   - "badir@gmail.com"        → ""         (detecta email completo, descarta)
 *   - "<script>x</script>"     → ""         (descarta HTML/JS injection)
 *   - "x"                      → ""         (1 letra = sospechoso/basura)
 *   - String > 30 chars        → ""         (probable basura/spam)
 *   - "123456"                 → ""         (sin letras = no es nombre)
 *   - "🌒🚀"                    → ""         (solo emojis = no nombre)
 *   - "María José Sánchez"     → "María"    (Unicode + tildes funcionan)
 *   - "JEAN-LUC"               → "Jean"     (corta en guión, primer token)
 *
 * Usada por:
 *   - prepararEmailParaEnvio()  → personaliza emails individuales (doPost)
 *   - sendToRow()               → personaliza emails masivos (enviarTrigguiLunes)
 *
 * Garantía cuántico-quark axiomática: si esta función retorna no-vacío,
 * el resultado es SEGURO para inyectar en HTML, plain text, y subject.
 * ══════════════════════════════════════════════════════════════════════════ */
/* ════════════════════ HELPERS UNSUBSCRIBE V18i ═══════════════════════════
 *
 * V18i NIVEL DIOS CUÁNTICO-QUARK: helpers para gestión de unsubscribe.
 *
 * generarTokenUnsub(email):
 *   Crea token HMAC anti-spoofing de un email.
 *   Token = primeros 16 chars de SHA256(email_normalized + SECRET).
 *   Garantía cuántica: nadie puede generar un token válido sin SECRET.
 *
 * validarTokenUnsub(email, token):
 *   Verifica que el token coincida con email + SECRET.
 *   Retorna true si válido, false si manipulado.
 *
 * generarUrlUnsub(email):
 *   Construye URL completa con token incluido.
 *   Ej: https://script.../exec?action=unsubscribe&email=x@y.com&token=abc123
 *
 * buscarFilaPorEmail(sheet, email):
 *   Busca el índice 1-based de la fila donde aparece el email
 *   (soportando multi-email por celda).
 *   Retorna -1 si no encuentra.
 * ══════════════════════════════════════════════════════════════════════════ */

function generarTokenUnsub(email) {
  const emailNorm = normalizeEmail(email);
  const raw = emailNorm + ":" + UNSUBSCRIBE_SECRET;
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  // Convertir bytes a hex
  let hex = "";
  for (let i = 0; i < hash.length; i++) {
    const b = hash[i] & 0xFF;
    hex += (b < 16 ? "0" : "") + b.toString(16);
  }
  return hex.substring(0, 16);  // primeros 16 chars del hex
}

function validarTokenUnsub(email, token) {
  if (!email || !token) return false;
  const expected = generarTokenUnsub(email);
  // Comparación constante en tiempo (anti-timing-attack)
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * V18m: el link de unsubscribe apunta a triggui.com (no a Apps Script).
 *
 * La página entendido en triggui.com es la que procesa el unsubscribe
 * (hace fetch al Apps Script en background con format=json) y muestra
 * la UI brand-coherent SIN el wrapper feo de Google.
 *
 * El email/token siguen siendo HMAC-protegidos como en V18i.
 *
 * Backwards-compat: doGet del Apps Script todavía acepta requests directos
 * con action=unsubscribe (sin format=json) y retorna HTML legacy. Esto
 * cubre emails viejos que pudieran tener links a la URL anterior.
 */
function generarUrlUnsub(email) {
  const token = generarTokenUnsub(email);
  return "https://triggui.com/entendido" +
    "?email=" + encodeURIComponent(email) +
    "&token=" + token;
}

function buscarFilaPorEmail(sheet, email) {
  if (!email) return -1;
  const emailNorm = normalizeEmail(email);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const emailsInRow = parseEmailsFromCell(data[i][2]);
    if (emailsInRow.some(e => normalizeEmail(e) === emailNorm)) {
      return i + 1;  // 1-based para getRange
    }
  }
  return -1;
}

/**
 * V18k: detecta si una fila tiene SUBSCRIBED explícito (consentimiento del form).
 * Incluye RESUSCRITO (porque también es consentimiento renovado vía form).
 * V18l: detecta también SUBSCRIBED_FREE y SUBSCRIBED_MEMBER.
 * @param {Array} rowData - getValues() row
 * @return {boolean}
 */
function isRowSubscribed(rowData) {
  const status = String((rowData[UNSUBSCRIBE_COL - 1] || "")).trim().toUpperCase();
  return status.startsWith("SUBSCRIBED") || status.startsWith("RESUSCRITO");
}

/**
 * V18l: detecta SUBSCRIBED_FREE (incluye legacy "SUBSCRIBED " sin sufijo y RESUSCRITO).
 */
function isRowSubscribedFree(rowData) {
  const status = String((rowData[UNSUBSCRIBE_COL - 1] || "")).trim().toUpperCase();
  if (status.startsWith("SUBSCRIBED_FREE")) return true;
  if (status.startsWith("RESUSCRITO")) return true;
  // Legacy V18k: "SUBSCRIBED " sin sufijo = free implícito
  if (status.startsWith("SUBSCRIBED ") && !status.startsWith("SUBSCRIBED_MEMBER")) return true;
  // Caso borde: status exactamente "SUBSCRIBED" sin nada después
  if (status === "SUBSCRIBED") return true;
  return false;
}

/**
 * V18l: detecta SUBSCRIBED_MEMBER (pagado, marcado manualmente).
 */
function isRowSubscribedMember(rowData) {
  const status = String((rowData[UNSUBSCRIBE_COL - 1] || "")).trim().toUpperCase();
  return status.startsWith("SUBSCRIBED_MEMBER");
}

/**
 * V18k: detecta si una fila es BULK_LEGACY (sin sello, base vieja sin consentimiento).
 * Col O vacía + no UNSUBSCRIBED = base que pegué manualmente.
 * @param {Array} rowData - getValues() row
 * @return {boolean}
 */
function isRowBulkLegacy(rowData) {
  return !isRowSubscribed(rowData) && !isRowUnsubscribed(rowData);
}

// V19 — Constantes para Stripe links (centralizadas)
const STRIPE_LINK_BASICO_129 = "https://buy.stripe.com/7sYeVfgIebeAbqEdHn24007";

/* ════════════════════════════════════════════════════════════════════════
 * V19.2 — SALUDOS ROTATIVOS NIVEL DIOS (100 variantes naturales)
 * ════════════════════════════════════════════════════════════════════════
 * No exagerados, no rimbombantes. Sonando cercanos pero no invasivos.
 * Se elige uno aleatoriamente por envío. El nombre se inserta en {NOMBRE}.
 * Si no hay nombre, se eligen variantes sin él (los marcados con asterisco
 * son "sin nombre" amigables).
 * ════════════════════════════════════════════════════════════════════════ */
const SALUDOS_CON_NOMBRE = [
  // Hola (base)
  "Hola {NOMBRE},",
  "Hola, {NOMBRE}.",
  "Hola {NOMBRE}.",
  "Hola otra vez, {NOMBRE}.",
  "Hola de nuevo, {NOMBRE}.",
  "Hola hola, {NOMBRE}.",
  // Hola + pregunta
  "Hola {NOMBRE}, ¿qué tal?",
  "Hola {NOMBRE}, ¿cómo estás?",
  "Hola {NOMBRE}, ¿cómo va?",
  "Hola {NOMBRE}, ¿cómo te va?",
  "Hola {NOMBRE}, ¿qué hay?",
  "Hola {NOMBRE}, ¿qué cuentas?",
  "Hola {NOMBRE}, ¿qué onda?",
  "Hola {NOMBRE}, ¿cómo amaneciste?",
  "Hola {NOMBRE}, ¿todo bien?",
  "Hola {NOMBRE}, ¿cómo has estado?",
  "Hola {NOMBRE}, ¿cómo va todo?",
  "Hola {NOMBRE}, ¿qué tal va tu día?",
  "Hola {NOMBRE}, ¿cómo va tu día?",
  "Hola {NOMBRE}, ¿cómo va tu semana?",
  "Hola {NOMBRE}, ¿qué hay de nuevo?",
  "Hola {NOMBRE}, ¿qué hay de bueno?",
  // Hola + deseo
  "Hola {NOMBRE}, espero que estés bien.",
  "Hola {NOMBRE}, espero estés muy bien.",
  "Hola {NOMBRE}, espero que vaya bien.",
  "Hola {NOMBRE}, espero que te encuentres bien.",
  "Hola {NOMBRE}, un saludo.",
  "Hola {NOMBRE}, te mando un saludo.",
  // Hola con coma intercalada
  "Hola, {NOMBRE}, ¿qué tal?",
  "Hola, {NOMBRE}, ¿cómo estás?",
  "Hola, {NOMBRE}, ¿cómo va?",
  "Hola, {NOMBRE}, ¿qué hay?",
  "Hola, {NOMBRE}, ¿qué tal el día?",
  "Hola, {NOMBRE}, ¿qué tal todo?",
  // Saludos
  "Saludos {NOMBRE},",
  "Saludos, {NOMBRE}.",
  "Saludos {NOMBRE}.",
  "Saludos {NOMBRE}, ¿cómo estás?",
  "Saludos {NOMBRE}, ¿qué tal?",
  "Saludos {NOMBRE}, ¿cómo va?",
  "Saludos {NOMBRE}, ¿qué tal todo?",
  "Saludos {NOMBRE}, ¿qué tal el día?",
  "Saludos, ¿qué tal, {NOMBRE}?",
  "Saludos, ¿cómo va, {NOMBRE}?",
  "Saludos, ¿cómo estás, {NOMBRE}?",
  // Hey / Ey
  "Hey {NOMBRE},",
  "Hey, {NOMBRE}.",
  "Hey {NOMBRE}, ¿qué tal?",
  "Hey {NOMBRE}, ¿cómo va?",
  "Hey {NOMBRE}, ¿cómo estás?",
  "Hey {NOMBRE}, ¿qué onda?",
  "Ey {NOMBRE},",
  "Ey, {NOMBRE}.",
  // ¿Qué tal? variantes
  "¿Qué tal, {NOMBRE}?",
  "¿Qué hay, {NOMBRE}?",
  "¿Qué onda, {NOMBRE}?",
  "¿Cómo estás, {NOMBRE}?",
  "¿Cómo va, {NOMBRE}?",
  "¿Cómo te va, {NOMBRE}?",
  "¿Cómo va todo, {NOMBRE}?",
  "¿Cómo va la semana, {NOMBRE}?",
  "¿Cómo va el día, {NOMBRE}?",
  "¿Cómo amaneciste, {NOMBRE}?",
  "¿Cómo te trata el día, {NOMBRE}?",
  "¿Cómo te trata la semana, {NOMBRE}?",
  "¿Cómo has estado, {NOMBRE}?",
  "¿Cómo te encuentras, {NOMBRE}?",
  "¿Qué tal va todo, {NOMBRE}?",
  "¿Qué tal va el día, {NOMBRE}?",
  "¿Qué tal va la semana, {NOMBRE}?",
  // Qué tal declarativo
  "Qué tal, {NOMBRE}.",
  "Qué hay, {NOMBRE}.",
  "Qué onda, {NOMBRE}.",
  "Qué tal {NOMBRE}, ¿cómo va?",
  "Qué tal {NOMBRE}, ¿cómo estás?",
  "Qué hay {NOMBRE}, ¿cómo va?",
  "Qué hay {NOMBRE}, ¿cómo estás?",
  "Qué onda {NOMBRE}, ¿cómo va?",
  // Buen día
  "Buen día, {NOMBRE}.",
  "Buenos días, {NOMBRE}.",
  "Buenas, {NOMBRE}.",
  "Buen día {NOMBRE}, ¿qué tal?",
  "Buen día {NOMBRE}, ¿cómo va?",
  "Buen día {NOMBRE}, ¿cómo estás?",
  "Buenas, ¿qué tal, {NOMBRE}?",
  "Buenas, ¿cómo estás, {NOMBRE}?",
  // Nombre primero
  "{NOMBRE}, hola.",
  "{NOMBRE}, saludos.",
  "{NOMBRE}, ¿qué tal?",
  "{NOMBRE}, ¿qué hay?",
  "{NOMBRE}, ¿cómo estás?",
  "{NOMBRE}, ¿cómo va?",
  "{NOMBRE}, ¿cómo te va?",
  "{NOMBRE}, ¿qué cuentas?",
  "{NOMBRE}, ¿qué onda?",
  "{NOMBRE}, ¿cómo amaneciste?",
  "{NOMBRE}, ¿cómo has estado?",
  "{NOMBRE}, ¿cómo va todo?",
  "{NOMBRE}, ¿cómo va la semana?",
  "{NOMBRE}, ¿cómo va el día?",
  "{NOMBRE}, qué tal.",
  "{NOMBRE}, qué hay.",
  "{NOMBRE}, buen día.",
  "{NOMBRE}, buenos días."
];

const SALUDOS_SIN_NOMBRE = [
  "Hola,",
  "Hola.",
  "Saludos.",
  "Buen día.",
  "Buenos días.",
  "Buenas.",
  "Hey,",
  "Ey,",
  "¿Qué tal?",
  "¿Qué hay?",
  "¿Qué onda?",
  "¿Cómo va?",
  "¿Cómo estás?",
  "Hola, ¿cómo estás?",
  "Hola, ¿qué tal?"
];

/**
 * V19.2: genera un saludo aleatorio (rotativo cada envío).
 * Si hay nombre → usa array con nombre. Si no → usa fallback sin nombre.
 */
function generarSaludoTexto(primerNombre) {
  const tieneNombre = primerNombre && primerNombre.length > 0;
  const arr = tieneNombre ? SALUDOS_CON_NOMBRE : SALUDOS_SIN_NOMBRE;
  const elegido = arr[Math.floor(Math.random() * arr.length)];
  return tieneNombre ? elegido.replace(/\{NOMBRE\}/g, primerNombre) : elegido;
}

/**
 * V19.2: genera el bloque HTML del saludo personalizado para el email.
 */
function generarSaludoHTML(primerNombre, configFont, configBg, cardWidth) {
  const saludo = generarSaludoTexto(primerNombre);
  // Resaltar el nombre si está presente
  let saludoFinal = saludo;
  if (primerNombre) {
    const re = new RegExp("\\b" + primerNombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "\\b");
    saludoFinal = saludo.replace(re, `<strong style="color:#1A1A1A;">${primerNombre}</strong>`);
  }
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${configBg};">
    <tr><td align="center" style="padding:20px 12px 0 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${cardWidth}px;">
        <tr><td style="font-family:${configFont};font-size:15px;line-height:1.5;color:#4A4A4A;padding:0 4px 8px 4px;">${saludoFinal}</td></tr>
      </table>
    </td></tr>
  </table>`;
}

/**
 * V19.2: trial banner TOP (versión más prominente, va después del saludo).
 * Diferencia del banner bottom: no necesita borde sutil porque ya está en el contexto cabecera.
 */
function generarTrialBannerTopHTML(rowData, configFont, configBg, cardWidth) {
  if (!isRowSubscribedTrial(rowData) && !isRowResuscrito(rowData) && !isRowSubscribedFree(rowData)) return "";
  if (isRowSubscribedMember(rowData)) return "";
  if (isRowBulkLegacy(rowData)) return "";
  const dias = trialDiasRestantes(rowData);
  if (dias <= 0 || dias === -1) return "";

  const link = STRIPE_LINK_BASICO_129;

  // Último mensaje (dias ≤ 4): banner fuerte naranja/oro
  if (dias <= 4) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${configBg};">
      <tr><td align="center" style="padding:8px 12px 16px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${cardWidth}px;">
          <tr><td style="font-family:${configFont};font-size:13px;line-height:1.55;color:#7A4F0A;background:#FFF8E1;border:1px solid #E8A838;border-radius:8px;padding:12px 14px;mso-line-height-rule:exactly;">
            <strong style="color:#7A4F0A;">Este es probablemente tu último mensaje gratis.</strong><br>
            <span style="color:#6B7280;display:inline-block;margin-top:4px;">Si quieres seguir, suscríbete a $129 MXN/mes (primer mes gratis): </span>
            <a href="${link}" style="color:#B8740F;text-decoration:underline;font-weight:700;">Suscribirse</a>
          </td></tr>
        </table>
      </td></tr>
    </table>`;
  }

  // 5-7 días: alerta sutil
  if (dias <= 7) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${configBg};">
      <tr><td align="center" style="padding:8px 12px 12px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${cardWidth}px;">
          <tr><td style="font-family:${configFont};font-size:12px;line-height:1.55;color:#6B7280;padding:0 4px;mso-line-height-rule:exactly;">
            Quedan <strong style="color:#B8740F;">${dias} días</strong> de tu periodo gratis. <a href="${link}" style="color:#6B7280;text-decoration:underline;">Suscríbete a $129/mes</a>
          </td></tr>
        </table>
      </td></tr>
    </table>`;
  }

  // 8-28 días: countdown discreto
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${configBg};">
    <tr><td align="center" style="padding:8px 12px 12px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${cardWidth}px;">
        <tr><td style="font-family:${configFont};font-size:11px;line-height:1.55;color:#9CA3AF;padding:0 4px;mso-line-height-rule:exactly;">
          Tu periodo gratis: <strong style="color:#4A4A4A;">${dias} días restantes</strong>
        </td></tr>
      </table>
    </td></tr>
  </table>`;
}

/**
 * V19.2: trial banner plain TOP (después del saludo).
 */
function generarTrialBannerTopPlain(rowData) {
  if (!isRowSubscribedTrial(rowData) && !isRowResuscrito(rowData) && !isRowSubscribedFree(rowData)) return "";
  if (isRowSubscribedMember(rowData)) return "";
  if (isRowBulkLegacy(rowData)) return "";
  const dias = trialDiasRestantes(rowData);
  if (dias <= 0 || dias === -1) return "";

  const link = STRIPE_LINK_BASICO_129;
  if (dias <= 4) {
    return `\nEste es probablemente tu último mensaje gratis.\nSi quieres seguir, suscríbete a $129 MXN/mes (primer mes gratis): ${link}\n`;
  }
  if (dias <= 7) {
    return `\nQuedan ${dias} días de tu periodo gratis. Suscríbete a $129/mes: ${link}\n`;
  }
  return `\nTu periodo gratis: ${dias} días restantes.\n`;
}

/**
 * V19: cap semanal según estado del trial/consentimiento.
 *   SUBSCRIBED_TRIAL (activo) → 2/semana (28 días, cap completo MEMBER)
 *   SUBSCRIBED_MEMBER          → 2/semana (pago confirmado)
 *   SUBSCRIBED_EXPIRED         → 0 (trial terminó, no pagó)
 *   RESUSCRITO + trial activo  → 2/semana (respeta días originales)
 *   RESUSCRITO + trial expirado → 0
 *   BULK_LEGACY                → 1/semana (sin permiso, conservador)
 *   UNSUBSCRIBED               → 0 (nunca)
 *   Legacy SUBSCRIBED_FREE/SUBSCRIBED → trial-like (28 días desde fecha en status)
 */
function getCapSemanal(rowData) {
  if (isRowUnsubscribed(rowData)) return 0;
  if (isRowSubscribedExpired(rowData)) return 0;
  if (isRowSubscribedMember(rowData)) return 2;

  // TRIAL, RESUSCRITO, o legacy SUBSCRIBED_FREE: respeta días restantes del trial
  if (isRowSubscribedTrial(rowData) || isRowResuscrito(rowData) || isRowSubscribedFree(rowData)) {
    const dias = trialDiasRestantes(rowData);
    if (dias === -1) return 1;  // no se pudo extraer fecha → tratar como BULK
    return dias > 0 ? 2 : 0;     // trial activo: 2/sem · expirado: 0
  }

  return 1;  // BULK_LEGACY (sin sello)
}

/**
 * V18l: parsea string CSV de timestamps. Filtra inválidos. Devuelve array de ISO strings.
 * Tolerante: maneja Date objects, basura, espacios, comas extras.
 */
function parseTimestamps(cellValue) {
  if (!cellValue && cellValue !== 0) return [];
  const raw = String(cellValue).trim();
  if (!raw) return [];
  return raw.split(",")
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s.length > 0; })
    .filter(function(s) { return !isNaN(Date.parse(s)); });
}

/**
 * V18l: días calendario desde el timestamp hasta hoy, en timezone del script.
 * Robusto a diferencia horaria. Math.floor para días enteros.
 *
 * Garantías cuántico-quark:
 *   - 7 días exactos → return 7
 *   - 6 días 23h → return 6
 *   - Hoy (mismo día) → return 0
 *   - Timestamp futuro → return negativo (defensivo: tratado como cap activo)
 *   - Timestamp inválido → return Infinity (defensivo: tratado como cap LIBRE)
 */
function daysSinceLocal(timestamp) {
  if (!timestamp) return Infinity;
  const sent = new Date(timestamp);
  if (isNaN(sent.getTime())) return Infinity;

  const tz = Session.getScriptTimeZone();
  // Extraer fecha calendario en timezone del script (YYYY-MM-DD)
  const sentDayStr = Utilities.formatDate(sent, tz, "yyyy-MM-dd");
  const todayStr   = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

  // Convertir a Date a medianoche local para diff exacto en días
  const sentDay  = new Date(sentDayStr + "T00:00:00");
  const todayDay = new Date(todayStr + "T00:00:00");
  return Math.round((todayDay.getTime() - sentDay.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * V18l: ¿la fila alcanzó su cap semanal?
 *
 * Lógica:
 *   1. Si cap es 0 (UNSUBSCRIBED) → siempre TRUE (no recibe nunca)
 *   2. Si tiene menos timestamps que cap → FALSE (puede recibir)
 *   3. Toma el (cap)-ésimo más reciente. Si fue hace < 7 días calendario → cap activo
 *   4. Si fue hace >= 7 días calendario → cap liberado automáticamente
 */
function hasReachedWeeklyLimit(rowData) {
  const cap = getCapSemanal(rowData);
  if (cap === 0) return true;

  const sends = parseTimestamps(rowData[SENDS_WEEK_COL - 1]);
  if (sends.length < cap) return false;

  // El más antiguo de los últimos `cap` envíos
  const oldest = sends.slice(-cap)[0];
  const dias = daysSinceLocal(oldest);

  // Si el oldest fue hace < 7 días calendario → CAP ACTIVO
  // Si fue hace >= 7 → AUTOMÁTICAMENTE LIBERADO
  return dias < 7;
}

/**
 * V18l: registra un envío en col P. Mantiene los últimos CAP_MAX_GLOBAL timestamps.
 * Idempotente, anti-corrupción.
 *
 * Garantía: aunque la celda tenga basura, el nuevo timestamp ISO queda al final
 * y se trunca a los últimos N. Estado consistente después de cualquier corrupción previa.
 */
function recordSend(sheet, rowIdx1Based) {
  const range = sheet.getRange(rowIdx1Based, SENDS_WEEK_COL);
  const current = parseTimestamps(range.getValue());
  current.push(new Date().toISOString());
  while (current.length > CAP_MAX_GLOBAL) current.shift();
  range.setValue(current.join(","));
}

/**
 * V19: extrae la fecha de inicio del trial desde el status.
 *
 * Formatos manejados:
 *   "SUBSCRIBED_TRIAL 2026-05-11 13:46"          → "2026-05-11"
 *   "RESUSCRITO 2026-05-30 (era SUBSCRIBED_TRIAL 2026-05-11 ...)"
 *                                                → "2026-05-11" (respeta original)
 *   "SUBSCRIBED_FREE 2026-05-11" (legacy V18l)   → "2026-05-11"
 *   "SUBSCRIBED 2026-05-11" (legacy V18k)        → "2026-05-11"
 *
 * @return string "YYYY-MM-DD" o null si no aplica
 */
function extractFechaInicioTrial(rowData) {
  const status = String((rowData[UNSUBSCRIBE_COL - 1] || "")).trim();
  if (!status) return null;

  // Caso 1: SUBSCRIBED_TRIAL directo
  if (/^SUBSCRIBED_TRIAL/i.test(status)) {
    const m = status.match(/SUBSCRIBED_TRIAL\s+(\d{4}-\d{2}-\d{2})/i);
    return m ? m[1] : null;
  }

  // Caso 2: RESUSCRITO con histórico → respeta el ORIGINAL (días corren)
  if (/^RESUSCRITO/i.test(status)) {
    // Buscar SUBSCRIBED_TRIAL adentro del paréntesis
    const trialMatch = status.match(/SUBSCRIBED_TRIAL\s+(\d{4}-\d{2}-\d{2})/i);
    if (trialMatch) return trialMatch[1];

    // Legacy: SUBSCRIBED_FREE o SUBSCRIBED genérico
    const legacyMatch = status.match(/SUBSCRIBED(?:_FREE)?\s+(\d{4}-\d{2}-\d{2})/i);
    if (legacyMatch) return legacyMatch[1];

    // Fallback final: fecha del propio RESUSCRITO
    const resMatch = status.match(/^RESUSCRITO\s+(\d{4}-\d{2}-\d{2})/i);
    return resMatch ? resMatch[1] : null;
  }

  // Caso 3: legacy SUBSCRIBED_FREE/SUBSCRIBED → treat como trial
  const legacyMatch = status.match(/^SUBSCRIBED(?:_FREE)?\s+(\d{4}-\d{2}-\d{2})/i);
  if (legacyMatch) return legacyMatch[1];

  return null;
}

/**
 * V19: días restantes del trial (de 28 totales).
 *   Recién creado → ~28
 *   Mitad → ~14
 *   Casi expirado → 1-4
 *   Expirado → 0 o negativo
 *
 * @return number días restantes (puede ser negativo), o -1 si no aplica
 */
function trialDiasRestantes(rowData) {
  const inicio = extractFechaInicioTrial(rowData);
  if (!inicio) return -1;

  const inicioDate = new Date(inicio + "T00:00:00");
  const dias = daysSinceLocal(inicioDate);
  return 28 - dias;
}

/**
 * V19: detecta SUBSCRIBED_TRIAL (form gratis con trial 28 días).
 */
function isRowSubscribedTrial(rowData) {
  const status = String((rowData[UNSUBSCRIBE_COL - 1] || "")).trim().toUpperCase();
  return status.startsWith("SUBSCRIBED_TRIAL");
}

/**
 * V19: detecta SUBSCRIBED_EXPIRED (trial caducó, no pagó).
 */
function isRowSubscribedExpired(rowData) {
  const status = String((rowData[UNSUBSCRIBE_COL - 1] || "")).trim().toUpperCase();
  return status.startsWith("SUBSCRIBED_EXPIRED");
}

/**
 * V19: detecta RESUSCRITO (volvió tras unsub).
 */
function isRowResuscrito(rowData) {
  const status = String((rowData[UNSUBSCRIBE_COL - 1] || "")).trim().toUpperCase();
  return status.startsWith("RESUSCRITO");
}

/**
 * V19: ¿debe marcarse como EXPIRED automáticamente?
 * Auto-detecta trials caducados durante el masivo.
 */
function debeMarcarseExpired(rowData) {
  if (isRowSubscribedMember(rowData)) return false;  // member nunca expira
  if (isRowUnsubscribed(rowData)) return false;       // unsubscribed ya tiene su estado
  if (isRowSubscribedExpired(rowData)) return false;  // ya expired
  if (isRowBulkLegacy(rowData)) return false;         // bulk no tiene trial

  // Tiene fecha de inicio? evalúa días restantes
  const dias = trialDiasRestantes(rowData);
  return dias !== -1 && dias <= 0;  // expirado si dias=0 o negativo
}

/**
 * V19: ¿es el último mensaje del trial?
 * Si días restantes ≤ 4, próximo envío (cap 2/sem) probablemente NO llegará.
 */
function esUltimoMensajeTrial(rowData) {
  if (isRowSubscribedMember(rowData)) return false;
  if (isRowUnsubscribed(rowData)) return false;
  if (isRowSubscribedExpired(rowData)) return false;
  if (isRowBulkLegacy(rowData)) return false;
  const dias = trialDiasRestantes(rowData);
  return dias > 0 && dias <= 4;
}

/**
 * V19: genera HTML del trial banner según estado.
 * Inserta antes de "Cancelar suscripción" en el footer del email.
 */
function generarTrialBannerHTML(rowData) {
  const dias = trialDiasRestantes(rowData);
  if (dias <= 0 || dias === -1) return "";
  if (isRowSubscribedMember(rowData)) return "";  // member no ve banner
  if (isRowBulkLegacy(rowData)) return "";

  const link = STRIPE_LINK_BASICO_129;

  // Último mensaje (dias ≤ 4): alerta fuerte con CTA
  if (dias <= 4) {
    return `<div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.55;font-weight:600;color:#E8A838;margin:18px 0 8px 0;padding:14px 16px;border:1px solid rgba(232,168,56,0.3);border-radius:8px;background:rgba(232,168,56,0.05);mso-line-height-rule:exactly;">Este es probablemente tu último mensaje gratis.<br><span style="font-weight:400;color:#9CA3AF;display:inline-block;margin-top:4px;">Si quieres seguir, suscríbete a $129 MXN/mes (primer mes gratis): </span><a href="${link}" style="color:#E8A838;text-decoration:underline;font-weight:600;">Suscribirse</a></div>`;
  }

  // 5-7 días: alerta sutil con CTA
  if (dias <= 7) {
    return `<div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.55;color:#9CA3AF;margin:14px 0 4px 0;mso-line-height-rule:exactly;">Quedan <strong style="color:#E8A838;">${dias} días</strong> de tu periodo gratis. <a href="${link}" style="color:#9CA3AF;text-decoration:underline;">Suscríbete a $129/mes</a></div>`;
  }

  // 8-28 días: countdown discreto
  return `<div style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;font-size:11px;line-height:1.55;color:#9CA3AF;margin:14px 0 4px 0;mso-line-height-rule:exactly;">Tu periodo gratis: <strong style="color:#C5C5C5;">${dias} días restantes</strong></div>`;
}

/**
 * V19: genera texto plain del trial banner.
 */
function generarTrialBannerPlain(rowData) {
  const dias = trialDiasRestantes(rowData);
  if (dias <= 0 || dias === -1) return "";
  if (isRowSubscribedMember(rowData)) return "";
  if (isRowBulkLegacy(rowData)) return "";

  const link = STRIPE_LINK_BASICO_129;
  if (dias <= 4) {
    return `\n\nEste es probablemente tu último mensaje gratis.\nSuscríbete a $129 MXN/mes (primer mes gratis): ${link}`;
  }
  if (dias <= 7) {
    return `\n\nQuedan ${dias} días de tu periodo gratis. Suscríbete a $129/mes: ${link}`;
  }
  return `\n\nTu periodo gratis: ${dias} días restantes.`;
}

/**
 * V18i: detecta si una fila está unsubscribed según col O.
 * @param {Array} rowData - getValues() row
 * @return {boolean}
 */
function isRowUnsubscribed(rowData) {
  const status = String((rowData[UNSUBSCRIBE_COL - 1] || "")).trim().toUpperCase();
  return status.startsWith("UNSUBSCRIBED");
}


function sanitizarNombre(raw) {
  if (!raw) return "";
  let s = String(raw).trim();
  if (!s) return "";
  if (s.length > 30) return "";                          // muy largo = basura

  // Descartar HTML/JS injection
  if (/<|>|script|javascript/i.test(s)) return "";

  // Descartar SOLO si todo el string es un email completo
  // (no descartar "Badir!@#$%" porque tiene @ pero no es email)
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "";

  // Tomar primer token alfabético (Unicode-aware, soporta tildes)
  const match = s.match(/^[\p{L}]+/u);
  if (!match) return "";                                 // sin letras = solo símbolos/números

  let primer = match[0];
  if (primer.length < 2) return "";                      // 1 letra = sospechoso
  if (primer.length > 20) return "";                     // muy largo

  // Capitalizar: primera mayúscula, resto minúsculas
  primer = primer.charAt(0).toUpperCase() + primer.slice(1).toLowerCase();
  return primer;
}


function prepararEmailParaEnvio(nombreDestinatario, emailDestinatario, rowIdx) {
  const c = TRIGGUI_STYLE_CONFIG;

  // 1. Cargar contenido_manual.json
  let libros = [];
  try {
    const resp = UrlFetchApp.fetch(CONTENIDO_URL);
    if (resp.getResponseCode() !== 200) {
      return { ok: false, reason: `HTTP ${resp.getResponseCode()} al leer contenido_manual.json` };
    }
    const json = JSON.parse(resp.getContentText());
    libros = Array.isArray(json?.libros) ? json.libros : [];
  } catch (e) {
    return { ok: false, reason: "Error leyendo contenido_manual.json: " + e.message };
  }

  if (!libros.length) return { ok: false, reason: "contenido_manual.json sin libros" };

  // 2. libros[0] (más reciente cronológicamente)
  const libro = libros[0];

  // 3. Validar
  const validacion = validarLibroEmail(libro);
  if (!validacion.ok) {
    return { ok: false, reason: "libros[0] inválido — " + validacion.reason };
  }

  // 4. Limpiar nombre destinatario — V18h NIVEL DIOS sanitización cuántica
  // (sanitizarNombre es función global, definida arriba para reuso)
  const primerNombre = sanitizarNombre(nombreDestinatario);
  const tieneNombre = primerNombre.length > 0;

  // 5. Plain text body — V19.2 con placeholders para saludo + trial banner top
  let plainBody = "{{GREETING_PLAIN}}{{TRIAL_BANNER_TOP_PLAIN}}" + buildPlainTextBody(libro);

  // 6. Portada inline
  const portadaUrl = getPortadaURL(libro);
  let portadaRef = "", inlineImages = {};
  if (portadaUrl) {
    const blob = fetchPortadaBlob(portadaUrl);
    if (blob) {
      inlineImages["portadaTriggui"] = blob;
      portadaRef = "cid:portadaTriggui";
    } else {
      portadaRef = portadaUrl;
    }
  }

  // 7. HTML
  let cuerpoHTML = renderTarjetaEditorial(libro, portadaRef);

  // V19.2: Inyectar placeholders para greeting + trial banner top + whatsapp promo top
  // Estos se reemplazan por fila en sendToRow (masivo) o enviarTrigguiAUno (auto-bienvenida).
  // El greeting es ALEATORIO (100 variantes) por envío para no cansar al lector.
  // El trial banner aparece al inicio (después del saludo) para captar atención antes del libro.
  // El bloque "Recibe Triggui en tu WhatsApp" alterna aleatoriamente entre top y bottom.
  const placeholdersTop = `\n  {{GREETING_BLOCK}}\n  {{TRIAL_BANNER_TOP}}\n  {{KIDS_PROMO_TOP}}\n  {{WHATSAPP_PROMO_TOP}}\n`;
  cuerpoHTML = cuerpoHTML.replace(
    /(<body[^>]*>)/i,
    `$1${placeholdersTop}`
  );

  // 8. Preview text invisible (V14 SINFÓNICO con fallback)
  const tarjeta = libro.tarjeta || {};
  // Intentar phrase sinfónica rol=profundizar (invita a abrir el email)
  const _sinfonicaProfundizar = pickSinfonicaPhrase(libro, ['profundizar'], 'es');
  let subtituloParaPreview;
  if (_sinfonicaProfundizar && _sinfonicaProfundizar.phrase) {
    subtituloParaPreview = sanitizeParagraph(_sinfonicaProfundizar.phrase)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);
    Logger.log(`✨ V14 preview sinfónico: rol=${_sinfonicaProfundizar.rol} origin=${_sinfonicaProfundizar.origin}`);
  } else {
    // Fallback legacy: subtítulo del card_es
    subtituloParaPreview = sanitizeParagraph(tarjeta.subtitulo || tarjeta.titulo || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 140);
  }

  const previewPadding = "\u200C\u00A0".repeat(60);
  const previewTextHTML = `<div style="display:none;font-size:1px;color:#FFFFFF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;visibility:hidden;height:0;width:0;">${_esc(subtituloParaPreview)}${previewPadding}</div>`;

  let finalHTML = cuerpoHTML.replace(
    /(<body[^>]*>)/i,
    `$1\n  ${previewTextHTML}`
  );
  let finalPlain = plainBody + FOOTER_CTA.plain;

  // V19.2.2 cuántico-quark: reemplazar TODOS los placeholders solo SI tenemos los datos completos.
  // Si no, dejar placeholders intactos para que sendToRow los reemplace por fila.

  // UNSUB_LINK: solo si tenemos email destinatario válido
  if (emailDestinatario && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailDestinatario)) {
    const unsubLink = generarUrlUnsub(emailDestinatario);
    finalHTML  = finalHTML.replace(/\{\{UNSUB_LINK\}\}/g, unsubLink);
    finalPlain = finalPlain.replace(/\{\{UNSUB_LINK\}\}/g, unsubLink);
  }

  // V19.2.2: GREETING + TRIAL_BANNER_TOP + WHATSAPP_PROMO_TOP (aleatorio 50%)
  // Solo si tenemos rowIdx (caso: auto-bienvenida)
  if (rowIdx && rowIdx >= 2) {
    try {
      const sheetCheck = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
      if (sheetCheck) {
        const rowData = sheetCheck.getRange(rowIdx, 1, 1, SENDS_WEEK_COL).getValues()[0];
        const nombreFila = sanitizarNombre(rowData[0]);

        // Saludo aleatorio (104 variantes)
        const saludoHTML = generarSaludoHTML(nombreFila, c.sans, c.background, c.cardWidth);
        const saludoPlain = generarSaludoTexto(nombreFila) + (nombreFila ? "\n\n" : "\n");

        // Trial banner TOP (si aplica según fila)
        const trialTopHTML = generarTrialBannerTopHTML(rowData, c.sans, c.background, c.cardWidth);
        const trialTopPlain = generarTrialBannerTopPlain(rowData);

        // Aleatoriedad WhatsApp promo: SOLO arriba (50%) o no aparece arriba
        // El footer SIEMPRE tiene triggui.com + número, sin importar este flag
        const mostrarWaArriba = Math.random() < 0.5;
        const waTopHTML = mostrarWaArriba ? generarWhatsAppPromoTopHTML(c.cardWidth) : "";
        const waTopPlain = mostrarWaArriba ? WHATSAPP_PROMO_TOP_PLAIN : "";

        // V20 — KIDS PROMO siempre si KIDS_PROMO_ENABLED
        const kidsTopHTML = KIDS_PROMO_ENABLED ? generarKidsPromoTopHTML(c.cardWidth) : "";
        const kidsTopPlain = KIDS_PROMO_ENABLED ? KIDS_PROMO_TOP_PLAIN : "";

        finalHTML  = finalHTML.replace(/\{\{GREETING_BLOCK\}\}/g, saludoHTML)
                              .replace(/\{\{TRIAL_BANNER_TOP\}\}/g, trialTopHTML)
                              .replace(/\{\{KIDS_PROMO_TOP\}\}/g, kidsTopHTML)
                              .replace(/\{\{WHATSAPP_PROMO_TOP\}\}/g, waTopHTML);
        finalPlain = finalPlain.replace(/\{\{GREETING_PLAIN\}\}/g, saludoPlain)
                               .replace(/\{\{TRIAL_BANNER_TOP_PLAIN\}\}/g, trialTopPlain)
                               .replace(/\{\{KIDS_PROMO_TOP_PLAIN\}\}/g, kidsTopPlain)
                               .replace(/\{\{WHATSAPP_PROMO_TOP_PLAIN\}\}/g, waTopPlain);

        Logger.log(`✨ V19.2.2 + V20 fila ${rowIdx}: saludo + trial ${trialTopPlain ? 'SÍ' : 'NO'} + KIDS ${KIDS_PROMO_ENABLED ? 'SÍ' : 'NO'} + WA arriba ${mostrarWaArriba ? 'SÍ' : 'NO'}`);
      }
    } catch (e) {
      Logger.log("⚠️ Error generando placeholders V19.2.2 en prepararEmail: " + e.message);
    }
  }
  // (si no, sendToRow del masivo lo reemplazará por fila más adelante)

  // 9. Logo Triggui inline
  try {
    const logoName = (c.logoVariant === "negro")
      ? "trigguiletrasnegro.jpg"
      : "trigguiletrascolor3.png";
    const it = DriveApp.getFilesByName(logoName);
    if (it.hasNext()) {
      const logoBlob = it.next().getBlob().setName("logoTriggui");
      inlineImages["logoTriggui"] = logoBlob;
    }
  } catch (e) {
    Logger.log("⚠️ Error cargando logo: " + e.message);
  }

 // 10. Subject V14 SINFÓNICO NIVEL DIOS:
  //
  // Cambio cuántico-quark sobre V19.2:
  //   ANTES: "Edición #043 · El viaje hacia el hogar"
  //   AHORA: "🧭 La imaginación de un niño puede llevarlo a reinos inesperados"
  //
  // Razón: la phrase rol=abrir está diseñada por la doctrina sinfónica
  // específicamente como gancho de apertura. El display name "Triggui" ya
  // marca el remitente, no necesitamos prefijo "Edición #N" que repite info
  // que el usuario verá adentro del email.
  //
  // Fallback graceful: si el libro es pre-v12 (sin sinfonía), usa el formato
  // anterior con prefijo "Edición #NNN" (legacy).
  let subject;
  const _sinfonicaAbrir = pickSinfonicaPhrase(libro, ['abrir'], 'es');
  if (_sinfonicaAbrir && _sinfonicaAbrir.phrase) {
    // Subject puro sinfónico — el gancho de apertura
    subject = sanitizeParagraph(_sinfonicaAbrir.phrase)
      .replace(/\s+/g, " ")
      .trim();
    Logger.log(`✨ V14 subject sinfónico: rol=${_sinfonicaAbrir.rol} origin=${_sinfonicaAbrir.origin} → "${subject}"`);
  } else {
    // Fallback graceful V14: solo título de la tarjeta (sin "Edición #N")
    // Coherente con la decisión cuántico-quark: el display name "Triggui"
    // ya marca el remitente, "Edición #N" duplica info que verá adentro.
    subject = sanitizeParagraph(tarjeta.titulo || libro.titulo || "Una idea de un gran libro")
      .replace(/\s+/g, " ").trim();
    Logger.log(`🟡 V14 fallback (libro pre-v12) subject: "${subject}"`);
  }

  return {
    ok: true,
    libro,
    subject,
    finalHTML,
    finalPlain,
    inlineImages
  };
}


/* ════════════════════ ENVÍO AUTOMÁTICO TRAS SUSCRIPCIÓN V18h ═════════════
 *
 * V18h NIVEL DIOS DELIVERABILITY: envía con MÁXIMA tasa de entrega a Inbox.
 *
 * Mejoras V18h sobre V18g:
 *   - Acepta nombreDestinatario para personalización completa
 *   - Usa "name: 'Triggui'" para que el remitente diga "Triggui" (no "badirnakid")
 *   - Usa "replyTo: hola@triggui.com" si está configurado en CONFIG
 *   - Subject personalizado con nombre
 *
 * Args:
 *   email:                string con el email del nuevo suscriptor
 *   rowIdx:               índice 1-based de la fila
 *   nombreDestinatario:   string opcional, primer nombre para personalización
 *
 * Returns: { ok: bool, reason: string }
 * ══════════════════════════════════════════════════════════════════════════ */
function enviarTrigguiAUno(email, rowIdx, nombreDestinatario) {
  // 1. Verificar quota Gmail
  const remainingQuota = MailApp.getRemainingDailyQuota();
  if (remainingQuota < 5) {
    return { ok: false, reason: `Sin quota Gmail (restantes: ${remainingQuota})` };
  }

  // 2. Preparar email con personalización (V18i: pasa email para unsub link · V19: pasa rowIdx para trial banner)
  const prep = prepararEmailParaEnvio(nombreDestinatario, email, rowIdx);
  if (!prep.ok) return prep;

  // 3. Enviar con headers nivel dios deliverability
  try {
    const sendOptions = {
      htmlBody: prep.finalHTML,
      inlineImages: prep.inlineImages,
      name: REMITENTE_DISPLAY_NAME,        // "Triggui" en lugar de "badirnakid"
      replyTo: REMITENTE_REPLY_TO          // hola@triggui.com (configurable)
    };
    GmailApp.sendEmail(email, prep.subject, prep.finalPlain, sendOptions);
  } catch (e) {
    return { ok: false, reason: "Error sendEmail: " + e.message };
  }

  // 4. Marcar tracking en la fila
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (sheet && rowIdx >= 2) {
      sheet.getRange(rowIdx, 10).setValue(prep.libro.titulo);
      sheet.getRange(rowIdx, 11).setValue(prep.libro.autor || "");
      sheet.getRange(rowIdx, 12).setValue(toPlainTextFromTokens(prep.libro.tarjeta.parrafoBot || "").slice(0, 200));
      sheet.getRange(rowIdx, 13).setValue(new Date());
      sheet.getRange(rowIdx, 14).setValue(`#${formatEdicionNumero(prep.libro._edicion_numero)} (auto-bienvenida)`);
    }
  } catch (e) {
    Logger.log("⚠️ Error marcando tracking: " + e.message);
  }

  return { ok: true, libro: prep.libro.titulo, edicion: prep.libro._edicion_numero };
}


/* ═══════════════════════ doPost — ENTRY POINT WEB APP ════════════════════
 *
 * V18g NIVEL DIOS CUÁNTICO-QUARK: recibe los formularios de triggui.com y la
 * app móvil. Es el reemplazo del Apps Script de captación viejo.
 *
 * Rutas:
 *   action=like  → escribe en sheet "Likes" (sagrado, intacto de captación viejo)
 *   default (lead) → escribe en "Triggui Emails Prueba" + envía bienvenida
 *
 * Comportamiento para duplicados:
 *   SILENCIOSO: si el email YA existe, NO appendRow, NO envía email, NO error
 *   pero SÍ loguea para tu trazabilidad.
 *
 * Defensas:
 *   - LockService previene race conditions de 2 forms simultáneos
 *   - Validación de email antes de cualquier acción
 *   - Try/catch global → siempre retorna JSON success al frontend
 *     (para no exponer errores internos)
 *
 * Configuración para deploy:
 *   Apps Script → Deploy → New deployment
 *   Type: Web app
 *   Execute as: Me (badir)
 *   Who has access: Anyone
 * ══════════════════════════════════════════════════════════════════════════ */
function doPost(e) {
  // Lock para evitar race conditions entre formularios simultáneos
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);  // espera hasta 10s si hay otro lock activo
  } catch (lockErr) {
    Logger.log("⚠️ doPost: no se pudo obtener lock — " + lockErr.message);
    return ContentService.createTextOutput(JSON.stringify({ result: "lock_timeout" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || "lead";

    // ─── RUTA 1: LIKE (App móvil) — preservada exactamente del captación viejo ───
    if (action === "like") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheetLikes = ss.getSheetByName("Likes");
      if (!sheetLikes) sheetLikes = ss.insertSheet("Likes");

      const fecha = new Date();
      const libro = params.book || "Desconocido";
      const autor = params.author || "Desconocido";
      const frases = params.phrases || "";
      const racha = params.streak || "0";
      const totalLibros = params.total_books || "0";
      const dispositivo = params.platform || "Web";
      const conceptos = params.concepts || "0";
      const origen = params.source || "Desconocido";
      const tipoUsuario = (parseInt(totalLibros) > 1) ? "Recurrente" : "Nuevo";

      sheetLikes.appendRow([fecha, libro, autor, frases, racha, totalLibros, dispositivo, conceptos, tipoUsuario, origen]);

      return ContentService.createTextOutput(JSON.stringify({ result: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ─── RUTA 2: LEAD (Landing triggui.com) — V18g NIVEL DIOS ──────────────
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheetLeads = ss.getSheetByName(SHEET_NAME);

    if (!sheetLeads) {
      sheetLeads = ss.insertSheet(SHEET_NAME);
      sheetLeads.appendRow([
        "Nombre", "Apellido", "Email", "Teléfono", "Source", "Fecha",
        "UTM Source", "UTM Medium", "UTM Campaign",
        "Libro", "Autor", "Frases", "Fecha envío", "Edición"
      ]);
    }

    // Validar email
    const email = (params.email || "").trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Logger.log("⚠️ doPost lead: email inválido — " + JSON.stringify(params));
      return ContentService.createTextOutput(JSON.stringify({ result: "invalid_email" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // V18i Opción A: REACTIVACIÓN AUTOMÁTICA SILENCIOSA
    //
    // Lógica cuántico-quark axiomática matemática:
    //   - Email existe + ACTIVO (col O vacía o no-UNSUBSCRIBED) → silencioso (duplicado)
    //   - Email existe + UNSUBSCRIBED → REACTIVAR:
    //     * Col O = "RESUSCRITO [fecha] (era [status previo])"
    //     * Col J = vacía (recibirá libro actual como nuevo)
    //     * Dispara enviarTrigguiAUno
    //   - Email NO existe → flujo normal (appendRow + enviarTrigguiAUno)
    //
    // Razonamiento: llenar el form de triggui.com es un acto explícito que
    // implica consentimiento renovado. El histórico se preserva en col O
    // para trazabilidad y futura detección de abuso de ciclos.
    const data = sheetLeads.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const emailsInRow = parseEmailsFromCell(data[i][2]);
      if (emailsInRow.some(e => e.toLowerCase() === email)) {
        const rowIdx1Based = i + 1;

        if (isRowUnsubscribed(data[i])) {
          // ─── REACTIVACIÓN AUTOMÁTICA ─────────────────────────────────
          const fechaStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
          const statusPrevio = String(data[i][UNSUBSCRIBE_COL - 1] || "").trim();

          // Marcar col O como RESUSCRITO conservando histórico
          sheetLeads.getRange(rowIdx1Based, UNSUBSCRIBE_COL)
            .setValue(`RESUSCRITO ${fechaStr} (era ${statusPrevio})`);

          Logger.log(`♻️ doPost lead: REACTIVACIÓN — "${email}" en fila ${rowIdx1Based} (era ${statusPrevio})`);

          // V18l-3: re-leer la fila para evaluar cap semanal con status nuevo
          // ANTES de limpiar col J (consistencia semántica cuántico-quark)
          const rowDataActualizado = sheetLeads.getRange(rowIdx1Based, 1, 1, SENDS_WEEK_COL).getValues()[0];

          if (hasReachedWeeklyLimit(rowDataActualizado)) {
            // Cap activo: el usuario recibió hace <7 días. No re-enviar todavía.
            // Col J/M/N permanecen con el envío original (consistente: "ya recibió esa semana")
            Logger.log(`🛑 doPost lead: reactivación CAPPED — "${email}" recibió hace <7d, próximo envío diferido`);
            return ContentService.createTextOutput(JSON.stringify({
              result: "reactivated_capped",
              first_name: sanitizarNombre(params.first_name) || ""
            })).setMimeType(ContentService.MimeType.JSON);
          }

          // Cap libre: AHORA SÍ limpiar col J para que reciba libro actual como nuevo
          sheetLeads.getRange(rowIdx1Based, 10).setValue("");

          // Disparar envío del libro actual con personalización
          const reEnvio = enviarTrigguiAUno(email, rowIdx1Based, params.first_name || "");
          if (reEnvio.ok) {
            Logger.log(`📧 doPost lead: bienvenida (reactivación) enviada — "${reEnvio.libro}" #${reEnvio.edicion}`);
            // V18l: registrar el envío en col P
            recordSend(sheetLeads, rowIdx1Based);
          } else {
            Logger.log(`⚠️ doPost lead: bienvenida (reactivación) NO enviada — ${reEnvio.reason}`);
          }

          // V18j: código específico "reactivated" para frontend
          return ContentService.createTextOutput(JSON.stringify({
            result: "reactivated",
            first_name: sanitizarNombre(params.first_name) || ""
          })).setMimeType(ContentService.MimeType.JSON);
        }

        // ─── Duplicado regular (activo): silencioso ─────────────────────
        Logger.log(`🔇 doPost lead: duplicado SILENCIOSO — "${email}" ya en fila ${rowIdx1Based}`);
        // V18j: código específico "already_active" para frontend
        return ContentService.createTextOutput(JSON.stringify({
          result: "already_active",
          first_name: sanitizarNombre(params.first_name) || ""
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Email nuevo → appendRow + enviar bienvenida + MARCAR SUBSCRIBED
    const nombre   = params.first_name || "";
    const apellido = params.last_name || "";
    const phone    = params.phone || "";
    const source   = params.source || "desconocido";
    const fecha    = new Date();
    const fechaStrSub = Utilities.formatDate(fecha, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");

    sheetLeads.appendRow([
      nombre,
      apellido,
      email,
      "'" + phone,                  // prefijo apóstrofe (preserva formato +52...)
      source,
      fecha,
      params.utm_source || "",
      params.utm_medium || "",
      params.utm_campaign || "",
      "",                              // J Libro (lo llena enviarTrigguiAUno)
      "",                              // K Autor
      "",                              // L Frases
      "",                              // M Fecha envío
      "",                              // N Edición
      `SUBSCRIBED_TRIAL ${fechaStrSub}`, // O Status — V19 trial 28 días
      ""                               // P Envíos semana (V18l, vacía = nunca recibió)
    ]);

    const rowIdx = sheetLeads.getLastRow();  // 1-based

    Logger.log(`✅ doPost lead: nuevo SUBSCRIBED_TRIAL en fila ${rowIdx} — ${email}`);

    // V18h: pasar nombre para personalización del email
    const envioResult = enviarTrigguiAUno(email, rowIdx, nombre);

    if (envioResult.ok) {
      Logger.log(`📧 doPost lead: bienvenida enviada — "${envioResult.libro}" #${envioResult.edicion}`);
      // V18l: registrar el envío en col P para respetar cap semanal en futuros runs
      recordSend(sheetLeads, rowIdx);
    } else {
      Logger.log(`⚠️ doPost lead: bienvenida NO enviada — ${envioResult.reason}`);
      // No es crítico: el usuario quedó suscrito, el masivo lo cubrirá después
    }

    // V18j: código específico "new" para frontend
    return ContentService.createTextOutput(JSON.stringify({
      result: "new",
      first_name: sanitizarNombre(nombre) || ""
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("❌ doPost ERROR GLOBAL: " + err.message + " | stack: " + err.stack);
    // V18j: error retorna "new" para no exponer fallos (el usuario ve success)
    return ContentService.createTextOutput(JSON.stringify({
      result: "new",
      first_name: ""
    })).setMimeType(ContentService.MimeType.JSON);

  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}


/* ═══════════════════════ doGet — Web App entry GET V18i ════════════════════
 *
 * V18i NIVEL DIOS: maneja 2 rutas vía GET:
 *
 *   1. ?action=unsubscribe&email=X&token=Y
 *      → Valida token HMAC
 *      → Marca col O = "UNSUBSCRIBED [fecha]" en la fila del email
 *      → Retorna página HTML minimalista: "Entendido."
 *
 *   2. (sin parámetros) o cualquier otra GET
 *      → Retorna mensaje de diagnóstico (Web App vivo)
 *
 * Defensas:
 *   - Token HMAC anti-spoofing
 *   - LockService para evitar race conditions con doPost
 *   - Try/catch global → siempre retorna HTML al usuario
 *   - Si email no existe en sheet → "Entendido." igual (anti-enumeration)
 *   - Si ya está unsubscribed → "Entendido." igual (idempotente)
 * ══════════════════════════════════════════════════════════════════════════ */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action || "";
  const format = params.format || "html";

  // ─── Ruta unsubscribe ────────────────────────────────────────────────
  if (action === "unsubscribe") {
    return manejarUnsubscribe(params.email || "", params.token || "", format);
  }

  // ─── Default: diagnóstico Web App ────────────────────────────────────
  return ContentService.createTextOutput(
    "🌒 Triggui Apps Script V19.2.4 — endpoint activo (trial 28d + pricing + 104 saludos + trial banner top + WhatsApp arriba aleatorio + footer fijo + multi-email sin nombre).\n" +
    "POST: captación + bienvenida automática.\n" +
    "GET ?action=unsubscribe&email=X&token=Y[&format=json]: dar de baja.\n" +
    "GET sin params: este mensaje."
  ).setMimeType(ContentService.MimeType.TEXT);
}


/* ════════════════════ MANEJAR UNSUBSCRIBE V18m ═══════════════════════════
 *
 * Procesa el click en "Cancelar suscripción" del email.
 * Siempre retorna respuesta exitosa independientemente del resultado interno
 * (anti-enumeration: no decimos si el email existía).
 *
 * V18m: agrega soporte para format=json. Cuando el caller es triggui.com/entendido
 * (página estática que hace fetch en background), pasa format=json y recibe
 * { ok: true, first_name: "Badir" }. La página estática renderiza brand-coherent
 * sin el wrapper feo de Google.
 *
 * Backwards-compat: si format != "json", retorna HTML legacy (para emails viejos
 * con links que apuntaban directo al Apps Script).
 *
 * Args:
 *   email: string del email a desuscribir
 *   token: HMAC del email (valida que la URL no fue manipulada)
 *   format: "json" para frontend triggui.com, "html" (default) para legacy
 *
 * Returns:
 *   - HtmlOutput con página "Entendido" si format="html"
 *   - TextOutput JSON {ok, first_name} si format="json"
 * ══════════════════════════════════════════════════════════════════════════ */
function manejarUnsubscribe(email, token, format) {
  format = format || "html";
  const isJson = (format === "json");

  // Helper para respuesta uniforme
  function respond(primerNombre) {
    if (isJson) {
      return ContentService.createTextOutput(JSON.stringify({
        ok: true,
        first_name: primerNombre || ""
      })).setMimeType(ContentService.MimeType.JSON);
    }
    return renderPaginaEntendido(primerNombre);
  }

  // Lock para evitar conflictos con doPost
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (e) { /* continuar igual */ }

  try {
    // 1. Validación básica
    if (!email || !token) {
      Logger.log("⚠️ unsubscribe: faltan parámetros email/token");
      return respond("");
    }

    // 2. Validar token HMAC (anti-spoofing)
    if (!validarTokenUnsub(email, token)) {
      Logger.log(`⚠️ unsubscribe: token inválido para "${email}"`);
      return respond("");
    }

    // 3. Buscar fila por email
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      Logger.log("❌ unsubscribe: sheet no existe");
      return respond("");
    }

    const rowIdx = buscarFilaPorEmail(sheet, email);
    if (rowIdx < 0) {
      Logger.log(`📍 unsubscribe: email "${email}" no está en sheet (silencioso)`);
      return respond("");
    }

    // 4. Marcar col O como UNSUBSCRIBED (idempotente)
    const fechaStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
    sheet.getRange(rowIdx, UNSUBSCRIBE_COL).setValue(`UNSUBSCRIBED ${fechaStr}`);

    Logger.log(`🚫 unsubscribe OK: "${email}" en fila ${rowIdx} (format=${format})`);

    // 5. Obtener primer nombre para personalizar (opcional)
    const data = sheet.getRange(rowIdx, 1).getValue();
    const primerNombre = sanitizarNombre(data);

    return respond(primerNombre);

  } catch (err) {
    Logger.log("❌ unsubscribe ERROR: " + err.message);
    return respond("");
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}


/* ════════════════════ PÁGINA HTML "ENTENDIDO." V18l-2 ══════════════════════
 *
 * Diseño cuántico-quark axiomático:
 *   - Fondo negro #0B0F1A (mismo que triggui.com — continuidad visual)
 *   - Tipografía Plus Jakarta Sans (misma que el sitio)
 *   - Check ✓ con micro-animación de entrada (scale 0→1, fade-in)
 *   - Mensaje: "Entendido, [Nombre]."
 *   - Sub: "Si quieres volver, te esperamos en triggui.com"
 *   - Sin loading, sin redirects, sin footer pesado
 *   - Carga instantánea (CSS inline, sin Google Fonts externos)
 *
 * Sensación buscada: el link del email parece haberse "transformado"
 * inmediatamente en este mensaje, sin abrir una "página tradicional".
 *
 * Args:
 *   primerNombre: string opcional. Si presente, personaliza ("Entendido, Badir.")
 * ══════════════════════════════════════════════════════════════════════════ */
function renderPaginaEntendido(primerNombre) {
  const mensaje = primerNombre
    ? `Entendido, ${_esc(primerNombre)}.`
    : "Entendido.";

  const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Triggui</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #0B0F1A;
      color: #F5F0E8;
      min-height: 100vh;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .container {
      text-align: center;
      max-width: 420px;
      animation: fadeIn .6s cubic-bezier(.22,1,.36,1) both;
    }
    .check {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #E8A838 0%, #FF6B4A 100%);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      animation: pop .6s cubic-bezier(.34,1.56,.64,1) .15s both;
    }
    .check svg {
      width: 28px;
      height: 28px;
      stroke: #0B0F1A;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      fill: none;
    }
    .check svg path {
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
      animation: draw .4s cubic-bezier(.22,1,.36,1) .45s forwards;
    }
    h1 {
      font-size: clamp(26px, 6vw, 36px);
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin: 0 0 14px;
      color: #F5F0E8;
    }
    .sub {
      font-size: 14px;
      line-height: 1.6;
      color: rgba(245, 240, 232, 0.45);
      margin: 0;
    }
    .sub a {
      color: #E8A838;
      text-decoration: none;
      border-bottom: 1px solid rgba(232, 168, 56, 0.3);
      transition: border-color .2s;
    }
    .sub a:hover {
      border-bottom-color: #E8A838;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pop {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.08); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes draw {
      to { stroke-dashoffset: 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="check">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5l4.5 4.5L19 7.5"/>
      </svg>
    </div>
    <h1>${_esc(mensaje)}</h1>
    <p class="sub">Si quieres volver, te esperamos en <a href="https://triggui.com">triggui.com</a></p>
  </div>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle("Triggui")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/* ══════════════════════════════ MAIN V18g NIVEL DIOS ════════════════════════
 *
 * V18g hereda V18f CUÁNTICO-QUARK MATEMÁTICO GEOMÉTRICO AXIOMÁTICO:



 *
 * FASE 1 — DEDUP AUTOMÁTICO al inicio
 *   Recorre la sheet, elimina filas con emails duplicados (preserva 1era ocurrencia)
 *   También elimina filas sin email válido.
 *   Soporta múltiples emails por celda (split por , ; espacios).
 *
 * FASE 2 — ALGORITMO DE PRIORIDAD CUÁNTICO
 *
 *   PASO A — POOL DE VACÍOS (prioridad máxima):
 *     Recorre todas las filas
 *     Si col J está vacía → AGREGA A POOL_NUEVOS
 *     Recibe primero el libro actual.
 *
 *   PASO B — POOL DE ELEGIBLES (rotación justa):
 *     Si quedan envíos después de POOL_NUEVOS:
 *     Recorre filas con col J ≠ título actual del libro
 *     Ordena por col M ascendente (fecha más antigua = más prioridad)
 *     Envía hasta agotar quota
 *
 *   PASO C — REPORTE FINAL nivel dios:
 *     ✅ Enviados a NUEVOS (sin libro previo)
 *     ✅ Enviados a EXISTENTES (rotación)
 *     ⏭️  Ya recibieron este libro
 *     ⏳ Pendientes para mañana
 *     🗑️  Duplicados eliminados al inicio
 *
 * FASE 3 — DEFENSAS:
 *   - Respeta MailApp.getRemainingDailyQuota() con buffer de 5
 *   - Múltiples emails por celda → envía a todos (separados por comas)
 *   - Si una fila tiene múltiples emails y uno duplica con otra fila → SE BORRA
 *   - Tracking en columnas J-N (autor, frase, fecha, edición)
 *
 * ══════════════════════════════════════════════════════════════════════════ */
function enviarTrigguiLunes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log("❌ No existe la hoja: " + SHEET_NAME); return; }

  if (sheet.getLastRow() < 2) { Logger.log("❌ No hay destinatarios."); return; }

  // ════════════════════════════════════════════════════════════════════════
  // V18g: usar prepararEmailParaEnvio (DRY — compartido con enviarTrigguiAUno)
  // ════════════════════════════════════════════════════════════════════════
  const prep = prepararEmailParaEnvio();
  if (!prep.ok) {
    Logger.log("❌ ABORT: " + prep.reason);
    return;
  }

  const { libro, subject, finalHTML, finalPlain, inlineImages } = prep;

  Logger.log(`✅ Libro seleccionado: "${libro.titulo}" — ${libro.autor}`);
  Logger.log(`   Edición #${formatEdicionNumero(libro._edicion_numero)}`);
  Logger.log(`   Accent: ${libro?.tarjeta?.style?.accent || "(default)"}`);

  // ════════════════════════════════════════════════════════════════════════
  // V18f FASE 1 — DEDUP AUTOMÁTICO NIVEL DIOS
  // ════════════════════════════════════════════════════════════════════════
  Logger.log("");
  Logger.log("🧹 FASE 1: Deduplicación automática");
  const dedupResult = dedupSheetByEmail(sheet);
  Logger.log(`   ✓ Filas duplicadas/inválidas eliminadas: ${dedupResult.dedupped}`);
  Logger.log(`   ✓ Total emails únicos en base: ${dedupResult.uniqueEmails}`);
  Logger.log(`   ✓ Total emails parseados (incluye multi-celda): ${dedupResult.totalEmails}`);

  // Refrescar data DESPUÉS del dedup (la sheet cambió)
  const data = sheet.getDataRange().getValues();

  // ════════════════════════════════════════════════════════════════════════
  // V18f FASE 2 — ALGORITMO DE PRIORIDAD CUÁNTICO-QUARK
  // ════════════════════════════════════════════════════════════════════════
  //
  // Construir dos pools y enviar en orden de prioridad:
  //   POOL_NUEVOS:    filas con col J vacía (nunca han recibido ningún libro)
  //   POOL_ELEGIBLES: filas con col J ≠ título actual (ya recibieron OTRO libro)
  //                    ordenadas por col M ascendente (más antiguos = más prioridad)
  //
  // Filas con col J === título actual → SKIP (ya recibieron este libro)
  //
  // GARANTÍA MATEMÁTICA AXIOMÁTICA:
  //   - Nuevos suscriptores siempre tienen prioridad sobre rotación
  //   - Cuando todos los nuevos han recibido, el sistema rota orgánicamente
  //   - Nadie recibe el mismo libro dos veces (col J protege)
  //   - Si una fila tiene múltiples emails, se envía a TODOS los emails de esa fila
  // ════════════════════════════════════════════════════════════════════════

  const QUOTA_BUFFER = 5;
  const remainingQuota = MailApp.getRemainingDailyQuota();
  const maxEnviosBatch = Math.max(0, remainingQuota - QUOTA_BUFFER);

  Logger.log("");
  Logger.log(`📬 Quota Gmail restante: ${remainingQuota} emails`);
  Logger.log(`   Buffer de seguridad: ${QUOTA_BUFFER}`);
  Logger.log(`   Máximo envíos en este batch: ${maxEnviosBatch}`);

  if (maxEnviosBatch === 0) {
    Logger.log("⚠️  ABORT: Sin quota disponible. Intenta mañana.");
    return;
  }

  // ════════════════════════════════════════════════════════════════════════
  // V18l — ALGORITMO CUÁNTICO-QUARK CON CONSENTIMIENTO + CAP SEMANAL
  // ════════════════════════════════════════════════════════════════════════
  //
  // 6 pools por (consentimiento + nivel servicio) × (nuevo/rotación):
  //
  //   POOL 1 — SUBSCRIBED_MEMBER + col J vacía  (cap 2, pago, nunca recibió)
  //   POOL 2 — SUBSCRIBED_MEMBER + col J llena  (cap 2, pago, rotación)
  //   POOL 3 — SUBSCRIBED_FREE/RESUSCRITO + col J vacía  (cap 1, free, nunca recibió)
  //   POOL 4 — SUBSCRIBED_FREE/RESUSCRITO + col J llena  (cap 1, free, rotación)
  //   POOL 5 — BULK_LEGACY + col J vacía  (cap 1, sin permiso, nuevos)
  //   POOL 6 — BULK_LEGACY + col J llena  (cap 1, sin permiso, rotación)
  //
  //   UNSUBSCRIBED → nunca
  //   AL CAP semanal → skip (auto-libera cuando pasen 7 días)
  //
  // Garantías cuántico-quark:
  //   • Los que pagan tienen prioridad máxima
  //   • Los que dieron consentimiento explícito (free) > los de base vieja
  //   • Nadie excede su cap prometido (free 1/sem, member 2/sem)
  //   • Auto-rotación temporal: cuando pase la semana, el cap se libera solo
  // ════════════════════════════════════════════════════════════════════════
  const poolMemberNuevos  = [];   // 1 — cap 2, col J vacía
  const poolMemberRotacion = [];  // 2 — cap 2, col J llena
  const poolFreeNuevos    = [];   // 3 — cap 1, col J vacía (incluye RESUSCRITO)
  const poolFreeRotacion  = [];   // 4 — cap 1, col J llena
  const poolBulkNuevos    = [];   // 5 — cap 1, col J vacía
  const poolBulkRotacion  = [];   // 6 — cap 1, col J llena
  let skippedYaRecibieron = 0;
  let skippedSinEmail     = 0;
  let skippedUnsubscribed = 0;
  let skippedCapSemanal   = 0;    // V18l NUEVO
  let skippedTrialExpirado = 0;   // V19 NUEVO

  const tituloActualNorm = libro.titulo.toLowerCase().trim();

  for (let i = 1; i < data.length; i++) {
    const cellC       = data[i][2];               // Col C = email(s)
    const ultimoLibro = (data[i][9] || "").toString().trim();   // Col J
    const fechaUltimo = data[i][12];              // Col M

    const emailsInRow = parseEmailsFromCell(cellC);
    if (emailsInRow.length === 0) {
      skippedSinEmail++;
      continue;
    }

    // V18i: ¿está dada de baja? → SKIP
    if (isRowUnsubscribed(data[i])) {
      skippedUnsubscribed++;
      continue;
    }

    // V19: ¿trial expirado? → auto-marcar SUBSCRIBED_EXPIRED + SKIP
    if (debeMarcarseExpired(data[i])) {
      const fechaExp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
      const statusActual = String(data[i][UNSUBSCRIBE_COL - 1] || "").trim();
      sheet.getRange(i + 1, UNSUBSCRIBE_COL)
        .setValue(`SUBSCRIBED_EXPIRED ${fechaExp} (era ${statusActual})`);
      // Actualizar la fila en memoria también para que el resto del flujo lo vea
      data[i][UNSUBSCRIBE_COL - 1] = `SUBSCRIBED_EXPIRED ${fechaExp} (era ${statusActual})`;
      skippedTrialExpirado++;
      Logger.log(`⏰ Trial auto-expirado: fila ${i + 1} — "${data[i][2]}" (era ${statusActual})`);
      continue;
    }

    // ¿Ya recibió este libro?
    if (ultimoLibro && ultimoLibro.toLowerCase() === tituloActualNorm) {
      skippedYaRecibieron++;
      continue;
    }

    // V18l: ¿alcanzó cap semanal? → SKIP (auto-libera en 7 días)
    if (hasReachedWeeklyLimit(data[i])) {
      skippedCapSemanal++;
      continue;
    }

    // Clasificar en uno de los 6 pools
    const tieneRotacion = !!ultimoLibro;
    const fechaMs = (fechaUltimo instanceof Date) ? fechaUltimo.getTime() : 0;
    const entry = { rowIdx: i, emails: emailsInRow, fechaUltimoEnvio: fechaMs };

    if (isRowSubscribedMember(data[i])) {
      if (!tieneRotacion) poolMemberNuevos.push(entry);
      else poolMemberRotacion.push(entry);
    } else if (isRowSubscribedFree(data[i])) {
      if (!tieneRotacion) poolFreeNuevos.push(entry);
      else poolFreeRotacion.push(entry);
    } else {
      // BULK_LEGACY (sin sello)
      if (!tieneRotacion) poolBulkNuevos.push(entry);
      else poolBulkRotacion.push(entry);
    }
  }

  // Ordenar pools de rotación: fecha más antigua primero
  poolMemberRotacion.sort((a, b) => a.fechaUltimoEnvio - b.fechaUltimoEnvio);
  poolFreeRotacion.sort((a, b) => a.fechaUltimoEnvio - b.fechaUltimoEnvio);
  poolBulkRotacion.sort((a, b) => a.fechaUltimoEnvio - b.fechaUltimoEnvio);

  Logger.log("");
  Logger.log(`💎 Pool 1 — MEMBER nuevos:        ${poolMemberNuevos.length} filas`);
  Logger.log(`💠 Pool 2 — MEMBER rotación:      ${poolMemberRotacion.length} filas`);
  Logger.log(`🟢 Pool 3 — FREE nuevos:          ${poolFreeNuevos.length} filas`);
  Logger.log(`🔵 Pool 4 — FREE rotación:        ${poolFreeRotacion.length} filas`);
  Logger.log(`🟡 Pool 5 — BULK_LEGACY nuevos:   ${poolBulkNuevos.length} filas`);
  Logger.log(`🟠 Pool 6 — BULK_LEGACY rotación: ${poolBulkRotacion.length} filas`);
  Logger.log(`⏭️  Ya recibieron este libro:     ${skippedYaRecibieron} filas`);
  Logger.log(`🚫 Unsubscribed (col O):          ${skippedUnsubscribed} filas`);
  Logger.log(`⏰ Trial expirado (auto-marcado): ${skippedTrialExpirado} filas`);
  Logger.log(`🛑 Al cap semanal (col P):        ${skippedCapSemanal} filas`);
  Logger.log(`⚠️  Sin email válido:              ${skippedSinEmail} filas`);
  Logger.log("");

  // Combinar pools en orden cuántico-quark de prioridad:
  const pipeline = [
    ...poolMemberNuevos,
    ...poolMemberRotacion,
    ...poolFreeNuevos,
    ...poolFreeRotacion,
    ...poolBulkNuevos,
    ...poolBulkRotacion
  ];

  // Helper para enviar a una fila (puede tener múltiples emails)
  function sendToRow(row, batchInfo) {
    const i = row.rowIdx;
    let enviadosEnEstaFila = 0;
    const emailsToSend = row.emails.join(",");  // Gmail acepta múltiples en una llamada

    // V19.2: subject sin nombre del destinatario (display name "Triggui" + tarjeta.titulo)
    // Razón cuántica: nombre repetido en lista de Gmail = cansa. Mejor consistencia con tarjeta.
    // V19.2.4: si la celda tiene múltiples correos (ej: "jana@3M.com, victor@3m.com"),
    // FORZAR saludo sin nombre. El nombre de col A solo aplica a uno de los destinatarios;
    // saludar a Victor con "Hola Jaqueline" sería incoherente. Multi-email → saludo genérico.
    const nombreFila = row.emails.length > 1 ? "" : sanitizarNombre(data[i][0]);
    const subjectFila = prep.subject;  // ya viene como "Edición #043 · Tu paz tiene precio"

    // V18i: link de unsubscribe personalizado por fila
    const primerEmailFila = row.emails[0] || "";
    const unsubLinkFila = primerEmailFila ? generarUrlUnsub(primerEmailFila) : "https://triggui.com";

    // V19.2.2: por fila — saludo aleatorio + trial banner top + WhatsApp arriba aleatorio (footer siempre fijo)
    const cFila = TRIGGUI_STYLE_CONFIG;
    const saludoHTMLFila = generarSaludoHTML(nombreFila, cFila.sans, cFila.background, cFila.cardWidth);
    const saludoPlainFila = generarSaludoTexto(nombreFila) + (nombreFila ? "\n\n" : "\n");
    const trialTopHTMLFila = generarTrialBannerTopHTML(data[i], cFila.sans, cFila.background, cFila.cardWidth);
    const trialTopPlainFila = generarTrialBannerTopPlain(data[i]);

    const mostrarWaArribaFila = Math.random() < 0.5;
    const waTopHTMLFila = mostrarWaArribaFila ? generarWhatsAppPromoTopHTML(cFila.cardWidth) : "";
    const waTopPlainFila = mostrarWaArribaFila ? WHATSAPP_PROMO_TOP_PLAIN : "";

    // V20 — KIDS PROMO banner por fila (siempre si KIDS_PROMO_ENABLED)
    const kidsTopHTMLFila = KIDS_PROMO_ENABLED ? generarKidsPromoTopHTML(cFila.cardWidth) : "";
    const kidsTopPlainFila = KIDS_PROMO_ENABLED ? KIDS_PROMO_TOP_PLAIN : "";

    let htmlPersonalizado  = finalHTML
      .replace(/\{\{UNSUB_LINK\}\}/g, unsubLinkFila)
      .replace(/\{\{GREETING_BLOCK\}\}/g, saludoHTMLFila)
      .replace(/\{\{TRIAL_BANNER_TOP\}\}/g, trialTopHTMLFila)
      .replace(/\{\{KIDS_PROMO_TOP\}\}/g, kidsTopHTMLFila)
      .replace(/\{\{WHATSAPP_PROMO_TOP\}\}/g, waTopHTMLFila);
    let plainPersonalizado = finalPlain
      .replace(/\{\{UNSUB_LINK\}\}/g, unsubLinkFila)
      .replace(/\{\{GREETING_PLAIN\}\}/g, saludoPlainFila)
      .replace(/\{\{TRIAL_BANNER_TOP_PLAIN\}\}/g, trialTopPlainFila)
      .replace(/\{\{KIDS_PROMO_TOP_PLAIN\}\}/g, kidsTopPlainFila)
      .replace(/\{\{WHATSAPP_PROMO_TOP_PLAIN\}\}/g, waTopPlainFila);

    try {
      // V18h: headers anti-spam nivel dios
      GmailApp.sendEmail(emailsToSend, subjectFila, plainPersonalizado, {
        htmlBody: htmlPersonalizado,
        inlineImages: inlineImages,
        name: REMITENTE_DISPLAY_NAME,
        replyTo: REMITENTE_REPLY_TO
      });
      enviadosEnEstaFila = row.emails.length;

      // Tracking en sheet
      sheet.getRange(i + 1, 10).setValue(libro.titulo);
      sheet.getRange(i + 1, 11).setValue(libro.autor || "");
      sheet.getRange(i + 1, 12).setValue(toPlainTextFromTokens(libro.tarjeta.parrafoBot || "").slice(0, 200));
      sheet.getRange(i + 1, 13).setValue(new Date());
      sheet.getRange(i + 1, 14).setValue(`#${formatEdicionNumero(libro._edicion_numero)}`);

      const tipoEmoji = batchInfo.emoji || "🆕";
      const tipoLabel = batchInfo.label || "Envío";
      Logger.log(`${tipoEmoji} [${batchInfo.contador}/${maxEnviosBatch}] ${tipoLabel}: ${emailsToSend}`);

      return enviadosEnEstaFila;
    } catch (e) {
      Logger.log(`⚠️  Error con ${emailsToSend}: ${e.message}`);
      return 0;
    }
  }

  // Ejecutar pipeline
  let enviadosMemberNuevos    = 0;
  let enviadosMemberRotacion  = 0;
  let enviadosFreeNuevos      = 0;
  let enviadosFreeRotacion    = 0;
  let enviadosBulkNuevos      = 0;
  let enviadosBulkRotacion    = 0;
  let filasProcesadas         = 0;
  let pendientesRestantes     = 0;

  // Helper: determina la categoría de cada row para reporting
  function tipoDeRow(row) {
    if (poolMemberNuevos.includes(row))   return 'member_nuevo';
    if (poolMemberRotacion.includes(row)) return 'member_rotacion';
    if (poolFreeNuevos.includes(row))     return 'free_nuevo';
    if (poolFreeRotacion.includes(row))   return 'free_rotacion';
    if (poolBulkNuevos.includes(row))     return 'bulk_nuevo';
    return 'bulk_rotacion';
  }

  function emojiDeTipo(t) {
    if (t === 'member_nuevo')    return '💎';
    if (t === 'member_rotacion') return '💠';
    if (t === 'free_nuevo')      return '🟢';
    if (t === 'free_rotacion')   return '🔵';
    if (t === 'bulk_nuevo')      return '🟡';
    return '🟠';
  }

  function labelDeTipo(t) {
    if (t === 'member_nuevo')    return 'MEMBER-nuevo';
    if (t === 'member_rotacion') return 'MEMBER-rotación';
    if (t === 'free_nuevo')      return 'FREE-nuevo';
    if (t === 'free_rotacion')   return 'FREE-rotación';
    if (t === 'bulk_nuevo')      return 'BULK-nuevo';
    return 'BULK-rotación';
  }

  for (const row of pipeline) {
    if (filasProcesadas >= maxEnviosBatch) {
      pendientesRestantes++;
      continue;
    }

    const tipo = tipoDeRow(row);
    const enviados = sendToRow(row, {
      contador: filasProcesadas + 1,
      tipo: tipo,
      emoji: emojiDeTipo(tipo),
      label: labelDeTipo(tipo)
    });

    if (enviados > 0) {
      filasProcesadas++;
      // V18l: registrar el envío en col P para respetar cap semanal
      recordSend(sheet, row.rowIdx + 1);  // +1 porque rowIdx es 0-based en data, 1-based en sheet

      if (tipo === 'member_nuevo')         enviadosMemberNuevos++;
      else if (tipo === 'member_rotacion') enviadosMemberRotacion++;
      else if (tipo === 'free_nuevo')      enviadosFreeNuevos++;
      else if (tipo === 'free_rotacion')   enviadosFreeRotacion++;
      else if (tipo === 'bulk_nuevo')      enviadosBulkNuevos++;
      else                                 enviadosBulkRotacion++;

      // V19.2.3: throttle entre envíos para evitar rate limit de Gmail.
      // 250ms es seguro (Gmail acepta ~4 req/s sin problemas).
      // Para 70 envíos: ~18s extra. Apps Script timeout manual 30min → margen amplio.
      Utilities.sleep(250);
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // Reporte final nivel dios cuántico-quark V18l
  // ════════════════════════════════════════════════════════════════════════
  const enviadosTotalMember = enviadosMemberNuevos + enviadosMemberRotacion;
  const enviadosTotalFree   = enviadosFreeNuevos + enviadosFreeRotacion;
  const enviadosTotalBulk   = enviadosBulkNuevos + enviadosBulkRotacion;

  Logger.log("");
  Logger.log("═══════════════════════════════════════════════════════════════");
  Logger.log(`🌒 Envío completado · "${libro.titulo}" · #${formatEdicionNumero(libro._edicion_numero)}`);
  Logger.log("═══════════════════════════════════════════════════════════════");
  Logger.log(`🧹 Duplicados eliminados al inicio:    ${dedupResult.dedupped}`);
  Logger.log(`💎 MEMBER nuevos:                      ${enviadosMemberNuevos}`);
  Logger.log(`💠 MEMBER rotación:                    ${enviadosMemberRotacion}`);
  Logger.log(`🟢 FREE nuevos:                        ${enviadosFreeNuevos}`);
  Logger.log(`🔵 FREE rotación:                      ${enviadosFreeRotacion}`);
  Logger.log(`🟡 BULK_LEGACY nuevos:                 ${enviadosBulkNuevos}`);
  Logger.log(`🟠 BULK_LEGACY rotación:               ${enviadosBulkRotacion}`);
  Logger.log("───────────────────────────────────────────────────────────────");
  Logger.log(`💎 Total MEMBER (cap 2/sem):           ${enviadosTotalMember}`);
  Logger.log(`🟢 Total FREE+RESUSCRITO (cap 1/sem):  ${enviadosTotalFree}`);
  Logger.log(`🟡 Total BULK_LEGACY (cap 1/sem):      ${enviadosTotalBulk}`);
  Logger.log("───────────────────────────────────────────────────────────────");
  Logger.log(`⏭️  Ya recibieron este libro:          ${skippedYaRecibieron}`);
  Logger.log(`🚫 Unsubscribed:                       ${skippedUnsubscribed}`);
  Logger.log(`🛑 Al cap semanal (esperan <7d):       ${skippedCapSemanal}`);
  Logger.log(`⏳ Pendientes para mañana:             ${pendientesRestantes}`);
  Logger.log(`⚠️  Filas sin email válido:            ${skippedSinEmail}`);
  Logger.log("───────────────────────────────────────────────────────────────");
  Logger.log(`📊 Total filas en sheet:               ${data.length - 1}`);
  Logger.log(`📬 Quota Gmail restante después:       ${MailApp.getRemainingDailyQuota()}`);

  if (pendientesRestantes > 0) {
    Logger.log("");
    Logger.log(`💡 Quedan ${pendientesRestantes} pendientes. Ejecuta mañana cuando`);
    Logger.log(`   tu quota Gmail se renueve. El sistema priorizará automáticamente:`);
    Logger.log(`   1. MEMBER nuevos / rotación (cap 2/sem)`);
    Logger.log(`   2. FREE+RESUSCRITO nuevos / rotación (cap 1/sem)`);
    Logger.log(`   3. BULK_LEGACY nuevos / rotación (cap 1/sem)`);
  }
  if (skippedCapSemanal > 0) {
    Logger.log("");
    Logger.log(`🛑 ${skippedCapSemanal} filas saltadas por cap semanal.`);
    Logger.log(`   Auto-liberación: pasan 7 días calendario desde último envío.`);
  }
  if (poolMemberNuevos.length === 0 && poolFreeNuevos.length === 0 && poolBulkNuevos.length === 0 && skippedYaRecibieron === data.length - 1 - skippedSinEmail) {
    Logger.log("");
    Logger.log(`🎯 TODA tu base ya recibió este libro. Genera uno nuevo.`);
  } else {
    Logger.log("");
    Logger.log(`🎯 Base completa cubierta en este batch.`);
  }
}

/* ═══════════════════════ PREVIEW EN DRIVE ═══════════════════════════════
 *
 * Genera el mismo HTML que enviarTrigguiLunes pero lo guarda como archivo
 * Drive (HTML + PDF) para preview visual sin enviar emails reales.
 *
 * Útil para QA antes de un envío real.
 * ══════════════════════════════════════════════════════════════════════════ */
function guardarTarjetaEnDrive() {
  let libros = [];
  try {
    const resp = UrlFetchApp.fetch(CONTENIDO_URL);
    libros = (JSON.parse(resp.getContentText()).libros || []);
  } catch (e) {
    Logger.log("❌ Error leyendo contenido_manual.json: " + e.message);
    return;
  }
  if (!libros.length) { Logger.log("❌ No hay libros."); return; }

  const libro = libros[0];
  const validacion = validarLibroEmail(libro);
  if (!validacion.ok) {
    Logger.log("❌ ABORT: libros[0] inválido — " + validacion.reason);
    return;
  }

  // Portada embebida (data URI Base64 para preview offline)
  const portadaUrl = getPortadaURL(libro);
  let portadaRef = "";
  if (portadaUrl) {
    try {
      const r = UrlFetchApp.fetch(portadaUrl, { muteHttpExceptions: true });
      if (r.getResponseCode() === 200) {
        const b = r.getBlob();
        portadaRef = "data:" + b.getContentType() + ";base64," + Utilities.base64Encode(b.getBytes());
      }
    } catch (e) { Logger.log("⚠️ No se pudo embeber portada: " + e.message); }
  }

  let html = renderTarjetaEditorial(libro, portadaRef);

  // Logo Triggui como data URI (preview Drive necesita data URI, no cid:)
  try {
    const logoName = (TRIGGUI_STYLE_CONFIG.logoVariant === "negro")
      ? "trigguiletrasnegro.jpg"
      : "trigguiletrascolor3.png";
    const it = DriveApp.getFilesByName(logoName);
    if (it.hasNext()) {
      const logoBlob = it.next().getBlob();
      const dataUri = "data:" + logoBlob.getContentType() + ";base64," +
                      Utilities.base64Encode(logoBlob.getBytes());
      html = html.replace(/cid:logoTriggui/g, dataUri);
    }
  } catch (e) { Logger.log("⚠️ No se pudo embeber logo: " + e.message); }

  // Guardar HTML + PDF en Drive
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
  const htmlFile = DriveApp.createFile("TarjetaTriggui-V18-" + stamp + ".html", html, MimeType.HTML);
  htmlFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const out = HtmlService.createHtmlOutput(html)
    .setWidth(TRIGGUI_STYLE_CONFIG.cardWidth + 40)
    .setHeight(900);
  const pdfBlob = out.getAs(MimeType.PDF).setName("TarjetaTriggui-V18-" + stamp + ".pdf");
  const pdfFile = DriveApp.createFile(pdfBlob);
  pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  Logger.log("✅ HTML preview: " + htmlFile.getUrl());
  Logger.log("✅ PDF preview:  " + pdfFile.getUrl());
  Logger.log(`📖 Libro: "${libro.titulo}" — Edición #${formatEdicionNumero(libro._edicion_numero)}`);
}

/* ═════════════════════ FUNCIONES AUXILIARES NIVEL DIOS ══════════════════ */

function resetearContadorIntro() {
  PropertiesService.getScriptProperties().setProperty("INTRO_COUNTER", "0");
  Logger.log("🔄 Contador de intro reseteado a 0");
}

function verEstadoIntro() {
  const props = PropertiesService.getScriptProperties();
  const counter = parseInt(props.getProperty("INTRO_COUNTER") || "0");
  const proximaIntro = INTRO_MESSAGES.frequency - (counter % INTRO_MESSAGES.frequency);
  Logger.log("📊 ESTADO DEL SISTEMA DE INTROS");
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  Logger.log(`Envíos totales: ${counter}`);
  Logger.log(`Frecuencia: 1 de cada ${INTRO_MESSAGES.frequency} envíos`);
  Logger.log(`Próxima intro en: ${proximaIntro} envío${proximaIntro !== 1 ? "s" : ""}`);
  Logger.log(`Variaciones de intro: ${INTRO_MESSAGES.texts.length}`);
  Logger.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

function testEnviarConIntro() {
  const props = PropertiesService.getScriptProperties();
  const currentCounter = parseInt(props.getProperty("INTRO_COUNTER") || "0");
  props.setProperty(
    "INTRO_COUNTER",
    ((Math.floor(currentCounter / INTRO_MESSAGES.frequency) + 1) * INTRO_MESSAGES.frequency - 1).toString()
  );
  Logger.log("🧪 Próximo envío mostrará intro");
  enviarTrigguiLunes();
}

/**
 * V18 NUEVO: test rápido sin enviar emails. Genera HTML preview en Drive.
 * Usar este antes de enviarTrigguiLunes() para verificar visualmente.
 */
function testPreviewTarjeta() {
  Logger.log("🧪 Generando preview de la tarjeta V18 nivel dios cuántico-quark...");
  guardarTarjetaEnDrive();
}


/* ════════════════════════════════════════════════════════════════════════
 * V19.2.3 — HELPERS NIVEL DIOS PARA PRUEBA DE FUEGO
 * ════════════════════════════════════════════════════════════════════════ */

/**
 * Imprime cuántos emails quedan en el quota diario de Gmail.
 * Run > verQuota → View > Executions → Click la corrida → ver Logs
 */
function verQuota() {
  const q = MailApp.getRemainingDailyQuota();
  Logger.log("══════════════════════════════════════════════");
  Logger.log("📬 Quota Gmail restante hoy: " + q + " emails");
  Logger.log("══════════════════════════════════════════════");
  Logger.log("Cuenta consumer free: límite 100/día");
  Logger.log("Cuenta Workspace de pago: 1500-2000/día");
  Logger.log("");
  Logger.log("El masivo usa buffer de 5 → envía hasta (quota - 5)");
  Logger.log("Con " + q + " quota → máximo " + Math.max(0, q-5) + " envíos");
}

/**
 * DRY RUN del masivo — NO envía emails, solo simula.
 * Muestra exactamente cuántas filas hay, en qué pools caerían,
 * cuántas recibirían, cuántas se saltarían y por qué.
 * 
 * Úsalo ANTES de enviarTrigguiLunes() para verificar todo está OK.
 */
function previewMasivo() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log("❌ No existe la hoja: " + SHEET_NAME); return; }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) { Logger.log("❌ Sheet vacío"); return; }

  // 1. Cargar contenido
  const prep = prepararEmailParaEnvio();
  if (!prep.ok) {
    Logger.log("❌ Error preparando email: " + prep.reason);
    return;
  }
  const libro = prep.libro;

  Logger.log("═══════════════════════════════════════════════════════════════");
  Logger.log("🌒 PREVIEW MASIVO — DRY RUN nivel dios cuántico-quark");
  Logger.log("═══════════════════════════════════════════════════════════════");
  Logger.log("");
  Logger.log("📖 Libro que se enviaría:");
  Logger.log("   Título: " + libro.titulo);
  Logger.log("   Autor:  " + libro.autor);
  Logger.log("   Edición: #" + formatEdicionNumero(libro._edicion_numero));
  Logger.log("   Subject: " + prep.subject);
  Logger.log("");

  // 2. Quota
  const quota = MailApp.getRemainingDailyQuota();
  const QUOTA_BUFFER = 5;
  const maxEnvios = Math.max(0, quota - QUOTA_BUFFER);
  Logger.log("📬 Quota Gmail restante: " + quota);
  Logger.log("   Buffer seguridad: " + QUOTA_BUFFER);
  Logger.log("   Máximo envíos posibles: " + maxEnvios);
  Logger.log("");

  // 3. Análisis del sheet
  const data = sheet.getDataRange().getValues();
  const tituloActualNorm = libro.titulo.toLowerCase().trim();

  let totalFilas = 0;
  let sinEmail = 0;
  let unsubscribed = 0;
  let trialExpirado = 0;
  let yaRecibieron = 0;
  let capSemanal = 0;
  let memberNuevos = 0, memberRotacion = 0;
  let freeNuevos = 0, freeRotacion = 0;
  let bulkNuevos = 0, bulkRotacion = 0;
  const muestras = { member: [], free: [], bulk: [] };

  for (let i = 1; i < data.length; i++) {
    totalFilas++;
    const cellC = data[i][2];
    const ultimoLibro = (data[i][9] || "").toString().trim();
    const emailsInRow = parseEmailsFromCell(cellC);

    if (emailsInRow.length === 0) { sinEmail++; continue; }
    if (isRowUnsubscribed(data[i])) { unsubscribed++; continue; }
    if (debeMarcarseExpired(data[i])) { trialExpirado++; continue; }
    if (ultimoLibro && ultimoLibro.toLowerCase() === tituloActualNorm) { yaRecibieron++; continue; }
    if (hasReachedWeeklyLimit(data[i])) { capSemanal++; continue; }

    const tieneRotacion = !!ultimoLibro;
    if (isRowSubscribedMember(data[i])) {
      if (!tieneRotacion) { memberNuevos++; if (muestras.member.length < 3) muestras.member.push((data[i][0] || "?") + " · " + emailsInRow[0]); }
      else { memberRotacion++; }
    } else if (isRowSubscribedFree(data[i])) {
      if (!tieneRotacion) { freeNuevos++; if (muestras.free.length < 3) muestras.free.push((data[i][0] || "?") + " · " + emailsInRow[0]); }
      else { freeRotacion++; }
    } else {
      if (!tieneRotacion) { bulkNuevos++; if (muestras.bulk.length < 3) muestras.bulk.push((data[i][0] || "?") + " · " + emailsInRow[0]); }
      else { bulkRotacion++; }
    }
  }

  Logger.log("📊 ANÁLISIS DEL SHEET:");
  Logger.log("   Total filas:                 " + totalFilas);
  Logger.log("");
  Logger.log("   ⚠️  Sin email válido:         " + sinEmail);
  Logger.log("   🚫 Unsubscribed:             " + unsubscribed);
  Logger.log("   ⏰ Trial expirado:           " + trialExpirado);
  Logger.log("   ⏭️  Ya recibieron este libro: " + yaRecibieron);
  Logger.log("   🛑 Al cap semanal:           " + capSemanal);
  Logger.log("");
  Logger.log("   POOLS QUE RECIBIRÍAN ENVÍO:");
  Logger.log("   💎 MEMBER nuevos:            " + memberNuevos);
  Logger.log("   💠 MEMBER rotación:          " + memberRotacion);
  Logger.log("   🟢 FREE nuevos:              " + freeNuevos);
  Logger.log("   🔵 FREE rotación:            " + freeRotacion);
  Logger.log("   🟡 BULK_LEGACY nuevos:       " + bulkNuevos);
  Logger.log("   🟠 BULK_LEGACY rotación:     " + bulkRotacion);
  Logger.log("");

  const totalEnviables = memberNuevos + memberRotacion + freeNuevos + freeRotacion + bulkNuevos + bulkRotacion;
  Logger.log("   ✅ TOTAL ENVIABLES:           " + totalEnviables);
  Logger.log("   📬 Que SÍ enviaría con quota: " + Math.min(totalEnviables, maxEnvios));
  if (totalEnviables > maxEnvios) {
    Logger.log("   ⏳ Pendientes para mañana:   " + (totalEnviables - maxEnvios));
  }
  Logger.log("");

  if (muestras.bulk.length > 0) {
    Logger.log("   🟡 Muestras BULK_LEGACY (primeras 3):");
    for (const m of muestras.bulk) Logger.log("      · " + m);
  }
  if (muestras.free.length > 0) {
    Logger.log("   🟢 Muestras FREE (primeras 3):");
    for (const m of muestras.free) Logger.log("      · " + m);
  }
  if (muestras.member.length > 0) {
    Logger.log("   💎 Muestras MEMBER (primeras 3):");
    for (const m of muestras.member) Logger.log("      · " + m);
  }

  Logger.log("");
  Logger.log("═══════════════════════════════════════════════════════════════");
  Logger.log("✓ DRY RUN COMPLETO — NO se envió ningún email");
  Logger.log("  Si los números se ven bien → Run > enviarTrigguiLunes");
  Logger.log("═══════════════════════════════════════════════════════════════");
}


/* ════════════════════════════════════════════════════════════════════════
 * V20 — TEST KIDS BANNER (envia solo a tu email)
 * ════════════════════════════════════════════════════════════════════════
 *
 * Como usar:
 *   1. Push del codigo (clasp push)
 *   2. Abre el editor Apps Script
 *   3. Dropdown de funciones → testKidsBannerAMi
 *   4. Click Run (boton ▶)
 *   5. Autorizar permisos si los pide (primera vez)
 *   6. Revisa tu Gmail: badirnakid@gmail.com
 *
 * Que hace:
 *   - Busca tu email en la sheet para obtener rowIdx valida
 *   - Si lo encuentra: usa esa fila (greeting, trial, etc. realistas)
 *   - Si no lo encuentra: usa fila 2 como template
 *   - Llama enviarTrigguiAUno() SOLO a tu email (no toca el resto de la base)
 *   - El email incluye el banner KIDS recien agregado
 *
 * ⚠ Sigue el flujo NORMAL del email: greeting + trial + kids + WA random + tarjeta
 * ⚠ NO modifica la sheet (no marca col J/K/L/M/N como enviado)
 * ⚠ NO incrementa contador del lunes
 * ════════════════════════════════════════════════════════════════════════ */
function testKidsBannerAMi() {
  const MY_EMAIL = "badirnakid@gmail.com";

  Logger.log("══════════════════════════════════════════════════════════════");
  Logger.log("🧪 TEST KIDS BANNER → " + MY_EMAIL);
  Logger.log("══════════════════════════════════════════════════════════════");

  // Verificar que KIDS_PROMO_ENABLED esta activo
  Logger.log("KIDS_PROMO_ENABLED: " + KIDS_PROMO_ENABLED);
  Logger.log("KIDS_URL_TARGET:    " + KIDS_URL_TARGET);

  if (!KIDS_PROMO_ENABLED) {
    Logger.log("⚠ KIDS_PROMO_ENABLED es false — el banner NO aparecera");
    Logger.log("  Activa KIDS_PROMO_ENABLED = true en linea ~100 del script");
    return;
  }

  // Buscar mi email en la sheet
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log("❌ No existe la hoja: " + SHEET_NAME);
    return;
  }
  const data = sheet.getDataRange().getValues();

  let rowIdx = -1;
  let nombre = "Badir";

  for (let i = 1; i < data.length; i++) {
    const cellC = (data[i][2] || "").toString().toLowerCase();
    if (cellC.includes(MY_EMAIL.toLowerCase())) {
      rowIdx = i + 1; // 1-based para enviarTrigguiAUno
      nombre = sanitizarNombre(data[i][0]) || nombre;
      Logger.log("✓ Encontrado " + MY_EMAIL + " en fila " + rowIdx + " (nombre: " + nombre + ")");
      break;
    }
  }

  if (rowIdx === -1) {
    Logger.log("⚠ Tu email no está en la sheet. Usando fila 2 como template.");
    rowIdx = 2;
  }

  Logger.log("📨 Enviando email REAL a " + MY_EMAIL + " usando fila " + rowIdx);
  Logger.log("   (el resto de la base NO recibe nada)");
  Logger.log("");

  try {
    enviarTrigguiAUno(MY_EMAIL, rowIdx, nombre);
    Logger.log("");
    Logger.log("✅ Email de test enviado");
    Logger.log("   Revisa tu inbox: " + MY_EMAIL);
    Logger.log("");
    Logger.log("CHECKLIST visual del email:");
    Logger.log("   ✓ Banner 'ALGO NUEVO · Conoce Triggui Kids' arriba");
    Logger.log("   ✓ Boton naranja [Conocer →] clickeable");
    Logger.log("   ✓ Click abre app.triggui.com/kids");
    Logger.log("   ✓ Tarjeta del libro intacta");
    Logger.log("   ✓ Footer intacto");
  } catch (e) {
    Logger.log("❌ Error: " + e.message);
    Logger.log(e.stack);
  }
}
