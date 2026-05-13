/* ═══════════════════════════════════════════════════════════════════════════════
   triggui-physics.js — MATEMÁTICA PURA

   v3.7 (2026-04-26): expandHighlightToFullSentence — auto-corrección quirúrgica
   ─────────────────────────────────────────────────────────────────────────────
   Cambio sobre v3.6 (aditivo, NO destructivo):

   Nueva función exportada `expandHighlightToFullSentence(text)`:
     - Recibe texto con [H]...[/H] que el LLM judge marcó como semánticamente
       colgado (cópula sin atributo, modal sin acción, transitivo sin objeto).
     - Para cada highlight, encuentra la frase completa que lo contiene.
     - Si la frase es de longitud razonable (≤22 palabras), reemplaza el
       highlight cortado por la frase completa (sin punto/exclamación final).
     - Si la frase es >22 palabras, busca coma natural anterior con palabra
       fuerte y corta ahí; sino, retreata desde el final con weak words.

   Esta función NO se llama automáticamente desde placeHighlightOnDensestSpan.
   Se invoca desde build-contenido-nucleus.js fase F2.7 cuando el LLM judge
   reporta is_grammatically_complete=false.

   Lo NO tocado:
   - Toda la matemática de color/contraste (sagrada)
   - Toda la state machine de normalizeHighlightSyntax (sagrada)
   - placeHighlightOnDensestSpan (intacto, sigue siendo el primer corte)
   - validateHighlightQuality (intacto, sigue siendo el validador léxico)
   - WEAK_TRAILING_WORDS_ES/EN (sin agregar verbos hardcoded — la
     filosofía es que el LLM detecta el problema, NO listas léxicas)
═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Normaliza un string de color a formato #RRGGBB canónico.
 * Tolera: #RGB, #RGBA, #RRGGBB, #RRGGBBAA, con o sin #, con espacios.
 * Devuelve null si no se puede normalizar.
 */
export function normalizeHex(input) {
  if (!input) return null;
  let s = String(input).trim().replace(/^#/, "");
  // Formatos aceptados
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    // #RGB → #RRGGBB
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{4}$/.test(s)) {
    // #RGBA → #RRGGBB (descartamos alpha)
    return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(s)) {
    return `#${s}`.toUpperCase();
  }
  if (/^[0-9a-fA-F]{8}$/.test(s)) {
    // #RRGGBBAA → #RRGGBB (descartamos alpha)
    return `#${s.slice(0, 6)}`.toUpperCase();
  }
  return null;
}

export function isValidHex(hex) {
  if (!hex) return false;
  return normalizeHex(hex) !== null;
}

export function luminance(hex) {
  const safe = normalizeHex(hex) || "#000000";
  const [r, g, b] = safe.slice(1).match(/../g).map((x) => parseInt(x, 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(fg, bg) {
  const lumFg = luminance(fg);
  const lumBg = luminance(bg);
  const lighter = Math.max(lumFg, lumBg);
  const darker = Math.min(lumFg, lumBg);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRGB(hex) {
  const safe = normalizeHex(hex) || "#000000";
  return safe.slice(1).match(/../g).map((x) => parseInt(x, 16));
}

function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function darken(hex, pct = 0.3) {
  const [r, g, b] = hexToRGB(hex);
  return rgbToHex(r * (1 - pct), g * (1 - pct), b * (1 - pct));
}

export function lighten(hex, pct = 0.3) {
  const [r, g, b] = hexToRGB(hex);
  return rgbToHex(r + (255 - r) * pct, g + (255 - g) * pct, b + (255 - b) * pct);
}

export function withAlpha(hex, alpha = 0.24) {
  const [r, g, b] = hexToRGB(hex);
  const a = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(a * 255).toString(16).padStart(2, "0");
  return `${rgbToHex(r, g, b)}${alphaHex}`;
}

export function isDarkColor(hex, threshold = 0.35) {
  return luminance(hex) < threshold;
}

export function isLightColor(hex, threshold = 0.65) {
  return luminance(hex) > threshold;
}

export function ensureReadableContrast(paper, ink) {
  const ratio = contrastRatio(ink, paper);
  if (ratio >= 4.5) return { paper, ink, ratio };
  const newInk = isDarkColor(paper) ? "#FFFFFF" : "#0A0A0A";
  return { paper, ink: newInk, ratio: contrastRatio(newInk, paper) };
}

export function deriveBorder(paper) {
  if (!isValidHex(paper)) return "#333333";
  return luminance(paper) < 0.08 ? lighten(paper, 0.18) : darken(paper, 0.4);
}

export function textContrastOn(hex) {
  return luminance(hex) > 0.45 ? "#000000" : "#FFFFFF";
}

export function normalizeHighlightSyntax(input) {
  let text = String(input || "");
  if (!text.trim()) return "";

  // ═══ NIVEL DIOS v2: state machine correcto ═══
  // 1. Absorber TODAS las variantes a placeholders únicos \x01 (open) y \x02 (close)
  // 2. Limpiar tokens parciales (fragmentos rotos)
  // 3. Recorrer la secuencia con state machine: dentro/fuera de highlight
  // 4. Emitir tokens canónicos balanceados

  const OPEN = "\x01";
  const CLOSE = "\x02";

  // ═══ PASO 1: Absorber cierres (primero, antes de aperturas, para no confundir
  // fragmentos como "/H]" con cierre de "[/H]")
  text = text.replace(/<\s*\/\s*h\s*>/gi, CLOSE);
  text = text.replace(/\{\{\s*\/\s*h\s*\}\}/gi, CLOSE);
  text = text.replace(/\[\s*\/\s*h\s*[\]\}>]/gi, CLOSE);      // [/H] [/H> [/H}
  text = text.replace(/\[\s*h\s*\/\s*[\]\}>]/gi, CLOSE);      // [H/]

  // ═══ PASO 2: Absorber aperturas
  text = text.replace(/<\s*h\s*>/gi, OPEN);
  text = text.replace(/\{\{\s*h\s*\}\}/gi, OPEN);
  text = text.replace(/\[\s*h\s*[\]\}>]/gi, OPEN);            // [H] [H} [H>

  // ═══ PASO 3: Limpiar tokens parciales rotos (sin ambas llaves)
  // Debe correr DESPUÉS de absorber variantes completas, para no dañarlas
  text = text.replace(/\[\s*\/\s*h\b/gi, "");   // [/H sin cerrar
  text = text.replace(/\/\s*h\s*\]/gi, "");      // /H] sin abrir
  text = text.replace(/\[\s*h\b/gi, "");         // [H sin cerrar
  // H] aislada: eliminar cuando es claramente token roto (no parte de palabra real)
  // Las palabras reales casi nunca terminan en "H" seguida de "]"; regex conservador:
  // "H]" con cualquier contexto → eliminar solo "H]", preservando lo anterior
  text = text.replace(/H\s*\]/gi, "");

  // ═══ PASO 4: State machine — recorrer tokens y balancear
  // Recorremos el texto extrayendo segmentos + tokens, y reconstruimos asegurando
  // alternancia correcta: OPEN debe ir antes de cualquier CLOSE, y siempre alternan.
  const tokenRe = new RegExp(`(${OPEN}|${CLOSE})`, "g");
  const parts = text.split(tokenRe);
  const out = [];
  let inside = false; // ¿estamos dentro de un highlight?

  for (const part of parts) {
    if (part === OPEN) {
      if (!inside) {
        out.push(OPEN);
        inside = true;
      }
      // Si ya estamos dentro, ignorar OPEN redundante
    } else if (part === CLOSE) {
      if (inside) {
        out.push(CLOSE);
        inside = false;
      }
      // Si no estamos dentro, ignorar CLOSE huérfano
    } else {
      // Texto normal
      out.push(part);
    }
  }

  // Si terminamos "dentro" sin cierre, cerrar al final
  if (inside) out.push(CLOSE);

  text = out.join("");

  // ═══ PASO 5: Limpiar highlights vacíos
  text = text.replace(new RegExp(`${OPEN}\\s*${CLOSE}`, "g"), "");

  // ═══ PASO 6: Restaurar placeholders a tokens canónicos
  text = text.replace(new RegExp(OPEN, "g"), "[H]");
  text = text.replace(new RegExp(CLOSE, "g"), "[/H]");

  // Whitespace final
  return text.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function countHighlights(text) {
  const matches = normalizeHighlightSyntax(text).match(/\[H\](.*?)\[\/H\]/gis) || [];
  return matches.filter((m) => m.replace(/\[H\]|\[\/H\]/gi, "").trim()).length;
}

export function stripHighlightTags(text) {
  return normalizeHighlightSyntax(String(text || "")).replace(/\[H\]|\[\/H\]/gi, "");
}

export function getHighlightSegments(text = "") {
  const matches = normalizeHighlightSyntax(text).match(/\[H\](.*?)\[\/H\]/gis) || [];
  return matches.map((m) => m.replace(/\[H\]|\[\/H\]/gi, "").trim()).filter(Boolean);
}

export function highlightCoverageRatio(text = "") {
  const plain = stripHighlightTags(text).replace(/\s+/g, " ").trim();
  if (!plain) return 0;
  const highlighted = getHighlightSegments(text).join(" ").replace(/\s+/g, " ").trim();
  return highlighted ? highlighted.length / Math.max(plain.length, 1) : 0;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SEMANTIC HIGHLIGHT PLACEMENT (v3.2+ nivel dios)
   Nunca corta en preposición/artículo colgante. Prefiere cierres gramaticales.
────────────────────────────────────────────────────────────────────────────── */

// Stopwords débiles: palabras que NO deben cerrar un highlight
// ES: preposiciones, artículos, conectores, pronombres relativos, conjunciones
// EN: prepositions, articles, connectors, relative pronouns, conjunctions
const WEAK_TRAILING_WORDS_ES = new Set([
  "a", "ante", "bajo", "con", "contra", "de", "del", "desde", "en", "entre",
  "hacia", "hasta", "para", "por", "según", "sin", "so", "sobre", "tras",
  "el", "la", "los", "las", "un", "una", "unos", "unas", "lo",
  "y", "e", "o", "u", "ni", "pero", "sino", "mas", "aunque", "que",
  "como", "cuando", "donde", "mientras", "si", "porque", "pues",
  "mi", "tu", "su", "mis", "tus", "sus", "nuestro", "vuestra",
  "este", "esta", "estos", "estas", "ese", "esa", "aquel", "aquella",
  "al", "más", "muy", "tan", "tanto", "cada", "todo", "toda", "todos", "todas"
]);

const WEAK_TRAILING_WORDS_EN = new Set([
  "a", "an", "the", "of", "in", "on", "at", "by", "for", "with", "from",
  "to", "into", "onto", "upon", "about", "through", "over", "under",
  "and", "or", "but", "nor", "yet", "so", "as", "because", "although",
  "while", "when", "where", "if", "that", "which", "who", "whom", "whose",
  "this", "these", "that", "those", "my", "your", "his", "her", "its",
  "our", "their", "some", "any", "no", "all", "each", "every", "both"
]);

function isWeakTrailingWord(word) {
  if (!word) return true;
  const clean = word.toLowerCase().replace(/[.,;:!?"""''()—–-]+$/g, "").replace(/^[.,;:!?"""''()—–-]+/g, "");
  if (!clean) return true;
  return WEAK_TRAILING_WORDS_ES.has(clean) || WEAK_TRAILING_WORDS_EN.has(clean);
}

// Retrocede mientras la última palabra sea débil (hasta un mínimo de minWords).
// Retorna el índice de corte FINAL (exclusive) dentro del array de palabras.
function retreatFromWeakTrailing(words, endIndex, minWords = 4) {
  let idx = endIndex;
  while (idx > minWords && isWeakTrailingWord(words[idx - 1])) {
    idx -= 1;
  }
  return idx;
}

// Busca el mejor punto de corte dentro de la ventana [minIdx, maxIdx] de palabras.
// Prioriza en orden:
//   1. Fin de cláusula (; : , + conector fuerte)
//   2. Coma natural que no deje la frase incompleta
//   3. Simplemente cortar en maxIdx retrocediendo de stopwords
function findSmartCutIndex(words, minIdx, maxIdx) {
  // 1. Buscar punto, signo fuerte o ; dentro del rango
  for (let i = Math.min(maxIdx, words.length) - 1; i >= minIdx; i--) {
    const w = words[i];
    if (!w) continue;
    if (/[.!?;]$/.test(w)) {
      return i + 1; // incluir esa palabra, corte después
    }
  }

  // 2. Buscar coma que no deje colgando (palabra anterior a coma no es débil)
  for (let i = Math.min(maxIdx, words.length) - 1; i >= minIdx + 2; i--) {
    const w = words[i];
    if (!w) continue;
    if (/,$/.test(w)) {
      // La palabra con la coma termina la frase; validar que no sea débil sin la coma
      const wordWithoutComma = w.replace(/,$/, "");
      if (!isWeakTrailingWord(wordWithoutComma)) {
        return i + 1;
      }
    }
  }

  // 3. Fallback: cortar en maxIdx retrocediendo stopwords débiles
  const safeMax = Math.min(maxIdx, words.length);
  return retreatFromWeakTrailing(words, safeMax, minIdx);
}

export function placeHighlightOnDensestSpan(text) {
  const plain = stripHighlightTags(text).replace(/\s+/g, " ").trim();
  if (!plain) return text;
  if (countHighlights(text) > 0) return normalizeHighlightSyntax(text);

  const sentences = plain.split(/(?<=[\.\!\?])\s+/).filter(Boolean);
  if (sentences.length === 0) return text;

  const scored = sentences.map((s) => {
    const words = s.split(/\s+/).filter(Boolean);
    const denseWords = words.filter((w) => w.length >= 4).length;
    const densityRatio = words.length ? denseWords / words.length : 0;
    let score = densityRatio * 10;
    if (words.length >= 5 && words.length <= 14) score += 10;
    if (words.length < 4) score -= 10;
    if (words.length > 20) score -= 5;
    return { sentence: s.trim(), score, words: words.length };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.words < 3) {
    // Frase demasiado corta para marcar nada con sentido
    const portion = Math.min(plain.length, Math.max(30, Math.floor(plain.length * 0.35)));
    const slice = plain.slice(0, portion).trim();
    // Retroceder desde final si termina en débil
    const sliceWords = slice.split(/\s+/).filter(Boolean);
    const safeIdx = retreatFromWeakTrailing(sliceWords, sliceWords.length, 3);
    const safeTarget = sliceWords.slice(0, safeIdx).join(" ");
    return `[H]${safeTarget}[/H]${plain.slice(safeTarget.length)}`;
  }

  let target = best.sentence;
  const words = target.split(/\s+/).filter(Boolean);

  // Nivel dios: si la frase es corta (≤14 palabras) la usamos completa
  if (words.length <= 14) {
    // Antes de marcar, verificar que no termine en débil (por si la frase natural ya lo hace)
    const safeIdx = retreatFromWeakTrailing(words, words.length, 4);
    target = words.slice(0, safeIdx).join(" ");
  } else {
    // Frase larga: cortar inteligentemente en ventana [5, 12]
    const cutIdx = findSmartCutIndex(words, 5, 12);
    target = words.slice(0, cutIdx).join(" ");
    // Limpiar puntuación débil al final (,:;) pero preservar .!?
    target = target.replace(/[,:;]+$/g, "").trim();
  }

  // Guard final: si después de todo el target quedó vacío o demasiado corto, usar primeras 8 palabras
  if (!target || target.split(/\s+/).filter(Boolean).length < 3) {
    const safeIdx = retreatFromWeakTrailing(words, Math.min(8, words.length), 3);
    target = words.slice(0, safeIdx).join(" ").replace(/[,:;]+$/g, "").trim();
  }

  const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(escaped);
  if (re.test(plain)) return plain.replace(re, `[H]${target}[/H]`);
  return `[H]${target}[/H] ${plain}`.trim();
}

/* Validador: retorna { ok, reason } diciendo si un highlight específico es saludable.
   Usado por quality-validator para decidir si re-extraer. */
export function validateHighlightQuality(text) {
  const segments = getHighlightSegments(text);
  if (segments.length === 0) return { ok: false, reason: "no_highlight" };

  for (const seg of segments) {
    const words = seg.split(/\s+/).filter(Boolean);
    if (words.length < 3) return { ok: false, reason: "too_short", segment: seg };
    if (words.length > 16) return { ok: false, reason: "too_long", segment: seg };

    const lastWord = words[words.length - 1];
    if (isWeakTrailingWord(lastWord)) {
      return { ok: false, reason: "weak_trailing_word", segment: seg, trailing: lastWord };
    }
  }
  return { ok: true, count: segments.length };
}

/* ─────────────────────────────────────────────────────────────────────────────
   v3.7 — EXPAND HIGHLIGHT TO FULL SENTENCE
   ─────────────────────────────────────────────────────────────────────────────
   Auto-corrección invocada cuando el LLM judge reporta que el highlight queda
   gramaticalmente colgado (cópula sin atributo, modal sin acción, transitivo
   sin objeto). En esos casos la solución matemáticamente correcta es respetar
   la frase completa donde se encuentra el highlight, NO hardcodear listas de
   verbos colgantes.

   Estrategia (Opción C — híbrida):
   1. Para cada highlight, ubicar la frase completa que lo contiene.
   2. Si la frase es ≤22 palabras → usar frase completa (sin punto/exclamación
      final, que rompe el flujo visual del subrayado dentro del párrafo).
   3. Si la frase es >22 palabras → buscar coma natural anterior con palabra
      fuerte (no weak trailing); si no hay, retreatar desde el final.

   Esta función NO se llama desde placeHighlightOnDensestSpan. Solo desde la
   fase F2.7 del orquestador, después de que el LLM judge dice
   feels_naturally_finished=false.
────────────────────────────────────────────────────────────────────────────── */

export function expandHighlightToFullSentence(text) {
  const original = String(text || "");
  if (!original) return text;

  // Texto plano (sin tags) — base sobre la que reconstruiremos
  const plain = stripHighlightTags(original).replace(/\s+/g, " ").trim();
  if (!plain) return text;

  const segments = getHighlightSegments(original);
  if (segments.length === 0) return text;

  const sentences = plain.split(/(?<=[\.\!\?])\s+/).filter(Boolean);

  // Para cada highlight original, calcular qué frase completa lo contiene y
  // qué replacement debe usar. Construimos un plan de expansiones.
  const expansions = [];
  for (const segment of segments) {
    const containingSentence = sentences.find((s) => s.includes(segment));
    if (!containingSentence) continue;

    const sentenceWords = containingSentence.split(/\s+/).filter(Boolean);
    let replacement;

    if (sentenceWords.length <= 22) {
      // 🌒 v3.8 NIVEL DIOS CUÁNTICO — Detectar sentence colgada (truncada por schema)
      // Cuando GPT corta la frase por el límite de chars del schema (320 chars
      // parrafoTop), la sentence misma no termina en cierre legítimo (.!?). En
      // ese caso, EXPANDIR no resuelve (el highlight ya cubre toda la sentence
      // truncada). Aplicar CONTRACCIÓN: retreat weak trailing words + detectar
      // "isla colgada" (artículo + sustantivo huérfano sin verbo principal).
      //
      // Caso real Test 1 ("El libro del cementerio" EN):
      //   Input:  "Each of them has their own voice, a tale"
      //   "tale" es sustantivo fuerte, retreat estándar lo respeta (idx=9).
      //   PERO penúltima ("a") es weak → es ISLA artículo+sustantivo huérfano.
      //   Fix v3.8 retrocede 2 posiciones → idx=7 → "Each of them has their own voice"
      const sentenceTrimmed = containingSentence.trim();
      const endedNaturally = /[.!?]$/.test(sentenceTrimmed);

      if (endedNaturally) {
        // Caso v3.7: respetar frase completa sin puntuación final
        replacement = sentenceTrimmed.replace(/[\.!?]+$/, "");
      } else {
        // 🌒 v3.8: sentence colgada → contraer retrocediendo
        let safeIdx = retreatFromWeakTrailing(sentenceWords, sentenceWords.length, 4);
        // Detección de isla colgada: si retreat no logró retroceder (todas las
        // palabras finales fuertes) pero la penúltima es weak, retroceder DOS
        // posiciones para eliminar artículo+sustantivo huérfano.
        if (safeIdx >= sentenceWords.length && sentenceWords.length > 5) {
          const penultimate = sentenceWords[sentenceWords.length - 2];
          if (isWeakTrailingWord(penultimate)) {
            safeIdx = sentenceWords.length - 2;
            // Recursivo: seguir retrocediendo si quedan más weak words
            while (safeIdx > 4 && isWeakTrailingWord(sentenceWords[safeIdx - 1])) {
              safeIdx -= 1;
            }
          }
        }
        if (safeIdx >= sentenceWords.length) {
          // Ni retreat estándar ni isla detectada → abortar segmento (queda como está)
          continue;
        }
        replacement = sentenceWords.slice(0, safeIdx).join(" ").replace(/[,:;]+$/g, "").trim();
      }
    } else {
      // Caso edge: frase >22 palabras. Buscar coma natural anterior con palabra fuerte.
      let bestCutIdx = sentenceWords.length;
      for (let i = sentenceWords.length - 2; i >= 8; i--) {
        if (/,$/.test(sentenceWords[i])) {
          const noComma = sentenceWords[i].replace(/,$/, "");
          if (!isWeakTrailingWord(noComma)) {
            bestCutIdx = i + 1;
            break;
          }
        }
      }
      bestCutIdx = retreatFromWeakTrailing(sentenceWords, bestCutIdx, 5);
      replacement = sentenceWords.slice(0, bestCutIdx).join(" ").replace(/[,:;]+$/g, "").trim();
    }

    if (!replacement) continue;
    expansions.push({ segment, fullSentence: containingSentence, replacement });
  }

  if (expansions.length === 0) return text;

  // Reconstrucción nivel dios: trabajamos sobre el plain text.
  // Para cada expansión, reemplazamos la frase completa por [H]replacement[/H]
  // preservando la puntuación final que iba al final de la frase original.
  // Esto evita duplicar texto post-[/H] que era parte de la frase contenedora.
  let result = plain;
  for (const exp of expansions) {
    const sentenceTrimmed = exp.fullSentence.trim();
    const endingPunct = sentenceTrimmed.match(/[\.!?]+$/);
    const tail = endingPunct ? endingPunct[0] : "";

    const escapedSentence = sentenceTrimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sentenceRe = new RegExp(escapedSentence);

    if (!sentenceRe.test(result)) continue;
    result = result.replace(sentenceRe, `[H]${exp.replacement}[/H]${tail}`);
  }

  return result;
}

export function densityToMultipliers(density) {
  const map = {
    aireado: { lineHeight: 1.85, letterSpacing: 0.4, paragraphGap: 1.4 },
    equilibrado: { lineHeight: 1.65, letterSpacing: 0.2, paragraphGap: 1.0 },
    denso: { lineHeight: 1.45, letterSpacing: 0.0, paragraphGap: 0.7 }
  };
  return map[density] || map.equilibrado;
}

export function rhythmToMultipliers(rhythm) {
  const map = {
    lento: { fontSizeScale: 1.04, wordSpacingScale: 1.05 },
    medio: { fontSizeScale: 1.0, wordSpacingScale: 1.0 },
    rapido: { fontSizeScale: 0.97, wordSpacingScale: 0.96 },
    staccato: { fontSizeScale: 0.94, wordSpacingScale: 0.92 }
  };
  return map[rhythm] || map.medio;
}

export function typographyFamilyToStack(family) {
  const stacks = {
    serif_clasico: `'EB Garamond', 'Garamond', Georgia, serif`,
    serif_literario: `'Crimson Pro', 'Source Serif Pro', Georgia, serif`,
    serif_moderno: `'Source Serif Pro', Georgia, serif`,
    sans_geometrico: `'Inter', 'Helvetica Neue', Arial, sans-serif`,
    sans_humanista: `'Work Sans', 'Open Sans', 'Segoe UI', sans-serif`,
    sans_tecnologico: `'IBM Plex Sans', 'Inter', sans-serif`,
    mono_precision: `'JetBrains Mono', 'IBM Plex Mono', Consolas, monospace`,
    mixta_editorial: `'Lora', Georgia, serif`
  };
  return stacks[family] || stacks.sans_humanista;
}