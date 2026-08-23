/* ═══════════════════════════════════════════════════════════════════════════
   TRIGGUI · CAJA NEGRA v1 (caja.js)
   Grabadora de vuelo de la experiencia: toques, estado, errores, red, analitica, navegacion.
   - Apagada por defecto: un lector normal solo tiene un detector de 5 toques en la esquina.
   - Se arma con 5 toques seguidos en la esquina superior izquierda (zona 56x56 px).
   - Armada, graba continuo en localStorage (sobrevive app → espiral → regreso) hasta APAGAR.
   - EXPORTAR copia todo el registro como texto; LIMPIAR vacia; APAGAR desarma y oculta.
   - Cada superficie define window.__cajaEstado() para incluir su estado interno en cada toque.
   Sin dependencias, ES5, sin costo de red ni de servidor.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__caja) return;
  var LS = 'triggui_caja', MAX = 500, ZONA = 56;
  var sup = (function () {
    var p = location.pathname;
    if (p.indexOf('/espiral') === 0) return 'esp';
    if (p.indexOf('/kids') === 0) return 'kid';
    if (p.indexOf('/t/') === 0) return 'ed';
    if (p.indexOf('/mi') === 0) return 'mi';
    return 'app';
  })();
  var st = leer();
  var panel = null, pre = null, t0 = st.t0 || 0;

  function leer() {
    try { var r = JSON.parse(localStorage.getItem(LS) || 'null'); if (r && r.e) return r; } catch (e) {}
    return { on: false, t0: 0, e: [] };
  }
  function guardar() { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) {} }
  function ms() { return Math.round(Date.now() - t0); }
  function nom(el) {
    if (!el || !el.tagName) return '?';
    var c = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/)[0] : '';
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (c ? '.' + c : '');
  }
  function corto(v, n) { v = String(v); return v.length > n ? v.slice(0, n) + '…' : v; }
  function estado() { try { return window.__cajaEstado ? JSON.stringify(window.__cajaEstado()) : ''; } catch (e) { return 'estado:' + e.message; } }
  function anota(tipo, txt) {
    if (!st.on) return;
    var l = '+' + ms() + ' [' + sup + '] ' + tipo + ' ' + txt;
    st.e.push(l); if (st.e.length > MAX) st.e.splice(0, st.e.length - MAX);
    guardar();
    if (pre) { pre.textContent += (pre.textContent ? '\n' : '') + l; pre.scrollTop = pre.scrollHeight; }
  }

  /* ---------- armado: 5 toques en la esquina ---------- */
  var catcher = document.createElement('div');
  catcher.id = 'caja-zona';
  catcher.setAttribute('aria-hidden', 'true');
  catcher.style.cssText = 'position:fixed;top:0;left:0;width:' + ZONA + 'px;height:calc(' + ZONA + 'px + env(safe-area-inset-top));z-index:2147483646;background:transparent;-webkit-tap-highlight-color:transparent;touch-action:manipulation;';
  var toques = [];
  catcher.addEventListener('pointerdown', function (e) {
    e.stopPropagation();
    var now = Date.now(); toques = toques.filter(function (x) { return now - x < 2500; }); toques.push(now);
    if (toques.length >= 5) { toques = []; if (st.on) { if (panel && panel.style.display !== 'none') panel.style.display = 'none'; else mostrar(); } else armar(); }
  }, true);
  catcher.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); }, true);

  function armar() {
    st = { on: true, t0: Date.now(), e: [] }; t0 = st.t0; guardar();
    cabecera('ARMADA');
    mostrar();
  }
  function apagar() {
    anota('caja', 'APAGADA');
    st.on = false; guardar();
    if (panel) panel.style.display = 'none';
  }
  function cabecera(motivo) {
    anota('nav', motivo + ' ' + location.href + ' ref=' + (document.referrer || '-'));
    var nv = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
    anota('nav', 'tipo=' + (nv ? nv.type : '?') + ' ua=' + navigator.userAgent);
    anota('nav', 'vp ' + window.innerWidth + 'x' + window.innerHeight + ' dpr ' + window.devicePixelRatio + ' escala ' + (window.visualViewport ? Math.round(window.visualViewport.scale * 100) / 100 : '-') + ' online=' + navigator.onLine + ' html=' + corto(document.documentElement.className, 80) + ' body=' + corto(document.body ? document.body.className : '', 80));
    anota('estado', estado());
  }

  /* ---------- panel ---------- */
  function mostrar() {
    if (!panel) {
      panel = document.createElement('div'); panel.id = 'caja';
      panel.style.cssText = 'position:fixed;left:8px;right:8px;bottom:calc(56px + env(safe-area-inset-bottom));height:42vh;background:rgba(0,0,0,.88);color:#9fe8d8;font:11px/1.35 ui-monospace,Menlo,monospace;border:1px solid #2d4a44;border-radius:10px;z-index:2147483647;display:flex;flex-direction:column;pointer-events:none;';
      pre = document.createElement('pre'); pre.style.cssText = 'flex:1;overflow:auto;padding:8px;white-space:pre-wrap;word-break:break-word;margin:0;';
      var pie = document.createElement('div'); pie.style.cssText = 'flex:none;display:flex;gap:6px;justify-content:flex-end;padding:6px 8px;border-top:1px solid #2d4a44;';
      function btn(t, fn, sec) { var b = document.createElement('button'); b.textContent = t; b.style.cssText = 'pointer-events:auto;font:700 11px/1 Manrope,sans-serif;letter-spacing:.12em;color:#fff;background:' + (sec ? '#3a3f4a' : '#1f6f5f') + ';border:0;border-radius:8px;padding:9px 11px;'; b.onclick = fn; return b; }
      pie.appendChild(btn('LIMPIAR', function () { st.e = []; st.t0 = Date.now(); t0 = st.t0; guardar(); pre.textContent = ''; cabecera('LIMPIA'); }, true));
      pie.appendChild(btn('APAGAR', function () { apagar(); }, true));
      var ex = btn('EXPORTAR', function () {
        var txt = 'TRIGGUI CAJA NEGRA · ' + new Date(st.t0).toISOString() + ' · ' + st.e.length + ' lineas\n' + st.e.join('\n');
        try { navigator.clipboard.writeText(txt).then(function () { ex.textContent = 'COPIADO'; setTimeout(function () { ex.textContent = 'EXPORTAR'; }, 1500); }, function () { window.prompt('Copia este texto:', txt); }); }
        catch (e) { window.prompt('Copia este texto:', txt); }
      });
      pie.appendChild(ex);
      panel.appendChild(pre); panel.appendChild(pie); document.body.appendChild(panel);
    }
    pre.textContent = st.e.join('\n'); pre.scrollTop = pre.scrollHeight;
    panel.style.display = 'flex';
  }

  /* ---------- grabacion (solo cuando esta armada) ---------- */
  var tDown = 0, pDownXY = null;
  function ev(e) {
    if (!st.on) return;
    if (e.target && e.target.closest && (e.target.closest('#caja') || e.target.closest('#caja-zona'))) return;
    var p = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;
    var x = Math.round(p.clientX || 0), y = Math.round(p.clientY || 0), t = performance.now();
    if (e.type === 'pointerdown') { tDown = t; pDownXY = [x, y]; }
    var extra = '';
    if (e.type === 'pointerup' || e.type === 'pointercancel') extra = ' dt=' + Math.round(t - tDown) + 'ms' + (pDownXY ? ' mov=' + Math.round(Math.hypot(x - pDownXY[0], y - pDownXY[1])) + 'px' : '');
    if (e.type === 'pointerup' || e.type === 'pointercancel' || e.type === 'click') extra += ' est=' + estado();
    anota('toque', e.type + ' ' + nom(e.target) + ' @' + x + ',' + y + (e.pointerType ? ' ' + e.pointerType : '') + extra);
  }
  ['pointerdown', 'pointerup', 'pointercancel', 'touchstart', 'touchend', 'touchcancel', 'click'].forEach(function (k) { document.addEventListener(k, ev, true); });

  window.addEventListener('error', function (e) { anota('ERROR', (e.message || '') + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { anota('ERROR', 'promesa: ' + corto((e.reason && (e.reason.message || e.reason)) || '?', 160)); });
  (function () { var o = console.error; console.error = function () { try { anota('console.error', corto(Array.prototype.map.call(arguments, function (a) { return (a && a.message) || String(a); }).join(' '), 200)); } catch (e) {} return o.apply(console, arguments); }; })();

  /* red: fetch (json, apps script, api) con tiempo y resultado */
  if (window.fetch) {
    var fo = window.fetch;
    window.fetch = function (u, o) {
      var url = (typeof u === 'string') ? u : (u && u.url) || '';
      var mira = st.on && /\.json|script\.google|triggui-api|googleapis/.test(url);
      var ta = performance.now();
      var r = fo.apply(this, arguments);
      if (mira) r.then(function (res) { anota('red', corto(url.replace(/\?.*$/, ''), 90) + ' → ' + res.status + ' ' + Math.round(performance.now() - ta) + 'ms' + (res.headers && res.headers.get('content-length') ? ' ' + res.headers.get('content-length') + 'B' : '')); }, function (err) { anota('red', corto(url, 90) + ' → FALLO ' + corto(err && err.message, 80) + ' ' + Math.round(performance.now() - ta) + 'ms'); });
      return r;
    };
  }

  /* analitica: track() de la app y gtag() */
  function envolverTrack() {
    if (typeof window.track === 'function' && !window.track.__caja) {
      var to = window.track; var w = function (n, p) { anota('track', n + (p ? ' ' + corto(JSON.stringify(p), 120) : '')); return to.apply(this, arguments); }; w.__caja = true; window.track = w;
    }
    if (typeof window.gtag === 'function' && !window.gtag.__caja) {
      var go = window.gtag; var g = function () { try { if (arguments[0] === 'event') anota('gtag', arguments[1] + (arguments[2] ? ' ' + corto(JSON.stringify(arguments[2]), 120) : '')); } catch (e) {} return go.apply(this, arguments); }; g.__caja = true; window.gtag = g;
    }
  }

  /* memoria: la foto del regreso y las llaves clave */
  (function () {
    var so = Storage.prototype.setItem, ro = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k, v) { try { if (/triggui_regreso|triggui_espiral|lastLibroIdx/.test(k)) anota('memoria', (this === window.sessionStorage ? 'session' : 'local') + '.set ' + k + ' ' + corto(String(v), 100)); } catch (e) {} return so.apply(this, arguments); };
    Storage.prototype.removeItem = function (k) { try { if (/triggui_regreso|triggui_espiral/.test(k)) anota('memoria', (this === window.sessionStorage ? 'session' : 'local') + '.del ' + k); } catch (e) {} return ro.apply(this, arguments); };
  })();

  /* clases del html (mood-active / booting / regresando) y de #hoja */
  function observarClases() {
    try {
      var ultimo = document.documentElement.className;
      new MutationObserver(function () { var c = document.documentElement.className; if (c !== ultimo) { anota('html', '"' + corto(ultimo, 60) + '" → "' + corto(c, 60) + '"'); ultimo = c; } }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      var hoja = document.getElementById('hoja');
      if (hoja) new MutationObserver(function () { anota('hoja', hoja.classList.contains('ver') ? 'ABIERTA' : 'cerrada'); }).observe(hoja, { attributes: true, attributeFilter: ['class'] });
      var ov = document.getElementById('barraMagicaOverlay');
      if (ov) { var uo = ''; new MutationObserver(function () { var s = getComputedStyle(ov); var v = s.display + '/' + s.opacity; if (v !== uo) { anota('barra', v); uo = v; } }).observe(ov, { attributes: true, attributeFilter: ['style', 'class'] }); }
    } catch (e) {}
  }

  /* ciclo de vida */
  window.addEventListener('pageshow', function (e) { anota('nav', 'pageshow persisted=' + e.persisted); });
  window.addEventListener('pagehide', function () { anota('nav', 'pagehide ' + location.pathname); });
  document.addEventListener('visibilitychange', function () { anota('nav', 'visibilidad=' + document.visibilityState); });
  window.addEventListener('resize', function () { anota('nav', 'resize ' + window.innerWidth + 'x' + window.innerHeight); });

  function alListo() {
    envolverTrack(); observarClases();
    if (document.body) document.body.appendChild(catcher);
    if (st.on) { cabecera('PAGINA'); anota('nav', 'DOMContentLoaded +' + Math.round(performance.now()) + 'ms'); }
    window.addEventListener('load', function () { anota('nav', 'load +' + Math.round(performance.now()) + 'ms'); setTimeout(envolverTrack, 0); });
    /* primer pintado util: app = bloques visibles; espiral = foco presente */
    var ini = performance.now(), n = 0;
    (function mira() {
      n++;
      var ok = sup === 'esp' ? !!document.querySelector('#foco') : !!document.querySelector('#grid .block.show, #grid .block');
      if (ok) { anota('pinta', (sup === 'esp' ? 'foco' : 'bloques') + ' +' + Math.round(performance.now()) + 'ms'); return; }
      if (performance.now() - ini < 15000) requestAnimationFrame(mira);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', alListo); else alListo();

  window.__caja = { nota: function (t) { anota('nota', String(t)); }, on: function () { return st.on; }, armar: armar, apagar: apagar, mostrar: mostrar };
})();
