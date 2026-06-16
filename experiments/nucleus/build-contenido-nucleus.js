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
// v3.7 Capa 3: walker puro de sanitización (única fuente de verdad)
import { sanitizeObject, formatStats } from "./sanitize-walker.js";
// 🌒 detector de truncamiento puro (única fuente de verdad — reglas v4.3 reubicadas).
// Solo DETECTA; nunca muta ni aborta. Usado por C5 (collectTruncations) y el riel de C4.5.
import { detectTruncation } from "./detect-truncation.js";

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
  getHighlightSegments,
  placeHighlightOnDensestSpan
} from "./triggui-physics.js";
import { synthesizePalette } from "./palette-synthesizer.js";
import { placeHueInGap, uniquePaletteHue } from "./deterministic-hue.js";
import { injectEmojis, calculateConfidence, compatMapper } from "./post-processors.js";

// ════════════════════════════════════════════════════════════════════════════
// 🌒 v3.8 NIVEL DIOS CUÁNTICO — Counter global UNICO (edition-counter.json)
// ════════════════════════════════════════════════════════════════════════════
// Single source of truth para _edicion_numero. Vive en triggui-content/
// junto a contenido*.json. Cada generacion !isFromBatch (single) consume el
// counter: lee next -> asigna -> incrementa -> escribe atomico.
//
// Filosofia Badir: "si se genero cuenta, esten o no las carpetas o whatever".
// El counter es independiente de filesystem y JSONs. Una vez asignado un
// numero, vive en counter.history para siempre.
//
// Las cirugias 2A/2B (defensa cuantica de meta del otro JSON) quedan como
// red de seguridad de capa inferior si counter file falla.
// ════════════════════════════════════════════════════════════════════════════
async function assignEditionFromCounter(targetPath, newBook) {
  const counterPath = String(targetPath).replace(/contenido(_kids)?\.json$/, "edition-counter.json");
  const counterRaw = await fs.readFile(counterPath, "utf8");
  const counter = JSON.parse(counterRaw);
  if (typeof counter.next !== "number" || counter.next < 1) {
    throw new Error(`counter.next invalido en ${counterPath}: ${counter.next}`);
  }
  const assigned = counter.next;
  counter.last_assigned = assigned;
  counter.next = assigned + 1;
  counter.history = counter.history || [];
  counter.history.push({
    edicion: assigned,
    catalogo: String(targetPath).includes("_kids") ? "kids" : "adulto",
    slug: newBook.slug || null,
    titulo: newBook.titulo || null,
    at: new Date().toISOString()
  });
  await fs.writeFile(counterPath, JSON.stringify(counter, null, 2));
  return assigned;
}
import { judgeBothVoices } from "./voice-judge.js";
// 🌒 SPRINT NIVEL DIOS — Capa A Pilar 2 (Voice-Judge Universal) + Capa B (CSAL)
import { judgeAllVoiceLayers, regeneratePhrasesByFeedback } from "./voice-judge-universal.js";
import { extractCSAL } from "./csal-extractor.js";
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

// ═══════════════════════════════════════════════════════════════════════
// 🌒 CATALOG_MODE — soporte multi-catálogo Triggui Kids
// ═══════════════════════════════════════════════════════════════════════
// Controla qué catálogo de libros se procesa.
// Default: "adulto" (preserva comportamiento original al 100%)
// Alternativa: "kids" (activa Triggui Kids con catálogo + overlay constitucional)
// ═══════════════════════════════════════════════════════════════════════
const CATALOG_MODE = (process.env.CATALOG_MODE || "adulto").toLowerCase();
const IS_KIDS = CATALOG_MODE === "kids";
console.log(IS_KIDS
  ? "🌒 CATALOG_MODE=kids — Triggui Kids activado"
  : "🌒 CATALOG_MODE=adulto — Triggui (default)");

const CFG = {
  modelMini: process.env.TRIGGUI_MODEL || "gpt-4o-mini",
  modelBig: process.env.TRIGGUI_MODEL_BIG || "gpt-4o",
  temperature: Number(process.env.TRIGGUI_TEMP || 0.7),
  catalogMode: CATALOG_MODE,
  files: {
    csv:       IS_KIDS ? "data/libros_master_kids.csv"      : "data/libros_master.csv",
    outBatch:  IS_KIDS ? "contenido_kids.json"              : "contenido.json",
    outShadow: IS_KIDS ? "contenido_kids.shadow.json"       : "contenido.shadow.json",
    tmpBook:   "/tmp/triggui-book.json",
    metricsDir: "metrics",
    inputsHistoryDir: "inputs-history",
    reportsDir: "quality-reports"
  },
  maxBatch: parseInt(process.env.BATCH_SIZE || '20', 10),  // 🎯 Sprint A v14
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
  // v3.7 CAPA 3 NIVEL DIOS CUÁNTICO-QUARK: sanitización transparente pre-disk.
  // Toda escritura JSON del nucleus pasa por aquí (3 callsites: línea ~1447
  // merge idempotente, línea ~1562 batch principal, línea ~1568 metrics).
  // Sanitizar AQUÍ garantiza matemáticamente que NADA sucio llegue al disco,
  // sin importar el origen (LLM, merge con archivo previo, estado intermedio).
  // Defensa transparente: las 3 callsites heredan sanitización sin tocarlas.
  // Filosofía self-healing: limpia + log + escribe. NUNCA aborta pipeline.
  const { clean, stats, modified } = sanitizeObject(data);
  if (modified) {
    console.log(`   🌒 v3.7 Capa 3 writeJSON sanitize [${p}]: ${formatStats(stats)}`);
  }

  const tmp = `${p}.tmp-${process.pid}-${Date.now()}`;
  const content = `${JSON.stringify(clean, null, 2)}\n`;
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

/* ═══════════════════════════════════════════════════════════════════════════════
   C3 v12 — AUTO-VALIDACIÓN SINFÓNICA + ANTI-BRACKET
   Helpers observatorios: registran issues, no fuerzan retry al LLM.
═══════════════════════════════════════════════════════════════════════════════ */

function validateSinfonia(contentXX, lang) {
  const issues = [];
  const ebKey = 'edition_blocks_' + lang;
  const ogKey = 'og_phrases_' + lang;
  const rolKey = lang === 'en' ? 'role_symphonic' : 'rol_sinfonico';
  const animoKey = lang === 'en' ? 'mood_axis' : 'eje_animo';

  // ─── edition_blocks_{lang}: 4 objetos con 4 roles únicos ───
  const eb = contentXX && contentXX[ebKey];
  if (Array.isArray(eb)) {
    const roles = eb.map(b => b && b[rolKey]).filter(Boolean);
    const unique = new Set(roles);
    if (unique.size < 4) {
      issues.push(`${ebKey} cobertura ${unique.size}/4 (${[...unique].join(',')})`);
    }
    for (const b of eb) {
      const v = b && b[animoKey];
      if (typeof v !== 'number' || v < 0 || v > 1) {
        issues.push(`${animoKey} fuera de rango en ${ebKey}`);
        break;
      }
    }
  }

  // ─── og_phrases_{lang}: 4 objetos con 4 roles únicos (C3-ND v2: ZERO TOLERANCIA) ───
  const og = contentXX && contentXX[ogKey];
  if (Array.isArray(og)) {
    if (og.length === 0) {
      issues.push(`${ogKey} vacío`);
    } else {
      const allStrings = og.every(b => typeof b === 'string');
      const allObjects = og.every(b => b && typeof b === 'object');

      if (allStrings) {
        issues.push(`${ogKey} formato legacy strings (post-v12 requiere objetos con ${rolKey})`);
      } else if (allObjects) {
        const roles = og.map(b => b[rolKey]).filter(Boolean);
        const unique = new Set(roles);
        if (unique.size < 4) {
          issues.push(`${ogKey} cobertura ${unique.size}/4 (${[...unique].join(',') || 'sin roles'})`);
        }
      } else {
        issues.push(`${ogKey} mezcla strings y objetos — formato inconsistente`);
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

function detectSpuriousBrackets(contentXX, lang) {
  const ebKey = 'edition_blocks_' + lang;
  const ogKey = 'og_phrases_' + lang;
  const phrases = [];

  const eb = contentXX && contentXX[ebKey];
  if (Array.isArray(eb)) {
    for (const b of eb) if (b && b.phrase) phrases.push(b.phrase);
  }
  const og = contentXX && contentXX[ogKey];
  if (Array.isArray(og)) {
    for (const p of og) {
      const text = (typeof p === 'string') ? p : (p && p.phrase) || '';
      if (text) phrases.push(text);
    }
  }

  const dirty = [];
  for (const phrase of phrases) {
    if (/[\u{1F300}-\u{1F9FF}][\[\]]/u.test(phrase)) { dirty.push(phrase); continue; }
    if (/[\[\]][\u{1F300}-\u{1F9FF}]/u.test(phrase)) { dirty.push(phrase); continue; }
    const open = (phrase.match(/\[/g) || []).length;
    const close = (phrase.match(/\]/g) || []).length;
    if (open !== close) { dirty.push(phrase); continue; }
    if (open > 0 && !/^[^\[\]]*\[H\][^\[\]]*\[\/H\][^\[\]]*$/.test(phrase)) {
      dirty.push(phrase);
    }
  }

  return dirty;
}

async function processBook(book, inputs, inputsSnapshot) {
  // 🎯 SPRINT A v14 — Construir contexto curatorial desde env vars
  const curatorContext = {
    timestamp: new Date().toISOString(),
    workflow_run_id: process.env.GITHUB_RUN_ID || 'local',
    catalog_mode: process.env.CATALOG_MODE || 'adulto',
    modo: process.env.SINGLE_MODE === 'true'
      ? 'single_book'
      : (process.env.SHADOW_MODE === 'true' ? 'shadow_batch' : 'production_batch'),
    punto_ciclo: process.env.TRIGGUI_PUNTO_CICLO || 'auto',
    pilar: process.env.TRIGGUI_PILAR || 'auto',
    hawkins_target: process.env.TRIGGUI_HAWKINS_TARGET || 'auto',
    lentes_activos: ['chronobiology', 'hawkins', 'pilares', 'game-theory', 'self-knowledge']
      .filter(id => {
        const envKey = 'TRIGGUI_LENS_' + id.toUpperCase().replace(/-/g, '_');
        const value = process.env[envKey];
        return value === undefined || value === 'true';  // default true si no está seteado
      }),
    lente_extra: process.env.TRIGGUI_LENS || '',
    nota_libro: process.env.TRIGGUI_BOOK_CONTEXT || '',
    sentimiento: process.env.TRIGGUI_SENTIMIENTO || ''
  };
  globalThis.__TRIGGUI_CURATOR_CONTEXT__ = curatorContext;
  console.log(`   🎯 Curator: punto=${curatorContext.punto_ciclo} | pilar=${curatorContext.pilar} | hawkins=${curatorContext.hawkins_target}`);
  console.log(`      lentes activos: ${curatorContext.lentes_activos.join(', ')}`);
  if (curatorContext.lente_extra) console.log(`      lente extra: ${curatorContext.lente_extra}`);
  if (curatorContext.nota_libro) console.log(`      nota: ${curatorContext.nota_libro.substring(0, 60)}${curatorContext.nota_libro.length > 60 ? '...' : ''}`);
  if (curatorContext.sentimiento) console.log(`      sentimiento: ${curatorContext.sentimiento.substring(0, 60)}`);

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
  // 🌒 FIRMA CUÁNTICA: recolectar hues ya usados en libros anteriores del batch
  // El array global __TRIGGUI_BATCH_HUES__ se mantiene vivo entre libros del mismo batch
  if (typeof globalThis.__TRIGGUI_BATCH_HUES__ === "undefined") {
    globalThis.__TRIGGUI_BATCH_HUES__ = [];
    globalThis.__TRIGGUI_BATCH_PALETTES__ = new Set();
    // 🌈 CAPA 2: sembrar con los hues Y paletas del catálogo ya publicado para que los
    // libros nuevos no colisionen con NINGUNO de los existentes (garantía global).
    try {
      const _prev = JSON.parse(await fs.readFile(CFG.files.outBatch, "utf8"));
      for (const _b of (_prev.libros || [])) {
        const _h = _b && _b._visual && _b._visual.synthesis_inputs && _b._visual.synthesis_inputs.hue_primary;
        if (typeof _h === "number") globalThis.__TRIGGUI_BATCH_HUES__.push(((_h % 360) + 360) % 360);
        if (Array.isArray(_b.colores)) globalThis.__TRIGGUI_BATCH_PALETTES__.add(JSON.stringify(_b.colores));
      }
      console.log(`   🌈 Capa 2: ${globalThis.__TRIGGUI_BATCH_HUES__.length} hues / ${globalThis.__TRIGGUI_BATCH_PALETTES__.size} paletas ocupadas del catálogo (anti-colisión global)`);
    } catch (_) { /* sin catálogo previo o ilegible → vacío, no rompe */ }
  }
  const __batchHues = globalThis.__TRIGGUI_BATCH_HUES__.slice();

  const anchorsRes = await retryOnce(
    () => extractAnchors(openai, book, groundTruthMeta.ground_truth, inputs.lens, { model: CFG.modelMini, previousHues: __batchHues }),
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
  // 🌈 CAPA 2 — DISPERSIÓN DETERMINISTA DE HUE (garantía matemática de variedad)
  // El LLM propone el hue (semántica); la matemática lo coloca en el hueco más grande
  // entre los ya ocupados → único + repartido, sin colisión, determinista, costo cero.
  // Si el hue del LLM cabe en ese hueco con margen, se respeta (matiz semántico).
  // (Reemplaza el push del LLM: ahora registramos el hue YA colocado.)
  if (typeof anchorsData.visual_intent.hue_primary === "number") {
    globalThis.__TRIGGUI_BATCH_PALETTES__ = globalThis.__TRIGGUI_BATCH_PALETTES__ || new Set();
    const _hueLLM = anchorsData.visual_intent.hue_primary;
    const _huePlaced = placeHueInGap(globalThis.__TRIGGUI_BATCH_HUES__, _hueLLM);
    // Garantía de PALETA única (no solo hue): si la paleta ya existe, empuja el mínimo.
    const _paletteKeyOf = (h) => JSON.stringify(synthesizePalette({ ...anchorsData.visual_intent, hue_primary: h }).palette);
    const _hueFinal = uniquePaletteHue(_huePlaced, globalThis.__TRIGGUI_BATCH_PALETTES__, _paletteKeyOf);
    anchorsData.visual_intent.hue_primary = _hueFinal;
    globalThis.__TRIGGUI_BATCH_HUES__.push(_hueFinal);
    globalThis.__TRIGGUI_BATCH_PALETTES__.add(_paletteKeyOf(_hueFinal));
    console.log(`   🌈 Hue Capa 2: LLM=${Math.round(_hueLLM)}° → ${Math.round(_hueFinal)}°${_hueFinal !== _huePlaced ? " (nudge anti-colisión)" : ""} (ocupados=${globalThis.__TRIGGUI_BATCH_HUES__.length - 1})`);
  }

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
    } else if (groundTruthMeta.evidence._status === "EXHAUSTED") {
      // v3.7: selectBestCover no devolvió URL y evidence está EXHAUSTED.
      // Diagnóstico ruidoso antes de caer al SVG typográfico — esto convierte
      // el fallback silencioso en auditable. Cada fuente reporta su reason.
      const ev = groundTruthMeta.evidence;
      console.error(`   ❌ v3.7 EVIDENCE EXHAUSTED — sin cover válida para "${book.titulo}" / ${book.autor}`);
      console.error(`      apple.reason:        ${ev.apple?.reason || (ev.apple?.ok ? "ok_pero_sin_cover" : "n/a")}`);
      console.error(`      google.reason:       ${ev.google?.reason || (ev.google?.ok ? "ok_pero_sin_cover" : "n/a")}`);
      console.error(`      openlibrary.reason:  ${ev.openlibrary?.reason || (ev.openlibrary?.ok ? "ok_pero_sin_cover" : "n/a")}`);
      console.error(`      openlib_isbn.reason: ${ev.openlib_isbn?.reason || (ev.openlib_isbn?.ok ? "ok_pero_sin_cover" : "n/a")}`);
      console.error(`      amazon.reason:       ${ev.amazon?.reason || (ev.amazon?.ok ? "ok_pero_sin_cover" : "n/a")}`);
      console.error(`      isbn_discovered:     ${ev.isbn_discovered || "(ninguno)"}`);
      console.error(`      → cae a SVG typográfico — requiere intervención manual o cascade externo`);
      book.portada_evidence_exhausted = true;
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
    // v3.7: portada_source diferenciado para auditoría post-mortem.
    // Tres categorías: _intentional (input marcado), _evidence_exhausted (peor caso),
    // fallback estándar (CSV inválido sin evidence — caso normal de v3.6).
    if (book.needs_fallback_cover) {
      book.portada_source = "typographic_svg_fallback_intentional";
    } else if (book.portada_evidence_exhausted) {
      book.portada_source = "typographic_svg_fallback_evidence_exhausted";
    } else {
      book.portada_source = "typographic_svg_fallback";
    }
    book.portada_fallback_generated = true;
    book.portada_fallback_size_kb = Math.round(fallback.size_uri_bytes / 1024);
    if (book.portada_was_invalid) {
      book.portada_auto_healed_to_svg = true;
      console.log(`   🩹 v3.6: AUTO-HEALING fallback — SVG ${book.portada_fallback_size_kb}KB reemplaza URL fantasma (sin evidence cover)`);
    } else if (book.portada_evidence_exhausted) {
      console.error(`   ⚠️  v3.7 SVG fallback por EVIDENCE EXHAUSTED: ${book.portada_fallback_size_kb}KB — auditar logs arriba`);
    } else if (book.needs_fallback_cover) {
      console.log(`   🎨 v3.7 SVG fallback intencional (needs_fallback_cover=true): ${book.portada_fallback_size_kb}KB`);
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

  // ═══ 🌒 F7-EXTENDED: VOICE-JUDGE UNIVERSAL (Sprint Nivel Dios Capa A Pilar 2) ═══
  // El judgeBothVoices anterior cubre solo card_es y card_en (parrafoTop/parrafoBot).
  // Aquí extendemos cobertura a 16 phrases adicionales:
  //   - 4 og_phrases_es + 4 og_phrases_en
  //   - 4 edition_blocks_es + 4 edition_blocks_en
  // Si alguna sale "fuera" (suena a contraportada), regeneramos in-place
  // como autor encarnado y re-validamos.
  // Costo: ~$0.0036 + ~$0.0008 si hay 1-2 retries = ~$0.004 por libro.
  // Latencia: ~1 segundo (Promise.all paralelo).
  let voiceJudgeExtendedDegraded = false;
  let voiceJudgeExtendedRegenerations = 0;
  let mapped_voiceJudgeExt_finalVerdicts = null;
  const tF7ext = Date.now();
  try {
    let extResult = await judgeAllVoiceLayers(openai, contentESFinal, contentENFinal, book, { model: CFG.modelMini });
    tokensByPhase.voice_extended = extResult.total_tokens || 0;
    llmCallsCount += extResult.total_evaluated || 0;

    if (extResult.failures && extResult.failures.length > 0) {
      console.log(`   🎭 Voice-Ext: ${extResult.failures.length}/${extResult.total_evaluated} phrases "fuera" → regenerando`);
      const regen = await regeneratePhrasesByFeedback(
        openai,
        anchorsData,
        extResult.failures,
        contentESFinal,
        contentENFinal,
        { model: CFG.modelMini }
      );
      tokensByPhase.voice_extended += regen.total_tokens || 0;
      llmCallsCount += regen.regenerated || 0;
      voiceJudgeExtendedRegenerations = regen.regenerated || 0;

      // Re-validar después de las regeneraciones
      const reExtResult = await judgeAllVoiceLayers(openai, contentESFinal, contentENFinal, book, { model: CFG.modelMini });
      tokensByPhase.voice_extended += reExtResult.total_tokens || 0;
      llmCallsCount += reExtResult.total_evaluated || 0;

      if (reExtResult.failures && reExtResult.failures.length > 0) {
        // Aún hay fallos después del retry — degradación parcial pero el sistema sigue
        voiceJudgeExtendedDegraded = true;
        console.log(`   ⚠ Voice-Ext: ${reExtResult.failures.length} phrase(s) aún "fuera" después de regenerar`);
      } else {
        console.log(`   ✅ Voice-Ext: todas las phrases "dentro" después de regenerar (${regen.regenerated} corregidas)`);
      }
      mapped_voiceJudgeExt_finalVerdicts = reExtResult.verdicts;
    } else {
      console.log(`   ✅ Voice-Ext: todas las ${extResult.total_evaluated} phrases pasaron al primer intento`);
      mapped_voiceJudgeExt_finalVerdicts = extResult.verdicts;
    }
    elapsedByPhase.voice_extended = Date.now() - tF7ext;
  } catch (err) {
    console.log(`   ⚠ Voice-Ext falló: ${err.message}`);
    voiceJudgeExtendedDegraded = true;
    elapsedByPhase.voice_extended = Date.now() - tF7ext;
  }
  // (mapped_voiceJudgeExt_finalVerdicts queda accesible al construir mapped abajo)

  // ═══ F8: POST-PROCESADORES DETERMINISTAS ════════════════════════════
  const tF8 = Date.now();
  // ═══ C3: VALIDACIÓN SINFÓNICA + ANTI-BRACKET (v12) ════════════════════════
  const sinfoniaES = validateSinfonia(contentESFinal, 'es');
  const sinfoniaEN = validateSinfonia(contentENFinal, 'en');
  const bracketsES = detectSpuriousBrackets(contentESFinal, 'es');
  const bracketsEN = detectSpuriousBrackets(contentENFinal, 'en');
  if (sinfoniaES.ok && sinfoniaEN.ok) {
    console.log(`   🎼 Sinfonía: 4/4 roles ES + 4/4 roles EN ✓`);
  } else {
    // 🚨 C3-NIVEL DIOS — si <4/4, FALLA TOTAL (cero tolerancia)
    const errores = [];
    if (!sinfoniaES.ok) errores.push('ES: ' + sinfoniaES.issues.join('; '));
    if (!sinfoniaEN.ok) errores.push('EN: ' + sinfoniaEN.issues.join('; '));
    console.error(`   🚨 SINFONÍA INCOMPLETA — nivel dios requiere 4/4 EXACTO:`);
    errores.forEach(e => console.error('      ' + e));
    throw new Error('Sinfonía incompleta — cobertura <4/4 roles: ' + errores.join(' | '));
  }
  if (bracketsES.length > 0 || bracketsEN.length > 0) {
    console.warn(`   🛡️  Brackets espurios: ES=${bracketsES.length}, EN=${bracketsEN.length} (capa 5 frontend saneará)`);
  }

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

  // ═══ 🌒 F11: EXTRACT CSAL (Sprint Nivel Dios Capa B) ═════════════════
  // Una llamada LLM extra que produce el _csal del libro:
  //   - 30-50 trigger_situations (puertas semánticas universales)
  //   - 200+ trigger_keywords categorizados (con variantes regionales)
  //   - 10-25 concept_tags (específicos al libro)
  //   - 3-12 anti_patterns (para qué NO es)
  //   - 4 bloques con emoji_specific por libro
  //
  // Es lo que app.triggui.com usará para matching semántico runtime sin LLM,
  // deprecando QUANTUM_LENS_MAP + TRIGGUI_SYNONYMS hardcoded en el frontend.
  //
  // Costo: ~$0.0017 por libro. En batch de 20: ~$0.034 extra.
  let csalDegraded = false;
  const tF11 = Date.now();

  // Anti-contaminación de batch: paralelo a __TRIGGUI_BATCH_HUES__
  if (typeof globalThis.__TRIGGUI_BATCH_TRIGGER_SITUATIONS__ === "undefined") {
    globalThis.__TRIGGUI_BATCH_TRIGGER_SITUATIONS__ = [];
  }
  const __batchSituationsSnapshot = globalThis.__TRIGGUI_BATCH_TRIGGER_SITUATIONS__.slice();

  try {
    const csalRes = await retryOnce(
      () => extractCSAL(
        openai,
        book,
        groundTruthMeta.ground_truth,
        anchorsData,
        contentESFinal,
        {
          model: CFG.modelMini,
          previousSituations: __batchSituationsSnapshot
        }
      ),
      "extractCSAL"
    );

    mapped._csal = csalRes.data;
    elapsedByPhase.csal = Date.now() - tF11;
    tokensByPhase.csal = csalRes.usage?.total_tokens || 0;
    llmCallsCount += 1;

    // Registrar las situations del libro al global del batch (para evitar repetición)
    if (csalRes.data && Array.isArray(csalRes.data.trigger_situations)) {
      globalThis.__TRIGGUI_BATCH_TRIGGER_SITUATIONS__.push(...csalRes.data.trigger_situations);
    }

    const sitCount = csalRes.data?.trigger_situations?.length || 0;
    const tagCount = csalRes.data?.concept_tags?.length || 0;
    const antiCount = csalRes.data?.anti_patterns?.length || 0;
    console.log(`   🌒 CSAL: ${sitCount} situations | ${tagCount} concept_tags | ${antiCount} anti_patterns`);
  } catch (err) {
    console.log(`   ⚠ CSAL falló: ${err.message}`);
    mapped._csal = null;
    csalDegraded = true;
    elapsedByPhase.csal = Date.now() - tF11;
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
  // 🌒 SPRINT NIVEL DIOS — agregar warnings si voice-extended o CSAL fallaron
  if (voiceJudgeExtendedDegraded) {
    allWarnings.push(`voice_judge_extended_degraded_sprint: phrases siguen "fuera" después de regenerar (Capa A Pilar 2)`);
  }
  if (csalDegraded) {
    allWarnings.push(`csal_degraded_sprint: extractCSAL falló o devolvió null (Capa B)`);
  }

  const overallStatus = (
    judgeDegradationFlags.length > 0 ||
    book.portada_was_invalid ||
    totalCorrections > 0 ||
    highlightDegradationFlags.length > 0 ||
    lensCompatDegraded ||
    voiceJudgeExtendedDegraded ||
    csalDegraded
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
  // 🌒 SPRINT NIVEL DIOS — métricas extendidas
  mapped._metrics.voice_judge_extended_degraded = voiceJudgeExtendedDegraded;
  mapped._metrics.voice_judge_extended_regenerations = voiceJudgeExtendedRegenerations;
  mapped._metrics.csal_degraded = csalDegraded;
  if (mapped_voiceJudgeExt_finalVerdicts) {
    mapped._voice_judge_extended_verdicts = mapped_voiceJudgeExt_finalVerdicts;
  }

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

// ════════════════════════════════════════════════════════════════════════════
// 🌒 v4.4 cirugia 12 — C4.5 ADJUDICADOR LLM GROUNDED (Nivel dios cuántico-quark)
// ════════════════════════════════════════════════════════════════════════════
// Lógica reusada VERBATIM del sanitizer probado (triggui-content/auditoria-editorial/
// phrase-sanitizer-llm.cjs): classifyPhrase + bookGrounding + mirrorCardVariants.
// Se invoca DENTRO de C5, ANTES del drop. La red determinista (C1–C5) sigue intacta
// y AMPLIA (nunca se le escapa un truncamiento real). Para CADA frase que la red
// marca, el LLM grounded decide:
//   • falso positivo ("la red.", "to ask?", "The Silent Battle Within") → la limpia
//   • truncamiento real ("...hacia el", tagline sin cierre)            → la completa fiel
//   • roto e irreparable (rarísimo)                                    → cae el libro
// Guarantee intacto: nada truncado llega al usuario. Costo: gpt-4o-mini, ~400 tokens,
// solo dispara en frases marcadas (libros limpios = 0 llamadas extra).
// ════════════════════════════════════════════════════════════════════════════

// Grounding del libro: material REAL para completar fiel (no inventar). Vive en
// _nucleus.book_grounding_anchors + _nucleus.book_identity. Si no hay → null (el LLM
// completa "a ciegas" y la red determinista sigue garantizando que nada truncado pase).
function buildBookGrounding(libro) {
  const n = (libro && libro._nucleus) ? libro._nucleus : {};
  const a = n.book_grounding_anchors || {};
  const id = n.book_identity || {};
  const concepts = Array.isArray(a.concepts) ? a.concepts.filter((x) => typeof x === "string" && x.trim()) : [];
  const terms = Array.isArray(a.key_terms) ? a.key_terms.filter((x) => typeof x === "string" && x.trim()) : [];
  const voice = (typeof a.authorial_voice_notes === "string") ? a.authorial_voice_notes.trim() : "";
  const titulo = id.titulo_es || (libro && libro.titulo) || "";
  const autor = id.autor_completo || (libro && libro.autor) || "";
  if (!concepts.length && !terms.length && !voice) return null;
  return { titulo, autor, concepts, terms, voice };
}

// Espejo de variantes de tarjeta (congruencia entre superficies: tarjeta es la
// canónica; base/presentacion la espejan). Solo campos de TEXTO. Devuelve cuántos sincronizó.
function mirrorCardVariants(libro) {
  if (!libro || typeof libro !== "object") return 0;
  let changed = 0;
  const FIELDS = ["titulo", "subtitulo", "parrafoTop", "parrafoBot"];
  const pairs = [
    { src: libro.tarjeta, base: libro.tarjeta_base, pres: libro.tarjeta_presentacion },
    { src: libro.tarjeta_en, base: libro.tarjeta_base_en, pres: libro.tarjeta_presentacion_en }
  ];
  for (const { src, base, pres } of pairs) {
    if (!src || typeof src !== "object") continue;
    for (const f of FIELDS) {
      const v = src[f];
      if (typeof v !== "string" || !v.trim()) continue;
      if (base && typeof base === "object" && base[f] !== v) { base[f] = v; changed++; }
      if (pres && typeof pres === "object" && pres[f] !== v) { pres[f] = v; changed++; }
    }
  }
  return changed;
}

// Clasificador/corrector grounded — prompt PROBADO, idéntico al sanitizer (se reusa
// verbatim, no se modifica). temp 0, max_tokens 400, json_object, gpt-4o-mini.
// Devuelve { truncated, confidence, fixed_phrase, reason }.
async function llmClassifyPhrase(openaiClient, phrase, grounding) {
  const system = `Eres un detector y corrector estricto de frases truncadas en español o inglés. Respondes SOLO JSON.

UNA FRASE ESTÁ TRUNCADA si:
- Termina con palabra cortada (prefijo sin sufijo: "incertid", "tambi", "af.", "í.")
- Termina con preposición/artículo sin completar idea ("vivir en", "actúa desde.", "el af.")
- La idea sintáctica/semántica está claramente incompleta

NO ESTÁ TRUNCADA si:
- Termina con punto/?/! con idea cerrada coherente
- Es pregunta retórica completa
- Es título corto del catálogo
- Termina con expresión válida ("tú eres mucho más." "la oscuridad del ego.")

Sé CONSERVADOR: en duda razonable, di que NO está truncada.

═══════════════════════════════════════════════════════════════════
🛡️ REGLAS DURAS PARA "fixed_phrase" — NO LAS ROMPAS BAJO NINGUNA CIRCUNSTANCIA:

0. 🌐 IDIOMA (REGLA SUPREMA, POR ENCIMA DE TODAS): "fixed_phrase" DEBE estar 100% en el
   MISMO IDIOMA que la frase original. Original en inglés → completas en inglés; original
   en español → completas en español. El "CONTEXTO DEL LIBRO" puede venir en OTRO idioma:
   úsalo SOLO para las IDEAS, JAMÁS para el idioma. PROHIBIDO mezclar idiomas dentro de una
   misma frase. Si la única forma de completar fiel sería mezclando idiomas, aplica la
   regla 6 (recorta al último punto) o la 7 (omite).

1. "fixed_phrase" DEBE empezar con LITERALMENTE las mismas palabras del original
   (incluido emoji inicial si lo tiene).
2. Solo modificas/agregas al FINAL de la frase, corrigiendo el truncamiento.
3. La longitud de "fixed_phrase" DEBE ser MAYOR O IGUAL al original.
4. NUNCA reemplaces, resumas, o acortes el texto previo.
5. Si el original es un párrafo de varias oraciones, PRESERVA TODAS las oraciones
   completas y solo corrige la última que está truncada.
6. Si no puedes corregir preservando todo el contexto, devuelve el original
   TRUNCADO AL ÚLTIMO PUNTO COMPLETO VÁLIDO (sin agregar palabras inventadas).
7. Si el truncamiento no tiene punto válido previo, omite "fixed_phrase".
═══════════════════════════════════════════════════════════════════
📚 FIDELIDAD AL LIBRO — cuando se te dé "CONTEXTO DEL LIBRO":
8. Completa usando SOLO ideas, términos y tono coherentes con ese contexto.
9. NUNCA inventes conceptos, datos o ideas ajenas al libro para rellenar.
10. Si no puedes completar de forma fiel al contexto del libro, aplica la regla 6
    (recorta al último punto completo) o la 7 (omite). Mejor corto y fiel del libro
    que largo e inventado. La autenticidad pesa más que la longitud.
═══════════════════════════════════════════════════════════════════

EJEMPLO CORRECTO (con contexto del libro):
  contexto:     conceptos del libro incluyen "la conexión entre emociones y eficacia en el trabajo"
  original:     "La clave está en la conexión entre emociones y"
  fixed_phrase: "La clave está en la conexión entre emociones y eficacia en el trabajo."

EJEMPLO INCORRECTO (NO HACER):
  original:     "La vida es compleja. El destino nos sorprende. Aceptar es la"
  fixed_phrase: "Aceptar es la clave."   ← REEMPLAZÓ TODO, ESTÁ MAL

Responde JSON:
{
  "truncated": true|false,
  "confidence": 0.0-1.0,
  "fixed_phrase": "<frase ENTERA original con final corregido, preservando TODO contexto previo>",
  "reason": "<10 palabras max>"
}`;

  let groundingBlock = "";
  if (grounding) {
    groundingBlock =
      "\n\nCONTEXTO DEL LIBRO (úsalo para completar FIEL — NO inventes nada fuera de esto):" +
      "\nLibro: \"" + grounding.titulo + "\"" + (grounding.autor ? " — " + grounding.autor : "") +
      (grounding.concepts.length ? "\nConceptos del libro: " + grounding.concepts.join("; ") : "") +
      (grounding.terms.length ? "\nTérminos clave: " + grounding.terms.join(", ") : "") +
      (grounding.voice ? "\nVoz del autor: " + grounding.voice : "");
  }

  const user = "Frase original:\n\"" + phrase + "\"\n\nLongitud original: " + phrase.length +
    " chars.\nSi truncada, devuelve fixed_phrase de longitud ≥ " + phrase.length +
    " chars con TODO el contexto previo preservado." + groundingBlock;

  const res = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    max_tokens: 400,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: system }, { role: "user", content: user }]
  });
  const content = res?.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
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

    // 🌒 V10 NUMERACIÓN NIVEL DIOS CUÁNTICO-QUARK
    // ════════════════════════════════════════════════════════════════════════
    // Inicializar/preservar meta con next_edition_number
    // Default 36 (35 ediciones existentes en public/t/ + 1)
    // Configurable vía env var TRIGGUI_EDICION_START_NUMBER
    if (!existing.meta || typeof existing.meta !== "object") {
      existing.meta = {};
    }
    if (typeof existing.meta.next_edition_number !== "number" || existing.meta.next_edition_number < 1) {
      const envStart = parseInt(process.env.TRIGGUI_EDICION_START_NUMBER, 10);
      if (!isNaN(envStart) && envStart >= 1) {
        existing.meta.next_edition_number = envStart;
      } else {
        // 🌒 v3.8 NIVEL DIOS — Init contador GLOBAL combinado (adulto + kids):
        // Sin esto, fallback hardcoded a 36. Con esto, lee max del OTRO catálogo
        // para que kids y adulto compartan numeración consecutiva desde cero.
        let globalMax = 0;
        try {
          const otherCatalogPath = String(targetPath).includes("_kids")
            ? String(targetPath).replace("_kids", "")
            : String(targetPath).replace(".json", "_kids.json");
          const otherExists = await fs.access(otherCatalogPath).then(() => true).catch(() => false);
          if (otherExists) {
            const otherJson = JSON.parse(await fs.readFile(otherCatalogPath, "utf8"));
            if (typeof otherJson.meta?.next_edition_number === "number" && otherJson.meta.next_edition_number >= 2) {
              globalMax = Math.max(globalMax, otherJson.meta.next_edition_number - 1);
            }
            for (const libro of (otherJson.libros || [])) {
              if (typeof libro._edicion_numero === "number" && libro._edicion_numero > globalMax) {
                globalMax = libro._edicion_numero;
              }
            }
          }
        } catch { /* best-effort */ }
        existing.meta.next_edition_number = globalMax + 1;
      }
    }

    // Defensa cuántica anti-corrupción: meta.next >= max(_edicion_numero) + 1
    let maxLibroEdNum = 0;
    for (const libro of existing.libros) {
      if (typeof libro._edicion_numero === "number" && libro._edicion_numero > maxLibroEdNum) {
        maxLibroEdNum = libro._edicion_numero;
      }
    }

    // 🌒 v3.8 NIVEL DIOS — CONTADOR GLOBAL COMBINADO (adulto + kids):
    // Cada vez que se asigna un _edicion_numero, leer también el max del OTRO
    // catálogo. Garantiza consecutivos globales sin colisión entre kids/adulto.
    // Sin este bloque, adulto #36 y kids #36 podrían coexistir.
    try {
      const otherCatalogPath = String(targetPath).includes("_kids")
        ? String(targetPath).replace("_kids", "")
        : String(targetPath).replace(".json", "_kids.json");
      const otherExists = await fs.access(otherCatalogPath).then(() => true).catch(() => false);
      if (otherExists) {
        const otherJson = JSON.parse(await fs.readFile(otherCatalogPath, "utf8"));
        if (typeof otherJson.meta?.next_edition_number === "number" && otherJson.meta.next_edition_number >= 2) {
          maxLibroEdNum = Math.max(maxLibroEdNum, otherJson.meta.next_edition_number - 1);
        }
        for (const libro of (otherJson.libros || [])) {
          if (typeof libro._edicion_numero === "number" && libro._edicion_numero > maxLibroEdNum) {
            maxLibroEdNum = libro._edicion_numero;
          }
        }
      }
    } catch { /* best-effort */ }

    if (existing.meta.next_edition_number <= maxLibroEdNum) {
      existing.meta.next_edition_number = maxLibroEdNum + 1;
    }
    // ════════════════════════════════════════════════════════════════════════

    // 🌒 v3.8.2 cirugia 7.1B — DEFENSA ACTIVA para parrafoTop/parrafoBot truncados
    // Antes era warning pasivo (V10 BUG 2). Ahora REPARA truncando al ultimo cierre valido.
    // Cubre lo que el prompt (cirugia 7.1A) no logra: GPT-4o-mini obedece mejor en EN que en ES.
    // Filosofia: no confiar en stochastic LLM, validar matematicamente en codigo.
    try {
      // 🌒 LEGITIMATE se declara con `var` (scope de FUNCIÓN) porque varios bloques
      // hermanos (cards / universal-repair / C5) lo usan. La DETECCIÓN de truncamiento
      // (Sets + reglas) ya no vive aquí: está en ./detect-truncation.js (detectTruncation).
      var LEGITIMATE = [".", "?", "!", "…", "—", '"', "»", ")", "]"];

      // 🌒 Los 3 Sets (VALID_SHORT_CLOSURES / STOPWORDS_INVALID_AT_END / TRUNCATED_PREFIXES)
      // e isTitleField se movieron a ./detect-truncation.js (única fuente de verdad).
      // La detección de truncamiento ahora vive SOLO ahí, vía detectTruncation().
      // LEGITIMATE se conserva aquí porque otros bloques (cards / universal) lo usan aparte.

      // 🌒 PRINCIPIO NIVEL DIOS: ninguna heurística con falsos positivos toma una acción
      // destructiva. repairTruncatedField YA NO ampute (cirugía 13 completada). La versión
      // anterior, al detectar truncamiento, cortaba el párrafo de vuelta a la oración previa
      // — y en un falso positivo ("...to be.", "...your being.") borraba EN SILENCIO una frase
      // buena, sin dejar rastro. Ahora solo normaliza espacios y DIFIERE: la detección la hace
      // C5 (collectTruncations vía detectTruncation), C4.5 adjudica, y lo que no se resuelva se
      // MARCA (_c5_flags) y se deja pasar para tu revisión — nunca se muta a ciegas. Conserva
      // su firma (text, label) para no tocar a los bloques que ya lo llaman.
      var repairTruncatedField = (text, label = "?") => {
        if (!text || typeof text !== "string") return text;
        return text.trim();
      };
      const cards = [
        { card: newBook.tarjeta, base: newBook.tarjeta_base, pres: newBook.tarjeta_presentacion, lang: "ES" },
        { card: newBook.tarjeta_en, base: newBook.tarjeta_base_en, pres: newBook.tarjeta_presentacion_en, lang: "EN" }
      ];
      for (const { card, base, pres, lang } of cards) {
        if (!card) continue;
        for (const field of ["parrafoTop", "parrafoBot"]) {
          if (!card[field]) continue;
          const original = String(card[field]);
          const repaired = repairTruncatedField(original);
          if (repaired !== original) {
            const beforeTail = original.replace(/\[\/?H\]/g, "").trim().slice(-30);
            const afterTail = repaired.replace(/\[\/?H\]/g, "").trim().slice(-30);
            card[field] = repaired;
            if (base) base[field] = repaired;
            if (pres) pres[field] = repaired;
            console.log(`   🪡 ${lang} ${field} REPARADO en "${newBook.titulo}": "...${beforeTail}" → "...${afterTail}"`);

            // 🌒 v3.8.5 cirugia 9 — Highlight Re-injection After Repair (Nivel dios cuantico-quark)
            // Bug detectado en Vida Contemplativa #050 (2026-05-13): cuando placeHighlightOnDensestSpan
            // (via compatMapper -> ensureHighlight) pone marcas [H][/H] en la ULTIMA frase del parrafoTop
            // y esa frase venia TRUNCADA del LLM (sin cierre legitimo), repairTruncatedField corta
            // hasta el ultimo punto legitimo ANTES de las marcas, eliminandolas con la seccion truncada.
            // Sintoma: parrafoTop reparado sin marcas, mientras parrafoBot las preserva normalmente.
            // Fix: si las marcas se perdieron, re-inyectar con placeHighlightOnDensestSpan sobre el
            // texto reparado (que ya tiene cierre legitimo). El nuevo highlight cae en la frase de
            // mayor densidad semantica del texto saneado.
            const hadMarks = /\[H\]/.test(original);
            const hasMarksAfter = /\[H\]/.test(repaired);
            if (hadMarks && !hasMarksAfter) {
              const reinjected = placeHighlightOnDensestSpan(repaired);
              if (/\[H\]/.test(reinjected) && reinjected !== repaired) {
                card[field] = reinjected;
                if (base) base[field] = reinjected;
                if (pres) pres[field] = reinjected;
                const segs = reinjected.match(/\[H\](.*?)\[\/H\]/s);
                const newHl = segs ? segs[1].substring(0, 50) : "(?)";
                console.log(`   🪡 ${lang} ${field} HIGHLIGHT RE-INYECTADO en "${newBook.titulo}": "${newHl}..."`);
              } else {
                console.warn(`   ⚠️  ${lang} ${field} sin re-inyeccion (placeHighlightOnDensestSpan no produjo marcas)`);
              }
            }
          } else {
            const plain = original.replace(/\[\/?H\]/g, "").trim();
            const lastChar = plain.slice(-1);
            if (!LEGITIMATE.includes(lastChar)) {
              console.warn(`   ⚠️  ${lang} ${field} sin cierre y sin punto interno reparable en "${newBook.titulo}": "...${plain.slice(-40)}"`);
            }
          }
        }
      }
    } catch (e) { console.warn(`   ⚠️  repair-parrafo error: ${e.message}`); }

    // ════════════════════════════════════════════════════════════════════════
    // 🌒 v4.0 cirugia 7.1C — UNIVERSAL REPAIR (extensión nivel dios)
    // ════════════════════════════════════════════════════════════════════════
    // Aplica repairTruncatedField a TODOS los campos textuales, no solo
    // parrafoTop/parrafoBot. Determinístico: solo corta al último punto
    // interno legítimo, NO inventa contenido. Si la frase entera está
    // truncada sin punto interno reparable, queda como está y C5 abortará.
    //
    // Campos cubiertos:
    //   • Strings simples: titulo, subtitulo, tagline (en cards y top-level)
    //   • Arrays de strings: frases, frases_en, frases_og, frases_og_en
    //   • Arrays de objetos con .phrase: edition_blocks_*, og_phrases_*
    // ════════════════════════════════════════════════════════════════════════
    try {
      // (A.1) Strings simples a nivel card
      for (const { card, base, pres, lang } of [
        { card: newBook.tarjeta, base: newBook.tarjeta_base, pres: newBook.tarjeta_presentacion, lang: "ES" },
        { card: newBook.tarjeta_en, base: newBook.tarjeta_base_en, pres: newBook.tarjeta_presentacion_en, lang: "EN" }
      ]) {
        if (!card) continue;
        for (const field of ["titulo", "subtitulo"]) {
          const original = card[field];
          if (typeof original !== "string" || !original.trim()) continue;
          const repaired = repairTruncatedField(original, `${lang} ${field}`);
          if (repaired !== original) {
            card[field] = repaired;
            // 🌒 v4.2 — espejo a base/presentacion (congruencia tarjeta/edición/correo: la tarjeta PNG
            // lee tarjeta_presentacion, el correo y la edición leen tarjeta — deben coincidir SIEMPRE)
            if (base) base[field] = repaired;
            if (pres) pres[field] = repaired;
            console.log(`   🪡 ${lang} ${field} REPARADO en "${newBook.titulo}": "${original.slice(-30)}" → "${repaired.slice(-30)}"`);
          }
        }
      }

      // (A.2) Strings simples a nivel top-level (tagline)
      if (typeof newBook.tagline === "string" && newBook.tagline.trim()) {
        const repaired = repairTruncatedField(newBook.tagline, "tagline");
        if (repaired !== newBook.tagline) {
          console.log(`   🪡 tagline REPARADO en "${newBook.titulo}": "${newBook.tagline.slice(-30)}" → "${repaired.slice(-30)}"`);
          newBook.tagline = repaired;
        }
      }

      // (A.3) Arrays de strings (frases, frases_og, etc.) a nivel top-level
      for (const arrField of ["frases", "frases_en", "frases_og", "frases_og_en"]) {
        const arr = newBook[arrField];
        if (!Array.isArray(arr)) continue;
        for (let i = 0; i < arr.length; i++) {
          const original = arr[i];
          if (typeof original !== "string" || !original.trim()) continue;
          const repaired = repairTruncatedField(original, `${arrField}[${i}]`);
          if (repaired !== original) {
            console.log(`   🪡 ${arrField}[${i}] REPARADO en "${newBook.titulo}": "${original.slice(-30)}" → "${repaired.slice(-30)}"`);
            arr[i] = repaired;
          }
        }
      }

      // (A.4) Arrays de objetos con .phrase (edition_blocks_*, og_phrases_*)
      const nucleus = newBook._nucleus;
      if (nucleus && typeof nucleus === "object") {
        for (const arrField of ["edition_blocks_es", "edition_blocks_en", "og_phrases_es", "og_phrases_en"]) {
          const arr = nucleus[arrField];
          if (!Array.isArray(arr)) continue;
          for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            if (!item || typeof item !== "object" || typeof item.phrase !== "string") continue;
            const original = item.phrase;
            if (!original.trim()) continue;
            const repaired = repairTruncatedField(original, `_nucleus.${arrField}[${i}].phrase`);
            if (repaired !== original) {
              console.log(`   🪡 _nucleus.${arrField}[${i}].phrase REPARADO en "${newBook.titulo}": "${original.slice(-30)}" → "${repaired.slice(-30)}"`);
              item.phrase = repaired;
            }
          }
        }
        // (A.5) Strings a nivel _nucleus.card_es/_en (parrafoTop/Bot/titulo/subtitulo dentro de nucleus)
        for (const cardKey of ["card_es", "card_en"]) {
          const ncard = nucleus[cardKey];
          if (!ncard || typeof ncard !== "object") continue;
          for (const field of ["parrafoTop", "parrafoBot", "titulo", "subtitulo"]) {
            const original = ncard[field];
            if (typeof original !== "string" || !original.trim()) continue;
            const repaired = repairTruncatedField(original, `_nucleus.${cardKey}.${field}`);
            if (repaired !== original) {
              console.log(`   🪡 _nucleus.${cardKey}.${field} REPARADO en "${newBook.titulo}": "${original.slice(-30)}" → "${repaired.slice(-30)}"`);
              ncard[field] = repaired;
            }
          }
        }
      }
    } catch (e) { console.warn(`   ⚠️  universal-repair error: ${e.message}`); }

    // ════════════════════════════════════════════════════════════════════════
    // 🌒 v4.0 cirugia 8 — ASSERTION CUÁNTICA NIVEL DIOS (Capa C5)
    // ════════════════════════════════════════════════════════════════════════
    // Última defensa antes del merge al JSON. Recorre TODOS los campos textuales
    // del libro y verifica que NINGUNO termine con truncamiento (palabra <5 chars
    // no whitelisted, o stopword colgante).
    //
    // Si encuentra al menos un truncamiento NO REPARABLE (que C4 no pudo corregir
    // porque no había punto interno legítimo), DETIENE el procesamiento del libro
    // con throw. El libro NO se commitea al JSON.
    //
    // Esta es la garantía matemática: para que un truncamiento llegue al JSON
    // final, las 5 capas (C1 max_tokens + C2 prompt universal + C3 anti-trunc
    // check + C4 repair determinístico + C5 assertion) tendrían que fallar
    // simultáneamente.
    // ════════════════════════════════════════════════════════════════════════
    try {
      const llmCleared = new Set(); // 🌒 C4.5: valores que el LLM confirmó COMPLETOS (falsos positivos) → no re-marcar

      // 🌒 v4.4 cirugia 12 — detección re-ejecutable (corre antes y después del adjudicador).
      // Lógica de detección IDÉNTICA a v4.3: no se toca ninguna regla (red amplia = guarantee).
      const collectTruncations = () => {
        const found = [];
        const checkPhrase = (text, fieldLabel, applyFn) => {
          if (typeof text !== "string") return;
          const trimmed = text.trim();
          if (!trimmed) return;
          if (llmCleared.has(trimmed)) return; // 🌒 C4.5: ya confirmada COMPLETA por el LLM → no re-marcar
          const plain = trimmed.replace(/\[\/?H\]/g, "");
          // 🌒 Detección vía módulo único ./detect-truncation.js (reglas v4.3 reubicadas).
          // Antes esta lógica estaba duplicada byte-por-byte aquí y en repairTruncatedField.
          const { truncado, reason } = detectTruncation(trimmed, fieldLabel);
          if (truncado) {
            found.push({
              field: fieldLabel,
              reason,
              tail: plain.slice(-50),
              value: trimmed,   // 🌒 C4.5: valor crudo para clasificar / aplicar fix
              apply: applyFn    // 🌒 C4.5: setter que escribe el fix en su ubicación exacta
            });
          }
        };

        // Recorrer card_es / card_en — top level
        for (const { card, lang } of [
          { card: newBook.tarjeta, lang: "ES" },
          { card: newBook.tarjeta_en, lang: "EN" }
        ]) {
          if (!card) continue;
          for (const field of ["parrafoTop", "parrafoBot", "titulo", "subtitulo"]) {
            checkPhrase(card[field], `${lang} tarjeta.${field}`, (v) => { card[field] = v; });
          }
        }

        // Top-level tagline
        checkPhrase(newBook.tagline, "tagline", (v) => { newBook.tagline = v; });

        // Arrays top-level
        for (const arrField of ["frases", "frases_en", "frases_og", "frases_og_en"]) {
          const arr = newBook[arrField];
          if (!Array.isArray(arr)) continue;
          for (let i = 0; i < arr.length; i++) {
            const idx = i;
            checkPhrase(arr[idx], `${arrField}[${idx}]`, (v) => { arr[idx] = v; });
          }
        }

        // _nucleus arrays + cards
        const nucleus = newBook._nucleus;
        if (nucleus && typeof nucleus === "object") {
          for (const arrField of ["edition_blocks_es", "edition_blocks_en", "og_phrases_es", "og_phrases_en"]) {
            const arr = nucleus[arrField];
            if (!Array.isArray(arr)) continue;
            for (let i = 0; i < arr.length; i++) {
              const item = arr[i];
              if (item && typeof item === "object") {
                checkPhrase(item.phrase, `_nucleus.${arrField}[${i}].phrase`, (v) => { item.phrase = v; });
              }
            }
          }
          for (const cardKey of ["card_es", "card_en"]) {
            const ncard = nucleus[cardKey];
            if (!ncard || typeof ncard !== "object") continue;
            for (const field of ["parrafoTop", "parrafoBot", "titulo", "subtitulo"]) {
              checkPhrase(ncard[field], `_nucleus.${cardKey}.${field}`, (v) => { ncard[field] = v; });
            }
          }
        }
        return found;
      };

      let truncamientosResiduales = collectTruncations();

      // ════════════════════════════════════════════════════════════════════
      // 🌒 v4.4 cirugia 12 — C4.5 ADJUDICADOR LLM GROUNDED (ANTES del drop)
      // ════════════════════════════════════════════════════════════════════
      // La red determinista de arriba es AMPLIA a propósito (nunca se le escapa un
      // truncamiento real, aunque marque algún falso positivo como "la red." o
      // "to ask?"). Para CADA frase marcada, el LLM grounded (classifyPhrase probado)
      // decide: completar fiel (truncamiento real) o limpiar (falso positivo). Solo
      // si el LLM TAMPOCO la resuelve, cae el libro. Guarantee intacto.
      // Frases idénticas se clasifican UNA vez y el fix se aplica a TODAS sus
      // ubicaciones (congruencia frases_og ↔ og_phrases, edition_blocks ↔ frases, etc).
      if (truncamientosResiduales.length > 0) {
        const grounding = buildBookGrounding(newBook);
        const byValue = new Map();
        for (const r of truncamientosResiduales) {
          if (!byValue.has(r.value)) byValue.set(r.value, []);
          byValue.get(r.value).push(r);
        }
        console.log(`   🧬 C4.5 adjudicador LLM: ${byValue.size} frase(s) marcada(s), ${truncamientosResiduales.length} ubicación(es) — grounded=${grounding ? "sí" : "no"}`);
        for (const [value, records] of byValue) {
          let verdict = null;
          try {
            verdict = await llmClassifyPhrase(openai, value, grounding);
          } catch (e) {
            console.warn(`   ⚠️  C4.5 classify error (${records[0].field}): ${e.message} — se mantiene marcada`);
            continue;
          }
          const plainVal = value.replace(/\[\/?H\]/g, "");
          // (a) Falso positivo: el LLM confirma que NO está truncada → limpiar (se omite en la re-evaluación)
          if (verdict && verdict.truncated === false) {
            llmCleared.add(value);
            console.log(`   ✅ C4.5 falso positivo confirmado: ${records[0].field} — "...${plainVal.slice(-40)}"`);
            continue;
          }
          // (b) Truncamiento real con fix válido (preserva prefijo + longitud) → completar + espejar
          const fixed = (verdict && typeof verdict.fixed_phrase === "string") ? verdict.fixed_phrase.trim() : "";
          const plainFixed = fixed.replace(/\[\/?H\]/g, "");
          const prefixLen = Math.min(12, plainVal.length);
          const startsOk = plainFixed.length > 0 && plainVal.length > 0 &&
            plainFixed.slice(0, prefixLen).toLowerCase() === plainVal.slice(0, prefixLen).toLowerCase();
          if (verdict && verdict.truncated === true && fixed && plainFixed.length >= plainVal.length && startsOk) {
            // 🌒 RIEL DETERMINISTA (sin listas, sin detección de idioma): el "completado" de
            // C4.5 NO puede empeorar la frase. Lo paso por el MISMO detector; si el fix vuelve a
            // marcarse como truncado (p.ej. quedó colgando, o terminó en un token corto/ambiguo
            // como "...XX."), se RECHAZA y se conserva el ORIGINAL. Esto mata en seco el modo de
            // falla donde C4.5 reescribe una frase buena y mete algo que re-dispara C5. Reusa
            // detectTruncation — cero reglas nuevas.
            const fixCheck = detectTruncation(fixed, records[0].field);
            if (fixCheck.truncado) {
              console.warn(`   🚧 C4.5 fix RECHAZADO por riel (${records[0].field}): el completado re-dispara detección (${fixCheck.reason}) — se conserva el original`);
            } else {
              for (const r of records) r.apply(fixed);
              console.log(`   🪡 C4.5 completada (${records.length} ubic.): ${records[0].field} — "...${plainVal.slice(-30)}" → "...${plainFixed.slice(-30)}"`);
            }
            continue;
          }
          // (c) El LLM no dio fix válido (no preservó prefijo/longitud) → se mantiene marcada (caerá en el veredicto)
          console.warn(`   ⚠️  C4.5 sin fix válido: ${records[0].field} — el LLM no preservó prefijo/longitud`);
        }
        // Congruencia de las 3 variantes de tarjeta tras las correcciones
        mirrorCardVariants(newBook);
        // Re-evaluar tras adjudicación: cleared se omiten, completadas ya cierran, irreparables persisten
        truncamientosResiduales = collectTruncations();
      }

      // 🌒 PRINCIPIO NIVEL DIOS: C5 ya NO aborta el build. Detecta → MARCA → deja pasar.
      // Antes lanzaba C5_QUANTUM_ASSERTION_FAILED, el libro no se commiteaba, y reventaba
      // build-editions después — el YML tronaba por falsos positivos ("siglo XX", "to be",
      // "your being"). Ahora los residuales se anotan en newBook._c5_flags (viajan al
      // contenido.json, grepeables) y se loguean, pero el libro SE COMMITEA, el run termina en
      // verde, se generan tarjeta/HTML/OG, y tú revisas la marca en el resultado final cuando
      // quieras (o nunca). La detección NO se debilita: sigue marcando exactamente lo mismo.
      if (truncamientosResiduales.length > 0) {
        newBook._c5_flags = truncamientosResiduales.map((t) => ({
          field: t.field,
          reason: t.reason,
          tail: t.tail
        }));
        console.warn(``);
        console.warn(`   ╔══════════════════════════════════════════════════════════════════╗`);
        console.warn(`   ║  🔎 CAPA C5 — frases marcadas para revisión (NO bloquea el build)  ║`);
        console.warn(`   ╚══════════════════════════════════════════════════════════════════╝`);
        console.warn(`   Libro: "${newBook.titulo}" — ${truncamientosResiduales.length} marcada(s)`);
        for (const t of truncamientosResiduales) {
          console.warn(`     • ${t.field}`);
          console.warn(`       razón: ${t.reason}`);
          console.warn(`       cola:  "...${t.tail}"`);
        }
        console.warn(`   → Anotadas en _c5_flags. El libro SE COMMITEA; revisa el resultado final cuando quieras.`);
        console.warn(``);
      } else {
        console.log(`   ✅ C5 assertion: 0 truncamientos residuales en "${newBook.titulo}"`);
      }
    } catch (e) {
      // 🌒 C5 ya no lanza C5_QUANTUM_ASSERTION_FAILED; aquí solo se atrapan errores
      // inesperados del bloque (degradación elegante — nunca aborta por la assertion).
      console.warn(`   ⚠️  C5 assertion error inesperado: ${e.message}`);
    }

    // 🌒 v3.8.5 cirugia 10 — Defensa Final Universal Pre-Merge (Nivel dios cuantico-quark)
    // GARANTIA ABSOLUTA: cada parrafoTop/parrafoBot del JSON final tiene marcas [H][/H].
    // Esta es la cuarta capa de defensa cuantica del pipeline de highlights:
    //   1. LLM prompt MANDATORY CLOSURE                    (prevencion)
    //   2. Cirugia 7.1A HighlightJudge auto-correct        (correccion semantica)
    //   3. Cirugia 7.1B repairTruncatedField               (reparacion de cierre)
    //   4. Cirugia 9   Re-injection After Repair           (cubre perdida por corte)
    //   5. Cirugia 10  Defensa Final Universal Pre-Merge   (← ESTA — garantia absoluta)
    // Independientemente de donde venga un bug futuro de perdida de marcas, esta capa
    // valida las 6 ubicaciones (tarjeta x 3 x ES/EN) y re-inyecta si faltan marcas.
    // Costo: cero LLM calls. Solo regex + string ops. ~6 verificaciones por libro.
    try {
      const allCards = [
        { card: newBook.tarjeta, lang: "ES", role: "tarjeta" },
        { card: newBook.tarjeta_base, lang: "ES", role: "tarjeta_base" },
        { card: newBook.tarjeta_presentacion, lang: "ES", role: "tarjeta_presentacion" },
        { card: newBook.tarjeta_en, lang: "EN", role: "tarjeta_en" },
        { card: newBook.tarjeta_base_en, lang: "EN", role: "tarjeta_base_en" },
        { card: newBook.tarjeta_presentacion_en, lang: "EN", role: "tarjeta_presentacion_en" }
      ];
      let defensaFinalActivada = 0;
      for (const { card, lang, role } of allCards) {
        if (!card) continue;
        for (const field of ["parrafoTop", "parrafoBot"]) {
          if (!card[field]) continue;
          if (!/\[H\]/.test(card[field])) {
            const reinjected = placeHighlightOnDensestSpan(card[field]);
            if (/\[H\]/.test(reinjected) && reinjected !== card[field]) {
              card[field] = reinjected;
              defensaFinalActivada += 1;
              const segs = reinjected.match(/\[H\](.*?)\[\/H\]/s);
              const newHl = segs ? segs[1].substring(0, 40) : "(?)";
              console.log(`   🛡️  Defensa final ${lang} ${role}.${field}: marcas re-inyectadas — "${newHl}..."`);
            } else {
              console.warn(`   ⚠️  Defensa final ${lang} ${role}.${field}: NO se pudieron re-inyectar (texto no parseable)`);
            }
          }
        }
      }
      if (defensaFinalActivada === 0) {
        console.log(`   ✅ Defensa final: las 12 marcas [H][/H] ya presentes (6 ubicaciones x 2 campos)`);
      } else {
        console.log(`   🛡️  Defensa final: ${defensaFinalActivada} marca(s) re-inyectada(s) — JSON garantizado`);
      }
    } catch (e) { console.warn(`   ⚠️  defensa-final error: ${e.message}`); }

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

      // 🌒 V10 IDEMPOTENCIA NIVEL DIOS — preservar _edicion_numero al sobrescribir
      // Si el libro existente ya tenía número (porque fue single previamente),
      // se preserva incluso si lo sobrescribe un batch.
      if (typeof existingBook._edicion_numero === "number" && existingBook._edicion_numero >= 1) {
        newBook._edicion_numero = existingBook._edicion_numero;
      } else if (!isFromBatch) {
        // 🌒 v3.8 cirugia 3 — Single regen: asignar desde counter file (SSOT)
        try {
          const assigned = await assignEditionFromCounter(targetPath, newBook);
          newBook._edicion_numero = assigned;
          if (existing.meta.next_edition_number <= assigned) {
            existing.meta.next_edition_number = assigned + 1;
          }
        } catch (err) {
          console.warn(`   counter file no disponible, fallback a meta: ${err.message}`);
          newBook._edicion_numero = existing.meta.next_edition_number;
          existing.meta.next_edition_number += 1;
        }
      }
      // (Si es batch y libro existente no tenía número, no se asigna)

      // 🌒 V19 NIVEL DIOS CUÁNTICO-QUARK MATEMÁTICO AXIOMÁTICO
      // ════════════════════════════════════════════════════════════════════
      // SINGLE mode: regen TAMBIÉN va a posición [0] (semántica "más reciente
      // cronológicamente"). Antes V10: replace en posición original.
      // Ahora V19: splice(idx, 1) + unshift(newBook).
      //
      // Razón: el email del lunes (Apps Script V18) lee libros[0]. Si Badir
      // regenera un libro existente con mejor contenido, queremos que el
      // email refleje esa regeneración. Antes quedaba "atrapado" en su
      // posición original y el email mandaba un libro más viejo.
      //
      // BATCH mode: se mantiene la lógica V10 (replace en posición original)
      // porque los libros del batch no deben reordenar el feed de la app.
      // ════════════════════════════════════════════════════════════════════
      if (!isFromBatch) {
        // Single mode: mover al inicio (mismo comportamiento que libro nuevo)
        existing.libros.splice(existingIndex, 1);
        existing.libros.unshift(newBook);
        action = existingIsManual && newIsManual
          ? "regenerado al inicio (manual→manual, V19)"
          : existingIsManual && !newIsManual
            ? "regenerado al inicio (manual sobrescrito, V19)"
            : "regenerado al inicio (V19)";
      } else {
        // Batch mode: replace en posición original (V10 legacy)
        existing.libros[existingIndex] = newBook;
        action = existingIsManual && newIsManual
          ? "reemplazado (manual→manual)"
          : existingIsManual && !newIsManual
            ? "reemplazado (manual sobrescrito)"
            : "reemplazado";
      }
    } else {
      // 🌒 V10 LIBRO NUEVO — asignar número solo si NO es batch
      // 🌒 v3.8 cirugia 3 — usa counter file (SSOT)
      if (!isFromBatch) {
        try {
          const assigned = await assignEditionFromCounter(targetPath, newBook);
          newBook._edicion_numero = assigned;
          if (existing.meta.next_edition_number <= assigned) {
            existing.meta.next_edition_number = assigned + 1;
          }
        } catch (err) {
          console.warn(`   counter file no disponible, fallback a meta: ${err.message}`);
          newBook._edicion_numero = existing.meta.next_edition_number;
          existing.meta.next_edition_number += 1;
        }
      }
      existing.libros.unshift(newBook);
      action = newBook._manual ? "agregado al inicio (manual)" : "agregado al inicio";
    }

    const afterCount = existing.libros.length;
    await writeJSON(targetPath, existing);

    const elapsedMs = Date.now() - t0;
    const edicionInfo = typeof newBook._edicion_numero === "number"
      ? ` [edición #${String(newBook._edicion_numero).padStart(3, "0")}]`
      : "";
    console.log(`   🔗 Fusión ${targetPath}: libro ${action}${edicionInfo} — ${beforeCount} → ${afterCount} libros (${elapsedMs}ms)`);
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

  // 🌒 Persistir el slug YA calculado por validate-book.js (FASE 4 → /tmp/triggui-slug.txt).
  // No se deriva ni recalcula: es EXACTAMENTE el mismo slug que build-editions consume y que
  // nombra el directorio /t/{slug}/. Se guarda en el libro para que triggui.com/in construya
  // las URLs (tarjeta.png, og.png, edición viva) sin re-derivar y sin drift. Viaja a
  // contenido.json y de ahí a contenido_manual.json (que copia el objeto completo).
  try {
    const slug = (await fs.readFile("/tmp/triggui-slug.txt", "utf8")).trim();
    if (slug) {
      result.mapped._slug = slug;
      console.log(`🔗 _slug persistido en el libro: "${slug}"`);
    }
  } catch { /* sin slug file (no debería pasar en single) — se omite */ }

  const unifiedMode = process.env.UNIFIED_MODE !== "false";
  if (unifiedMode) {
    const merged = await mergeIntoContenidoJson(result.mapped, CFG.files.outBatch);
    if (merged) {
      console.log(`✅ ${CFG.files.outBatch} (unificado, libro marcado _manual)`);
      // 🌒 Orquestación: el merge commiteó de verdad → encender la bandera que habilita
      // build-editions/tarjeta/OG en el YML. El contenido es informativo; lo que importa es
      // que el archivo EXISTA (los guards del YML solo hacen `[ -f ... ]`).
      try {
        await fs.writeFile("/tmp/triggui-committed.flag", `${book.titulo} — ${book.autor}\n`, "utf8");
        console.log(`🚦 /tmp/triggui-committed.flag escrita — assets habilitados`);
      } catch (e) {
        console.warn(`   ⚠️  no se pudo escribir committed.flag: ${e.message}`);
      }
    } else {
      console.error(`❌ ${CFG.files.outBatch} NO actualizado — merge abortó (ver causa arriba: C5 u otra defensa). El libro NO se commiteó; el contenido previo se conserva intacto.`);
    }
  } else {
    console.log(`🔕 UNIFIED_MODE=false — ${CFG.files.outBatch} no se actualizó`);
  }

  const reportPath = await writeQualityReport(result, inputsSnapshot);
  console.log(`📋 Quality report: ${reportPath}`);
}

async function main() {
  // 🌒 Orquestación nivel dios: limpiar la bandera de commit al inicio de CADA run.
  // build-editions / tarjeta PNG / OG en el YML solo corren si esta bandera EXISTE (= el merge
  // commiteó el libro de verdad). Se borra aquí y solo se re-crea en runSingle cuando
  // mergeIntoContenidoJson devuelve true. Así el YML nunca corre build-editions sobre un libro
  // que no entró al JSON (lo que antes disparaba V14 ABORT y el rojo).
  await fs.unlink("/tmp/triggui-committed.flag").catch(() => {});

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
  // 🌒 Triggui Kids: si CATALOG_MODE=kids, también appendea overlay constitucional
  INPUTS.lens = await composeLensSystemBlock({
    baseLens: INPUTS.baseLens,
    mode: CATALOG_MODE
  });

  const isSingle = process.env.SINGLE_MODE === "true" || await fileExists(CFG.files.tmpBook);
  if (isSingle) await runSingle();
  else await runBatch();
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});