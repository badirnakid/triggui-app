// gemelos-en.mjs — siembra authorial_voice_notes_en y pie_en (video) en contenido+manual
// Todo-o-nada por archivo: si una traducción falla tras reintento, NO se escribe nada.
import fs from "node:fs/promises";
import IA from "../ia/ia.cjs";   // C278: un solo lugar para la IA (proveedor, papel y llave)
if (!IA.hayLlave()) { console.error(IA.proveedor() === "claude" ? "Sin ANTHROPIC_API_KEY" : "Sin OPENAI_KEY"); process.exit(1); }
async function traducirLote(textos) {
  const body = { model: "mini", temperature: 0.2, response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Traduce fielmente al ingles cada texto (son notas editoriales internas y pies de video). Conserva tono y sentido exactos. Responde SOLO JSON: {\"t\":[...traducciones en el mismo orden...]}" },
      { role: "user", content: JSON.stringify({ textos }) }
    ] };
  for (let intento = 0; intento < 2; intento++) {
    try {
      const r = await IA.chatCompat(body);   // C278: misma petición con openai; con claude, la Messages API
      const j = await r.json();
      const out = JSON.parse(j.choices[0].message.content).t;
      if (Array.isArray(out) && out.length === textos.length && out.every(x => typeof x === "string" && x.trim())) return out;
    } catch (e) { console.error("  lote fallo:", String(e).slice(0,80)); }
  }
  return null;
}
async function procesar(archivo) {
  const raw = await fs.readFile(archivo, "utf8");
  const d = JSON.parse(raw);
  const tareas = [];
  for (const b of d.libros || []) {
    const an = b?._nucleus?.book_grounding_anchors;
    if (an && an.authorial_voice_notes && !an.authorial_voice_notes_en)
      tareas.push({ texto: an.authorial_voice_notes, set: (v) => { an.authorial_voice_notes_en = v; } });
    for (const c of b?._video?.candidatos || [])
      if (c.pie && !c.pie_en) tareas.push({ texto: c.pie, set: (v) => { c.pie_en = v; } });
  }
  console.log(`${archivo}: ${tareas.length} gemelos pendientes`);
  if (!tareas.length) return true;
  for (let i = 0; i < tareas.length; i += 20) {
    const lote = tareas.slice(i, i + 20);
    const out = await traducirLote(lote.map(t => t.texto));
    if (!out) { console.error(`ABORTO ${archivo}: lote ${i/20} irrecuperable — nada escrito`); return false; }
    lote.forEach((t, k) => t.set(out[k]));
    console.log(`  lote ${1 + i/20}/${Math.ceil(tareas.length/20)} ok`);
  }
  await fs.writeFile(archivo, JSON.stringify(d, null, 2) + "\n", "utf8");
  console.log(`  escrito ${archivo}`);
  return true;
}
const ok1 = await procesar("triggui-content/contenido.json");
const ok2 = await procesar("triggui-content/contenido_manual.json");
process.exit(ok1 && ok2 ? 0 : 1);
