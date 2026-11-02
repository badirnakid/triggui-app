// Pruebas de agregaPuertasCSAL (C278, 2 de noviembre de 2026). Uso: node test-puertas.mjs
import { agregaPuertasCSAL } from "./csal-extractor.js";

let bien = 0, mal = 0;
const prueba = (nombre, ok, detalle = "") => { if (ok) bien++; else { mal++; console.log(`✘ ${nombre}${detalle ? "\n   " + detalle : ""}`); } };

const csal = { trigger_keywords: { emociones: ["Miedo", "angustia"], objetos: ["estrella"], contextos: ["desierto"], verbos: ["cuidar"] } };
const s1 = agregaPuertasCSAL(csal, ["miedo", "soledad", "cuidar", " Estrellas ", "loneliness", "", null, "soledad"]);
prueba("suma solo las que faltan, sin repetir ni vacías", JSON.stringify(s1) === JSON.stringify(["soledad", "Estrellas", "loneliness"]), JSON.stringify(s1));
prueba("van a emociones, al final", JSON.stringify(csal.trigger_keywords.emociones) === JSON.stringify(["Miedo", "angustia", "soledad", "Estrellas", "loneliness"]), JSON.stringify(csal.trigger_keywords.emociones));
prueba("no toca las otras categorías", csal.trigger_keywords.verbos.length === 1 && csal.trigger_keywords.objetos.length === 1);
const s2 = agregaPuertasCSAL(csal, ["soledad", "MIEDO"]);
prueba("idempotente", s2.length === 0 && csal.trigger_keywords.emociones.length === 5);
const vacio = {};
prueba("CSAL sin palabras clave: las crea", JSON.stringify(agregaPuertasCSAL(vacio, ["prisa"])) === '["prisa"]' && vacio.trigger_keywords.emociones[0] === "prisa");
prueba("entradas raras no truenan", agregaPuertasCSAL(null, ["x"]).length === 0 && agregaPuertasCSAL({}, null).length === 0 && agregaPuertasCSAL({ trigger_keywords: "x" }, ["a"]).length === 1);

console.log(`${bien} pasaron · ${mal} fallaron`);
process.exit(mal ? 1 : 0);
