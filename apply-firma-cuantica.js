#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// 🌒 APPLY FIRMA CUÁNTICA — Filosofía huella digital + batch context + creatividad
// ═══════════════════════════════════════════════════════════════════════════
//
// Bug post-AWSMCOLOR (Batch mayo 6 2026, 14h):
//   12 de 20 libros generados cayeron en hue=70-75 (verde lima eléctrico).
//   El prompt anterior pedía "diversidad" pero no UNICIDAD por libro,
//   y no daba contexto del batch en vivo. GPT-4o-mini encontró nueva
//   "zona segura" (verde lima + complementary).
//
// Fix nivel dios (3 cambios atómicos):
//
//   FASE A — Reescribir prompt visual con filosofía HUELLA DIGITAL CUÁNTICA
//     extractors.js → reemplaza el bloque "FILOSOFÍA AWSMCOLOR DOPAMINÉRGICA"
//     por "HUELLA DIGITAL CROMÁTICA CUÁNTICA":
//       - NO buckets, NO categorías
//       - "¿qué hue tendría que NINGÚN otro libro pueda tener?"
//       - Permitir lo inesperado (productividad puede ser naranja)
//       - Anti-contaminación de batch (regla 30°)
//       - Autoexamen cuántico de 5 preguntas
//
//   FASE B — Pasar previousHues al motor en cada llamada
//     extractors.js → extractAnchors recibe options.previousHues
//     extractors.js → anchorsUserPrompt inyecta bloque "HUES YA USADOS"
//     build-contenido-nucleus.js → calcula previousHues del batch en curso
//
//   FASE C — Temperature alta de creatividad
//     build-contenido-nucleus.js → temperature: 0.85 en extractAnchors
//     (default era 0.5 — más conservador, favorecía zonas seguras)
//
// Reversible:
//   mv extractors.js.backup-pre-firma-{ts} extractors.js
//   mv build-contenido-nucleus.js.backup-pre-firma-{ts} build-contenido-nucleus.js
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const NUCLEUS_DIR = path.resolve(process.cwd(), 'experiments/nucleus');
const EXTRACTORS_PATH = path.join(NUCLEUS_DIR, 'extractors.js');
const BUILDER_PATH = path.join(NUCLEUS_DIR, 'build-contenido-nucleus.js');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// ═══════════════════════════════════════════════════════════════════════════
// FASE A — Nuevo bloque del prompt visual (HUELLA DIGITAL CUÁNTICA)
// ═══════════════════════════════════════════════════════════════════════════
const OLD_VISUAL_BLOCK = `═══════════════════════════════════════════════════════════════════
INTENCIÓN VISUAL — FILOSOFÍA AWSMCOLOR DOPAMINÉRGICA
═══════════════════════════════════════════════════════════════════

Cada libro merece una identidad cromática ÚNICA, DOPAMINÉRGICA y MEMORABLE.
NO eres conservador. La paleta debe ser ADICTIVA visualmente, como cubierta
de revista de diseño contemporáneo (referencia: instagram.com/awsmcolor).

🎨 PRINCIPIOS NO NEGOCIABLES

1. DOPAMINÉRGICO ANTES QUE SEGURO
   La saturación alta y el contraste fuerte producen dopamina visual.
   Tu default es "vivid". "balanced" solo si el libro tiene dualidad clara.
   "muted" SOLO si el libro exige contemplación monástica explícita
   (zen, monje, meditación silenciosa, duelo). Para todo lo demás → vivid.

2. CONEXIÓN CON LA PORTADA REAL
   Imagina la portada del libro como objeto físico en una mesa.
   Los 4 colores de la paleta son UN DETALLE de esa portada — el lomo,
   el title-treatment, el background dominante. NO inventes colores
   genéricos del tema; SIENTE los pigmentos del libro físico.

3. ZONA MUERTA PROHIBIDA
   La combinación hue=190-220 + saturation=balanced + strategy=analogous
   está PROHIBIDA. Es "azul corporativo aburrido" que mata la dopamina.
   Si tu instinto natural cae ahí → empújate a complementary o triadic
   o desplaza el hue al menos 60° (ej: a verde-menta 145 o magenta 320).

4. DIVERSIDAD POR LIBRO
   Cada libro es un mundo cromático distinto. La paleta debe sorprender,
   no repetir. Si el libro anterior fue azul-analogous, este NO debe serlo.

═══════════════════════════════════════════════════════════════════
PARÁMETROS NUMÉRICOS
═══════════════════════════════════════════════════════════════════

- hue_primary: entero 0-359 (círculo cromático completo).

  MAPEO REFINADO DOPAMINÉRGICO (no genérico — atmósfera específica):
    0-15 o 345-359 = ROJO SANGRE (manipulación, urgencia, deseo, peligro)
    15-35          = NARANJA QUEMADO (artesanía, otoño, leña, tradición)
    35-55          = ÁMBAR/MOSTAZA (sabiduría, sol antiguo, miel, madera)
    55-75          = AMARILLO ELÉCTRICO (descubrimiento, alegría, neón, sol pleno)
    75-105         = VERDE LIMA (vitalidad, primavera, novedad, energía joven)
    105-135        = VERDE BOSQUE (introspección, naturaleza profunda, salud)
    135-165        = VERDE MENTA/AGUA (calma activa, sanación, esperanza)
    165-195        = TURQUESA/CIAN (claridad mental, agua, frescura, movimiento)
    195-220        = AZUL CIELO (apertura, libertad, expansión — USAR CON CUIDADO)
    220-250        = AZUL ÍNDIGO (profundidad, nocturno, tecnología, sueño)
    250-275        = VIOLETA (misterio, espiritualidad evolutiva, conciencia alta)
    275-300        = MAGENTA (creatividad, ruptura, vanguardia, energía)
    300-330        = ROSA INTENSO (corazón, vulnerabilidad audaz, feminidad fuerte)
    330-345        = ROSA-ROJO (pasión, romance crudo, drama humano)

  EJEMPLOS GUÍA POR ARQUETIPO DE LIBRO:
    "Trillion Dollar Coach" (corporate coaching)     → hue=45  (mostaza/dorado)
    "El monje y el filósofo" (zen + occidente)       → hue=110 (verde bosque)
    "Confía en mí estoy mintiendo" (manipulación)    → hue=355 (rojo sangre)
    "Cómo sanar tu ansiedad" (esperanza, calma)      → hue=155 (verde menta)
    "Las leyes de la naturaleza humana" (estrategia) → hue=290 (magenta)
    "El poder del ahora" (presencia)                 → hue=70  (amarillo eléctrico)
    "Suficiente" (filosofía dinero)                  → hue=40  (ámbar dorado)
    "Vida contemplativa" (filosofía moderna)         → hue=265 (violeta)

- saturation: "muted" | "balanced" | "vivid"
  Default agresivo: "vivid".
  Usa "balanced" si hay dualidad emocional clara (libros de duelo procesado, transición).
  Usa "muted" SOLO si el libro es contemplación silenciosa explícita
  (meditación, zen, monasterio, duelo profundo no procesado).

- lightness_paper: "dark" | "medium_dark" | "medium_light" | "light"
  Default: "light" (papel claro permite que los colores brillen).
  "medium_light" si hay sofisticación nocturna (ensayo profundo, filosofía moderna).
  "dark" SOLO si el libro es muy nocturno o místico explícitamente.

- temperature_shift: entero -30 a +30.
  -20 a -10 = frío sutil (mística, agua, tecnología)
  0          = neutral (default seguro)
  +10 a +20 = cálido sutil (humano, hogar, tradición)
  Evita extremos (-30, +30) salvo razón clara.

- palette_strategy: "monochromatic" | "analogous" | "complementary" | "triadic" | "split_complementary"

  PROHIBIDO usar "analogous" como default fácil.
  Tu jerarquía dopaminérgica preferida:
    1. complementary (tensión visual = dopamina)
    2. triadic (variedad rítmica)
    3. split_complementary (equilibrio con tensión)
    4. monochromatic (solo si el libro es DISCIPLINA pura)
    5. analogous (último recurso — sólo si la armonía es esencial)

- typography_family, density, rhythm, era, genre_visual: elige enums según voz y género.

═══════════════════════════════════════════════════════════════════
AUTOEXAMEN ANTES DE DEVOLVER
═══════════════════════════════════════════════════════════════════
Antes de cerrar tu visual_intent, verifica:
1. ¿Mi hue cae en zona muerta 190-220? Si sí, ¿tengo razón fortísima?
2. ¿Estoy usando analogous + balanced juntos? Si sí, cambia uno.
3. ¿Mis 4 colores se sentirían como portada de revista contemporánea?
4. ¿Otro libro de mi catálogo tendría exactamente estos parámetros?
   Si sí, diferéncialo.

═══════════════════════════════════════════════════════════════════
SURFACE HINTS`;

const NEW_VISUAL_BLOCK = `═══════════════════════════════════════════════════════════════════
INTENCIÓN VISUAL — HUELLA DIGITAL CROMÁTICA CUÁNTICA
═══════════════════════════════════════════════════════════════════

🌒 PRINCIPIO FUNDAMENTAL

Cada libro tiene UN solo hue posible — el suyo.
NO pienses en categorías. NO pienses en buckets. NO pienses en arquetipos.
PIENSA: si este libro fuera un objeto único en el mundo,
¿qué color exacto tendría que ningún otro objeto pudiera tener?

El círculo cromático tiene 360 hues posibles.
Multiplicado por 60 temperature_shifts y 5 strategies, hay
~108,000 firmas cromáticas únicas. Tu trabajo NO es elegir entre
opciones genéricas. Tu trabajo es DETECTAR la firma que ya existe
en este libro específico.

🎨 PRINCIPIOS NO NEGOCIABLES

1. HUELLA DIGITAL ANTES QUE CATEGORÍA
   Si pensaste "este libro es de productividad → hue=70 amarillo
   eléctrico" estás categorizando, no detectando. Refínalo.
   ¿Qué amarillo exacto? ¿Por qué ESE número y no 71 o 38?
   Si no puedes justificar el dígito específico, no es la firma.

2. PERMITIR LO INESPERADO
   - Un libro de productividad puede ser hue=23 (naranja quemado)
     si su voz interna habla de "trabajo del artesano".
   - Un libro de filosofía puede ser hue=337 (rosa-rojo) si tiene
     calor humano crudo, no contemplación distante.
   - Un libro de finanzas puede ser hue=185 (turquesa profundo)
     si propone abundancia como agua que fluye.

   NO te quedes con la primera asociación obvia. Pregúntate:
   "¿Cuál es el hue que NADIE esperaría pero que es perfecto?"

3. DOPAMINÉRGICO ANTES QUE SEGURO
   Saturación alta y contraste fuerte producen dopamina visual.
   Default: "vivid". "balanced" solo con dualidad emocional clara.
   "muted" SOLO con contemplación monástica explícita.

4. CONEXIÓN CON LA PORTADA REAL
   Imagina la portada del libro como objeto físico en una mesa.
   Los 4 colores son UN DETALLE de esa portada — no inventes
   colores genéricos del tema; SIENTE los pigmentos del libro físico.

5. ANTI-CONTAMINACIÓN DE BATCH
   Si te muestran hues ya usados en libros anteriores de este batch,
   tu hue DEBE estar al menos 30° de distancia de TODOS ellos.
   Cada libro es un mundo cerrado. Cuántico = único.

═══════════════════════════════════════════════════════════════════
PARÁMETROS NUMÉRICOS
═══════════════════════════════════════════════════════════════════

- hue_primary: entero 0-359.

  El círculo cromático completo está disponible. NO uses solo
  "zonas seguras". Cada libro merece su grado específico.

  Atmósferas (referencia, NO categorías rígidas):
    0-30 = ROJO SANGRE (manipulación, urgencia, deseo, peligro)
    30-60 = NARANJA-ÁMBAR (artesanía, otoño, leña, sol antiguo)
    60-90 = AMARILLO ELÉCTRICO (descubrimiento, alegría, neón)
    90-150 = VERDES (vitalidad, naturaleza, sanación)
    150-210 = TURQUESAS-AZULES CIELO (claridad, agua, expansión)
    210-270 = AZULES ÍNDIGO (profundidad, nocturno, sueño)
    270-330 = VIOLETAS-MAGENTAS (creatividad, ruptura, conciencia)
    330-359 = ROSAS (vulnerabilidad audaz, drama humano)

  PROHIBIDO: caer mecánicamente en "esta es zona X porque el libro
  trata de Y". Cada libro es huella única, no categoría.

  Antes de devolver tu hue final, pregúntate:
  - ¿Otro libro del catálogo merecería exactamente este número?
    Si SÍ → el hue es genérico, refínalo (sube/baja 5-25 grados).
    Si NO → es la firma del libro, devuélvelo.
  - ¿Mi hue está al menos 30° de los hues ya usados en este batch?
    Si NO → pívota a otra atmósfera completamente.

- saturation: "muted" | "balanced" | "vivid"
  Default agresivo: "vivid".
  "balanced" si hay dualidad emocional clara.
  "muted" SOLO si el libro es contemplación silenciosa explícita.

- lightness_paper: "dark" | "medium_dark" | "medium_light" | "light"
  Default: "light" (papel claro permite que los colores brillen).
  "medium_light" si hay sofisticación nocturna.
  "dark" SOLO si el libro es muy nocturno o místico.

- temperature_shift: entero -30 a +30.
  Úsalo para refinar la firma. Un hue=70 con shift=-15 NO es
  igual que hue=70 con shift=+15. Cada libro merece su offset.
  -20 a -10 = frío sutil (mística, agua, tecnología)
  0 = neutral (úsalo solo si NO hay razón para shift)
  +10 a +20 = cálido sutil (humano, hogar, tradición)

- palette_strategy: "monochromatic" | "analogous" | "complementary" | "triadic" | "split_complementary"

  Jerarquía dopaminérgica:
    1. complementary (tensión = dopamina)
    2. triadic (variedad rítmica)
    3. split_complementary (equilibrio con tensión)
    4. monochromatic (solo si DISCIPLINA pura)
    5. analogous (último recurso)

- typography_family, density, rhythm, era, genre_visual: elige enums según voz y género.

═══════════════════════════════════════════════════════════════════
AUTOEXAMEN CUÁNTICO ANTES DE DEVOLVER
═══════════════════════════════════════════════════════════════════
Antes de cerrar tu visual_intent, verifica las 5 preguntas:

1. ¿Mi hue es ESTE NÚMERO ESPECÍFICO o estoy en un default genérico?
2. ¿Está al menos 30° de cada hue del batch previo (si me dieron contexto)?
3. ¿Otro libro merecería exactamente estos 5 parámetros?
   Si sí → diferéncialos.
4. ¿Estoy categorizando ("libros de X son color Y") o detectando huella?
5. ¿Mi paleta se sentiría como portada de revista contemporánea
   única en el catálogo? Si no → refina.

═══════════════════════════════════════════════════════════════════
SURFACE HINTS`;

// ═══════════════════════════════════════════════════════════════════════════
// FASE B — Inyectar previousHues en anchorsUserPrompt
// ═══════════════════════════════════════════════════════════════════════════

// Patrón viejo de la función anchorsUserPrompt (firma)
const OLD_USER_PROMPT_FN = `function anchorsUserPrompt(book, groundTruth, lens) {
  let p = \`LIBRO:\\nTítulo proporcionado: "\${book.titulo}"\\nAutor proporcionado: "\${book.autor}"\`;
  if (book.tagline) p += \`\\nContexto editorial: "\${book.tagline}"\`;
  p += \`\\n\\n═══════════════════════════════════════════════════════════════════\\nGROUND TRUTH (fuente de verdad sobre el libro):\\n═══════════════════════════════════════════════════════════════════\\n\${groundTruth}\`;
  if (lens && lens.trim()) {
    p += \`\\n\\n═══════════════════════════════════════════════════════════════════\\nLENTE DEL CURADOR:\\n═══════════════════════════════════════════════════════════════════\\n\${lens}\\n\\nAnaliza honestamente en lens_analysis cómo (o si) el libro aborda este tema.\`;
  }
  p += \`\\n\\nExtrae anchors + visual_intent numérico + lens_analysis + identity. No escribas cards.\`;
  return p;
}`;

const NEW_USER_PROMPT_FN = `function anchorsUserPrompt(book, groundTruth, lens, previousHues = []) {
  let p = \`LIBRO:\\nTítulo proporcionado: "\${book.titulo}"\\nAutor proporcionado: "\${book.autor}"\`;
  if (book.tagline) p += \`\\nContexto editorial: "\${book.tagline}"\`;
  p += \`\\n\\n═══════════════════════════════════════════════════════════════════\\nGROUND TRUTH (fuente de verdad sobre el libro):\\n═══════════════════════════════════════════════════════════════════\\n\${groundTruth}\`;
  if (lens && lens.trim()) {
    p += \`\\n\\n═══════════════════════════════════════════════════════════════════\\nLENTE DEL CURADOR:\\n═══════════════════════════════════════════════════════════════════\\n\${lens}\\n\\nAnaliza honestamente en lens_analysis cómo (o si) el libro aborda este tema.\`;
  }
  // 🌒 ANTI-CONTAMINACIÓN DE BATCH: hues ya usados en libros anteriores
  if (Array.isArray(previousHues) && previousHues.length > 0) {
    p += \`\\n\\n═══════════════════════════════════════════════════════════════════\\n🌒 HUES YA USADOS EN ESTE BATCH (NO REPETIR):\\n═══════════════════════════════════════════════════════════════════\\n[\${previousHues.join(', ')}]\\n\\nTu hue_primary DEBE estar al menos 30° de distancia de TODOS estos números (en cualquier dirección del círculo cromático). Cada libro es huella digital ÚNICA. Si tu instinto inicial cae cerca de uno de estos hues, pívota a otra atmósfera completamente — el catálogo merece diversidad cuántica real.\`;
  }
  p += \`\\n\\nExtrae anchors + visual_intent numérico + lens_analysis + identity. No escribas cards.\`;
  return p;
}`;

// ═══════════════════════════════════════════════════════════════════════════
// FASE B — Cambiar firma de extractAnchors para aceptar previousHues
// ═══════════════════════════════════════════════════════════════════════════
const OLD_EXTRACT_ANCHORS_SIG = `export async function extractAnchors(openai, book, groundTruth, lens = "", options = {}) {
  const schemas = await loadSchemas();
  const model = options.model || "gpt-4o-mini";
  const temperature = options.temperature ?? 0.5;`;

const NEW_EXTRACT_ANCHORS_SIG = `export async function extractAnchors(openai, book, groundTruth, lens = "", options = {}) {
  const schemas = await loadSchemas();
  const model = options.model || "gpt-4o-mini";
  // 🌒 FASE C: temperature alta para creatividad cuántica (default 0.85, antes 0.5)
  const temperature = options.temperature ?? 0.85;
  const previousHues = Array.isArray(options.previousHues) ? options.previousHues : [];`;

// FASE B — Pasar previousHues a anchorsUserPrompt en la llamada interna
// Buscar dónde se llama anchorsUserPrompt(book, groundTruth, lens)
const OLD_USER_PROMPT_CALL = `anchorsUserPrompt(book, groundTruth, lens)`;
const NEW_USER_PROMPT_CALL = `anchorsUserPrompt(book, groundTruth, lens, previousHues)`;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('🌒 APPLY FIRMA CUÁNTICA — Filosofía huella digital + batch context + creatividad');
console.log('');

// ─── Verificaciones previas ───
if (!fs.existsSync(EXTRACTORS_PATH)) {
  console.error('❌ No existe ' + EXTRACTORS_PATH);
  console.error('   Ejecuta este script desde /workspaces/triggui-app');
  process.exit(1);
}
if (!fs.existsSync(BUILDER_PATH)) {
  console.error('❌ No existe ' + BUILDER_PATH);
  process.exit(1);
}

const extractorsOriginal = fs.readFileSync(EXTRACTORS_PATH, 'utf8');
const builderOriginal = fs.readFileSync(BUILDER_PATH, 'utf8');

console.log('✓ extractors.js leído (' + extractorsOriginal.length + ' chars)');
console.log('✓ build-contenido-nucleus.js leído (' + builderOriginal.length + ' chars)');

// Idempotencia
if (extractorsOriginal.indexOf('HUELLA DIGITAL CROMÁTICA CUÁNTICA') !== -1) {
  console.error('⚠️  El fix FIRMA CUÁNTICA YA está aplicado en extractors.js. No hay nada que hacer.');
  console.error('   Para re-aplicar: restaura el backup más reciente y vuelve a correr.');
  process.exit(0);
}

// Verificar anclas viejas en extractors.js
if (extractorsOriginal.indexOf(OLD_VISUAL_BLOCK) === -1) {
  console.error('❌ No se encontró el bloque AWSMCOLOR en extractors.js.');
  console.error('   Verifica que el patch AWSMCOLOR (apply-awsmcolor.js) esté aplicado primero.');
  process.exit(1);
}
console.log('✓ Bloque AWSMCOLOR detectado en extractors.js (listo para reemplazar)');

if (extractorsOriginal.indexOf(OLD_USER_PROMPT_FN) === -1) {
  console.error('❌ No se encontró la función anchorsUserPrompt original.');
  console.error('   El archivo podría haber sido modificado a mano.');
  process.exit(1);
}
console.log('✓ Función anchorsUserPrompt detectada');

if (extractorsOriginal.indexOf(OLD_EXTRACT_ANCHORS_SIG) === -1) {
  console.error('❌ No se encontró la firma de extractAnchors esperada.');
  process.exit(1);
}
console.log('✓ Firma de extractAnchors detectada');

if (extractorsOriginal.indexOf(OLD_USER_PROMPT_CALL) === -1) {
  console.error('❌ No se encontró la llamada interna a anchorsUserPrompt(book, groundTruth, lens).');
  process.exit(1);
}
console.log('✓ Llamada interna a anchorsUserPrompt detectada');

// ─── Verificar build-contenido-nucleus.js ───
// Buscamos la línea de la llamada a extractAnchors
const BUILDER_PATTERN_OLD = `() => extractAnchors(openai, book, groundTruthMeta.ground_truth, inputs.lens, { model: CFG.modelMini }),`;
const BUILDER_PATTERN_NEW = `() => extractAnchors(openai, book, groundTruthMeta.ground_truth, inputs.lens, { model: CFG.modelMini, previousHues: __batchHues }),`;

if (builderOriginal.indexOf(BUILDER_PATTERN_OLD) === -1) {
  console.error('❌ No se encontró la llamada a extractAnchors en build-contenido-nucleus.js.');
  console.error('   Buscaba exactamente: ' + BUILDER_PATTERN_OLD);
  process.exit(1);
}
console.log('✓ Llamada a extractAnchors detectada en builder');

// ─── Backups ───
const extractorsBackup = EXTRACTORS_PATH + '.backup-pre-firma-' + TIMESTAMP;
const builderBackup = BUILDER_PATH + '.backup-pre-firma-' + TIMESTAMP;
fs.writeFileSync(extractorsBackup, extractorsOriginal);
fs.writeFileSync(builderBackup, builderOriginal);
console.log('✓ Backups creados');

// ─── FASE A — Aplicar nuevo prompt visual ───
let extractorsPatched = extractorsOriginal.replace(OLD_VISUAL_BLOCK, NEW_VISUAL_BLOCK);
if (extractorsPatched === extractorsOriginal) {
  console.error('❌ FASE A falló: el bloque visual no se reemplazó.');
  process.exit(1);
}
console.log('  ✓ FASE A: bloque visual reemplazado por HUELLA DIGITAL CUÁNTICA');

// ─── FASE B-1 — Reemplazar anchorsUserPrompt ───
extractorsPatched = extractorsPatched.replace(OLD_USER_PROMPT_FN, NEW_USER_PROMPT_FN);
if (!extractorsPatched.includes('previousHues = []')) {
  console.error('❌ FASE B-1 falló: anchorsUserPrompt no se reemplazó.');
  process.exit(1);
}
console.log('  ✓ FASE B-1: anchorsUserPrompt acepta previousHues');

// ─── FASE B-2 — Reemplazar firma de extractAnchors ───
extractorsPatched = extractorsPatched.replace(OLD_EXTRACT_ANCHORS_SIG, NEW_EXTRACT_ANCHORS_SIG);
if (!extractorsPatched.includes('const previousHues = Array.isArray(options.previousHues)')) {
  console.error('❌ FASE B-2 falló: firma de extractAnchors no se reemplazó.');
  process.exit(1);
}
console.log('  ✓ FASE B-2 + FASE C: extractAnchors recibe previousHues + temperature 0.85');

// ─── FASE B-3 — Reemplazar llamada interna a anchorsUserPrompt ───
const beforeCall = extractorsPatched;
extractorsPatched = extractorsPatched.replace(OLD_USER_PROMPT_CALL, NEW_USER_PROMPT_CALL);
if (extractorsPatched === beforeCall) {
  console.error('❌ FASE B-3 falló: llamada interna no se reemplazó.');
  process.exit(1);
}
console.log('  ✓ FASE B-3: llamada interna pasa previousHues');

// Guardar extractors.js
fs.writeFileSync(EXTRACTORS_PATH, extractorsPatched);
const extractorsDelta = extractorsPatched.length - extractorsOriginal.length;
console.log('✓ extractors.js guardado (' + (extractorsDelta >= 0 ? '+' : '') + extractorsDelta + ' chars)');

// ─── FASE B-4 — Modificar build-contenido-nucleus.js ───
// Necesitamos:
//   1. Calcular __batchHues antes de cada llamada (array vivo del batch)
//   2. Pasarlo a extractAnchors
//
// La forma más quirúrgica: agregar una declaración antes del `const anchorsRes = await retryOnce(`
// y modificar la llamada.

// Buscar el contexto: "const anchorsRes = await retryOnce("
const ANCHORS_RES_BLOCK_OLD = `  const anchorsRes = await retryOnce(
    () => extractAnchors(openai, book, groundTruthMeta.ground_truth, inputs.lens, { model: CFG.modelMini }),
    "extractAnchors"
  );`;

const ANCHORS_RES_BLOCK_NEW = `  // 🌒 FIRMA CUÁNTICA: recolectar hues ya usados en libros anteriores del batch
  // El array global __TRIGGUI_BATCH_HUES__ se mantiene vivo entre libros del mismo batch
  if (typeof globalThis.__TRIGGUI_BATCH_HUES__ === "undefined") {
    globalThis.__TRIGGUI_BATCH_HUES__ = [];
  }
  const __batchHues = globalThis.__TRIGGUI_BATCH_HUES__.slice();

  const anchorsRes = await retryOnce(
    () => extractAnchors(openai, book, groundTruthMeta.ground_truth, inputs.lens, { model: CFG.modelMini, previousHues: __batchHues }),
    "extractAnchors"
  );`;

let builderPatched = builderOriginal.replace(ANCHORS_RES_BLOCK_OLD, ANCHORS_RES_BLOCK_NEW);
if (builderPatched === builderOriginal) {
  console.error('❌ FASE B-4 falló: bloque anchorsRes no se reemplazó en builder.');
  console.error('   Restaurando backups...');
  fs.writeFileSync(EXTRACTORS_PATH, extractorsOriginal);
  process.exit(1);
}
console.log('  ✓ FASE B-4: builder calcula __batchHues y los pasa');

// FASE B-5 — Después de extraer anchors, push del hue al global
// Buscar dónde se accede a anchorsData.visual_intent.hue_primary y agregar push después.
// La línea más confiable es el log: "🎨 Visual: hue=${anchorsData.visual_intent.hue_primary}"
const VISUAL_LOG_OLD = `  console.log(\`   🎨 Visual: hue=\${anchorsData.visual_intent.hue_primary}, sat=\${anchorsData.visual_intent.saturation}, strategy=\${anchorsData.visual_intent.palette_strategy}\`);`;
const VISUAL_LOG_NEW = `  console.log(\`   🎨 Visual: hue=\${anchorsData.visual_intent.hue_primary}, sat=\${anchorsData.visual_intent.saturation}, strategy=\${anchorsData.visual_intent.palette_strategy}\`);
  // 🌒 FIRMA CUÁNTICA: registrar hue en el batch para anti-contaminación de siguientes libros
  if (typeof anchorsData.visual_intent.hue_primary === "number") {
    globalThis.__TRIGGUI_BATCH_HUES__.push(anchorsData.visual_intent.hue_primary);
  }`;

builderPatched = builderPatched.replace(VISUAL_LOG_OLD, VISUAL_LOG_NEW);
if (!builderPatched.includes('__TRIGGUI_BATCH_HUES__.push')) {
  console.error('❌ FASE B-5 falló: no se pudo agregar el push al batch.');
  console.error('   Restaurando backups...');
  fs.writeFileSync(EXTRACTORS_PATH, extractorsOriginal);
  process.exit(1);
}
console.log('  ✓ FASE B-5: builder registra hue al batch después de extraer');

// Guardar builder
fs.writeFileSync(BUILDER_PATH, builderPatched);
const builderDelta = builderPatched.length - builderOriginal.length;
console.log('✓ build-contenido-nucleus.js guardado (' + (builderDelta >= 0 ? '+' : '') + builderDelta + ' chars)');

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ FIRMA CUÁNTICA INSTALADA — NIVEL DIOS HUELLA DIGITAL');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Cambios:');
console.log('');
console.log('  FASE A — Filosofía huella digital cuántica');
console.log('    • NO buckets, NO categorías, NO arquetipos');
console.log('    • "¿qué hue tendría que NINGÚN otro libro pueda tener?"');
console.log('    • Permitir lo inesperado (productividad puede ser naranja)');
console.log('    • 5 preguntas de autoexamen cuántico');
console.log('');
console.log('  FASE B — Anti-contaminación de batch en vivo');
console.log('    • previousHues se pasa a cada llamada de extractAnchors');
console.log('    • GPT recibe la lista de hues ya usados');
console.log('    • Regla: mínimo 30° de distancia de cada hue previo');
console.log('');
console.log('  FASE C — Temperature alta de creatividad');
console.log('    • extractAnchors temperature: 0.5 → 0.85');
console.log('    • Mayor libertad creativa, menos default conservador');
console.log('');
console.log('Próximos pasos:');
console.log('');
console.log('1. Vaciar contenido.json en triggui-content (otra tabula rasa):');
console.log('   cd /workspaces/triggui-content');
console.log('   echo \'{"libros":[]}\' > contenido.json');
console.log('   git add contenido.json');
console.log('   git commit -m "🌒 Reset cuántico pre-FIRMA"');
console.log('   git push origin main');
console.log('');
console.log('2. Push del fix FIRMA CUÁNTICA:');
console.log('   cd /workspaces/triggui-app');
console.log('   git add experiments/nucleus/extractors.js experiments/nucleus/build-contenido-nucleus.js');
console.log('   git commit -m "🌒 Firma cuántica: filosofía huella digital + batch context + temperature 0.85"');
console.log('   git push origin main');
console.log('');
console.log('3. Disparar workflow desde GitHub Actions: production_batch');
console.log('   ~22 min, ~$0.13 USD, 20 libros con paletas BRUTALMENTE únicas');
console.log('');
console.log('Reversible:');
console.log('   mv ' + path.basename(extractorsBackup) + ' experiments/nucleus/extractors.js');
console.log('   mv ' + path.basename(builderBackup) + ' experiments/nucleus/build-contenido-nucleus.js');
console.log('');