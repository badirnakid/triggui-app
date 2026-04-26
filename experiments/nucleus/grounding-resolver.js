/* ═══════════════════════════════════════════════════════════════════════════════
   grounding-resolver.js — v3.3 NIVEL DIOS

   CAMBIO v3.3 (2026-04-26): cada tier retorna `evidence` además de los demás
   campos. Esto permite que build-contenido-nucleus.js acceda a las portadas
   válidas (valid_covers) aunque el grounding caiga a Tier 3 (model_inference).

   ANTES: si scoreMatch < 0.55 → tier 3 → portadas se descartaban → SVG fallback.
   AHORA: las portadas válidas (>0) se usan independientemente del tier alcanzado.

   MUCHO más delgado que v3.1 porque evidence-fetcher.js hace el trabajo de APIs.
   Responsabilidad ÚNICA: decidir qué tier alcanzamos y construir ground_truth.

   CASCADA v3.3:
     Tier 1  — Curator (book_context del usuario)           → trust 1.0
     Tier 1.5— Identity sealed (validate-book eligió libro) → trust 0.95
     Tier 2  — Evidence fetcher (Apple+Google+OL+Amazon)    → trust 0.75-0.95
     Tier 3  — Model inference desde similares              → trust 0.3-0.7
     Tier 4  — Ciego con warning                            → trust 0.2

   Todos los tiers (excepto Tier 1 puro curador) retornan `evidence` cuando existe,
   para que el caller pueda rescatar portadas válidas del evidence-cache.
═══════════════════════════════════════════════════════════════════════════════ */

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fetchEvidence, buildGroundTruthFromEvidence } from "./evidence-fetcher.js";

const CACHE_DIR = "grounding-cache";
const CACHE_TTL_DAYS = 30;

function bookHash(titulo, autor) {
  return createHash("sha256").update(`${titulo}|${autor}`.toLowerCase().trim()).digest("hex").slice(0, 16);
}

async function readCache(hash) {
  try {
    const p = path.join(CACHE_DIR, `${hash}.json`);
    const raw = await fs.readFile(p, "utf8");
    const cached = JSON.parse(raw);
    const ageDays = (Date.now() - new Date(cached.cached_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > CACHE_TTL_DAYS) return null;
    return cached;
  } catch { return null; }
}

async function writeCache(hash, data) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const p = path.join(CACHE_DIR, `${hash}.json`);
    // 🌒 v3.3: NO cacheamos `evidence` dentro de grounding-cache porque ya vive
    // en evidence-cache (single source of truth). Stripeamos antes de escribir.
    const { evidence, ...cacheable } = data;
    await fs.writeFile(p, JSON.stringify({ ...cacheable, cached_at: new Date().toISOString() }, null, 2), "utf8");
  } catch (err) {
    console.warn(`   ⚠ Grounding cache write failed: ${err.message}`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   TIER 3 — Inferencia desde libros similares
────────────────────────────────────────────────────────────────────────────── */

const INFERENCE_SCHEMA = {
  name: "BookInference",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["book_known_directly", "similar_books", "inferred_theme", "inferred_voice", "inference_confidence"],
    properties: {
      book_known_directly: { type: "boolean" },
      similar_books: {
        type: "array",
        minItems: 2,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["titulo", "autor", "razon"],
          properties: {
            titulo: { type: "string", minLength: 2, maxLength: 100 },
            autor: { type: "string", minLength: 2, maxLength: 80 },
            razon: { type: "string", minLength: 20, maxLength: 200 }
          }
        }
      },
      inferred_theme: { type: "string", minLength: 80, maxLength: 500 },
      inferred_voice: { type: "string", minLength: 60, maxLength: 300 },
      inference_confidence: { type: "number", minimum: 0, maximum: 1 }
    }
  }
};

async function inferFromSimilar(openai, titulo, autor, tagline) {
  const systemPrompt = `Eres un experto en literatura que ayuda a identificar libros poco conocidos.

Cuando te dan un libro que no conoces directamente, tu trabajo es:
1. Evaluar honestamente si conoces ESTE libro específico (book_known_directly).
2. Listar 2-5 libros conocidos que compartan tema/voz/época con el libro buscado, basado en título y autor.
3. Inferir el tema probable del libro desconocido basándote en esos similares.
4. Inferir la voz probable del autor.
5. Reportar inference_confidence honesta.

NUNCA inventes "este libro dice X". Solo describes tema y voz probable basado en similares.
Siempre en español.`;

  const userPrompt = `Libro buscado:
Título: "${titulo}"
Autor: ${autor}${tagline ? `\nContexto editorial: "${tagline}"` : ""}

¿Conoces ESTE libro específico? Si no, lista libros similares que conozcas y infiere el tema/voz probable.`;

  try {
    const chat = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_schema", json_schema: INFERENCE_SCHEMA }
    });

    let parsed = {};
    try { parsed = JSON.parse(chat.choices[0]?.message?.content || "{}"); } catch { parsed = {}; }

    const similarBooks = Array.isArray(parsed.similar_books) ? parsed.similar_books : [];
    const inferenceConfidence = typeof parsed.inference_confidence === "number" ? parsed.inference_confidence : 0;
    const bookKnownDirectly = typeof parsed.book_known_directly === "boolean" ? parsed.book_known_directly : false;
    const inferredTheme = typeof parsed.inferred_theme === "string" ? parsed.inferred_theme : "";
    const inferredVoice = typeof parsed.inferred_voice === "string" ? parsed.inferred_voice : "";

    if (similarBooks.length === 0 || !inferredTheme) {
      return { found: false, reason: "inference_shape_invalid" };
    }

    const similares = similarBooks.map((b) => `- "${b?.titulo || "?"}" (${b?.autor || "?"}): ${b?.razon || "?"}`).join("\n");
    const synopsis = `TEMA INFERIDO (el modelo no conoce este libro directamente, infiere desde similares):\n\n${inferredTheme}\n\nVOZ INFERIDA:\n${inferredVoice}\n\nLIBROS SIMILARES QUE COMPARTEN ADN CON ESTE:\n${similares}`;

    return {
      found: true,
      source: "model_inference",
      book_known_directly: bookKnownDirectly,
      inference_confidence: inferenceConfidence,
      similar_books: similarBooks,
      synopsis,
      tokens: chat.usage?.total_tokens || 0
    };
  } catch (err) {
    return { found: false, reason: `inference_failed_${err.message.slice(0, 80)}` };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   RESOLVER PRINCIPAL v3.3 — TODOS LOS TIERS RETORNAN `evidence` SI EXISTE
────────────────────────────────────────────────────────────────────────────── */

export async function resolveGrounding(openai, book, inputs = {}) {
  const titulo = String(book.titulo || "").trim();
  const autor = String(book.autor || "").trim();
  const bookContext = String(inputs.bookContext || "").trim();
  const identitySealed = Boolean(inputs.identitySealed || book.selected_via);

  const hash = bookHash(titulo, autor);

  // ═══ TIER 1: CURADOR
  // 🌒 v3.3: incluso en tier 1 retornamos evidence si está pre-cargada en book._evidence
  // (ej: validate-book ya llamó a fetchEvidence). Si no hay, evidence: null.
  if (bookContext.length >= 100) {
    const result = {
      ground_truth: `CONTEXTO DEL CURADOR (máxima autoridad):\n\n${bookContext}`,
      grounding_source: "curator",
      book_identity_confidence: 1.0,
      verified_identity: { titulo_real: titulo, autor_completo: autor, año: null },
      resolution_path: ["tier1_curator"],
      tier_reached: 1,
      cost_tokens: 0,
      evidence: book._evidence || null  // 🌒 v3.3: pasar evidence si existe
    };
    console.log(`   🎯 Tier 1: CURADOR (${bookContext.length} chars)`);
    return result;
  }

  // Cache hit
  // 🌒 v3.3: aunque haya cache hit del grounding, siempre traer evidence fresca
  // del evidence-cache (que es independiente y tiene su propio TTL). Esto evita
  // perder portadas si el grounding-cache fue creado antes del fix v3.3.
  const cached = await readCache(hash);
  if (cached && cached.grounding_source !== "curator") {
    console.log(`   💾 Grounding cache hit: ${cached.grounding_source} (trust ${cached.book_identity_confidence.toFixed(2)})`);
    // Cargar evidence (cache hit interno o fetch nuevo)
    const evidence = book._evidence || await fetchEvidence(book);
    return {
      ...cached,
      from_cache: true,
      resolution_path: [`cache_${cached.grounding_source}`],
      evidence  // 🌒 v3.3: pasar evidence fresca al caller
    };
  }

  const resolutionPath = [];

  // ═══ EVIDENCE FETCH
  let evidence;
  if (book._evidence) {
    evidence = book._evidence;
    resolutionPath.push("evidence_preloaded");
    console.log(`   ⚡ Evidence precargada (${evidence._sources_succeeded?.length || 0} sources)`);
  } else {
    evidence = await fetchEvidence(book);
    resolutionPath.push(`evidence_fetched_${evidence._sources_succeeded?.length || 0}sources`);
  }

  // ═══ TIER 1.5: IDENTITY SEALED
  if (identitySealed) {
    const gt = buildGroundTruthFromEvidence(evidence);
    if (gt && gt.match_score >= 0.5) {
      const result = {
        ground_truth: `LIBRO SELECCIONADO POR EL CURADOR AUTOMÁTICO:\nTítulo: ${titulo}\nAutor: ${autor}\n\n${gt.ground_truth}`,
        grounding_source: "identity_sealed_with_evidence",
        book_identity_confidence: 0.95,
        verified_identity: {
          titulo_real: titulo,
          autor_completo: autor,
          año: gt.verified_identity?.año || null,
          editorial: gt.verified_identity?.editorial || null,
          categorias: gt.verified_identity?.categorias || []
        },
        match_score: gt.match_score,
        evidence_source: gt.source,
        other_sources_agreed: gt.other_sources_agreed || [],
        resolution_path: resolutionPath,
        tier_reached: 1.5,
        cost_tokens: 0,
        evidence  // 🌒 v3.3
      };
      console.log(`   🔒 Tier 1.5: IDENTITY SEALED + ${gt.source} (match ${gt.match_score.toFixed(2)})`);
      await writeCache(hash, result);
      return result;
    }
    console.log(`   ⚠ Identity sealed pero sin evidence match, fallback a inferencia`);
  }

  // ═══ TIER 2: EVIDENCE
  const gt = buildGroundTruthFromEvidence(evidence);
  if (gt && gt.match_score >= 0.55) {
    const result = {
      ground_truth: gt.ground_truth,
      grounding_source: gt.source,
      book_identity_confidence: gt.confidence,
      verified_identity: gt.verified_identity,
      match_score: gt.match_score,
      other_sources_agreed: gt.other_sources_agreed,
      resolution_path: resolutionPath,
      tier_reached: 2,
      cost_tokens: 0,
      evidence  // 🌒 v3.3
    };
    console.log(`   ✅ Tier 2: ${gt.source} match=${gt.match_score.toFixed(2)}`);
    await writeCache(hash, result);
    return result;
  }

  // ═══ TIER 3: INFERENCIA
  console.log(`   🧠 Tier 3: Model inference...`);
  const inf = await inferFromSimilar(openai, titulo, autor, book.tagline);
  resolutionPath.push(`tier3_${inf.found ? `conf_${inf.inference_confidence?.toFixed(2)}` : "failed"}`);
  if (inf.found && inf.inference_confidence >= 0.4) {
    const tier = inf.book_known_directly ? 2.5 : 3;
    const richInference = Array.isArray(inf.similar_books) && inf.similar_books.length >= 4;
    let penaltyMultiplier;
    if (inf.book_known_directly) penaltyMultiplier = 0.85;
    else if (richInference) penaltyMultiplier = 0.75;
    else penaltyMultiplier = 0.55;

    const result = {
      ground_truth: inf.synopsis,
      grounding_source: "model_inference",
      book_identity_confidence: inf.inference_confidence * penaltyMultiplier,
      verified_identity: { titulo_real: titulo, autor_completo: autor, año: null },
      inference_confidence: inf.inference_confidence,
      book_known_directly: inf.book_known_directly,
      rich_inference: richInference,
      similar_books: inf.similar_books,
      resolution_path: resolutionPath,
      tier_reached: tier,
      cost_tokens: inf.tokens,
      evidence  // 🌒 v3.3 — CRÍTICO: aunque el grounding cayó a inferencia,
                //         las portadas de Apple/Google/OL/Amazon siguen siendo válidas.
                //         build-contenido-nucleus.js puede rescatarlas vía selectBestCover(evidence).
    };
    console.log(`   ✓ Inferencia: known=${inf.book_known_directly}, conf=${inf.inference_confidence.toFixed(2)}, rich=${richInference}`);
    await writeCache(hash, result);
    return result;
  }

  // ═══ TIER 4: CIEGO
  console.log(`   ⚠ Tier 4: CIEGO`);
  return {
    ground_truth: `SIN FUENTE AUTORITATIVA. El modelo no reconoce este libro y las APIs públicas no lo encontraron. Opera con lo que sea plausible dado título y autor, pero reconoce incertidumbre.`,
    grounding_source: "unsupported",
    book_identity_confidence: 0.2,
    verified_identity: { titulo_real: titulo, autor_completo: autor, año: null },
    resolution_path: [...resolutionPath, "tier4_blind"],
    tier_reached: 4,
    warning: "Este libro no pudo ser verificado. Considera agregar book_context manual.",
    cost_tokens: 0,
    evidence  // 🌒 v3.3 — incluso en tier 4 ciego, si por casualidad alguna API
              //         devolvió portada (raro pero posible), úsala.
  };
}