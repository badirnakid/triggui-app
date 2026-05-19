#!/usr/bin/env node
/**
 * 🛡️ AUDIENCE BLOCKER v2.0 — Capa pre-commit con quarantine selectiva
 * ═══════════════════════════════════════════════════════════════════
 * Audita los N libros RECIÉN GENERADOS de un batch (libros[0..N-1])
 * y aplica QUARANTINE SELECTIVA: los aprobados quedan en el catálogo
 * principal, los rechazados van a contenido_rejected.json con metadata
 * forense. NADA se destruye — los rechazados son recuperables.
 *
 * Costo: ~$0.0002 por libro auditado. Sagrado: GPT-4o-mini.
 *
 * Exit codes:
 *   0 → siempre (excepto error técnico). Workflow continúa.
 *   1 → error técnico (catálogo inválido, OpenAI key faltante, etc.)
 *
 * Cambios v2.0 vs v1.2:
 *   - Audita BATCH_SIZE libros en vez de solo libros[0]
 *   - Particiona pass[] / fail[] en vez de abortar
 *   - Reescribe catálogo principal SIN los rechazados
 *   - Crea/actualiza {catalog}_rejected.json con metadata forense
 *   - Exit 0 siempre (workflow nunca aborta — quarantine resuelve todo)
 *
 * Uso:
 *   TARGET_AUDIENCE=kids \
 *   CATALOG_PATH=triggui-content/contenido_kids.json \
 *   BATCH_SIZE=20 \
 *   OPENAI_API_KEY=sk-... \
 *   node audience-blocker.cjs
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const VERSION = "2.0";
const TARGET = String(process.env.TARGET_AUDIENCE || "adult").trim().toLowerCase();
const CATALOG_PATH = process.env.CATALOG_PATH;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const BATCH_SIZE = Math.max(1, parseInt(process.env.BATCH_SIZE || "1", 10));
const CONFIDENCE_THRESHOLD = 0.6;
const MODEL = "gpt-4o-mini";

if (!CATALOG_PATH) { console.error("❌ AUDIENCE_BLOCKER: falta CATALOG_PATH"); process.exit(1); }
if (!OPENAI_KEY)   { console.error("❌ AUDIENCE_BLOCKER: falta OPENAI_API_KEY"); process.exit(1); }
if (!["kids","adult"].includes(TARGET)) {
  console.error(`❌ AUDIENCE_BLOCKER: TARGET_AUDIENCE inválido: ${TARGET}`);
  process.exit(1);
}
if (!fs.existsSync(CATALOG_PATH)) {
  console.error(`❌ AUDIENCE_BLOCKER: catálogo no existe: ${CATALOG_PATH}`);
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
if (!Array.isArray(catalog.libros)) {
  console.error(`❌ AUDIENCE_BLOCKER: catálogo inválido (no libros[])`);
  process.exit(1);
}
if (catalog.libros.length === 0) {
  console.log("🟡 AUDIENCE_BLOCKER: catálogo vacío — nada que validar.");
  process.exit(0);
}

// Los N libros recientes están en libros[0..N-1] (nucleus hace unshift)
const N = Math.min(BATCH_SIZE, catalog.libros.length);
const librosNuevos = catalog.libros.slice(0, N);
const librosViejos = catalog.libros.slice(N);

console.log(`🛡️ AUDIENCE_BLOCKER v${VERSION} — multi-libro + quarantine`);
console.log(`   target_audience: ${TARGET}`);
console.log(`   batch_size:      ${BATCH_SIZE}`);
console.log(`   catálogo:        ${path.basename(CATALOG_PATH)} (${catalog.libros.length} libros totales)`);
console.log(`   auditando:       ${N} libros nuevos (libros[0..${N-1}])`);

function buildContext(b) {
  const parts = [];
  if (b.tagline) parts.push(`Tagline: ${b.tagline}`);
  if (b._nucleus?.card_es?.titulo)    parts.push(`Card título: ${b._nucleus.card_es.titulo}`);
  if (b._nucleus?.card_es?.subtitulo) parts.push(`Card subtítulo: ${b._nucleus.card_es.subtitulo}`);
  if (b._nucleus?.card_es?.parrafoTop) parts.push(`Card top: ${b._nucleus.card_es.parrafoTop}`);
  if (b._nucleus?.card_es?.parrafoBot) parts.push(`Card bottom: ${b._nucleus.card_es.parrafoBot}`);
  if (Array.isArray(b.frases) && b.frases.length > 0) {
    parts.push(`Frases destacadas: ${b.frases.slice(0, 3).filter(Boolean).join(' || ')}`);
  }
  if (Array.isArray(b._nucleus?.edition_blocks_es)) {
    const ed = b._nucleus.edition_blocks_es.map(x => x?.phrase).filter(Boolean).slice(0, 2);
    if (ed.length) parts.push(`Edición viva: ${ed.join(' || ')}`);
  }
  return parts.join('\n').slice(0, 1500);
}

const SYSTEM = `Eres un classifier estricto pero balanceado de audiencia editorial. Tu trabajo es proteger el catálogo de Triggui de contaminación OBVIA de audiencia. NO rechazas por contexto abstracto o poético propio del estilo Triggui. Respondes SOLO con JSON.`;

function buildUserPrompt(titulo, autor, sinopsis, target) {
  if (target === "kids") {
    return `Catálogo Triggui Kids — audiencia: NIÑOS de 4-12 años.

Libro a evaluar:
- Título: ${titulo}
- Autor: ${autor}
- Contexto del libro:
${sinopsis}

¿Este libro contiene contenido CLARAMENTE adulto que lo haga inapropiado para niños 4-12 años?

RECHAZA (matches=false) SOLO si encuentras señales EXPLÍCITAS de:
- Negocios, estrategia empresarial, management, liderazgo corporativo
- Finanzas, inversión, dinero, riqueza, economía adulta
- Autoayuda adulta, terapia clínica (ACT/CBT/DBT), psicoanálisis
- Filosofía abstracta para adultos (Kant, Heidegger, Byung-Chul Han, Sartre, Foucault)
- Política, geopolítica, ideología partidista
- Novela erótica, romance explícito, contenido sexual
- True crime, thriller violento, horror gráfico
- Ciencia técnica avanzada para profesionales
- Temas médicos clínicos para adultos

ACEPTA (matches=true) en todos los demás casos. En particular:
- Literatura infantil clásica o moderna (Roald Dahl, Eric Carle, Beatrix Potter, etc.)
- Studio Ghibli, anime familiar, animaciones para niños (Miyazaki, Pixar, Disney)
- Cuentos, fábulas, álbumes ilustrados
- Aventura, fantasía, ciencia ficción accesible
- Libros educativos infantiles (animales, naturaleza, ciencia simple)
- Poesía infantil, rimas, libros de actividades
- Contexto poético, abstracto, contemplativo sobre cielo/sueños/naturaleza
  → ESTO ES NORMAL EN LITERATURA INFANTIL, NO ES SEÑAL DE CONTENIDO ADULTO

El libro YA pasó un filtro previo de selección que evaluó audiencia.
Tu rol es atrapar contaminación OBVIA, no falsos positivos con contexto
poético. En duda razonable con contexto neutral/poético, ACEPTA.

Responde SOLO JSON:
{ "matches": true|false, "confidence": 0.0-1.0, "reason": "<10 palabras>", "detected_audience": "kids|young_adult|adult|unclear" }`;
  }

  // target === "adult"
  return `Catálogo Triggui — audiencia: ADULTOS (mayores de 13 años, lectores generales y profesionales).

Libro a evaluar:
- Título: ${titulo}
- Autor: ${autor}
- Contexto del libro:
${sinopsis}

¿Este libro es apropiado para adultos?

ACEPTA (matches=true) en CASI TODOS los casos. El catálogo adulto incluye:
- Negocios, estrategia, management, liderazgo
- Autoayuda, psicología, terapia, filosofía (incluyendo Byung-Chul Han, Kant, Sartre, etc.)
- Finanzas, inversión, economía
- Política, historia, geopolítica
- Ciencia, tecnología, divulgación
- Ficción literaria adulta, novela, ensayo
- Filosofía contemplativa, espiritualidad, meditación

RECHAZA (matches=false) SOLO si el libro es:
- Libro ilustrado para preescolares (0-6 años) sin texto sustancial
- Libro de actividades infantiles (colorear, calcomanías)
- Texto mínimo orientado a niños pre-lectores

NO rechaces filosofía, autoayuda, negocios, ni temas adultos serios — esos son JUSTAMENTE el catálogo adulto.

Responde SOLO JSON:
{ "matches": true|false, "confidence": 0.0-1.0, "reason": "<10 palabras>", "detected_audience": "kids|young_adult|adult|unclear" }`;
}

async function auditOne(libro) {
  const titulo = libro.titulo || "?";
  const autor  = libro.autor || "?";
  const sinopsis = buildContext(libro);
  const user = buildUserPrompt(titulo, autor, sinopsis, TARGET);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        max_tokens: 150,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user }
        ]
      })
    });
    if (!res.ok) {
      const t = await res.text();
      return { titulo, autor, pass: true, degraded: true,
        reason: `OpenAI ${res.status}: ${t.slice(0,100)}`, confidence: null, detected_audience: "unknown" };
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed;
    try { parsed = JSON.parse(raw); } catch {
      return { titulo, autor, pass: true, degraded: true,
        reason: "JSON inválido del classifier", confidence: null, detected_audience: "unknown" };
    }
    const conf = parsed.confidence ?? 1;
    const matches = parsed.matches !== false;
    const rejected = !matches && conf >= CONFIDENCE_THRESHOLD;
    return {
      titulo, autor,
      pass: !rejected,
      matches,
      confidence: conf,
      detected_audience: parsed.detected_audience || "unclear",
      reason: parsed.reason || ""
    };
  } catch (e) {
    return { titulo, autor, pass: true, degraded: true,
      reason: `Error: ${e.message}`, confidence: null, detected_audience: "unknown" };
  }
}

function getRejectedPath(catalogPath) {
  const dir = path.dirname(catalogPath);
  const ext = path.extname(catalogPath);
  const base = path.basename(catalogPath, ext);
  return path.join(dir, `${base}_rejected${ext}`);
}

(async () => {
  try {
    const pass = [];
    const fail = [];
    const degraded = [];

    console.log(``);
    console.log(`📋 Auditando ${N} libros del batch:`);
    for (let i = 0; i < N; i++) {
      const libro = librosNuevos[i];
      const titulo = libro.titulo || "?";
      const autor  = libro.autor || "?";
      console.log(`   [${i+1}/${N}] "${titulo}" — ${autor}`);
      const r = await auditOne(libro);
      if (r.degraded) {
        console.log(`         🟡 DEGRADED (${r.reason}) — pasando por seguridad`);
        degraded.push(libro);
        pass.push(libro);
      } else if (r.pass) {
        console.log(`         ✅ PASS (conf=${r.confidence}, detected=${r.detected_audience})`);
        pass.push(libro);
      } else {
        console.log(`         ❌ FAIL (conf=${r.confidence}, detected=${r.detected_audience})`);
        console.log(`              razón: ${r.reason}`);
        libro._rejected = {
          timestamp: new Date().toISOString(),
          target_audience: TARGET,
          detected_audience: r.detected_audience,
          reason: r.reason,
          confidence: r.confidence,
          blocker_version: VERSION
        };
        fail.push(libro);
      }
    }

    console.log(``);
    console.log(`📊 Resultados de la auditoría:`);
    console.log(`   ✅ PASS:        ${pass.length}/${N}`);
    console.log(`   ❌ QUARANTINE:  ${fail.length}/${N}`);
    if (degraded.length > 0) {
      console.log(`   🟡 DEGRADED:    ${degraded.length} (errores técnicos, pasaron por seguridad)`);
    }

    if (fail.length === 0) {
      console.log(``);
      console.log(`✅ Todos los libros del batch aprobados. Catálogo intacto.`);
      process.exit(0);
    }

    console.log(``);
    console.log(`🔀 Aplicando quarantine selectiva...`);

    // 1. Reescribir catálogo principal SIN los rechazados
    catalog.libros = [...pass, ...librosViejos];
    catalog.meta = catalog.meta || {};
    catalog.meta.total = catalog.libros.length;
    catalog.meta.last_updated = new Date().toISOString();
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
    console.log(`   ✓ Catálogo principal reescrito: ${path.basename(CATALOG_PATH)} (${catalog.libros.length} libros)`);

    // 2. Crear/actualizar catálogo rejected
    const rejectedPath = getRejectedPath(CATALOG_PATH);
    let rejectedCatalog;
    if (fs.existsSync(rejectedPath)) {
      try {
        rejectedCatalog = JSON.parse(fs.readFileSync(rejectedPath, "utf8"));
        if (!Array.isArray(rejectedCatalog.libros)) rejectedCatalog.libros = [];
      } catch {
        rejectedCatalog = { libros: [], meta: {} };
      }
    } else {
      rejectedCatalog = {
        libros: [],
        meta: {
          version: "1.0.0",
          generated_at: new Date().toISOString(),
          total: 0,
          note: "Quarantine catalog — libros rechazados por audience-blocker. Pueden recuperarse manualmente si fueron falsos positivos."
        }
      };
    }
    rejectedCatalog.libros = [...fail, ...rejectedCatalog.libros];
    rejectedCatalog.meta = rejectedCatalog.meta || {};
    rejectedCatalog.meta.total = rejectedCatalog.libros.length;
    rejectedCatalog.meta.last_updated = new Date().toISOString();
    fs.writeFileSync(rejectedPath, JSON.stringify(rejectedCatalog, null, 2));
    console.log(`   ✓ Quarantine actualizada: ${path.basename(rejectedPath)} (${rejectedCatalog.libros.length} libros)`);

    console.log(``);
    console.log(`📦 Libros enviados a quarantine:`);
    fail.forEach((b, i) => {
      console.log(`   ${i+1}. "${b.titulo}" — ${b.autor}`);
      console.log(`      razón:    ${b._rejected.reason}`);
      console.log(`      conf:     ${b._rejected.confidence}`);
      console.log(`      detected: ${b._rejected.detected_audience}`);
    });

    console.log(``);
    console.log(`✅ Quarantine completada. Workflow continúa con catálogo limpio.`);
    process.exit(0);
  } catch (e) {
    console.error(`❌ AUDIENCE_BLOCKER error inesperado: ${e.message}`);
    console.error(e.stack);
    console.log(`⚠️  Degradación elegante — dejando pasar.`);
    process.exit(0);
  }
})();
