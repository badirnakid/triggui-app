#!/usr/bin/env node
/**
 * 🛡️ AUDIENCE BLOCKER — Capa 4 pre-commit del workflow Triggui
 * ════════════════════════════════════════════════════════════════
 * Lee el último libro generado en un catálogo y verifica con GPT-4o-mini
 * si pertenece a la audiencia esperada (kids|adult).
 *
 * Exit 0 → libro matchea audiencia, workflow continúa
 * Exit 1 → libro NO matchea audiencia, workflow ABORTA antes de commitear
 *
 * Costo: ~$0.0001 por llamada. Sagrado: GPT-4o-mini.
 *
 * Uso:
 *   TARGET_AUDIENCE=kids \
 *   CATALOG_PATH=triggui-content/contenido_kids.json \
 *   OPENAI_API_KEY=sk-... \
 *   node audience-blocker.cjs
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const TARGET = String(process.env.TARGET_AUDIENCE || "adult").trim().toLowerCase();
const CATALOG_PATH = process.env.CATALOG_PATH;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-4o-mini";

if (!CATALOG_PATH) { console.error("❌ AUDIENCE_BLOCKER: falta CATALOG_PATH"); process.exit(2); }
if (!OPENAI_KEY)   { console.error("❌ AUDIENCE_BLOCKER: falta OPENAI_API_KEY"); process.exit(2); }
if (!["kids","adult"].includes(TARGET)) { console.error(`❌ AUDIENCE_BLOCKER: TARGET_AUDIENCE inválido: ${TARGET}`); process.exit(2); }

// Leer catálogo y tomar último libro (el recién generado)
if (!fs.existsSync(CATALOG_PATH)) { console.error(`❌ AUDIENCE_BLOCKER: catálogo no existe: ${CATALOG_PATH}`); process.exit(2); }
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
if (!Array.isArray(catalog.libros) || catalog.libros.length === 0) {
  console.log("🟡 AUDIENCE_BLOCKER: catálogo vacío — nada que validar, pasando.");
  process.exit(0);
}
const libro = catalog.libros[catalog.libros.length - 1];

const titulo = libro.titulo || "?";
const autor  = libro.autor || "?";
const sinopsis = (libro.tagline || libro._nucleus?.card_es?.parrafoTop || libro.frases?.[0] || "").slice(0, 400);

console.log(`🛡️ AUDIENCE_BLOCKER v1.0 — audit pre-commit`);
console.log(`   target_audience: ${TARGET}`);
console.log(`   libro:           "${titulo}" — ${autor}`);
console.log(`   contexto:        ${sinopsis.slice(0,120)}...`);

const audienceLabelES = TARGET === "kids" ? "NIÑOS (4-12 años)" : "ADULTOS";

const system = `Eres un classifier estricto de audiencia editorial. Tu trabajo es proteger el catálogo de Triggui de contaminación de audiencia. Respondes SOLO con JSON.`;

const user = `Audiencia objetivo del catálogo: ${audienceLabelES}.

Libro generado:
- Título: ${titulo}
- Autor: ${autor}
- Contexto: ${sinopsis}

¿Este libro es apropiado para audiencia ${audienceLabelES}?

Reglas:
- KIDS rechaza: negocios, estrategia, autoayuda adulta, terapia ACT/CBT, finanzas, liderazgo, management, política, filosofía adulta, novela erótica, true crime, ciencia técnica.
- ADULT rechaza: solo libros ilustrados para preescolares o libros con texto mínimo para 0-6 años.
- En duda razonable, rechaza.

Responde SOLO JSON:
{ "matches": true|false, "confidence": 0.0-1.0, "reason": "<10 palabras>", "detected_audience": "kids|young_adult|adult|unclear" }`;

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
