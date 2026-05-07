#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// 🎨 APPLY AWSMCOLOR — Reescribe el prompt visual de extractors.js
// ═══════════════════════════════════════════════════════════════════════════
//
// Bug original (Batch 1 mayo 2026):
//   19 de 20 libros generados tuvieron paleta IDÉNTICA:
//     hue=200, saturation=balanced, palette_strategy=analogous
//   Causa: prompt actual no obliga diversidad, no menciona AWSMCOLOR,
//   no prohíbe la zona muerta (azul corporativo aburrido).
//
// Fix nivel dios:
//   Reescribe el bloque "INTENCIÓN VISUAL (NUMÉRICA)" del prompt sistema de
//   extractAnchors con filosofía dopaminérgica + ejemplos in-context +
//   prohibiciones explícitas + autoexamen previo.
//
// Tolerable que palette-synthesizer.js NO se toque (es matemáticamente perfecto).
// El bug es 100% en el prompt.
//
// Reversible:
//   mv extractors.js.backup-pre-awsmcolor-{ts} extractors.js
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const FILE_PATH = path.resolve(process.cwd(), 'experiments/nucleus/extractors.js');
const BACKUP_PATH = FILE_PATH + '.backup-pre-awsmcolor-' + new Date().toISOString().replace(/[:.]/g, '-');

// ═══════════════════════════════════════════════════════════════════════════
// PATRÓN VIEJO (29 líneas) — reemplazo robusto contra whitespace
// ═══════════════════════════════════════════════════════════════════════════
const OLD_BLOCK = `═══════════════════════════════════════════════════════════════════
INTENCIÓN VISUAL (NUMÉRICA)
═══════════════════════════════════════════════════════════════════
NO devuelves colores hex ni nombres de colores. Devuelves:

- hue_primary: entero 0-359 (círculo cromático).
    Ejemplos por tema:
    0-20 o 340-359: rojo (pasión, urgencia, amor, guerra)
    20-45: naranja/ámbar (calidez, otoño, tradición, artesanía)
    45-65: amarillo (sol, optimismo, energía, claridad mental)
    65-140: verde (naturaleza, crecimiento, abundancia, calma)
    140-200: cian/azul verdoso (serenidad, agua, reflexión)
    200-250: azul (confianza, conocimiento, cielo, profundidad)
    250-290: violeta (misterio, espiritualidad, creatividad, nobleza)
    290-340: magenta/rosa (emoción, corazón, feminidad, romance)

- saturation: "muted" (libros contemplativos, filosofía, clásicos) | "balanced" (ensayos, narrativa) | "vivid" (manifiestos, libros de acción, autoayuda enérgica)

- lightness_paper: "dark" (libros nocturnos, misticismo, tragedia) | "medium_dark" (literario denso, poesía oscura) | "medium_light" (ensayo moderno) | "light" (libros de día, prácticos, aireados)

- temperature_shift: entero -30 a +30. Negativo = desplazar hacia frío (azul). Positivo = hacia cálido (ámbar). 0 = mantener el hue tal cual.

- palette_strategy: "monochromatic" (disciplina, minimalismo) | "analogous" (armonía, continuidad, narrativa) | "complementary" (tensión, dualidad) | "triadic" (variedad viva) | "split_complementary" (equilibrio con tensión)

- typography_family, density, rhythm, era, genre_visual: elige enums según voz y género del libro.

═══════════════════════════════════════════════════════════════════
SURFACE HINTS`;

// ═══════════════════════════════════════════════════════════════════════════
// PATRÓN NUEVO — Filosofía AWSMCOLOR dopaminérgica nivel dios
// ═══════════════════════════════════════════════════════════════════════════
const NEW_BLOCK = `═══════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('🎨 APPLY AWSMCOLOR — Reescribir prompt visual de extractAnchors');
console.log('');

if (!fs.existsSync(FILE_PATH)) {
  console.error('❌ No existe experiments/nucleus/extractors.js');
  console.error('   Ejecuta este script desde /workspaces/triggui-app');
  process.exit(1);
}

const original = fs.readFileSync(FILE_PATH, 'utf8');
console.log('✓ extractors.js leído (' + original.length + ' chars, ' + original.split('\n').length + ' líneas)');

// Verificar idempotencia
if (original.indexOf('FILOSOFÍA AWSMCOLOR DOPAMINÉRGICA') !== -1) {
  console.error('⚠️  El prompt AWSMCOLOR YA está aplicado. No hay nada que hacer.');
  console.error('   Para re-aplicar:');
  console.error('   1. mv experiments/nucleus/extractors.js.backup-pre-awsmcolor-* experiments/nucleus/extractors.js');
  console.error('   2. Vuelve a correr este script');
  process.exit(0);
}

// Verificar que el bloque viejo existe
if (original.indexOf(OLD_BLOCK) === -1) {
  console.error('❌ No se encontró el bloque viejo del prompt visual.');
  console.error('   ¿extractors.js fue modificado?');
  console.error('');
  console.error('   Para diagnosticar, busca dónde difiere:');
  console.error('   grep -A 30 "INTENCIÓN VISUAL" experiments/nucleus/extractors.js');
  process.exit(1);
}
console.log('✓ Bloque viejo del prompt visual encontrado');

// Backup
fs.writeFileSync(BACKUP_PATH, original);
console.log('✓ Backup creado: ' + path.basename(BACKUP_PATH));

// Aplicar reemplazo
const patched = original.replace(OLD_BLOCK, NEW_BLOCK);

if (patched === original) {
  console.error('❌ El reemplazo no se aplicó (string match falló).');
  process.exit(1);
}

const sizeDelta = patched.length - original.length;
const linesDelta = patched.split('\n').length - original.split('\n').length;
console.log('✓ Patch aplicado en memoria (+' + sizeDelta + ' chars, +' + linesDelta + ' líneas)');

// Guardar
fs.writeFileSync(FILE_PATH, patched);
console.log('✓ Archivo guardado');

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ PROMPT AWSMCOLOR DOPAMINÉRGICO INSTALADO');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Próximos pasos:');
console.log('');
console.log('1. Verificar visualmente el cambio:');
console.log('   grep -A 5 "FILOSOFÍA AWSMCOLOR" experiments/nucleus/extractors.js');
console.log('');
console.log('2. Vaciar contenido.json en triggui-content (cero libros, tabula rasa):');
console.log('   cd /workspaces/triggui-content');
console.log('   echo \'{"libros":[]}\' > contenido.json');
console.log('   git add contenido.json');
console.log('   git commit -m "🌒 Reset cuántico: tabula rasa pre-AWSMCOLOR"');
console.log('   git push origin main');
console.log('');
console.log('3. Push del fix AWSMCOLOR:');
console.log('   cd /workspaces/triggui-app');
console.log('   git add experiments/nucleus/extractors.js');
console.log('   git commit -m "🎨 Prompt visual AWSMCOLOR: dopaminérgico, 14 hues por arquetipo, prohibición zona muerta, autoexamen, ejemplos in-context"');
console.log('   git push origin main');
console.log('');
console.log('4. Disparar workflow desde GitHub Actions: triggui.yml manual');
console.log('   Esperar ~22 min → 20 libros nuevos con paletas dopaminérgicas');
console.log('');
console.log('Reversible:');
console.log('   mv ' + path.basename(BACKUP_PATH) + ' experiments/nucleus/extractors.js');
console.log('');