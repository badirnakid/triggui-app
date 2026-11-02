#!/usr/bin/env node
/*
 * Sonda del banco de C278 (2 de noviembre de 2026): antes de hornear diez ediciones, unas pocas llamadas baratas.
 *
 *   · Dice si están las llaves (presente o falta; nunca su valor ni su largo).
 *   · Con Claude: cada esquema grande del pipeline se manda una vez a Haiku 5.5, para saber si la API lo compila
 *     («Schema is too complex» sería un 400); Sonnet 5.5 una vez con su forma de pensar; el «escritor» (Haiku 5.5 con
 *     pensamiento adaptativo) con el esquema de la tarjeta; y una llamada de JSON libre.
 *   · Con OpenAI: una llamada mínima, para saber que la llave sirve.
 *
 * Sale con 1 si algo de lo anterior falla, y el banco no corre. Uso (desde la raíz de triggui-app):
 *   TRIGGUI_CONTENT_ROOT=triggui-content node ia/banco/sonda.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const IA = require(path.join(RAIZ, 'ia', 'ia.cjs'));
const CONTENIDO = path.resolve(RAIZ, process.env.TRIGGUI_CONTENT_ROOT || 'triggui-content');

let fallas = 0;
const linea = (ok, texto) => { if (!ok) fallas++; console.log(`${ok ? '✔' : '✘'} ${texto}`); };
const hay = (k) => !!String(process.env[k] || '').trim();

linea(hay('ANTHROPIC_API_KEY'), `ANTHROPIC_API_KEY ${hay('ANTHROPIC_API_KEY') ? 'presente' : 'FALTA'}`);
linea(hay('OPENAI_KEY') || hay('OPENAI_API_KEY'), `llave de OpenAI ${hay('OPENAI_KEY') || hay('OPENAI_API_KEY') ? 'presente' : 'FALTA'}`);
if (fallas) { console.log('\nSin las dos llaves no tiene caso hornear el banco.'); process.exit(1); }

const esquemas = [];
const nucleo = JSON.parse(fs.readFileSync(path.join(RAIZ, 'experiments/nucleus/edition-nucleus.schema.json'), 'utf8'));
for (const v of Object.values(nucleo)) if (v && v.schema && v.strict) esquemas.push(v);
for (const f of ['musica-queries.json', 'musica-armonia.json', 'video-armonia.json']) {
  const ruta = path.join(CONTENIDO, 'prompts', 'schemas', f);
  if (fs.existsSync(ruta)) esquemas.push(JSON.parse(fs.readFileSync(ruta, 'utf8')));
}

async function prueba(proveedor, nombre, params) {
  process.env.TRIGGUI_IA_PROVEEDOR = proveedor;
  const t0 = Date.now();
  try {
    const r = await IA.crearCliente().chat.completions.create(params, { timeout: 120000 });
    const fin = r.choices[0].finish_reason;
    const sr = (r._claude && r._claude.stop_reason) || fin;
    const bien = !r.choices[0].message.refusal;
    linea(bien, `${proveedor} · ${nombre}: ${sr} · ${r.usage.prompt_tokens} de entrada, ${r.usage.completion_tokens} de salida · ${Date.now() - t0} ms`);
    return r;
  } catch (e) {
    linea(false, `${proveedor} · ${nombre}: ${e.status || ''} ${String(e.message).slice(0, 240)}`);
    return null;
  }
}

console.log(`\nClaude: ${esquemas.length} esquemas del pipeline (¿los compila la API?)`);
for (const e of esquemas) {
  await prueba('claude', e.name, {
    model: 'mini', max_tokens: 1024,
    response_format: { type: 'json_schema', json_schema: { name: e.name, strict: true, schema: e.schema } },
    messages: [{ role: 'system', content: 'Devuelve un ejemplo mínimo y válido de este esquema, con textos de pocas palabras.' }, { role: 'user', content: 'Ejemplo.' }]
  });
}
console.log('\nClaude: los papeles y el JSON libre');
await prueba('claude', 'grande (Sonnet 5.5)', { model: 'grande', max_tokens: 1024, messages: [{ role: 'user', content: 'Responde solo: listo.' }] });
const contentES = esquemas.find((e) => e.name === 'ContentES');
if (contentES) {
  await prueba('claude', 'escritor (Haiku 5.5 que piensa) con ContentES', {
    model: 'escritor', max_tokens: 6000,
    response_format: { type: 'json_schema', json_schema: { name: contentES.name, strict: true, schema: contentES.schema } },
    messages: [{ role: 'system', content: 'Devuelve un ejemplo mínimo y válido de este esquema, con textos de pocas palabras.' }, { role: 'user', content: 'Ejemplo.' }]
  });
}
const libre = await prueba('claude', 'JSON libre (json_object)', { model: 'mini', response_format: { type: 'json_object' }, messages: [{ role: 'user', content: 'Devuelve {"ok": true}.' }] });
if (libre) linea(libre._claude.json_ok === true, `claude · el JSON libre llegó limpio (${libre.choices[0].message.content})`);

console.log('\nOpenAI: la llave');
await prueba('openai', 'mini', { model: 'mini', max_tokens: 5, messages: [{ role: 'user', content: 'Di ok.' }] });

console.log(fallas ? `\n✘ ${fallas} problema(s): el banco no corre hasta resolverlos.` : '\n✔ Todo listo para el banco.');
process.exit(fallas ? 1 : 0);
