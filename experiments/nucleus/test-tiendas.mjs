// Pruebas de tiendas.mjs, sin red: con respuestas reales de Gandhi y Casa del Libro del 14 de noviembre de 2026
// (recortadas en fixtures/tiendas/) y casos de título y autor que deben coincidir y que no.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  normalizar, tituloCorto, coincideTitulo, coincideAutor, clavesDeAutor, autorEnTexto, esIsbn13,
  candidatoGandhi, esFisico, elegirGandhi, tarjetasCasaDelLibro, fichaCasaDelLibro, revisarLibro,
  claveLibro, destinoComprar, TIENDAS, crearLector,
} from './tiendas.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const fx = (n) => readFileSync(join(aqui, 'fixtures', 'tiendas', n), 'utf8');
let pruebas = 0;
const prueba = (nombre, fn) => { fn(); pruebas++; };

prueba('normalizar', () => {
  assert.equal(normalizar('¿Qué tan alto quiere llegar?'), 'que tan alto quiere llegar');
  assert.equal(normalizar('Niños & Niñas'), 'ninos y ninas');
  assert.equal(normalizar(null), '');
});

prueba('título corto', () => {
  assert.equal(tituloCorto('12 reglas para vivir: Un antídoto al caos'), '12 reglas para vivir');
  assert.equal(tituloCorto('Sapiens. De animales a dioses'), 'Sapiens');
  assert.equal(tituloCorto('Mr. Mercedes'), 'Mr. Mercedes');
  assert.equal(tituloCorto('Clockwork (Revised)'), 'Clockwork');
  assert.equal(tituloCorto('Diario de Greg 1. Un renacuajo'), 'Diario de Greg 1. Un renacuajo');
  assert.equal(tituloCorto('Ética para Amador'), 'Ética para Amador');
});

prueba('títulos que sí son el mismo libro', () => {
  const si = [
    ['12 reglas para vivir: Un antídoto al caos', '12 reglas para vivir'],
    ['Clockwork: Design Your Business to Run Itself', 'Clockwork, Revised and Expanded: How to Design Your Business'],
    ['A Thousand Brains', 'A Thousand Brains: A New Theory of Intelligence'],
    ['Conciencia', 'Conciencia (Claves para una nueva forma de vivir)'],
    ['The 5 Resets Rewire Your Brain and Body', 'The 5 Resets: Rewire Your Brain and Body for Less Stress'],
    ['Mastery', 'Mastery'],
    ['El Club de las 5 de la mañana', 'El club de las 5 de la mañana'],
    ['Diario de Greg', 'Diario de Greg 1. Un renacuajo'],
    ['Guía del autoestopista galáctico', 'Guía del autoestopista galáctico'],
    ['A New Earth', 'A New Earth: Awakening to Your Life\'s Purpose'],
    ['Percy Jackson y el último héroe del Olimpo', 'El ultimo heroe del Olimpo ( Percy Jackson y los dioses del Olimpo 5)'],
    ['Homo creativus', 'HOMO CREATIVUS 33 Pensamientos para salvar tu vida'],
    ['Diario de Greg', 'Diario de Greg 1 - Un renacuajo (Edición película)'],
    ['Lecciones de liderazgo de Steve Jobs', 'Steve Jobs. Lecciones de liderazgo'],
  ];
  for (const [a, b] of si) assert.equal(coincideTitulo(a, b), true, `${a} ≟ ${b}`);
});

prueba('títulos que no son el mismo libro', () => {
  const no = [
    ['El poder del ahora', 'Practicando el poder del ahora'],
    ['Pitch Perfect: How to Say It Right the First Time', 'Pitch the Perfect Investment, College Edition'],
    ['Networking For Introverts', 'Quiet Connections: Networking for Introverts'],
    ['12 reglas para vivir', 'Resumen y Analisis de 12 Reglas para Vivir de Jordan Peterson'],
    ['Encuentro', 'Olvidados de la casa de Dios. El encuentro'],
    ['Ok', 'Ok hablemos de trabajo'],
    ['Bluefishing: The Art of Making Things Happen', 'Summary of Steve Simss Bluefishing'],
    ['Conciencia', '3 pasos para despertar: la vía de la expansión de la conciencia'],
    ['Las reglas de oro para vivir', '12 reglas para vivir'],
    ['El principito', 'El principito para colorear'],
    ['Padre rico, padre pobre', 'Padre rico, padre pobre para jóvenes'],
    ['Ana de las tejas verdes', 'Ana de las tejas verdes 4 - Más aventuras en Avonlea'],
    ['Diario de Greg', 'Diario de Greg 2. La ley de Rodrick'],
    ['Coraline', 'Coraline. Novela gráfica'],
    ['Junie B Jones', 'Junie B. Jones y su gran bocota (Junie B. Jones. El cómic 3)'],
    ['Torres de Malory', 'Torres de Malory 2: Segundo curso'],
    ['Ansiedad', 'Ansiedad 3'],
    ['Buenas noches luna', 'BUENAS NOCHES, LUNA 123: UN LIBRO PARA CONTAR'],
    ['Los grandes iniciados 2', 'Los grandes iniciados'],
    ['Percy Jackson y el último héroe del Olimpo', 'Percy Jackson y los dioses del Olimpo 1: El ladrón del rayo'],
    ['El hombre en busca de sentido', 'Sentido'],
    ['Los secretos de la mente millonaria', 'Los secretos de la mente millonaria: cuaderno de trabajo'],
  ];
  for (const [a, b] of no) assert.equal(coincideTitulo(a, b), false, `${a} ≠ ${b}`);
});

prueba('autores', () => {
  assert.deepEqual(clavesDeAutor('Jordan B. Peterson'), ['peterson']);
  assert.deepEqual(clavesDeAutor('Moi González Y Montse Rodríguez'), ['gonzalez', 'rodriguez']);
  assert.deepEqual(clavesDeAutor('Disney Books'), ['disney']);
  assert.deepEqual(clavesDeAutor('J.K. Rowling'), ['rowling']);
  assert.deepEqual(clavesDeAutor('Autor desconocido'), []);
  assert.equal(coincideAutor('Jordan B. Peterson', ['Jordan B. Peterson']), true);
  assert.equal(coincideAutor('J.K. Rowling', ['J. K. Rowling']), true);
  assert.equal(coincideAutor('Moi González Y Montse Rodríguez', ['Montse Rodríguez']), true);
  assert.equal(coincideAutor('Osho', ['. Osho']), true);
  assert.equal(coincideAutor('Disney Books', ['Disney']), true);
  assert.equal(coincideAutor('Robin Sharma', ['Jordan B. Peterson']), false);
  assert.equal(coincideAutor('Robin Sharma', []), false);
  assert.equal(coincideAutor('Autor desconocido', ['Jordan B. Peterson']), null);
  assert.equal(autorEnTexto('Jordan B. Peterson', 'Jordan Peterson, el pensador más polémico'), true);
  assert.equal(autorEnTexto('Jordan B. Peterson', 'Un libro de Robin Sharma'), false);
});

prueba('ISBN-13 con dígito de control', () => {
  assert.equal(esIsbn13('9786070755620'), true);
  assert.equal(esIsbn13('978-0-525-53402-0'), true);
  assert.equal(esIsbn13('9786070755621'), false);
  assert.equal(esIsbn13('780b8413-7bfc-30de'), false);
});

prueba('candidatos de Gandhi', () => {
  const crudo = JSON.parse(fx('gandhi-12-reglas.json')).catalog.content;
  const cs = crudo.map(candidatoGandhi);
  assert.equal(cs.length, 4);
  assert.equal(cs[0].tipo, 'Audiolibro');
  assert.equal(esFisico(cs[0]), false);
  assert.equal(cs[1].isbn, '9786070755620');
  assert.equal(cs[1].url, 'https://www.gandhi.com.mx/12-reglas-para-vivir-9786070755620/p');
  assert.equal(cs[1].idioma, 'Español');
  assert.equal(cs[1].disponible, true);
  assert.equal(esFisico(cs[1]), true);
  assert.equal(cs[3].disponible, false);
  const elegidos = elegirGandhi({ titulo: '12 reglas para vivir: Un antídoto al caos', autor: 'Jordan B. Peterson' }, cs);
  assert.deepEqual(elegidos.map((c) => c.isbn), ['9786070755620', '9786073907453', '9788499089508']);
  assert.equal(elegirGandhi({ titulo: '12 reglas para vivir', autor: 'Robin Sharma' }, cs).length, 0);
});

prueba('tarjetas de Casa del Libro', () => {
  const t = tarjetasCasaDelLibro(fx('casadelibro-busqueda-12-reglas.html'));
  assert.deepEqual(t.map((x) => x.url), [
    'https://casadelibro.com.mx/productos/12-reglas-para-vivir/',
    'https://casadelibro.com.mx/productos/12-reglas-para-vivir1/',
  ]);
  assert.deepEqual(t.map((x) => x.nombre), ['12 reglas para vivir', '12 reglas para vivir']);
  assert.deepEqual(t.map((x) => x.sinStock), [false, false]);
  assert.equal(tarjetasCasaDelLibro(fx('casadelibro-busqueda-vacia.html')).length, 0);
});

prueba('ficha de Casa del Libro', () => {
  const f = fichaCasaDelLibro(fx('casadelibro-ficha-12-reglas.html'));
  assert.equal(f.sku, '9786070755620');
  assert.equal(f.disponible, true);
  assert.equal(f.titulo, '12 reglas para vivir');
  assert.equal(autorEnTexto('Jordan B. Peterson', f.descripcion), true);
  assert.equal(/Envíos/.test(f.descripcion), false);
});

// Red de mentiras: cada URL devuelve una respuesta guardada.
function lectorFalso(mapa) {
  const pedidas = [];
  const leer = async (url, { json = false } = {}) => {
    pedidas.push(url);
    for (const [patron, cuerpo] of mapa) {
      if (patron.test(url)) return { ok: true, status: 200, cuerpo: json ? JSON.parse(cuerpo) : cuerpo };
    }
    return { ok: true, status: 200, cuerpo: json ? { catalog: { content: [] } } : '<html></html>' };
  };
  leer.pedidas = pedidas;
  return leer;
}

async function pruebasConRed() {
  const gandhi = fx('gandhi-12-reglas.json');
  const leer = lectorFalso([
    [/api\.empathy\.co/, gandhi],
    [/casadelibro\.com\.mx\/search\/\?q=9786070755620/, fx('casadelibro-busqueda-12-reglas.html')],
    [/casadelibro\.com\.mx\/productos\/12-reglas-para-vivir\/$/, fx('casadelibro-ficha-12-reglas.html')],
  ]);
  const r = await revisarLibro({ titulo: '12 reglas para vivir: Un antídoto al caos', autor: 'Jordan B. Peterson' }, leer, { hoy: '2026-11-14' });
  assert.equal(r.tienda, 'casadelibro');
  assert.equal(r.url, 'https://casadelibro.com.mx/productos/12-reglas-para-vivir/');
  assert.equal(r.isbn, '9786070755620');
  assert.equal(r.idioma, 'Español');
  assert.equal(r.gandhi.url, 'https://www.gandhi.com.mx/12-reglas-para-vivir-9786070755620/p');
  pruebas++;

  // Casa del Libro no lo tiene: Gandhi.
  const leer2 = lectorFalso([[/api\.empathy\.co/, gandhi]]);
  const r2 = await revisarLibro({ titulo: '12 reglas para vivir', autor: 'Jordan B. Peterson' }, leer2, { hoy: '2026-11-14' });
  assert.equal(r2.tienda, 'gandhi');
  assert.equal(r2.url, 'https://www.gandhi.com.mx/12-reglas-para-vivir-9786070755620/p');
  pruebas++;

  // Otro autor: ninguna, y «Comprar» cae a la búsqueda de Gandhi por título.
  const r3 = await revisarLibro({ titulo: '12 reglas para vivir', autor: 'Robin Sharma' }, lectorFalso([[/api\.empathy\.co/, gandhi]]), { hoy: '2026-11-14' });
  assert.equal(r3.tienda, 'ninguna');
  assert.equal(r3.motivo, 'sin_coincidencia');
  assert.deepEqual(destinoComprar(r3, { titulo: '12 reglas para vivir' }),
    { tienda: 'gandhi_busqueda', url: 'https://www.gandhi.com.mx/?query=12%20reglas%20para%20vivir' });
  pruebas++;

  // Autor desconocido: no se busca.
  const leer4 = lectorFalso([]);
  const r4 = await revisarLibro({ titulo: 'Algo', autor: 'Autor desconocido' }, leer4);
  assert.equal(r4.motivo, 'autor_desconocido');
  assert.equal(leer4.pedidas.length, 0);
  pruebas++;
}

prueba('clave del horno y búsquedas', () => {
  assert.equal(claveLibro(' 12 Reglas para vivir ', 'Jordan B. Peterson'), '12 reglas para vivir__jordan b. peterson');
  assert.equal(TIENDAS.casadelibro.busqueda('caos'), 'https://casadelibro.com.mx/search/?q=caos');
  assert.equal(TIENDAS.gandhi.busqueda('el caos'), 'https://www.gandhi.com.mx/?query=el%20caos');
});

await pruebasConRed();

// El lector: un rechazo (403) es una falla sin reintentos; una página que no existe (404) es «no hay nada ahí».
{
  let llamadas = 0;
  const responde = (status) => async () => { llamadas++; return { ok: status < 400, status, json: async () => ({}), text: async () => '' }; };
  llamadas = 0;
  const l403 = crearLector({ intervaloMs: 0, fetchImpl: responde(403) });
  await assert.rejects(l403('https://casadelibro.com.mx/search/?q=x'), /HTTP 403/);
  assert.equal(llamadas, 1, 'un 403 no se reintenta');
  llamadas = 0;
  const l404 = crearLector({ intervaloMs: 0, fetchImpl: responde(404) });
  assert.deepEqual(await l404('https://casadelibro.com.mx/productos/no-existe/'), { ok: false, status: 404, cuerpo: '' });
  assert.equal(llamadas, 1);
  pruebas++;
}

// /tiendas.js (la regla de la app, las ediciones y /ir/): llaves raras y caracteres partidos no la rompen.
{
  const vm = await import('node:vm');
  const ctx = { window: {}, navigator: { language: 'es-MX' }, Intl };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(join(aqui, '..', '..', 'public', 'tiendas.js'), 'utf8'), ctx);
  const T = ctx.window.TrigguiTiendas;
  for (const tienda of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    const r = T.comprar({ titulo: 'Esencialismo', tienda_compra: { tienda, url: 'https://www.gandhi.com.mx/a' } }, 'es', true);
    assert.equal(r.url, 'https://www.gandhi.com.mx/?query=Esencialismo', tienda);
  }
  assert.equal(T.comprar({ titulo: 'a\ud800b' }, 'es', true).url, 'https://www.gandhi.com.mx/?query=a%EF%BF%BDb');
  assert.equal(T.comprar({ titulo: 'x', tienda_compra: { tienda: 'casadelibro', url: 'https://casadelibro.com.mx.evil.example/p' } }, 'es', true).tienda, 'gandhi');
  assert.equal(T.tituloCorto(' (Edición) Libro'), '(Edición) Libro');
  assert.equal(T.tituloCorto('Título  - Sub'), 'Título');
  pruebas++;
}

console.log(`✓ tiendas: ${pruebas} pruebas en verde`);
