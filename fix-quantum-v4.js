#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// 🌒 FIX QUANTUM v4 — Reparar referencias zombie tfidfScore
// ═══════════════════════════════════════════════════════════════════════════
//
// BUG DETECTADO EN V3:
//   El patch v3 cambió:
//     - inicio: "let tfidfScore = 0;" → "let tfidfRaw = 0;"
//     - final: usa "tfidfRaw" en el return
//   PERO no cambió el cuerpo del for loop, que sigue teniendo:
//     tfidfScore += partialTf * (idx.idf[bookTerm] || 1) * weight;
//     tfidfScore += tf * termIdf * weight;
//
//   Resultado: ReferenceError: tfidfScore is not defined
//
// FIX MÍNIMO QUIRÚRGICO:
//   Renombrar tfidfScore → tfidfRaw dentro del cuerpo del filter().
//   2 líneas cambiadas. Nada más.
//
// Reversible:
//   mv public/index.html.backup-pre-fix-v4-{timestamp} public/index.html
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const HTML_PATH = path.resolve(process.cwd(), 'public/index.html');
const BACKUP_PATH = HTML_PATH + '.backup-pre-fix-v4-' + new Date().toISOString().replace(/[:.]/g, '-');

// ═══════════════════════════════════════════════════════════════════════════
// LOS 2 PATTERNS A REEMPLAZAR (mínimos, quirúrgicos)
// ═══════════════════════════════════════════════════════════════════════════
const PATTERNS = [
  {
    old: '              tfidfScore += partialTf * (idx.idf[bookTerm] || 1) * weight;',
    new: '              tfidfRaw += partialTf * (idx.idf[bookTerm] || 1) * weight;'
  },
  {
    old: '          tfidfScore += tf * termIdf * weight;',
    new: '          tfidfRaw += tf * termIdf * weight;'
  }
];

console.log('🌒 FIX QUANTUM v4 — Renombrar tfidfScore → tfidfRaw en cuerpo del filter()');
console.log('');

if (!fs.existsSync(HTML_PATH)) {
  console.error('❌ No existe public/index.html. Ejecuta desde /workspaces/triggui-app');
  process.exit(1);
}

const html = fs.readFileSync(HTML_PATH, 'utf8');
console.log('✓ index.html leído (' + html.length + ' chars)');

// Verificar que v3 está aplicado
if (html.indexOf('CAPA CUÁNTICA v3 (stopwords filter') === -1) {
  console.error('❌ El fix v3 no está aplicado. Aplica primero fix-quantum-v3.js');
  process.exit(1);
}
console.log('✓ Fix v3 detectado');

// Verificar que el bug está presente
let bugCount = 0;
for (const p of PATTERNS) {
  if (html.indexOf(p.old) !== -1) bugCount++;
}

if (bugCount === 0) {
  console.error('⚠️  No se detectó el bug zombie tfidfScore. Posibles causas:');
  console.error('   - El bug ya fue arreglado');
  console.error('   - El patch v3 fue aplicado correctamente sin bug');
  console.error('   - El index.html fue modificado a mano');
  process.exit(0);
}

console.log('✓ Bug detectado en ' + bugCount + ' línea(s)');

// Backup
fs.writeFileSync(BACKUP_PATH, html);
console.log('✓ Backup creado: ' + path.basename(BACKUP_PATH));

// Aplicar reemplazos
let patched = html;
let appliedCount = 0;
for (const p of PATTERNS) {
  if (patched.indexOf(p.old) !== -1) {
    patched = patched.replace(p.old, p.new);
    appliedCount++;
    console.log('  ✓ Renombrado: ' + p.old.trim().substring(0, 60) + '...');
  }
}

if (appliedCount === 0) {
  console.error('❌ No se aplicó ningún reemplazo');
  process.exit(1);
}

fs.writeFileSync(HTML_PATH, patched);
console.log('✓ Archivo guardado (' + appliedCount + ' línea(s) reparada(s))');

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('✅ FIX v4 INSTALADO — Bug zombie reparado');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');
console.log('Próximo:');
console.log('  1. Hard refresh del navegador (Cmd+Shift+R)');
console.log('  2. Prueba "no puedo dormir" otra vez');
console.log('  3. Esperado: La vida bien vivida (McGarey)');
console.log('');
console.log('Reversible:');
console.log('   mv ' + path.basename(BACKUP_PATH) + ' public/index.html');
console.log('');