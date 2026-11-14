#!/usr/bin/env node
// 🛒 revisar-tiendas.mjs — revisa en Casa del Libro y en Gandhi cada libro de las bases y de los catálogos de
// Triggui, y escribe data/tiendas.json (14 de noviembre de 2026, B417).
//
// Uso:
//   node revisar-tiendas.mjs --salida ../../triggui-content/data/tiendas.json \
//     --contenido ../../triggui-content/contenido.json --contenido ../../triggui-content/contenido_kids.json \
//     --base ../../triggui-content/data/libros_master.csv --base ../../triggui-content/data/libros_master_kids.csv \
//     [--previo data/tiendas.json] [--dias 25] [--limite 40] [--trabajadores 3]
//
// --previo reusa lo revisado hace menos de --dias días (por omisión, 25): así una corrida cortada sigue donde
// se quedó y la revisión del mes solo vuelve a leer lo vencido. Nada se borra: un libro que ya no está en las
// bases se conserva en el archivo con su última revisión.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { revisarLibro, crearLector, claveLibro, esIsbn13, VERSION_TIENDAS } from './tiendas.mjs';

function argumentos(argv) {
  const a = { contenido: [], base: [], salida: null, previo: null, dias: 25, limite: 0, trabajadores: 3 };
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--contenido') { a.contenido.push(v); i++; }
    else if (k === '--base') { a.base.push(v); i++; }
    else if (k === '--salida') { a.salida = v; i++; }
    else if (k === '--previo') { a.previo = v; i++; }
    else if (k === '--dias') { a.dias = Number(v); i++; }
    else if (k === '--limite') { a.limite = Number(v); i++; }
    else if (k === '--trabajadores') { a.trabajadores = Math.max(1, Number(v)); i++; }
    else throw new Error(`Argumento desconocido: ${k}`);
  }
  if (!a.salida) throw new Error('Falta --salida');
  if (!a.contenido.length && !a.base.length) throw new Error('Falta al menos un --contenido o una --base');
  return a;
}

function librosDeContenido(ruta) {
  const d = JSON.parse(readFileSync(ruta, 'utf8'));
  const libros = Array.isArray(d) ? d : (d.libros || []);
  return libros.map((b) => {
    const vi = b.verified_identity || {};
    const isbn = [vi.isbn13, vi.isbn, b.isbn13, b.isbn].map((v) => String(v ?? '').replace(/[^0-9]/g, '')).find(esIsbn13) || null;
    return { titulo: String(b.titulo || '').trim(), autor: String(b.autor || '').trim(), isbn };
  });
}

function librosDeBase(ruta) {
  const filas = parse(readFileSync(ruta, 'utf8'), { columns: true, skip_empty_lines: true, bom: true, trim: false });
  return filas.map((f) => ({ titulo: String(f.titulo || '').trim(), autor: String(f.autor || '').trim(), isbn: null }));
}

function escribirAtomico(ruta, objeto) {
  const tmp = `${ruta}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(objeto, null, 1)}\n`, 'utf8');
  renameSync(tmp, ruta);
}

function ordenar(obj) {
  return Object.fromEntries(Object.keys(obj).sort().map((k) => [k, obj[k]]));
}

async function main() {
  const a = argumentos(process.argv);
  const hoy = new Date().toISOString().slice(0, 10);

  // 1) Los libros, sin repetir (misma clave que el horno), con de dónde viene cada uno.
  const porClave = new Map();
  const fuentes = {};
  const agregar = (libro, fuente) => {
    if (!libro.titulo) return;
    const clave = claveLibro(libro.titulo, libro.autor);
    const previo = porClave.get(clave);
    if (previo) {
      if (!previo.fuentes.includes(fuente)) previo.fuentes.push(fuente);
      if (!previo.isbn && libro.isbn) previo.isbn = libro.isbn;
    } else {
      porClave.set(clave, { ...libro, fuentes: [fuente] });
    }
  };
  for (const r of a.contenido) { const ls = librosDeContenido(r); fuentes[r.split('/').pop()] = ls.length; ls.forEach((l) => agregar(l, r.split('/').pop())); }
  for (const r of a.base) { const ls = librosDeBase(r); fuentes[r.split('/').pop()] = ls.length; ls.forEach((l) => agregar(l, r.split('/').pop())); }

  // 2) Lo ya revisado y vigente se reusa.
  let previo = { libros: {} };
  if (a.previo && existsSync(a.previo)) previo = JSON.parse(readFileSync(a.previo, 'utf8'));
  const resultados = { ...(previo.libros || {}) };
  const vigente = (r) => r && r.revisado && (Date.parse(hoy) - Date.parse(r.revisado)) / 86400000 < a.dias && r.motivo !== 'error_red';
  let pendientes = [...porClave.entries()].filter(([k]) => !vigente(resultados[k]));
  if (a.limite > 0) pendientes = pendientes.slice(0, a.limite);
  console.log(`📚 ${porClave.size} libros distintos (${Object.entries(fuentes).map(([f, n]) => `${f}: ${n}`).join(', ')}); por revisar: ${pendientes.length}`);

  // 3) Revisar, con una petición por segundo a cada sitio.
  const leer = crearLector({ intervaloMs: 1000 });
  // En los guardados de en medio, un libro que se conseguía y ahora no se conserva como estaba: ese cambio solo se
  // guarda al final, después de la revisión de «¿una tienda cambió su página?». Así, si la corrida se corta, no
  // quedan marcas falsas de «no se consigue».
  const SE_CONSIGUE = new Set(['casadelibro', 'gandhi']);
  const conservador = () => {
    const out = { ...resultados };
    for (const [k, r] of Object.entries(out)) {
      const p = (previo.libros || {})[k];
      if (p && SE_CONSIGUE.has(p.tienda) && !SE_CONSIGUE.has(r.tienda)) out[k] = p;
    }
    return out;
  };
  const armar = (final = false) => {
    const libros = ordenar(final ? resultados : conservador());
    const resumen = {};
    for (const r of Object.values(libros)) resumen[r.tienda] = (resumen[r.tienda] || 0) + 1;
    const motivos = {};
    for (const r of Object.values(libros)) if (r.motivo) motivos[r.motivo] = (motivos[r.motivo] || 0) + 1;
    return {
      version: VERSION_TIENDAS,
      generado: new Date().toISOString(),
      regla: 'En México, «Comprar» lleva a Casa del Libro si tiene el libro físico con existencias; si no, a Gandhi; si ninguna, a la búsqueda de Gandhi por título (Badir, 2 y 14 de noviembre de 2026, B417).',
      fuentes,
      resumen: { ...resumen, motivos },
      libros,
    };
  };
  let hechos = 0;
  let errores = 0;
  const inicio = Date.now();
  let i = 0;
  async function trabajador() {
    while (i < pendientes.length) {
      const [clave, libro] = pendientes[i++];
      const anterior = resultados[clave];
      try {
        const r = await revisarLibro(libro, leer, { hoy });
        resultados[clave] = { ...r, fuentes: libro.fuentes };
      } catch (e) {
        errores++;
        const error = String(e.message || e).slice(0, 200);
        // Una falla de red nunca borra una marca buena: se queda la anterior (con su fecha) y se reintenta después.
        resultados[clave] = anterior && anterior.revisado && anterior.motivo !== 'error_red'
          ? { ...anterior, ultimo_error: error, fuentes: libro.fuentes }
          : {
            titulo: libro.titulo, autor: libro.autor, tienda: 'ninguna', url: null, isbn: null, idioma: null,
            casadelibro: null, gandhi: null, motivo: 'error_red', error, revisado: hoy, fuentes: libro.fuentes,
          };
      }
      hechos++;
      if (hechos % 25 === 0 || hechos === pendientes.length) {
        escribirAtomico(a.salida, armar());
        const min = ((Date.now() - inicio) / 60000).toFixed(1);
        console.log(`   ${hechos}/${pendientes.length} en ${min} min · ${leer.cuenta()} peticiones · ${errores} errores`);
      }
    }
  }
  await Promise.all(Array.from({ length: a.trabajadores }, trabajador));
  // ¿Una tienda cambió su página? Si de 10 o más que se conseguían, más de la mitad dejó de conseguirse en esta
  // corrida, no se guarda ese cambio: se conservan las marcas anteriores y se avisa (hay que revisar tiendas.mjs).
  const SE = SE_CONSIGUE;
  const previos = previo.libros || {};
  const seConsiguia = pendientes.map(([k]) => k).filter((k) => previos[k] && SE.has(previos[k].tienda));
  const yaNo = seConsiguia.filter((k) => !SE.has(resultados[k].tienda));
  if (seConsiguia.length >= 10 && yaNo.length * 2 > seConsiguia.length) {
    for (const k of yaNo) resultados[k] = previos[k];
    console.log(`::warning::🛒 ${yaNo.length} de ${seConsiguia.length} libros que se conseguían dejaron de conseguirse en esta corrida: lo más probable es que Casa del Libro o Gandhi cambiaron su página. Se conservan las marcas anteriores.`);
  }
  const final = armar(true);
  escribirAtomico(a.salida, final);
  console.log(`✓ ${a.salida}: ${Object.keys(final.libros).length} libros · ${JSON.stringify(final.resumen)}`);
  if (errores) process.exitCode = 2;
}

main().catch((e) => { console.error(`❌ ${e.stack || e}`); process.exit(1); });
