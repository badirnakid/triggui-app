/**
 * build-og-image.js — Paso 5 del pipeline Triggui 2.0
 *
 * Genera OG image PNG 1200×630 para preview de link en WhatsApp.
 * Su función NO es competir con la tarjeta.
 * Su función es que el link se vea serio, editorial y claro.
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
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function withAlpha(hex, alpha = "30") {
  const clean = String(hex || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
    return `${clean}${alpha}`;
  }
  return clean || "";
}

function normalizeHighlightSyntax(input) {
  let text = String(input || "").trim();
  if (!text) return "";

  text = text
    .replace(/\{\{H\}\}/gi, "[H]")
    .replace(/\{\{\/H\}\}/gi, "[/H]")
    .replace(/\[h\]/g, "[H]")
    .replace(/\[\/h\]/g, "[/H]");

  let toggleOpen = true;
  text = text.replace(/\[H\]/g, () => {
    const token = toggleOpen ? "[H]" : "[/H]";
    toggleOpen = !toggleOpen;
    return token;
  });

  const opens = (text.match(/\[H\]/g) || []).length;
  const closes = (text.match(/\[\/H\]/g) || []).length;

  if (opens > closes) {
    text += "[/H]".repeat(opens - closes);
  }

  let extraClose = (text.match(/\[\/H\]/g) || []).length - (text.match(/\[H\]/g) || []).length;
  while (extraClose > 0) {
    const idx = text.lastIndexOf("[/H]");
    if (idx === -1) break;
    text = text.slice(0, idx) + text.slice(idx + 4);
    extraClose -= 1;
  }

  return text.replace(/\[H\]\s*\[\/H\]/g, "").replace(/[ \t]{2,}/g, " ").trim();
}

function stripHighlightTags(text) {
  return normalizeHighlightSyntax(text).replace(/\[H\]|\[\/H\]/gi, "");
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

function resolveAccent(libro) {
  return (
    libro?.tarjeta?.style?.accent ||
    libro?.colores?.[0] ||
    "#E35D30"
  );
}

function resolveEyebrow(bookMeta, libro) {
  const author = bookMeta.autor || libro.autor || "";
  return author || "Triggui";
}

function resolveHeadline(bookMeta, libro) {
  const tarjeta = libro.tarjeta || {};
  return (
    tarjeta.titulo ||
    bookMeta.titulo ||
    libro.titulo ||
    "Triggui"
  );
}

function resolveSubheadline(bookMeta, libro) {
  const tarjeta = libro.tarjeta || {};
  const subtitulo = String(tarjeta.subtitulo || "").trim();
  const top = stripHighlightTags(tarjeta.parrafoTop || "").trim();
  const bot = stripHighlightTags(tarjeta.parrafoBot || "").trim();

  let text = subtitulo || top || bot || bookMeta.titulo || libro.titulo || "";
  text = text.replace(/\s+/g, " ").trim();

  if (text.length > 160) {
    text = `${text.slice(0, 157).trim()}...`;
  }

  return text;
}

/* ═══════════════════════════════════════════════════════════════
   LOAD DATA
═══════════════════════════════════════════════════════════════ */

const contenidoPath = await resolveContenidoPath();
if (!contenidoPath) {
  console.error("❌ No existe TRIGGUI_EDICION_JSON, contenido_edicion.json ni contenido.json");
  process.exit(1);
}

if (!(await fileExists("/tmp/triggui-book.json"))) {
  console.error("❌ No existe /tmp/triggui-book.json");
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

const accent = resolveAccent(libro);
const accentSoft = withAlpha(accent, "26") || "#E35D3026";
const accentGlow = withAlpha(accent, "45") || "#E35D3045";

const portadaURL = resolvePortadaURL(bookMeta, libro);
const portadaSource = resolvePortadaSource(bookMeta, libro, portadaURL);

const headline = resolveHeadline(bookMeta, libro);
const eyebrow = resolveEyebrow(bookMeta, libro);
const subheadline = resolveSubheadline(bookMeta, libro);

const coverSection = portadaURL
  ? `<img class="cover" src="${portadaURL}" alt="Portada de ${escapeHTML(bookMeta.titulo || libro.titulo || "")}" />`
  : `<div class="cover-fallback">TRIGGUI</div>`;

let html = template
  .replace("{{EYEBROW}}", escapeHTML(eyebrow))
  .replace("{{HEADLINE}}", escapeHTML(headline))
  .replace("{{SUBHEADLINE}}", escapeHTML(subheadline))
  .replace("{{COVER_SECTION}}", coverSection);

const cssVars = [
  "--bg: #09090B",
  "--paper: #111114",
  "--ink: #F7F4EF",
  `--accent: ${accent}`,
  `--accent-soft: ${accentSoft}`,
  `--accent-glow: ${accentGlow}`
].join("; ");

html = html.replace("<body>", `<body style="${cssVars}">`);

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
console.log(`   ✨ Headline: ${headline}`);