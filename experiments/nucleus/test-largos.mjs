// Pruebas de largos.js (C278, 2 de noviembre de 2026). Uso: node test-largos.mjs
import { recortaParrafo, ajustaLargos, plano, LARGOS } from "./largos.js";

let bien = 0, mal = 0;
const prueba = (nombre, ok, detalle = "") => { if (ok) { bien++; } else { mal++; console.log(`✘ ${nombre}${detalle ? "\n   " + detalle : ""}`); } };

const O = (n, letra = "a") => `${letra.toUpperCase()}${letra.repeat(n - 2)}.`;   // una oración de n caracteres visibles

// 1. Lo que cabe no se toca, con o sin resaltado.
const corto = `${O(100)} [H]${O(90, "b")}[/H] ${O(80, "c")}`;
prueba("cabe: igual", recortaParrafo(corto) === corto);

// 2. Se queda hasta la última oración completa que cabe.
const largo = `${O(150)} ${O(150, "b")} ${O(60, "c")}`;   // 150 + 1 + 150 + 1 + 60 = 362
const r2 = recortaParrafo(largo);
prueba("corta en la oración que cabe", r2 === `${O(150)} ${O(150, "b")}`, r2);
prueba("cabe después del corte", plano(r2).length <= 320);

// 3. No parte un resaltado: si el corte cae dentro de [H]...[/H], corta antes.
const conH = `${O(150)} [H]${O(150, "b")} ${O(60, "c")}[/H]`;
const r3 = recortaParrafo(conH);
prueba("no parte el resaltado", r3 === O(150), r3);

// 4. El resaltado que cierra justo en el corte se queda completo.
const conH2 = `[H]${O(150)}[/H] ${O(150, "b")} ${O(60, "c")}`;
const r4 = recortaParrafo(conH2);
prueba("resaltado completo antes del corte", r4 === `[H]${O(150)}[/H] ${O(150, "b")}`, r4);

// 5. No baja del mínimo: si el único corte deja menos de 80, se queda como vino.
const sinCorte = `${O(50)} ${"b".repeat(300)}.`;
prueba("no baja de 80", recortaParrafo(sinCorte) === sinCorte);

// 6. Preguntas, exclamaciones, comillas de cierre y puntos suspensivos cuentan como fin de oración.
const signos = `¿${"a".repeat(140)}?» ¡${"b".repeat(140)}! ${"C" + "c".repeat(80)}…`;
const r6 = recortaParrafo(signos);
prueba("signos de cierre", r6 === `¿${"a".repeat(140)}?» ¡${"b".repeat(140)}!`, r6);

// 7. Un número con punto o una abreviatura seguida de minúscula no son fin de oración.
const numero = `${"A" + "a".repeat(140)} cuesta 3.5 pesos y p. ej. sigue ${"b".repeat(140)}. ${O(60, "c")}`;
const r7 = recortaParrafo(numero);
prueba("no corta en 3.5 ni en p. ej.", !/3\.$|p\.$|ej\.$/.test(r7) && plano(r7).length <= 320, r7);

// 7b. Iniciales y abreviaturas de tratamiento no cierran la oración (segunda pasada de C300).
const relleno = (n) => "a".repeat(n);
const mr = `${"T" + relleno(150)}. Then Mr. Darcy walked ${relleno(150)} and on ${relleno(40)}.`;
const rMr = recortaParrafo(mr);
prueba("no corta en «Mr.»", !/Mr\.$/.test(rMr) && rMr === `${"T" + relleno(150)}.`, rMr.slice(-40));
const dr = `${"L" + relleno(150)}. Lo dijo el Dr. López con ${relleno(150)} y luego ${relleno(40)}.`;
prueba("no corta en «Dr.»", recortaParrafo(dr) === `${"L" + relleno(150)}.`, recortaParrafo(dr).slice(-40));
const jk = `${"E" + relleno(150)}. Lo escribió J. K. Rowling en ${relleno(150)} y ${relleno(40)}.`;
prueba("no corta en «J. K.»", recortaParrafo(jk) === `${"E" + relleno(150)}.`, recortaParrafo(jk).slice(-40));
const comillas = `${"U" + relleno(150)}. «A. Tal» dijo ${relleno(160)}. ${"F" + relleno(40)}.`;
prueba("inicial tras comilla tampoco", !/«A\.$/.test(recortaParrafo(comillas)), recortaParrafo(comillas).slice(-30));

// 8. ajustaLargos recorta en su lugar y avisa lo demás.
const contenido = {
  card_es: { titulo: "x".repeat(70), parrafoTop: largo, subtitulo: "Una pregunta clara para abrir?", parrafoBot: corto },
  emotional_words_es: ["miedo", "no", "prisa", "empezar"],
  edition_blocks_es: [{ phrase: "Corta." }, { phrase: "b".repeat(60) + "." }],
  og_phrases_es: [{ phrase: "c".repeat(75) + "." }, "d".repeat(50) + "."]
};
const { cambios, avisos } = ajustaLargos(contenido, "es");
prueba("ajusta: recorta parrafoTop", contenido.card_es.parrafoTop === r2 && cambios.length === 1 && cambios[0] === `parrafoTop 362→${plano(r2).length}`, JSON.stringify(cambios));
prueba("ajusta: no toca lo que cabe", contenido.card_es.parrafoBot === corto);
prueba("ajusta: avisa título, palabra, bloque y og", ["titulo 70", "palabra «no» 2", "bloque 6", "og 76"].every((x) => avisos.some((a) => a.startsWith(x))) && avisos.length === 4, JSON.stringify(avisos));

// 9. Inglés y entradas raras.
const en = { card_en: { parrafoTop: largo, parrafoBot: sinCorte } };
const rEn = ajustaLargos(en, "en");
prueba("inglés: recorta y avisa el que no tiene corte", en.card_en.parrafoTop === r2 && rEn.avisos.some((a) => a.startsWith("parrafoBot")), JSON.stringify(rEn));
prueba("entradas raras no truenan", ajustaLargos(null, "es").cambios.length === 0 && ajustaLargos({}, "es").avisos.length === 0 && recortaParrafo(undefined) === "");
prueba("límites del esquema", LARGOS.parrafoTop[1] === 320 && LARGOS.parrafoBot[1] === 320 && LARGOS.titulo[1] === 60);

console.log(`${bien} pasaron · ${mal} fallaron`);
process.exit(mal ? 1 : 0);
