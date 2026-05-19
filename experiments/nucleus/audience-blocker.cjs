#!/usr/bin/env node
/**
 * 🛡️ AUDIENCE BLOCKER v1.2 — Capa pre-commit del workflow Triggui
 * ════════════════════════════════════════════════════════════════
 * Lee el libro RECIÉN GENERADO en un catálogo y verifica con GPT-4o-mini
 * si pertenece a la audiencia esperada (kids|adult).
 *
 * Exit 0 → libro matchea audiencia, workflow continúa
 * Exit 1 → libro NO matchea audiencia, workflow ABORTA antes de commitear
 *
 * Costo: ~$0.0002 por llamada. Sagrado: GPT-4o-mini.
 *
 * v1.1 fixes (2026-05-19):
 *   - libros[0] en vez de libros[length-1]
 *   - prompts separados por audiencia
 *
 * v1.2 fixes (2026-05-19):
 *   - FIX #3: contexto enriquecido (~1500 chars) — combina tagline, card,
 *             parrafoTop, parrafoBot, frases — para que el classifier
 *             tenga señales reales en vez de solo un tagline poético.
 *   - FIX #4: prompt kids reorientado de "rechaza en duda" a "acepta si
 *             no hay señales adultas obvias", reconociendo que el libro
 *             ya pasó el filtro de selección. El blocker debe atrapar
 *             contaminación CLARA, no falsos positivos con contexto
 *             abstracto/poético propio de literatura infantil.
 *
 * Uso:
 *   TARGET_AUDIENCE=kids \
 *   CATALOG_PATH=triggui-content/contenido_kids.json \
 *   OPENAI_API_KEY=sk-... \
 *   node audience-blocker.cjs
 */
"use strict";

const fs = require("node:fs");

const TARGET = String(process.env.TARGET_AUDIENCE || "adult").trim().toLowerCase();
const CATALOG_PATH = process.env.CATALOG_PATH;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-mini";

if (!CATALOG_PATH) { console.error("❌ AUDIENCE_BLOCKER: falta CATALOG_PATH"); process.exit(2); }
if (!OPENAI_KEY)   { console.error("❌ AUDIENCE_BLOCKER: falta OPENAI_API_KEY"); process.exit(2); }
if (!["kids","adult"].includes(TARGET)) {
  console.error(`❌ AUDIENCE_BLOCKER: TARGET_AUDIENCE inválido: ${TARGET}`);
  process.exit(2);
}

if (!fs.existsSync(CATALOG_PATH)) {
  console.error(`❌ AUDIENCE_BLOCKER: catálogo no existe: ${CATALOG_PATH}`);
  process.exit(2);
}
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
if (!Array.isArray(catalog.libros) || catalog.libros.length === 0) {
  console.log("🟡 AUDIENCE_BLOCKER: catálogo vacío — nada que validar, pasando.");
  process.exit(0);
}

// FIX #1 (v1.1): libros[0] es el recién generado (unshift en nucleus)
const libro = catalog.libros[0];

const titulo = libro.titulo || "?";
const autor  = libro.autor || "?";

// 🔧 FIX #3 (v1.2): contexto enriquecido — antes solo tagline (~100 chars),
// ahora combinamos múltiples campos del libro hasta ~1500 chars para que
// el classifier tenga señales reales en vez de adivinar desde un tagline poético.
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
    const ed = b._nucleus.edition_blocks_es
      .map(x => x?.phrase)
      .filter(Boolean)
      .slice(0, 2);
    if (ed.length) parts.push(`Edición viva: ${ed.join(' || ')}`);
  }
  return parts.join('\n').slice(0, 1500);
}

const sinopsis = buildContext(libro);

console.log(`🛡️ AUDIENCE_BLOCKER v1.2 — audit pre-commit`);
console.log(`   target_audience: ${TARGET}`);
console.log(`   libro:           "${titulo}" — ${autor}`);
console.log(`   contexto (${sinopsis.length} chars):`);
console.log(`     ${sinopsis.slice(0,200).replace(/\n/g, '\n     ')}${sinopsis.length > 200 ? '...' : ''}`);

const system = `Eres un classifier estricto pero balanceado de audiencia editorial. Tu trabajo es proteger el catálogo de Triggui de contaminación OBVIA de audiencia. NO rechazas por contexto abstracto o poético propio del estilo Triggui. Respondes SOLO con JSON.`;

let user;
if (TARGET === "kids") {
  // 🔧 FIX #4 (v1.2): prompt kids reorientado.
  // Antes: "en duda razonable, rechaza" → falsos positivos en contexto
  // abstracto/poético propio de literatura infantil (ej. Studio Ghibli).
  // Ahora: "acepta si no hay señales adultas obvias", reconociendo que
  // el libro ya pasó el filtro previo de selección.
  user = `Catálogo Triggui Kids — audiencia: NIÑOS de 4-12 años.

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
} else {
  // TARGET === "adult"
  user = `Catálogo Triggui — audiencia: ADULTOS (mayores de 13 años, lectores generales y profesionales).

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

(async () => {
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
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`❌ AUDIENCE_BLOCKER: OpenAI ${res.status} — ${t.slice(0,200)}`);
      console.log(`⚠️  No se pudo verificar audiencia — dejando pasar (degradación elegante).`);
      process.exit(0);
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed;
    try { parsed = JSON.parse(raw); } catch { console.error(`❌ JSON inválido del classifier: ${raw}`); process.exit(0); }

    console.log(`   classifier:      matches=${parsed.matches} conf=${parsed.confidence} detected="${parsed.detected_audience}" reason="${parsed.reason}"`);

    if (parsed.matches === false && (parsed.confidence ?? 1) >= 0.6) {
      console.error("");
      console.error("════════════════════════════════════════════════════════════════");
      console.error("❌ AUDIENCE_BLOCKER: LIBRO RECHAZADO — abortando workflow");
      console.error("════════════════════════════════════════════════════════════════");
      console.error(`   título:           "${titulo}" — ${autor}`);
      console.error(`   audiencia esperada: ${TARGET}`);
      console.error(`   audiencia detectada: ${parsed.detected_audience}`);
      console.error(`   razón:            ${parsed.reason}`);
      console.error(`   confianza:        ${parsed.confidence}`);
      console.error("");
      console.error("   El libro NO será commiteado. Catálogo intacto.");
      console.error("════════════════════════════════════════════════════════════════");
      process.exit(1);
    }

    console.log(`✅ AUDIENCE_BLOCKER: libro matchea audiencia ${TARGET}.`);
    process.exit(0);
  } catch (e) {
    console.error(`❌ AUDIENCE_BLOCKER error: ${e.message}`);
    console.log(`⚠️  Degradación elegante — dejando pasar.`);
    process.exit(0);
  }
})();
