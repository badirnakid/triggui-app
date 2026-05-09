/* ═══════════════════════════════════════════════════════════════════════════════
   csal-extractor.js — CSAL EXTRACTOR (Capa B Sprint Nivel Dios Cuántico)
   🌒 Mayo 2026

   CSAL = Concept Surface Area del Libro

   Genera la "superficie semántica" de cada libro: las puertas por las que un
   humano cualquiera podría llegar a la obra desde su vida real.

   Una sola llamada LLM por libro (gpt-4o-mini, ~5,000 tokens).
   Costo: ~$0.0017 por libro. En batch de 20: ~$0.034.
   Catálogo completo (226 libros): ~$0.38 USD una vez.

   Output (validado por schema strict csal_extraction):
     - trigger_situations  (30-50 frases naturales del usuario)
     - trigger_keywords    (4 categorías: emociones, objetos, contextos, verbos)
     - concept_tags        (10-25 tags ESPECÍFICOS al libro)
     - anti_patterns       (3-12 dominios para los que la obra NO sirve)
     - bloques             (4 emoji_specific, uno por edition_block)

   Anti-contaminación batch via globalThis.__TRIGGUI_BATCH_TRIGGER_SITUATIONS__
   Patrón paralelo a __TRIGGUI_BATCH_HUES__ del extractAnchors.

   ROLE INVERSION: el LLM se encarna como AUTOR del libro (no como IA describiendo
   un libro). System prompt UNIVERSAL, user prompt inyecta identidad concreta.

   API:
     extractCSAL(openai, book, groundTruth, anchorsData, contentES, options) →
       { data, usage, model }
═══════════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs/promises";

const SCHEMA_URL = new URL("./edition-nucleus.schema.json", import.meta.url);

async function loadSchemas() {
  return JSON.parse(await fs.readFile(SCHEMA_URL, "utf8"));
}

function safeParseJSON(raw) {
  if (!raw || typeof raw !== "string") return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

/* ─────────────────────────────────────────────────────────────────────────────
   SYSTEM PROMPT — UNIVERSAL (no menciona libro específico)
   La identidad concreta se inyecta en el user prompt.
────────────────────────────────────────────────────────────────────────────── */

const CSAL_SYSTEM_PROMPT = `🌒 SPRINT NIVEL DIOS — ROLE INVERSION

Para esta llamada NO eres una IA describiendo contenido editorial.
ERES el autor del libro asignado en este turno (la identidad concreta te la da
el USER PROMPT — léela primero).

Tu trabajo: identificar la SUPERFICIE SEMÁNTICA de tu obra — las puertas por
las que un humano cualquiera podría llegar a tu libro desde su vida real.

Hay personas afuera del libro con frustraciones, alegrías, dudas, situaciones
cotidianas. Tu trabajo es identificar QUÉ situaciones humanas reales conecta
tu obra. NO categorías abstractas. Situaciones concretas escritas como las
escribiría una persona real buscando algo.

═══════════════════════════════════════════════════════════════════
DEVOLVERÁS 5 SECCIONES
═══════════════════════════════════════════════════════════════════

1. TRIGGER_SITUATIONS (30-50)
   Situaciones humanas universales en las que tu obra responde.
   Escritas en lenguaje natural, como las escribiría una persona común
   buscando algo (NO como las escribirías tú dentro del libro).
   Forma típica: "cuando X" o "antes de Y" o "después de Z".

   Cada trigger_situation debe ser:
   - Específica a tu obra (no aplicable a cualquier libro)
   - Universal en su lenguaje (un humano cualquiera la escribiría así)
   - Escrita desde la perspectiva del usuario, NO del libro

2. TRIGGER_KEYWORDS (4 categorías obligatorias)
   Palabras que esa persona usaría al escribir sobre su situación.
   INCLUYE variantes regionales y coloquiales en español mexicano y en
   inglés americano cuando tu obra tenga audiencia bilingüe.

   - emociones (10-30): emociones humanas que tu obra toca
   - objetos (5-25): cosas físicas o conceptuales presentes
   - contextos (5-25): lugares, momentos, escenas
   - verbos (5-25): acciones que vive la persona

3. CONCEPT_TAGS (10-25)
   Conceptos ESPECÍFICOS a tu obra. Si lees solo estos tags, sin saber
   el título, deberías reconocer tu obra.

   PROHIBIDO ABSOLUTO:
   - Tags genéricos de género: "filosofía oriental", "auto-ayuda",
     "mindfulness", "psicología popular"
   - Categorías de marketing
   - Términos que aplicarían a 10 libros distintos del mismo género

4. ANTI_PATTERNS (3-12)
   Situaciones para las que tu obra NO sirve. Sé honesto.
   Tu libro no es para todo. Ejemplos de DOMINIOS opuestos:
   - "presupuesto familiar"
   - "tutorial técnico de software"
   - "manual de programación"
   - "nutrición deportiva"

5. BLOQUES (exactamente 4)
   Para cada uno de los 4 edition_blocks que ya generaste,
   asigna un emoji_specific que conecte CON SU PHRASE ESPECÍFICA y
   con tu obra.

   PROHIBIDO: emojis genéricos como 📘 ✨ 💡 🌟 ❤️.
   PERMITIDO: emojis que SI se cambian de libro pierden sentido.

   Ejemplos por libro (no copiar — referencia del PRINCIPIO):
   - Libro de filosofía japonesa con kimono y té: 🪷 🍵 🎋 👘
   - Libro de estrategia política antigua: ⚔️ 🦂 ♟️ 👑
   - Libro sobre encontrar sentido en sufrimiento: 🕯️ 🪦 🪟 ☘️
   - Libro de hábitos diarios: 🧱 🌱 ⏱️ 🪜

═══════════════════════════════════════════════════════════════════
PROTOCOLO DE AUTO-VALIDACIÓN ANTES DE DEVOLVER
═══════════════════════════════════════════════════════════════════

Antes de devolver el JSON, autoexamen:

1. ¿Mis trigger_situations las podría escribir un humano real
   buscando algo? ¿O suenan a clasificación académica?

2. ¿Mis concept_tags identifican mi obra ESPECÍFICAMENTE o podrían
   aplicar a otros libros del mismo género?

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

/* ─────────────────────────────────────────────────────────────────────────────
   USER PROMPT BUILDER — DINÁMICO (inyecta identidad concreta)
────────────────────────────────────────────────────────────────────────────── */

function buildIdentityLineCSAL(anchorsData) {
  const id = anchorsData?.book_identity || {};
  const author = id.autor_completo || "";
  const title = id.titulo_es || id.titulo_en || "";

  if (!author || !author.trim()) {
    return `Eres la voz autorial de "${title}", escribiendo desde su época y contexto.`;
  }
  const lower = author.toLowerCase();
  const isCollective = /\b(varios|various|vv\.\s*aa|colectivo|anonymous|anónimo|autores)\b/i.test(lower);
  if (isCollective) {
    return `Eres la voz colectiva de "${title}", la sensibilidad común de quienes la escribieron.`;
  }
  return `Eres ${author}, el autor que escribió "${title}".`;
}

function csalUserPrompt(book, groundTruth, anchorsData, contentES, previousSituations = []) {
  const identityLine = buildIdentityLineCSAL(anchorsData);
  const concepts = (anchorsData?.book_grounding_anchors?.concepts || []).map(c => `- ${c}`).join("\n");
  const voiceNotes = anchorsData?.book_grounding_anchors?.authorial_voice_notes || "";

  const blocks = Array.isArray(contentES?.edition_blocks_es) ? contentES.edition_blocks_es : [];
  const blockPhrases = blocks.map((b, i) =>
    `Bloque ${i} (${b.gesture_type}, sensory: ${b.sensory_anchor}): "${b.phrase}"`
  ).join("\n");

  let prompt = `🌒 IDENTIDAD DE ESTA SESIÓN:
${identityLine}

VOZ AUTORIAL: ${voiceNotes}

═══════════════════════════════════════════════════════════════════
GROUND TRUTH (lo que TÚ escribiste):
${groundTruth}

═══════════════════════════════════════════════════════════════════
CONCEPTOS CENTRALES de tu obra:
${concepts}

═══════════════════════════════════════════════════════════════════
TUS 4 EDITION_BLOCKS YA GENERADOS (para que el emoji_specific de cada uno
conecte con SU phrase, no con tu libro en general):

${blockPhrases}`;

  // Anti-contaminación batch: si hay situations previas en el batch, mostrarlas
  // para que el LLM no las repita
  if (Array.isArray(previousSituations) && previousSituations.length > 0) {
    const sample = previousSituations.slice(-15);  // últimas 15 para no saturar
    prompt += `

═══════════════════════════════════════════════════════════════════
TRIGGER_SITUATIONS YA USADAS EN ESTE BATCH (NO REPETIR):
${sample.map(s => `- "${s}"`).join("\n")}

Tus trigger_situations DEBEN ser distintas a estas. Cada libro del catálogo
merece su propio set único de puertas semánticas.`;
  }

  prompt += `

═══════════════════════════════════════════════════════════════════
Ahora identifica la superficie semántica completa de tu obra.

Devuelve JSON con: trigger_situations + trigger_keywords + concept_tags +
anti_patterns + bloques (4 con emoji_specific por libro).

Aplica el PROTOCOLO DE AUTO-VALIDACIÓN antes de devolver.`;

  return prompt;
}

/* ─────────────────────────────────────────────────────────────────────────────
   extractCSAL — entrada principal del módulo
────────────────────────────────────────────────────────────────────────────── */

export async function extractCSAL(openai, book, groundTruth, anchorsData, contentES, options = {}) {
  const schemas = await loadSchemas();
  const model = options.model || "gpt-4o-mini";
  const temperature = options.temperature ?? 0.7;
  const previousSituations = Array.isArray(options.previousSituations)
    ? options.previousSituations
    : [];

  const response = await openai.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: "system", content: CSAL_SYSTEM_PROMPT },
      { role: "user", content: csalUserPrompt(book, groundTruth, anchorsData, contentES, previousSituations) }
    ],
    response_format: {
      type: "json_schema",
      json_schema: schemas.csal_extraction
    }
  });

  return {
    data: safeParseJSON(response.choices?.[0]?.message?.content),
    usage: response.usage,
    model: response.model
  };
}