/**
 * validate-book.js — Paso 1 del pipeline Triggui 2.0
 *
 * Soporta tres caminos:
 * 1) book + direct        -> libro explícito, validación directa
 * 2) trigger + constrained -> elige SOLO dentro de libros_master.csv
 * 3) trigger + discover    -> propone libro con GPT y valida existencia
 *
 * Salida:
 * - GitHub Actions output: book_json
 * - /tmp/triggui-slug.txt
 * - /tmp/triggui-titulo.txt
 * - /tmp/triggui-book.json
 *
 * Cascada de portadas:
 * Apple Books → Google Books → Open Library → Amazon
 * Si ninguna: portada vacía y fallback visual downstream
 */

import fs from "node:fs/promises";
import { appendFileSync } from "node:fs";
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

function pickFirst(obj, keys) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== "") {
      return String(obj[key]).trim();
    }
  }
  return "";
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
        "User-Agent": "triggui-validate-book/1.0",
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
        "User-Agent": "triggui-validate-book/1.0"
      }
    });

    const type = res.headers.get("content-type") || "";
    return res.ok && type.startsWith("image/");
  } catch {
    return false;
  }
}

async function callOpenAIJson(system, user, temperature = 0.3) {
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
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
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

async function resolveConstrainedFromTrigger(trigger) {
  if (CATALOG_SCOPE !== "libros_master_csv") {
    throw new Error(`catalog_scope=${CATALOG_SCOPE} no soportado para constrained`);
  }

  const { csvPath, rows } = await loadCatalogRows();

  const ranked = rows
    .map(row => ({
      ...row,
      heuristic_score: scoreCatalogCandidate(trigger, row)
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
TRIGGER HUMANO REAL:
${trigger}

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
    const response = await callOpenAIJson(system, user, 0.2);
    const idx = Number(response?.candidate_index);
    motive = String(response?.motivo_corto || "").trim();

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
    contexto_2026: selected.contexto ? { aplicacion_badir_hoy: selected.contexto } : {},
    selected_via: "constrained_catalog",
    selection_reason: motive,
    catalog_scope: CATALOG_SCOPE,
    trigger_input: trigger
  };
}

/* ═══════════════════════════════════════════════════════════════
   SELECTOR — DISCOVER
═══════════════════════════════════════════════════════════════ */

async function resolveDiscoverFromTrigger(trigger) {
  console.log("🌌 Trigger discover — proponiendo libros reales con GPT...");

  const system = `
Eres el selector discover de Triggui.
Recibes un trigger humano real y debes proponer hasta 3 libros REALES que mejor respondan a ese momento.
No inventes títulos.
No inventes autores.
Prioriza libros conocidos, verificables y útiles de verdad.
Evita responder con libros demasiado genéricos si hay uno más específico.
Responde SOLO JSON con:
{
  "recommendations": [
    { "titulo": "...", "autor": "...", "motivo_corto": "...", "tagline": "..." }
  ]
}
`.trim();

  const user = `
TRIGGER HUMANO REAL:
${trigger}

Propón hasta 3 libros reales y verificables.
Deben ser libros que un lector podría buscar hoy mismo.
No metas relleno.
`.trim();

  const response = await callOpenAIJson(system, user, 0.35);
  const recs = Array.isArray(response?.recommendations) ? response.recommendations : [];

  if (!recs.length) {
    throw new Error("Discover no devolvió recomendaciones válidas");
  }

  const cleaned = recs
    .map((rec) => ({
      titulo: String(rec?.titulo || "").trim(),
      autor: String(rec?.autor || "").trim(),
      motivo_corto: String(rec?.motivo_corto || "").trim(),
      tagline: String(rec?.tagline || "").trim()
    }))
    .filter(rec => rec.titulo);

  if (!cleaned.length) {
    throw new Error("Discover devolvió recomendaciones vacías tras limpieza");
  }

  console.log(`🔢 Recomendaciones discover: ${cleaned.length}`);

  for (const rec of cleaned) {
    const cover = await getBestCover(rec.titulo, rec.autor || "Autor desconocido");

    if (cover.source !== "none" || cover.portada) {
      console.log(`✅ Discover validó: ${rec.titulo} — ${rec.autor}`);
      return {
        titulo: rec.titulo,
        autor: rec.autor || "Autor desconocido",
        tagline: rec.tagline || "",
        portada: cover.portada || "",
        isbn: cover.isbn || "",
        editorial: cover.editorial || "",
        selected_via: "discover_trigger",
        selection_reason: rec.motivo_corto || "",
        trigger_input: trigger,
        cover_source: cover.source || "none"
      };
    }
  }

  const first = cleaned[0];
  const fallbackCover = await getBestCover(first.titulo, first.autor || "Autor desconocido");

  console.log(`↩️  Discover fallback: ${first.titulo} — ${first.autor}`);

  return {
    titulo: first.titulo,
    autor: first.autor || "Autor desconocido",
    tagline: first.tagline || "",
    portada: fallbackCover.portada || "",
    isbn: fallbackCover.isbn || "",
    editorial: fallbackCover.editorial || "",
    selected_via: "discover_trigger_fallback",
    selection_reason: first.motivo_corto || "",
    trigger_input: trigger,
    cover_source: fallbackCover.source || "none"
  };
}

/* ═══════════════════════════════════════════════════════════════
   CASCADA DE PORTADAS
   Apple Books → Google Books → Open Library → Amazon
═══════════════════════════════════════════════════════════════ */

async function searchAppleBooks(titulo, autor) {
  console.log("   🍎 Buscando en Apple Books...");
  const q = encodeURIComponent(`${titulo} ${autor}`);
  const data = await fetchJSON(`https://itunes.apple.com/search?term=${q}&entity=ebook&limit=5&country=mx`);
  if (!data?.results?.length) return null;

  for (const r of data.results) {
    let art = r.artworkUrl100;
    if (art) {
      art = art.replace("100x100", "600x600");
      if (await checkImageURL(art)) {
        console.log("   ✅ Portada encontrada en Apple Books (600×600)");
        return {
          portada: art,
          isbn: r.trackId?.toString() || "",
          editorial: r.artistName || "",
          source: "apple_books"
        };
      }
    }
  }

  return null;
}

async function searchGoogleBooks(titulo, autor) {
  console.log("   📚 Buscando en Google Books...");
  const q = encodeURIComponent(`${titulo} ${autor}`);
  let data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&langRestrict=es`);

  if (!data?.items?.length) {
    data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`);
    if (!data?.items?.length) return null;
  }

  for (const item of data.items) {
    const info = item.volumeInfo || {};
    const imgs = info.imageLinks || {};
    const url = imgs.extraLarge || imgs.large || imgs.medium || imgs.small || imgs.thumbnail;

    if (url) {
      const cleanUrl = url.replace("&edge=curl", "").replace("http://", "https://");
      if (await checkImageURL(cleanUrl)) {
        const isbn13 = (info.industryIdentifiers || []).find(i => i.type === "ISBN_13")?.identifier || "";
        const isbn10 = (info.industryIdentifiers || []).find(i => i.type === "ISBN_10")?.identifier || "";
        console.log("   ✅ Portada encontrada en Google Books");
        return {
          portada: cleanUrl,
          isbn: isbn13 || isbn10,
          editorial: info.publisher || "",
          year: info.publishedDate?.substring(0, 4) || "",
          pages: info.pageCount || 0,
          source: "google_books"
        };
      }
    }
  }

  return null;
}

async function searchOpenLibrary(titulo, autor) {
  console.log("   📖 Buscando en Open Library...");
  const q = encodeURIComponent(`${titulo} ${autor}`);
  const data = await fetchJSON(`https://openlibrary.org/search.json?q=${q}&limit=5`);
  if (!data?.docs?.length) return null;

  for (const doc of data.docs) {
    const coverId = doc.cover_i;
    if (coverId) {
      const url = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      if (await checkImageURL(url)) {
        console.log("   ✅ Portada encontrada en Open Library");
        return {
          portada: url,
          isbn: Array.isArray(doc.isbn) ? (doc.isbn[0] || "") : "",
          editorial: Array.isArray(doc.publisher) ? (doc.publisher[0] || "") : "",
          year: doc.first_publish_year || "",
          source: "open_library"
        };
      }
    }
  }

  return null;
}

async function searchAmazonFallback(_titulo, _autor) {
  console.log("   🟠 Buscando en Amazon (fallback)...");
  return null;
}

async function getBestCover(titulo, autor) {
  console.log(`🔍 Buscando portada para "${titulo}" — ${autor}`);

  const apple = await searchAppleBooks(titulo, autor);
  if (apple) return apple;

  const google = await searchGoogleBooks(titulo, autor);
  if (google) return google;

  const open = await searchOpenLibrary(titulo, autor);
  if (open) return open;

  const amazon = await searchAmazonFallback(titulo, autor);
  if (amazon) return amazon;

  return {
    portada: "",
    isbn: "",
    editorial: "",
    source: "none"
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

  if (MODE === "trigger" && SELECTOR === "constrained") {
    return await resolveConstrainedFromTrigger(ENTRADA_RAW);
  }

  if (MODE === "trigger" && SELECTOR === "discover") {
    return await resolveDiscoverFromTrigger(ENTRADA_RAW);
  }

  throw new Error(`Combinación no soportada: INPUT_MODE=${MODE} / SELECTOR_MODE=${SELECTOR}`);
}

/* ═══════════════════════════════════════════════════════════════
   EJECUCIÓN
═══════════════════════════════════════════════════════════════ */

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
  source: coverSourceFinal,
  duplicado,
  selected_via: resolved.selected_via || "unknown",
  selection_reason: resolved.selection_reason || "",
  trigger_input: resolved.trigger_input || "",
  catalog_scope: resolved.catalog_scope || "",
  contexto_2026: resolved.contexto_2026 || {}
};

await fs.writeFile("/tmp/triggui-slug.txt", slug, "utf8");
await fs.writeFile("/tmp/triggui-titulo.txt", titulo, "utf8");
await fs.writeFile("/tmp/triggui-book.json", JSON.stringify(bookData, null, 2), "utf8");

setGithubOutput("book_json", JSON.stringify(bookData));
setGithubOutput("slug", slug);
setGithubOutput("titulo", titulo);
setGithubOutput("autor", autor);
setGithubOutput("selected_via", bookData.selected_via);

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
console.log(`📄 Duplicado: ${duplicado ? "sí" : "no"}`);
console.log("══════════════════════════════════════════");
console.log("✅ Validación completa. Siguiente paso: enriquecimiento GPT-4o-mini.");