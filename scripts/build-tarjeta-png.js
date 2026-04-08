/**
 * build-tarjeta-png.js — Triggui 2.0
 *
 * PNG definitiva estilo Apps Script.
 * Tamaño exacto: 1066 × 1600
 * Una sola tarjeta continua, tipografía y proporciones copiadas del Apps Script.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/* ═══════════════════════════════════════════════════════════════
   CONFIG MAESTRA — APPS SCRIPT (Rational Orange)
═══════════════════════════════════════════════════════════════ */

const APP = {
  baseWidth: 520,
  targetWidth: 1066,
  targetHeight: 1600,

  background: "#FFFFFF",
  paper: "#F9F9F9",
  ink: "#1A1A1A",
  border: "#F39200",
  cardRadius: 20,
  cardShadow: "0 12px 28px rgba(0,0,0,0.05)",

  coverWidth: 120,
  coverBorder: "#EAEAEA",
  coverRadius: 4,
  coverMaxHeight: 280,
  coverMarginTop: 0,
  coverMarginRight: 0,
  coverMarginBottom: 10,
  coverMarginLeft: 18,
  coverShadow: "0 15px 35px rgba(243,146,0,0.15)",

  serif: "Georgia, 'Times New Roman', serif",
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",

  fontTitleSize: 28,
  fontTitleLine: 1.2,
  fontTitleWeight: 700,

  fontSubtitleSize: 18,
  fontSubtitleLine: 1.4,
  fontSubtitleWeight: 600,

  fontParagraphSize: 18,
  fontParagraphLine: 1.7,
  fontParagraphWeight: 400,

  fontFooterSize: 14,
  fontFooterLine: 1.4,

  titleLetterSpacing: -0.5,
  subtitleLetterSpacing: 0.15,
  paragraphLetterSpacing: 0.2,

  titleColor: "#1A1A1A",
  subtitleColor: "#F39200",
  paragraphColor: "#4A4A4A",
  footerTextColor: "#8B8880",

  paddingCard: 5,
  gapBetweenBlocks: 14,

  blockRadius: 16,
  blockBorder: "rgba(26,26,26,0.05)",
  blockBackground: "linear-gradient(145deg, #FFFFFF 0%, #F5F5F5 100%)",
  blockShadow: "0 8px 24px rgba(0,0,0,0.03)",
  block1PaddingY: 20,
  block1PaddingX: 22,

  authorChipEnabled: true,
  authorChipBg: "#FFF3E0",
  authorChipColor: "#E65100",
  authorChipSize: 16,
  authorChipWeight: 700,
  authorChipPadY: 4,
  authorChipPadX: 11,
  authorChipRadius: 12,

  highlightWeight: 700,
  highlightPaddingY: 3,
  highlightPaddingX: 10,
  highlightRadius: 6,
  highlightShadow: "0 4px 12px rgba(243,146,0,0.1)",

  universalPalette: [
    { name: "Clarity Orange", bg: "#F39200", ink: "#FFFFFF" },
    { name: "Stoic Charcoal", bg: "#333333", ink: "#FFFFFF" },
    { name: "Logic Blue", bg: "#0284C7", ink: "#FFFFFF" },
    { name: "Graphite Truth", bg: "#2C2C2C", ink: "#FFFFFF" },
    { name: "Morning Yellow", bg: "#FBBF24", ink: "#1A1A1A" }
  ]
};

const SCALE = APP.targetWidth / APP.baseWidth;

const PX = {
  width: APP.targetWidth,
  height: APP.targetHeight,

  cardRadius: Math.round(APP.cardRadius * SCALE),
  outerPad: Math.round(APP.paddingCard * SCALE),

  blockRadius: Math.round(APP.blockRadius * SCALE),
  blockPadY: Math.round(APP.block1PaddingY * SCALE),
  blockPadX: Math.round(APP.block1PaddingX * SCALE),

  coverWidth: Math.round(APP.coverWidth * SCALE),
  coverMinWidth: Math.round(APP.coverWidth * SCALE * 0.78),
  coverMaxHeight: Math.round(APP.coverMaxHeight * SCALE),
  coverMarginBottom: Math.round(APP.coverMarginBottom * SCALE),
  coverMarginLeft: Math.round(APP.coverMarginLeft * SCALE),

  titleSize: APP.fontTitleSize * SCALE,
  titleMinSize: APP.fontTitleSize * SCALE * 0.78,

  paragraphSize: APP.fontParagraphSize * SCALE,
  paragraphMinSize: APP.fontParagraphSize * SCALE * 0.80,

  authorChipSize: APP.authorChipSize * SCALE,
  authorChipMinSize: APP.authorChipSize * SCALE * 0.84,
  authorChipPadY: APP.authorChipPadY * SCALE,
  authorChipPadX: APP.authorChipPadX * SCALE,
  authorChipRadius: APP.authorChipRadius * SCALE,

  footerSize: APP.fontFooterSize * SCALE,
  footerHeight: Math.round(82 * SCALE),
  footerLogoHeight: Math.round(24 * SCALE),

  highlightPadY: Math.max(2, Math.round(APP.highlightPaddingY * SCALE)),
  highlightPadX: Math.max(4, Math.round(APP.highlightPaddingX * SCALE)),
  highlightRadius: Math.round(APP.highlightRadius * SCALE)
};

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
  const candidates = [envPath, "contenido_edicion.json", "contenido.json"].filter(Boolean);

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

async function resolveLogoDataURL() {
  const candidates = [
    "public/trigguiletrascolor3.png",
    "public/trigguiletras2.png",
    "public/trigguiletras.png",
    "public/trigguiletrasblanco.png",
    "public/trigguiletrasblanco2.png"
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

function escapeWithBreaks(text) {
  return escapeHTML(text).replace(/\n/g, "<br>");
}

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
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

  return text
    .replace(/\[H\]\s*\[\/H\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function stripHighlightTags(text) {
  return normalizeHighlightSyntax(text).replace(/\[H\]|\[\/H\]/gi, "");
}

function countHighlights(text) {
  return (normalizeHighlightSyntax(text).match(/\[H\](.*?)\[\/H\]/gis) || [])
    .map((m) => m.replace(/\[H\]|\[\/H\]/gi, "").trim())
    .filter(Boolean).length;
}

function ensureOneHighlight(text) {
  let normalized = normalizeHighlightSyntax(text);
  if (countHighlights(normalized) >= 1) return normalized;

  const plain = stripHighlightTags(normalized);
  const segments = plain
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 18);

  const chosen = segments[0] || plain;
  if (!chosen) return normalized;

  const safe = chosen.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return normalizeHighlightSyntax(normalized.replace(new RegExp(safe), `[H]${chosen}[/H]`));
}

function sanitizeShortText(text, fallback = "") {
  const value = stripHighlightTags(String(text || ""))
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,.;:!?·\-\s]+|[,.;:!?·\-\s]+$/g, "");
  return value || fallback;
}

function comparableText(text) {
  return stripHighlightTags(String(text || ""))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tooSimilar(a, b) {
  const aa = comparableText(a);
  const bb = comparableText(b);
  if (!aa || !bb) return false;
  if (aa === bb) return true;
  if ((aa.includes(bb) || bb.includes(aa)) && Math.min(aa.length, bb.length) > 38) return true;
  return false;
}

function hexToRgb(hex) {
  const clean = String(hex || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(1, 3), 16),
    g: parseInt(clean.slice(3, 5), 16),
    b: parseInt(clean.slice(5, 7), 16)
  };
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

function bestInkFor(bg, preferred, minAA = 7) {
  if (preferred && contrastRatio(preferred, bg) >= minAA) return preferred;
  const black = "#000000";
  const white = "#FFFFFF";
  return contrastRatio(black, bg) >= contrastRatio(white, bg) ? black : white;
}

function hash32(s) {
  let h = 2166136261 >>> 0;
  const text = String(s || "");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function rng() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleDeterministic(arr, seed) {
  const copy = arr.slice();
  const rnd = mulberry32(seed || 123456789);
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickHighlightStyle(seedText) {
  const seed = hash32(seedText || "triggui");
  const preset = shuffleDeterministic(APP.universalPalette, seed)[0];
  return {
    bg: preset.bg,
    ink: bestInkFor(preset.bg, preset.ink, 7)
  };
}

function renderHighlightHTML(text) {
  const normalized = ensureOneHighlight(text);
  if (!normalized) return "";

  const re = /\[H\](.*?)\[\/H\]/gis;
  let out = "";
  let last = 0;
  let match;

  while ((match = re.exec(normalized)) !== null) {
    const before = normalized.slice(last, match.index);
    if (before) out += escapeWithBreaks(before);

    const inner = String(match[1] || "").trim();
    if (inner) out += `<span class="highlight">${escapeWithBreaks(inner)}</span>`;
    last = re.lastIndex;
  }

  const after = normalized.slice(last);
  if (after) out += escapeWithBreaks(after);

  return out;
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

function buildPresentationCopy(libro, bookMeta) {
  const source = libro.tarjeta_presentacion || libro.tarjeta || {};

  const title = sanitizeShortText(source.titulo, sanitizeShortText(libro.tagline, "Una idea útil"));
  const author = sanitizeShortText(bookMeta.autor || libro.autor || "", "");
  const top = ensureOneHighlight(source.parrafoTop || "");
  const bottom = ensureOneHighlight(source.parrafoBot || "");

  const bodyParts = [];
  if (top) bodyParts.push(renderHighlightHTML(top));
  if (bottom && !tooSimilar(top, bottom)) bodyParts.push(renderHighlightHTML(bottom));

  return {
    title,
    author,
    bodyHTML: bodyParts.join(" "),
    bodyPlain: [stripHighlightTags(top), stripHighlightTags(bottom)].filter(Boolean).join(" ")
  };
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
   BUILD HTML
═══════════════════════════════════════════════════════════════ */

const template = await fs.readFile("scripts/templates/tarjeta.html", "utf8");
const portadaURL = resolvePortadaURL(bookMeta, libro);
const portadaSource = resolvePortadaSource(bookMeta, libro, portadaURL);
const logoDataURL = await resolveLogoDataURL();

const display = buildPresentationCopy(libro, bookMeta);
const style = libro?.tarjeta?.style || libro?.tarjeta_presentacion?.style || {};

const titleColor = style.titleColor || APP.titleColor;
const paragraphColor = style.paragraphColor || APP.paragraphColor;
const chipBg = style.authorChipBg || APP.authorChipBg;
const chipColor = style.authorChipColor || APP.authorChipColor;
const highlight = pickHighlightStyle(`${slug}__${display.bodyPlain}`);

const portadaSection = portadaURL
  ? `<img class="cover" src="${portadaURL}" alt="Portada de ${escapeHTML(bookMeta.titulo || libro.titulo || "")}" />`
  : `<div class="cover-fallback">Triggui</div>`;

const footerSection = logoDataURL
  ? `
    <div class="footer-brand">
      <img src="${logoDataURL}" alt="Triggui" />
      <div class="footer-meta">@triggui | triggui.com</div>
    </div>`
  : `
    <div class="footer-brand">
      <div class="footer-fallback">triggui®</div>
      <div class="footer-meta">@triggui | triggui.com</div>
    </div>`;

let html = template
  .replace("{{PORTADA_SECTION}}", portadaSection)
  .replace("{{TITULO}}", escapeHTML(display.title))
  .replace("{{AUTOR}}", escapeHTML(display.author))
  .replace("{{BODY_HTML}}", display.bodyHTML)
  .replace("{{FOOTER_SECTION}}", footerSection);

const cssVars = [
  `--canvas-width:${PX.width}px`,
  `--canvas-height:${PX.height}px`,
  `--outer-pad:${PX.outerPad}px`,
  `--card-radius:${PX.cardRadius}px`,
  `--block-radius:${PX.blockRadius}px`,
  `--block-pad-y:${PX.blockPadY}px`,
  `--block-pad-x:${PX.blockPadX}px`,
  `--cover-width:${PX.coverWidth}px`,
  `--cover-max-height:${PX.coverMaxHeight}px`,
  `--cover-margin-bottom:${PX.coverMarginBottom}px`,
  `--cover-margin-left:${PX.coverMarginLeft}px`,
  `--title-size:${PX.titleSize}px`,
  `--paragraph-size:${PX.paragraphSize}px`,
  `--author-chip-size:${PX.authorChipSize}px`,
  `--author-chip-pad-y:${PX.authorChipPadY}px`,
  `--author-chip-pad-x:${PX.authorChipPadX}px`,
  `--author-chip-radius:${PX.authorChipRadius}px`,
  `--footer-size:${PX.footerSize}px`,
  `--footer-height:${PX.footerHeight}px`,
  `--footer-logo-height:${PX.footerLogoHeight}px`,
  `--highlight-pad-y:${PX.highlightPadY}px`,
  `--highlight-pad-x:${PX.highlightPadX}px`,
  `--highlight-radius:${PX.highlightRadius}px`,
  `--paper:${APP.paper}`,
  `--background:${APP.background}`,
  `--border:${APP.border}`,
  `--card-shadow:${APP.cardShadow}`,
  `--block-background:${APP.blockBackground}`,
  `--block-border:${APP.blockBorder}`,
  `--block-shadow:${APP.blockShadow}`,
  `--cover-shadow:${APP.coverShadow}`,
  `--title-color:${titleColor}`,
  `--paragraph-color:${paragraphColor}`,
  `--footer-color:${APP.footerTextColor}`,
  `--author-chip-bg:${chipBg}`,
  `--author-chip-color:${chipColor}`,
  `--highlight-bg:${highlight.bg}`,
  `--highlight-ink:${highlight.ink}`,
  `--highlight-shadow:${APP.highlightShadow}`
].join(";");

html = html.replace("<body>", `<body style="${cssVars}">`);

/* ═══════════════════════════════════════════════════════════════
   RENDER
═══════════════════════════════════════════════════════════════ */

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.setViewportSize({
  width: PX.width,
  height: PX.height
});

await page.setContent(html, { waitUntil: "networkidle" });

await page.evaluate(async () => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
});

if (portadaURL) {
  try {
    await page.waitForSelector(".cover", { state: "visible", timeout: 10000 });
    await page.waitForTimeout(180);
  } catch {
    console.log("   ⚠️ Portada no cargó en 10s — continuando");
  }
}

await page.evaluate((limits) => {
  const content = document.getElementById("content");
  const title = document.getElementById("title");
  const author = document.getElementById("authorChip");
  const body = document.getElementById("bodyText");
  const cover = document.querySelector(".cover");

  const px = (el, prop) => el ? (parseFloat(getComputedStyle(el)[prop]) || 0) : 0;
  const setPx = (el, prop, value) => { if (el) el.style[prop] = `${value}px`; };

  let guard = 0;
  while (content && content.scrollHeight > content.clientHeight && guard < 240) {
    let changed = false;

    const titleSize = px(title, "fontSize");
    const bodySize = px(body, "fontSize");
    const authorSize = px(author, "fontSize");
    const coverWidth = px(cover, "width");

    if (title && titleSize > limits.titleMin) {
      setPx(title, "fontSize", titleSize - 0.5);
      changed = true;
    }

    if (body && bodySize > limits.bodyMin) {
      setPx(body, "fontSize", bodySize - 0.18);
      changed = true;
    }

    if (author && authorSize > limits.authorMin && guard % 2 === 0) {
      setPx(author, "fontSize", authorSize - 0.10);
      changed = true;
    }

    if (cover && coverWidth > limits.coverMin && guard % 3 === 0) {
      setPx(cover, "width", coverWidth - 0.5);
      changed = true;
    }

    if (!changed) break;
    guard += 1;
  }
}, {
  titleMin: PX.titleMinSize,
  bodyMin: PX.paragraphMinSize,
  authorMin: PX.authorChipMinSize,
  coverMin: PX.coverMinWidth
});

await page.waitForTimeout(120);

const outPath = path.join(outDir, "tarjeta.png");
await page.screenshot({
  path: outPath,
  type: "png",
  clip: { x: 0, y: 0, width: PX.width, height: PX.height }
});

await browser.close();

const stats = await fs.stat(outPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`✅ Tarjeta generada: ${outPath}`);
console.log(`📏 ${sizeMB} MB | ${PX.width}×${PX.height}px`);
console.log(`🎨 Título visible: "${display.title}"`);
console.log(`✍️ Autor: ${display.author}`);
console.log(`🖼️ Portada: ${portadaURL ? portadaSource : "tipográfica"}`);
console.log(`📝 Body: ${display.bodyPlain}`);
