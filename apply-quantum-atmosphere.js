#!/usr/bin/env node
/**
 * 🌒 TRIGGUI QUANTUM ATMOSPHERE — Patch nivel dios
 *
 * Inserta el sistema de variedad cromática infinita en public/index.html.
 *
 * USO:
 *   cd /workspaces/triggui-app
 *   node apply-quantum-atmosphere.js
 *
 * ARCHITECTURA:
 *   - NO modifica código sagrado (BarraMagica.applyStrings, render, etc)
 *   - Inserta UN <script id="js-quantum-atmosphere"> antes de </body>
 *   - Monkey-patch a applyStrings → cada apertura regenera atmósfera
 *   - Reversible: borrar el bloque <script id="js-quantum-atmosphere"> y vuelve al estado anterior
 *
 * VALIDACIONES:
 *   - Verifica que public/index.html existe
 *   - Verifica que NO está ya parcheado (idempotente)
 *   - Hace backup automático con timestamp
 *   - Valida que la inserción fue exitosa
 *   - Reporta tamaño antes/después
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(process.cwd(), 'public', 'index.html');
const SCRIPT_PATH = path.join(__dirname, 'quantum-script.js');
const BLOCK_ID = 'js-quantum-atmosphere';

// ── Validaciones previas ──
if (!fs.existsSync(INDEX_PATH)) {
  console.error('❌ No se encontró public/index.html en cwd:', process.cwd());
  console.error('   Asegúrate de correr este script desde la raíz del repo triggui-app');
  process.exit(1);
}

if (!fs.existsSync(SCRIPT_PATH)) {
  console.error('❌ No se encontró quantum-script.js en:', SCRIPT_PATH);
  console.error('   Asegúrate de tenerlo junto a apply-quantum-atmosphere.js');
  process.exit(1);
}

const html = fs.readFileSync(INDEX_PATH, 'utf8');
const scriptCode = fs.readFileSync(SCRIPT_PATH, 'utf8');

console.log('🌒 TRIGGUI QUANTUM ATMOSPHERE — applying patch');
console.log('   Source: public/index.html (' + html.length + ' bytes, ' + html.split('\n').length + ' lines)');
console.log('   Script: quantum-script.js (' + scriptCode.length + ' bytes)');

// ── Verificar idempotencia ──
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

// ── Punto de inserción: justo antes de </body> ──
const insertionMarker = '</body>';
const insertionIdx = workingHtml.lastIndexOf(insertionMarker);
if (insertionIdx === -1) {
  console.error('❌ No se encontró </body> en public/index.html');
  process.exit(1);
}

// ── Construir el bloque a insertar ──
const block = '\n\n<script id="' + BLOCK_ID + '">\n' +
              '// 🌒 QUANTUM ATMOSPHERE — sistema de variedad cromática infinita\n' +
              '// Generado por apply-quantum-atmosphere.js\n' +
              '// Para revertir: eliminar este bloque <script id="' + BLOCK_ID + '">\n' +
              scriptCode +
              '\n</script>\n';

const newHtml = workingHtml.slice(0, insertionIdx) + block + workingHtml.slice(insertionIdx);

// ── Backup ──
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupPath = INDEX_PATH + '.backup-pre-quantum-' + ts;
fs.writeFileSync(backupPath, html, 'utf8');
console.log('💾 Backup: ' + path.basename(backupPath));

// ── Escribir ──
fs.writeFileSync(INDEX_PATH, newHtml, 'utf8');

// ── Validar ──
const written = fs.readFileSync(INDEX_PATH, 'utf8');
const ok = written.includes('id="' + BLOCK_ID + '"') &&
           written.includes('setupQuantumAtmosphere') &&
           written.includes('generateAtmosphere') &&
           written.indexOf('</body>') === written.lastIndexOf('</body>'); // solo un </body>

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
console.log('🌒 PRÓXIMOS PASOS:');
console.log('   1. Validar visualmente:');
console.log('      Abre el archivo localmente o en Codespaces');
console.log('   2. Commit y push:');
console.log('      git add public/index.html');
console.log('      git commit -m "🌒 Quantum Atmosphere — variedad cromática infinita en barra mágica"');
console.log('      git push origin main');
console.log('   3. Validar en producción:');
console.log('      Abre app.triggui.com varias veces — cada apertura debe ser un universo único');
console.log('');
console.log('🔄 PARA REVERTIR:');
console.log('   - Manual: borrar el bloque <script id="' + BLOCK_ID + '"> en public/index.html');
console.log('   - Backup: cp ' + path.basename(backupPath) + ' public/index.html');
