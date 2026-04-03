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
import { parse } from "csv-parse/sync";
import { appendFileSync } from "node:fs";

const INPUT = process.env.LIBRO_INPUT;
if (!INPUT) { console.error("❌ LIBRO_INPUT vacío"); process.exit(1); }

const [tituloRaw, autorRaw] = INPUT.split("|").map(s => s.trim());
if (!tituloRaw) { console.error("❌ Título vacío"); process.exit(1); }

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
   DUPLICATE CHECK
═══════════════════════════════════════════════════════════════ */

async function checkDuplicate() {
  try {
    const csv = await fs.readFile("data/libros_master.csv", "utf8");
    const rows = parse(csv, { columns: true, skip_empty_lines: true });
    const normalizado = titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const dup = rows.find(r => {
      const t = (r.titulo || r.Title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return t === normalizado;
    });
    if (dup) {
      console.log(`⚠️  "${titulo}" ya existe en libros_master.csv — se usará sin duplicar`);
      return true;
    }
    return false;
  } catch (e) {
    console.log(`ℹ️  No se encontró libros_master.csv — se creará entrada nueva`);
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
  } catch { return null; }
}

async function checkImageURL(url) {
  if (!url) return false;
  try {
    const res = await fetch(url, { method: "HEAD" });
    const type = res.headers.get("content-type") || "";
    return res.ok && type.startsWith("image/");
  } catch { return false; }
}

// 1. Apple Books (iTunes Search API)
async function searchAppleBooks() {
  console.log("   🍎 Buscando en Apple Books...");
  const q = encodeURIComponent(`${titulo} ${autor}`);
  const data = await fetchJSON(`https://itunes.apple.com/search?term=${q}&entity=ebook&limit=5&country=mx`);
  if (!data?.results?.length) return null;

  for (const r of data.results) {
    // Apple devuelve artwork en 100x100 por default, escalar a 600x600
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
  const data = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5&langRestrict=es`);
  if (!data?.items?.length) {
    // Reintentar sin restricción de idioma
    const data2 = await fetchJSON(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`);
    if (!data2?.items?.length) return null;
    data.items = data2.items;
  }

  for (const item of data.items) {
    const info = item.volumeInfo || {};
    const imgs = info.imageLinks || {};
    // Preferir thumbnail más grande disponible
    const url = imgs.extraLarge || imgs.large || imgs.medium || imgs.small || imgs.thumbnail;
    if (url) {
      // Google Books a veces bloquea con &edge=curl, limpiarlo
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
          isbn: doc.isbn?.[0] || "",
          editorial: doc.publisher?.[0] || "",
          year: doc.first_publish_year?.toString() || "",
          source: "open_library"
        };
      }
    }
  }
  return null;
}

// 4. Amazon (por ISBN si lo tenemos de pasos anteriores)
async function searchAmazon(isbn) {
  if (!isbn) return null;
  console.log("   🛒 Buscando portada en Amazon por ISBN...");
  const url = `https://images-na.ssl-images-amazon.com/images/P/${isbn}.01.LZZZZZZZ.jpg`;
  if (await checkImageURL(url)) {
    console.log("   ✅ Portada encontrada en Amazon");
    return { portada: url, source: "amazon" };
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */

const isDuplicate = await checkDuplicate();

console.log("\n🔍 Buscando portada (cascada de 4 fuentes)...\n");

let bookData = null;
let portadaURL = "";
let metadata = {};

// Cascada: la primera que devuelva portada gana
const apple = await searchAppleBooks();
if (apple) {
  portadaURL = apple.portada;
  metadata = apple;
} else {
  const google = await searchGoogleBooks();
  if (google) {
    portadaURL = google.portada;
    metadata = google;
  } else {
    const openlib = await searchOpenLibrary();
    if (openlib) {
      portadaURL = openlib.portada;
      metadata = openlib;
      // Intentar Amazon con ISBN de Open Library
      if (!portadaURL && openlib.isbn) {
        const amz = await searchAmazon(openlib.isbn);
        if (amz) portadaURL = amz.portada;
      }
    } else {
      console.log("   ⚠️  Ninguna fuente tiene portada. Se generará portada tipográfica.");
    }
  }
}

// Construir objeto libro
bookData = {
  titulo,
  autor,
  slug,
  portada: portadaURL || "",
  isbn: metadata.isbn || "",
  editorial: metadata.editorial || "",
  year: metadata.year || "",
  pages: metadata.pages || 0,
  portadaSource: metadata.source || "none",
  tagline: "",
  isDuplicate
};

console.log("\n══════════════════════════════════════════");
console.log(`📖 ${bookData.titulo}`);
console.log(`✍️  ${bookData.autor}`);
console.log(`🔗 Slug: ${bookData.slug}`);
console.log(`🖼️  Portada: ${bookData.portada ? `${bookData.portadaSource} ✅` : "tipográfica (generada)"}`);
console.log(`📦 ISBN: ${bookData.isbn || "—"}`);
console.log(`🏢 Editorial: ${bookData.editorial || "—"}`);
console.log(`📄 Duplicado: ${bookData.isDuplicate ? "sí (no se añadirá de nuevo)" : "no"}`);
console.log("══════════════════════════════════════════\n");

// Guardar outputs para los siguientes pasos
await fs.writeFile("/tmp/triggui-slug.txt", slug);
await fs.writeFile("/tmp/triggui-titulo.txt", titulo);
await fs.writeFile("/tmp/triggui-book.json", JSON.stringify(bookData, null, 2));

// GitHub Actions output
const GITHUB_OUTPUT = process.env.GITHUB_OUTPUT;
if (GITHUB_OUTPUT) {
  appendFileSync(GITHUB_OUTPUT, `book_json=${JSON.stringify(bookData)}\n`);
}

console.log("✅ Validación completa. Siguiente paso: enriquecimiento GPT-4o-mini.");
