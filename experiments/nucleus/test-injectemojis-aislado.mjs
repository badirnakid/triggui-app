import { injectEmojis } from "./post-processors.js";

console.log("=== TEST AISLADO: ¿ensureSentenceClosure se ejecuta dentro de injectEmojis? ===\n");

const contentES = {
  edition_blocks_es: [
    { gesture_type: "pregunta_directa", sensory_anchor: "tiempo", phrase: "¿Estás dispuesto a dedicar tiempo a la reflexión sin hacer nada" }
  ],
  og_phrases_es: [
    "¿Qué barreras invisibles limitan tu pensamiento creativo"
  ]
};
const contentEN = { edition_blocks_en: [], og_phrases_en: [] };

console.log("INPUT (lo que GPT habría generado):");
console.log("  edition_blocks_es[0].phrase:", JSON.stringify(contentES.edition_blocks_es[0].phrase));
console.log("  og_phrases_es[0]:           ", JSON.stringify(contentES.og_phrases_es[0]));
console.log();

const result = injectEmojis(contentES, contentEN, "Piensa como un científico espacial", "Ozan Varol");

console.log("OUTPUT de injectEmojis:");
console.log("  edition_blocks_es[0].phrase:", JSON.stringify(result.edition_blocks_es[0].phrase));
console.log("  og_phrases_es[0]:           ", JSON.stringify(result.og_phrases_es[0]));
console.log();

const ed = result.edition_blocks_es[0].phrase;
const og = result.og_phrases_es[0];

console.log("VERIFICACIÓN:");
console.log("  edition phrase termina en ?:", ed.endsWith("?") ? "✅ SÍ" : "❌ NO");
console.log("  og phrase termina en ?:     ", og.endsWith("?") ? "✅ SÍ" : "❌ NO");
