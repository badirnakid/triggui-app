/**
 * validate-book.js — Paso 1 del pipeline Triggui 2.0
 *
 * Soporta tres caminos:
 * 1) book + direct         -> libro explícito, validación directa
 * 2) trigger + constrained -> elige SOLO dentro de libros_master.csv
 * 3) trigger + discover    -> resuelve libro con capa viva + GPT + validación
 *
 * Principio:
 * El usuario escribe lo que le nazca. El sistema separa:
 * - necesidad semántica real
 * - restricciones verificables
 * - preferencias de fuente/ranking
 * - instrucciones editoriales que NO pertenecen a la selección
 *
 * Luego intenta, en este orden:
 * 1. live candidates (Google Books newest + Barnes & Noble si aplica)
 * 2. GPT discover sobre trigger limpio
 * 3. graceful fallback al mejor candidato real disponible
 *
 * Salida:
 * - GitHub Actions output: book_json
 * - /tmp/triggui-slug.txt
 * - /tmp/triggui-titulo.txt
 * - /tmp/triggui-book.json
 * - /tmp/triggui-validate-debug.json
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
const DEFAULT_YEAR_FRESHNESS_FLOOR = 2020;
const HTML_HEADERS = {
  "User-Agent": "triggui-validate-book/4.0",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};

const EDITORIAL_NOISE_PATTERNS = [
  /poner\s+t[ií]tulos?\s+y\s+subt[ií]tulos?/gi,
  /t[ií]tulos?\s+y\s+subt[ií]tulos?/gi,
  /subt[ií]tulos?\s+de\s+los\s+p[aá]rrafos?/gi,
  /t[ií]tulos?\s+de\s+los\s+p[aá]rrafos?/gi,
  /que\s+los\s+p[aá]rrafos?.{0,80}subt[ií]tulos?/gi,
  /algo\s+s[uú]per\s+relevante/gi,
  /hazlo\s+relevante/gi,
  /quiero\s+que\s+el\s+resultado\s+sea\s+editorial/gi,
  /copy\s+in/gi,
  /copy\s+out/gi,
  /headline/gi,
  /subheadline/gi,
  /p[aá]rrafos?/gi
];

const DYNAMIC_RUNTIME_PATTERNS = [
  { regex: /barnes\s*(?:&|and|n)\s*noble/gi, label: "barnes_and_noble" },
  { regex: /\bbarnes\b/gi, label: "barnes_and_noble" },
  { regex: /top\s+en\s+novedades/gi, label: "new_releases" },
  { regex: /top\s+de\s+novedades/gi, label: "new_releases" },
  { regex: /\bnovedades\b/gi, label: "new_releases" },
  { regex: /new\s+releases?/gi, label: "new_releases" },
  { regex: /new\s+this\s+week/gi, label: "new_releases" },
  { regex: /\bbest\s*sellers?\b/gi, label: "best_sellers" },
  { regex: /\bbestsellers?\b/gi, label: "best_sellers" },
  { regex: /\bm[aá]s\s+vendid[oa]s?\b/gi, label: "best_sellers" }
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
  /\bnuevo\b/gi,
  /\bnueva\b/gi,
  /\bnuevos\b/gi,
  /\bnuevas\b/gi,
  /\bactual\b/gi,
  /\bactuales\b/gi,
  /\bmoderno\b/gi,
  /\bmodernos\b/gi,
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

function safeObject(value) {
  return value && typeof value === "object" ? value : {};
}

function toNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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
  for (const pattern of patterns) next = next.replace(pattern, " ");
  return sanitizeSentenceSpacing(next);
}

function stripQuotedFragments(text) {
  return String(text || "").replace(/["“”'‘’]/g, "");
}

function firstSentence(text, max = 180) {
  const clean = sanitizeSentenceSpacing(String(text || ""));
  if (!clean) return "";
  const parts = clean.split(/(?<=[.!?])\s+/);
  const sentence = parts[0] || clean;
  return sentence.length > max ? `${sentence.slice(0, max - 1).trim()}…` : sentence;
}

function scoreTextOverlap(a, b) {
  const tokensA = unique(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (!tokensA.length) return 0;
  const overlap = tokensA.filter(token => tokensB.has(token)).length;
  return overlap / tokensA.length;
}

function looksLikeBookIntent(text) {
  return /libro|book|autor|author|leer|lectura/.test(normalizeText(text));
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

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchJSON(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "triggui-validate-book/4.0",
        "Accept": "application/json"
      },
      ...options
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchText(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: HTML_HEADERS,
      ...options
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

async function checkImageURL(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "triggui-validate-book/4.0" }
    });
    const type = res.headers.get("content-type") || "";
    return res.ok && type.startsWith("image/");
  } catch {
    return false;
  }
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : _;
    });
}

function stripHtml(text) {
  return decodeHtmlEntities(String(text || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
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
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  const candidate = raw.slice(firstBrace, lastBrace + 1)
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

async function appendDebugEvent(stage, payload = {}) {
  try {
    let current = { history: [] };
    if (await fileExists(DEBUG_PATH)) {
      try {
        const existing = await fs.readFile(DEBUG_PATH, "utf8");
        const parsed = JSON.parse(existing);
        if (parsed && typeof parsed === "object") {
          current = parsed;
          if (!Array.isArray(current.history)) current.history = [];
        }
      } catch {}
    }

    const entry = {
      at: new Date().toISOString(),
      stage,
      ...payload
    };

    current.history.push(entry);
    current.last = entry;
    writeFileSync(DEBUG_PATH, JSON.stringify(current, null, 2));
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
    await appendDebugEvent("openai_http_error", {
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
    await appendDebugEvent("openai_json_parse_error", {
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
      tagline: String(item?.tagline || item?.subtitle || item?.subtitulo || "").trim(),
      source_label: String(item?.source_label || item?.source || "").trim(),
      source_url: String(item?.source_url || item?.url || "").trim(),
      published_year: toNumberOrNull(item?.published_year) || null
    });
  }
  return output;
}

function salvageRecommendations(response) {
  if (!response || typeof response !== "object") return [];
  const directKeys = ["recommendations", "recomendaciones", "books", "libros", "results", "resultados", "candidates", "candidatos", "items"];
  for (const key of directKeys) {
    if (Array.isArray(response[key])) return dedupeRecommendations(response[key]);
  }
  for (const value of Object.values(response)) {
    if (Array.isArray(value)) {
      const recs = dedupeRecommendations(value);
      if (recs.length) return recs;
    }
  }
  return [];
}

/* ═══════════════════════════════════════════════════════════════
   INPUT NORMALIZATION
═══════════════════════════════════════════════════════════════ */

function extractPatternLabels(text, patterns) {
  const out = [];
  for (const entry of patterns) {
    const matches = String(text || "").match(entry.regex);
    if (matches?.length) out.push(entry.label);
  }
  return unique(out);
}

function extractYearMin(raw) {
  for (const pattern of RECENCY_PATTERNS) {
    const match = String(raw || "").match(pattern);
    if (match?.[1]) return clampNumber(Number(match[1]) + 1, 1900, 2100);
  }
  return null;
}

function extractYearMax(raw) {
  for (const pattern of MAX_YEAR_PATTERNS) {
    const match = String(raw || "").match(pattern);
    if (match?.[1]) return clampNumber(Number(match[1]) - 1, 1900, 2100);
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
    .replace(/\s+/g, " ")
    .trim();

  return next || String(raw || "").trim();
}

async function normalizeTriggerRequestWithAI(raw) {
  const system = `
Eres el normalizador de triggers de Triggui.
Tu tarea NO es escoger el libro.
Tu tarea es separar una entrada humana mezclada en partes limpias.

Extrae:
- semantic_query: necesidad real del lector, limpia y útil para seleccionar libro
- intent_summary: resumen corto del corazón del pedido
- editorial_requests: instrucciones de formato/editorial que NO pertenecen al selector
- source_preference: "barnes_and_noble", "google_books", o null
- ranking_preference: "new_releases", "best_sellers", o null
- unsupported_runtime_constraints: cosas que suenan a ranking vivo, tienda o lista dinámica
- supported_constraints.year_min
- supported_constraints.year_max
- supported_constraints.prefer_recent

Responde SOLO JSON con:
{
  "semantic_query": "...",
  "intent_summary": "...",
  "editorial_requests": ["..."],
  "source_preference": null,
  "ranking_preference": null,
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
      source_preference: String(json?.source_preference || "").trim() || null,
      ranking_preference: String(json?.ranking_preference || "").trim() || null,
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
    if (matches?.length) heuristicEditorial.push(...matches.map(m => sanitizeSentenceSpacing(m)));
  }

  const labels = extractPatternLabels(raw, DYNAMIC_RUNTIME_PATTERNS);
  const yearMinHeuristic = extractYearMin(raw);
  const yearMaxHeuristic = extractYearMax(raw);
  const preferRecentHeuristic = PREFER_RECENT_PATTERNS.some(pattern => pattern.test(String(raw || "")));
  const semanticHeuristic = buildHeuristicSemanticQuery(raw);

  const ai = await normalizeTriggerRequestWithAI(raw);

  const yearMinCandidates = [yearMinHeuristic, toNumberOrNull(ai?.supported_constraints?.year_min)].filter(Number.isFinite);
  const yearMaxCandidates = [yearMaxHeuristic, toNumberOrNull(ai?.supported_constraints?.year_max)].filter(Number.isFinite);

  const source_preference = ai?.source_preference
    || (labels.includes("barnes_and_noble") ? "barnes_and_noble" : null);

  const ranking_preference = ai?.ranking_preference
    || (labels.includes("best_sellers") ? "best_sellers" : labels.includes("new_releases") ? "new_releases" : null);

  const semantic_query = sanitizeSentenceSpacing(ai?.semantic_query || semanticHeuristic || String(raw || "").trim());
  const intent_summary = sanitizeSentenceSpacing(ai?.intent_summary || semantic_query);

  const unsupported_runtime_constraints = unique([
    ...safeArray(ai?.unsupported_runtime_constraints),
    ...(labels.includes("barnes_and_noble") ? ["ranking/curaduría viva de Barnes & Noble"] : []),
    ...(labels.includes("new_releases") ? ["lista viva de novedades"] : []),
    ...(labels.includes("best_sellers") ? ["lista viva de best sellers"] : [])
  ].filter(Boolean));

  return {
    raw_input: String(raw || "").trim(),
    semantic_query,
    intent_summary,
    editorial_requests: unique([...heuristicEditorial, ...safeArray(ai?.editorial_requests)].filter(Boolean)),
    source_preference,
    ranking_preference,
    unsupported_runtime_constraints,
    supported_constraints: {
      year_min: yearMinCandidates.length ? Math.max(...yearMinCandidates) : null,
      year_max: yearMaxCandidates.length ? Math.min(...yearMaxCandidates) : null,
      prefer_recent: Boolean(ai?.supported_constraints?.prefer_recent) || preferRecentHeuristic || Boolean(yearMinHeuristic)
    },
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
  console.log(`🏷️  source_preference: ${analysis.source_preference || "auto"}`);
  console.log(`📈 ranking_preference: ${analysis.ranking_preference || "—"}`);
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

function mapCatalogRow(row, index) {
  const titulo = pickFirst(row, ["titulo", "Título", "title", "Title", "libro", "Libro"]);
  const autor = pickFirst(row, ["autor", "Autor", "author", "Author"]);
  const tagline = pickFirst(row, ["tagline", "Tagline", "subtitulo", "Subtitulo", "subtítulo", "descripcion", "Descripción"]);
  const portada = pickFirst(row, ["portada", "Portada", "cover", "Cover", "image", "Image"]);
  const isbn = pickFirst(row, ["isbn", "ISBN", "isbn13", "ISBN13"]);
  const editorial = pickFirst(row, ["editorial", "Editorial", "publisher", "Publisher"]);
  const tema = pickFirst(row, ["tema", "Tema", "keywords", "Keywords", "categorias", "Categorias", "categorías", "Category", "category"]);
  const contexto = pickFirst(row, ["contexto_2026", "contexto", "Contexto", "aplicacion_badir_hoy"]);

  return { index, titulo, autor, tagline, portada, isbn, editorial, tema, contexto, raw: row };
}

async function loadCatalogRows() {
  const csvPath = await getMasterCsvPath();
  if (!csvPath) throw new Error("No se encontró libros_master.csv para modo constrained");

  const csv = await fs.readFile(csvPath, "utf8");
  const rows = parse(csv, { columns: true, skip_empty_lines: true })
    .map((row, index) => mapCatalogRow(row, index))
    .filter(row => row.titulo);

  if (!rows.length) throw new Error(`El catálogo ${csvPath} está vacío o sin títulos válidos`);
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

async function checkDuplicate(titulo) {
  try {
    const csvPath = await getMasterCsvPath();
    if (!csvPath) return false;
    const csv = await fs.readFile(csvPath, "utf8");
    const rows = parse(csv, { columns: true, skip_empty_lines: true });
    const normalizado = normalizeText(titulo);
    const dup = rows.find(r => normalizeText(r.titulo || r.Title || r.title || "") === normalizado);
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
   CONSTRAINED
═══════════════════════════════════════════════════════════════ */

async function resolveConstrainedFromTrigger(triggerAnalysis) {
  if (CATALOG_SCOPE !== "libros_master_csv") {
    throw new Error(`catalog_scope=${CATALOG_SCOPE} no soportado para constrained`);
  }

  const { csvPath, rows } = await loadCatalogRows();
  const ranked = rows
    .map(row => ({ ...row, heuristic_score: scoreCatalogCandidate(triggerAnalysis.clean_for_selection, row) }))
    .sort((a, b) => b.heuristic_score - a.heuristic_score);

  const top = ranked.slice(0, 25);
  if (!top.length) throw new Error(`No se pudieron generar candidatos constrained desde ${csvPath}`);

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
4. singularidad frente a alternativas más genéricas

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
   EVIDENCE + LIVE SOURCING
═══════════════════════════════════════════════════════════════ */

function scoreBookMatch(targetTitle, targetAuthor, candidateTitle, candidateAuthors = []) {
  const titleScore = scoreTextOverlap(targetTitle, candidateTitle);
  const inverseTitleScore = scoreTextOverlap(candidateTitle, targetTitle);
  const authorTarget = normalizeText(targetAuthor);
  const authorsNorm = candidateAuthors.map(a => normalizeText(a)).filter(Boolean);

  const authorScore = authorTarget && authorsNorm.length
    ? Math.max(...authorsNorm.map(a => Math.max(scoreTextOverlap(authorTarget, a), scoreTextOverlap(a, authorTarget))))
    : 0.35;

  return Number(((titleScore * 0.55) + (inverseTitleScore * 0.15) + (authorScore * 0.30)).toFixed(4));
}

async function searchAppleBooks(titulo, autor) {
  console.log("   🍎 Buscando en Apple Books...");
  const q = encodeURIComponent(`${titulo} ${autor}`);
  const data = await fetchJSON(`https://itunes.apple.com/search?term=${q}&entity=ebook&limit=5&country=mx`);
  if (!data?.results?.length) return null;

  const candidates = data.results.map(r => {
    let art = r.artworkUrl100 || "";
    if (art) art = art.replace("100x100", "600x600");
    return {
      portada: art,
      isbn: r.trackId?.toString() || "",
      editorial: r.artistName || "",
      source: "apple_books",
      year: "",
      matched_title: r.trackName || "",
      matched_author: r.artistName || "",
      match_score: scoreBookMatch(titulo, autor, r.trackName || "", [r.artistName || ""])
    };
  }).sort((a, b) => b.match_score - a.match_score);

  const best = candidates[0];
  if (!best || best.match_score < MIN_MATCH_SCORE) return null;
  if (best.portada && await checkImageURL(best.portada)) return best;
  return { ...best, portada: "" };
}

async function searchGoogleBooks(titulo, autor) {
  console.log("   📚 Buscando en Google Books...");
  const q = encodeURIComponent(`${titulo} ${autor}`);
  let data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&langRestrict=es`);
  if (!data?.items?.length) {
    data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`);
    if (!data?.items?.length) return null;
  }

  const candidates = data.items.map(item => {
    const info = safeObject(item.volumeInfo);
    const authors = safeArray(info.authors).map(v => String(v || "").trim()).filter(Boolean);
    const imgs = safeObject(info.imageLinks);
    const url = imgs.extraLarge || imgs.large || imgs.medium || imgs.small || imgs.thumbnail || "";
    const cleanUrl = url ? url.replace("&edge=curl", "").replace("http://", "https://") : "";
    const identifiers = safeArray(info.industryIdentifiers);
    const isbn13 = identifiers.find(i => i.type === "ISBN_13")?.identifier || "";
    const isbn10 = identifiers.find(i => i.type === "ISBN_10")?.identifier || "";
    return {
      portada: cleanUrl,
      isbn: isbn13 || isbn10,
      editorial: info.publisher || "",
      year: String(info.publishedDate || "").substring(0, 4),
      pages: info.pageCount || 0,
      source: "google_books",
      matched_title: info.title || "",
      matched_author: authors.join(", "),
      match_score: scoreBookMatch(titulo, autor, info.title || "", authors)
    };
  }).sort((a, b) => b.match_score - a.match_score);

  const best = candidates[0];
  if (!best || best.match_score < MIN_MATCH_SCORE) return null;
  if (best.portada && await checkImageURL(best.portada)) return best;
  return best;
}

async function searchOpenLibrary(titulo, autor) {
  console.log("   📖 Buscando en Open Library...");
  const q = encodeURIComponent(`${titulo} ${autor}`);
  const data = await fetchJSON(`https://openlibrary.org/search.json?q=${q}&limit=5`);
  if (!data?.docs?.length) return null;

  const candidates = data.docs.map(doc => {
    const authors = safeArray(doc.author_name).map(v => String(v || "").trim()).filter(Boolean);
    const coverId = doc.cover_i;
    return {
      portada: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "",
      isbn: safeArray(doc.isbn)[0] || "",
      editorial: safeArray(doc.publisher)[0] || "",
      year: String(doc.first_publish_year || ""),
      source: "open_library",
      matched_title: doc.title || "",
      matched_author: authors.join(", "),
      match_score: scoreBookMatch(titulo, autor, doc.title || "", authors)
    };
  }).sort((a, b) => b.match_score - a.match_score);

  const best = candidates[0];
  if (!best || best.match_score < MIN_MATCH_SCORE) return null;
  if (best.portada && await checkImageURL(best.portada)) return best;
  return best;
}

async function searchAmazonFallback(_titulo, _autor) {
  console.log("   🟠 Buscando en Amazon (fallback)...");
  return null;
}

async function getBestBookEvidence(titulo, autor) {
  console.log(`🔍 Buscando evidencia para "${titulo}" — ${autor}`);
  const candidates = [
    await searchAppleBooks(titulo, autor),
    await searchGoogleBooks(titulo, autor),
    await searchOpenLibrary(titulo, autor),
    await searchAmazonFallback(titulo, autor)
  ].filter(Boolean);

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

  const issues = [];
  const warnings = [];

  if (yearMin && year && year < yearMin) issues.push(`Año ${year} no cumple mínimo ${yearMin}`);
  else if (yearMin && !year) warnings.push(`No se pudo verificar el año mínimo ${yearMin}`);

  if (yearMax && year && year > yearMax) issues.push(`Año ${year} no cumple máximo ${yearMax}`);
  else if (yearMax && !year) warnings.push(`No se pudo verificar el año máximo ${yearMax}`);

  if (preferRecent && year && year < DEFAULT_YEAR_FRESHNESS_FLOOR && !yearMin) {
    warnings.push(`Es válido, pero no especialmente reciente (año ${year})`);
  }

  const exact_ok = issues.length === 0 && warnings.length === 0;
  const hard_ok = issues.length === 0;
  const reason = issues.length
    ? issues.join("; ")
    : warnings.length
      ? warnings.join("; ")
      : year
        ? `Año verificado ${year}`
        : "Válido por evidencia bibliográfica";

  return { exact_ok, hard_ok, issues, warnings, reason };
}

function scoreLiveCandidate(rec, triggerAnalysis) {
  const titleScore = scoreTextOverlap(triggerAnalysis.clean_for_selection, rec.titulo || "");
  const tagScore = scoreTextOverlap(triggerAnalysis.clean_for_selection, rec.tagline || rec.motivo_corto || "");
  const year = toNumberOrNull(rec.published_year);
  const yearMin = toNumberOrNull(triggerAnalysis.supported_constraints.year_min);
  const yearMax = toNumberOrNull(triggerAnalysis.supported_constraints.year_max);

  let score = titleScore * 45 + tagScore * 18;

  if (rec.source_label === "google_books_newest") score += 8;
  if (rec.source_label === "barnes_and_noble") score += 12;
  if (triggerAnalysis.source_preference === "barnes_and_noble" && rec.source_label === "barnes_and_noble") score += 14;
  if (triggerAnalysis.ranking_preference === "new_releases" && rec.source_label === "barnes_and_noble") score += 10;
  if (triggerAnalysis.supported_constraints.prefer_recent && year) score += Math.max(0, year - 2018) * 1.2;
  if (yearMin && year && year >= yearMin) score += 18;
  if (yearMax && year && year <= yearMax) score += 12;
  if (yearMin && year && year < yearMin) score -= 25;
  if (yearMax && year && year > yearMax) score -= 25;
  if ((yearMin || yearMax) && !year) score -= 6;

  return Number(score.toFixed(2));
}

function scoreFallbackCandidate(rec, evidence, constraintsCheck, triggerAnalysis) {
  let score = (evidence.match_score || 0) * 100;
  if (evidence.source !== "none" || evidence.portada) score += 35;
  if (constraintsCheck.exact_ok) score += 25;
  else if (constraintsCheck.hard_ok) score += 12;
  else score -= 18;
  if (rec.source_label === "barnes_and_noble") score += 8;
  if (triggerAnalysis.source_preference === "barnes_and_noble" && rec.source_label === "barnes_and_noble") score += 10;
  return Number(score.toFixed(2));
}

async function inspectRecommendations(recommendations, triggerAnalysis, sourceLabel) {
  const inspected = [];

  for (const rec of dedupeRecommendations(recommendations)) {
    const evidence = await getBestBookEvidence(rec.titulo, rec.autor || "Autor desconocido");
    const constraintsCheck = evaluateEvidenceAgainstConstraints(evidence, triggerAnalysis);
    const fallback_score = scoreFallbackCandidate(rec, evidence, constraintsCheck, triggerAnalysis);

    const row = {
      recommendation: rec,
      evidence,
      constraintsCheck,
      sourceLabel,
      fallback_score
    };

    inspected.push(row);

    console.log(`   🧪 ${rec.titulo} — ${rec.autor || "Autor desconocido"}`);
    console.log(`      source: ${evidence.source || "none"}`);
    console.log(`      year: ${evidence.year || "—"}`);
    console.log(`      match_score: ${evidence.match_score || 0}`);
    console.log(`      exact_ok: ${constraintsCheck.exact_ok ? "sí" : "no"}`);
    console.log(`      hard_ok: ${constraintsCheck.hard_ok ? "sí" : "no"}`);
    console.log(`      reason: ${constraintsCheck.reason}`);
    console.log(`      fallback_score: ${fallback_score}`);

    if ((evidence.source !== "none" || evidence.portada) && constraintsCheck.exact_ok) {
      return { winner: row, inspected };
    }
  }

  return { winner: null, inspected };
}

function chooseGracefulFallback(inspectedRows) {
  const rows = safeArray(inspectedRows).filter(row => row?.recommendation?.titulo);
  if (!rows.length) return null;

  const withEvidence = rows.filter(row => row.evidence && (row.evidence.source !== "none" || row.evidence.portada));
  const pool = withEvidence.length ? withEvidence : rows;

  pool.sort((a, b) => {
    if (b.fallback_score !== a.fallback_score) return b.fallback_score - a.fallback_score;
    return (b.evidence?.match_score || 0) - (a.evidence?.match_score || 0);
  });

  return pool[0] || null;
}

function resultFromInspectedRow(row, triggerAnalysis, selected_via, mode) {
  return {
    titulo: row.recommendation.titulo,
    autor: row.recommendation.autor || "Autor desconocido",
    tagline: row.recommendation.tagline || "",
    portada: row.evidence.portada || "",
    isbn: row.evidence.isbn || "",
    editorial: row.evidence.editorial || "",
    selected_via,
    selection_reason: row.recommendation.motivo_corto || "",
    trigger_input: triggerAnalysis.raw_input,
    cover_source: row.evidence.source || "none",
    trigger_analysis: triggerAnalysis,
    publication_year: row.evidence.year || row.recommendation.published_year || "",
    selection_validation: {
      match_score: row.evidence.match_score || 0,
      validation_source: row.evidence.source || "none",
      constraint_reason: row.constraintsCheck.reason,
      mode,
      source_label: row.recommendation.source_label || row.sourceLabel || "",
      fallback_score: row.fallback_score || 0
    }
  };
}

/* ═══════════════════════════════════════════════════════════════
   LIVE SOURCING — GOOGLE BOOKS NEWEST
═══════════════════════════════════════════════════════════════ */

async function searchGoogleBooksLiveCandidates(triggerAnalysis) {
  const queries = unique([
    triggerAnalysis.clean_for_selection,
    triggerAnalysis.intent_summary
  ].filter(Boolean));

  const all = [];

  for (const query of queries) {
    const params = new URLSearchParams({
      q: query,
      maxResults: "12",
      printType: "books",
      orderBy: "newest"
    });

    let data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
    if (!data?.items?.length) {
      params.delete("orderBy");
      data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?${params.toString()}`);
    }

    for (const item of safeArray(data?.items)) {
      const info = safeObject(item.volumeInfo);
      const titulo = String(info.title || "").trim();
      if (!titulo) continue;

      const autor = safeArray(info.authors).join(", ").trim();
      const publishedYear = toNumberOrNull(String(info.publishedDate || "").slice(0, 4));

      const rec = {
        titulo,
        autor,
        motivo_corto: "Hallado por búsqueda viva de Google Books ordenada por novedad",
        tagline: firstSentence(info.description || info.subtitle || "", 170),
        source_label: "google_books_newest",
        source_url: item.selfLink || "",
        published_year: publishedYear
      };

      rec.live_score = scoreLiveCandidate(rec, triggerAnalysis);
      all.push(rec);
    }
  }

  return dedupeRecommendations(all)
    .sort((a, b) => (b.live_score || 0) - (a.live_score || 0))
    .slice(0, 12);
}

/* ═══════════════════════════════════════════════════════════════
   LIVE SOURCING — BARNES & NOBLE
═══════════════════════════════════════════════════════════════ */

function collectJsonLdObjects(node, out = []) {
  if (!node) return out;
  if (Array.isArray(node)) {
    for (const item of node) collectJsonLdObjects(item, out);
    return out;
  }
  if (typeof node === "object") {
    out.push(node);
    for (const value of Object.values(node)) collectJsonLdObjects(value, out);
  }
  return out;
}

function parseBarnesAndNobleJsonLd(html) {
  const out = [];
  const scripts = [...String(html || "").matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const match of scripts) {
    const raw = String(match[1] || "").trim();
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const objects = collectJsonLdObjects(parsed, []);

      for (const obj of objects) {
        const type = String(obj?.["@type"] || "").toLowerCase();
        const name = String(obj?.name || obj?.item?.name || "").trim();
        const url = String(obj?.url || obj?.item?.url || "").trim();
        const authorValue = obj?.author || obj?.item?.author;
        const author = Array.isArray(authorValue)
          ? authorValue.map(a => typeof a === "string" ? a : a?.name || "").filter(Boolean).join(", ")
          : typeof authorValue === "string"
            ? authorValue
            : authorValue?.name || "";

        if (!name) continue;
        if (!["book", "product", "listitem"].includes(type) && !/\/w\//.test(url)) continue;

        out.push({
          titulo: stripHtml(name),
          autor: stripHtml(author),
          source_label: "barnes_and_noble",
          source_url: url.startsWith("http") ? url : (url ? `https://www.barnesandnoble.com${url}` : ""),
          motivo_corto: "Hallado en Barnes & Noble",
          tagline: ""
        });
      }
    } catch {}
  }

  return dedupeRecommendations(out);
}

function parseBarnesAndNobleAnchors(html) {
  const out = [];
  const regex = /<a[^>]+href=["'](\/w\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = regex.exec(String(html || "")))) {
    const href = String(match[1] || "").trim();
    const title = stripHtml(match[2] || "");
    if (!title || title.length < 2) continue;

    out.push({
      titulo: title,
      autor: "",
      source_label: "barnes_and_noble",
      source_url: `https://www.barnesandnoble.com${href}`,
      motivo_corto: "Hallado en Barnes & Noble",
      tagline: ""
    });
  }

  return dedupeRecommendations(out);
}

async function enrichBarnesAndNobleCandidatesWithGoogleBooks(candidates) {
  const out = [];

  for (const candidate of candidates) {
    const data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(candidate.titulo)}&maxResults=3`);
    const items = safeArray(data?.items);

    if (items.length) {
      const info = safeObject(items[0].volumeInfo);
      out.push({
        ...candidate,
        autor: candidate.autor || safeArray(info.authors).join(", ").trim(),
        tagline: candidate.tagline || firstSentence(info.description || info.subtitle || "", 170),
        published_year: toNumberOrNull(String(info.publishedDate || "").slice(0, 4))
      });
    } else {
      out.push(candidate);
    }
  }

  return dedupeRecommendations(out);
}

async function searchBarnesAndNobleLiveCandidates(triggerAnalysis) {
  const query = triggerAnalysis.clean_for_selection || triggerAnalysis.intent_summary;
  const searchUrl = `https://www.barnesandnoble.com/s/${encodeURIComponent(query)}`;
  const html = await fetchText(searchUrl);

  if (!html) {
    await appendDebugEvent("barnes_and_noble_fetch_empty", { url: searchUrl });
    return [];
  }

  let candidates = [
    ...parseBarnesAndNobleJsonLd(html),
    ...parseBarnesAndNobleAnchors(html)
  ];

  candidates = dedupeRecommendations(candidates).slice(0, 20);
  candidates = await enrichBarnesAndNobleCandidatesWithGoogleBooks(candidates);

  for (const rec of candidates) {
    rec.live_score = scoreLiveCandidate(rec, triggerAnalysis);
  }

  candidates.sort((a, b) => (b.live_score || 0) - (a.live_score || 0));

  await appendDebugEvent("barnes_and_noble_candidates", {
    url: searchUrl,
    count: candidates.length,
    top: candidates.slice(0, 8)
  });

  return candidates.slice(0, 12);
}

async function resolveLiveCandidates(triggerAnalysis) {
  const shouldUseBn = triggerAnalysis.source_preference === "barnes_and_noble"
    || triggerAnalysis.ranking_preference === "new_releases"
    || triggerAnalysis.ranking_preference === "best_sellers"
    || /barnes/i.test(triggerAnalysis.raw_input);

  const shouldUseGoogleNewest = triggerAnalysis.supported_constraints.prefer_recent
    || Boolean(triggerAnalysis.supported_constraints.year_min)
    || Boolean(triggerAnalysis.supported_constraints.year_max)
    || !shouldUseBn;

  const groups = [];

  if (shouldUseBn) {
    console.log("🛰️  Resolviendo candidatos vivos: Barnes & Noble");
    const bn = await searchBarnesAndNobleLiveCandidates(triggerAnalysis);
    if (bn.length) groups.push(...bn);
  }

  if (shouldUseGoogleNewest) {
    console.log("🛰️  Resolviendo candidatos vivos: Google Books newest");
    const googleNewest = await searchGoogleBooksLiveCandidates(triggerAnalysis);
    if (googleNewest.length) groups.push(...googleNewest);
  }

  const merged = dedupeRecommendations(groups)
    .map(rec => ({
      ...rec,
      live_score: scoreLiveCandidate(rec, triggerAnalysis)
    }))
    .sort((a, b) => (b.live_score || 0) - (a.live_score || 0))
    .slice(0, 15);

  await appendDebugEvent("live_candidates_merged", {
    count: merged.length,
    top: merged.slice(0, 10)
  });

  return merged;
}

/* ═══════════════════════════════════════════════════════════════
   DISCOVER GPT
═══════════════════════════════════════════════════════════════ */

function buildDiscoverUserPrompt(triggerAnalysis, attemptNumber) {
  const lines = [];
  if (triggerAnalysis.supported_constraints.year_min) lines.push(`- año mínimo deseado: ${triggerAnalysis.supported_constraints.year_min}`);
  if (triggerAnalysis.supported_constraints.year_max) lines.push(`- año máximo deseado: ${triggerAnalysis.supported_constraints.year_max}`);
  if (triggerAnalysis.supported_constraints.prefer_recent) lines.push("- preferir libros recientes");
  if (triggerAnalysis.source_preference === "barnes_and_noble") lines.push("- si conoces libros actuales visibles en Barnes & Noble, priorízalos");
  if (triggerAnalysis.ranking_preference) lines.push(`- preferencia de ranking: ${triggerAnalysis.ranking_preference}`);
  if (triggerAnalysis.editorial_requests.length) lines.push(`- ignora estas instrucciones editoriales: ${triggerAnalysis.editorial_requests.join(", ")}`);

  return `
TRIGGER HUMANO LIMPIO:
${triggerAnalysis.clean_for_selection}

INTENCIÓN RESUMIDA:
${triggerAnalysis.intent_summary}

RESTRICCIONES:
${lines.length ? lines.join("\n") : "- ninguna adicional"}

${attemptNumber === 1 ? "Propón hasta 3 libros reales y verificables." : "Reintento estricto: mejor 1 libro sólido que 3 dudosos."}
No inventes.
No metas relleno.
No devuelvas estructura editorial.
`.trim();
}

async function runDiscoverAttempt(triggerAnalysis, attemptNumber) {
  console.log(`🌌 Trigger discover GPT — intento ${attemptNumber}/${MAX_DISCOVER_ATTEMPTS}`);

  const system = `
Eres el selector discover de Triggui.
Debes proponer hasta 3 libros REALES que respondan al momento descrito.
No inventes títulos.
No inventes autores.
Ignora instrucciones editoriales de formato.
Si el usuario pidió recencia o año, intenta respetarlo.
Responde SOLO JSON con:
{
  "recommendations": [
    { "titulo": "...", "autor": "...", "motivo_corto": "...", "tagline": "..." }
  ]
}
`.trim();

  const user = buildDiscoverUserPrompt(triggerAnalysis, attemptNumber);
  const { json, rawContent } = await callOpenAIJson(system, user, attemptNumber === 1 ? 0.25 : 0.10, {
    stage: "discover_selector",
    attempt: attemptNumber
  });

  const recommendations = salvageRecommendations(json);

  await appendDebugEvent("discover_attempt_result", {
    attempt: attemptNumber,
    parsed_preview: json,
    raw_preview: String(rawContent || "").slice(0, 1200),
    recommendations
  });

  return recommendations;
}

/* ═══════════════════════════════════════════════════════════════
   DISCOVER RESOLUTION
═══════════════════════════════════════════════════════════════ */

async function resolveDiscoverFromTrigger(triggerAnalysis) {
  console.log("🌌 Trigger discover — resolviendo con capa viva + GPT...");
  const allInspected = [];

  const liveCandidates = await resolveLiveCandidates(triggerAnalysis);
  if (liveCandidates.length) {
    console.log(`🔢 Candidatos vivos: ${liveCandidates.length}`);
    const liveInspected = await inspectRecommendations(liveCandidates, triggerAnalysis, "live_candidates");
    allInspected.push(...liveInspected.inspected);
    await appendDebugEvent("live_candidates_inspected", { inspected: liveInspected.inspected });

    if (liveInspected.winner) {
      console.log(`✅ Discover validó exacto por capa viva: ${liveInspected.winner.recommendation.titulo} — ${liveInspected.winner.recommendation.autor}`);
      return resultFromInspectedRow(
        liveInspected.winner,
        triggerAnalysis,
        liveInspected.winner.recommendation.source_label === "barnes_and_noble" ? "discover_live_barnes_and_noble" : "discover_live_google_books",
        "exact_live"
      );
    }
  }

  for (let attempt = 1; attempt <= MAX_DISCOVER_ATTEMPTS; attempt += 1) {
    const gptCandidates = await runDiscoverAttempt(triggerAnalysis, attempt);
    if (!gptCandidates.length) continue;

    console.log(`🔢 Recomendaciones GPT discover: ${gptCandidates.length}`);
    const gptInspected = await inspectRecommendations(gptCandidates, triggerAnalysis, `gpt_attempt_${attempt}`);
    allInspected.push(...gptInspected.inspected);
    await appendDebugEvent("gpt_candidates_inspected", { attempt, inspected: gptInspected.inspected });

    if (gptInspected.winner) {
      console.log(`✅ Discover validó exacto por GPT: ${gptInspected.winner.recommendation.titulo} — ${gptInspected.winner.recommendation.autor}`);
      return resultFromInspectedRow(gptInspected.winner, triggerAnalysis, "discover_trigger", "exact_gpt");
    }
  }

  const graceful = chooseGracefulFallback(allInspected);

  if (graceful) {
    const compromiseParts = [];
    if (graceful.constraintsCheck?.warnings?.length) compromiseParts.push(...graceful.constraintsCheck.warnings);
    if (graceful.constraintsCheck?.issues?.length) compromiseParts.push(...graceful.constraintsCheck.issues);
    if (triggerAnalysis.unsupported_runtime_constraints.length) {
      compromiseParts.push(`Se ignoraron restricciones dinámicas no garantizables en este paso: ${triggerAnalysis.unsupported_runtime_constraints.join(", ")}`);
    }

    const compromiseText = compromiseParts.length
      ? `Fallback elegante: ${compromiseParts.join(" | ")}`
      : "Fallback elegante al mejor candidato real disponible";

    await appendDebugEvent("discover_graceful_fallback_used", {
      selected: graceful,
      compromiseText
    });

    const result = resultFromInspectedRow(graceful, triggerAnalysis, "discover_trigger_graceful_fallback", "graceful_fallback");
    result.selection_reason = `${result.selection_reason || "Selección por mejor ajuste disponible"}. ${compromiseText}`.trim();
    return result;
  }

  throw new Error(`Discover no pudo resolver ni exacto ni por fallback un libro suficientemente sólido para "${triggerAnalysis.clean_for_selection}". Revisa ${DEBUG_PATH}.`);
}

/* ═══════════════════════════════════════════════════════════════
   MAIN RESOLUTION
═══════════════════════════════════════════════════════════════ */

function parseBookInput(raw) {
  const [tituloRaw, autorRaw] = String(raw || "").split("|").map(s => s.trim());
  const titulo = tituloRaw || "";
  const autor = autorRaw || "Autor desconocido";
  if (!titulo) throw new Error("Título vacío en LIBRO_INPUT");
  return { titulo, autor };
}

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
  await appendDebugEvent("trigger_analysis", { trigger_analysis: triggerAnalysis });

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
   EXECUTION
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

  await appendDebugEvent("success", { bookData });

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
  await appendDebugEvent("fatal", {
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
