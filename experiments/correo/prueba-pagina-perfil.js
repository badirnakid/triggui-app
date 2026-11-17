// Pruebas de /perfil de triggui.com (C477, paso 2) con respuestas simuladas de Apps Script, en Chromium.
// Uso: node experiments/correo/prueba-pagina-perfil.js RAIZ_DE_TRIGGUI_COM   (el repositorio badirnakid/triggui.com)
'use strict';
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const raiz = process.argv[2];
if (!raiz || !fs.existsSync(path.join(raiz, 'perfil.html'))) { console.error('Falta la raíz de triggui.com con perfil.html'); process.exit(2); }
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
  const texto = async (p, sel) => (await p.locator(sel).first().innerText()).trim();

  async function pagina(respuestas) {
    const ctx = await navegador.newContext();
    const p = await ctx.newPage();
    const llamadas = [];
    const fallos = [];
    p.on('pageerror', e => fallos.push(String(e)));
    await p.route('https://script.google.com/**', async route => {
      llamadas.push(route.request().url());
      const r = respuestas.shift();
      if (r === 'abortar' || r === undefined) return route.abort();
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(r) });
    });
    await p.route('https://triggui.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>triggui</p>' }));
    await p.route('**/_vercel/insights/script.js', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    return { p, ctx, llamadas, fallos };
  }
  async function prueba(nombre, fn) { await fn(); pruebas++; console.log('✔ ' + nombre); }
  const Q = '?email=ana%40ejemplo.com&token=' + 'a'.repeat(32);

  await prueba('/perfil sin datos, o con un perfil que no existe: dice cómo cambiarlo y no llama', async () => {
    for (const q of ['', '?l=en', Q + '&p=todos', Q.replace(/&token=a+/, '') + '&p=kids']) {
      const { p, ctx, llamadas, fallos } = await pagina([]);
      await p.goto(base + '/perfil.html' + q);
      assert.ok(await visible(p, 'state-sin-datos'), q);
      assert.ok(!(await visible(p, 'state-confirm')));
      assert.strictEqual(llamadas.length, 0);
      assert.deepStrictEqual(fallos, []);
      await ctx.close();
    }
  });

  await prueba('/perfil a Kids en español: pregunta, no llama sin el clic, y «Listo, Ana.» con la llamada correcta', async () => {
    const { p, ctx, llamadas } = await pagina([{ ok: true, first_name: 'Ana', perfil: 'kids', changed: true }]);
    await p.goto(base + '/perfil.html' + Q + '&p=kids&l=es');
    assert.strictEqual(await texto(p, '#tituloConfirm'), '¿Cambiar a Triggui Kids?');
    assert.strictEqual(await texto(p, '#btnSi'), 'Sí, cambiar a Kids');
    await p.waitForTimeout(300);
    assert.strictEqual(llamadas.length, 0, 'abrir la página no cambia nada: hace falta el clic');
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-success', { state: 'visible' });
    assert.strictEqual(await texto(p, '#mensaje'), 'Listo, Ana.');
    assert.ok(/Desde tu próximo correo recibes Triggui Kids/.test(await texto(p, '#subExito')));
    const u = new URL(llamadas[0]);
    assert.deepStrictEqual([u.searchParams.get('action'), u.searchParams.get('email'), u.searchParams.get('p'), u.searchParams.get('format')],
      ['perfil', 'ana@ejemplo.com', 'kids', 'json']);
    assert.strictEqual(await p.getAttribute('html', 'lang'), 'es');
    await ctx.close();
  });

  await prueba('/perfil a adultos en inglés: sus textos, y «Done.» sin nombre', async () => {
    const { p, ctx } = await pagina([{ ok: true, first_name: '', perfil: 'adultos', changed: true }]);
    await p.goto(base + '/perfil.html' + Q + '&p=adultos&l=en');
    assert.strictEqual(await texto(p, '#tituloConfirm'), 'Back to Triggui for adults?');
    assert.strictEqual(await p.getAttribute('html', 'lang'), 'en');
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-success', { state: 'visible' });
    assert.strictEqual(await texto(p, '#mensaje'), 'Done.');
    await ctx.close();
  });

  await prueba('/perfil enlace viejo o sin perfil: lo dice; «Mejor no» lleva a triggui.com sin llamar', async () => {
    for (const r of [{ ok: false, error: 'token' }, { ok: false, error: 'parametros' }]) {
      const { p, ctx } = await pagina([r]);
      await p.goto(base + '/perfil.html' + Q + '&p=kids');
      await p.click('#btn-confirm');
      await p.waitForSelector('#state-viejo', { state: 'visible' });
      assert.ok(!(await visible(p, 'state-success')));
      await ctx.close();
    }
    const { p, ctx, llamadas } = await pagina([]);
    await p.goto(base + '/perfil.html' + Q + '&p=kids');
    await Promise.all([p.waitForURL('https://triggui.com/'), p.click('#btn-stay')]);
    assert.strictEqual(llamadas.length, 0);
    await ctx.close();
  });

  await prueba('/perfil error interno, otra respuesta o sin red: lo dicen, nunca «Listo»; «Intentar de nuevo» repite', async () => {
    const { p, ctx, llamadas } = await pagina([{ ok: false, error: 'interno' }, { ok: true, perfil: 'adultos' }, 'abortar', { ok: true, first_name: 'Ana', perfil: 'kids' }]);
    await p.goto(base + '/perfil.html' + Q + '&p=kids&l=es');
    await p.click('#btn-confirm');
    await p.waitForSelector('#state-error', { state: 'visible' });
    assert.strictEqual(await texto(p, '#errorDetalle'), 'Intenta de nuevo en unos minutos.');
    await p.click('#btn-reintentar');
    await p.waitForSelector('#state-error', { state: 'visible' });
    assert.ok(!(await visible(p, 'state-success')), 'un «ok» de otro perfil no es «Listo»');
    await p.click('#btn-reintentar');
    await p.waitForSelector('#state-error', { state: 'visible' });
    assert.strictEqual(await texto(p, '#errorDetalle'), 'Revisa tu conexión e intenta de nuevo.');
    await p.click('#btn-reintentar');
    await p.waitForSelector('#state-success', { state: 'visible' });
    assert.strictEqual(llamadas.length, 4);
    await ctx.close();
  });

  await prueba('/perfil en 320, 390 y 1280 de ancho: sin desborde', async () => {
    for (const ancho of [320, 390, 1280]) {
      const ctx = await navegador.newContext({ viewport: { width: ancho, height: 800 } });
      const p = await ctx.newPage();
      await p.route('**/_vercel/insights/script.js', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
      await p.goto(base + '/perfil.html' + Q + '&p=kids&l=es');
      const scroll = await p.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(scroll <= ancho, ancho + ': ' + scroll);
      await ctx.close();
    }
  });

  await navegador.close();
  servidor.close();
  console.log(`\n${pruebas} pruebas en verde`);
})().catch(e => { console.error(e); process.exit(1); });
