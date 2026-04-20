/* ═══════════════════════════════════════════════════════════════════════════════
   triggui-physics.js — MATEMÁTICA PURA
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
  text = text.replace(/\{\{H\}\}/gi, "[H]").replace(/\{\{\/H\}\}/gi, "[/H]");
  text = text.replace(/\[h\]/g, "[H]").replace(/\[\/h\]/g, "[/H]");

  let toggleOpen = true;
  text = text.replace(/\[H\]/g, () => {
    const token = toggleOpen ? "[H]" : "[/H]";
    toggleOpen = !toggleOpen;
    return token;
  });

  const opens = (text.match(/\[H\]/g) || []).length;
  const closes = (text.match(/\[\/H\]/g) || []).length;
  if (opens > closes) text += "[/H]".repeat(opens - closes);

  text = text.replace(/\[H\]\s*\[\/H\]/g, "");
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
