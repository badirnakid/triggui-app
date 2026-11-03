#!/usr/bin/env node
/*
 * Resumen de una corrida del banco de C278 (un libro, un proveedor): la edición que salió y lo que costó, fase por
 * fase, desde el registro de uso de ia/ (TRIGGUI_IA_REGISTRO). Lo imprime en el log, lo suma al resumen del job y lo
 * deja en un JSON para la comparación final.
 *
 *   node ia/banco/resumen.mjs --proveedor=claude --id=cisne --catalogo=contenido.json --registro=banco-uso.jsonl \
 *        --salida=banco-cisne-claude.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const PROVEEDOR = arg('proveedor', process.env.TRIGGUI_IA_PROVEEDOR || '?');
const ID = arg('id', '?');
const CATALOGO = arg('catalogo', 'contenido.json');
const REGISTRO = arg('registro', process.env.TRIGGUI_IA_REGISTRO || 'banco-uso.jsonl');
const SALIDA = arg('salida', `banco-${ID}-${PROVEEDOR}.json`);
const PRECIOS = JSON.parse(fs.readFileSync(path.join(RAIZ, 'ia', 'config.json'), 'utf8')).precios_usd_por_millon;

const leeJson = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const leeTexto = (f) => { try { return fs.readFileSync(f, 'utf8').trim(); } catch { return ''; } };
const norma = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Precio de un modelo: la llave más larga con la que empieza su nombre (las respuestas traen sufijos de fecha). */
function precio(modelo) {
  const k = Object.keys(PRECIOS).filter((x) => !x.startsWith('_') && String(modelo || '').startsWith(x)).sort((a, b) => b.length - a.length)[0];
  return k ? PRECIOS[k] : null;
}
function costo(l) {
  const p = precio(l.modelo);
  if (!p) return null;
  return ((l.entrada || 0) * p.entrada + (l.cache_lectura || 0) * (p.cache_lectura ?? p.entrada)
    + (l.cache_escritura || 0) * (p.cache_escritura ?? p.entrada) + (l.salida || 0) * p.salida) / 1e6;
}

// ── El registro de uso ──────────────────────────────────────────────────────────────────────────────────────
const lineas = leeTexto(REGISTRO).split('\n').filter(Boolean).map((x) => { try { return JSON.parse(x); } catch { return null; } }).filter(Boolean);
const porOrigen = {};
const total = { llamadas: 0, entrada: 0, salida: 0, cache_lectura: 0, cache_escritura: 0, costo: 0, ms: 0, reintentos: 0, sin_precio: 0 };
const problemas = { errores: [], cortes: 0, rechazos: 0, json_fallidos: 0 };
const porModelo = {};
for (const l of lineas) {
  const o = l.origen || '(sin origen)';
  const a = (porOrigen[o] = porOrigen[o] || { llamadas: 0, entrada: 0, salida: 0, cache_lectura: 0, cache_escritura: 0, costo: 0, ms: 0 });
  const c = costo(l);
  for (const x of [a, total]) {
    x.llamadas++; x.entrada += l.entrada || 0; x.salida += l.salida || 0; x.cache_lectura += l.cache_lectura || 0;
    x.cache_escritura += l.cache_escritura || 0; x.costo += c || 0; x.ms += l.ms || 0;
  }
  total.reintentos += l.reintentos || 0;
  if (c === null) total.sin_precio++;
  porModelo[l.modelo || '?'] = (porModelo[l.modelo || '?'] || 0) + 1;
  if (l.error) problemas.errores.push(`${o}: ${l.error}`);
  if (['max_tokens', 'length'].includes(l.fin)) problemas.cortes++;
  if (['refusal', 'content_filter'].includes(l.fin)) problemas.rechazos++;
  if (l.json_ok === false) problemas.json_fallidos++;
}

// ── La edición que salió ────────────────────────────────────────────────────────────────────────────────────
const elegido = leeJson('/tmp/triggui-book.json') || {};
const slug = leeTexto('/tmp/triggui-slug.txt');
const cat = leeJson(CATALOGO);
const libros = (cat && Array.isArray(cat.libros)) ? cat.libros : [];
const esEste = (b) => b && ((slug && b._slug === slug) || (elegido.titulo && norma(b.titulo) === norma(elegido.titulo)));
const enCatalogo = libros.find((b) => b && slug && b._slug === slug) || libros.find(esEste) || null;
// Si el juez de audiencia lo apartó, la edición está en el archivo de rechazados: se muestra igual, marcada.
const rechazados = leeJson(CATALOGO.replace(/\.json$/, '_rejected.json'));
const rechazado = !enCatalogo && rechazados && Array.isArray(rechazados.libros) ? rechazados.libros.find(esEste) || null : null;
const libro = enCatalogo || rechazado;

const n = (x) => Math.round(x).toLocaleString('es-MX');
const usd = (x) => x.toFixed(4) + ' USD';
const out = [];
const p = (s = '') => out.push(s);
p(`══ Banco C278 · ${ID} · ${PROVEEDOR} ══`);
p(`Libro: ${libro ? `${libro.titulo} — ${libro.autor}` : (elegido.titulo ? `${elegido.titulo} — ${elegido.autor} (NO quedó en el catálogo)` : 'no consta')}`);
if (rechazado) p('⚠ El juez de audiencia lo mandó a rechazados.');
p(`Llamadas: ${total.llamadas} · por modelo ${JSON.stringify(porModelo)} · reintentos ${total.reintentos}`);
p(`Tokens: entrada ${n(total.entrada)} · caché leída ${n(total.cache_lectura)} · caché escrita ${n(total.cache_escritura)} · salida ${n(total.salida)}`);
p(`Costo de la edición: ${usd(total.costo)}${total.sin_precio ? ` (más ${total.sin_precio} llamadas sin precio)` : ''} · tiempo en el modelo ${(total.ms / 1000).toFixed(1)} s`);
p(`Problemas: ${problemas.errores.length} errores · ${problemas.cortes} cortes por tope · ${problemas.rechazos} rechazos · ${problemas.json_fallidos} JSON fallidos`);
for (const e of problemas.errores.slice(0, 12)) p(`   ✘ ${e}`);
p('');
p('Por fase (archivo:función):');
for (const [o, a] of Object.entries(porOrigen).sort((x, y) => y[1].costo - x[1].costo)) {
  p(`   ${o.padEnd(46)} ${String(a.llamadas).padStart(3)} llamadas · ${n(a.entrada + a.cache_lectura + a.cache_escritura).padStart(8)} entrada · ${n(a.salida).padStart(7)} salida · ${usd(a.costo)}`);
}
if (libro) {
  const nu = libro._nucleus || {};
  const t = libro.tarjeta || {};
  p('');
  p('La edición:');
  p(`   Tagline: ${libro.tagline || ''}`);
  p(`   Tarjeta: «${t.titulo || ''}» · ${t.subtitulo || ''}`);
  p(`     arriba: ${t.parrafoTop || ''}`);
  p(`     abajo:  ${t.parrafoBot || ''}`);
  for (const b of nu.edition_blocks_es || []) p(`   [${b.rol_sinfonico || '?'}] ${b.phrase || ''}`);
  for (const f of (libro.frases || []).slice(0, 6)) p(`   · ${f}`);
  const en = nu.card_en || {};
  p(`   EN: «${en.titulo || ''}» · ${en.parrafoTop || ''}`);
  const mus = (libro._musica && libro._musica.candidatos) || [];
  p(`   Música (${(libro._musica && libro._musica.juez) || 'no consta'}): ${mus.length} piezas`);
  for (const m of mus.slice(0, 5)) p(`     ♪ ${m.cancion} — ${m.artista} · armonía ${m.armonia ?? '?'} · ${m.rol || ''} · ${m.pie || ''}`);
  const vid = (libro._video && libro._video.candidatos) || [];
  p(`   Videos (${(libro._video && libro._video.juez) || 'no consta'}): ${vid.length}`);
  for (const v of vid.slice(0, 5)) p(`     ▶ ${v.titulo} — ${v.canal} · armonía ${v.armonia ?? '?'} · ${v.pie || ''}`);
  const cs = libro._csal || {};
  p(`   CSAL: ${(cs.trigger_situations || []).length} situaciones · ${(cs.concept_tags || []).length} conceptos · ${(cs.anti_patterns || []).length} antipatrones`);
  const w = libro._quality_warning || (libro._metrics && libro._metrics.warnings);
  if (w) p(`   Avisos de calidad: ${JSON.stringify(w).slice(0, 400)}`);
}
const texto = out.join('\n');
console.log(texto);
if (process.env.GITHUB_STEP_SUMMARY) { try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + texto + '\n```\n'); } catch { /* sin resumen */ } }
fs.writeFileSync(SALIDA, JSON.stringify({ id: ID, proveedor: PROVEEDOR, libro: libro ? { titulo: libro.titulo, autor: libro.autor, slug: libro._slug } : null,
  rechazado: !!rechazado, total, por_modelo: porModelo, por_origen: porOrigen, problemas, edicion: libro, registro: lineas }, null, 2));
console.log(`\n📦 ${SALIDA}`);
