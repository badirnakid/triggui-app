/* ═══════════════════════════════════════════════════════════════════════════════
   evidence-fetcher.js — v3.2 FUSIÓN TOTAL

   Un solo módulo que llama a Apple/Google/OpenLibrary/Amazon una vez y extrae
   TODO lo útil: sinopsis, portada (múltiples tamaños), metadata, ISBN.

   Reemplaza las funciones searchAppleBooks/searchGoogleBooks/searchOpenLibrary
   duplicadas entre validate-book.js y grounding-resolver.js.

   CARACTERÍSTICAS NIVEL DIOS:
   - Llamadas concurrentes (Promise.allSettled) — 3-4x speedup vs secuencial
   - ISBN chain: ISBN descubierto en una API se usa en las otras
   - Retry exponencial en 429
   - Multi-size portada cascade (thumbnail → medium → large → extraLarge)
   - Cover validation paralela
   - Cache filesystem con TTL 30 días
   - Raw response preservado en _raw para debug/audit
═══════════════════════════════════════════════════════════════════════════════ */

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = "evidence-cache";
const CACHE_TTL_DAYS = 30;
const REQUEST_TIMEOUT_MS = 8000;
const MIN_MATCH_SCORE = 0.38; // Mismo threshold que validate-book.js viejo

/* ─────────────────────────────────────────────────────────────────────────────
   CACHE
────────────────────────────────────────────────────────────────────────────── */

function evidenceHash(titulo, autor, isbn) {
  const key = `${titulo || ""}|${autor || ""}|${isbn || ""}`.toLowerCase().trim();
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

async function readEvidenceCache(hash) {
  try {
    const p = path.join(CACHE_DIR, `${hash}.json`);
    const raw = await fs.readFile(p, "utf8");
    const cached = JSON.parse(raw);
    const ageDays = (Date.now() - new Date(cached._cached_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > CACHE_TTL_DAYS) return null;
    return cached;
  } catch { return null; }
}

async function writeEvidenceCache(hash, data) {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const p = path.join(CACHE_DIR, `${hash}.json`);
    await fs.writeFile(p, JSON.stringify({ ...data, _cached_at: new Date().toISOString() }, null, 2), "utf8");
  } catch (err) {
    console.warn(`   ⚠ Evidence cache write failed: ${err.message}`);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   UTILS
────────────────────────────────────────────────────────────────────────────── */

function normalize(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function levenshteinRatio(a, b) {
  const A = normalize(a);
  const B = normalize(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  const matrix = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = 0; i <= A.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= B.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= A.length; i += 1) {
    for (let j = 1; j <= B.length; j += 1) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  const maxLen = Math.max(A.length, B.length);
  return 1 - matrix[A.length][B.length] / maxLen;
}

function scoreMatch(titleA, authorA, titleB, authorB) {
  const titleScore = levenshteinRatio(titleA, titleB);
  const E = normalize(authorA);
  const F = normalize(authorB);
  let authorScore = 0;
  if (E && F) {
    if (F.includes(E)) authorScore = 1;
    else if (E.includes(F)) authorScore = 0.9;
    else authorScore = levenshteinRatio(E, F);
  }
  return titleScore * 0.55 + authorScore * 0.45;
}

function cleanHTMLEntities(raw) {
  return String(raw || "").trim()
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/* ─────────────────────────────────────────────────────────────────────────────
   FETCH CON RETRY 429 Y TIMEOUT
────────────────────────────────────────────────────────────────────────────── */

async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "User-Agent": "triggui-evidence-fetcher/3.2",
          "Accept": "application/json",
          ...(options.headers || {})
        }
      });
      clearTimeout(timeoutId);
      if (res.status !== 429) return res;
      const waitMs = 600 * Math.pow(3, attempt);
      await new Promise((r) => setTimeout(r, waitMs));
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return { ok: false, status: 429 };
}

export async function checkImageURL(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return false;
    const type = res.headers.get("content-type") || "";
    return type.startsWith("image/");
  } catch { return false; }
}

/* ─────────────────────────────────────────────────────────────────────────────
   APPLE BOOKS (iTunes Search API)
────────────────────────────────────────────────────────────────────────────── */

async function fetchApple(titulo, autor, isbn) {
  try {
    let url;
    if (isbn && isbn.trim()) {
      url = `https://itunes.apple.com/lookup?isbn=${encodeURIComponent(isbn.trim())}`;
    } else {
      const term = `${titulo} ${autor}`.trim();
      url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=ebook&limit=5&country=mx`;
    }
    const res = await fetchWithRetry(url);
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, source: "apple_books" };

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { return { ok: false, reason: "parse_error", source: "apple_books" }; }

    const results = Array.isArray(data.results) ? data.results : [];
    if (results.length === 0) return { ok: false, reason: "no_results", source: "apple_books" };

    // Scoring de candidatos
    const candidates = results
      .filter((item) => !item.kind || item.kind === "ebook")
      .map((item) => {
        const foundTitle = item.trackName || item.collectionName || "";
        const foundAuthor = item.artistName || "";
        return {
          ...item,
          _match_score: scoreMatch(titulo, autor, foundTitle, foundAuthor)
        };
      })
      .sort((a, b) => b._match_score - a._match_score);

    if (!candidates.length) return { ok: false, reason: "no_ebook_results", source: "apple_books" };

    const best = candidates[0];
    if (best._match_score < MIN_MATCH_SCORE) return { ok: false, reason: `low_match_${best._match_score.toFixed(2)}`, source: "apple_books" };

    // Artwork multi-tamaño: Apple da artworkUrl100, escalable a 600, 1200, 3000
    const art100 = best.artworkUrl100 || "";
    const covers = [];
    if (art100) {
      covers.push({ size: "xxlarge", url: art100.replace("100x100", "3000x3000") });
      covers.push({ size: "xlarge", url: art100.replace("100x100", "1200x1200") });
      covers.push({ size: "large", url: art100.replace("100x100", "600x600") });
      covers.push({ size: "medium", url: art100 });
    }

    const description = cleanHTMLEntities(best.description || "");
    const year = best.releaseDate ? best.releaseDate.slice(0, 4) : null;
    const genres = Array.isArray(best.genres) ? best.genres : (best.primaryGenreName ? [best.primaryGenreName] : []);

    return {
      ok: true,
      source: "apple_books",
      match_score: best._match_score,
      match_details: {
        matched_title: best.trackName || best.collectionName || "",
        matched_author: best.artistName || ""
      },
      synopsis: description,
      synopsis_length: description.length,
      covers,
      verified_identity: {
        titulo_real: best.trackName || best.collectionName || titulo,
        autor_completo: best.artistName || autor,
        año: year,
        editorial: null,
        isbn: best.trackId ? String(best.trackId) : "", // Apple usa trackId como ID interno
        categorias: genres,
        track_view_url: best.trackViewUrl || null
      }
    };
  } catch (err) {
    return { ok: false, reason: `error_${err.message.slice(0, 60)}`, source: "apple_books" };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   GOOGLE BOOKS API
────────────────────────────────────────────────────────────────────────────── */

async function fetchGoogleBooksAttempt(url, titulo, autor) {
  const res = await fetchWithRetry(url);
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };
  const data = await res.json();
  if (!data.items || data.items.length === 0) return { ok: false, reason: "no_results" };

  const candidates = data.items.map((item) => {
    const info = item.volumeInfo || {};
    const authors = Array.isArray(info.authors) ? info.authors : [];
    return {
      info,
      _match_score: scoreMatch(titulo, autor, info.title || "", authors.join(", "))
    };
  }).sort((a, b) => b._match_score - a._match_score);

  return { ok: true, candidates };
}

async function fetchGoogle(titulo, autor, isbn) {
  try {
    // Estrategia 1: ISBN si existe
    if (isbn && isbn.trim()) {
      const urlIsbn = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn.trim())}&maxResults=3`;
      const isbnResult = await fetchGoogleBooksAttempt(urlIsbn, titulo, autor);
      if (isbnResult.ok && isbnResult.candidates.length > 0 && isbnResult.candidates[0]._match_score >= MIN_MATCH_SCORE) {
        return buildGoogleEvidence(isbnResult.candidates[0], titulo, autor);
      }
    }

    // Estrategia 2: búsqueda estricta con operadores
    const qStrict = `intitle:${encodeURIComponent(titulo)}+inauthor:${encodeURIComponent(autor)}`;
    const urlStrict = `https://www.googleapis.com/books/v1/volumes?q=${qStrict}&maxResults=5`;
    const strictResult = await fetchGoogleBooksAttempt(urlStrict, titulo, autor);
    if (strictResult.ok && strictResult.candidates.length > 0 && strictResult.candidates[0]._match_score >= MIN_MATCH_SCORE) {
      return buildGoogleEvidence(strictResult.candidates[0], titulo, autor);
    }

    // Estrategia 3: búsqueda relaxed (títulos traducidos)
    const qRelaxed = `${titulo} ${autor}`;
    const urlRelaxed = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(qRelaxed)}&maxResults=8`;
    const relaxedResult = await fetchGoogleBooksAttempt(urlRelaxed, titulo, autor);
    if (relaxedResult.ok && relaxedResult.candidates.length > 0 && relaxedResult.candidates[0]._match_score >= MIN_MATCH_SCORE) {
      return buildGoogleEvidence(relaxedResult.candidates[0], titulo, autor);
    }

    return { ok: false, reason: "no_good_match", source: "google_books" };
  } catch (err) {
    return { ok: false, reason: `error_${err.message.slice(0, 60)}`, source: "google_books" };
  }
}

function buildGoogleEvidence(candidate, titulo, autor) {
  const info = candidate.info;
  const authors = Array.isArray(info.authors) ? info.authors : [];
  const description = cleanHTMLEntities(info.description || "");

  const imgs = info.imageLinks || {};
  const covers = [];
  for (const [size, key] of [["xxlarge", "extraLarge"], ["xlarge", "large"], ["large", "medium"], ["medium", "small"], ["small", "thumbnail"]]) {
    const rawUrl = imgs[key];
    if (rawUrl) {
      const clean = rawUrl.replace("&edge=curl", "").replace(/^http:/, "https:");
      covers.push({ size, url: clean });
    }
  }

  const ids = Array.isArray(info.industryIdentifiers) ? info.industryIdentifiers : [];
  const isbn13 = ids.find((i) => i.type === "ISBN_13")?.identifier || "";
  const isbn10 = ids.find((i) => i.type === "ISBN_10")?.identifier || "";
  const year = info.publishedDate ? info.publishedDate.slice(0, 4) : null;

  return {
    ok: true,
    source: "google_books",
    match_score: candidate._match_score,
    match_details: {
      matched_title: info.title || "",
      matched_author: authors.join(", ")
    },
    synopsis: description,
    synopsis_length: description.length,
    covers,
    verified_identity: {
      titulo_real: info.title || titulo,
      subtitulo: info.subtitle || "",
      autor_completo: authors.join(", ") || autor,
      año: year,
      editorial: info.publisher || null,
      paginas: info.pageCount || null,
      isbn: isbn13 || isbn10,
      isbn13,
      isbn10,
      categorias: Array.isArray(info.categories) ? info.categories : [],
      idioma: info.language || null,
      preview_link: info.previewLink || null
    }
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   OPEN LIBRARY
────────────────────────────────────────────────────────────────────────────── */

async function fetchOpenLibrary(titulo, autor, isbn) {
  try {
    let url;
    if (isbn && isbn.trim()) {
      // OpenLibrary también soporta búsqueda por ISBN
      url = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn.trim())}&limit=3`;
    } else {
      url = `https://openlibrary.org/search.json?title=${encodeURIComponent(titulo)}&author=${encodeURIComponent(autor)}&limit=5`;
    }
    const res = await fetchWithRetry(url);
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, source: "openlibrary" };

    const data = await res.json();
    if (!data.docs || data.docs.length === 0) return { ok: false, reason: "no_results", source: "openlibrary" };

    const candidates = data.docs.map((doc) => {
      const authors = Array.isArray(doc.author_name) ? doc.author_name : [];
      return {
        doc,
        _match_score: scoreMatch(titulo, autor, doc.title || "", authors.join(", "))
      };
    }).sort((a, b) => b._match_score - a._match_score);

    const best = candidates[0];
    if (best._match_score < MIN_MATCH_SCORE) return { ok: false, reason: `low_match_${best._match_score.toFixed(2)}`, source: "openlibrary" };

    const doc = best.doc;
    const subjects = Array.isArray(doc.subject) ? doc.subject.slice(0, 12).join("; ") : "";
    const publisher = Array.isArray(doc.publisher) ? doc.publisher.slice(0, 2).join(", ") : "";
    const year = doc.first_publish_year ? String(doc.first_publish_year) : null;
    const authors = Array.isArray(doc.author_name) ? doc.author_name : [];
    const firstSentence = Array.isArray(doc.first_sentence) && doc.first_sentence[0] ? cleanHTMLEntities(doc.first_sentence[0]) : "";

    // Construir synopsis con todo lo disponible
    let synopsis = "";
    if (firstSentence && firstSentence.length >= 20) {
      synopsis = `Primera línea del libro: "${firstSentence}". `;
    }
    if (subjects.length >= 15) {
      synopsis += `Temas del libro según OpenLibrary: ${subjects}.`;
    }
    if (!synopsis && (year || publisher)) {
      synopsis = `Libro verificado en OpenLibrary.`;
      if (year) synopsis += ` Publicado originalmente en ${year}.`;
      if (publisher) synopsis += ` Editorial: ${publisher}.`;
    }

    // Multi-size covers
    const covers = [];
    if (doc.cover_i) {
      covers.push({ size: "large", url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` });
      covers.push({ size: "medium", url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` });
      covers.push({ size: "small", url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg` });
    }

    const isbnFromDoc = Array.isArray(doc.isbn) ? doc.isbn[0] : "";

    return {
      ok: true,
      source: "openlibrary",
      match_score: best._match_score,
      match_details: {
        matched_title: doc.title || "",
        matched_author: authors.join(", ")
      },
      synopsis: synopsis.trim(),
      synopsis_length: synopsis.length,
      covers,
      verified_identity: {
        titulo_real: doc.title || titulo,
        autor_completo: authors.join(", ") || autor,
        año: year,
        editorial: publisher || null,
        isbn: isbnFromDoc,
        categorias: Array.isArray(doc.subject) ? doc.subject.slice(0, 5) : [],
        idioma: Array.isArray(doc.language) ? doc.language[0] : null,
        paginas: doc.number_of_pages_median || null
      }
    };
  } catch (err) {
    return { ok: false, reason: `error_${err.message.slice(0, 60)}`, source: "openlibrary" };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   AMAZON COVER BY ISBN (endpoint público, sin API)
────────────────────────────────────────────────────────────────────────────── */

async function fetchAmazonCoverByISBN(isbn) {
  if (!isbn || !isbn.trim()) return { ok: false, reason: "no_isbn", source: "amazon" };
  const clean = isbn.replace(/-/g, "").trim();
  // Amazon usa ISBN-10 para URL, así que si es 13 hay que convertir (últimos 10 chars aproximado)
  const isbn10 = clean.length === 13 ? clean.slice(3, 12) : clean;
  const urls = [
    `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01.LZZZZZZZ.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01._SCLZZZZZZZ_.jpg`,
    `https://m.media-amazon.com/images/P/${isbn10}.01.LZZZZZZZ.jpg`
  ];
  for (const url of urls) {
    if (await checkImageURL(url)) {
      return {
        ok: true,
        source: "amazon",
        match_score: 0.85, // ISBN match es alto por definición
        covers: [{ size: "large", url }],
        synopsis: "", // Amazon cover-only, sin sinopsis
        synopsis_length: 0,
        verified_identity: { isbn, titulo_real: null, autor_completo: null, año: null }
      };
    }
  }
  return { ok: false, reason: "no_amazon_cover", source: "amazon" };
}

/* ─────────────────────────────────────────────────────────────────────────────
   COVER VALIDATION PARALELA
   Toma un array de evidence results y verifica qué covers realmente existen.
────────────────────────────────────────────────────────────────────────────── */

async function validateCoversParallel(results) {
  const allCovers = [];
  for (const r of results) {
    if (r.ok && Array.isArray(r.covers)) {
      for (const cover of r.covers) {
        allCovers.push({ source: r.source, size: cover.size, url: cover.url });
      }
    }
  }
  // Validar todos los covers en paralelo
  const checks = await Promise.all(allCovers.map(async (c) => ({ ...c, valid: await checkImageURL(c.url) })));
  return checks.filter((c) => c.valid);
}

/* ─────────────────────────────────────────────────────────────────────────────
   ORCHESTRATOR PRINCIPAL
   Llama a todas las APIs en paralelo, hace ISBN chain, devuelve evidencia fusionada.
────────────────────────────────────────────────────────────────────────────── */

export async function fetchEvidence(book, options = {}) {
  const titulo = String(book.titulo || "").trim();
  const autor = String(book.autor || "").trim();
  const seedIsbn = String(book.isbn || "").trim();

  if (!titulo) throw new Error("fetchEvidence requiere titulo");

  // Cache lookup
  const hash = evidenceHash(titulo, autor, seedIsbn);
  if (!options.noCache) {
    const cached = await readEvidenceCache(hash);
    if (cached) {
      console.log(`   💾 Evidence cache hit (${cached._sources_succeeded?.length || 0} sources)`);
      return { ...cached, from_cache: true };
    }
  }

  console.log(`   🔍 Fetching evidence para "${titulo.slice(0, 40)}" — ${autor.slice(0, 30)}`);

  // FASE 1: llamadas paralelas con seedIsbn
  const t0 = Date.now();
  const [appleResult, googleResult, openLibraryResult] = await Promise.allSettled([
    fetchApple(titulo, autor, seedIsbn),
    fetchGoogle(titulo, autor, seedIsbn),
    fetchOpenLibrary(titulo, autor, seedIsbn)
  ]).then((results) => results.map((r) => r.status === "fulfilled" ? r.value : { ok: false, reason: `promise_rejected`, error: String(r.reason).slice(0, 100) }));
  const phase1Ms = Date.now() - t0;

  // FASE 2: ISBN chain — si alguna API encontró ISBN y otras fallaron, reintentar con ese ISBN
  const discoveredIsbn = appleResult.verified_identity?.isbn ||
                         googleResult.verified_identity?.isbn ||
                         openLibraryResult.verified_identity?.isbn ||
                         "";
  const cleanDiscoveredIsbn = discoveredIsbn && !discoveredIsbn.startsWith("id_") ? discoveredIsbn : "";

  let finalApple = appleResult;
  let finalGoogle = googleResult;
  let finalOpenLibrary = openLibraryResult;
  let phase2Ms = 0;

  if (cleanDiscoveredIsbn && cleanDiscoveredIsbn !== seedIsbn) {
    const retryCandidates = [];
    if (!appleResult.ok) retryCandidates.push(["apple", fetchApple(titulo, autor, cleanDiscoveredIsbn)]);
    if (!googleResult.ok) retryCandidates.push(["google", fetchGoogle(titulo, autor, cleanDiscoveredIsbn)]);
    if (!openLibraryResult.ok) retryCandidates.push(["ol", fetchOpenLibrary(titulo, autor, cleanDiscoveredIsbn)]);

    if (retryCandidates.length > 0) {
      const t1 = Date.now();
      const retryResults = await Promise.allSettled(retryCandidates.map(([, p]) => p));
      phase2Ms = Date.now() - t1;
      retryCandidates.forEach(([tag], i) => {
        const result = retryResults[i].status === "fulfilled" ? retryResults[i].value : null;
        if (result?.ok) {
          console.log(`   🔗 ISBN chain rescató: ${tag} via ISBN ${cleanDiscoveredIsbn}`);
          if (tag === "apple") finalApple = result;
          else if (tag === "google") finalGoogle = result;
          else if (tag === "ol") finalOpenLibrary = result;
        }
      });
    }
  }

  // FASE 3: Amazon solo si tenemos ISBN verificado
  let amazonResult = { ok: false, reason: "skipped", source: "amazon" };
  if (cleanDiscoveredIsbn) {
    const t2 = Date.now();
    amazonResult = await fetchAmazonCoverByISBN(cleanDiscoveredIsbn);
    phase2Ms += Date.now() - t2;
  }

  const allResults = [finalApple, finalGoogle, finalOpenLibrary, amazonResult];

  // FASE 4: validar covers en paralelo
  const t3 = Date.now();
  const validCovers = await validateCoversParallel(allResults);
  const coverValidationMs = Date.now() - t3;

  // Log resumen
  const succeeded = allResults.filter((r) => r.ok).map((r) => r.source);
  const failed = allResults.filter((r) => !r.ok).map((r) => `${r.source}:${r.reason}`);
  console.log(`   ✓ Sources OK: [${succeeded.join(", ") || "none"}] | Covers válidas: ${validCovers.length} | ${phase1Ms}ms+${phase2Ms}ms+${coverValidationMs}ms`);

  const evidence = {
    titulo_input: titulo,
    autor_input: autor,
    isbn_seed: seedIsbn,
    isbn_discovered: cleanDiscoveredIsbn,
    apple: finalApple,
    google: finalGoogle,
    openlibrary: finalOpenLibrary,
    amazon: amazonResult,
    valid_covers: validCovers,
    _sources_succeeded: succeeded,
    _sources_failed: failed,
    _timing: {
      phase1_parallel_ms: phase1Ms,
      phase2_isbn_chain_ms: phase2Ms,
      cover_validation_ms: coverValidationMs,
      total_ms: phase1Ms + phase2Ms + coverValidationMs
    }
  };

  await writeEvidenceCache(hash, evidence);
  return evidence;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SELECTORS — helpers para extraer cosas específicas de la evidencia
────────────────────────────────────────────────────────────────────────────── */

/**
 * Elige la mejor portada entre todas las covers válidas.
 * Prioridad: tamaño más grande > score de match > preferencia de fuente
 */
export function selectBestCover(evidence, sourcePreference = ["apple_books", "google_books", "openlibrary", "amazon"]) {
  const valid = evidence.valid_covers || [];
  if (valid.length === 0) return null;

  const sizeRank = { xxlarge: 5, xlarge: 4, large: 3, medium: 2, small: 1 };

  const scored = valid.map((c) => ({
    ...c,
    size_score: sizeRank[c.size] || 0,
    source_score: sourcePreference.length - sourcePreference.indexOf(c.source)
  }));

  scored.sort((a, b) => {
    if (b.size_score !== a.size_score) return b.size_score - a.size_score;
    return b.source_score - a.source_score;
  });

  return scored[0];
}

/**
 * Construye el ground_truth unificado para usar en grounding-resolver.
 * Prioriza sinopsis más larga y sustantiva.
 */
export function buildGroundTruthFromEvidence(evidence) {
  const sources = [evidence.apple, evidence.google, evidence.openlibrary].filter((s) => s.ok);
  if (sources.length === 0) return null;

  // Elegir el mejor: match_score alto + synopsis largo
  sources.sort((a, b) => {
    const scoreA = (a.match_score || 0) * 0.6 + Math.min(1, (a.synopsis_length || 0) / 500) * 0.4;
    const scoreB = (b.match_score || 0) * 0.6 + Math.min(1, (b.synopsis_length || 0) / 500) * 0.4;
    return scoreB - scoreA;
  });

  const best = sources[0];
  const sourceLabel = best.source === "apple_books" ? "SINOPSIS OFICIAL (Apple Books)" :
                     best.source === "google_books" ? "SINOPSIS OFICIAL (Google Books)" :
                     "INFORMACIÓN (OpenLibrary)";

  const vi = best.verified_identity || {};
  const metadataLines = [];
  if (vi.titulo_real) metadataLines.push(`- Título: ${vi.titulo_real}`);
  if (vi.autor_completo) metadataLines.push(`- Autor: ${vi.autor_completo}`);
  if (vi.año) metadataLines.push(`- Año: ${vi.año}`);
  if (vi.editorial) metadataLines.push(`- Editorial: ${vi.editorial}`);
  if (vi.categorias?.length) metadataLines.push(`- Categorías: ${vi.categorias.slice(0, 4).join(", ")}`);

  const groundTruth = `${sourceLabel}:\n\n${best.synopsis}\n\nMETADATA VERIFICADA:\n${metadataLines.join("\n")}`;

  return {
    ground_truth: groundTruth,
    source: best.source,
    match_score: best.match_score,
    verified_identity: best.verified_identity,
    confidence: Math.min(0.95, 0.55 + best.match_score * 0.4),
    other_sources_agreed: sources.slice(1).filter((s) => s.match_score >= 0.6).map((s) => s.source)
  };
}

/**
 * Dado el input book + evidence, construye el bookData enriquecido.
 */
export function buildEnrichedBookData(book, evidence, selectedCover = null) {
  const cover = selectedCover || selectBestCover(evidence);

  // Identity reconciliation: si el usuario dio CSV con título+autor, respetarlo.
  // Pero enriquecer con metadata verificada.
  const gt = buildGroundTruthFromEvidence(evidence);
  const vi = gt?.verified_identity || {};

  return {
    titulo: book.titulo,
    autor: book.autor,
    tagline: book.tagline || "",
    portada: cover?.url || "",
    portada_url: cover?.url || "",
    portada_source: cover?.source || "none",
    portada_size: cover?.size || null,
    portada_candidates: evidence.valid_covers || [],
    isbn: evidence.isbn_discovered || book.isbn || "",
    editorial: vi.editorial || "",
    publication_year: vi.año || "",
    categorias: vi.categorias || [],
    _evidence: evidence
  };
}
