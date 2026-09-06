/**
 * build-video-og.js — OG del video (video_og.jpg, 1200×630) para el paso 🎬 del pipeline (tras resolver videos).
 * Lee /tmp/triggui-book.json (slug) + contenido.json (con _video). Misma plantilla que scripts/build-video-og.py.
 * Nunca rompe el pipeline: cualquier fallo se reporta y sale con 0.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const LOGO = "https://raw.githubusercontent.com/badirnakid/triggui-app/main/public/trigguiletrasblanco2.png";
async function thumb(id) {
  for (const q of ["maxresdefault", "hqdefault"]) {
    const u = `https://i.ytimg.com/vi/${id}/${q}.jpg`;
    try { const r = await fetch(u, { method: "HEAD" }); if (r.ok && Number(r.headers.get("content-length") || 0) > 2000) return u; } catch {}
  }
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
try {
  const meta = JSON.parse(await fs.readFile("/tmp/triggui-book.json", "utf8"));
  const cat = process.argv[2] || "contenido.json";
  const libros = JSON.parse(await fs.readFile(cat, "utf8")).libros || [];
  const libro = libros.find((l) => l._slug === meta.slug) || libros.find((l) => l.titulo === meta.titulo);
  if (!libro) { console.log(`ℹ️  sin libro para ${meta.slug}`); process.exit(0); }
  const v = ((libro._video || {}).candidatos || []).find((x) => x && x.id);
  if (!v) { console.log("ℹ️  sin video"); process.exit(0); }
  const outBase = process.env.TRIGGUI_OUT_BASE || "public/t";
  const outDir = path.join(outBase, meta.slug); await fs.mkdir(outDir, { recursive: true });
  const cols = Array.isArray(libro.colores) ? libro.colores : []; const A = cols[0] || "#E8A838", B = cols[1] || A;
  const tpl = await fs.readFile("scripts/templates/og-video.html", "utf8"); const tit = String(v.titulo || "");
  const html = tpl.replace("{{ACCENT}}", esc(A)).replace("{{ACCENT2}}", esc(B)).replace("{{THUMB}}", await thumb(v.id))
    .replace("{{CLASE}}", tit.length > 60 ? " larga" : "").replace("{{TITULO}}", esc(tit.slice(0, 140))).replace("{{CANAL}}", esc(v.canal || ""))
    .replace("{{LOGO}}", LOGO).replace("{{LIBRO}}", esc(libro.titulo || ""));
  const browser = await chromium.launch({ headless: true }); const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: "networkidle" }); await page.waitForTimeout(250);
  const out = path.join(outDir, "video_og.jpg");
  await page.screenshot({ path: out, type: "jpeg", quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await browser.close(); console.log(`   🎬 OG video: ${out}`);
} catch (e) { console.log(`   ⚠️ OG video omitido: ${e && e.message}`); }
