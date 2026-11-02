/**
 * largos.js — C278 (2 de noviembre de 2026): que el texto quepa donde se lee.
 *
 * La tarjeta se comparte como imagen fija (scripts/build-tarjeta-png.js, 1066 × 1600). Su letra crece cuando el
 * texto es corto, pero no baja de su tamaño base, y lo que no cabe se corta sin aviso. Medido el 2 de noviembre
 * con las ediciones de los bancos de C278 y textos de prueba: sin resaltados largos cabe hasta unos 880 caracteres
 * de párrafos; una tarjeta de OpenAI de 792, con tres oraciones resaltadas, se salió. Con los límites del esquema
 * (320 + 320) siempre cabe. Ningún proveedor impone esos límites: Claude no admite
 * maxLength en el esquema, y OpenAI no lo cumplió en el banco 1 (párrafos de hasta 417 y una tarjeta de 792 que
 * llegó a la letra mínima y se salió). Por eso aquí se cumplen en código:
 *   · parrafoTop o parrafoBot de más de 320: se quedan hasta la última oración completa que cabe, sin partir un
 *     resaltado [H]...[/H] y sin bajar de 80. Es lo mismo que pide el prompt («si no cabe completa, OMÍTELA»).
 *     Si no hay dónde cortar así, el texto se queda como vino y se avisa.
 *   · Lo demás fuera de su largo (título, subtítulo, palabras, frases) solo se avisa en el registro de la corrida.
 */

export const LARGOS = {
  titulo: [8, 60],
  parrafoTop: [80, 320],
  subtitulo: [20, 120],
  parrafoBot: [80, 320],
  palabra: [3, 25],
  og: [30, 70],
  bloque: [40, 100]
};

/** El texto como lo ve el lector: sin las marcas del resaltado. */
export const plano = (t) => String(t ?? "").replace(/\[\/?[Hh]\]/g, "");

// Un punto después de una inicial («J. K. Rowling») o de una abreviatura de tratamiento («Mr. Darcy», «el Dr.
// López») no cierra la oración (segunda pasada de C300).
// También cuenta como abreviatura una palabra con un punto entre dos letras («EE.UU.», «p.m.»; la misma regla 2 de
// triggui-physics.js) y una de una a tres letras con mayúscula seguida de minúsculas («Mt.», «Col.», «Av.»); las siglas
// en mayúsculas («ADN.», «ONU.») sí cierran oración. Así se corta antes, que es lo seguro (revisiones de C300).
const ABREVIATURAS = new Set(["sr", "sra", "srta", "sres", "srs", "dr", "dra", "dres", "lic", "ing", "prof", "profa",
  "ud", "uds", "vd", "vds", "gral", "sto", "sta", "fr", "mr", "mrs", "ms", "mx", "st", "jr", "ej", "p", "pág", "núm", "vol",
  "cap", "capt", "gen", "col", "mt", "rev", "av", "avda", "sgto", "sgt", "tte", "cnel", "mons", "excmo", "ilmo", "dña",
  "mme", "mlle", "lt", "gov", "pres", "sen", "rep", "hon", "ee", "uu", "mtro", "mtra", "lcdo", "lcda", "pbro", "hnos",
  "cmdr", "corp", "bros", "univ", "dept", "sept", "blvd", "vs", "aprox", "ca", "art", "pp", "ed", "tel", "fig", "arq", "inc"]);
function esAbreviatura(antes) {
  const palabra = (plano(antes).match(/(\S+)$/) || ["", ""])[1].replace(/^[«"“‘'(¿¡\[]+/, "");
  return /^\p{L}$/u.test(palabra) || /\p{L}\.\p{L}/u.test(palabra) || /^\p{Lu}\p{Ll}{0,2}$/u.test(palabra) || ABREVIATURAS.has(palabra.toLowerCase());
}

// Un fin de oración (. ! ? …), con las comillas o el paréntesis que lo cierran y un [/H] pegados, seguido del final
// del texto o de un espacio y el inicio de otra oración (mayúscula, número, comilla o signo de apertura).
const FIN_DE_ORACION = /[.!?…]+["'»”’)\]]*(?:\[\/[Hh]\])?(?=\s*$|\s+(?:\[[Hh]\]\s*)?["'«“‘¿¡(—–-]*[A-ZÁÉÍÓÚÑÜ0-9])/g;

/**
 * Deja el párrafo en la última oración completa que cabe en `max` caracteres visibles, con sus resaltados
 * completos y sin bajar de `min`. Si ya cabe, o si no hay un corte así, lo devuelve igual.
 */
export function recortaParrafo(texto, max = LARGOS.parrafoTop[1], min = LARGOS.parrafoTop[0]) {
  const t = String(texto ?? "");
  if (plano(t).length <= max) return t;
  let mejor = null;
  for (const m of t.matchAll(FIN_DE_ORACION)) {
    if (/^\.(?!\.)/.test(m[0]) && esAbreviatura(t.slice(0, m.index))) continue;
    const pre = t.slice(0, m.index + m[0].length);
    const n = plano(pre).length;
    if (n > max) break;
    const abre = (pre.match(/\[[Hh]\]/g) || []).length;
    const cierra = (pre.match(/\[\/[Hh]\]/g) || []).length;
    if (abre === cierra && n >= min) mejor = pre;
  }
  return mejor ? mejor.trimEnd() : t;
}

/**
 * Revisa el contenido de un idioma ("es" o "en") recién salido del modelo. Recorta en su lugar los párrafos de la
 * tarjeta que no caben y devuelve qué cambió y qué quedó fuera de su largo.
 */
export function ajustaLargos(content, lang) {
  const cambios = [];
  const avisos = [];
  if (!content || typeof content !== "object") return { cambios, avisos };
  const card = content[`card_${lang}`];
  if (card && typeof card === "object") {
    for (const k of ["parrafoTop", "parrafoBot"]) {
      if (typeof card[k] !== "string") continue;
      const [lo, hi] = LARGOS[k];
      const n = plano(card[k]).length;
      if (n <= hi) continue;
      const corto = recortaParrafo(card[k], hi, lo);
      if (corto !== card[k]) {
        card[k] = corto;
        cambios.push(`${k} ${n}→${plano(corto).length}`);
      } else {
        avisos.push(`${k} ${n} > ${hi} y no hubo dónde cortar`);
      }
    }
    for (const k of ["titulo", "subtitulo"]) {
      if (typeof card[k] !== "string") continue;
      const [lo, hi] = LARGOS[k];
      const n = plano(card[k]).length;
      if (n < lo || n > hi) avisos.push(`${k} ${n} fuera de ${lo}-${hi}`);
    }
  }
  for (const w of content[`emotional_words_${lang}`] || []) {
    const n = String(w ?? "").length;
    if (n < LARGOS.palabra[0] || n > LARGOS.palabra[1]) avisos.push(`palabra «${w}» ${n}`);
  }
  for (const b of content[`edition_blocks_${lang}`] || []) {
    const n = plano(b && b.phrase).length;
    if (n < LARGOS.bloque[0] || n > LARGOS.bloque[1]) avisos.push(`bloque ${n}`);
  }
  for (const o of content[`og_phrases_${lang}`] || []) {
    const n = plano(typeof o === "string" ? o : o && o.phrase).length;
    if (n < LARGOS.og[0] || n > LARGOS.og[1]) avisos.push(`og ${n}`);
  }
  return { cambios, avisos };
}
