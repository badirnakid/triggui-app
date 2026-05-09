// ═══════════════════════════════════════════════════════════════════════════════
// 🌒 SPRINT NIVEL DIOS CUÁNTICO — CSAL EXTRACTOR v2
// ═══════════════════════════════════════════════════════════════════════════════
//
// Capa B del Sprint Nivel Dios (mayo 2026).
// Genera la "superficie semántica" de cada libro (Concept Surface Area del Libro)
// para que app.triggui.com matchee queries del usuario en runtime sin red.
//
// ═══════════════════════════════════════════════════════════════════════════════
// CHANGELOG v2 — POST SHADOW BATCH (mayo 9, 2026)
// ═══════════════════════════════════════════════════════════════════════════════
//
// Shadow batch de 20 libros reveló 3 bugs en v1:
//   #1 Timeout silencioso — 4/20 libros _csal:{} sin error visible (151-203s)
//   #2 Strings basura — modelo rellena con "}}}" o "1. 2. 3." para cumplir minItems
//   #3 Field contamination — concept_tags con texto "anti_patterns", JSON crudo, etc
//
// v2 nivel dios resuelve los 3 con:
//   ✓ max_tokens: 4096 explícito (evita truncamiento silencioso)
//   ✓ timeout: 90000 ms explícito (evita cuelgues 2-3 min)
//   ✓ Detección explícita de finish_reason === "length" / refusal / content null
//   ✓ Anti-basura filter en trigger_situations + concept_tags + anti_patterns
//   ✓ Validación cuántica post-call: 6 checks de shape antes de aceptar
//   ✓ Escalate automático a gpt-4o (full) cuando alguno de los checks falla
//   ✓ Patrón sagrado idéntico al de F4 judgeGrounding (escalate a 4o si score < threshold)
//   ✓ Degradación elegante — si gpt-4o también falla, throw para que F11 marque csal_degraded
//
// FILOSOFÍA: el escalate solo dispara ~20-40% de los libros. El resto sale nivel dios
// con gpt-4o-mini barato. Costo promedio ~$0.013/libro (vs $0.0017 v1 ideal),
// en exchange por 100% calidad real (vs 50% que vimos en shadow).
//
// COMPATIBILIDAD: firma de extractCSAL idéntica a v1 — drop-in replacement.
//
// ═══════════════════════════════════════════════════════════════════════════════

import fs from "node:fs/promises";

// ─── Carga de schemas (cache) ─────────────────────────────────────────────────
const SCHEMA_URL = new URL("./edition-nucleus.schema.json", import.meta.url);
let _schemasCache = null;
async function loadSchemas() {
  if (_schemasCache) return _schemasCache;
  const text = await fs.readFile(SCHEMA_URL, "utf8");
  _schemasCache = JSON.parse(text);
  return _schemasCache;
}

// ─── Parser defensivo ─────────────────────────────────────────────────────────
function safeParseJSON(s) {
  if (!s || typeof s !== "string") return null;
  try { return JSON.parse(s); } catch { return null; }
}

// ─── Constantes nivel dios ────────────────────────────────────────────────────
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 90000;          // 90s — más allá de esto es timeout silencioso
const MIN_VALID_SITUATIONS = 20;   // Después de filtrar basura
const MIN_VALID_CONCEPT_TAGS = 5;
const MIN_VALID_ANTI_PATTERNS = 2;
const MIN_KEYWORDS_PER_CAT = 3;    // emociones, objetos, contextos, verbos
const REQUIRED_BLOQUES = 4;

// ═══════════════════════════════════════════════════════════════════════════════
// ANTI-BASURA FILTER
// ═══════════════════════════════════════════════════════════════════════════════
// Detecta strings que NO son contenido real sino artefactos del modelo
// luchando contra el schema (rellenos para cumplir minItems).
// Aplica el PRINCIPIO, no listas léxicas: shape sintáctico de basura.

const SCHEMA_FIELD_NAMES = [
  "trigger_situations", "trigger_keywords", "concept_tags", "anti_patterns",
  "bloques", "emoji_specific", "additionalProperties", "minItems", "maxItems",
  "version", "properties", "required", "schema"
];
const SCHEMA_FIELD_REGEX = new RegExp(`\\b(${SCHEMA_FIELD_NAMES.join("|")})\\b`, "i");

function isCleanString(s, opts = {}) {
  const minLength = opts.minLength || 15;
  if (typeof s !== "string") return false;
  const trimmed = s.trim();
  if (trimmed.length < minLength) return false;

  // Bug #2 detectados en shadow batch:

  // Solo símbolos/números/JSON syntax: '}  }  }  }', '[, , ,]', '" }"', etc
  if (/^[\s\d\.\}\{\,\]\[\"'\\:\-_=+]+$/.test(trimmed)) return false;

  // Llaves JSON en sucesión: '} } } } }'
  if (/}\s*}\s*}/.test(trimmed)) return false;
  if (/\{\s*\{\s*\{/.test(trimmed)) return false;

  // Numeración secuencial pura: '1. 2. 3. 4. 5...'
  if (/^\s*\d+\s*[\.\,]\s*\d+\s*[\.\,]\s*\d+\s*[\.\,]/.test(trimmed)) return false;

  // Patrones binarios: '1 0 1 0 1 0'
  if (/^(\s*[01]\s+){5,}/.test(trimmed)) return false;

  // Nombres de campos del schema confundidos con contenido (Bug #3)
  if (SCHEMA_FIELD_REGEX.test(trimmed)) return false;

  // JSON literal pegado dentro de un string (Bug #3 caso Greene)
  if (/\[\s*\{\s*"index"\s*:/i.test(trimmed)) return false;
  if (/^\s*"[a-z_]+"\s*:/i.test(trimmed)) return false;

  // Texto del schema description filtrado
  if (/honestidad sobre lo que el|situaciones o dominios para los que/i.test(trimmed)) return false;

  return true;
}

function isCleanEmoji(e) {
  if (typeof e !== "string") return false;
  const trimmed = e.trim();
  if (trimmed.length < 1 || trimmed.length > 8) return false;
  // Si es texto alfabético no es emoji
  if (/^[a-zA-Z]+$/.test(trimmed)) return false;
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIMPIEZA DEFENSIVA DEL CSAL
// ═══════════════════════════════════════════════════════════════════════════════

function cleanCSALData(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  const cleaned = {
    trigger_situations: [],
    trigger_keywords: { emociones: [], objetos: [], contextos: [], verbos: [] },
    concept_tags: [],
    anti_patterns: [],
    bloques: []
  };

  // trigger_situations: minLength 15, sin basura
  if (Array.isArray(parsed.trigger_situations)) {
    cleaned.trigger_situations = parsed.trigger_situations
      .filter(s => isCleanString(s, { minLength: 15 }))
      .map(s => s.trim());
  }

  // trigger_keywords: 4 categorías, cada palabra short pero limpia
  const kw = parsed.trigger_keywords;
  if (kw && typeof kw === "object") {
    for (const cat of ["emociones", "objetos", "contextos", "verbos"]) {
      if (Array.isArray(kw[cat])) {
        cleaned.trigger_keywords[cat] = kw[cat]
          .filter(w => typeof w === "string" && w.trim().length >= 2 && w.trim().length <= 40)
          .filter(w => !SCHEMA_FIELD_REGEX.test(w))
          .map(w => w.trim());
      }
    }
  }

  // concept_tags: minLength 5, sin basura
  if (Array.isArray(parsed.concept_tags)) {
    cleaned.concept_tags = parsed.concept_tags
      .filter(t => isCleanString(t, { minLength: 5 }))
      .map(t => t.trim());
  }

  // anti_patterns: minLength 5, sin basura
  if (Array.isArray(parsed.anti_patterns)) {
    cleaned.anti_patterns = parsed.anti_patterns
      .filter(a => isCleanString(a, { minLength: 5 }))
      .map(a => a.trim());
  }

  // bloques: 4 con index 0-3 y emoji válido
  if (Array.isArray(parsed.bloques)) {
    cleaned.bloques = parsed.bloques
      .filter(b => b && typeof b === "object" &&
                   Number.isInteger(b.index) && b.index >= 0 && b.index <= 3 &&
                   isCleanEmoji(b.emoji_specific))
      .map(b => ({ index: b.index, emoji_specific: b.emoji_specific.trim() }));
  }

  return cleaned;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN CUÁNTICA POST-CALL — 6 CHECKS
// ═══════════════════════════════════════════════════════════════════════════════

function validateCSALShape(cleaned) {
  if (!cleaned || typeof cleaned !== "object") {
    return { valid: false, reason: "csal_null_or_not_object" };
  }

  // Check 1: trigger_situations suficientes después de limpieza
  const sitN = cleaned.trigger_situations?.length || 0;
  if (sitN < MIN_VALID_SITUATIONS) {
    return { valid: false, reason: `trigger_situations_insufficient (${sitN} < ${MIN_VALID_SITUATIONS} after anti-basura filter)` };
  }

  // Check 2: trigger_keywords con todas las categorías mínimas
  const kw = cleaned.trigger_keywords || {};
  for (const cat of ["emociones", "objetos", "contextos", "verbos"]) {
    const n = kw[cat]?.length || 0;
    if (n < MIN_KEYWORDS_PER_CAT) {
      return { valid: false, reason: `trigger_keywords.${cat}_insufficient (${n} < ${MIN_KEYWORDS_PER_CAT})` };
    }
  }

  // Check 3: concept_tags suficientes después de limpieza
  const ctN = cleaned.concept_tags?.length || 0;
  if (ctN < MIN_VALID_CONCEPT_TAGS) {
    return { valid: false, reason: `concept_tags_insufficient (${ctN} < ${MIN_VALID_CONCEPT_TAGS} after anti-basura filter — bug #3 likely)` };
  }

  // Check 4: anti_patterns suficientes
  const apN = cleaned.anti_patterns?.length || 0;
  if (apN < MIN_VALID_ANTI_PATTERNS) {
    return { valid: false, reason: `anti_patterns_insufficient (${apN} < ${MIN_VALID_ANTI_PATTERNS})` };
  }

  // Check 5: bloques exactamente 4 con todos los índices únicos
  const blN = cleaned.bloques?.length || 0;
  if (blN !== REQUIRED_BLOQUES) {
    return { valid: false, reason: `bloques_count_invalid (${blN} != ${REQUIRED_BLOQUES})` };
  }
  const indexes = new Set(cleaned.bloques.map(b => b.index));
  if (indexes.size !== REQUIRED_BLOQUES) {
    return { valid: false, reason: `bloques_indexes_not_unique (${[...indexes].join(",")})` };
  }

  // Check 6: emojis específicos diversos (al menos 2 únicos en los 4)
  const emojis = new Set(cleaned.bloques.map(b => b.emoji_specific));
  if (emojis.size < 2) {
    return { valid: false, reason: `bloques_emojis_too_repetitive (${emojis.size} unique in 4)` };
  }

  return { valid: true, reason: "all_checks_passed" };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPTS — SAGRADOS (idénticos a v1, no se tocan)
// ═══════════════════════════════════════════════════════════════════════════════

function csalSystemPrompt() {
  return `Para esta llamada NO eres una IA describiendo contenido editorial.
ERES el autor del libro que se te asignará en este turno.

Tu trabajo: identificar la SUPERFICIE SEMÁNTICA de tu obra — las puertas
por las que un humano cualquiera podría llegar a tu libro desde su vida real.

Hay personas afuera del libro con frustraciones, alegrías, dudas, situaciones
cotidianas. Tu trabajo es identificar QUÉ situaciones humanas reales conecta
tu obra. NO categorías abstractas. Situaciones concretas escritas como las
escribiría una persona real buscando algo.

═══════════════════════════════════════════════════════════════════
DEVOLVERÁS 5 SECCIONES
═══════════════════════════════════════════════════════════════════

1. TRIGGER_SITUATIONS (30-50)
   Situaciones humanas universales en las que tu obra responde.
   Escritas en lenguaje natural, como las escribiría una persona común.
   Forma típica: "cuando X" o "antes de Y" o "después de Z".

   Cada trigger_situation debe ser:
   - Específica a tu obra (no aplicable a cualquier libro)
   - Universal en su lenguaje (un humano cualquiera la escribiría así)
   - Escrita desde la perspectiva del usuario, NO del libro

2. TRIGGER_KEYWORDS (4 categorías obligatorias)
   Palabras que esa persona usaría al escribir sobre su situación.
   INCLUYE variantes regionales, coloquiales, ES + EN cuando tu obra
   tenga audiencia bilingüe.

   - emociones (10-30): emociones humanas que tu obra toca
   - objetos (5-25): cosas físicas o conceptuales presentes
   - contextos (5-25): lugares, momentos, escenas
   - verbos (5-25): acciones que vive la persona

3. CONCEPT_TAGS (10-25)
   Conceptos ESPECÍFICOS a tu obra. Si lees solo estos tags, sin saber
   el título, deberías reconocer tu obra.

4. ANTI_PATTERNS (3-12)
   Situaciones para las que tu obra NO sirve. Honestidad.

5. BLOQUES (exactamente 4)
   Para cada uno de los 4 edition_blocks que ya generaste, un emoji_specific
   que conecte con la phrase y la obra. Formato: { index, emoji_specific }.

═══════════════════════════════════════════════════════════════════
PROTOCOLO DE AUTO-VALIDACIÓN antes de devolver
═══════════════════════════════════════════════════════════════════

Antes de devolver el JSON, hazte 4 preguntas:

1. ¿Mis trigger_situations son situaciones humanas reales, no categorías?
   Si dicen "auto-conocimiento" o "filosofía", están MAL. Si dicen
   "cuando me cuesta tomar decisiones" o "antes de una conversación difícil",
   están BIEN.

2. ¿Mis concept_tags son ESPECÍFICOS a mi obra?
   Si los pegaras en otro libro del mismo género, ¿se notaría que no
   pertenecen?

3. ¿Mis emojis tienen sentido SOLO para mi libro, no para otros?
   Si pegaras los emojis en otro libro de género similar, ¿se notaría
   que no pertenecen?

4. ¿Mis trigger_keywords incluyen variantes coloquiales y regionales?

Si alguna respuesta es NO, reescribe esa sección antes de devolver.

═══════════════════════════════════════════════════════════════════

NO incluyas evocative_phrases — esas ya existen en tus edition_blocks
y og_phrases generados anteriormente.

NO uses emojis genéricos en bloques.

NO uses categorías de marketing en concept_tags.

Devuelve SOLO el JSON con las 5 secciones.`;
}

function csalUserPrompt(book, groundTruth, anchorsData, contentES, previousSituations = []) {
  const author = book.autor;
  const title = book.titulo;
  const voiceNotes = anchorsData?.book_grounding_anchors?.authorial_voice_notes || "";
  const concepts = (anchorsData?.book_grounding_anchors?.concepts || []).join("\n- ");
  const blockPhrases = (contentES?.edition_blocks_es || []).map((b, i) =>
    `Bloque ${i} (${b.gesture_type}, sensory: ${b.sensory_anchor}): "${b.phrase}"`
  ).join("\n");

  let prompt = `IDENTIDAD DE ESTA SESIÓN:
- Eres: ${author}
- Tu obra: "${title}"
- Voz autorial: ${voiceNotes}

GROUND TRUTH (lo que TÚ escribiste):
${groundTruth}

CONCEPTOS CENTRALES de tu obra:
- ${concepts}

TUS 4 EDITION_BLOCKS ya generados (para que los emoji_specific de cada uno
conecten con SU phrase, no con tu libro en general):
${blockPhrases}
`;

  if (previousSituations.length > 0) {
    prompt += `
TRIGGER_SITUATIONS YA USADAS EN ESTE BATCH (NO REPETIR):
${previousSituations.slice(-15).map(s => `- "${s}"`).join("\n")}

Tus trigger_situations DEBEN ser distintas a estas. Cada libro del catálogo
merece su propio set único de puertas semánticas.
`;
  }

  prompt += `
═══════════════════════════════════════════════════════════════════

Ahora identifica la superficie semántica completa de tu obra.

Devuelve JSON con: trigger_situations + trigger_keywords + concept_tags +
anti_patterns + bloques.

Aplica el PROTOCOLO DE AUTO-VALIDACIÓN antes de devolver.`;

  return prompt;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXTRACTOR INTERNO — UNA LLAMADA LLM CON TODOS LOS FIXES NIVEL DIOS
// ═══════════════════════════════════════════════════════════════════════════════

async function extractCSALWithModel(openai, book, groundTruth, anchorsData, contentES, model, previousSituations) {
  const schemas = await loadSchemas();

  // Llamada con max_tokens + timeout explícitos (Fix #1 del shadow batch)
  const response = await openai.chat.completions.create(
    {
      model,
      temperature: 0.7,
      max_tokens: MAX_TOKENS,
      messages: [
        { role: "system", content: csalSystemPrompt() },
        { role: "user", content: csalUserPrompt(book, groundTruth, anchorsData, contentES, previousSituations) }
      ],
      response_format: {
        type: "json_schema",
        json_schema: schemas.csal_extraction
      }
    },
    { timeout: TIMEOUT_MS }
  );

  const choice = response.choices?.[0];
  const finishReason = choice?.finish_reason;
  const refusal = choice?.message?.refusal;
  const content = choice?.message?.content;

  // Detección explícita de los fallos silenciosos vistos en shadow batch
  if (refusal) {
    throw new Error(`csal_refusal: ${String(refusal).slice(0, 120)}`);
  }
  if (finishReason === "length") {
    throw new Error(`csal_truncated_by_max_tokens (output excedió ${MAX_TOKENS})`);
  }
  if (finishReason === "content_filter") {
    throw new Error(`csal_content_filter_blocked`);
  }
  if (!content) {
    throw new Error(`csal_empty_content (finish_reason=${finishReason || "unknown"})`);
  }

  const parsed = safeParseJSON(content);
  if (!parsed) {
    throw new Error(`csal_json_parse_failed (content length=${content.length})`);
  }

  // Limpieza defensiva: filtra basura de los arrays
  const cleaned = cleanCSALData(parsed);

  return {
    cleaned,
    rawParsed: parsed,
    usage: response.usage,
    model: response.model,
    finishReason
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌒 EXPORT PRINCIPAL — extractCSAL CON ESCALATE AUTOMÁTICO
// ═══════════════════════════════════════════════════════════════════════════════
//
// Patrón sagrado idéntico a F4 judgeGrounding (con retry + escalate a gpt-4o):
//
//   1. Llamada con gpt-4o-mini (modelMini)
//   2. Validación cuántica post-call (6 checks)
//   3. Si pasa → return (caso normal, ~60-80% libros)
//   4. Si falla → escalate a gpt-4o (modelMain)
//   5. Validación cuántica de nuevo
//   6. Si pasa → return con flag escalated=true
//   7. Si falla → throw (F11 catch lo marcará csal_degraded)
//
// La firma de retorno es compatible con v1 + agrega meta info opcional:
//   { data, usage, model, escalated, escalateReason, retries, attempts }
// ═══════════════════════════════════════════════════════════════════════════════

export async function extractCSAL(openai, book, groundTruth, anchorsData, contentES, options = {}) {
  const modelMini = options.model || options.modelMini || "gpt-4o-mini";
  const modelMain = options.modelMain || "gpt-4o";
  const previousSituations = Array.isArray(options.previousSituations)
    ? options.previousSituations
    : [];

  const attempts = [];
  let cumulativeUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  // ── Intento 1: gpt-4o-mini (caso normal) ─────────────────────────────────────
  let firstError = null;
  let firstResult = null;
  try {
    firstResult = await extractCSALWithModel(
      openai, book, groundTruth, anchorsData, contentES, modelMini, previousSituations
    );

    if (firstResult.usage) {
      cumulativeUsage.prompt_tokens += firstResult.usage.prompt_tokens || 0;
      cumulativeUsage.completion_tokens += firstResult.usage.completion_tokens || 0;
      cumulativeUsage.total_tokens += firstResult.usage.total_tokens || 0;
    }

    const validation = validateCSALShape(firstResult.cleaned);
    attempts.push({ model: modelMini, valid: validation.valid, reason: validation.reason });

    if (validation.valid) {
      // ✅ Salió nivel dios con mini — caso ideal y económico
      return {
        data: firstResult.cleaned,
        usage: cumulativeUsage,
        model: firstResult.model || modelMini,
        escalated: false,
        escalateReason: null,
        attempts
      };
    }
    // No es válido: caemos al escalate
  } catch (err) {
    firstError = err;
    attempts.push({ model: modelMini, valid: false, reason: `exception: ${err.message}` });
  }

  // ── Intento 2: escalate a gpt-4o (modelo full) ───────────────────────────────
  // Triggers: validation failure ó exception (timeout/refusal/parse fail/etc.)
  let secondResult = null;
  let secondError = null;
  try {
    secondResult = await extractCSALWithModel(
      openai, book, groundTruth, anchorsData, contentES, modelMain, previousSituations
    );

    if (secondResult.usage) {
      cumulativeUsage.prompt_tokens += secondResult.usage.prompt_tokens || 0;
      cumulativeUsage.completion_tokens += secondResult.usage.completion_tokens || 0;
      cumulativeUsage.total_tokens += secondResult.usage.total_tokens || 0;
    }

    const validation2 = validateCSALShape(secondResult.cleaned);
    attempts.push({ model: modelMain, valid: validation2.valid, reason: validation2.reason });

    if (validation2.valid) {
      // ✅ Salió nivel dios con escalate
      return {
        data: secondResult.cleaned,
        usage: cumulativeUsage,
        model: secondResult.model || modelMain,
        escalated: true,
        escalateReason: attempts[0].reason,
        attempts
      };
    }
  } catch (err) {
    secondError = err;
    attempts.push({ model: modelMain, valid: false, reason: `exception: ${err.message}` });
  }

  // ── Ambos modelos fallaron — degradación elegante ────────────────────────────
  // F11 catch este throw, marca csal_degraded=true, _csal=null, allWarnings.push
  const summary = attempts.map(a => `${a.model}=${a.valid ? "ok" : "FAIL"}(${a.reason})`).join(" | ");
  throw new Error(`csal_failed_both_models: ${summary}`);
}
