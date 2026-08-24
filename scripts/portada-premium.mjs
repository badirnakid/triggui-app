/**
 * portada-premium.mjs — Escalera A/B/C de portadas (Fábrica · Cortes 2-3)
 * A: real ≥600 de ancho, aspecto 0.55–0.85, ≥30KB → transcodificada JPEG q90
 * B: real 380–599 → reescalado canvas alta calidad a 600w → JPEG q88
 * C: Colección Triggui — HTML/CSS renderizado (Fraunces + espiral SVG + paleta del libro) → JPEG q90
 * Escribe {outDir}/portada.jpg y devuelve { tier, source, dataURI }.
 * Autónomo: lanza su propio chromium (playwright | playwright-core + PORTADA_CHROMIUM).
 */
import fs from "node:fs/promises";
import path from "node:path";

async function lanzar() {
  let pw;
  try { pw = await import("playwright"); }
  catch { pw = await import("playwright-core"); }
  const exe = process.env.PORTADA_CHROMIUM || undefined;
  return pw.chromium.launch(exe ? { executablePath: exe, args: ["--no-sandbox"] } : { args: ["--no-sandbox"] });
}

function dimsDe(buf) {
  try {
    if (buf[0] === 0x89 && buf[1] === 0x50) // PNG
      return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), fmt: "png" };
    if (buf[0] === 0xff && buf[1] === 0xd8) { // JPEG: buscar SOFn
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
          return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), fmt: "jpeg" };
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP")
      return { w: 1 + buf.readUInt16LE(26), h: 1 + buf.readUInt16LE(28), fmt: "webp" }; // VP8 lossy aprox
  } catch {}
  return null;
}

function candidatas(meta) {
  const out = [];
  const u = meta.portadaURL || "";
  if (u) {
    out.push(u);
    if (/mzstatic\.com/.test(u)) out.push(u.replace(/\/[0-9]+x[0-9]+[a-z]*\.(jpg|png|webp)/i, "/600x900bb.$1"));
    if (/books\.google/.test(u)) {
      let g = u.replace(/zoom=\d/, "zoom=3");
      out.push(g + (g.includes("fife=") ? "" : "&fife=w800"));
    }
  }
  return [...new Set(out)];
}

async function bajar(url) {
  try {
    const r = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 Triggui" } });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    const d = dimsDe(buf);
    if (!d || !d.w || !d.h) return null;
    return { buf, ...d, bytes: buf.length, url };
  } catch { return null; }
}

async function buscarITunes(meta) {
  try {
    for (const cc of ["mx", "us"]) {
      const q = encodeURIComponent(`${meta.titulo || ""} ${meta.autor || ""}`.trim());
      const r = await fetch(`https://itunes.apple.com/search?term=${q}&media=ebook&limit=3&country=${cc}`);
      if (!r.ok) continue;
      const j = await r.json();
      for (const it of j.results || []) {
        if (it.artworkUrl100) return it.artworkUrl100.replace(/\/[0-9]+x[0-9]+[a-z]*\.(jpg|png)/i, "/600x900bb.$1");
      }
    }
  } catch {}
  return null;
}

function aspectoOk(d) { const a = d.w / d.h; return a >= 0.5 && a <= 0.9; }

async function transcodificar(page, buf, fmt, targetW, calidad) {
  const dataIn = `data:image/${fmt};base64,${buf.toString("base64")}`;
  const out = await page.evaluate(async ({ dataIn, targetW, calidad }) => {
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = dataIn; });
    const w = targetW || img.naturalWidth;
    const h = Math.round(img.naturalHeight * (w / img.naturalWidth));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
    x.drawImage(img, 0, 0, w, h);
    return c.toDataURL("image/jpeg", calidad);
  }, { dataIn, targetW, calidad });
  return Buffer.from(out.split(",")[1], "base64");
}

function htmlColeccion(meta) {
  const cs = (meta.colores || []).filter(c => /^#[0-9a-fA-F]{6}$/.test(c));
  const lum = h => { const n = parseInt(h.slice(1), 16); const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255; return .2126 * r + .7152 * g + .0722 * b; };
  const ord = [...cs].sort((a, b) => lum(a) - lum(b));
  const campo = ord[0] || "#101426", a1 = ord[2] || ord[1] || "#E8A838", a2 = ord[1] || "#7b61ff";
  const ink = lum(campo) < .5 ? "#F8F4EC" : "#161412";
  const t = (meta.titulo || "").replace(/</g, "&lt;");
  const au = (meta.autor || "").toUpperCase().replace(/</g, "&lt;");
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Manrope:wght@400..800&display=swap" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box} html,body{width:600px;height:900px}
body{background:${campo};color:${ink};font-family:'Manrope',sans-serif;position:relative;overflow:hidden}
.banda{position:absolute;left:0;right:0;top:0;height:150px;background:${a1}}
.filete{position:absolute;left:0;right:0;top:150px;height:12px;background:${a2}}
.base{position:absolute;left:0;right:0;bottom:0;height:64px;background:${lum(a1) < lum(a2) ? a1 : a2}}
.kick{position:absolute;left:64px;top:60px;font:700 16px 'Manrope';letter-spacing:.42em;color:${lum(a1) >= .5 ? "#161412" : "#F8F4EC"}}
.bloque{position:absolute;left:64px;right:64px;bottom:200px}
.regla{width:72px;height:4px;background:${ink};margin-bottom:26px}
h1{font-family:'Fraunces';font-weight:760;font-variation-settings:'opsz' 144;font-size:76px;line-height:1.06;letter-spacing:-.01em}
.autor{margin-top:18px;font:650 19px 'Manrope';letter-spacing:.28em;opacity:.86}
.marco{position:absolute;inset:20px;border:2px solid ${ink}44;pointer-events:none}
.marco2{position:absolute;inset:28px;border:1px solid ${ink}22}
.colofon{position:absolute;left:64px;bottom:78px;display:flex;align-items:center;gap:14px;opacity:.9}
.colofon span{font:700 15px 'Manrope';letter-spacing:.34em}
</style></head><body>
<div class="banda"></div><div class="filete"></div><div class="base"></div>
<div class="kick">TRIGGUI · COLECCIÓN</div>
<div class="bloque"><div class="regla"></div><h1 id="t">${t}</h1><div class="autor">${au}</div></div>
<div class="colofon"><svg width="30" height="30" viewBox="-16 -16 32 32"><path d="${(() => { let p = "M 0 0"; for (let i = 1; i <= 140; i++) { const th = i / 140 * 2.4 * 2 * Math.PI, r = 14 * i / 140; p += ` L ${(r * Math.cos(th)).toFixed(2)} ${(r * Math.sin(th)).toFixed(2)}`; } return p; })()}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></svg><span>EDICIONES TRIGGUI</span></div>
<div class="marco"></div><div class="marco2"></div>
<script>
const t=document.getElementById('t'); let s=76;
while((t.scrollHeight>4.3*s || t.scrollWidth>t.clientWidth) && s>40){ s-=4; t.style.fontSize=s+'px'; }
</script></body></html>`;
}

export async function resolverPortadaPremium(meta, outDir) {
  const destino = path.join(outDir, "portada.jpg");
  const browser = await lanzar();
  try {
    const page = await browser.newPage({ viewport: { width: 600, height: 900 } });
    let mejor = null;
    const urls = candidatas(meta);
    const extra = await buscarITunes(meta);
    if (extra) urls.push(extra);
    for (const u of urls) {
      const d = await bajar(u);
      if (d && aspectoOk(d) && d.bytes >= 12000 && (!mejor || d.w > mejor.w)) mejor = d;
    }
    let buf, tier, source;
    if (mejor && mejor.w >= 600 && mejor.bytes >= 30000) {
      buf = await transcodificar(page, mejor.buf, mejor.fmt, 0, 0.9); tier = "A"; source = mejor.url;
    } else if (mejor && mejor.w >= 380) {
      buf = await transcodificar(page, mejor.buf, mejor.fmt, 600, 0.88); tier = "B"; source = mejor.url;
    } else {
      await page.setContent(htmlColeccion(meta), { waitUntil: "networkidle" });
      await page.waitForTimeout(350);
      buf = await page.screenshot({ type: "jpeg", quality: 90, clip: { x: 0, y: 0, width: 600, height: 900 } });
      tier = "C"; source = "coleccion-triggui";
    }
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(destino, buf);
    return { tier, source, file: destino, dataURI: `data:image/jpeg;base64,${buf.toString("base64")}` };
  } finally { await browser.close(); }
}
