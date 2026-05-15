/* ═══════════════════════════════════════════════════════════════════════════════
   post-processors.js — TRANSFORMACIONES DETERMINISTAS POST-LLM

   v3.7.2 (2026-04-27): ENSURE SENTENCE CLOSURE
   ─────────────────────────────────────────────────────────────────────────────
   Cambio sobre v3.7.1 (aditivo, NO destructivo):

   GPT ocasionalmente genera frases sin signo de cierre (ej: "¿Qué pasa" sin
   "?", "Hazlo ahora" sin "."), incumpliendo el system prompt de extractors.
   Antes: el OG renderer, edición viva y meta tags tomaban esas frases tal
   cual y las pintaban truncadas visualmente (se vio en el OG image de
   "El Poder de la Soledad": "¿Qué verdades surgen en el silencio de tu
   interior" sin "?").

   Fix: ensureSentenceClosure() valida y completa el signo de cierre antes de
   que las frases entren al JSON publicado. Como vive en injectEmojis, cura
   las 4 colecciones (og_phrases_es/en + edition_blocks_es/en.phrase) en una
   sola pasada, sin tocar prompts de GPT ni schema.

   Lo NO tocado:
   - Prompts (sagrados)
   - Schema (sagrado)
   - calculateConfidence (intacto)
   - compatMapper (intacto)
   - parrafoTop/parrafoBot (no se aplica ahí porque pueden contener [H]...[/H]
     con cortes intencionales y la heurística sería arriesgada)

   Componentes anteriores intactos:
   1. injectEmojis(content, bookSeed): agrega emoji al inicio de cada og_phrase
      y edition_block.phrase. Elige emoji según sensory_anchor (ES) o gesture_type (EN),
      rotando entre 2-3 variantes con seed derivada del libro. Determinista por libro,
      variado entre libros.

   2. calculateConfidence(groundingSource, tierReached, anchors, voiceVerdict,
                          groundingJudgeScore, cards):
      Confidence objetiva desde 4 señales ortogonales.

   3. compatMapper(book, groundTruth, anchorsData, contentES, contentEN, palette,
                   voiceVerdict, groundingJudgeES, groundingJudgeEN, confidence, crono,
                   inputsSnapshot, runMeta):
      Arma el JSON compat v9.7.4 desde todas las piezas.
═══════════════════════════════════════════════════════════════════════════════ */

import { createHash } from "node:crypto";
import { textContrastOn, darken, withAlpha, densityToMultipliers, rhythmToMultipliers, typographyFamilyToStack } from "./triggui-physics.js";
import { renderTarjetaES, renderTarjetaEN, prepareOGPhrases, prepareEditionPhrases } from "./render-tarjeta.js";

/* ─────────────────────────────────────────────────────────────────────────────
   MAPAS DE EMOJIS
   Cada sensory_anchor / gesture_type tiene 2-3 emojis. Elegimos con seed del libro.
────────────────────────────────────────────────────────────────────────────── */

const EMOJI_BY_SENSORY_ES = {
  vista: ["👁", "🔭", "🌅"],
  oido: ["🎧", "🔔", "📻"],
  tacto: ["✋", "🪨", "🧶"],
  olfato: ["🌿", "🕯", "☕"],
  gusto: ["🍎", "🫖", "🧂"],
  movimiento: ["🚶", "🌊", "💫"],
  espacio: ["🏛", "🗺", "🌌"],
  luz: ["☀", "🕯", "💡"],
  respiracion: ["🌬", "🫁", "🧘"],
  tiempo: ["⏳", "🕰", "🌓"]
};

const EMOJI_BY_SENSORY_EN = {
  sight: ["👁", "🔭", "🌅"],
  hearing: ["🎧", "🔔", "📻"],
  touch: ["✋", "🪨", "🧶"],
  smell: ["🌿", "🕯", "☕"],
  taste: ["🍎", "🫖", "🧂"],
  movement: ["🚶", "🌊", "💫"],
  space: ["🏛", "🗺", "🌌"],
  light: ["☀", "🕯", "💡"],
  breath: ["🌬", "🫁", "🧘"],
  time: ["⏳", "🕰", "🌓"]
};

// Para og_phrases que no tienen sensory_anchor, usamos un set neutral por libro
const EMOJI_OG_POOL = [
  "✨", "⚓", "🔁", "🛡", "🎯", "🌱", "🔮", "🕊",
  "📖", "🌓", "🪞", "⚡", "🌿", "🧭", "🔍", "💠"
];

function seedFromBook(titulo, autor) {
  const hash = createHash("sha256").update(`${titulo}|${autor}`.toLowerCase()).digest();
  // Convertir primeros 8 bytes a número entero
  return hash.readUInt32BE(0);
}

function pickWithSeed(options, seed, index) {
  if (!Array.isArray(options) || options.length === 0) return "";
  return options[(seed + index) % options.length];
}

/* ─────────────────────────────────────────────────────────────────────────────
   v3.7.2 — ENSURE SENTENCE CLOSURE
   ─────────────────────────────────────────────────────────────────────────────
   Defensa matemática contra GPT que olvida cerrar frases. El system prompt
   pide cerrar con "." "?" o "!" pero no es enforced. Esta función garantiza
   el cierre correcto antes de persistir las frases en el JSON publicado.

   Reglas matemáticas:
   - Termina ya en . ! ? …  → no tocar (frase ya cerrada bien)
   - Empieza con ¿ y no cierra → append "?" (pregunta interrogativa)
   - Empieza con ¡ y no cierra → append "!" (exclamativa)
   - Cualquier otra sin cierre → append "." (punto final por defecto)

   No se aplica a parrafoTop/parrafoBot porque pueden contener [H]...[/H] con
   cortes intencionales que el LLM judge ya valida en F2.7. Aquí sólo curamos
   frases cortas (og_phrases + edition_blocks.phrase), donde el cierre es
   inequívocamente necesario.

   Idempotente: aplicarla 2 veces sobre la misma frase devuelve el mismo
   resultado (no apila puntuación).
────────────────────────────────────────────────────────────────────────────── */

function ensureSentenceClosure(text) {
  if (!text) return text;
  const trimmed = String(text).trim();
  if (!trimmed) return trimmed;

  const lastChar = trimmed.slice(-1);

  // Ya cierra correctamente con puntuación final estándar
  if (".!?…".includes(lastChar)) return trimmed;

  // Pregunta abierta con ¿ sin cerrar
  if (trimmed.startsWith("¿")) return `${trimmed}?`;

  // Exclamación abierta con ¡ sin cerrar
  if (trimmed.startsWith("¡")) return `${trimmed}!`;

  // Cualquier otra frase sin cierre: punto final
  return `${trimmed}.`;
}

/* ─────────────────────────────────────────────────────────────────────────────
   INJECT EMOJIS
   v3.7.2: integra ensureSentenceClosure antes del concat con emoji para
   que ninguna frase publicada quede sin signo de cierre.
────────────────────────────────────────────────────────────────────────────── */

export function injectEmojis(contentES, contentEN, titulo, autor) {
  const seed = seedFromBook(titulo, autor);

  // Edition blocks ES con emoji por sensory_anchor
  const editionES = (contentES.edition_blocks_es || []).map((block, i) => {
    const pool = EMOJI_BY_SENSORY_ES[block.sensory_anchor] || EMOJI_OG_POOL;
    const emoji = pickWithSeed(pool, seed, i);
    const phraseClean = String(block.phrase || "").trim().replace(/[\n\r]+/g, " ").replace(/\s+/g, " ");
    const phraseClosed = ensureSentenceClosure(phraseClean);
    return { ...block, phrase: `${emoji} ${phraseClosed}` };
  });

  // Edition blocks EN con emoji por sensory_anchor
  const editionEN = (contentEN.edition_blocks_en || []).map((block, i) => {
    const pool = EMOJI_BY_SENSORY_EN[block.sensory_anchor] || EMOJI_OG_POOL;
    const emoji = pickWithSeed(pool, seed, i);
    const phraseClean = String(block.phrase || "").trim().replace(/[\n\r]+/g, " ").replace(/\s+/g, " ");
    const phraseClosed = ensureSentenceClosure(phraseClean);
    return { ...block, phrase: `${emoji} ${phraseClosed}` };
  });

  // OG phrases ES — v12: preserva metadata sinfónica (rol_sinfonico, eje_animo)
  const ogES = (contentES.og_phrases_es || []).map((item, i) => {
    // Soporta string (legacy pre-v12) o object {phrase, rol_sinfonico, eje_animo} (post-v12)
    const isObject = typeof item === 'object' && item !== null;
    const rawPhrase = isObject ? (item.phrase || "") : (item || "");
    const emoji = pickWithSeed(EMOJI_OG_POOL, seed, i + 10);
    const clean = String(rawPhrase).trim().replace(/[\n\r]+/g, " ").replace(/\s+/g, " ");
    const closed = ensureSentenceClosure(clean);
    const phraseWithEmoji = `${emoji} ${closed}`;
    // Preserva metadata si era objeto (vital para C5 — pool de pickPhrase)
    return isObject ? { ...item, phrase: phraseWithEmoji } : { phrase: phraseWithEmoji };
  });

  // OG phrases EN — v12: preserva metadata sinfónica (role_symphonic, mood_axis)
  const ogEN = (contentEN.og_phrases_en || []).map((item, i) => {
    const isObject = typeof item === 'object' && item !== null;
    const rawPhrase = isObject ? (item.phrase || "") : (item || "");
    const emoji = pickWithSeed(EMOJI_OG_POOL, seed, i + 10);
    const clean = String(rawPhrase).trim().replace(/[\n\r]+/g, " ").replace(/\s+/g, " ");
    const closed = ensureSentenceClosure(clean);
    const phraseWithEmoji = `${emoji} ${closed}`;
    return isObject ? { ...item, phrase: phraseWithEmoji } : { phrase: phraseWithEmoji };
  });

  return {
    edition_blocks_es: editionES,
    edition_blocks_en: editionEN,
    og_phrases_es: ogES,
    og_phrases_en: ogEN
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   CONFIDENCE CALCULATOR
   3 señales ortogonales que miden cosas distintas. Nada autorreportado.
────────────────────────────────────────────────────────────────────────────── */

const GENERIC_TERMS_ES = new Set([
  "viaje", "camino", "luz", "presencia", "esencia", "momento", "vida", "sueños",
  "horizonte", "búsqueda", "crecimiento", "cambio", "bienestar", "felicidad", "éxito",
  "propósito", "intención", "claridad", "equilibrio", "armonía"
]);

const GENERIC_TERMS_EN = new Set([
  "journey", "path", "light", "presence", "essence", "moment", "life", "dreams",
  "horizon", "search", "growth", "change", "wellness", "happiness", "success",
  "purpose", "intention", "clarity", "balance", "harmony"
]);

function specificitySignal(anchors) {
  const concepts = Array.isArray(anchors?.concepts) ? anchors.concepts : [];
  const keyTerms = Array.isArray(anchors?.key_terms) ? anchors.key_terms : [];
  const allTerms = [...concepts.join(" ").toLowerCase().split(/\W+/), ...keyTerms.map((t) => t.toLowerCase())].filter(Boolean);
  if (allTerms.length === 0) return 0.4;
  const genericCount = allTerms.filter((t) => GENERIC_TERMS_ES.has(t) || GENERIC_TERMS_EN.has(t)).length;
  const genericRatio = genericCount / allTerms.length;
  // 0% términos genéricos → 0.95; 50% → 0.5; 100% → 0.2
  return Math.max(0.2, 0.95 - genericRatio * 1.5);
}

function voiceSignal(voiceVerdict) {
  if (!voiceVerdict) return 0.5;
  if (voiceVerdict.consolidated === "pagina") return Math.min(0.95, 0.7 + (voiceVerdict.confidence || 0.5) * 0.25);
  if (voiceVerdict.consolidated === "reseña" || voiceVerdict.consolidated === "resena") return Math.max(0.3, 0.5 - (voiceVerdict.confidence || 0.5) * 0.2);
  return 0.5;
}

export function calculateConfidence({ bookIdentityConfidence, anchors, voiceVerdict, groundingJudgeES, groundingJudgeEN }) {
  const grounding = bookIdentityConfidence || 0.5; // Señal 1: viene del grounding-resolver (Tier 1-4)
  const voice = voiceSignal(voiceVerdict);          // Señal 2: voice judge
  const specificity = specificitySignal(anchors);   // Señal 3: anti-genericidad de anchors
  const judgeScore = ((groundingJudgeES?.grounded_score ?? 0.5) + (groundingJudgeEN?.grounded_score ?? 0.5)) / 2; // Señal 4: grounding judge

  // Combinación: cada señal pesa distinto. Grounding (tier) y judge son los más fiables.
  const combined = grounding * 0.30 + voice * 0.20 + specificity * 0.20 + judgeScore * 0.30;

  return {
    book_grounding: Math.round(grounding * 100) / 100,
    voice_authenticity: Math.round(voice * 100) / 100,
    specificity: Math.round(specificity * 100) / 100,
    grounding_judge: Math.round(judgeScore * 100) / 100,
    combined: Math.round(combined * 100) / 100,
    signals: {
      bookIdentityConfidence: grounding,
      voiceSignal: voice,
      specificitySignal: specificity,
      judgeScore
    }
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPAT MAPPER — arma JSON v9.7.4
────────────────────────────────────────────────────────────────────────────── */

export function compatMapper({
  book, groundTruthMeta, anchorsData, contentES, contentEN, palette,
  emojiInjected, voiceVerdict, groundingJudgeES, groundingJudgeEN,
  confidence, crono, inputsSnapshot, runMeta, qualityWarning
}) {
  const autorFinal = groundTruthMeta.verified_identity?.autor_completo || anchorsData.book_identity.autor_completo || book.autor;
  const style = { accent: palette.accent, paper: palette.paper, ink: palette.ink, border: palette.border };

  const tarjetaVisualStub = {
    paper: palette.paper, ink: palette.ink, accent: palette.accent, border: palette.border,
    paperIsDark: palette.paper_is_dark,
    cssVars: buildCssVars(palette, anchorsData.visual_intent)
  };

  const tarjetaES = renderTarjetaES(contentES.card_es, tarjetaVisualStub);
  const tarjetaEN = renderTarjetaEN(contentEN.card_en, tarjetaVisualStub);

  const gestureTypesES = (contentES.edition_blocks_es || []).map((b) => b?.gesture_type);
  const gestureTypesEN = (contentEN.edition_blocks_en || []).map((b) => b?.gesture_type);

  // ════════════════════════════════════════════════════════════════════════
  // V15 SPRINT C — meta agregada del libro nivel dios cuántico-quark
  // Calcula _animo_promedio, _valor_predominante, _punto_ciclo_optimo
  // Defensa graceful: si phrases no tienen pilar/punto_optimo → null
  // ════════════════════════════════════════════════════════════════════════
  const allPhrasesV15 = [
    ...(emojiInjected.edition_blocks_es || []),
    ...(emojiInjected.og_phrases_es || [])
  ];

  // _animo_promedio: avg de eje_animo de todas las phrases ES
  const animoValuesV15 = allPhrasesV15
    .map(p => (p && typeof p.eje_animo === 'number') ? p.eje_animo : null)
    .filter(v => v !== null);
  const animoPromedioV15 = animoValuesV15.length > 0
    ? Math.round(animoValuesV15.reduce((a, b) => a + b, 0) / animoValuesV15.length * 100) / 100
    : null;

  // _valor_predominante: pilar más frecuente entre phrases
  const pilarCountsV15 = {};
  for (const p of allPhrasesV15) {
    if (p && p.pilar) pilarCountsV15[p.pilar] = (pilarCountsV15[p.pilar] || 0) + 1;
  }
  const valorPredominanteV15 = Object.keys(pilarCountsV15).length > 0
    ? Object.entries(pilarCountsV15).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // _punto_ciclo_optimo: punto más frecuente entre phrases
  const puntoCountsV15 = {};
  for (const p of allPhrasesV15) {
    if (p && p.punto_optimo) puntoCountsV15[p.punto_optimo] = (puntoCountsV15[p.punto_optimo] || 0) + 1;
  }
  const puntoCicloOptimoV15 = Object.keys(puntoCountsV15).length > 0
    ? Object.entries(puntoCountsV15).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  console.log(`   🎯 V15 Sprint C meta: animo=${animoPromedioV15} valor=${valorPredominanteV15} punto=${puntoCicloOptimoV15}`);


  return {
    titulo: book.titulo,
    autor: autorFinal,
    tagline: book.tagline || "",
    portada: book.portada || `📚 ${book.titulo}\n${autorFinal}`,
    portada_url: book.portada_url || book.portada || "",
    isbn: book.isbn || "",

    titulo_es: anchorsData.book_identity.titulo_es,
    titulo_en: anchorsData.book_identity.titulo_en,
    idioma_original: anchorsData.book_identity.idioma_original,

    dimension: anchorsData.surface_hints.dimension,
    punto: anchorsData.surface_hints.punto_hawkins,
    palabras: contentES.emotional_words_es,
    palabras_en: contentEN.emotional_words_en,
    frases: prepareEditionPhrases(emojiInjected.edition_blocks_es),
    frases_en: prepareEditionPhrases(emojiInjected.edition_blocks_en),
    frases_og: prepareOGPhrases(emojiInjected.og_phrases_es),
    frases_og_en: prepareOGPhrases(emojiInjected.og_phrases_en),
    colores: palette.palette,
    textColors: palette.palette.map(textContrastOn),
    fondo: palette.paper,

    tarjeta: { ...tarjetaES, style },
    tarjeta_base: { ...tarjetaES, style },
    tarjeta_presentacion: { ...tarjetaES, style },
    tarjeta_en: { ...tarjetaEN, style },
    tarjeta_base_en: { ...tarjetaEN, style },
    tarjeta_presentacion_en: { ...tarjetaEN, style },

    videoUrl: `https://duckduckgo.com/?q=!ducky+site:youtube.com+${encodeURIComponent(`${book.titulo} ${autorFinal} entrevista español`)}`,
    videoUrl_en: `https://duckduckgo.com/?q=!ducky+site:youtube.com+${encodeURIComponent(`${anchorsData.book_identity.titulo_en} ${autorFinal} interview`)}`,

    // 🎯 SPRINT A v14 — DNA curatorial persistido
    _curator_meta: globalThis.__TRIGGUI_CURATOR_CONTEXT__ || null,

    // V15 SPRINT C — meta agregada del libro
    _animo_promedio: animoPromedioV15,
    _valor_predominante: valorPredominanteV15,
    _punto_ciclo_optimo: puntoCicloOptimoV15,


    _nucleus: {
      book_identity: anchorsData.book_identity,
      book_grounding_anchors: anchorsData.book_grounding_anchors,
      lens_analysis: anchorsData.lens_analysis,
      visual_intent: anchorsData.visual_intent,
      surface_hints: anchorsData.surface_hints,
      card_es: contentES.card_es,
      card_en: contentEN.card_en,
      emotional_words_es: contentES.emotional_words_es,
      emotional_words_en: contentEN.emotional_words_en,
      og_phrases_es: emojiInjected.og_phrases_es,
      og_phrases_en: emojiInjected.og_phrases_en,
      edition_blocks_es: emojiInjected.edition_blocks_es,
      edition_blocks_en: emojiInjected.edition_blocks_en,
      confidence
    },

    _grounding: {
      source: groundTruthMeta.grounding_source,
      tier_reached: groundTruthMeta.tier_reached,
      book_identity_confidence: groundTruthMeta.book_identity_confidence,
      resolution_path: groundTruthMeta.resolution_path,
      verified_identity: groundTruthMeta.verified_identity,
      similar_books: groundTruthMeta.similar_books,
      match_score: groundTruthMeta.match_score,
      from_cache: Boolean(groundTruthMeta.from_cache),
      warning: groundTruthMeta.warning
    },

    _grounding_judge: {
      es: groundingJudgeES,
      en: groundingJudgeEN
    },

    _voice_verdict: voiceVerdict,

    _visual: {
      synthesis_inputs: palette.synthesis_inputs,
      contrast_ratio: palette.contrast_ratio,
      paper_is_dark: palette.paper_is_dark,
      cssVars: tarjetaVisualStub.cssVars
    },

    _edition_meta: {
      gesture_types_es: gestureTypesES,
      gesture_types_en: gestureTypesEN,
      distinct_types_es: new Set(gestureTypesES).size,
      distinct_types_en: new Set(gestureTypesEN).size
    },

    _quality_warning: qualityWarning,
    _inputs_snapshot: inputsSnapshot,
    _crono: crono,

    _metrics: {
      tokens_total: runMeta.totalTokens,
      tokens_by_phase: runMeta.tokensByPhase,
      elapsed_ms_total: runMeta.totalElapsedMs,
      elapsed_ms_by_phase: runMeta.elapsedByPhase,
      llm_calls_count: runMeta.llmCallsCount,
      models_used: runMeta.modelsUsed,
      pipeline_version: "nucleus-canonical-v3"
    }
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   CSS VARS — derivadas de palette y visual_intent para compat con renderer
────────────────────────────────────────────────────────────────────────────── */

function buildCssVars(palette, visualIntent) {
  const density = densityToMultipliers(visualIntent.density);
  const rhythm = rhythmToMultipliers(visualIntent.rhythm);
  const typographyStack = typographyFamilyToStack(visualIntent.typography_family);

  const highlightBg = palette.paper_is_dark ? palette.accent : darken(palette.accent, 0.12);
  const highlightInk = palette.paper_is_dark ? palette.paper : "#FFFFFF";

  const genreRadiusMap = {
    academico: 4, literario: 10, manifiesto: 2, poesia: 16,
    narrativa: 12, ensayo: 8, tecnico: 4, espiritual: 18
  };
  const cardRadius = genreRadiusMap[visualIntent.genre_visual] ?? 12;

  return {
    "--palette-0": palette.palette[0],
    "--palette-1": palette.palette[1],
    "--palette-2": palette.palette[2],
    "--palette-3": palette.palette[3],
    "--accent": palette.accent,
    "--accent-soft": withAlpha(palette.accent, 0.22),
    "--accent-glow": withAlpha(palette.accent, 0.42),
    "--paper": palette.paper,
    "--ink": palette.ink,
    "--border": palette.border,
    "--highlight-bg": withAlpha(highlightBg, 0.85),
    "--highlight-ink": highlightInk,
    "--typography-stack": typographyStack,
    "--line-height": density.lineHeight,
    "--letter-spacing": density.letterSpacing,
    "--paragraph-gap": density.paragraphGap,
    "--font-size-scale": rhythm.fontSizeScale,
    "--word-spacing-scale": rhythm.wordSpacingScale,
    "--card-radius": `${cardRadius}px`,
    "--highlight-radius": "5px"
  };
}