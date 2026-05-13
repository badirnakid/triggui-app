/**
 * validate-book.js — Paso 1 del pipeline Triggui 2.0
 *
 * v3.4 — ANTI-DUPLICADOS
 * ─────────────────────────────────────────────────────────────
 * Cambios sobre v3.3 (adicionales, NO destructivos):
 *
 * 1. Lee /workspaces/triggui-app/recent-books.json (FIFO 30 libros).
 * 2. Filtra candidatos vivos y GPT antes del rerank por
 *    título normalizado + autor normalizado.
 * 3. Inyecta lista de "evita estos" en runDiscoverAttempt.
 * 4. Sube temperature de runDiscoverAttempt intento 1 a 0.7.
 * 5. Degradación elegante: si el filtro vacía la lista,
 *    permite repetir el más antiguo (FIFO inverso).
 * 6. Al final escribe /tmp/triggui-recent-books-update.json
 *    con la entrada nueva. El workflow lo persiste al repo.
 *
 * Lo NO tocado:
 * - Reranker AI sigue en temp 0.05 (queremos determinismo en
 *   evaluación de fit, variedad por filtro pre-rerank).
 * - Constrained selector sigue como está (selecciona desde tu
 *   CSV curado, repetir ahí es válido).
 * - Modo book directo sigue como está (libro explícito, no
 *   cuenta como "recomendación automática").
 *
 * Soporta tres caminos:
 * 1) book + direct         -> libro explícito, validación directa
 * 2) trigger + constrained -> elige SOLO dentro de libros_master.csv
 * 3) trigger + discover    -> resuelve libro con capa viva + GPT + validación
 */

import fs from "node:fs/promises";
import { appendFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

import { fetchEvidence, selectBestCover, buildEnrichedBookData, checkImageURL as checkImageURLEF } from "./evidence-fetcher.js";

const INPUT_MODE = String(process.env.INPUT_MODE || "").trim().toLowerCase();
const SELECTOR_MODE = String(process.env.SELECTOR_MODE || "").trim().toLowerCase();
const ENTRADA_RAW = String(process.env.ENTRADA_RAW || "").trim();
const LIBRO_INPUT = String(process.env.LIBRO_INPUT || "").trim();
const CATALOG_SCOPE = String(process.env.CATALOG_SCOPE || "none").trim().toLowerCase();
const CATALOG_CSV_PATH_ENV = String(process.env.CATALOG_CSV_PATH || "").trim();
const OPENAI_KEY = String(process.env.OPENAI_KEY || "").trim();

// 🌒 Triggui Kids: detección de modo catálogo para fallback CSV en direct_book
const CATALOG_MODE_VB = String(process.env.CATALOG_MODE || "adulto").trim().toLowerCase();
const IS_KIDS_VB = CATALOG_MODE_VB === "kids";

const MODE = INPUT_MODE || (LIBRO_INPUT ? "book" : "");
const SELECTOR = SELECTOR_MODE || (LIBRO_INPUT ? "direct" : "");
const DEBUG_PATH = "/tmp/triggui-validate-debug.json";
const RECENT_UPDATE_PATH = "/tmp/triggui-recent-books-update.json";
const MAX_DISCOVER_ATTEMPTS = 2;
const MIN_EVIDENCE_MATCH_SCORE = 0.38;
const MIN_SEMANTIC_FALLBACK_SCORE = 0.18;

// v3.4: configuración anti-duplicados
const RECENT_BOOKS_MAX = 30;
const RECENT_BOOKS_FILENAME = "recent-books.json";

const HTML_HEADERS = {
  "User-Agent": "triggui-validate-book/6.0",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};

const JSON_HEADERS = {
  "User-Agent": "triggui-validate-book/6.0",
  "Accept": "application/json"
};

const SPANISH_STOPWORDS = new Set([
  "de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas", "y", "o", "u", "a", "al", "en", "con", "sin", "para", "por", "sobre", "segun", "según", "como", "que", "se", "su", "sus", "lo", "le", "les", "ya", "muy", "mas", "más", "algun", "algún", "alguna", "alguno", "evento", "eventos", "variables", "variable", "libro", "escrito", "publicado", "despues", "después", "partir", "top", "novedades", "barnes", "noble", "poner", "titulos", "títulos", "subtitulos", "subtítulos", "parrafos", "párrafos", "relevante", "quiero", "hable"
]);

const EDITORIAL_NOISE_PATTERNS = [
  /poner\s+t[ií]tulos?\s+y\s+subt[ií]tulos?/gi,
  /t[ií]tulos?\s+y\s+subt[ií]tulos?/gi,
  /subt[ií]tulos?\s+de\s+los\s+p[aá]rrafos?/gi,
  /t[ií]tulos?\s+de\s+los\s+p[aá]rrafos?/gi,
  /que\s+los\s+p[aá]rrafos?.{0,100}subt[ií]tulos?/gi,
  /algo\s+s[uú]per\s+relevante/gi,
  /copy\s+in/gi,
  /copy\s+out/gi,
  /headline/gi,
  /subheadline/gi,
  /p[aá]rrafos?/gi
];

const RECENCY_PATTERNS = [
  /libro\s+escrito\s+despu[eé]s\s+de\s+(20\d{2})/i,
  /libro\s+publicado\s+despu[eé]s\s+de\s+(20\d{2})/i,
  /despu[eé]s\s+de\s+(20\d{2})/i,
  /posterior\s+a\s+(20\d{2})/i,
  /a\s+partir\s+de\s+(20\d{2})/i,
  /m[ií]nimo\s+(20\d{2})/i,
  /desde\s+(20\d{2})/i,
  /año\s+(20\d{2})/i
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

const CONCEPT_GROUPS = {
  ego: {
    triggers: ["ego", "trascender", "trascendemos", "trascenderemos", "despertar", "conciencia", "consciencia", "presencia", "identidad", "yo", "dualidad", "desapego", "awareness", "awakening", "self", "selfhood"],
    expansions: ["ego", "yo", "identidad", "conciencia", "consciencia", "presencia", "despertar", "awareness", "awakening", "self", "selfhood", "dualidad", "separacion", "ilusion", "apego"]
  },
  systems: {
    triggers: ["variable", "variables", "evento", "eventos", "patron", "patrones", "causalidad", "causa", "efecto", "conectar", "conexion", "relacion", "relacionar", "sistema", "sistemas", "interconectado", "interdependencia"],
    expansions: ["variables", "eventos", "patrones", "causalidad", "causa", "efecto", "sistemas", "conexion", "relacion", "interdependencia", "interconectado", "systems", "patterns", "causality"]
  },
  spirituality: {
    triggers: ["espiritualidad", "espiritual", "dharma", "meditacion", "meditación", "alma", "despertar", "consciencia", "conciencia", "presencia", "misticismo", "místico", "mistico"],
    expansions: ["espiritualidad", "espiritual", "dharma", "meditacion", "conciencia", "presencia", "misticismo", "despertar", "alma", "transpersonal"]
  },
  philosophy: {
    triggers: ["filosofia", "filosofía", "existencia", "existencial", "ser", "sentido", "realidad", "mente"],
    expansions: ["filosofia", "existencia", "ser", "realidad", "mente", "identidad", "sentido", "metafisica"]
  }
};

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

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" ? value : {};
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function stripQuotedFragments(text) {
  return String(text || "").replace(/["“”'‘’]/g, "");
}

function removePatterns(text, patterns) {
  let next = String(text || "");
  for (const pattern of patterns) next = next.replace(pattern, " ");
  return sanitizeSentenceSpacing(next);
}

function scoreTextOverlap(a, b) {
  const tokensA = unique(tokenize(a));
  const tokensB = new Set(tokenize(b));
  if (!tokensA.length) return 0;
  const overlap = tokensA.filter(token => tokensB.has(token)).length;
  return overlap / tokensA.length;
}

function detectConcepts(text) {
  const norm = normalizeText(text);
  const hits = [];
  for (const [key, group] of Object.entries(CONCEPT_GROUPS)) {
    if (group.triggers.some(trigger => norm.includes(normalizeText(trigger)))) {
      hits.push(key);
    }
  }
  return unique(hits);
}

function expandTextByConcepts(text, forcedConcepts = []) {
  const concepts = unique([...detectConcepts(text), ...forcedConcepts]);
  const tokens = tokenize(text);
  const expansions = [];

  for (const concept of concepts) {
    const group = CONCEPT_GROUPS[concept];
    if (group) expansions.push(...group.expansions);
  }

  return unique([...tokens, ...expansions]).join(" ");
}

function weightedSemanticScore(triggerText, titleText, descText = "", forcedConcepts = []) {
  const expandedTrigger = expandTextByConcepts(triggerText, forcedConcepts);
  const expandedTitle = expandTextByConcepts(titleText, forcedConcepts);
  const expandedDesc = expandTextByConcepts(descText, forcedConcepts);

  const titleScore = scoreTextOverlap(expandedTrigger, expandedTitle);
  const descScore = scoreTextOverlap(expandedTrigger, expandedDesc);
  const inverseTitle = scoreTextOverlap(expandedTitle, expandedTrigger);

  return Number(((titleScore * 0.45) + (descScore * 0.40) + (inverseTitle * 0.15)).toFixed(4));
}

function looksLikeBookIntent(text) {
  return /libro|book|autor|author|leer|lectura/.test(normalizeText(text));
}

function firstSentence(text, max = 180) {
  const clean = sanitizeSentenceSpacing(String(text || ""));
  if (!clean) return "";
  const parts = clean.split(/(?<=[.!?])\s+/);
  const sentence = parts[0] || clean;
  return sentence.length > max ? `${sentence.slice(0, max - 1).trim()}…` : sentence;
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
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
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripHtml(text) {
  return decodeHtmlEntities(String(text || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
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
      headers: JSON_HEADERS,
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
      headers: { "User-Agent": "triggui-validate-book/6.0" }
    });
    const type = res.headers.get("content-type") || "";
    return res.ok && type.startsWith("image/");
  } catch {
    return false;
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

function pickFirst(obj, keys) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== "") {
      return String(obj[key]).trim();
    }
  }
  return "";
}

/* ═══════════════════════════════════════════════════════════════
   v3.4 — RECENT-BOOKS RING (FIFO 30)
   ─────────────────────────────────────────────────────────────
   Lee la raíz del repo triggui-app/recent-books.json.
   Busca en orden:
   1. ENV explícito RECENT_BOOKS_PATH (override para tests)
   2. /workspaces/triggui-app/recent-books.json (Codespaces)
   3. ../../recent-books.json relativo a este script
   4. ./recent-books.json (cwd)

   Si nada existe, devuelve estructura vacía. NO falla.
═══════════════════════════════════════════════════════════════ */

async function findRecentBooksPath() {
  const candidates = [
    String(process.env.RECENT_BOOKS_PATH || "").trim(),
    "/workspaces/triggui-app/recent-books.json",
    path.resolve(process.cwd(), "../../recent-books.json"),
    path.resolve(process.cwd(), `./${RECENT_BOOKS_FILENAME}`),
    `/${RECENT_BOOKS_FILENAME}`
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function loadRecentBooks() {
  const filePath = await findRecentBooksPath();

  if (!filePath) {
    console.log("ℹ️  recent-books.json no encontrado — primer run o archivo borrado, arrancando con ring vacío");
    return { filePath: null, version: "3.4", max_size: RECENT_BOOKS_MAX, books: [] };
  }

  try {
    const raw = (await fs.readFile(filePath, "utf8")).trim();
    if (!raw) {
      console.log(`ℹ️  recent-books.json vacío en ${filePath} — arrancando con ring vacío`);
      return { filePath, version: "3.4", max_size: RECENT_BOOKS_MAX, books: [] };
    }

    const parsed = JSON.parse(raw);
    const books = safeArray(parsed?.books)
      .filter(b => b && typeof b === "object")
      .map(b => ({
        titulo: String(b.titulo || "").trim(),
        autor: String(b.autor || "").trim(),
        slug: String(b.slug || "").trim(),
        titulo_normalizado: String(b.titulo_normalizado || normalizeText(b.titulo)).trim(),
        autor_normalizado: String(b.autor_normalizado || normalizeText(b.autor)).trim(),
        timestamp: String(b.timestamp || "").trim(),
        trigger_input: String(b.trigger_input || "").trim(),
        selected_via: String(b.selected_via || "").trim()
      }))
      .filter(b => b.titulo_normalizado);

    return {
      filePath,
      version: String(parsed?.version || "3.4"),
      max_size: toNumberOrNull(parsed?.max_size) || RECENT_BOOKS_MAX,
      books
    };
  } catch (e) {
    console.log(`⚠️  recent-books.json en ${filePath} no parseable (${e.message}) — arrancando con ring vacío`);
    return { filePath, version: "3.4", max_size: RECENT_BOOKS_MAX, books: [] };
  }
}

function isRecent(recentBooks, titulo, autor) {
  const tNorm = normalizeText(titulo);
  const aNorm = normalizeText(autor);
  if (!tNorm) return false;

  return safeArray(recentBooks?.books).some(prev => {
    const sameTitle = prev.titulo_normalizado === tNorm;
    if (!sameTitle) return false;
    if (!aNorm || !prev.autor_normalizado) return true;
    return prev.autor_normalizado === aNorm;
  });
}

function filterRecent(items, recentBooks, label = "candidatos") {
  const before = safeArray(items).length;
  const out = safeArray(items).filter(item => !isRecent(recentBooks, item?.titulo, item?.autor));
  const removed = before - out.length;
  if (removed > 0) {
    console.log(`   🛡️  Anti-duplicados (${label}): ${removed}/${before} filtrados por ring de ${recentBooks.books.length} recientes`);
  }
  return out;
}

function buildAvoidListForPrompt(recentBooks, max = 30) {
  return safeArray(recentBooks?.books)
    .slice(-max)
    .map(b => `- ${b.titulo}${b.autor ? ` — ${b.autor}` : ""}`)
    .join("\n");
}

/* ═══════════════════════════════════════════════════════════════
   TRIGGER NORMALIZATION
═══════════════════════════════════════════════════════════════ */

function extractYearMin(raw) {
  for (const pattern of RECENCY_PATTERNS) {
    const match = String(raw || "").match(pattern);
    if (match?.[1]) return clampNumber(Number(match[1]), 1900, 2100);
  }
  return null;
}

function extractYearMax(raw) {
  for (const pattern of MAX_YEAR_PATTERNS) {
    const match = String(raw || "").match(pattern);
    if (match?.[1]) return clampNumber(Number(match[1]), 1900, 2100);
  }
  return null;
}

function buildHeuristicSemanticQuery(raw) {
  let next = stripQuotedFragments(String(raw || ""));
  next = removePatterns(next, EDITORIAL_NOISE_PATTERNS);

  next = next
    .replace(/barnes\s*(?:&|and|n)\s*noble/gi, " ")
    .replace(/\btop\b/gi, " ")
    .replace(/\bnovedades\b/gi, " ")
    .replace(/new\s+releases?/gi, " ")
    .replace(/best\s*sellers?/gi, " ")
    .replace(/libro\s+escrito\s+despu[eé]s\s+de\s+20\d{2}/gi, " ")
    .replace(/libro\s+publicado\s+despu[eé]s\s+de\s+20\d{2}/gi, " ")
    .replace(/despu[eé]s\s+de\s+20\d{2}/gi, " ")
    .replace(/posterior\s+a\s+20\d{2}/gi, " ")
    .replace(/a\s+partir\s+de\s+20\d{2}/gi, " ")
    .replace(/antes\s+de\s+20\d{2}/gi, " ")
    .replace(/desde\s+20\d{2}/gi, " ")
    .replace(/año\s+20\d{2}/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return next || String(raw || "").trim();
}

function extractDynamicSignals(raw) {
  const text = normalizeText(raw);
  return {
    source_preference: /barnes and noble|barnes n noble|barnes noble|barnes/.test(text) ? "barnes_and_noble" : null,
    ranking_preference: /best seller|bestseller|mas vendido|mas vendida|mas vendidos/.test(text)
      ? "best_sellers"
      : /novedad|new release|new this week|top en novedades|top de novedades/.test(text)
        ? "new_releases"
        : null
  };
}

function buildSearchQueriesHeuristic(semanticQuery) {
  const concepts = detectConcepts(semanticQuery);
  const expanded = expandTextByConcepts(semanticQuery, concepts);
  const tokens = tokenize(expanded).filter(token => token.length > 2 && !SPANISH_STOPWORDS.has(token));
  const uniq = unique(tokens).slice(0, 10);

  const queries = [];
  if (semanticQuery) queries.push(semanticQuery);
  if (uniq.length >= 3) queries.push(uniq.slice(0, 3).join(" "));
  if (uniq.length >= 5) queries.push(uniq.slice(0, 5).join(" "));

  if (concepts.includes("ego")) {
    queries.push("ego consciousness awakening presence identity");
    queries.push("trascender ego conciencia despertar");
  }
  if (concepts.includes("systems")) {
    queries.push("systems thinking causality pattern recognition");
    queries.push("causality systems patterns events");
  }
  if (concepts.includes("spirituality")) {
    queries.push("spiritual awakening consciousness ego");
  }
  if (concepts.includes("philosophy")) {
    queries.push("self identity consciousness philosophy");
  }

  return unique(queries).slice(0, 8);
}

async function normalizeTriggerRequestWithAI(raw) {
  const system = `
Eres el normalizador de triggers de Triggui.
NO escoges el libro.
Solo separas una entrada humana mezclada en piezas útiles.

Devuelve:
- semantic_query: necesidad real del lector, limpia y útil para selección
- intent_summary: resumen corto del corazón del pedido
- editorial_requests: instrucciones editoriales que NO pertenecen al selector
- source_preference: "barnes_and_noble" o null
- ranking_preference: "new_releases", "best_sellers" o null
- supported_constraints.year_min
- supported_constraints.year_max
- supported_constraints.prefer_recent
- search_queries: hasta 6 búsquedas cortas y útiles para buscar libros reales
- concept_hints: conceptos como "ego", "systems", "spirituality", "philosophy" si aplican

Responde SOLO JSON con:
{
  "semantic_query": "...",
  "intent_summary": "...",
  "editorial_requests": ["..."],
  "source_preference": null,
  "ranking_preference": null,
  "supported_constraints": {
    "year_min": null,
    "year_max": null,
    "prefer_recent": false
  },
  "search_queries": ["..."],
  "concept_hints": ["..."]
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
      supported_constraints: {
        year_min: toNumberOrNull(json?.supported_constraints?.year_min),
        year_max: toNumberOrNull(json?.supported_constraints?.year_max),
        prefer_recent: Boolean(json?.supported_constraints?.prefer_recent)
      },
      search_queries: safeArray(json?.search_queries).map(v => sanitizeSentenceSpacing(String(v || ""))).filter(Boolean),
      concept_hints: safeArray(json?.concept_hints).map(v => String(v || "").trim()).filter(Boolean)
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

  const heurSignals = extractDynamicSignals(raw);
  const yearMinHeuristic = extractYearMin(raw);
  const yearMaxHeuristic = extractYearMax(raw);
  const preferRecentHeuristic = PREFER_RECENT_PATTERNS.some(pattern => pattern.test(String(raw || ""))) || Boolean(yearMinHeuristic);
  const semanticHeuristic = buildHeuristicSemanticQuery(raw);
  const ai = await normalizeTriggerRequestWithAI(raw);

  const yearMinCandidates = [yearMinHeuristic, toNumberOrNull(ai?.supported_constraints?.year_min)].filter(n => Number.isFinite(n) && n > 1900);
  const yearMaxCandidates = [yearMaxHeuristic, toNumberOrNull(ai?.supported_constraints?.year_max)].filter(n => Number.isFinite(n) && n > 1900);

  const semantic_query = sanitizeSentenceSpacing(ai?.semantic_query || semanticHeuristic || String(raw || "").trim());
  const intent_summary = sanitizeSentenceSpacing(ai?.intent_summary || semantic_query);
  const source_preference = ai?.source_preference || heurSignals.source_preference || null;
  const ranking_preference = ai?.ranking_preference || heurSignals.ranking_preference || null;
  const unsupported_runtime_constraints = unique([
    source_preference === "barnes_and_noble" ? "ranking/curaduría viva de Barnes & Noble" : "",
    ranking_preference === "new_releases" ? "lista viva de novedades" : "",
    ranking_preference === "best_sellers" ? "lista viva de best sellers" : ""
  ].filter(Boolean));

  const concept_hints = unique([
    ...safeArray(ai?.concept_hints),
    ...detectConcepts(semantic_query)
  ]);

  const search_queries = unique([
    ...safeArray(ai?.search_queries),
    ...buildSearchQueriesHeuristic(semantic_query)
  ]).slice(0, 8);

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
      prefer_recent: Boolean(ai?.supported_constraints?.prefer_recent) || preferRecentHeuristic
    },
    search_queries,
    concept_hints,
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
  console.log(`🔎 search_queries: ${analysis.search_queries.join(" | ") || "—"}`);
  console.log(`🧩 concept_hints: ${analysis.concept_hints.join(" | ") || "—"}`);
  console.log(`✂️ editorial_requests: ${analysis.editorial_requests.length ? analysis.editorial_requests.join(" | ") : "—"}`);
  console.log(`🌐 unsupported_runtime_constraints: ${analysis.unsupported_runtime_constraints.length ? analysis.unsupported_runtime_constraints.join(" | ") : "—"}`);
  console.log(`🤖 ai_normalizer: ${analysis.notes.used_ai_normalizer ? "sí" : "no"}`);
  console.log("══════════════════════════════════════════");
}

/* ═══════════════════════════════════════════════════════════════
   CSV CATALOG
═══════════════════════════════════════════════════════════════ */

async function getMasterCsvPath() {
  const csvName = IS_KIDS_VB ? "libros_master_kids.csv" : "libros_master.csv";
  const candidates = [
    CATALOG_CSV_PATH_ENV,
    `triggui-content/data/${csvName}`,
    `data/${csvName}`
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
        editorial_requests: triggerAnalysis.editorial_requests,
        supported_constraints: triggerAnalysis.supported_constraints,
        source_preference: triggerAnalysis.source_preference,
        ranking_preference: triggerAnalysis.ranking_preference
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

/* ═══════════════════════════════════════════════════════════════════════════════
   API WRAPPERS v3.2 — DELEGADOS A EVIDENCE-FETCHER
═══════════════════════════════════════════════════════════════════════════════ */

const _evidenceCache = new Map();
function _evidenceKey(titulo, autor) {
  return `${String(titulo || "").trim().toLowerCase()}|${String(autor || "").trim().toLowerCase()}`;
}

async function _getOrFetchEvidence(titulo, autor, isbn = "") {
  const key = _evidenceKey(titulo, autor);
  if (_evidenceCache.has(key)) return _evidenceCache.get(key);
  const evidence = await fetchEvidence({ titulo, autor, isbn });
  _evidenceCache.set(key, evidence);
  return evidence;
}

function _mapSourceToLegacy(result, legacySource) {
  if (!result || !result.ok) return null;
  const vi = result.verified_identity || {};
  const firstCover = Array.isArray(result.covers) && result.covers[0] ? result.covers[0].url : "";
  return {
    portada: firstCover,
    isbn: vi.isbn || "",
    editorial: vi.editorial || vi.autor_completo || "",
    source: legacySource,
    year: vi.año || "",
    matched_title: result.match_details?.matched_title || "",
    matched_author: result.match_details?.matched_author || "",
    match_score: result.match_score || 0,
    synopsis: result.synopsis || "",
    synopsis_length: result.synopsis_length || 0,
    covers: result.covers || [],
    verified_identity: vi
  };
}

async function searchAppleBooks(titulo, autor) {
  console.log("   🍎 Buscando en Apple Books (vía evidence-fetcher)...");
  const evidence = await _getOrFetchEvidence(titulo, autor);
  const mapped = _mapSourceToLegacy(evidence.apple, "apple_books");
  if (!mapped || mapped.match_score < MIN_EVIDENCE_MATCH_SCORE) return null;
  const validCovers = (evidence.valid_covers || []).filter((c) => c.source === "apple_books");
  if (validCovers.length === 0 && mapped.portada) {
    return { ...mapped, portada: "" };
  }
  if (validCovers.length > 0) {
    mapped.portada = validCovers[0].url;
  }
  return mapped;
}

async function searchGoogleBooks(titulo, autor) {
  console.log("   📚 Buscando en Google Books (vía evidence-fetcher)...");
  const evidence = await _getOrFetchEvidence(titulo, autor);
  const mapped = _mapSourceToLegacy(evidence.google, "google_books");
  if (!mapped || mapped.match_score < MIN_EVIDENCE_MATCH_SCORE) return null;
  const validCovers = (evidence.valid_covers || []).filter((c) => c.source === "google_books");
  if (validCovers.length > 0) mapped.portada = validCovers[0].url;
  return mapped;
}

async function searchOpenLibrary(titulo, autor) {
  console.log("   📖 Buscando en Open Library (vía evidence-fetcher)...");
  const evidence = await _getOrFetchEvidence(titulo, autor);
  const mapped = _mapSourceToLegacy(evidence.openlibrary, "open_library");
  if (!mapped || mapped.match_score < MIN_EVIDENCE_MATCH_SCORE) return null;
  const validCovers = (evidence.valid_covers || []).filter((c) => c.source === "openlibrary");
  if (validCovers.length > 0) mapped.portada = validCovers[0].url;
  return mapped;
}

async function searchAmazonFallback(titulo, autor) {
  const evidence = _evidenceCache.get(_evidenceKey(titulo, autor));
  if (!evidence) return null;
  const amz = evidence.amazon;
  if (!amz?.ok) return null;
  const cover = Array.isArray(amz.covers) && amz.covers[0] ? amz.covers[0].url : "";
  if (!cover) return null;
  console.log("   🟠 Amazon cover encontrado (via ISBN chain)");
  return {
    portada: cover,
    isbn: evidence.isbn_discovered || "",
    editorial: "",
    source: "amazon",
    year: "",
    matched_title: "",
    matched_author: "",
    match_score: amz.match_score || 0.85
  };
}

async function getBestBookEvidence(titulo, autor) {
  console.log(`🔍 Buscando evidencia para "${titulo}" — ${autor} (v3.2 unified)`);

  const evidence = await _getOrFetchEvidence(titulo, autor);

  const candidates = [
    _mapSourceToLegacy(evidence.apple, "apple_books"),
    _mapSourceToLegacy(evidence.google, "google_books"),
    _mapSourceToLegacy(evidence.openlibrary, "open_library"),
    evidence.amazon?.ok ? {
      portada: evidence.amazon.covers?.[0]?.url || "",
      isbn: evidence.isbn_discovered || "",
      editorial: "",
      source: "amazon",
      year: "",
      matched_title: "",
      matched_author: "",
      match_score: evidence.amazon.match_score || 0.85
    } : null
  ].filter(Boolean);

  const qualified = candidates.filter((c) => (c.match_score || 0) >= MIN_EVIDENCE_MATCH_SCORE);

  if (!qualified.length) {
    return {
      portada: "",
      isbn: evidence.isbn_discovered || "",
      editorial: "",
      year: "",
      source: "none",
      matched_title: "",
      matched_author: "",
      match_score: 0,
      _evidence: evidence
    };
  }

  qualified.sort((a, b) => {
    const aImage = a.portada ? 1 : 0;
    const bImage = b.portada ? 1 : 0;
    if (bImage !== aImage) return bImage - aImage;
    return (b.match_score || 0) - (a.match_score || 0);
  });

  return { ...qualified[0], _evidence: evidence };
}

function evaluateEvidenceAgainstConstraints(evidence, triggerAnalysis) {
  const year = toNumberOrNull(evidence?.year);
  const yearMin = toNumberOrNull(triggerAnalysis?.supported_constraints?.year_min);
  const yearMax = toNumberOrNull(triggerAnalysis?.supported_constraints?.year_max);
  const preferRecent = Boolean(triggerAnalysis?.supported_constraints?.prefer_recent);

  const issues = [];
  const warnings = [];

  if (yearMin) {
    if (!year) issues.push(`No se pudo verificar el año mínimo ${yearMin}`);
    else if (year < yearMin) issues.push(`Año ${year} no cumple mínimo ${yearMin}`);
  }

  if (yearMax) {
    if (!year) issues.push(`No se pudo verificar el año máximo ${yearMax}`);
    else if (year > yearMax) issues.push(`Año ${year} no cumple máximo ${yearMax}`);
  }

  if (preferRecent && year && !yearMin && year < 2020) {
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
  const semantic = weightedSemanticScore(
    triggerAnalysis.clean_for_selection,
    rec.titulo || "",
    `${rec.tagline || ""} ${rec.motivo_corto || ""}`.trim(),
    triggerAnalysis.concept_hints
  );

  const year = toNumberOrNull(rec.published_year);
  const yearMin = toNumberOrNull(triggerAnalysis.supported_constraints.year_min);
  const yearMax = toNumberOrNull(triggerAnalysis.supported_constraints.year_max);

  let score = semantic * 100;

  if (rec.source_label === "barnes_and_noble") score += 12;
  if (rec.source_label === "google_books_newest") score += 8;
  if (triggerAnalysis.source_preference === "barnes_and_noble" && rec.source_label === "barnes_and_noble") score += 18;
  if (triggerAnalysis.ranking_preference === "new_releases" && rec.source_label === "barnes_and_noble") score += 10;

  if (yearMin) {
    if (year && year >= yearMin) score += 25;
    else if (year && year < yearMin) score -= 40;
    else score -= 22;
  }

  if (yearMax) {
    if (year && year <= yearMax) score += 10;
    else if (year && year > yearMax) score -= 25;
    else score -= 8;
  }

  if (triggerAnalysis.supported_constraints.prefer_recent && year) score += Math.max(0, year - 2018) * 1.5;
  if (year && year < 2015) score -= 14;

  return Number(score.toFixed(2));
}

function scoreFallbackCandidate(row, triggerAnalysis) {
  const semantic = Math.max(
    weightedSemanticScore(
      triggerAnalysis.clean_for_selection,
      row.recommendation.titulo || "",
      `${row.recommendation.tagline || ""} ${row.recommendation.motivo_corto || ""}`.trim(),
      triggerAnalysis.concept_hints
    ),
    toNumberOrNull(row.recommendation.ai_fit_score) || 0
  );

  let score = semantic * 100;
  score += (row.evidence.match_score || 0) * 20;
  if (row.evidence.source !== "none" || row.evidence.portada) score += 20;
  if (row.constraintsCheck.exact_ok) score += 20;
  else if (row.constraintsCheck.hard_ok) score += 6;
  else score -= 80;
  if (row.recommendation.source_label === "barnes_and_noble") score += 8;
  if (triggerAnalysis.source_preference === "barnes_and_noble" && row.recommendation.source_label === "barnes_and_noble") score += 10;

  return Number(score.toFixed(2));
}

async function rerankCandidatesWithAI(triggerAnalysis, candidates, stageLabel) {
  if (!OPENAI_KEY || !candidates.length) return candidates;

  const system = `
Eres el reranker semántico de Triggui.
No inventes libros.
Solo reordena candidatos REALES ya dados.

Tu tarea:
- elegir cuáles responden mejor al trigger humano
- priorizar ajuste semántico real
- respetar año mínimo/máximo si es claro
- preferir fuentes vivas recientes
- NO elegir por fama ni por palabras sueltas

Responde SOLO JSON con:
{
  "ranked": [
    { "candidate_index": 1, "fit_score": 0.91, "reason": "..." }
  ]
}
`.trim();

  const candidateBlock = candidates.map((c, i) => {
    return `${i + 1}. ${c.titulo} | Autor: ${c.autor || "—"} | Año: ${c.published_year || "—"} | Fuente: ${c.source_label || "—"} | Descripción: ${c.tagline || "—"}`;
  }).join("\n");

  const user = `
TRIGGER HUMANO LIMPIO:
${triggerAnalysis.clean_for_selection}

INTENCIÓN RESUMIDA:
${triggerAnalysis.intent_summary}

CONCEPTOS:
${triggerAnalysis.concept_hints.join(", ") || "—"}

RESTRICCIONES:
- año mínimo: ${triggerAnalysis.supported_constraints.year_min || "—"}
- año máximo: ${triggerAnalysis.supported_constraints.year_max || "—"}
- prefer_recent: ${triggerAnalysis.supported_constraints.prefer_recent ? "sí" : "no"}
- source_preference: ${triggerAnalysis.source_preference || "—"}
- ranking_preference: ${triggerAnalysis.ranking_preference || "—"}

CANDIDATOS:
${candidateBlock}

Devuelve hasta 8 ordenados por mejor ajuste.
`.trim();

  try {
    const { json } = await callOpenAIJson(system, user, 0.05, { stage: stageLabel });
    const ranked = safeArray(json?.ranked)
      .map(item => ({
        idx: Number(item?.candidate_index),
        fit_score: Math.max(0, Math.min(1, Number(item?.fit_score || 0))),
        reason: String(item?.reason || "").trim()
      }))
      .filter(item => Number.isFinite(item.idx) && item.idx >= 1 && item.idx <= candidates.length);

    if (!ranked.length) return candidates;

    const byIndex = new Map();
    for (const item of ranked) byIndex.set(item.idx - 1, item);

    const reordered = candidates.map((candidate, idx) => {
      const hit = byIndex.get(idx);
      return {
        ...candidate,
        ai_fit_score: hit?.fit_score ?? 0,
        ai_fit_reason: hit?.reason ?? ""
      };
    }).sort((a, b) => {
      const aScore = Number(a.ai_fit_score || 0);
      const bScore = Number(b.ai_fit_score || 0);
      if (bScore !== aScore) return bScore - aScore;
      return (b.live_score || 0) - (a.live_score || 0);
    });

    await appendDebugEvent("ai_rerank_candidates", {
      stageLabel,
      ranked
    });

    return reordered;
  } catch (e) {
    await appendDebugEvent("ai_rerank_failed", {
      stageLabel,
      error: e.message
    });
    return candidates;
  }
}

async function inspectRecommendations(recommendations, triggerAnalysis, sourceLabel) {
  const inspected = [];

  for (const rec of dedupeRecommendations(recommendations)) {
    const lexical_semantic = weightedSemanticScore(
      triggerAnalysis.clean_for_selection,
      rec.titulo || "",
      `${rec.tagline || ""} ${rec.motivo_corto || ""}`.trim(),
      triggerAnalysis.concept_hints
    );

    const semantic_score = Math.max(lexical_semantic, toNumberOrNull(rec.ai_fit_score) || 0);

    if (semantic_score < MIN_SEMANTIC_FALLBACK_SCORE) {
      console.log(`   🚫 Rechazado por baja relevancia semántica: ${rec.titulo} (${semantic_score})`);
      inspected.push({
        recommendation: rec,
        evidence: { source: "none", match_score: 0, portada: "", year: rec.published_year || "" },
        constraintsCheck: { exact_ok: false, hard_ok: false, issues: ["Relevancia semántica insuficiente"], warnings: [], reason: "Relevancia semántica insuficiente" },
        sourceLabel,
        semantic_score,
        fallback_score: -999
      });
      continue;
    }

    const evidence = await getBestBookEvidence(rec.titulo, rec.autor || "Autor desconocido");
    const constraintsCheck = evaluateEvidenceAgainstConstraints(evidence, triggerAnalysis);

    const row = {
      recommendation: rec,
      evidence,
      constraintsCheck,
      sourceLabel,
      semantic_score,
      fallback_score: 0
    };

    row.fallback_score = scoreFallbackCandidate(row, triggerAnalysis);
    inspected.push(row);

    console.log(`   🧪 ${rec.titulo} — ${rec.autor || "Autor desconocido"}`);
    console.log(`      semantic_score: ${semantic_score}`);
    console.log(`      ai_fit_score: ${rec.ai_fit_score || 0}`);
    console.log(`      source: ${evidence.source || "none"}`);
    console.log(`      year: ${evidence.year || "—"}`);
    console.log(`      match_score: ${evidence.match_score || 0}`);
    console.log(`      exact_ok: ${constraintsCheck.exact_ok ? "sí" : "no"}`);
    console.log(`      hard_ok: ${constraintsCheck.hard_ok ? "sí" : "no"}`);
    console.log(`      reason: ${constraintsCheck.reason}`);
    console.log(`      fallback_score: ${row.fallback_score}`);

    if ((evidence.source !== "none" || evidence.portada) && constraintsCheck.exact_ok) {
      return { winner: row, inspected };
    }
  }

  return { winner: null, inspected };
}

function chooseGracefulFallback(inspectedRows) {
  const rows = safeArray(inspectedRows).filter(row => row?.recommendation?.titulo);
  if (!rows.length) return null;

  const eligible = rows.filter(row => {
    const evidenceExists = row.evidence && (row.evidence.source !== "none" || row.evidence.portada);
    const dignified = row.semantic_score >= MIN_SEMANTIC_FALLBACK_SCORE;
    const hardOk = row.constraintsCheck?.hard_ok === true;
    return evidenceExists && dignified && hardOk;
  });

  if (!eligible.length) return null;

  eligible.sort((a, b) => {
    if (b.fallback_score !== a.fallback_score) return b.fallback_score - a.fallback_score;
    return (b.semantic_score || 0) - (a.semantic_score || 0);
  });

  return eligible[0] || null;
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
    selection_reason: row.recommendation.motivo_corto || row.recommendation.ai_fit_reason || "",
    trigger_input: triggerAnalysis.raw_input,
    cover_source: row.evidence.source || "none",
    trigger_analysis: triggerAnalysis,
    publication_year: row.evidence.year || row.recommendation.published_year || "",
    selection_validation: {
      semantic_score: row.semantic_score || 0,
      ai_fit_score: row.recommendation.ai_fit_score || 0,
      match_score: row.evidence.match_score || 0,
      validation_source: row.evidence.source || "none",
      constraint_reason: row.constraintsCheck.reason,
      mode,
      source_label: row.recommendation.source_label || row.sourceLabel || "",
      fallback_score: row.fallback_score || 0
    }
  };
}

async function searchGoogleBooksLiveCandidates(triggerAnalysis) {
  const queries = unique(triggerAnalysis.search_queries.filter(Boolean));
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
      const description = firstSentence(info.description || info.subtitle || "", 170);

      const rec = {
        titulo,
        autor,
        motivo_corto: "Hallado por búsqueda viva de Google Books ordenada por novedad",
        tagline: description,
        source_label: "google_books_newest",
        source_url: item.selfLink || "",
        published_year: publishedYear,
        live_score: 0,
        ai_fit_score: 0,
        ai_fit_reason: ""
      };

      rec.live_score = scoreLiveCandidate(rec, triggerAnalysis);
      all.push(rec);
    }
  }

  return dedupeRecommendations(all)
    .sort((a, b) => (b.live_score || 0) - (a.live_score || 0))
    .slice(0, 15);
}

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
          tagline: "",
          published_year: null,
          live_score: 0,
          ai_fit_score: 0,
          ai_fit_reason: ""
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
    if (!title || title.length < 3) continue;
    out.push({
      titulo: title,
      autor: "",
      source_label: "barnes_and_noble",
      source_url: `https://www.barnesandnoble.com${href}`,
      motivo_corto: "Hallado en Barnes & Noble",
      tagline: "",
      published_year: null,
      live_score: 0,
      ai_fit_score: 0,
      ai_fit_reason: ""
    });
  }
  return dedupeRecommendations(out);
}

async function enrichBarnesAndNobleCandidatesWithGoogleBooks(candidates) {
  const out = [];
  for (const candidate of candidates) {
    const q = encodeURIComponent(candidate.titulo);
    const data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=3`);
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
  const query = triggerAnalysis.search_queries[0] || triggerAnalysis.clean_for_selection || triggerAnalysis.intent_summary;
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

  candidates = candidates
    .filter(rec => weightedSemanticScore(triggerAnalysis.clean_for_selection, rec.titulo || "", `${rec.tagline || ""} ${rec.motivo_corto || ""}`.trim(), triggerAnalysis.concept_hints) >= MIN_SEMANTIC_FALLBACK_SCORE / 2)
    .sort((a, b) => (b.live_score || 0) - (a.live_score || 0))
    .slice(0, 12);

  await appendDebugEvent("barnes_and_noble_candidates", {
    url: searchUrl,
    count: candidates.length,
    top: candidates.slice(0, 8)
  });

  return candidates;
}

async function resolveLiveCandidates(triggerAnalysis, recentBooks) {
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

  let merged = dedupeRecommendations(groups)
    .map(rec => ({ ...rec, live_score: scoreLiveCandidate(rec, triggerAnalysis) }))
    .sort((a, b) => (b.live_score || 0) - (a.live_score || 0))
    .slice(0, 15);

  // v3.4: filtro pre-rerank por ring de recientes
  const beforeFilter = merged.length;
  merged = filterRecent(merged, recentBooks, "live_candidates");
  const afterFilter = merged.length;

  await appendDebugEvent("live_candidates_filter_recent", {
    before: beforeFilter,
    after: afterFilter,
    removed: beforeFilter - afterFilter,
    ring_size: recentBooks.books.length
  });

  merged = await rerankCandidatesWithAI(triggerAnalysis, merged, "live_candidates_rerank");

  await appendDebugEvent("live_candidates_merged", {
    count: merged.length,
    top: merged.slice(0, 10)
  });

  return merged;
}

/* ═══════════════════════════════════════════════════════════════
   DISCOVER GPT
═══════════════════════════════════════════════════════════════ */

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
      published_year: toNumberOrNull(item?.published_year) || null,
      live_score: toNumberOrNull(item?.live_score) || 0,
      ai_fit_score: toNumberOrNull(item?.ai_fit_score) || 0,
      ai_fit_reason: String(item?.ai_fit_reason || "").trim()
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

function buildDiscoverUserPrompt(triggerAnalysis, attemptNumber, recentBooks) {
  const lines = [];
  if (triggerAnalysis.supported_constraints.year_min) lines.push(`- año mínimo obligatorio: ${triggerAnalysis.supported_constraints.year_min}`);
  if (triggerAnalysis.supported_constraints.year_max) lines.push(`- año máximo obligatorio: ${triggerAnalysis.supported_constraints.year_max}`);
  if (triggerAnalysis.supported_constraints.prefer_recent) lines.push("- preferir libros recientes");
  if (triggerAnalysis.source_preference === "barnes_and_noble") lines.push("- si conoces libros recientes visibles en Barnes & Noble, priorízalos");
  if (triggerAnalysis.ranking_preference) lines.push(`- preferencia de ranking: ${triggerAnalysis.ranking_preference}`);
  if (triggerAnalysis.editorial_requests.length) lines.push(`- ignora estas instrucciones editoriales: ${triggerAnalysis.editorial_requests.join(", ")}`);

  // v3.4: inyectar lista de evitados
  const avoidList = buildAvoidListForPrompt(recentBooks);
  const avoidBlock = avoidList
    ? `\n\nEVITA ESTOS LIBROS YA RECOMENDADOS RECIENTEMENTE:\n${avoidList}\n\nNo los propongas. Busca alternativas reales con fit equivalente.`
    : "";

  return `
TRIGGER HUMANO LIMPIO:
${triggerAnalysis.clean_for_selection}

INTENCIÓN RESUMIDA:
${triggerAnalysis.intent_summary}

CONCEPTOS:
${triggerAnalysis.concept_hints.join(", ") || "—"}

RESTRICCIONES:
${lines.length ? lines.join("\n") : "- ninguna adicional"}

CONSULTAS ÚTILES:
${triggerAnalysis.search_queries.join(" | ")}${avoidBlock}

${attemptNumber === 1 ? "Propón hasta 3 libros reales y verificables." : "Reintento estricto: mejor 1 libro sólido que 3 dudosos."}
No inventes.
No metas relleno.
No devuelvas estructura editorial.
`.trim();
}

async function runDiscoverAttempt(triggerAnalysis, attemptNumber, recentBooks) {
  console.log(`🌌 Trigger discover GPT — intento ${attemptNumber}/${MAX_DISCOVER_ATTEMPTS}`);

  const system = `
Eres el selector discover de Triggui.
Debes proponer hasta 3 libros REALES que respondan al momento descrito.
No inventes títulos.
No inventes autores.
Ignora instrucciones editoriales de formato.
Si el usuario pidió recencia o año, respétalo si no estás adivinando.
Si te dan una lista de libros a evitar, NO los propongas; busca alternativas reales.
Responde SOLO JSON con:
{
  "recommendations": [
    { "titulo": "...", "autor": "...", "motivo_corto": "...", "tagline": "..." }
  ]
}
`.trim();

  const user = buildDiscoverUserPrompt(triggerAnalysis, attemptNumber, recentBooks);
  // v3.4: subir temperature de intento 1 a 0.7 para variedad real
  const temperature = attemptNumber === 1 ? 0.7 : 0.10;

  const { json, rawContent } = await callOpenAIJson(system, user, temperature, {
    stage: "discover_selector",
    attempt: attemptNumber,
    temperature,
    avoid_list_size: recentBooks.books.length
  });

  const recommendations = salvageRecommendations(json);

  await appendDebugEvent("discover_attempt_result", {
    attempt: attemptNumber,
    parsed_preview: json,
    raw_preview: String(rawContent || "").slice(0, 1200),
    recommendations,
    temperature
  });

  return recommendations;
}

/* ═══════════════════════════════════════════════════════════════
   DISCOVER RESOLUTION
═══════════════════════════════════════════════════════════════ */

function buildGracefulCompromiseText(row, triggerAnalysis) {
  const parts = [];
  if (row.constraintsCheck?.warnings?.length) parts.push(...row.constraintsCheck.warnings);
  if (row.constraintsCheck?.issues?.length) parts.push(...row.constraintsCheck.issues);
  if (triggerAnalysis.unsupported_runtime_constraints.length) {
    parts.push(`Se ignoraron restricciones dinámicas no garantizables en este paso: ${triggerAnalysis.unsupported_runtime_constraints.join(", ")}`);
  }
  return parts.length ? `Fallback elegante: ${parts.join(" | ")}` : "Fallback elegante al mejor candidato real disponible";
}

/**
 * v3.4 — Fallback de degradación elegante para anti-duplicados:
 * Si TODOS los candidatos están filtrados por el ring, repite el más antiguo
 * (FIFO: primer elemento del array = más viejo). Promesa de variedad cede a
 * promesa de "siempre dar libro" en este caso extremo.
 */
async function resolveFromOldestRecent(triggerAnalysis, recentBooks) {
  const oldest = recentBooks.books[0];
  if (!oldest?.titulo) return null;

  console.log(`⚠️  Anti-duplicados agotó alternativas — degradación elegante: repetir más antiguo del ring`);
  console.log(`📖 Más antiguo: ${oldest.titulo} — ${oldest.autor}`);

  const evidence = await getBestBookEvidence(oldest.titulo, oldest.autor || "Autor desconocido");
  const constraintsCheck = evaluateEvidenceAgainstConstraints(evidence, triggerAnalysis);

  const lexical_semantic = weightedSemanticScore(
    triggerAnalysis.clean_for_selection,
    oldest.titulo,
    "",
    triggerAnalysis.concept_hints
  );

  const row = {
    recommendation: {
      titulo: oldest.titulo,
      autor: oldest.autor || "Autor desconocido",
      tagline: "",
      motivo_corto: "Repetición elegante: el ring de últimos 30 libros agotó alternativas",
      source_label: "recent_books_oldest",
      published_year: null,
      live_score: 0,
      ai_fit_score: 0,
      ai_fit_reason: ""
    },
    evidence,
    constraintsCheck,
    sourceLabel: "recent_books_oldest",
    semantic_score: lexical_semantic,
    fallback_score: 0
  };

  await appendDebugEvent("recent_books_degradation", {
    repeated_book: oldest,
    ring_size: recentBooks.books.length
  });

  const result = resultFromInspectedRow(row, triggerAnalysis, "discover_recent_oldest_fallback", "recent_oldest_fallback");
  result.selection_reason = `Anti-duplicados FIFO: el ring de últimos ${recentBooks.books.length} libros agotó alternativas válidas. Se repite el más antiguo (registrado el ${oldest.timestamp || "—"}).`;
  return result;
}

async function resolveDiscoverFromTrigger(triggerAnalysis, recentBooks) {
  console.log("🌌 Trigger discover — resolviendo con capa viva + GPT...");
  const allInspected = [];

  let liveCandidates = await resolveLiveCandidates(triggerAnalysis, recentBooks);
  if (liveCandidates.length) {
    console.log(`🔢 Candidatos vivos (post-filtro recientes): ${liveCandidates.length}`);
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
  } else {
    console.log("🟡 Sin candidatos vivos disponibles después del filtro de recientes");
  }

  for (let attempt = 1; attempt <= MAX_DISCOVER_ATTEMPTS; attempt += 1) {
    let gptCandidates = await runDiscoverAttempt(triggerAnalysis, attempt, recentBooks);

    // v3.4: filtro pre-rerank también para GPT (defensa en profundidad
    // por si GPT ignoró el avoid list del prompt)
    const beforeGpt = gptCandidates.length;
    gptCandidates = filterRecent(gptCandidates, recentBooks, `gpt_attempt_${attempt}`);
    const afterGpt = gptCandidates.length;
    if (beforeGpt !== afterGpt) {
      await appendDebugEvent("gpt_candidates_filter_recent", {
        attempt,
        before: beforeGpt,
        after: afterGpt,
        removed: beforeGpt - afterGpt
      });
    }

    if (!gptCandidates.length) {
      console.log(`🟡 Intento ${attempt}: GPT propuso solo libros ya en el ring, reintentando`);
      continue;
    }

    gptCandidates = await rerankCandidatesWithAI(triggerAnalysis, gptCandidates, `discover_gpt_rerank_attempt_${attempt}`);

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
    const result = resultFromInspectedRow(graceful, triggerAnalysis, "discover_trigger_graceful_fallback", "graceful_fallback");
    result.selection_reason = `${result.selection_reason || "Selección por mejor ajuste disponible"}. ${buildGracefulCompromiseText(graceful, triggerAnalysis)}`.trim();
    await appendDebugEvent("discover_graceful_fallback_used", {
      selected: graceful,
      selection_reason: result.selection_reason
    });
    return result;
  }

  // v3.4: degradación elegante final — repetir el más antiguo del ring
  if (recentBooks.books.length > 0) {
    const repeated = await resolveFromOldestRecent(triggerAnalysis, recentBooks);
    if (repeated) return repeated;
  }

  throw new Error(`Discover no pudo resolver un libro digno para "${triggerAnalysis.clean_for_selection}" respetando el nivel de exigencia actual. Revisa ${DEBUG_PATH}.`);
}

/* ═══════════════════════════════════════════════════════════════
   MAIN RESOLUTION
═══════════════════════════════════════════════════════════════ */

function parseBookInput(raw) {
  const [tituloRaw, autorRaw] = String(raw || "").split("|").map(s => s.trim());
  const titulo = tituloRaw || "";
  if (!titulo) throw new Error("Título vacío en LIBRO_INPUT");
  // 🌒 Nivel dios: si no hay autor en input, devolvemos vacío para que resolveBookData
  // intente lookup en CSV (kids o adulto) ANTES de rendirse con "Autor desconocido"
  const autor = autorRaw || "";
  return { titulo, autor };
}

// 🌒 Lookup nivel dios en CSV (kids o adulto según CATALOG_MODE)
// 2 niveles de match: exacto normalizado y parcial bidireccional
// Devuelve null si no encuentra; el evidence fetcher hará fallback con Tier 3 GPT
async function findInCatalog(titulo) {
  try {
    const csvPath = await getMasterCsvPath();
    if (!csvPath) return null;
    const csv = await fs.readFile(csvPath, "utf8");
    const rows = parse(csv, { columns: true, skip_empty_lines: true })
      .map((row, index) => mapCatalogRow(row, index))
      .filter(row => row.titulo);

    const norm = (s) => normalizeText(s || "").toLowerCase().trim();
    const tNorm = norm(titulo);
    if (!tNorm) return null;

    // Nivel 1: match exacto normalizado
    let match = rows.find(r => norm(r.titulo) === tNorm);
    // Nivel 2: match parcial bidireccional (input ⊂ csv o csv ⊂ input)
    if (!match) {
      match = rows.find(r => {
        const rT = norm(r.titulo);
        return rT && (rT.includes(tNorm) || tNorm.includes(rT));
      });
    }
    if (!match) return null;

    console.log(`📚 Match en CSV (${csvPath}): "${match.titulo}" — ${match.autor || "(sin autor en CSV)"}`);
    return {
      titulo_exacto: match.titulo,
      autor: match.autor || null,
      isbn: match.isbn || null,
      portada: match.portada || null,
      tagline: match.tagline || null,
      editorial: match.editorial || null,
    };
  } catch (e) {
    console.log(`⚠️  findInCatalog error: ${e.message}`);
    return null;
  }
}

async function getBestCover(titulo, autor) {
  const evidence = await getBestBookEvidence(titulo, autor);
  return {
    portada: evidence.portada || "",
    isbn: evidence.isbn || "",
    editorial: evidence.editorial || "",
    year: evidence.year || "",
    source: evidence.source || "none",
    _evidence: evidence._evidence || null,
    portada_candidates: evidence._evidence?.valid_covers || [],
    synopsis: evidence.synopsis || "",
    verified_identity: evidence.verified_identity || {},
    match_score: evidence.match_score || 0,
    covers_all: evidence.covers || []
  };
}

async function resolveBookData(recentBooks) {
  if (MODE === "book") {
    if (SELECTOR !== "direct") {
      console.log(`ℹ️  Modo book fuerza selector direct (recibido: ${SELECTOR})`);
    }
    const parsed = parseBookInput(LIBRO_INPUT);

    // 🌒 v3.8.4 cirugia 8 — Title Canonicalization (Nivel dios cuantico-quark)
    // SIEMPRE busca en CSV (no solo cuando falta autor) para canonicalizar el titulo.
    // El CSV es SSOT del titulo limpio — elimina contaminacion del input del usuario:
    //   "Vida contemplativa — Byung-Chul Han" → "Vida contemplativa"
    //   "Vida contemplativa | Byung-Chul Han" → "Vida contemplativa"
    //   "Vida contemplativa de Byung-Chul Han" → "Vida contemplativa"
    // El match parcial bidireccional de findInCatalog (csv ⊂ input | input ⊂ csv) cubre los 5 modos.
    // Si no hay match → preserva input crudo (comportamiento original).
    let tituloCanonico = parsed.titulo;
    let autor = parsed.autor;
    let tagline = "";
    let portada = "";
    let isbn = "";
    let editorial = "";
    let enrichedFrom = null;

    // Cirugia 8: SIEMPRE intentar canonicalizacion en CSV (no solo cuando falta autor)
    const fromCsv = await findInCatalog(parsed.titulo);
    if (fromCsv) {
      // Canonicalizar titulo desde CSV (override input crudo si difieren)
      if (fromCsv.titulo_exacto && fromCsv.titulo_exacto !== parsed.titulo) {
        console.log(`🪡 Titulo canonicalizado desde CSV: "${parsed.titulo}" → "${fromCsv.titulo_exacto}"`);
        tituloCanonico = fromCsv.titulo_exacto;
      }
      // Enriquecer si falta autor (logica original preservada)
      if (!autor && fromCsv.autor) {
        autor = fromCsv.autor;
        tagline = fromCsv.tagline || "";
        portada = fromCsv.portada || "";
        isbn = fromCsv.isbn || "";
        editorial = fromCsv.editorial || "";
        enrichedFrom = `csv_${CATALOG_MODE_VB}`;
      }
    }

    if (!autor) {
      console.log(`⚠️  "${parsed.titulo}" no encontrado en CSV (${CATALOG_MODE_VB}) — evidence fetcher hara el trabajo con titulo solo`);
      autor = "Autor desconocido";
    }

    return {
      titulo: tituloCanonico,
      autor,
      tagline,
      portada,
      isbn,
      editorial,
      selected_via: "direct_book",
      selection_reason: enrichedFrom
        ? `Libro explícito (workflow_dispatch) + canonicalizado desde ${enrichedFrom}`
        : "Libro explícito proporcionado en workflow_dispatch"
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
    return await resolveDiscoverFromTrigger(triggerAnalysis, recentBooks);
  }

  throw new Error(`Combinación no soportada: INPUT_MODE=${MODE} / SELECTOR_MODE=${SELECTOR}`);
}

/* ═══════════════════════════════════════════════════════════════
   EXECUTION
═══════════════════════════════════════════════════════════════ */

try {
  // v3.4: cargar ring antes de resolver
  const recentBooks = await loadRecentBooks();
  console.log(`🛡️  Anti-duplicados: ring de ${recentBooks.books.length} libros recientes cargado desde ${recentBooks.filePath || "(vacío inicial)"}`);

  const resolved = await resolveBookData(recentBooks);

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

  const identitySealed = resolved.selected_via === "constrained_catalog"
                      || resolved.selected_via === "discover_trigger"
                      || resolved.selected_via === "discover_trigger_graceful_fallback"
                      || resolved.selected_via === "discover_live_barnes_and_noble"
                      || resolved.selected_via === "discover_live_google_books"
                      || resolved.selected_via === "discover_recent_oldest_fallback";

  const bookData = {
    titulo,
    autor,
    slug,
    tagline: resolved.tagline || "",
    portada: portadaFinal,
    portada_url: portadaFinal,
    portada_source: coverSourceFinal,
    portada_candidates: cover.portada_candidates || [],
    needs_fallback_cover: !portadaFinal,
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
    contexto_2026: resolved.contexto_2026 || {},
    identity_sealed: identitySealed,
    _evidence: cover._evidence || null,
    _evidence_synopsis: cover.synopsis || "",
    _evidence_verified_identity: cover.verified_identity || {},
    _evidence_match_score: cover.match_score || 0
  };

  await fs.writeFile("/tmp/triggui-slug.txt", slug, "utf8");
  await fs.writeFile("/tmp/triggui-titulo.txt", titulo, "utf8");
  await fs.writeFile("/tmp/triggui-book.json", JSON.stringify(bookData, null, 2), "utf8");

  // v3.4: emitir actualización del ring SOLO para selección automática (constrained o discover).
  // Modo book directo NO entra al ring porque es elección explícita del humano.
  const shouldUpdateRing = bookData.selected_via === "constrained_catalog"
                        || bookData.selected_via === "discover_trigger"
                        || bookData.selected_via === "discover_trigger_graceful_fallback"
                        || bookData.selected_via === "discover_live_barnes_and_noble"
                        || bookData.selected_via === "discover_live_google_books";
  // NOTA: discover_recent_oldest_fallback NO entra (es repetición, ya estaba en el ring)

  if (shouldUpdateRing) {
    const newEntry = {
      titulo,
      autor,
      slug,
      titulo_normalizado: normalizeText(titulo),
      autor_normalizado: normalizeText(autor),
      timestamp: new Date().toISOString(),
      trigger_input: resolved.trigger_input || ENTRADA_RAW || "",
      selected_via: bookData.selected_via
    };

    // FIFO: filtrar duplicado exacto del ring (por si acaso) y agregar al final.
    // Si supera RECENT_BOOKS_MAX, elimina el más antiguo (índice 0).
    const filteredBooks = recentBooks.books.filter(b =>
      !(b.titulo_normalizado === newEntry.titulo_normalizado && b.autor_normalizado === newEntry.autor_normalizado)
    );
    const updatedBooks = [...filteredBooks, newEntry].slice(-RECENT_BOOKS_MAX);

    const updatedRing = {
      version: "3.4",
      max_size: RECENT_BOOKS_MAX,
      books: updatedBooks,
      _note: "FIFO ring de últimos 30 libros generados por selección automática (constrained o discover). Filtro pre-rerank en validate-book.js. Inicializa vacío y se rellena con cada run exitoso. Si se borra, el sistema arranca limpio sin daño."
    };

    await fs.writeFile(RECENT_UPDATE_PATH, JSON.stringify(updatedRing, null, 2), "utf8");
    console.log(`🛡️  Ring actualizado: ${updatedBooks.length}/${RECENT_BOOKS_MAX} entradas → ${RECENT_UPDATE_PATH}`);
    console.log(`   Nuevo: ${titulo} — ${autor}`);
  } else {
    console.log(`ℹ️  selected_via=${bookData.selected_via} — no actualiza ring (modo book directo o repetición)`);
  }

  await appendDebugEvent("success", { bookData, ring_updated: shouldUpdateRing });

  setGithubOutput("book_json", JSON.stringify(bookData));
  setGithubOutput("slug", slug);
  setGithubOutput("titulo", titulo);
  setGithubOutput("autor", autor);
  setGithubOutput("selected_via", bookData.selected_via);
  setGithubOutput("validation_debug_path", DEBUG_PATH);
  setGithubOutput("recent_books_update_path", shouldUpdateRing ? RECENT_UPDATE_PATH : "");

  console.log("══════════════════════════════════════════");
  console.log(`🧭 INPUT_MODE: ${MODE}`);
  console.log(`🧠 SELECTOR_MODE: ${SELECTOR}`);
  console.log(`📖 ${titulo}`);
  console.log(`✍️  ${autor}`);
  console.log(`🔗 Slug: ${slug}`);
  console.log(`🧬 selected_via: ${bookData.selected_via}`);
  console.log(`🔒 identity_sealed: ${bookData.identity_sealed ? "sí (grounding no cambiará identidad)" : "no"}`);
  console.log(`💬 selection_reason: ${bookData.selection_reason || "—"}`);
  console.log(`🖼️  Portada: ${coverSourceFinal} ${portadaFinal ? "✅" : "⚠ (se generará SVG fallback en build-contenido)"}`);
  console.log(`🎨 Portada candidates: ${bookData.portada_candidates.length}`);
  console.log(`📦 ISBN: ${isbnFinal || "—"}`);
  console.log(`🏢 Editorial: ${editorialFinal || "—"}`);
  console.log(`🗓️  publication_year: ${publicationYearFinal || "—"}`);
  console.log(`📄 Duplicado: ${duplicado ? "sí" : "no"}`);
  console.log(`🛡️  Ring actualizado: ${shouldUpdateRing ? "sí" : "no"}`);
  console.log(`⚡ Evidence precargada: ${bookData._evidence ? `sí (${bookData._evidence._sources_succeeded?.length || 0} sources)` : "no"}`);
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