/**
 * build-tarjeta-png.js — Paso 4 del pipeline Triggui 2.0
 *
 * Lee el artefacto canónico single-book:
 *   1) TRIGGUI_EDICION_JSON
 *   2) contenido_edicion.json
 *   3) contenido.json (fallback)
 *
 * + /tmp/triggui-book.json como metadata upstream
 *
 * Inyecta en template HTML y Playwright renderiza PNG.
 * Output: public/t/[slug]/tarjeta.png (1080×1920px)
 *
 * Determinista:
 * mismo input -> mismo output
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

function processHighlights(text) {
  if (!text) return "";
  return text
    .replace(/\{\{H\}\}/g, '<span class="highlight">')
    .replace(/\{\{\/H\}\}/g, "</span>")
    .replace(/\[H\]/gi, '<span class="highlight">')
    .replace(/\[\/H\]/gi, "</span>");
}

function escapeHTML(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function withAlpha(hex, alpha = "15") {
  const clean = String(hex || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
    return `${clean}${alpha}`;
  }
  return clean || "";
}

/* ═══════════════════════════════════════════════════════════════
   WCAG CONTRAST COMPUTATION
═══════════════════════════════════════════════════════════════ */

function luminance(hex) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000";
  const [r, g, b] = safe.slice(1).match(/../g).map(x => {
    const v = parseInt(x, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
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

console.log(`🎨 Generando tarjeta PNG: "${bookMeta.titulo || libro.titulo}"`);
console.log(`🧾 Fuente JSON: ${contenidoPath}`);

/* ═══════════════════════════════════════════════════════════════
   BUILD HTML FROM TEMPLATE
═══════════════════════════════════════════════════════════════ */

const template = await fs.readFile("scripts/templates/tarjeta.html", "utf8");

// Datos base
const tarjeta = libro.tarjeta || {};
const style = tarjeta.style || {};

const tituloLibro = bookMeta.titulo || libro.titulo || "";
const autorLibro = bookMeta.autor || libro.autor || "";

// Colores
const accent = style.accent || "#0E7490";
const paper = style.paper || "#ffffff";
const ink = style.ink || "#111827";
const titleColor = style.titleColor || accent;
const subtitleColor = style.subtitleColor || accent || "#B91C1C";
const paragraphColor = style.paragraphColor || ink || "#111827";
const chipBg = withAlpha(accent, "18") || "#e0f2fe";
const chipColor = accent || "#0c4a6e";
const highlightBg = withAlpha(accent, "15") || "rgba(14,116,144,0.08)";

// Contraste
const titleContrast = contrastRatio(titleColor, paper);
const subtitleContrast = contrastRatio(subtitleColor, paper);
console.log(`   📐 Contraste título/fondo: ${titleContrast.toFixed(2)}:1 ${titleContrast >= 4.5 ? "✅" : "⚠️ < 4.5"}`);
console.log(`   📐 Contraste subtítulo/fondo: ${subtitleContrast.toFixed(2)}:1 ${subtitleContrast >= 3 ? "✅" : "⚠️ < 3"}`);

// Texto con highlights
const parrafoTop = processHighlights(escapeHTML(tarjeta.parrafoTop || ""));
const parrafoBot = processHighlights(escapeHTML(tarjeta.parrafoBot || ""));

// Portada canónica homologada upstream
const portadaURL = resolvePortadaURL(bookMeta, libro);
const portadaSource = resolvePortadaSource(bookMeta, libro, portadaURL);

// Inyección en template
let html = template
  .replace("{{PORTADA_URL}}", portadaURL)
  .replace("{{TITULO}}", escapeHTML(tarjeta.titulo || tituloLibro))
  .replace("{{AUTOR}}", escapeHTML(autorLibro))
  .replace("{{PARRAFO_TOP}}", parrafoTop)
  .replace("{{SUBTITULO}}", escapeHTML(tarjeta.subtitulo || ""))
  .replace("{{PARRAFO_BOT}}", parrafoBot);

// CSS vars
const cssVars = [
  `--title-color: ${titleColor}`,
  `--subtitle-color: ${subtitleColor}`,
  `--paragraph-color: ${paragraphColor}`,
  `--paper: ${paper}`,
  `--chip-bg: ${chipBg}`,
  `--chip-color: ${chipColor}`,
  `--highlight-bg: ${highlightBg}`
].join("; ");

html = html.replace("<body>", `<body style="${cssVars}">`);

/* ═══════════════════════════════════════════════════════════════
   RENDER WITH PLAYWRIGHT CHROMIUM
   Output real: 1080×1920
═══════════════════════════════════════════════════════════════ */

console.log("   🖥️  Iniciando Chrome headless...");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Vertical real 1080×1920
await page.setViewportSize({ width: 1080, height: 1920 });

await page.setContent(html, { waitUntil: "networkidle" });

// Esperar portada si existe
if (portadaURL) {
  try {
    await page.waitForSelector(".cover", { state: "visible", timeout: 10000 });
    await page.waitForTimeout(1000);
  } catch {
    console.log("   ⚠️  Portada no cargó en 10s — continuando sin ella");
  }
}

// Screenshot exacto
const outPath = path.join(outDir, "tarjeta.png");
await page.screenshot({
  path: outPath,
  type: "png",
  clip: { x: 0, y: 0, width: 1080, height: 1920 }
});

await browser.close();

// Stats
const stats = await fs.stat(outPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`\n   ✅ Tarjeta generada: ${outPath}`);
console.log(`   📏 ${sizeMB} MB | 1080×1920px`);
console.log(`   🎨 Título: "${tarjeta.titulo || tituloLibro}"`);
console.log(`   ✍️  Autor: ${autorLibro}`);
console.log(`   🖼️  Portada: ${portadaURL ? portadaSource : "tipográfica"}`);