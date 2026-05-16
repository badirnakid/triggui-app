/* ═══════════════════════════════════════════════════════════════════════════════
   evidence-fetcher.js — v3.7 NIVEL DIOS QUARK MATEMÁTICO CUÁNTICO

   v3.7 (2026-05-14): VARIANTES + GOOGLE API KEY + STOPWORDS + OPENLIB ISBN
   ─────────────────────────────────────────────────────────────────────────────
   Cirugías aplicadas sobre v3.6 (cero remiendos, todo aditivo):

   1. GOOGLE_BOOKS_API_KEY desde process.env (Secret en GitHub Actions de
      triggui-app). Quota 1M/día. Antes: anónimo 1k/día → HTTP 429 al saturar.
   2. STOPWORDS ES + EN y helper sigWords() — previenen falsos matches en
      títulos largos (palabras como "de", "la", "the" inflaban el score).
   3. KNOWN_ORIGINAL_TITLES: mapping clásicos traducidos para que Apple/Google/
      OpenLibrary los encuentren cuando solo indexan el original inglés
      (ej. "La telaraña de Carlota" → "Charlotte's Web").
   4. generateTitleVariants(): genera v1 original / v2 sin subtítulo /
      v2b sin frase final / v3 primeras 4 palabras / v4 título inglés.
   5. fetchApple / fetchGoogle / fetchOpenLibrary iteran sobre variantes hasta
      encontrar match >= MIN_MATCH_SCORE. Antes solo probaban v1 literal y
      perdían libros con subtítulos largos (Slim, Play Nice But Win, Gracias).
   6. fetchOpenLibraryByISBN: cover directo por ISBN como capa extra después
      del ISBN chain. Validada empíricamente: 65KB de cover real para 978-X.
   7. Orquestador marca _status: "EXHAUSTED" cuando validCovers.length === 0,
      permitiendo a build-contenido emitir warning ruidoso en lugar de caer a
      SVG fallback silencioso.
   8. selectBestCover incluye "openlib_isbn" en sourcePreference con ranking
      correcto (después de OpenLib search por calidad típica).

   v3.6 (2026-04-26): FIX PORTADA FANTASMA
   ─────────────────────────────────────────────────────────────────────────────
   Bugs corregidos sobre v3.2:

   BUG A — Apple `trackId` se guardaba como ISBN
     Antes: isbn: best.trackId ? String(best.trackId) : ""
     Causa: Apple devuelve trackId interno (ej. "991831052"), NO un ISBN real.
     Esto contaminaba toda la cadena: Amazon recibía un "ISBN" inválido y
     devolvía placeholder GIF.
     Fix v3.6: NO guardar trackId como isbn. Preservar en apple_track_id
     para auditoría. ISBN solo si Apple devuelve uno verdadero (raro).

   BUG B — checkImageURL no validaba tamaño real
     Antes: solo content-type startsWith "image/"
     Causa: Amazon devuelve GIF placeholder de 43 bytes con content-type
     image/gif para cualquier ID inválido. Eso pasaba el filtro como
     "imagen válida".
     Fix v3.6: validar content-length >= 2000 bytes. Cualquier portada
     real pesa >2KB. GIF placeholders pesan <500 bytes.

   BUG C (parcial) — Conversión ISBN13→ISBN10 matemáticamente incorrecta
     Antes: isbn13.slice(3, 12)  // 9 chars, no 10
     Causa: ISBN-10 son 10 caracteres. La conversión real requiere
     recalcular el dígito verificador con módulo 11 sobre los primeros
     9 dígitos del cuerpo.
     Fix v3.6: implementar convertIsbn13ToIsbn10() correcto. Validar que
     ISBN sea exactamente 10 o 13 dígitos numéricos antes de usar.

   Lo NO tocado:
   - Estructura del cache filesystem
   - Format de evidence retornado (compatibilidad total con validate-book v3.4)
   - Llamadas Apple/Google/OpenLibrary (solo cambia 1 línea en Apple)
   - Algoritmo de match scoring
   - selectBestCover, buildGroundTruthFromEvidence, buildEnrichedBookData
═══════════════════════════════════════════════════════════════════════════════ */

import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = "evidence-cache";
const CACHE_TTL_DAYS = 30;
const REQUEST_TIMEOUT_MS = 8000;
const MIN_MATCH_SCORE = 0.55;
// 🌒 V28 NIVEL DIOS CUÁNTICO-QUARK — Title Similarity Gate
// Threshold mínimo para aceptar cover de _low_match_covers en Fase 4.5.
// Sin esto, "Shrek Para Siempre" + DreamWorks Press matchea con cualquier
// ensayo académico que tenga "Shrek" en el título. Score 0.50 es balanceado:
// rechaza ensayos completamente distintos pero acepta variantes de título
// del mismo libro (ej: "Peppa Pig en la Granja" vs "Peppa Pig at the Farm").
const MIN_TITLE_SIMILARITY = 0.50;  // 🌒 v3.7 NIVEL DIOS: era 0.38, subido para eliminar falsos positivos por solo coincidencia de autor

// v3.7: Google Books API key desde Secret en GitHub Actions de triggui-app.
// Si está definida, las queries usan quota 1M/día. Si no, anónimo 1k/día → 429.
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || "";

// v3.6: tamaño mínimo de imagen para considerarla "real" (no placeholder).
// Amazon devuelve GIFs de 43 bytes para ISBNs inválidos. Cualquier portada
// de libro pesa >5KB típicamente. 2KB es un margen seguro que descarta
// placeholders sin falsos positivos.
const MIN_IMAGE_SIZE_BYTES = 2000;

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

// v3.7: stopwords ES + EN para filtrar palabras vacías en matching de títulos.
// Sin esto, palabras como "de" / "la" / "the" inflan scores de falsos positivos.
const STOPWORDS = new Set([
  "el","la","los","las","un","una","unos","unas","de","del","en","con","por",
  "para","tu","su","mi","y","o","u","que","se","es","al","lo","ser","ya","no",
  "sus","como","mas","muy","sin","sobre","entre","cuando","si","este","esta",
  "esto","estos","estas","esa","eso","esas","esos",
  "the","a","an","of","in","on","at","to","for","with","by","from","and",
  "or","but","is","are","be","been","being","this","that","these","those",
  "as","it","its","jr","sr"
]);

// v3.7: extrae palabras significativas. Filtra stopwords + palabras 1-2 chars.
function sigWords(s) {
  return normalize(s).split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w));
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

// 🌒 V28 NIVEL DIOS — Title-only similarity para Fase 4.5 low_match gate.
// Wrapper minimalista sobre levenshteinRatio + normalize. Calcula similitud
// entre dos títulos SIN considerar autores. Usado para validar que un cover
// de _low_match_covers realmente corresponde al libro original (no a otro
// libro popular que comparte palabras clave en el título).
function titleSimilarity(titleA, titleB) {
  if (!titleA || !titleB) return 0;
  const a = normalize(titleA);
  const b = normalize(titleB);
  if (!a || !b) return 0;
  return levenshteinRatio(a, b);
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

  // 🌒 v3.7 NIVEL DIOS — PROTECCIÓN ANTI-BAIT:
  // Si los títulos son muy diferentes (titleScore < 0.4), el match es esencialmente
  // inválido sin importar cuán perfecto sea el autor. Esto evita falsos positivos
  // catastróficos cuando un autor con varios libros famosos (Robin Sharma, Carmine
  // Gallo, Daniel Goleman) devuelve un libro DISTINTO del solicitado.
  // Ej: "Audaz productivo y feliz" — Sharma → API devuelve "The 5 AM Club" — Sharma
  // Capa el score al titleScore para que NO supere thresholds aguas abajo.
  if (titleScore < 0.4) {
    return Math.min(titleScore * 0.55 + authorScore * 0.45, titleScore);
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
   v3.7 — VARIANTES DE TÍTULO + MAPPING CLÁSICOS TRADUCIDOS
────────────────────────────────────────────────────────────────────────────── */

/**
 * Mapping de títulos en español → título original en inglés.
 * Útil para clásicos kids cuyo CSV tiene la traducción ES pero las APIs
 * (Apple / Google / OpenLibrary) los indexan solo en el idioma original.
 *
 * Keys deben pasarse por normalize() — minúsculas sin acentos.
 * Mantener corto y curado: solo casos validados empíricamente.
 */
const KNOWN_ORIGINAL_TITLES = {
  "la pequena casa en la pradera": "Little House on the Prairie",
  "la sastreria de gloucester": "The Tailor of Gloucester",
  "la telarana de carlota": "Charlotte's Web",
  "la casa del arbol el valle de los dinosaurios": "Magic Tree House Dinosaurs",
  "pequeno libro de instrucciones para la vida": "Life's Little Instruction Book"
};

/**
 * v3.7 — generateTitleVariants(titulo)
 *
 * Devuelve array de variantes ordenadas de más específica a más amplia:
 *
 *   v1_original          — título completo del CSV
 *   v2_sin_subtitulo     — corte en : ( — – (subtítulos editoriales)
 *   v2b_sin_frase_final  — corte en . seguido de espacio + letra
 *   v3_primeras_4        — primeras 4 palabras (catch-all títulos eternos)
 *   v4_titulo_ingles     — si normalize(titulo) está en KNOWN_ORIGINAL_TITLES
 *
 * Sin duplicados. Mínimo 4 chars cada variante.
 * Casos edge: titulo vacío → []. titulo < 4 chars → [v1_original solo].
 */
function generateTitleVariants(titulo) {
  const t = String(titulo || "").trim();
  if (!t) return [];
  if (t.length < 4) return [{ name: "v1_original", q: t }];

  const variants = [{ name: "v1_original", q: t }];

  // v2: sin subtítulo (corte en : ( — –)
  const cutMatch = t.match(/^(.+?)\s*[:(—–]/);
  if (cutMatch && cutMatch[1] !== t && cutMatch[1].length >= 4) {
    const cut = cutMatch[1].trim();
    if (!variants.some((v) => v.q === cut)) {
      variants.push({ name: "v2_sin_subtitulo", q: cut });
    }
  }

  // v2b: sin frase final (corte en . seguido de espacio + letra)
  const dotMatch = t.match(/^(.+?)\.\s+\w/);
  if (dotMatch && dotMatch[1].length >= 4) {
    const cut = dotMatch[1].trim();
    if (!variants.some((v) => v.q === cut)) {
      variants.push({ name: "v2b_sin_frase_final", q: cut });
    }
  }

  // v3: primeras 4 palabras
  const words = t.split(/\s+/);
  if (words.length > 4) {
    const short = words.slice(0, 4).join(" ");
    if (!variants.some((v) => v.q === short)) {
      variants.push({ name: "v3_primeras_4", q: short });
    }
  }

  // v4: título original inglés (si está en el mapping)
  const eng = KNOWN_ORIGINAL_TITLES[normalize(t)];
  if (eng && !variants.some((v) => v.q === eng)) {
    variants.push({ name: "v4_titulo_ingles", q: eng });
  }

  return variants;
}

/* ─────────────────────────────────────────────────────────────────────────────
   v3.6 — ISBN VALIDATION + CONVERSIÓN ISBN13→ISBN10 CORRECTA
────────────────────────────────────────────────────────────────────────────── */

/**
 * Valida que un string sea un ISBN-10 o ISBN-13 con formato correcto.
 * NO valida el dígito verificador (eso requeriría ser estricto y
 * algunos ISBNs viejos vienen mal formateados pero existen). Solo
 * valida que sea exactamente 10 o 13 dígitos numéricos.
 *
 * v3.6: agregada para cortar la cadena de IDs falsos (trackId Apple,
 * IDs internos de tiendas) que se colaban como "ISBN" antes.
 */
function isValidIsbnFormat(isbn) {
  if (!isbn || typeof isbn !== "string") return false;
  const clean = isbn.replace(/[-\s]/g, "").trim();
  return /^[0-9]{10}$/.test(clean) || /^[0-9]{13}$/.test(clean) || /^[0-9]{9}[0-9X]$/.test(clean);
}

/**
 * Conversión ISBN-13 → ISBN-10 con algoritmo correcto.
 *
 * Solo es posible cuando el ISBN-13 empieza con "978" (rango compatible
 * con ISBN-10). Los que empiezan con "979" no tienen equivalente ISBN-10
 * y deben usar otra estrategia.
 *
 * Algoritmo:
 *   1. Tomar los 9 dígitos del cuerpo (chars 3-11 del ISBN-13)
 *   2. Calcular dígito verificador con módulo 11:
 *      sum = sum(digit_i * (10 - i)) for i in 0..8
 *      check = (11 - (sum % 11)) % 11
 *      si check === 10 → "X"
 *      si no → str(check)
 *   3. Concatenar cuerpo + check
 *
 * v3.6: antes era isbn13.slice(3, 12) que devolvía 9 chars (incorrecto).
 */
function convertIsbn13ToIsbn10(isbn13) {
  if (!isbn13 || typeof isbn13 !== "string") return null;
  const clean = isbn13.replace(/[-\s]/g, "").trim();
  if (!/^[0-9]{13}$/.test(clean)) return null;
  if (!clean.startsWith("978")) return null; // Solo 978 tiene equivalente ISBN-10

  const body = clean.slice(3, 12); // 9 dígitos
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += (10 - i) * Number(body[i]);
  }
  const checkValue = (11 - (sum % 11)) % 11;
  const checkChar = checkValue === 10 ? "X" : String(checkValue);
  return body + checkChar;
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
          "User-Agent": "triggui-evidence-fetcher/3.6",
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

/**
 * v3.6 — checkImageURL NIVEL DIOS
 *
 * Antes solo validaba content-type. Eso permitía que Amazon GIF placeholder
 * de 43 bytes pasara como "imagen válida".
 *
 * Ahora valida 3 cosas en cascada (HEAD request, sin descargar el archivo):
 *   1. HTTP 200 OK
 *   2. content-type empieza con "image/"
 *   3. content-length >= MIN_IMAGE_SIZE_BYTES (2000 bytes)
 *
 * Si content-length no viene en headers (algunos CDN lo omiten), fallback:
 *   hace un GET con range bytes=0-2047 y mide tamaño real recibido.
 *
 * Esto descarta:
 *   - Amazon GIF placeholder de 43 bytes (no llega a 2KB)
 *   - PNG transparentes 1x1 de OpenLibrary cuando un libro no tiene cover
 *   - SVGs vacíos
 *
 * Y acepta:
 *   - Apple xxlarge 3000x3000 (típicamente >100KB)
 *   - Google extraLarge (típicamente >50KB)
 *   - OpenLibrary -L.jpg (típicamente >20KB)
 *   - Amazon LZZZZZZZ real (típicamente >30KB)
 */
export async function checkImageURL(url) {
  if (!url || typeof url !== "string") return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return false;

    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return false;

    // v3.6: validación de tamaño
    const contentLengthHeader = res.headers.get("content-length");
    const contentLength = Number(contentLengthHeader || 0);

    if (contentLength > 0) {
      // Header presente: validar directamente
      return contentLength >= MIN_IMAGE_SIZE_BYTES;
    }

    // Header ausente: fallback con range request
    // Algunos CDNs (especialmente CloudFront) omiten content-length en HEAD.
    // Pedimos primeros 2KB y vemos cuánto realmente devuelve.
    return await checkImageURLByRange(url);
  } catch {
    return false;
  }
}

/**
 * Fallback de checkImageURL cuando content-length no viene en HEAD.
 * Hace un GET con Range bytes=0-2047 y mide bytes reales recibidos.
 * Si recibe los 2048 bytes pedidos completos, asume imagen real.
 * Si recibe menos (placeholder pequeño), rechaza.
 */
async function checkImageURLByRange(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: "GET",
      headers: { "Range": `bytes=0-${MIN_IMAGE_SIZE_BYTES - 1}` },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok && res.status !== 206) return false;

    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return false;

    // Leer el cuerpo completo del range request y medir
    const buf = await res.arrayBuffer();
    return buf.byteLength >= MIN_IMAGE_SIZE_BYTES;
  } catch {
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   APPLE BOOKS (iTunes Search API)
────────────────────────────────────────────────────────────────────────────── */

// v3.7: Orquestador Apple — ISBN primero (si válido), después itera variantes.
// titulo y autor son SAGRADOS del CSV (se preservan en verified_identity).
async function fetchApple(titulo, autor, isbn) {
  if (isbn && isValidIsbnFormat(isbn)) {
    const r = await fetchAppleAttempt(titulo, autor, { isbn });
    if (r.ok) return r;
  }

  const variants = generateTitleVariants(titulo);
  let lastFail = { ok: false, reason: "no_variants_tried", source: "apple_books" };
  for (const v of variants) {
    const r = await fetchAppleAttempt(titulo, autor, { query: v.q, variantName: v.name });
    if (r.ok) return r;
    lastFail = r;
  }
  return lastFail;
}

async function fetchAppleAttempt(titulo, autor, options = {}) {
  try {
    let url;
    // v3.6 + v3.7: ISBN si tiene formato válido. Si no, usa options.query (variante)
    // o titulo (sagrado original) como query default.
    if (options.isbn && isValidIsbnFormat(options.isbn)) {
      url = `https://itunes.apple.com/lookup?isbn=${encodeURIComponent(options.isbn.trim())}`;
    } else {
      const searchTitle = options.query || titulo;
      const term = `${searchTitle} ${autor}`.trim();
      url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=ebook&limit=5&country=mx`;
    }
    const res = await fetchWithRetry(url);
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, source: "apple_books" };

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { return { ok: false, reason: "parse_error", source: "apple_books" }; }

    const results = Array.isArray(data.results) ? data.results : [];
    if (results.length === 0) return { ok: false, reason: "no_results", source: "apple_books" };

    // v3.7: scoring contra la VARIANTE buscada (no el título sagrado original),
    // porque la API indexa solo metadatos de la edición. Sagrado se preserva en
    // verified_identity.titulo_real intacto.
    const scoringTitle = options.query || titulo;
    const candidates = results
      .filter((item) => !item.kind || item.kind === "ebook")
      .map((item) => {
        const foundTitle = item.trackName || item.collectionName || "";
        const foundAuthor = item.artistName || "";
        return {
          ...item,
          _match_score: scoreMatch(scoringTitle, autor, foundTitle, foundAuthor)
        };
      })
      .sort((a, b) => b._match_score - a._match_score);

    if (!candidates.length) return { ok: false, reason: "no_ebook_results", source: "apple_books" };

    const best = candidates[0];
    if (best._match_score < MIN_MATCH_SCORE) {
      // 🌒 V27a NIVEL DIOS — preservar covers como fallback si nada mejor existe
      // Útil para libros con autor genérico ("Disney Books", "Marvel Press", etc)
      // donde la portada SÍ existe pero el autor exacto no matchea
      const art100LM = best.artworkUrl100 || "";
      const lowMatchCovers = art100LM ? [
        { size: "xxlarge", url: art100LM.replace("100x100", "3000x3000") },
        { size: "xlarge", url: art100LM.replace("100x100", "1200x1200") },
        { size: "large", url: art100LM.replace("100x100", "600x600") },
        { size: "medium", url: art100LM }
      ] : [];
      return {
        ok: false,
        reason: `low_match_${best._match_score.toFixed(2)}`,
        source: "apple_books",
        _low_match_covers: lowMatchCovers,
        _low_match_score: best._match_score,
        _low_match_title: best.trackName || best.collectionName || "",
        _low_match_author: best.artistName || ""
      };
    }

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

    // v3.6 BUG A FIX: Apple's trackId NO es ISBN — es un ID interno de iTunes.
    // Antes: isbn: best.trackId ? String(best.trackId) : ""
    // Ahora: isbn = "" siempre (Apple no expone ISBN real en su Search API).
    // El trackId se preserva separadamente para auditoría.
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
        titulo_real: titulo,                                       // 🌒 v3.7 NIVEL DIOS: SAGRADO del CSV
        autor_completo: autor,                                     // 🌒 v3.7 NIVEL DIOS: SAGRADO del CSV
        titulo_api: best.trackName || best.collectionName || "",   // 🌒 v3.7: referencia solo (no reemplaza)
        autor_api: best.artistName || "",                          // 🌒 v3.7: referencia solo (no reemplaza)
        año: year,
        editorial: null,
        isbn: "", // v3.6: NUNCA usar trackId como ISBN
        apple_track_id: best.trackId ? String(best.trackId) : "", // Preservado para auditoría
        categorias: genres,
        track_view_url: best.trackViewUrl || null
      },
      _variant_used: options.variantName || null
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
    // v3.7: API key desde Secret. Quota 1M/día. Sin key: anónimo 1k/día → 429.
    const keyParam = GOOGLE_BOOKS_API_KEY ? `&key=${encodeURIComponent(GOOGLE_BOOKS_API_KEY)}` : "";

    // 🌒 V27b NIVEL DIOS — tracking del mejor candidato low_match cross-attempts
    // para preservar covers cuando ningún attempt pasa MIN_MATCH_SCORE.
    // Util para libros con autor genérico (Disney Books, Marvel Press, etc.)
    let bestLowMatchG = null;
    const trackLowMatchG = (result) => {
      if (result && result.ok && Array.isArray(result.candidates) && result.candidates.length > 0) {
        const top = result.candidates[0];
        if (top._match_score < MIN_MATCH_SCORE && (!bestLowMatchG || top._match_score > bestLowMatchG._match_score)) {
          bestLowMatchG = top;
        }
      }
    };

    // 1. ISBN primero si tiene formato válido (v3.6)
    if (isbn && isValidIsbnFormat(isbn)) {
      const urlIsbn = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn.trim())}&maxResults=3${keyParam}`;
      const isbnResult = await fetchGoogleBooksAttempt(urlIsbn, titulo, autor);
      if (isbnResult.ok && isbnResult.candidates.length > 0 && isbnResult.candidates[0]._match_score >= MIN_MATCH_SCORE) {
        return buildGoogleEvidence(isbnResult.candidates[0], titulo, autor);
      }
      trackLowMatchG(isbnResult);  // 🌒 V27b
    }

    // 2. v3.7: iterar variantes, cada una × estrategia (strict, relaxed).
    // Las APIs casi nunca indexan subtítulos editoriales — las variantes
    // (sin subtítulo, título inglés, primeras-4) son críticas para Slim,
    // Master Coach, La telaraña de Carlota, Gracias, Play Nice But Win.
    const variants = generateTitleVariants(titulo);
    for (const v of variants) {
      const scoringTitle = v.q;

      // strict: operadores intitle + inauthor
      const qStrict = `intitle:${encodeURIComponent(v.q)}+inauthor:${encodeURIComponent(autor)}`;
      const urlStrict = `https://www.googleapis.com/books/v1/volumes?q=${qStrict}&maxResults=5${keyParam}`;
      const strictResult = await fetchGoogleBooksAttempt(urlStrict, scoringTitle, autor);
      if (strictResult.ok && strictResult.candidates.length > 0 && strictResult.candidates[0]._match_score >= MIN_MATCH_SCORE) {
        const ev = buildGoogleEvidence(strictResult.candidates[0], titulo, autor);
        return { ...ev, _variant_used: v.name, _query_mode: "strict" };
      }
      trackLowMatchG(strictResult);  // 🌒 V27b

      // relaxed: sin operadores (catch-all)
      const qRelaxed = `${v.q} ${autor}`;
      const urlRelaxed = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(qRelaxed)}&maxResults=8${keyParam}`;
      const relaxedResult = await fetchGoogleBooksAttempt(urlRelaxed, scoringTitle, autor);
      if (relaxedResult.ok && relaxedResult.candidates.length > 0 && relaxedResult.candidates[0]._match_score >= MIN_MATCH_SCORE) {
        const ev = buildGoogleEvidence(relaxedResult.candidates[0], titulo, autor);
        return { ...ev, _variant_used: v.name, _query_mode: "relaxed" };
      }
      trackLowMatchG(relaxedResult);  // 🌒 V27b
    }

    // 🌒 V27b NIVEL DIOS — si ningún attempt pasó threshold pero hay candidato
    // low_match cross-attempts, preservar sus covers como fallback
    if (bestLowMatchG) {
      const evLM = buildGoogleEvidence(bestLowMatchG, titulo, autor);
      return {
        ok: false,
        reason: `low_match_${bestLowMatchG._match_score.toFixed(2)}`,
        source: "google_books",
        _low_match_covers: Array.isArray(evLM.covers) ? evLM.covers : [],
        _low_match_score: bestLowMatchG._match_score,
        _low_match_title: (evLM.match_details && evLM.match_details.matched_title) || "",
        _low_match_author: (evLM.match_details && evLM.match_details.matched_author) || ""
      };
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
      titulo_real: titulo,                            // 🌒 v3.7 NIVEL DIOS: SAGRADO del CSV
      autor_completo: autor,                          // 🌒 v3.7 NIVEL DIOS: SAGRADO del CSV
      titulo_api: info.title || "",                   // 🌒 v3.7: referencia solo
      autor_api: authors.join(", ") || "",            // 🌒 v3.7: referencia solo
      subtitulo: info.subtitle || "",
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

// v3.7: Orquestador OpenLibrary — ISBN primero, después itera variantes.
async function fetchOpenLibrary(titulo, autor, isbn) {
  if (isbn && isValidIsbnFormat(isbn)) {
    const r = await fetchOpenLibraryAttempt(titulo, autor, { isbn });
    if (r.ok) return r;
  }

  const variants = generateTitleVariants(titulo);
  let lastFail = { ok: false, reason: "no_variants_tried", source: "openlibrary" };
  for (const v of variants) {
    const r = await fetchOpenLibraryAttempt(titulo, autor, { query: v.q, variantName: v.name });
    if (r.ok) return r;
    lastFail = r;
  }
  return lastFail;
}

async function fetchOpenLibraryAttempt(titulo, autor, options = {}) {
  try {
    let url;
    // v3.6 + v3.7: ISBN si formato válido, sino usa options.query (variante) o titulo (sagrado).
    if (options.isbn && isValidIsbnFormat(options.isbn)) {
      url = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(options.isbn.trim())}&limit=3`;
    } else {
      const searchTitle = options.query || titulo;
      url = `https://openlibrary.org/search.json?title=${encodeURIComponent(searchTitle)}&author=${encodeURIComponent(autor)}&limit=5`;
    }
    const res = await fetchWithRetry(url);
    if (!res.ok) return { ok: false, reason: `http_${res.status}`, source: "openlibrary" };

    const data = await res.json();
    if (!data.docs || data.docs.length === 0) return { ok: false, reason: "no_results", source: "openlibrary" };

    // v3.7: scoring contra la variante (sagrado preservado en verified_identity)
    const scoringTitle = options.query || titulo;
    const candidates = data.docs.map((doc) => {
      const authors = Array.isArray(doc.author_name) ? doc.author_name : [];
      return {
        doc,
        _match_score: scoreMatch(scoringTitle, autor, doc.title || "", authors.join(", "))
      };
    }).sort((a, b) => b._match_score - a._match_score);

    const best = candidates[0];
    if (best._match_score < MIN_MATCH_SCORE) {
      // 🌒 V27b NIVEL DIOS — preservar covers como fallback para autores genéricos
      // Útil para libros donde el título es reconocible pero el autor del CSV
      // no matchea con el autor que OpenLibrary tiene indexado
      const lowMatchCoversOL = [];
      if (best.doc && best.doc.cover_i) {
        lowMatchCoversOL.push({ size: "large", url: `https://covers.openlibrary.org/b/id/${best.doc.cover_i}-L.jpg` });
        lowMatchCoversOL.push({ size: "medium", url: `https://covers.openlibrary.org/b/id/${best.doc.cover_i}-M.jpg` });
        lowMatchCoversOL.push({ size: "small", url: `https://covers.openlibrary.org/b/id/${best.doc.cover_i}-S.jpg` });
      }
      return {
        ok: false,
        reason: `low_match_${best._match_score.toFixed(2)}`,
        source: "openlibrary",
        _low_match_covers: lowMatchCoversOL,
        _low_match_score: best._match_score,
        _low_match_title: (best.doc && best.doc.title) || "",
        _low_match_author: (best.doc && Array.isArray(best.doc.author_name)) ? best.doc.author_name.join(", ") : ""
      };
    }

    const doc = best.doc;
    const subjects = Array.isArray(doc.subject) ? doc.subject.slice(0, 12).join("; ") : "";
    const publisher = Array.isArray(doc.publisher) ? doc.publisher.slice(0, 2).join(", ") : "";
    const year = doc.first_publish_year ? String(doc.first_publish_year) : null;
    const authors = Array.isArray(doc.author_name) ? doc.author_name : [];
    const firstSentence = Array.isArray(doc.first_sentence) && doc.first_sentence[0] ? cleanHTMLEntities(doc.first_sentence[0]) : "";

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
        titulo_real: titulo,                          // 🌒 v3.7 NIVEL DIOS: SAGRADO del CSV
        autor_completo: autor,                        // 🌒 v3.7 NIVEL DIOS: SAGRADO del CSV
        titulo_api: doc.title || "",                  // 🌒 v3.7: referencia solo
        autor_api: authors.join(", ") || "",          // 🌒 v3.7: referencia solo
        año: year,
        editorial: publisher || null,
        isbn: isbnFromDoc,
        categorias: Array.isArray(doc.subject) ? doc.subject.slice(0, 5) : [],
        idioma: Array.isArray(doc.language) ? doc.language[0] : null,
        paginas: doc.number_of_pages_median || null
      },
      _variant_used: options.variantName || null
    };
  } catch (err) {
    return { ok: false, reason: `error_${err.message.slice(0, 60)}`, source: "openlibrary" };
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   v3.7 — OPENLIBRARY COVER BY ISBN DIRECTO
────────────────────────────────────────────────────────────────────────────── */

/**
 * Cover directo de OpenLibrary por ISBN. No requiere búsqueda previa, solo
 * construye URL determinística:
 *   https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
 *
 * Validado empíricamente: para ISBNs de libros populares (978-X), devuelve
 * cover real de 30-200 KB. Para ISBNs sin cover, OpenLib responde 200 con
 * placeholder <1KB (rechazado por checkImageURL que exige 2KB).
 *
 * Solo se invoca después del ISBN chain cuando descubrimos un ISBN válido
 * de otra fuente (Google u OpenLib search — Apple no expone ISBN real).
 */
async function fetchOpenLibraryByISBN(isbn) {
  if (!isbn || !isValidIsbnFormat(isbn)) {
    return { ok: false, reason: "no_valid_isbn", source: "openlib_isbn" };
  }

  const clean = isbn.replace(/[-\s]/g, "").trim();
  const url = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(clean)}-L.jpg`;

  // checkImageURL valida tamaño >= 2KB (rechaza placeholders OpenLibrary)
  const valid = await checkImageURL(url);
  if (!valid) {
    return { ok: false, reason: "cover_unavailable_or_placeholder", source: "openlib_isbn", _attempted_isbn: clean };
  }

  return {
    ok: true,
    source: "openlib_isbn",
    match_score: 0.99, // alto pero ligeramente menor que match perfecto título+autor
    covers: [{ size: "large", url }],
    synopsis: "",
    synopsis_length: 0,
    verified_identity: {
      isbn: clean,
      titulo_real: null,    // se preserva el titulo SAGRADO en otras fuentes con match
      autor_completo: null,
      año: null
    }
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   AMAZON COVER BY ISBN — v3.6 con validación estricta
────────────────────────────────────────────────────────────────────────────── */

/**
 * v3.6 BUG B FIX + BUG C FIX:
 *
 * Antes (v3.2):
 *   const isbn10 = clean.length === 13 ? clean.slice(3, 12) : clean;
 *
 * Bugs:
 *   - slice(3, 12) devuelve 9 chars, no 10 (ISBN-10 son 10 chars)
 *   - No validaba que isbn fuera realmente 10 o 13 dígitos
 *   - Cualquier basura como trackId Apple "991831052" pasaba
 *
 * Ahora (v3.6):
 *   - Valida formato (10 o 13 dígitos) antes de construir URL
 *   - Conversión 13→10 con módulo 11 correcto
 *   - checkImageURL valida tamaño mínimo (rechaza GIF placeholder)
 */
async function fetchAmazonCoverByISBN(isbn) {
  if (!isbn || !isbn.trim()) {
    return { ok: false, reason: "no_isbn", source: "amazon" };
  }

  const clean = isbn.replace(/[-\s]/g, "").trim();

  // v3.6: validación estricta de formato ISBN
  if (!isValidIsbnFormat(clean)) {
    return {
      ok: false,
      reason: `invalid_isbn_format_${clean.length}_chars`,
      source: "amazon",
      _attempted_isbn: clean
    };
  }

  // Convertir ISBN-13 → ISBN-10 si es necesario (Amazon URLs usan ISBN-10)
  let isbn10;
  if (clean.length === 13) {
    isbn10 = convertIsbn13ToIsbn10(clean);
    if (!isbn10) {
      return {
        ok: false,
        reason: "isbn13_conversion_failed_or_not_978",
        source: "amazon",
        _attempted_isbn: clean
      };
    }
  } else {
    isbn10 = clean;
  }

  // Validar que isbn10 resultante sea exactamente 10 chars
  if (!/^[0-9]{9}[0-9X]$/.test(isbn10)) {
    return {
      ok: false,
      reason: `invalid_isbn10_after_conversion_${isbn10.length}_chars`,
      source: "amazon",
      _attempted_isbn10: isbn10
    };
  }

  const urls = [
    `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01.LZZZZZZZ.jpg`,
    `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.01._SCLZZZZZZZ_.jpg`,
    `https://m.media-amazon.com/images/P/${isbn10}.01.LZZZZZZZ.jpg`
  ];

  for (const url of urls) {
    if (await checkImageURL(url)) { // v3.6: ahora valida tamaño >= 2KB
      return {
        ok: true,
        source: "amazon",
        match_score: 0.85,
        covers: [{ size: "large", url }],
        synopsis: "",
        synopsis_length: 0,
        verified_identity: {
          isbn: isbn10,
          isbn13: clean.length === 13 ? clean : "",
          isbn10,
          titulo_real: null,
          autor_completo: null,
          año: null
        }
      };
    }
  }

  return { ok: false, reason: "no_amazon_cover_or_only_placeholders", source: "amazon" };
}

/* ─────────────────────────────────────────────────────────────────────────────
   COVER VALIDATION PARALELA
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
  // v3.6: checkImageURL ahora rechaza placeholders <2KB
  const checks = await Promise.all(allCovers.map(async (c) => ({ ...c, valid: await checkImageURL(c.url) })));
  return checks.filter((c) => c.valid);
}

/* ─────────────────────────────────────────────────────────────────────────────
   ORCHESTRATOR PRINCIPAL
────────────────────────────────────────────────────────────────────────────── */

export async function fetchEvidence(book, options = {}) {
  const titulo = String(book.titulo || "").trim();
  const autor = String(book.autor || "").trim();
  const seedIsbnRaw = String(book.isbn || "").trim();

  // v3.6: validar el seedIsbn ANTES de hash y antes de pasar a las APIs.
  // Si el "ISBN" del libro es un trackId basura (ej. "991831052" 9 chars),
  // simplemente NO lo usamos como ISBN. Las APIs harán búsqueda por título+autor
  // que es lo correcto para esos casos.
  const seedIsbn = isValidIsbnFormat(seedIsbnRaw) ? seedIsbnRaw : "";
  const rejectedSeedIsbn = seedIsbnRaw && !seedIsbn ? seedIsbnRaw : null;

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
  if (rejectedSeedIsbn) {
    console.log(`   🛡️  v3.6: seedIsbn rechazado ("${rejectedSeedIsbn}" no es ISBN válido) — buscando solo por título+autor`);
  }

  // FASE 1: llamadas paralelas con seedIsbn (vacío si era basura)
  const t0 = Date.now();
  const [appleResult, googleResult, openLibraryResult] = await Promise.allSettled([
    fetchApple(titulo, autor, seedIsbn),
    fetchGoogle(titulo, autor, seedIsbn),
    fetchOpenLibrary(titulo, autor, seedIsbn)
  ]).then((results) => results.map((r) => r.status === "fulfilled" ? r.value : { ok: false, reason: `promise_rejected`, error: String(r.reason).slice(0, 100) }));
  const phase1Ms = Date.now() - t0;

  // FASE 2: ISBN chain — si alguna API encontró ISBN VÁLIDO y otras fallaron, reintentar
  // v3.6: validar formato antes de usar el ISBN descubierto
  const discoveredIsbnRaw = appleResult.verified_identity?.isbn ||
                             googleResult.verified_identity?.isbn ||
                             openLibraryResult.verified_identity?.isbn ||
                             "";
  const cleanDiscoveredIsbn = isValidIsbnFormat(discoveredIsbnRaw) ? discoveredIsbnRaw : "";

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

  // FASE 2.5 (v3.7): OpenLibrary cover directo por ISBN. Útil cuando Apple/Google
  // encontraron metadata + ISBN pero ninguno tenía cover válida (o de baja calidad).
  let openlibIsbnResult = { ok: false, reason: "skipped", source: "openlib_isbn" };
  if (cleanDiscoveredIsbn && isValidIsbnFormat(cleanDiscoveredIsbn)) {
    const t25 = Date.now();
    openlibIsbnResult = await fetchOpenLibraryByISBN(cleanDiscoveredIsbn);
    phase2Ms += Date.now() - t25;
  }

  // FASE 3: Amazon solo si tenemos ISBN VERIFICADO Y VÁLIDO
  // v3.6: doble verificación porque Amazon era el origen del problema
  let amazonResult = { ok: false, reason: "skipped", source: "amazon" };
  if (cleanDiscoveredIsbn && isValidIsbnFormat(cleanDiscoveredIsbn)) {
    const t2 = Date.now();
    amazonResult = await fetchAmazonCoverByISBN(cleanDiscoveredIsbn);
    phase2Ms += Date.now() - t2;
  } else if (cleanDiscoveredIsbn) {
    amazonResult = { ok: false, reason: "isbn_format_invalid", source: "amazon", _attempted: cleanDiscoveredIsbn };
  }

  const allResults = [finalApple, finalGoogle, finalOpenLibrary, openlibIsbnResult, amazonResult];

  // FASE 4: validar covers en paralelo (con tamaño mínimo v3.6)
  const t3 = Date.now();
  let validCovers = await validateCoversParallel(allResults);

  // 🌒 V27a NIVEL DIOS — Fase 4.5: si validCovers vacío, intentar low_match fallback
  // Útil para libros con autor genérico que las APIs no matchearon estrictamente
  // pero SÍ encontraron en su catálogo (Disney, Marvel, Pixar, etc.)
  if (validCovers.length === 0) {
    const lowMatchResults = allResults.filter(r => {
      if (!r || !Array.isArray(r._low_match_covers) || r._low_match_covers.length === 0) return false;
      // 🌒 V28 NIVEL DIOS — Title Similarity Gate
      // Rechaza covers cuyo título API no matchea el título original del CSV.
      // Esto previene que libros con título popular (Shrek, Frozen, Cars)
      // que NO existen como publicaciones reales reciban portadas erróneas
      // de ensayos académicos o libros académicos con palabras compartidas.
      const apiTitle = r._low_match_title || "";
      const titleSim = titleSimilarity(titulo, apiTitle);
      if (titleSim < MIN_TITLE_SIMILARITY) {
        console.log(`   🚫 V28 RECHAZO low_match ${r.source}: title_sim=${titleSim.toFixed(2)} "${apiTitle}" vs "${titulo}"`);
        return false;
      }
      return true;
    });
    if (lowMatchResults.length > 0) {
      // Construir pseudo-results para que validateCoversParallel los procese
      const fallbackResults = lowMatchResults.map(r => ({
        ok: true,
        source: r.source,
        covers: r._low_match_covers,
        _is_low_match_fallback: true,
        _low_match_score: r._low_match_score,
        match_details: {
          matched_title: r._low_match_title || "",
          matched_author: r._low_match_author || ""
        }
      }));
      const lmValidated = await validateCoversParallel(fallbackResults);
      if (lmValidated.length > 0) {
        validCovers = lmValidated;
        const summary = lowMatchResults.map(r => `${r.source}(${r._low_match_score?.toFixed(2) || "?"})`).join(", ");
        console.log(`   🌒 V27a fallback ACTIVADO: ${lmValidated.length} covers de low_match [${summary}]`);
      }
    }
  }
  const coverValidationMs = Date.now() - t3;

  // Log resumen
  const succeeded = allResults.filter((r) => r.ok).map((r) => r.source);
  const failed = allResults.filter((r) => !r.ok).map((r) => `${r.source}:${r.reason}`);
  console.log(`   ✓ Sources OK: [${succeeded.join(", ") || "none"}] | Covers válidas: ${validCovers.length} | ${phase1Ms}ms+${phase2Ms}ms+${coverValidationMs}ms`);

  const evidence = {
    titulo_input: titulo,
    autor_input: autor,
    isbn_seed: seedIsbn,
    isbn_seed_raw: seedIsbnRaw,
    isbn_seed_rejected: rejectedSeedIsbn, // v3.6: trazabilidad de ISBNs basura
    isbn_discovered: cleanDiscoveredIsbn,
    isbn_discovered_raw: discoveredIsbnRaw,
    apple: finalApple,
    google: finalGoogle,
    openlibrary: finalOpenLibrary,
    openlib_isbn: openlibIsbnResult, // v3.7: cover directo por ISBN
    amazon: amazonResult,
    valid_covers: validCovers,
    _status: validCovers.length > 0 ? "FOUND" : "EXHAUSTED", // v3.7: build-contenido emite warning si EXHAUSTED
    _sources_succeeded: succeeded,
    _sources_failed: failed,
    _timing: {
      phase1_parallel_ms: phase1Ms,
      phase2_isbn_chain_ms: phase2Ms,
      cover_validation_ms: coverValidationMs,
      total_ms: phase1Ms + phase2Ms + coverValidationMs
    },
    _version: "3.7"
  };

  await writeEvidenceCache(hash, evidence);
  return evidence;
}

/* ─────────────────────────────────────────────────────────────────────────────
   SELECTORS — sin cambios v3.6
────────────────────────────────────────────────────────────────────────────── */

export function selectBestCover(evidence, sourcePreference = ["apple_books", "google_books", "openlibrary", "openlib_isbn", "amazon"]) {
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

export function buildGroundTruthFromEvidence(evidence) {
  const sources = [evidence.apple, evidence.google, evidence.openlibrary].filter((s) => s.ok);
  if (sources.length === 0) return null;

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

export function buildEnrichedBookData(book, evidence, selectedCover = null) {
  const cover = selectedCover || selectBestCover(evidence);

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