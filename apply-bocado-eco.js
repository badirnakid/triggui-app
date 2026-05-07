#!/usr/bin/env node
/**
 * 🌒 TRIGGUI BOCADO Y ECO — Patch nivel dios todopoderoso
 *
 * Inserta el sistema de frases vivas regenerables en public/index.html.
 * Bocado: frase oracular ANTES del libro (1.8s).
 * Eco: frase de despedida AL CERRAR la tarjeta del libro (2s).
 *
 * Pool de frases construido dinámicamente:
 *   - Top-K candidatos via TF-IDF (relevantes a query del usuario)
 *   - Cada candidato aporta sus 4 frases + subtítulo de tarjeta
 *   - Random TRUE pick (crypto.getRandomValues)
 *
 * USO:
 *   cd /workspaces/triggui-app
 *   node apply-bocado-eco.js
 *
 * REVERSIBLE:
 *   - Manual: borrar el bloque <script id="js-bocado-eco">
 *   - Backup: cp public/index.html.backup-pre-bocado-* public/index.html
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(process.cwd(), 'public', 'index.html');
const SCRIPT_PATH = path.join(__dirname, 'bocado-eco-script.js');
const BLOCK_ID = 'js-bocado-eco';

if (!fs.existsSync(INDEX_PATH)) {
  console.error('❌ public/index.html no existe en cwd:', process.cwd());
  process.exit(1);
}
if (!fs.existsSync(SCRIPT_PATH)) {
  console.error('❌ bocado-eco-script.js no existe en:', SCRIPT_PATH);
  process.exit(1);
}

const html = fs.readFileSync(INDEX_PATH, 'utf8');
const scriptCode = fs.readFileSync(SCRIPT_PATH, 'utf8');

console.log('🌒 TRIGGUI BOCADO Y ECO — applying patch');
console.log('   Source: public/index.html (' + html.length + ' bytes, ' + html.split('\n').length + ' lines)');
console.log('   Script: bocado-eco-script.js (' + scriptCode.length + ' bytes)');

let workingHtml = html;
if (workingHtml.includes('id="' + BLOCK_ID + '"') || workingHtml.includes("id='" + BLOCK_ID + "'")) {
  console.log('🔄 Bloque previo encontrado — removiendo para reemplazar con versión nueva');
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
              '// 🌒 BOCADO Y ECO — Frases vivas regenerables del catálogo\n' +
              '// Top-K libros candidatos via TF-IDF + random pool de sus frases\n' +
              '// Para revertir: eliminar este bloque <script id="' + BLOCK_ID + '">\n' +
              scriptCode +
              '\n</script>\n';

const newHtml = workingHtml.slice(0, insertionIdx) + block + workingHtml.slice(insertionIdx);

const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = INDEX_PATH + '.backup-pre-bocado-' + ts;
fs.writeFileSync(backupPath, html, 'utf8');
console.log('💾 Backup: ' + path.basename(backupPath));

fs.writeFileSync(INDEX_PATH, newHtml, 'utf8');

const written = fs.readFileSync(INDEX_PATH, 'utf8');
const ok = written.includes('id="' + BLOCK_ID + '"') &&
           written.includes('setupBocadoEco') &&
           written.includes('buildPhrasePool') &&
           written.includes('showBocado') &&
           written.includes('showEco') &&
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
console.log('   ✓ Frases vivas — del catálogo, regenerables con cada batch');
console.log('   ✓ Top-K candidatos via TF-IDF del filtro existente');
console.log('   ✓ Random VERDADERO via crypto.getRandomValues');
console.log('   ✓ Cero hardcoding — cero mantenimiento manual');
console.log('   ✓ Bocado 1.8s + Eco 2.0s con tipografía editorial Instrument Serif');
console.log('');
console.log('🌒 PRÓXIMOS PASOS:');
console.log('   1. git add public/index.html');
console.log('   2. git commit -m "🌒 Bocado y Eco — frases vivas regenerables del catálogo"');
console.log('   3. git push origin main');
console.log('   4. Validar en producción: app.triggui.com → escribir en barra → Go');
console.log('');
console.log('🔄 PARA REVERTIR:');
console.log('   - Manual: borrar el bloque <script id="' + BLOCK_ID + '"> en public/index.html');
console.log('   - Backup: cp public/' + path.basename(backupPath) + ' public/index.html');
