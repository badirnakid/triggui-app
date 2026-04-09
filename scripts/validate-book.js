/**
 * validate-book.js — Paso 1 del pipeline Triggui 2.0
 *
 * Soporta tres caminos:
 * 1) book + direct         -> libro explícito, validación directa
 * 2) trigger + constrained -> elige SOLO dentro de libros_master.csv
 * 3) trigger + discover    -> propone libro con GPT y valida existencia
 *
 * Mejoras v2:
 * - Normaliza triggers mezclados (semántica + constraints + instrucciones editoriales)
 * - Separa restricciones soportadas vs no soportadas en runtime
 * - Tolera variantes de JSON en la respuesta del modelo
 * - Reintenta discover con prompt más estricto si el primero sale mal
 * - Emite diagnóstico humano y archivo debug en /tmp cuando algo falla
 * - En constrained/discover trabaja con trigger limpio, no con ruido editorial
 *
 * Salida:
 * - GitHub Actions output: book_json
 * - /tmp/triggui-slug.txt
 * - /tmp/triggui-titulo.txt
 * - /tmp/triggui-book.json
 * - /tmp/triggui-validate-debug.json
 *
 * Cascada de portadas:
 * Apple Books → Google Books → Open Library → Amazon
 * Si ninguna: portada vacía y fallback visual downstream
 */

import fs from "node:fs/promises";
import { appendFileSync, writeFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

const INPUT_MODE = String(process.env.INPUT_MODE || "").trim().toLowerCase();
const SELECTOR_MODE = String(process.env.SELECTOR_MODE || "").trim().toLowerCase();
const ENTRADA_RAW = String(process.env.ENTRADA_RAW || "").trim();
const LIBRO_INPUT = String(process.env.LIBRO_INPUT || "").trim();
const CATALOG_SCOPE = String(process.env.CATALOG_SCOPE || "none").trim().toLowerCase();
const CATALOG_CSV_PATH_ENV = String(process.env.CATALOG_CSV_PATH || "").trim();
const OPENAI_KEY = String(process.env.OPENAI_KEY || "").trim();

const MODE = INPUT_MODE || (LIBRO_INPUT ? "book" : "");
const SELECTOR = SELECTOR_MODE || (LIBRO_INPUT ? "direct" : "");
const DEBUG_PATH = "/tmp/triggui-validate-debug.json";
const MAX_DISCOVER_ATTEMPTS = 2;
const MIN_MATCH_SCORE = 0.38;

const EDITORIAL_NOISE_PATTERNS = [
  /poner\s+t[ií]tulos?\s+y\s+subt[ií]tulos?/gi,
  /t[ií]tulos?\s+y\s+subt[ií]tulos?/gi,
  /subt[ií]tulos?\s+de\s+los\s+p[aá]rrafos?/gi,
  /t[ií]tulos?\s+de\s+los\s+p[aá]rrafos?/gi,
  /que\s+los\s+p[aá]rrafos?.{0,60}subt[ií]tulos?/gi,
  /algo\s+s[uú]per\s+relevante/gi,
  /hazlo\s+relevante/gi,
  /quiero\s+que\s+el\s+resultado\s+sea\s+editorial/gi,
  /que\s+se\s+vea\s+bien/gi,
  /formato\s+editorial/gi,
  /copy\s+in/gi,
  /copy\s+out/gi
];

const DYNAMIC_RUNTIME_PATTERNS = [
  { regex: /barnes\s*(?:&|and|n)\s*noble/gi, label: "ranking dinámico de Barnes & Noble" },
  { regex: /top\s+en\s+novedades/gi, label: "ranking dinámico de novedades" },
  { regex: /top\s+de\s+novedades/gi, label: "ranking dinámico de novedades" },
  { regex: /top\s+en\s+barnes\s*(?:&|and|n)\s*noble/gi, label: "ranking dinámico de Barnes & Noble" },
  { regex: /best\s*seller/gi, label: "ranking de bestseller en tiempo real" },
  { regex: /m[aá]s\s+vendid[oa]s?/gi, label: "ranking de ventas en tiempo real" },
  { regex: /novedades/gi, label: "novedades en tiempo real" }
];

const RECENCY_PATTERNS = [
  /libro\s+escrito\s+despu[eé]s\s+de\s+(20\d{2})/i,
  /libro\s+publicado\s+despu[eé]s\s+de\s+(20\d{2})/i,
  /despu[eé]s\s+de\s+(20\d{2})/i,
  /posterior\s+a\s+(20\d{2})/i,
  /a\s+partir\s+de\s+(20\d{2})/i,
  /m[ií]nimo\s+(20\d{2})/i,
  /desde\s+(20\d{2})/i
];

const MAX_YEAR_PATTERNS = [
  /antes\s+de\s+(20\d{2})/i,
  /previo\s+a\s+(20\d{2})/i,
  /hasta\s+(20\d{2})/i
];

const PREFER_RECENT_PATTERNS = [
  /reciente/gi,
  /recientes/gi,
  /nuevo/gi,
  /nuevos/gi,
  /nueva/gi,
  /nuevas/gi,
  /actual/gi,
  /actuales/gi,
  /moderno/gi,
  /modernos/gi,
  /de\s+este\s+año/gi,
  /de\s+los\s+u?ltimos\s+años/gi
];

if (!MODE) {
  console.error("❌ INPUT_MODE vacío");
  process.exit(1);
}

if (!SELECTOR) {
  console.error("❌ SELECTOR_MODE vacío");
  process.exit(1);
}

if (MODE === "book" && !LIBRO_INPUT) {
  console.error("❌ LIBRO_INPUT vacío para modo book");
  process.exit(1);
}

if (MODE === "trigger" && !ENTRADA_RAW) {
  console.error("❌ ENTRADA_RAW vacío para modo trigger");
  process.exit(1);
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value).split(" ").filter(Boolean);
}

function unique(arr) {
  return [...new Set(arr)];
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pickFirst(obj, keys) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== "") {
      return String(obj[key]).trim();
    }
  }
  return "";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function stripCodeFence(text) {
  return String(text || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJsonObjectLoose(text) {
  const raw = stripCodeFence(String(text || "").trim());
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {}

  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const candidate = raw.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch {}

  const compact = candidate
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .replace(/\u0000/g, "");

  try {
    return JSON.parse(compact);
  } catch {
    return null;
  }
}

function toNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function dedupeRecommendations(items) {
  const seen = new Set();
  const output = [];

  for (const item of safeArray(items)) {
    const titulo = String(item?.titulo || item?.title || "").trim();
    const autor = String(item?.autor || item?.author || "").trim();
    const key = `${normalizeText(titulo)}__${normalizeText(autor)}`;
    if (!titulo || seen.has(key)) continue;
    seen.add(key);
    output.push({
      titulo,
      autor,
      motivo_corto: String(item?.motivo_corto || item?.reason || item?.motivo || "").trim(),
      tagline: String(item?.tagline || item?.subtitulo || "").trim()
    });
  }

  return output;
}

function salvageRecommendations(response) {
  if (!response || typeof response !== "object") return [];

  const directKeys = [
    "recommendations",
    "recomendaciones",
    "books",
    "libros",
    "results",
    "resultados",
    "candidates",
    "candidatos",
    "items"
  ];

  for (const key of directKeys) {
    const maybe = response[key];
    if (Array.isArray(maybe)) {
      return dedupeRecommendations(maybe);
    }
  }

  for (const value of Object.values(response)) {
    if (Array.isArray(value)) {
      const recs = dedupeRecommendations(value);
      if (recs.length) return recs;
    }
  }

  return [];
}

function sanitizeSentenceSpacing(text) {
  return String(text || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function removePatterns(text, patterns) {
  let next = String(text || "");
  for (const pattern of patterns) {
    next = next.replace(pattern, " ");
  }
  return sanitizeSentenceSpacing(next);
}

function extractByPatterns(text, patterns) {
  const hits = [];
  for (const entry of patterns) {
    const regex = entry.regex;
    const matches = String(text || "").match(regex);
    if (matches?.length) {
      hits.push(entry.label);
    }
  }
  return unique(hits);
}

function stripQuotedFragments(text) {
  return String(text || "").replace(/["“”'‘’]/g, "");
}

function scoreTextOverlap(a, b) {
  const tokensA = unique(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (!tokensA.length) return 0;
  const overlap = tokensA.filter(token => tokensB.has(token)).length;
  return overlap / tokensA.length;
}

function looksLikeBookIntent(text) {
  const t = normalizeText(text);
  return /libro|book|autor|author|leer|lectura/.test(t);
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function getMasterCsvPath() {
  const candidates = [
    CATALOG_CSV_PATH_ENV,
    "triggui-content/data/libros_master.csv",
    "data/libros_master.csv"
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }

  return null;
}

function setGithubOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) return;

  const stringValue = String(value ?? "");
  if (!stringValue.includes("\n")) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${stringValue}\n`);
    return;
  }

  const marker = `EOF_${name}_${Date.now()}`;
  appendFileSync(process.env.GITHUB_OUTPUT, `${name}<<${marker}\n${stringValue}\n${marker}\n`);
}

async function fetchJSON(url) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "triggui-validate-book/2.0",
        "Accept": "application/json"
      }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function checkImageURL(url) {
  if (!url) return false;

  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "triggui-validate-book/2.0"
      }
    });

    const type = res.headers.get("content-type") || "";
    return res.ok && type.startsWith("image/");
  } catch {
    return false;
  }
}

async function writeDebugFile(payload) {
  try {
    writeFileSync(DEBUG_PATH, JSON.stringify(payload, null, 2));
  } catch (e) {
    console.log(`ℹ️  No se pudo escribir debug file: ${e.message}`);
  }
}

async function callOpenAIJson(system, user, temperature = 0.3, metadata = {}) {
  if (!OPENAI_KEY) {
    throw new Error("OPENAI_KEY no disponible para selección por trigger");
  }

  const payload = {
    model: "gpt-4o-mini",
    temperature,
    top_p: 0.9,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    await writeDebugFile({
      stage: "openai_http_error",
      metadata,
      status: res.status,
      body_preview: text.slice(0, 1200),
      user_preview: user.slice(0, 1200)
    });
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = String(data?.choices?.[0]?.message?.content || "{}").trim();
  const parsed = extractJsonObjectLoose(content);

  if (!parsed) {
    await writeDebugFile({
      stage: "openai_json_parse_error",
      metadata,
      raw_content: content,
      user_preview: user.slice(0, 1200)
    });
    throw new Error("OpenAI devolvió contenido no parseable como JSON");
  }

  return {
    json: parsed,
    rawContent: content,
    usage: data?.usage || {}
  };
}

function parseBookInput(raw) {
  const [tituloRaw, autorRaw] = String(raw || "").split("|").map(s => s.trim());
  const titulo = tituloRaw || "";
  const autor = autorRaw || "Autor desconocido";

  if (!titulo) {
    throw new Error("Título vacío en LIBRO_INPUT");
  }

  return { titulo, autor };
}

function extractYearMin(raw) {
  for (const pattern of RECENCY_PATTERNS) {
    const match = String(raw || "").match(pattern);
    if (match?.[1]) {
      return clampNumber(Number(match[1]) + 1, 1900, 2100);
    }
  }
  return null;
}

function extractYearMax(raw) {
  for (const pattern of MAX_YEAR_PATTERNS) {
    const match = String(raw || "").match(pattern);
    if (match?.[1]) {
      return clampNumber(Number(match[1]) - 1, 1900, 2100);
    }
  }
  return null;
}

function buildHeuristicSemanticQuery(raw) {
  let next = stripQuotedFragments(String(raw || ""));
  next = removePatterns(next, EDITORIAL_NOISE_PATTERNS);

  for (const entry of DYNAMIC_RUNTIME_PATTERNS) {
    next = next.replace(entry.regex, " ");
  }

  next = next
    .replace(/libro\s+escrito\s+despu[eé]s\s+de\s+20\d{2}/gi, " ")
    .replace(/libro\s+publicado\s+despu[eé]s\s+de\s+20\d{2}/gi, " ")
    .replace(/despu[eé]s\s+de\s+20\d{2}/gi, " ")
    .replace(/posterior\s+a\s+20\d{2}/gi, " ")
    .replace(/a\s+partir\s+de\s+20\d{2}/gi, " ")
    .replace(/antes\s+de\s+20\d{2}/gi, " ")
    .replace(/m[ií]nimo\s+20\d{2}/gi, " ")
    .replace(/desde\s+20\d{2}/gi, " ")
    .replace(/\btop\b/gi, " ")
    .replace(/\bnovedades\b/gi, " ")
    .replace(/\bnuevo\b/gi, " ")
    .replace(/\bnueva\b/gi, " ")
    .replace(/\bnuevos\b/gi, " ")
    .replace(/\bnuevas\b/gi, " ")
    .replace(/\breciente\b/gi, " ")
    .replace(/\bactual\b/gi, " ")
    .replace(/\bactuales\b/gi, " ")
    .replace(/\bmodern[oa]s?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!next) {
    next = String(raw || "").trim();
  }

  return next;
}

async function normalizeTriggerRequestWithAI(raw) {
  const system = `
Eres el normalizador de triggers de Triggui.
Tu tarea NO es escoger el libro.
Tu tarea es separar una entrada humana mezclada en partes limpias.

Debes extraer:
- semantic_query: la necesidad real del lector, limpia y útil para seleccionar libro
- editorial_requests: instrucciones de formato/editorial que NO pertenecen al selector
- unsupported_runtime_constraints: restricciones que requieren internet/rankings vivos/tiendas en tiempo real
- supported_constraints.year_min: año mínimo cuando el usuario pide "después de 2023" o similar
- supported_constraints.year_max: año máximo cuando el usuario pide "antes de 2020" o similar
- supported_constraints.prefer_recent: true si el usuario quiere novedad/reciente aunque no haya año exacto
- intent_summary: resumen breve del corazón del pedido

Reglas:
- No inventes datos.
- No metas explicaciones largas.
- Si algo no aplica, usa null o arrays vacíos.
- semantic_query debe servir sola para buscar el libro.

Responde SOLO JSON con:
{
  "semantic_query": "...",
  "intent_summary": "...",
  "editorial_requests": ["..."],
  "unsupported_runtime_constraints": ["..."],
  "supported_constraints": {
    "year_min": null,
    "year_max": null,
    "prefer_recent": false
  }
}
`.trim();

  const user = `INPUT HUMANO REAL:\n${raw}`;

  try {
    const { json } = await callOpenAIJson(system, user, 0.05, { stage: "normalize_trigger" });
    return {
      semantic_query: sanitizeSentenceSpacing(String(json?.semantic_query || "").trim()),
      intent_summary: sanitizeSentenceSpacing(String(json?.intent_summary || "").trim()),
      editorial_requests: safeArray(json?.editorial_requests).map(v => sanitizeSentenceSpacing(String(v || ""))).filter(Boolean),
      unsupported_runtime_constraints: safeArray(json?.unsupported_runtime_constraints).map(v => sanitizeSentenceSpacing(String(v || ""))).filter(Boolean),
      supported_constraints: {
        year_min: toNumberOrNull(json?.supported_constraints?.year_min),
        year_max: toNumberOrNull(json?.supported_constraints?.year_max),
        prefer_recent: Boolean(json?.supported_constraints?.prefer_recent)
      }
    };
  } catch (e) {
    console.log(`ℹ️  Normalizador AI no disponible, fallback heurístico: ${e.message}`);
    return null;
  }
}

async function analyzeTriggerInput(raw) {
  const heuristicEditorial = [];
  for (const pattern of EDITORIAL_NOISE_PATTERNS) {
    const matches = String(raw || "").match(pattern);
    if (matches?.length) {
      heuristicEditorial.push(...matches.map(m => sanitizeSentenceSpacing(m)));
    }
  }

  const heuristicUnsupported = extractByPatterns(raw, DYNAMIC_RUNTIME_PATTERNS);
  const year_min_heuristic = extractYearMin(raw);
  const year_max_heuristic = extractYearMax(raw);
  const prefer_recent_heuristic = PREFER_RECENT_PATTERNS.some(pattern => pattern.test(String(raw || "")));
  const semantic_heuristic = buildHeuristicSemanticQuery(raw);

  const ai = await normalizeTriggerRequestWithAI(raw);

  const semantic_query = sanitizeSentenceSpacing(
    ai?.semantic_query || semantic_heuristic || String(raw || "").trim()
  );

  const intent_summary = sanitizeSentenceSpacing(
    ai?.intent_summary || semantic_query
  );

  const editorial_requests = unique([
    ...heuristicEditorial,
    ...safeArray(ai?.editorial_requests)
  ].filter(Boolean));

  const unsupported_runtime_constraints = unique([
    ...heuristicUnsupported,
    ...safeArray(ai?.unsupported_runtime_constraints)
  ].filter(Boolean));

  const supported_constraints = {
    year_min: toNumberOrNull(ai?.supported_constraints?.year_min) ?? year_min_heuristic,
    year_max: toNumberOrNull(ai?.supported_constraints?.year_max) ?? year_max_heuristic,
    prefer_recent: Boolean(ai?.supported_constraints?.prefer_recent) || prefer_recent_heuristic
  };

  return {
    raw_input: String(raw || "").trim(),
    semantic_query,
    intent_summary,
    editorial_requests,
    unsupported_runtime_constraints,
    supported_constraints,
    clean_for_selection: semantic_query,
    notes: {
      used_ai_normalizer: Boolean(ai),
      looked_like_book_intent: looksLikeBookIntent(raw),
      semantic_overlap_vs_raw: scoreTextOverlap(raw, semantic_query)
    }
  };
}

function logTriggerAnalysis(analysis) {
  console.log("══════════════════════════════════════════");
  console.log("🧠 TRIGGER NORMALIZADO");
  console.log(`📝 raw: ${analysis.raw_input}`);
  console.log(`🎯 semantic_query: ${analysis.semantic_query}`);
  console.log(`🧭 intent_summary: ${analysis.intent_summary}`);
  console.log(`📚 year_min: ${analysis.supported_constraints.year_min || "—"}`);
  console.log(`📚 year_max: ${analysis.supported_constraints.year_max || "—"}`);
  console.log(`⏱️ prefer_recent: ${analysis.supported_constraints.prefer_recent ? "sí" : "no"}`);
  console.log(`✂️ editorial_requests: ${analysis.editorial_requests.length ? analysis.editorial_requests.join(" | ") : "—"}`);
  console.log(`🌐 unsupported_runtime_constraints: ${analysis.unsupported_runtime_constraints.length ? analysis.unsupported_runtime_constraints.join(" | ") : "—"}`);
  console.log(`🤖 ai_normalizer: ${analysis.notes.used_ai_normalizer ? "sí" : "no"}`);
  console.log("══════════════════════════════════════════");
}

/* ═══════════════════════════════════════════════════════════════
   CSV CATALOG
═══════════════════════════════════════════════════════════════ */

function mapCatalogRow(row, index) {
  const titulo = pickFirst(row, ["titulo", "Título", "title", "Title", "libro", "Libro"]);
  const autor = pickFirst(row, ["autor", "Autor", "author", "Author"]);
  const tagline = pickFirst(row, ["tagline", "Tagline", "subtitulo", "Subtitulo", "subtítulo", "descripcion", "Descripción"]);
  const portada = pickFirst(row, ["portada", "Portada", "cover", "Cover", "image", "Image"]);
  const isbn = pickFirst(row, ["isbn", "ISBN", "isbn13", "ISBN13"]);
  const editorial = pickFirst(row, ["editorial", "Editorial", "publisher", "Publisher"]);
  const tema = pickFirst(row, ["tema", "Tema", "keywords", "Keywords", "categorias", "Categorias", "categorías", "Category", "category"]);
  const contexto = pickFirst(row, ["contexto_2026", "contexto", "Contexto", "aplicacion_badir_hoy"]);

  return {
    index,
    titulo,
    autor,
    tagline,
    portada,
    isbn,
    editorial,
    tema,
    contexto,
    raw: row
  };
}

async function loadCatalogRows() {
  const csvPath = await getMasterCsvPath();
  if (!csvPath) {
    throw new Error("No se encontró libros_master.csv para modo constrained");
  }

  const csv = await fs.readFile(csvPath, "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true })
    .map((row, index) => mapCatalogRow(row, index))
    .filter(row => row.titulo);

  if (!rows.length) {
    throw new Error(`El catálogo ${csvPath} está vacío o sin títulos válidos`);
  }

  return { csvPath, rows };
}

function scoreCatalogCandidate(trigger, row) {
  const triggerNorm = normalizeText(trigger);
  const triggerTokens = unique(tokenize(triggerNorm));

  const titleNorm = normalizeText(row.titulo);
  const authorNorm = normalizeText(row.autor);
  const taglineNorm = normalizeText(row.tagline);
  const temaNorm = normalizeText(row.tema);
  const contextoNorm = normalizeText(row.contexto);

  const combined = [titleNorm, authorNorm, taglineNorm, temaNorm, contextoNorm].filter(Boolean).join(" ");
  const combinedTokens = new Set(tokenize(combined));

  let score = 0;

  for (const token of triggerTokens) {
    if (combinedTokens.has(token)) score += 3;
    if (titleNorm.includes(token)) score += 4;
    if (taglineNorm.includes(token)) score += 2;
    if (temaNorm.includes(token)) score += 2;
    if (contextoNorm.includes(token)) score += 1;
  }

  if (triggerNorm && combined.includes(triggerNorm)) score += 12;

  const triggerWords = triggerTokens.length || 1;
  const overlap = triggerTokens.filter(token => combinedTokens.has(token)).length / triggerWords;
  score += Math.round(overlap * 10);

  return score;
}

/* ═══════════════════════════════════════════════════════════════
   DUPLICATE CHECK
═══════════════════════════════════════════════════════════════ */

async function checkDuplicate(titulo) {
  try {
    const csvPath = await getMasterCsvPath();

    if (!csvPath) {
      console.log("ℹ️  No se encontró libros_master.csv — no se revisa duplicado");
      return false;
    }

    const csv = await fs.readFile(csvPath, "utf8");
    const rows = parse(csv, { columns: true, skip_empty_lines: true });
    const normalizado = normalizeText(titulo);

    const dup = rows.find(r => {
      const t = normalizeText(r.titulo || r.Title || r.title || "");
      return t === normalizado;
    });

    if (dup) {
      console.log(`⚠️  "${titulo}" ya existe en ${csvPath}`);
      return true;
    }

    return false;
  } catch (e) {
    console.log(`ℹ️  Error al revisar duplicados: ${e.message}`);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════
   SELECTOR — CONSTRAINED
═══════════════════════════════════════════════════════════════ */

async function resolveConstrainedFromTrigger(triggerAnalysis) {
  if (CATALOG_SCOPE !== "libros_master_csv") {
    throw new Error(`catalog_scope=${CATALOG_SCOPE} no soportado para constrained`);
  }

  const { csvPath, rows } = await loadCatalogRows();

  const ranked = rows
    .map(row => ({
      ...row,
      heuristic_score: scoreCatalogCandidate(triggerAnalysis.clean_for_selection, row)
    }))
    .sort((a, b) => b.heuristic_score - a.heuristic_score);

  const top = ranked.slice(0, 25);

  if (!top.length) {
    throw new Error(`No se pudieron generar candidatos constrained desde ${csvPath}`);
  }

  console.log(`🧭 Trigger constrained sobre catálogo: ${csvPath}`);
  console.log(`🔢 Candidatos prefiltrados: ${top.length}`);

  const system = `
Eres el selector de libros de Triggui.
Debes escoger exactamente UN libro desde un catálogo ya dado.
No inventes títulos.
No inventes autores.
No expliques de más.
Debes elegir el libro que mejor responda al trigger humano real.
Prioriza:
1. ajuste real al trigger
2. especificidad
3. utilidad práctica
4. singularidad del libro frente a alternativas más genéricas

Responde SOLO JSON con:
{
  "candidate_index": number,
  "motivo_corto": "..."
}
`.trim();

  const candidateBlock = top.map((row, i) => {
    const parts = [
      `${i + 1}. ${row.titulo}`,
      row.autor ? `Autor: ${row.autor}` : "",
      row.tagline ? `Tagline: ${row.tagline}` : "",
      row.tema ? `Tema: ${row.tema}` : "",
      row.contexto ? `Contexto: ${row.contexto}` : ""
    ].filter(Boolean);
    return parts.join(" | ");
  }).join("\n");

  const user = `
TRIGGER HUMANO LIMPIO:
${triggerAnalysis.clean_for_selection}

INTENCIÓN RESUMIDA:
${triggerAnalysis.intent_summary}

CATÁLOGO DISPONIBLE:
${candidateBlock}

Elige UNO.
No elijas por fama.
No elijas por coincidencia superficial.
Elige por ajuste real al trigger.
`.trim();

  let selected = null;
  let motive = "";

  try {
    const { json } = await callOpenAIJson(system, user, 0.2, { stage: "constrained_selector" });
    const idx = Number(json?.candidate_index);
    motive = String(json?.motivo_corto || "").trim();

    if (Number.isFinite(idx) && idx >= 1 && idx <= top.length) {
      selected = top[idx - 1];
      console.log(`✅ Constrained selector eligió: ${selected.titulo} — ${selected.autor}`);
    }
  } catch (e) {
    console.log(`⚠️  OpenAI constrained falló, fallback heurístico: ${e.message}`);
  }

  if (!selected) {
    selected = top[0];
    motive = motive || "Fallback heurístico por score de catálogo";
    console.log(`↩️  Fallback constrained heurístico: ${selected.titulo} — ${selected.autor}`);
  }

  return {
    titulo: selected.titulo,
    autor: selected.autor || "Autor desconocido",
    tagline: selected.tagline || "",
    portada: selected.portada || "",
    isbn: selected.isbn || "",
    editorial: selected.editorial || "",
    contexto_2026: {
      aplicacion_badir_hoy: selected.contexto || "",
      trigger_diagnostics: {
        semantic_query: triggerAnalysis.semantic_query,
        unsupported_runtime_constraints: triggerAnalysis.unsupported_runtime_constraints,
        editorial_requests: triggerAnalysis.editorial_requests,
        supported_constraints: triggerAnalysis.supported_constraints
      }
    },
    selected_via: "constrained_catalog",
    selection_reason: motive,
    catalog_scope: CATALOG_SCOPE,
    trigger_input: triggerAnalysis.raw_input,
    trigger_analysis: triggerAnalysis
  };
}

/* ═══════════════════════════════════════════════════════════════
   DISCOVER — NORMALIZACIÓN Y VALIDACIÓN
═══════════════════════════════════════════════════════════════ */

function scoreBookMatch(targetTitle, targetAuthor, candidateTitle, candidateAuthors = []) {
  const titleScore = scoreTextOverlap(targetTitle, candidateTitle);
  const inverseTitleScore = scoreTextOverlap(candidateTitle, targetTitle);
  const authorTarget = normalizeText(targetAuthor);
  const authorsNorm = candidateAuthors.map(a => normalizeText(a)).filter(Boolean);
  const authorScore = authorTarget && authorsNorm.length
    ? Math.max(...authorsNorm.map(a => Math.max(scoreTextOverlap(authorTarget, a), scoreTextOverlap(a, authorTarget))))
    : 0.35;

  const final = (titleScore * 0.55) + (inverseTitleScore * 0.15) + (authorScore * 0.30);
  return Number(final.toFixed(4));
}

async function searchAppleBooks(titulo, autor) {
  console.log("   🍎 Buscando en Apple Books...");
  const q = encodeURIComponent(`${titulo} ${autor}`);
  const data = await fetchJSON(`https://itunes.apple.com/search?term=${q}&entity=ebook&limit=5&country=mx`);
  if (!data?.results?.length) return null;

  const candidates = [];

  for (const r of data.results) {
    let art = r.artworkUrl100 || "";
    if (art) {
      art = art.replace("100x100", "600x600");
    }

    candidates.push({
      portada: art,
      isbn: r.trackId?.toString() || "",
      editorial: r.artistName || "",
      source: "apple_books",
      year: "",
      matched_title: r.trackName || "",
      matched_author: r.artistName || "",
      match_score: scoreBookMatch(titulo, autor, r.trackName || "", [r.artistName || ""])
    });
  }

  candidates.sort((a, b) => b.match_score - a.match_score);
  const best = candidates[0];
  if (!best || best.match_score < MIN_MATCH_SCORE) return null;

  if (best.portada && await checkImageURL(best.portada)) {
    console.log(`   ✅ Apple Books match score: ${best.match_score}`);
    return best;
  }

  return {
    ...best,
    portada: ""
  };
}

async function searchGoogleBooks(titulo, autor) {
  console.log("   📚 Buscando en Google Books...");
  const q = encodeURIComponent(`${titulo} ${autor}`);
  let data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&langRestrict=es`);

  if (!data?.items?.length) {
    data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`);
    if (!data?.items?.length) return null;
  }

  const candidates = [];

  for (const item of data.items) {
    const info = item.volumeInfo || {};
    const authors = safeArray(info.authors).map(v => String(v || "").trim()).filter(Boolean);
    const imgs = info.imageLinks || {};
    const url = imgs.extraLarge || imgs.large || imgs.medium || imgs.small || imgs.thumbnail || "";
    const cleanUrl = url ? url.replace("&edge=curl", "").replace("http://", "https://") : "";
    const isbn13 = safeArray(info.industryIdentifiers).find(i => i.type === "ISBN_13")?.identifier || "";
    const isbn10 = safeArray(info.industryIdentifiers).find(i => i.type === "ISBN_10")?.identifier || "";

    candidates.push({
      portada: cleanUrl,
      isbn: isbn13 || isbn10,
      editorial: info.publisher || "",
      year: info.publishedDate?.substring(0, 4) || "",
      pages: info.pageCount || 0,
      source: "google_books",
      matched_title: info.title || "",
      matched_author: authors.join(", "),
      match_score: scoreBookMatch(titulo, autor, info.title || "", authors)
    });
  }

  candidates.sort((a, b) => b.match_score - a.match_score);
  const best = candidates[0];
  if (!best || best.match_score < MIN_MATCH_SCORE) return null;

  if (best.portada && await checkImageURL(best.portada)) {
    console.log(`   ✅ Google Books match score: ${best.match_score}`);
    return best;
  }

  return best;
}

async function searchOpenLibrary(titulo, autor) {
  console.log("   📖 Buscando en Open Library...");
  const q = encodeURIComponent(`${titulo} ${autor}`);
  const data = await fetchJSON(`https://openlibrary.org/search.json?q=${q}&limit=5`);
  if (!data?.docs?.length) return null;

  const candidates = [];

  for (const doc of data.docs) {
    const authors = safeArray(doc.author_name).map(v => String(v || "").trim()).filter(Boolean);
    const coverId = doc.cover_i;
    const portada = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "";

    candidates.push({
      portada,
      isbn: Array.isArray(doc.isbn) ? (doc.isbn[0] || "") : "",
      editorial: Array.isArray(doc.publisher) ? (doc.publisher[0] || "") : "",
      year: String(doc.first_publish_year || ""),
      source: "open_library",
      matched_title: doc.title || "",
      matched_author: authors.join(", "),
      match_score: scoreBookMatch(titulo, autor, doc.title || "", authors)
    });
  }

  candidates.sort((a, b) => b.match_score - a.match_score);
  const best = candidates[0];
  if (!best || best.match_score < MIN_MATCH_SCORE) return null;

  if (best.portada && await checkImageURL(best.portada)) {
    console.log(`   ✅ Open Library match score: ${best.match_score}`);
    return best;
  }

  return best;
}

async function searchAmazonFallback(_titulo, _autor) {
  console.log("   🟠 Buscando en Amazon (fallback)...");
  return null;
}

async function getBestBookEvidence(titulo, autor) {
  console.log(`🔍 Buscando evidencia para "${titulo}" — ${autor}`);

  const apple = await searchAppleBooks(titulo, autor);
  const google = await searchGoogleBooks(titulo, autor);
  const open = await searchOpenLibrary(titulo, autor);
  const amazon = await searchAmazonFallback(titulo, autor);

  const candidates = [apple, google, open, amazon].filter(Boolean);
  if (!candidates.length) {
    return {
      portada: "",
      isbn: "",
      editorial: "",
      year: "",
      source: "none",
      matched_title: "",
      matched_author: "",
      match_score: 0
    };
  }

  candidates.sort((a, b) => {
    const aImage = a.portada ? 1 : 0;
    const bImage = b.portada ? 1 : 0;
    if (bImage !== aImage) return bImage - aImage;
    return (b.match_score || 0) - (a.match_score || 0);
  });

  return candidates[0];
}

function evaluateEvidenceAgainstConstraints(evidence, triggerAnalysis) {
  const year = toNumberOrNull(evidence?.year);
  const yearMin = toNumberOrNull(triggerAnalysis?.supported_constraints?.year_min);
  const yearMax = toNumberOrNull(triggerAnalysis?.supported_constraints?.year_max);
  const preferRecent = Boolean(triggerAnalysis?.supported_constraints?.prefer_recent);

  if (yearMin && year && year < yearMin) {
    return {
      ok: false,
      reason: `Año ${year} no cumple mínimo ${yearMin}`
    };
  }

  if (yearMax && year && year > yearMax) {
    return {
      ok: false,
      reason: `Año ${year} no cumple máximo ${yearMax}`
    };
  }

  if (yearMin && !year) {
    return {
      ok: false,
      reason: `No se pudo verificar el año mínimo ${yearMin}`
    };
  }

  if (preferRecent && year && year < 2020 && !yearMin) {
    return {
      ok: true,
      reason: `Aceptado, pero no especialmente reciente (año ${year})`
    };
  }

  return {
    ok: true,
    reason: year ? `Año verificado ${year}` : "Sin año verificable, pero válido por evidencia bibliográfica"
  };
}

function buildDiscoverUserPrompt(triggerAnalysis, attemptNumber) {
  const yearMin = triggerAnalysis.supported_constraints.year_min;
  const yearMax = triggerAnalysis.supported_constraints.year_max;
  const preferRecent = triggerAnalysis.supported_constraints.prefer_recent;

  const constraintLines = [];
  if (yearMin) constraintLines.push(`- año mínimo obligatorio: ${yearMin}`);
  if (yearMax) constraintLines.push(`- año máximo obligatorio: ${yearMax}`);
  if (preferRecent) constraintLines.push("- preferir libros recientes si existe opción sólida");
  if (triggerAnalysis.unsupported_runtime_constraints.length) {
    constraintLines.push(`- ignora para la selección estas restricciones porque requieren web/rankings vivos: ${triggerAnalysis.unsupported_runtime_constraints.join(", ")}`);
  }
  if (triggerAnalysis.editorial_requests.length) {
    constraintLines.push(`- ignora para la selección estas instrucciones editoriales: ${triggerAnalysis.editorial_requests.join(", ")}`);
  }

  const attemptTone = attemptNumber === 1
    ? "Propón hasta 3 libros reales y verificables."
    : "Reintento estricto: si no estás razonablemente seguro, omite. Mejor 1 libro sólido que 3 flojos.";

  return `
TRIGGER HUMANO LIMPIO:
${triggerAnalysis.clean_for_selection}

INTENCIÓN RESUMIDA:
${triggerAnalysis.intent_summary}

RESTRICCIONES REALES:
${constraintLines.length ? constraintLines.join("\n") : "- ninguna adicional"}

${attemptTone}
Deben ser libros que un lector podría buscar hoy mismo.
No metas relleno.
No devuelvas instrucciones editoriales.
`.trim();
}

async function runDiscoverAttempt(triggerAnalysis, attemptNumber) {
  console.log(`🌌 Trigger discover — intento ${attemptNumber}/${MAX_DISCOVER_ATTEMPTS}`);

  const system = `
Eres el selector discover de Triggui.
Recibes un trigger humano real y debes proponer hasta 3 libros REALES que mejor respondan a ese momento.
No inventes títulos.
No inventes autores.
Prioriza libros conocidos, verificables y útiles de verdad.
Evita responder con libros demasiado genéricos si hay uno más específico.
Ignora cualquier instrucción editorial de formato; tu trabajo es solo seleccionar libro.
Si el usuario pide restricciones de año, solo recomienda libros que crees que las cumplen.
Responde SOLO JSON con:
{
  "recommendations": [
    { "titulo": "...", "autor": "...", "motivo_corto": "...", "tagline": "..." }
  ]
}
`.trim();

  const user = buildDiscoverUserPrompt(triggerAnalysis, attemptNumber);
  const { json, rawContent } = await callOpenAIJson(system, user, attemptNumber === 1 ? 0.25 : 0.1, {
    stage: "discover_selector",
    attempt: attemptNumber
  });

  const recs = salvageRecommendations(json);

  if (!recs.length) {
    await writeDebugFile({
      stage: "discover_empty_recommendations",
      attempt: attemptNumber,
      trigger_analysis: triggerAnalysis,
      raw_response: rawContent,
      parsed_response: json
    });
    return { recommendations: [], rawContent, parsed: json };
  }

  return {
    recommendations: recs,
    rawContent,
    parsed: json
  };
}

async function resolveDiscoverFromTrigger(triggerAnalysis) {
  console.log("🌌 Trigger discover — proponiendo libros reales con GPT...");

  const allAttemptDebug = [];

  for (let attempt = 1; attempt <= MAX_DISCOVER_ATTEMPTS; attempt += 1) {
    const attemptResult = await runDiscoverAttempt(triggerAnalysis, attempt);
    allAttemptDebug.push({
      attempt,
      parsed_preview: attemptResult.parsed,
      raw_preview: String(attemptResult.rawContent || "").slice(0, 1200),
      recommendations: attemptResult.recommendations
    });

    if (!attemptResult.recommendations.length) continue;

    console.log(`🔢 Recomendaciones discover: ${attemptResult.recommendations.length}`);

    const inspected = [];

    for (const rec of attemptResult.recommendations) {
      const evidence = await getBestBookEvidence(rec.titulo, rec.autor || "Autor desconocido");
      const constraintsCheck = evaluateEvidenceAgainstConstraints(evidence, triggerAnalysis);

      inspected.push({
        recommendation: rec,
        evidence,
        constraintsCheck
      });

      console.log(`   🧪 ${rec.titulo} — ${rec.autor || "Autor desconocido"}`);
      console.log(`      match_score: ${evidence.match_score || 0}`);
      console.log(`      source: ${evidence.source || "none"}`);
      console.log(`      year: ${evidence.year || "—"}`);
      console.log(`      constraints: ${constraintsCheck.ok ? "OK" : "NO"} — ${constraintsCheck.reason}`);

      if ((evidence.source !== "none" || evidence.portada) && constraintsCheck.ok) {
        console.log(`✅ Discover validó: ${rec.titulo} — ${rec.autor}`);
        return {
          titulo: rec.titulo,
          autor: rec.autor || "Autor desconocido",
          tagline: rec.tagline || "",
          portada: evidence.portada || "",
          isbn: evidence.isbn || "",
          editorial: evidence.editorial || "",
          selected_via: "discover_trigger",
          selection_reason: rec.motivo_corto || "",
          trigger_input: triggerAnalysis.raw_input,
          cover_source: evidence.source || "none",
          trigger_analysis: triggerAnalysis,
          publication_year: evidence.year || "",
          selection_validation: {
            match_score: evidence.match_score || 0,
            validation_source: evidence.source || "none",
            constraint_reason: constraintsCheck.reason
          }
        };
      }
    }

    await writeDebugFile({
      stage: "discover_recommendations_rejected",
      attempt,
      trigger_analysis: triggerAnalysis,
      inspected
    });
  }

  const unsupported = triggerAnalysis.unsupported_runtime_constraints.length
    ? ` Restricciones no verificables en este paso: ${triggerAnalysis.unsupported_runtime_constraints.join(", ")}.`
    : "";

  const yearMsg = triggerAnalysis.supported_constraints.year_min
    ? ` Se exigió año mínimo ${triggerAnalysis.supported_constraints.year_min} y ninguna recomendación pudo verificarse cumpliéndolo.`
    : "";

  await writeDebugFile({
    stage: "discover_failed_final",
    trigger_analysis: triggerAnalysis,
    attempts: allAttemptDebug
  });

  throw new Error(
    `Discover no pudo resolver un libro válido para el trigger limpio "${triggerAnalysis.clean_for_selection}".${yearMsg}${unsupported} Revisa ${DEBUG_PATH} para el diagnóstico completo.`
  );
}

/* ═══════════════════════════════════════════════════════════════
   CASCADA DE PORTADAS / EVIDENCIA
═══════════════════════════════════════════════════════════════ */

async function getBestCover(titulo, autor) {
  const evidence = await getBestBookEvidence(titulo, autor);
  return {
    portada: evidence.portada || "",
    isbn: evidence.isbn || "",
    editorial: evidence.editorial || "",
    year: evidence.year || "",
    source: evidence.source || "none"
  };
}

/* ═══════════════════════════════════════════════════════════════
   RESOLUCIÓN PRINCIPAL
═══════════════════════════════════════════════════════════════ */

async function resolveBookData() {
  if (MODE === "book") {
    if (SELECTOR !== "direct") {
      console.log(`ℹ️  Modo book fuerza selector direct (recibido: ${SELECTOR})`);
    }

    const parsed = parseBookInput(LIBRO_INPUT);

    return {
      titulo: parsed.titulo,
      autor: parsed.autor,
      tagline: "",
      portada: "",
      isbn: "",
      editorial: "",
      selected_via: "direct_book",
      selection_reason: "Libro explícito proporcionado en workflow_dispatch"
    };
  }

  const triggerAnalysis = await analyzeTriggerInput(ENTRADA_RAW);
  logTriggerAnalysis(triggerAnalysis);
  setGithubOutput("normalized_trigger", triggerAnalysis.clean_for_selection);
  setGithubOutput("trigger_analysis_json", JSON.stringify(triggerAnalysis));

  if (MODE === "trigger" && SELECTOR === "constrained") {
    return await resolveConstrainedFromTrigger(triggerAnalysis);
  }

  if (MODE === "trigger" && SELECTOR === "discover") {
    return await resolveDiscoverFromTrigger(triggerAnalysis);
  }

  throw new Error(`Combinación no soportada: INPUT_MODE=${MODE} / SELECTOR_MODE=${SELECTOR}`);
}

/* ═══════════════════════════════════════════════════════════════
   EJECUCIÓN
═══════════════════════════════════════════════════════════════ */

try {
  const resolved = await resolveBookData();

  const titulo = resolved.titulo;
  const autor = resolved.autor || "Autor desconocido";
  const slug = slugify(titulo);

  console.log(`📖 Resolución final: "${titulo}" de ${autor}`);

  const duplicado = await checkDuplicate(titulo);
  const cover = await getBestCover(titulo, autor);

  const portadaFinal = cover.portada || resolved.portada || "";
  const isbnFinal = cover.isbn || resolved.isbn || "";
  const editorialFinal = cover.editorial || resolved.editorial || "";
  const publicationYearFinal = cover.year || resolved.publication_year || "";
  const coverSourceFinal = cover.source !== "none" ? cover.source : (resolved.portada ? "catalog" : "none");

  const bookData = {
    titulo,
    autor,
    slug,
    tagline: resolved.tagline || "",
    portada: portadaFinal,
    portada_url: portadaFinal,
    portada_source: coverSourceFinal,
    isbn: isbnFinal,
    editorial: editorialFinal,
    publication_year: publicationYearFinal,
    source: coverSourceFinal,
    duplicado,
    selected_via: resolved.selected_via || "unknown",
    selection_reason: resolved.selection_reason || "",
    trigger_input: resolved.trigger_input || "",
    trigger_analysis: resolved.trigger_analysis || null,
    selection_validation: resolved.selection_validation || {},
    catalog_scope: resolved.catalog_scope || "",
    contexto_2026: resolved.contexto_2026 || {}
  };

  await fs.writeFile("/tmp/triggui-slug.txt", slug, "utf8");
  await fs.writeFile("/tmp/triggui-titulo.txt", titulo, "utf8");
  await fs.writeFile("/tmp/triggui-book.json", JSON.stringify(bookData, null, 2), "utf8");

  await writeDebugFile({
    stage: "success",
    bookData
  });

  setGithubOutput("book_json", JSON.stringify(bookData));
  setGithubOutput("slug", slug);
  setGithubOutput("titulo", titulo);
  setGithubOutput("autor", autor);
  setGithubOutput("selected_via", bookData.selected_via);
  setGithubOutput("validation_debug_path", DEBUG_PATH);

  console.log("══════════════════════════════════════════");
  console.log(`🧭 INPUT_MODE: ${MODE}`);
  console.log(`🧠 SELECTOR_MODE: ${SELECTOR}`);
  console.log(`📖 ${titulo}`);
  console.log(`✍️  ${autor}`);
  console.log(`🔗 Slug: ${slug}`);
  console.log(`🧬 selected_via: ${bookData.selected_via}`);
  console.log(`💬 selection_reason: ${bookData.selection_reason || "—"}`);
  console.log(`🖼️  Portada: ${coverSourceFinal} ${portadaFinal ? "✅" : "—"}`);
  console.log(`📦 ISBN: ${isbnFinal || "—"}`);
  console.log(`🏢 Editorial: ${editorialFinal || "—"}`);
  console.log(`🗓️  publication_year: ${publicationYearFinal || "—"}`);
  console.log(`📄 Duplicado: ${duplicado ? "sí" : "no"}`);
  console.log(`🧪 Debug: ${DEBUG_PATH}`);
  console.log("══════════════════════════════════════════");
  console.log("✅ Validación completa. Siguiente paso: enriquecimiento GPT-4o-mini.");
} catch (error) {
  await writeDebugFile({
    stage: "fatal",
    mode: MODE,
    selector: SELECTOR,
    entrada_raw: ENTRADA_RAW,
    libro_input: LIBRO_INPUT,
    error_message: error?.message || String(error),
    stack: error?.stack || ""
  });

  console.error(`❌ ${error?.message || String(error)}`);
  console.error(`🧪 Debug completo: ${DEBUG_PATH}`);
  process.exit(1);
}
