// ═══════════════════════════════════════════════════════════════════════
// 🌒 TRIGGUI QUANTUM ATMOSPHERE — Variedad infinita por apertura
// ═══════════════════════════════════════════════════════════════════════
//
// Filosofía: cada apertura de la barra mágica = universo cromático único
// que jamás existió antes. Sin buckets, sin límites, sin presets.
//
// Lo que regenera en cada apertura:
//   - Estrategia de armonía cromática (8 tipos rotando + freeform random)
//   - Paleta polifónica (3-7 colores, cada uno con S y L propios)
//   - Cantidad de blobs aurora (2-5)
//   - Posición de cada blob (cualquier lugar del viewport)
//   - Tamaño de cada blob (240-460px)
//   - Blur de cada blob (45-95px)
//   - Velocidad de drift de cada blob (16-36s)
//   - Patrón de drift único de cada blob (vectores random)
//   - Cantidad de partículas (6-14)
//   - Posición/tamaño/velocidad/color de cada partícula
//   - Tipos de gradiente del background (radial, linear, conic)
//   - Cantidad de gradientes superpuestos (2-4)
//   - Color del spark indicator
//   - Color del eyebrow text (sutilmente teñido)
//   - Color del accent (input border, glow, palabra "sientes")
//   - Velocidad del breathe del overlay
//
// Hook: monkey-patch a BarraMagica.applyStrings.
// Reversible: borrar este script, comportamiento anterior intacto.
// Cero librerías. Cero red. Cero costo. CSS + JS vanilla.
// ═══════════════════════════════════════════════════════════════════════

(function setupQuantumAtmosphere() {
  'use strict';

  // ── UTILIDADES MATEMÁTICAS ────────────────────────────────────────────
  var rand = function(min, max) { return min + Math.random() * (max - min); };
  var randInt = function(min, max) { return Math.floor(rand(min, max + 1)); };
  var randPick = function(arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  var clamp = function(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); };

  // HSL → CSS string
  var hsl = function(h, s, l) {
    return 'hsl(' + h.toFixed(1) + ', ' + (s * 100).toFixed(0) + '%, ' + (l * 100).toFixed(0) + '%)';
  };
  var hsla = function(h, s, l, a) {
    return 'hsla(' + h.toFixed(1) + ', ' + (s * 100).toFixed(0) + '%, ' + (l * 100).toFixed(0) + '%, ' + a.toFixed(3) + ')';
  };

  // ── PALETA CROMÁTICA — armonía matemática infinita ────────────────────
  function generatePalette() {
    var strategies = [
      'analogous', 'triadic', 'tetradic', 'complementary',
      'split-complementary', 'monochromatic-shifted', 'tetradic-rectangle',
      'freeform'
    ];
    var strategy = randPick(strategies);
    var baseHue = rand(0, 360);
    var hues = [];

    if (strategy === 'analogous') {
      var spread = rand(20, 60);
      hues = [baseHue, (baseHue + spread) % 360, (baseHue - spread + 360) % 360, (baseHue + spread * 2) % 360];
    } else if (strategy === 'triadic') {
      hues = [baseHue, (baseHue + 120 + rand(-15, 15)) % 360, (baseHue + 240 + rand(-15, 15)) % 360];
    } else if (strategy === 'tetradic') {
      hues = [
        baseHue,
        (baseHue + 90 + rand(-12, 12)) % 360,
        (baseHue + 180 + rand(-12, 12)) % 360,
        (baseHue + 270 + rand(-12, 12)) % 360
      ];
    } else if (strategy === 'tetradic-rectangle') {
      var off = rand(40, 80);
      hues = [baseHue, (baseHue + off) % 360, (baseHue + 180) % 360, (baseHue + 180 + off) % 360];
    } else if (strategy === 'complementary') {
      hues = [baseHue, (baseHue + 180 + rand(-12, 12)) % 360, (baseHue + rand(-30, 30) + 360) % 360];
    } else if (strategy === 'split-complementary') {
      hues = [baseHue, (baseHue + 150 + rand(-15, 15)) % 360, (baseHue + 210 + rand(-15, 15)) % 360];
    } else if (strategy === 'monochromatic-shifted') {
      hues = [
        baseHue,
        (baseHue + rand(-18, 18) + 360) % 360,
        (baseHue + rand(-18, 18) + 360) % 360,
        (baseHue + rand(-18, 18) + 360) % 360
      ];
    } else {
      // freeform — caos curado
      var n = randInt(3, 5);
      for (var i = 0; i < n; i++) hues.push(rand(0, 360));
    }

    // Cada color tiene SU PROPIA saturación y lightness
    return {
      strategy: strategy,
      colors: hues.map(function(h) {
        return {
          h: h,
          s: rand(0.55, 1.0),
          l: rand(0.42, 0.66)
        };
      })
    };
  }

  // ── ATMÓSFERA COMPLETA ────────────────────────────────────────────────
  function generateAtmosphere() {
    var palette = generatePalette();
    var colors = palette.colors;

    // Blobs aurora — cantidad y propiedades random
    var blobCount = randInt(2, 5);
    var blobs = [];
    for (var i = 0; i < blobCount; i++) {
      var c = colors[i % colors.length];
      blobs.push({
        top: rand(-25, 85),
        left: rand(-25, 85),
        size: rand(280, 520),
        blur: rand(65, 110),
        opacity: rand(0.20, 0.40),
        color: c,
        speed: rand(14, 34),
        driftX1: rand(-55, 55),
        driftY1: rand(-55, 55),
        driftX2: rand(-55, 55),
        driftY2: rand(-55, 55),
        scaleA: rand(0.85, 1.05),
        scaleB: rand(0.95, 1.18),
        delay: rand(0, 4)
      });
    }

    // Partículas — cantidad random, posición random, color del set
    var particleCount = randInt(6, 14);
    var particles = [];
    for (var j = 0; j < particleCount; j++) {
      var pc = colors[j % colors.length];
      particles.push({
        top: rand(4, 96),
        left: rand(4, 96),
        size: rand(0.8, 2.6),
        opacityHigh: rand(0.4, 0.95),
        speed: rand(10, 24),
        driftX: rand(-7, 7),
        driftY: rand(-7, 7),
        color: pc,
        delay: rand(0, 5)
      });
    }

    // Background base — cantidad y tipos de gradientes random
    var gradLayerCount = randInt(2, 4);
    var bgLayers = [];
    var gTypes = ['radial'];
    for (var k = 0; k < gradLayerCount; k++) {
      var lc = colors[k % colors.length];
      bgLayers.push({
        type: randPick(gTypes),
        x: rand(-10, 110),
        y: rand(-10, 110),
        angle: rand(0, 360),
        spread: rand(35, 90),
        color: hsla(lc.h, lc.s, lc.l, rand(0.06, 0.20))
      });
    }

    return {
      palette: palette,
      blobs: blobs,
      particles: particles,
      bgLayers: bgLayers,
      accentColor: colors[0],
      sparkColor: colors[Math.min(1, colors.length - 1)],
      eyebrowColor: colors[Math.min(2, colors.length - 1)],
      breatheSpeed: rand(5, 14)
    };
  }

  // ── APLICACIÓN AL DOM ─────────────────────────────────────────────────
  var lastStyleEl = null;
  var lastApplyTime = 0;

  function applyAtmosphere() {
    var now = Date.now();
    if (now - lastApplyTime < 1200) return;
    lastApplyTime = now;

    var overlay = document.getElementById('barraMagicaOverlay');
    if (!overlay) return;

    var atm = generateAtmosphere();
    var css = [];

    // ── Background base — gradientes nuevos ─────────────────────────────
    var bgImage = atm.bgLayers.map(function(layer) {
      if (layer.type === 'radial') {
        return 'radial-gradient(ellipse ' + layer.spread.toFixed(0) + '% ' +
               (layer.spread * 0.65).toFixed(0) + '% at ' + layer.x.toFixed(0) + '% ' +
               layer.y.toFixed(0) + '%, ' + layer.color + ' 0%, transparent 80%)';
      } else if (layer.type === 'linear') {
        return 'linear-gradient(' + layer.angle.toFixed(0) + 'deg, ' + layer.color + ' 0%, transparent 70%)';
      } else {
        return 'conic-gradient(from ' + layer.angle.toFixed(0) + 'deg at ' +
               layer.x.toFixed(0) + '% ' + layer.y.toFixed(0) + '%, ' +
               layer.color + ' 0%, transparent 50%)';
      }
    }).join(', ');

    css.push('#barraMagicaOverlay::before {');
    css.push('  background-image: ' + bgImage + ' !important;');
    css.push('  animation-duration: ' + atm.breatheSpeed.toFixed(1) + 's !important;');
    css.push('}');

    // ── Ocultar blobs y partículas originales ───────────────────────────
    css.push('#barraAurora .bm-aurora-blob { display: none !important; }');
    css.push('#barraDust .bm-particle { display: none !important; }');
    css.push('#barraAurora { opacity: 1 !important; }');

    // ── Blobs nuevos — keyframes únicos por blob ────────────────────────
    var styleSuffix = Math.floor(Math.random() * 1000000);
    atm.blobs.forEach(function(blob, i) {
      var animName = 'qa-bdrift-' + styleSuffix + '-' + i;
      css.push('@keyframes ' + animName + ' {');
      css.push('  0%, 100% { transform: translate(0, 0) scale(' + blob.scaleA.toFixed(3) + '); }');
      css.push('  33% { transform: translate(' + blob.driftX1.toFixed(1) + 'px, ' +
               blob.driftY1.toFixed(1) + 'px) scale(' + blob.scaleB.toFixed(3) + '); }');
      css.push('  66% { transform: translate(' + blob.driftX2.toFixed(1) + 'px, ' +
               blob.driftY2.toFixed(1) + 'px) scale(' + blob.scaleA.toFixed(3) + '); }');
      css.push('}');

      css.push('.qa-blob-' + i + ' {');
      css.push('  position: absolute;');
      css.push('  top: ' + blob.top.toFixed(1) + '%;');
      css.push('  left: ' + blob.left.toFixed(1) + '%;');
      css.push('  width: ' + blob.size.toFixed(0) + 'px;');
      css.push('  height: ' + blob.size.toFixed(0) + 'px;');
      css.push('  border-radius: 50%;');
      css.push('  background: ' + hsla(blob.color.h, blob.color.s, blob.color.l, blob.opacity) + ';');
      css.push('  filter: blur(' + blob.blur.toFixed(0) + 'px);');
      css.push('  will-change: transform;');
      css.push('  animation: ' + animName + ' ' + blob.speed.toFixed(1) + 's ease-in-out ' +
               blob.delay.toFixed(2) + 's infinite;');
      css.push('  pointer-events: none;');
      css.push('}');
    });

    // ── Partículas nuevas — cada una única ──────────────────────────────
    atm.particles.forEach(function(p, i) {
      var animName = 'qa-pdrift-' + styleSuffix + '-' + i;
      css.push('@keyframes ' + animName + ' {');
      css.push('  0%, 100% { opacity: ' + (p.opacityHigh * 0.35).toFixed(3) +
               '; transform: translate(0, 0); }');
      css.push('  50% { opacity: ' + p.opacityHigh.toFixed(3) +
               '; transform: translate(' + p.driftX.toFixed(1) + 'px, ' + p.driftY.toFixed(1) + 'px); }');
      css.push('}');

      css.push('.qa-particle-' + i + ' {');
      css.push('  position: absolute;');
      css.push('  top: ' + p.top.toFixed(1) + '%;');
      css.push('  left: ' + p.left.toFixed(1) + '%;');
      css.push('  width: ' + p.size.toFixed(2) + 'px;');
      css.push('  height: ' + p.size.toFixed(2) + 'px;');
      css.push('  background: ' + hsla(p.color.h, clamp(p.color.s * 0.7, 0, 1),
               clamp(p.color.l * 1.4, 0.4, 0.92), p.opacityHigh) + ';');
      css.push('  border-radius: 50%;');
      css.push('  animation: ' + animName + ' ' + p.speed.toFixed(1) + 's ease-in-out ' +
               p.delay.toFixed(2) + 's infinite;');
      css.push('  pointer-events: none;');
      css.push('}');
    });

    // ── Spark indicator color ───────────────────────────────────────────
    var spk = atm.sparkColor;
    css.push('#barraSparkIndicator {');
    css.push('  background: ' + hsl(spk.h, spk.s, clamp(spk.l * 1.5, 0.5, 0.88)) + ' !important;');
    css.push('  box-shadow: 0 0 10px 3px ' + hsla(spk.h, spk.s, spk.l, 0.7) +
             ', 0 0 20px 6px ' + hsla(spk.h, spk.s, spk.l, 0.30) + ' !important;');
    css.push('}');

    // ── Eyebrow text — sutilmente teñido ────────────────────────────────
    var ey = atm.eyebrowColor;
    css.push('#barraEyebrow {');
    css.push('  color: ' + hsla(ey.h, ey.s * 0.5, 0.85, 0.6) + ' !important;');
    css.push('}');

    // ── Inyectar CSS al DOM ─────────────────────────────────────────────
    var styleEl = document.createElement('style');
    styleEl.id = 'quantum-atmosphere-dynamic';
    styleEl.textContent = css.join('\n');

    if (lastStyleEl && lastStyleEl.parentNode) lastStyleEl.parentNode.removeChild(lastStyleEl);
    document.head.appendChild(styleEl);
    lastStyleEl = styleEl;

    // ── Inyectar elementos blob/particle dinámicos ──────────────────────
    var auroraContainer = document.getElementById('barraAurora');
    var dustContainer = document.getElementById('barraDust');

    if (auroraContainer) {
      var oldBlobs = auroraContainer.querySelectorAll('[data-qa-blob]');
      for (var ob = 0; ob < oldBlobs.length; ob++) oldBlobs[ob].parentNode.removeChild(oldBlobs[ob]);
      atm.blobs.forEach(function(_, i) {
        var div = document.createElement('div');
        div.className = 'qa-blob-' + i;
        div.setAttribute('data-qa-blob', '1');
        div.setAttribute('aria-hidden', 'true');
        auroraContainer.appendChild(div);
      });
    }

    if (dustContainer) {
      var oldParts = dustContainer.querySelectorAll('[data-qa-particle]');
      for (var op = 0; op < oldParts.length; op++) oldParts[op].parentNode.removeChild(oldParts[op]);
      atm.particles.forEach(function(_, i) {
        var div = document.createElement('div');
        div.className = 'qa-particle-' + i;
        div.setAttribute('data-qa-particle', '1');
        div.setAttribute('aria-hidden', 'true');
        dustContainer.appendChild(div);
      });
    }

    // ── Variables CSS del accent (input border, glow, "sientes") ────────
    var ac = atm.accentColor;
    overlay.style.setProperty('--bm-accent', hsl(ac.h, ac.s, ac.l));
    overlay.style.setProperty('--bm-accent-40', hsla(ac.h, ac.s, ac.l, 0.40));
    overlay.style.setProperty('--bm-accent-10', hsla(ac.h, ac.s, ac.l, 0.10));
    overlay.style.setProperty('--bm-accent-18', hsla(ac.h, ac.s, ac.l, 0.18));

    // ── BOTÓN GO (#barraSubmit) — gradient del accent + segundo color ───
    // CSS base lo deja en linear-gradient(135deg, #FF5E00, #FF0055) hardcoded.
    // Aquí lo hacemos coherente con el accent (palabra "sientes?").
    var submitBtn = document.getElementById('barraSubmit');
    if (submitBtn) {
      var ac2 = atm.palette.colors[Math.min(1, atm.palette.colors.length - 1)];
      submitBtn.style.background = 'linear-gradient(135deg, ' +
        hsl(ac.h, ac.s, ac.l) + ' 0%, ' +
        hsl(ac2.h, ac2.s, ac2.l) + ' 100%)';
      submitBtn.style.boxShadow =
        '0 6px 18px ' + hsla(ac.h, ac.s, ac.l, 0.40) + ', ' +
        'inset 0 1px 0 rgba(255, 255, 255, 0.25), ' +
        'inset 0 -1px 0 rgba(0, 0, 0, 0.15)';
    }

    // ── Telemetría de debug (consola) ───────────────────────────────────
    if (typeof console !== 'undefined' && console.log) {
      console.log('[Triggui Quantum] atmósfera nueva:',
        'strategy=' + atm.palette.strategy,
        'colors=' + atm.palette.colors.length,
        'blobs=' + atm.blobs.length,
        'particles=' + atm.particles.length,
        'gradients=' + atm.bgLayers.length,
        'baseHue=' + atm.palette.colors[0].h.toFixed(0));
    }
  }

  // ── HOOK: monkey-patch a BarraMagica.applyStrings ─────────────────────
  function install() {
    if (typeof BarraMagica !== 'object' || typeof BarraMagica.applyStrings !== 'function') return false;
    if (BarraMagica._quantumPatched) return true;

    var original = BarraMagica.applyStrings.bind(BarraMagica);
    BarraMagica.applyStrings = function() {
      var ret;
      try { ret = original.apply(BarraMagica, arguments); } catch (e) { console.error('[Triggui Quantum] applyStrings original error:', e); }
      try { applyAtmosphere(); } catch (e) { console.error('[Triggui Quantum] apply error:', e); }
      return ret;
    };
    BarraMagica._quantumPatched = true;

    // Aplicación inicial inmediata (la primera apertura ya tiene atmósfera nueva)
    try { applyAtmosphere(); } catch (e) { console.error('[Triggui Quantum] initial apply error:', e); }

    if (typeof console !== 'undefined' && console.log) console.log('[Triggui Quantum] instalado nivel dios');
    return true;
  }

  // ── Espera que BarraMagica esté listo, retry hasta 50 veces (50ms cada) ─
  function waitFor(predicate, action, attempts) {
    if (predicate()) { action(); return; }
    if (attempts <= 0) { console.warn('[Triggui Quantum] BarraMagica nunca apareció'); return; }
    setTimeout(function() { waitFor(predicate, action, attempts - 1); }, 50);
  }

  waitFor(
    function() { return typeof BarraMagica !== 'undefined' && typeof BarraMagica.applyStrings === 'function'; },
    install,
    50
  );
})();
