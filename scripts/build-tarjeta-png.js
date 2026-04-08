/**
 * build-tarjeta-png.js — Paso 4 del pipeline Triggui 2.0
 *
 * PNG 1080x1920 homologada contra la tarjeta viva usando
 * las proporciones maestras del Apps Script original.
 * Solo cambia el footer: logo + @triggui | triggui.com
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/* ═══════════════════════════════════════════════════════════════
   BASE MAESTRA — EXTRAÍDA DEL APPS SCRIPT OBJECT.ASSIGN
═══════════════════════════════════════════════════════════════ */

const APP_BASE = {
  cardWidth: 520,
  cardHeight: 600,
  cardRadius: 20,

  paddingCard: 5,
  gapBetweenBlocks: 14,

  blockRadius: 16,
  block1PaddingY: 20,
  block1PaddingX: 22,
  block2PaddingY: 20,
  block2PaddingX: 22,

  coverWidth: 120,
  coverMaxHeight: 280,
  coverRadius: 4,
  coverMarginBottom: 10,
  coverMarginLeft: 18,

  titleSize: 28,
  titleLine: 1.2,
  titleWeight: 700,

  subtitleSize: 18,
  subtitleLine: 1.4,
  subtitleWeight: 600,

  paragraphSize: 18,
  paragraphLine: 1.7,
  paragraphWeight: 400,

  footerSize: 14,
  footerLine: 1.4,

  authorChipSize: 16,
  authorChipWeight: 700,
  authorChipPadY: 4,
  authorChipPadX: 11,
  authorChipRadius: 12,

  highlightPadY: 3,
  highlightPadX: 10,
  highlightRadius: 6,

  titleColor: "#1A1A1A",
  subtitleColor: "#F39200",
  paragraphColor: "#4A4A4A",
  footerTextColor: "#8B8880",

  authorChipBg: "#FFF3E0",
  authorChipColor: "#E65100",

  paper: "#F9F9F9",
  background: "#FFFFFF",
  border: "#F39200",

  blockBackground: "linear-gradient(145deg, #FFFFFF 0%, #F5F5F5 100%)",
  blockBorder: "rgba(26, 26, 26, 0.05)",
  blockShadow: "0 8px 24px rgba(0, 0, 0, 0.03)",

  coverBorder: "#EAEAEA",
  coverShadow: "0 15px 35px rgba(243, 146, 0, 0.15)",

  universalPalette: [
    { name: "Clarity Orange", bg: "#F39200", ink: "#FFFFFF" },
    { name: "Stoic Charcoal", bg: "#333333", ink: "#FFFFFF" },
    { name: "Logic Blue", bg: "#0284C7", ink: "#FFFFFF" },
    { name: "Graphite Truth", bg: "#2C2C2C", ink: "#FFFFFF" },
    { name: "Morning Yellow", bg: "#FBBF24", ink: "#1A1A1A" }
  ]
};

const PNG = {
  canvasWidth: 1080,
  canvasHeight: 1920,
  scale: 1.73
};

const SCALED = {
  shellWidth: Math.round(APP_BASE.cardWidth * PNG.scale),
  shellHeight: Math.round(APP_BASE.cardHeight * PNG.scale),
  shellRadius: Math.round(APP_BASE.cardRadius * PNG.scale),

  outerPad: Math.round(APP_BASE.paddingCard * PNG.scale),
  gap: Math.round(APP_BASE.gapBetweenBlocks * PNG.scale),

  blockRadius: Math.round(APP_BASE.blockRadius * PNG.scale),

  block1PadY: Math.round(APP_BASE.block1PaddingY * PNG.scale),
  block1PadX: Math.round(APP_BASE.block1PaddingX * PNG.scale),
  block2PadY: Math.round(APP_BASE.block2PaddingY * PNG.scale),
  block2PadX: Math.round(APP_BASE.block2PaddingX * PNG.scale),

  coverWidth: Math.round(APP_BASE.coverWidth * PNG.scale),
  coverMinWidth: Math.round(APP_BASE.coverWidth * 1.35),
  coverMaxHeight: Math.round(APP_BASE.coverMaxHeight * PNG.scale),
  coverRadius: Math.round(APP_BASE.coverRadius * PNG.scale),
  coverMarginBottom: Math.round(APP_BASE.coverMarginBottom * PNG.scale),
  coverMarginLeft: Math.round(APP_BASE.coverMarginLeft * PNG.scale),

  titleSize: Math.round(APP_BASE.titleSize * PNG.scale),
  titleMinSize: Math.round(APP_BASE.titleSize * PNG.scale * 0.84),

  subtitleSize: Math.round(APP_BASE.subtitleSize * PNG.scale),
  subtitleMinSize: Math.round(APP_BASE.subtitleSize * PNG.scale * 0.86),

  paragraphSize: Math.round(APP_BASE.paragraphSize * PNG.scale),
  paragraphMinSize: Math.round(APP_BASE.paragraphSize * PNG.scale * 0.86),

  authorChipSize: Math.round(APP_BASE.authorChipSize * PNG.scale),
  authorChipMinSize: Math.round(APP_BASE.authorChipSize * PNG.scale * 0.85),

  authorChipPadY: Math.round(APP_BASE.authorChipPadY * PNG.scale),
  authorChipPadX: Math.round(APP_BASE.authorChipPadX * PNG.scale),
  authorChipRadius: Math.round(APP_BASE.authorChipRadius * PNG.scale),

  footerHeight: Math.round(74 * PNG.scale),
  footerLogoHeight: Math.round(24 * PNG.scale),
  footerTextSize: Math.round(APP_BASE.footerSize * PNG.scale),

  highlightPadY: Math.max(2, Math.round(APP_BASE.highlightPadY * PNG.scale)),
  highlightPadX: Math.max(4, Math.round(APP_BASE.highlightPadX * PNG.scale)),
  highlightRadius: Math.round(APP_BASE.highlightRadius * PNG.scale)
};

/* ═══════════════════════════════════════════════════════════════
   HELPERS DE ARCHIVO
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

/* ═══════════════════════════════════════════════════════════════
   HELPERS DE TEXTO
═══════════════════════════════════════════════════════════════ */

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
    .filter((s) => s.length >= 22);

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

/* ═══════════════════════════════════════════════════════════════
   HELPERS DE COLOR
═══════════════════════════════════════════════════════════════ */

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

function hexToRgb(hex) {
  const clean = String(hex || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(clean)) return null;

  return {
    r: parseInt(clean.slice(1, 3), 16),
    g: parseInt(clean.slice(3, 5), 16),
    b: parseInt(clean.slice(5, 7), 16)
  };
}

function toRgba(hex, alpha = 1) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0,0,0,${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function mixHex(hexA, hexB, weight = 0.5) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA || hexB || "#000000";

  const w = Math.max(0, Math.min(1, weight));
  const rgb = {
    r: Math.round(a.r * (1 - w) + b.r * w),
    g: Math.round(a.g * (1 - w) + b.g * w),
    b: Math.round(a.b * (1 - w) + b.b * w)
  };

  return `#${[rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
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
  const preset = shuffleDeterministic(APP_BASE.universalPalette, seed)[0];
  return {
    bg: preset.bg,
    ink: bestInkFor(preset.bg, preset.ink, 7)
  };
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS DE CONTENIDO
═══════════════════════════════════════════════════════════════ */

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
   BUILD HTML FROM TEMPLATE
═══════════════════════════════════════════════════════════════ */

const template = await fs.readFile("scripts/templates/tarjeta.html", "utf8");
const portadaURL = resolvePortadaURL(bookMeta, libro);
const portadaSource = resolvePortadaSource(bookMeta, libro, portadaURL);
const logoDataURL = await resolveLogoDataURL();

const display = buildPresentationCopy(libro, bookMeta);
const style = libro?.tarjeta?.style || libro?.tarjeta_presentacion?.style || {};

const accent = style.accent || APP_BASE.subtitleColor;
const subtitleColor = style.subtitleColor || accent;
const authorChipBg = style.authorChipBg || mixHex(accent, "#FFFFFF", 0.82);
const authorChipColor = style.authorChipColor || mixHex(accent, "#7A3C00", 0.18);
const highlight = pickHighlightStyle(`${slug}__${display.top}__${display.bottom}`);

const portadaSection = portadaURL
  ? `<img class="cover" src="${portadaURL}" alt="Portada de ${escapeHTML(bookMeta.titulo || libro.titulo || "")}" />`
  : "";

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
  `--canvas-bg: ${toRgba("#000000", 0.98)}`,
  `--shell-width: ${SCALED.shellWidth}px`,
  `--shell-height: ${SCALED.shellHeight}px`,
  `--shell-radius: ${SCALED.shellRadius}px`,
  `--shell-bg: ${APP_BASE.paper}`,
  `--shell-border: rgba(255,255,255,0.08)`,

  `--outer-pad: ${SCALED.outerPad}px`,
  `--gap-between-blocks: ${SCALED.gap}px`,

  `--card-bg: ${APP_BASE.blockBackground}`,
  `--card-border: ${APP_BASE.blockBorder}`,
  `--card-shadow: ${APP_BASE.blockShadow}`,
  `--card-radius: ${SCALED.blockRadius}px`,

  `--hero-pad-y: ${SCALED.block1PadY}px`,
  `--hero-pad-x: ${SCALED.block1PadX}px`,
  `--action-pad-y: ${SCALED.block2PadY}px`,
  `--action-pad-x: ${SCALED.block2PadX}px`,

  `--cover-width: ${SCALED.coverWidth}px`,
  `--cover-max-height: ${SCALED.coverMaxHeight}px`,
  `--cover-radius: ${SCALED.coverRadius}px`,
  `--cover-margin-bottom: ${SCALED.coverMarginBottom}px`,
  `--cover-margin-left: ${SCALED.coverMarginLeft}px`,
  `--cover-shadow: ${APP_BASE.coverShadow}`,

  `--title-size: ${SCALED.titleSize}px`,
  `--author-size: ${SCALED.authorChipSize}px`,
  `--subtitle-size: ${SCALED.subtitleSize}px`,
  `--paragraph-size: ${SCALED.paragraphSize}px`,
  `--footer-size: ${SCALED.footerTextSize}px`,
  `--footer-height: ${SCALED.footerHeight}px`,
  `--footer-logo-height: ${SCALED.footerLogoHeight}px`,

  `--title-color: ${style.titleColor || APP_BASE.titleColor}`,
  `--subtitle-color: ${subtitleColor}`,
  `--paragraph-color: ${style.paragraphColor || APP_BASE.paragraphColor}`,
  `--footer-color: ${APP_BASE.footerTextColor}`,

  `--author-chip-bg: ${authorChipBg}`,
  `--author-chip-color: ${authorChipColor}`,
  `--author-chip-pad-y: ${SCALED.authorChipPadY}px`,
  `--author-chip-pad-x: ${SCALED.authorChipPadX}px`,
  `--author-chip-radius: ${SCALED.authorChipRadius}px`,

  `--highlight-bg: ${highlight.bg}`,
  `--highlight-ink: ${highlight.ink}`,
  `--highlight-pad-y: ${SCALED.highlightPadY}px`,
  `--highlight-pad-x: ${SCALED.highlightPadX}px`,
  `--highlight-radius: ${SCALED.highlightRadius}px`,
  `--highlight-shadow: 0 4px 12px rgba(0,0,0,0.10)`
].join("; ");

html = html.replace("<body>", `<body style="${cssVars}">`);

/* ═══════════════════════════════════════════════════════════════
   RENDER CON PLAYWRIGHT
═══════════════════════════════════════════════════════════════ */

console.log("   🖥️  Iniciando Chrome headless...");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.setViewportSize({
  width: PNG.canvasWidth,
  height: PNG.canvasHeight
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
    await page.waitForTimeout(250);
  } catch {
    console.log("   ⚠️  Portada no cargó en 10s — continuando sin ella");
  }
}

await page.evaluate((limits) => {
  const shellBody = document.getElementById("shellBody");
  const heroCard = document.getElementById("heroCard");
  const heroContent = document.getElementById("heroContent");
  const actionCard = document.getElementById("actionCard");
  const actionContent = document.getElementById("actionContent");
  const footerCard = document.getElementById("footerCard");

  const title = document.getElementById("title");
  const authorChip = document.getElementById("authorChip");
  const topParagraph = document.getElementById("parrafoTop");
  const subtitle = document.getElementById("subtitle");
  const bottomParagraph = document.getElementById("parrafoBot");
  const cover = document.querySelector(".cover");

  const px = (el, prop) => {
    if (!el) return 0;
    return parseFloat(getComputedStyle(el)[prop]) || 0;
  };

  const setPx = (el, prop, value) => {
    if (!el) return;
    el.style[prop] = `${value}px`;
  };

  let guard = 0;
  while (
    (
      (heroContent && heroContent.scrollHeight > heroContent.clientHeight) ||
      (actionContent && actionContent.scrollHeight > actionContent.clientHeight) ||
      (shellBody && shellBody.scrollHeight > shellBody.clientHeight)
    ) &&
    guard < 240
  ) {
    let changed = false;

    const titleSize = px(title, "fontSize");
    const authorSize = px(authorChip, "fontSize");
    const subtitleSize = px(subtitle, "fontSize");
    const topSize = px(topParagraph, "fontSize");
    const bottomSize = px(bottomParagraph, "fontSize");
    const coverWidth = px(cover, "width");

    if (title && titleSize > limits.titleMin) {
      setPx(title, "fontSize", titleSize - 0.45);
      changed = true;
    }

    if (topParagraph && topSize > limits.paragraphMin) {
      setPx(topParagraph, "fontSize", topSize - 0.18);
      changed = true;
    }

    if (bottomParagraph && bottomSize > limits.paragraphMin) {
      setPx(bottomParagraph, "fontSize", bottomSize - 0.18);
      changed = true;
    }

    if (subtitle && subtitleSize > limits.subtitleMin && guard % 2 === 0) {
      setPx(subtitle, "fontSize", subtitleSize - 0.16);
      changed = true;
    }

    if (authorChip && authorSize > limits.authorMin && guard % 3 === 0) {
      setPx(authorChip, "fontSize", authorSize - 0.10);
      changed = true;
    }

    if (cover && coverWidth > limits.coverMin && guard % 3 === 0) {
      setPx(cover, "width", coverWidth - 0.5);
      changed = true;
    }

    if (!changed) break;
    guard += 1;
  }

  const totalHeight = shellBody.clientHeight;
  const gap = parseFloat(getComputedStyle(shellBody).gap) || 18;
  const footerHeight = footerCard.getBoundingClientRect().height;
  const remaining = totalHeight - footerHeight - gap * 2;

  const heroDesired = Math.ceil(heroContent.scrollHeight + 12);
  const actionDesired = Math.ceil(actionContent.scrollHeight + 12);

  let heroHeight;
  let actionHeight;

  if (heroDesired + actionDesired <= remaining) {
    const extra = remaining - (heroDesired + actionDesired);
    heroHeight = heroDesired + Math.round(extra * 0.50);
    actionHeight = actionDesired + (extra - Math.round(extra * 0.50));
  } else {
    heroHeight = Math.max(300, Math.round(remaining * 0.55));
    actionHeight = remaining - heroHeight;
  }

  heroCard.style.height = `${heroHeight}px`;
  actionCard.style.height = `${actionHeight}px`;

  let guardBottom = 0;
  while (actionContent && actionContent.scrollHeight > actionContent.clientHeight && guardBottom < 120) {
    let changed = false;
    const subtitleSize = px(subtitle, "fontSize");
    const bottomSize = px(bottomParagraph, "fontSize");

    if (subtitle && subtitleSize > limits.subtitleMin) {
      setPx(subtitle, "fontSize", subtitleSize - 0.14);
      changed = true;
    }

    if (bottomParagraph && bottomSize > limits.paragraphMin) {
      setPx(bottomParagraph, "fontSize", bottomSize - 0.18);
      changed = true;
    }

    if (!changed) break;
    guardBottom += 1;
  }

  if (actionContent && actionContent.scrollHeight > actionContent.clientHeight && bottomParagraph) {
    const available = actionContent.clientHeight - (subtitle ? subtitle.getBoundingClientRect().height : 0) - 8;
    const lineHeight = px(bottomParagraph, "lineHeight") || (px(bottomParagraph, "fontSize") * 1.7);
    const lines = Math.max(4, Math.floor(available / lineHeight));

    bottomParagraph.style.display = "-webkit-box";
    bottomParagraph.style.webkitBoxOrient = "vertical";
    bottomParagraph.style.webkitLineClamp = String(lines);
    bottomParagraph.style.overflow = "hidden";
  }
}, {
  titleMin: SCALED.titleMinSize,
  subtitleMin: SCALED.subtitleMinSize,
  paragraphMin: SCALED.paragraphMinSize,
  authorMin: SCALED.authorChipMinSize,
  coverMin: SCALED.coverMinWidth
});

await page.waitForTimeout(220);

const outPath = path.join(outDir, "tarjeta.png");
await page.screenshot({
  path: outPath,
  type: "png",
  clip: {
    x: 0,
    y: 0,
    width: PNG.canvasWidth,
    height: PNG.canvasHeight
  }
});

await browser.close();

const stats = await fs.stat(outPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`\n   ✅ Tarjeta generada: ${outPath}`);
console.log(`   📏 ${sizeMB} MB | ${PNG.canvasWidth}×${PNG.canvasHeight}px`);
console.log(`   🎨 Título visible: "${display.title}"`);
console.log(`   ✍️  Autor: ${display.author}`);
console.log(`   🖼️  Portada: ${portadaURL ? portadaSource : "tipográfica"}`);
console.log(`   📝 Top: ${stripHighlightTags(display.top)}`);
console.log(`   ⚡ Bottom: ${stripHighlightTags(display.bottom)}`);
