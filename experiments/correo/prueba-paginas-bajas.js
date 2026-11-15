// Pruebas de /entendido, /idioma y las dos copias v19 de triggui.com con respuestas simuladas de Apps Script.
// Uso: node experiments/correo/prueba-paginas-bajas.js RAIZ_DE_TRIGGUI_COM   (el repositorio badirnakid/triggui.com)
'use strict';
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const raiz = process.argv[2];
const servidor = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const f = path.join(raiz, decodeURIComponent(u.pathname));
  if (fs.existsSync(f) && fs.statSync(f).isFile()) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(fs.readFileSync(f)); }
  else { res.writeHead(404); res.end('no'); }
});

(async () => {
  await new Promise(r => servidor.listen(0, r));
  const base = 'http://127.0.0.1:' + servidor.address().port;
  const navegador = await chromium.launch();
  let pruebas = 0;
  const visible = async (p, id) => p.locator('#' + id).isVisible();

  async function pagina(respuestas) {
    // respuestas: lista de funciones (url) => {json} | 'abortar', una por llamada a Apps Script, en orden
    const ctx = await navegador.newContext();
    const p = await ctx.newPage();
    const llamadas = [];
    await p.route('https://script.google.com/**', async route => {
      const url = route.request().url();
      llamadas.push(url);
      const r = respuestas.shift();
      if (r === 'abortar' || r === undefined) return route.abort();
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(r) });
    });
    await p.route('https://triggui.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>triggui</p>' }));
    return { p, ctx, llamadas };
  }
  async function prueba(nombre, fn) { await fn(); pruebas++; console.log('✔ ' + nombre); }
  const Q = '?email=ana%40ejemplo.com&token=' + 'a'.repeat(32);

  // ── /entendido ────────────────────────────────────────────────────────────
  await prueba('/entendido sin datos: dice cómo darse de baja, no «Entendido»', async () => {
    const { p, ctx, llamadas } = await pagina([]);
    await p.goto(base + '/entendido.html');
    assert.ok(await visible(p, 'state-sin-datos'));
    assert.ok(!(await visible(p, 'state-success')));
    assert.strictEqual(llamadas.length, 0);
    await ctx.close();
  });
  await prueba('/entendido baja que quedó: «Entendido, Ana.» y la llamada correcta', async () => {
    const { p, ctx, llamadas } = await pagina([{ ok: true, first_name: 'Ana' }]);
    await p.goto(base + '/entendido.html' + Q);
    assert.ok(await visible(p, 'state-confirm'));
    assert.strictEqual(llamadas.length, 0, 'no llama antes del clic (los escáneres no dan de baja)');
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-success:not(.hidden)');
    assert.strictEqual(await p.textContent('#mensaje'), 'Entendido, Ana.');
    const u = new URL(llamadas[0]);
    assert.deepStrictEqual([u.searchParams.get('action'), u.searchParams.get('email'), u.searchParams.get('token'), u.searchParams.get('format')], ['unsubscribe', 'ana@ejemplo.com', 'a'.repeat(32), 'json']);
    await ctx.close();
  });
  await prueba('/entendido con la aplicación de hoy (ok sin nombre): «Entendido.»', async () => {
    const { p, ctx } = await pagina([{ ok: true, first_name: '' }]);
    await p.goto(base + '/entendido.html' + Q);
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-success:not(.hidden)');
    assert.strictEqual(await p.textContent('#mensaje'), 'Entendido.');
    await ctx.close();
  });
  await prueba('/entendido enlace viejo: lo dice, pide uno nuevo y avisa que revise su correo', async () => {
    const { p, ctx, llamadas } = await pagina([{ ok: false, error: 'token' }, { ok: true }]);
    await p.goto(base + '/entendido.html' + Q);
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-viejo:not(.hidden)');
    assert.ok(!(await visible(p, 'state-success')));
    await p.click('#btn-nuevo');
    await p.waitForSelector('#state-enviado:not(.hidden)');
    const u = new URL(llamadas[1]);
    assert.deepStrictEqual([u.searchParams.get('action'), u.searchParams.get('email'), u.searchParams.get('token'), u.searchParams.get('format')], ['nuevo_enlace', 'ana@ejemplo.com', null, 'json']);
    await ctx.close();
  });
  await prueba('/entendido enlace viejo y «parametros» se tratan igual', async () => {
    const { p, ctx } = await pagina([{ ok: false, error: 'parametros' }]);
    await p.goto(base + '/entendido.html' + Q);
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-viejo:not(.hidden)');
    await ctx.close();
  });
  await prueba('/entendido enlace viejo y «Mantenerme suscrito» lleva a triggui.com', async () => {
    const { p, ctx } = await pagina([{ ok: false, error: 'token' }]);
    await p.goto(base + '/entendido.html' + Q);
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-viejo:not(.hidden)');
    await Promise.all([p.waitForURL('https://triggui.com/**'), p.click('#btn-quedarme')]);
    await ctx.close();
  });
  await prueba('/entendido enlace nuevo con tope o con correo incompleto: lo dice, sin reintento', async () => {
    for (const [err, titulo] of [['tope', 'Hoy ya mandamos muchos enlaces'], ['correo', 'El enlace está incompleto']]) {
      const { p, ctx } = await pagina([{ ok: false, error: 'token' }, { ok: false, error: err }]);
      await p.goto(base + '/entendido.html' + Q);
      await p.click('#btn-confirm');
      await p.waitForSelector('#state-viejo:not(.hidden)');
      await p.click('#btn-nuevo');
      await p.waitForSelector('#state-error:not(.hidden)');
      assert.strictEqual(await p.textContent('#error-titulo'), titulo);
      assert.ok(!(await p.locator('#btn-reintentar').isVisible()));
      await ctx.close();
    }
  });
  await prueba('/entendido error interno: lo dice y «Intentar de nuevo» repite la baja', async () => {
    const { p, ctx, llamadas } = await pagina([{ ok: false, error: 'interno' }, { ok: true, first_name: 'Ana' }]);
    await p.goto(base + '/entendido.html' + Q);
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-error:not(.hidden)');
    assert.strictEqual(await p.textContent('#error-titulo'), 'No pudimos confirmar tu baja');
    await p.click('#btn-reintentar');
    await p.waitForSelector('#state-success:not(.hidden)');
    assert.strictEqual(new URL(llamadas[1]).searchParams.get('action'), 'unsubscribe');
    await ctx.close();
  });
  await prueba('/entendido sin red: lo dice, no «Entendido»', async () => {
    const { p, ctx } = await pagina(['abortar']);
    await p.goto(base + '/entendido.html' + Q);
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-error:not(.hidden)');
    assert.strictEqual(await p.textContent('#error-detalle'), 'Revisa tu conexión e intenta de nuevo.');
    assert.ok(!(await visible(p, 'state-success')));
    await ctx.close();
  });
  await prueba('/entendido respuesta que no es JSON (la aplicación de hoy no conoce nuevo_enlace): error, no «revisa tu correo»', async () => {
    const { p, ctx } = await pagina([{ ok: false, error: 'token' }]);
    await p.route('https://script.google.com/**', route => route.fulfill({ status: 200, contentType: 'text/plain', headers: { 'Access-Control-Allow-Origin': '*' }, body: '🌒 Triggui Apps Script V24 — endpoint activo' }));
    await p.goto(base + '/entendido.html' + Q);
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-error:not(.hidden)');
    await ctx.close();
  });

  // ── /idioma ───────────────────────────────────────────────────────────────
  await prueba('/idioma sin datos, en inglés: dice cómo cambiarlo', async () => {
    const { p, ctx } = await pagina([]);
    await p.goto(base + '/idioma.html?l=en');
    assert.ok(await visible(p, 'state-sin-datos'));
    assert.strictEqual(await p.textContent('#sinDatosTitulo'), 'To change your language');
    await ctx.close();
  });
  await prueba('/idioma cambio que quedó y reenviado', async () => {
    const { p, ctx, llamadas } = await pagina([{ ok: true, first_name: 'Ana', resent: true }]);
    await p.goto(base + '/idioma.html' + Q + '&l=en');
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-success:not(.hidden)');
    assert.strictEqual(await p.textContent('#mensaje'), 'Done, Ana.');
    assert.ok((await p.textContent('#subExito')).startsWith('This week'));
    assert.strictEqual(new URL(llamadas[0]).searchParams.get('l'), 'en');
    await ctx.close();
  });
  await prueba('/idioma enlace viejo: lo dice en su idioma', async () => {
    for (const [l, titulo] of [['en', 'This link no longer works'], ['es', 'Este enlace ya no sirve']]) {
      const { p, ctx } = await pagina([{ ok: false, error: 'token' }]);
      await p.goto(base + '/idioma.html' + Q + '&l=' + l);
      await p.click('#btn-confirm');
      await p.waitForSelector('#state-viejo:not(.hidden)');
      assert.strictEqual(await p.textContent('#viejoTitulo'), titulo);
      assert.ok(!(await visible(p, 'state-success')));
      await ctx.close();
    }
  });
  await prueba('/idioma error interno y sin red: lo dicen; «Intentar de nuevo» repite', async () => {
    const { p, ctx } = await pagina([{ ok: false, error: 'interno' }, 'abortar', { ok: true, first_name: '', resent: false }]);
    await p.goto(base + '/idioma.html' + Q + '&l=es');
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-error:not(.hidden)');
    assert.strictEqual(await p.textContent('#errorDetalle'), 'Intenta de nuevo en unos minutos.');
    await p.click('#btn-reintentar');
    await p.waitForFunction(() => document.getElementById('errorDetalle').textContent.startsWith('Revisa'));
    await p.click('#btn-reintentar');
    await p.waitForSelector('#state-success:not(.hidden)');
    await ctx.close();
  });

  // ── las copias v19 ────────────────────────────────────────────────────────
  await prueba('/entendido-v19 lleva a /entendido con los mismos datos; /index-v19 a la portada', async () => {
    const { p, ctx, llamadas } = await pagina([]);
    await p.goto(base + '/entendido-v19.html' + Q);
    await p.waitForURL(base + '/entendido' + Q);
    await p.goto(base + '/index-v19.html');
    await p.waitForURL(base + '/');
    assert.strictEqual(llamadas.length, 0);
    await ctx.close();
  });

  await navegador.close();
  servidor.close();
  console.log(`\n${pruebas} pruebas en verde`);
})().catch(e => { console.error(e); process.exit(1); });
