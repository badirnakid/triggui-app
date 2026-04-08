/**
 * build-tarjeta-png.js — Paso 4 del pipeline Triggui 2.0
 *
 * Renderiza una tarjeta PNG vertical real para WhatsApp / Stories.
 * Calibrado para acercarse visualmente a la tarjeta viva:
 * más grande, más cerca, más legible, menos aire inútil.
 *
 * Además:
 * - corrige el error de renderHighlightHTML faltante
 * - evita repetición entre párrafo 1 y párrafo 2 usando fallback inteligente
 */

import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

/* ═══════════════════════════════════════════════════════════════
   CONFIG VISUAL
═══════════════════════════════════════════════════════════════ */

const PNG_STYLE = {
  canvasBg: "#050505",
  shellBg: "#F7F6F3",
  shellBorder: "rgba(255,255,255,0.08)",
  shellRadius: 38,

  heroCardBg: "#FBFAF8",
  actionCardBg: "#FBFAF8",
  footerCardBg: "#FBFAF8",

  titleColor: "#1D1D1B",
  paragraphColor: "#4B4B4B",
  footerColor: "#8A8A8A",

  outerWidth: 760,
  outerHeight: 1820,

  coverWidth: 246,
  coverMinWidth: 188,
  coverRadius: 6,
  coverShadow: "0 16px 34px rgba(0,0,0,0.10)",

  titleSize: 72,
  titleMinSize: 54,

  authorSize: 27,
  authorMinSize: 20,

  topSize: 36,
  topMinSize: 28,

  subtitleSize: 31,
  subtitleMinSize: 24,

  bottomSize: 34,
  bottomMinSize: 27
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

function cleanGuidance(text) {
  let value = normalizeText(text);
  if (!value) return "";

  value = value.replace(/^\s*(?:[\(\[]?\d+[\)\]]?[\.\-:]?\s*)+/, "");
  value = value.replace(/^\s*\[?\s*(t[ií]tulo|subt[ií]tulo|p[aá]rrafo(?:\s+breve)?|acci[oó]n)\s*\]?\s*[:\-–]?\s*/i, "");
  value = value.replace(/^\s*(?:una\s+l[ií]nea\s+de\s+)?(?:t[ií]tulo|subt[ií]tulo|p[aá]rrafo(?:\s+breve)?|acci[oó]n)\s*[:\-–]\s*/i, "");

  return normalizeText(value);
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
    .filter((s) => s.length >= 24);

  const chosen = segments[0] || plain;
  if (!chosen) return normalized;

  const safe = chosen.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return normalizeHighlightSyntax(normalized.replace(new RegExp(safe), `[H]${chosen}[/H]`));
}

function comparableText(text) {
  return stripHighlightTags(text)
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

  if ((aa.includes(bb) || bb.includes(aa)) && Math.min(aa.length, bb.length) > 42) {
    return true;
  }

  const tokensA = new Set(aa.split(" ").filter(Boolean));
  const tokensB = new Set(bb.split(" ").filter(Boolean));
  const intersection = [...tokensA].filter((t) => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size || 1;
  const jaccard = intersection / union;

  return jaccard >= 0.78;
}

function firstDifferentCandidate(base, candidates) {
  for (const candidate of candidates) {
    const clean = normalizeText(candidate);
    if (!clean) continue;
    if (!tooSimilar(base, clean)) return clean;
  }
  return "";
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

function coerceStructureFromTarjeta(tarjeta, libro) {
  const tituloLibro = libro?.titulo || "";
  const autorLibro = libro?.autor || "";

  let titulo = cleanGuidance(stripHighlightTags(normalizeHighlightSyntax(tarjeta?.titulo || "")));
  let parrafoTop = cleanGuidance(normalizeHighlightSyntax(tarjeta?.parrafoTop || ""));
  let subtitulo = cleanGuidance(stripHighlightTags(normalizeHighlightSyntax(tarjeta?.subtitulo || "")));
  let parrafoBot = cleanGuidance(normalizeHighlightSyntax(tarjeta?.parrafoBot || ""));

  titulo = stripExplicitBookRefs(titulo, tituloLibro, "");
  subtitulo = stripExplicitBookRefs(subtitulo, tituloLibro, "");
  parrafoTop = stripExplicitBookRefs(parrafoTop, tituloLibro, autorLibro);
  parrafoBot = stripExplicitBookRefs(parrafoBot, tituloLibro, autorLibro);

  if (!titulo) titulo = "Una idea que te acomoda por dentro";
  if (!subtitulo) subtitulo = "Hazlo ahora";
  if (!parrafoTop) parrafoTop = ensureOneHighlight("[H]Hay libros que no se leen: te corrigen.[/H]");
  if (!parrafoBot) parrafoBot = ensureOneHighlight("[H]Abre una página y ejecuta una sola acción hoy.[/H]");

  parrafoTop = ensureOneHighlight(ensureSentence(parrafoTop));
  parrafoBot = ensureOneHighlight(ensureSentence(parrafoBot));

  return {
    title: titulo,
    top: parrafoTop,
    subtitle: subtitulo,
    bottom: parrafoBot
  };
}

function deriveBottomFallbacks(libro, bookMeta, baseTop, structuredBase) {
  const tituloLibro = bookMeta.titulo || libro.titulo || "";
  const autorLibro = bookMeta.autor || libro.autor || "";

  const frases = uniqueStrings(toArrayOfStrings(libro.frases))
    .map((f) => stripExplicitBookRefs(cleanGuidance(f), tituloLibro, autorLibro))
    .map((f) => ensureSentence(f))
    .filter(Boolean);

  const candidates = [
    structuredBase?.bottom,
    structuredBase?.top,
    ...frases
  ].filter(Boolean);

  const chosen = firstDifferentCandidate(baseTop, candidates);
  return chosen ? ensureOneHighlight(chosen) : "";
}

function buildPresentationCopy(libro, bookMeta) {
  const tarjetaLive = libro.tarjeta_presentacion || libro.tarjeta || {};
  const tarjetaBase = libro.tarjeta_base || {};

  const live = coerceStructureFromTarjeta(tarjetaLive, {
    titulo: bookMeta.titulo || libro.titulo || "",
    autor: bookMeta.autor || libro.autor || ""
  });

  const base = coerceStructureFromTarjeta(tarjetaBase, {
    titulo: bookMeta.titulo || libro.titulo || "",
    autor: bookMeta.autor || libro.autor || ""
  });

  let title = live.title || base.title;
  let top = live.top || base.top;
  let subtitle = live.subtitle || base.subtitle || "Hazlo ahora";
  let bottom = live.bottom || base.bottom;

  if (tooSimilar(top, bottom)) {
    const replacement = deriveBottomFallbacks(libro, bookMeta, top, base);
    if (replacement) bottom = replacement;
  }

  if (tooSimilar(top, bottom)) {
    bottom = ensureOneHighlight("[H]Abre el libro y haz una sola prueba real hoy.[/H]");
  }

  const keywords = uniqueStrings([
    ...toArrayOfStrings(libro.palabras),
    ...toArrayOfStrings(bookMeta.palabras)
  ]).slice(0, 4);

  return {
    title,
    top,
    subtitle,
    bottom,
    keywords
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

const autorLibro = bookMeta.autor || libro.autor || "";
const display = buildPresentationCopy(libro, bookMeta);

const style = libro?.tarjeta?.style || libro?.tarjeta_presentacion?.style || {};
const accent = style.accent || "#8F4CC2";
const subtitleColor = style.subtitleColor || accent;
const chipBg = mixHex(accent, "#FFFFFF", 0.82);
const chipColor = mixHex(accent, "#5E2D91", 0.18);
const highlightBg = toRgba(accent, 0.16);
const highlightLine = toRgba(accent, 0.34);
const highlightInk = style.paragraphColor || PNG_STYLE.paragraphColor;
const borderSoft = toRgba(accent, 0.10);

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
  .replace("{{AUTOR}}", escapeHTML(autorLibro))
  .replace("{{PARRAFO_TOP}}", renderHighlightHTML(display.top))
  .replace("{{SUBTITULO}}", escapeHTML(display.subtitle))
  .replace("{{PARRAFO_BOT}}", renderHighlightHTML(display.bottom))
  .replace("{{FOOTER_SECTION}}", footerSection);

const cssVars = [
  `--canvas-bg: ${PNG_STYLE.canvasBg}`,
  `--shell-bg: ${PNG_STYLE.shellBg}`,
  `--shell-border: ${PNG_STYLE.shellBorder}`,
  `--hero-card-bg: ${PNG_STYLE.heroCardBg}`,
  `--action-card-bg: ${PNG_STYLE.actionCardBg}`,
  `--footer-card-bg: ${PNG_STYLE.footerCardBg}`,
  `--title-color: ${style.titleColor || PNG_STYLE.titleColor}`,
  `--paragraph-color: ${style.paragraphColor || PNG_STYLE.paragraphColor}`,
  `--subtitle-color: ${subtitleColor}`,
  `--chip-bg: ${chipBg}`,
  `--chip-color: ${chipColor}`,
  `--footer-color: ${PNG_STYLE.footerColor}`,
  `--highlight-bg: ${highlightBg}`,
  `--highlight-line: ${highlightLine}`,
  `--highlight-ink: ${highlightInk}`,
  `--card-border-soft: ${borderSoft}`,
  `--cover-shadow: ${PNG_STYLE.coverShadow}`,
  `--cover-radius: ${PNG_STYLE.coverRadius}px`,
  `--outer-width: ${PNG_STYLE.outerWidth}px`,
  `--outer-height: ${PNG_STYLE.outerHeight}px`,
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
      (heroContent && heroContent.scrollHeight > 960) ||
      (actionContent && actionContent.scrollHeight > 460)
    ) &&
    guard < 260
  ) {
    let changed = false;

    const titleSize = px(title, "fontSize");
    const authorSize = px(authorChip, "fontSize");
    const topSize = px(topParagraph, "fontSize");
    const subtitleSize = px(subtitle, "fontSize");
    const bottomSize = px(bottomParagraph, "fontSize");
    const coverWidth = px(cover, "width");

    if (title && titleSize > limits.titleMin) {
      setPx(title, "fontSize", titleSize - 0.7);
      changed = true;
    }

    if (topParagraph && topSize > limits.topMin) {
      setPx(topParagraph, "fontSize", topSize - 0.30);
      changed = true;
    }

    if (bottomParagraph && bottomSize > limits.bottomMin) {
      setPx(bottomParagraph, "fontSize", bottomSize - 0.28);
      changed = true;
    }

    if (subtitle && subtitleSize > limits.subtitleMin && guard % 2 === 0) {
      setPx(subtitle, "fontSize", subtitleSize - 0.22);
      changed = true;
    }

    if (authorChip && authorSize > limits.authorMin && guard % 3 === 0) {
      setPx(authorChip, "fontSize", authorSize - 0.18);
      changed = true;
    }

    if (cover && coverWidth > limits.coverMin && guard % 3 === 0) {
      setPx(cover, "width", coverWidth - 0.6);
      changed = true;
    }

    if (!changed) break;
    guard += 1;
  }

  const gap = parseFloat(getComputedStyle(shellBody).gap) || 20;
  const totalHeight = shellBody.clientHeight;
  const footerHeight = Math.max(132, footerCard.getBoundingClientRect().height);
  const remaining = totalHeight - footerHeight - gap * 2;

  const desiredHero = Math.ceil(heroContent.scrollHeight + 36);
  const desiredAction = Math.ceil(actionContent.scrollHeight + 26);

  let heroHeight = desiredHero;
  let actionHeight = desiredAction;

  if (desiredHero + desiredAction < remaining) {
    const extra = remaining - (desiredHero + desiredAction);
    heroHeight = desiredHero + Math.round(extra * 0.72);
    actionHeight = remaining - heroHeight;
  } else {
    heroHeight = Math.round(remaining * 0.66);
    actionHeight = remaining - heroHeight;
  }

  if (actionHeight < 300) {
    actionHeight = 300;
    heroHeight = remaining - actionHeight;
  }

  if (heroHeight < 760) {
    heroHeight = 760;
    actionHeight = remaining - heroHeight;
  }

  heroCard.style.height = `${heroHeight}px`;
  actionCard.style.height = `${actionHeight}px`;

  let guardBottom = 0;
  while (actionContent && actionContent.scrollHeight > actionContent.clientHeight && guardBottom < 140) {
    let changed = false;

    const subtitleSize = px(subtitle, "fontSize");
    const bottomSize = px(bottomParagraph, "fontSize");

    if (subtitle && subtitleSize > limits.subtitleMin) {
      setPx(subtitle, "fontSize", subtitleSize - 0.20);
      changed = true;
    }

    if (bottomParagraph && bottomSize > limits.bottomMin) {
      setPx(bottomParagraph, "fontSize", bottomSize - 0.25);
      changed = true;
    }

    if (!changed) break;
    guardBottom += 1;
  }

  if (actionContent && actionContent.scrollHeight > actionContent.clientHeight && bottomParagraph) {
    const available = actionContent.clientHeight - (subtitle ? subtitle.getBoundingClientRect().height : 0) - 12;
    const lineHeight = px(bottomParagraph, "lineHeight") || (px(bottomParagraph, "fontSize") * 1.38);
    const lines = Math.max(3, Math.floor(available / lineHeight));

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
