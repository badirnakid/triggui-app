/* ═══════════════════════════════════════════════════════════════════════════════
   build-contenido-nucleus.js — ORQUESTADOR v3.7.1 + STEP 3 NIVEL DIOS

   v3.7.1+step3 (2026-05-05): SISTEMA MODULAR DE LENTES + COMPATIBILITY SCORING
   ─────────────────────────────────────────────────────────────────────────────
   Sobre v3.7.1, agrega 6 modificaciones quirurgicas (todas marcadas ⭐ STEP 3 ⭐):

   1. Imports: prompt-composer.js + lens-compatibility-scorer.js
   2. INPUTS.lens ahora se rellena async en main() via composeLensSystemBlock()
      (carga constitution + lentes activos + base lens del env var TRIGGUI_LENS)
   3. NUEVA FASE F9: lens-compatibility-scoring (1 llamada LLM despues de F2.7)
      - Calcula vector _lens_compatibility por libro
      - Agrega _hawkins_range y _chronobiology_optimal
      - Es lo que app.triggui.com va a usar para matching matematico runtime sin LLM
   4. writeQualityReport: nueva seccion "Lens Compatibility" con formato visual
   5. snapshotInputs: resume el lens compuesto (40k+ chars) en vez de dump completo
   6. main(): diagnostico inicial + composicion del lens block antes de runners

   Cero cambios en v3.7.1 lo previo: F2.5 cover validation, F2.7 highlight judge,
   mergeIntoContenidoJson con _manual protection, atomic writes, identity sealing,
   prompts existentes, schema, compatMapper, render-tarjeta — todo SAGRADO.

   v3.7.1 (2026-04-26): FIX QUIRÚRGICO DE F2.7 — POSICIÓN POST-COMPATMAPPER
   v3.7 original tenía F2.7 mal posicionada: corría DESPUÉS de F6 (judge EN)
   pero ANTES del compatMapper, sobre `_nucleus.card_es.parrafoTop` que NO
   contiene [H]...[/H] (los inyecta `ensureHighlight()` dentro de
   `renderTarjetaES/EN`, que el compatMapper llama).

   v3.7.1 mueve F2.7 a su posición correcta: DESPUÉS del compatMapper, sobre
   `mapped.tarjeta.parrafoTop` (donde sí hay [H]). Mutaciones se propagan
   a las 6 ubicaciones renderizadas.

   Pipeline ampliado de 9 → 10 fases (F9 nueva del Step 3):
     F0  grounding-resolver          (curator / api / inference / blind) + evidence
     F1  extractAnchors               (1 llamada LLM)
     F2  synthesizePalette            (determinista, matemático)
     F2.5 cover validation + rescue   (🌒 v3.6 — auto-healing)
     F3  extractContentES             (1 llamada LLM)
     F4  judgeGrounding ES            (1+ llamadas LLM con retry, v3.5)
     F5  extractContentEN             (1 llamada LLM)
     F6  judgeGrounding EN            (1+ llamadas LLM con retry, v3.5)
     F7  voice-judge                  (1 llamada LLM, existente)
     F8  emoji-inject + confidence + compat-map
     F2.7 highlight coherence judge   (✨ v3.7.1 — POST-compatMapper)
     F9  ⭐ lens-compatibility-scoring (1 llamada LLM, STEP 3, NUEVA)
     F10 validator + report
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
  judgeHighlightCoherence,
  cronobioContext
} from "./extractors.js";
import {
  expandHighlightToFullSentence,
  getHighlightSegments
} from "./triggui-physics.js";
import { synthesizePalette } from "./palette-synthesizer.js";
import { injectEmojis, calculateConfidence, compatMapper } from "./post-processors.js";
import { judgeBothVoices } from "./voice-judge.js";
import { validateFinalNucleus } from "./quality-validator.js";
import { generateFallbackCover } from "./typographic-cover.js";
import { selectBestCover, checkImageURL } from "./evidence-fetcher.js";

// ⭐ STEP 3 ⭐ — imports del sistema modular de lentes
import { composeLensSystemBlock, diagnose as diagnoseLenses } from "./prompt-composer.js";
import {
  scoreLensCompatibility,
  puntoHawkinsToRange,
  deriveChronobiologyOptimal
} from "./lens-compatibility-scorer.js";

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

// ⭐ STEP 3 ⭐ — INPUTS.lens ahora se rellena async en main() via composeLensSystemBlock
const INPUTS = {
  lens: "",  // se rellena async en main() — combina constitution + lentes activos + baseLens
  baseLens: process.env.TRIGGUI_LENS || "",  // override puntual del curador (preservado)
  visualIntent: process.env.TRIGGUI_VISUAL_INTENT || "",
  bookContext: process.env.TRIGGUI_BOOK_CONTEXT || ""
};

/* ─────────────────────────────────────────────────────────────────────────────
   UTILIDADES
────────────────────────────────────────────────────────────────────────────── */

async function fileExists(p) { try { await fs.access(p); return true; } catch { return false; } }

async function writeJSON(p, data) {
  const tmp = `${p}.tmp-${process.pid}-${Date.now()}`;
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, p);
}

function fmt(value, decimals = 2) {
  if (value === null || value === undefined) return "n/a";
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return "n/a";
  return num.toFixed(decimals);
}

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
   PROCESO DE UN LIBRO — pipeline completo de 10 fases (F9 NUEVA en Step 3)
────────────────────────────────────────────────────────────────────────────── */

async function processBook(book, inputs, inputsSnapshot) {
  const t0 = Date.now();
  const crono = CFG.cronoEnabled ? cronobioContext() : cronobioContext(new Date());
  const tokensByPhase = {};
  const elapsedByPhase = {};
  const modelsUsed = new Set();
  let llmCallsCount = 0;
  const judgeDegradationFlags = [];

  console.log(`\n📖 ${book.titulo} — ${book.autor}`);

  // ═══ F0: GROUNDING ═════════════════════════════════════════════════
  const tF0 = Date.now();
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

  // ═══ F2.5: PORTADA — VALIDATION + RESCATE + SVG FALLBACK (intacta v3.6) ═════
  const tF2b = Date.now();
  const csvPortadaRaw = book.portada_url || book.portada || "";
  const csvPortadaPresent = Boolean(csvPortadaRaw);

  let csvPortadaValid = false;
  let csvPortadaCheckMs = 0;
  let csvPortadaRejectReason = null;

  if (csvPortadaPresent) {
    const t = Date.now();
    csvPortadaValid = await checkImageURL(csvPortadaRaw);
    csvPortadaCheckMs = Date.now() - t;

    if (!csvPortadaValid) {
      csvPortadaRejectReason = "url_failed_size_or_type_check_v3.6";
      console.log(`   🛡️  v3.6: portada CSV/precargada rechazada (URL fantasma o <2KB): ${csvPortadaRaw.slice(0, 80)}`);
      book.portada = "";
      book.portada_url = "";
      book.portada_was_invalid = true;
      book.portada_invalid_url = csvPortadaRaw;
      book.portada_invalid_reason = csvPortadaRejectReason;
    } else {
      if (!book.portada_source) {
        book.portada_source = book.portada_source || "csv_or_precargada_validated";
      }
    }
  }

  const hasValidCoverFromCSV = csvPortadaValid;

  if (!hasValidCoverFromCSV && groundTruthMeta.evidence) {
    const bestCover = selectBestCover(groundTruthMeta.evidence);
    if (bestCover && bestCover.url) {
      const rescuedValid = await checkImageURL(bestCover.url);
      if (rescuedValid) {
        book.portada = bestCover.url;
        book.portada_url = bestCover.url;
        book.portada_source = `${bestCover.source}_${bestCover.size}`;
        book.portada_rescued_from_evidence = true;
        if (book.portada_was_invalid) {
          book.portada_auto_healed = true;
          console.log(`   🩹 v3.6: AUTO-HEALING — portada rescatada de ${bestCover.source}/${bestCover.size} reemplaza URL fantasma`);
        } else {
          console.log(`   📸 Portada rescatada: ${bestCover.source}/${bestCover.size}`);
        }
      } else {
        console.log(`   ⚠ v3.6: rescate también devolvió URL inválida (${bestCover.url.slice(0, 60)}) — saltando a SVG`);
      }
    }
  }

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
    if (book.portada_was_invalid) {
      book.portada_auto_healed_to_svg = true;
      console.log(`   🩹 v3.6: AUTO-HEALING fallback — SVG ${book.portada_fallback_size_kb}KB reemplaza URL fantasma (sin evidence cover)`);
    } else {
      console.log(`   🎨 SVG fallback generado: ${book.portada_fallback_size_kb}KB (paleta+tipografía de la card)`);
    }
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
    () => judgeGrounding(openai, groundTruthMeta.ground_truth, contentES, { model: CFG.modelMini, language: "es" }),
    "judgeGroundingES"
  );
  elapsedByPhase.judge_es = Date.now() - tF4;
  tokensByPhase.judge_es = judgeESRes.usage?.total_tokens || 0;
  modelsUsed.add(judgeESRes.model || CFG.modelMini);
  llmCallsCount += (judgeESRes.attempts || 1);
  let judgeES = judgeESRes.data;
  assertShape(judgeES, ["grounded_score", "could_apply_to_any_book", "reason"], "judgeGroundingES");
  if (judgeESRes.degraded) {
    judgeDegradationFlags.push(`judge_es_degraded_after_${judgeESRes.attempts}_attempts`);
    console.log(`   🛡️  Judge ES: degradación elegante (score=${fmt(judgeES.grounded_score)} fallback)`);
  } else {
    console.log(`   👨‍⚖️ Judge ES: score=${fmt(judgeES.grounded_score)}, generic=${judgeES.could_apply_to_any_book}`);
  }

  if (!judgeESRes.degraded && (judgeES.grounded_score < CFG.groundingJudgeMinScore || judgeES.could_apply_to_any_book)) {
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
      () => judgeGrounding(openai, groundTruthMeta.ground_truth, contentESRes.data, { model: CFG.modelMini, language: "es" }),
      "judgeGroundingES_retry"
    );
    tokensByPhase.judge_es_retry = judgeRetryRes.usage?.total_tokens || 0;
    llmCallsCount += (judgeRetryRes.attempts || 1);
    judgeES = judgeRetryRes.data;
    assertShape(judgeES, ["grounded_score"], "judgeGroundingES_retry");
    console.log(`   👨‍⚖️ Judge ES retry: score=${fmt(judgeES.grounded_score)}`);

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
      contentENFinalRaw,
      { model: CFG.modelMini, language: "en" }
    ),
    "judgeGroundingEN"
  );
  elapsedByPhase.judge_en = Date.now() - tF6;
  tokensByPhase.judge_en = judgeENRes.usage?.total_tokens || 0;
  llmCallsCount += (judgeENRes.attempts || 1);
  const judgeEN = judgeENRes.data;
  assertShape(judgeEN, ["grounded_score", "reason"], "judgeGroundingEN");
  if (judgeENRes.degraded) {
    judgeDegradationFlags.push(`judge_en_degraded_after_${judgeENRes.attempts}_attempts`);
    console.log(`   🛡️  Judge EN: degradación elegante (score=${fmt(judgeEN.grounded_score)} fallback)`);
  } else {
    console.log(`   👨‍⚖️ Judge EN: score=${fmt(judgeEN.grounded_score)}`);
  }

  const contentENFinal = contentENFinalRaw;

  const highlightDegradationFlags = [];
  const highlightAutoCorrected = { es: { top: false, bot: false }, en: { top: false, bot: false } };

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

  // ═══ F2.7 v3.7.1 — HIGHLIGHT COHERENCE JUDGE + AUTO-CORRECT (intacta) ═════
  const tF27 = Date.now();

  async function judgeAndCorrectField(targetObj, field, language) {
    const original = targetObj?.[field];
    if (!original) return null;

    const segments = getHighlightSegments(original);
    if (segments.length === 0) return null;

    const firstJudge = await judgeHighlightCoherence(openai, segments, {
      model: CFG.modelMini,
      language
    });
    tokensByPhase[`highlight_judge_${language}_${field}`] = firstJudge.usage?.total_tokens || 0;
    llmCallsCount += (firstJudge.attempts || 1);
    if (firstJudge.degraded) {
      highlightDegradationFlags.push(`highlight_judge_${language}_${field}_degraded`);
    }

    if (firstJudge.data.feels_naturally_finished && firstJudge.data.is_grammatically_complete) {
      return null;
    }

    console.log(`   ✂  HighlightJudge ${language.toUpperCase()} ${field}: colgado (score=${fmt(firstJudge.data.coherence_score)}) — auto-corrigiendo`);

    const corrected = expandHighlightToFullSentence(original);
    if (corrected === original) {
      console.log(`   ⚠  HighlightJudge ${language.toUpperCase()} ${field}: no se pudo auto-expandir`);
      highlightDegradationFlags.push(`highlight_${language}_${field}_uncorrectable`);
      return null;
    }

    const newSegments = getHighlightSegments(corrected);
    const secondJudge = await judgeHighlightCoherence(openai, newSegments, {
      model: CFG.modelMini,
      language
    });
    tokensByPhase[`highlight_judge_${language}_${field}_retry`] = secondJudge.usage?.total_tokens || 0;
    llmCallsCount += (secondJudge.attempts || 1);

    highlightAutoCorrected[language][field === "parrafoTop" ? "top" : "bot"] = true;

    if (secondJudge.data.feels_naturally_finished && secondJudge.data.is_grammatically_complete) {
      console.log(`   ✅ HighlightJudge ${language.toUpperCase()} ${field}: auto-corregido (score=${fmt(secondJudge.data.coherence_score)})`);
    } else {
      console.log(`   🟡 HighlightJudge ${language.toUpperCase()} ${field}: aplicado pero residual warning`);
      highlightDegradationFlags.push(`highlight_${language}_${field}_residual_warning`);
    }

    return corrected;
  }

  const correctedES_top = await judgeAndCorrectField(mapped.tarjeta, "parrafoTop", "es");
  const correctedES_bot = await judgeAndCorrectField(mapped.tarjeta, "parrafoBot", "es");
  const correctedEN_top = await judgeAndCorrectField(mapped.tarjeta_en, "parrafoTop", "en");
  const correctedEN_bot = await judgeAndCorrectField(mapped.tarjeta_en, "parrafoBot", "en");

  if (correctedES_top !== null) {
    mapped.tarjeta.parrafoTop = correctedES_top;
    mapped.tarjeta_base.parrafoTop = correctedES_top;
    mapped.tarjeta_presentacion.parrafoTop = correctedES_top;
  }
  if (correctedES_bot !== null) {
    mapped.tarjeta.parrafoBot = correctedES_bot;
    mapped.tarjeta_base.parrafoBot = correctedES_bot;
    mapped.tarjeta_presentacion.parrafoBot = correctedES_bot;
  }
  if (correctedEN_top !== null) {
    mapped.tarjeta_en.parrafoTop = correctedEN_top;
    mapped.tarjeta_base_en.parrafoTop = correctedEN_top;
    mapped.tarjeta_presentacion_en.parrafoTop = correctedEN_top;
  }
  if (correctedEN_bot !== null) {
    mapped.tarjeta_en.parrafoBot = correctedEN_bot;
    mapped.tarjeta_base_en.parrafoBot = correctedEN_bot;
    mapped.tarjeta_presentacion_en.parrafoBot = correctedEN_bot;
  }

  elapsedByPhase.highlight_judge = Date.now() - tF27;
  const totalCorrections = Object.values(highlightAutoCorrected).flatMap(o => Object.values(o)).filter(Boolean).length;
  if (totalCorrections > 0) {
    console.log(`   🪡 HighlightJudge v3.7.1: ${totalCorrections} highlight(s) auto-corregido(s) y propagado(s) a las 6 ubicaciones`);
  } else {
    console.log(`   ✅ HighlightJudge v3.7.1: todos los highlights gramaticalmente coherentes`);
  }

  // ═══ ⭐ STEP 3 ⭐ F9: LENS COMPATIBILITY SCORING ═══════════════════════════
  // Una llamada LLM extra que produce el vector _lens_compatibility por libro.
  // Es lo que app.triggui.com usa para matching matemático en runtime sin LLM.
  // Cristaliza inteligencia AQUÍ una vez, para que selección sea gratis después.
  // Costo: ~$0.0003 por libro. En batch de 20 libros: ~$0.006 extra por batch.
  let lensCompatDegraded = false;
  const tF9 = Date.now();
  try {
    const lensCompat = await scoreLensCompatibility(openai, {
      book,
      groundTruth: groundTruthMeta.ground_truth,
      anchors: anchorsData,
      contentES: contentESFinal,
    }, { model: CFG.modelMini });

    mapped._lens_compatibility = lensCompat;
    mapped._hawkins_range = puntoHawkinsToRange(anchorsData.surface_hints.punto_hawkins);
    mapped._chronobiology_optimal = deriveChronobiologyOptimal(anchorsData);

    elapsedByPhase.lens_compatibility = Date.now() - tF9;
    llmCallsCount += 1;

    // Log resumido (solo lentes simples, no pilares para no saturar)
    const lensScores = Object.entries(lensCompat)
      .filter(([k]) => k !== "pilares" && typeof lensCompat[k] === "number")
      .map(([k, v]) => `${k}=${v.toFixed(2)}`)
      .join(" | ");
    console.log(`   🪞 Lens compat: ${lensScores}`);
  } catch (err) {
    console.log(`   ⚠ Lens compatibility falló: ${err.message}`);
    mapped._lens_compatibility = null;
    mapped._hawkins_range = null;
    mapped._chronobiology_optimal = null;
    lensCompatDegraded = true;
  }

  // ═══ F10: VALIDACIÓN SEMÁNTICA FINAL + AGREGADO DE WARNINGS ═════════
  const finalValidation = validateFinalNucleus(mapped);
  const allWarnings = [...(finalValidation.warnings || []), ...judgeDegradationFlags, ...highlightDegradationFlags];
  // v3.6: agregar warning si hubo auto-healing de portada
  if (book.portada_was_invalid) {
    allWarnings.push(`portada_auto_healed_v3.6: original "${(book.portada_invalid_url || "").slice(0, 60)}" rechazada por ${book.portada_invalid_reason}`);
  }
  // v3.7: agregar warning si hubo auto-correct de highlights
  if (totalCorrections > 0) {
    allWarnings.push(`highlights_auto_corrected_v3.7: ${totalCorrections} highlight(s) extendidos a frase completa por LLM judge`);
  }
  // ⭐ STEP 3 ⭐ — agregar warning si lens compat falló
  if (lensCompatDegraded) {
    allWarnings.push(`lens_compatibility_degraded_step3: scoreLensCompatibility falló o devolvió null`);
  }

  const overallStatus = (
    judgeDegradationFlags.length > 0 ||
    book.portada_was_invalid ||
    totalCorrections > 0 ||
    highlightDegradationFlags.length > 0 ||
    lensCompatDegraded
  ) && finalValidation.overall === "pass"
    ? "pass_with_warnings"
    : finalValidation.overall;

  mapped._quality_warning = overallStatus === "pass" ? null : {
    overall: overallStatus,
    warnings: allWarnings
  };
  mapped._metrics.final_validation = overallStatus;
  mapped._metrics.judge_degradations = judgeDegradationFlags;
  mapped._metrics.portada_auto_healed = Boolean(book.portada_was_invalid);
  mapped._metrics.highlights_auto_corrected = totalCorrections;
  mapped._metrics.highlight_degradations = highlightDegradationFlags;
  mapped._metrics.lens_compat_degraded = lensCompatDegraded;  // ⭐ STEP 3 ⭐

  elapsedByPhase.post_processing = Date.now() - tF8;

  const statusIcon = overallStatus === "pass" ? "✅" : overallStatus === "pass_with_warnings" ? "🟡" : "🔴";
  console.log(`   ${statusIcon} FINAL: ${overallStatus} | confidence=${confidence.combined} | tokens=${totalTokens} | ${(totalElapsedMs / 1000).toFixed(1)}s`);
  if (allWarnings.length > 0) {
    console.log(`      warnings: ${allWarnings.slice(0, 3).join(" | ")}`);
  }

  return { mapped, groundTruthMeta, confidence, finalValidation: { ...finalValidation, overall: overallStatus, warnings: allWarnings }, anchorsData };
}

/* ─────────────────────────────────────────────────────────────────────────────
   QUALITY REPORT — archivo Markdown por libro (observabilidad)
────────────────────────────────────────────────────────────────────────────── */

// ⭐ STEP 3 ⭐ — helper para formatear lens compatibility en el report
function formatLensCompatibility(compat) {
  if (!compat || typeof compat !== "object") return "_(no disponible)_";

  const lines = [];

  for (const [k, v] of Object.entries(compat)) {
    if (k === "pilares") continue;
    if (typeof v === "number") {
      lines.push(`- **${k}:** ${v.toFixed(2)}`);
    }
  }

  if (compat.pilares && typeof compat.pilares === "object") {
    lines.push("- **pilares:**");
    for (const [pilar, valor] of Object.entries(compat.pilares)) {
      if (typeof valor === "number") {
        lines.push(`  - ${pilar}: ${valor.toFixed(2)}`);
      }
    }
  }

  return lines.join("\n");
}

async function writeQualityReport(result, stamp) {
  const { mapped, groundTruthMeta, confidence, finalValidation, anchorsData } = result;
  const safeName = String(mapped.titulo).replace(/[^\w-]+/g, "_").slice(0, 60);
  const dir = CFG.files.reportsDir;
  await fs.mkdir(dir, { recursive: true });
  const p = path.join(dir, `${stamp}_${safeName}.md`);

  // ⭐ STEP 3 ⭐ — sección de lens compatibility en el report
  const lensCompatSection = mapped._lens_compatibility
    ? `\n## 🪞 Lens Compatibility (Step 3)

${formatLensCompatibility(mapped._lens_compatibility)}

- **Hawkins range estimado:** ${mapped._hawkins_range ? `[${mapped._hawkins_range[0]}, ${mapped._hawkins_range[1]}]` : "n/a"}
- **Chronobiology optimal:** franjas=${(mapped._chronobiology_optimal?.preferred_franjas || []).join(", ") || "n/a"}, energy_min=${mapped._chronobiology_optimal?.energy_minimum_required ?? "n/a"}
${mapped._metrics?.lens_compat_degraded ? "\n⚠️ **Lens scoring degraded** — vector usa fallback neutro (todos 0.5). Investigar logs." : ""}
`
    : (mapped._metrics?.lens_compat_degraded
        ? `\n## 🪞 Lens Compatibility\n\n⚠️ **Falló el scoring** — vector no disponible. Investigar logs.`
        : "");

  const md = `# Quality Report — ${mapped.titulo}

**Autor:** ${mapped.autor}
**Ejecutado:** ${stamp}
**Pipeline:** nucleus-canonical-v3.7.1+step3

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

## 🖼️ Portada

- **Source:** \`${mapped.portada_source || "n/a"}\`
${mapped.portada_rescued_from_evidence ? "- **Rescatada del evidence-cache** (tier alcanzado no la usó pero estaba disponible)" : ""}
${mapped.portada_fallback_generated ? `- **SVG fallback generado** (${mapped.portada_fallback_size_kb}KB)` : ""}
${mapped._metrics?.portada_auto_healed ? "- **🩹 v3.6 AUTO-HEALING activado** (URL fantasma original rechazada por checkImageURL)" : ""}

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

${mapped._metrics?.judge_degradations?.length ? `**🛡️ Degradaciones:** ${mapped._metrics.judge_degradations.join(", ")}` : ""}

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
${lensCompatSection}
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
   FUSIÓN CON contenido.json (intacta de v3.7.1)
────────────────────────────────────────────────────────────────────────────── */

function normalizeBookKey(titulo, autor) {
  return `${String(titulo || "").trim().toLowerCase()}__${String(autor || "").trim().toLowerCase()}`;
}

async function mergeIntoContenidoJson(newBook, targetPath, options = {}) {
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
          console.log(`   ⚠️  ${targetPath} tiene estructura inesperada, creando backup y empezando limpio`);
          await fs.writeFile(`${targetPath}.backup-${Date.now()}`, raw, "utf8");
          existing = { libros: [] };
        }
      } else if (parseResult.reason === "empty_or_whitespace") {
        console.log(`   ℹ️  ${targetPath} vacío o solo whitespace, inicializando`);
        existing = { libros: [] };
      } else {
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

  // ⭐ STEP 3 ⭐ — el snapshot resume el lens compuesto en vez de dump completo
  const lensSummary = inputs.lens && inputs.lens.length > 0
    ? `_(bloque compuesto: ${inputs.lens.length} caracteres — constitución + lentes activos + baseLens)_\n\nVer console.log de prompt-composer al inicio del run para detalle de lentes activos.`
    : "_(vacío)_";
  const baseLensSummary = inputs.baseLens && inputs.baseLens.trim()
    ? inputs.baseLens
    : "_(vacío)_";

  const content = `# Triggui run — ${stamp}

## Cronobiología automática
- Día: ${crono.dia}
- Hora: ${crono.hora}h
- Franja: ${crono.franja}
- Energía: ${Math.round(crono.energia * 100)}%
- Modo: ${crono.modo}

## Lens compuesto (Step 3)
${lensSummary}

## Base lens del curador (env var TRIGGUI_LENS — override puntual)
${baseLensSummary}

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

  console.log(`\n🚀 BATCH v3.7.1+step3 — ${selected.length}/${books.length} libros`);
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
    await writeJSON(outputFile, { libros: exitosos });
  }

  const runMs = Date.now() - t0;
  await fs.mkdir(CFG.files.metricsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await writeJSON(`${CFG.files.metricsDir}/nucleus-v3.7.1-step3-${stamp}.json`, {
    timestamp: new Date().toISOString(),
    pipeline: "nucleus-canonical-v3.7.1+step3",
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
    isbn: String(source.isbn || "").trim(),
    identity_sealed: Boolean(source.identity_sealed),
    _evidence: source._evidence || null,
    needs_fallback_cover: Boolean(source.needs_fallback_cover)
  };
  if (!book.titulo || !book.autor) throw new Error("Libro inválido");

  const crono = cronobioContext();
  const inputsSnapshot = await snapshotInputs(INPUTS, crono);
  console.log(`\n🚀 SINGLE v3.7.1+step3: ${book.titulo}`);

  const result = await processBook(book, INPUTS, inputsSnapshot);

  result.mapped._manual = true;
  result.mapped._manual_generated_at = new Date().toISOString();


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
  // ⭐ STEP 3 ⭐ — Diagnóstico inicial: verificar que constitución + lentes existen
  console.log(`🔍 Diagnóstico de sistema modular de lentes (Step 3):`);
  const diag = await diagnoseLenses();
  if (!diag.ok) {
    console.warn(`⚠ prompt-composer diagnóstico: ${diag.summary}`);
    console.warn(`   Faltantes: ${diag.missing.join(", ")}`);
    console.warn(`   El sistema continuará pero sin esos archivos (degradación elegante).`);
  } else {
    console.log(`   ✓ Lentes activos: ${diag.active_lenses.join(", ")}`);
    console.log(`   ✓ ${diag.found.length} archivos de configuración OK`);
  }

  // ⭐ STEP 3 ⭐ — Componer el lens block una sola vez al inicio del run
  // Combina: constitution + lentes activos del registry + baseLens del env var
  INPUTS.lens = await composeLensSystemBlock({ baseLens: INPUTS.baseLens });

  const isSingle = process.env.SINGLE_MODE === "true" || await fileExists(CFG.files.tmpBook);
  if (isSingle) await runSingle();
  else await runBatch();
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});