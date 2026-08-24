/**
 * derivar-publico.mjs — F1·S3: catálogo PUBLICO (dieta selectiva).
 * El MAESTRO conserva TODO (cada víscera esperando su momento).
 * El PUBLICO es lo que viaja al bolsillo del usuario: solo lo que el cliente USA.
 * Censo de consumidores (2026-08-24, verificado contra código vivo):
 *   VIVAS en cliente → se quedan: _nucleus.{edition_blocks_es,edition_blocks_en,
 *     og_phrases_es,og_phrases_en,book_grounding_anchors} + todo top-level + _video.
 *   MUERTAS en cliente → fuera del viaje: _grounding, _curator_meta y el resto de _nucleus
 *     (book_identity, lens_analysis, visual_intent, surface_hints, confidence,
 *      card_es/en, emotional_words_*).
 * Uso: node scripts/derivar-publico.mjs <ruta/contenido[_kids].json>
 * Escribe hermano: <mismo-dir>/<nombre>_publico.json
 */
import fs from "node:fs";
import path from "node:path";

const VIVAS = new Set([
  "edition_blocks_es", "edition_blocks_en",
  "og_phrases_es", "og_phrases_en",
  "book_grounding_anchors",
]);
const FUERA_TOP = new Set(["_grounding", "_curator_meta"]);

const src = process.argv[2];
if (!src || !fs.existsSync(src)) { console.error("uso: derivar-publico.mjs <catalogo.json>"); process.exit(2); }
const d = JSON.parse(fs.readFileSync(src, "utf8"));
const antes = fs.statSync(src).size;

const libros = (d.libros || []).map(b => {
  const b2 = {};
  for (const [k, v] of Object.entries(b)) {
    if (FUERA_TOP.has(k)) continue;
    if (k === "_nucleus" && v && typeof v === "object") {
      const n2 = {};
      for (const [nk, nv] of Object.entries(v)) if (VIVAS.has(nk)) n2[nk] = nv;
      b2[k] = n2;
    } else b2[k] = v;
  }
  return b2;
});
const pub = { ...d, libros };
const dst = src.replace(/\.json$/, "_publico.json");
fs.writeFileSync(dst, JSON.stringify(pub, null, 2), "utf8");
const despues = fs.statSync(dst).size;
console.log(`🥗 publico: ${path.basename(dst)} · ${(antes/1024).toFixed(0)}KB → ${(despues/1024).toFixed(0)}KB · libros=${libros.length}`);
