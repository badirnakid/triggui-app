#!/usr/bin/env node
// 🛒 tiendas-horno.mjs — la marca de tiendas dentro del horno (14 de noviembre de 2026, B417).
//
//   node tiendas-horno.mjs filtrar --csv <base.csv> --salida <base-disponibles.csv> --tiendas <tiendas.json> [--vencidos 40] [--nuevos 80]
//       Copia de la base con solo los libros que se consiguen (Casa del Libro o Gandhi). La base original no se
//       toca, y la copia nunca se escribe encima de ella (si --salida es un enlace, se quita el enlace primero).
//       Así el batch («🎲») y «💭 Triggui elige de catálogo» solo eligen libros que se pueden comprar.
//
//   node tiendas-horno.mjs revisar (--libro "Título | Autor" | --libro-json /tmp/triggui-book.json) --tiendas <tiendas.json> [--forzar [--por <quién>]]
//       Para «📘»: revisa el libro (de nuevo si su revisión tiene 25 días o más) y sale con 0 si se consigue. Si no,
//       sale con 3 y dice por qué, salvo --forzar (la casilla «forzar_sin_tienda» del flujo).
//
//   node tiendas-horno.mjs marcar --contenido <contenido.json> [--contenido <otro.json>] --tiendas <tiendas.json> [--vencidos 0]
//       Escribe en cada libro el campo nuevo «tienda_compra» ({tienda, url, isbn, revisado}) con la marca de
//       tiendas.json. Solo agrega o actualiza ese campo: no renombra ni cambia la forma de nada (las
//       instalaciones viejas de Android solo admiten campos nuevos).
//
// Frescura sin tareas programadas: los libros que no están en tiendas.json (los nuevos) se revisan al filtrar hasta
// --nuevos por corrida (80; los que pasen esperan a la siguiente y no se eligen mientras), y siempre al marcar y al
// revisar. De los que tienen 25 días o más se revisan, por corrida, solo los --vencidos más viejos (40 al filtrar,
// 0 al marcar), para que una corrida del horno nunca se alargue. La revisión completa la hace a mano tiendas.yml.
// Una falla de red nunca borra una marca buena: se conserva la anterior y se reintenta en la siguiente corrida.
// Si al revisar de nuevo más de la mitad de los que se conseguían (de 10 o más) dejan de conseguirse, lo más
// probable es que una tienda cambió su página: no se guarda ese cambio y se avisa.
import { readFileSync, writeFileSync, renameSync, existsSync, realpathSync, lstatSync, unlinkSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parse } from 'csv-parse/sync';
import { revisarLibro, crearLector, claveLibro, esIsbn13, VERSION_TIENDAS } from './tiendas.mjs';

const DIAS_VIGENCIA = 25;
const SE_CONSIGUE = new Set(['casadelibro', 'gandhi']);
const isLink = (ruta) => { try { return lstatSync(ruta).isSymbolicLink(); } catch { return false; } };

function argumentos(argv) {
  const a = { _: argv[2], contenido: [], vencidos: null };
  for (let i = 3; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--forzar') { a.forzar = true; continue; }
    const v = argv[++i];
    if (k === '--contenido') a.contenido.push(v);
    else if (k === '--vencidos') a.vencidos = Math.max(0, Math.floor(Number(v)));
    else if (k === '--nuevos') a.nuevos = Math.max(0, Math.floor(Number(v)));
    else if (k === '--libro-json') a.libroJson = v;
    else if (k.startsWith('--')) a[k.slice(2)] = v;
    else throw new Error(`Argumento desconocido: ${k}`);
  }
  return a;
}

function hoy() { return new Date().toISOString().slice(0, 10); }

function leerTiendas(ruta) {
  if (ruta && existsSync(ruta)) {
    const d = JSON.parse(readFileSync(ruta, 'utf8'));
    if (d && typeof d.libros === 'object' && d.libros) return d;
  }
  return { version: VERSION_TIENDAS, libros: {} };
}

function escribirJson(ruta, objeto, indent = 1) {
  const tmp = `${ruta}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(objeto, null, indent)}\n`, 'utf8');
  renameSync(tmp, ruta);
}

function guardarTiendas(ruta, d) {
  const libros = Object.fromEntries(Object.keys(d.libros).sort().map((k) => [k, d.libros[k]]));
  const resumen = {};
  const motivos = {};
  for (const r of Object.values(libros)) {
    resumen[r.tienda] = (resumen[r.tienda] || 0) + 1;
    if (r.motivo) motivos[r.motivo] = (motivos[r.motivo] || 0) + 1;
  }
  escribirJson(ruta, { ...d, version: VERSION_TIENDAS, generado: new Date().toISOString(), resumen: { ...resumen, motivos }, libros });
}

const edadDias = (r) => (Date.parse(hoy()) - Date.parse(r.revisado)) / 86400000;
const falta = (r) => !r || !r.revisado || r.motivo === 'error_red';
const vencido = (r) => !falta(r) && !(edadDias(r) < DIAS_VIGENCIA);

// Revisa hasta `nuevos` de los libros que faltan y hasta `vencidos` de los vencidos (los más viejos primero).
async function asegurar(d, libros, leer, etiqueta, vencidos = 0, nuevos = Infinity) {
  const unicos = [...new Map(libros.filter((l) => l.titulo).map((l) => [claveLibro(l.titulo, l.autor), l])).entries()];
  const todosLosQueFaltan = unicos.filter(([k]) => falta(d.libros[k]));
  const faltan = todosLosQueFaltan.slice(0, nuevos);
  if (todosLosQueFaltan.length > faltan.length) {
    console.log(`::warning::🛒 ${todosLosQueFaltan.length - faltan.length} libro(s) de ${etiqueta} todavía no tienen revisión de tiendas: en esta corrida no se pueden elegir; entran en las siguientes (o con el flujo «🛒 Tiendas»).`);
  }
  const viejos = unicos.filter(([k]) => vencido(d.libros[k]))
    .sort(([a], [b]) => String(d.libros[a].revisado).localeCompare(String(d.libros[b].revisado)));
  const tope = Math.min(viejos.length, vencidos);
  if (faltan.length || viejos.length) {
    console.log(`🛒 ${etiqueta}: reviso ${faltan.length} libro(s) nuevos y ${tope} de ${viejos.length} con ${DIAS_VIGENCIA} días o más`);
  }
  if (viejos.length > tope) {
    console.log(`::notice::🛒 ${viejos.length - tope} libro(s) de ${etiqueta} tienen su revisión de tiendas vencida y se usan así en esta corrida; la revisión completa es el flujo «🛒 Tiendas» (tiendas.yml).`);
  }
  const antes = {};
  for (const [clave, l] of [...faltan, ...viejos.slice(0, tope)]) {
    const previo = d.libros[clave];
    antes[clave] = previo;
    try {
      d.libros[clave] = { ...(await revisarLibro(l, leer, { hoy: hoy() })), fuentes: [...new Set([...(previo?.fuentes || []), etiqueta])] };
    } catch (e) {
      const error = String(e.message || e).slice(0, 200);
      d.libros[clave] = previo && !falta(previo)
        ? { ...previo, ultimo_error: error }   // la marca buena se queda; se reintenta en la siguiente corrida
        : {
          titulo: l.titulo, autor: l.autor, tienda: 'ninguna', url: null, isbn: null, idioma: null, casadelibro: null,
          gandhi: null, motivo: 'error_red', error, revisado: hoy(), fuentes: [...new Set([...(previo?.fuentes || []), etiqueta])],
        };
    }
  }
  // ¿Una tienda cambió su página? Si de 10 o más que se conseguían, más de la mitad dejó de conseguirse, no se guarda.
  const seConsiguia = Object.keys(antes).filter((k) => antes[k] && SE_CONSIGUE.has(antes[k].tienda));
  const yaNo = seConsiguia.filter((k) => !SE_CONSIGUE.has(d.libros[k].tienda));
  if (seConsiguia.length >= 10 && yaNo.length * 2 > seConsiguia.length) {
    for (const k of yaNo) d.libros[k] = antes[k];
    console.log(`::warning::🛒 ${yaNo.length} de ${seConsiguia.length} libros que se conseguían dejaron de conseguirse en una sola corrida: lo más probable es que Casa del Libro o Gandhi cambiaron su página. Se conservan las marcas anteriores; hay que revisar experiments/nucleus/tiendas.mjs.`);
  }
}

async function filtrar(a) {
  if (!a.csv || !a.salida || !a.tiendas) throw new Error('filtrar pide --csv, --salida y --tiendas');
  const texto = readFileSync(a.csv, 'utf8');
  const filas = parse(texto, { columns: true, skip_empty_lines: true, bom: true });
  const libros = filas.map((f) => ({ titulo: String(f.titulo || f.Titulo || f.title || '').trim(), autor: String(f.autor || f.Autor || f.author || '').trim() }));
  const d = leerTiendas(a.tiendas);
  await asegurar(d, libros, a.leer || crearLector({ intervaloMs: 1000 }), a.csv.split('/').pop(), a.vencidos ?? 40, a.nuevos ?? 80);
  guardarTiendas(a.tiendas, d);
  // Mismas columnas y mismo orden; solo las filas que se consiguen. Se escribe con comillas según RFC 4180,
  // y lo vuelve a leer el mismo csv-parse del horno.
  const columnas = parse(texto, { to_line: 1, bom: true })[0];
  if (new Set(columnas).size !== columnas.length) throw new Error(`${a.csv} trae columnas repetidas: no se puede copiar sin perder datos`);
  const celda = (v) => {
    const s = String(v ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const conservar = [];
  let fuera = 0;
  filas.forEach((f, i) => {
    const r = d.libros[claveLibro(libros[i].titulo, libros[i].autor)];
    if (libros[i].titulo && r && SE_CONSIGUE.has(r.tienda)) conservar.push(columnas.map((c) => celda(f[c])).join(','));
    else fuera++;
  });
  if (!conservar.length) throw new Error(`Ningún libro de ${a.csv} se consigue: no se escribe una base vacía`);
  // La salida suele ser el enlace que el flujo hizo a la base original: escribir a través de él la cambiaría.
  // Se quita el enlace y se escribe un archivo propio; si la salida es la misma base, se detiene.
  if (realpathSync(a.csv) === (existsSync(a.salida) ? realpathSync(a.salida) : null) && !lstatSync(a.salida).isSymbolicLink()) {
    throw new Error(`--salida es la misma base que --csv (${a.csv}): la base original no se toca`);
  }
  if (existsSync(a.salida) || isLink(a.salida)) unlinkSync(a.salida);
  writeFileSync(a.salida, `${columnas.map(celda).join(',')}\n${conservar.join('\n')}\n`, 'utf8');
  console.log(`🛒 ${a.csv.split('/').pop()}: ${conservar.length} se consiguen y quedan; ${fuera} no se consiguen y se quedan fuera de esta corrida (la base original no cambia)`);
}

function partirLibro(s) {
  const [titulo, ...resto] = String(s || '').split('|');
  return { titulo: titulo.trim(), autor: resto.join('|').trim() };
}

async function revisar(a) {
  if (!(a.libro || a.libroJson) || !a.tiendas) throw new Error('revisar pide --libro "Título | Autor" o --libro-json, y --tiendas');
  let libro;
  if (a.libroJson) {
    // El libro que dejó validate-book.js (/tmp/triggui-book.json): el que de verdad se va a generar.
    const b = JSON.parse(readFileSync(a.libroJson, 'utf8'));
    libro = { titulo: String(b.titulo || '').trim(), autor: String(b.autor || '').trim() };
  } else {
    libro = partirLibro(a.libro);
  }
  if (!libro.titulo) throw new Error('el libro no trae título');
  const d = leerTiendas(a.tiendas);
  await asegurar(d, [libro], a.leer || crearLector({ intervaloMs: 1000 }), 'detonacion', 1);
  guardarTiendas(a.tiendas, d);
  const r = d.libros[claveLibro(libro.titulo, libro.autor)];
  const nombre = { casadelibro: 'Casa del Libro', gandhi: 'Gandhi' }[r.tienda];
  if (nombre) {
    console.log(`🛒 Se consigue en ${nombre}: ${r.url}`);
    return 0;
  }
  const porQue = {
    autor_desconocido: 'falta el autor: escribe «Título | Autor»',
    agotado: 'está en el catálogo, pero agotado en las dos tiendas',
    sin_coincidencia: 'no está como libro físico ni en Casa del Libro ni en Gandhi',
    error_red: 'no se pudo leer alguna de las tiendas',
  }[r.motivo] || r.motivo;
  if (a.forzar) {
    const por = a.por && a.por !== 'forzar_sin_tienda' ? a.por : '«forzar_sin_tienda»';
    console.log(`::warning::🛒 «${libro.titulo}» no se consigue (${porQue}), pero sigue por ${por}: «Comprar» llevará a la búsqueda de Gandhi.`);
    return 0;
  }
  console.log(`::error::«${libro.titulo}» no se consigue (${porQue}). No se genera nada. Para generarlo de todos modos, activa «forzar_sin_tienda».`);
  return 3;
}

async function marcar(a) {
  if (!a.contenido.length || !a.tiendas) throw new Error('marcar pide al menos un --contenido y --tiendas');
  const d = leerTiendas(a.tiendas);
  const leer = a.leer || crearLector({ intervaloMs: 1000 });
  for (const ruta of a.contenido) {
    if (!existsSync(ruta)) { console.log(`ℹ️  ${ruta} no existe: nada que marcar`); continue; }
    const json = JSON.parse(readFileSync(ruta, 'utf8'));
    const libros = Array.isArray(json) ? json : json.libros;
    if (!Array.isArray(libros)) throw new Error(`${ruta} no trae una lista de libros`);
    await asegurar(d, libros.map((b) => ({
      titulo: String(b.titulo || '').trim(), autor: String(b.autor || '').trim(),
      isbn: [b.verified_identity?.isbn13, b.verified_identity?.isbn].map((v) => String(v ?? '').replace(/[^0-9]/g, '')).find(esIsbn13) || null,
    })), leer, ruta.split('/').pop(), a.vencidos ?? 0);
    let cambiados = 0;
    for (const b of libros) {
      const r = d.libros[claveLibro(b.titulo, b.autor)];
      if (!r) continue;
      const nuevo = SE_CONSIGUE.has(r.tienda)
        ? { tienda: r.tienda, url: r.url, isbn: r.isbn || null, revisado: r.revisado }
        : { tienda: 'ninguna', url: null, isbn: null, revisado: r.revisado };
      if (JSON.stringify(b.tienda_compra) !== JSON.stringify(nuevo)) { b.tienda_compra = nuevo; cambiados++; }
    }
    if (cambiados) {
      // Se respeta la sangría del archivo para que el diff solo muestre los campos nuevos.
      const sangria = (readFileSync(ruta, 'utf8').match(/^\{\s*\n(\s+)"/) || [])[1] || '  ';
      escribirJson(ruta, json, sangria.length);
    }
    console.log(`🛒 ${ruta.split('/').pop()}: ${cambiados} libro(s) con su tienda_compra al día`);
  }
  guardarTiendas(a.tiendas, d);
}

export { asegurar, filtrar, revisar, marcar, leerTiendas, guardarTiendas };

// Solo corre como programa cuando se llama directo (las pruebas lo importan).
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  const a = argumentos(process.argv);
  const acciones = { filtrar, revisar, marcar };
  if (!acciones[a._]) {
    console.error('Uso: tiendas-horno.mjs filtrar|revisar|marcar …');
    process.exit(1);
  }
  acciones[a._](a).then((codigo) => { process.exitCode = typeof codigo === 'number' ? codigo : 0; })
    .catch((e) => { console.error(`❌ ${e.stack || e}`); process.exit(1); });
}
