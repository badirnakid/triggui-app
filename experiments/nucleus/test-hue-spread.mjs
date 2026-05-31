/* test-hue-spread.mjs — verificación dura de la Capa 2 (farthest-point) sobre 90 libros reales. */
import fs from "node:fs";
import { placeHueInGap, bookHueKey } from "./deterministic-hue.js";
import { synthesizePalette } from "./palette-synthesizer.js";

const SRC = process.env.SRC || "/tmp/tc/contenido.json";
const libros = JSON.parse(fs.readFileSync(SRC, "utf8")).libros;

const uniq = (a) => new Set(a).size;
const sortH = (h) => [...h].sort((a, b) => a - b);
function gaps(h) {
  const s = sortH(h); let mn = Infinity, mx = 0;
  for (let i = 1; i < s.length; i++) { const g = s[i] - s[i - 1]; mn = Math.min(mn, g); mx = Math.max(mx, g); }
  const wrap = 360 - s[s.length - 1] + s[0]; mn = Math.min(mn, wrap); mx = Math.max(mx, wrap);
  return { mn, mx };
}
function sectors(h, n = 12) { const c = new Array(n).fill(0); h.forEach(x => c[Math.min(n - 1, Math.floor(x / (360 / n)))]++); return c; }

// Simula la generación del catálogo: cada libro se coloca en el hueco más grande de los YA colocados.
function runOnce() {
  const occupied = [];
  const out = [];
  for (const b of libros) {
    const si = (b._visual && b._visual.synthesis_inputs) || {};
    const llmHue = typeof si.hue_primary === "number" ? si.hue_primary : 210;
    const hue = placeHueInGap(occupied, llmHue);
    occupied.push(hue);
    const pal = synthesizePalette({
      hue_primary: hue,
      saturation: si.saturation || "vivid",
      lightness_paper: si.lightness_paper || "light",
      temperature_shift: typeof si.temperature_shift === "number" ? si.temperature_shift : 0,
      palette_strategy: si.palette_strategy || "complementary",
    });
    out.push({ key: bookHueKey(b), llmHue, hue, palette: JSON.stringify(pal.palette), contrast: parseFloat(pal.contrast_ratio) });
  }
  return out;
}

console.log("════════ ANTES (estado actual en contenido.json) ════════");
console.log("  paletas únicas:", uniq(libros.map(b => JSON.stringify(b.colores))), "de", libros.length);

const rows = runOnce();
const hues = rows.map(r => r.hue);
const palettes = rows.map(r => r.palette);
const contrasts = rows.map(r => r.contrast);
const { mn, mx } = gaps(hues);

console.log("\n════════ DESPUÉS (Capa 2 — farthest-point determinista) ════════");
console.log("  hues únicos:        ", uniq(hues.map(h => h.toFixed(4))), "de", libros.length);
console.log("  paletas únicas:     ", uniq(palettes), "de", libros.length);
console.log("  gap min / max:      ", mn.toFixed(2) + "° / " + mx.toFixed(2) + "°", "(uniforme ideal ≈", (360 / libros.length).toFixed(1) + "°)");
console.log("  distribución 12 sectores:", sectors(hues).join(" "));
console.log("  contraste AA (≥4.5): ", contrasts.filter(c => c >= 4.5).length, "de", libros.length, "| mínimo:", Math.min(...contrasts).toFixed(2) + ":1");

// Determinismo: correr la secuencia completa otra vez → idéntica
const rows2 = runOnce();
const deterministic = rows2.every((r, i) => r.hue === hues[i]);
console.log("\n════════ DETERMINISMO ════════");
console.log("  misma secuencia → mismos hues (2 corridas):", deterministic ? "✅ idéntico" : "❌ DIFIERE");

const ok = uniq(palettes) === libros.length && contrasts.every(c => c >= 4.5) && deterministic && mx < 30;
console.log("\n════════ VEREDICTO ════════");
console.log(ok
  ? `🟢 NIVEL DIOS: ${libros.length}/${libros.length} paletas únicas, repartidas (gap max ${mx.toFixed(1)}°), AA garantizado, determinista.`
  : "🔴 revisar — alguna garantía no se cumple.");
process.exit(ok ? 0 : 1);
