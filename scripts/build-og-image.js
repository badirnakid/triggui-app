/**
 * build-og-image.js — Paso 5 del pipeline Triggui 2.0
 *
 * Genera OG image PNG 1200×630 para preview de link en WhatsApp.
 * Composición final:
 * - una sola frase fuerte y grande
 * - portada del libro
 * - logo blanco real de Triggui
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

async function fileToDataURL(filePath) {
  const absPath = path.resolve(filePath);
  const ext = path.extname(absPath).toLowerCase();
  const mime =
    ext === ".png" ? "image/png" :
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
    ext === ".webp" ? "image/webp" :
    null;

  if (!mime) return "";

  const buffer = await fs.readFile(absPath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function resolveBrandLogoDataURL() {
  const candidates = [
    "public/trigguiletrasblanco2.png",
    "public/trigguiletrasblanco.png"
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      return await fileToDataURL(candidate);
    }
  }

  return "";
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

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function clampText(text, max) {
  const clean = normalizeText(text);
  if (!clean) return "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 3).trim()}...`;
}

function toArrayOfStrings(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => toArrayOfStrings(item))
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[|•,;/]+/g)
      .map((item) => normalizeText(item))
      .filter(Boolean);
  }

  return [];
}

function uniqueStrings(values) {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const clean = normalizeText(value);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }

  return output;
}

function stripExplicitBookRefs(text, titulo = "", autor = "") {
  let value = normalizeText(stripHighlightTags(text));
  if (!value) return "";

  for (const term of [titulo, autor]) {
    const cleanTerm = normalizeText(term);
    if (!cleanTerm) continue;
    value = value.replace(new RegExp(cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
  }

  value = value
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .replace(/^[,.;:!?·\-\s]+|[,.;:!?·\-\s]+$/g, "");

  return normalizeText(value);
}

function stripEmoji(text) {
  let value = String(text || "");
  try {
    value = value.replace(/\p{Extended_Pictographic}/gu, "");
  } catch {
    value = value.replace(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
      ""
    );
  }
  return normalizeText(value);
}

function phraseIsWeak(text) {
  const value = normalizeText(text).toLowerCase();

  if (!value) return true;

  const weakPatterns = [
    /\binvita a\b/,
    /\binvitar a\b/,
    /\bexplora\b/,
    /\bexplorar\b/,
    /\bdescubre\b/,
    /\bdescubrir\b/,
    /\breflexiona\b/,
    /\breflexionar\b/,
    /\bnos recuerda\b/,
    /\bnos muestra\b/,
    /\bhabla de\b/,
    /\btrata de\b/,
    /\bpropone\b/,
    /\bpropone una\b/,
    /\buna reflexión\b/,
    /\buna mirada\b/,
    /\bmuestra cómo\b/,
    /\bpermite\b.+\balcanzar\b/
  ];

  return weakPatterns.some((re) => re.test(value));
}

function scorePhrase(text) {
  const value = normalizeText(text);
  if (!value) return -999;

  let score = 0;
  const len = value.length;

  if (len >= 22 && len <= 74) score += 40;
  else if (len >= 16 && len <= 88) score += 22;
  else score -= 18;

  if (len >= 28 && len <= 58) score += 16;
  if (!/[,:;()]/.test(value)) score += 10;
  if ((value.match(/,/g) || []).length === 0) score += 8;
  if (/[áéíóúñ]/i.test(value)) score += 2;

  const strongPatterns = [
    /\bdeja\b/,
    /\bprotege\b/,
    /\brecupera\b/,
    /\bordena\b/,
    /\bdetén\b/,
    /\bsuelta\b/,
    /\brespira\b/,
    /\bcorta\b/,
    /\belige\b/,
    /\bquita\b/,
    /\bpon\b/,
    /\babre\b/,
    /\brenuncia\b/,
    /\bvuelve\b/,
    /\bhabita\b/,
    /\bdeténte\b/,
    /\baprende\b/,
    /\bcuida\b/,
    /\bescucha\b/
  ];

  if (strongPatterns.some((re) => re.test(value.toLowerCase()))) score += 10;
  if (phraseIsWeak(value)) score -= 55;
  if (len > 90) score -= 14;
  if (len < 18) score -= 18;

  return score;
}

function pickOgHeadline(bookMeta, libro) {
  const titulo = bookMeta?.titulo || libro?.titulo || "";
  const autor = bookMeta?.autor || libro?.autor || "";

  const frases = uniqueStrings([
    ...toArrayOfStrings(libro?.frases),
    ...toArrayOfStrings(bookMeta?.frases)
  ])
    .map((item) => stripEmoji(stripExplicitBookRefs(item, titulo, autor)))
    .filter(Boolean);

  const ranked = frases
    .map((phrase) => ({ phrase, score: scorePhrase(phrase) }))
    .sort((a, b) => b.score - a.score);

  const best = clampText((ranked[0]?.phrase || "").trim(), 78);
  if (best) return best;

  const tarjeta = libro?.tarjeta || {};
  const fallback = stripEmoji(
    stripExplicitBookRefs(
      tarjeta.titulo ||
      tarjeta.subtitulo ||
      stripHighlightTags(tarjeta.parrafoTop || "") ||
      stripHighlightTags(tarjeta.parrafoBot || "") ||
      "",
      titulo,
      autor
    )
  );

  return clampText(fallback || "Triggui", 78);
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
const accentSoft = withAlpha(accent, "24") || "#E35D3024";
const accentGlow = withAlpha(accent, "42") || "#E35D3042";

const portadaURL = resolvePortadaURL(bookMeta, libro);
const portadaSource = resolvePortadaSource(bookMeta, libro, portadaURL);

const headline = pickOgHeadline(bookMeta, libro);
const brandLogoDataURL = await resolveBrandLogoDataURL();

const coverSection = portadaURL
  ? `<img class="cover" src="${portadaURL}" alt="Portada editorial" />`
  : `<div class="cover-fallback">TRIGGUI</div>`;

const brandSection = brandLogoDataURL
  ? `<img src="${brandLogoDataURL}" alt="Triggui" />`
  : `<div class="brand-fallback">triggui</div>`;

let html = template
  .replace("{{HEADLINE}}", escapeHTML(headline))
  .replace("{{COVER_SECTION}}", coverSection)
  .replace("{{BRAND_SECTION}}", brandSection);

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

await page.evaluate(async () => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
});

if (portadaURL) {
  try {
    await page.waitForSelector(".cover", { state: "visible", timeout: 8000 });
    await page.waitForTimeout(350);
  } catch {
    console.log("   ⚠️  Portada no cargó — OG sin portada");
  }
}

await page.evaluate(() => {
  const headline = document.querySelector(".headline");
  const content = document.querySelector(".content");
  const coverWrap = document.querySelector(".cover-wrap");

  const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]) || 0;
  const setPx = (el, prop, value) => { if (el) el.style[prop] = `${value}px`; };

  let guard = 0;
  while (headline && content && content.scrollHeight > content.clientHeight && guard < 120) {
    const size = px(headline, "fontSize");
    const line = px(headline, "lineHeight");
    const spacing = px(headline, "letterSpacing");

    if (size <= 68) break;

    setPx(headline, "fontSize", size - 1);
    if (line > 0) setPx(headline, "lineHeight", Math.max(64, line - 1));
    if (!Number.isNaN(spacing)) setPx(headline, "letterSpacing", Math.min(-0.6, spacing + 0.04));

    guard += 1;
  }

  if (coverWrap && headline && px(headline, "fontSize") > 84) {
    const width = px(coverWrap, "width");
    if (width > 350) setPx(coverWrap, "width", 350);
  }
});

await page.waitForTimeout(180);

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
