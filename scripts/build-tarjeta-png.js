/**
 * build-tarjeta-png.js — Triggui 2.0
 *
 * PNG definitiva homologada al Apps Script original.
 * Proporción real: 520×600 → escala 2x = 1040×1200
 * Sin float roto. Highlight altura completa. Footer propio PNG.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/* ═══════════════════════════════════════════════════════════════
   MAESTRO APPS SCRIPT — RATIONAL ORANGE
═══════════════════════════════════════════════════════════════ */

const APP = {
  cardWidth: 520,
  cardHeight: 600,
  scale: 2,

  background: "#FFFFFF",
  paper: "#F9F9F9",
  ink: "#1A1A1A",
  border: "#F39200",
  cardRadius: 20,

  blockRadius: 16,
  blockBackground: "linear-gradient(145deg, #FFFFFF 0%, #F5F5F5 100%)",
  blockBorder: "rgba(26, 26, 26, 0.05)",
  blockShadow: "0 8px 24px rgba(0, 0, 0, 0.03)",

  paddingCard: 5,
  gapBetweenBlocks: 14,

  block1PaddingY: 20,
  block1PaddingX: 22,
  block2PaddingY: 20,
  block2PaddingX: 22,

  coverWidth: 120,
  coverRadius: 4,
  coverBorder: "#EAEAEA",
  coverMaxHeight: 280,
  coverMarginBottom: 10,
  coverMarginLeft: 18,
  coverShadow: "0 15px 35px rgba(243, 146, 0, 0.15)",

  titleColor: "#1A1A1A",
  subtitleColor: "#F39200",
  paragraphColor: "#4A4A4A",
  footerTextColor: "#8B8880",

  titleFontSize: 28,
  titleLineHeight: 1.2,
  titleWeight: 700,
  titleLetterSpacing: "-0.5px",

  subtitleFontSize: 18,
  subtitleLineHeight: 1.4,
  subtitleWeight: 600,
  subtitleLetterSpacing: "0.15px",

  paragraphFontSize: 18,
  paragraphLineHeight: 1.7,
  paragraphWeight: 400,
  paragraphLetterSpacing: "0.2px",

  footerFontSize: 14,
  footerLineHeight: 1.4,

  authorChipBg: "#FFF3E0",
  authorChipColor: "#E65100",
  authorChipPaddingY: 4,
  authorChipPaddingX: 11,
  authorChipRadius: 12,
  authorChipWeight: 700,
  authorChipSize: 16,
  authorChipLetterSpacing: "0.3px",

  highlightPaddingY: 3,
  highlightPaddingX: 10,
  highlightRadius: 6,
  highlightWeight: 700,
  highlightShadow: "0 4px 12px rgba(243, 146, 0, 0.1)",

  universalPalette: [
    { name: "Clarity Orange", bg: "#F39200", ink: "#FFFFFF" },
    { name: "Stoic Charcoal", bg: "#333333", ink: "#FFFFFF" },
    { name: "Logic Blue", bg: "#0284C7", ink: "#FFFFFF" },
    { name: "Graphite Truth", bg: "#2C2C2C", ink: "#FFFFFF" },
    { name: "Morning Yellow", bg: "#FBBF24", ink: "#1A1A1A" }
  ],

  minContrastAA: 8.0
};

const PX = {
  canvasWidth: APP.cardWidth * APP.scale,
  canvasHeight: APP.cardHeight * APP.scale,

  outerPad: APP.paddingCard * APP.scale,
  gap: APP.gapBetweenBlocks * APP.scale,

  radius: APP.cardRadius * APP.scale,
  blockRadius: APP.blockRadius * APP.scale,

  block1PadY: APP.block1PaddingY * APP.scale,
  block1PadX: APP.block1PaddingX * APP.scale,
  block2PadY: APP.block2PaddingY * APP.scale,
  block2PadX: APP.block2PaddingX * APP.scale,

  coverWidth: APP.coverWidth * APP.scale,
  coverMinWidth: Math.round(APP.coverWidth * APP.scale * 0.84),
  coverMaxHeight: APP.coverMaxHeight * APP.scale,
  coverRadius: APP.coverRadius * APP.scale,
  coverMarginBottom: APP.coverMarginBottom * APP.scale,
  coverMarginLeft: APP.coverMarginLeft * APP.scale,

  titleSize: APP.titleFontSize * APP.scale,
  titleMinSize: Math.round(APP.titleFontSize * APP.scale * 0.82),

  subtitleSize: APP.subtitleFontSize * APP.scale,
  subtitleMinSize: Math.round(APP.subtitleFontSize * APP.scale * 0.84),

  paragraphSize: APP.paragraphFontSize * APP.scale,
  paragraphMinSize: Math.round(APP.paragraphFontSize * APP.scale * 0.84),

  footerSize: APP.footerFontSize * APP.scale,
  footerLogoHeight: 24 * APP.scale,
  footerHeight: 74 * APP.scale,

  authorChipSize: APP.authorChipSize * APP.scale,
  authorChipMinSize: Math.round(APP.authorChipSize * APP.scale * 0.84),
  authorChipPadY: APP.authorChipPaddingY * APP.scale,
  authorChipPadX: APP.authorChipPaddingX * APP.scale,
  authorChipRadius: APP.authorChipRadius * APP.scale,

  highlightPadY: Math.max(2, APP.highlightPaddingY * APP.scale),
  highlightPadX: Math.max(4, APP.highlightPaddingX * APP.scale),
  highlightRadius: APP.highlightRadius * APP.scale
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

function bestInkFor(bg, preferred, minAA = APP.minContrastAA) {
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
    ink: bestInkFor(preset.bg, preset.ink, APP.minContrastAA)
  };
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
    if (await fileExists(candidate)) return fileToDataURL(candidate);
  }

  return "";
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
    if (inner) {
      out += `<span class="highlight">${escapeWithBreaks(inner)}</span>`;
    }

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

  return {
    title: sanitizeShortText(source.titulo, sanitizeShortText(libro.tagline, "Una idea útil")),
    author: sanitizeShortText(bookMeta.autor || libro.autor || "", ""),
    top: ensureOneHighlight(source.parrafoTop || ""),
    subtitle: sanitizeShortText(source.subtitulo, "Hazlo ahora"),
    bottom: ensureOneHighlight(source.parrafoBot || "")
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
   HTML
═══════════════════════════════════════════════════════════════ */

const template = await fs.readFile("scripts/templates/tarjeta.html", "utf8");
const portadaURL = resolvePortadaURL(bookMeta, libro);
const portadaSource = resolvePortadaSource(bookMeta, libro, portadaURL);
const logoDataURL = await resolveLogoDataURL();

const display = buildPresentationCopy(libro, bookMeta);
const style = libro?.tarjeta?.style || libro?.tarjeta_presentacion?.style || {};

const accent = style.accent || APP.subtitleColor;
const subtitleColor = style.subtitleColor || accent;
const titleColor = style.titleColor || APP.titleColor;
const paragraphColor = style.paragraphColor || APP.paragraphColor;

const chipBg = style.authorChipBg || APP.authorChipBg;
const chipColor = style.authorChipColor || APP.authorChipColor;

const highlight = pickHighlightStyle(`${slug}__${display.top}__${display.bottom}`);

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
  .replace("{{PARRAFO_TOP}}", renderHighlightHTML(display.top))
  .replace("{{SUBTITULO}}", escapeHTML(display.subtitle))
  .replace("{{PARRAFO_BOT}}", renderHighlightHTML(display.bottom))
  .replace("{{FOOTER_SECTION}}", footerSection);

const cssVars = [
  `--canvas-width: ${PX.canvasWidth}px`,
  `--canvas-height: ${PX.canvasHeight}px`,
  `--outer-pad: ${PX.outerPad}px`,
  `--gap-between-blocks: ${PX.gap}px`,
  `--shell-radius: ${PX.radius}px`,
  `--block-radius: ${PX.blockRadius}px`,

  `--hero-pad-y: ${PX.block1PadY}px`,
  `--hero-pad-x: ${PX.block1PadX}px`,
  `--action-pad-y: ${PX.block2PadY}px`,
  `--action-pad-x: ${PX.block2PadX}px`,

  `--cover-width: ${PX.coverWidth}px`,
  `--cover-max-height: ${PX.coverMaxHeight}px`,
  `--cover-radius: ${PX.coverRadius}px`,
  `--cover-margin-bottom: ${PX.coverMarginBottom}px`,
  `--cover-margin-left: ${PX.coverMarginLeft}px`,

  `--title-size: ${PX.titleSize}px`,
  `--subtitle-size: ${PX.subtitleSize}px`,
  `--paragraph-size: ${PX.paragraphSize}px`,
  `--footer-size: ${PX.footerSize}px`,
  `--footer-height: ${PX.footerHeight}px`,
  `--footer-logo-height: ${PX.footerLogoHeight}px`,

  `--author-chip-size: ${PX.authorChipSize}px`,
  `--author-chip-pad-y: ${PX.authorChipPadY}px`,
  `--author-chip-pad-x: ${PX.authorChipPadX}px`,
  `--author-chip-radius: ${PX.authorChipRadius}px`,

  `--highlight-pad-y: ${PX.highlightPadY}px`,
  `--highlight-pad-x: ${PX.highlightPadX}px`,
  `--highlight-radius: ${PX.highlightRadius}px`,

  `--paper: ${APP.paper}`,
  `--background: ${APP.background}`,
  `--border: ${APP.border}`,
  `--block-background: ${APP.blockBackground}`,
  `--block-border: ${APP.blockBorder}`,
  `--block-shadow: ${APP.blockShadow}`,
  `--cover-shadow: ${APP.coverShadow}`,

  `--title-color: ${titleColor}`,
  `--subtitle-color: ${subtitleColor}`,
  `--paragraph-color: ${paragraphColor}`,
  `--footer-color: ${APP.footerTextColor}`,
  `--author-chip-bg: ${chipBg}`,
  `--author-chip-color: ${chipColor}`,

  `--highlight-bg: ${highlight.bg}`,
  `--highlight-ink: ${highlight.ink}`,
  `--highlight-shadow: ${APP.highlightShadow}`
].join("; ");

html = html.replace("<body>", `<body style="${cssVars}">`);

/* ═══════════════════════════════════════════════════════════════
   RENDER
═══════════════════════════════════════════════════════════════ */

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.setViewportSize({
  width: PX.canvasWidth,
  height: PX.canvasHeight
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
    await page.waitForTimeout(200);
  } catch {
    console.log("   ⚠️ Portada no cargó en 10s — continuando");
  }
}

await page.evaluate((limits) => {
  const shell = document.getElementById("shell");
  const body = document.getElementById("shellBody");
  const hero = document.getElementById("heroCard");
  const heroContent = document.getElementById("heroContent");
  const action = document.getElementById("actionCard");
  const actionContent = document.getElementById("actionContent");
  const footer = document.getElementById("footerCard");

  const title = document.getElementById("title");
  const author = document.getElementById("authorChip");
  const subtitle = document.getElementById("subtitle");
  const top = document.getElementById("parrafoTop");
  const bottom = document.getElementById("parrafoBot");
  const cover = document.querySelector(".cover");

  const px = (el, prop) => el ? (parseFloat(getComputedStyle(el)[prop]) || 0) : 0;
  const setPx = (el, prop, value) => { if (el) el.style[prop] = `${value}px`; };

  let guard = 0;
  while (body.scrollHeight > body.clientHeight && guard < 220) {
    let changed = false;

    const titleSize = px(title, "fontSize");
    const paraTop = px(top, "fontSize");
    const paraBottom = px(bottom, "fontSize");
    const subSize = px(subtitle, "fontSize");
    const authorSize = px(author, "fontSize");
    const coverWidth = px(cover, "width");

    if (title && titleSize > limits.titleMin) {
      setPx(title, "fontSize", titleSize - 0.45);
      changed = true;
    }
    if (top && paraTop > limits.paragraphMin) {
      setPx(top, "fontSize", paraTop - 0.18);
      changed = true;
    }
    if (bottom && paraBottom > limits.paragraphMin) {
      setPx(bottom, "fontSize", paraBottom - 0.18);
      changed = true;
    }
    if (subtitle && subSize > limits.subtitleMin && guard % 2 === 0) {
      setPx(subtitle, "fontSize", subSize - 0.14);
      changed = true;
    }
    if (author && authorSize > limits.authorMin && guard % 3 === 0) {
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

  const gap = parseFloat(getComputedStyle(body).gap) || 28;
  const footerHeight = footer.getBoundingClientRect().height;
  const available = body.clientHeight - footerHeight - gap * 2;

  const heroNeed = Math.ceil(heroContent.scrollHeight + 8);
  const actionNeed = Math.ceil(actionContent.scrollHeight + 8);

  let heroHeight = heroNeed;
  let actionHeight = actionNeed;

  if (heroNeed + actionNeed <= available) {
    const extra = available - (heroNeed + actionNeed);
    heroHeight += Math.round(extra * 0.48);
    actionHeight += extra - Math.round(extra * 0.48);
  } else {
    heroHeight = Math.max(360, Math.round(available * 0.56));
    actionHeight = available - heroHeight;
  }

  hero.style.height = `${heroHeight}px`;
  action.style.height = `${actionHeight}px`;

  let guardBottom = 0;
  while (actionContent.scrollHeight > actionContent.clientHeight && guardBottom < 100) {
    let changed = false;
    const subSize = px(subtitle, "fontSize");
    const bottomSize = px(bottom, "fontSize");

    if (subtitle && subSize > limits.subtitleMin) {
      setPx(subtitle, "fontSize", subSize - 0.12);
      changed = true;
    }
    if (bottom && bottomSize > limits.paragraphMin) {
      setPx(bottom, "fontSize", bottomSize - 0.15);
      changed = true;
    }

    if (!changed) break;
    guardBottom += 1;
  }

  if (actionContent.scrollHeight > actionContent.clientHeight && bottom) {
    const availableBottom = actionContent.clientHeight - (subtitle ? subtitle.getBoundingClientRect().height : 0) - 8;
    const lineHeight = px(bottom, "lineHeight") || (px(bottom, "fontSize") * 1.7);
    const lines = Math.max(3, Math.floor(availableBottom / lineHeight));

    bottom.style.display = "-webkit-box";
    bottom.style.webkitBoxOrient = "vertical";
    bottom.style.webkitLineClamp = String(lines);
    bottom.style.overflow = "hidden";
  }
}, {
  titleMin: PX.titleMinSize,
  subtitleMin: PX.subtitleMinSize,
  paragraphMin: PX.paragraphMinSize,
  authorMin: PX.authorChipMinSize,
  coverMin: PX.coverMinWidth
});

await page.waitForTimeout(180);

const outPath = path.join(outDir, "tarjeta.png");
await page.screenshot({
  path: outPath,
  type: "png",
  clip: { x: 0, y: 0, width: PX.canvasWidth, height: PX.canvasHeight }
});

await browser.close();

const stats = await fs.stat(outPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`✅ Tarjeta generada: ${outPath}`);
console.log(`📏 ${sizeMB} MB | ${PX.canvasWidth}×${PX.canvasHeight}px`);
console.log(`🎨 Título visible: "${display.title}"`);
console.log(`✍️ Autor: ${display.author}`);
console.log(`🖼️ Portada: ${portadaURL ? portadaSource : "tipográfica"}`);
console.log(`📝 Top: ${stripHighlightTags(display.top)}`);
console.log(`⚡ Bottom: ${stripHighlightTags(display.bottom)}`);
