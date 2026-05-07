// ═══════════════════════════════════════════════════════════════════════
// 🌒 TRIGGUI BOCADO Y ECO v8 — Ciclo cuántico completo + Suscribete popup
// ═══════════════════════════════════════════════════════════════════════
//
// CAMBIOS v8 sobre v7:
//
// 1. DADO ROTATION (BUG F):
//    Click dado #otro NO abre la barra mágica más. Ahora rota a
//    queryCandidates[1] (segundo libro de la query) con animación armónica
//    de cierre + render + entrada. Después del 2do libro → popup suscribete.
//
// 2. CIERRE CON X (BUG G):
//    La X (card-close-btn) ya NO dispara eco. Ahora cierra tarjeta normal
//    con fade-out 300ms y deja bloques revelados con portada visible.
//    Solo la LUPA de la tarjeta dispara eco. Esto se logra parcheando
//    card-lupa-btn después de que btnShare.onclick construye su HTML
//    (sin tocar window.closeCard que es usado por X y background).
//
// 3. SUSCRIBETE POPUP (NUEVO):
//    Popup nivel dios con paleta gold/coral del landing. $149/mes con link
//    a Stripe. Reutilizable: window.TrigguiSuscribetePopup.show()
//    Aparece cuando usuario hace click dado por 3ra vez (limit 2 rotaciones).
//
// 4. MODALS MODERNIZADOS (NUEVO):
//    Sobrescribe CSS de los popups viejos del index.html (Modal de
//    handleBookReveal, btnLike, intro.t, cele-msg, etc) con paleta
//    gold/coral del landing. Coherencia visual total.
//
// 5. MANTIENE FIXES v7:
//    - Override CSS nuclear (mata animación CSS nativa de bloques)
//    - Sin inline styles en bloques (solo classes)
//    - Cleanup fading distribuido (openOverlay + applyStrings parcheados)
//    - Cleanup inline styles del tarjetaOverlay al final del eco
// ═══════════════════════════════════════════════════════════════════════

(function setupBocadoEcoV8() {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════
  // CONSTANTS
  // ══════════════════════════════════════════════════════════════════════
  var APPEAR_MS = 1500;
  var HOLD_MS = 2000;
  var DISAPPEAR_MS = 1200;
  var WORD_STAGGER_MS = 60;
  var BLOCK_STAGGER_MS = 110;
  var BLOCK_DURATION_MS = 800;
  var BOCADO_DELAY_MS = 100;
  var TOP_K = 5;
  var MAX_QUERY_LIBROS = 2; // rotaciones permitidas antes del popup
  var STRIPE_LINK = 'https://buy.stripe.com/8x2dRb4Zw6YkcuIbzf24003';

  // ══════════════════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════════════════
  var lastCandidatePool = [];
  var usedInThisSession = new Set();
  var bocadoActive = false;
  var ecoActive = false;
  var ecoJustEnded = 0;
  var queryCandidates = [];
  var queryCurrentIdx = 0;
  var rotateActive = false;

  // ══════════════════════════════════════════════════════════════════════
  // UTILITIES
  // ══════════════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════════════
  // STYLES — incluye override de Modal viejo + popup nuevo
  // ══════════════════════════════════════════════════════════════════════
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
      // ── Override CSS nuclear: matar animación nativa de bloques ──
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
      // ── Entrada armónica ──
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
      '}',

      // ══════════════════════════════════════════════════════════════════
      // 🔥 v8: MODERNIZACIÓN MODALS VIEJOS — paleta gold/coral del landing
      // Sustituye el viejo fire-red (#FF0055 #FF5E00 #FFD700) por la
      // paleta del landing (#E8A838 gold, #FF6B4A coral, #FF3F6C accent)
      // ══════════════════════════════════════════════════════════════════
      '@keyframes t-fire {',
      '  0%, 100% { background-position: 0% 50%; }',
      '  50% { background-position: 100% 50%; }',
      '}',
      '.modal-glass {',
      '  background: rgba(20, 24, 38, 0.94) !important;',
      '  border: 1px solid rgba(232, 168, 56, 0.28) !important;',
      '  backdrop-filter: blur(20px) saturate(1.2) !important;',
      '  -webkit-backdrop-filter: blur(20px) saturate(1.2) !important;',
      '  box-shadow: 0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08) !important;',
      '}',
      '.btn-primary {',
      '  background: linear-gradient(135deg, #E8A838 0%, #FF6B4A 100%) !important;',
      '  background-size: 200% 200% !important;',
      '  box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 10px 30px rgba(232, 168, 56, 0.35) !important;',
      '  animation: t-fire 6s ease infinite !important;',
      '}',
      '.btn-secondary {',
      '  background: rgba(245, 240, 232, 0.04) !important;',
      '  color: rgba(245, 240, 232, 0.7) !important;',
      '  border: 1px solid rgba(245, 240, 232, 0.12) !important;',
      '}',
      '.btn-secondary:hover {',
      '  background: rgba(245, 240, 232, 0.08) !important;',
      '  color: rgba(245, 240, 232, 0.95) !important;',
      '}',
      '.m-highlight, .num, .highlight-txt {',
      '  background: linear-gradient(135deg, #E8A838 0%, #FF6B4A 50%, #FF3F6C 100%) !important;',
      '  background-size: 200% 200% !important;',
      '  -webkit-background-clip: text !important;',
      '  background-clip: text !important;',
      '  -webkit-text-fill-color: transparent !important;',
      '  animation: t-fire 6s ease infinite !important;',
      '  text-shadow: none !important;',
      '}',
      '.intro {',
      '  background: rgba(20, 24, 38, 0.94) !important;',
      '  border: 1px solid rgba(232, 168, 56, 0.22) !important;',
      '  backdrop-filter: blur(16px) !important;',
      '  -webkit-backdrop-filter: blur(16px) !important;',
      '}',
      '.intro .t {',
      '  background: linear-gradient(135deg, #E8A838 0%, #FF6B4A 50%, #FF3F6C 100%) !important;',
      '  background-size: 200% 200% !important;',
      '  -webkit-background-clip: text !important;',
      '  background-clip: text !important;',
      '  -webkit-text-fill-color: transparent !important;',
      '  animation: t-fire 6s ease infinite !important;',
      '}',
      '#progressBadge {',
      '  background: rgba(20, 24, 38, 0.94) !important;',
      '  border: 1px solid rgba(232, 168, 56, 0.18) !important;',
      '}',
      '.cele-msg {',
      '  background: rgba(20, 24, 38, 0.94) !important;',
      '  border: 1px solid rgba(232, 168, 56, 0.28) !important;',
      '  backdrop-filter: blur(20px) !important;',
      '  -webkit-backdrop-filter: blur(20px) !important;',
      '}',
      '.m-emoji {',
      '  filter: drop-shadow(0 6px 16px rgba(232, 168, 56, 0.35)) !important;',
      '}',

      // ══════════════════════════════════════════════════════════════════
      // 🆕 v8: SUSCRIBETE POPUP — paleta gold/coral del landing
      // ══════════════════════════════════════════════════════════════════
      '#triggui-suscribete-overlay {',
      '  position: fixed; inset: 0; z-index: 10000;',
      '  background: rgba(11, 15, 26, 0.92);',
      '  backdrop-filter: blur(20px) saturate(1.2);',
      '  -webkit-backdrop-filter: blur(20px) saturate(1.2);',
      '  display: none; align-items: center; justify-content: center;',
      '  padding: 20px;',
      '  opacity: 0;',
      '  transition: opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1);',
      '  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Plus Jakarta Sans", "Archivo", sans-serif;',
      '}',
      '#triggui-suscribete-overlay.visible { display: flex; opacity: 1; }',
      '#triggui-suscribete-card {',
      '  position: relative;',
      '  background: linear-gradient(180deg, rgba(232, 168, 56, 0.06) 0%, rgba(20, 24, 38, 0.85) 60%);',
      '  border: 1px solid rgba(232, 168, 56, 0.32);',
      '  backdrop-filter: blur(16px);',
      '  -webkit-backdrop-filter: blur(16px);',
      '  border-radius: 24px;',
      '  padding: 38px 28px 30px;',
      '  max-width: 380px; width: 100%;',
      '  text-align: center;',
      '  transform: scale(0.94) translateY(20px);',
      '  opacity: 0;',
      '  transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.4s ease;',
      '  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08);',
      '  -webkit-font-smoothing: antialiased;',
      '}',
      '#triggui-suscribete-overlay.visible #triggui-suscribete-card {',
      '  transform: scale(1) translateY(0);',
      '  opacity: 1;',
      '}',
      '.t-suscribete-emoji {',
      '  font-size: 44px; margin-bottom: 14px;',
      '  filter: drop-shadow(0 6px 16px rgba(232, 168, 56, 0.5));',
      '  animation: t-fire 4s ease infinite;',
      '}',
      '.t-suscribete-eyebrow {',
      '  font-size: 10.5px; font-weight: 700;',
      '  letter-spacing: 2.8px; text-transform: uppercase;',
      '  color: rgba(245, 240, 232, 0.4);',
      '  margin-bottom: 10px;',
      '}',
      '.t-suscribete-title {',
      '  font-size: 26px; font-weight: 700;',
      '  line-height: 1.18; letter-spacing: -0.5px;',
      '  color: #F5F0E8; margin-bottom: 14px;',
      '}',
      '.t-suscribete-title-accent {',
      '  background: linear-gradient(135deg, #E8A838 0%, #FF6B4A 50%, #FF3F6C 100%);',
      '  background-size: 200% 200%;',
      '  -webkit-background-clip: text; background-clip: text;',
      '  -webkit-text-fill-color: transparent;',
      '  animation: t-fire 6s ease infinite;',
      '}',
      '.t-suscribete-text {',
      '  font-size: 14.5px; line-height: 1.55;',
      '  color: rgba(245, 240, 232, 0.55);',
      '  margin-bottom: 22px;',
      '}',
      '.t-suscribete-price { margin-bottom: 18px; }',
      '.t-suscribete-price-amount {',
      '  font-size: 42px; font-weight: 800;',
      '  color: #F5F0E8; letter-spacing: -1px; line-height: 1;',
      '}',
      '.t-suscribete-price-period {',
      '  font-size: 13px; color: rgba(245, 240, 232, 0.4); margin-left: 4px;',
      '}',
      '.t-suscribete-features {',
      '  list-style: none; padding: 0; margin: 0 0 24px 0;',
      '}',
      '.t-suscribete-feature {',
      '  font-size: 13.5px; color: rgba(245, 240, 232, 0.7);',
      '  padding: 5px 0; display: flex; align-items: center; justify-content: center; gap: 8px;',
      '}',
      '.t-suscribete-feature::before {',
      '  content: "✓"; color: #E8A838; font-weight: 700; font-size: 14px;',
      '}',
      '.t-suscribete-cta {',
      '  display: block; width: 100%;',
      '  padding: 16px; margin-bottom: 12px;',
      '  background: linear-gradient(135deg, #E8A838 0%, #FF6B4A 100%);',
      '  background-size: 200% 200%;',
      '  border: none; border-radius: 14px;',
      '  color: white; font-family: inherit;',
      '  font-weight: 700; font-size: 15px;',
      '  letter-spacing: 0.3px; text-transform: uppercase;',
      '  text-decoration: none; text-align: center;',
      '  cursor: pointer;',
      '  box-shadow: 0 10px 30px rgba(232, 168, 56, 0.35);',
      '  animation: t-fire 4s infinite;',
      '  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);',
      '}',
      '.t-suscribete-cta:hover {',
      '  transform: scale(1.03);',
      '  filter: brightness(1.1);',
      '  box-shadow: 0 14px 38px rgba(232, 168, 56, 0.5);',
      '}',
      '.t-suscribete-cta:active { transform: scale(0.97); }',
      '.t-suscribete-secondary {',
      '  background: none; border: none;',
      '  font-family: inherit; font-size: 13px;',
      '  color: rgba(245, 240, 232, 0.4);',
      '  cursor: pointer; padding: 10px 16px;',
      '  transition: color 0.3s ease;',
      '}',
      '.t-suscribete-secondary:hover { color: rgba(245, 240, 232, 0.85); }',
      '.t-suscribete-close {',
      '  position: absolute; top: 14px; right: 14px;',
      '  width: 30px; height: 30px;',
      '  border-radius: 50%;',
      '  background: rgba(245, 240, 232, 0.06);',
      '  border: 1px solid rgba(245, 240, 232, 0.12);',
      '  color: rgba(245, 240, 232, 0.7);',
      '  cursor: pointer;',
      '  display: flex; align-items: center; justify-content: center;',
      '  font-size: 16px; line-height: 1;',
      '  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);',
      '  font-family: inherit;',
      '}',
      '.t-suscribete-close:hover {',
      '  background: rgba(245, 240, 232, 0.12);',
      '  color: #F5F0E8;',
      '  transform: scale(1.05);',
      '}',
      '.t-suscribete-footnote {',
      '  font-size: 11px; color: rgba(245, 240, 232, 0.28);',
      '  margin-top: 8px;',
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }

  // ══════════════════════════════════════════════════════════════════════
  // CLEANUP fading
  // ══════════════════════════════════════════════════════════════════════
  function cleanupContentFading() {
    var overlay = document.getElementById('barraMagicaOverlay');
    if (!overlay) return;
    var inner = overlay.querySelector('.barra-magica-inner');
    var skipEl = document.getElementById('barraSkip');
    var langEl = document.getElementById('barraLangToggle');
    var streakEl = document.getElementById('barraStreak');
    if (inner) inner.classList.remove('bm-content-fading');
    if (skipEl) skipEl.classList.remove('bm-content-fading');
    if (langEl) langEl.classList.remove('bm-content-fading');
    if (streakEl) streakEl.classList.remove('bm-content-fading');
  }

  // ══════════════════════════════════════════════════════════════════════
  // BOCADO
  // ══════════════════════════════════════════════════════════════════════
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

    // No quitar fading aquí — cleanupContentFading lo limpia desde
    // openOverlay/applyStrings cuando el overlay se reabre.
    setTimeout(function() {
      if (bocadoBox.parentNode) bocadoBox.parentNode.removeChild(bocadoBox);
      var cs = document.getElementById('triggui-bocado-anchor-color');
      if (cs && cs.parentNode) cs.parentNode.removeChild(cs);
      bocadoActive = false;
    }, holdEndMs + DISAPPEAR_MS + 100);

    if (typeof console !== 'undefined' && console.log) console.log('[Triggui Bocado v8]', '"' + phrase.text + '"', '←', phrase.source);
  }

  // ══════════════════════════════════════════════════════════════════════
  // BLOCKS HARMONIC ANIMATION
  // ══════════════════════════════════════════════════════════════════════
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
      block.style.transitionDelay = (i * BLOCK_STAGGER_MS) + 'ms';
    });

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

  // ══════════════════════════════════════════════════════════════════════
  // ECO
  // ══════════════════════════════════════════════════════════════════════
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
    if (tarjeta) {
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
      if (tarjeta) {
        tarjeta.style.transition = '';
        tarjeta.style.opacity = '';
        tarjeta.style.display = '';
      }
      return;
    }

    document.documentElement.classList.add('mood-active');
    document.documentElement.classList.remove('booting');
    document.body.classList.remove('booting');

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

        // Limpiar inline styles del tarjetaOverlay (BUG E v7)
        if (tarjeta) {
          tarjeta.style.transition = '';
          tarjeta.style.opacity = '';
          tarjeta.style.display = '';
          tarjeta.classList.remove('visible');
        }

        ecoActive = false;
        ecoJustEnded = Date.now();
      }, holdEndMs + DISAPPEAR_MS + 100);
    });

    if (typeof console !== 'undefined' && console.log) console.log('[Triggui Eco v8]', '"' + phrase.text + '"', '←', phrase.source);
  }

  // ══════════════════════════════════════════════════════════════════════
  // 🔥 v8: SUSCRIBETE POPUP — paleta gold/coral del landing
  // ══════════════════════════════════════════════════════════════════════
  function ensureSuscribetePopup() {
    if (document.getElementById('triggui-suscribete-overlay')) return;
    ensureStyles();

    var overlay = document.createElement('div');
    overlay.id = 'triggui-suscribete-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 't-suscribete-title');

    var card = document.createElement('div');
    card.id = 'triggui-suscribete-card';
    card.innerHTML = [
      '<button class="t-suscribete-close" type="button" aria-label="Cerrar">×</button>',
      '<div class="t-suscribete-emoji">📚</div>',
      '<div class="t-suscribete-eyebrow">Cada lunes y un día más</div>',
      '<h2 id="t-suscribete-title" class="t-suscribete-title">El libro <span class="t-suscribete-title-accent">te encuentra</span></h2>',
      '<p class="t-suscribete-text">Una idea de un gran libro en tu WhatsApp. 30 segundos. Sin buscar. Si no es tu momento, ahí se queda esperando.</p>',
      '<div class="t-suscribete-price">',
      '  <span class="t-suscribete-price-amount">$149</span>',
      '  <span class="t-suscribete-price-period">/mes · MXN</span>',
      '</div>',
      '<ul class="t-suscribete-features">',
      '  <li class="t-suscribete-feature">2 mensajes por semana</li>',
      '  <li class="t-suscribete-feature">30 segundos. Directo a WhatsApp.</li>',
      '  <li class="t-suscribete-feature">App incluida gratis</li>',
      '  <li class="t-suscribete-feature">Cancela cuando quieras</li>',
      '</ul>',
      '<a href="' + STRIPE_LINK + '" target="_blank" rel="noopener noreferrer" class="t-suscribete-cta">Que el libro me encuentre</a>',
      '<button class="t-suscribete-secondary" type="button">Seguir explorando</button>',
      '<p class="t-suscribete-footnote">Si no puedes leerlo ahora, ahí se queda esperando.</p>'
    ].join('\n');

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Wire close handlers
    var closeFn = function() { hideSuscribetePopup(); };
    var closeBtn = card.querySelector('.t-suscribete-close');
    var secondaryBtn = card.querySelector('.t-suscribete-secondary');
    var ctaBtn = card.querySelector('.t-suscribete-cta');

    if (closeBtn) closeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeFn();
      try { if (typeof gtag !== 'undefined') gtag('event', 'suscribete_popup_dismissed', { event_category: 'conversion', method: 'close_x' }); } catch (_) {}
    });
    if (secondaryBtn) secondaryBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      closeFn();
      try { if (typeof gtag !== 'undefined') gtag('event', 'suscribete_popup_dismissed', { event_category: 'conversion', method: 'seguir_explorando' }); } catch (_) {}
    });
    if (ctaBtn) ctaBtn.addEventListener('click', function() {
      try { if (typeof gtag !== 'undefined') gtag('event', 'suscribete_popup_clicked', { event_category: 'conversion', method: 'cta' }); } catch (_) {}
    });

    // Click background → cerrar (no en card mismo)
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeFn();
    });
  }

  function showSuscribetePopup(reason) {
    ensureSuscribetePopup();
    var overlay = document.getElementById('triggui-suscribete-overlay');
    if (!overlay) return;

    overlay.style.display = 'flex';
    void overlay.offsetWidth; // reflow
    overlay.classList.add('visible');

    try {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'suscribete_popup_shown', {
          event_category: 'conversion',
          reason: reason || 'unknown'
        });
      }
    } catch (_) {}

    if (typeof console !== 'undefined' && console.log) console.log('[Triggui SuscribetePopup v8] visible —', reason || 'unknown');
  }

  function hideSuscribetePopup() {
    var overlay = document.getElementById('triggui-suscribete-overlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    setTimeout(function() {
      if (!overlay.classList.contains('visible')) overlay.style.display = 'none';
    }, 450);
    if (typeof console !== 'undefined' && console.log) console.log('[Triggui SuscribetePopup v8] cerrado');
  }

  // Expose globalmente para futuros triggers
  window.TrigguiSuscribetePopup = {
    show: showSuscribetePopup,
    hide: hideSuscribetePopup
  };

  // ══════════════════════════════════════════════════════════════════════
  // 🔥 v8: ROTATE BOOK FROM QUERY (DADO 🎲)
  // ══════════════════════════════════════════════════════════════════════
  function rotateToNextBookFromQuery() {
    if (rotateActive) return;

    queryCurrentIdx++;

    // Después de MAX_QUERY_LIBROS rotaciones → popup
    if (queryCurrentIdx >= MAX_QUERY_LIBROS || queryCurrentIdx >= queryCandidates.length) {
      // Rollback el idx para que próximo click siga mostrando popup
      queryCurrentIdx--;
      if (typeof console !== 'undefined' && console.log) console.log('[Triggui Dado v8] límite alcanzado idx=' + queryCurrentIdx + ' candidates=' + queryCandidates.length + ' → popup');
      showSuscribetePopup('dado_limit');
      return;
    }

    var nextLibro = queryCandidates[queryCurrentIdx];
    if (!nextLibro) {
      queryCurrentIdx--;
      showSuscribetePopup('dado_no_libro');
      return;
    }

    // Asignar nuevo libro al global del script (libro es let top-level
    // del js-app-logic, accesible desde aquí porque comparten lexical scope)
    try {
      libro = nextLibro;
    } catch (e) {
      // libro no accesible (edge case)
      try { window.__trigguiCurrentLibro = nextLibro; } catch (_) {}
      if (typeof console !== 'undefined' && console.warn) console.warn('[Triggui Dado v8] libro no accesible directamente:', e);
    }

    rotateActive = true;
    if (typeof console !== 'undefined' && console.log) console.log('[Triggui Dado v8] rotate idx → ' + queryCurrentIdx + ' libro: "' + (nextLibro.titulo || 'unknown') + '"');

    // Animación de cierre + re-render + entrada armónica
    var grid = document.getElementById('grid');
    var cta = document.getElementById('cta');

    // Fade out actual con transición suave
    if (grid) {
      grid.style.transition = 'opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)';
      grid.style.opacity = '0';
    }
    if (cta) {
      cta.style.transition = 'opacity 280ms cubic-bezier(0.4, 0, 0.2, 1)';
      cta.style.opacity = '0';
    }

    setTimeout(function() {
      // Re-render con nuevo libro
      try {
        if (typeof render === 'function') {
          render();
        } else if (window.render) {
          window.render();
        }
      } catch (e) {
        if (typeof console !== 'undefined' && console.error) console.error('[Triggui Dado v8] render error:', e);
      }

      // Aplicar entry INMEDIATAMENTE a los nuevos bloques (antes del paint)
      var blocks = document.querySelectorAll('#grid .block, .grid .block');
      blocks.forEach(function(block) {
        block.classList.add('bm-harmonic-entry');
      });

      // Restore opacity del grid (los bloques siguen invisibles por entry class)
      if (grid) {
        grid.style.opacity = '';
        grid.style.transition = '';
      }
      if (cta) {
        cta.style.opacity = '';
        cta.style.transition = '';
      }

      void document.body.offsetHeight;

      // Entrada armónica
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          revealBlocksHarmonic();
        });
      });

      // Liberar lock
      var totalDuration = (4 - 1) * BLOCK_STAGGER_MS + BLOCK_DURATION_MS + 300;
      setTimeout(function() {
        rotateActive = false;
      }, totalDuration);
    }, 300);
  }

  // ══════════════════════════════════════════════════════════════════════
  // PATCHES
  // ══════════════════════════════════════════════════════════════════════

  // Parchear BarraMagica.submit, closeOverlay, applyStrings, openOverlay
  function patchBarraMagica() {
    if (typeof BarraMagica === 'undefined') return false;
    if (BarraMagica._bocadoEcoV8Patched) return true;

    var originalSubmit = BarraMagica.submit.bind(BarraMagica);
    BarraMagica.submit = function(query) {
      try {
        var data = window.__TRIGGUI_DATA__;
        if (data && Array.isArray(data.libros) && data.libros.length > 0) {
          // Pool de frases para bocado/eco
          lastCandidatePool = buildPhrasePool(data.libros, query || '');
          usedInThisSession.clear();

          // 🔥 v8: Reconstruir queryCandidates para el dado.
          // queryCandidates[0] = libro elegido por filter() (lo mismo que se mostrará).
          // queryCandidates[1+] = top-K excluyendo el primero.
          queryCandidates = [];
          queryCurrentIdx = 0;
          rotateActive = false;

          try {
            var firstResult = TrigguiFiltro.filter(data.libros, query || '');
            if (firstResult && firstResult.libro) {
              queryCandidates.push(firstResult.libro);
            }
          } catch (_) {}

          var topK = getTopKCandidates(data.libros, query || '', TOP_K + 2);
          for (var i = 0; i < topK.length; i++) {
            if (queryCandidates.length >= TOP_K + 1) break;
            var alreadyIn = queryCandidates.some(function(b) {
              return b && topK[i] && b.titulo === topK[i].titulo;
            });
            if (!alreadyIn) queryCandidates.push(topK[i]);
          }

          if (typeof console !== 'undefined' && console.log) {
            console.log('[Triggui v8] queryCandidates construidos:', queryCandidates.length, 'libros');
          }
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

    // Parchear applyStrings: limpia fading antes de aplicar (con guardas)
    var originalApplyStrings = BarraMagica.applyStrings.bind(BarraMagica);
    BarraMagica.applyStrings = function() {
      if (!bocadoActive && !ecoActive) {
        cleanupContentFading();
      }
      return originalApplyStrings.apply(this, arguments);
    };

    BarraMagica._bocadoEcoV8Patched = true;
    return true;
  }

  // Parchear openOverlay: detecta tarjeta visible, eco rebound, cleanup fading
  function patchOpenOverlay() {
    if (typeof BarraMagica === 'undefined') return false;
    if (BarraMagica._lupaBocadoEcoV8Patched) return true;
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

      cleanupContentFading();
      return original(force);
    };

    BarraMagica._lupaBocadoEcoV8Patched = true;
    return true;
  }

  // 🔥 v8: NO parchear window.closeCard. La X usa el original (cierra normal).
  // En su lugar, parcheamos la lupa de la tarjeta (card-lupa-btn) cuando
  // btnShare.onclick construye su HTML.
  function patchBtnShareForLupa() {
    var btnShare = document.getElementById('share');
    if (!btnShare) return false;
    if (btnShare._patchedByMeForLupa) return true;

    var originalOnclick = btnShare.onclick;
    btnShare.onclick = function() {
      var ret = originalOnclick ? originalOnclick.apply(this, arguments) : undefined;
      // Después de que el HTML se construye, parchear card-lupa-btn
      setTimeout(patchCardLupaButton, 0);
      return ret;
    };
    btnShare._patchedByMeForLupa = true;
    return true;
  }

  function patchCardLupaButton() {
    var lupaBtn = document.querySelector('.card-lupa-btn');
    if (!lupaBtn || lupaBtn._patchedByMeForLupa) return;
    lupaBtn._patchedByMeForLupa = true;

    // Eliminar onclick inline (que llamaba closeCard + setTimeout(openOverlay))
    lupaBtn.removeAttribute('onclick');
    // Agregar handler que dispara eco directamente
    lupaBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      try { showEco(); } catch (_) {}
    });
  }

  // Parchear btnOtro (dado 🎲) → rotateToNextBookFromQuery
  function patchBtnOtro() {
    var btn = document.getElementById('otro');
    if (!btn) return false;
    if (btn._patchedByMeForRotate) return true;

    btn.onclick = function(e) {
      if (e) e.stopPropagation && e.stopPropagation();
      rotateToNextBookFromQuery();
    };
    btn._patchedByMeForRotate = true;
    return true;
  }

  // ══════════════════════════════════════════════════════════════════════
  // INSTALL
  // ══════════════════════════════════════════════════════════════════════
  function tryInstall() {
    var ok1 = patchBarraMagica();
    var ok2 = patchOpenOverlay();
    var ok3 = patchBtnShareForLupa();
    var ok4 = patchBtnOtro();

    // Pre-crear el popup (lazy)
    try { ensureSuscribetePopup(); } catch (_) {}

    if (typeof console !== 'undefined' && console.log) {
      console.log('[Triggui BocadoEco v8] ' +
        (ok1 && ok2 && ok3 && ok4 ? 'instalado nivel dios — fixes F G activos + popup' : 'parcial') +
        ' submit/close/applyStrings=' + ok1 + ' openOverlay=' + ok2 + ' lupaCard=' + ok3 + ' dado=' + ok4);
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
             typeof BarraMagica.applyStrings === 'function' &&
             typeof window.closeCard === 'function' &&
             document.getElementById('share') &&
             document.getElementById('otro');
    },
    tryInstall,
    100
  );
})();
