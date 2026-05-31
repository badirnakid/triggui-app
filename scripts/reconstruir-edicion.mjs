#!/usr/bin/env node
/**
 * reconstruir-edicion.mjs — 🔁 RECONSTRUCCIÓN DETERMINISTA (Nivel dios cuántico-quark)
 * ─────────────────────────────────────────────────────────────────────────────
 * Regenera los 3 assets de imagen de una edición YA existente en el catálogo
 * (index.html, tarjeta.png, og.png) SIN llamar al LLM y SIN tocar el contenido.
 *
 *   Mismo código + mismos datos − LLM  =  output idéntico, gratis, instantáneo.
 *
 * Para el caso real: "borré la tarjeta.png por error pero me gustaba — quiero
 * exactamente la misma". El contenido sigue intacto en contenido.json; esto solo
 * re-renderiza las imágenes desde esos datos.
 *
 * NO modifica ningún generador (build-editions.py, build-tarjeta-png.js,
 * build-og-image.js son sagrados). Truco arquitectónico: los dos PNG renderizan
 * contenido.libros[0]; build-editions.py usa find_libro_by_meta(titulo+autor).
 * Así que alimentamos a los tres un JSON de UN solo libro (el objetivo en [0]) —
 * los tres convergen al mismo libro sin tocarlos.
 *
 * USO:
 *   RECONSTRUIR="Tu momento es ahora | Victor Hugo Manzanilla" node scripts/reconstruir-edicion.mjs
 *   RECONSTRUIR="Tu momento es ahora" node scripts/reconstruir-edicion.mjs      # sin autor: match por título
 *   node scripts/reconstruir-edicion.mjs --titulo "Tu momento es ahora" --autor "Victor Hugo Manzanilla"
 *   DRY_RUN=1 RECONSTRUIR="..." node scripts/reconstruir-edicion.mjs            # resuelve y prepara, no genera
 *
 * SOURCE del catálogo (primero que exista):
 *   RECONSTRUIR_SOURCE (override) → contenido_edicion.json → contenido.json → triggui-content/contenido.json
 *
 * Debe correrse desde la RAÍZ del repo (los generadores usan rutas relativas a scripts/).
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

/* ═══════════════════════════════════════════════════════════════
   slugify — RÉPLICA EXACTA de validate-book.js (línea 170).
   Cero deriva: el slug DEBE coincidir con el folder original en public/t/.
═══════════════════════════════════════════════════════════════ */
function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

// Normalización tolerante para emparejar el INPUT del usuario contra el catálogo
// (acento-insensible + minúsculas + colapsa espacios). Una vez encontrado el libro,
// usamos su titulo/autor VERBATIM en los temp-files, así build-editions.py empareja exacto.
function normLoose(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ═══════════════════════════════════════════════════════════════
   Parseo de input
═══════════════════════════════════════════════════════════════ */
function parseInput() {
  const args = process.argv.slice(2);
  let titulo = "";
  let autor = "";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--titulo" && args[i + 1]) { titulo = args[++i]; continue; }
    if (args[i] === "--autor" && args[i + 1]) { autor = args[++i]; continue; }
  }
  if (!titulo && process.env.RECONSTRUIR) {
    const raw = String(process.env.RECONSTRUIR);
    const parts = raw.split("|");
    titulo = (parts[0] || "").trim();
    autor = (parts[1] || "").trim();
  }
  return { titulo, autor };
}

/* ═══════════════════════════════════════════════════════════════
   Resolución del catálogo source (independiente de TRIGGUI_EDICION_JSON,
   que reservamos para apuntar al JSON de un libro al invocar generadores)
═══════════════════════════════════════════════════════════════ */
function resolveSourcePath() {
  const candidates = [
    process.env.RECONSTRUIR_SOURCE,
    "contenido_edicion.json",
    "contenido.json",
    path.join("triggui-content", "contenido.json"),
  ].filter(Boolean);
  for (const c of candidates) {
    try { if (fs.existsSync(c) && fs.statSync(c).isFile()) return c; } catch {}
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════
   Búsqueda del libro (espejo de la prioridad de find_libro_by_meta:
   título+autor exacto → título único → título+_edicion_numero)
═══════════════════════════════════════════════════════════════ */
function findBook(libros, qTitulo, qAutor) {
  const nt = normLoose(qTitulo);
  const na = normLoose(qAutor);
  if (!nt) return { error: "input sin título" };

  const byTitle = libros.filter((l) => l && normLoose(l.titulo) === nt);
  if (byTitle.length === 0) {
    // pista: títulos que contienen el query, para mensaje útil
    const near = libros
      .filter((l) => l && normLoose(l.titulo).includes(nt))
      .slice(0, 5)
      .map((l) => `"${l.titulo}"${l.autor ? " — " + l.autor : ""}`);
    return { error: "no-match", near };
  }
  if (na) {
    const byBoth = byTitle.filter((l) => normLoose(l.autor) === na);
    if (byBoth.length === 1) return { book: byBoth[0] };
    if (byBoth.length > 1) return { book: preferWithNum(byBoth) };
    // título coincide pero autor no: si el título es único, usarlo igual (con aviso)
    if (byTitle.length === 1) return { book: byTitle[0], autorMismatch: true };
  }
  if (byTitle.length === 1) return { book: byTitle[0] };
  // múltiples con mismo título y sin autor que discrimine
  return { book: preferWithNum(byTitle), ambiguous: byTitle.length };
}

function preferWithNum(arr) {
  const withNum = arr.filter((l) => Number.isInteger(l._edicion_numero));
  return (withNum[0] || arr[0]);
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
function main() {
  const { titulo, autor } = parseInput();
  if (!titulo) {
    console.error("❌ Falta el libro. Usa RECONSTRUIR=\"Título | Autor\" o --titulo \"...\".");
    process.exit(1);
  }

  const sourcePath = resolveSourcePath();
  if (!sourcePath) {
    console.error("❌ No encontré el catálogo (contenido_edicion.json / contenido.json / triggui-content/contenido.json).");
    console.error("   Corre desde la raíz del repo o define RECONSTRUIR_SOURCE.");
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  } catch (e) {
    console.error(`❌ No pude leer/parsear ${sourcePath}: ${e.message}`);
    process.exit(1);
  }
  if (!data || !Array.isArray(data.libros) || data.libros.length === 0) {
    console.error(`❌ ${sourcePath} no tiene .libros[].`);
    process.exit(1);
  }

  const res = findBook(data.libros, titulo, autor);
  if (res.error) {
    if (res.error === "no-match") {
      console.error(`❌ No encontré "${titulo}" en ${sourcePath} (${data.libros.length} libros).`);
      if (res.near && res.near.length) {
        console.error("   ¿Quisiste decir?");
        res.near.forEach((n) => console.error(`     • ${n}`));
      }
    } else {
      console.error(`❌ ${res.error}`);
    }
    process.exit(1);
  }

  const book = res.book;
  const slug = slugify(book.titulo);
  if (!slug) {
    console.error(`❌ slugify("${book.titulo}") salió vacío — no puedo derivar el folder.`);
    process.exit(1);
  }

  if (res.autorMismatch) {
    console.warn(`⚠️  El autor que diste no coincide, pero el título es único. Uso: "${book.titulo}" — ${book.autor || "?"}`);
  }
  if (res.ambiguous) {
    console.warn(`⚠️  ${res.ambiguous} libros con el título "${book.titulo}". Elegí el de _edicion_numero (o el primero).`);
  }

  // ── JSON de UN solo libro: el objetivo en [0] (los 3 generadores convergen) ──
  const singleJson = { libros: [book], meta: data.meta || {} };
  const SINGLE_PATH = "/tmp/triggui-reconstruir.json";
  fs.writeFileSync(SINGLE_PATH, JSON.stringify(singleJson), "utf8");

  // ── book_meta para los generadores (titulo+autor para el match, slug para el folder) ──
  const bookMeta = { titulo: book.titulo, autor: book.autor || "", slug };
  const portada = book.portada_url || book.portada || "";
  if (portada) bookMeta.portada = portada;
  const portadaSource = book.portada_source || book.source || "";
  if (portadaSource) bookMeta.portada_source = portadaSource;
  fs.writeFileSync("/tmp/triggui-book.json", JSON.stringify(bookMeta), "utf8");
  fs.writeFileSync("/tmp/triggui-slug.txt", slug, "utf8");

  const outBase = process.env.TRIGGUI_OUT_BASE || "public/t";
  const edNum = Number.isInteger(book._edicion_numero)
    ? ` (#${String(book._edicion_numero).padStart(3, "0")})` : "";

  console.log("🔁 RECONSTRUCCIÓN DETERMINISTA — Nivel dios cuántico-quark");
  console.log(`   Source:   ${sourcePath} (${data.libros.length} libros)`);
  console.log(`   Libro:    "${book.titulo}"${edNum} — ${book.autor || "?"}`);
  console.log(`   Slug:     ${slug}`);
  console.log(`   Salida:   ${outBase}/${slug}/{index.html, tarjeta.png, og.png}`);
  console.log(`   Portada:  ${portada ? (portadaSource || "url") : "(tipográfica / desde libro)"}`);
  console.log(`   Single:   ${SINGLE_PATH} (objetivo en [0])`);
  console.log("");

  const childEnv = { ...process.env, TRIGGUI_EDICION_JSON: SINGLE_PATH, TRIGGUI_OUT_BASE: outBase };

  const steps = [
    { label: "edición viva (index.html)", cmd: "python3", args: ["scripts/build-editions.py"] },
    { label: "tarjeta.png", cmd: "node", args: ["scripts/build-tarjeta-png.js"] },
    { label: "og.png", cmd: "node", args: ["scripts/build-og-image.js"] },
  ];

  if (process.env.DRY_RUN) {
    console.log("🧪 DRY_RUN — temp-files preparados. Comandos que se correrían (desde la raíz del repo):");
    for (const s of steps) console.log(`   TRIGGUI_EDICION_JSON=${SINGLE_PATH} ${s.cmd} ${s.args.join(" ")}`);
    console.log("\n✅ DRY_RUN OK — resolución y preparación verificadas, sin generar imágenes.");
    return;
  }

  let failed = 0;
  for (const s of steps) {
    console.log(`▸ Generando ${s.label}…`);
    const r = spawnSync(s.cmd, s.args, { cwd: process.cwd(), env: childEnv, stdio: "inherit" });
    if (r.status !== 0) {
      failed++;
      console.error(`❌ Falló: ${s.label} (exit ${r.status === null ? "señal/" + r.signal : r.status})`);
    }
  }

  console.log("");
  if (failed === 0) {
    console.log(`✅ Reconstrucción completa — 3/3 assets regenerados idénticos en ${outBase}/${slug}/`);
  } else {
    console.error(`❌ Reconstrucción incompleta: ${failed}/3 generadores fallaron. Revisa el log arriba.`);
    process.exit(1);
  }
}

main();
