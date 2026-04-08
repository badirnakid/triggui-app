/**
 * build-tarjeta-png.js — Paso 4 del pipeline Triggui 2.0
 *
 * Renderiza una tarjeta PNG vertical real para WhatsApp / Stories.
 * Trasplante de la lógica editorial y visual del Apps Script original,
 * adaptado con bisturí al pipeline PNG sin romper lo demás.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/* ═══════════════════════════════════════════════════════════════
   CONFIG NIVEL DIOS — APPS SCRIPT TRANSCODIFICADO A PNG
═══════════════════════════════════════════════════════════════ */

const TRIGGUI_STYLE_CONFIG = {
  name: "Rational Orange · Logic Brain Edition",
  version: "png-1.0",

  background: "#FFFFFF",
  paper: "#F9F9F9",
  ink: "#1A1A1A",
  border: "#F39200",

  coverWidth: 230,
  coverBorder: "#EAEAEA",
  coverRadius: 10,
  coverMaxHeight: 420,
  coverMargin: "0 0 12px 18px",
  coverShadow: "0 15px 35px rgba(243, 146, 0, 0.15)",

  titleColor: "#1A1A1A",
  subtitleColor: "#F39200",
  paragraphColor: "#4A4A4A",
  footerTextColor: "#8B8880",

  authorChipEnabled: true,
  authorChipBg: "#FFF3E0",
  authorChipColor: "#E65100",

  highlightStrategy: "universal_random",
  highlightPaletteSize: 5,
  universalPalette: [
    { name: "Clarity Orange", bg: "#F39200", ink: "#FFFFFF" },
    { name: "Stoic Charcoal", bg: "#333333", ink: "#FFFFFF" },
    { name: "Logic Blue", bg: "#0284C7", ink: "#FFFFFF" },
    { name: "Graphite Truth", bg: "#2C2C2C", ink: "#FFFFFF" },
    { name: "Morning Yellow", bg: "#FBBF24", ink: "#1A1A1A" }
  ],

  minContrastAA: 7.0,
  autoAdjustInk: true
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
    if (await fileExists(candidate)) return fileToDataURL(candidate);
  }

  return "";
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS DE TEXTO / CONTRASTE
═══════════════════════════════════════════════════════════════ */

function escapeHTML(text) {
  if (text == null) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function escapeWithBreaks(text) {
  return escapeHTML(text).replace(/\n/g, "<br>");
}

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function cleanGuidance(text) {
  let t = normalizeText(text);
  if (!t) return "";

  t = t.replace(/^\s*(?:[\(\[]?\d+[\)\]]?[\.\-:]?\s*)+/, "");
  t = t.replace(/^\s*\[?\s*(t[ií]tulo|subt[ií]tulo|p[aá]rrafo(?:\s+breve)?|acci[oó]n)\s*\]?\s*[:\-–]?\s*/i, "");
  t = t.replace(/^\s*(?:una\s+l[ií]nea\s+de\s+)?(?:t[ií]tulo|subt[ií]tulo|p[aá]rrafo(?:\s+breve)?|acci[oó]n)\s*[:\-–]\s*/i, "");
  return normalizeText(t);
}

function stripExplicitBookRefs(text, titulo = "", autor = "") {
  let value = normalizeText(text);
  if (!value) return "";

  for (const term of [titulo, autor]) {
    const clean = normalizeText(term);
    if (!clean) continue;
    const safe = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    value = value.replace(new RegExp(safe, "gi"), "");
  }

  value = value
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .replace(/^[,.;:!?·\-\s]+|[,.;:!?·\-\s]+$/g, "");

  return normalizeText(value);
}

function ensureSentence(text) {
  const value = normalizeText(text);
  if (!value) return "";
  if (/[.!?…]$/.test(value)) return value;
  return `${value}.`;
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

  if (opens > closes) text += "[/H]".repeat(opens - closes);

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
    .split(/(?<=[\.\!\?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 26);

  const chosen = segments[0] || plain;
  if (!chosen) return normalized;
  const safe = chosen.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return normalizeHighlightSyntax(normalized.replace(new RegExp(safe), `[H]${chosen}[/H]`));
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

function parseFontSizeToPx(size) {
  return parseFloat(String(size).replace("px", "")) || 16;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS DE CONTENIDO / ESTRUCTURA
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

function toArrayOfStrings(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => toArrayOfStrings(item)).map((item) => normalizeText(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(/[|•,;/]+/g).map((item) => normalizeText(item)).filter(Boolean);
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

function coerceStructureFromTarjeta(tarjeta, libro) {
  const tituloLibro = libro?.titulo || "";
  const autorLibro = libro?.autor || "";

  let t = cleanGuidance(stripHighlightTags(normalizeHighlightSyntax(tarjeta?.titulo || "")));
  let p1 = cleanGuidance(normalizeHighlightSyntax(tarjeta?.parrafoTop || ""));
  let s = cleanGuidance(stripHighlightTags(normalizeHighlightSyntax(tarjeta?.subtitulo || "")));
  let p2 = cleanGuidance(normalizeHighlightSyntax(tarjeta?.parrafoBot || ""));

  t = stripExplicitBookRefs(t, tituloLibro, "");
  s = stripExplicitBookRefs(s, tituloLibro, "");
  p1 = stripExplicitBookRefs(p1, tituloLibro, autorLibro);
  p2 = stripExplicitBookRefs(p2, tituloLibro, autorLibro);

  if (!t) t = "Una idea que te acomoda por dentro";
  if (!s) s = "Hazlo ahora";
  if (!p1) p1 = ensureOneHighlight("[H]Hay libros que no se leen: te corrigen.[/H]");
  if (!p2) p2 = ensureOneHighlight("[H]Abre una página y ejecuta una sola acción hoy.[/H]");

  p1 = ensureOneHighlight(ensureSentence(p1));
  p2 = ensureOneHighlight(ensureSentence(p2));

  return {
    title: t,
    top: p1,
    subtitle: s,
    bottom: p2
  };
}

function pickHighlightStyle(seedBase) {
  const palette = TRIGGUI_STYLE_CONFIG.universalPalette.slice(0, TRIGGUI_STYLE_CONFIG.highlightPaletteSize);
  const seed = hash32(seedBase || "triggui");
  const shuffled = shuffleDeterministic(palette, seed);
  const picked = shuffled[0];
  return {
    name: picked.name,
    bg: picked.bg,
    ink: TRIGGUI_STYLE_CONFIG.autoAdjustInk
      ? bestInkFor(picked.bg, picked.ink, TRIGGUI_STYLE_CONFIG.minContrastAA)
      : picked.ink
  };
}

function renderHighlightHTML(text, highlightStyle) {
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
      out += `<span class="highlight" data-highlight-name="${escapeHTML(highlightStyle.name)}">${escapeWithBreaks(inner)}</span>`;
    }

    last = re.lastIndex;
  }

  const after = normalized.slice(last);
  if (after) out += escapeWithBreaks(after);

  return out;
}

function buildPresentationCopy(libro, bookMeta) {
  const tarjeta = libro.tarjeta_presentacion || libro.tarjeta || {};
  const structured = coerceStructureFromTarjeta(tarjeta, {
    titulo: bookMeta.titulo || libro.titulo || "",
    autor: bookMeta.autor || libro.autor || ""
  });

  const keywords = uniqueStrings([
    ...toArrayOfStrings(libro.palabras),
    ...toArrayOfStrings(bookMeta.palabras)
  ]).slice(0, 4);

  return {
    ...structured,
    keywords
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
const highlightStyle = pickHighlightStyle(`${slug}__${display.title}__${display.top}__${display.bottom}`);

const highlightBg = highlightStyle.bg;
const highlightInk = highlightStyle.ink;

const portadaSection = portadaURL
  ? `<img class="cover" src="${portadaURL}" alt="Portada de ${escapeHTML(bookMeta.titulo || libro.titulo || "")}" />`
  : "";

const heroLogoSection = logoDataURL
  ? `
  <div class="logo-strip">
    <img src="${logoDataURL}" alt="Triggui" />
    <div class="meta">Queremos que te den ganas de abrir un libro.</div>
  </div>`
  : "";

const footerLogoSection = logoDataURL
  ? `
    <img src="${logoDataURL}" alt="Triggui" />
    <div class="meta">@triggui | triggui.com</div>`
  : `
    <div class="meta">triggui®<br>@triggui | triggui.com</div>`;

let html = template
  .replace("{{PORTADA_SECTION}}", portadaSection)
  .replace("{{TITULO}}", escapeHTML(display.title))
  .replace("{{AUTOR}}", escapeHTML(bookMeta.autor || libro.autor || ""))
  .replace("{{PARRAFO_TOP}}", renderHighlightHTML(display.top, highlightStyle))
  .replace("{{SUBTITULO}}", escapeHTML(display.subtitle))
  .replace("{{PARRAFO_BOT}}", renderHighlightHTML(display.bottom, highlightStyle))
  .replace("{{HERO_LOGO_SECTION}}", heroLogoSection)
  .replace("{{FOOTER_LOGO_SECTION}}", footerLogoSection);

const vars = [
  `--bg: ${TRIGGUI_STYLE_CONFIG.background}`,
  `--paper: ${TRIGGUI_STYLE_CONFIG.paper}`,
  `--ink: ${TRIGGUI_STYLE_CONFIG.ink}`,
  `--border: ${TRIGGUI_STYLE_CONFIG.border}`,
  `--title-color: ${TRIGGUI_STYLE_CONFIG.titleColor}`,
  `--subtitle-color: ${TRIGGUI_STYLE_CONFIG.subtitleColor}`,
  `--paragraph-color: ${TRIGGUI_STYLE_CONFIG.paragraphColor}`,
  `--footer-color: ${TRIGGUI_STYLE_CONFIG.footerTextColor}`,
  `--chip-bg: ${TRIGGUI_STYLE_CONFIG.authorChipBg}`,
  `--chip-color: ${TRIGGUI_STYLE_CONFIG.authorChipColor}`,
  `--highlight-bg: ${highlightBg}`,
  `--highlight-ink: ${highlightInk}`
].join("; ");

html = html.replace("<body>", `<body style="${vars}">`);

/* ═══════════════════════════════════════════════════════════════
   RENDER WITH PLAYWRIGHT
═══════════════════════════════════════════════════════════════ */

console.log("   🖥️  Iniciando Chrome headless...");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.setViewportSize({ width: 1080, height: 1920 });
await page.setContent(html, { waitUntil: "networkidle" });

await page.evaluate(async () => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
});

if (portadaURL) {
  try {
    await page.waitForSelector(".cover", { state: "visible", timeout: 10000 });
    await page.waitForTimeout(300);
  } catch {
    console.log("   ⚠️  Portada no cargó en 10s — continuando sin ella");
  }
}

await page.evaluate(() => {
  const inner = document.getElementById("inner");
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
  while (heroContent && heroContent.scrollHeight > 880 && guard < 240) {
    let changed = false;

    const tSize = px(title, "fontSize");
    const pSize = px(topParagraph, "fontSize");
    const sSize = px(subtitle, "fontSize");
    const bSize = px(bottomParagraph, "fontSize");
    const chipSize = px(authorChip, "fontSize");
    const coverWidth = px(cover, "width");

    if (title && tSize > 42) {
      setPx(title, "fontSize", tSize - 0.7);
      changed = true;
    }

    if (topParagraph && pSize > 25) {
      setPx(topParagraph, "fontSize", pSize - 0.35);
      changed = true;
    }

    if (subtitle && sSize > 22 && guard % 2 === 0) {
      setPx(subtitle, "fontSize", sSize - 0.25);
      changed = true;
    }

    if (bottomParagraph && bSize > 23 && guard % 2 === 0) {
      setPx(bottomParagraph, "fontSize", bSize - 0.3);
      changed = true;
    }

    if (authorChip && chipSize > 18 && guard % 3 === 0) {
      setPx(authorChip, "fontSize", chipSize - 0.2);
      changed = true;
    }

    if (cover && coverWidth > 170 && guard % 3 === 0) {
      setPx(cover, "width", coverWidth - 0.6);
      changed = true;
    }

    if (!changed) break;
    guard += 1;
  }

  const gap = 18 * 2;
  const totalHeight = inner.clientHeight;
  const footerHeight = Math.max(150, footerCard.getBoundingClientRect().height);
  const remaining = totalHeight - footerHeight - gap;

  const desiredHero = Math.ceil(heroContent.scrollHeight + 24);
  const minHero = 700;
  const maxHero = 1120;

  let heroHeight = Math.max(minHero, Math.min(maxHero, desiredHero));
  let actionHeight = remaining - heroHeight;

  if (actionHeight < 340) {
    actionHeight = 340;
    heroHeight = remaining - actionHeight;
  }

  heroCard.style.height = `${heroHeight}px`;
  actionCard.style.height = `${actionHeight}px`;

  let guardBottom = 0;
  while (actionContent && actionContent.scrollHeight > actionContent.clientHeight && guardBottom < 140) {
    let changed = false;
    const sSize = px(subtitle, "fontSize");
    const bSize = px(bottomParagraph, "fontSize");

    if (subtitle && sSize > 21) {
      setPx(subtitle, "fontSize", sSize - 0.25);
      changed = true;
    }
    if (bottomParagraph && bSize > 22) {
      setPx(bottomParagraph, "fontSize", bSize - 0.35);
      changed = true;
    }

    if (!changed) break;
    guardBottom += 1;
  }

  if (actionContent && actionContent.scrollHeight > actionContent.clientHeight && bottomParagraph) {
    const available = actionContent.clientHeight - (subtitle ? subtitle.getBoundingClientRect().height : 0) - 8;
    const lineHeight = px(bottomParagraph, "lineHeight") || (px(bottomParagraph, "fontSize") * 1.4);
    const lines = Math.max(3, Math.floor(available / lineHeight));

    bottomParagraph.style.display = "-webkit-box";
    bottomParagraph.style.webkitBoxOrient = "vertical";
    bottomParagraph.style.webkitLineClamp = String(lines);
    bottomParagraph.style.overflow = "hidden";
  }
});

await page.waitForTimeout(250);

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
console.log(`   🎨 Título visible: "${display.title}"`);
console.log(`   ✍️  Autor: ${autorLibro}`);
console.log(`   🖼️  Portada: ${portadaURL ? portadaSource : "tipográfica"}`);
console.log(`   📝 Top: ${stripHighlightTags(display.top)}`);
console.log(`   ⚡ Bottom: ${stripHighlightTags(display.bottom)}`);
