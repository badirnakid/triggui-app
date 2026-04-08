/**
 * build-tarjeta-png.js — Paso 4 del pipeline Triggui 2.0
 *
 * PNG 1080x1920 homologada visualmente contra la tarjeta viva:
 * - misma densidad editorial
 * - misma escala general
 * - portada y texto más cercanos
 * - highlight de altura completa
 * - footer propio PNG con logo + @triggui | triggui.com
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/* ═══════════════════════════════════════════════════════════════
   CONFIG VISUAL HOMOLOGADA A TARJETA VIVA
═══════════════════════════════════════════════════════════════ */

const PNG_STYLE = {
  canvasWidth: 1080,
  canvasHeight: 1920,

  shellWidth: 748,
  shellHeight: 1820,
  shellRadius: 38,

  shellBg: "#F7F6F3",
  shellBorder: "rgba(255,255,255,0.08)",
  canvasBg: "#050505",

  cardBg: "#FBFAF8",
  cardBorder: "rgba(0,0,0,0.05)",

  titleColor: "#1D1D1B",
  paragraphColor: "#4C4C4C",
  footerColor: "#8B8B8B",

  titleSize: 58,
  titleMinSize: 48,

  authorSize: 21,
  authorMinSize: 18,

  topSize: 28,
  topMinSize: 24,

  subtitleSize: 23,
  subtitleMinSize: 20,

  bottomSize: 27,
  bottomMinSize: 23,

  coverWidth: 164,
  coverMinWidth: 148,
  coverRadius: 6,
  coverShadow: "0 14px 28px rgba(0,0,0,0.11)",

  footerHeight: 186
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

function sanitizeShortText(text, fallback = "") {
  const value = stripHighlightTags(String(text || ""))
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return value || fallback;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS DE COLOR
═══════════════════════════════════════════════════════════════ */

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
  const title = sanitizeShortText(source.titulo, sanitizeShortText(libro.tagline, "Una idea útil"));
  const author = sanitizeShortText(bookMeta.autor || libro.autor, "");
  const top = ensureOneHighlight(source.parrafoTop || "");
  const subtitle = sanitizeShortText(source.subtitulo, "Hazlo ahora");
  const bottom = ensureOneHighlight(source.parrafoBot || "");

  return { title, author, top, subtitle, bottom };
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
const accent = style.accent || "#8F4CC2";
const subtitleColor = style.subtitleColor || "#2F6FB7";
const chipBg = mixHex(accent, "#FFFFFF", 0.84);
const chipColor = mixHex(accent, "#355F9C", 0.20);
const highlightBg = toRgba(accent, 0.18);
const highlightInk = style.paragraphColor || PNG_STYLE.paragraphColor;
const borderSoft = toRgba("#000000", 0.05);

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
  `--canvas-bg: ${PNG_STYLE.canvasBg}`,
  `--shell-bg: ${PNG_STYLE.shellBg}`,
  `--shell-border: ${PNG_STYLE.shellBorder}`,
  `--card-bg: ${PNG_STYLE.cardBg}`,
  `--card-border: ${PNG_STYLE.cardBorder}`,
  `--title-color: ${style.titleColor || PNG_STYLE.titleColor}`,
  `--paragraph-color: ${style.paragraphColor || PNG_STYLE.paragraphColor}`,
  `--subtitle-color: ${subtitleColor}`,
  `--chip-bg: ${chipBg}`,
  `--chip-color: ${chipColor}`,
  `--footer-color: ${PNG_STYLE.footerColor}`,
  `--highlight-bg: ${highlightBg}`,
  `--highlight-ink: ${highlightInk}`,
  `--card-border-soft: ${borderSoft}`,
  `--cover-shadow: ${PNG_STYLE.coverShadow}`,
  `--cover-radius: ${PNG_STYLE.coverRadius}px`,
  `--shell-width: ${PNG_STYLE.shellWidth}px`,
  `--shell-height: ${PNG_STYLE.shellHeight}px`,
  `--footer-height: ${PNG_STYLE.footerHeight}px`,
  `--title-size: ${PNG_STYLE.titleSize}px`,
  `--author-size: ${PNG_STYLE.authorSize}px`,
  `--top-size: ${PNG_STYLE.topSize}px`,
  `--subtitle-size: ${PNG_STYLE.subtitleSize}px`,
  `--bottom-size: ${PNG_STYLE.bottomSize}px`,
  `--cover-width: ${PNG_STYLE.coverWidth}px`
].join("; ");

html = html.replace("<body>", `<body style="${cssVars}">`);

/* ═══════════════════════════════════════════════════════════════
   RENDER WITH PLAYWRIGHT
═══════════════════════════════════════════════════════════════ */

console.log("   🖥️  Iniciando Chrome headless...");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.setViewportSize({
  width: PNG_STYLE.canvasWidth,
  height: PNG_STYLE.canvasHeight
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
    await page.waitForTimeout(280);
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
      (heroContent && heroContent.scrollHeight > 440) ||
      (actionContent && actionContent.scrollHeight > 360)
    ) &&
    guard < 220
  ) {
    let changed = false;

    const titleSize = px(title, "fontSize");
    const authorSize = px(authorChip, "fontSize");
    const topSize = px(topParagraph, "fontSize");
    const subtitleSize = px(subtitle, "fontSize");
    const bottomSize = px(bottomParagraph, "fontSize");
    const coverWidth = px(cover, "width");

    if (title && titleSize > limits.titleMin) {
      setPx(title, "fontSize", titleSize - 0.55);
      changed = true;
    }

    if (topParagraph && topSize > limits.topMin) {
      setPx(topParagraph, "fontSize", topSize - 0.22);
      changed = true;
    }

    if (bottomParagraph && bottomSize > limits.bottomMin) {
      setPx(bottomParagraph, "fontSize", bottomSize - 0.22);
      changed = true;
    }

    if (subtitle && subtitleSize > limits.subtitleMin && guard % 2 === 0) {
      setPx(subtitle, "fontSize", subtitleSize - 0.18);
      changed = true;
    }

    if (authorChip && authorSize > limits.authorMin && guard % 3 === 0) {
      setPx(authorChip, "fontSize", authorSize - 0.12);
      changed = true;
    }

    if (cover && coverWidth > limits.coverMin && guard % 3 === 0) {
      setPx(cover, "width", coverWidth - 0.4);
      changed = true;
    }

    if (!changed) break;
    guard += 1;
  }

  const totalHeight = shellBody.clientHeight;
  const gap = parseFloat(getComputedStyle(shellBody).gap) || 18;
  const footerHeight = footerCard.getBoundingClientRect().height;
  const remaining = totalHeight - footerHeight - gap * 2;

  const heroDesired = Math.max(305, Math.ceil(heroContent.scrollHeight + 18));
  const actionDesired = Math.max(245, Math.ceil(actionContent.scrollHeight + 18));
  const desiredSum = heroDesired + actionDesired;

  let heroHeight;
  let actionHeight;

  if (desiredSum <= remaining) {
    const extra = remaining - desiredSum;
    heroHeight = heroDesired + Math.round(extra * 0.52);
    actionHeight = actionDesired + (extra - Math.round(extra * 0.52));
  } else {
    heroHeight = Math.max(300, Math.round(remaining * 0.53));
    actionHeight = remaining - heroHeight;
  }

  heroCard.style.height = `${heroHeight}px`;
  actionCard.style.height = `${actionHeight}px`;

  let guardBottom = 0;
  while (actionContent && actionContent.scrollHeight > actionContent.clientHeight && guardBottom < 100) {
    let changed = false;

    const subtitleSize = px(subtitle, "fontSize");
    const bottomSize = px(bottomParagraph, "fontSize");

    if (subtitle && subtitleSize > limits.subtitleMin) {
      setPx(subtitle, "fontSize", subtitleSize - 0.15);
      changed = true;
    }

    if (bottomParagraph && bottomSize > limits.bottomMin) {
      setPx(bottomParagraph, "fontSize", bottomSize - 0.20);
      changed = true;
    }

    if (!changed) break;
    guardBottom += 1;
  }

  if (actionContent && actionContent.scrollHeight > actionContent.clientHeight && bottomParagraph) {
    const available = actionContent.clientHeight - (subtitle ? subtitle.getBoundingClientRect().height : 0) - 8;
    const lineHeight = px(bottomParagraph, "lineHeight") || (px(bottomParagraph, "fontSize") * 1.36);
    const lines = Math.max(4, Math.floor(available / lineHeight));

    bottomParagraph.style.display = "-webkit-box";
    bottomParagraph.style.webkitBoxOrient = "vertical";
    bottomParagraph.style.webkitLineClamp = String(lines);
    bottomParagraph.style.overflow = "hidden";
  }
}, {
  titleMin: PNG_STYLE.titleMinSize,
  authorMin: PNG_STYLE.authorMinSize,
  topMin: PNG_STYLE.topMinSize,
  subtitleMin: PNG_STYLE.subtitleMinSize,
  bottomMin: PNG_STYLE.bottomMinSize,
  coverMin: PNG_STYLE.coverMinWidth
});

await page.waitForTimeout(220);

const outPath = path.join(outDir, "tarjeta.png");
await page.screenshot({
  path: outPath,
  type: "png",
  clip: { x: 0, y: 0, width: PNG_STYLE.canvasWidth, height: PNG_STYLE.canvasHeight }
});

await browser.close();

const stats = await fs.stat(outPath);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`\n   ✅ Tarjeta generada: ${outPath}`);
console.log(`   📏 ${sizeMB} MB | ${PNG_STYLE.canvasWidth}×${PNG_STYLE.canvasHeight}px`);
console.log(`   🎨 Título visible: "${display.title}"`);
console.log(`   ✍️  Autor: ${display.author}`);
console.log(`   🖼️  Portada: ${portadaURL ? portadaSource : "tipográfica"}`);
console.log(`   📝 Top: ${stripHighlightTags(display.top)}`);
console.log(`   ⚡ Bottom: ${stripHighlightTags(display.bottom)}`);
