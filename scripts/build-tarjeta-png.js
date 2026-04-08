/**
 * build-tarjeta-png.js — Paso 4 del pipeline Triggui 2.0
 *
 * Renderiza una tarjeta PNG vertical real para WhatsApp / Stories.
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

function hexToRgb(hex) {
  const clean = String(hex || "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(clean)) return null;

  return {
    r: parseInt(clean.slice(1, 3), 16),
    g: parseInt(clean.slice(3, 5), 16),
    b: parseInt(clean.slice(5, 7), 16)
  };
}

function rgbToHex({ r, g, b }) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixHex(hexA, hexB, weight = 0.5) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return hexA || hexB || "#000000";

  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex({
    r: a.r * (1 - w) + b.r * w,
    g: a.g * (1 - w) + b.g * w,
    b: a.b * (1 - w) + b.b * w
  });
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

  text = text
    .replace(/\[H\]\s*\[\/H\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return text;
}

function stripHighlightTags(text) {
  return normalizeHighlightSyntax(text).replace(/\[H\]|\[\/H\]/gi, "");
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

function stripExplicitBookRefs(text, titulo = "", autor = "") {
  let value = normalizeText(stripHighlightTags(text));
  if (!value) return "";

  for (const term of [titulo, autor]) {
    const cleanTerm = normalizeText(term);
    if (!cleanTerm) continue;
    const safe = cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    value = value.replace(new RegExp(safe, "gi"), "");
  }

  value = value
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .replace(/^[,.;:!?·\-\s]+|[,.;:!?·\-\s]+$/g, "");

  return normalizeText(value);
}

function sentenceCase(text) {
  const value = normalizeText(text);
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ensurePeriod(text) {
  const value = normalizeText(text);
  if (!value) return "";
  if (/[.!?…]$/.test(value)) return value;
  return `${value}.`;
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
    /\buna reflexión\b/,
    /\buna mirada\b/,
    /\bmuestra cómo\b/
  ];

  return weakPatterns.some((re) => re.test(value));
}

function cleanLeadParagraph(text, titulo = "", autor = "") {
  let value = stripExplicitBookRefs(text, titulo, autor);
  if (!value) return "";

  const patterns = [
    /^\s*invita a explorar la idea de\s+/i,
    /^\s*invita a explorar\s+/i,
    /^\s*invita a\s+/i,
    /^\s*explora la idea de\s+/i,
    /^\s*explora\s+/i,
    /^\s*explorar\s+/i,
    /^\s*nos recuerda que\s+/i,
    /^\s*nos muestra que\s+/i,
    /^\s*este libro\s+/i,
    /^\s*este enfoque transformador\s+/i,
    /^\s*este enfoque\s+/i
  ];

  for (const pattern of patterns) {
    value = value.replace(pattern, "");
  }

  value = value
    .replace(/^\s*(la idea de|el acto de)\s+/i, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  value = sentenceCase(value);
  value = ensurePeriod(value);

  return clampText(value, 230);
}

function scoreActionPhrase(text) {
  const value = normalizeText(text);
  if (!value) return -999;

  let score = 0;

  const actionablePatterns = [
    /\babre\b/i,
    /\brespira\b/i,
    /\btoma\b/i,
    /\bdetén\b/i,
    /\bdetente\b/i,
    /\bprueba\b/i,
    /\bobserva\b/i,
    /\bquita\b/i,
    /\bcierra\b/i,
    /\belige\b/i,
    /\bescribe\b/i,
    /\bvuelve\b/i,
    /\bdeja\b/i,
    /\bhaz\b/i,
    /\bpon\b/i,
    /\bordena\b/i,
    /\bempieza\b/i,
    /\bpermite\b/i,
    /\bsuelta\b/i
  ];

  if (actionablePatterns.some((re) => re.test(value))) score += 28;
  if (!phraseIsWeak(value)) score += 14;

  const len = value.length;
  if (len >= 40 && len <= 150) score += 16;
  else if (len >= 22 && len <= 180) score += 8;
  else score -= 12;

  if (/[.!?]$/.test(value)) score += 2;

  return score;
}

function selectCardTitle(tarjeta, libro, tituloLibro = "") {
  const titulo = normalizeText(tarjeta?.titulo || "");
  if (titulo && titulo.toLowerCase() !== normalizeText(tituloLibro).toLowerCase() && titulo.length <= 42 && !phraseIsWeak(titulo)) {
    return titulo;
  }

  const subtitulo = normalizeText(tarjeta?.subtitulo || "");
  if (subtitulo && subtitulo.length <= 42 && !phraseIsWeak(subtitulo)) {
    return subtitulo;
  }

  const palabras = uniqueStrings(toArrayOfStrings(libro?.palabras)).slice(0, 2);
  if (palabras.length === 2) {
    return `${palabras[0]} y ${palabras[1].toLowerCase()}`;
  }
  if (palabras.length === 1) {
    return palabras[0];
  }

  return clampText(tituloLibro || "Triggui", 42);
}

function selectLeadCopy(tarjeta, libro, tituloLibro = "", autorLibro = "") {
  const candidateTop = cleanLeadParagraph(tarjeta?.parrafoTop || "", tituloLibro, autorLibro);
  if (candidateTop && !phraseIsWeak(candidateTop)) {
    return candidateTop;
  }

  const candidateBot = cleanLeadParagraph(tarjeta?.parrafoBot || "", tituloLibro, autorLibro);
  if (candidateBot && !phraseIsWeak(candidateBot)) {
    return candidateBot;
  }

  const frases = uniqueStrings(toArrayOfStrings(libro?.frases))
    .map((frase) => cleanLeadParagraph(frase, tituloLibro, autorLibro))
    .filter(Boolean);

  const best = frases.find((frase) => !phraseIsWeak(frase));
  return best || candidateTop || candidateBot || "";
}

function selectActionSubtitle(tarjeta, libro) {
  const subtitle = normalizeText(tarjeta?.subtitulo || "");
  if (subtitle && subtitle.length <= 44 && !phraseIsWeak(subtitle)) {
    return subtitle;
  }

  const palabras = uniqueStrings(toArrayOfStrings(libro?.palabras)).slice(0, 3);
  if (palabras.length >= 2) {
    return `Haz espacio para ${palabras[0].toLowerCase()} y ${palabras[1].toLowerCase()}`;
  }

  return "";
}

function selectActionCopy(tarjeta, libro, tituloLibro = "", autorLibro = "", leadCopy = "") {
  const candidates = [];

  const parrafoBot = stripExplicitBookRefs(tarjeta?.parrafoBot || "", tituloLibro, autorLibro);
  if (parrafoBot) candidates.push(parrafoBot);

  for (const frase of uniqueStrings(toArrayOfStrings(libro?.frases))) {
    const clean = stripExplicitBookRefs(frase, tituloLibro, autorLibro);
    if (clean) candidates.push(clean);
  }

  const ranked = candidates
    .map((text) => ({
      text: ensurePeriod(sentenceCase(text)),
      score: scoreActionPhrase(text)
    }))
    .filter((item) => item.text && item.text.toLowerCase() !== normalizeText(leadCopy).toLowerCase())
    .sort((a, b) => b.score - a.score);

  const chosen = ranked[0]?.text || ensurePeriod(sentenceCase(parrafoBot));
  return clampText(chosen || "", 180);
}

function buildKeywords(libro) {
  const palabras = uniqueStrings(toArrayOfStrings(libro?.palabras)).slice(0, 4);
  return palabras.map((word) => `<span class="keyword">${escapeHTML(word.toLowerCase())}</span>`).join("");
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
    "public/trigguiletras2.png",
    "public/trigguiletras.png",
    "public/trigguiletrascolor3.png",
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

const pastelHighlight = mixHex(accent, "#FFFFFF", 0.78);
const pastelEdge = mixHex(accent, "#FFFFFF", 0.62);
const pastelChip = mixHex(accent, "#FFFFFF", 0.80);
const pastelKeywordBorder = mixHex(accent, "#FFFFFF", 0.66);
const pastelKeywordText = mixHex(accent, "#3F4855", 0.52);

const chipBg = pastelChip;
const chipColor = mixHex(accent, "#31568A", 0.38);
const highlightBg = withAlpha(pastelHighlight, "FF");
const highlightEdge = withAlpha(pastelEdge, "E6");
const highlightText = "#2F343C";
const coverBorder = withAlpha(accent, "18") || "#EAEAEA";

const titleContrast = contrastRatio(titleColor, paper);
const subtitleContrast = contrastRatio(subtitleColor, paper);
console.log(`   📐 Contraste título/fondo: ${titleContrast.toFixed(2)}:1 ${titleContrast >= 4.5 ? "✅" : "⚠️"}`);
console.log(`   📐 Contraste subtítulo/fondo: ${subtitleContrast.toFixed(2)}:1 ${subtitleContrast >= 3 ? "✅" : "⚠️"}`);

const selectedTitle = selectCardTitle(tarjeta, libro, tituloLibro);
const selectedLead = selectLeadCopy(tarjeta, libro, tituloLibro, autorLibro);
const selectedActionTitle = selectActionSubtitle(tarjeta, libro);
const selectedAction = selectActionCopy(tarjeta, libro, tituloLibro, autorLibro, selectedLead);

const parrafoTopHTML = renderHighlightHTML(selectedLead);
const parrafoBotHTML = renderHighlightHTML(selectedAction);

const portadaURL = resolvePortadaURL(bookMeta, libro);
const portadaSource = resolvePortadaSource(bookMeta, libro, portadaURL);

const portadaSection = portadaURL
  ? `<img class="cover" src="${portadaURL}" alt="Portada de ${escapeHTML(tituloLibro)}" />`
  : "";

const keywordsSection = buildKeywords(libro);

const brandLogoDataURL = await resolveBrandLogoDataURL();
const brandSection = brandLogoDataURL
  ? `
    <div class="brand-wrap">
      <img class="brand-logo" src="${brandLogoDataURL}" alt="Triggui" />
      <div class="brand-sub">@triggui | triggui.com</div>
    </div>`
  : `
    <div class="brand-wrap">
      <div class="brand-fallback">triggui®</div>
      <div class="brand-sub">@triggui | triggui.com</div>
    </div>`;

let html = template
  .replace("{{PORTADA_SECTION}}", portadaSection)
  .replace("{{TITULO}}", escapeHTML(selectedTitle))
  .replace("{{AUTOR}}", escapeHTML(autorLibro))
  .replace("{{PARRAFO_TOP}}", parrafoTopHTML)
  .replace("{{KEYWORDS_SECTION}}", keywordsSection)
  .replace("{{SUBTITULO}}", escapeHTML(selectedActionTitle))
  .replace("{{PARRAFO_BOT}}", parrafoBotHTML)
  .replace("{{BRAND_SECTION}}", brandSection);

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
  `--highlight-edge: ${highlightEdge}`,
  `--highlight-color: ${highlightText}`,
  `--border-color: ${borderColor}`,
  `--cover-border: ${coverBorder}`,
  `--keyword-border: ${pastelKeywordBorder}`,
  `--keyword-color: ${pastelKeywordText}`,
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

await page.evaluate(async () => {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }
});

if (portadaURL) {
  try {
    await page.waitForSelector(".cover", { state: "visible", timeout: 10000 });
    await page.waitForTimeout(350);
  } catch {
    console.log("   ⚠️  Portada no cargó en 10s — continuando sin ella");
  }
}

await page.evaluate(() => {
  const px = (el, prop) => {
    if (!el) return 0;
    return parseFloat(getComputedStyle(el)[prop]) || 0;
  };

  const setPx = (el, prop, value) => {
    if (!el) return;
    el.style[prop] = `${value}px`;
  };

  const hero = document.querySelector(".hero");
  const heroCopy = document.querySelector(".hero-copy");
  const title = document.querySelector(".title");
  const chip = document.querySelector(".author-chip");
  const topParagraph = document.querySelector(".paragraph-top");
  const cover = document.querySelector(".cover");
  const keywords = document.querySelector(".keywords");

  let guardHero = 0;
  while (hero && hero.scrollHeight > hero.clientHeight && guardHero < 220) {
    let changed = false;

    const titleSize = px(title, "fontSize");
    const titleLine = px(title, "lineHeight");
    const chipSize = px(chip, "fontSize");
    const chipHeight = px(chip, "minHeight");
    const topSize = px(topParagraph, "fontSize");
    const topLine = px(topParagraph, "lineHeight");
    const coverWidth = px(cover, "maxWidth") || px(cover, "width");
    const keywordSize = keywords ? px(keywords.querySelector(".keyword"), "fontSize") : 0;

    if (title && titleSize > 60) {
      setPx(title, "fontSize", titleSize - 1);
      if (titleLine > 0) setPx(title, "lineHeight", Math.max(titleLine - 1, titleSize - 4));
      changed = true;
    }

    if (topParagraph && topSize > 27) {
      setPx(topParagraph, "fontSize", topSize - 0.45);
      if (topLine > 0) setPx(topParagraph, "lineHeight", Math.max(topLine - 0.7, topSize * 1.32));
      changed = true;
    }

    if (chip && chipSize > 24 && guardHero % 2 === 0) {
      setPx(chip, "fontSize", chipSize - 0.35);
      if (chipHeight > 46) setPx(chip, "minHeight", chipHeight - 0.35);
      changed = true;
    }

    if (cover && coverWidth > 238 && guardHero % 2 === 0) {
      cover.style.maxWidth = `${coverWidth - 0.9}px`;
      changed = true;
    }

    if (keywords && keywordSize > 16 && guardHero % 3 === 0) {
      keywords.querySelectorAll(".keyword").forEach((el) => {
        const fs = px(el, "fontSize");
        const mh = px(el, "minHeight");
        const pl = px(el, "paddingLeft");
        const pr = px(el, "paddingRight");
        if (fs > 16) setPx(el, "fontSize", fs - 0.35);
        if (mh > 32) setPx(el, "minHeight", mh - 0.35);
        if (pl > 10) {
          setPx(el, "paddingLeft", pl - 0.2);
          setPx(el, "paddingRight", pr - 0.2);
        }
      });
      changed = true;
    }

    if (!changed) break;
    guardHero += 1;
  }

  const action = document.querySelector(".action");
  const actionTitle = document.querySelector(".action-title");
  const bottomParagraph = document.querySelector(".paragraph-bottom");

  let guardAction = 0;
  while (action && action.scrollHeight > action.clientHeight && guardAction < 180) {
    let changed = false;

    const actionTitleSize = px(actionTitle, "fontSize");
    const actionTitleLine = px(actionTitle, "lineHeight");
    const bottomSize = px(bottomParagraph, "fontSize");
    const bottomLine = px(bottomParagraph, "lineHeight");

    if (actionTitle && actionTitle.textContent.trim() && actionTitleSize > 24) {
      setPx(actionTitle, "fontSize", actionTitleSize - 0.35);
      if (actionTitleLine > 0) setPx(actionTitle, "lineHeight", Math.max(actionTitleLine - 0.35, actionTitleSize * 1.12));
      changed = true;
    }

    if (bottomParagraph && bottomSize > 24) {
      setPx(bottomParagraph, "fontSize", bottomSize - 0.45);
      if (bottomLine > 0) setPx(bottomParagraph, "lineHeight", Math.max(bottomLine - 0.6, bottomSize * 1.3));
      changed = true;
    }

    if (!changed) break;
    guardAction += 1;
  }

  if (action && action.scrollHeight > action.clientHeight && bottomParagraph) {
    const available = action.clientHeight - (actionTitle ? actionTitle.getBoundingClientRect().height : 0) - 10;
    const lineHeight = px(bottomParagraph, "lineHeight") || (px(bottomParagraph, "fontSize") * 1.35);
    const lines = Math.max(3, Math.floor(available / lineHeight));

    bottomParagraph.style.display = "-webkit-box";
    bottomParagraph.style.webkitBoxOrient = "vertical";
    bottomParagraph.style.webkitLineClamp = String(lines);
    bottomParagraph.style.overflow = "hidden";
  }

  if (heroCopy && keywords && keywords.children.length === 0) {
    keywords.style.display = "none";
  }
});

await page.waitForTimeout(220);

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
console.log(`   🎨 Título: "${selectedTitle}"`);
console.log(`   ✍️  Autor: ${autorLibro}`);
console.log(`   🖼️  Portada: ${portadaURL ? portadaSource : "tipográfica"}`);
console.log(`   📝 Lead: ${selectedLead}`);
console.log(`   ⚡ Action: ${selectedAction}`);
