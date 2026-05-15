/**
 * sanitize-walker.js — Módulo puro de sanitización nivel dios cuántico-quark.
 *
 * Única fuente de verdad para las 4 capas que sanitizan en Triggui:
 *   - Capa 2: extractors.js → safeJSONParse al recibir LLM response
 *   - Capa 3: build-contenido-nucleus.js → pre-writeFile del catálogo final
 *   - Capa 4: sanitize-catalog.mjs (CLI wrapper) → workflow auto-clean + manual
 *   - Capa 5: frontend lo replica en JS inline (__triggguiSanitizeAll)
 *
 * FILOSOFÍA SELF-HEALING:
 *   Detectar + limpiar + reportar. NUNCA abortar pipeline.
 *
 * TRES PASES EN ORDEN QUIRÚRGICO (orden importa):
 *   1. ANSI escape sequences COMPLETAS (\u001b[...m) — preservar contexto
 *      antes de eliminar el \u001b suelto en pase 3.
 *   2. Bug \u001f<3 hex chars> → reparar a emoji.
 *      El modelo escribe "\u001f440" queriendo "\u1f440" (👀).
 *      JSON.parse interpreta como U+001F + texto "440".
 *      Reparación matemática: parseInt("1f" + NNN, 16) = codepoint intentado.
 *   3. Otros control chars C0 (\u0000-\u001f) excepto \t \n \r — eliminar.
 *
 * IDEMPOTENCIA GARANTIZADA: si el input ya está limpio, output === input
 * y stats están en 0. Re-ejecutar el mismo objeto no produce cambios.
 *
 * REFERENCIA: TRIGGUI_ARCHIVO_MAESTRO_V10.md §30.3
 */

// Pases declarativos en orden de aplicación
export const PASSES = [
  {
    name: 'ansi_sequences',
    re: /\u001b\[[0-9;]*[a-zA-Z]/g,
    repl: () => ''
  },
  {
    name: 'emoji_bug_repair',
    re: /\u001f([0-9a-fA-F]{3})/g,
    repl: (_match, hex) => {
      try {
        const cp = parseInt('1f' + hex.toLowerCase(), 16);
        // Rango canónico de emojis: 0x1F000 - 0x1FFFF
        if (cp >= 0x1f000 && cp <= 0x1ffff) {
          return String.fromCodePoint(cp);
        }
      } catch (_) {}
      // Si no es codepoint emoji válido, eliminar el U+001F (siguiente pase lo cubriría igual)
      return '';
    }
  },
  {
    name: 'control_chars',
    re: /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,
    repl: () => ''
  }
];

/**
 * Walker recursivo inmutable.
 * Aplica fn a cada string del árbol JSON, devolviendo nuevo objeto sin
 * mutar el original. Soporta strings, arrays, objetos planos, y primitivos.
 */
export function walk(obj, fn) {
  if (typeof obj === 'string') return fn(obj);
  if (Array.isArray(obj)) return obj.map(x => walk(x, fn));
  if (obj !== null && typeof obj === 'object') {
    const out = {};
    for (const k of Object.keys(obj)) out[k] = walk(obj[k], fn);
    return out;
  }
  // null, undefined, number, boolean: pasan tal cual
  return obj;
}

/**
 * Sanitiza un string aplicando los 3 pases en orden.
 * @returns {{ clean: string, stats: object }} clean = string sanitizado,
 *   stats = { passName: count } solo con keys de pases que hicieron cambio.
 */
export function sanitizeString(s) {
  let r = s;
  const stats = {};
  for (const pass of PASSES) {
    const before = r;
    r = r.replace(pass.re, pass.repl);
    if (r !== before) {
      stats[pass.name] = (before.match(pass.re) || []).length;
    }
  }
  return { clean: r, stats };
}

/**
 * Sanitiza un objeto/árbol JSON completo recursivamente.
 * @returns {{ clean: any, stats: object, modified: boolean }}
 *   clean = objeto nuevo sanitizado (sin mutar original)
 *   stats = totales agregados por pase: { ansi_sequences, emoji_bug_repair, control_chars }
 *   modified = true si AL MENOS UN string fue modificado
 */
export function sanitizeObject(obj) {
  const agg = { ansi_sequences: 0, emoji_bug_repair: 0, control_chars: 0 };
  let modified = false;

  const clean = walk(obj, (s) => {
    const { clean: cleanStr, stats } = sanitizeString(s);
    if (cleanStr !== s) {
      modified = true;
      for (const [key, val] of Object.entries(stats)) {
        agg[key] = (agg[key] || 0) + val;
      }
    }
    return cleanStr;
  });

  return { clean, stats: agg, modified };
}

/**
 * Cuenta secuencias \u00XX en una representación JSON serializada (string).
 * Útil para verificación matemática post-sanitize: el output DEBE devolver 0.
 */
export function countResidualControlChars(jsonString) {
  return (jsonString.match(/\\u00[0-1][0-9a-fA-F]/g) || []).length;
}

/**
 * Helper de conveniencia: sanitiza + serializa + verifica matemáticamente.
 * Atómico: la verificación está incluida.
 * @returns {{ json: string, stats, modified, residual: number }}
 *   residual debe ser 0 — si no, hay un bug en los pases.
 */
export function sanitizeAndSerialize(obj, indent = 2) {
  const { clean, stats, modified } = sanitizeObject(obj);
  const json = JSON.stringify(clean, null, indent);
  const residual = countResidualControlChars(json);
  return { json, stats, modified, residual };
}

/**
 * Formatea stats en una línea legible para logging.
 * Ejemplo: "ansi_sequences=4 emoji_bug_repair=2 control_chars=15"
 */
export function formatStats(stats) {
  return Object.entries(stats)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => `${name}=${count}`)
    .join(' ') || '(none)';
}
