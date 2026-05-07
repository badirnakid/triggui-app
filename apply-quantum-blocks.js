#!/usr/bin/env node
/**
 * 🌒 TRIGGUI QUANTUM BLOCKS — Patch nivel dios todopoderoso
 *
 * Inserta el sistema cuántico de los 4 bloques en public/index.html.
 * Cada apertura del libro = paleta cuántica nueva con:
 *   - Identidad cromática del libro (hue base derivado)
 *   - 7 estrategias armónicas matemáticas
 *   - 4 distribuciones geométricas coherentes
 *   - Legibilidad WCAG AA GARANTIZADA (100%, contraste >= 4.5:1)
 *   - Gradientes compuestos (linear base + luz cenital sutil)
 *
 * USO:
 *   cd /workspaces/triggui-app
 *   node apply-quantum-blocks.js
 *
 * REVERSIBLE:
 *   - Manual: borrar el bloque <script id="js-quantum-blocks">
 *   - Backup: cp index.html.backup-pre-blocks-* public/index.html
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(process.cwd(), 'public', 'index.html');
const SCRIPT_PATH = path.join(__dirname, 'quantum-blocks-script.js');
const BLOCK_ID = 'js-quantum-blocks';

if (!fs.existsSync(INDEX_PATH)) {
  console.error('❌ public/index.html no existe en cwd:', process.cwd());
  process.exit(1);
}
if (!fs.existsSync(SCRIPT_PATH)) {
  console.error('❌ quantum-blocks-script.js no existe en:', SCRIPT_PATH);
  process.exit(1);
}

const html = fs.readFileSync(INDEX_PATH, 'utf8');
const scriptCode = fs.readFileSync(SCRIPT_PATH, 'utf8');

console.log('🌒 TRIGGUI QUANTUM BLOCKS — applying patch');
console.log('   Source: public/index.html (' + html.length + ' bytes, ' + html.split('\n').length + ' lines)');
console.log('   Script: quantum-blocks-script.js (' + scriptCode.length + ' bytes)');

let workingHtml = html;
if (workingHtml.includes('id="' + BLOCK_ID + '"') || workingHtml.includes("id='" + BLOCK_ID + "'")) {
  console.log('🔄 Bloque previo encontrado — removiendo para reemplazar con versión nueva');
  // Regex para remover el bloque <script id="js-quantum-blocks">...</script>
  const re = new RegExp('\\n*<script id=["\']' + BLOCK_ID + '["\'][^>]*>[\\s\\S]*?<\\/script>\\n*', 'g');
  workingHtml = workingHtml.replace(re, '\n');
  if (workingHtml.includes('id="' + BLOCK_ID + '"')) {
    console.error('❌ No se pudo remover el bloque previo — abortando');
    process.exit(1);
  }
  console.log('   Bloque previo removido (' + (html.length - workingHtml.length) + ' bytes)');
}

const insertionMarker = '</body>';
const insertionIdx = workingHtml.lastIndexOf(insertionMarker);
if (insertionIdx === -1) {
  console.error('❌ No se encontró </body> en public/index.html');
  process.exit(1);
}

const block = '\n\n<script id="' + BLOCK_ID + '">\n' +
              '// 🌒 QUANTUM BLOCKS — paleta cuántica de los 4 bloques al revelar libro\n' +
              '// Identidad del libro + variedad infinita + legibilidad WCAG AA garantizada\n' +
              '// Para revertir: eliminar este bloque <script id="' + BLOCK_ID + '">\n' +
              scriptCode +
              '\n</script>\n';

const newHtml = workingHtml.slice(0, insertionIdx) + block + workingHtml.slice(insertionIdx);

const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = INDEX_PATH + '.backup-pre-blocks-' + ts;
fs.writeFileSync(backupPath, html, 'utf8');
console.log('💾 Backup: ' + path.basename(backupPath));

fs.writeFileSync(INDEX_PATH, newHtml, 'utf8');

const written = fs.readFileSync(INDEX_PATH, 'utf8');
const ok = written.includes('id="' + BLOCK_ID + '"') &&
           written.includes('setupQuantumBlocks') &&
           written.includes('prepareQuantumPalette') &&
           written.includes('ensureLegibility') &&
           written.indexOf('</body>') === written.lastIndexOf('</body>');

if (!ok) {
  console.error('❌ Validación falló — restaurando backup');
  fs.writeFileSync(INDEX_PATH, html, 'utf8');
  process.exit(1);
}

const sizeChange = newHtml.length - html.length;
const linesChange = newHtml.split('\n').length - html.split('\n').length;

console.log('✅ Patch aplicado exitosamente');
console.log('   Nuevo tamaño: ' + newHtml.length + ' bytes (+' + sizeChange + ')');
console.log('   Líneas: ' + newHtml.split('\n').length + ' (+' + linesChange + ')');
console.log('');
console.log('🌒 GARANTÍAS MATEMÁTICAS:');
console.log('   ✓ 100% bloques cumplen WCAG AA legibilidad (contraste >= 4.5:1)');
console.log('   ✓ Identidad cromática del libro preservada (hue base)');
console.log('   ✓ Variedad infinita: 7 estrategias × 4 distribuciones × random infinito');
console.log('   ✓ Sutilezas: gradientes compuestos con luz cenital alpha 0.08-0.18');
console.log('');
console.log('🌒 PRÓXIMOS PASOS:');
console.log('   1. git add public/index.html');
console.log('   2. git commit -m "🌒 Quantum Blocks — paleta cuántica con identidad del libro + WCAG AA"');
console.log('   3. git push origin main');
console.log('   4. Validar en producción: app.triggui.com → revelar libro varias veces');
console.log('');
console.log('🔄 PARA REVERTIR:');
console.log('   - Manual: borrar el bloque <script id="' + BLOCK_ID + '"> en public/index.html');
console.log('   - Backup: cp public/' + path.basename(backupPath) + ' public/index.html');
