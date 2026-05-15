/**
 * ════════════════════════════════════════════════════════════════════════════
 * prompt-composer.js v2 — COMPOSITOR DINÁMICO DE LENTES
 * Arquitectura: ZERO duplication of curated data
 * + V15 Sprint A Fase 2 — env override de lentes NIVEL DIOS CUÁNTICO-QUARK
 * ════════════════════════════════════════════════════════════════════════════
 *
 * QUÉ HACE ESTE ARCHIVO
 * ─────────────────────
 * Lee la constitución de Triggui + el registro de lentes activos +
 * el contenido de cada lente activo, y los une en UN solo string que se
 * pasa como parámetro `lens` a las funciones de extractors.js.
 *
 * PRINCIPIO ARQUITECTÓNICO
 * ────────────────────────
 * Los archivos de configuración (constitution, registry, lenses) viven SOLO
 * en triggui-content. Este motor (en triggui-app) NUNCA mantiene copias.
 *
 * Para resolver dónde están los archivos en runtime, intenta en orden:
 *
 *   1. $TRIGGUI_CONTENT_ROOT (env var override) — útil para setups custom
 *   2. ./triggui-content/ relativo al CWD                — CI: actions/checkout pone el repo aquí
 *   3. ../triggui-content/ relativo al motor             — dev: si ambos repos están adyacentes
 *   4. HTTPS fetch desde raw.githubusercontent.com/badirnakid/triggui-content/main/
 *      → fallback universal: funciona en cualquier entorno con red
 *
 * El método #4 garantiza que el motor puede correr en CUALQUIER lugar
 * (tu Codespace de triggui-app sin clonar content, contenedores, etc) y
 * siempre obtiene la versión más reciente pusheada a main.
 *
 * Ventaja crítica: el curador edita SOLO en triggui-content. Push. Listo.
 * Cero sincronización manual entre repos. Cero drift posible.
 *
 * V15 SPRINT A FASE 2 — ENV OVERRIDE NIVEL DIOS CUÁNTICO-QUARK
 * ─────────────────────────────────────────────────────────────
 * El curador ahora puede activar/desactivar lentes desde workflow_dispatch
 * sin tocar el registry. Las env vars TRIGGUI_LENS_* funcionan como override:
 *
 *   TRIGGUI_LENS_HAWKINS=false        → desactiva lens "hawkins" en este run
 *   TRIGGUI_LENS_HAWKINS=true         → asegura "hawkins" activo (incluso si
 *                                        el registry lo tiene desactivado)
 *   TRIGGUI_LENS_HAWKINS sin setear  → respeta registry (default cuántico)
 *
 * Garantía axiomática: si NINGUNA env var TRIGGUI_LENS_* está seteada,
 * el comportamiento es IDÉNTICO al de pre-Fase 2. Defensa total.
 *
 * ════════════════════════════════════════════════════════════════════════════
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Repo de datos canónico (puede cambiarse via env var si se hace fork)
const GITHUB_OWNER = process.env.TRIGGUI_CONTENT_OWNER || "badirnakid";
const GITHUB_REPO = process.env.TRIGGUI_CONTENT_REPO || "triggui-content";
const GITHUB_BRANCH = process.env.TRIGGUI_CONTENT_BRANCH || "main";
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

// Paths relativos dentro del repo de content
const RELATIVE_PATHS = {
  constitution: "prompts/constitution/triggui-core.md",
  kidsOverlay: "prompts/constitution/triggui-core-kids-overlay.md",
  registry: "lenses-registry.json",
  lensDir: "prompts/lenses",
};

// ════════════════════════════════════════════════════════════════════════════
// V15 SPRINT A FASE 2 — MAPEO DE ENV VARS A LENS IDS
// ════════════════════════════════════════════════════════════════════════════
//
// Cada env var TRIGGUI_LENS_* del workflow_dispatch mapea a un lens ID
// canónico del registry. Si el curador desactiva el toggle en el workflow,
// la env var llega como "false" y se remueve ese lens de los activos del run.
//
// Si el curador activa un toggle que el registry tiene desactivado, el
// override hacia ON solo aplica si el lens existe en el registry (no
// inventamos lentes que no existen — defensa cuántico-quark anti-drift).
//
// Nota: TRIGGUI_CRONO_ENABLED es alias legacy de TRIGGUI_LENS_CHRONOBIOLOGY.
// Ambas mapean a 'chronobiology'. Si las dos están seteadas, la última
// procesada gana (mapeo determinista por orden del Object).
// ════════════════════════════════════════════════════════════════════════════
const ENV_TO_LENS_ID = {
  TRIGGUI_LENS_HAWKINS:        'hawkins',
  TRIGGUI_LENS_PILARES:        'pilares',
  TRIGGUI_LENS_GAME_THEORY:    'game-theory',
  TRIGGUI_LENS_SELF_KNOWLEDGE: 'self-knowledge',
  TRIGGUI_LENS_CHRONOBIOLOGY:  'chronobiology',
  TRIGGUI_CRONO_ENABLED:       'chronobiology',  // alias legacy
};

// Cache en memoria — se resuelven UNA vez por run
let _cachedComposition = null;
let _cachedSourceMtime = null;
let _resolvedSource = null;  // Para diagnóstico: dónde se encontraron los archivos

/**
 * Verifica si un path local existe.
 */
async function pathExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Lee un archivo desde una URL HTTPS.
 * Devuelve el contenido como string, o null si falla.
 */
async function fetchFromGitHub(relativePath) {
  const url = `${GITHUB_RAW_BASE}/${relativePath}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`⚠ HTTPS fetch falló para ${relativePath}: HTTP ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (err) {
    console.warn(`⚠ HTTPS fetch error para ${relativePath}: ${err.message}`);
    return null;
  }
}

/**
 * Construye los candidatos de directorio raíz (filesystem) en orden de prioridad.
 */
function getFilesystemCandidates() {
  const candidates = [];

  // 1. Override explícito por env var
  if (process.env.TRIGGUI_CONTENT_ROOT) {
    candidates.push({
      kind: "env_var",
      root: path.resolve(process.env.TRIGGUI_CONTENT_ROOT),
    });
  }

  // 2. ./triggui-content relativo al CWD (CI: actions/checkout pone el repo aquí)
  candidates.push({
    kind: "cwd_subfolder",
    root: path.resolve(process.cwd(), "triggui-content"),
  });

  // 2b. ../triggui-content relativo al CWD (cuando script corre desde experiments/nucleus/)
  candidates.push({
    kind: "cwd_parent_subfolder",
    root: path.resolve(process.cwd(), "..", "..", "triggui-content"),
  });

  // 3. ../triggui-content relativo al motor (dev: ambos repos adyacentes)
  // El motor vive en experiments/nucleus/, así que sube 3 niveles.
  candidates.push({
    kind: "motor_adjacent",
    root: path.resolve(__dirname, "..", "..", "..", "triggui-content"),
  });

  return candidates;
}

/**
 * Intenta resolver dónde están los archivos de configuración.
 * Devuelve { kind: "filesystem"|"https", root: string|null } o null si todo falla.
 *
 * La detección se basa en encontrar uno de los archivos esperados
 * (constitution o registry) en una ubicación candidata.
 */
async function resolveSource() {
  if (_resolvedSource) return _resolvedSource;

  // Intentar filesystem primero (más rápido, sin red)
  const candidates = getFilesystemCandidates();
  for (const candidate of candidates) {
    const constitutionPath = path.join(candidate.root, RELATIVE_PATHS.constitution);
    const registryPath = path.join(candidate.root, RELATIVE_PATHS.registry);

    if (await pathExists(constitutionPath) || await pathExists(registryPath)) {
      _resolvedSource = {
        kind: "filesystem",
        sub_kind: candidate.kind,
        root: candidate.root,
      };
      return _resolvedSource;
    }
  }

  // Filesystem no encontró nada: probar HTTPS (con un fetch pequeño)
  const testFetch = await fetchFromGitHub(RELATIVE_PATHS.registry);
  if (testFetch !== null) {
    _resolvedSource = {
      kind: "https",
      root: GITHUB_RAW_BASE,
    };
    return _resolvedSource;
  }

  // Nada funcionó
  _resolvedSource = null;
  return null;
}

/**
 * Lee un archivo desde la fuente resuelta (filesystem o HTTPS).
 * Si no hay fuente, devuelve string vacío y warning.
 */
async function readFromSource(relativePath) {
  const source = await resolveSource();
  if (!source) {
    console.warn(`⚠ prompt-composer: ninguna fuente disponible para "${relativePath}"`);
    return "";
  }

  if (source.kind === "filesystem") {
    const fullPath = path.join(source.root, relativePath);
    try {
      return await fs.readFile(fullPath, "utf8");
    } catch (err) {
      // Filesystem dijo que existe el directorio pero un archivo específico no
      console.warn(`⚠ prompt-composer: no pude leer ${fullPath}: ${err.message}`);
      return "";
    }
  }

  if (source.kind === "https") {
    const content = await fetchFromGitHub(relativePath);
    return content || "";
  }

  return "";
}

/**
 * Carga la constitución desde la fuente resuelta.
 */
async function loadConstitution() {
  const raw = await readFromSource(RELATIVE_PATHS.constitution);
  return raw.trim();
}

// 🌒 Triggui Kids · overlay constitucional (solo se carga si CATALOG_MODE=kids)
async function loadKidsOverlay() {
  const raw = await readFromSource(RELATIVE_PATHS.kidsOverlay);
  return raw ? raw.trim() : "";
}

/**
 * Carga el registro de lentes desde la fuente resuelta.
 */
async function loadRegistry() {
  const raw = await readFromSource(RELATIVE_PATHS.registry);
  if (!raw) return { lenses: [] };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.lenses)) {
      console.warn(`⚠ prompt-composer: lenses-registry.json no tiene array 'lenses'. Asumiendo vacío.`);
      return { lenses: [] };
    }
    return parsed;
  } catch (err) {
    console.warn(`⚠ prompt-composer: lenses-registry.json no es JSON válido: ${err.message}`);
    return { lenses: [] };
  }
}

/**
 * Carga el contenido .md de un lente específico.
 */
async function loadLens(lensId) {
  const relativePath = `${RELATIVE_PATHS.lensDir}/${lensId}.md`;
  const raw = await readFromSource(relativePath);
  return raw.trim();
}

/**
 * Lista los IDs de lentes activos (active === 1) del registro.
 */
function getActiveLensIds(registry) {
  if (!registry || !Array.isArray(registry.lenses)) return [];
  return registry.lenses
    .filter(l => l && l.active === 1)
    .map(l => l.id);
}

// ════════════════════════════════════════════════════════════════════════════
// V15 SPRINT A FASE 2 — APLICAR ENV OVERRIDES NIVEL DIOS CUÁNTICO-QUARK
// ════════════════════════════════════════════════════════════════════════════
//
// Aplica overrides de env vars TRIGGUI_LENS_* sobre la lista de IDs activos
// que vino del registry. Permite al curador activar/desactivar lentes desde
// el workflow_dispatch sin tocar archivos.
//
// Lógica matemática axiomática:
//   - env var = "true"  → asegura que el lens esté activo (lo agrega si no está)
//   - env var = "false" → remueve el lens de la lista
//   - env var no seteada → respeta lo que vino del registry (default cuántico)
//
// Si el override quiere activar un lens que NO existe en el registry, se loggea
// warning y se ignora (defensa anti-drift: no inventamos lentes fantasma).
//
// Cada override aplicado se loggea explícitamente para auditabilidad nivel dios.
//
// @param {Array<string>} activeIds - IDs activos del registry
// @param {Object} registry - Registry completo (para validar existencia de lens)
// @returns {Array<string>} - IDs activos finales después de aplicar overrides
// ════════════════════════════════════════════════════════════════════════════
function applyEnvOverrides(activeIds, registry) {
  // Empezamos con la lista del registry (defensa: copia, no mutamos input)
  let resultado = Array.isArray(activeIds) ? [...activeIds] : [];
  const overrides = [];

  for (const [envVar, lensId] of Object.entries(ENV_TO_LENS_ID)) {
    const rawValue = process.env[envVar];
    // Defensa cuántico-quark: undefined o cadena vacía = no override
    if (rawValue === undefined || rawValue === "") continue;

    // Normalizar a bool: "true" → true, todo lo demás → false
    const enabled = String(rawValue).trim().toLowerCase() === "true";
    const wasActive = resultado.includes(lensId);

    if (enabled && !wasActive) {
      // Override hacia ON: agregar a la lista SI existe en registry
      const existsInRegistry = registry?.lenses?.some(l => l && l.id === lensId);
      if (existsInRegistry) {
        resultado.push(lensId);
        overrides.push(`+${lensId} (env ${envVar}=true)`);
      } else {
        console.warn(`⚠ Sprint A Fase 2: env ${envVar}=true pero lens "${lensId}" no existe en registry. Override ignorado.`);
      }
    } else if (!enabled && wasActive) {
      // Override hacia OFF: remover de la lista
      resultado = resultado.filter(id => id !== lensId);
      overrides.push(`-${lensId} (env ${envVar}=false)`);
    }
    // Si enabled === wasActive → no cambia nada (idempotente)
  }

  // Log nivel dios: solo si hubo overrides reales (no spamea cuando todo igual)
  if (overrides.length > 0) {
    console.log(`🎚️ Sprint A Fase 2 overrides aplicados: ${overrides.join(", ")}`);
  }

  return resultado;
}

/**
 * FUNCIÓN PRINCIPAL — compone el bloque completo que se pasa a extractors.js
 * como parámetro `lens`.
 *
 * @param {Object} opts - Opciones
 * @param {string} opts.baseLens - Lens base opcional del env var TRIGGUI_LENS
 * @param {boolean} opts.refresh - Si true, ignora cache y recarga
 * @returns {Promise<string>} - Bloque completo listo para usar
 */
export async function composeLensSystemBlock(opts = {}) {
  const { baseLens = "", refresh = false, mode = "adulto" } = opts;
  const isKids = String(mode).toLowerCase() === "kids";

  // Cache: solo si no hay baseLens y modo adulto default (kids se compone fresh)
  // V15 Sprint A Fase 2: además invalidamos cache si hay env overrides activos,
  // porque el contenido del block depende de qué lentes están activos en este run.
  const hasEnvOverrides = Object.keys(ENV_TO_LENS_ID).some(k => {
    const v = process.env[k];
    return v !== undefined && v !== "";
  });
  if (_cachedComposition !== null && !refresh && !baseLens && !isKids && !hasEnvOverrides) {
    return _cachedComposition;
  }

  const partes = [];

  // ─── 1. Constitución (siempre se inyecta si existe) ─────────────────────
  const constitution = await loadConstitution();
  if (constitution) {
    partes.push("═══════════════════════════════════════════════════════════════════");
    partes.push("CONSTITUCIÓN TRIGGUI");
    partes.push("═══════════════════════════════════════════════════════════════════");
    partes.push(constitution);
  }

  // ─── 1.5 🌒 Overlay Kids (solo si CATALOG_MODE=kids) ────────────────────
  let kidsOverlayLoaded = false;
  if (isKids) {
    const kidsOverlay = await loadKidsOverlay();
    if (kidsOverlay) {
      partes.push("");
      partes.push("═══════════════════════════════════════════════════════════════════");
      partes.push("OVERLAY TRIGGUI KIDS");
      partes.push("═══════════════════════════════════════════════════════════════════");
      partes.push(kidsOverlay);
      kidsOverlayLoaded = true;
    }
  }

  // ─── 2. Lentes activos (con V15 Sprint A Fase 2 env override) ───────────
  const registry = await loadRegistry();
  const activeIds_raw = getActiveLensIds(registry);
  const activeIds = applyEnvOverrides(activeIds_raw, registry);

  if (activeIds.length > 0) {
    partes.push("");
    partes.push("═══════════════════════════════════════════════════════════════════");
    partes.push(`LENTES EPISTEMOLÓGICOS ACTIVOS (${activeIds.length})`);
    partes.push("═══════════════════════════════════════════════════════════════════");
    partes.push("");
    partes.push("Los siguientes lentes están activos en este run. Cada uno");
    partes.push("define una manera específica de leer el momento humano.");
    partes.push("Aplicalos en orden de aparición. El primero pesa más.");
    partes.push("");

    for (let i = 0; i < activeIds.length; i++) {
      const lensId = activeIds[i];
      const lensContent = await loadLens(lensId);
      if (!lensContent) continue;

      partes.push("");
      partes.push(`─── Lente ${i + 1}: ${lensId} ───`);
      partes.push("");
      partes.push(lensContent);
      partes.push("");
    }
  }

  // ─── 3. Lente base opcional del curador ─────────────────────────────────
  if (baseLens && baseLens.trim()) {
    partes.push("");
    partes.push("═══════════════════════════════════════════════════════════════════");
    partes.push("LENTE BASE DEL CURADOR (override puntual de este run)");
    partes.push("═══════════════════════════════════════════════════════════════════");
    partes.push(baseLens.trim());
  }

  const composed = partes.join("\n");

  // Guardar en cache solo si no hay baseLens NI es modo kids NI hay env overrides
  if (!baseLens && !isKids && !hasEnvOverrides) {
    _cachedComposition = composed;
  }

  // Log informativo (solo primera vez)
  if (!_cachedSourceMtime) {
    const tieneConstitucion = constitution.length > 0 ? "✓" : "✗";
    const lentesTxt = activeIds.length > 0 ? activeIds.join(", ") : "(ninguno)";
    const tieneBaseLens = baseLens && baseLens.trim() ? "✓" : "✗";
    const sourceLabel = _resolvedSource
      ? (_resolvedSource.kind === "https"
          ? `HTTPS (${GITHUB_OWNER}/${GITHUB_REPO}@${GITHUB_BRANCH})`
          : `filesystem (${_resolvedSource.sub_kind}: ${_resolvedSource.root})`)
      : "NINGUNA (degradación)";
    const tieneKidsOverlay = kidsOverlayLoaded ? "✓" : "✗";
    console.log(`📜 prompt-composer: fuente=${sourceLabel}`);
    console.log(`   constitución ${tieneConstitucion} | lentes [${lentesTxt}] | baseLens ${tieneBaseLens}`);
    if (isKids) {
      console.log(`   🌒 modo=kids | kids-overlay ${tieneKidsOverlay}`);
    }
    console.log(`   Total bloque: ${composed.length} caracteres`);
    _cachedSourceMtime = Date.now();
  }

  return composed;
}

/**
 * Devuelve la lista de IDs de lentes activos. Útil para que otros módulos
 * (ej: lens-compatibility-scorer.js) sepan qué lentes scorear sin volver
 * a leer el registry.
 *
 * V15 Sprint A Fase 2: ahora también aplica env overrides, para que otros
 * módulos vean la MISMA lista que el system prompt. Coherencia matemática.
 */
export async function getActiveLenses() {
  const registry = await loadRegistry();
  const raw = getActiveLensIds(registry);
  return applyEnvOverrides(raw, registry);
}

/**
 * Limpia el cache. Útil para tests o si la fuente cambia mid-run.
 */
export function clearCache() {
  _cachedComposition = null;
  _cachedSourceMtime = null;
  _resolvedSource = null;
}

/**
 * Diagnóstico — verifica que la fuente sea resoluble y que los archivos
 * referenciados existan/sean accesibles.
 *
 * V15 Sprint A Fase 2: reporta tanto los lentes del registry como los que
 * quedan activos DESPUÉS de aplicar env overrides. Auditabilidad total.
 *
 * @returns {Promise<Object>} - { ok, source, missing, found, summary }
 */
export async function diagnose() {
  const source = await resolveSource();

  if (!source) {
    return {
      ok: false,
      source: null,
      missing: ["TODOS — ninguna fuente disponible (ni filesystem ni HTTPS)"],
      found: [],
      active_lenses: [],
      active_lenses_after_overrides: [],
      env_overrides_detected: [],
      summary: "❌ Sin fuente disponible. Verifica conectividad o config.",
    };
  }

  const missing = [];
  const found = [];

  // Constitución
  const constitution = await readFromSource(RELATIVE_PATHS.constitution);
  if (constitution) found.push("constitution");
  else missing.push(RELATIVE_PATHS.constitution);

  // Registry
  const registryRaw = await readFromSource(RELATIVE_PATHS.registry);
  let registry = { lenses: [] };
  if (registryRaw) {
    found.push("registry");
    try { registry = JSON.parse(registryRaw); } catch {}
  } else {
    missing.push(RELATIVE_PATHS.registry);
  }

  // V15 Sprint A Fase 2: calcular tanto los activos raw como los finales post-override
  const activeIds_raw = getActiveLensIds(registry);
  const activeIds_final = applyEnvOverrides(activeIds_raw, registry);

  // Detectar qué env vars están seteadas para reportar
  const env_overrides_detected = [];
  for (const [envVar, lensId] of Object.entries(ENV_TO_LENS_ID)) {
    const v = process.env[envVar];
    if (v !== undefined && v !== "") {
      env_overrides_detected.push(`${envVar}=${v} → ${lensId}`);
    }
  }

  // Cada lente final activo (post-override) — verificar que su .md exista
  for (const id of activeIds_final) {
    const lensRaw = await readFromSource(`${RELATIVE_PATHS.lensDir}/${id}.md`);
    if (lensRaw) found.push(`lens:${id}`);
    else missing.push(`${RELATIVE_PATHS.lensDir}/${id}.md`);
  }

  const sourceLabel = source.kind === "https"
    ? `HTTPS desde GitHub (${GITHUB_OWNER}/${GITHUB_REPO}@${GITHUB_BRANCH})`
    : `filesystem (${source.sub_kind}: ${source.root})`;

  return {
    ok: missing.length === 0,
    source: sourceLabel,
    missing,
    found,
    active_lenses: activeIds_raw,                  // del registry sin overrides
    active_lenses_after_overrides: activeIds_final, // final después de Sprint A Fase 2
    env_overrides_detected,
    summary: missing.length === 0
      ? `✓ ${found.length} archivos OK desde ${sourceLabel}`
      : `⚠ ${missing.length} archivos faltantes: ${missing.join(", ")}`,
  };
}
