// ════════════════════════════════════════════════════════════════════════
// 🖼️ PORTADA REAL — una sola regla para elegir portada en todo Triggui
// ════════════════════════════════════════════════════════════════════════
// Nació de la #104 (Don't Believe Everything You Think, 29-sep-2026): el buscador
// encontró 8 portadas válidas, incluida una de Apple de 1600×2357, pero se guardó
// la PRIMERA (un placeholder de Google). La regla aquí es una sola:
//
//   la mejor portada se elige por PÍXELES REALES — nunca por la etiqueta de
//   tamaño que declara la fuente, nunca por el orden en que llegó.
//
// Una candidata es válida si: descarga bien, pesa ≥12 KB, mide ≥300 px de ancho,
// tiene proporción de libro (ancho/alto entre 0.5 y 0.9, la misma de la escalera) y NO es placeholder
// (detector por píxeles: scripts/es_placeholder.py). Entre las válidas gana la de
// más ancho real; empate → Apple > Open Library > Google > otras.
//
// El ISBN es la fuente más exacta que existe: identifica la edición sin ambigüedad
// de título ni de autor (Apple lista a veces la editorial como autor: "Mentor Press").
// ════════════════════════════════════════════════════════════════════════
import { spawnSync } from "node:child_process";
import { autorCoincide, esResumen } from "./identidad-libro.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DETECTOR = path.resolve(AQUI, "../../scripts/es_placeholder.py");
const TIMEOUT_MS = 12000;

/** Ancho y alto leyendo el encabezado JPEG/PNG/WebP (sin librerías). */
export function dimensiones(buf) {
  try {
    if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
      const t = buf.toString("ascii", 12, 16);
      if (t === "VP8X") return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
      if (t === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      if (t === "VP8L") { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5) };
        if (m === 0xd8 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch { /* encabezado ilegible */ }
  return { w: 0, h: 0 };
}

/** ¿Placeholder? (detector por píxeles en Python+Pillow). Sin detector → nunca bloquea. */
export function esPlaceholder(buf) {
  try {
    const r = spawnSync("python3", [DETECTOR, "-"], { input: buf, timeout: 20000 });
    return r.status === 0 && String(r.stdout || "").trim() === "1";
  } catch { return false; }
}

function fuenteDe(url) {
  const u = String(url || "");
  if (/mzstatic\.com/.test(u)) return "apple";
  if (/openlibrary\.org/.test(u)) return "openlibrary";
  if (/books\.google|googleusercontent/.test(u)) return "google";
  if (/amazon|ssl-images-amazon/.test(u)) return "amazon";
  return "otra";
}
const PREFERENCIA = { apple: 4, openlibrary: 3, google: 2, amazon: 2, otra: 1 };

async function traer(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 Triggui/portada" } });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch { return null; } finally { clearTimeout(t); }
}

/** Descarga y mide una candidata. */
export async function medirPortada(url) {
  const buf = await traer(url);
  if (!buf) return { url, ok: false, motivo: "no descarga" };
  const { w, h } = dimensiones(buf);
  const aspecto = h ? w / h : 0;
  const base = { url, w, h, bytes: buf.length, aspecto: Number(aspecto.toFixed(3)), fuente: fuenteDe(url) };
  if (buf.length < 12000) return { ...base, ok: false, motivo: "pesa <12KB" };
  if (w < 300) return { ...base, ok: false, motivo: "mide <300px" };
  if (aspecto < 0.5 || aspecto > 0.9) return { ...base, ok: false, motivo: "no tiene proporción de libro" };
  if (esPlaceholder(buf)) return { ...base, ok: false, motivo: "placeholder (píxeles)" };
  return { ...base, ok: true };
}

/** Variantes de mayor resolución de una misma URL (Apple y Google sirven más píxeles si se piden). */
export function variantes(url) {
  const u = String(url || "");
  const out = [u];
  if (/mzstatic\.com/.test(u)) out.push(u.replace(/\/[0-9]+x[0-9]+[a-z]*(-[0-9]+)?\.(jpg|png|webp)/i, "/1200x1200bb.$2"));
  if (/books\.google/.test(u) && /[?&]id=/.test(u)) {
    const id = (u.match(/[?&]id=([^&]+)/) || [])[1];
    if (id) out.push(`https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=0&source=gbs_api&fife=w1200`);
  }
  if (/covers\.openlibrary\.org/.test(u)) out.push(u.replace(/-[SM]\.jpg/i, "-L.jpg"));
  return [...new Set(out.filter(Boolean))];
}

/** Candidatas EXACTAS por ISBN: Open Library, Apple (lookup) y Google. */
export async function candidatasPorISBN(isbn) {
  const i = String(isbn || "").replace(/[^0-9Xx]/g, "");
  if (i.length !== 10 && i.length !== 13) return [];
  const out = [`https://covers.openlibrary.org/b/isbn/${i}-L.jpg?default=false`];
  for (const pais of ["us", "mx"]) {
    const d = await traer(`https://itunes.apple.com/lookup?isbn=${i}&country=${pais}`);
    try {
      for (const r of (JSON.parse(String(d || "{}")).results || [])) if (r.artworkUrl100) out.push(r.artworkUrl100.replace("100x100bb", "1200x1200bb"));
    } catch { /* sin resultado */ }
  }
  const g = await traer(`https://www.googleapis.com/books/v1/volumes?q=isbn:${i}`);
  try {
    for (const it of (JSON.parse(String(g || "{}")).items || []).slice(0, 2)) {
      out.push(`https://books.google.com/books/content?id=${it.id}&printsec=frontcover&img=1&zoom=0&source=gbs_api&fife=w1200`);
    }
  } catch { /* sin resultado */ }
  return [...new Set(out)];
}

/**
 * Elige la mejor portada real. IDENTIDAD ANTES QUE PÍXELES (#104, 5-oct-2026: se publicó la portada de un
 * RESUMEN de Mentor Press —1600 px, mismo título exacto— en lugar de la del libro de Joseph Nguyen).
 *
 * Cada candidata es una URL o un objeto { url, autorListado, tituloListado, exacta }:
 *   · CONFIABLE   = viene del ISBN exacto, o el autor firmado en su listado ES el autor del libro (y no es resumen)
 *   · DESCONOCIDA = URL sin datos de su listado: solo se usa si no hay ninguna confiable
 *   · DESCARTADA  = el listado lo firma otra persona/editorial, o es un resumen/guía: jamás se usa
 * Dentro de cada grupo gana la de más píxeles reales.
 * Devuelve { mejor, validas, descartadas } — `validas` contiene solo candidatas del grupo ganador.
 */
export async function elegirPortadaReal(cands, { isbn = "", autor = "", titulo = "" } = {}) {
  const porUrl = new Map();
  const poner = (url, meta) => {
    if (!/^https?:\/\//.test(String(url || ""))) return;
    for (const v of variantes(url)) if (!porUrl.has(v) || meta.confianza > porUrl.get(v).confianza) porUrl.set(v, meta);
  };
  const rechazadas = [];
  for (const c of cands) {
    const o = typeof c === "string" ? { url: c } : (c || {});
    let confianza = 1, motivo = "";                                     // 1 = desconocida
    if (o.exacta) confianza = 2;
    else if (o.autorListado || o.tituloListado) {
      if (esResumen({ titulo: o.tituloListado || "", autor: o.autorListado || "" })) { confianza = 0; motivo = "es resumen/guía"; }
      else if (autor && o.autorListado && !autorCoincide(autor, o.autorListado)) { confianza = 0; motivo = `firmado por «${o.autorListado}», no por ${autor}`; }
      else if (autor && o.autorListado) confianza = 2;
    }
    if (confianza === 0) { rechazadas.push({ url: o.url, ok: false, fuente: fuenteDe(o.url), motivo }); continue; }
    poner(o.url, { confianza });
  }
  for (const u of await candidatasPorISBN(isbn)) poner(u, { confianza: 2 });
  const medidas = await Promise.all([...porUrl.keys()].map(async (u) => ({ ...(await medirPortada(u)), confianza: porUrl.get(u).confianza })));
  const buenas = medidas.filter((m) => m.ok);
  const top = buenas.some((m) => m.confianza === 2) ? 2 : 1;           // si hay verificadas, las desconocidas ni compiten
  const validas = buenas.filter((m) => m.confianza === top).sort((a, b) => (b.w - a.w) || (PREFERENCIA[b.fuente] - PREFERENCIA[a.fuente]));
  return { mejor: validas[0] || null, validas, descartadas: [...rechazadas, ...medidas.filter((m) => !m.ok)] };
}
