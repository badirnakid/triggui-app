// 🛒 tiendas.mjs — dónde se consigue cada libro de Triggui en México (14 de noviembre de 2026)
//
// Regla de Badir (sobres del 2 y del 14 de noviembre de 2026, B417): en México, «Comprar» lleva a
// Casa del Libro si tiene el libro con existencias; si no, a Gandhi; si ninguna, a la búsqueda de
// Gandhi por título. Fuera de México lleva a Amazon; eso lo decide el navegador, no este módulo.
//
// Solo lee páginas públicas, como las lee un cliente:
//   · Gandhi: el buscador de la caja de su sitio. La caja lleva a https://www.gandhi.com.mx/?query=<texto>
//     y los resultados los da Empathy (instancia gandhinew), con autor, ISBN, tipo, idioma y existencias.
//   · Casa del Libro: https://casadelibro.com.mx/search/?q=<ISBN o título> y la ficha de cada producto
//     (LS.variants: sku = ISBN, existencias).
// Una petición por segundo a cada sitio.
//
// Precisión: un libro se da por encontrado solo si coinciden el título y el autor, es un libro físico
// (no audiolibro ni libro electrónico) y tiene existencias. Ante la duda no se da por encontrado: entonces
// «Comprar» cae a la búsqueda de Gandhi, que nunca manda a otro libro por error.

export const VERSION_TIENDAS = 1;

export const TIENDAS = {
  casadelibro: {
    nombre: 'Casa del Libro',
    dominio: 'casadelibro.com.mx',
    busqueda: (q) => `https://casadelibro.com.mx/search/?q=${encodeURIComponent(String(q || '').replace(/\s+/g, ' ').trim())}`,
  },
  gandhi: {
    nombre: 'Gandhi',
    dominio: 'www.gandhi.com.mx',
    busqueda: (q) => `https://www.gandhi.com.mx/?query=${encodeURIComponent(String(q || '').replace(/\s+/g, ' ').trim())}`,
  },
};

const UA = 'Mozilla/5.0 (compatible; TrigguiTiendas/1.0; +https://triggui.com)';
const EMPATHY = 'https://api.empathy.co/search/v1/query/gandhinew/search';

// ─────────────────────────────────────────────────────────────────────────────
// Texto
// ─────────────────────────────────────────────────────────────────────────────

/** minúsculas, sin acentos, solo letras y números separados por un espacio */
export function normalizar(s) {
  return String(s ?? '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const VACIAS = new Set([
  'el', 'la', 'los', 'las', 'lo', 'un', 'una', 'unos', 'unas', 'de', 'del', 'y', 'e', 'o', 'u', 'en', 'a', 'al',
  'por', 'para', 'con', 'the', 'an', 'of', 'and', 'or', 'in', 'on', 'to', 'for', 'with',
]);

// Palabras de edición que no cambian la obra («Clockwork, Revised and Expanded» es «Clockwork»).
const DE_EDICION = new Set([
  'revised', 'expanded', 'edition', 'edicion', 'ed', 'nueva', 'new', 'updated', 'actualizada', 'ampliada',
  'conmemorativa', 'aniversario', 'anniversary', 'deluxe', 'especial', 'special', 'bolsillo', 'pocket',
  'illustrated', 'ilustrada', 'paperback', 'hardcover', 'tapa', 'dura', 'blanda', 'version', 'spanish', 'english',
  'espanol', 'ingles', 'anos', 'years', 'th', 'rd', 'nd', 'st', 'reissue', 'reedicion',
]);

// Obras derivadas: si el candidato trae una de estas y el título de Triggui no, no es el libro.
const DERIVADAS = new Set([
  'resumen', 'summary', 'analisis', 'analysis', 'workbook', 'cuaderno', 'guia', 'guide', 'study', 'estudio',
  'companion', 'pack', 'estuche', 'box', 'set', 'coleccion', 'collection', 'trilogia', 'trilogy', 'colorear',
  'coloring', 'colouring', 'stickers', 'pegatinas', 'agenda', 'planner', 'quiz', 'ejercicios', 'exercises',
  // Adaptaciones para otro público o a otro formato: son otro libro («Padre rico, padre pobre para jóvenes»).
  'jovenes', 'joven', 'ninos', 'nino', 'ninas', 'adolescentes', 'juvenil', 'infantil', 'teens', 'teen', 'kids',
  'young', 'grafica', 'graphic', 'comic', 'manga', 'adaptacion', 'adaptation', 'abridged', 'abreviada', 'resumida',
  'calendario', 'calendar', 'tarjetas', 'cards',
]);

const ARTICULOS_INICIALES = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'the', 'a', 'an']);

/**
 * el título sin subtítulo: se corta en «:», « - », «(», «[», «|», o en un punto seguido de espacio cuando
 * la palabra antes del punto tiene 4 letras o más («Sapiens. De animales…» sí; «Mr. Mercedes» no)
 */
export function tituloCorto(t) {
  const s = String(t ?? '');
  // El separador se busca sin «\s*» delante (con él, muchos espacios seguidos volvían cuadrática la búsqueda) y
  // después el corte retrocede sobre los espacios de antes: queda exactamente donde lo dejaba «\s*(…)».
  let corte = s.search(/:|\s[-–—]\s|\(|\[|\|/);
  while (corte > 0 && /\s/.test(s[corte - 1])) corte--;
  // Una palabra de 4 letras o más seguida de «. » corta antes, si está antes del separador. Se recorre punto por
  // punto hacia atrás (lineal) en lugar de con una expresión que retrocede; letras: [A-Za-zÀ-ÿ0-9], las mismas de
  // /tiendas.js, que corre también en navegadores viejos.
  for (let i = s.indexOf('.'); i !== -1; i = s.indexOf('.', i + 1)) {
    if (!/\s/.test(s.charAt(i + 1))) continue;
    let j = i;
    while (j > 0 && esLetraCorta(s.charAt(j - 1))) j--;
    if (i - j >= 4 && (corte < 0 || i < corte)) { corte = i; break; }
  }
  return (corte > 0 ? s.slice(0, corte) : s).trim();
}

function esLetraCorta(c) {
  return (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || (c >= '\u00C0' && c <= '\u00FF');
}

function palabras(s) {
  return normalizar(s).split(' ').filter(Boolean);
}

/** palabras significativas: sin vacías ni palabras de edición; si no queda ninguna, todas */
export function significativas(s, { conEdicion = false } = {}) {
  const todas = palabras(s);
  const sig = todas.filter((w) => !VACIAS.has(w) && (conEdicion || !DE_EDICION.has(w)));
  if (sig.length) return sig;
  const sinVacias = todas.filter((w) => !VACIAS.has(w));
  return sinVacias.length ? sinVacias : todas;
}

function sinArticuloInicial(ws) {
  let i = 0;
  while (i < ws.length - 1 && ARTICULOS_INICIALES.has(ws[i])) i++;
  return ws.slice(i);
}

function empiezaCon(x, y) {
  return y.length > 0 && x.length >= y.length && y.every((w, i) => x[i] === w);
}

/**
 * ¿El nombre de un producto es el mismo libro que el título de Triggui?
 * Se comparan las palabras significativas, en orden, del título corto de los dos.
 */
export function coincideTitulo(tituloTriggui, nombreCandidato) {
  // Significativas (para igualdad y para contar lo que sobra) y palabras completas, en orden (para los prefijos:
  // «Pitch the Perfect Investment» no empieza con «Pitch Perfect» aunque sin «the» lo pareciera).
  const As = sinArticuloInicial(significativas(tituloCorto(tituloTriggui)));
  const Bs = sinArticuloInicial(significativas(tituloCorto(nombreCandidato)));
  const Aw = sinArticuloInicial(palabras(tituloCorto(tituloTriggui)));
  const Bw = sinArticuloInicial(palabras(tituloCorto(nombreCandidato)));
  const Afw = sinArticuloInicial(palabras(tituloTriggui));
  const Bfw = sinArticuloInicial(palabras(nombreCandidato));
  if (!As.length || !Bs.length) return false;

  const enTriggui = new Set(palabras(tituloTriggui));
  for (const w of palabras(nombreCandidato)) {
    if (DERIVADAS.has(w) && !enTriggui.has(w)) return false;
  }

  if (As.join(' ') === Bs.join(' ')) return true;
  // Otro tomo: si un título corto es el otro más un solo número, es otro libro de la serie («Ana de las tejas verdes
  // 4», «Torres de Malory 2: Segundo curso»). El 1 sí es el mismo («Diario de Greg 1 - Un renacuajo»). Un número
  // seguido de más palabras es parte del título («Homo creativus 33 pensamientos…»), no un tomo.
  // «Diario de Greg 2. La ley de Rodrick»: un número con punto también cierra el tomo (el título corto no corta ahí
  // porque el punto va después de menos de 4 letras).
  const otroTomo = (resto) => resto.length === 1 && /^\d+$/.test(resto[0]) && resto[0].replace(/^0+/, '') !== '1';
  const hastaElTomo = (t) => { const m = String(t).slice(0, 200).match(/^(.*?\d+)\.\s/); return m ? m[1] : t; };
  const AwT = sinArticuloInicial(palabras(hastaElTomo(tituloCorto(tituloTriggui))));
  const BwT = sinArticuloInicial(palabras(hastaElTomo(tituloCorto(nombreCandidato))));
  if ((empiezaCon(BwT, Aw) && otroTomo(BwT.slice(Aw.length))) || (empiezaCon(AwT, Bw) && otroTomo(AwT.slice(Bw.length)))) return false;
  // El candidato es la misma obra con algo al final que no se cortó; si el título es de una sola palabra,
  // solo se acepta una palabra significativa de más («Ok» no es «Ok hablemos de trabajo»).
  if (empiezaCon(Bw, Aw)) {
    const sobran = Bs.filter((w) => !As.includes(w));
    if (As.length >= 2 || sobran.length <= 1) return true;
  }
  // El título de Triggui trae el subtítulo sin separador.
  if (empiezaCon(Afw, Bw) && Bs.length >= 2) return true;
  // El candidato trae el subtítulo sin separador.
  if (empiezaCon(Bfw, Aw) && As.length >= 2) return true;
  // La serie va en otro lugar: «Percy Jackson y el último héroe del Olimpo» es «El último héroe del Olimpo
  // (Percy Jackson y los dioses del Olimpo 5)». Se acepta solo si cada palabra significativa del título de Triggui
  // está en el nombre completo del candidato y cada una del título corto del candidato está en el de Triggui
  // (así «Padre rico, padre pobre para jóvenes» no pasa por «Padre rico, padre pobre»), con tres o más en el de
  // Triggui y dos o más en el del candidato. El autor se confirma aparte, como en las demás reglas.
  if (As.length >= 3 && Bs.length >= 2) {
    const enCandidato = new Set(significativas(nombreCandidato));
    const enTitulo = new Set(significativas(tituloTriggui));
    if (As.every((w) => enCandidato.has(w)) && Bs.every((w) => enTitulo.has(w))) return true;
  }
  return false;
}

const AUTORES_GENERICOS = new Set([
  'books', 'book', 'editorial', 'ediciones', 'edicion', 'press', 'publishing', 'publishers', 'kids', 'studio',
  'studios', 'inc', 'team', 'varios', 'autores', 'anonimo', 'anonymous', 'dr', 'md', 'phd', 'jr', 'sr', 'ph',
]);

const AUTOR_DESCONOCIDO = /^(|autor desconocido|desconocido|anonimo|anonymous|varios|varios autores|unknown)$/;

/** el apellido (la palabra que distingue) de cada autor de Triggui */
export function clavesDeAutor(autor) {
  const n = normalizar(autor);
  if (AUTOR_DESCONOCIDO.test(n)) return [];
  const nombres = n.split(/\s+(?:y|and|e)\s+|\s*,\s*/).map((x) => x.trim()).filter(Boolean);
  const claves = [];
  for (const nombre of nombres) {
    const ws = nombre.split(' ').filter((w) => w && !AUTORES_GENERICOS.has(w));
    if (!ws.length) continue;
    const largas = ws.filter((w) => w.length >= 3);
    claves.push(largas.length ? largas[largas.length - 1] : ws.reduce((a, b) => (b.length > a.length ? b : a)));
  }
  return [...new Set(claves)];
}

/** ¿a y b difieren en a lo más una letra (una de más, una de menos o una cambiada)? */
function unaLetra(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}

/**
 * true si coincide; false si no; null si el autor de Triggui no se conoce.
 * Un apellido de 6 letras o más se acepta con una letra de diferencia: las tiendas traen erratas («Jürgen Klari»
 * por Klaric). El título ya tiene que coincidir aparte, así que el riesgo de confundir dos libros es mínimo.
 */
export function coincideAutor(autorTriggui, autoresCandidato) {
  const claves = clavesDeAutor(autorTriggui);
  if (!claves.length) return null;
  const lista = Array.isArray(autoresCandidato) ? autoresCandidato : [autoresCandidato];
  const delCandidato = new Set(lista.flatMap((a) => palabras(a)));
  if (!delCandidato.size) return false;
  return claves.some((c) => delCandidato.has(c) || (c.length >= 6 && [...delCandidato].some((w) => w.length >= 5 && unaLetra(c, w))));
}

/** ¿aparece el apellido de algún autor de Triggui como palabra entera dentro de un texto? */
export function autorEnTexto(autorTriggui, texto) {
  const claves = clavesDeAutor(autorTriggui);
  if (!claves.length) return null;
  const ws = new Set(palabras(texto));
  return claves.some((c) => ws.has(c));
}

export function esIsbn13(s) {
  const d = String(s ?? '').replace(/[^0-9]/g, '');
  if (!/^97[89]\d{10}$/.test(d)) return false;
  let suma = 0;
  for (let i = 0; i < 12; i++) suma += Number(d[i]) * (i % 2 ? 3 : 1);
  return (10 - (suma % 10)) % 10 === Number(d[12]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Lo que devuelve cada tienda
// ─────────────────────────────────────────────────────────────────────────────

function lista(v) {
  if (Array.isArray(v)) return v.map(String);
  if (v == null || v === '') return [];
  return [String(v)];
}

/** un resultado de Empathy (Gandhi), con solo lo que se usa */
export function candidatoGandhi(x) {
  const specs = (x && typeof x.filerSpecifications === 'object' && x.filerSpecifications) || {};
  const ruta = x.__url || x.textLink || '';
  const isbn = [x.skuEan, x.skuRefId, x.productRefId].map((v) => String(v ?? '').trim()).find(esIsbn13) || null;
  const ofertas = Array.isArray(x.offers) ? x.offers : [];
  const disponible = ofertas.some((o) => (Array.isArray(o?.OffersPerSalesChannel) ? o.OffersPerSalesChannel : [])
    .some((c) => c && c.IsAvailable === true && Number(c.AvailableQuantity) > 0));
  return {
    nombre: String(x.name || x.__name || x.skuName || ''),
    autores: lista(x.facet_Autor).length ? lista(x.facet_Autor) : lista(specs.Autor),
    isbn,
    url: ruta ? `https://www.gandhi.com.mx${ruta.startsWith('/') ? '' : '/'}${ruta}` : null,
    tipo: lista(x.facet_Tipo)[0] || String(specs.Tipo || ''),
    categoria: String(x.category1 || lista(x.categories)[0] || ''),
    idioma: String(specs.Idioma || ''),
    disponible,
    precio: Number.isFinite(Number(x.sellingPrice)) ? Number(x.sellingPrice) : null,
    puntaje: Number(x.score) || 0,
  };
}

export function esFisico(c) {
  return !/audio|ebook|e-book|digital|kindle|electronic/i.test(`${c.tipo} ${c.categoria}`);
}

/** tarjetas de producto de una página de búsqueda de Casa del Libro (Tiendanube) */
export function tarjetasCasaDelLibro(html) {
  const s = String(html || '');
  const marcas = [...s.matchAll(/<[a-z]+[^>]*\bclass="[^"]*\bjs-item-product\b[^"]*"[^>]*>/g)];
  const tarjetas = [];
  for (let i = 0; i < marcas.length; i++) {
    const inicio = marcas[i].index;
    const fin = i + 1 < marcas.length ? marcas[i + 1].index : Math.min(s.length, inicio + 20000);
    const trozo = s.slice(inicio, fin);
    const id = (marcas[i][0].match(/data-product-id="(\d+)"/) || trozo.match(/data-product-id="(\d+)"/) || [])[1];
    const url = (trozo.match(/href="(https:\/\/casadelibro\.com\.mx\/productos\/[^"#?]+\/?)"/) || [])[1];
    if (!id || !url) continue;
    const nombreCrudo = (trozo.match(/class="[^"]*\bjs-item-name\b[^"]*"[^>]*>\s*([^<]+?)\s*</) || [])[1] || '';
    const nombre = decodificarHtml(nombreCrudo);
    // La tarjeta trae su estado: data-stock-state="in" y data-cdl-stock="<piezas>".
    const estado = (marcas[i][0].match(/data-stock-state="([^"]*)"/) || [])[1];
    const piezas = (marcas[i][0].match(/data-cdl-stock="([^"]*)"/) || [])[1];
    const sinStock = (estado != null && estado !== 'in') || (piezas != null && piezas !== '' && Number(piezas) <= 0);
    if (!tarjetas.some((t) => t.id === id)) tarjetas.push({ id, url, nombre: /^\$/.test(nombre) ? '' : nombre, sinStock });
  }
  return tarjetas;
}

export function decodificarHtml(s) {
  return String(s ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
}

/** lo que importa de la ficha de un producto de Casa del Libro */
export function fichaCasaDelLibro(html) {
  const s = String(html || '');
  let variante = null;
  const m = s.match(/LS\.variants\s*=\s*(\[[\s\S]*?\]);/);
  if (m) {
    try { variante = JSON.parse(m[1])[0] || null; } catch { variante = null; }
  }
  const titulo = decodificarHtml((s.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/) || [])[1] || '');
  // La descripción es el primer panel de pestañas de la ficha (el elemento, no la regla de estilo).
  let descripcion = '';
  const panel = s.search(/<[a-z]+[^>]*\bclass="[^"]*\bproduct-tabs__panel\b/);
  if (panel >= 0) {
    const desde = s.indexOf('>', panel) + 1;
    const resto = s.slice(desde);
    const siguiente = resto.search(/<[a-z]+[^>]*\bclass="[^"]*\bproduct-tabs__panel\b/);
    descripcion = decodificarHtml(resto.slice(0, siguiente > 0 ? siguiente : 20000).replace(/<[^>]+>/g, ' '));
  }
  const stock = variante && variante.stock != null ? Number(variante.stock) : null;
  return {
    sku: variante ? String(variante.sku ?? '').trim() : '',
    disponible: !!variante && variante.available === true && (stock == null || stock > 0),
    stock,
    titulo,
    descripcion,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Red: una petición por segundo a cada sitio, con tope de tiempo y reintentos
// ─────────────────────────────────────────────────────────────────────────────

export function crearLector({ intervaloMs = 1000, topeMs = 20000, reintentos = 3, fetchImpl = globalThis.fetch } = {}) {
  const ultimo = new Map();
  const colas = new Map();
  const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
  let peticiones = 0;
  async function turno(host) {
    const previo = colas.get(host) || Promise.resolve();
    let liberar;
    const actual = new Promise((r) => { liberar = r; });
    colas.set(host, previo.then(() => actual));
    await previo;
    const espera = (ultimo.get(host) || 0) + intervaloMs - Date.now();
    if (espera > 0) await dormir(espera);
    ultimo.set(host, Date.now());
    return liberar;
  }
  async function leer(url, { json = false, encabezados = {} } = {}) {
    const host = new URL(url).host;
    let error;
    for (let intento = 1; intento <= reintentos; intento++) {
      const liberar = await turno(host);
      const ctrl = new AbortController();
      const reloj = setTimeout(() => ctrl.abort(), topeMs);
      try {
        peticiones++;
        const r = await fetchImpl(url, { headers: { 'User-Agent': UA, ...encabezados }, signal: ctrl.signal, redirect: 'follow' });
        if (r.status === 429 || r.status >= 500) throw new Error(`HTTP ${r.status}`);
        // 404 y 410 son «esa página no existe» (una ficha que se quitó): no hay libro ahí. Cualquier otro rechazo
        // (403 de un muro contra robots, 401…) es una falla de lectura y no un «no se consigue»: se lanza, sin
        // reintentar, para que el libro quede por revisar y no marcado como que no está.
        if (r.status === 404 || r.status === 410) return { ok: false, status: r.status, cuerpo: json ? null : '' };
        if (!r.ok) { const rechazo = new Error(`HTTP ${r.status}`); rechazo.definitivo = true; throw rechazo; }
        return { ok: true, status: r.status, cuerpo: json ? await r.json() : await r.text() };
      } catch (e) {
        error = e;
        if (e && e.definitivo) break;
        await dormir(1500 * intento);
      } finally {
        clearTimeout(reloj);
        liberar();
      }
    }
    throw new Error(`No se pudo leer ${url}: ${error?.message || error}`);
  }
  leer.cuenta = () => peticiones;
  return leer;
}

async function buscarGandhi(leer, q) {
  const url = `${EMPATHY}?internal=true&origin=search_box%3Anone&start=0&rows=24&instance=gandhinew&lang=es`
    + `&scope=desktop&consent=true&uiLang=es-MX&query=${encodeURIComponent(q)}`;
  const r = await leer(url, {
    json: true,
    encabezados: { Accept: 'application/json', Origin: 'https://www.gandhi.com.mx', Referer: 'https://www.gandhi.com.mx/' },
  });
  const contenido = r.ok && r.cuerpo && r.cuerpo.catalog && Array.isArray(r.cuerpo.catalog.content) ? r.cuerpo.catalog.content : [];
  return contenido.map(candidatoGandhi);
}

const PRIORIDAD_IDIOMA = (idioma) => (/espa/i.test(idioma) ? 0 : /ingl|english/i.test(idioma) ? 1 : 2);

/** de los candidatos de Gandhi, los que son el libro (título, autor y físico), ordenados por preferencia */
export function elegirGandhi(libro, candidatos) {
  const vistos = new Set();
  const buenos = [];
  for (const c of candidatos) {
    if (!c.url || !esFisico(c)) continue;
    if (!coincideTitulo(libro.titulo, c.nombre)) continue;
    if (coincideAutor(libro.autor, c.autores) !== true) continue;
    const clave = c.isbn || c.url;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    buenos.push(c);
  }
  buenos.sort((a, b) => (Number(b.disponible) - Number(a.disponible))
    || (PRIORIDAD_IDIOMA(a.idioma) - PRIORIDAD_IDIOMA(b.idioma))
    || (b.puntaje - a.puntaje));
  return buenos;
}

async function casaDelLibroPorIsbn(leer, isbn) {
  const r = await leer(TIENDAS.casadelibro.busqueda(isbn));
  if (!r.ok) return null;
  for (const t of tarjetasCasaDelLibro(r.cuerpo).slice(0, 4)) {
    const f = await leer(t.url);
    if (!f.ok) continue;
    const ficha = fichaCasaDelLibro(f.cuerpo);
    if (ficha.sku.replace(/[^0-9]/g, '') === isbn) return { nombre: ficha.titulo || t.nombre || null, url: t.url, isbn, disponible: ficha.disponible };
  }
  return null;
}

async function casaDelLibroPorTitulo(leer, libro, isbnsDescartados) {
  const r = await leer(TIENDAS.casadelibro.busqueda(tituloCorto(libro.titulo)));
  if (!r.ok) return null;
  for (const t of tarjetasCasaDelLibro(r.cuerpo).slice(0, 6)) {
    if (t.nombre && !coincideTitulo(libro.titulo, t.nombre)) continue;
    const f = await leer(t.url);
    if (!f.ok) continue;
    const ficha = fichaCasaDelLibro(f.cuerpo);
    if (!coincideTitulo(libro.titulo, ficha.titulo || t.nombre)) continue;
    const isbn = esIsbn13(ficha.sku) ? ficha.sku.replace(/[^0-9]/g, '') : null;
    if (isbn && isbnsDescartados.has(isbn)) continue;
    // El autor: en la página (título o descripción), o, si la página no lo dice (muchas no lo traen), en Gandhi por
    // el ISBN de esa misma ficha: el mismo ISBN con el mismo autor es el mismo libro.
    let autorOk = autorEnTexto(libro.autor, `${ficha.titulo} ${ficha.descripcion}`) === true;
    if (!autorOk && isbn) {
      const porIsbn = await buscarGandhi(leer, isbn);
      autorOk = porIsbn.some((c) => c.isbn === isbn && coincideAutor(libro.autor, c.autores) === true);
    }
    if (!autorOk) continue;
    return { nombre: ficha.titulo || t.nombre || null, url: t.url, isbn, disponible: ficha.disponible };
  }
  return null;
}

/**
 * Revisa un libro en las dos tiendas.
 * libro: { titulo, autor, isbn? }
 */
export async function revisarLibro(libro, leer, { hoy = new Date().toISOString().slice(0, 10) } = {}) {
  const res = {
    titulo: libro.titulo, autor: libro.autor,
    tienda: 'ninguna', url: null, isbn: null, idioma: null,
    casadelibro: null, gandhi: null, motivo: null, revisado: hoy,
  };
  const desconocido = clavesDeAutor(libro.autor).length === 0;
  if (desconocido) { res.motivo = 'autor_desconocido'; return res; }

  // 1) Gandhi: título y apellido; si no sale, solo el título.
  const apellido = clavesDeAutor(libro.autor)[0];
  let candidatos = await buscarGandhi(leer, `${tituloCorto(libro.titulo)} ${apellido}`);
  let buenos = elegirGandhi(libro, candidatos);
  if (!buenos.length) {
    candidatos = await buscarGandhi(leer, tituloCorto(libro.titulo));
    buenos = elegirGandhi(libro, candidatos);
  }
  const mejorGandhi = buenos[0] || null;
  if (mejorGandhi) {
    res.gandhi = {
      nombre: mejorGandhi.nombre || null, autores: mejorGandhi.autores || [],
      url: mejorGandhi.url, isbn: mejorGandhi.isbn, idioma: mejorGandhi.idioma || null,
      tipo: mejorGandhi.tipo || null, disponible: mejorGandhi.disponible, precio: mejorGandhi.precio,
    };
  }

  // 2) Casa del Libro: por los ISBN que Gandhi confirmó (en orden de preferencia); si no, por título.
  const isbns = [];
  for (const c of buenos) if (c.isbn && !isbns.includes(c.isbn)) isbns.push(c.isbn);
  if (libro.isbn && esIsbn13(libro.isbn) && !isbns.includes(libro.isbn)) isbns.push(String(libro.isbn).replace(/[^0-9]/g, ''));
  const probados = new Set();
  let cdl = null;
  for (const isbn of isbns.slice(0, 3)) {
    probados.add(isbn);
    const r = await casaDelLibroPorIsbn(leer, isbn);
    if (r && (r.disponible || !cdl)) cdl = r;
    if (cdl && cdl.disponible) break;
  }
  if (!cdl || !cdl.disponible) {
    const r = await casaDelLibroPorTitulo(leer, libro, probados);
    if (r && (r.disponible || !cdl)) cdl = r;
  }
  if (cdl) res.casadelibro = cdl;

  // 3) La regla de Badir.
  if (cdl && cdl.disponible) {
    Object.assign(res, { tienda: 'casadelibro', url: cdl.url, isbn: cdl.isbn });
    const g = buenos.find((c) => c.isbn && c.isbn === cdl.isbn);
    res.idioma = g ? g.idioma || null : null;
  } else if (mejorGandhi && mejorGandhi.disponible) {
    Object.assign(res, { tienda: 'gandhi', url: mejorGandhi.url, isbn: mejorGandhi.isbn, idioma: mejorGandhi.idioma || null });
  } else {
    res.motivo = (cdl || mejorGandhi) ? 'agotado' : 'sin_coincidencia';
  }
  return res;
}

/** la misma clave que usa el horno para un libro (build-contenido-nucleus.js, normalizeBookKey) */
export function claveLibro(titulo, autor) {
  return `${String(titulo || '').trim().toLowerCase()}__${String(autor || '').trim().toLowerCase()}`;
}

/** el destino de «Comprar» en México para un libro ya revisado, o la búsqueda de Gandhi por título */
export function destinoComprar(revision, libro) {
  if (revision && (revision.tienda === 'casadelibro' || revision.tienda === 'gandhi') && revision.url) {
    return { tienda: revision.tienda, url: revision.url };
  }
  return { tienda: 'gandhi_busqueda', url: TIENDAS.gandhi.busqueda(tituloCorto(libro?.titulo || revision?.titulo || '')) };
}
