/**
 * build-og-image.js — Paso 5 del pipeline Triggui 2.0
 * 
 * Genera OG image PNG 1200×630 para preview de link en WhatsApp.
 * Su función NO es ser el anzuelo (eso lo hace la tarjeta imagen directa).
 * Su función es que el link se vea coherente y profesional.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const bookMeta = JSON.parse(await fs.readFile("/tmp/triggui-book.json", "utf8"));
const contenido = JSON.parse(await fs.readFile("contenido.json", "utf8"));
const libro = contenido.libros[0];
if (!libro) { console.error("❌ No hay libro en contenido.json"); process.exit(1); }

const slug = bookMeta.slug;
const outDir = `public/t/${slug}`;
await fs.mkdir(outDir, { recursive: true });

console.log(`🖼️  Generando OG image: "${libro.titulo}"`);

const template = await fs.readFile("scripts/templates/og-image.html", "utf8");

// La palabra dominante es la primera del array de palabras
const palabra = libro.palabras?.[0] || libro.titulo;
const hint = libro.tagline || libro.tarjeta?.parrafoTop?.substring(0, 120) || "";
const accent = libro.tarjeta?.style?.accent || libro.colores?.[0] || "#ffffff";
const portadaURL = bookMeta.portada || libro.portada || "";
const glowColor = accent + "40"; // accent al 25% opacity

let html = template
  .replace("{{PALABRA}}", palabra.replace(/</g, "&lt;"))
  .replace("{{HINT}}", hint.replace(/</g, "&lt;"))
  .replace("{{PORTADA_URL}}", portadaURL);

const cssVars = `--bg: #0a0a0a; --accent: ${accent}; --glow: ${glowColor};`;
html = html.replace("<body>", `<body style="${cssVars}">`);

// Si no hay portada, ocultar el wrapper
if (!portadaURL) {
  html = html.replace('class="cover-wrapper"', 'class="cover-wrapper" style="display:none"');
}

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
