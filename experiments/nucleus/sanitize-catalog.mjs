#!/usr/bin/env node
/**
 * sanitize-catalog.mjs — v3.0 NIVEL DIOS CUÁNTICO-QUARK
 *
 * CLI wrapper sobre sanitize-walker.js. Toda la lógica de sanitización vive
 * en el módulo importado — este archivo solo orquesta I/O y reporting.
 *
 * USOS:
 *   node sanitize-catalog.mjs                          (defaults)
 *   node sanitize-catalog.mjs file1.json file2.json    (paths específicos)
 *   SANITIZE_NO_BACKUP=1 node sanitize-catalog.mjs     (modo CI/CD)
 *   node sanitize-catalog.mjs --help                   (ayuda)
 *
 * ARQUITECTURA:
 *   - Walker + sanitización: sanitize-walker.js (módulo puro)
 *   - Este archivo: lectura, backup, atomic write, reporting, exit codes
 *
 * IDEMPOTENTE: si el archivo ya está limpio, no rescribe.
 * ATÓMICO: usa tmp + rename. Si la sanitización falla la verificación,
 *   restaura backup automáticamente.
 *
 * REFERENCIA: TRIGGUI_ARCHIVO_MAESTRO_V10.md §30.3
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  sanitizeAndSerialize,
  countResidualControlChars,
  formatStats
} from './sanitize-walker.js';

// ═══════════════════════════════════════════════════════════════════
// CLI args + flags
// ═══════════════════════════════════════════════════════════════════

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('sanitize-catalog v3.0 — CLI wrapper sobre sanitize-walker.js');
  console.log('');
  console.log('Usage:');
  console.log('  node sanitize-catalog.mjs [--no-backup] [path1.json] [path2.json] ...');
  console.log('  SANITIZE_NO_BACKUP=1 node sanitize-catalog.mjs ...');
  console.log('');
  console.log('Sin paths → usa defaults (contenido.json + contenido_kids.json en triggui-content).');
  console.log('Con paths → sanitiza solo esos archivos.');
  console.log('');
  console.log('Exit codes:');
  console.log('  0 → todo OK (limpio o ya estaba limpio)');
  console.log('  1 → algún archivo falló (verificación, parse, IO)');
  process.exit(0);
}

const CLI_ARGS = process.argv.slice(2).filter(a => !a.startsWith('--'));
const TARGETS = CLI_ARGS.length > 0 ? CLI_ARGS : [
  '/workspaces/triggui-content/contenido.json',
  '/workspaces/triggui-content/contenido_kids.json'
];
const SKIP_BACKUP = process.env.SANITIZE_NO_BACKUP === '1' || process.argv.includes('--no-backup');

// ═══════════════════════════════════════════════════════════════════
// Pipeline
// ═══════════════════════════════════════════════════════════════════

console.log('═══ sanitize-catalog v3.0 NIVEL DIOS CUÁNTICO-QUARK ═══');
console.log(`   walker: sanitize-walker.js (modulo puro)`);
console.log(`   skip_backup: ${SKIP_BACKUP}`);
console.log('');

let totalErrors = 0;
let totalChars = 0;

for (const target of TARGETS) {
  const filename = path.basename(target);
  console.log(`▸ ${filename}`);

  // Existence
  try { await fs.access(target); }
  catch {
    console.log('  (no existe — skip)');
    console.log('');
    continue;
  }

  // Read + parse
  let raw, data;
  try {
    raw = await fs.readFile(target, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error(`  FAIL: ${e.message}`);
    console.log('');
    totalErrors++;
    continue;
  }

  // Pre-count (cuántos chars sucios había)
  const preCount = countResidualControlChars(raw);

  // Sanitize (módulo puro hace todo el trabajo)
  const { json, stats, modified, residual } = sanitizeAndSerialize(data);

  // Verificación matemática post-sanitize
  if (residual !== 0) {
    console.error(`  FAIL: ${residual} control chars residuales tras sanitize`);
    console.error(`        Esto es un bug del walker — reportar.`);
    console.log('');
    totalErrors++;
    continue;
  }

  // Si nada cambió, skip write (idempotencia)
  if (!modified) {
    console.log(`  ✓ ya limpio (0 control chars, 0 modificaciones)`);
    console.log('');
    continue;
  }

  // Backup antes de escribir (si aplica)
  let backupPath = null;
  if (!SKIP_BACKUP) {
    backupPath = `${target}.backup-sanitize-${Date.now()}.json`;
    try {
      await fs.copyFile(target, backupPath);
    } catch (e) {
      console.error(`  FAIL backup: ${e.message}`);
      console.log('');
      totalErrors++;
      continue;
    }
  }

  // Atomic write (tmp + rename)
  const tmp = `${target}.tmp-${Date.now()}`;
  try {
    await fs.writeFile(tmp, json, 'utf8');
    await fs.rename(tmp, target);
  } catch (e) {
    console.error(`  FAIL write: ${e.message}`);
    // Restore from backup si existe
    if (backupPath) {
      try { await fs.copyFile(backupPath, target); console.log('  ✓ backup restaurado'); }
      catch (_) {}
    }
    try { await fs.unlink(tmp); } catch (_) {}
    console.log('');
    totalErrors++;
    continue;
  }

  // Reporte
  if (backupPath) console.log(`  backup:        ${path.basename(backupPath)}`);
  console.log(`  pre-sanitize:  ${preCount} control chars`);
  console.log(`  cleanup:       ${formatStats(stats)}`);
  console.log(`  post-sanitize: 0 control chars (verificado matematicamente)`);
  console.log('  ✓ limpio');
  console.log('');

  totalChars += preCount;
}

// ═══════════════════════════════════════════════════════════════════
// Verificación final independiente
// ═══════════════════════════════════════════════════════════════════

console.log('═══ Verificación final independiente ═══');
let finalTotal = 0;
for (const target of TARGETS) {
  try {
    const raw = await fs.readFile(target, 'utf8');
    const count = countResidualControlChars(raw);
    finalTotal += count;
    const mark = count === 0 ? '✓' : '✗';
    console.log(`  ${mark} ${path.basename(target)}: ${count} control chars`);
  } catch (_) {
    console.log(`  - ${path.basename(target)}: (no existe)`);
  }
}

console.log('');

if (totalErrors === 0 && finalTotal === 0) {
  if (totalChars > 0) {
    console.log(`🎯 NIVEL DIOS CUANTICO-QUARK — ${totalChars} chars exterminados, 0 residuales`);
  } else {
    console.log('🎯 NIVEL DIOS CUANTICO-QUARK — todos los catalogos ya estaban limpios');
  }
  process.exit(0);
} else {
  console.error(`FAIL — errores: ${totalErrors}, residuales: ${finalTotal}`);
  process.exit(1);
}
