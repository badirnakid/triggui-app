// ════════════════════════════════════════════════════════════════════════
// 🪪 IDENTIDAD DEL LIBRO — la puerta que va ANTES de gastar un solo token
// ════════════════════════════════════════════════════════════════════════
// Nació del 22-sep-2026: «The Book Of Questions | Scott Simon» terminó publicado
// como un libro inexistente llamado «Ok». Esta puerta verifica que el libro EXISTA
// en el mundo (Apple Books MX/US + Open Library) y resuelve título y autor reales.
//
// ESCALERA (en este orden, la primera que acierta gana):
//   1 · título + autor juntos            → 'exacto'
//   2 · el título solo (señal más fuerte) → 'autor_corregido' (si el autor no cuadraba)
//                                         → 'por_titulo'      (si no diste autor)
//   3 · el autor                          → 'otro_del_autor'  (el título no existe: su siguiente libro)
//                                         → 'del_autor'       (solo diste autor)
//   · nada en ninguna fuente              → 'no_encontrado'   (el run FALLA con sugerencias)
//   · ninguna fuente respondió            → 'sin_red'         (sigue con lo escrito; nunca bloquea por red)
//
// Reglas de comparación:
//   · palabras COMPLETAS, jamás subcadenas de letras ("ok" ya no vive dentro de "book")
//   · tolerancia a una errata por palabra (≥3 letras): "questons" ≈ "questions", "sctott" ≈ "scott"
//   · para CORREGIR el autor que escribiste, el título debe ser específico (≥2 palabras
//     o ≥6 letras): un título como «Ok» es demasiado genérico para desmentirte
// ════════════════════════════════════════════════════════════════════════

const TIMEOUT_MS = 9000;
const UMBRAL_EXACTO = 0.85;      // título+autor juntos
const UMBRAL_TITULO = 0.9;       // solo título (más estricto: el autor no ayuda)

const APELLIDOS_COMUNES = new Set([
  "smith", "jones", "brown", "lee", "kim", "chen", "wang", "li", "zhang", "liu", "garcia", "lopez", "martinez",
  "gonzalez", "rodriguez", "perez", "sanchez", "hernandez", "singh", "kumar", "khan", "silva", "santos", "ali", "shah",
]);

export function sinAcentos(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function tokens(s) {
  return sinAcentos(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

/** Título principal: lo que va antes de ":" "(" "[" o " — " (el subtítulo no define la identidad). */
export function tituloPrincipal(s) {
  return String(s || "").split(/\s*[:(\[]\s*|\s+[—–-]\s+/)[0].trim();
}

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Dos palabras son la misma si son idénticas, o (≥3 letras) difieren en una errata (dos si ≥8). */
export function tokIgual(a, b) {
  if (a === b) return true;
  const m = Math.min(a.length, b.length);
  if (m < 3) return false;
  return lev(a, b) <= (m >= 8 ? 2 : 1);
}

function dice(A, B) {
  if (!A.length || !B.length) return 0;
  const usados = new Set();
  let hit = 0;
  for (const a of A) {
    const j = B.findIndex((b, k) => !usados.has(k) && tokIgual(a, b));
    if (j >= 0) { usados.add(j); hit++; }
  }
  return (2 * hit) / (A.length + B.length);
}

/**
 * Similitud de títulos por palabras completas. Con subtítulos en cualquiera de los dos lados:
 * se comparan completo y principal de la entrada contra completo y principal del candidato.
 * `estricto` = solo títulos completos (se usa cuando vamos a desmentir el autor que escribiste).
 */
export function simTitulo(entrada, candidato, modo = "soloTitulo") {
  // modo: "estricto"   → solo títulos completos (para desmentir el autor que escribiste)
  //       "conAutor"   → el autor ya coincide: el título principal vale aunque sea una palabra (≥3 letras)
  //       "soloTitulo" → sin autor que respalde: el principal solo vale si tiene ≥2 palabras
  const A = tokens(entrada), Ap = tokens(tituloPrincipal(entrada));
  if (!A.length) return 0;
  const B = tokens(candidato), Bp = tokens(tituloPrincipal(candidato));
  if (modo === "estricto") return dice(A, B);
  const vale = (P) => modo === "conAutor" ? (P.length >= 2 || (P[0] || "").length >= 3) : P.length >= 2;
  const pa = vale(Ap) ? Ap : A, pb = vale(Bp) ? Bp : B;
  const base = Math.max(dice(A, B), dice(A, pb), dice(pa, B), dice(pa, pb));
  if (modo !== "conAutor") return base;
  // con el autor ya confirmado: si el título corto de uno es el INICIO del otro (subtítulo tras coma), es el mismo libro
  const prefijo = (X, Y) => X.length >= 1 && X.length <= Y.length && (X.length >= 2 || X[0].length >= 4) && X.every((w, i) => tokIgual(w, Y[i]));
  return (prefijo(pa, B) || prefijo(pb, A)) ? Math.max(base, 1) : base;
}

/** Ediciones resumen, guías de estudio y editoriales pirata: jamás son "el libro". */
const RESUMEN_RX = /\b(summary|summaries|resumen|resumo|study guide|guia de estudio|analysis of|analisis de|workbook|key takeaways|sinopsis|condensed|companion to|cliffs? ?notes)\b/i;
const PIRATA_RX = /summary|resumen|whizbooks|instant[- ]?summar|turbo[- ]?learning|readtrepreneur|book ?tigers|quick ?read|supersummary|bookrags|everest media|sapiens editorial|ant hive|bookhabits|lightning summar|golden ?(mind|books)|smart ?reads|minute ?help|lit ?(notes|charts)|dailybooks/i;
export function esResumen(c) {
  const t = sinAcentos(c.titulo), a = sinAcentos(c.autor);
  return RESUMEN_RX.test(t) || PIRATA_RX.test(a);
}

/** El autor coincide si comparten un apellido/nombre significativo (difuso); un apellido común exige dos. */
export function autorCoincide(a, b) {
  const A = tokens(a).filter((t) => t.length >= 3);
  const B = tokens(b).filter((t) => t.length >= 3);
  if (!A.length || !B.length) return false;
  let hits = 0, raros = 0;
  for (const x of A) {
    if (B.some((y) => tokIgual(x, y))) { hits++; if (!APELLIDOS_COMUNES.has(x)) raros++; }
  }
  return raros >= 1 || hits >= 2;
}

/** Separa una lista de autores ("A & B", "A, B y C") en nombres individuales. */
function nombres(autorStr) {
  return String(autorStr || "").split(/\s*(?:&|,|;|\sand\s|\sy\s)\s*/i).map((x) => x.trim()).filter(Boolean);
}

/** Misma persona: coinciden primer nombre y apellido (tolera segundo nombre y una errata). */
export function mismaPersona(a, b) {
  const A = tokens(a).filter((t) => t.length >= 2);
  if (A.length < 2) return A.length === 1 && nombres(b).some((n) => tokens(n).some((t) => tokIgual(A[0], t) && A[0].length >= 5));
  return nombres(b).some((n) => {
    const B = tokens(n).filter((t) => t.length >= 2);
    return B.length >= 2 && tokIgual(A[0], B[0]) && tokIgual(A[A.length - 1], B[B.length - 1]);
  });
}

/** ¿El título basta por sí solo para desmentir el autor escrito? */
function tituloEspecifico(t) {
  const T = tokens(t);
  return T.length >= 2 || (T[0] || "").length >= 6;
}

async function traer(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Triggui/1.0 (identidad)" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function apple(term, pais) {
  const u = "https://itunes.apple.com/search?" + new URLSearchParams({ term, entity: "ebook", country: pais, limit: "20" });
  const d = await traer(u);
  return (d.results || []).map((r, i) => ({ titulo: String(r.trackName || "").trim(), autor: String(r.artistName || "").trim(), fuente: "apple-" + pais, pos: i }))
    .filter((c) => c.titulo && c.autor);
}

async function openLibrary(titulo, autor) {
  const p = { limit: "12", fields: "title,author_name,edition_count" };
  if (titulo) p.title = titulo;
  if (autor) p.author = autor;
  const d = await traer("https://openlibrary.org/search.json?" + new URLSearchParams(p));
  return (d.docs || []).map((x, i) => ({ titulo: String(x.title || "").trim(), autor: String((x.author_name || [])[0] || "").trim(), fuente: "openlibrary", pos: i }))
    .filter((c) => c.titulo && c.autor);
}

async function googleBooks(titulo, autor) {
  const q = [titulo ? `intitle:${titulo}` : "", autor ? `inauthor:${autor}` : ""].filter(Boolean).join(" ");
  const d = await traer("https://www.googleapis.com/books/v1/volumes?" + new URLSearchParams({ q, maxResults: "12", printType: "books" }));
  return (d.items || []).map((it, i) => {
    const v = it.volumeInfo || {};
    return { titulo: String(v.title || "").trim() + (v.subtitle ? ": " + String(v.subtitle).trim() : ""), autor: String((v.authors || []).join(" & ")).trim(), fuente: "google", pos: i };
  }).filter((c) => c.titulo && c.autor);
}

/** Consenso entre fuentes: suma de 1/(1+posición) por cada aparición del mismo libro. */
function consenso(lista) {
  const grupos = new Map();
  for (const c of lista.filter((x) => !esResumen(x))) {
    const k = tokens(tituloPrincipal(c.titulo)).join(" ") + "|" + tokens(c.autor).slice(-1)[0];
    const g = grupos.get(k) || { ...c, puntaje: 0, fuentes: new Set(), apple0: false };
    g.puntaje += 1 / (1 + c.pos);
    g.fuentes.add(c.fuente);
    if (String(c.fuente).startsWith("apple") && c.pos === 0) g.apple0 = true;
    grupos.set(k, g);
  }
  return [...grupos.values()].sort((a, b) => b.puntaje - a.puntaje);
}

/**
 * @param {string} tituloIn  lo que escribiste antes del "|"
 * @param {string} autorIn   lo que escribiste después del "|"
 * @param {{existentes?: Set<string>}} opts  títulos normalizados que ya son edición (para "el siguiente" del autor)
 */
export async function resolverIdentidad(tituloIn, autorIn, opts = {}) {
  const T = String(tituloIn || "").trim();
  const A = String(autorIn || "").trim();
  const existentes = opts.existentes || new Set();
  let respondio = false;
  const intentar = async (fn) => {
    try { const r = await fn(); respondio = true; return r; } catch { return []; }
  };

  // 0 · tu propio catálogo curado es prueba de existencia (libros de nicho que Apple no indexa)
  if (T && Array.isArray(opts.catalogo)) {
    const hit = opts.catalogo.find((r) => r && r.titulo && simTitulo(T, r.titulo, A ? "conAutor" : "soloTitulo") >= UMBRAL_EXACTO && (!A || !r.autor || autorCoincide(A, r.autor)));
    if (hit) return { estado: "exacto", titulo: hit.titulo, autor: hit.autor || A, fuentes: ["catalogo"] };
  }

  // 1 · título + autor juntos
  if (T && A) {
    const corto = tituloPrincipal(T);
    const cands = [
      ...(await intentar(() => apple(T + " " + A, "mx"))),
      ...(await intentar(() => apple(T + " " + A, "us"))),
      ...(corto && corto !== T ? await intentar(() => apple(corto + " " + A, "us")) : []),
      ...(await intentar(() => openLibrary(T, A))),
      ...(await intentar(() => googleBooks(T, A))),
    ].filter((c) => simTitulo(T, c.titulo, "conAutor") >= UMBRAL_EXACTO && autorCoincide(A, c.autor));
    const ok = consenso(cands)[0];
    if (ok) return { estado: "exacto", titulo: ok.titulo, autor: ok.autor, fuentes: [...ok.fuentes] };
  }

  // 2 · el título solo — si diste autor, solo lo corrige un título específico, completo (sin atajo de
  //     subtítulo) y con consenso: aparece en ≥2 fuentes o es el primer resultado de Apple
  if (T && (!A || tituloEspecifico(T))) {
    const cands = [
      ...(await intentar(() => apple(T, "mx"))),
      ...(await intentar(() => apple(T, "us"))),
      ...(await intentar(() => openLibrary(T, ""))),
      ...(await intentar(() => googleBooks(T, ""))),
    ].filter((c) => simTitulo(T, c.titulo, A ? "estricto" : "soloTitulo") >= UMBRAL_TITULO);
    const ok = consenso(cands).find((g) => !A || g.fuentes.size >= 2 || g.apple0);
    if (ok) {
      const mismo = A && autorCoincide(A, ok.autor);
      return {
        estado: !A ? "por_titulo" : (mismo ? "exacto" : "autor_corregido"),
        titulo: ok.titulo, autor: ok.autor, fuentes: [...ok.fuentes],
        nota: (A && !mismo) ? `«${T}» no es de ${A}; es de ${ok.autor}` : "",
      };
    }
  }

  // 3 · el autor (si escribiste solo un nombre sin "|", también se prueba como autor)
  const comoAutor = A || (T && !A ? T : "");
  if (comoAutor) {
    const cands = [
      ...(await intentar(() => apple(comoAutor, "mx"))),
      ...(await intentar(() => apple(comoAutor, "us"))),
    ].filter((c) => mismaPersona(comoAutor, c.autor));          // la persona, no el apellido
    // primero los libros donde esa persona es PRIMER autor (no el tercero de una antología)
    const primero = (c) => mismaPersona(comoAutor, nombres(c.autor)[0] || "");
    const orden = consenso(cands).filter(primero);   // solo libros donde esa persona encabeza: jamás coautor de antología
    const nuevos = orden.filter((c) => !existentes.has(tokens(tituloPrincipal(c.titulo)).join(" ")));
    const ok = nuevos[0] || orden[0];
    if (ok) {
      const soloNombre = !A && T;                                  // escribió solo un nombre
      return {
        estado: (A && T) ? "otro_del_autor" : "del_autor",
        titulo: ok.titulo, autor: ok.autor, fuentes: [...ok.fuentes],
        sugerencias: orden.slice(0, 8).map((c) => c.titulo),
        nota: (A && T) ? `«${T}» no existe de ${A}; se usa su siguiente libro` : (soloNombre ? `«${T}» se interpretó como autor` : ""),
      };
    }
  }

  if (!respondio) return { estado: "sin_red", titulo: T, autor: A };
  return { estado: "no_encontrado", titulo: T, autor: A, sugerencias: [] };
}
