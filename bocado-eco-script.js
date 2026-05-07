// ═══════════════════════════════════════════════════════════════════════
// 🌒 TRIGGUI BOCADO Y ECO v5 — Diagnóstico nivel quark con código real
// ═══════════════════════════════════════════════════════════════════════
//
// FIXES v5 (todos basados en inspección directa del index.html):
//
// FIX 1 — Bloques sin doble entrada (línea 414-420 del index.html):
//   El CSS nativo tiene `.block { animation: tg-block-enter 520ms... both }`
//   con delays nth-child(40/90/140/190ms). Esto corre SIEMPRE al
//   display:none → display:block. Mi v4 no la mataba a tiempo.
//   v5 INYECTA override CSS que MATA esa animación COMPLETAMENTE,
//   dejando solo mi animación armónica como única fuente de cascada.
//
// FIX 2 — Eco con atmósfera viva:
//   Llamar BarraMagica.applyStrings() ANTES del eco regenera Quantum
//   Atmosphere (auroras nuevas) + accent + pregunta nueva.
//
// FIX 3 — Después del eco → barra con pregunta:
//   Mi v4 llamaba pickQuestion (que solo RETORNA, no actualiza DOM).
//   v5 SIEMPRE llama applyStrings (que actualiza DOM completo).
//
// FIX 4 — html.mood-active (no body):
//   El CSS del index.html usa selector `html.mood-active #grid {...}`.
//   Mi v4 ponía la clase en body. v5 la pone en html.
//
// FIX 5 — Lupa doble-trigger protection:
//   La lupa hace closeCard() + setTimeout(openOverlay, 350). Cuando
//   showEco corre por closeCard, el segundo openOverlay no debe
//   re-disparar nada. Mi patch lo intercepta limpiamente.
//
// FIX 6 — Aplicación inline + class para máxima robustez:
//   Los bloques entry usan ambos style.cssText con !important Y class,
//   garantizando que SE APLIQUEN antes del primer paint visible.
// ═══════════════════════════════════════════════════════════════════════

(function setupBocadoEcoV5() {
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
  var ecoJustEnded = 0; // timestamp de cuándo terminó el último eco

  // ── Random verdadero ──
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

  // ── CSS: incluye OVERRIDE DE LA ANIMACIÓN NATIVA DE BLOQUES ──
  function ensureStyles() {
    if (document.getElementById('triggui-bocado-eco-styles')) return;
    var style = document.createElement('style');
    style.id = 'triggui-bocado-eco-styles';
    style.textContent = [
      // ── Word + underline animations ──
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
      // 🔥 FIX CRÍTICO v5: MATAR LA ANIMACIÓN CSS NATIVA DE LOS BLOQUES
      // El index.html línea 414 declara `.block { animation: tg-block-enter ... both }`.
      // Esa cascada (40/90/140/190ms) se dispara cada vez que mood-active sale.
      // La eliminamos COMPLETAMENTE. Mi animación armónica la reemplaza.
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
    setTimeout(function() {
      if (bocadoBox.parentNode) bocadoBox.parentNode.removeChild(bocadoBox);
      var cs = document.getElementById('triggui-bocado-anchor-color');
      if (cs && cs.parentNode) cs.parentNode.removeChild(cs);
      bocadoActive = false;
    }, holdEndMs + DISAPPEAR_MS + 100);

    if (typeof console !== 'undefined' && console.log) console.log('[Triggui Bocado v5]', '"' + phrase.text + '"', '←', phrase.source);
  }

  // ── BLOQUES: aplicar entry — INLINE + class para garantía total ──
  function prepareBlocksForHarmonic() {
    var blocks = document.querySelectorAll('#grid .block, .grid .block');
    if (!blocks || blocks.length === 0) return 0;
    blocks.forEach(function(block) {
      block.classList.add('bm-harmonic-entry');
      // INLINE STYLE: prioridad absoluta sobre cualquier CSS, incluso con !important
      // Inline styles siempre ganan sobre CSS rules SIN !important.
      // Como mi clase entry tiene !important pero la animación CSS nativa no,
      // estos inline styles aseguran que opacity 0 se aplique al primer paint.
      block.style.opacity = '0';
      block.style.transform = 'translateY(12px)';
      block.style.filter = 'blur(8px)';
    });
    return blocks.length;
  }

  // ── BLOQUES: animar entrada armónica con stagger ──
  function revealBlocksHarmonic() {
    var blocks = document.querySelectorAll('#grid .block, .grid .block');
    if (!blocks || blocks.length === 0) return;

    blocks.forEach(function(block, i) {
      // Asegurar entry y inline styles
      block.classList.add('bm-harmonic-entry');
      block.style.opacity = '0';
      block.style.transform = 'translateY(12px)';
      block.style.filter = 'blur(8px)';
      // Stagger via transition-delay
      block.style.transitionDelay = (i * BLOCK_STAGGER_MS) + 'ms';
    });

    // Forzar reflow para que las clases entry se apliquen instantáneamente
    void document.body.offsetHeight;

    // Frame siguiente: agregar prepare (que añade transition)
    requestAnimationFrame(function() {
      blocks.forEach(function(block) {
        block.classList.add('bm-harmonic-prepare');
      });

      // Frame siguiente: agregar show (que dispara la transición)
      requestAnimationFrame(function() {
        blocks.forEach(function(block) {
          block.classList.add('bm-harmonic-show');
          // Quitar inline styles para que la transición a 'show' funcione
          // (las clases CSS con !important van a tomar control)
          block.style.opacity = '';
          block.style.transform = '';
          block.style.filter = '';
        });
      });
    });

    // Limpieza después de toda la animación
    var totalDuration = (blocks.length - 1) * BLOCK_STAGGER_MS + BLOCK_DURATION_MS + 200;
    setTimeout(function() {
      blocks.forEach(function(block) {
        block.classList.remove('bm-harmonic-entry');
        block.classList.remove('bm-harmonic-prepare');
        block.classList.remove('bm-harmonic-show');
        block.style.transitionDelay = '';
        block.style.opacity = '';
        block.style.transform = '';
        block.style.filter = '';
      });
    }, totalDuration);
  }

  // ── ECO: usa la barra mágica como contenedor (atmósfera viva) ──
  function showEco() {
    if (ecoActive) return;
    // Protección: si el eco acabó hace <500ms, ignorar (evita doble-trigger de lupa)
    if (Date.now() - ecoJustEnded < 500) return;

    var phrase = pickPhrase();
    if (!phrase) {
      // Sin pool, usar fallback simple
      phrase = { text: 'gracias por leer', source: 'fallback' };
    }
    usedInThisSession.add(phrase.text);
    ecoActive = true;
    ensureStyles();

    // ── PASO 1: Cerrar tarjeta INSTANTÁNEAMENTE (sin transición) ──
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

    // ── PASO 2: Mostrar barra mágica overlay con atmósfera FRESCA ──
    var overlay = document.getElementById('barraMagicaOverlay');
    if (!overlay) {
      ecoActive = false;
      if (tarjeta) tarjeta.style.transition = savedTarjetaTransition;
      return;
    }

    // 🔥 FIX 5: usar html.mood-active (no body) — el CSS del index lo requiere
    document.documentElement.classList.add('mood-active');
    document.documentElement.classList.remove('booting');
    document.body.classList.remove('booting');

    // 🔥 FIX 2: regenerar atmósfera ANTES del eco (auroras, accent, pregunta nuevos)
    try {
      if (typeof BarraMagica !== 'undefined' && typeof BarraMagica.applyStrings === 'function') {
        BarraMagica.applyStrings();
      }
    } catch (_) {}

    // Mostrar el overlay sin animación de entrada
    overlay.style.transition = 'none';
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    overlay.style.pointerEvents = 'auto';
    overlay.classList.add('visible');

    // Forzar reflow
    void overlay.offsetHeight;
    overlay.style.transition = '';

    // Determinar accent: usar el del libro actual si existe, sino el de la barra mágica
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

    // ── PASO 3: Aplicar fading al contenido de la barra ──
    // Esperar 1 frame para que applyStrings termine, después aplicar fading
    requestAnimationFrame(function() {
      var inner = overlay.querySelector('.barra-magica-inner');
      var skipEl = document.getElementById('barraSkip');
      var langEl = document.getElementById('barraLangToggle');
      var streakEl = document.getElementById('barraStreak');
      if (inner) inner.classList.add('bm-content-fading');
      if (skipEl) skipEl.classList.add('bm-content-fading');
      if (langEl) langEl.classList.add('bm-content-fading');
      if (streakEl) streakEl.classList.add('bm-content-fading');

      // ── PASO 4: Mostrar el eco DENTRO del overlay ──
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

      // ── PASO 5: Fade-out de la frase del eco ──
      setTimeout(function() {
        phraseEl.classList.add('bm-bocado-fading');
      }, holdEndMs);

      // ── PASO 6: Cleanup eco + restaurar contenido de la barra ──
      setTimeout(function() {
        if (ecoBox.parentNode) ecoBox.parentNode.removeChild(ecoBox);
        var cs = document.getElementById('triggui-eco-anchor-color');
        if (cs && cs.parentNode) cs.parentNode.removeChild(cs);

        // Restaurar contenido de la barra
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

        // 🔥 FIX 3: applyStrings SIEMPRE (refresh question + accent + atmósfera)
        try {
          if (typeof BarraMagica !== 'undefined' && typeof BarraMagica.applyStrings === 'function') {
            BarraMagica.applyStrings();
          }
        } catch (_) {}

        // Reset input
        try {
          var input = document.getElementById('barraInput');
          if (input) {
            input.value = '';
          }
        } catch (_) {}

        // Limpiar clases restoring después de la animación
        setTimeout(function() {
          if (inner) inner.classList.remove('bm-content-restoring');
          if (skipEl) skipEl.classList.remove('bm-content-restoring');
          if (langEl) langEl.classList.remove('bm-content-restoring');
          if (streakEl) streakEl.classList.remove('bm-content-restoring');
        }, 1000);

        // Restore tarjeta transition
        if (tarjeta) tarjeta.style.transition = savedTarjetaTransition;

        ecoActive = false;
        ecoJustEnded = Date.now();
      }, holdEndMs + DISAPPEAR_MS + 100);
    });

    if (typeof console !== 'undefined' && console.log) console.log('[Triggui Eco v5]', '"' + phrase.text + '"', '←', phrase.source);
  }

  // ── HOOK 1: BarraMagica.submit + closeOverlay ──
  function patchBarraMagica() {
    if (typeof BarraMagica === 'undefined') return false;
    if (BarraMagica._bocadoEcoV5Patched) return true;

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
        // PASO 1: Aplicar entry a los bloques ANTES de cerrar overlay
        ensureStyles(); // garantizar que el override CSS esté inyectado
        prepareBlocksForHarmonic();
        void document.body.offsetHeight;

        // PASO 2: Cerrar overlay original
        try { originalCloseOverlay(skipped, skipRender); } catch (e) {}

        // PASO 3: Animar bloques con stagger después de 2 frames
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

    BarraMagica._bocadoEcoV5Patched = true;
    return true;
  }

  // ── HOOK 2: window.closeCard → eco ──
  function patchCloseCard() {
    if (typeof window.closeCard !== 'function') return false;
    if (window._closeCardBocadoEcoV5Patched) return true;

    var originalCloseCard = window.closeCard;
    window.closeCard = function() {
      try {
        showEco();
      } catch (e) {
        try { originalCloseCard.apply(this, arguments); } catch (_) {}
      }
    };

    window._closeCardBocadoEcoV5Patched = true;
    return true;
  }

  // ── HOOK 3: lupa abre la barra → si hay tarjeta, eco; si recién terminó, ignorar ──
  function patchOpenOverlayForLupa() {
    if (typeof BarraMagica === 'undefined') return false;
    if (BarraMagica._lupaBocadoEcoV5Patched) return true;

    if (typeof BarraMagica.openOverlay !== 'function') return false;

    var original = BarraMagica.openOverlay.bind(BarraMagica);
    BarraMagica.openOverlay = function(force) {
      // 🔥 FIX 5: si recién terminó el eco (<500ms), no re-abrir (la lupa hace
      // closeCard + setTimeout(openOverlay, 350) — ese segundo trigger no debe
      // doblar el flow del eco)
      if (Date.now() - ecoJustEnded < 500) return false;

      // Si hay tarjeta visible y eco no está activo, mostrar eco
      var tarjeta = document.getElementById('tarjetaOverlay');
      var tarjetaVisible = tarjeta && tarjeta.classList.contains('visible') && tarjeta.style.display !== 'none';
      if (tarjetaVisible && !ecoActive) {
        try { showEco(); } catch (e) {}
        return true;
      }

      // Si eco está activo, no abrir (el eco ya maneja la apertura)
      if (ecoActive) return false;

      // Caso normal: openOverlay original
      return original(force);
    };

    BarraMagica._lupaBocadoEcoV5Patched = true;
    return true;
  }

  function tryInstall() {
    var ok1 = patchBarraMagica();
    var ok2 = patchCloseCard();
    var ok3 = patchOpenOverlayForLupa();
    if (typeof console !== 'undefined' && console.log) {
      console.log('[Triggui BocadoEco v5] ' +
        (ok1 && ok2 && ok3 ? 'instalado nivel quark — todos los fixes activos' : 'parcial') +
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
