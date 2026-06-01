/* ═══════════════════════════════════════════════════════════════════════════════
   voice-judge-universal.js — VOICE-JUDGE UNIVERSAL (Capa A Pilar 2)
   🌒 SPRINT NIVEL DIOS CUÁNTICO — Mayo 2026

   Extensión COMPLEMENTARIA al voice-judge.js existente (que se mantiene SAGRADO).

   El judge actual cubre solo card_es y card_en (parrafoTop/parrafoBot).
   Este módulo extiende cobertura a las 16 phrases adicionales:
     - 4 og_phrases_es + 4 og_phrases_en
     - 4 edition_blocks_es + 4 edition_blocks_en

   Total: 16 phrases nuevas evaluadas + retry específico para las que fallan.

   FILOSOFÍA ARQUITECTÓNICA:
   - Una sola pregunta semántica universal: "¿voz dentro o voz fuera del libro?"
   - SIN enumeración de patrones léxicos prohibidos
   - Si falla, retry quirúrgico de SOLO la phrase fallida con feedback de UNA línea
   - Si todo el módulo falla en runtime, el caller lo captura y degrada
     elegantemente (las cards siguen blindadas por voice-judge.js sagrado)

   API:
   - judgeOnePhraseVoice(openai, phrase, language, options) → { data, usage, model }
   - judgeAllVoiceLayers(openai, contentES, contentEN, book, options) → { consolidated, confidence, verdicts, failures, total_tokens }
   - regeneratePhrasesByFeedback(openai, anchorsData, failures, contentES, contentEN, options) → mutaciones in-place + retry
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
   judgeOnePhraseVoice
   Evalúa UNA phrase: ¿voz dentro o voz fuera del libro?
   Pregunta semántica universal, sin enumeración léxica.
────────────────────────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT_VOICE_JUDGE = `Recibirás UNA frase. Tu única tarea: clasificarla en una de dos categorías mutuamente excluyentes.

CATEGORÍA "dentro":
La frase suena como algo que el autor escribió DENTRO del libro.
Quien la lee siente que abrió una página del libro y eso fue lo que estaba ahí.
Es voz autoral en primera escritura, no descripción posterior.

CATEGORÍA "fuera":
La frase suena como alguien (crítico, editor, marketer, contraportada,
índice, capítulo, reseña, anuncio, sinopsis) hablando ACERCA DEL LIBRO desde afuera.
Quien la lee siente que está leyendo metadata, no contenido.

PRINCIPIO ÚNICO QUE APLICAS:
¿Esta frase está EN el libro o HABLA SOBRE el libro?

NO uses listas de palabras prohibidas.
NO te bases en patrones léxicos específicos.
Aplica el principio puro a cualquier frase, en cualquier idioma, sobre cualquier libro.

Devuelve JSON con exactamente: { "category": "dentro" | "fuera", "confidence": 0..1, "reason": "string 20-200 chars" }

En "reason" explica brevemente POR QUÉ es dentro o fuera, aplicando el principio.`;

export async function judgeOnePhraseVoice(openai, phrase, language, options = {}) {
  const schemas = await loadSchemas();
  const model = options.model || "gpt-4o-mini";
  const temperature = options.temperature ?? 0.1; // Consistencia, no creatividad

  const userPrompt = `Idioma de la frase: ${language === "en" ? "English" : "Español"}

Frase a evaluar:
"${phrase}"`;

  const response = await openai.chat.completions.create({
    model,
    temperature,
    messages: [
      { role: "system", content: SYSTEM_PROMPT_VOICE_JUDGE },
      { role: "user", content: userPrompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: schemas.voice_judge_universal
    }
  });

  return {
    data: safeParseJSON(response.choices?.[0]?.message?.content),
    usage: response.usage,
    model: response.model
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   judgeAllVoiceLayers
   Orquestador: evalúa las 16 phrases nuevas EN PARALELO con Promise.all.
   Latencia objetivo: ~1 segundo (vs ~3 segundos en serie).

   No evalúa cards (eso lo hace voice-judge.js SAGRADO antes).
   Tokens estimados: ~16 × 150 = ~2400 tokens. Costo ~$0.0036 por libro.
────────────────────────────────────────────────────────────────────────────── */

export async function judgeAllVoiceLayers(openai, contentES, contentEN, book, options = {}) {
  const model = options.model || "gpt-4o-mini";

  // Construcción de todos los jobs paralelos
  const jobs = [];
  const tags = []; // metadata para reasignar fallos a campos exactos

  // og_phrases_es (4)
  if (Array.isArray(contentES.og_phrases_es)) {
    for (let i = 0; i < contentES.og_phrases_es.length; i++) {
      const item = contentES.og_phrases_es[i];
      // 🚨 C3-ND v2: extraer string del objeto v12, evitar "[object Object]"
      const phrase = (typeof item === 'object' && item !== null) ? item.phrase : item;
      jobs.push(judgeOnePhraseVoice(openai, phrase, "es", { model }));
      tags.push({ field: "og_phrases_es", index: i, lang: "es", phrase });
    }
  }

  // og_phrases_en (4)
  if (Array.isArray(contentEN.og_phrases_en)) {
    for (let i = 0; i < contentEN.og_phrases_en.length; i++) {
      const item = contentEN.og_phrases_en[i];
      // 🚨 C3-ND v2: extraer string del objeto v12, evitar "[object Object]"
      const phrase = (typeof item === 'object' && item !== null) ? item.phrase : item;
      jobs.push(judgeOnePhraseVoice(openai, phrase, "en", { model }));
      tags.push({ field: "og_phrases_en", index: i, lang: "en", phrase });
    }
  }

  // edition_blocks_es[].phrase (4) — donde estaba el bug del "72 píldoras"
  if (Array.isArray(contentES.edition_blocks_es)) {
    for (let i = 0; i < contentES.edition_blocks_es.length; i++) {
      const phrase = contentES.edition_blocks_es[i].phrase;
      jobs.push(judgeOnePhraseVoice(openai, phrase, "es", { model }));
      tags.push({ field: "edition_blocks_es", index: i, lang: "es", phrase });
    }
  }

  // edition_blocks_en[].phrase (4)
  if (Array.isArray(contentEN.edition_blocks_en)) {
    for (let i = 0; i < contentEN.edition_blocks_en.length; i++) {
      const phrase = contentEN.edition_blocks_en[i].phrase;
      jobs.push(judgeOnePhraseVoice(openai, phrase, "en", { model }));
      tags.push({ field: "edition_blocks_en", index: i, lang: "en", phrase });
    }
  }

  // Ejecutar TODO en paralelo
  const results = await Promise.all(jobs);

  // Consolidar
  const verdicts = {
    es: { og_phrases: [], edition_blocks: [] },
    en: { og_phrases: [], edition_blocks: [] }
  };
  const failures = [];
  let total_tokens = 0;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const tag = tags[i];
    const verdict = result.data || {};
    total_tokens += result.usage?.total_tokens || 0;

    // Normalizar verdict
    const cat = verdict.category === "fuera" ? "fuera" : "dentro";
    const norm = {
      category: cat,
      confidence: typeof verdict.confidence === "number" ? verdict.confidence : 0.5,
      reason: verdict.reason || "(sin razón)"
    };

    // Guardar verdict en su lugar
    const langKey = tag.lang;
    const fieldShort = tag.field.includes("og") ? "og_phrases" : "edition_blocks";
    verdicts[langKey][fieldShort][tag.index] = norm;

    // Registrar failure si "fuera"
    if (cat === "fuera") {
      failures.push({
        field: tag.field,
        index: tag.index,
        lang: tag.lang,
        phrase: tag.phrase,
        reason: norm.reason,
        confidence: norm.confidence
      });
    }
  }

  const allInside = failures.length === 0;
  const totalEvaluated = results.length;
  const passRate = totalEvaluated > 0 ? (totalEvaluated - failures.length) / totalEvaluated : 1;

  return {
    consolidated: allInside ? "all_inside" : "has_outside",
    confidence: passRate,
    verdicts,
    failures,
    total_evaluated: totalEvaluated,
    total_tokens
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   regeneratePhrasesByFeedback
   Para cada failure, pedir al LLM (encarnado como autor) que reescriba la phrase
   con feedback específico del judge. Mutación IN-PLACE de contentES/contentEN.

   Después llamar judgeAllVoiceLayers de nuevo para confirmar que ahora pasen.
   Devuelve { regenerated: int, still_failing: int, total_tokens }.
────────────────────────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT_REGENERATE = `🌒 ROLE INVERSION (Sprint Nivel Dios)

Eres el autor del libro asignado. La frase que escribiste sonó a voz FUERA del libro
(contraportada, sinopsis, anuncio, descripción) en lugar de voz DENTRO del libro.

Tu trabajo: reescribir esa frase como autor escribiendo dentro de tu obra.

NO describas tu libro. NO lo cuantifiques ("X píldoras"). NO lo vendas. NO uses voz
de crítico ni de editor.

Escribe contenido del libro, no metadata sobre el libro.

Mantén:
- Mismo idioma que la frase original
- Misma longitud aproximada (±20%)
- Mismo terminador (.,?,!) si aplica
- Mismo gesture_type si la frase pertenece a edition_blocks (instruccion_sensorial,
  pregunta_directa, imagen_concreta, aforismo_autorial)

Devuelve SOLO el texto de la frase reescrita, sin comillas, sin explicación, sin newlines.`;

export async function regeneratePhrasesByFeedback(openai, anchorsData, failures, contentES, contentEN, options = {}) {
  const model = options.model || "gpt-4o-mini";
  const temperature = options.temperature ?? 0.7;
  let total_tokens = 0;
  let regenerated = 0;

  if (!Array.isArray(failures) || failures.length === 0) {
    return { regenerated: 0, still_failing: 0, total_tokens: 0 };
  }

  // Identidad para el prompt (universal a todas las regeneraciones del libro)
  const id = anchorsData?.book_identity || {};
  const author = id.autor_completo || "(autor desconocido)";

  for (const f of failures) {
    const titleForLang = f.lang === "en"
      ? (id.titulo_en || id.titulo_es || "")
      : (id.titulo_es || id.titulo_en || "");

    const userPrompt = `IDENTIDAD DE ESTA SESIÓN:
Eres ${author}, el autor que escribió "${titleForLang}".

GROUND TRUTH centrales (anchors):
${(anchorsData?.book_grounding_anchors?.concepts || []).map(c => `- ${c}`).join("\n")}

Voz autorial: ${anchorsData?.book_grounding_anchors?.authorial_voice_notes || ""}

═══════════════════════════════════════════════════════════════════
FRASE QUE ESCRIBISTE (sonó a voz FUERA):
"${f.phrase}"

RAZÓN del reviewer:
${f.reason}

CAMPO: ${f.field}${f.field.startsWith("edition_blocks") ? " (bloque " + f.index + ")" : ""}
IDIOMA: ${f.lang === "en" ? "English" : "Español"}

═══════════════════════════════════════════════════════════════════
Reescribe la frase como autor escribiendo dentro de tu obra.

🌐 IDIOMA OBLIGATORIO (REGLA SUPREMA): tu respuesta DEBE estar 100% en ${f.lang === "en" ? "INGLÉS" : "ESPAÑOL"}. Todo lo de arriba (identidad, anchors, voz) puede venir en OTRO idioma — úsalo SOLO para las IDEAS, JAMÁS para el idioma. PROHIBIDO mezclar idiomas dentro de la frase.
Devuelve SOLO la frase reescrita.`;

    try {
      const response = await openai.chat.completions.create({
        model,
        temperature,
        messages: [
          { role: "system", content: SYSTEM_PROMPT_REGENERATE },
          { role: "user", content: userPrompt }
        ]
      });

      total_tokens += response.usage?.total_tokens || 0;
      const newPhrase = (response.choices?.[0]?.message?.content || "").trim()
        .replace(/^["“'']+|["”'']+$/g, "")  // Quitar comillas externas si las puso
        .replace(/\n+/g, " ")                // Sin newlines
        .trim();

      if (!newPhrase) continue;

      // Mutación IN-PLACE
      if (f.field === "og_phrases_es" && Array.isArray(contentES.og_phrases_es)) {
        // 🚨 C3-ND v2: preservar metadata sinfónica al regenerar
        const cur = contentES.og_phrases_es[f.index];
        contentES.og_phrases_es[f.index] = (typeof cur === 'object' && cur !== null)
          ? { ...cur, phrase: newPhrase }
          : newPhrase;
        regenerated++;
      } else if (f.field === "og_phrases_en" && Array.isArray(contentEN.og_phrases_en)) {
        // 🚨 C3-ND v2: preservar metadata sinfónica al regenerar
        const cur = contentEN.og_phrases_en[f.index];
        contentEN.og_phrases_en[f.index] = (typeof cur === 'object' && cur !== null)
          ? { ...cur, phrase: newPhrase }
          : newPhrase;
        regenerated++;
      } else if (f.field === "edition_blocks_es" && Array.isArray(contentES.edition_blocks_es)) {
        contentES.edition_blocks_es[f.index].phrase = newPhrase;
        regenerated++;
      } else if (f.field === "edition_blocks_en" && Array.isArray(contentEN.edition_blocks_en)) {
        contentEN.edition_blocks_en[f.index].phrase = newPhrase;
        regenerated++;
      }
    } catch (err) {
      // Si una regeneración individual falla, seguimos con las demás
      console.log(`   ⚠ regeneratePhrase falló para ${f.field}[${f.index}]: ${err.message}`);
    }
  }

  return { regenerated, still_failing: failures.length - regenerated, total_tokens };
}