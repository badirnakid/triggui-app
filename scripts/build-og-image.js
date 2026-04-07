/**
 * build-og-image.js — Paso 5 del pipeline Triggui 2.0
 *
 * Genera OG image PNG 1200×630 para preview de link en WhatsApp.
 * Su función NO es ser el anzuelo principal.
 * Su función es que el link se vea coherente, limpio y profesional.
 *
 * Lee el artefacto canónico single-book:
 *   1) TRIGGUI_EDICION_JSON
 *   2) contenido_edicion.json
 *   3) contenido.json (fallback)
 *
 * + /tmp/triggui-book.json como metadata upstream.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveContenidoPath() {
  const envPath = String(process.env.TRIGGUI_EDICION_JSON || "").trim();

  const candidates = [
    envPath,
    "contenido_edicion.json",
    "contenido.json"
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await fileExists(candidate)) return candidate;
  }

  return null;
}

function escapeHTML(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function withAlpha(hex, alpha = "40") {
  const clean = String(hex || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
    return `${clean}${alpha}`;
  }
  return clean || "";
}

function resolvePortadaURL(bookMeta, libro) {
  return (
    bookMeta.portada_url ||
    bookMeta.portada ||
    libro.portada_url ||
    libro.portada ||
    ""
  );
}

function resolvePortadaSource(bookMeta, libro, portadaURL) {
  return (
    bookMeta.portada_source ||
    bookMeta.source ||
    libro.portada_source ||
    libro.source ||
    (portadaURL ? "unknown" : "tipográfica")
  );
}

function resolvePalabra(libro, bookMeta) {
  return (
    libro.palabras?.[0] ||
    libro.tarjeta?.titulo ||
    bookMeta.titulo ||
    libro.titulo ||
    "Triggui"
  );
}

function resolveHint(libro) {
  return (
    libro.tagline ||
    libro.tarjeta?.parrafoTop ||
    libro.tarjeta?.parrafoBot ||
    ""
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOAD DATA
═══════════════════════════════════════════════════════════════ */

const contenidoPath = await resolveContenidoPath();
if (!contenidoPath) {
  console.error("❌ No existe TRIGGUI_EDICION_JSON, contenido_edicion.json ni contenido.json");
  process.exit(1);
}

const bookMeta = JSON.parse(await fs.readFile("/tmp/triggui-book.json", "utf8"));
const contenido = JSON.parse(await fs.readFile(contenidoPath, "utf8"));

const libro = contenido?.libros?.[0];
if (!libro) {
  console.error(`❌ No hay libro en ${contenidoPath}`);
  process.exit(1);
}

const slug = bookMeta.slug;
if (!slug) {
  console.error("❌ No hay slug en /tmp/triggui-book.json");
  process.exit(1);
}

const outDir = `public/t/${slug}`;
await fs.mkdir(outDir, { recursive: true });

console.log(`🖼️  Generando OG image: "${bookMeta.titulo || libro.titulo}"`);
console.log(`🧾 Fuente JSON: ${contenidoPath}`);

/* ═══════════════════════════════════════════════════════════════
   BUILD HTML FROM TEMPLATE
═══════════════════════════════════════════════════════════════ */

const template = await fs.readFile("scripts/templates/og-image.html", "utf8");

const palabra = resolvePalabra(libro, bookMeta);
const hintRaw = resolveHint(libro);
const hint = hintRaw.length > 140 ? `${hintRaw.slice(0, 137).trim()}...` : hintRaw;

const accent =
  libro.tarjeta?.style?.accent ||
  libro.colores?.[0] ||
  "#ffffff";

const portadaURL = resolvePortadaURL(bookMeta, libro);
const portadaSource = resolvePortadaSource(bookMeta, libro, portadaURL);
const glowColor = withAlpha(accent, "40") || "#ffffff40";

let html = template
  .replace("{{PALABRA}}", escapeHTML(palabra))
  .replace("{{HINT}}", escapeHTML(hint))
  .replace("{{PORTADA_URL}}", portadaURL);

// CSS variables
const cssVars = [
  "--bg: #0a0a0a",
  `--accent: ${accent}`,
  `--glow: ${glowColor}`
].join("; ");

html = html.replace("<body>", `<body style="${cssVars}">`);

// Si no hay portada, ocultar wrapper
if (!portadaURL) {
  html = html.replace('class="cover-wrapper"', 'class="cover-wrapper" style="display:none"');
}

/* ═══════════════════════════════════════════════════════════════
   RENDER WITH PLAYWRIGHT
═══════════════════════════════════════════════════════════════ */

console.log("   🖥️  Iniciando Chrome headless...");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(html, { waitUntil: "networkidle" });

if (portadaURL) {
  try {
    await page.waitForSelector(".cover", { state: "visible", timeout: 8000 });
    await page.waitForTimeout(500);
  } catch {
    console.log("   ⚠️  Portada no cargó — OG sin portada");
  }
}

const outPath = path.join(outDir, "og.png");
await page.screenshot({
  path: outPath,
  type: "png",
  clip: { x: 0, y: 0, width: 1200, height: 630 }
});

await browser.close();

const stats = await fs.stat(outPath);
console.log(`   ✅ OG image: ${outPath} (${(stats.size / 1024).toFixed(0)} KB)`);
console.log(`   🖼️  Portada: ${portadaURL ? portadaSource : "tipográfica"}`);
console.log(`   ✨ Palabra dominante: ${palabra}`);