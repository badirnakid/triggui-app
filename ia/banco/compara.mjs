#!/usr/bin/env node
/*
 * Comparación final del banco de C278: junta los resúmenes de cada corrida (banco-<libro>-<proveedor>.json) y pone
 * lado a lado, por libro, lo que costó y lo que escribió cada proveedor. Lo imprime, lo suma al resumen del run y lo
 * deja en banco-comparacion.md.
 *
 *   node ia/banco/compara.mjs --dir=<carpeta con los banco-*.json>
 */
import fs from 'node:fs';
import path from 'node:path';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const DIR = arg('dir', '.');
const archivos = [];
(function busca(d) { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const r = path.join(d, f.name); if (f.isDirectory()) busca(r); else if (/^banco-.+\.json$/.test(f.name)) archivos.push(r); } })(DIR);
const corridas = archivos.map((f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } }).filter((x) => x && x.id && x.total);

const usd = (x) => (x == null ? 'no consta' : x.toFixed(4) + ' USD');
const ids = [...new Set(corridas.map((c) => c.id))];
const prov = ['openai', 'claude'];
const de = (id, p) => corridas.find((c) => c.id === id && c.proveedor === p) || null;
const out = [];
const w = (s = '') => out.push(s);

w('# Banco C278: OpenAI contra Claude, libro por libro');
w('');
w('| Libro | Proveedor | Llamadas | Costo | Entrada (con caché) | Salida | Tiempo en el modelo | Problemas |');
w('|---|---|---|---|---|---|---|---|');
const suma = { openai: { costo: 0, n: 0 }, claude: { costo: 0, n: 0 } };
for (const id of ids) {
  for (const p of prov) {
    const c = de(id, p);
    if (!c) { w(`| ${id} | ${p} | no corrió | | | | | |`); continue; }
    const t = c.total, pr = c.problemas;
    suma[p].costo += t.costo; suma[p].n++;
    const probs = [pr.errores.length && `${pr.errores.length} errores`, pr.cortes && `${pr.cortes} cortes`, pr.rechazos && `${pr.rechazos} rechazos`, pr.json_fallidos && `${pr.json_fallidos} JSON`, c.rechazado && 'apartado por audiencia', !c.libro && 'sin edición'].filter(Boolean).join(', ') || 'ninguno';
    w(`| ${c.libro ? c.libro.titulo : id} | ${p} | ${t.llamadas} | ${usd(t.costo)} | ${(t.entrada + t.cache_lectura + t.cache_escritura).toLocaleString('es-MX')} | ${t.salida.toLocaleString('es-MX')} | ${(t.ms / 1000).toFixed(0)} s | ${probs} |`);
  }
}
w('');
for (const p of prov) if (suma[p].n) w(`- **${p}**: ${usd(suma[p].costo / suma[p].n)} por edición en promedio (${suma[p].n} ediciones).`);
w('');
for (const id of ids) {
  const a = de(id, 'openai'), b = de(id, 'claude');
  const L = (a && a.edicion) || (b && b.edicion);
  w(`## ${L ? `${L.titulo} — ${L.autor}` : id}`);
  for (const [p, c] of [['OpenAI', a], ['Claude', b]]) {
    w('');
    w(`**${p}**`);
    const e = c && c.edicion;
    if (!e) { w('- sin edición'); continue; }
    const t = e.tarjeta || {}, nu = e._nucleus || {};
    w(`- Tagline: ${e.tagline || ''}`);
    w(`- Tarjeta: «${t.titulo || ''}». ${t.parrafoTop || ''} / ${t.parrafoBot || ''}`);
    for (const x of nu.edition_blocks_es || []) w(`- [${x.rol_sinfonico || '?'}] ${x.phrase || ''}`);
    const m = ((e._musica && e._musica.candidatos) || [])[0];
    if (m) w(`- Música: ${m.cancion} — ${m.artista} (armonía ${m.armonia ?? '?'})`);
    const v = ((e._video && e._video.candidatos) || [])[0];
    if (v) w(`- Video: ${v.titulo} — ${v.canal} (armonía ${v.armonia ?? '?'})`);
  }
  w('');
}
const md = out.join('\n');
console.log(md);
fs.writeFileSync('banco-comparacion.md', md + '\n');
if (process.env.GITHUB_STEP_SUMMARY) { try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n'); } catch { /* sin resumen */ } }
