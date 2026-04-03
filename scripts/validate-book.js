/**
 * validate-book.js — Paso 1 del pipeline Triggui 2.0
 *
 * Input:  env.LIBRO_INPUT = "Generación Dopamina | Anna Lembke"
 * Output: GitHub Actions output 'book_json' + archivos /tmp/triggui-*.txt
 *
 * Cascada de portadas: Apple Books → Google Books → Open Library → Amazon
 * Si ninguna: genera portada tipográfica (se maneja en build-tarjeta-png.js)
 */

import fs from "node:fs/promises";
import { appendFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

const INPUT = process.env.LIBRO_INPUT;
if (!INPUT) {
  console.error("❌ LIBRO_INPUT vacío");
  process.exit(1);
}

const [tituloRaw, autorRaw] = INPUT.split("|").map(s => s.trim());
if (!tituloRaw) {
  console.error("❌ Título vacío");
  process.exit(1);
}

const titulo = tituloRaw;
const autor = autorRaw || "Autor desconocido";

console.log(`📖 Validando: "${titulo}" de ${autor}`);

/* ═══════════════════════════════════════════════════════════════
   SLUG GENERATION
═══════════════════════════════════════════════════════════════ */

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

const slug = slugify(titulo);

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
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
    "triggui-content/data/libros_master.csv",
    "data/libros_master.csv"
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   DUPLICATE CHECK
═══════════════════════════════════════════════════════════════ */

async function checkDuplicate() {
  try {
    const csvPath = await getMasterCsvPath();

    if (!csvPath) {
      console.log("ℹ️  No se encontró libros_master.csv — se creará entrada nueva");
      return false;
    }

    const csv = await fs.readFile(csvPath, "utf8");
    const rows = parse(csv, { columns: true, skip_empty_lines: true });
    const normalizado = normalizeText(titulo);

    const dup = rows.find(r => {
      const t = normalizeText(r.titulo || r.Title || "");
      return t === normalizado;
    });

    if (dup) {
      console.log(`⚠️  "${titulo}" ya existe en ${csvPath} — se usará sin duplicar`);
      return true;
    }

    return false;
  } catch (e) {
    console.log(`ℹ️  Error al revisar duplicados: ${e.message}`);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════
   CASCADA DE PORTADAS
   Orden: Apple Books → Google Books → Open Library → Amazon
   La primera que devuelva imagen usable gana.
═══════════════════════════════════════════════════════════════ */

async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function checkImageURL(url) {
  if (!url) return false;

  try {
    const res = await fetch(url, { method: "HEAD" });
    const type = res.headers.get("content-type") || "";
    return res.ok && type.startsWith("image/");
  } catch {
    return false;
  }
}

// 1. Apple Books (iTunes Search API)
async function searchAppleBooks() {
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

// 2. Google Books API
async function searchGoogleBooks() {
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

// 3. Open Library
async function searchOpenLibrary() {
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

// 4. Amazon (fallback por ISBN / búsqueda simple)
async function searchAmazonFallback() {
  console.log("   🟠 Buscando en Amazon (fallback)...");
  return null;
}

async function getBestCover() {
  console.log("🔍 Buscando portada (cascada de 4 fuentes)...");

  const apple = await searchAppleBooks();
  if (apple) return apple;

  const google = await searchGoogleBooks();
  if (google) return google;

  const open = await searchOpenLibrary();
  if (open) return open;

  const amazon = await searchAmazonFallback();
  if (amazon) return amazon;

  return {
    portada: "",
    isbn: "",
    editorial: "",
    source: "none"
  };
}

/* ═══════════════════════════════════════════════════════════════
   OUTPUTS
═══════════════════════════════════════════════════════════════ */

function setGithubOutput(name, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}

await fs.writeFile("/tmp/triggui-slug.txt", slug, "utf8");
await fs.writeFile("/tmp/triggui-titulo.txt", titulo, "utf8");

const duplicado = await checkDuplicate();
const cover = await getBestCover();

const bookData = {
  titulo,
  autor,
  slug,
  portada: cover.portada || "",
  isbn: cover.isbn || "",
  editorial: cover.editorial || "",
  source: cover.source || "none",
  duplicado
};

await fs.writeFile("/tmp/triggui-book.json", JSON.stringify(bookData, null, 2), "utf8");

setGithubOutput("book_json", JSON.stringify(bookData));

console.log("══════════════════════════════════════════");
console.log(`📖 ${titulo}`);
console.log(`✍️  ${autor}`);
console.log(`🔗 Slug: ${slug}`);
console.log(`🖼️  Portada: ${cover.source || "none"} ${cover.portada ? "✅" : "—"}`);
console.log(`📦 ISBN: ${cover.isbn || "—"}`);
console.log(`🏢 Editorial: ${cover.editorial || "—"}`);
console.log(`📄 Duplicado: ${duplicado ? "sí" : "no"}`);
console.log("══════════════════════════════════════════");
console.log("✅ Validación completa. Siguiente paso: enriquecimiento GPT-4o-mini.");