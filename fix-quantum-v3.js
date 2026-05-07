#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// 🌒 FIX QUANTUM v3 — Stopwords filter + normalización proporcional
// ═══════════════════════════════════════════════════════════════════════════
//
// PROBLEMA RAÍZ ENCONTRADO:
//   Para "no puedo dormir":
//     - Tokens del query: ["no", "puedo", "dormir"]
//     - "no" y "puedo" son stopwords pero tienen IDF=1 (default)
//     - Esto inyecta puntos artificiales a libros que mencionan "no" mucho
//     - "¿Demasiado inteligente?" gana TF-IDF=11.9 mayormente por stopwords
//     - McGarey (que sí habla de dormir) tiene TF-IDF=4.7
//
// FIX:
//   1. Stopwords ES + EN filtradas ANTES del cálculo TF-IDF
//      → solo tokens significativos (>2 letras, no en lista negra) cuentan
//   2. Normalización proporcional contra max del batch
//      → preserva diferencias relativas, no satura
//   3. Threshold maxTfidf > 1.5 para considerar que hay match TF-IDF real
//      → si todos los libros tienen <1.5, cuántico domina sin ruido
//
// Reversible:
//   mv public/index.html.backup-pre-fix-v3-{timestamp} public/index.html
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.resolve(process.cwd(), 'public/index.html');
const BACKUP_PATH = HTML_PATH + '.backup-pre-fix-v3-' + new Date().toISOString().replace(/[:.]/g, '-');

// ═══════════════════════════════════════════════════════════════════════════
// PATTERN MATCHING — buscar el bloque actual del filter (post-v1 o post-v2)
// ═══════════════════════════════════════════════════════════════════════════
//
// Hay 2 versiones posibles del bloque que vamos a reemplazar:
//   - v1: "tfidfScore típicamente cae en [0, 10]"
//   - v2: "PASS 1: calcular tfidfRaw"
//
// Ambas terminan con un "_quantum: quantum" en el return.
// ═══════════════════════════════════════════════════════════════════════════

// Match v1 (apply-quantum.js original)
const V1_INIT_OLD = `    // 🌒 BARRA MÁGICA — CAPA CUÁNTICA. Construir queryVector 11-dim una sola vez.
    const queryVecQuantum = buildQueryVector(queryTokens, TriggguiI18n.lang);

    const scored = libros.map((libro, index) => {
      const bookVec = idx.bookVectors[index];
      let tfidfScore = 0;
      for (const { token, weight } of expandedTokens) {`;

const V1_END_OLD = `      // 🌒 NIVEL DIOS CUÁNTICO: 80% Quantum + 20% TF-IDF + 5% crono boost
      // tfidfScore típicamente cae en [0, 10]. Lo normalizamos a [0, 1].
      const tfidfNorm = Math.min(1, tfidfScore / 10);
      const quantum = quantumScore(queryVecQuantum.vector, libro);
      const crono = (tfidfNorm > 0 || quantum > 0) ? this.cronoBoost(libro) : 0;
      const finalScore = (quantum * 0.80) + (tfidfNorm * 0.20) + (crono * 0.05);
      return { libro, index, score: finalScore, _tfidf: tfidfNorm, _quantum: quantum, _crono: crono };
    });`;

// Match v2 (fix v2 si ya estaba aplicado)
const V2_INIT_OLD = `    // 🌒 BARRA MÁGICA — CAPA CUÁNTICA v2 (normalización proporcional)
    const queryVecQuantum = buildQueryVector(queryTokens, TriggguiI18n.lang);

    // PASS 1: calcular tfidfRaw y quantum por libro
    const rawScores = libros.map((libro, index) => {
      const bookVec = idx.bookVectors[index];
      let tfidfRaw = 0;
      for (const { token, weight } of expandedTokens) {`;

const V2_END_OLD = `      const quantum = quantumScore(queryVecQuantum.vector, libro);
      return { libro, index, tfidfRaw, quantum };
    });

    // PASS 2: normalizar TF-IDF proporcional al MAX del batch
    // Esto evita que stopwords ("no", "puedo") saturen y dominen.
    // Solo cuenta TF-IDF si maxTfidf > 0.5 (umbral de "match real").
    let maxTfidf = 0;
    for (const r of rawScores) if (r.tfidfRaw > maxTfidf) maxTfidf = r.tfidfRaw;
    const useTfidf = maxTfidf > 0.5;

    const scored = rawScores.map(({ libro, index, tfidfRaw, quantum }) => {
      const tfidfNorm = useTfidf ? (tfidfRaw / maxTfidf) : 0;
      const crono = (tfidfNorm > 0 || quantum > 0) ? this.cronoBoost(libro) : 0;
      const finalScore = (quantum * 0.80) + (tfidfNorm * 0.20) + (crono * 0.05);
      return { libro, index, score: finalScore, _tfidf: tfidfNorm, _tfidfRaw: tfidfRaw, _quantum: quantum, _crono: crono };
    });`;

// ═══════════════════════════════════════════════════════════════════════════
// PATRÓN NUEVO v3 — con stopwords filter
// ═══════════════════════════════════════════════════════════════════════════
const V3_INIT_NEW = `    // 🌒 BARRA MÁGICA — CAPA CUÁNTICA v3 (stopwords filter + proporcional)
    const queryVecQuantum = buildQueryVector(queryTokens, TriggguiI18n.lang);

    // Stopwords ES + EN: palabras que NO deben dar peso al TF-IDF
    // porque son ultra-comunes y contaminan el ranking.
    const STOPWORDS_QUANTUM = new Set([
      // Español
      'no','si','sí','ya','ni','el','la','los','las','un','una','unos','unas',
      'de','del','al','en','y','o','u','e','que','qué','quien','quién',
      'cual','cuál','cuales','cuáles','me','te','se','lo','le','les','nos',
      'mi','tu','su','sus','mis','tus','este','esta','estos','estas',
      'ese','esa','eso','esos','esas','aquel','aquella','puedo','puedes',
      'puede','podemos','pueden','soy','eres','es','somos','son','era','eran',
      'estoy','estás','está','estamos','están','estaba','estaban',
      'tengo','tienes','tiene','tenemos','tienen','tenía','tenían',
      'hago','haces','hace','hacemos','hacen','hacía','hacían',
      'voy','vas','va','vamos','van','iba','iban',
      'pero','como','cómo','cuando','cuándo','porque','porqué','aunque',
      'más','menos','muy','mucho','mucha','muchos','muchas','poco','poca','pocos','pocas',
      'todo','toda','todos','todas','algo','alguien','nada','nadie',
      'a','con','sin','por','para','sobre','entre','hasta','desde','contra',
      'también','tampoco','solo','sólo','siempre','nunca','jamás',
      // Inglés
      'no','not','yes','the','a','an','of','to','in','on','at','for',
      'and','or','but','if','then','than','so','as','because','though',
      'i','you','he','she','it','we','they','me','him','her','us','them',
      'my','your','his','its','our','their','this','that','these','those',
      'can','could','will','would','should','may','might','must','shall',
      'am','is','are','was','were','be','being','been',
      'have','has','had','having','do','does','did','doing','done',
      'want','need','feel','think','know','make','get','take','give',
      'when','where','why','how','what','which','who','whom','whose',
      'more','less','very','much','little','few','some','any','all','none',
      'here','there','where','everywhere','somewhere','anywhere','nowhere',
      'too','also','either','neither','both','each','every'
    ]);

    // PASS 1: calcular tfidfRaw + quantum por libro, FILTRANDO stopwords
    const rawScores = libros.map((libro, index) => {
      const bookVec = idx.bookVectors[index];
      let tfidfRaw = 0;
      for (const { token, weight } of expandedTokens) {
        // Skip stopwords y palabras de 1-2 letras
        if (token.length < 3 || STOPWORDS_QUANTUM.has(token)) continue;`;

const V3_BODY_END = `      const quantum = quantumScore(queryVecQuantum.vector, libro);
      return { libro, index, tfidfRaw, quantum };
    });

    // PASS 2: normalizar TF-IDF proporcional al MAX del batch
    // Threshold 1.5 — si maxTfidf es muy bajo, no hay match TF-IDF real,
    // dejamos que cuántico domine sin ruido.
    let maxTfidf = 0;
    for (const r of rawScores) if (r.tfidfRaw > maxTfidf) maxTfidf = r.tfidfRaw;
    const useTfidf = maxTfidf > 1.5;

    const scored = rawScores.map(({ libro, index, tfidfRaw, quantum }) => {
      const tfidfNorm = useTfidf ? (tfidfRaw / maxTfidf) : 0;
      const crono = (tfidfNorm > 0 || quantum > 0) ? this.cronoBoost(libro) : 0;
      const finalScore = (quantum * 0.80) + (tfidfNorm * 0.20) + (crono * 0.05);
      return { libro, index, score: finalScore, _tfidf: tfidfNorm, _tfidfRaw: tfidfRaw, _quantum: quantum, _crono: crono };
    });`;

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

console.log('🌒 FIX QUANTUM v3 — Stopwords filter + normalización proporcional');
console.log('');

if (!fs.existsSync(HTML_PATH)) {
  console.error('❌ No existe public/index.html. Ejecuta desde /workspaces/triggui-app');
  process.exit(1);
}

const html = fs.readFileSync(HTML_PATH, 'utf8');
console.log('✓ index.html leído (' + html.length + ' chars)');

// Detectar versión actual
let currentVersion = null;
let initOld = null, endOld = null, initNew = null, endNew = null;

if (html.indexOf('CAPA CUÁNTICA v3 (stopwords filter') !== -1) {
  console.error('⚠️  El fix v3 YA está aplicado. No hay nada que hacer.');
  process.exit(0);
} else if (html.indexOf('CAPA CUÁNTICA v2 (normalización proporcional)') !== -1) {
  currentVersion = 'v2';
  initOld = V2_INIT_OLD;
  endOld = V2_END_OLD;
} else if (html.indexOf('// 🌒 BARRA MÁGICA — CAPA CUÁNTICA. Construir queryVector') !== -1) {
  currentVersion = 'v1';
  initOld = V1_INIT_OLD;
  endOld = V1_END_OLD;
} else {
  console.error('❌ No se detectó ninguna versión del quantum aplicada.');
  console.error('   Aplica primero apply-quantum.js');
  process.exit(1);
}

console.log('✓ Versión actual detectada: ' + currentVersion);

if (html.indexOf(initOld) === -1 || html.indexOf(endOld) === -1) {
  console.error('❌ No se encontró el patrón de la versión ' + currentVersion);
  console.error('   El index.html podría estar modificado de forma no esperada.');
  process.exit(1);
}
console.log('✓ Patrón de la versión ' + currentVersion + ' encontrado correctamente');

// Backup
fs.writeFileSync(BACKUP_PATH, html);
console.log('✓ Backup creado: ' + path.basename(BACKUP_PATH));

// Reemplazar
let patched = html.replace(initOld, V3_INIT_NEW);
patched = patched.replace(endOld, V3_BODY_END);

if (patched === html) {
  console.error('❌ Los reemplazos no se aplicaron.');
  process.exit(1);
}

const sizeDelta = patched.length - html.length;
console.log('✓ Patch v3 aplicado (' + (sizeDelta >= 0 ? '+' : '') + sizeDelta + ' chars)');

fs.writeFileSync(HTML_PATH, patched);
console.log('✓ Archivo guardado');

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ FIX v3 INSTALADO');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Cambios v3:');
console.log('  • Stopwords ES + EN filtradas ANTES del TF-IDF (no, puedo, mi, etc)');
console.log('  • Normalización proporcional contra MAX del batch');
console.log('  • Threshold 1.5 — si nadie matchea TF-IDF real, cuántico domina');
console.log('  • Tokens < 3 letras también descartados');
console.log('');
console.log('Próximo: refresca el preview y prueba "no puedo dormir" otra vez.');
console.log('Esperado: La vida bien vivida (McGarey).');
console.log('');
console.log('Reversible:');
console.log('   mv ' + path.basename(BACKUP_PATH) + ' public/index.html');
console.log('');