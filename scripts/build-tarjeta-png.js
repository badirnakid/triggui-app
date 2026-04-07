/**
 * build-tarjeta-png.js — Paso 4 del pipeline Triggui 2.0
 *
 * Renderiza una tarjeta PNG vertical real para WhatsApp.
 * Canon:
 *   1) TRIGGUI_EDICION_JSON
 *   2) contenido_edicion.json
 *   3) contenido.json
 *
 * + /tmp/triggui-book.json como metadata upstream
 *
 * Output:
 *   public/t/[slug]/tarjeta.png
 *
 * Tamaño real:
 *   1080×1920px
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

function escapeWithBreaks(text) {
  return escapeHTML(text).replace(/\n/g, "<br>");
}

function withAlpha(hex, alpha = "24") {
  const clean = String(hex || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
    return `${clean}${alpha}`;
  }
  return clean || "";
}

function normalizeHighlightSyntax(input) {
  let text = String(input || "").trim();
  if (!text) return "";

  // moustache -> canonical
  text = text
    .replace(/\{\{H\}\}/gi, "[H]")
    .replace(/\{\{\/H\}\}/gi, "[/H]");

  // lowercase -> uppercase
  text = text
    .replace(/\[h\]/g, "[H]")
    .replace(/\[\/h\]/g, "[/H]");

  // legacy broken [H]...[H] -> alternate open/close
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

  text = text
    .replace(/\[H\]\s*\[\/H\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text;
}

function renderHighlightHTML(text) {
  const normalized = normalizeHighlightSyntax(text);
  if (!normalized) return "";

  const re = /\[H\](.*?)\[\/H\]/gis;
  let out = "";
  let last = 0;
  let match;

  while ((match = re.exec(normalized)) !== null) {
    const before = normalized.slice(last, match.index);
    if (before) out += escapeWithBreaks(before);

    const inner = String(match[1] || "").trim();
    if (inner) {
      out += `<span class="highlight">${escapeWithBreaks(inner)}</span>`;
    }

    last = re.lastIndex;
  }

  const after = normalized.slice(last);
  if (after) out += escapeWithBreaks(after);

  return out;
}

function luminance(hex) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(String(hex || "")) ? String(hex) : "#000000";
  const [r, g, b] = safe.slice(1).match(/../g).map((x) => {
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

console.log(`🎨 Generando tarjeta PNG: "${bookMeta.titulo || libro.titulo}"`);
console.log(`🧾 Fuente JSON: ${contenidoPath}`);

/* ═══════════════════════════════════════════════════════════════
   BUILD HTML FROM TEMPLATE
═══════════════════════════════════════════════════════════════ */

const template = await fs.readFile("scripts/templates/tarjeta.html", "utf8");

const tarjeta = libro.tarjeta || {};
const style = tarjeta.style || {};

const tituloLibro = bookMeta.titulo || libro.titulo || "";
const autorLibro = bookMeta.autor || libro.autor || "";

const accent = style.accent || "#E35D30";
const paper = style.paper || "#F7F7F5";
const ink = style.ink || "#1A1A1A";
const borderColor = style.border || "#E7E3DE";

const titleColor = style.titleColor || "#1A1A1A";
const subtitleColor = style.subtitleColor || accent;
const paragraphColor = style.paragraphColor || "#4A4A4A";

const chipBg = withAlpha(accent, "18") || "#FBE7DF";
const chipColor = accent || "#A84322";
const highlightBg = withAlpha(accent, "2B") || "rgba(227,93,48,0.17)";
const highlightText = paragraphColor;
const coverBorder = withAlpha(accent, "18") || "#EAEAEA";

const titleContrast = contrastRatio(titleColor, paper);
const subtitleContrast = contrastRatio(subtitleColor, paper);
console.log(`   📐 Contraste título/fondo: ${titleContrast.toFixed(2)}:1 ${titleContrast >= 4.5 ? "✅" : "⚠️"}`);
console.log(`   📐 Contraste subtítulo/fondo: ${subtitleContrast.toFixed(2)}:1 ${subtitleContrast >= 3 ? "✅" : "⚠️"}`);

const parrafoTopHTML = renderHighlightHTML(tarjeta.parrafoTop || "");
const parrafoBotHTML = renderHighlightHTML(tarjeta.parrafoBot || "");

const portadaURL = resolvePortadaURL(bookMeta, libro);
const portadaSource = resolvePortadaSource(bookMeta, libro, portadaURL);

const portadaSection = portadaURL
  ? `<img class="cover" src="${portadaURL}" alt="Portada de ${escapeHTML(tituloLibro)}" />`
  : "";

let html = template
  .replace("{{PORTADA_SECTION}}", portadaSection)
  .replace("{{TITULO}}", escapeHTML(tarjeta.titulo || tituloLibro))
  .replace("{{AUTOR}}", escapeHTML(autorLibro))
  .replace("{{PARRAFO_TOP}}", parrafoTopHTML)
  .replace("{{SUBTITULO}}", escapeHTML(tarjeta.subtitulo || ""))
  .replace("{{PARRAFO_BOT}}", parrafoBotHTML);

const cssVars = [
  `--bg: #0B0B0C`,
  `--paper: ${paper}`,
  `--ink: ${ink}`,
  `--title-color: ${titleColor}`,
  `--subtitle-color: ${subtitleColor}`,
  `--paragraph-color: ${paragraphColor}`,
  `--chip-bg: ${chipBg}`,
  `--chip-color: ${chipColor}`,
  `--highlight-bg: ${highlightBg}`,
  `--highlight-color: ${highlightText}`,
  `--border-color: ${borderColor}`,
  `--cover-border: ${coverBorder}`,
  `--accent: ${accent}`
].join("; ");

html = html.replace("<body>", `<body style="${cssVars}">`);

/* ═══════════════════════════════════════════════════════════════
   RENDER WITH PLAYWRIGHT
═══════════════════════════════════════════════════════════════ */

console.log("   🖥️  Iniciando Chrome headless...");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.setViewportSize({ width: 1080, height: 1920 });
await page.setContent(html, { waitUntil: "networkidle" });

if (portadaURL) {
  try {
    await page.waitForSelector(".cover", { state: "visible", timeout: 10000 });
    await page.waitForTimeout(600);
  } catch {
    console.log("   ⚠️  Portada no cargó en 10s — continuando sin ella");
  }
}

const outPath = path.join(outDir, "tarjeta.png");
await page.screenshot({
  path: outPath,
  type: "png",
  clip: { x: 0, y: 0, width: 1080, height: 1920 }
});

await browser.close();

const stats = await fs.stat(outPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`\n   ✅ Tarjeta generada: ${outPath}`);
console.log(`   📏 ${sizeMB} MB | 1080×1920px`);
console.log(`   🎨 Título: "${tarjeta.titulo || tituloLibro}"`);
console.log(`   ✍️  Autor: ${autorLibro}`);
console.log(`   🖼️  Portada: ${portadaURL ? portadaSource : "tipográfica"}`);