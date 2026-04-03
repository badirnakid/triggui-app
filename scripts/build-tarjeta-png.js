/**
 * build-tarjeta-png.js — Paso 4 del pipeline Triggui 2.0
 * 
 * Lee contenido.json + book metadata → inyecta en template HTML → Puppeteer renderiza PNG
 * Output: public/t/[slug]/tarjeta.png (1080×1920px)
 * 
 * CSS es matemáticas. Puppeteer traduce esas ecuaciones a píxeles via Chrome headless.
 * Determinista: mismo input → mismo output. Siempre.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/* ═══════════════════════════════════════════════════════════════
   LOAD DATA
═══════════════════════════════════════════════════════════════ */

const bookMeta = JSON.parse(await fs.readFile("/tmp/triggui-book.json", "utf8"));
const contenido = JSON.parse(await fs.readFile("contenido.json", "utf8"));

// El libro recién enriquecido está en posición [0] del array cuando es modo SINGLE
const libro = contenido.libros[0];
if (!libro) { console.error("❌ No hay libro en contenido.json"); process.exit(1); }

const slug = bookMeta.slug;
const outDir = `public/t/${slug}`;
await fs.mkdir(outDir, { recursive: true });

console.log(`🎨 Generando tarjeta PNG: "${libro.titulo}"`);

/* ═══════════════════════════════════════════════════════════════
   PROCESS HIGHLIGHTS [H]...[/H] → <span class="highlight">
═══════════════════════════════════════════════════════════════ */

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
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ═══════════════════════════════════════════════════════════════
   WCAG CONTRAST COMPUTATION
   L = 0.2126*R + 0.7152*G + 0.0722*B
   Each channel: f(v) = v ≤ 0.03928 ? v/12.92 : ((v+0.055)/1.055)^2.4
═══════════════════════════════════════════════════════════════ */

function luminance(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map(x => {
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

/* ═══════════════════════════════════════════════════════════════
   BUILD HTML FROM TEMPLATE
═══════════════════════════════════════════════════════════════ */

const template = await fs.readFile("scripts/templates/tarjeta.html", "utf8");

// Extraer datos de la tarjeta
const tarjeta = libro.tarjeta || {};
const style = tarjeta.style || {};

// Colores del estilo (con validación de contraste)
const titleColor = style.accent || "#0E7490";
const subtitleColor = style.subtitleColor || "#B91C1C";
const paragraphColor = "#111827";
const paper = "#ffffff";
const chipBg = style.accent ? style.accent + "18" : "#e0f2fe"; // accent al 10% opacity
const chipColor = style.accent || "#0c4a6e";
const highlightBg = style.accent ? style.accent + "15" : "rgba(14,116,144,0.08)";

// Verificar contraste WCAG
const titleContrast = contrastRatio(titleColor, paper);
const subtitleContrast = contrastRatio(subtitleColor, paper);
console.log(`   📐 Contraste título/fondo: ${titleContrast.toFixed(2)}:1 ${titleContrast >= 4.5 ? "✅" : "⚠️ < 4.5"}`);
console.log(`   📐 Contraste subtítulo/fondo: ${subtitleContrast.toFixed(2)}:1 ${subtitleContrast >= 3 ? "✅" : "⚠️ < 3"}`);

// Procesar contenido con highlights
const parrafoTop = processHighlights(escapeHTML(tarjeta.parrafoTop || ""));
const parrafoBot = processHighlights(escapeHTML(tarjeta.parrafoBot || ""));

// Portada: usar la de mejor resolución del validate-book
const portadaURL = bookMeta.portada || libro.portada || "";

// Inyectar en template
let html = template
  .replace("{{PORTADA_URL}}", portadaURL)
  .replace("{{TITULO}}", escapeHTML(tarjeta.titulo || libro.titulo))
  .replace("{{AUTOR}}", escapeHTML(libro.autor))
  .replace("{{PARRAFO_TOP}}", parrafoTop)
  .replace("{{SUBTITULO}}", escapeHTML(tarjeta.subtitulo || ""))
  .replace("{{PARRAFO_BOT}}", parrafoBot);

// Inyectar CSS variables de color
const cssVars = `
  --title-color: ${titleColor};
  --subtitle-color: ${subtitleColor};
  --paragraph-color: ${paragraphColor};
  --paper: ${paper};
  --chip-bg: ${chipBg};
  --chip-color: ${chipColor};
  --highlight-bg: ${highlightBg};
`;
html = html.replace("<body>", `<body style="${cssVars}">`);

/* ═══════════════════════════════════════════════════════════════
   RENDER WITH PUPPETEER (Playwright Chromium)
   CSS → Chrome layout engine (Blink) → Skia rasterizer → PNG
   Determinista. Mismo input → mismo output.
═══════════════════════════════════════════════════════════════ */

console.log("   🖥️  Iniciando Chrome headless...");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Viewport exacto: 1080×1920 (vertical, WhatsApp/Story)
await page.setViewportSize({ width: 1080, height: 1920 });

await page.setContent(html, { waitUntil: "networkidle" });

// Esperar a que la portada cargue (si hay URL)
if (portadaURL) {
  try {
    await page.waitForSelector(".cover", { state: "visible", timeout: 10000 });
    // Dar 1 segundo extra para que la imagen se renderice completa
    await page.waitForTimeout(1000);
  } catch {
    console.log("   ⚠️  Portada no cargó en 10s — continuando sin ella");
  }
}

// Screenshot
const outPath = path.join(outDir, "tarjeta.png");
await page.screenshot({
  path: outPath,
  type: "png",
  clip: { x: 0, y: 0, width: 1080, height: 1920 }
});

await browser.close();

// Verificar tamaño del archivo
const stats = await fs.stat(outPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`\n   ✅ Tarjeta generada: ${outPath}`);
console.log(`   📏 ${sizeMB} MB | 1080×1920px`);
console.log(`   🎨 Título: "${tarjeta.titulo || libro.titulo}"`);
console.log(`   ✍️  Autor: ${libro.autor}`);
console.log(`   🖼️  Portada: ${portadaURL ? bookMeta.portadaSource : "tipográfica"}`);
