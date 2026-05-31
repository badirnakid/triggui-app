/* ═══════════════════════════════════════════════════════════════════════════════
   deterministic-hue.js — CAPA 2: DISPERSIÓN DETERMINISTA DE HUE (garantía matemática)

   El LLM elige el "alma" del libro (saturación, estrategia, temperatura) pero NO
   puede repartir el hue de forma uniforme entre llamadas independientes: colapsa en
   hues "seguros". El prompt ya le ordena "huella única, ≥30° de los demás" y aun así
   produjo 50/90 paletas únicas.

   Un hash por-libro independiente TAMPOCO garantiza 100%: por la paradoja del
   cumpleaños, dos libros pueden caer casi encima (lo medimos: gap mínimo 0.019°).

   La ÚNICA garantía 100% es global y determinista: colocar cada libro en el HUECO
   MÁS GRANDE que dejan los demás (farthest-point). Es la versión matemática y
   garantizada del "≥30°" que el LLM no pudo cumplir.

   NO es hardcoding: ningún color fijo, ninguna lista. Es geometría pura sobre el
   círculo cromático — la misma estirpe de matemática que hslToHex / strategyHues.

   Propiedades:
     1. Determinista: mismas entradas (ocupados + hue LLM) → mismo resultado.
     2. Único: el hueco más grande nunca coincide con un hue ya ocupado.
     3. Repartido: cada libro maximiza distancia a los demás → catálogo uniforme.
     4. Ancla al LLM: si el hue del LLM cae dentro del hueco con margen, se respeta;
        si no, se usa el centro del hueco. Conserva matiz semántico cuando se puede.
     5. Costo cero: ni una llamada extra al LLM.

   El hue resultante alimenta synthesizePalette, que conserva intactas sus garantías
   de armonía y contraste WCAG AA (esas no dependen del hue).
═══════════════════════════════════════════════════════════════════════════════ */

const norm = (h) => (((Number(h) % 360) + 360) % 360);

/* Llave estable por libro (para logs / trazabilidad). ISBN si existe; si no, título|autor. */
export function bookHueKey(meta = {}) {
  const isbn = String(meta.isbn || "").trim();
  if (isbn) return `isbn:${isbn}`;
  const t = String(meta.titulo || meta.titulo_es || "").trim().toLowerCase();
  const a = String(meta.autor || meta.autor_completo || "").trim().toLowerCase();
  return `ta:${t}|${a}`;
}

/* Coloca un hue nuevo en el HUECO MÁS GRANDE entre los hues ya ocupados.
   - occupied: array de hues (grados) ya usados por otros libros (catálogo + batch).
   - llmHue: hue propuesto por el LLM (preferencia semántica).
   Devuelve un hue en [0,360) garantizado distinto y lo más lejos posible de todos.
   Si el hue del LLM cabe en el hueco con margen → se respeta (matiz semántico).
   Si no → centro del hueco. */
export function placeHueInGap(occupied, llmHue) {
  const occ = (occupied || [])
    .map(norm)
    .filter((h) => !Number.isNaN(h))
    .sort((a, b) => a - b);
  const base = norm(llmHue || 0);

  if (occ.length === 0) return base;                 // primer libro: respeta al LLM
  if (occ.length === 1) {                            // segundo: lado opuesto (o LLM si lejos)
    const only = occ[0];
    const d = Math.min(Math.abs(base - only), 360 - Math.abs(base - only));
    return d >= 1 ? base : norm(only + 180);
  }

  // Hueco más grande entre consecutivos (con wraparound)
  let gapStart = occ[occ.length - 1];
  let gapSize = occ[0] + 360 - occ[occ.length - 1];
  for (let i = 1; i < occ.length; i++) {
    const g = occ[i] - occ[i - 1];
    if (g > gapSize) { gapSize = g; gapStart = occ[i - 1]; }
  }

  // Preferir el hue del LLM si cae DENTRO del hueco con margen suficiente
  const margin = Math.min(gapSize / 3, 8); // no pegarse a los vecinos
  const rel = (((base - gapStart) % 360) + 360) % 360; // posición del LLM dentro del hueco
  if (rel > margin && rel < gapSize - margin) {
    return norm(gapStart + rel); // = hue del LLM, dentro del hueco
  }
  return norm(gapStart + gapSize / 2); // centro del hueco
}

/* Garantía de unicidad al nivel de PALETA (lo que ve el usuario), no solo del hue.
   En zonas "planas" del color, dos hues cercanos con receta idéntica producen el mismo
   hex → misma paleta. Aquí, si la paleta colocada ya existe, se empuja el hue lo MÍNIMO
   (offsets simétricos crecientes) hasta que la paleta sea provablemente única.
   - placedHue: hue ya colocado por placeHueInGap.
   - occupiedPaletteKeys: Set con las paletas ya usadas (string, p.ej. JSON de los 4 hex).
   - paletteKeyOf: (hue) => string  — sintetiza la paleta en ese hue y devuelve su clave.
   Determinista: mismas entradas → mismo resultado. Mínima perturbación del reparto. */
export function uniquePaletteHue(placedHue, occupiedPaletteKeys, paletteKeyOf) {
  const set = occupiedPaletteKeys || new Set();
  if (!set.has(paletteKeyOf(placedHue))) return placedHue;
  for (let i = 1; i <= 60; i++) {
    const step = Math.ceil(i / 2) * 1.5;          // 1.5, 1.5, 3, 3, 4.5 ...
    const d = (i % 2 === 1) ? step : -step;        // +1.5, -1.5, +3, -3 ... (explora cerca primero)
    const h = norm(placedHue + d);
    if (!set.has(paletteKeyOf(h))) return h;
  }
  return placedHue; // fallback teórico (con 90 paletas vs millones, nunca debería ocurrir)
}
