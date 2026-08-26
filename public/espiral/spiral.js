/* autodefensa i18n: inmune a html cacheado sin bloque PV */
window.PV_LANG = window.PV_LANG || (function(){try{var v=JSON.parse(localStorage.getItem('triggui_lang')||'null');if(v==='en'||v==='es')return v;}catch(e){}return ((navigator.language||'es').slice(0,2)==='en')?'en':'es';})();
window.pvT = window.pvT || function(es,en){ return (window.PV_LANG==='en')?en:es; };
window.pvTitulo = window.pvTitulo || function(b){ return (window.PV_LANG==='en'&&b&&b.titulo_en)?b.titulo_en:((b&&b.titulo)||''); };
window.pvF = window.pvF || function(o,c){ return (window.PV_LANG==='en'&&o&&o[c+'_en'])?o[c+'_en']:((o&&o[c])||''); };
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
    /* Racha = LUNES seguidos resueltos (semanas, no items). Lunes doble cuenta 1.
       Semana con algo pendiente rompe; la mas reciente pendiente no rompe (activa).
       Semanas solo-pospuestas son neutras. */
    var porSem = {};
    for (var i = 0; i < lista.length; i++) {
      var it = lista[i];
      if (it.estado === 'descartado') continue;
      (porSem[it.semana] = porSem[it.semana] || []).push(it.estado);
    }
    var sems = Object.keys(porSem).sort();
    var r = 0, primero = true;
    for (var k = sems.length - 1; k >= 0; k--) {
      var es = porSem[sems[k]];
      var pend = false, res = false, todosPosp = true;
      for (var j2 = 0; j2 < es.length; j2++) {
        if (es[j2] === 'pendiente' || es[j2] === 'en_curso') pend = true;
        if (es[j2] === 'resuelto') res = true;
        if (es[j2] !== 'pospuesto') todosPosp = false;
      }
      if (todosPosp) continue;
      if (primero) { primero = false; if (pend) continue; }
      if (!pend && res) r++;
      else if (pend) break;
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
  var DIAS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var MESES_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fechaLarga(iso) {
  var p = String(iso).split('-');
  if (p.length !== 3) return iso;
  var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  return (window.PV_LANG==='en') ? (DIAS_EN[d.getDay()] + ', ' + MESES_EN[d.getMonth()] + ' ' + d.getDate()) : (DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]);
}

function fechaCorta(iso) {
  var p = String(iso).split('-');
  if (p.length !== 3) return iso;
  return (window.PV_LANG==='en') ? (MESES_EN[Number(p[1]) - 1] + ' ' + Number(p[2])) : (Number(p[2]) + ' de ' + MESES[Number(p[1]) - 1]);
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
    '<button id="f-check" class="f-check" aria-label="'+pvT('Marcar hecha','Mark done')+'"></button></div>' +
  '</div>';
  var flechas = div('hud', 'flechas');
  flechas.innerHTML = '<button id="fl-arriba" aria-label="'+pvT('Subir','Up')+'">\u25b2</button><button id="fl-abajo" aria-label="'+pvT('Bajar','Down')+'">\u25bc</button>';
  var cima = document.createElement('div'); cima.id = 'cima';
  cima.innerHTML = '<div class="c-senal"></div>';
  var libroFlot = document.createElement('img');
  libroFlot.id = 'libroFlot'; libroFlot.alt = ''; libroFlot.loading = 'lazy';
  [hudMarca, hudDatos, hudHint, cima, libroFlot, foco, flechas].forEach(function (el) { app.appendChild(el); });

  // Hoja de detalle + velo + toast
  foco.addEventListener('click', function (ev) {
    try {
      if (ev.target && ev.target.closest && ev.target.closest('#tgLangPill')) return;
      var _p2 = document.elementFromPoint(ev.clientX, ev.clientY);
      if (_p2 && _p2.closest && _p2.closest('#tgLangPill')) return;
    } catch (_e) {}
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
      if (!reg) { reg = elNodo(k); nodosVivos[k] = reg;
    try { nodosVivos[k].el.dataset.k = String(k); } catch (e0) {} gNodos.appendChild(reg.el); }
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
    cima.querySelector('.c-senal').textContent = (window.pvF ? window.pvF(it, "movimiento") : it.movimiento) || (window.pvF ? window.pvF(it, "hallazgo") : it.hallazgo) || '';
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
  var overPx2 = 0;
  zona.style.touchAction = 'none';
  var overPx = 0;
  var overDesde = 0;   /* v15.17: instante en que empezo el sobre-arrastre (recargar exige gesto deliberado, no un flick) */

  zona.addEventListener('pointerdown', function (e) {
    if (hoja.classList.contains('ver')) return;
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
    if (pDown.pres && (Math.abs(e.clientX - pDown.x) > 14 || Math.abs(e.clientY - pDown.y) > 14)) {
      pDown.pres.el.classList.remove('pres'); pDown.pres = null;
    }
    var ahora = performance.now();
    var maxK = Math.max(lista.length - 1, 0);
    var raw = pDown.k + (pDown.y - e.clientY) / dz * 0.32;
    if (raw > maxK) {
      overPx = (raw - maxK) * dz; overPx2 = 0;
      camK = maxK;
      if (overPx > 46) { if (!overDesde) overDesde = performance.now(); avisar(''+(window.PV_LANG==='en'?'Release to refresh':'Suelta para actualizar')+' \u21bb', null, 500); } else overDesde = 0;
    } else if (raw < 0) {
      overPx2 = (0 - raw) * dz; overPx = 0;
      camK = 0;
      if (overPx2 > 46) { if (!overDesde) overDesde = performance.now(); avisar(''+(window.PV_LANG==='en'?'Release to refresh':'Suelta para actualizar')+' \u21bb', null, 500); } else overDesde = 0;
    } else { overPx = 0; overPx2 = 0; overDesde = 0; camK = clampCam(raw); }
    var dt = ahora - pDown.lt;
    if (dt > 0) vel = ((pDown.ly - e.clientY) / dz) * 0.32 * Math.min(1, 16 / dt);
    pDown.ly = e.clientY; pDown.lt = ahora;
    render();
  });

  zona.addEventListener('pointerup', function (e) {
    /* v15.17: recargar solo con gesto deliberado: mas de 140px de sobre-arrastre Y sostenido al menos 400ms (un flick no recarga) */
    var deliberado = (overPx > 140 || overPx2 > 140) && overDesde && (performance.now() - overDesde) > 400;
    overDesde = 0;
    if (deliberado) { avisar(pvT('Actualizando\u2026','Updating\u2026')); setTimeout(function(){ location.reload(); }, 220); return; }
    overPx = 0; overPx2 = 0;
    if (!pDown) return;
    if (pDown.pres) { pDown.pres.el.classList.remove('pres'); }
    var fueTap = Math.abs(e.clientY - pDown.y) < 14 && Math.abs(e.clientX - pDown.x) < 14 &&
                 (performance.now() - pDown.t) < 550;
    arrastrando = false; pDown = null;
    svg.classList.remove('arrastrando');
    if (fueTap) {
      var fr = foco.getBoundingClientRect();
      var dentroFoco = e.clientX >= fr.left && e.clientX <= fr.right && e.clientY >= fr.top && e.clientY <= fr.bottom;
      var chk = foco.querySelector('#f-check');
      var cr = chk ? chk.getBoundingClientRect() : null;
      var dentroCheck = cr && e.clientX >= cr.left - 6 && e.clientX <= cr.right + 6 && e.clientY >= cr.top - 6 && e.clientY <= cr.bottom + 6;
      /* 🌐 La pill de idioma vive encima del lienzo: este manejador decide por
       COORDENADAS, así que hay que preguntarle explícitamente quién fue tocado. */
    /* Este manejador decide por COORDENADAS y su e.target ya no es la pill.
       La pregunta correcta es qué hay VISUALMENTE en ese punto de la pantalla. */
    try {
      var _enPunto = document.elementFromPoint(e.clientX, e.clientY);
      if (_enPunto && _enPunto.closest && _enPunto.closest('#tgLangPill')) return;
    } catch (_e) {}
    if (dentroFoco && !dentroCheck) { abrirHoja(Math.max(0, Math.min(lista.length - 1, Math.round(camK)))); }
      else if (!dentroCheck && !tocar(e.clientX, e.clientY)) snap(220);
    }
    else requestAnimationFrame(inercia);
  });

  zona.addEventListener('pointercancel', function () {
    if (pDown && pDown.pres) pDown.pres.el.classList.remove('pres');
    arrastrando = false; pDown = null; svg.classList.remove('arrastrando'); snap(260);
  });

  zona.addEventListener('wheel', function (e) {
    if (hoja.classList.contains('ver')) return;
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
    if (document.elementFromPoint) {
      var el = document.elementFromPoint(mx, my);
      while (el && el !== document.body) {
        if (el.dataset && el.dataset.k !== undefined && nodosVivos[el.dataset.k]) return nodosVivos[el.dataset.k];
        if (el.classList && el.classList.contains('nodo')) {
          for (var kk2 in nodosVivos) if (nodosVivos[kk2].el === el) return nodosVivos[kk2];
        }
        el = el.parentNode;
      }
    }
    var mejor = null, md = 27;
    for (var kk in nodosVivos) {
      var nv = nodosVivos[kk]; if (!nv || !nv.el || !nv.el.getBoundingClientRect) continue;
      var r = nv.el.getBoundingClientRect();
      var dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
      var dd = Math.sqrt(dx * dx + dy * dy);
      if (dd < md) { md = dd; mejor = nv; }
    }
    return mejor;
  }

  function tocar(mx, my) {
    var r = nodoEn(mx, my);
    if (r) { tocarNodo(r.k); return true; }
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

  /* 🌐 ETIQ se recalcula: antes era una constante congelada en el idioma del
     arranque, así que repintar no cambiaba los sellos. */
  var ETIQ = {};
  function __refrescaEtiq(){
    ETIQ.pendiente = pvT("TE ESPERA", "WAITING FOR YOU");
    ETIQ.en_curso  = pvT("EN CURSO", "IN PROGRESS");
    ETIQ.resuelto  = pvT("HECHA", "DONE");
    ETIQ.pospuesto = pvT("EN PAUSA", "ON HOLD");
  }
  __refrescaEtiq();

  /* v15.2 · Tarjeta sinfonica: cabecera en dos columnas (portada | titulo + voz completa),
     pie bajo el video; el video se pausa al cerrar y si reabres la MISMA edicion no se
     reconstruye el iframe (sigue donde se pauso).
     v15.3 · Video sinfonico:
       - rotacion por rol (abrir -> profundizar -> aterrizar -> resonar) segun visitas a la edicion;
       - marcador de posicion persistente (localStorage, 30 dias): un video a medio ver gana a la
         rotacion y el iframe nace en ese segundo (start=);
       - video muerto (el player avisa onError) -> siguiente candidato, o sin video;
       - subtitulos en espanol por default en videos que no son en espanol;
       - metricas honestas: video_play (primer play) · video_fin · video_segundos (al cerrar).
     El player solo reporta despues del saludo 'listening': se manda al cargar cada iframe. */
  var hojaK = -1;
  var ROLES_ORDEN = ['abrir', 'profundizar', 'aterrizar', 'resonar'];
  var VID_RE = /^[A-Za-z0-9_-]{11}$/;
  var MEM_KEY = 'triggui_espiral_video';
  var MARCA_MIN = 10;            /* segundos vistos para que el marcador gane a la rotacion */
  var MARCA_DIAS = 30;
  var yt = { video: '', t: 0, t0: 0, estado: -1, play: false, fin: false, muertos: {} };

  function memLeer() {
    var m = null;
    try { m = JSON.parse(localStorage.getItem(MEM_KEY) || 'null'); } catch (e) {}
    if (!m || typeof m !== 'object') m = {};
    if (!m.visitas || typeof m.visitas !== 'object') m.visitas = {};
    if (!m.marcas || typeof m.marcas !== 'object') m.marcas = {};
    var lim = Date.now() - MARCA_DIAS * 864e5, id;
    for (id in m.marcas) { if (!m.marcas[id] || !(m.marcas[id].at > lim)) delete m.marcas[id]; }
    return m;
  }
  function memGuardar(m) { try { localStorage.setItem(MEM_KEY, JSON.stringify(m)); } catch (e) {} }

  /* candidatos vivos de la edicion, ordenados por rol sinfonico (sin rol: al final, en su orden) */
  function candidatos(it) {
    var vs = (it.videos || []).filter(function (v) { return v && VID_RE.test(String(v.id)) && !yt.muertos[v.id]; });
    if (!vs.length && it.video && VID_RE.test(String(it.video)) && !yt.muertos[it.video]) {
      vs = [{ id: it.video, pie: it.pie || '', rol: '', idioma: '', titulo: '' }];
    }
    return vs.slice().sort(function (a, b) {
      var ia = ROLES_ORDEN.indexOf(a.rol), ib = ROLES_ORDEN.indexOf(b.rol);
      return (ia < 0 ? 9 : ia) - (ib < 0 ? 9 : ib);
    });
  }

  /* video de la apertura n: el marcador a medio ver gana; si no, rota por rol */
  function elegirVideo(it, n) {
    var vs = candidatos(it);
    if (!vs.length) return null;
    var m = memLeer().marcas[it.id];
    if (m && !m.fin && m.t >= MARCA_MIN) {
      for (var i = 0; i < vs.length; i++) { if (vs[i].id === m.video) return { v: vs[i], start: Math.floor(m.t) }; }
    }
    return { v: vs[n % vs.length], start: 0 };
  }

  function srcVideo(v, start) {
    var u = 'https://www.youtube-nocookie.com/embed/' + v.id + '?rel=0&modestbranding=1&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
    if (start > 0) u += '&start=' + start;
    if (v.idioma && v.idioma !== 'es') u += '&cc_lang_pref=es&cc_load_policy=1';
    return u;
  }

  function htmlVideo(v, start) {
    return '<div class="h-video"><iframe src="' + srcVideo(v, start) + '" title="' + esc(v.titulo || 'Video') + '" frameborder="0" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>' +
      (pvF(v,'pie') ? '<p class="h-pie">' + esc(pvF(v,'pie')) + '</p>' : '');
  }

  function iframeActual() { return hoja.querySelector('.h-video iframe'); }

  function ytPost(obj) {
    var f = iframeActual();
    if (!f || !f.contentWindow) return;
    try { f.contentWindow.postMessage(JSON.stringify(obj), '*'); } catch (e) {}
  }
  function ytEscuchar() { ytPost({ event: 'listening', id: 'triggui', channel: 'widget' }); }
  function ytCmd(func) { ytEscuchar(); ytPost({ event: 'command', func: func, args: [] }); }

  /* un iframe recien puesto: estado limpio + saludo cuando cargue */
  function montarVideo(v, start) {
    yt.video = v.id; yt.t = start; yt.t0 = start; yt.estado = -1; yt.play = false; yt.fin = false;
    var f = iframeActual();
    if (f) f.addEventListener('load', ytEscuchar);
  }

  /* guarda la posicion del video actual para esta edicion (fin=true la cierra: vuelve la rotacion) */
  function marcar(fin) {
    var it = lista[hojaK]; if (!it || !yt.video) return;
    if (!fin && yt.fin) return;          /* ya termino: la marca de fin se conserva (vuelve la rotacion) */
    var m = memLeer();
    m.marcas[it.id] = { video: yt.video, t: fin ? 0 : Math.floor(yt.t), fin: !!fin, at: Date.now() };
    memGuardar(m);
  }

  function ga(nombre, extra) {
    var it = lista[hojaK];
    var p = { edicion: it ? it.id : '', video: yt.video };
    if (extra) { for (var k in extra) { p[k] = extra[k]; } }
    try { gtag('event', nombre, p); } catch (e) {}
  }

  /* el player avisa error (borrado, privado, sin incrustar): siguiente candidato, o sin video */
  function videoMuerto() {
    var it = lista[hojaK]; if (!it || !yt.video) return;
    yt.muertos[yt.video] = true;
    var cont = hoja.querySelector('.h-video'), pie = hoja.querySelector('.h-pie');
    if (pie && pie.parentNode) pie.parentNode.removeChild(pie);
    if (!cont || !cont.parentNode) return;
    var vs = candidatos(it);
    if (vs.length) {
      var tmp = document.createElement('div');
      tmp.innerHTML = htmlVideo(vs[0], 0);
      while (tmp.firstChild) { cont.parentNode.insertBefore(tmp.firstChild, cont); }
      cont.parentNode.removeChild(cont);
      montarVideo(vs[0], 0);
    } else {
      cont.parentNode.removeChild(cont);
      hoja.classList.remove('con-video');
      yt.video = '';
    }
  }

  function ytEstado(estado) {
    if (typeof estado !== 'number' || estado === yt.estado) return;
    yt.estado = estado;
    if (estado === 1) { yt.fin = false; if (!yt.play) { yt.play = true; ga('video_play'); } }
    if (estado === 2) marcar(false);
    if (estado === 0) { yt.fin = true; marcar(true); ga('video_fin', { segundos: Math.round(yt.t) }); }
  }

  window.addEventListener('message', function (e) {
    if (!/youtube/.test(String(e.origin))) return;
    var d = null;
    try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (er) { return; }
    if (!d || !d.event) return;
    if (d.event === 'onError') { videoMuerto(); return; }
    if (d.event === 'onStateChange') { ytEstado(d.info); return; }
    var info = d.info;
    if (!info || typeof info !== 'object') return;
    if (typeof info.currentTime === 'number') yt.t = info.currentTime;
    ytEstado(info.playerState);
  });

  window.addEventListener('pagehide', function () { if (hojaAbierta && yt.video) marcar(false); });

  var hojaAbiertaEn = 0;   /* v15.15: instante en que abrio la hoja (el velo ignora la cola del mismo toque) */
  function abrirHoja(k) {
    hojaAbiertaEn = performance.now();
    var it = lista[k];
    if (!(k === hojaK && iframeActual())) {
      var mem = memLeer(), visita = mem.visitas[it.id] || 0;
      var sel = elegirVideo(it, visita);
      mem.visitas[it.id] = visita + 1; memGuardar(mem);
      var pvF=function(o,c){ return (window.PV_LANG==='en'&&o&&o[c+'_en'])?o[c+'_en']:((o&&o[c])||''); };
    var html = '<div class="asa"></div>' +
        '<button class="h-cierra" aria-label="'+pvT('Cerrar','Close')+'">\u2715</button>' +
        '<div class="h-sem">#' + String(it.id).replace('ED-','') + ' \u00b7 ' + esc(fechaLarga(it.semana).toUpperCase()) + '</div>' +
        '<div class="h-cab">' +
          (it.portada ? '<img class="h-portada" src="' + esc(it.portada) + '" alt="" loading="lazy">' : '') +
          '<div class="h-txt">' +
            '<div class="h-libro">' + esc(pvTitulo(it)) + '</div>' +
            (pvF(it,'voz') ? '<p class="h-voz">' + esc(pvF(it,'voz')) + '</p>' : '') +
          '</div>' +
        '</div>' +
        (pvF(it,'hallazgo') ? '<p class="h-frase">' + esc(pvF(it,'hallazgo')) + '</p>' : '') +
        (sel ? htmlVideo(sel.v, sel.start) : '') +
        '<div class="h-fila">' +
          (it.slug ? '<a class="h-ver" href="/t/' + esc(it.slug) + '/">'+((window.PV_LANG==='en')?'SEE THE EDITION \u2192':'VER LA EDICI\u00d3N \u2192')+'</a>' : '') +
        '</div>';
      hoja.innerHTML = html;
      hoja.classList.toggle('con-video', !!sel);
      hoja.querySelector('.h-cierra').addEventListener('click', cerrarHoja);
      hojaK = k;
      if (sel) montarVideo(sel.v, sel.start); else { yt.video = ''; yt.play = false; }
    }
    hojaAbierta = true;
    velo.classList.add('ver');
    hoja.classList.add('ver');
    hoja.scrollTop = 0;
    layout(false);
    tweenCam(k, 340, easeOutCubic, null);
  }

  function cerrarHoja() {
    if (yt.video) {
      ytCmd('pauseVideo');
      marcar(false);
      if (yt.play) ga('video_segundos', { segundos: Math.round(yt.t), visto: Math.max(0, Math.round(yt.t - yt.t0)) });
    }
    hojaAbierta = false;
    velo.classList.remove('ver');
    hoja.classList.remove('ver');
    layout(false);
    tweenCam(Math.round(camK), 300, easeOutCubic, null);
  }

  velo.addEventListener('click', function () {
    /* v15.15: la hoja abre en pointerup; Chrome Android dirige el click del MISMO toque al elemento que hay
       bajo el dedo en ese instante (el velo recien aparecido). Ese click no es una orden de cerrar. */
    if (performance.now() - hojaAbiertaEn < 450) return;
    cerrarHoja();
  });

  /* ---------- Palomear del usuario (Triggui) ---------- */
  function leerHechas() {
    try { return JSON.parse(store.get('triggui_espiral_hechas') || '{}'); } catch (e) { return {}; }
  }
  function guardarHechas(m) { store.set('triggui_espiral_hechas', JSON.stringify(m)); }
  window.__syncRefresh = function () {
    try {
      var m = leerHechas();
      for (var k = 0; k < lista.length; k++) {
        var it = lista[k];
        if (m[it.id]) { if (it.estado !== 'resuelto') { it.estado = 'resuelto'; it.resuelto_el = m[it.id]; } }
        else if (it.estado === 'resuelto') { it.estado = 'pendiente'; delete it.resuelto_el; }
      }
      racha = calcRacha(lista); cont = calcContadores(lista);
      repintarTodo(); pintarHud(); pintarCarita();
    } catch (e) {}
  };
  window.__aplicarHechas = function (arr) {
    var m = leerHechas();
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i];
      if (m[it.id]) { it.estado = 'resuelto'; it.resuelto_el = m[it.id]; }
    }
  };
  function viajarA(k, dur) {
    var d0 = camK, dK = k - d0, t0 = performance.now();
    function paso(t) {
      var p = Math.min(1, (t - t0) / (dur || 420));
      var e = 1 - Math.pow(1 - p, 3);
      camK = d0 + dK * e;
      render();
      if (p < 1) requestAnimationFrame(paso); else { camK = k; render(); }
    }
    requestAnimationFrame(paso);
  }

  function tocarNodo(k) {
    var centro = Math.max(0, Math.min(lista.length - 1, Math.round(camK)));
    if (k === centro) { abrirHoja(k); }
    else { viajarA(k, 420); }
  }

  function togglearHecha(k) {
    var it = lista[k]; if (!it) return;
    var m = leerHechas();
    if (it.estado === 'resuelto') {
      it.estado = 'pendiente'; delete it.resuelto_el; delete m[it.id];
      try { gtag('event', 'senal_deshecha', { edicion: it.id }); } catch (e) {}
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
    }
    guardarHechas(m); try{ if(window.__syncHecha) window.__syncHecha(it.id, it.estado==='resuelto'); }catch(e){}
    racha = calcRacha(lista); cont = calcContadores(lista);
    repintarTodo(); pintarHud(); pintarCarita(); guardarMemoria();
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
      ['#6a6a76', 'M-4 2.6 q4 -3 8 0'],
      ['#9a9aa6', 'M-4 2.6 q4 -2 8 0'],
      ['#d9a83c', 'M-4 2 h8'],
      ['#b8d94a', 'M-4 1.4 q4 3 8 0'],
      ['#34D399', 'M-4 0.8 q4 5 8 0']
    ];
    var idx = pct >= 0.99 ? 4 : pct >= 0.75 ? 3 : pct >= 0.5 ? 2 : pct >= 0.25 ? 1 : 0;
    var c = caras[idx];
    var W = 144, H = 26, cy = H / 2, cx = 11 + pct * (W - 22);
    var cs = getComputedStyle(document.documentElement);
    var g1 = (cs.getPropertyValue('--gold') || '#E8A838').trim() || '#E8A838';
    var g2 = (cs.getPropertyValue('--gold-2') || '#FF6B4A').trim() || '#FF6B4A';
    prog.innerHTML =
      '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="display:block;overflow:visible">' +
        '<defs><linearGradient id="hudGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[0] + '" stop-opacity="0.55"/></linearGradient></defs>' +
        '<line x1="2" y1="' + cy + '" x2="' + (W - 2) + '" y2="' + cy + '" stroke="rgba(245,240,232,.16)" stroke-width="5" stroke-linecap="round"/>' +
        '<line x1="2" y1="' + cy + '" x2="' + Math.max(2.01, 2 + pct * (W - 4)) + '" y2="' + cy + '" stroke="url(#hudGrad)" stroke-width="5" stroke-linecap="round"/>' +
        '<g transform="translate(' + cx.toFixed(1) + ' ' + cy + ')">' +
          '<circle r="10" fill="#0B0F1A" stroke="' + c[0] + '" stroke-width="1.6"/>' +
          '<circle cx="-3.4" cy="-2.4" r="1.15" fill="' + c[0] + '"/><circle cx="3.4" cy="-2.4" r="1.15" fill="' + c[0] + '"/>' +
          '<path d="' + c[1] + '" stroke="' + c[0] + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
        '</g>' +
      '</svg>';
    var cap = document.getElementById('hud-pcap');
    if (cap) { cap.style.color = c[0]; cap.textContent = (window.PV_LANG==='en') ? ("YOU'VE DONE " + hechas + ' OF ' + total + (racha > 1 ? (' \u00b7 STREAK ' + racha) : '')) : ('HAS HECHO ' + hechas + ' DE ' + total + (racha > 1 ? (' \u00b7 RACHA ' + racha) : '')); }
  }
  

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

  /* v15.13 · sonda de estado para diagnostico (solo lectura) */
  /* 🌐 Repintado por cambio de idioma: pvT/pvTitulo leen PV_LANG en cada llamada,
   así que basta volver a dibujar — sin recargar la página. */
  window.__pvRepinta = function () {
    try { __refrescaEtiq(); } catch (e) {}
    /* 🌐 Reconstruir los datos: el texto del accionable se congelaba al arrancar */
    /* Se recuerda qué hoja estaba abierta ANTES de reconstruir, para volver a
       pintarla en el idioma nuevo. (El return anterior la dejaba en el idioma viejo.) */
    var __hk = (typeof hojaK === 'number') ? hojaK : -1;
    try {
      if (typeof window.__construyeInsights === 'function' && window.__PREVIEW_DATA__) {
        window.__PREVIEW_DATA__.insights = window.__construyeInsights();
        if (typeof boot === 'function') {
          boot(window.__PREVIEW_DATA__);
          if (__hk >= 0 && typeof abrirHoja === 'function') {
            try { hojaK = -1; abrirHoja(__hk); } catch (e2) {}
          }
          return;
        }
      }
    } catch (e) {}
    try { if (typeof hojaK === 'number' && hojaK >= 0 && typeof abrirHoja === 'function') abrirHoja(hojaK); } catch (e) {}
    try { repintarTodo(); } catch (e) {}
    try { pintarHud(); } catch (e) {}
    try { pintarCarita(); } catch (e) {}
  };
  window.__espiralEstado = function () {
    return { secuencia: secuencia, hoja: hoja.classList.contains('ver'), animando: animando, arrastrando: arrastrando, pDown: !!pDown,
             camK: Math.round(camK * 100) / 100, n: lista.length, movOk: MOV_OK, ignitando: ignitando, tweenId: tweenId };
  };

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
              avisar(pvT('Se\u00f1al hecha','Signal done'), racha >= 2 ? ((window.PV_LANG==='en') ? ('STREAK: ' + racha + ' MONDAYS IN A ROW') : ('RACHA: ' + racha + ' LUNES SEGUIDOS RESUELTOS')) : lista[k].id, 3200);
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
            avisar(pvT('Nueva se\u00f1al del lunes','New Monday signal'), fechaLarga(lista[k].semana).toUpperCase(), 2600);
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
    var hc = document.getElementById('hud-cliente');
    if (!hc.firstChild) hc.innerHTML = logo || ('<div class="cliente-nombre">' + esc(cli.nombre || '') + '</div>');
    var hd = document.getElementById('hud-datos');
    if (!document.getElementById('hud-prog')) {
      hd.innerHTML = '<div id="hud-prog"></div><div class="p-cap" id="hud-pcap"></div>';
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
    var destino = lista.length - 1;
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
        if (prev && resueltosNuevos.length) avisar(pvT('Se\u00f1al hecha','Signal done'), racha >= 2 ? ((window.PV_LANG==='en') ? ('STREAK: ' + racha + ' MONDAYS IN A ROW') : ('RACHA: ' + racha + ' LUNES SEGUIDOS RESUELTOS')) : '', 2600);
        else if (prev && llegadas.length) avisar(pvT('Nueva se\u00f1al del lunes','New Monday signal'), '', 2600);
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
