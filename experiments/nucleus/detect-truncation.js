/* ═══════════════════════════════════════════════════════════════════════════════
   detect-truncation.js — DETECTOR PURO DE TRUNCAMIENTO (única fuente de verdad)

   PRINCIPIO (nivel dios): la detección de truncamiento es una SEÑAL, no una acción.
   Una heurística con falsos positivos NUNCA debe tomar una acción destructiva ni
   abortar el build. Este módulo SOLO detecta y reporta; quien lo llama decide qué
   hacer (marcar para revisión, dejar pasar). Nunca muta, nunca lanza, nunca corta.

   Antes de este módulo, esta misma lógica estaba DUPLICADA byte-por-byte en dos
   lugares de build-contenido-nucleus.js (dentro de repairTruncatedField y dentro de
   collectTruncations). Eso violaba "una sola fuente de verdad imposible de divergir":
   agregar una regla obligaba a tocarla en dos sitios o divergían. Ahora vive aquí,
   una sola vez. Cualquier ajuste futuro (una regla a la vez, cuando aparezca un caso
   real en una tarjeta) se hace EXCLUSIVAMENTE en este archivo.

   IMPORTANTE: las reglas son IDÉNTICAS a las que tenía el nucleus (v4.3). No se cambió
   ninguna — solo se reubicaron. No hay listas nuevas ni excepciones hardcodeadas.
═══════════════════════════════════════════════════════════════════════════════ */

// Cierres legítimos de una idea (fin de oración o cierre estructural).
export const LEGITIMATE = [".", "?", "!", "…", "—", '"', "»", ")", "]"];

// 🌒 v4.1 — Whitelist de palabras cortas válidas como cierre (sustantivos/verbos/
// adverbios cortos que SÍ cierran idea). Una palabra final corta NO se marca si está aquí.
export const VALID_SHORT_CLOSURES = new Set([
  // ES: 2-3 letras
  "yo", "tú", "él", "sí", "no", "ya", "fe", "ti", "fui", "voy", "vas",
  "ven", "ver", "dar", "ir", "es", "soy", "se", "le", "lo", "la", "él",
  "fin", "mar", "rey", "ley", "día", "voz", "luz", "paz", "oro", "ego",
  "ojo", "uña", "yes", "uva", "ola", "olo", "uno", "dos", "tres",
  // ES: 4 letras comunes
  "más", "vida", "amor", "alma", "arte", "casa", "agua", "ayer",
  "hoy", "ahí", "aquí", "allí", "bien", "esto", "todo", "cosa",
  "edad", "hijo", "hija", "país", "gente", "mente", "cielo",
  // EN: 2-3 letras
  "be", "do", "go", "me", "us", "we", "up", "no", "ok", "yes",
  "all", "now", "see", "say", "one", "two", "end", "way", "day"
]);

// 🌒 v4.0 — Stopwords prohibidas al final (preposiciones/artículos/conjunciones/auxiliares).
export const STOPWORDS_INVALID_AT_END = new Set([
  // ═══ ES ═══
  // Artículos
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  // Preposiciones (TODAS las del español)
  "a", "ante", "bajo", "cabe", "con", "contra", "de", "del", "al",
  "desde", "durante", "en", "entre", "hacia", "hasta", "mediante",
  "para", "por", "según", "sin", "so", "sobre", "tras", "versus", "vía",
  // Conjunciones
  "y", "e", "o", "u", "ni", "que", "si", "pero", "mas", "aunque",
  "porque", "pues", "como", "cuando", "donde",
  // Pronombres/clíticos
  "se", "lo", "le", "les", "su", "sus", "mi", "tu", "te", "me", "nos",
  // Verbos auxiliares
  "es", "está", "están", "fue", "fueron", "ha", "han", "haber", "hay",
  "ser", "siendo", "siendo", "sido",
  // ═══ EN ═══
  // Articles
  "the", "a", "an",
  // Prepositions
  "of", "in", "on", "at", "to", "for", "with", "by", "from",
  "into", "onto", "upon", "about", "above", "across", "after",
  "against", "along", "among", "around", "before", "behind",
  "below", "beneath", "beside", "between", "beyond", "during",
  "except", "inside", "near", "off", "over", "since", "through",
  "throughout", "toward", "under", "underneath", "until", "up",
  "via", "within", "without",
  // Conjunctions
  "and", "or", "but", "nor", "yet", "so", "that", "which", "who",
  "this", "these", "those", "as", "if", "while", "because",
  // Auxiliaries
  "is", "are", "was", "were", "has", "had", "have", "be", "been",
  "being", "do", "does", "did", "will", "would", "shall", "should",
  "may", "might", "can", "could", "must"
]);

// 🌒 v4.1 — Lista negra de prefijos truncados conocidos (palabras parciales).
export const TRUNCATED_PREFIXES = new Set([
  // ES: prefijos comunes de palabras largas que aparecen truncados
  "incertid", "tambi", "frustr", "comprend", "interes",
  "respons", "transform", "propor", "establ", "desarroll",
  "particip", "experi", "necesit", "permit", "conseg",
  "manten", "ofrec", "lograr", "alcanz", "encuentr",
  "convirt", "resolv", "explor", "imagin", "siguien",
  "anterior", "import", "diferen", "posib", "necess",
  // EN
  "incred", "succ", "diff", "addit", "import", "underst",
  "becau", "throug", "betw", "amon", "abou"
]);

// 🌒 v4.3 — Los TÍTULOS están exentos de la regla "no-closure" (un título legítimo
// no termina en punto). Detección: el label de un campo de título contiene "titulo"/
// "subtitulo"/"title". Los títulos SÍ siguen sujetos a truncamiento real (stopword
// colgante o prefijo cortado), solo se les exime de "sin punto final = truncado".
export function isTitleField(label) {
  const l = String(label || "").toLowerCase();
  return l.includes("titulo") || l.includes("subtitulo") || l.includes("title");
}

/**
 * Detecta si un texto parece truncado. SOLO detecta — no muta, no lanza, no corta.
 * Reglas idénticas a v4.3 (detección dual):
 *   (A) Sin cierre legítimo al final (excepto títulos).
 *   (B) Con cierre legítimo PERO última palabra es truncamiento camuflado
 *       (stopword colgante / prefijo cortado conocido / palabra final <4 no whitelisted).
 *
 * @param {string} text   El texto a evaluar (puede contener marcas [H][/H]).
 * @param {string} label  Etiqueta del campo (decide exención de título por su nombre).
 * @returns {{ truncado: boolean, reason: string }}
 */
export function detectTruncation(text, label = "?") {
  if (typeof text !== "string") return { truncado: false, reason: "" };
  const trimmed = text.trim();
  if (!trimmed) return { truncado: false, reason: "" };
  const plain = trimmed.replace(/\[\/?H\]/g, "");

  const tituloField = isTitleField(label);
  const endsLegit = LEGITIMATE.includes(plain.slice(-1));

  // (A) Sin cierre legítimo y no es título → truncado.
  if (!endsLegit && !tituloField) {
    return { truncado: true, reason: "no-closure" };
  }

  // (B) Análisis de la última palabra real.
  // Para no-títulos terminados en cierre: descartar el cierre final.
  // Para títulos (con o sin cierre): analizar todas las palabras tal cual.
  const beforeClose = (endsLegit && !tituloField) ? plain.slice(0, -1).trim() : plain.trim();
  const words = beforeClose.split(/\s+/).filter(Boolean);
  if (words.length > 3) { // no tocar títulos/frases muy cortas
    const lastWord = (words[words.length - 1] || "")
      .replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ]/g, "")
      .toLowerCase();
    if (STOPWORDS_INVALID_AT_END.has(lastWord)) {
      return { truncado: true, reason: `dangling-stopword "${lastWord}"` };
    } else if (TRUNCATED_PREFIXES.has(lastWord)) {
      return { truncado: true, reason: `known-trunc-prefix "${lastWord}"` };
    } else if (!tituloField && lastWord.length > 0 && lastWord.length < 4
        && !VALID_SHORT_CLOSURES.has(lastWord)) {
      // 🌒 v4.3: suspect-short NO aplica a títulos (CEO/hoy/Cat/You son válidos como cierre).
      return { truncado: true, reason: `suspect-short "${lastWord}"` };
    }
  }

  return { truncado: false, reason: "" };
}
