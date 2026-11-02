#!/usr/bin/env node
/*
 * Pruebas de sanitize-walker.js: los cinco pases, con el foco en los dos de C278 (cierre de JSON y comilla suelta
 * al final). Los casos de origen son reales, de los bancos C278 del 2 de noviembre de 2026 con Claude: «El
 * Principito» terminó en «importa.'» (banco 1) y «Las venas abiertas de América Latina» en «hace siglos."]}»
 * (banco 2).
 *
 *   node test-sanitize-walker.mjs
 */
import assert from 'node:assert/strict';
import { sanitizeString, sanitizeObject, PASSES } from './sanitize-walker.js';

let ok = 0;
let fallas = 0;
function caso(nombre, fn) {
  try { fn(); ok++; console.log(`✅ ${nombre}`); }
  catch (e) { fallas++; console.log(`❌ ${nombre}\n   ${e.message}`); }
}
const limpia = (s) => sanitizeString(s).clean;

console.log('═══ sanitize-walker: cinco pases ═══');

caso('los pases van en su orden: cierre_json antes que comilla_suelta', () => {
  assert.deepEqual(PASSES.map((p) => p.name), ['ansi_sequences', 'emoji_bug_repair', 'control_chars', 'cierre_json', 'comilla_suelta']);
});

// ── Pase 4: cierre de JSON suelto ──
caso('el caso real del banco 2: «hace siglos."]}» → «hace siglos.»', () => {
  const s = 'Los dividendos del tráfico de esclavos y las ganancias de las grandes corporaciones forman una misma cadena. [H]Cada eslabón heredó del anterior la costumbre de llevarse lo que otros produjeron.[/H] El presente no nació de la nada: nació de lo que se decidió hace siglos."]}';
  assert.equal(limpia(s), s.slice(0, -3));
});
caso('comilla y llave', () => assert.equal(limpia('importa."}'), 'importa.'));
caso('apóstrofo y corchete', () => assert.equal(limpia('importa.\']'), 'importa.'));
caso('después del cierre de un resaltado', () => assert.equal(limpia('[H]Firme.[/H]"]}'), '[H]Firme.[/H]'));
caso('cita con comillas y cierre de JSON: se va el cierre, la cita se queda', () => assert.equal(limpia('Dijo "ven."]}'), 'Dijo "ven."'));
caso('con un corchete que abre, no se toca', () => assert.equal(limpia('Ver [nota "uno."]'), 'Ver [nota "uno."]'));
caso('un JSON guardado como texto no se toca', () => assert.equal(limpia('{"a":"b."}'), '{"a":"b."}'));
caso('corchete sin comilla antes, no se toca', () => assert.equal(limpia('[sic.]'), '[sic.]'));

// ── Pase 4: lo que se limpia ──
caso('el caso real del banco: «importa.\'» → «importa.»', () => {
  const s = 'Nadie cuenta esas horas en los balances, y sin embargo son ellas las que sostienen todo lo que de verdad importa.\'';
  assert.equal(limpia(s), s.slice(0, -1));
});
caso('comilla doble suelta tras signo de interrogación', () => assert.equal(limpia('¿Vienes?"'), '¿Vienes?'));
caso('apóstrofo suelto tras signo de exclamación', () => assert.equal(limpia('¡Ven!\''), '¡Ven!'));
caso('angular de cierre sin la de apertura', () => assert.equal(limpia('Ven.»'), 'Ven.'));
caso('comilla tipográfica de cierre sin la de apertura', () => assert.equal(limpia('Ven.”'), 'Ven.'));
caso('varias comillas sueltas juntas', () => assert.equal(limpia('importa.\'"'), 'importa.'));
caso('tras puntos suspensivos', () => assert.equal(limpia('y así…\''), 'y así…'));
caso('después del cierre de un resaltado', () => assert.equal(limpia('[H]Una rosa se vuelve única.[/H]\''), '[H]Una rosa se vuelve única.[/H]'));
caso('el apóstrofo dentro de una palabra no abre nada', () => assert.equal(limpia('It\'s over.\''), 'It\'s over.'));
caso('se conserva el espacio final', () => assert.equal(limpia('importa.\' '), 'importa. '));

// ── Pase 4: lo que NO se toca ──
caso('cita completa con comillas angulares', () => assert.equal(limpia('«Ven.»'), '«Ven.»'));
caso('cita completa con comillas dobles', () => assert.equal(limpia('He called it "home."'), 'He called it "home."'));
caso('cita completa con comillas simples', () => assert.equal(limpia('He called it \'home.\''), 'He called it \'home.\''));
caso('cita simple en español', () => assert.equal(limpia('Dijo \'adiós.\''), 'Dijo \'adiós.\''));
caso('cita simple tras ¿ (revisión de C300)', () => assert.equal(limpia('¿\'Quién soy yo?\''), '¿\'Quién soy yo?\''));
caso('cita simple tras dos puntos sin espacio', () => assert.equal(limpia('Dijo:\'basta.\''), 'Dijo:\'basta.\''));
caso('apertura tipográfica y cierre recto', () => assert.equal(limpia('“Hola."'), '“Hola."'));
caso('título de video del catálogo (abre “, cierra ”)', () => {
  const s = 'Osho – La Libertad de Ser Nada “ABANDONA LA IDENTIDAD.”';
  assert.equal(limpia(s), s);
});
caso('sin signo final antes de la comilla', () => assert.equal(limpia('importa\''), 'importa\''));
caso('sin comilla al final', () => assert.equal(limpia('importa.'), 'importa.'));
caso('comilla en medio, no al final', () => assert.equal(limpia('Dijo.\' Y se fue.'), 'Dijo.\' Y se fue.'));
caso('cadena vacía', () => assert.equal(limpia(''), ''));

// ── Pases 1 a 3, intactos ──
caso('pase 1: secuencia ANSI completa', () => assert.equal(limpia('a\u001b[31mb\u001b[0m'), 'ab'));
caso('pase 2: emoji roto \\u001f440 → 👀', () => assert.equal(limpia('mira \u001f440'), 'mira 👀'));
caso('pase 3: caracteres de control', () => assert.equal(limpia('a\u0000b\u0007c\td\ne'), 'abc\td\ne'));

// ── Objeto completo, estadísticas e idempotencia ──
caso('sanitizeObject cuenta las comillas sueltas y no muta el original', () => {
  const original = { tarjeta: { parrafoTop: 'Uno.\'', parrafoBot: '«Dos.»' }, frases: ['Tres!"', 'Cuatro.', 'Cinco."]}'], n: 3, x: null };
  const copia = JSON.parse(JSON.stringify(original));
  const { clean, stats, modified } = sanitizeObject(original);
  assert.equal(modified, true);
  assert.equal(stats.comilla_suelta, 3);
  assert.equal(stats.cierre_json, 1);
  assert.equal(stats.control_chars, 0);
  assert.deepEqual(clean, { tarjeta: { parrafoTop: 'Uno.', parrafoBot: '«Dos.»' }, frases: ['Tres!', 'Cuatro.', 'Cinco.'], n: 3, x: null });
  assert.deepEqual(original, copia);
});
caso('idempotente: limpiar dos veces es lo mismo que una', () => {
  const muestras = ['importa.\'"', 'Ven.»', '«Ven.»', 'It\'s over.\'', 'mira \u001f440.\'', 'a\u0000b.', 'siglos."]}', 'Dijo "ven."]}', '{"a":"b."}'];
  for (const s of muestras) assert.equal(limpia(limpia(s)), limpia(s));
});
caso('lo ya limpio sale idéntico y sin estadísticas', () => {
  const { clean, stats, modified } = sanitizeObject({ a: 'Hola.', b: ['«Ven.»', 'It\'s over.'] });
  assert.equal(modified, false);
  assert.deepEqual(clean, { a: 'Hola.', b: ['«Ven.»', 'It\'s over.'] });
  assert.equal(Object.values(stats).reduce((x, y) => x + y, 0), 0);
});

console.log(`\n${ok} pasaron · ${fallas} fallaron`);
process.exit(fallas ? 1 : 0);
