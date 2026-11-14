#!/usr/bin/env node
// Pruebas de tiendas-horno.mjs sin red: un lector falso responde en lugar de las tiendas.
import { mkdtempSync, writeFileSync, readFileSync, symlinkSync, lstatSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { parse } from 'csv-parse/sync';
import { asegurar, filtrar, revisar, marcar } from './tiendas-horno.mjs';
import { claveLibro, VERSION_TIENDAS } from './tiendas.mjs';

const hoy = new Date().toISOString().slice(0, 10);
const VIEJO = '2026-01-01';
const marca = (titulo, autor, tienda, revisado = hoy) => ({
  titulo, autor, tienda, url: tienda === 'casadelibro' ? `https://casadelibro.com.mx/productos/${titulo.length}/` : tienda === 'gandhi' ? `https://www.gandhi.com.mx/${titulo.length}/p` : null,
  isbn: null, idioma: null, casadelibro: null, gandhi: null, motivo: tienda === 'ninguna' ? 'sin_coincidencia' : null, revisado,
});
const nadaDeRed = async () => { throw new Error('no debía pedir nada a la red'); };
const tiendasVacias = async (url, { json } = {}) => ({ ok: true, status: 200, cuerpo: json ? { catalog: { content: [] } } : '<html><body></body></html>' });
const redCaida = async () => { throw new Error('ECONNRESET'); };
const silencio = (fn) => async (...args) => {
  const log = console.log; const lineas = []; console.log = (...m) => lineas.push(m.join(' '));
  try { return { valor: await fn(...args), lineas }; } finally { console.log = log; }
};

let pruebas = 0;
async function prueba(nombre, fn) { await fn(); pruebas++; }

const dir = mkdtempSync(join(tmpdir(), 'tiendas-horno-'));
try {
  await prueba('filtrar: la copia lleva solo los que se consiguen y la base original no cambia, ni a través del enlace', async () => {
    const base = join(dir, 'libros_master.csv');
    const texto = 'titulo,autor,nota\n'
      + 'Esencialismo,Greg McKeown,"una, dos ""tres"""\n'
      + 'Libro raro,Nadie,"renglón\npartido"\n'
      + '"Hábitos atómicos",James Clear,ok\n';
    writeFileSync(base, texto, 'utf8');
    const tiendas = join(dir, 'tiendas-1.json');
    writeFileSync(tiendas, JSON.stringify({ version: VERSION_TIENDAS, libros: {
      [claveLibro('Esencialismo', 'Greg McKeown')]: marca('Esencialismo', 'Greg McKeown', 'casadelibro'),
      [claveLibro('Libro raro', 'Nadie')]: marca('Libro raro', 'Nadie', 'ninguna'),
      [claveLibro('Hábitos atómicos', 'James Clear')]: marca('Hábitos atómicos', 'James Clear', 'gandhi'),
    } }));
    const salida = join(dir, 'enlace.csv');
    symlinkSync(base, salida);
    await silencio(filtrar)({ csv: base, salida, tiendas, leer: nadaDeRed });
    assert.equal(readFileSync(base, 'utf8'), texto, 'la base original cambió');
    assert.equal(lstatSync(salida).isSymbolicLink(), false, 'la salida sigue siendo enlace');
    const filas = parse(readFileSync(salida, 'utf8'), { columns: true });
    assert.deepEqual(filas, [
      { titulo: 'Esencialismo', autor: 'Greg McKeown', nota: 'una, dos "tres"' },
      { titulo: 'Hábitos atómicos', autor: 'James Clear', nota: 'ok' },
    ]);
  });

  await prueba('filtrar: se niega a escribir encima de la misma base', async () => {
    const base = join(dir, 'misma.csv');
    writeFileSync(base, 'titulo,autor\nEsencialismo,Greg McKeown\n');
    const tiendas = join(dir, 'tiendas-2.json');
    writeFileSync(tiendas, JSON.stringify({ libros: { [claveLibro('Esencialismo', 'Greg McKeown')]: marca('Esencialismo', 'Greg McKeown', 'gandhi') } }));
    await assert.rejects(silencio(filtrar)({ csv: base, salida: base, tiendas, leer: nadaDeRed }), /la base original no se toca/);
  });

  await prueba('revisar: 0 si se consigue, 3 si no, 0 con forzar; lee el libro de /tmp/triggui-book.json', async () => {
    const tiendas = join(dir, 'tiendas-3.json');
    writeFileSync(tiendas, JSON.stringify({ libros: {
      [claveLibro('Esencialismo', 'Greg McKeown')]: marca('Esencialismo', 'Greg McKeown', 'casadelibro'),
      [claveLibro('Libro raro', 'Nadie')]: marca('Libro raro', 'Nadie', 'ninguna'),
    } }));
    const libroJson = join(dir, 'triggui-book.json');
    writeFileSync(libroJson, JSON.stringify({ titulo: 'Esencialismo', autor: 'Greg McKeown', otra: 1 }));
    assert.equal((await silencio(revisar)({ libroJson, tiendas, leer: nadaDeRed })).valor, 0);
    const no = await silencio(revisar)({ libro: 'Libro raro | Nadie', tiendas, leer: nadaDeRed });
    assert.equal(no.valor, 3);
    assert.ok(no.lineas.some((l) => l.startsWith('::error::')), 'falta el ::error:: del flujo');
    assert.equal((await silencio(revisar)({ libro: 'Libro raro | Nadie', tiendas, forzar: true, leer: nadaDeRed })).valor, 0);
  });

  await prueba('marcar: solo agrega tienda_compra, con la sangría del archivo', async () => {
    const contenido = join(dir, 'contenido.json');
    const original = { libros: [
      { titulo: 'Esencialismo', autor: 'Greg McKeown', palabras: ['a', 'b'], n: 1.5 },
      { titulo: 'Libro raro', autor: 'Nadie', palabras: [] },
    ] };
    const texto = `${JSON.stringify(original, null, 2)}\n`;
    writeFileSync(contenido, texto);
    const tiendas = join(dir, 'tiendas-4.json');
    writeFileSync(tiendas, JSON.stringify({ libros: {
      [claveLibro('Esencialismo', 'Greg McKeown')]: marca('Esencialismo', 'Greg McKeown', 'casadelibro'),
      [claveLibro('Libro raro', 'Nadie')]: marca('Libro raro', 'Nadie', 'ninguna'),
    } }));
    await silencio(marcar)({ contenido: [contenido], tiendas, leer: nadaDeRed });
    const nuevo = JSON.parse(readFileSync(contenido, 'utf8'));
    assert.deepEqual(nuevo.libros[0].tienda_compra, { tienda: 'casadelibro', url: 'https://casadelibro.com.mx/productos/12/', isbn: null, revisado: hoy });
    assert.deepEqual(nuevo.libros[1].tienda_compra, { tienda: 'ninguna', url: null, isbn: null, revisado: hoy });
    const sinCampo = { libros: nuevo.libros.map(({ tienda_compra, ...resto }) => resto) };
    assert.equal(`${JSON.stringify(sinCampo, null, 2)}\n`, texto, 'cambió algo más que tienda_compra');
  });

  await prueba('asegurar: una falla de red no borra una marca buena', async () => {
    const k = claveLibro('Esencialismo', 'Greg McKeown');
    const d = { libros: { [k]: marca('Esencialismo', 'Greg McKeown', 'casadelibro', VIEJO) } };
    await silencio(asegurar)(d, [{ titulo: 'Esencialismo', autor: 'Greg McKeown' }], redCaida, 'prueba', 5);
    assert.equal(d.libros[k].tienda, 'casadelibro');
    assert.equal(d.libros[k].revisado, VIEJO, 'una revisión fallida no cuenta como revisión');
    assert.match(d.libros[k].ultimo_error, /ECONNRESET/);
  });

  await prueba('asegurar: un libro nuevo con la red caída queda como error_red (y se reintenta)', async () => {
    const d = { libros: {} };
    await silencio(asegurar)(d, [{ titulo: 'Nuevo', autor: 'Alguien' }], redCaida, 'prueba', 0);
    assert.equal(d.libros[claveLibro('Nuevo', 'Alguien')].motivo, 'error_red');
  });

  await prueba('asegurar: si más de la mitad de los que se conseguían deja de conseguirse, no se guarda y se avisa', async () => {
    const d = { libros: {} };
    const libros = [];
    for (let i = 0; i < 12; i++) {
      const t = `Libro ${i} de prueba`;
      d.libros[claveLibro(t, 'Autora Real')] = marca(t, 'Autora Real', i % 2 ? 'gandhi' : 'casadelibro', VIEJO);
      libros.push({ titulo: t, autor: 'Autora Real' });
    }
    const { lineas } = await silencio(asegurar)(d, libros, tiendasVacias, 'prueba', 40);
    assert.ok(lineas.some((l) => l.startsWith('::warning::')), 'falta el aviso');
    assert.ok(Object.values(d.libros).every((r) => r.tienda !== 'ninguna' && r.revisado === VIEJO), 'se guardaron los cambios sospechosos');
  });

  await prueba('asegurar: de los vencidos revisa solo el tope, los más viejos primero, y avisa del resto', async () => {
    const d = { libros: {} };
    const libros = [];
    ['2026-03-01', '2026-01-01', '2026-02-01', '2026-04-01', '2026-05-01'].forEach((fecha, i) => {
      const t = `Vencido ${i}`;
      d.libros[claveLibro(t, 'Autora Real')] = marca(t, 'Autora Real', 'ninguna', fecha);
      libros.push({ titulo: t, autor: 'Autora Real' });
    });
    const { lineas } = await silencio(asegurar)(d, libros, tiendasVacias, 'prueba', 2);
    const revisados = Object.values(d.libros).filter((r) => r.revisado === hoy).map((r) => r.titulo).sort();
    assert.deepEqual(revisados, ['Vencido 1', 'Vencido 2']);
    assert.ok(lineas.some((l) => l.startsWith('::notice::') && l.includes('3 libro(s)')), 'falta el aviso de los que quedan vencidos');
  });
  await prueba('asegurar: de los nuevos revisa solo el tope y avisa; los demás quedan sin marca (no se eligen)', async () => {
    const d = { libros: {} };
    const libros = [1, 2, 3].map((i) => ({ titulo: `Nuevo ${i}`, autor: 'Autora Real' }));
    let llamadas = 0;
    const contar = async (...args) => { llamadas++; return tiendasVacias(...args); };
    const { lineas } = await silencio(asegurar)(d, libros, contar, 'prueba', 0, 1);
    assert.equal(Object.keys(d.libros).length, 1);
    assert.ok(llamadas > 0);
    assert.ok(lineas.some((l) => l.startsWith('::warning::') && l.includes('2 libro(s)')));
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`✓ tiendas-horno: ${pruebas} pruebas en verde`);
