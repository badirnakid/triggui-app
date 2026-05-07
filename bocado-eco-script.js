// ═══════════════════════════════════════════════════════════════════════
// 🌒 TRIGGUI BOCADO Y ECO v6 — Fixes basados en feedback de Badir v5
// ═══════════════════════════════════════════════════════════════════════
//
// PROBLEMAS REPORTADOS EN V5 (en orden):
//
// 1. Transición de bloques "medio brusca" — inline styles ganaban sobre !important
//    de las classes y rompían la interpolación de transition.
//    FIX v6: ELIMINAR inline styles. Solo classes con !important.
//
// 2. Primera vuelta: botones dado/lupa llevan a "atmósfera vacía con logo".
//    Causa: showBocado aplicaba bm-content-fading al inner pero NUNCA lo quitaba.
//    Cuando lupa reabría overlay, inner seguía con opacity:0 + blur:8px.
//    En segunda vuelta funcionaba accidentalmente porque restoring del eco
//    previo (1000ms) seguía sobrescribiendo el fading nuevo del bocado.
//    FIX v6: showBocado limpia fading al final, igual que showEco.
//
// 3. Segunda vuelta: imagen portada no hace nada, emoji libro reinicia barra.
//    Probablemente relacionado al bug 1 (inline styles) — los bloques quedan
//    en estado inválido por inline residuales. Fix indirecto al eliminar
//    inline styles. Si persiste, será fix quirúrgico v7.
//
// FIXES v6 (3 cambios mínimos sobre v5):
//   A. Eliminar TODOS los inline styles en prepareBlocksForHarmonic y revealBlocksHarmonic
//   B. showBocado limpia bm-content-fading al final + aplica restoring transitorio
//   C. Limpieza adicional al final de revealBlocksHarmonic (defensivo)
// ═══════════════════════════════════════════════════════════════════════

(function setupBocadoEcoV6() {
  'use strict';

  var APPEAR_MS = 1500;
  var HOLD_MS = 2000;
  var DISAPPEAR_MS = 1200;
  var WORD_STAGGER_MS = 60;
  var BLOCK_STAGGER_MS = 110;
  var BLOCK_DURATION_MS = 800;
  var BOCADO_DELAY_MS = 100;
  var TOP_K = 5;

  var lastCandidatePool = [];
  var usedInThisSession = new Set();
  var bocadoActive = false;
  var ecoActive = false;
  var ecoJustEnded = 0;

  function trueRandom() {
    try {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        var arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return arr[0] / 4294967296;
      }
    } catch (_) {}
    return Math.random();
  }

  function cleanText(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/\[\/?H\]/gi, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  function getTopKCandidates(libros, query, k) {
    if (!libros || libros.length === 0) return [];
    var cleanQuery = String(query || '').trim();
    function shuffleSlice(arr, n) {
      var s = arr.slice();
      for (var i = s.length - 1; i > 0; i--) {
        var j = Math.floor(trueRandom() * (i + 1));
        var tmp = s[i]; s[i] = s[j]; s[j] = tmp;
      }
      return s.slice(0, n);
    }
    if (!cleanQuery) return shuffleSlice(libros, k);
    if (typeof TrigguiFiltro === 'undefined' || !TrigguiFiltro._idxCache) return shuffleSlice(libros, k);
    var idx = TrigguiFiltro._idxCache;
    var tokens = TrigguiFiltro.tokenize ? TrigguiFiltro.tokenize(cleanQuery) : cleanQuery.toLowerCase().split(/\s+/);
    if (!tokens || tokens.length === 0) return libros.slice(0, k);
    var scores = [];
    for (var i = 0; i < libros.length; i++) {
      var bookVec = (idx.bookVectors && idx.bookVectors[i]) || {};
      var score = 0;
      for (var t = 0; t < tokens.length; t++) {
        var token = tokens[t];
        var tf = bookVec[token] || 0;
        if (tf > 0) score += tf * ((idx.idf && idx.idf[token]) || 1);
      }
      scores.push({ libro: libros[i], score: score });
    }
    scores.sort(function(a, b) { return b.score - a.score; });
    if (scores[0].score === 0) return shuffleSlice(libros, k);
    var result = [];
    for (var r = 0; r < Math.min(k, scores.length); r++) result.push(scores[r].libro);
    return result;
  }

  function buildPhrasePool(libros, query) {
    var candidates = getTopKCandidates(libros, query, TOP_K);
    var pool = [];
    var lang = (typeof TriggguiI18n !== 'undefined' && TriggguiI18n.lang) || 'es';
    for (var c = 0; c < candidates.length; c++) {
      var libro = candidates[c];
      if (!libro) continue;
      var frasesField = (lang === 'en' && Array.isArray(libro.frases_en) && libro.frases_en.length === 4) ? libro.frases_en : libro.frases;
      if (Array.isArray(frasesField)) {
        for (var f = 0; f < frasesField.length; f++) {
          var clean = cleanText(frasesField[f]);
          if (clean.length >= 8 && clean.length <= 140) pool.push({ text: clean, source: libro.titulo || 'unknown' });
        }
      }
      var tarjeta = (lang === 'en' && libro.tarjeta_en) ? libro.tarjeta_en : libro.tarjeta;
      if (tarjeta && tarjeta.subtitulo) {
        var cleanSub = cleanText(tarjeta.subtitulo);
        if (cleanSub.length >= 8 && cleanSub.length <= 140) pool.push({ text: cleanSub, source: libro.titulo || 'unknown' });
      }
    }
    return pool;
  }

  function pickPhrase() {
    if (!lastCandidatePool || lastCandidatePool.length === 0) return null;
    var available = [];
    for (var i = 0; i < lastCandidatePool.length; i++) {
      if (!usedInThisSession.has(lastCandidatePool[i].text)) available.push(lastCandidatePool[i]);
    }
    if (available.length === 0) {
      usedInThisSession.clear();
      available = lastCandidatePool.slice();
    }
    return available[Math.floor(trueRandom() * available.length)];
  }

  function segmentPhrase(text) {
    var words = String(text || '').split(/\s+/).filter(function(w) { return w.length > 0; });
    var n = words.length;
    if (n < 2) return { body: '', anchor: words.join(' ') };
    var anchorCount = n <= 4 ? 1 : 2;
    return {
      body: words.slice(0, n - anchorCount).join(' '),
      anchor: words.slice(n - anchorCount).join(' ')
    };
  }

  function buildPhraseHTML(text, accentColor) {
    var seg = segmentPhrase(text);
    var html = '';
    var delay = 0;
    if (seg.body) {
      var bodyWords = seg.body.split(/\s+/);
      for (var i = 0; i < bodyWords.length; i++) {
        html += '<span class="bm-bocado-w" style="animation-delay:' + delay + 'ms">' + bodyWords[i] + '&nbsp;</span>';
        delay += WORD_STAGGER_MS;
      }
    }
    html += '<span class="bm-bocado-anchor" style="animation-delay:' + delay + 'ms;color:' + accentColor + ';position:relative;">' + seg.anchor + '</span>';
    return html;
  }

  function ensureStyles() {
    if (document.getElementById('triggui-bocado-eco-styles')) return;
    var style = document.createElement('style');
    style.id = 'triggui-bocado-eco-styles';
    style.textContent = [
      '@keyframes triggui-word-appear {',
      '  0%   { opacity: 0; transform: translateY(8px); filter: blur(12px); }',
      '  100% { opacity: 1; transform: translateY(0); filter: blur(0); }',
      '}',
      '@keyframes triggui-underline-appear {',
      '  0%   { opacity: 0; transform: scaleX(0); }',
      '  60%  { opacity: 1; transform: scaleX(1); }',
      '  100% { opacity: 0.65; transform: scaleX(1); }',
      '}',
      '.bm-bocado-w, .bm-bocado-anchor {',
      '  display: inline-block; opacity: 0;',
      '  animation: triggui-word-appear ' + APPEAR_MS + 'ms cubic-bezier(0.19, 1, 0.22, 1) forwards;',
      '  will-change: opacity, transform, filter;',
      '}',
      '.bm-bocado-anchor { font-weight: 400; }',
      '.bm-bocado-anchor::after {',
      '  content: ""; position: absolute;',
      '  left: 8%; right: 8%; bottom: -6px; height: 1px;',
      '  opacity: 0; transform: scaleX(0);',
      '  animation: triggui-underline-appear ' + (APPEAR_MS + 600) + 'ms cubic-bezier(0.19, 1, 0.22, 1) forwards;',
      '  animation-delay: ' + (APPEAR_MS * 0.6) + 'ms;',
      '}',
      '.bm-bocado-fading {',
      '  transition: opacity ' + DISAPPEAR_MS + 'ms cubic-bezier(0.55, 0, 0.55, 1), filter ' + DISAPPEAR_MS + 'ms cubic-bezier(0.55, 0, 0.55, 1) !important;',
      '  opacity: 0 !important; filter: blur(10px) !important;',
      '}',
      '.bm-content-fading {',
      '  transition: opacity 600ms cubic-bezier(0.55, 0, 0.55, 1), filter 600ms cubic-bezier(0.55, 0, 0.55, 1) !important;',
      '  opacity: 0 !important; filter: blur(8px) !important; pointer-events: none !important;',
      '}',
      '.bm-content-restoring {',
      '  transition: opacity 800ms cubic-bezier(0.19, 1, 0.22, 1), filter 800ms cubic-bezier(0.19, 1, 0.22, 1) !important;',
      '  opacity: 1 !important; filter: blur(0) !important;',
      '}',
      // ═══════════════════════════════════════════════════════════════════
      // 🔥 OVERRIDE NUCLEAR: matar la animación CSS nativa de bloques
      // El index.html tiene `.block { animation: tg-block-enter 520ms ... both }`
      // con cascada nth-child(40/90/140/190ms). La eliminamos completamente.
      // ═══════════════════════════════════════════════════════════════════
      '#grid .block, .grid .block, body .block {',
      '  animation: none !important;',
      '  -webkit-animation: none !important;',
      '  animation-delay: 0s !important;',
      '  -webkit-animation-delay: 0s !important;',
      '}',
      '#grid .block:nth-child(1), .grid .block:nth-child(1),',
      '#grid .block:nth-child(2), .grid .block:nth-child(2),',
      '#grid .block:nth-child(3), .grid .block:nth-child(3),',
      '#grid .block:nth-child(4), .grid .block:nth-child(4) {',
      '  animation: none !important;',
      '  -webkit-animation: none !important;',
      '  animation-delay: 0s !important;',
      '  -webkit-animation-delay: 0s !important;',
      '}',
      // ── Entrada armónica de bloques (3 estados con !important) ──
      '#grid .block.bm-harmonic-entry, .block.bm-harmonic-entry {',
      '  opacity: 0 !important;',
      '  transform: translateY(12px) !important;',
      '  filter: blur(8px) !important;',
      '  animation: none !important;',
      '  -webkit-animation: none !important;',
      '  transition: none !important;',
      '  -webkit-transition: none !important;',
      '  will-change: opacity, transform, filter;',
      '}',
      '#grid .block.bm-harmonic-prepare, .block.bm-harmonic-prepare {',
      '  transition: opacity ' + BLOCK_DURATION_MS + 'ms cubic-bezier(0.19, 1, 0.22, 1), ' +
      '              transform ' + BLOCK_DURATION_MS + 'ms cubic-bezier(0.19, 1, 0.22, 1), ' +
      '              filter ' + BLOCK_DURATION_MS + 'ms cubic-bezier(0.19, 1, 0.22, 1) !important;',
      '  -webkit-transition: opacity ' + BLOCK_DURATION_MS + 'ms cubic-bezier(0.19, 1, 0.22, 1), ' +
      '              transform ' + BLOCK_DURATION_MS + 'ms cubic-bezier(0.19, 1, 0.22, 1), ' +
      '              filter ' + BLOCK_DURATION_MS + 'ms cubic-bezier(0.19, 1, 0.22, 1) !important;',
      '}',
      '#grid .block.bm-harmonic-prepare.bm-harmonic-show, .block.bm-harmonic-prepare.bm-harmonic-show {',
      '  opacity: 1 !important;',
      '  transform: translateY(0) !important;',
      '  filter: blur(0) !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── BOCADO: dentro del overlay barra mágica ──
  function showBocado() {
    var phrase = pickPhrase();
    if (!phrase) return;
    usedInThisSession.add(phrase.text);
    bocadoActive = true;
    ensureStyles();

    var overlay = document.getElementById('barraMagicaOverlay');
    if (!overlay) { bocadoActive = false; return; }

    var accentColor = (getComputedStyle(overlay).getPropertyValue('--bm-accent') || '').trim() || '#FF5E00';

    var inner = overlay.querySelector('.barra-magica-inner');
    var skipEl = document.getElementById('barraSkip');
    var langEl = document.getElementById('barraLangToggle');
    var streakEl = document.getElementById('barraStreak');

    // Aplicar fading
    if (inner) inner.classList.add('bm-content-fading');
    if (skipEl) skipEl.classList.add('bm-content-fading');
    if (langEl) langEl.classList.add('bm-content-fading');
    if (streakEl) streakEl.classList.add('bm-content-fading');

    var bocadoBox = document.createElement('div');
    bocadoBox.id = 'triggui-bocado-box';
    bocadoBox.style.cssText = 'position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;padding:0 32px;pointer-events:none';

    var phraseEl = document.createElement('div');
    phraseEl.className = 'bm-bocado-phrase';
    phraseEl.style.cssText = "font-family:'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Archivo', sans-serif;font-weight:300;font-size:clamp(22px, 6vw, 30px);line-height:1.32;color:#fff;text-align:center;max-width:640px;letter-spacing:-0.5px;-webkit-font-smoothing:antialiased";
    phraseEl.innerHTML = buildPhraseHTML(phrase.text, accentColor);

    var customStyle = document.createElement('style');
    customStyle.id = 'triggui-bocado-anchor-color';
    customStyle.textContent = '#triggui-bocado-box .bm-bocado-anchor::after { background: linear-gradient(90deg, transparent, ' + accentColor + ', transparent); }';
    document.head.appendChild(customStyle);

    bocadoBox.appendChild(phraseEl);
    overlay.appendChild(bocadoBox);

    var totalWords = phrase.text.split(/\s+/).length;
    var fullAppearMs = APPEAR_MS + totalWords * WORD_STAGGER_MS + 300;
    var holdEndMs = fullAppearMs + HOLD_MS;

    setTimeout(function() { phraseEl.classList.add('bm-bocado-fading'); }, holdEndMs);

    // 🔥 FIX v6 BUG B: limpiar fading al final del bocado
    // Cuando el bocado termina, quitar bm-content-fading e ignorar bm-content-restoring.
    // Usamos restoring transitorio para fade-in suave del contenido inner antes
    // de que el overlay se cierre con closeOverlay (que ocurre después).
    setTimeout(function() {
      if (bocadoBox.parentNode) bocadoBox.parentNode.removeChild(bocadoBox);
      var cs = document.getElementById('triggui-bocado-anchor-color');
      if (cs && cs.parentNode) cs.parentNode.removeChild(cs);

      // CRITICAL: limpiar fading del inner para próxima apertura del overlay
      if (inner) {
        inner.classList.remove('bm-content-fading');
        inner.classList.remove('bm-content-restoring');
      }
      if (skipEl) {
        skipEl.classList.remove('bm-content-fading');
        skipEl.classList.remove('bm-content-restoring');
      }
      if (langEl) {
        langEl.classList.remove('bm-content-fading');
        langEl.classList.remove('bm-content-restoring');
      }
      if (streakEl) {
        streakEl.classList.remove('bm-content-fading');
        streakEl.classList.remove('bm-content-restoring');
      }

      bocadoActive = false;
    }, holdEndMs + DISAPPEAR_MS + 100);

    if (typeof console !== 'undefined' && console.log) console.log('[Triggui Bocado v6]', '"' + phrase.text + '"', '←', phrase.source);
  }

  // ── BLOQUES: aplicar entry — SOLO CLASS, sin inline styles ──
  // 🔥 FIX v6 BUG A: el override CSS nuclear ya garantiza que la animación
  // CSS nativa NO corra. La clase entry con !important es suficiente.
  // Inline styles ganaban sobre !important y rompían la transición.
  function prepareBlocksForHarmonic() {
    var blocks = document.querySelectorAll('#grid .block, .grid .block');
    if (!blocks || blocks.length === 0) return 0;
    blocks.forEach(function(block) {
      block.classList.add('bm-harmonic-entry');
    });
    return blocks.length;
  }

  function revealBlocksHarmonic() {
    var blocks = document.querySelectorAll('#grid .block, .grid .block');
    if (!blocks || blocks.length === 0) return;

    blocks.forEach(function(block, i) {
      block.classList.add('bm-harmonic-entry');
      // SOLO transition-delay inline (no opacity/transform/filter)
      block.style.transitionDelay = (i * BLOCK_STAGGER_MS) + 'ms';
    });

    // Forzar reflow
    void document.body.offsetHeight;

    requestAnimationFrame(function() {
      blocks.forEach(function(block) {
        block.classList.add('bm-harmonic-prepare');
      });

      requestAnimationFrame(function() {
        blocks.forEach(function(block) {
          block.classList.add('bm-harmonic-show');
        });
      });
    });

    // Limpieza después de la animación
    var totalDuration = (blocks.length - 1) * BLOCK_STAGGER_MS + BLOCK_DURATION_MS + 200;
    setTimeout(function() {
      blocks.forEach(function(block) {
        block.classList.remove('bm-harmonic-entry');
        block.classList.remove('bm-harmonic-prepare');
        block.classList.remove('bm-harmonic-show');
        block.style.transitionDelay = '';
        // 🔥 FIX v6 BUG C defensivo: también limpiar inline styles si quedaron
        block.style.opacity = '';
        block.style.transform = '';
        block.style.filter = '';
      });
    }, totalDuration);
  }

  // ── ECO ──
  function showEco() {
    if (ecoActive) return;
    if (Date.now() - ecoJustEnded < 500) return;

    var phrase = pickPhrase();
    if (!phrase) {
      phrase = { text: 'gracias por leer', source: 'fallback' };
    }
    usedInThisSession.add(phrase.text);
    ecoActive = true;
    ensureStyles();

    var tarjeta = document.getElementById('tarjetaOverlay');
    var savedTarjetaTransition = '';
    if (tarjeta) {
      savedTarjetaTransition = tarjeta.style.transition;
      tarjeta.style.transition = 'none';
      tarjeta.classList.remove('visible');
      tarjeta.style.opacity = '0';
      tarjeta.style.display = 'none';
    }
    if (typeof window.cleanupCardListeners === 'function') {
      try { window.cleanupCardListeners(); } catch (_) {}
    }

    var overlay = document.getElementById('barraMagicaOverlay');
    if (!overlay) {
      ecoActive = false;
      if (tarjeta) tarjeta.style.transition = savedTarjetaTransition;
      return;
    }

    document.documentElement.classList.add('mood-active');
    document.documentElement.classList.remove('booting');
    document.body.classList.remove('booting');

    // Regenerar atmósfera ANTES del eco
    try {
      if (typeof BarraMagica !== 'undefined' && typeof BarraMagica.applyStrings === 'function') {
        BarraMagica.applyStrings();
      }
    } catch (_) {}

    overlay.style.transition = 'none';
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    overlay.style.pointerEvents = 'auto';
    overlay.classList.add('visible');

    void overlay.offsetHeight;
    overlay.style.transition = '';

    var accentColor = '';
    try {
      if (window._lastQuantumBlocks && window._lastQuantumBlocks.blocks && window._lastQuantumBlocks.blocks[0]) {
        var c = window._lastQuantumBlocks.blocks[0].c1;
        accentColor = 'hsl(' + c.h.toFixed(0) + ', ' + (c.s * 100).toFixed(0) + '%, ' +
                      Math.min(72, Math.max(58, c.l * 100 + 18)).toFixed(0) + '%)';
      }
    } catch (_) {}
    if (!accentColor) {
      accentColor = (getComputedStyle(overlay).getPropertyValue('--bm-accent') || '').trim() || '#FF5E00';
    }

    requestAnimationFrame(function() {
      var inner = overlay.querySelector('.barra-magica-inner');
      var skipEl = document.getElementById('barraSkip');
      var langEl = document.getElementById('barraLangToggle');
      var streakEl = document.getElementById('barraStreak');
      if (inner) inner.classList.add('bm-content-fading');
      if (skipEl) skipEl.classList.add('bm-content-fading');
      if (langEl) langEl.classList.add('bm-content-fading');
      if (streakEl) streakEl.classList.add('bm-content-fading');

      var ecoBox = document.createElement('div');
      ecoBox.id = 'triggui-eco-box';
      ecoBox.style.cssText = 'position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;padding:0 32px;pointer-events:none';

      var phraseEl = document.createElement('div');
      phraseEl.className = 'bm-eco-phrase';
      phraseEl.style.cssText = "font-family:'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Archivo', sans-serif;font-weight:300;font-size:clamp(22px, 6vw, 30px);line-height:1.32;color:#fff;text-align:center;max-width:640px;letter-spacing:-0.5px;-webkit-font-smoothing:antialiased";
      phraseEl.innerHTML = buildPhraseHTML(phrase.text, accentColor);

      var customStyle = document.createElement('style');
      customStyle.id = 'triggui-eco-anchor-color';
      customStyle.textContent = '#triggui-eco-box .bm-bocado-anchor::after { background: linear-gradient(90deg, transparent, ' + accentColor + ', transparent); }';
      document.head.appendChild(customStyle);

      ecoBox.appendChild(phraseEl);
      overlay.appendChild(ecoBox);

      var totalWords = phrase.text.split(/\s+/).length;
      var fullAppearMs = APPEAR_MS + totalWords * WORD_STAGGER_MS + 300;
      var holdEndMs = fullAppearMs + HOLD_MS;

      setTimeout(function() {
        phraseEl.classList.add('bm-bocado-fading');
      }, holdEndMs);

      setTimeout(function() {
        if (ecoBox.parentNode) ecoBox.parentNode.removeChild(ecoBox);
        var cs = document.getElementById('triggui-eco-anchor-color');
        if (cs && cs.parentNode) cs.parentNode.removeChild(cs);

        if (inner) {
          inner.classList.remove('bm-content-fading');
          inner.classList.add('bm-content-restoring');
        }
        if (skipEl) {
          skipEl.classList.remove('bm-content-fading');
          skipEl.classList.add('bm-content-restoring');
        }
        if (langEl) {
          langEl.classList.remove('bm-content-fading');
          langEl.classList.add('bm-content-restoring');
        }
        if (streakEl) {
          streakEl.classList.remove('bm-content-fading');
          streakEl.classList.add('bm-content-restoring');
        }

        try {
          if (typeof BarraMagica !== 'undefined' && typeof BarraMagica.applyStrings === 'function') {
            BarraMagica.applyStrings();
          }
        } catch (_) {}

        try {
          var input = document.getElementById('barraInput');
          if (input) {
            input.value = '';
          }
        } catch (_) {}

        setTimeout(function() {
          if (inner) inner.classList.remove('bm-content-restoring');
          if (skipEl) skipEl.classList.remove('bm-content-restoring');
          if (langEl) langEl.classList.remove('bm-content-restoring');
          if (streakEl) streakEl.classList.remove('bm-content-restoring');
        }, 1000);

        if (tarjeta) tarjeta.style.transition = savedTarjetaTransition;

        ecoActive = false;
        ecoJustEnded = Date.now();
      }, holdEndMs + DISAPPEAR_MS + 100);
    });

    if (typeof console !== 'undefined' && console.log) console.log('[Triggui Eco v6]', '"' + phrase.text + '"', '←', phrase.source);
  }

  function patchBarraMagica() {
    if (typeof BarraMagica === 'undefined') return false;
    if (BarraMagica._bocadoEcoV6Patched) return true;

    var originalSubmit = BarraMagica.submit.bind(BarraMagica);
    BarraMagica.submit = function(query) {
      try {
        var data = window.__TRIGGUI_DATA__;
        if (data && Array.isArray(data.libros) && data.libros.length > 0) {
          lastCandidatePool = buildPhrasePool(data.libros, query || '');
          usedInThisSession.clear();
        }
      } catch (e) {}
      setTimeout(function() {
        try { showBocado(); } catch (e) {}
      }, BOCADO_DELAY_MS);
      return originalSubmit(query);
    };

    var originalCloseOverlay = BarraMagica.closeOverlay.bind(BarraMagica);
    BarraMagica.closeOverlay = function(skipped, skipRender) {
      function doClose() {
        ensureStyles();
        prepareBlocksForHarmonic();
        void document.body.offsetHeight;

        try { originalCloseOverlay(skipped, skipRender); } catch (e) {}

        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            try { revealBlocksHarmonic(); } catch (e) {}
          });
        });
      }
      if (bocadoActive) {
        var maxWait = 6000, elapsed = 0;
        var iv = setInterval(function() {
          elapsed += 100;
          if (!bocadoActive || elapsed >= maxWait) {
            clearInterval(iv);
            doClose();
          }
        }, 100);
        return;
      }
      doClose();
    };

    BarraMagica._bocadoEcoV6Patched = true;
    return true;
  }

  function patchCloseCard() {
    if (typeof window.closeCard !== 'function') return false;
    if (window._closeCardBocadoEcoV6Patched) return true;

    var originalCloseCard = window.closeCard;
    window.closeCard = function() {
      try {
        showEco();
      } catch (e) {
        try { originalCloseCard.apply(this, arguments); } catch (_) {}
      }
    };

    window._closeCardBocadoEcoV6Patched = true;
    return true;
  }

  function patchOpenOverlayForLupa() {
    if (typeof BarraMagica === 'undefined') return false;
    if (BarraMagica._lupaBocadoEcoV6Patched) return true;
    if (typeof BarraMagica.openOverlay !== 'function') return false;

    var original = BarraMagica.openOverlay.bind(BarraMagica);
    BarraMagica.openOverlay = function(force) {
      if (Date.now() - ecoJustEnded < 500) return false;

      var tarjeta = document.getElementById('tarjetaOverlay');
      var tarjetaVisible = tarjeta && tarjeta.classList.contains('visible') && tarjeta.style.display !== 'none';
      if (tarjetaVisible && !ecoActive) {
        try { showEco(); } catch (e) {}
        return true;
      }

      if (ecoActive) return false;

      return original(force);
    };

    BarraMagica._lupaBocadoEcoV6Patched = true;
    return true;
  }

  function tryInstall() {
    var ok1 = patchBarraMagica();
    var ok2 = patchCloseCard();
    var ok3 = patchOpenOverlayForLupa();
    if (typeof console !== 'undefined' && console.log) {
      console.log('[Triggui BocadoEco v6] ' +
        (ok1 && ok2 && ok3 ? 'instalado nivel quark — fixes A B C activos' : 'parcial') +
        ' submit=' + ok1 + ' card=' + ok2 + ' lupa=' + ok3);
    }
  }

  function waitFor(predicate, action, attempts) {
    if (predicate()) { action(); return; }
    if (attempts <= 0) return;
    setTimeout(function() { waitFor(predicate, action, attempts - 1); }, 50);
  }

  waitFor(
    function() {
      return typeof BarraMagica !== 'undefined' &&
             typeof BarraMagica.submit === 'function' &&
             typeof BarraMagica.openOverlay === 'function' &&
             typeof window.closeCard === 'function';
    },
    tryInstall,
    80
  );
})();
