/* ═══════════════════════════════════════════════════════════════════════════════
   build-contenido-nucleus.js — ORQUESTADOR v3 NIVEL DIOS

   Pipeline de 8 fases:
     F0  grounding-resolver          (curator / api / inference / blind)
     F1  extractAnchors               (1 llamada LLM)
     F2  synthesizePalette            (determinista, matemático)
     F3  extractContentES             (1 llamada LLM)
     F4  judgeGrounding ES            (1 llamada LLM)
     F5  extractContentEN             (1 llamada LLM)
     F6  judgeGrounding EN            (1 llamada LLM)
     F7  voice-judge                  (1 llamada LLM, existente)
     F8  emoji-inject + confidence + compat-map + validator + report

   Retry policy:
     - Cada LLAMADA individual tiene retry con backoff
     - Si grounding_judge < 0.6, re-extract content con temp 0.4
     - Si el content sigue bajo, escalar a gpt-4o solo esa llamada
     - Nunca aborta: si todo falla, emite con _quality_warning prominente
═══════════════════════════════════════════════════════════════════════════════ */

import fs from "node:fs/promises";
import path from "node:path";
import { randomInt, createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import OpenAI from "openai";

import { resolveGrounding } from "./grounding-resolver.js";
import {
  extractAnchors,
  extractContentES,
  extractContentEN,
  judgeGrounding,
  cronobioContext
} from "./extractors.js";
import { synthesizePalette } from "./palette-synthesizer.js";
import { injectEmojis, calculateConfidence, compatMapper } from "./post-processors.js";
import { judgeBothVoices } from "./voice-judge.js";
import { validateFinalNucleus } from "./quality-validator.js";
import { generateFallbackCover } from "./typographic-cover.js";

const KEY = process.env.OPENAI_KEY;
if (!KEY) { console.log("🔕 Sin OPENAI_KEY"); process.exit(0); }
const openai = new OpenAI({ apiKey: KEY });

const CFG = {
  modelMini: process.env.TRIGGUI_MODEL || "gpt-4o-mini",
  modelBig: process.env.TRIGGUI_MODEL_BIG || "gpt-4o",
  temperature: Number(process.env.TRIGGUI_TEMP || 0.7),
  files: {
    csv: "data/libros_master.csv",
    outBatch: "contenido.json",
    outShadow: "contenido.shadow.json",
    outSingle: "contenido_edicion.json",
    tmpBook: "/tmp/triggui-book.json",
    metricsDir: "metrics",
    inputsHistoryDir: "inputs-history",
    reportsDir: "quality-reports"
  },
  maxBatch: 20,
  delayMs: 4000,
  shadowMode: process.env.SHADOW_MODE === "true",
  cronoEnabled: process.env.TRIGGUI_CRONO_ENABLED !== "false",
  groundingJudgeMinScore: Number(process.env.TRIGGUI_JUDGE_MIN || 0.55)
};

const INPUTS = {
  lens: process.env.TRIGGUI_LENS || "",
  visualIntent: process.env.TRIGGUI_VISUAL_INTENT || "",
  bookContext: process.env.TRIGGUI_BOOK_CONTEXT || ""
};

/* ─────────────────────────────────────────────────────────────────────────────
   UTILIDADES
────────────────────────────────────────────────────────────────────────────── */

async function fileExists(p) { try { await fs.access(p); return true; } catch { return false; } }
// writeJSON v3.2: escritura ATÓMICA. Escribe a .tmp primero, luego rename.
// En POSIX, rename dentro del mismo filesystem es atómico: o ves el archivo
// viejo, o ves el archivo nuevo, nunca uno a medias. Evita contenido.json
// corrupto si el proceso muere mid-write.
async function writeJSON(p, data) {
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}`;
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, p);
}

// Defensa total: acepta cualquier cosa y devuelve string formateada. Nunca trona.
function fmt(value, decimals = 2) {
  if (value === null || value === undefined) return "n/a";
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "n/a";
  return num.toFixed(decimals);
}

// safeJSONParse v3.2: defensivo contra BOM UTF-8, whitespace, vacío, y JSON inválido.
// String.prototype.trim() elimina el BOM (U+FEFF) porque JS lo considera whitespace.
// Retorna { ok: bool, data: any, reason: string } para que el caller sepa qué pasó.
function safeJSONParse(raw, fallback = {}) {
  if (raw === null || raw === undefined) {
    return { ok: false, data: fallback, reason: "null_or_undefined" };
  }
  const str = String(raw).trim();
  if (!str) {
    return { ok: false, data: fallback, reason: "empty_or_whitespace" };
  }
  try {
    return { ok: true, data: JSON.parse(str), reason: "parsed" };
  } catch (err) {
    return { ok: false, data: fallback, reason: `parse_error: ${err.message.slice(0, 120)}` };
  }
}

// Valida que un objeto tenga las propiedades esperadas, en profundidad. Si falla, lanza error claro.
function assertShape(obj, paths, label) {
  if (!obj || typeof obj !== "object") {
    throw new Error(`${label} devolvió objeto inválido (null/undefined/non-object)`);
  }
  for (const p of paths) {
    const parts = p.split(".");
    let cur = obj;
    for (const part of parts) {
      if (cur === null || cur === undefined) {
        throw new Error(`${label} shape inválido: falta "${p}" — recibido ${JSON.stringify(obj).slice(0, 300)}`);
      }
      cur = cur[part];
    }
    if (cur === null || cur === undefined) {
      throw new Error(`${label} shape inválido: "${p}" es null/undefined — recibido ${JSON.stringify(obj).slice(0, 300)}`);
    }
  }
}

function seededRandomInt(seed, counter) {
  return createHash("sha256").update(`${seed}:${counter}`).digest().readUInt32BE(0);
}
function fisherYatesShuffle(arr, seed = null) {
  const copy = [...arr];
  if (seed === null) {
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = randomInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  let counter = 0;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = seededRandomInt(seed, counter++) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function retryOnce(fn, label) {
  try { return await fn(); }
  catch (err) {
    console.log(`   ⚠ ${label} falló (${err.message.slice(0, 80)}), reintentando...`);
    await new Promise((r) => setTimeout(r, 1500));
    return await fn();
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   PROCESO DE UN LIBRO — pipeline completo de 8 fases
────────────────────────────────────────────────────────────────────────────── */

async function processBook(book, inputs, inputsSnapshot) {
  const t0 = Date.now();
  const crono = CFG.cronoEnabled ? cronobioContext() : cronobioContext(new Date());
  const tokensByPhase = {};
  const elapsedByPhase = {};
  const modelsUsed = new Set();
  let llmCallsCount = 0;

  console.log(`\n📖 ${book.titulo} — ${book.autor}`);

  // ═══ F0: GROUNDING ═════════════════════════════════════════════════
  const tF0 = Date.now();
  // v3.2 FUSIÓN: pasar identity_sealed y _evidence precargada si vienen de validate-book
  const groundTruthMeta = await resolveGrounding(openai, book, {
    bookContext: inputs.bookContext,
    identitySealed: Boolean(book.identity_sealed)
  });
  elapsedByPhase.grounding = Date.now() - tF0;
  tokensByPhase.grounding = groundTruthMeta.cost_tokens || 0;
  if (groundTruthMeta.cost_tokens) llmCallsCount += 1;

  if (groundTruthMeta.grounding_source === "unsupported") {
    console.log(`   ⚠⚠⚠ GROUNDING UNSUPPORTED — procediendo con disclaimer`);
  } else if (groundTruthMeta.grounding_source === "model_inference") {
    console.log(`   🧠 Grounding: inferencia (confianza ${fmt(groundTruthMeta.book_identity_confidence)})`);
  } else if (groundTruthMeta.grounding_source === "google_books") {
    console.log(`   ✅ Grounding: Google Books (match ${fmt(groundTruthMeta.match_score)})`);
  } else if (groundTruthMeta.grounding_source === "apple_books") {
    console.log(`   ✅ Grounding: Apple Books (match ${fmt(groundTruthMeta.match_score)})`);
  } else if (groundTruthMeta.grounding_source === "openlibrary") {
    console.log(`   ✅ Grounding: OpenLibrary (match ${fmt(groundTruthMeta.match_score)})`);
  } else if (groundTruthMeta.grounding_source === "identity_sealed_with_evidence") {
    console.log(`   🔒 Grounding: Identity sealed + ${groundTruthMeta.evidence_source} (match ${fmt(groundTruthMeta.match_score)})`);
  } else {
    console.log(`   ✅ Grounding: ${groundTruthMeta.grounding_source}`);
  }

  // ═══ F1: ANCHORS + VISUAL INTENT ════════════════════════════════════
  const tF1 = Date.now();
  const anchorsRes = await retryOnce(
    () => extractAnchors(openai, book, groundTruthMeta.ground_truth, inputs.lens, { model: CFG.modelMini }),
    "extractAnchors"
  );
  elapsedByPhase.anchors = Date.now() - tF1;
  tokensByPhase.anchors = anchorsRes.usage?.total_tokens || 0;
  modelsUsed.add(anchorsRes.model || CFG.modelMini);
  llmCallsCount += 1;
  const anchorsData = anchorsRes.data;
  assertShape(anchorsData, [
    "book_identity.titulo_es",
    "book_identity.titulo_en",
    "book_identity.autor_completo",
    "book_grounding_anchors.concepts",
    "book_grounding_anchors.key_terms",
    "visual_intent.hue_primary",
    "visual_intent.palette_strategy",
    "surface_hints.dimension"
  ], "extractAnchors");

  console.log(`   ⚓ Anchors: ${anchorsData.book_grounding_anchors.concepts.slice(0, 2).map((c) => c.slice(0, 45)).join(" | ")}`);
  console.log(`   📘 Identity: "${anchorsData.book_identity.titulo_en}" | autor="${anchorsData.book_identity.autor_completo}"`);
  console.log(`   🎨 Visual: hue=${anchorsData.visual_intent.hue_primary}, sat=${anchorsData.visual_intent.saturation}, strategy=${anchorsData.visual_intent.palette_strategy}`);

  // ═══ F2: PALETTE SYNTHESIS (determinista) ═══════════════════════════
  const tF2 = Date.now();
  const palette = synthesizePalette(anchorsData.visual_intent);
  elapsedByPhase.palette = Date.now() - tF2;
  tokensByPhase.palette = 0;
  console.log(`   🎨 Paleta: paper=${palette.paper} accent=${palette.accent} contrast=${palette.contrast_ratio}:1`);

  // ═══ F2.5: SVG FALLBACK si no hay portada ═══════════════════════════
  // v3.2 FUSIÓN: si ninguna API tuvo portada válida, generar SVG tipográfico
  // usando la paleta sintetizada + visual_intent. Coherencia visual total.
  const tF2b = Date.now();
  const hasValidCover = Boolean(book.portada_url || book.portada);
  if (!hasValidCover || book.needs_fallback_cover) {
    const fallback = generateFallbackCover(
      { titulo: book.titulo, autor: book.autor },
      palette,
      anchorsData.visual_intent
    );
    book.portada = fallback.data_uri;
    book.portada_url = fallback.data_uri;
    book.portada_source = "typographic_svg_fallback";
    book.portada_fallback_generated = true;
    book.portada_fallback_size_kb = Math.round(fallback.size_uri_bytes / 1024);
    console.log(`   🎨 SVG fallback generado: ${book.portada_fallback_size_kb}KB (paleta+tipografía de la card)`);
  }
  elapsedByPhase.cover_fallback = Date.now() - tF2b;

  // ═══ F3: CONTENIDO ES ═══════════════════════════════════════════════
  const tF3 = Date.now();
  let contentESRes = await retryOnce(
    () => extractContentES(openai, book, groundTruthMeta.ground_truth, anchorsData, inputs.lens, { model: CFG.modelMini, temperature: 0.7, crono }),
    "extractContentES"
  );
  elapsedByPhase.content_es = Date.now() - tF3;
  tokensByPhase.content_es = contentESRes.usage?.total_tokens || 0;
  modelsUsed.add(contentESRes.model || CFG.modelMini);
  llmCallsCount += 1;
  const contentES = contentESRes.data;
  assertShape(contentES, [
    "card_es.titulo", "card_es.parrafoTop", "card_es.subtitulo", "card_es.parrafoBot",
    "emotional_words_es", "og_phrases_es", "edition_blocks_es"
  ], "extractContentES");

  // ═══ F4: GROUNDING JUDGE ES ═════════════════════════════════════════
  const tF4 = Date.now();
  let judgeESRes = await retryOnce(
    () => judgeGrounding(openai, groundTruthMeta.ground_truth, contentES, { model: CFG.modelMini }),
    "judgeGroundingES"
  );
  elapsedByPhase.judge_es = Date.now() - tF4;
  tokensByPhase.judge_es = judgeESRes.usage?.total_tokens || 0;
  modelsUsed.add(judgeESRes.model || CFG.modelMini);
  llmCallsCount += 1;
  let judgeES = judgeESRes.data;
  assertShape(judgeES, ["grounded_score", "could_apply_to_any_book", "reason"], "judgeGroundingES");
  console.log(`   👨‍⚖️ Judge ES: score=${fmt(judgeES.grounded_score)}, generic=${judgeES.could_apply_to_any_book}`);

  // Si el judge dice contenido genérico, re-extract con temp baja
  if (judgeES.grounded_score < CFG.groundingJudgeMinScore || judgeES.could_apply_to_any_book) {
    console.log(`   🔁 Re-extract ES (score ${fmt(judgeES.grounded_score)} < ${CFG.groundingJudgeMinScore})`);
    const tR3 = Date.now();
    contentESRes = await retryOnce(
      () => extractContentES(openai, book, groundTruthMeta.ground_truth, anchorsData, inputs.lens, { model: CFG.modelMini, temperature: 0.4, crono }),
      "extractContentES_retry"
    );
    elapsedByPhase.content_es_retry = Date.now() - tR3;
    tokensByPhase.content_es_retry = contentESRes.usage?.total_tokens || 0;
    llmCallsCount += 1;

    const judgeRetryRes = await retryOnce(
      () => judgeGrounding(openai, groundTruthMeta.ground_truth, contentESRes.data, { model: CFG.modelMini }),
      "judgeGroundingES_retry"
    );
    tokensByPhase.judge_es_retry = judgeRetryRes.usage?.total_tokens || 0;
    llmCallsCount += 1;
    judgeES = judgeRetryRes.data;
    assertShape(judgeES, ["grounded_score"], "judgeGroundingES_retry");
    console.log(`   👨‍⚖️ Judge ES retry: score=${fmt(judgeES.grounded_score)}`);

    // Si sigue malo, escalar a gpt-4o
    if (judgeES.grounded_score < CFG.groundingJudgeMinScore) {
      console.log(`   🚀 Escalar ES a ${CFG.modelBig}`);
      contentESRes = await retryOnce(
        () => extractContentES(openai, book, groundTruthMeta.ground_truth, anchorsData, inputs.lens, { model: CFG.modelBig, temperature: 0.5, crono }),
        "extractContentES_escalate"
      );
      tokensByPhase.content_es_escalate = contentESRes.usage?.total_tokens || 0;
      modelsUsed.add(CFG.modelBig);
      llmCallsCount += 1;
    }
  }

  const contentESFinal = contentESRes.data;
  assertShape(contentESFinal, [
    "card_es.titulo", "card_es.parrafoTop", "card_es.subtitulo", "card_es.parrafoBot",
    "emotional_words_es", "og_phrases_es", "edition_blocks_es"
  ], "extractContentES_final");

  // ═══ F5: CONTENIDO EN ═══════════════════════════════════════════════
  const tF5 = Date.now();
  let contentENRes = await retryOnce(
    () => extractContentEN(openai, book, groundTruthMeta.ground_truth, anchorsData, contentESFinal.card_es, inputs.lens, { model: CFG.modelMini, temperature: 0.7 }),
    "extractContentEN"
  );
  elapsedByPhase.content_en = Date.now() - tF5;
  tokensByPhase.content_en = contentENRes.usage?.total_tokens || 0;
  modelsUsed.add(contentENRes.model || CFG.modelMini);
  llmCallsCount += 1;
  const contentENFinalRaw = contentENRes.data;
  assertShape(contentENFinalRaw, [
    "card_en.titulo", "card_en.parrafoTop", "card_en.subtitulo", "card_en.parrafoBot",
    "emotional_words_en", "og_phrases_en", "edition_blocks_en"
  ], "extractContentEN");

  // ═══ F6: GROUNDING JUDGE EN ═════════════════════════════════════════
  const tF6 = Date.now();
  const judgeENRes = await retryOnce(
    () => judgeGrounding(
      openai,
      groundTruthMeta.ground_truth,
      {
        card_es: { ...contentENFinalRaw.card_en },
        og_phrases_es: contentENFinalRaw.og_phrases_en,
        edition_blocks_es: contentENFinalRaw.edition_blocks_en
      },
      { model: CFG.modelMini }
    ),
    "judgeGroundingEN"
  );
  elapsedByPhase.judge_en = Date.now() - tF6;
  tokensByPhase.judge_en = judgeENRes.usage?.total_tokens || 0;
  llmCallsCount += 1;
  const judgeEN = judgeENRes.data;
  assertShape(judgeEN, ["grounded_score", "reason"], "judgeGroundingEN");
  console.log(`   👨‍⚖️ Judge EN: score=${fmt(judgeEN.grounded_score)}`);

  const contentENFinal = contentENFinalRaw;

  // ═══ F7: VOICE JUDGE ════════════════════════════════════════════════
  const tF7 = Date.now();
  const voiceVerdict = await retryOnce(
    () => judgeBothVoices(openai, contentESFinal.card_es, contentENFinal.card_en, book, { model: CFG.modelMini }),
    "voiceJudge"
  );
  elapsedByPhase.voice = Date.now() - tF7;
  tokensByPhase.voice = voiceVerdict.total_tokens || 0;
  llmCallsCount += 2;
  if (!voiceVerdict || typeof voiceVerdict !== "object") {
    throw new Error(`voiceJudge devolvió objeto inválido`);
  }
  console.log(`   🎭 Voice: ${voiceVerdict.consolidated || "pagina"} (conf ${fmt(voiceVerdict.confidence)})`);

  // ═══ F8: POST-PROCESADORES DETERMINISTAS ════════════════════════════
  const tF8 = Date.now();
  const emojiInjected = injectEmojis(contentESFinal, contentENFinal, book.titulo, book.autor);
  const confidence = calculateConfidence({
    bookIdentityConfidence: groundTruthMeta.book_identity_confidence,
    anchors: anchorsData.book_grounding_anchors,
    voiceVerdict,
    groundingJudgeES: judgeES,
    groundingJudgeEN: judgeEN
  });

  const totalTokens = Object.values(tokensByPhase).reduce((a, b) => a + b, 0);
  const totalElapsedMs = Date.now() - t0;

  const mapped = compatMapper({
    book, groundTruthMeta, anchorsData, contentES: contentESFinal, contentEN: contentENFinal,
    palette, emojiInjected, voiceVerdict, groundingJudgeES: judgeES, groundingJudgeEN: judgeEN,
    confidence, crono, inputsSnapshot,
    runMeta: { totalTokens, tokensByPhase, totalElapsedMs, elapsedByPhase, llmCallsCount, modelsUsed: Array.from(modelsUsed) },
    qualityWarning: null
  });

  // Validación semántica final
  const finalValidation = validateFinalNucleus(mapped);
  mapped._quality_warning = finalValidation.overall === "pass" ? null : {
    overall: finalValidation.overall,
    warnings: finalValidation.warnings
  };
  mapped._metrics.final_validation = finalValidation.overall;

  elapsedByPhase.post_processing = Date.now() - tF8;

  const statusIcon = finalValidation.overall === "pass" ? "✅" : finalValidation.overall === "pass_with_warnings" ? "🟡" : "🔴";
  console.log(`   ${statusIcon} FINAL: ${finalValidation.overall} | confidence=${confidence.combined} | tokens=${totalTokens} | ${(totalElapsedMs / 1000).toFixed(1)}s`);
  if (finalValidation.warnings.length > 0) {
    console.log(`      warnings: ${finalValidation.warnings.slice(0, 2).join(" | ")}`);
  }

  return { mapped, groundTruthMeta, confidence, finalValidation, anchorsData };
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUALITY REPORT — archivo Markdown por libro (observabilidad)
────────────────────────────────────────────────────────────────────────────── */

async function writeQualityReport(result, stamp) {
  const { mapped, groundTruthMeta, confidence, finalValidation, anchorsData } = result;
  const safeName = String(mapped.titulo).replace(/[^\w-]+/g, "_").slice(0, 60);
  const dir = CFG.files.reportsDir;
  await fs.mkdir(dir, { recursive: true });
  const p = path.join(dir, `${stamp}_${safeName}.md`);

  const md = `# Quality Report — ${mapped.titulo}

**Autor:** ${mapped.autor}
**Ejecutado:** ${stamp}
**Pipeline:** nucleus-canonical-v3

---

## 🌐 Grounding

- **Source:** \`${groundTruthMeta.grounding_source}\`
- **Tier reached:** ${groundTruthMeta.tier_reached}
- **Book identity confidence:** ${fmt(groundTruthMeta.book_identity_confidence)}
- **Resolution path:** ${Array.isArray(groundTruthMeta.resolution_path) ? groundTruthMeta.resolution_path.join(" → ") : "—"}
${groundTruthMeta.match_score !== undefined ? `- **Match score:** ${fmt(groundTruthMeta.match_score)}` : ""}
${groundTruthMeta.similar_books ? `\n### Libros similares considerados (inferencia)\n${groundTruthMeta.similar_books.map((b) => `- **${b.titulo}** (${b.autor}): ${b.razon}`).join("\n")}` : ""}
${groundTruthMeta.warning ? `\n⚠️ **WARNING:** ${groundTruthMeta.warning}` : ""}

### Ground truth utilizado
\`\`\`
${groundTruthMeta.ground_truth.slice(0, 800)}${groundTruthMeta.ground_truth.length > 800 ? "..." : ""}
\`\`\`

---

## ⚓ Anchors extraídos

**Conceptos:**
${(anchorsData.book_grounding_anchors.concepts || []).map((c) => `- ${c}`).join("\n")}

**Key terms:** ${(anchorsData.book_grounding_anchors.key_terms || []).join(", ")}

**Voz autorial:** ${anchorsData.book_grounding_anchors.authorial_voice_notes}

---

## 🎨 Visual synthesis

- hue_primary: ${anchorsData.visual_intent.hue_primary}
- saturation: ${anchorsData.visual_intent.saturation}
- lightness_paper: ${anchorsData.visual_intent.lightness_paper}
- temperature_shift: ${anchorsData.visual_intent.temperature_shift}
- palette_strategy: ${anchorsData.visual_intent.palette_strategy}
- typography: ${anchorsData.visual_intent.typography_family}
- Resultado: paper=${mapped.fondo}, accent=${mapped._visual?.cssVars?.["--accent"]}, ink=${mapped._visual?.cssVars?.["--ink"]}, contraste=${mapped._visual?.contrast_ratio}:1

---

## 👨‍⚖️ Grounding judges

### ES
- Score: ${fmt(mapped._grounding_judge?.es?.grounded_score)}
- Usa conceptos específicos: ${mapped._grounding_judge?.es?.uses_book_specific_concepts}
- Podría aplicar a cualquier libro: ${mapped._grounding_judge?.es?.could_apply_to_any_book}
- Razón: ${mapped._grounding_judge?.es?.reason}

### EN
- Score: ${fmt(mapped._grounding_judge?.en?.grounded_score)}
- Usa conceptos específicos: ${mapped._grounding_judge?.en?.uses_book_specific_concepts}
- Razón: ${mapped._grounding_judge?.en?.reason}

---

## 🎭 Voice verdict

- Consolidated: **${mapped._voice_verdict?.consolidated}** (conf ${fmt(mapped._voice_verdict?.confidence)})
- ES: ${mapped._voice_verdict?.es?.verdict} — ${mapped._voice_verdict?.es?.reason}
- EN: ${mapped._voice_verdict?.en?.verdict} — ${mapped._voice_verdict?.en?.reason}

---

## 📊 Confidence (calculada desde 4 señales ortogonales)

- **book_grounding:** ${confidence.book_grounding} ← del tier de grounding alcanzado
- **voice_authenticity:** ${confidence.voice_authenticity} ← del voice judge
- **specificity:** ${confidence.specificity} ← anti-genericidad de anchors
- **grounding_judge:** ${confidence.grounding_judge} ← promedio de los 2 judges
- **Combined:** **${confidence.combined}**

---

## ✅ Validación final

**Overall:** \`${finalValidation.overall}\`
${finalValidation.warnings.length > 0 ? `\n**Warnings:**\n${finalValidation.warnings.map((w) => `- ${w}`).join("\n")}` : "Sin warnings."}

---

## 💰 Métricas

- LLM calls: ${mapped._metrics.llm_calls_count}
- Tokens totales: ${mapped._metrics.tokens_total}
- Tiempo total: ${fmt((mapped._metrics?.elapsed_ms_total ?? 0) / 1000, 1)}s
- Modelos usados: ${(mapped._metrics.models_used || []).join(", ")}

### Por fase
${Object.entries(mapped._metrics.tokens_by_phase || {}).map(([k, v]) => `- ${k}: ${v} tokens, ${mapped._metrics.elapsed_ms_by_phase?.[k] || 0}ms`).join("\n")}
`;

  await fs.writeFile(p, md, "utf8");
  return p;
}

/* ─────────────────────────────────────────────────────────────────────────────
   I/O
────────────────────────────────────────────────────────────────────────────── */

async function loadCSV() {
  if (!(await fileExists(CFG.files.csv))) {
    throw new Error(`CSV no encontrado: ${CFG.files.csv}. Modos batch/constrained no pueden proceder sin el catálogo.`);
  }
  const rawBytes = await fs.readFile(CFG.files.csv, "utf8");
  // .trim() elimina BOM UTF-8 si el CSV fue guardado desde Excel/Windows
  const raw = rawBytes.trim();
  if (!raw) {
    throw new Error(`CSV vacío: ${CFG.files.csv}. Agrega libros antes de correr batch.`);
  }
  let rows;
  try {
    rows = parse(raw, { columns: true, skip_empty_lines: true });
  } catch (err) {
    throw new Error(`CSV malformado: ${CFG.files.csv} — ${err.message}`);
  }
  const parsed = rows.map((row) => ({
    titulo: String(row.titulo || row.Titulo || row.title || "").trim(),
    autor: String(row.autor || row.Autor || row.author || "").trim(),
    tagline: String(row.tagline || row.Tagline || "").trim(),
    portada: String(row.portada || row.portada_url || "").trim(),
    portada_url: String(row.portada_url || row.portada || "").trim(),
    isbn: String(row.isbn || row.ISBN || "").trim()
  })).filter((r) => r.titulo && r.autor);
  if (parsed.length === 0) {
    throw new Error(`CSV sin libros válidos (0 filas con titulo+autor): ${CFG.files.csv}`);
  }
  return parsed;
}

async function loadSingle() {
  if (await fileExists(CFG.files.tmpBook)) {
    try {
      return JSON.parse(await fs.readFile(CFG.files.tmpBook, "utf8"));
    } catch (err) {
      console.error(`❌ /tmp/triggui-book.json corrupto: ${err.message}`);
      return null;
    }
  }
  if (process.env.SINGLE_BOOK) {
    try {
      return JSON.parse(process.env.SINGLE_BOOK);
    } catch (err) {
      console.error(`❌ SINGLE_BOOK env var corrupta: ${err.message}`);
      return null;
    }
  }
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   FUSIÓN CON contenido.json (para unificar carriles sin perder los 20 libros)

   La estrategia:
   - Leer contenido.json existente si hay
   - Si el libro nuevo ya está (match por titulo+autor normalizado), lo reemplaza
   - Si es nuevo, lo agrega al inicio del array (recién generado = más visible)
   - Escribe de vuelta el contenido.json unificado

   Nunca trona. Si algo falla, log y sigue — contenido_edicion.json siempre se escribe.
────────────────────────────────────────────────────────────────────────────── */

function normalizeBookKey(titulo, autor) {
  return `${String(titulo || "").trim().toLowerCase()}__${String(autor || "").trim().toLowerCase()}`;
}

async function mergeIntoContenidoJson(newBook, targetPath, options = {}) {
  // options.preserveManual (default true): si el libro existente tiene _manual:true
  //   y el nuevo viene del batch sin _manual, se SALTA (protege curaduría).
  // options.isFromBatch (default false): marca si el newBook viene de un batch.
  try {
    const t0 = Date.now();
    const preserveManual = options.preserveManual !== false;
    const isFromBatch = options.isFromBatch === true;

    let existing = { libros: [] };
    if (await fileExists(targetPath)) {
      const raw = await fs.readFile(targetPath, "utf8");
      const parseResult = safeJSONParse(raw, null);

      if (parseResult.ok) {
        existing = parseResult.data;
        if (!existing || !Array.isArray(existing.libros)) {
          // JSON válido pero estructura inesperada: preservar con backup
          console.log(`   ⚠️  ${targetPath} tiene estructura inesperada, creando backup y empezando limpio`);
          await fs.writeFile(`${targetPath}.backup-${Date.now()}`, raw, "utf8");
          existing = { libros: [] };
        }
      } else if (parseResult.reason === "empty_or_whitespace") {
        // Vacío/whitespace: NO backup (no hay nada que preservar), solo inicializar
        console.log(`   ℹ️  ${targetPath} vacío o solo whitespace, inicializando`);
        existing = { libros: [] };
      } else {
        // Parse error real: backup (puede haber data recuperable manualmente)
        console.log(`   ⚠️  ${targetPath} corrupto (${parseResult.reason}), creando backup y empezando limpio`);
        await fs.writeFile(`${targetPath}.backup-${Date.now()}`, raw, "utf8");
        existing = { libros: [] };
      }
    } else {
      console.log(`   ℹ️  ${targetPath} no existe todavía, creando nuevo`);
    }

    const beforeCount = existing.libros.length;
    const newKey = normalizeBookKey(newBook.titulo, newBook.autor);
    const existingIndex = existing.libros.findIndex((b) => normalizeBookKey(b.titulo, b.autor) === newKey);

    let action;
    if (existingIndex >= 0) {
      const existingBook = existing.libros[existingIndex];
      const existingIsManual = existingBook._manual === true;
      const newIsManual = newBook._manual === true;

      // PROTECCIÓN: existente manual + nuevo viene de batch + preserveManual=true → saltar
      if (existingIsManual && isFromBatch && preserveManual && !newIsManual) {
        const elapsedMs = Date.now() - t0;
        console.log(`   🛡️  PROTEGIDO manual: "${existingBook.titulo}" — no se reemplaza (${elapsedMs}ms)`);
        return true;
      }

      existing.libros[existingIndex] = newBook;
      action = existingIsManual && newIsManual
        ? "reemplazado (manual→manual)"
        : existingIsManual && !newIsManual
          ? "reemplazado (manual sobrescrito)"
          : "reemplazado";
    } else {
      existing.libros.unshift(newBook);
      action = newBook._manual ? "agregado al inicio (manual)" : "agregado al inicio";
    }

    const afterCount = existing.libros.length;
    await writeJSON(targetPath, existing);

    const elapsedMs = Date.now() - t0;
    console.log(`   🔗 Fusión ${targetPath}: libro ${action} — ${beforeCount} → ${afterCount} libros (${elapsedMs}ms)`);
    return true;
  } catch (err) {
    console.error(`   ❌ mergeIntoContenidoJson falló: ${err.message}`);
    return false;
  }
}

async function snapshotInputs(inputs, crono) {
  const stamp = new Date().toISOString().replace(/[:]/g, "-").replace(/\..+$/, "");
  await fs.mkdir(CFG.files.inputsHistoryDir, { recursive: true });
  const content = `# Triggui run — ${stamp}

## Cronobiología automática
- Día: ${crono.dia}
- Hora: ${crono.hora}h
- Franja: ${crono.franja}
- Energía: ${Math.round(crono.energia * 100)}%
- Modo: ${crono.modo}

## Lens
${inputs.lens || "_(vacío)_"}

## Visual intent
${inputs.visualIntent || "_(vacío)_"}

## Book context
${inputs.bookContext || "_(vacío)_"}
`;
  const p = path.join(CFG.files.inputsHistoryDir, `${stamp}.md`);
  await fs.writeFile(p, content, "utf8");
  console.log(`📎 Inputs snapshot: ${p}`);
  return stamp;
}

/* ─────────────────────────────────────────────────────────────────────────────
   RUNNERS
────────────────────────────────────────────────────────────────────────────── */

async function runBatch() {
  const t0 = Date.now();
  const books = await loadCSV();
  const seed = process.env.TRIGGUI_SEED || null;
  const selected = fisherYatesShuffle(books, seed).slice(0, Math.min(CFG.maxBatch, books.length));
  const outputFile = CFG.shadowMode ? CFG.files.outShadow : CFG.files.outBatch;
  const crono = cronobioContext();
  const inputsSnapshot = await snapshotInputs(INPUTS, crono);

  console.log(`\n🚀 BATCH v3 — ${selected.length}/${books.length} libros`);
  console.log(`   Modo: ${CFG.shadowMode ? "🌒 SHADOW" : "⚡ PRODUCCIÓN"}`);
  console.log(`   ${crono.dia} ${crono.hora}h ${crono.franja} | energía ${Math.round(crono.energia * 100)}%`);
  console.log(`   Output: ${outputFile}`);

  const results = [];
  let totalTokens = 0;
  let fallos = 0;

  for (let i = 0; i < selected.length; i += 1) {
    console.log(`\n━━━━━ [${i + 1}/${selected.length}] ━━━━━`);
    try {
      const result = await processBook(selected[i], INPUTS, inputsSnapshot);
      results.push(result);
      await writeQualityReport(result, inputsSnapshot);
      totalTokens += result.mapped._metrics?.tokens_total || 0;
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({ mapped: { ...selected[i], _fallback: true, _error: error.message } });
      fallos += 1;
    }
    if (i < selected.length - 1) await new Promise((r) => setTimeout(r, CFG.delayMs));
  }

  const exitosos = results.filter((r) => !r.mapped._fallback).map((r) => r.mapped);

  // UNIFICACIÓN FASE 2: fusión libro por libro cuando UNIFIED_MODE=true y producción
  const unifiedMode = process.env.UNIFIED_MODE !== "false";
  const preserveManual = process.env.PRESERVE_MANUAL !== "false";

  if (!CFG.shadowMode && unifiedMode) {
    console.log(`\n🔗 FUSIÓN UNIFICADA — preservar manuales: ${preserveManual ? "SÍ" : "NO"}`);
    for (const libro of exitosos) {
      await mergeIntoContenidoJson(libro, CFG.files.outBatch, {
        preserveManual,
        isFromBatch: true
      });
    }
    // También escribir el archivo consolidado del batch para auditoría.
    // BLINDADO v3.2: este log NO debe matar el proceso si el archivo final
    // tiene BOM, whitespace o quedó corrupto por race condition.
    // Ya procesamos 20 libros y escribimos los quality reports: no tiene
    // sentido morir aquí por una línea de observabilidad.
    try {
      const finalRead = await fs.readFile(CFG.files.outBatch, "utf8");
      const parseResult = safeJSONParse(finalRead, { libros: [] });
      if (parseResult.ok && Array.isArray(parseResult.data.libros)) {
        console.log(`   🔗 Total en contenido.json: ${parseResult.data.libros.length} libros`);
      } else {
        console.log(`   ⚠️  No se pudo verificar total final (${parseResult.reason}). El archivo ya fue escrito por mergeIntoContenidoJson.`);
      }
    } catch (err) {
      console.log(`   ⚠️  No se pudo leer ${CFG.files.outBatch} para verificación final: ${err.message}`);
    }
  } else {
    // Comportamiento legacy: sobrescribir archivo completo (escritura atómica)
    await writeJSON(outputFile, { libros: exitosos });
  }

  const runMs = Date.now() - t0;
  await fs.mkdir(CFG.files.metricsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await writeJSON(`${CFG.files.metricsDir}/nucleus-v3-${stamp}.json`, {
    timestamp: new Date().toISOString(),
    pipeline: "nucleus-canonical-v3",
    mode: CFG.shadowMode ? "shadow" : "production",
    requested: selected.length,
    exitosos: exitosos.length,
    fallos,
    total_tokens: totalTokens,
    run_total_ms: runMs
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ ${exitosos.length}/${selected.length} exitosos, ${fallos} fallos`);
  console.log(`   ${totalTokens} tokens totales, ${(runMs / 1000).toFixed(1)}s`);
  console.log(`   Output: ${outputFile}`);
}

async function runSingle() {
  const source = await loadSingle();
  if (!source) throw new Error("SINGLE_MODE sin fuente");
  const book = {
    titulo: String(source.titulo || "").trim(),
    autor: String(source.autor || "").trim(),
    tagline: String(source.tagline || "").trim(),
    portada: String(source.portada_url || source.portada || "").trim(),
    portada_url: String(source.portada_url || source.portada || "").trim(),
    isbn: String(source.isbn || "").trim()
  };
  if (!book.titulo || !book.autor) throw new Error("Libro inválido");

  const crono = cronobioContext();
  const inputsSnapshot = await snapshotInputs(INPUTS, crono);
  console.log(`\n🚀 SINGLE v3: ${book.titulo}`);

  const result = await processBook(book, INPUTS, inputsSnapshot);

  // UNIFICACIÓN FASE 2: marcar libro como MANUAL (curación intencional del usuario)
  // Este flag se usa por mergeIntoContenidoJson en batches futuros para NO sobrescribir
  // libros curados manualmente.
  result.mapped._manual = true;
  result.mapped._manual_generated_at = new Date().toISOString();

  // Escribir contenido_edicion.json (solo este libro) — carril v3.2 (ediciones vivas)
  // Escritura atómica: write temp + rename garantiza que build-editions.py nunca
  // lea un archivo a medias si corre en paralelo.
  await writeJSON(CFG.files.outSingle, { libros: [result.mapped] });
  console.log(`\n✅ ${CFG.files.outSingle}`);

  const unifiedMode = process.env.UNIFIED_MODE !== "false";
  if (unifiedMode) {
    await mergeIntoContenidoJson(result.mapped, CFG.files.outBatch);
    console.log(`✅ ${CFG.files.outBatch} (unificado, libro marcado _manual)`);
  } else {
    console.log(`🔕 UNIFIED_MODE=false — ${CFG.files.outBatch} no se actualizó`);
  }

  const reportPath = await writeQualityReport(result, inputsSnapshot);
  console.log(`📋 Quality report: ${reportPath}`);
}

async function main() {
  const isSingle = process.env.SINGLE_MODE === "true" || await fileExists(CFG.files.tmpBook);
  if (isSingle) await runSingle();
  else await runBatch();
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
