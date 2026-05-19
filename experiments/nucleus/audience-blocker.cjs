#!/usr/bin/env node
/**
 * 🛡️ AUDIENCE BLOCKER v1.1 — Capa pre-commit del workflow Triggui
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
 *   - FIX #1: lee libros[0] (recién generado) en vez de libros[length-1] (más viejo)
 *             porque build-contenido-nucleus.js agrega al inicio del array
 *   - FIX #2: prompt reorganizado con reglas SEPARADAS por audiencia objetivo
 *             para evitar que el LLM cruce reglas de kids al evaluar adult
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

// 🔧 FIX #1 (v1.1): el libro recién generado está en libros[0]
// porque build-contenido-nucleus.js hace unshift (agrega al inicio).
// Antes leía libros[length-1] que era el libro MÁS VIEJO del catálogo.
const libro = catalog.libros[0];

const titulo = libro.titulo || "?";
const autor  = libro.autor || "?";
const sinopsis = (libro.tagline || libro._nucleus?.card_es?.parrafoTop || libro.frases?.[0] || "").slice(0, 400);

console.log(`🛡️ AUDIENCE_BLOCKER v1.1 — audit pre-commit`);
console.log(`   target_audience: ${TARGET}`);
console.log(`   libro:           "${titulo}" — ${autor}`);
console.log(`   contexto:        ${sinopsis.slice(0,120)}...`);

// 🔧 FIX #2 (v1.1): prompts separados por audiencia objetivo.
// Antes un solo prompt mezclaba las reglas y el LLM cruzaba listas.
const system = `Eres un classifier estricto de audiencia editorial. Tu trabajo es proteger el catálogo de Triggui de contaminación de audiencia. Respondes SOLO con JSON.`;

let user;
if (TARGET === "kids") {
  user = `Catálogo Triggui Kids — audiencia: NIÑOS de 4-12 años.

Libro a evaluar:
- Título: ${titulo}
- Autor: ${autor}
- Contexto: ${sinopsis}

¿Este libro es apropiado para niños de 4-12 años?

RECHAZA (matches=false) si el libro trata sobre:
- Negocios, estrategia empresarial, management, liderazgo corporativo
- Autoayuda adulta, terapia ACT/CBT, psicología clínica
- Finanzas personales, inversión, dinero, riqueza
- Política, geopolítica, historia política compleja
- Filosofía abstracta (Kant, Heidegger, Byung-Chul Han, Sartre, etc.)
- Novela erótica, romance adulto, true crime, thriller violento
- Ciencia técnica avanzada (física cuántica, IA avanzada para profesionales)
- Cualquier tema cuya comprensión requiera madurez cognitiva de adulto

ACEPTA (matches=true) si el libro es:
- Literatura infantil clásica o moderna (Roald Dahl, Eric Carle, Beatrix Potter, etc.)
- Cuentos, fábulas, álbumes ilustrados
- Aventura, fantasía o ciencia ficción accesible para niños
- Libros educativos para niños (animales, naturaleza, ciencia simple)
- Poesía infantil, rimas, libros de actividades

En duda razonable, RECHAZA.

Responde SOLO JSON:
{ "matches": true|false, "confidence": 0.0-1.0, "reason": "<10 palabras>", "detected_audience": "kids|young_adult|adult|unclear" }`;
} else {
  // TARGET === "adult"
  user = `Catálogo Triggui — audiencia: ADULTOS (mayores de 13 años, lectores generales y profesionales).

Libro a evaluar:
- Título: ${titulo}
- Autor: ${autor}
- Contexto: ${sinopsis}

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
