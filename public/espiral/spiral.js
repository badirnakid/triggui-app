/* ============================================================
   TRESTME INSIGHTS · Motor de la espiral
   Helice cilindrica: 13 nodos = 1 vuelta = 1 trimestre.
   Proporcion aurea: paso vertical de cada vuelta = diametro / PHI.
   SVG puro + vanilla JS. Sin dependencias. Virtualizado.
   ============================================================ */

'use strict';

/* ----------------- Nucleo puro (testeable en Node) ----------------- */

var PHI = (1 + Math.sqrt(5)) / 2;
var POR_VUELTA = 13;

function ordenarInsights(arr) {
  return arr.slice().sort(function (a, b) {
    if (a.semana !== b.semana) return a.semana < b.semana ? -1 : 1;
    return String(a.id) < String(b.id) ? -1 : 1;
  });
}

// Lista visible en la espiral: todo menos descartado, en orden temporal
function listaEspiral(insights) {
  return ordenarInsights(insights).filter(function (e) { return e.estado !== 'descartado'; });
}

// Racha: lunes consecutivos resueltos hacia atras.
// La semana activa mas reciente (pendiente o en_curso) no rompe.
// Un pospuesto congela (se salta). Un pendiente viejo rompe.
function calcRacha(lista) {
  var r = 0, primero = true;
  for (var i = lista.length - 1; i >= 0; i--) {
    var e = lista[i].estado;
    if (e === 'descartado') continue;
    if (primero) {
      primero = false;
      if (e === 'pendiente' || e === 'en_curso') continue;
    }
    if (e === 'resuelto') r++;
    else if (e === 'pospuesto') continue;
    else break;
  }
  return r;
}

function calcContadores(lista) {
  var n = lista.length;
  var res = 0, litK = -1;
  for (var i = 0; i < n; i++) {
    if (lista[i].estado === 'resuelto') { res++; litK = i; }
  }
  var vuelta = n === 0 ? 1 : Math.ceil(n / POR_VUELTA);
  var nodo = n === 0 ? 0 : ((n - 1) % POR_VUELTA) + 1;
  return { total: n, resueltos: res, vuelta: vuelta, nodo: nodo, litK: litK };
}

// Una vuelta v (base 1) esta completa si sus 13 posiciones existen y estan resueltas
function vueltaCompleta(lista, v) {
  var ini = (v - 1) * POR_VUELTA;
  var fin = ini + POR_VUELTA;
  if (lista.length < fin) return false;
  for (var i = ini; i < fin; i++) if (lista[i].estado !== 'resuelto') return false;
  return true;
}

function romano(n) {
  var mapa = [[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  var s = '';
  for (var i = 0; i < mapa.length; i++) {
    while (n >= mapa[i][0]) { s += mapa[i][1]; n -= mapa[i][0]; }
  }
  return s || 'I';
}

var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var DIAS = ['Domingo','Lunes','Martes','Mi\u00e9rcoles','Jueves','Viernes','S\u00e1bado'];

function fechaLarga(iso) {
  var p = String(iso).split('-');
  if (p.length !== 3) return iso;
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()];
}

function fechaCorta(iso) {
  var p = String(iso).split('-');
  if (p.length !== 3) return iso;
  return Number(p[2]) + ' de ' + MESES[Number(p[1]) - 1];
}

/* Exportar nucleo para pruebas en Node */
if (typeof document === 'undefined') {
  module.exports = {
    PHI: PHI, POR_VUELTA: POR_VUELTA,
    ordenarInsights: ordenarInsights, listaEspiral: listaEspiral,
    calcRacha: calcRacha, calcContadores: calcContadores,
    vueltaCompleta: vueltaCompleta, romano: romano, fechaLarga: fechaLarga, fechaCorta: fechaCorta
  };
} else {
  iniciarPortal();
}

/* ============================================================
   Aplicacion (solo navegador)
   ============================================================ */
function iniciarPortal() {

  var SVGNS = 'http://www.w3.org/2000/svg';
  var PREVIA = !!window.__PREVIEW_DATA__;
  var MOV_OK = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Almacen seguro (localStorage puede no existir) ---------- */
  var memStore = {};
  var store = {
    get: function (k) {
      try { return window.localStorage.getItem(k); } catch (e) { return memStore[k] || null; }
    },
    set: function (k, v) {
      try { window.localStorage.setItem(k, v); } catch (e) { memStore[k] = v; }
    }
  };

  /* ---------- Estado ---------- */
  var slug = '';
  var datos = null;        // { cliente, insights }
  var lista = [];          // lista de la espiral (sin descartados, orden asc)
  var cont = null;         // contadores
  var racha = 0;

  var camK = 0;            // camara en unidades de nodo (indice flotante)
  var cx = 0, cxObjetivo = 0, cy = 0, R = 140, TILT_R = 46, dz = 22;
  var K_WIN = POR_VUELTA * 1.12;
  var RN = 17;             // radio del nodo (protagonista)

  var arrastrando = false, secuencia = false, hojaAbierta = false;
  var vel = 0, snapTimer = null, rafId = 0, animando = false;
  var interactuo = false;

  var nodosVivos = {};     // k -> registro {el, inner, depth}
  var anillosVivos = {};   // v -> registro

  /* ---------- DOM base ---------- */
  var app = document.getElementById('app');

  var svg = document.createElementNS(SVGNS, 'svg');
  svg.id = 'lienzo';
  svg.setAttribute('xmlns', SVGNS);
  app.appendChild(svg);

  var defs = document.createElementNS(SVGNS, 'defs');
  defs.innerHTML =
    '<linearGradient id="gradOro" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#E8A838"/><stop offset="1" stop-color="#FF6B4A"/>' +
    '</linearGradient>';
  svg.appendChild(defs);

  var gSegBase = mk('g', {});
  var gSegTint = mk('g', {});
  var gSegLit = mk('g', {});
  var gHiloLit = mk('path', { fill: 'none', stroke: 'var(--acqua)', 'stroke-width': 1.7, 'stroke-linecap': 'round', opacity: 0.85 });
  var gAnillos = mk('g', {});
  var gNodos = mk('g', {});
  var gFx = mk('g', {});
  [gSegBase, gSegTint, gSegLit, gHiloLit, gAnillos, gNodos, gFx].forEach(function (el) { svg.appendChild(el); });
  var poolBase = [], poolTint = [], poolLit = [];

  // Pintor de hilo por segmentos: cada tramo recibe su propio estilo
  function hiloSegs(pool, grupo, tA, tB, estiloDe) {
    var i = 0;
    if (tB > tA) {
      for (var t = tA; t < tB; t += 0.5) {
        var fin = Math.min(tB, t + 0.56);
        var el = pool[i];
        if (!el) { el = mk('path', { fill: 'none', 'stroke-linecap': 'round' }); pool.push(el); grupo.appendChild(el); }
        var st = estiloDe((t + fin) / 2);
        el.setAttribute('d', st.o < 0.004 ? '' : trazo(t, fin));
        el.setAttribute('stroke', st.c);
        el.setAttribute('stroke-width', st.w);
        el.setAttribute('opacity', st.o.toFixed(3));
        i++;
      }
    }
    for (; i < pool.length; i++) pool[i].setAttribute('d', '');
  }

  // HUD
  var hudMarca = div('hud', 'hud-marca');
  hudMarca.innerHTML = '<div class="cliente" id="hud-cliente"></div>';
  var hudDatos = div('hud', 'hud-datos');
  hudDatos.innerHTML = '<div class="vuelta" id="hud-vuelta"></div><div class="cifras" id="hud-cifras"></div><div class="racha" id="hud-racha"></div>';
  var hudHint = div('hud', 'hud-hint');
  hudHint.textContent = '';
  var foco = document.createElement('div');
  foco.id = 'foco';
  foco.innerHTML = '<div class="f-in">' +
    '<div class="f-lienzo"><img class="f-portada" alt="" loading="lazy">' +
    '<button id="f-check" class="f-check" aria-label="Marcar hecha"></button></div>' +
  '</div>';
  var flechas = div('hud', 'flechas');
  flechas.innerHTML = '<button id="fl-arriba" aria-label="Subir">\u25b2</button><button id="fl-abajo" aria-label="Bajar">\u25bc</button>';
  var cima = document.createElement('div'); cima.id = 'cima';
  cima.innerHTML = '<div class="c-senal"></div>';
  var libroFlot = document.createElement('img');
  libroFlot.id = 'libroFlot'; libroFlot.alt = ''; libroFlot.loading = 'lazy';
  [hudMarca, hudDatos, hudHint, cima, libroFlot, foco, flechas].forEach(function (el) { app.appendChild(el); });

  // Hoja de detalle + velo + toast
  foco.addEventListener('click', function (ev) {
    if (ev.target && ev.target.id === 'f-check') { ev.stopPropagation(); togglearHecha(Math.max(0, Math.min(lista.length - 1, Math.round(camK)))); return; }
    if (secuencia || lista.length === 0) return;
    var k = Math.max(0, Math.min(lista.length - 1, Math.round(camK)));
    abrirHoja(k);
  });

  var velo = document.createElement('div'); velo.id = 'velo'; app.appendChild(velo);
  var hoja = document.createElement('div'); hoja.id = 'hoja'; app.appendChild(hoja);
  var toast = document.createElement('div'); toast.id = 'toast'; app.appendChild(toast);

  function mk(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    for (var a in attrs) el.setAttribute(a, attrs[a]);
    return el;
  }
  function div(cls, id) {
    var el = document.createElement('div');
    el.className = cls; if (id) el.id = id;
    return el;
  }

  /* ---------- Geometria ---------- */
  var STEP = (Math.PI * 2) / POR_VUELTA;

  function layout(snapCx) {
    var vw = window.innerWidth, vh = window.innerHeight;
    svg.setAttribute('width', vw);
    svg.setAttribute('height', vh);
    svg.setAttribute('viewBox', '0 0 ' + vw + ' ' + vh);
    R = Math.max(96, Math.min(Math.min(vw, vh) * 0.30, 200));
    TILT_R = R * 0.34;
    var paso = (2 * R) / PHI;         // aurea: paso de vuelta = diametro / PHI
    dz = paso / POR_VUELTA;
    cy = vh * 0.44;
    var base = vw / 2;
    cxObjetivo = (hojaAbierta && vw >= 900) ? (vw - 420) / 2 : base;
    if (snapCx !== false && !animando) cx = cxObjetivo;
    pedirRender();
  }

  function proyectar(k) {
    var a = (k - camK) * STEP;
    var depth = Math.cos(a);
    return {
      x: cx + R * Math.sin(a),
      y: cy - (k - camK) * dz + TILT_R * depth,
      depth: depth,
      s: 0.58 + 0.42 * (depth + 1) / 2,
      o: 0.28 + 0.72 * (depth + 1) / 2
    };
  }

  // Campo de desvanecimiento: 1 en el foco, 0 en el borde, curva suave
  function fadeFoco(dk) {
    var t = Math.max(0, 1 - Math.abs(dk) / 13.5);
    return t * t * (3 - 2 * t);
  }

  /* ---------- Construccion de nodos ---------- */
  function elNodo(k) {
    var it = lista[k];
    var g = mk('g', { 'class': 'nodo est-' + it.estado });
    var inner = mk('g', { 'class': 'inner' });
    g.appendChild(inner);

    inner.appendChild(mk('circle', { 'class': 'n-halo', r: RN + 7 }));

    // Onda permanente en el pendiente mas nuevo: la cajita del lunes respira
    if (it.estado === 'pendiente' && k === indicePendienteNuevo()) {
      inner.appendChild(mk('circle', { 'class': 'nuevo-anillo', r: RN + 4 }));
    }

    inner.appendChild(mk('circle', { 'class': 'n-base', r: RN }));
    inner.appendChild(mk('circle', { 'class': 'n-focus', r: RN + 4 }));

    if (it.estado === 'resuelto') {
      inner.appendChild(mk('circle', { 'class': 'n-fill', r: RN }));
    } else if (it.estado === 'en_curso') {
      var c = 2 * Math.PI * (RN + 5);
      inner.appendChild(mk('circle', { 'class': 'n-arc', r: RN + 5, 'stroke-dasharray': (c * 0.28) + ' ' + (c * 0.72) }));
    }

    var nn = k + 1;
    var num = mk('text', {
      'class': 'n-num', 'text-anchor': 'middle', dy: '0.34em',
      'font-size': nn >= 100 ? 9.5 : (nn >= 10 ? 12 : 13)
    });
    num.textContent = String(nn);
    inner.appendChild(num);

    if (it.estado === 'resuelto') {
      var badge = mk('g', { 'class': 'n-badge', transform: 'translate(12 -12)' });
      badge.appendChild(mk('circle', { r: 7.5 }));
      badge.appendChild(mk('path', { d: 'M -3.2 0.2 L -0.9 2.4 L 3.4 -2.2' }));
      inner.appendChild(badge);
    }
    return { el: g, inner: inner, depth: 0 };
  }

  function indicePendienteNuevo() {
    for (var i = lista.length - 1; i >= 0; i--) {
      if (lista[i].estado === 'pendiente' || lista[i].estado === 'en_curso') return i;
    }
    return -1;
  }

  /* ---------- Render ---------- */
  function render() {
    if (!cont || lista.length === 0) return;
    foco.style.setProperty('--dx', (cx - window.innerWidth / 2).toFixed(1) + 'px');
    var maxK = lista.length - 1;

    // Hilos
    if (!ignitando) {
      var t0 = Math.max(-0.45, camK - K_WIN - 0.6);
      var t1 = Math.min(maxK + 0.45, camK + K_WIN + 0.6);
      hiloSegs(poolBase, gSegBase, t0, t1, function (tm) {
        return { c: 'var(--thread)', w: 1.2, o: 0.08 + 0.8 * fadeFoco(tm - camK) };
      });
      hiloSegs(poolTint, gSegTint, t0, t1, function (tm) {
        var f = fadeFoco(tm - camK);
        return { c: 'var(--gold)', w: 1.4, o: 0.5 * f * f };
      });
      hiloSegs(poolLit, gSegLit, t0, cont.litK >= 0 ? Math.min(cont.litK, t1) : t0, function (tm) {
        return { c: 'var(--acqua)', w: 1.7, o: 0.9 * fadeFoco(tm - camK) };
      });
      gHiloLit.setAttribute('d', '');
      gHiloLit.removeAttribute('stroke-dasharray');
      gHiloLit.removeAttribute('stroke-dashoffset');
    }

    // Nodos: virtualizacion
    var visibles = [];
    var desde = Math.max(0, Math.ceil(camK - K_WIN));
    var hasta = Math.min(maxK, Math.floor(camK + K_WIN));
    var k;
    for (k = desde; k <= hasta; k++) {
      var reg = nodosVivos[k];
      if (!reg) { reg = elNodo(k); nodosVivos[k] = reg; gNodos.appendChild(reg.el); }
      var p = proyectar(k);
      reg.depth = p.depth;
      reg.el.setAttribute('transform', 'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ') scale(' + p.s.toFixed(3) + ')');
      reg.el.setAttribute('opacity', (p.o * fadeFoco(k - camK)).toFixed(3));
      var dfoco = Math.min(1, Math.abs(k - camK) / 2.2);
      var pfoco = 1 - dfoco; pfoco = pfoco * pfoco * (3 - 2 * pfoco);
      reg.el.style.setProperty('--p', pfoco.toFixed(3));
      reg.px = p.x; reg.py = p.y; reg.ps = p.s; reg.k = k;
      visibles.push(reg);
    }
    for (var kk in nodosVivos) {
      k = Number(kk);
      if (k < desde || k > hasta) { gNodos.removeChild(nodosVivos[kk].el); delete nodosVivos[kk]; }
    }
    visibles.sort(function (a, b) { return a.depth - b.depth; });
    for (var i = 0; i < visibles.length; i++) gNodos.appendChild(visibles[i].el);

    // Anillos de vuelta
    var vTot = Math.ceil(Math.max(lista.length, 1) / POR_VUELTA);
    for (var v = 1; v <= vTot; v++) {
      var kb = v * POR_VUELTA - 0.5;
      var dentro = Math.abs(kb - camK) <= K_WIN;
      var ra = anillosVivos[v];
      if (dentro) {
        if (!ra) {
          var comp = vueltaCompleta(lista, v);
          var ge = mk('g', {});
          var ell = mk('ellipse', { 'class': 'anillo' + (comp ? ' completa' : ''), rx: R, ry: TILT_R });
          ge.appendChild(ell);
          ra = { el: ge, ell: ell };
          anillosVivos[v] = ra; gAnillos.appendChild(ge);
        }
        var yv = cy - (kb - camK) * dz;
        ra.ell.setAttribute('cx', cx); ra.ell.setAttribute('cy', yv);
        ra.ell.setAttribute('rx', R); ra.ell.setAttribute('ry', TILT_R);
        var alfa = Math.max(0, 1 - Math.abs(kb - camK) / K_WIN);
        ra.el.setAttribute('opacity', (alfa * 0.9).toFixed(3));
      } else if (ra) {
        gAnillos.removeChild(ra.el); delete anillosVivos[v];
      }
    }

    actualizarLector();
  }

  function trazo(t0, t1) {
    var d = '', paso = 0.22, primero = true;
    for (var t = t0; t <= t1 + 1e-9; t += paso) {
      var p = proyectar(t);
      d += (primero ? 'M' : 'L') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
      primero = false;
    }
    return d;
  }

  var pedido = false;
  function pedirRender() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () { pedido = false; render(); });
  }

  /* ---------- Lector del nodo enfocado ---------- */
  var focoK = -1;
  /* ---------- La casa respira con el libro en foco ---------- */
  function respirarColor(it) {
    var c1 = it.c1 || '#E8A838', c2 = it.c2 || '#FF6B4A';
    var r = document.documentElement.style;
    r.setProperty('--gold', c1);
    r.setProperty('--gold-2', c2);
    var s1 = document.querySelector('#gradOro stop:first-child');
    var s2 = document.querySelector('#gradOro stop:last-child');
    if (s1) s1.setAttribute('stop-color', c1);
    if (s2) s2.setAttribute('stop-color', c2);
  }

  function actualizarLector() {
    if (secuencia || lista.length === 0) { foco.classList.add('oculto'); cima.classList.add('oculto'); return; }
    foco.classList.remove('oculto'); cima.classList.remove('oculto');
    var k = Math.max(0, Math.min(lista.length - 1, Math.round(camK)));
    if (k === focoK) return;
    focoK = k;
    var it = lista[k];
    cima.querySelector('.c-senal').textContent = it.movimiento || it.hallazgo || '';
    var img = foco.querySelector('.f-portada');
    if (it.portada) { img.src = it.portada; img.style.opacity = 1; } else { img.style.opacity = 0; }
    foco.querySelector('#f-check').className = 'f-check' + (it.estado === 'resuelto' ? ' ya' : '');
    respirarColor(it);
    if (MOV_OK) foco.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 180, easing: 'ease-out' });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- Camara: tweens, inercia, snap ---------- */
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  var tweenId = 0;
  function tweenCam(destino, dur, ease, fin) {
    var ini = camK, iniCx = cx, t0 = performance.now();
    var yo = ++tweenId;
    animando = true;
    function paso(now) {
      if (yo !== tweenId) return; // un tween mas nuevo tomo el control
      var t = Math.min(1, (now - t0) / dur);
      var e = ease(t);
      camK = ini + (destino - ini) * e;
      cx = iniCx + (cxObjetivo - iniCx) * e;
      render();
      if (t < 1) requestAnimationFrame(paso);
      else { animando = false; if (fin) fin(); }
    }
    requestAnimationFrame(paso);
  }

  function clampCam(v) {
    var maxK = Math.max(lista.length - 1, 0);
    return Math.max(-0.6, Math.min(maxK + 0.6, v));
  }

  function snap(dur) {
    var maxK = Math.max(lista.length - 1, 0);
    var destino = Math.max(0, Math.min(maxK, Math.round(camK)));
    tweenCam(destino, dur || 280, easeOutCubic, null);
  }

  function inercia() {
    if (arrastrando || secuencia) return;
    vel *= 0.945;
    camK = clampCam(camK + vel);
    render();
    if (Math.abs(vel) > 0.004) requestAnimationFrame(inercia);
    else snap(300);
  }

  /* ---------- Entrada ---------- */
  var pDown = null;
  var zona = app;
  zona.style.touchAction = 'none';
  var overPx = 0;

  zona.addEventListener('pointerdown', function (e) {
    if (e.target && e.target.closest && e.target.closest('button, a, #hud-marca')) return;
    if (secuencia) return;
    try { zona.setPointerCapture(e.pointerId); } catch (er) {}
    pDown = { y: e.clientY, x: e.clientX, k: camK, t: performance.now(), ly: e.clientY, lt: performance.now() };
    var rp = nodoEn(e.clientX, e.clientY);
    if (rp) { rp.el.classList.add('pres'); pDown.pres = rp; }
    arrastrando = true; vel = 0;
    svg.classList.add('arrastrando');
    ocultarHint();
  });


  zona.addEventListener('pointermove', function (e) {
    if (!pDown) return;
    if (pDown.pres && (Math.abs(e.clientX - pDown.x) > 7 || Math.abs(e.clientY - pDown.y) > 7)) {
      pDown.pres.el.classList.remove('pres'); pDown.pres = null;
    }
    var ahora = performance.now();
    var maxK = Math.max(lista.length - 1, 0);
    var raw = pDown.k + (pDown.y - e.clientY) / dz * 0.32;
    if (raw > maxK) {
      overPx = (raw - maxK) * dz;
      camK = maxK;
      if (overPx > 46) avisar('Suelta para actualizar \u21bb', null, 500);
    } else { overPx = 0; camK = clampCam(raw); }
    var dt = ahora - pDown.lt;
    if (dt > 0) vel = ((pDown.ly - e.clientY) / dz) * 0.32 * Math.min(1, 16 / dt);
    pDown.ly = e.clientY; pDown.lt = ahora;
    render();
  });

  zona.addEventListener('pointerup', function (e) {
    if (overPx > 84) { avisar('Actualizando\u2026'); setTimeout(function(){ location.reload(); }, 220); return; }
    overPx = 0;
    if (!pDown) return;
    if (pDown.pres) { pDown.pres.el.classList.remove('pres'); }
    var fueTap = Math.abs(e.clientY - pDown.y) < 7 && Math.abs(e.clientX - pDown.x) < 7 &&
                 (performance.now() - pDown.t) < 380;
    arrastrando = false; pDown = null;
    svg.classList.remove('arrastrando');
    if (fueTap) { if (!tocar(e.clientX, e.clientY)) snap(220); }
    else requestAnimationFrame(inercia);
  });

  zona.addEventListener('pointercancel', function () {
    if (pDown && pDown.pres) pDown.pres.el.classList.remove('pres');
    arrastrando = false; pDown = null; svg.classList.remove('arrastrando'); snap(260);
  });

  zona.addEventListener('wheel', function (e) {
    if (secuencia) return;
    e.preventDefault();
    ocultarHint();
    camK = clampCam(camK - (e.deltaY / dz) * 0.18);
    render();
    if (snapTimer) clearTimeout(snapTimer);
    snapTimer = setTimeout(function () { snap(260); }, 150);
  }, { passive: false });

  window.addEventListener('keydown', function (e) {
    if (secuencia) return;
    if (e.key === 'Escape' && hojaAbierta) { cerrarHoja(); return; }
    if (hojaAbierta) return;
    var maxK = Math.max(lista.length - 1, 0);
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { tweenCam(Math.min(maxK, Math.round(camK) + 1), 300, easeOutCubic); ocultarHint(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { tweenCam(Math.max(0, Math.round(camK) - 1), 300, easeOutCubic); ocultarHint(); }
    if (e.key === 'End') tweenCam(maxK, 500, easeInOutCubic);
    if (e.key === 'Home') tweenCam(0, 500, easeInOutCubic);
  });

  flechas.addEventListener('click', function (e) {
    var maxK = Math.max(lista.length - 1, 0);
    if (e.target.id === 'fl-arriba') tweenCam(Math.min(maxK, Math.round(camK) + 1), 300, easeOutCubic);
    if (e.target.id === 'fl-abajo') tweenCam(Math.max(0, Math.round(camK) - 1), 300, easeOutCubic);
    ocultarHint();
  });

  function ocultarHint() {
    if (interactuo) return;
    interactuo = true;
    hudHint.classList.add('ida');
  }

  function nodoEn(mx, my) {
    var mejor = null, mejorD = 1e9;
    for (var kk in nodosVivos) {
      var r = nodosVivos[kk];
      var d = Math.hypot(mx - r.px, my - r.py);
      if (d < 32 * r.ps + 9 && r.depth > -0.2 && d < mejorD) { mejor = r; mejorD = d; }
    }
    return mejor;
  }

  function tocar(mx, my) {
    var r = nodoEn(mx, my);
    if (r) { abrirHoja(r.k); return true; }
    return false;
  }

  /* ---------- Hoja de detalle ---------- */
  function selloSVG(px) {
    return '<svg width="' + px + '" height="' + px + '" viewBox="-8 -8 16 16" style="vertical-align:-3px;margin-right:6px">' +
      '<circle r="7" fill="var(--check)"/>' +
      '<path d="M -3 0.3 L -0.9 2.4 L 3.4 -2.2" stroke="#ffffff" stroke-width="2.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  var SELLO_14 = selloSVG(14);
  var SELLO_12 = selloSVG(12);

  var ETIQ = { pendiente: 'TE ESPERA', en_curso: 'EN CURSO', resuelto: 'HECHA', pospuesto: 'EN PAUSA' };

  function abrirHoja(k) {
    var it = lista[k];
    var html = '<div class="asa"></div>' +
      '<button class="h-cierra" aria-label="Cerrar">\u2715</button>' +
      '<div class="h-sem">#' + String(it.id).replace('ED-','') + ' \u00b7 ' + esc(fechaLarga(it.semana).toUpperCase()) + '</div>' +
      (it.portada ? '<img class="h-portada" src="' + esc(it.portada) + '" alt="" loading="lazy">' : '') +
      '<div class="h-libro">' + esc(it.titulo) + '</div>' +
      (it.voz ? '<p class="h-voz">' + esc(it.voz) + '</p>' : '') +
      (it.hallazgo ? '<p class="h-frase">' + esc(it.hallazgo) + '</p>' : '') +
      (it.video ? '<div class="h-video"><iframe src="https://www.youtube-nocookie.com/embed/' + esc(it.video) + '?rel=0&modestbranding=1" title="Video" frameborder="0" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>' : '') +
      '<div class="h-fila">' +
        (it.slug ? '<a class="h-ver" href="/t/' + esc(it.slug) + '/">VER LA EDICI\u00d3N \u2192</a>' : '') +
      '</div>';
    hoja.innerHTML = html;
    hoja.querySelector('.h-cierra').addEventListener('click', cerrarHoja);
    hojaAbierta = true;
    velo.classList.add('ver');
    hoja.classList.add('ver');
    hoja.scrollTop = 0;
    layout(false);
    tweenCam(k, 340, easeOutCubic, null);
  }

  function cerrarHoja() {
    hojaAbierta = false;
    velo.classList.remove('ver');
    hoja.classList.remove('ver');
    layout(false);
    tweenCam(Math.round(camK), 300, easeOutCubic, null);
  }

  velo.addEventListener('click', cerrarHoja);

  /* ---------- Palomear del usuario (Triggui) ---------- */
  function leerHechas() {
    try { return JSON.parse(store.get('triggui_espiral_hechas') || '{}'); } catch (e) { return {}; }
  }
  function guardarHechas(m) { store.set('triggui_espiral_hechas', JSON.stringify(m)); }
  window.__aplicarHechas = function (arr) {
    var m = leerHechas();
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i];
      if (m[it.id]) { it.estado = 'resuelto'; it.resuelto_el = m[it.id]; }
    }
  };
  function togglearHecha(k) {
    var it = lista[k]; if (!it) return;
    var m = leerHechas();
    if (it.estado === 'resuelto') {
      it.estado = 'pendiente'; delete it.resuelto_el; delete m[it.id];
      try { gtag('event', 'senal_deshecha', { edicion: it.id }); } catch (e) {}
      avisar('Se\u00f1al pendiente otra vez');
    } else {
      var hoy = new Date().toISOString().slice(0, 10);
      it.estado = 'resuelto'; it.resuelto_el = hoy; m[it.id] = hoy;
      try { gtag('event', 'senal_hecha', { edicion: it.id }); } catch (e) {}
      var reg = nodosVivos[k];
      if (reg && reg.el.getBoundingClientRect) {
        var bb = reg.el.getBoundingClientRect();
        particulas(bb.left + bb.width / 2, bb.top + bb.height / 2);
        reg.el.classList.add('celebra');
        setTimeout(function () { try { reg.el.classList.remove('celebra'); } catch (e2) {} }, 950);
      }
      vibrar([18, 40, 18]);
      avisar('Se\u00f1al hecha', String(it.titulo).split(' \u00b7 ')[0]);
    }
    guardarHechas(m);
    racha = calcRacha(lista); cont = calcContadores(lista);
    repintarTodo(); pintarHud(); pintarCarita(); guardarMemoria();
    abrirHoja(k);
  }

  function repintarTodo() {
    focoK = -1;
    nodosVivos = {}; anillosVivos = {};
    gNodos.innerHTML = ''; gAnillos.innerHTML = '';
    render();
  }

  /* ---------- Progreso acaritado (barra + carita en la punta) ---------- */
  function pintarCarita() {
    var prog = document.getElementById('hud-prog'); if (!prog) return;
    var total = lista.length;
    var hechas = lista.filter(function (x) { return x.estado === 'resuelto'; }).length;
    var pct = total ? (hechas / total) : 0;
    var ult = lista.slice(Math.max(0, lista.length - 6), Math.max(0, lista.length - 1));
    var h5 = ult.filter(function (x) { return x.estado === 'resuelto'; }).length;
    var ratio = ult.length ? h5 / ult.length : 0;
    var caras = [
      ['#6a6a76', 'M8 15 q4 -3 8 0'],
      ['#9a9aa6', 'M8 15 q4 -2 8 0'],
      ['#d9a83c', 'M8 14 h8'],
      ['#b8d94a', 'M8 13 q4 3 8 0'],
      ['#34D399', 'M8 12 q4 5 8 0']
    ];
    var idx = ratio >= 0.99 ? 4 : ratio >= 0.75 ? 3 : ratio >= 0.5 ? 2 : ratio >= 0.25 ? 1 : 0;
    var c = caras[idx];
    prog.querySelector('.p-fill').style.width = (pct * 100).toFixed(1) + '%';
    var cara = prog.querySelector('.p-cara');
    cara.style.left = 'calc(' + (pct * 100).toFixed(1) + '% - 11px)';
    cara.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none">' +
      '<circle cx="12" cy="12" r="10" fill="#0B0F1A" stroke="' + c[0] + '" stroke-width="1.6"/>' +
      '<circle cx="8.6" cy="9.6" r="1.15" fill="' + c[0] + '"/><circle cx="15.4" cy="9.6" r="1.15" fill="' + c[0] + '"/>' +
      '<path d="' + c[1] + '" stroke="' + c[0] + '" stroke-width="1.6" stroke-linecap="round"/></svg>';
    prog.querySelector('.p-cap').textContent = 'HAS HECHO ' + hechas + ' DE ' + total + (racha > 1 ? (' \u00b7 RACHA ' + racha) : '');
  }
  window.__pintarCarita = pintarCarita;

  // Deslizar hacia abajo para cerrar (movil)
  var hDown = null;
  hoja.addEventListener('pointerdown', function (e) {
    if (window.innerWidth >= 900) return;
    if (hoja.scrollTop > 2) return;
    hDown = e.clientY;
  });
  hoja.addEventListener('pointerup', function (e) {
    if (hDown !== null && e.clientY - hDown > 76) cerrarHoja();
    hDown = null;
  });

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function avisar(msg, sub, dur) {
    toast.innerHTML = esc(msg) + (sub ? '<div class="t-sub">' + esc(sub) + '</div>' : '');
    toast.classList.add('ver');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('ver'); }, dur || 2600);
  }

  /* ---------- Celebraciones ---------- */
  var ignitando = false;

  function vibrar(patron) {
    try { if (navigator.vibrate) navigator.vibrate(patron); } catch (e) {}
  }

  function particulas(x, y) {
    if (!MOV_OK) return;
    var COLORES = ['var(--gold)', 'var(--acqua)', 'var(--gold-2)', '#ffffff'];
    for (var i = 0; i < 26; i++) {
      var ang = (Math.PI * 2 * i) / 26 + Math.random() * 0.5;
      var dist = 44 + Math.random() * 66;
      var c = mk('circle', { r: 2 + Math.random() * 2.5, fill: COLORES[i % 4] });
      gFx.appendChild(c);
      c.animate([
        { transform: 'translate(' + x + 'px,' + y + 'px) scale(1)', opacity: 1 },
        { transform: 'translate(' + (x + Math.cos(ang) * dist) + 'px,' + (y + Math.sin(ang) * dist) + 'px) scale(.1)', opacity: 0 }
      ], { duration: 700 + Math.random() * 400, delay: Math.random() * 120, easing: 'cubic-bezier(.16,.8,.3,1)', fill: 'backwards' })
      .onfinish = (function (el) { return function () { el.remove(); }; })(c);
    }
  }

  function onda(x, y) {
    if (!MOV_OK) return;
    [['var(--acqua)', 0], ['var(--gold)', 130]].forEach(function (par) {
      var c = mk('circle', { cx: x, cy: y, r: RN, fill: 'none', stroke: par[0], 'stroke-width': 2.5 });
      gFx.appendChild(c);
      c.animate([
        { r: RN, opacity: 0.85 },
        { r: RN * 4.6, opacity: 0 }
      ], { duration: 780, delay: par[1], easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' })
      .onfinish = (function (el) { return function () { el.remove(); }; })(c);
    });
  }

  function destello(x, y) {
    if (!MOV_OK) return;
    var c = mk('circle', { cx: x, cy: y, r: RN + 4, fill: '#ffffff' });
    gFx.appendChild(c);
    c.animate([{ opacity: 0.85 }, { opacity: 0 }], { duration: 180, easing: 'ease-out' })
      .onfinish = function () { c.remove(); };
  }

  function pop(reg, fuerte) {
    if (!MOV_OK) return;
    reg.inner.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(' + (fuerte ? 1.7 : 1.22) + ')' },
      { transform: 'scale(1)' }
    ], { duration: fuerte ? 640 : 420, easing: 'cubic-bezier(.3,1.4,.4,1)' });
  }

  function encenderHilo(fin) {
    if (!MOV_OK || cont.litK < 0) { if (fin) fin(); return; }
    ignitando = true;
    for (var qi = 0; qi < poolLit.length; qi++) poolLit[qi].setAttribute('d', '');
    var t0 = Math.max(-0.45, camK - K_WIN - 0.6);
    gHiloLit.setAttribute('d', trazo(t0, Math.min(cont.litK, camK + K_WIN + 0.6)));
    var L = gHiloLit.getTotalLength();
    gHiloLit.setAttribute('stroke-dasharray', L);
    gHiloLit.setAttribute('stroke-dashoffset', L);
    var anim = gHiloLit.animate(
      [{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
      { duration: 900, easing: 'cubic-bezier(.4,0,.2,1)' }
    );
    anim.onfinish = function () {
      gHiloLit.removeAttribute('stroke-dasharray');
      gHiloLit.removeAttribute('stroke-dashoffset');
      ignitando = false;
      if (fin) fin();
    };
  }

  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function celebrar(resueltosNuevos, llegadas) {
    secuencia = true;
    foco.classList.add('oculto'); focoK = -1;
    var cadena = Promise.resolve();

    resueltosNuevos.forEach(function (k) {
      cadena = cadena.then(function () {
        return new Promise(function (listo) {
          tweenCam(k, 720, easeInOutCubic, function () {
            setTimeout(function () {
              var reg = nodosVivos[k];
              if (reg) {
                destello(reg.px, reg.py);
                pop(reg, true);
                onda(reg.px, reg.py);
                particulas(reg.px, reg.py);
                vibrar([18, 70, 26, 40, 14]);
              }
              avisar('Se\u00f1al hecha', racha >= 2 ? 'RACHA: ' + racha + ' LUNES SEGUIDOS RESUELTOS' : lista[k].id, 3200);
              setTimeout(function () {
                encenderHilo(function () { setTimeout(listo, 420); });
              }, 650);
            }, 160);
          });
        });
      });
    });

    if (llegadas.length) {
      cadena = cadena.then(function () { return espera(260); }).then(function () {
        return new Promise(function (listo) {
          var k = llegadas[llegadas.length - 1];
          tweenCam(k, 700, easeInOutCubic, function () {
            var reg = nodosVivos[k];
            if (reg) { pop(reg, false); vibrar([12, 40, 10]); }
            avisar('Nueva se\u00f1al del lunes', fechaLarga(lista[k].semana).toUpperCase(), 2600);
            setTimeout(listo, 500);
          });
        });
      });
    }

    cadena.then(function () {
      secuencia = false;
      render();
    });
  }

  /* ---------- Memoria de estados (diferencial entre visitas) ---------- */
  function claveMemoria() { return 'ins_v1_' + slug; }

  function leerMemoria() {
    try {
      var raw = store.get(claveMemoria());
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function guardarMemoria() {
    var est = {};
    for (var i = 0; i < lista.length; i++) est[lista[i].id] = lista[i].estado;
    store.set(claveMemoria(), JSON.stringify({ v: 1, est: est }));
  }

  /* ---------- HUD ---------- */
  function pintarHud() {
    var cli = (datos && datos.cliente) || {};
    var logo = cli.logo ? '<img class="cliente-logo" src="' + esc(cli.logo) + '" alt="">' : '';
    document.getElementById('hud-cliente').innerHTML = logo || ('<div class="cliente-nombre">' + esc(cli.nombre || '') + '</div>');
    var hd = document.getElementById('hud-datos');
    if (!document.getElementById('hud-prog')) {
      hd.innerHTML = '<div id="hud-prog"><div class="p-track"><div class="p-fill"></div><div class="p-cara"></div></div><div class="p-cap"></div></div>';
    }
  }

  function boot(json) {
    datos = json;
    lista = listaEspiral(datos.insights || []);
    cont = calcContadores(lista);
    racha = calcRacha(lista);
    pintarHud();
    pintarCarita();
    var ultimoIt = lista[lista.length - 1] || {};
    var rz = document.documentElement.style;
    rz.setProperty('--acc1', ultimoIt.c1 || '#E8A838');
    rz.setProperty('--acc2', ultimoIt.c2 || '#FF6B4A');
    layout();

    if (lista.length === 0) {
      var vc = document.createElement('div');
      vc.id = 'vacio';
      vc.innerHTML = '<div>Tu espiral inicia este lunes.<br><span style="font-size:12px;color:var(--faint)">El primer insight llega por WhatsApp.</span></div>';
      foco.classList.add('oculto');
      app.appendChild(vc);
      return;
    }

    var prev = leerMemoria();
    var destino = indicePendienteNuevo();
    if (destino < 0) destino = lista.length - 1;

    var resueltosNuevos = [], llegadas = [];
    if (prev && prev.est) {
      for (var i = 0; i < lista.length; i++) {
        var it = lista[i];
        if (!(it.id in prev.est)) { llegadas.push(i); continue; }
        if (it.estado === 'resuelto' && prev.est[it.id] !== 'resuelto') resueltosNuevos.push(i);
      }
    }

    guardarMemoria();

    if (prev && (resueltosNuevos.length || llegadas.length) && MOV_OK) {
      camK = clampCam((resueltosNuevos[0] !== undefined ? resueltosNuevos[0] : llegadas[0]) - 4);
      render();
      setTimeout(function () { celebrar(resueltosNuevos, llegadas); }, 450);
    } else {
      // Primera visita o sin cambios: ascenso de presentacion
      camK = clampCam(destino - 6);
      render();
      if (MOV_OK) setTimeout(function () { tweenCam(destino, 1500, easeOutCubic, null); }, 250);
      else {
        camK = destino; render();
        if (prev && resueltosNuevos.length) avisar('Se\u00f1al hecha', racha >= 2 ? 'RACHA: ' + racha + ' LUNES SEGUIDOS RESUELTOS' : '', 2600);
        else if (prev && llegadas.length) avisar('Nueva se\u00f1al del lunes', '', 2600);
      }
    }
  }

  // En vista previa: fabricar una memoria anterior para escenificar el lunes
  function memoriaPrevia() {
    var est = {};
    for (var i = 0; i < lista.length; i++) est[lista[i].id] = lista[i].estado;
    if (cont.litK >= 0) est[lista[cont.litK].id] = 'en_curso'; // el ultimo resuelto era en_curso
    var np = indicePendienteNuevo();
    if (np >= 0) delete est[lista[np].id];                      // la cajita nueva no existia
    return { v: 1, est: est };
  }

  window.addEventListener('resize', layout);

  if (PREVIA) {
    slug = (window.__PREVIEW_DATA__.cliente && window.__PREVIEW_DATA__.cliente.slug) || 'demo';
    boot(window.__PREVIEW_DATA__);
  } else {
    slug = (location.pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
    if (!/^[a-z0-9-]{2,32}$/.test(slug)) { location.replace('/'); }
    else {
      fetch('/data/' + slug + '.json', { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('auth');
          return r.json();
        })
        .then(boot)
        .catch(function () { location.replace('/gate/?c=' + slug); });
    }
  }
}
